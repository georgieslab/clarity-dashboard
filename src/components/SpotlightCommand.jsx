import { useState, useEffect, useRef } from 'react';
import { sounds } from '../utils/audioEffects';

export default function SpotlightCommand({
  isOpen,
  onClose,
  onAction,
  isDemoMode
}) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  const ACTIONS = [
    // Top Priority Demo & Recruiter Tour
    {
      id: 'demo-toggle',
      category: 'Portfolio Showcase',
      title: isDemoMode ? '↺ Restore Personal Data (Exit Demo)' : '✨ Load Executive Demo Data (Recruiter Persona)',
      subtitle: isDemoMode ? 'Clear seeded demo telemetry and restore original state' : '1-click load of 142d streak, active offers, 28d heatmap & AI brief',
      icon: isDemoMode ? '↺' : '✨',
      badge: 'Recommended',
      action: 'toggleDemo'
    },
    {
      id: 'inspect-arch',
      category: 'Portfolio Showcase',
      title: '⚡ Inspect Engineering Architecture & System Specs',
      subtitle: 'Interactive breakdown of Bedrock LLM routing, Polly, Web Audio & Quota Shield',
      icon: '⚡',
      badge: 'Technical Specs',
      action: 'openArchitecture'
    },
    {
      id: 'share-card',
      category: 'Portfolio Showcase',
      title: '🪄 Share Executive Telemetry Card',
      subtitle: 'Generate an Apple Glass metric snapshot badge to export or share',
      icon: '🪄',
      badge: 'Export',
      action: 'openShareCard'
    },

    // Navigation Items
    {
      id: 'nav-sobriety',
      category: 'Modules',
      title: 'Jump to Sobriety Tracker',
      subtitle: 'Real-time clean streak counter & milestone unlocks',
      icon: '🌱',
      action: 'scroll:sobriety'
    },
    {
      id: 'nav-pipeline',
      category: 'Modules',
      title: 'Jump to Job Pipeline',
      subtitle: 'Kanban stages and active Interview Shimmer cards',
      icon: '💼',
      action: 'scroll:jobSearch'
    },
    {
      id: 'nav-therapy',
      category: 'Modules',
      title: 'Jump to Therapy Tracker',
      subtitle: 'Session reflections, cognitive notes & emotional horizon',
      icon: '🧠',
      action: 'scroll:therapy'
    },
    {
      id: 'nav-habits',
      category: 'Modules',
      title: 'Jump to Atomic Habits Matrix',
      subtitle: '7-day rolling micro-habit matrix & streak velocity',
      icon: '⚡',
      action: 'scroll:atomicHabits'
    },
    {
      id: 'nav-library',
      category: 'Modules',
      title: 'Jump to Executive Thought Library',
      subtitle: 'Reading progress, mental models & architecture books',
      icon: '📚',
      action: 'scroll:executiveLibrary'
    },
    {
      id: 'nav-pomodoro',
      category: 'Modules',
      title: 'Jump to Focus Rhythm Timer',
      subtitle: 'Customizable Pomodoro routines & daily velocity logs',
      icon: '⏳',
      action: 'scroll:pomodoro'
    },
    {
      id: 'nav-insights',
      category: 'Modules',
      title: 'Jump to Executive Intelligence Briefing',
      subtitle: 'AI daily synthesis & behavioral correlations',
      icon: '✨',
      action: 'scroll:dailyInsights'
    },
    {
      id: 'nav-analytics',
      category: 'Modules',
      title: 'Jump to Telemetry Analytics',
      subtitle: 'Interactive SVG velocity chart & 28-day consistency heatmap',
      icon: '📈',
      action: 'scroll:telemetryAnalytics'
    },

    // Executive Utilities
    {
      id: 'tool-breathing',
      category: 'Executive Utilities',
      title: '🫁 Vagus Nerve Box Breathing Reset',
      subtitle: '4-4-4-4 resonant respiratory protocol for instant calm and autonomic regulation',
      icon: '🫁',
      action: 'openBreathing'
    },
    {
      id: 'tool-binaural',
      category: 'Executive Utilities',
      title: '🎧 Binaural Flow & Focus Soundscapes',
      subtitle: 'Procedural 40Hz Gamma waves, Rain on Glass, and Ocean tides (100% offline)',
      icon: '🎧',
      action: 'openBinaural'
    },
    {
      id: 'tool-memo',
      category: 'Executive Utilities',
      title: '⚡ Executive Quick Memo & Idea Inbox',
      subtitle: 'Fast capture scratchpad for fleeting breakthroughs, notes, and Lumen synthesis',
      icon: '⚡',
      action: 'openMemo'
    },
    {
      id: 'tool-urge',
      category: 'Executive Utilities',
      title: '🛡️ 90-Second Urge Surfer & Anchor',
      subtitle: 'Neuroscience craving regulation timer with 5-4-3-2-1 grounding and Matthew voice',
      icon: '🛡️',
      badge: 'Sobriety SOS',
      action: 'openUrge'
    },

    // Copilot & Preferences
    {
      id: 'open-lumen',
      category: 'AI Copilot',
      title: 'Open Lumen Multimodal Voice & Vision',
      subtitle: 'Spoken conversational partner with multimodal canvas inspection',
      icon: '🔮',
      action: 'openLumen'
    },
    {
      id: 'toggle-glow',
      category: 'Preferences',
      title: 'Toggle Tile Outer Neon Glow',
      subtitle: 'Enable or disable ambient colored tile auras',
      icon: '💡',
      action: 'toggleGlow'
    },
    {
      id: 'toggle-theme',
      category: 'Preferences',
      title: 'Toggle Light / Dark Mode',
      subtitle: 'Switch between Apple Liquid Glass light and obsidian space dark',
      icon: '🌓',
      action: 'toggleTheme'
    },
    {
      id: 'toggle-sound',
      category: 'Preferences',
      title: 'Toggle Audio Micro-Haptics',
      subtitle: 'Enable or mute synthesized Web Audio glass feedback',
      icon: '🔊',
      action: 'toggleSound'
    },
    {
      id: 'install-pwa',
      category: 'Preferences',
      title: 'Install Clarity App (PWA)',
      subtitle: 'Add to desktop dock or mobile home screen for full standalone experience',
      icon: '📲',
      action: 'installPWA'
    }
  ];

  const filtered = ACTIONS.filter(item => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      sounds.playTap();
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Handle keyboard events (ArrowUp, ArrowDown, Enter, Escape)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Open with Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open handled by parent or toggle
          onAction('openSpotlight');
        }
        return;
      }

      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        sounds.playTick();
        setSelectedIndex(prev => (prev + 1) % (filtered.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        sounds.playTick();
        setSelectedIndex(prev => (prev - 1 + (filtered.length || 1)) % (filtered.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = filtered[selectedIndex];
        if (selected) {
          executeItem(selected);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex]);

  const executeItem = (item) => {
    sounds.playTap();
    onAction(item.action);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="spotlight-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="spotlight-card" onClick={e => e.stopPropagation()}>
        {/* Spotlight Search Header */}
        <div className="spotlight-search-bar">
          <svg className="spotlight-search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="spotlight-input"
            placeholder="Type a command, search modules, or inspect tech stack..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            aria-label="Spotlight search"
          />
          <kbd className="spotlight-esc-pill" onClick={onClose}>ESC</kbd>
        </div>

        {/* Results list */}
        <div className="spotlight-results">
          {filtered.length === 0 ? (
            <div className="spotlight-empty">
              <span className="spotlight-empty-icon">🔍</span>
              <p>No matching commands found for "{query}"</p>
            </div>
          ) : (
            filtered.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  className={`spotlight-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => executeItem(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="spotlight-item-icon">{item.icon}</div>
                  <div className="spotlight-item-content">
                    <div className="spotlight-item-title-row">
                      <span className="spotlight-item-title">{item.title}</span>
                      {item.badge && <span className="spotlight-item-badge">{item.badge}</span>}
                      <span className="spotlight-item-category">{item.category}</span>
                    </div>
                    <span className="spotlight-item-subtitle">{item.subtitle}</span>
                  </div>
                  {isSelected && <span className="spotlight-enter-hint">↵</span>}
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="spotlight-footer">
          <div className="spotlight-shortcuts">
            <span><kbd>↑</kbd> <kbd>↓</kbd> Navigate</span>
            <span><kbd>↵</kbd> Select</span>
            <span><kbd>esc</kbd> Dismiss</span>
          </div>
          <span className="spotlight-brand">Clarity Spotlight</span>
        </div>
      </div>
    </div>
  );
}
