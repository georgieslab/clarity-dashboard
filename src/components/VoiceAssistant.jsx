import { useState, useEffect, useRef } from 'react';
import { storage } from '../utils/storage';

const DEFAULT_WELCOME = "I'm Lumen, your mindful copilot. I'm here to support your sobriety streak, therapy reflections, and daily focus. How are you feeling right now?";

export default function VoiceAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [textInput, setTextInput] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [messages, setMessages] = useState([
    {
      id: 'lumen-init',
      role: 'assistant',
      text: DEFAULT_WELCOME,
      timestamp: Date.now()
    }
  ]);
  const recognitionRef = useRef(null);
  const currentAudioRef = useRef(null);
  const isOpenRef = useRef(isOpen);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load persistent chat history from storage on mount
  useEffect(() => {
    const loadSavedHistory = async () => {
      try {
        const saved = await storage.get('lumen_chat_history');
        if (Array.isArray(saved) && saved.length > 0) {
          setMessages(saved);
        }
      } catch (err) {
        console.warn('Could not load lumen_chat_history:', err);
      }
    };
    loadSavedHistory();
  }, []);

  // Helper to downscale and compress images on the client before network/storage
  const compressImage = (file, maxDim = 640, quality = 0.6) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve({
            dataUrl,
            base64: dataUrl,
            mimeType: 'image/jpeg',
            name: file.name
          });
        };
        img.onerror = (err) => reject(err);
        img.src = e.target.result;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  // Save history changes to persistent storage (safely strip heavy image payloads for localStorage)
  const saveMessages = async (newMsgs) => {
    setMessages(newMsgs);
    try {
      const sanitised = newMsgs.slice(-20).map(m => {
        // In persistent storage, omit large base64 strings so localStorage quota is never exceeded
        if (m.image && m.image.length > 15000) {
          return { ...m, image: null, text: m.text || "[Image uploaded for vision analysis]" };
        }
        return m;
      });
      await storage.set('lumen_chat_history', sanitised);
    } catch (err) {
      console.warn('Failed to persist lumen_chat_history, clearing image payloads:', err);
      try {
        const fallbackMsgs = newMsgs.slice(-15).map(m => ({ ...m, image: null }));
        await storage.set('lumen_chat_history', fallbackMsgs);
      } catch (e) {
        console.error('Storage clear error:', e);
      }
    }
  };

  // Clear chat history
  const handleClearHistory = async () => {
    const reset = [
      {
        id: `lumen-reset-${Date.now()}`,
        role: 'assistant',
        text: "I've cleared our previous conversation. I'm right here with you whenever you're ready.",
        timestamp: Date.now()
      }
    ];
    await saveMessages(reset);
  };

  // Auto-scroll chat feed to latest message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, transcript, isThinking, isOpen]);

  // Keep isOpenRef synchronized
  useEffect(() => {
    isOpenRef.current = isOpen;
    if (isOpen) {
      // Auto-listen when user opens Lumen modal
      const timer = setTimeout(() => {
        startListeningSafe();
      }, 350);
      return () => clearTimeout(timer);
    } else {
      // Safely silence any active audio / recognition when closed
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
      window.speechSynthesis?.cancel();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      setIsListening(false);
      setIsSpeaking(false);
    }
  }, [isOpen]);

  // Safe helper to activate voice listening
  const startListeningSafe = () => {
    if (!recognitionRef.current || !isOpenRef.current) return;
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
    }
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setTranscript('');
    try {
      recognitionRef.current.start();
    } catch (e) {
      // Speech recognition might already be active or transitioning
    }
  };

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
      startListeningSafe();
    }
  };

  // Trigger Converse with Bedrock once speech stops with content
  useEffect(() => {
    if (!isListening && transcript.trim().length > 0) {
      sendToBedrock(transcript);
    }
  }, [isListening]);

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 12 * 1024 * 1024) {
      alert("Please select an image smaller than 12MB.");
      return;
    }
    try {
      const compressed = await compressImage(file, 720, 0.65);
      setSelectedImage(compressed);
    } catch (err) {
      console.error("Image compression error:", err);
      alert("Failed to process image. Please try another image.");
    }
  };

  const handleClearImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const sendToBedrock = async (userVoiceInput, imageParam = selectedImage) => {
    if ((!userVoiceInput || !userVoiceInput.trim()) && !imageParam) return;
    const cleanInput = (userVoiceInput || "").trim();

    // 1. Append user message turn immediately
    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: cleanInput || (imageParam ? "Sent an image for analysis" : ""),
      image: imageParam?.dataUrl || null,
      timestamp: Date.now()
    };
    const updatedMessages = [...messages, userMsg];
    await saveMessages(updatedMessages);

    setTranscript('');
    setTextInput('');
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsThinking(true);

    try {
      const context = await getTelemetryContext();
      
      // Build lightweight conversation history slice for Bedrock context
      const historyPayload = updatedMessages.slice(-8).map(m => ({
        role: m.role,
        text: m.text
      }));

      const bodyPayload = {
        transcript: cleanInput,
        image: imageParam ? { base64: imageParam.base64, mimeType: imageParam.mimeType } : null,
        context,
        history: historyPayload
      };

      // Try local /api/voice/converse first, with automatic fallback to live backend
      let response;
      try {
        response = await fetch('/api/voice/converse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyPayload)
        });
      } catch (networkErr) {
        console.warn('Local proxy unreachable, falling back to live production backend');
      }

      // If local proxy failed or returned 500/404, fallback to live Render endpoint
      if (!response || !response.ok) {
        response = await fetch('https://clarity-dashboard-lnho.onrender.com/api/voice/converse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyPayload)
        });
      }

      if (!response.ok) {
        throw new Error('Failed to get voice response');
      }

      const data = await response.json();
      const assistantText = data.replyText || "I'm right here with you. Take a breath.";

      // 2. Append assistant reply turn to messages and persist
      const assistantMsg = {
        id: `lumen-${Date.now()}`,
        role: 'assistant',
        text: assistantText,
        timestamp: Date.now()
      };
      await saveMessages([...updatedMessages, assistantMsg]);

      // 3. Play synthesized audio
      if (data.audioBase64) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audioBase64}`);
        currentAudioRef.current = audio;
        setIsSpeaking(true);
        audio.onended = () => {
          setIsSpeaking(false);
          if (isOpenRef.current) {
            setTimeout(() => {
              if (isOpenRef.current) {
                startListeningSafe();
              }
            }, 450);
          }
        };
        audio.play().catch(e => console.warn('Audio playback error:', e));
      } else if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(assistantText);
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
        utterance.onend = () => {
          setIsSpeaking(false);
          if (isOpenRef.current) {
            setTimeout(() => {
              if (isOpenRef.current) {
                startListeningSafe();
              }
            }, 450);
          }
        };
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.error('Voice converse error:', err);
      const errorMsg = {
        id: `lumen-err-${Date.now()}`,
        role: 'assistant',
        text: "I'm having a little trouble connecting right now. Let's take a breath and try again in a moment.",
        timestamp: Date.now()
      };
      await saveMessages([...updatedMessages, errorMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (textInput.trim() || selectedImage) {
      sendToBedrock(textInput.trim(), selectedImage);
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

      {/* Floating Hovering Badge when Chat is Collapsed */}
      {!isOpen && (
        <div 
          className="voice-fab-badge"
          onClick={() => setIsOpen(true)}
          role="button"
          tabIndex={0}
          title="Open Lumen AI Assistant"
        >
          <span className="voice-badge-dot"></span>
          <span className="voice-badge-text">LUMEN AI Assistant</span>
        </div>
      )}

      {/* Floating Liquid Orb FAB */}
      <button 
        className={`voice-fab ${isOpen ? 'open' : ''} ${isListening ? 'listening' : ''} ${isSpeaking ? 'speaking' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Lumen Voice Assistant"
        title="Lumen // Mindful Copilot"
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
          {/* Header with Title and Clear Chat */}
          <div className="voice-header">
            <div className="voice-header-title">
              <span className="voice-pulse-dot"></span>
              <h3>LUMEN</h3>
              <span className="voice-role-tag">Mindful Copilot</span>
            </div>
            <div className="voice-header-actions">
              <button 
                onClick={handleClearHistory} 
                className="voice-clear-btn"
                title="Clear conversation history"
                aria-label="Clear conversation history"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
                <span>Clear</span>
              </button>
              <button 
                onClick={() => setIsOpen(false)} 
                className="voice-close-btn"
                aria-label="Close Lumen"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Interactive Compact 3D Liquid Sphere Visualizer */}
          <div className="voice-visualizer-container">
            <div 
              className={`siri-interactive-sphere ${isListening ? 'listening' : ''} ${isThinking ? 'thinking' : ''} ${isSpeaking ? 'speaking' : ''}`}
              onClick={handleToggleListening}
              title={isListening ? "Tap to pause" : "Tap to speak"}
            >
              {/* Sound Wave Ripple Glow */}
              <div className="siri-wave-ripple"></div>
              <div className="siri-wave-ripple ripple-delay"></div>

              {/* Central Gooey Plasma Sphere (Violet, Pink, Blue) */}
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
                ? "🎙️ Listening... speak naturally" 
                : isThinking 
                ? "✨ Lumen is reflecting..." 
                : isSpeaking 
                ? "🔊 Lumen is speaking..." 
                : "🎙️ Tap sphere to talk"}
            </p>
          </div>

          {/* Scrollable Conversation Feed (Saved across closes & visits) */}
          <div className="voice-chat-feed">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`voice-chat-msg ${msg.role === 'user' ? 'user' : 'assistant'}`}
              >
                <div className="voice-msg-meta">
                  <span className="voice-bubble-label">
                    {msg.role === 'user' ? 'You' : 'Lumen'}
                  </span>
                  {msg.timestamp && (
                    <span className="voice-msg-time">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                {msg.image && (
                  <div className="voice-msg-image-wrap">
                    <img src={msg.image} alt="User visual payload" className="voice-msg-image" />
                  </div>
                )}
                {msg.text && <p className="voice-chat-text">{msg.text}</p>}
              </div>
            ))}

            {/* Interim live speech recognition transcript */}
            {transcript && (
              <div className="voice-chat-msg user live-transcript">
                <span className="voice-bubble-label">You (speaking...)</span>
                <p className="voice-chat-text">"{transcript}"</p>
              </div>
            )}

            {/* Thinking / Reflection indicator */}
            {isThinking && (
              <div className="voice-chat-msg assistant thinking-bubble">
                <span className="voice-bubble-label">Lumen</span>
                <div className="voice-thinking-dots">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Optional Text Input & Image Upload Controls for Quiet Environments */}
          <div className="voice-bottom-controls">
            {selectedImage && (
              <div className="voice-image-preview-bar">
                <div className="voice-preview-left">
                  <img src={selectedImage.dataUrl} alt="Preview" className="voice-preview-thumb" />
                  <span className="voice-preview-name">{selectedImage.name}</span>
                </div>
                <button type="button" onClick={handleClearImage} className="voice-clear-img-btn" title="Remove image">
                  ✕
                </button>
              </div>
            )}
            <form className="voice-input-form" onSubmit={handleTextSubmit}>
              <button 
                type="button" 
                className={`voice-attach-btn ${selectedImage ? 'has-image' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                title="Send an image to Lumen for AI vision analysis"
                aria-label="Send image"
              >
                <svg className="moving-camera-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle className="svg-aperture-ring" cx="12" cy="13" r="8" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
                  <path d="M23 19A2 2 0 0 1 21 21H3A2 2 0 0 1 1 19V8A2 2 0 0 1 3 6H7L9 3H15L17 6H21A2 2 0 0 1 23 8Z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                  <circle className="svg-lens-iris" cx="12" cy="13" r="3" fill="currentColor" opacity="0.85" />
                  <line className="svg-scanner-beam" x1="5" y1="13" x2="19" y2="13" stroke="url(#scannerGradient)" strokeWidth="1.5" strokeLinecap="round" />
                  <defs>
                    <linearGradient id="scannerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ec4899" stopOpacity="0" />
                      <stop offset="50%" stopColor="#38bdf8" stopOpacity="1" />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                accept="image/*" 
                style={{ display: 'none' }} 
                onChange={handleImageChange} 
              />
              <input 
                type="text"
                className="voice-text-input"
                placeholder={selectedImage ? "Add a caption or ask Lumen about this image..." : "Type or send an image to Lumen..."}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
              />
              <button 
                type="submit" 
                className="voice-send-btn" 
                disabled={(!textInput.trim() && !selectedImage) || isThinking}
                aria-label="Send message"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
