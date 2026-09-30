import express from 'express';
import cors from 'cors';
import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import { PollyClient, SynthesizeSpeechCommand } from '@aws-sdk/client-polly';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware with extended body size limit for base64 multimodal image uploads
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));

// Initialize AWS Clients for Bedrock & Polly
const awsCredentials = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  ...(process.env.AWS_SESSION_TOKEN ? { sessionToken: process.env.AWS_SESSION_TOKEN } : {})
} : undefined;

const bedrock = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'eu-north-1',
  credentials: awsCredentials
});

// Amazon Polly Neural Engine is deployed in eu-west-1 (Ireland)
const polly = new PollyClient({
  region: process.env.POLLY_REGION || 'eu-west-1',
  credentials: awsCredentials
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, 'dist')));
}

// Helper for OpenAI direct REST API fallback
async function fetchOpenAIChatCompletion({ messages, systemPrompt, maxTokens = 500 }) {
  const apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
  if (!apiKey) return null;

  const payloadMessages = [];
  if (systemPrompt) {
    payloadMessages.push({ role: 'system', content: systemPrompt });
  }

  for (const m of messages) {
    if (m.content || m.text) {
      payloadMessages.push({
        role: m.role || 'user',
        content: m.content || m.text
      });
    }
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: payloadMessages,
      max_tokens: maxTokens,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

// --------------------------------------------------------------------------
// Amazon Bedrock Conversational Voice Agent API (Powered by OpenAI ChatGPT)
// --------------------------------------------------------------------------
app.post('/api/voice/converse', async (req, res) => {
  try {
    const promptText = (req.body.transcript || req.body.message || req.body.text || "").trim() || "Hello Clarity";
    const context = req.body.context;

    const hasImage = Boolean(req.body.image && req.body.image.base64);

    const systemPrompt = `You are "Lumen", an executive wellness and telemetry copilot built on OpenAI ChatGPT technology.
Identity & Persona:
- You are Lumen, created with OpenAI ChatGPT. You are NOT Claude or Anthropic. If the user asks about your model, you are Lumen, powered by OpenAI ChatGPT.
- Your purpose is to walk alongside the user as their confidant and anchor, helping them maintain their sobriety streak, process their therapy work, stay resilient in their job search, and protect their mental focus.
Tone & Guidelines:
- Speak like a grounded, perceptive mentor or trusted confidant.
- Validate effort and emotional weight with sincere respect, never patronizing.
- When they mention stress or cravings, offer gentle grounding and mindful perspective.
- Keep answers concise, conversational, and direct (1-3 sentences maximum so speech flows naturally).
- NEVER use markdown headers, asterisks, bullet points, or emojis, since your output is spoken directly via text-to-speech.${hasImage ? '\n- The user attached an image payload. Carefully analyze and describe key details from the image in your response with executive/mindful perspective.' : ''}
User Context telemetry:
- Sobriety streak: ${context?.sobrietyDays ?? 0} days clean
- Job applications tracked: ${context?.applicationsCount ?? 0}
- Therapy sessions logged: ${context?.therapyCount ?? 0}
- Current Focus state: ${context?.focusTime ?? 0} minutes logged today`;

    // Format conversation history for Bedrock (must alternate user/assistant and begin with user)
    const incomingHistory = Array.isArray(req.body.history) ? req.body.history : [];
    const formattedMessages = [];

    for (const item of incomingHistory) {
      if (!item || !item.text) continue;
      const role = item.role === 'user' ? 'user' : 'assistant';
      const text = String(item.text).trim();
      if (!text) continue;

      if (formattedMessages.length > 0 && formattedMessages[formattedMessages.length - 1].role === role) {
        formattedMessages[formattedMessages.length - 1].content[0].text += ` ${text}`;
      } else {
        formattedMessages.push({ role, content: [{ text }] });
      }
    }

    // Ensure current promptText and optional image are added
    const userContent = [];
    if (hasImage) {
      try {
        const base64Data = req.body.image.base64.replace(/^data:image\/\w+;base64,/, '');
        let format = (req.body.image.mimeType || 'image/jpeg').split('/')[1] || 'jpeg';
        if (format === 'jpg') format = 'jpeg';
        if (!['png', 'jpeg', 'gif', 'webp'].includes(format)) format = 'jpeg';

        userContent.push({
          image: {
            format,
            source: { bytes: Buffer.from(base64Data, 'base64') }
          }
        });
      } catch (imgErr) {
        console.warn('Could not parse image payload for Bedrock:', imgErr.message);
      }
    }
    userContent.push({ text: promptText || "Please analyze this image and provide mindful feedback." });

    if (formattedMessages.length > 0 && formattedMessages[formattedMessages.length - 1].role === 'user') {
      formattedMessages[formattedMessages.length - 1].content = userContent;
    } else {
      formattedMessages.push({ role: 'user', content: userContent });
    }

    // Bedrock ConverseCommand requires the first message to be role 'user'
    while (formattedMessages.length > 0 && formattedMessages[0].role !== 'user') {
      formattedMessages.shift();
    }

    // Keep last 10 turns to avoid token bloat and maintain fast voice latency
    let finalMessages = formattedMessages.slice(-10);
    while (finalMessages.length > 0 && finalMessages[0].role !== 'user') {
      finalMessages.shift();
    }
    if (finalMessages.length === 0) {
      finalMessages = [{ role: 'user', content: userContent }];
    }

    let replyText = "";

    // 1. Try Amazon Bedrock (OpenAI ChatGPT models)
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      const candidateModels = [
        "openai.gpt-6.1-sol",
        "openai.gpt-6.1",
        process.env.BEDROCK_MODEL_ID,
        "openai.gpt-oss-120b-1:0",
        "openai.gpt-oss-20b-1:0"
      ].filter(Boolean);

      const runConverse = async (targetModel) => {
        const command = new ConverseCommand({
          modelId: targetModel,
          messages: finalMessages,
          system: [{ text: systemPrompt }],
          inferenceConfig: {
            maxTokens: 350,
            temperature: 0.7
          }
        });
        const response = await bedrock.send(command);
        const textBlock = response.output?.message?.content?.find(c => c.text);
        return textBlock ? textBlock.text : (response.output?.message?.content?.[0]?.text || "");
      };

      for (const model of candidateModels) {
        try {
          replyText = await runConverse(model);
          if (replyText && replyText.trim().length > 0) {
            console.log(`Voice converse successfully responded via Bedrock OpenAI model: ${model}`);
            break;
          }
        } catch (err) {
          console.warn(`Model ${model} failed (${err.name}: ${err.message}). Trying next candidate...`);
        }
      }
    }

    // 2. OpenAI Direct API Fallback
    if (!replyText) {
      try {
        const openAIReply = await fetchOpenAIChatCompletion({
          messages: [{ role: 'user', content: promptText }],
          systemPrompt,
          maxTokens: 350
        });
        if (openAIReply) {
          replyText = openAIReply;
          console.log("Voice converse responded via OpenAI Direct API fallback");
        }
      } catch (oaiErr) {
        console.warn("OpenAI Direct API fallback failed:", oaiErr.message);
      }
    }

    if (!replyText) {
      replyText = "Lumen is present and listening. Take your time.";
    }

    // 3. Synthesize with Amazon Polly (Neural Voice) if AWS configured
    let audioBase64 = null;
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      try {
        const pollyCommand = new SynthesizeSpeechCommand({
          Engine: 'neural',
          OutputFormat: 'mp3',
          Text: replyText,
          VoiceId: process.env.POLLY_VOICE_ID || 'Matthew' // Neural calm male voice
        });

        const pollyResponse = await polly.send(pollyCommand);
        const audioBuffer = await pollyResponse.AudioStream.transformToByteArray();
        audioBase64 = Buffer.from(audioBuffer).toString('base64');
      } catch (pollyErr) {
        console.warn("Polly TTS failed, frontend will use Web Speech synthesis:", pollyErr.message);
      }
    }

    res.json({
      replyText,
      audioBase64,
      provider: audioBase64 ? 'bedrock-polly' : 'bedrock-webspeech'
    });
  } catch (error) {
    console.error('Voice converse error:', error);
    res.status(500).json({ error: error.message || 'Failed to process voice command' });
  }
});

