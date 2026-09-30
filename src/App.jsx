import { useState, useEffect, useRef } from 'react';
import SobrietyTracker from './components/SobrietyTracker';
import JobSearchTracker from './components/JobSearchTracker';
import TherapyTracker from './components/TherapyTracker';
import DailyInsights from './components/DailyInsights';
import PomodoroTimer from './components/PomodoroTimer';
import TelemetryAnalytics from './components/TelemetryAnalytics';
import AuthButton from './components/AuthButton';
import VoiceAssistant from './components/VoiceAssistant';
import ThemeToggle from './components/ThemeToggle';
import { storage } from './utils/storage';
import './App.css';

const DEFAULT_TILES = {
  sobriety: { id: 'sobriety', name: 'Sobriety Tracker', icon: '🌱', collapsed: false, hidden: false },
  jobSearch: { id: 'jobSearch', name: 'Job Pipeline', icon: '💼', collapsed: false, hidden: false },
  therapy: { id: 'therapy', name: 'Therapy Tracker', icon: '🧠', collapsed: false, hidden: false },
  pomodoro: { id: 'pomodoro', name: 'Focus Rhythm', icon: '⏳', collapsed: false, hidden: false },
  dailyInsights: { id: 'dailyInsights', name: 'Executive Insights', icon: '✨', collapsed: false, hidden: false },
  telemetryAnalytics: { id: 'telemetryAnalytics', name: 'Telemetry Analytics', icon: '📈', collapsed: false, hidden: false }
};

