import { useState, useEffect, useRef } from 'react';
import SobrietyTracker from './components/SobrietyTracker';
import JobSearchTracker from './components/JobSearchTracker';
import TherapyTracker from './components/TherapyTracker';
import DailyInsights from './components/DailyInsights';
import PomodoroTimer from './components/PomodoroTimer';
import TelemetryAnalytics from './components/TelemetryAnalytics';
import AtomicHabits from './components/AtomicHabits';
import ExecutiveLibrary from './components/ExecutiveLibrary';
import AuthButton from './components/AuthButton';
import VoiceAssistant from './components/VoiceAssistant';
import ThemeToggle from './components/ThemeToggle';
import VisionDock from './components/VisionDock';
import SpotlightCommand from './components/SpotlightCommand';
import ArchitectureModal from './components/ArchitectureModal';
import ShareCardModal from './components/ShareCardModal';
import PWAInstallBanner from './components/PWAInstallBanner';
import BreathingResetModal from './components/BreathingResetModal';
import BinauralFlowModal from './components/BinauralFlowModal';
import QuickMemoModal from './components/QuickMemoModal';
import UrgeSurferModal from './components/UrgeSurferModal';
import { storage } from './utils/storage';
import { loadDemoData, restoreUserData } from './utils/demoData';
import { sounds } from './utils/audioEffects';
import './App.css';

const DEFAULT_TILES = {
  sobriety: { id: 'sobriety', name: 'Sobriety Tracker', icon: '🌱', collapsed: false, hidden: false },
  jobSearch: { id: 'jobSearch', name: 'Job Pipeline', icon: '💼', collapsed: false, hidden: false },
  therapy: { id: 'therapy', name: 'Therapy Tracker', icon: '🧠', collapsed: false, hidden: false },
  atomicHabits: { id: 'atomicHabits', name: 'Atomic Habits', icon: '⚡', collapsed: false, hidden: false },
  executiveLibrary: { id: 'executiveLibrary', name: 'Executive Library', icon: '📚', collapsed: false, hidden: false },
  pomodoro: { id: 'pomodoro', name: 'Focus Rhythm', icon: '⏳', collapsed: false, hidden: false },
  dailyInsights: { id: 'dailyInsights', name: 'Executive Insights', icon: '✨', collapsed: false, hidden: false },
  telemetryAnalytics: { id: 'telemetryAnalytics', name: 'Telemetry Analytics', icon: '📈', collapsed: false, hidden: false }
};

