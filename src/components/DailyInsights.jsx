import { useState, useEffect } from 'react';
import { storage } from '../utils/storage';
import { generateWeeklyInsights } from '../utils/claude';

const LOADING_STEPS = [
  "Synthesizing life & wellness telemetry...",
  "Correlating sobriety streaks with focus rhythms...",
  "Processing therapy reflections & balance...",
  "Evaluating career pipeline velocity...",
  "GPT-Sol generating executive brief..."
];

export default function DailyInsights({ isCollapsed, onToggleCollapse, onHide }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [error, setError] = useState(null);
  const [lastGenerated, setLastGenerated] = useState(null);
  const [countdown, setCountdown] = useState('');

  // Cycle loading status text smoothly
  useEffect(() => {
    if (!loading) {
      setLoadingStepIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingStepIndex(prev => (prev + 1) % LOADING_STEPS.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [loading]);

  // Load cached insights on mount
  useEffect(() => {
    const loadData = async () => {
      const cached = await storage.get('weeklyInsights');
      if (cached) {
        setInsights(cached.insights);
        setLastGenerated(cached.timestamp);
      }
    };
    loadData();
  }, []);

  // Real-time countdown
  useEffect(() => {
    if (!lastGenerated) return;

    const updateCountdown = () => {
      const lastGen = new Date(lastGenerated);
      const nextAllowed = new Date(lastGen.getTime() + 24 * 60 * 60 * 1000);
      const now = new Date();
      const diff = nextAllowed - now;

      if (diff <= 0) {
        setCountdown('');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [lastGenerated]);

  // FIXED: Return data in the format claude.js expects
  const collectData = async () => {
    // Get all data from storage
    const sobriety = await storage.get('sobriety') || {};
    const applications = await storage.get('applications') || [];
    const therapy = await storage.get('therapy') || [];

    // Calculate sobriety days
    let sobrietyDays = 0;
    if (sobriety.startDate) {
      const start = new Date(sobriety.startDate);
      const today = new Date();
      sobrietyDays = Math.floor((today - start) / (1000 * 60 * 60 * 24));
    }

    // Return in the format generateWeeklyInsights expects:
    // { sobrietyDays, applications, therapySessions }
    return {
      sobrietyDays,
      applications: Array.isArray(applications) ? applications : [],
      therapySessions: Array.isArray(therapy) ? therapy : []
    };
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await collectData();
      const result = await generateWeeklyInsights(data);
      
      setInsights(result);
      setLastGenerated(new Date().toISOString());
      
      // Cache the results
      await storage.set('weeklyInsights', {
        insights: result,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('Insights generation error:', err);
      setError(err.message || 'Failed to generate insights');
    } finally {
      setLoading(false);
    }
  };

  const canGenerate = () => {
    if (!lastGenerated) return true;
    
    // Allow regeneration after 24 hours
    const lastGen = new Date(lastGenerated);
    const now = new Date();
    const hoursSince = (now - lastGen) / (1000 * 60 * 60);
    
    return hoursSince >= 24;
  };

  const formatInsights = (text) => {
    // Split by double newlines to get sections
    const sections = text.split('\n\n');
    
    return sections.map((section, i) => {
      // Check if it's a header line
      if (section.includes('What\'s Working') || section.includes('✨')) {
        return (
          <div key={i} className="insight-section">
            <h3 className="insight-header working">✨ What's Working</h3>
            <p className="insight-text">{section.replace(/\*\*.*?\*\*/g, '').replace('✨', '').trim()}</p>
          </div>
        );
      }
      
      if (section.includes('What Needs Attention') || section.includes('⚠️')) {
        return (
          <div key={i} className="insight-section">
            <h3 className="insight-header attention">⚠️ What Needs Attention</h3>
            <p className="insight-text">{section.replace(/\*\*.*?\*\*/g, '').replace('⚠️', '').trim()}</p>
          </div>
        );
      }
      
      if (section.includes('One Action') || section.includes('🎯')) {
        return (
          <div key={i} className="insight-section action">
            <h3 className="insight-header action">🎯 One Action This Week</h3>
            <p className="insight-text">{section.replace(/\*\*.*?\*\*/g, '').replace('🎯', '').trim()}</p>
          </div>
        );
      }
      
      // Skip title sections
      if (section.includes('##')) {
        return null;
      }
      
      return null;
    });
  };

  return (
    <div className={`tracker-card insights-card card-executive ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="card-header" onClick={isCollapsed ? onToggleCollapse : undefined}>
        <h2>
          <span className="card-title-group" onClick={onToggleCollapse} role="button" tabIndex={0}>
            <span>✨ Executive Intelligence</span>
          </span>
          <div className="card-header-actions" onClick={e => e.stopPropagation()}>
            {isCollapsed && (
              <span className="card-stat-pill">
                {insights ? 'Analysis Ready' : 'GPT-Sol Ready'}
              </span>
            )}
            <span className="card-badge">OpenAI GPT-6.1 Sol</span>
            <button 
              className="card-action-btn"
              onClick={onToggleCollapse}
              title={isCollapsed ? "Expand card" : "Collapse card"}
              aria-label={isCollapsed ? "Expand card" : "Collapse card"}
            >
              <svg className={`chevron-icon ${isCollapsed ? 'collapsed' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            {onHide && (
              <button 
                className="card-action-btn hide-btn"
                onClick={onHide}
                title="Hide tile from dashboard"
                aria-label="Hide tile"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              </button>
            )}
          </div>
        </h2>
      </div>

      {!isCollapsed && (
        <div className="card-collapsible-body">
          {error && (
            <div className="error-message">
              <p>⚠️ {error}</p>
              {error.includes('API key') && (
                <p className="error-hint">
                  Configure AWS Bedrock credentials in environment variables
                </p>
              )}
            </div>
          )}

          {!insights && !loading && !error && (
            <div className="insights-empty">
              <p>Generate AI-powered insights from your daily progress.</p>
              <p className="insights-hint">
                OpenAI GPT-6.1 Sol will analyze your sobriety, job search, and therapy telemetry.
              </p>
            </div>
          )}

          {loading && (
            <div className="insights-neural-loading">
              {/* Luminous Neural Thinking Orb Stage */}
              <div className="neural-orb-stage">
                <div className="neural-ring ring-1"></div>
                <div className="neural-ring ring-2"></div>
                <div className="neural-ring ring-3"></div>
                <div className="neural-spark-core">
                  <div className="neural-sparkle"></div>
                </div>
              </div>

              {/* Status Header & Animated Telemetry Steps */}
              <div className="neural-loading-meta">
                <div className="neural-badge-pill">
                  <span className="neural-pulse-dot"></span>
                  <span>GPT-SOL SYNTHESIS</span>
                </div>
                <p className="neural-loading-step">
                  {LOADING_STEPS[loadingStepIndex]}
                </p>
              </div>

              {/* Shimmering 3-Column Skeleton Preview Cards */}
              <div className="insights-skeleton-grid">
                <div className="skeleton-card skeleton-working">
                  <div className="skeleton-header-line"></div>
                  <div className="skeleton-body-line line-1"></div>
                  <div className="skeleton-body-line line-2"></div>
                  <div className="skeleton-body-line line-3"></div>
                </div>
                <div className="skeleton-card skeleton-attention">
                  <div className="skeleton-header-line"></div>
                  <div className="skeleton-body-line line-1"></div>
                  <div className="skeleton-body-line line-2"></div>
                  <div className="skeleton-body-line line-3"></div>
                </div>
                <div className="skeleton-card skeleton-action">
                  <div className="skeleton-header-line"></div>
                  <div className="skeleton-body-line line-1"></div>
                  <div className="skeleton-body-line line-2"></div>
                  <div className="skeleton-body-line line-3"></div>
                </div>
              </div>
            </div>
          )}

          {insights && (
            <div className="insights-content">
              <div className="insights-text">
                {formatInsights(insights)}
              </div>
              
              {lastGenerated && (
                <p className="insights-timestamp">
                  Generated: {new Date(lastGenerated).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </p>
              )}
            </div>
          )}

          <button 
            onClick={handleGenerate}
            disabled={loading || !canGenerate()}
            className="generate-btn"
          >
            {loading ? 'Generating...' : canGenerate() ? 'Generate Insights' : `Available in ${countdown}`}
          </button>
        </div>
      )}
    </div>
  );
}