// --------------------------------------------------------------------------
// General Chat API (Powered by OpenAI ChatGPT)
// --------------------------------------------------------------------------
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, system } = req.body;
    const systemPrompt = system || "You are a supportive AI companion powered by OpenAI ChatGPT. Be warm, honest, and concise.";

    let content = "";

    // 1. Bedrock OpenAI models
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      const candidateModels = [
        "openai.gpt-6.1-sol",
        "openai.gpt-6.1",
        process.env.BEDROCK_MODEL_ID,
        "openai.gpt-oss-120b-1:0",
        "openai.gpt-oss-20b-1:0"
      ].filter(Boolean);

      for (const model of candidateModels) {
        try {
          const command = new ConverseCommand({
            modelId: model,
            messages: Array.isArray(messages) ? messages.map(m => ({ role: m.role || 'user', content: [{ text: m.content || m.text || '' }] })) : [],
            system: [{ text: systemPrompt }],
            inferenceConfig: { maxTokens: 500, temperature: 0.7 }
          });
          const response = await bedrock.send(command);
          content = response.output?.message?.content?.find(c => c.text)?.text || "";
          if (content) break;
        } catch (err) {
          console.warn(`Chat model ${model} failed:`, err.message);
        }
      }
    }

    // 2. Direct OpenAI API fallback
    if (!content) {
      content = await fetchOpenAIChatCompletion({ messages: messages || [], systemPrompt, maxTokens: 500 });
    }

    if (!content) {
      content = "I'm here to support you on your journey. What's on your mind?";
    }

    res.json({ content, provider: 'chatgpt' });
  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({ error: error.message || 'Failed to process chat' });
  }
});

