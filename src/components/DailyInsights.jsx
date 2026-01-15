import { useState, useEffect } from 'react';
import { storage } from '../utils/storage';
import { generateWeeklyInsights } from '../utils/claude';

export default function DailyInsights() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastGenerated, setLastGenerated] = useState(null);
  const [countdown, setCountdown] = useState('');

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
    <div className="tracker-card insights-card">
      <h2>💡 Daily Insights</h2>

      {error && (
        <div className="error-message">
          <p>⚠️ {error}</p>
          {error.includes('API key') && (
            <p className="error-hint">
              Add your Anthropic API key to environment variables
            </p>
          )}
        </div>
      )}

      {!insights && !loading && !error && (
        <div className="insights-empty">
          <p>Generate AI-powered insights from your daily progress.</p>
          <p className="insights-hint">
            Claude will analyze your sobriety, job search, and therapy data.
          </p>
        </div>
      )}

      {loading && (
        <div className="insights-loading">
          <div className="loader"></div>
          <p>Analyzing your data...</p>
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
  );
}