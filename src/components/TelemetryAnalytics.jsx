import { useState, useEffect } from 'react';
import { storage } from '../utils/storage';

export default function TelemetryAnalytics({ isCollapsed, onToggleCollapse, onHide }) {
  const [activeTab, setActiveTab] = useState('chart'); // 'chart' | 'heatmap' | 'correlations'
  const [timeRange, setTimeRange] = useState('7d'); // '7d' | '14d' | '30d'
  const [telemetry, setTelemetry] = useState({
    sobrietyDays: 0,
    totalApps: 0,
    interviewsCount: 0,
    therapyCount: 0,
    focusMinutesWeek: 0,
    dailyActivity: []
  });

  useEffect(() => {
    const loadAnalyticsData = async () => {
      try {
        const sobriety = await storage.get('sobriety') || {};
        const applications = await storage.get('applications') || [];
        const therapy = await storage.get('therapy') || [];
        const pomodoroHistory = await storage.get('pomodoroHistory') || [];

        // Calculate Sobriety Days
        let sobrietyDays = 0;
        if (sobriety.startDate) {
          const start = new Date(sobriety.startDate);
          const today = new Date();
          sobrietyDays = Math.floor((today - start) / (1000 * 60 * 60 * 24));
        }

        // Applications & Interviews
        const totalApps = Array.isArray(applications) ? applications.length : 0;
        const interviewsCount = Array.isArray(applications) 
          ? applications.filter(a => a.status === 'Interview' || a.status === 'Offer').length 
          : 0;

        // Therapy Logs
        const therapyCount = Array.isArray(therapy) ? therapy.length : 0;

        // Build 7-day or 14-day activity array for SVG chart & heatmap
        const daysCount = timeRange === '30d' ? 28 : timeRange === '14d' ? 14 : 7;
        const activityMap = [];
        const todayObj = new Date();

        for (let i = daysCount - 1; i >= 0; i--) {
          const d = new Date();
          d.setDate(todayObj.getDate() - i);
          const dateStr = d.toDateString();
          const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
          const shortDate = d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });

          // Focus minutes on this day
          const dayPomo = pomodoroHistory.filter(p => new Date(p.date).toDateString() === dateStr);
          const focusMins = dayPomo.reduce((acc, curr) => acc + (curr.minutes || 0), 0);

          // Apps added on this day
          const dayApps = Array.isArray(applications)
            ? applications.filter(a => new Date(a.dateApplied || a.createdAt || Date.now()).toDateString() === dateStr).length
            : 0;

          // Intensity score (0 - 4 scale)
          let score = 0;
          if (focusMins > 0) score += 1;
          if (focusMins >= 50) score += 1;
          if (dayApps > 0) score += 1;
          if (sobrietyDays > 0) score += 1;

          activityMap.push({
            dateStr,
            dayLabel,
            shortDate,
            focusMins,
            dayApps,
            score: Math.min(score, 4)
          });
        }

        const focusMinutesWeek = activityMap.reduce((acc, curr) => acc + curr.focusMins, 0);

        setTelemetry({
          sobrietyDays,
          totalApps,
          interviewsCount,
          therapyCount,
          focusMinutesWeek,
          dailyActivity: activityMap
        });
      } catch (err) {
        console.warn('Could not load telemetry analytics:', err);
      }
    };

    loadAnalyticsData();
  }, [timeRange]);

  // Derived metrics
  const interviewRate = telemetry.totalApps > 0 
    ? Math.round((telemetry.interviewsCount / telemetry.totalApps) * 100) 
    : 0;

  const avgFocusPerDay = telemetry.dailyActivity.length > 0
    ? Math.round(telemetry.focusMinutesWeek / telemetry.dailyActivity.length)
    : 0;

  const maxFocus = Math.max(...telemetry.dailyActivity.map(d => d.focusMins), 60);

  return (
    <div className={`card card-analytics ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="card-header" onClick={onToggleCollapse} style={{ cursor: 'pointer' }}>
        <h2>
          <span className="title-left">
            <span className="card-icon">📈</span>
            <span>Telemetry Analytics</span>
          </span>
          <div className="card-header-actions" onClick={e => e.stopPropagation()}>
            {isCollapsed && (
              <span className="card-stat-pill">
                {avgFocusPerDay}m Avg Focus/Day
              </span>
            )}
            <span className="card-badge">Life Velocity Matrix</span>
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
          {/* Analytics Sub-Header Controls */}
          <div className="analytics-top-bar">
            <div className="analytics-tabs">
              <button 
                className={`analytics-tab-btn ${activeTab === 'chart' ? 'active' : ''}`}
                onClick={() => setActiveTab('chart')}
              >
                📊 Velocity Chart
              </button>
              <button 
                className={`analytics-tab-btn ${activeTab === 'heatmap' ? 'active' : ''}`}
                onClick={() => setActiveTab('heatmap')}
              >
                🟩 Consistency Matrix
              </button>
              <button 
                className={`analytics-tab-btn ${activeTab === 'correlations' ? 'active' : ''}`}
                onClick={() => setActiveTab('correlations')}
              >
                ⚡ Correlation Index
              </button>
            </div>

            <div className="analytics-range-selector">
              {['7d', '14d', '30d'].map(r => (
                <button
                  key={r}
                  className={`range-pill-btn ${timeRange === r ? 'active' : ''}`}
                  onClick={() => setTimeRange(r)}
                >
                  {r.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* TAB 1: SVG Velocity Bar & Polyline Chart */}
          {activeTab === 'chart' && (
            <div className="analytics-chart-stage">
              <div className="chart-legend">
                <div className="legend-item">
                  <span className="legend-dot focus-dot"></span>
                  <span>Focus Minutes</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot app-dot"></span>
                  <span>Applications Logged</span>
                </div>
              </div>

              <div className="svg-chart-wrapper">
                <svg viewBox="0 0 500 160" className="analytics-svg-chart">
                  {/* Grid Lines */}
                  <line x1="0" y1="30" x2="500" y2="30" stroke="var(--glass-border-subtle)" strokeDasharray="4 4" />
                  <line x1="0" y1="75" x2="500" y2="75" stroke="var(--glass-border-subtle)" strokeDasharray="4 4" />
                  <line x1="0" y1="120" x2="500" y2="120" stroke="var(--glass-border-subtle)" strokeDasharray="4 4" />

                  {/* Render Daily Activity Bars */}
                  {telemetry.dailyActivity.map((day, idx) => {
                    const stepWidth = 500 / Math.max(telemetry.dailyActivity.length, 1);
                    const x = idx * stepWidth + stepWidth / 2;
                    const barHeight = Math.max(12, Math.min(100, (day.focusMins / maxFocus) * 100));
                    const y = 130 - barHeight;

                    return (
                      <g key={day.dateStr} className="chart-bar-group">
                        {/* Gradient Bar */}
                        <rect
                          x={x - 14}
                          y={y}
                          width="28"
                          height={barHeight}
                          rx="6"
                          fill="url(#barGradient)"
                          className="analytics-bar"
                        />
                        {/* Apps Indicator Dot */}
                        {day.dayApps > 0 && (
                          <circle
                            cx={x}
                            cy={y - 10}
                            r="5"
                            fill="#ec4899"
                            stroke="#ffffff"
                            strokeWidth="1.5"
                            className="apps-indicator-pulse"
                          />
                        )}
                        {/* Day Label */}
                        <text
                          x={x}
                          y="150"
                          textAnchor="middle"
                          fill="var(--text-tertiary)"
                          fontSize="10"
                          fontWeight="600"
                        >
                          {day.dayLabel}
                        </text>
                      </g>
                    );
                  })}

                  {/* Gradient Definitions */}
                  <defs>
                    <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.3" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          )}

          {/* TAB 2: Consistency Heatmap Matrix */}
          {activeTab === 'heatmap' && (
            <div className="analytics-heatmap-stage">
              <div className="heatmap-header">
                <span className="heatmap-subtitle">Daily Telemetry Consistency Heatmap ({telemetry.dailyActivity.length} Days)</span>
                <div className="heatmap-legend">
                  <span className="legend-label">Less</span>
                  <div className="heat-box score-0"></div>
                  <div className="heat-box score-1"></div>
                  <div className="heat-box score-2"></div>
                  <div className="heat-box score-3"></div>
                  <div className="heat-box score-4"></div>
                  <span className="legend-label">More</span>
                </div>
              </div>

              <div className="heatmap-grid">
                {telemetry.dailyActivity.map((day) => (
                  <div
                    key={day.dateStr}
                    className={`heat-box score-${day.score}`}
                    title={`${day.shortDate}: ${day.focusMins}m focus • ${day.dayApps} apps`}
                  >
                    <span className="heat-box-tooltip">
                      <strong>{day.shortDate}</strong>
                      <span>{day.focusMins}m focus</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Telemetry Correlation Index */}
          {activeTab === 'correlations' && (
            <div className="analytics-correlations-stage">
              <div className="correlation-cards-grid">
                <div className="correlation-card">
                  <div className="correlation-icon">🎯</div>
                  <div className="correlation-meta">
                    <span className="correlation-title">Interview Yield Rate</span>
                    <span className="correlation-value">{interviewRate}%</span>
                  </div>
                  <p className="correlation-desc">Active interviews vs total applications ratio.</p>
                </div>

                <div className="correlation-card">
                  <div className="correlation-icon">⚡</div>
                  <div className="correlation-meta">
                    <span className="correlation-title">Focus Velocity</span>
                    <span className="correlation-value">{Math.round(telemetry.focusMinutesWeek / 60 * 10) / 10} hrs</span>
                  </div>
                  <p className="correlation-desc">Total deep work hours logged across active period.</p>
                </div>

                <div className="correlation-card">
                  <div className="correlation-icon">🛡️</div>
                  <div className="correlation-meta">
                    <span className="correlation-title">Sobriety Stability</span>
                    <span className="correlation-value">{telemetry.sobrietyDays} Days</span>
                  </div>
                  <p className="correlation-desc">Uninterrupted mindfulness & clean streak stability.</p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Metrics Footer Summary */}
          <div className="analytics-footer-summary">
            <div className="summary-pill">
              <span className="summary-label">Total Focus:</span>
              <strong className="summary-val">{telemetry.focusMinutesWeek} mins</strong>
            </div>
            <div className="summary-pill">
              <span className="summary-label">Applications:</span>
              <strong className="summary-val">{telemetry.totalApps} tracked</strong>
            </div>
            <div className="summary-pill">
              <span className="summary-label">Therapy Reflections:</span>
              <strong className="summary-val">{telemetry.therapyCount} logged</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
