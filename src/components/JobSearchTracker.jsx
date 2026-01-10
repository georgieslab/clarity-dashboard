import { useState, useEffect, useRef } from 'react';
import { storage } from '../utils/storage';

export default function JobSearchTracker() {
  const [applications, setApplications] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    company: '',
    role: '',
    status: 'applied'
  });
  const isInitialMount = useRef(true);

  // Load applications from storage
  useEffect(() => {
    const loadData = async () => {
      const saved = await storage.get('applications');
      if (saved && Array.isArray(saved)) {
        setApplications(saved);
      }
      isInitialMount.current = false;
    };
    loadData();
  }, []);

  // Save applications only after initial load
  useEffect(() => {
    if (!isInitialMount.current) {
      storage.set('applications', applications);
    }
  }, [applications]);

  const handleAddApplication = () => {
    if (!formData.company || !formData.role) return;

    const newApp = {
      id: Date.now(),
      company: formData.company,
      role: formData.role,
      status: formData.status,
      dateApplied: new Date().toISOString().split('T')[0]
    };

    setApplications([newApp, ...applications]);
    setFormData({ company: '', role: '', status: 'applied' });
    setShowForm(false);
  };

  const handleUpdateStatus = (id, newStatus) => {
    setApplications(applications.map(app => 
      app.id === id ? { ...app, status: newStatus } : app
    ));
  };

  const handleDelete = (id) => {
    if (confirm('Delete this application?')) {
      setApplications(applications.filter(app => app.id !== id));
    }
  };

  // Calculate stats
  const stats = {
    total: applications.length,
    applied: applications.filter(a => a.status === 'applied').length,
    interviewed: applications.filter(a => a.status === 'interviewed').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
    offered: applications.filter(a => a.status === 'offered').length
  };

  return (
    <div className="tracker-card">
      <h2>Job Search</h2>

      <div className="job-stats">
        <div className="stat">
          <span className="stat-number">{stats.total}</span>
          <span className="stat-label">Total</span>
        </div>
        <div className="stat">
          <span className="stat-number">{stats.applied}</span>
          <span className="stat-label">Waiting</span>
        </div>
        <div className="stat">
          <span className="stat-number">{stats.interviewed}</span>
          <span className="stat-label">Interview</span>
        </div>
        <div className="stat">
          <span className="stat-number">{stats.offered}</span>
          <span className="stat-label">Offers</span>
        </div>
      </div>

      <button 
        onClick={() => setShowForm(!showForm)}
        className="add-btn"
      >
        {showForm ? 'Cancel' : '+ Add Application'}
      </button>

      {showForm && (
        <div className="job-form">
          <input
            type="text"
            placeholder="Company"
            value={formData.company}
            onChange={(e) => setFormData({...formData, company: e.target.value})}
          />
          <input
            type="text"
            placeholder="Role"
            value={formData.role}
            onChange={(e) => setFormData({...formData, role: e.target.value})}
          />
          <button onClick={handleAddApplication} className="submit-btn">
            Add
          </button>
        </div>
      )}

      <div className="applications-list">
        {applications.length === 0 ? (
          <p className="empty-state">No applications yet. Start applying!</p>
        ) : (
          applications.map(app => (
            <div key={app.id} className="application-item">
              <div className="app-info">
                <h3>{app.company}</h3>
                <p>{app.role}</p>
                <span className="date">{app.dateApplied}</span>
              </div>
              <div className="app-actions">
                <select 
                  value={app.status}
                  onChange={(e) => handleUpdateStatus(app.id, e.target.value)}
                  className="status-select"
                >
                  <option value="applied">Applied</option>
                  <option value="interviewed">Interviewed</option>
                  <option value="rejected">Rejected</option>
                  <option value="offered">Offered</option>
                </select>
                <button 
                  onClick={() => handleDelete(app.id)}
                  className="delete-btn"
                >
                  ×
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}