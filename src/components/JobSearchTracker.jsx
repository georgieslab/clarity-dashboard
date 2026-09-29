import { useState, useEffect, useRef } from 'react';
import { storage } from '../utils/storage';

export default function JobSearchTracker({ isCollapsed, onToggleCollapse, onHide }) {
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
    <div className={`tracker-card ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="card-header" onClick={isCollapsed ? onToggleCollapse : undefined}>
        <h2>
          <span className="card-title-group" onClick={onToggleCollapse} role="button" tabIndex={0}>
            <span>💼 Pipeline</span>
          </span>
          <div className="card-header-actions" onClick={e => e.stopPropagation()}>
            {isCollapsed && (
              <span className="card-stat-pill">
                {stats.total} tracked {stats.interviewed > 0 ? `• ${stats.interviewed} int.` : ''}
              </span>
            )}
            <span className="card-badge">Career Track</span>
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
      )}
    </div>
  );
}