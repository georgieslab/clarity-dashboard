import { useState, useEffect } from 'react';
import { sounds } from '../utils/audioEffects';
import { binauralEngine } from '../utils/binauralEngine';

// Apple HIG / SF Symbols Styled SVG Icons for the visionOS Executive Dock
const DOCK_ICONS = {
  command: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/>
    </svg>
  ),
  breathe: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <path d="M12 7c-2.5 0-4 1.8-4 4.5S9.5 16 12 17c2.5-1 4-2.8 4-5.5S14.5 7 12 7z"/>
      <path d="M12 3v4"/>
      <path d="M12 17v4"/>
    </svg>
  ),
  soundscapes: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
    </svg>
  ),
  memo: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  urge: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="M12 8v4"/>
      <path d="M12 16h.01"/>
    </svg>
  ),
  lumen: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <circle cx="12" cy="12" r="5" strokeDasharray="3 3"/>
      <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
    </svg>
  ),
  share: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
      <polyline points="16 6 12 2 8 6"/>
      <line x1="12" y1="2" x2="12" y2="15"/>
    </svg>
  ),
  architecture: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2"/>
      <rect x="9" y="9" width="6" height="6"/>
      <line x1="9" y1="1" x2="9" y2="4"/>
      <line x1="15" y1="1" x2="15" y2="4"/>
      <line x1="9" y1="20" x2="9" y2="23"/>
      <line x1="15" y1="20" x2="15" y2="23"/>
      <line x1="20" y1="9" x2="23" y2="9"/>
      <line x1="20" y1="15" x2="23" y2="15"/>
      <line x1="1" y1="9" x2="4" y2="9"/>
      <line x1="1" y1="15" x2="4" y2="15"/>
    </svg>
  ),
  soundOn: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
    </svg>
  ),
  soundMuted: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      <line x1="23" y1="9" x2="17" y2="15"/>
      <line x1="17" y1="9" x2="23" y2="15"/>
    </svg>
  )
};

