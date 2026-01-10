import { useState, useEffect, useRef } from 'react';
import { storage } from '../utils/storage';

export default function SobrietyTracker() {
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
    <div className="tracker-card">
      <h2>Sobriety</h2>
      
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
  );
}