import { useState, useEffect, useRef } from 'react';
import { sounds } from '../utils/audioEffects';

const PHASES = [
  { name: 'Inhale', duration: 4, label: 'Inhale slowly through the nose...', color: '#38bdf8' },
  { name: 'Hold', duration: 4, label: 'Hold breath gently — maintain stillness...', color: '#818cf8' },
  { name: 'Exhale', duration: 4, label: 'Exhale smoothly through the mouth...', color: '#a78bfa' },
  { name: 'Rest', duration: 4, label: 'Rest before the next breath...', color: '#6ee7b7' }
];

export default function BreathingResetModal({ isOpen, onClose }) {
  const [isActive, setIsActive] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(PHASES[0].duration);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setIsActive(true);
      setPhaseIndex(0);
      setSecondsLeft(PHASES[0].duration);
      setCyclesCompleted(0);
    } else {
      setIsActive(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isActive) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          // Advance to next phase
          setPhaseIndex((currIdx) => {
            const nextIdx = (currIdx + 1) % PHASES.length;
            if (nextIdx === 0) {
              setCyclesCompleted((c) => c + 1);
              sounds.playSuccess();
            } else {
              sounds.playTap();
            }
            return nextIdx;
          });
          return PHASES[(phaseIndex + 1) % PHASES.length].duration;
        }
        sounds.playTick();
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, phaseIndex]);

  if (!isOpen) return null;

  const currentPhase = PHASES[phaseIndex];
  const progressPercent = ((currentPhase.duration - secondsLeft + 1) / currentPhase.duration) * 100;

  return (
    <div className="executive-modal-backdrop" onClick={onClose}>
      <div 
        className="executive-glass-modal breathing-modal-card" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-badge-pill">🫁 Vagus Nerve Reset</span>
            <h2 className="modal-title">Box Breathing Coherence</h2>
            <p className="modal-subtitle">4-4-4-4 resonant respiratory protocol for instant autonomic nervous system calm</p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        <div className="breathing-content">
          {/* Visual Resonant Orb */}
          <div className="breathing-orb-container">
            <div 
              className={`breathing-outer-ring ${currentPhase.name.toLowerCase()} ${isActive ? 'active' : 'paused'}`}
              style={{ borderColor: currentPhase.color }}
            />
            <div 
              className={`breathing-middle-ring ${currentPhase.name.toLowerCase()} ${isActive ? 'active' : 'paused'}`}
            />
            <div 
              className={`breathing-core-orb ${currentPhase.name.toLowerCase()} ${isActive ? 'active' : 'paused'}`}
              style={{ boxShadow: `0 0 50px ${currentPhase.color}55` }}
            >
              <span className="breathing-phase-text">{currentPhase.name}</span>
              <span className="breathing-countdown-number">{secondsLeft}s</span>
            </div>
          </div>

          <div className="breathing-phase-instruction">
            <p className="phase-instruction-label">{currentPhase.label}</p>
            <div className="breathing-bar-track">
              <div 
                className="breathing-bar-fill" 
                style={{ width: `${progressPercent}%`, backgroundColor: currentPhase.color }}
              />
            </div>
          </div>

          {/* Stats & Cycle Counter */}
          <div className="breathing-metrics-row">
            <div className="breathing-metric-chip">
              <span className="metric-chip-label">Cycles Done</span>
              <span className="metric-chip-value">{cyclesCompleted} / 4</span>
            </div>
            <div className="breathing-metric-chip">
              <span className="metric-chip-label">Target Resonance</span>
              <span className="metric-chip-value">0.1 Hz HRV</span>
            </div>
            <div className="breathing-metric-chip">
              <span className="metric-chip-label">Total Time</span>
              <span className="metric-chip-value">{Math.round((cyclesCompleted * 16 + (currentPhase.duration - secondsLeft)))}s</span>
            </div>
          </div>

          {/* Controls */}
          <div className="breathing-actions-row">
            <button 
              className={`breathing-toggle-btn ${isActive ? 'pause-btn' : 'start-btn'}`}
              onClick={() => {
                sounds.playTap();
                setIsActive(!isActive);
              }}
            >
              {isActive ? '⏸ Pause Rhythm' : '▶ Resume Rhythm'}
            </button>
            <button 
              className="breathing-reset-btn"
              onClick={() => {
                sounds.playTap();
                setPhaseIndex(0);
                setSecondsLeft(PHASES[0].duration);
                setCyclesCompleted(0);
              }}
            >
              ↺ Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

