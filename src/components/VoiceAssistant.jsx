import { useState, useEffect, useRef } from 'react';
import { storage } from '../utils/storage';

export default function VoiceAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastReply, setLastReply] = useState('Tap the Siri orb or speak to converse with Clarity.');
  const [providerBadge, setProviderBadge] = useState('Amazon Bedrock');

  const recognitionRef = useRef(null);
  const currentAudioRef = useRef(null);

  // Initialize Speech Recognition (Web Speech API)
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let currentText = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentText += event.results[i][0].transcript;
        }
        setTranscript(currentText);
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Fetch telemetry context to pass to Bedrock
  const getTelemetryContext = async () => {
    const sobriety = await storage.get('sobriety') || {};
    const applications = await storage.get('applications') || [];
    const therapy = await storage.get('therapy') || [];
    const pomodoroHistory = await storage.get('pomodoroHistory') || [];

    let sobrietyDays = 0;
    if (sobriety.startDate) {
      const start = new Date(sobriety.startDate);
      const today = new Date();
      sobrietyDays = Math.floor((today - start) / (1000 * 60 * 60 * 24));
    }

    const today = new Date().toDateString();
    const todayPomodoro = pomodoroHistory.filter(p => new Date(p.date).toDateString() === today);
    const focusTime = todayPomodoro.reduce((acc, curr) => acc + (curr.minutes || 0), 0);

    return {
      sobrietyDays,
      applicationsCount: Array.isArray(applications) ? applications.length : 0,
      therapyCount: Array.isArray(therapy) ? therapy.length : 0,
      focusTime
    };
  };

  const handleToggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition isn't supported in this browser. Please try Chrome, Edge, or Safari.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      // Stop any active speech
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
      setTranscript('');
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.warn('Recognition start exception:', e);
      }
    }
  };

  // Trigger Converse with Bedrock once speech stops with content
  useEffect(() => {
    if (!isListening && transcript.trim().length > 0) {
      sendToBedrock(transcript);
    }
  }, [isListening]);

  const sendToBedrock = async (userVoiceInput) => {
    setIsThinking(true);
    try {
      const context = await getTelemetryContext();
      
      // Try local /api/voice/converse first, with automatic fallback to live backend
      let response;
      try {
        response = await fetch('/api/voice/converse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript: userVoiceInput, context })
        });
      } catch (networkErr) {
        console.warn('Local proxy unreachable, falling back to live production backend');
      }

      // If local proxy failed or returned 500/404, fallback to live Render endpoint
      if (!response || !response.ok) {
        response = await fetch('https://clarity-dashboard-lnho.onrender.com/api/voice/converse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript: userVoiceInput, context })
        });
      }

      if (!response.ok) {
        throw new Error('Failed to get voice response');
      }

      const data = await response.json();
      setLastReply(data.replyText);
      setProviderBadge(data.provider === 'bedrock-polly' ? 'Bedrock + Polly Neural' : 'Bedrock + Speech API');

      // Play synthesized audio
      if (data.audioBase64) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audioBase64}`);
        currentAudioRef.current = audio;
        setIsSpeaking(true);
        audio.onended = () => setIsSpeaking(false);
        audio.play().catch(e => console.warn('Audio playback error:', e));
      } else if ('speechSynthesis' in window) {
        // Find the most natural/human voice installed on the device (e.g. Apple Samantha, Daniel, Natural, Google)
        const utterance = new SpeechSynthesisUtterance(data.replyText);
        const voices = window.speechSynthesis.getVoices();
        const premiumVoice = voices.find(v => 
          (v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('Siri') || v.name.includes('Google US')) && v.lang.startsWith('en')
        ) || voices.find(v => v.lang.startsWith('en'));

        if (premiumVoice) {
          utterance.voice = premiumVoice;
        }
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.error('Voice converse error:', err);
      setLastReply("I couldn't reach Bedrock right now. Make sure your server is running with AWS keys.");
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <>
      {/* Apple Siri Floating Liquid Orb FAB */}
      <button 
        className={`voice-fab ${isOpen ? 'open' : ''} ${isListening ? 'listening' : ''} ${isSpeaking ? 'speaking' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle voice assistant"
        title="Clarity Voice Assistant"
      >
        <div className="siri-orb">
          <div className="siri-glow"></div>
        </div>
      </button>

      {/* Voice Assistant Modal Deck */}
      {isOpen && (
        <div className="voice-panel">
          <div className="voice-header">
            <div className="voice-header-title">
              <span className="voice-pulse-dot"></span>
              <h3>Clarity Voice 3D</h3>
            </div>
            <span className="voice-provider-tag">{providerBadge}</span>
            <button 
              onClick={() => setIsOpen(false)} 
              className="voice-close-btn"
              aria-label="Close voice assistant"
            >
              ✕
            </button>
          </div>

          <div className="voice-visualizer-container">
            {/* Interactive True 3D Siri Multi-Sphere Visualizer */}
            <div 
              className={`siri-interactive-sphere ${isListening ? 'listening' : ''} ${isThinking ? 'thinking' : ''} ${isSpeaking ? 'speaking' : ''}`}
              onClick={handleToggleListening}
            >
              {/* Outer 3D Gyro Atmospheric Rings */}
              <div className="siri-ring ring-1"></div>
              <div className="siri-ring ring-2"></div>
              <div className="siri-ring ring-3"></div>
              <div className="siri-ring ring-4"></div>

              {/* 3D Orbiting Satellites */}
              <div className="orbital-cluster">
                <div className="satellite sat-1"></div>
                <div className="satellite sat-2"></div>
                <div className="satellite sat-3"></div>
              </div>

              {/* 3D Wave Ripple Glow on Voice Activity */}
              <div className="siri-wave-ripple"></div>
              <div className="siri-wave-ripple ripple-delay"></div>

              {/* Central Hyper-realistic 3D Liquid Sphere */}
              <div className="siri-core">
                <div className="siri-specular-lens"></div>
                <div className="siri-inner-plasma"></div>
              </div>
            </div>

            <p className="voice-status-label">
              {isListening 
                ? "🎙️ Listening... (tap to finish)" 
                : isThinking 
                ? "✨ Amazon Bedrock thinking..." 
                : isSpeaking 
                ? "🔊 Danielle Neural speaking..." 
                : "Tap 3D sphere to talk"}
            </p>
          </div>

          {transcript && (
            <div className="voice-user-transcript">
              <span className="voice-bubble-label">You:</span>
              <p>"{transcript}"</p>
            </div>
          )}

          <div className="voice-reply-card">
            <span className="voice-bubble-label">Clarity Assistant:</span>
            <p className="voice-reply-text">{lastReply}</p>
          </div>

          <div className="voice-quick-actions">
            <button 
              className="voice-chip" 
              onClick={() => {
                setTranscript("How is my executive progress today?");
                sendToBedrock("How is my executive progress today?");
              }}
            >
              "How is my progress today?"
            </button>
            <button 
              className="voice-chip" 
              onClick={() => {
                setTranscript("Give me a quick 1-minute motivation check.");
                sendToBedrock("Give me a quick 1-minute motivation check.");
              }}
            >
              "Quick motivation check"
            </button>
          </div>
        </div>
      )}
    </>
  );
}
