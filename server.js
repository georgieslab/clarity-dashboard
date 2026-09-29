import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
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

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Anthropic fallback
const anthropic = new Anthropic({
  apiKey: process.env.VITE_ANTHROPIC_API_KEY
});

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

// --------------------------------------------------------------------------
// Amazon Bedrock Conversational Voice Agent API
// --------------------------------------------------------------------------
app.post('/api/voice/converse', async (req, res) => {
  try {
    const { transcript, context } = req.body;

    const systemPrompt = `You are "Clarity Voice", an ultra-attentive executive wellness and telemetry assistant designed with Apple Human Interface warmth and precision.
Keep answers concise, conversational, and direct (1-3 sentences maximum so speech flows naturally).
Do NOT use markdown headers, asterisks, bullet points, or emojis, since your output is spoken directly via text-to-speech.
User Context telemetry:
- Sobriety streak: ${context?.sobrietyDays ?? 0} days clean
- Job applications tracked: ${context?.applicationsCount ?? 0}
- Therapy sessions logged: ${context?.therapyCount ?? 0}
- Current Focus state: ${context?.focusTime ?? 0} minutes logged today`;

    let replyText = "";

    // 1. Try Amazon Bedrock (Claude 3.5 Sonnet / Haiku on Bedrock)
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      try {
        const modelId = process.env.BEDROCK_MODEL_ID || "eu.anthropic.claude-haiku-4-5-20251001-v1:0";
        
        const command = new ConverseCommand({
          modelId: modelId,
          messages: [
            {
              role: "user",
              content: [{ text: transcript }]
            }
          ],
          system: [{ text: systemPrompt }],
          inferenceConfig: {
            maxTokens: 300,
            temperature: 0.7
          }
        });

        const bedrockResponse = await bedrock.send(command);
        replyText = bedrockResponse.output.message.content[0].text;
      } catch (bedrockErr) {
        console.error("Bedrock converse failed:", bedrockErr);
        replyText = "I am ready and listening. How can I assist with your executive telemetry today?";
      }
    }

    if (!replyText) {
      replyText = "Clarity Voice online. Ready for your instructions.";
    }

    // 2. Synthesize with Amazon Polly (Neural Voice) if AWS configured
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

// Daily insights endpoint
app.post('/api/insights', async (req, res) => {
  try {
    const { prompt } = req.body;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    });

    res.json({ content: message.content[0].text });
  } catch (error) {
    console.error('Insights error:', error);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    bedrockConfigured: Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
    region: process.env.AWS_REGION || 'us-east-1'
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