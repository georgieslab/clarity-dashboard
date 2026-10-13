import { useState, useEffect } from 'react';
import { binauralEngine } from '../utils/binauralEngine';
import { sounds } from '../utils/audioEffects';

const SOUNDSCAPES = [
  {
    id: 'gamma',
    title: '40Hz Gamma Focus',
    icon: '🧠',
    freq: '216Hz + 256Hz Binaural Beat',
    description: 'Bilateral prefrontal cortex synchronization for hyper-focus, coding flow, and rapid problem-solving.',
    accent: '#38bdf8'
  },
  {
    id: 'pinkRain',
    title: 'Rain on Glass',
    icon: '🌧️',
    freq: 'Acoustic Pink Noise Filter',
    description: 'Soft organic rainfall against windowpane. Masks erratic office or environmental distractions.',
    accent: '#818cf8'
  },
  {
    id: 'ocean',
    title: 'Deep Ocean Waves',
    icon: '🌊',
    freq: '0.12Hz LFO Tidal Swell',
    description: 'Rhythmic deep surf harmonics simulating natural ocean tides to regulate sympathetic arousal.',
    accent: '#06b6d4'
  },
  {
    id: 'zenDrone',
    title: 'Zen Harmonic Resonance',
    icon: '🧘',
    freq: '432Hz Root & Sacred 5th',
    description: 'Subtle warm ambient drones for grounding, introspection, meditation, and calm emotional equilibrium.',
    accent: '#a78bfa'
  }
];

export default function BinauralFlowModal({ isOpen, onClose }) {
  const [selectedMode, setSelectedMode] = useState('gamma');
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);

  useEffect(() => {
    const unsubscribe = binauralEngine.subscribe((state) => {
      setIsPlaying(state.isPlaying);
      if (state.mode) setSelectedMode(state.mode);
      setVolume(state.volume);
    });
    return unsubscribe;
  }, []);

  if (!isOpen) return null;

  const handleSelectSound = (id) => {
    sounds.playTap();
    setSelectedMode(id);
    if (isPlaying) {
      binauralEngine.start(id);
    }
  };

  const togglePlay = () => {
    sounds.playSwitch(!isPlaying);
    if (isPlaying) {
      binauralEngine.stop();
    } else {
      binauralEngine.start(selectedMode);
    }
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    binauralEngine.setVolume(val);
  };

  const activeSound = SOUNDSCAPES.find((s) => s.id === selectedMode);

  return (
    <div className="executive-modal-backdrop" onClick={onClose}>
      <div 
        className="executive-glass-modal binaural-modal-card" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-badge-pill">🎧 Ambient Neuro-Acoustics</span>
            <h2 className="modal-title">Binaural Flow & Soundscapes</h2>
            <p className="modal-subtitle">Procedural Web Audio acoustic generator for cognitive immersion & calm (100% offline)</p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        {/* Live Audio Visualizer Banner */}
        <div className={`soundscape-visualizer-bar ${isPlaying ? 'active' : ''}`}>
          <div className="visualizer-bars-group">
            {[...Array(16)].map((_, i) => (
              <span 
                key={i} 
                className={`viz-bar ${isPlaying ? 'pulse' : ''}`}
                style={{
                  animationDelay: `${(i * 0.08) % 1}s`,
                  height: isPlaying ? `${20 + (i % 5) * 14}px` : '4px',
                  backgroundColor: activeSound?.accent || '#38bdf8'
                }}
              />
            ))}
          </div>
          <div className="visualizer-meta">
            <span className="visualizer-title">{activeSound?.title}</span>
            <span className="visualizer-status">
              {isPlaying ? '● Playing in background' : '○ Synthesizer idle'}
            </span>
          </div>
          <button 
            className={`visualizer-master-btn ${isPlaying ? 'playing' : ''}`}
            onClick={togglePlay}
          >
            {isPlaying ? '⏸ Stop Audio' : '▶ Play Now'}
          </button>
        </div>

        {/* Grid of Soundscapes */}
        <div className="soundscapes-grid">
          {SOUNDSCAPES.map((sound) => {
            const isSelected = selectedMode === sound.id;
            const isCurrentlyPlayingThis = isPlaying && isSelected;

            return (
              <div 
                key={sound.id}
                className={`soundscape-card ${isSelected ? 'selected' : ''} ${isCurrentlyPlayingThis ? 'playing-card' : ''}`}
                onClick={() => handleSelectSound(sound.id)}
              >
                <div className="soundscape-card-top">
                  <span className="soundscape-card-icon">{sound.icon}</span>
                  {isSelected && (
                    <span className="soundscape-selected-badge" style={{ borderColor: sound.accent, color: sound.accent }}>
                      {isCurrentlyPlayingThis ? '● Active' : 'Selected'}
                    </span>
                  )}
                </div>
                <h4 className="soundscape-card-title">{sound.title}</h4>
                <span className="soundscape-card-freq">{sound.freq}</span>
                <p className="soundscape-card-desc">{sound.description}</p>
              </div>
            );
          })}
        </div>

        {/* Volume & Bottom Controls */}
        <div className="soundscape-footer-controls">
          <div className="soundscape-volume-group">
            <span className="volume-label">🔈 Volume ({Math.round(volume * 100)}%)</span>
            <input 
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="executive-volume-slider"
            />
          </div>

          <div className="soundscape-tip">
            <span>💡 <strong>Tip</strong>: Use headphones for true stereo binaural beat entrainment (40Hz).</span>
          </div>
        </div>
      </div>
    </div>
  );
}