function App() {
  const [tilesState, setTilesState] = useState(DEFAULT_TILES);
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);
  const [tileGlow, setTileGlow] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Modals state
  const [showSpotlight, setShowSpotlight] = useState(false);
  const [showArchitecture, setShowArchitecture] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);
  const [showBreathing, setShowBreathing] = useState(false);
  const [showBinaural, setShowBinaural] = useState(false);
  const [showMemo, setShowMemo] = useState(false);
  const [showUrge, setShowUrge] = useState(false);

  const menuRef = useRef(null);

  // Load layout, glow, and demo mode settings from persistent storage on mount
  useEffect(() => {
    const loadSettings = async () => {
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
        const demoStatus = await storage.get('clarity_is_demo_mode');
        if (demoStatus !== null && demoStatus !== undefined) {
          setIsDemoMode(Boolean(demoStatus));
        }
      } catch (e) {
        console.warn('Could not load dashboard settings:', e);
      }
    };
    loadSettings();
  }, []);

  // Global window triggers for executive tools
  useEffect(() => {
    const handleOpenBreathing = () => setShowBreathing(true);
    const handleOpenBinaural = () => setShowBinaural(true);
    const handleOpenMemo = () => setShowMemo(true);
    const handleOpenUrge = () => setShowUrge(true);

    window.addEventListener('clarity-open-breathing', handleOpenBreathing);
    window.addEventListener('clarity-open-binaural', handleOpenBinaural);
    window.addEventListener('clarity-open-memo', handleOpenMemo);
    window.addEventListener('clarity-open-urge', handleOpenUrge);

    return () => {
      window.removeEventListener('clarity-open-breathing', handleOpenBreathing);
      window.removeEventListener('clarity-open-binaural', handleOpenBinaural);
      window.removeEventListener('clarity-open-memo', handleOpenMemo);
      window.removeEventListener('clarity-open-urge', handleOpenUrge);
    };
  }, []);

  // Apple visionOS dynamic cursor specular highlight tracker
  useEffect(() => {
    const handleMouseMove = (e) => {
      const cards = document.querySelectorAll('.tracker-card');
      cards.forEach(card => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
      });
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const toggleTileGlow = async () => {
    sounds.playSwitch(!tileGlow);
    const nextState = !tileGlow;
    setTileGlow(nextState);
    try {
      await storage.set('clarity_tile_glow', nextState);
    } catch (e) {
      console.warn('Failed to save clarity_tile_glow:', e);
    }
  };

  // Toggle Executive Demo Data (Recruiter Persona)
  const handleToggleDemo = async () => {
    if (isDemoMode) {
      sounds.playTap();
      await restoreUserData(storage);
      setIsDemoMode(false);
    } else {
      sounds.playSuccess();
      await loadDemoData(storage);
      setIsDemoMode(true);
    }
    // Re-render and notify components
    setRefreshKey(prev => prev + 1);
    window.dispatchEvent(new Event('clarity-storage-updated'));
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
    sounds.playTap();
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
    sounds.playTap();
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
    sounds.playTap();
    const updated = {};
    Object.keys(tilesState).forEach(k => {
      updated[k] = { ...tilesState[k], collapsed: true };
    });
    updateTiles(updated);
  };

  const expandAll = () => {
    sounds.playTap();
    const updated = {};
    Object.keys(tilesState).forEach(k => {
      updated[k] = { ...tilesState[k], collapsed: false };
    });
    updateTiles(updated);
  };

  const resetAllTiles = () => {
    sounds.playTap();
    const reset = {};
    Object.keys(DEFAULT_TILES).forEach(k => {
      reset[k] = { ...DEFAULT_TILES[k], collapsed: false, hidden: false };
    });
    updateTiles(reset);
  };

  // Dispatch Spotlight Actions
  const handleSpotlightAction = (action) => {
    if (action === 'openSpotlight') {
      setShowSpotlight(true);
    } else if (action === 'toggleDemo') {
      handleToggleDemo();
    } else if (action === 'openArchitecture') {
      setShowArchitecture(true);
    } else if (action === 'openShareCard') {
      setShowShareCard(true);
    } else if (action === 'openBreathing') {
      setShowBreathing(true);
    } else if (action === 'openBinaural') {
      setShowBinaural(true);
    } else if (action === 'openMemo') {
      setShowMemo(true);
    } else if (action === 'openUrge') {
      setShowUrge(true);
    } else if (action === 'openLumen') {
      window.dispatchEvent(new Event('clarity-open-lumen'));
    } else if (action === 'toggleGlow') {
      toggleTileGlow();
    } else if (action === 'toggleSound') {
      sounds.toggleMute();
    } else if (action === 'installPWA') {
      window.dispatchEvent(new Event('clarity-trigger-pwa-install'));
    } else if (action === 'toggleTheme') {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const nextTheme = current === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', nextTheme);
      localStorage.setItem('theme', nextTheme);
    } else if (action?.startsWith('scroll:')) {
      const id = action.split(':')[1];
      const targetMap = {
        sobriety: '.card-sobriety',
        jobSearch: '.card-pipeline',
        therapy: '.card-therapy',
        atomicHabits: '.card-habits',
        executiveLibrary: '.card-library',
        pomodoro: '.card-pomodoro',
        dailyInsights: '.card-insights',
        telemetryAnalytics: '.card-telemetry'
      };
      const selector = targetMap[id];
      if (selector) {
        const el = document.querySelector(selector);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('dock-highlight-pulse');
          setTimeout(() => el.classList.remove('dock-highlight-pulse'), 1400);
        }
      }
    }
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
        <div className="header-inner">
          <div className="header-brand">
            <div className="header-logo-container">
              <img src="/clarity.svg" alt="Clarity" className="header-logo" />
            </div>
            <div className="header-title-group">
              <span className="header-title">Clarity</span>
              <span className="header-badge">PRO</span>
            </div>
          </div>
          
          <div className="header-right">
            {/* Interactive Executive Demo Persona Button (Recruiter Highlight) */}
            <button
              className={`header-pill-btn header-demo-btn ${isDemoMode ? 'active' : ''}`}
              onClick={handleToggleDemo}
              title={isDemoMode ? "Exit Demo Mode (Restore original data)" : "Load Rich Executive Demo Persona (142d streak, active offers & heatmap)"}
              aria-label="Toggle demo persona"
            >
              <span className="demo-pulse-dot" />
              <span>{isDemoMode ? 'Exit Demo' : 'Demo Persona'}</span>
            </button>

            {/* Unified Workspace & Layout Customizer Dropdown */}
            <div className="layout-controls-wrapper" ref={menuRef}>
              <button 
                className={`header-pill-btn ${showLayoutMenu ? 'active' : ''}`}
                onClick={() => { sounds.playTap(); setShowLayoutMenu(!showLayoutMenu); }}
                title="Customize dashboard modules and ambient lighting"
                aria-label="Customize dashboard workspace"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1.5"></rect>
                  <rect x="14" y="3" width="7" height="7" rx="1.5"></rect>
                  <rect x="14" y="14" width="7" height="7" rx="1.5"></rect>
                  <rect x="3" y="14" width="7" height="7" rx="1.5"></rect>
                </svg>
                <span>Modules</span>
                {hiddenCount > 0 ? (
                  <span className="header-badge-count alert">{hiddenCount}</span>
                ) : (
                  <span className="header-badge-count">{visibleCount}/{totalTiles}</span>
                )}
              </button>

              {showLayoutMenu && (
                <div className="layout-popover-menu">
                  <div className="popover-header">
                    <div>
                      <h4>Workspace Modules</h4>
                      <p className="popover-subtitle">Show, collapse, or hide dashboard tiles</p>
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
                        <span className="popover-glow-title">Tile Ambient Aura</span>
                        <p className="popover-glow-desc">Vibrant outer glass refraction glows</p>
                      </div>
                    </div>
                    <button 
                      onClick={toggleTileGlow}
                      className={`popover-glow-btn ${tileGlow ? 'active' : ''}`}
                      title="Toggle outer tile glow"
                    >
                      {tileGlow ? 'Aura: ON' : 'Aura: OFF'}
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

            <div className="header-divider" />

            {/* Header Theme Toggle */}
            <ThemeToggle />

            {/* GitHub Repository Icon */}
            <a 
              href="https://github.com/georgieslab/clarity-dashboard" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="header-icon-btn"
              title="View Clarity Dashboard on GitHub"
              aria-label="GitHub Repository"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </a>

            <AuthButton />
          </div>
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
                key={`sobriety-${refreshKey}`}
                isCollapsed={tilesState.sobriety?.collapsed}
                onToggleCollapse={() => toggleCollapse('sobriety')}
                onHide={() => toggleHide('sobriety')}
              />
            )}
            {!tilesState.jobSearch?.hidden && (
              <JobSearchTracker 
                key={`jobSearch-${refreshKey}`}
                isCollapsed={tilesState.jobSearch?.collapsed}
                onToggleCollapse={() => toggleCollapse('jobSearch')}
                onHide={() => toggleHide('jobSearch')}
              />
            )}
            {!tilesState.therapy?.hidden && (
              <TherapyTracker 
                key={`therapy-${refreshKey}`}
                isCollapsed={tilesState.therapy?.collapsed}
                onToggleCollapse={() => toggleCollapse('therapy')}
                onHide={() => toggleHide('therapy')}
              />
            )}
          </div>
        )}

        {/* Mid Telemetry Row (Atomic Habits & Executive Library) */}
        {(Boolean(!tilesState.atomicHabits?.hidden) || Boolean(!tilesState.executiveLibrary?.hidden)) && (
          <div className="mid-two-col-row">
            {!tilesState.atomicHabits?.hidden && (
              <AtomicHabits 
                key={`atomicHabits-${refreshKey}`}
                isCollapsed={tilesState.atomicHabits?.collapsed}
                onToggleCollapse={() => toggleCollapse('atomicHabits')}
                onHide={() => toggleHide('atomicHabits')}
              />
            )}
            {!tilesState.executiveLibrary?.hidden && (
              <ExecutiveLibrary 
                key={`executiveLibrary-${refreshKey}`}
                isCollapsed={tilesState.executiveLibrary?.collapsed}
                onToggleCollapse={() => toggleCollapse('executiveLibrary')}
                onHide={() => toggleHide('executiveLibrary')}
              />
            )}
          </div>
        )}

        {/* Deep Work Engine */}
        {!tilesState.pomodoro?.hidden && (
          <PomodoroTimer 
            key={`pomodoro-${refreshKey}`}
            isCollapsed={tilesState.pomodoro?.collapsed}
            onToggleCollapse={() => toggleCollapse('pomodoro')}
            onHide={() => toggleHide('pomodoro')}
          />
        )}

        {/* ChatGPT Daily Executive Intelligence */}
        {!tilesState.dailyInsights?.hidden && (
          <DailyInsights 
            key={`dailyInsights-${refreshKey}`}
            isCollapsed={tilesState.dailyInsights?.collapsed}
            onToggleCollapse={() => toggleCollapse('dailyInsights')}
            onHide={() => toggleHide('dailyInsights')}
          />
        )}

        {/* Life Velocity & Telemetry Analytics Matrix */}
        {!tilesState.telemetryAnalytics?.hidden && (
          <TelemetryAnalytics 
            key={`telemetryAnalytics-${refreshKey}`}
            isCollapsed={tilesState.telemetryAnalytics?.collapsed}
            onToggleCollapse={() => toggleCollapse('telemetryAnalytics')}
            onHide={() => toggleHide('telemetryAnalytics')}
          />
        )}
      </main>

      {/* Floating visionOS Navigation Dock */}
      <VisionDock 
        onOpenSpotlight={() => setShowSpotlight(true)}
        onOpenBreathing={() => setShowBreathing(true)}
        onOpenBinaural={() => setShowBinaural(true)}
        onOpenMemo={() => setShowMemo(true)}
        onOpenUrge={() => setShowUrge(true)}
        onOpenArchitecture={() => setShowArchitecture(true)}
        onOpenShareCard={() => setShowShareCard(true)}
        onOpenLumen={() => window.dispatchEvent(new Event('clarity-open-lumen'))}
      />

      {/* Modals & Overlays */}
      <SpotlightCommand 
        isOpen={showSpotlight}
        onClose={() => setShowSpotlight(false)}
        onAction={handleSpotlightAction}
        isDemoMode={isDemoMode}
      />

      <ArchitectureModal 
        isOpen={showArchitecture}
        onClose={() => setShowArchitecture(false)}
      />

      <ShareCardModal 
        isOpen={showShareCard}
        onClose={() => setShowShareCard(false)}
        sobrietyDays={isDemoMode ? 142 : undefined}
      />

      <BreathingResetModal 
        isOpen={showBreathing}
        onClose={() => setShowBreathing(false)}
      />

      <BinauralFlowModal 
        isOpen={showBinaural}
        onClose={() => setShowBinaural(false)}
      />

      <QuickMemoModal 
        isOpen={showMemo}
        onClose={() => setShowMemo(false)}
        onSynthesizeWithLumen={(memoText) => {
          window.dispatchEvent(new CustomEvent('clarity-ask-lumen', { 
            detail: { query: `Analyze and break down this executive note into tactical high-priority action items: "${memoText}"` } 
          }));
        }}
      />

      <UrgeSurferModal 
        isOpen={showUrge}
        onClose={() => setShowUrge(false)}
        sobrietyDays={isDemoMode ? 142 : undefined}
      />

      <VoiceAssistant />
      <PWAInstallBanner />
    </div>
  );
}

export default App;