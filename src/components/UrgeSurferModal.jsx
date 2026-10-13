import { useState, useEffect, useRef } from 'react';
import { sounds } from '../utils/audioEffects';

const STAGES = [
  {
    range: [90, 70],
    name: '1. Observe the Wave',
    icon: '🌊',
    guidance: 'Do not fight the urge. Notice where it resides in your body (chest, hands, stomach). Like an ocean swell, it will rise, crest, and dissolve.',
    color: '#38bdf8'
  },
  {
    range: [70, 45],
    name: '2. 5-4-3-2-1 Sensory Grounding',
    icon: '👁️',
    guidance: 'Ground your senses right now: Notice 5 things you can see, 4 textures you can touch, 3 sounds you can hear, 2 scents, and 1 slow breath.',
    color: '#818cf8'
  },
  {
    range: [45, 15],
    name: '3. Anchor to Freedom',
    icon: '🛡️',
    guidance: 'This sensation is just dopamine receptors recalibrating. Discomfort is proof of your healing. You have surmounted this before; you own your clarity.',
    color: '#ec4899'
  },
  {
    range: [15, 0],
    name: '4. The Crest Recedes',
    icon: '🌅',
    guidance: 'The neurochemical wave has broken. Notice the tension draining from your shoulders. You successfully surfed the wave without giving in.',
    color: '#10b981'
  }
];

export default function UrgeSurferModal({ isOpen, onClose, sobrietyDays = 142 }) {
  const [secondsLeft, setSecondsLeft] = useState(90);
  const [isActive, setIsActive] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const timerRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setSecondsLeft(90);
      setIsActive(true);
    } else {
      setIsActive(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsPlayingAudio(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isActive) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current);
          setIsActive(false);
          sounds.playSuccess();
          return 0;
        }
        if (s % 15 === 0) {
          sounds.playTick();
        }
        return s - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive]);

  const currentStage = STAGES.find(
    (st) => secondsLeft <= st.range[0] && secondsLeft >= st.range[1]
  ) || STAGES[STAGES.length - 1];

  const totalTime = 90;
  const progressRatio = (totalTime - secondsLeft) / totalTime;
  const strokeDashoffset = 440 - 440 * progressRatio;

  const handleTogglePlay = () => {
    sounds.playTap();
    setIsActive(!isActive);
  };

  const handleReset = () => {
    sounds.playTap();
    setSecondsLeft(90);
    setIsActive(true);
  };

  const handlePlayVoiceAnchor = async () => {
    sounds.playTap();
    if (isPlayingAudio && audioRef.current) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
      return;
    }

    try {
      setIsPlayingAudio(true);
      const textToSpeak = `Take a slow, deep breath. You are on day ${sobrietyDays} of freedom. Notice this feeling without judgment. It is merely a neurochemical wave in your nervous system. In less than 90 seconds, this intensity will peak and recede. You are completely in control. Stay still. You are safe.`;
      
      const response = await fetch('/api/polly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToSpeak, voiceId: 'Matthew' })
      });

      if (!response.ok) throw new Error('Polly failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsPlayingAudio(false);
      };
      
      await audio.play();
    } catch (e) {
      console.warn('Fallback speech synthesis:', e);
      // Fallback to browser SpeechSynthesis
      if ('speechSynthesis' in window) {
        const utter = new SpeechSynthesisUtterance(`Breathe deeply. You are on day ${sobrietyDays}. This urge will pass in 90 seconds. You are safe and strong.`);
        utter.onend = () => setIsPlayingAudio(false);
        window.speechSynthesis.speak(utter);
      } else {
        setIsPlayingAudio(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="executive-modal-backdrop" onClick={onClose}>
      <div 
        className="executive-glass-modal urge-modal-card" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-badge-pill urge-badge">🛡️ Neuroscience Urge Surfer</span>
            <h2 className="modal-title">90-Second Craving Wave</h2>
            <p className="modal-subtitle">Addiction psychology protocol: neurochemical cravings crest and dissolve within 90 seconds</p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        {/* Circular Countdown Progress */}
        <div className="urge-timer-visual">
          <svg className="urge-circle-svg" width="160" height="160" viewBox="0 0 160 160">
            <circle 
              className="urge-circle-bg" 
              cx="80" 
              cy="80" 
              r="70" 
              stroke="rgba(255,255,255,0.08)" 
              strokeWidth="6" 
              fill="none" 
            />
            <circle 
              className="urge-circle-progress" 
              cx="80" 
              cy="80" 
              r="70" 
              stroke={currentStage.color} 
              strokeWidth="6" 
              strokeDasharray="440" 
              strokeDashoffset={strokeDashoffset} 
              strokeLinecap="round" 
              fill="none" 
            />
          </svg>

          <div className="urge-timer-center">
            <span className="urge-time-digits">{secondsLeft}s</span>
            <span className="urge-time-sub">Surfing</span>
          </div>
        </div>

        {/* Dynamic Stage Guidance */}
        <div className="urge-stage-card" style={{ borderColor: `${currentStage.color}40` }}>
          <div className="urge-stage-header">
            <span className="urge-stage-icon">{currentStage.icon}</span>
            <span className="urge-stage-title" style={{ color: currentStage.color }}>
              {currentStage.name}
            </span>
          </div>
          <p className="urge-stage-guidance">{currentStage.guidance}</p>
        </div>

        {/* Action Buttons */}
        <div className="urge-actions-grid">
          <button 
            className={`urge-btn-primary ${isActive ? 'pause' : 'resume'}`}
            onClick={handleTogglePlay}
          >
            {secondsLeft === 0 ? '✓ Wave Completed' : isActive ? '⏸ Pause Timer' : '▶ Resume Wave'}
          </button>

          <button 
            className={`urge-btn-audio ${isPlayingAudio ? 'active' : ''}`}
            onClick={handlePlayVoiceAnchor}
          >
            {isPlayingAudio ? '⏹ Stop Matthew Voice' : '🎙️ Matthew Voice Anchor'}
          </button>

          <button 
            className="urge-btn-secondary"
            onClick={handleReset}
          >
            ↺ Restart 90s
          </button>
        </div>

        {/* Emergency SOS Anchor */}
        <div className="urge-emergency-bar">
          <span className="emergency-label">Need direct support?</span>
          <div className="emergency-links">
            <a href="tel:988" className="emergency-pill tel-pill">
              📞 988 Lifeline
            </a>
            <a href="sms:741741" className="emergency-pill sms-pill">
              💬 Text HOME to 741741
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

