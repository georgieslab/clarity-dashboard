import { useState, useEffect } from 'react';
import { storage } from '../utils/storage';
import { generateWeeklyInsights } from '../utils/claude';

export default function WeeklyInsights() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastGenerated, setLastGenerated] = useState(null);

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

  const collectData = async () => {
    // Get all data from storage
    const sobriety = await storage.get('sobriety') || {};
    const applications = await storage.get('applications') || [];
    const therapy = await storage.get('therapy') || [];

    // Calculate sobriety days
    let daysClean = 0;
    if (sobriety.startDate) {
      const start = new Date(sobriety.startDate);
      const today = new Date();
      daysClean = Math.floor((today - start) / (1000 * 60 * 60 * 24));
    }

    // Get recent applications (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentApps = applications.filter(a => new Date(a.dateApplied) >= weekAgo);

    // Get therapy stats
    const today = new Date();
    const thisWeek = therapy.filter(s => {
      const sessionDate = new Date(s.date);
      return sessionDate >= weekAgo;
    });

    // Extract recent topics
    const recentTopics = thisWeek
      .filter(s => s.topics)
      .flatMap(s => s.topics.split(',').map(t => t.trim()))
      .slice(0, 5);

    return {
      sobriety: {
        daysClean,
        startDate: sobriety.startDate
      },
      jobSearch: {
        total: applications.length,
        applied: applications.filter(a => a.status === 'applied').length,
        interviewed: applications.filter(a => a.status === 'interviewed').length,
        rejected: applications.filter(a => a.status === 'rejected').length,
        offered: applications.filter(a => a.status === 'offered').length,
        recent: recentApps
      },
      therapy: {
        total: therapy.length,
        thisWeek: thisWeek.length,
        thisMonth: therapy.filter(s => {
          const sessionDate = new Date(s.date);
          return sessionDate.getMonth() === today.getMonth() && 
                 sessionDate.getFullYear() === today.getFullYear();
        }).length,
        recentTopics
      }
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
      setError(err.message);
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
      if (section.includes('**What\'s Working**')) {
        return (
          <div key={i} className="insight-section">
            <h3 className="insight-header working">✨ What's Working</h3>
            <p className="insight-text">{section.replace('**What\'s Working**', '').trim()}</p>
          </div>
        );
      }
      
      if (section.includes('**What Needs Attention**')) {
        return (
          <div key={i} className="insight-section">
            <h3 className="insight-header attention">⚠️ What Needs Attention</h3>
            <p className="insight-text">{section.replace('**What Needs Attention**', '').trim()}</p>
          </div>
        );
      }
      
      if (section.includes('**One Action This Week**')) {
        return (
          <div key={i} className="insight-section action">
            <h3 className="insight-header action">🎯 One Action This Week</h3>
            <p className="insight-text">{section.replace('**One Action This Week**', '').trim()}</p>
          </div>
        );
      }
      
      // Title or other text
      if (section.includes('##')) {
        return null; // Skip the title
      }
      
      return null;
    });
  };

  return (
    <div className="tracker-card insights-card">
      <h2>Weekly Insights</h2>

      {error && (
        <div className="error-message">
          <p>⚠️ {error}</p>
          {error.includes('API key') && (
            <p className="error-hint">
              Add your Anthropic API key to <code>.env</code> file:<br/>
              <code>VITE_ANTHROPIC_API_KEY=your_key_here</code>
            </p>
          )}
        </div>
      )}

      {!insights && !loading && !error && (
        <div className="insights-empty">
          <p>Generate AI-powered insights from your weekly data.</p>
          <p className="insights-hint">
            Claude will analyze your sobriety, job search, and therapy progress.
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
        {loading ? 'Generating...' : canGenerate() ? 'Generate Insights' : 'Available in 24h'}
      </button>
    </div>
  );
}