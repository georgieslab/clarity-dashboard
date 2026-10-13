import { useState, useEffect } from 'react';
import { sounds } from '../utils/audioEffects';

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) {
      return;
    }

    // Check if user previously dismissed prompt recently
    const dismissedTime = localStorage.getItem('clarity_pwa_dismissed');
    if (dismissedTime && Date.now() - Number(dismissedTime) < 7 * 24 * 60 * 60 * 1000) {
      setIsDismissed(true);
    }

    // Detect iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleMobile = /iphone|ipad|ipod/.test(userAgent) && !window.MSStream;
    setIsIOS(isAppleMobile);

    // Standard Chromium install prompt listener
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // External trigger from Spotlight or Menu
    const handleExternalTrigger = () => {
      handleInstallClick();
    };
    window.addEventListener('clarity-trigger-pwa-install', handleExternalTrigger);

    // Track successful installation
    window.addEventListener('appinstalled', () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
      sounds.playMilestone();
      console.log('🎉 Clarity PWA successfully installed!');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('clarity-trigger-pwa-install', handleExternalTrigger);
    };
  }, [deferredPrompt, isIOS]);

  const handleInstallClick = async () => {
    sounds.playTap();

    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (!deferredPrompt) {
      // Fallback for browsers without direct prompt
      alert('To install Clarity: Open your browser menu (⋮ or ⋯) and select "Install Clarity" or "Add to Home screen".');
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      sounds.playMilestone();
    }
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  const handleDismiss = () => {
    sounds.playTick();
    setIsDismissed(true);
    localStorage.setItem('clarity_pwa_dismissed', Date.now().toString());
  };

  // If installed or dismissed and not showing iOS guide, render nothing
  if ((!isInstallable && !isIOS) || isDismissed) {
    if (!showIOSGuide) return null;
  }

  return (
    <>
      {/* Floating Apple Glass Install Capsule */}
      {!isDismissed && (isInstallable || isIOS) && (
        <div className="pwa-install-pill" role="banner">
          <div className="pwa-pill-content" onClick={handleInstallClick}>
            <div className="pwa-icon-box">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>
            <div className="pwa-pill-text">
              <span className="pwa-title">Install Clarity</span>
              <span className="pwa-subtitle">Standalone native app</span>
            </div>
          </div>
          <button 
            className="pwa-dismiss-btn" 
            onClick={handleDismiss}
            aria-label="Dismiss install prompt"
            title="Dismiss for 7 days"
          >
            ✕
          </button>
        </div>
      )}

      {/* iOS Add to Home Screen Instructions Modal */}
      {showIOSGuide && (
        <div className="pwa-ios-modal-overlay" onClick={() => setShowIOSGuide(false)}>
          <div className="pwa-ios-modal-card" onClick={e => e.stopPropagation()}>
            <div className="pwa-ios-modal-header">
              <div className="pwa-ios-icon-group">
                <img src="/clarity.svg" alt="Clarity" className="pwa-modal-logo" />
                <div>
                  <h4>Install on iPhone / iPad</h4>
                  <p>Add Clarity to your Home Screen for full visionOS experience</p>
                </div>
              </div>
              <button className="pwa-modal-close" onClick={() => setShowIOSGuide(false)}>✕</button>
            </div>

            <div className="pwa-ios-steps">
              <div className="pwa-step-item">
                <span className="pwa-step-badge">1</span>
                <p>Tap the <strong>Share button</strong> <span className="pwa-inline-icon">⎋</span> at the bottom of Safari.</p>
              </div>
              <div className="pwa-step-item">
                <span className="pwa-step-badge">2</span>
                <p>Scroll down and select <strong>"Add to Home Screen"</strong> <span className="pwa-inline-icon">⊞</span>.</p>
              </div>
              <div className="pwa-step-item">
                <span className="pwa-step-badge">3</span>
                <p>Tap <strong>"Add"</strong> in the top right. Clarity will launch full-screen with offline capabilities!</p>
              </div>
            </div>

            <button className="pwa-ios-done-btn" onClick={() => { sounds.playTap(); setShowIOSGuide(false); }}>
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
}