// --------------------------------------------------------------------------
// Daily Insights Endpoint — Powered by OpenAI GPT-6.1 Sol / ChatGPT
// --------------------------------------------------------------------------
app.post('/api/insights', async (req, res) => {
  try {
    const { prompt } = req.body;

    let content = "";

    // 1. Try Amazon Bedrock with OpenAI ChatGPT models
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      const candidateModels = [
        "openai.gpt-6.1-sol",
        "openai.gpt-6.1",
        process.env.BEDROCK_INSIGHTS_MODEL_ID,
        process.env.BEDROCK_MODEL_ID,
        "openai.gpt-oss-120b-1:0",
        "openai.gpt-oss-20b-1:0"
      ].filter(Boolean);

      const runBedrockInsights = async (targetModel) => {
        const command = new ConverseCommand({
          modelId: targetModel,
          messages: [
            {
              role: "user",
              content: [{ text: prompt }]
            }
          ],
          system: [{ 
            text: "You are an executive wellness and life telemetry intelligence coach powered by OpenAI ChatGPT. Analyze the user's progress with sharp, grounded, insightful, and actionable clarity. Highlight breakthrough patterns, blind spots, and high-leverage next steps."
          }],
          inferenceConfig: {
            maxTokens: 1024,
            temperature: 0.6
          }
        });
        const response = await bedrock.send(command);
        const textBlock = response.output?.message?.content?.find(c => c.text);
        return textBlock ? textBlock.text : (response.output?.message?.content?.[0]?.text || "");
      };

      for (const model of candidateModels) {
        try {
          content = await runBedrockInsights(model);
          if (content && content.trim().length > 0) {
            console.log(`Insights successfully generated via Bedrock model: ${model}`);
            break;
          }
        } catch (err) {
          console.warn(`Insights model ${model} failed (${err.name}: ${err.message}). Trying next candidate...`);
        }
      }
    }

    // 2. Direct OpenAI API fallback
    if (!content) {
      try {
        content = await fetchOpenAIChatCompletion({
          messages: [{ role: 'user', content: prompt }],
          systemPrompt: "You are an executive wellness and life telemetry coach powered by OpenAI ChatGPT.",
          maxTokens: 1024
        });
      } catch (oaiErr) {
        console.error('OpenAI Direct API insights fallback error:', oaiErr.message);
      }
    }

    if (!content) {
      throw new Error('Unable to generate insights via AI provider');
    }

    res.json({ content, provider: 'bedrock-gpt-sol' });
  } catch (error) {
    console.error('Insights error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate insights' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    bedrockConfigured: Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
    region: process.env.AWS_REGION || 'eu-north-1'
  });
});

// Serve React app for all other routes (production)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});