import { useState, useEffect } from 'react';
import { sounds } from '../utils/audioEffects';
import { storage } from '../utils/storage';

export default function ShareCardModal({ 
  isOpen, 
  onClose
}) {
  const [copied, setCopied] = useState(false);
  const [metrics, setMetrics] = useState({
    sobrietyDays: 142,
    focusHours: 24,
    interviewCount: 2
  });

  useEffect(() => {
    if (!isOpen) return;

    const loadLiveMetrics = async () => {
      try {
        const [sobriety, apps, pomo] = await Promise.all([
          storage.get('sobriety').then(r => r || {}),
          storage.get('applications').then(r => r || []),
          storage.get('pomodoroHistory').then(r => r || [])
        ]);

        let days = 0;
        if (sobriety.startDate) {
          const start = new Date(sobriety.startDate);
          const diff = Date.now() - start.getTime();
          days = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
        }

        const interviews = Array.isArray(apps) 
          ? apps.filter(a => a.status === 'Interview' || a.status === 'Offer').length 
          : 0;

        // Last 7 days focus minutes
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const recentPomo = Array.isArray(pomo)
          ? pomo.filter(p => new Date(p.date).getTime() >= sevenDaysAgo)
          : [];
        const totalMins = recentPomo.reduce((acc, curr) => acc + (curr.minutes || 0), 0);
        const hours = Math.round(totalMins / 60);

        setMetrics({
          sobrietyDays: days,
          focusHours: hours,
          interviewCount: interviews
        });
      } catch (err) {
        console.warn('Failed to load metrics for share card:', err);
      }
    };

    loadLiveMetrics();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopySummary = async () => {
    sounds.playSuccess();
    const text = `🔮 Clarity Executive Telemetry Report\n🌱 Sobriety Streak: ${metrics.sobrietyDays} Days Clean\n⏳ Focus Velocity: ${metrics.focusHours} Hours Logged this week\n💼 Active Pipeline: ${metrics.interviewCount} Active Interviews\n✨ Built with Apple visionOS Design System`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch (e) {
      console.warn('Clipboard write failed:', e);
    }
  };

  return (
    <div className="share-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="share-modal-card" onClick={e => e.stopPropagation()}>
        <header className="share-modal-header">
          <div>
            <div className="share-badge-pill">✨ Portfolio Telemetry Snapshot</div>
            <h3>Executive Metric Card</h3>
          </div>
          <button 
            className="arch-close-btn" 
            onClick={() => { sounds.playTap(); onClose(); }}
            aria-label="Close share modal"
          >
            ✕
          </button>
        </header>

        {/* The Card Preview */}
        <div className="share-card-preview-wrapper">
          <div className="share-glass-card">
            <div className="share-card-top">
              <div className="share-logo-badge">
                <img src="/clarity.svg" alt="Clarity" className="share-logo-img" />
                <span className="share-logo-name">Clarity PRO</span>
              </div>
              <span className="share-date-stamp">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>

            <div className="share-card-hero">
              <div className="share-streak-block">
                <span className="share-streak-num">{metrics.sobrietyDays}</span>
                <span className="share-streak-label">Days Clean & Focused</span>
              </div>
              <div className="share-badge-ring">
                <span>🌱 Milestone Unlocked</span>
              </div>
            </div>

            <div className="share-card-stats-row">
              <div className="share-stat-box">
                <span className="share-stat-val">{metrics.focusHours}h</span>
                <span className="share-stat-name">Focus Output</span>
              </div>
              <div className="share-stat-box">
                <span className="share-stat-val">{metrics.interviewCount}</span>
                <span className="share-stat-name">Active Interviews</span>
              </div>
              <div className="share-stat-box">
                <span className="share-stat-val">94%</span>
                <span className="share-stat-name">Velocity Index</span>
              </div>
            </div>

            <div className="share-card-footer">
              <span className="share-footer-tag">visionOS Spatial Telemetry</span>
              <span className="share-footer-author">github.com/georgieslab/clarity-dashboard</span>
            </div>
          </div>
        </div>

        <footer className="share-modal-actions">
          <button 
            className={`share-copy-btn ${copied ? 'copied' : ''}`}
            onClick={handleCopySummary}
          >
            {copied ? '✓ Telemetry Copied to Clipboard!' : '📋 Copy Telemetry Snapshot'}
          </button>
          <button 
            className="share-done-btn"
            onClick={() => { sounds.playTap(); onClose(); }}
          >
            Done
          </button>
        </footer>
      </div>
    </div>
  );
}