export default function VisionDock({ 
  onOpenSpotlight, 
  onOpenBreathing,
  onOpenBinaural,
  onOpenMemo,
  onOpenUrge,
  onOpenArchitecture, 
  onOpenShareCard,
  onOpenLumen 
}) {
  const [hoveredItem, setHoveredItem] = useState(null);
  const [isMuted, setIsMuted] = useState(sounds.isMuted());
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  useEffect(() => {
    const unsub = binauralEngine.subscribe((state) => {
      setIsAudioPlaying(state.isPlaying);
    });
    return unsub;
  }, []);

  const toggleSound = () => {
    const nextMuted = sounds.toggleMute();
    setIsMuted(nextMuted);
  };

  return (
    <nav className="vision-dock-container" aria-label="visionOS Executive Navigation Dock">
      <div className="vision-dock">
        {/* Spotlight Command Bar */}
        <button 
          className="dock-item dock-spotlight-btn" 
          onClick={() => { sounds.playTap(); onOpenSpotlight(); }}
          onMouseEnter={() => { sounds.playTick(); setHoveredItem('spotlight'); }}
          onMouseLeave={() => setHoveredItem(null)}
          title="Command Menu (⌘K)"
          aria-label="Spotlight Command Bar"
        >
          <span className="dock-svg-icon">{DOCK_ICONS.command}</span>
          <span className={`dock-tooltip ${hoveredItem === 'spotlight' ? 'visible' : ''}`}>Command Palette (⌘K)</span>
        </button>

        <div className="dock-divider" />

        {/* 1. Box Breathing Vagus Reset */}
        <button
          className="dock-item"
          onClick={() => { sounds.playTap(); if (onOpenBreathing) onOpenBreathing(); }}
          onMouseEnter={() => { sounds.playTick(); setHoveredItem('breathe'); }}
          onMouseLeave={() => setHoveredItem(null)}
          title="Vagus Nerve Box Breathing Reset"
          aria-label="Box Breathing Reset"
        >
          <span className="dock-svg-icon dock-breathe-icon">{DOCK_ICONS.breathe}</span>
          <span className={`dock-tooltip ${hoveredItem === 'breathe' ? 'visible' : ''}`}>Breathing Reset</span>
        </button>

        {/* 2. Binaural Flow & Soundscapes */}
        <button
          className={`dock-item ${isAudioPlaying ? 'audio-active' : ''}`}
          onClick={() => { sounds.playTap(); if (onOpenBinaural) onOpenBinaural(); }}
          onMouseEnter={() => { sounds.playTick(); setHoveredItem('soundscapes'); }}
          onMouseLeave={() => setHoveredItem(null)}
          title="Binaural Beats & Focus Soundscapes"
          aria-label="Binaural Flow Soundscapes"
        >
          <span className="dock-svg-icon">{DOCK_ICONS.soundscapes}</span>
          {isAudioPlaying && <span className="dock-audio-dot" />}
          <span className={`dock-tooltip ${hoveredItem === 'soundscapes' ? 'visible' : ''}`}>
            {isAudioPlaying ? 'Soundscapes (Playing)' : 'Binaural Flow'}
          </span>
        </button>

        {/* 3. Executive Quick Memo */}
        <button
          className="dock-item"
          onClick={() => { sounds.playTap(); if (onOpenMemo) onOpenMemo(); }}
          onMouseEnter={() => { sounds.playTick(); setHoveredItem('memo'); }}
          onMouseLeave={() => setHoveredItem(null)}
          title="Quick Memo & Idea Inbox"
          aria-label="Executive Quick Memo"
        >
          <span className="dock-svg-icon">{DOCK_ICONS.memo}</span>
          <span className={`dock-tooltip ${hoveredItem === 'memo' ? 'visible' : ''}`}>Quick Memo</span>
        </button>

        {/* 4. 90-Second Urge Surfer & Anchor */}
        <button
          className="dock-item dock-urge-btn"
          onClick={() => { sounds.playTap(); if (onOpenUrge) onOpenUrge(); }}
          onMouseEnter={() => { sounds.playTick(); setHoveredItem('urge'); }}
          onMouseLeave={() => setHoveredItem(null)}
          title="90-Second Urge Surfer & Neuroscience Anchor"
          aria-label="Urge Surfer Anchor"
        >
          <span className="dock-svg-icon dock-urge-icon">{DOCK_ICONS.urge}</span>
          <span className={`dock-tooltip ${hoveredItem === 'urge' ? 'visible' : ''}`}>Urge Surfer (90s)</span>
        </button>

        <div className="dock-divider" />

        {/* Lumen Copilot Launcher */}
        <button
          className="dock-item dock-lumen-btn"
          onClick={() => { sounds.playTap(); if (onOpenLumen) onOpenLumen(); }}
          onMouseEnter={() => { sounds.playTick(); setHoveredItem('lumen'); }}
          onMouseLeave={() => setHoveredItem(null)}
          title="Lumen AI Multimodal Copilot"
          aria-label="Open Lumen AI Copilot"
        >
          <span className="dock-svg-icon dock-lumen-icon">{DOCK_ICONS.lumen}</span>
          <span className={`dock-tooltip ${hoveredItem === 'lumen' ? 'visible' : ''}`}>Lumen Copilot</span>
        </button>

        {/* Share Telemetry Card */}
        <button
          className="dock-item"
          onClick={() => { sounds.playTap(); if (onOpenShareCard) onOpenShareCard(); }}
          onMouseEnter={() => { sounds.playTick(); setHoveredItem('share'); }}
          onMouseLeave={() => setHoveredItem(null)}
          title="Share Executive Telemetry Card"
          aria-label="Share Executive Card"
        >
          <span className="dock-svg-icon">{DOCK_ICONS.share}</span>
          <span className={`dock-tooltip ${hoveredItem === 'share' ? 'visible' : ''}`}>Share Card</span>
        </button>

        {/* System Architecture Showcase */}
        <button
          className="dock-item"
          onClick={() => { sounds.playTap(); if (onOpenArchitecture) onOpenArchitecture(); }}
          onMouseEnter={() => { sounds.playTick(); setHoveredItem('arch'); }}
          onMouseLeave={() => setHoveredItem(null)}
          title="Engineering Architecture & System Specs"
          aria-label="View Engineering Architecture"
        >
          <span className="dock-svg-icon">{DOCK_ICONS.architecture}</span>
          <span className={`dock-tooltip ${hoveredItem === 'arch' ? 'visible' : ''}`}>Architecture</span>
        </button>

        {/* Micro-Haptics Sound Toggle */}
        <button
          className={`dock-item ${isMuted ? 'muted' : ''}`}
          onClick={toggleSound}
          onMouseEnter={() => { sounds.playTick(); setHoveredItem('sound'); }}
          onMouseLeave={() => setHoveredItem(null)}
          title={isMuted ? "Audio Haptics: Muted" : "Audio Haptics: Enabled"}
          aria-label="Toggle Audio Haptics"
        >
          <span className="dock-svg-icon">{isMuted ? DOCK_ICONS.soundMuted : DOCK_ICONS.soundOn}</span>
          <span className={`dock-tooltip ${hoveredItem === 'sound' ? 'visible' : ''}`}>
            {isMuted ? 'Sound: Muted' : 'Sound: Active'}
          </span>
        </button>
      </div>
    </nav>
  );
}
