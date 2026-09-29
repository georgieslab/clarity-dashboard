import { useState, useEffect, useRef } from 'react';
import { storage } from '../utils/storage';

export default function VoiceAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastReply, setLastReply] = useState("I'm Lumen, your mindful copilot. I'm here to support your sobriety streak, therapy reflections, and daily focus. How are you feeling right now?");

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
        const premiumMaleVoice = voices.find(v => 
          (v.name.includes('Daniel') || v.name.includes('George') || v.name.includes('Guy') || v.name.includes('Arthur') || v.name.includes('David') || (v.name.includes('Male') && v.name.includes('Natural'))) && v.lang.startsWith('en')
        ) || voices.find(v => v.lang.startsWith('en'));

        if (premiumMaleVoice) {
          utterance.voice = premiumMaleVoice;
        }
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.error('Voice converse error:', err);
      setLastReply("I'm having a little trouble connecting right now. Let's take a breath and try again in a moment.");
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <>
      {/* Hidden SVG Gooey Filter for Organic Metaball Fluid Simulation */}
      <svg width="0" height="0" style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }} aria-hidden="true">
        <defs>
          <filter id="clarity-goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/* Apple Siri Floating Liquid Orb FAB */}
      <button 
        className={`voice-fab ${isOpen ? 'open' : ''} ${isListening ? 'listening' : ''} ${isSpeaking ? 'speaking' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle voice assistant"
        title="Clarity Voice Assistant"
      >
        <div className="siri-orb loader-mini">
          <div className="loader-inner">
            <div className="blob b1"></div>
            <div className="blob b2"></div>
            <div className="blob b3"></div>
            <div className="blob b4"></div>
            <div className="blob b5"></div>
            <div className="blob b6"></div>
          </div>
        </div>
      </button>

      {/* Voice Assistant Modal Deck */}
      {isOpen && (
        <div className="voice-panel">
          <div className="voice-header">
            <div className="voice-header-title">
              <span className="voice-pulse-dot"></span>
              <h3>LUMEN</h3>
              <span className="voice-role-tag">Mindful Copilot</span>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              className="voice-close-btn"
              aria-label="Close Lumen"
            >
              ✕
            </button>
          </div>

          <div className="voice-visualizer-container">
            {/* Interactive True 3D Lumen Organic Sphere Visualizer */}
            <div 
              className={`siri-interactive-sphere ${isListening ? 'listening' : ''} ${isThinking ? 'thinking' : ''} ${isSpeaking ? 'speaking' : ''}`}
              onClick={handleToggleListening}
            >
              {/* 3D Wave Ripple Glow on Voice Activity */}
              <div className="siri-wave-ripple"></div>
              <div className="siri-wave-ripple ripple-delay"></div>

              {/* Central Hyper-realistic 3D Gooey Plasma Sphere */}
              <div className="siri-core loader">
                <div className="loader-inner">
                  <div className="blob b1"></div>
                  <div className="blob b2"></div>
                  <div className="blob b3"></div>
                  <div className="blob b4"></div>
                  <div className="blob b5"></div>
                  <div className="blob b6"></div>
                </div>
                <div className="siri-specular-lens"></div>
              </div>
            </div>

            <p className="voice-status-label">
              {isListening 
                ? "🎙️ Lumen is listening... (tap to finish)" 
                : isThinking 
                ? "✨ Lumen is reflecting..." 
                : isSpeaking 
                ? "🔊 Lumen is speaking..." 
                : "Tap sphere to speak with Lumen"}
            </p>
          </div>

          {transcript && (
            <div className="voice-user-transcript">
              <span className="voice-bubble-label">You:</span>
              <p>"{transcript}"</p>
            </div>
          )}

          <div className="voice-reply-card">
            <span className="voice-bubble-label">Lumen:</span>
            <p className="voice-reply-text">{lastReply}</p>
          </div>

          <div className="voice-quick-actions">
            <button 
              className="voice-chip" 
              onClick={() => {
                const prompt = "How is my sobriety streak holding today?";
                setTranscript(prompt);
                sendToBedrock(prompt);
              }}
            >
              "How's my sobriety streak?"
            </button>
            <button 
              className="voice-chip" 
              onClick={() => {
                const prompt = "I'm feeling a bit overwhelmed, can we take a mindful check-in?";
                setTranscript(prompt);
                sendToBedrock(prompt);
              }}
            >
              "Mindful check-in"
            </button>
            <button 
              className="voice-chip" 
              onClick={() => {
                const prompt = "Give me a calm 1-minute reflection for today's focus.";
                setTranscript(prompt);
                sendToBedrock(prompt);
              }}
            >
              "Focus reflection"
            </button>
          </div>
        </div>
      )}
    </>
  );
}