function App() {
  const [tilesState, setTilesState] = useState(DEFAULT_TILES);
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);
  const [tileGlow, setTileGlow] = useState(true);
  const menuRef = useRef(null);

  // Load layout and tile glow settings from persistent storage on mount
  useEffect(() => {
    const loadLayout = async () => {
      try {
        const saved = await storage.get('clarity_tiles_layout');
        if (saved && typeof saved === 'object') {
          setTilesState(prev => ({
            ...prev,
            ...saved
          }));
        }
        const savedGlow = await storage.get('clarity_tile_glow');
        if (savedGlow !== null && savedGlow !== undefined) {
          setTileGlow(Boolean(savedGlow));
        }
      } catch (e) {
        console.warn('Could not load dashboard settings:', e);
      }
    };
    loadLayout();
  }, []);

  const toggleTileGlow = async () => {
    const nextState = !tileGlow;
    setTileGlow(nextState);
    try {
      await storage.set('clarity_tile_glow', nextState);
    } catch (e) {
      console.warn('Failed to save clarity_tile_glow:', e);
    }
  };

  // Close layout popover when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowLayoutMenu(false);
      }
    };
    if (showLayoutMenu) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showLayoutMenu]);

  // Persist tiles configuration changes
  const updateTiles = async (newState) => {
    setTilesState(newState);
    try {
      await storage.set('clarity_tiles_layout', newState);
    } catch (e) {
      console.warn('Failed to save clarity_tiles_layout:', e);
    }
  };

  const toggleCollapse = (tileId) => {
    const updated = {
      ...tilesState,
      [tileId]: {
        ...tilesState[tileId],
        collapsed: !tilesState[tileId]?.collapsed
      }
    };
    updateTiles(updated);
  };

  const toggleHide = (tileId) => {
    const updated = {
      ...tilesState,
      [tileId]: {
        ...tilesState[tileId],
        hidden: !tilesState[tileId]?.hidden
      }
    };
    updateTiles(updated);
  };

  const collapseAll = () => {
    const updated = {};
    Object.keys(tilesState).forEach(k => {
      updated[k] = { ...tilesState[k], collapsed: true };
    });
    updateTiles(updated);
  };

  const expandAll = () => {
    const updated = {};
    Object.keys(tilesState).forEach(k => {
      updated[k] = { ...tilesState[k], collapsed: false };
    });
    updateTiles(updated);
  };

  const resetAllTiles = () => {
    const reset = {};
    Object.keys(DEFAULT_TILES).forEach(k => {
      reset[k] = { ...DEFAULT_TILES[k], collapsed: false, hidden: false };
    });
    updateTiles(reset);
  };

  const totalTiles = Object.keys(tilesState).length;
  const hiddenTiles = Object.values(tilesState).filter(t => t.hidden);
  const hiddenCount = hiddenTiles.length;
  const visibleCount = totalTiles - hiddenCount;

  const hasTopRowVisible = !tilesState.sobriety?.hidden || !tilesState.jobSearch?.hidden || !tilesState.therapy?.hidden;

  return (
    <div className={`dashboard ${tileGlow ? 'tile-glow-enabled' : 'tile-glow-disabled'}`}>
      {/* Apple Fluid Ambient Gradient Canvas */}
      <div className="ambient-background" aria-hidden="true">
        <div className="ambient-orb orb-1"></div>
        <div className="ambient-orb orb-2"></div>
        <div className="ambient-orb orb-3"></div>
        <div className="ambient-orb orb-4"></div>
      </div>

      <header>
        <div className="header-left">
          <div className="logo-title">
            <div className="logo-container">
              <img src="/clarity.svg" alt="Clarity" className="logo" />
            </div>
            <div className="brand-text">
              <h1>
                Clarity <span className="brand-badge">PRO</span>
              </h1>
            </div>
          </div>
          <p>Executive life & growth telemetry</p>
        </div>
        
        <div className="header-right">
          {/* Quick Tile Aura Glow Toggle Button */}
          <button 
            className={`glow-toggle-btn ${tileGlow ? 'active' : ''}`}
            onClick={toggleTileGlow}
            title={tileGlow ? "Tile Outer Glow: ON (Click to turn off)" : "Tile Outer Glow: OFF (Click to turn on)"}
            aria-label="Toggle tile outer glow"
          >
            <span className="glow-icon-dot"></span>
            <span>Aura {tileGlow ? 'ON' : 'OFF'}</span>
          </button>

          {/* Tiles Customizer & Layout Manager Dropdown */}
          <div className="layout-controls-wrapper" ref={menuRef}>
            <button 
              className={`layout-menu-btn ${showLayoutMenu ? 'active' : ''}`}
              onClick={() => setShowLayoutMenu(!showLayoutMenu)}
              title="Customize dashboard tiles (collapse or hide)"
              aria-label="Customize dashboard tiles"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              <span>Tiles ({visibleCount}/{totalTiles})</span>
              {hiddenCount > 0 && <span className="layout-badge-alert">{hiddenCount}</span>}
            </button>

            {showLayoutMenu && (
              <div className="layout-popover-menu">
                <div className="popover-header">
                  <div>
                    <h4>Dashboard Tiles</h4>
                    <p className="popover-subtitle">Expand, collapse, or hide modules</p>
                  </div>
                  <div className="popover-quick-actions">
                    <button onClick={collapseAll} className="popover-action-link">Collapse All</button>
                    <span className="popover-divider">•</span>
                    <button onClick={expandAll} className="popover-action-link">Expand All</button>
                  </div>
                </div>

                <div className="popover-tiles-list">
                  {Object.values(tilesState).map(tile => (
                    <div key={tile.id} className="popover-tile-row">
                      <div className="popover-tile-info">
                        <span className="popover-tile-icon">{tile.icon}</span>
                        <span className={`popover-tile-name ${tile.hidden ? 'muted' : ''}`}>{tile.name}</span>
                      </div>
                      <div className="popover-tile-toggles">
                        {!tile.hidden && (
                          <button 
                            className={`popover-btn-pill ${tile.collapsed ? 'collapsed' : 'expanded'}`}
                            onClick={() => toggleCollapse(tile.id)}
                            title={tile.collapsed ? "Expand tile" : "Collapse tile"}
                          >
                            {tile.collapsed ? 'Collapsed' : 'Expanded'}
                          </button>
                        )}
                        <button 
                          className={`popover-visibility-btn ${tile.hidden ? 'hidden' : 'visible'}`}
                          onClick={() => toggleHide(tile.id)}
                          title={tile.hidden ? "Show on dashboard" : "Hide from dashboard"}
                        >
                          {tile.hidden ? 'Show' : 'Hide'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Outer Glow Setting in Popover */}
                <div className="popover-glow-card">
                  <div className="popover-glow-info">
                    <span className="popover-glow-badge">✨</span>
                    <div>
                      <span className="popover-glow-title">Tile Outer Glow</span>
                      <p className="popover-glow-desc">Vibrant auras for Pipeline and tiles</p>
                    </div>
                  </div>
                  <button 
                    onClick={toggleTileGlow}
                    className={`popover-glow-btn ${tileGlow ? 'active' : ''}`}
                    title="Toggle outer tile glow"
                  >
                    {tileGlow ? 'Glow: ON' : 'Glow: OFF'}
                  </button>
                </div>

                {hiddenCount > 0 && (
                  <button onClick={resetAllTiles} className="popover-restore-all-btn">
                    Restore All Hidden Tiles
                  </button>
                )}
              </div>
            )}
          </div>

          <a 
            href="https://github.com/georgieslab/clarity-dashboard" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="github-header-btn"
            title="View Clarity Dashboard on GitHub"
            aria-label="GitHub Repository"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            <span>GitHub</span>
          </a>

          <AuthButton />
        </div>
      </header>

      <main>
        {/* Notice banner if any tiles are currently hidden */}
        {hiddenCount > 0 && (
          <div className="hidden-tiles-banner">
            <span>💡 {hiddenCount} tile{hiddenCount > 1 ? 's are' : ' is'} currently hidden.</span>
            <button onClick={resetAllTiles} className="banner-restore-btn">
              Show All
            </button>
          </div>
        )}

        {/* Top telemetry row (Sobriety, Pipeline, Therapy) */}
        {hasTopRowVisible && (
          <div className="top-row">
            {!tilesState.sobriety?.hidden && (
              <SobrietyTracker 
                isCollapsed={tilesState.sobriety?.collapsed}
                onToggleCollapse={() => toggleCollapse('sobriety')}
                onHide={() => toggleHide('sobriety')}
              />
            )}
            {!tilesState.jobSearch?.hidden && (
              <JobSearchTracker 
                isCollapsed={tilesState.jobSearch?.collapsed}
                onToggleCollapse={() => toggleCollapse('jobSearch')}
                onHide={() => toggleHide('jobSearch')}
              />
            )}
            {!tilesState.therapy?.hidden && (
              <TherapyTracker 
                isCollapsed={tilesState.therapy?.collapsed}
                onToggleCollapse={() => toggleCollapse('therapy')}
                onHide={() => toggleHide('therapy')}
              />
            )}
          </div>
        )}

        {/* Deep Work Engine */}
        {!tilesState.pomodoro?.hidden && (
          <PomodoroTimer 
            isCollapsed={tilesState.pomodoro?.collapsed}
            onToggleCollapse={() => toggleCollapse('pomodoro')}
            onHide={() => toggleHide('pomodoro')}
          />
        )}

        {/* ChatGPT Daily Executive Intelligence */}
        {!tilesState.dailyInsights?.hidden && (
          <DailyInsights 
            isCollapsed={tilesState.dailyInsights?.collapsed}
            onToggleCollapse={() => toggleCollapse('dailyInsights')}
            onHide={() => toggleHide('dailyInsights')}
          />
        )}

        {/* Life Velocity & Telemetry Analytics Matrix */}
        {!tilesState.telemetryAnalytics?.hidden && (
          <TelemetryAnalytics 
            isCollapsed={tilesState.telemetryAnalytics?.collapsed}
            onToggleCollapse={() => toggleCollapse('telemetryAnalytics')}
            onHide={() => toggleHide('telemetryAnalytics')}
          />
        )}
      </main>

      <VoiceAssistant />
      <ThemeToggle />
    </div>
  );
}

export default App;