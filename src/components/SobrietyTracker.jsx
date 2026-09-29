import { useState, useEffect, useRef } from 'react';
import { storage } from '../utils/storage';

export default function SobrietyTracker({ isCollapsed, onToggleCollapse, onHide }) {
  const [startDate, setStartDate] = useState(null);
  const [daysClean, setDaysClean] = useState(0);
  const [tempDate, setTempDate] = useState('');
  const isInitialMount = useRef(true);

  // Load from storage ONCE on mount
  useEffect(() => {
    const loadData = async () => {
      const saved = await storage.get('sobriety');
      if (saved && saved.startDate) {
        setStartDate(saved.startDate);
      }
      isInitialMount.current = false;
    };
    loadData();
  }, []);

  // Calculate days whenever startDate changes
  useEffect(() => {
    if (startDate) {
      const start = new Date(startDate);
      const today = new Date();
      const days = Math.floor((today - start) / (1000 * 60 * 60 * 24));
      setDaysClean(days);
    }
  }, [startDate]);

  // Save to storage only after initial load
  useEffect(() => {
    if (!isInitialMount.current && startDate) {
      storage.set('sobriety', { startDate });
    }
  }, [startDate]);

  const handleSetDate = () => {
    if (tempDate) {
      setStartDate(tempDate);
    }
  };

  const handleReset = async () => {
    if (confirm('Reset sobriety counter? This cannot be undone.')) {
      setStartDate(null);
      setDaysClean(0);
      setTempDate('');
      await storage.remove('sobriety');
    }
  };

  return (
    <div className={`tracker-card card-sobriety ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="card-header" onClick={isCollapsed ? onToggleCollapse : undefined}>
        <h2>
          <span className="card-title-group" onClick={onToggleCollapse} role="button" tabIndex={0}>
            <span>🌱 Sobriety</span>
          </span>
          <div className="card-header-actions" onClick={e => e.stopPropagation()}>
            {isCollapsed && (
              <span className="card-stat-pill">
                {startDate ? `${daysClean}d clean` : 'Not set'}
              </span>
            )}
            <span className="card-badge">Daily Streak</span>
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
          {!startDate ? (
            <div className="setup">
              <p>Set your start date:</p>
              <input 
                type="date" 
                value={tempDate}
                onChange={(e) => setTempDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
              <button 
                onClick={handleSetDate}
                className="set-btn"
                disabled={!tempDate}
              >
                Set Date
              </button>
            </div>
          ) : (
            <div className="stats">
              <div className="big-number">
                <span className="days">{daysClean}</span>
                <span className="label">days clean</span>
              </div>
              
              <div className="milestones">
                {daysClean >= 7 && <span className="milestone">✓ 1 week</span>}
                {daysClean >= 30 && <span className="milestone">✓ 1 month</span>}
                {daysClean >= 60 && <span className="milestone">✓ 60 days</span>}
                {daysClean >= 90 && <span className="milestone">✓ 90 days</span>}
                {daysClean >= 180 && <span className="milestone">✓ 6 months</span>}
                {daysClean >= 365 && <span className="milestone">✓ 1 YEAR</span>}
              </div>

              <button onClick={handleReset} className="reset-btn">
                Reset Counter
              </button>
              
              <p className="start-date">
                Started: {new Date(startDate).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}