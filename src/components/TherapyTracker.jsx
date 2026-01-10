import { useState, useEffect, useRef } from 'react';
import { storage } from '../utils/storage';

export default function TherapyTracker() {
  const [sessions, setSessions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    topics: '',
    notes: '',
    feeling: 'neutral'
  });
  const isInitialMount = useRef(true);

  // Load sessions from storage
  useEffect(() => {
    const loadData = async () => {
      const saved = await storage.get('therapy');
      if (saved && Array.isArray(saved)) {
        setSessions(saved);
      }
      isInitialMount.current = false;
    };
    loadData();
  }, []);

  // Save sessions only after initial load
  useEffect(() => {
    if (!isInitialMount.current) {
      storage.set('therapy', sessions);
    }
  }, [sessions]);

  const handleAddSession = () => {
    if (!formData.date) return;

    const newSession = {
      id: Date.now(),
      date: formData.date,
      topics: formData.topics,
      notes: formData.notes,
      feeling: formData.feeling
    };

    setSessions([newSession, ...sessions]);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      topics: '',
      notes: '',
      feeling: 'neutral'
    });
    setShowForm(false);
  };

  const handleDelete = (id) => {
    if (confirm('Delete this session?')) {
      setSessions(sessions.filter(s => s.id !== id));
    }
  };

  // Calculate stats
  const today = new Date();
  const thisMonth = sessions.filter(s => {
    const sessionDate = new Date(s.date);
    return sessionDate.getMonth() === today.getMonth() && 
           sessionDate.getFullYear() === today.getFullYear();
  }).length;

  const thisWeek = sessions.filter(s => {
    const sessionDate = new Date(s.date);
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    return sessionDate >= weekAgo;
  }).length;

  return (
    <div className="tracker-card">
      <h2>Therapy</h2>

      <div className="therapy-stats">
        <div className="stat">
          <span className="stat-number">{sessions.length}</span>
          <span className="stat-label">Total</span>
        </div>
        <div className="stat">
          <span className="stat-number">{thisMonth}</span>
          <span className="stat-label">This Month</span>
        </div>
        <div className="stat">
          <span className="stat-number">{thisWeek}</span>
          <span className="stat-label">This Week</span>
        </div>
      </div>

      <button 
        onClick={() => setShowForm(!showForm)}
        className="add-btn"
      >
        {showForm ? 'Cancel' : '+ Add Session'}
      </button>

      {showForm && (
        <div className="therapy-form">
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({...formData, date: e.target.value})}
            max={new Date().toISOString().split('T')[0]}
          />
          
          <input
            type="text"
            placeholder="Topics discussed (comma separated)"
            value={formData.topics}
            onChange={(e) => setFormData({...formData, topics: e.target.value})}
          />

          <textarea
            placeholder="Notes, insights, breakthroughs..."
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            rows="3"
          />

          <select
            value={formData.feeling}
            onChange={(e) => setFormData({...formData, feeling: e.target.value})}
          >
            <option value="breakthrough">Breakthrough</option>
            <option value="helpful">Helpful</option>
            <option value="neutral">Neutral</option>
            <option value="difficult">Difficult</option>
            <option value="heavy">Heavy</option>
          </select>

          <button onClick={handleAddSession} className="submit-btn">
            Save Session
          </button>
        </div>
      )}

      <div className="sessions-list">
        {sessions.length === 0 ? (
          <p className="empty-state">No sessions logged yet.</p>
        ) : (
          sessions.map(session => (
            <div key={session.id} className={`session-item feeling-${session.feeling}`}>
              <div className="session-header">
                <span className="session-date">
                  {new Date(session.date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
                <span className={`feeling-badge ${session.feeling}`}>
                  {session.feeling}
                </span>
                <button 
                  onClick={() => handleDelete(session.id)}
                  className="delete-btn-small"
                >
                  ×
                </button>
              </div>
              
              {session.topics && (
                <div className="session-topics">
                  {session.topics.split(',').map((topic, i) => (
                    <span key={i} className="topic-tag">
                      {topic.trim()}
                    </span>
                  ))}
                </div>
              )}
              
              {session.notes && (
                <p className="session-notes">{session.notes}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}