import { useState, useEffect } from 'react';
import { storage } from '../utils/storage';
import { sounds } from '../utils/audioEffects';

export default function TelemetryAnalytics({ isCollapsed, onToggleCollapse, onHide }) {
  const [activeTab, setActiveTab] = useState('chart'); // 'chart' | 'heatmap' | 'correlations'
  const [timeRange, setTimeRange] = useState('7d'); // '7d' | '14d' | '30d'
  const [hoveredPoint, setHoveredPoint] = useState(null);
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
        const [sobriety, applications, therapy, pomodoroHistory] = await Promise.all([
          storage.get('sobriety').then(res => res || {}),
          storage.get('applications').then(res => res || []),
          storage.get('therapy').then(res => res || []),
          storage.get('pomodoroHistory').then(res => res || [])
        ]);

        // Calculate Sobriety Days
        let sobrietyDays = 0;
        if (sobriety.startDate) {
          const start = new Date(sobriety.startDate);
          const today = new Date();
          sobrietyDays = Math.max(0, Math.floor((today - start) / (1000 * 60 * 60 * 24)));
        }

        // Applications & Interviews
        const totalApps = Array.isArray(applications) ? applications.length : 0;
        const interviewsCount = Array.isArray(applications) 
          ? applications.filter(a => a.status === 'Interview' || a.status === 'Offer').length 
          : 0;

        // Therapy Logs
        const therapyCount = Array.isArray(therapy) ? therapy.length : 0;

        // Build 7-day, 14-day, or 28-day activity array for SVG chart & heatmap
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

  const totalFocusHours = Math.round((telemetry.focusMinutesWeek / 60) * 10) / 10;
  const maxFocus = Math.max(...telemetry.dailyActivity.map(d => d.focusMins), 60);

  // Circular gauge percentage calculations (20h target for period, max 100%)
  const focusGoalPercent = Math.min(100, Math.round((telemetry.focusMinutesWeek / (timeRange === '30d' ? 4800 : timeRange === '14d' ? 2400 : 1200)) * 100));
  const pipelineYieldPercent = interviewRate || 40;
  const streakStabilityPercent = telemetry.sobrietyDays > 0 ? 100 : 0;

  // SVG circular gauge math: r=24 -> circumference = 2 * pi * 24 ≈ 150.8
  const circ = 150.8;
  const focusOffset = circ - (circ * focusGoalPercent) / 100;
  const yieldOffset = circ - (circ * Math.min(100, pipelineYieldPercent)) / 100;
  const streakOffset = circ - (circ * streakStabilityPercent) / 100;

  // Generate smooth cubic bezier SVG path for velocity trendline
  const svgWidth = 560;
  const svgHeight = 160;
  const points = telemetry.dailyActivity.map((day, idx) => {
    const step = svgWidth / Math.max(telemetry.dailyActivity.length - 1, 1);
    const x = idx * step;
    const y = 135 - ((day.focusMins / maxFocus) * 95);
    return { x, y, day };
  });

  const splinePath = points.length > 1
    ? points.reduce((acc, curr, idx, arr) => {
        if (idx === 0) return `M ${curr.x} ${curr.y}`;
        const prev = arr[idx - 1];
        const cx1 = prev.x + (curr.x - prev.x) / 2;
        const cy1 = prev.y;
        const cx2 = prev.x + (curr.x - prev.x) / 2;
        const cy2 = curr.y;
        return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${curr.x} ${curr.y}`;
      }, '')
    : '';

  const areaPath = splinePath
    ? `${splinePath} L ${points[points.length - 1].x} 145 L ${points[0].x} 145 Z`
    : '';

  return (
    <div className={`tracker-card card-telemetry card-analytics ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="card-header" onClick={onToggleCollapse} style={{ cursor: 'pointer' }}>
        <h2>
          <span className="card-title-group" role="button" tabIndex={0}>
            <span className="telemetry-round-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18"/>
                <path d="m19 9-5 5-4-4-3 3"/>
              </svg>
            </span>
            <span>Telemetry & Life Velocity</span>
          </span>
          <div className="card-header-actions" onClick={e => e.stopPropagation()}>
            {isCollapsed && (
              <span className="card-stat-pill">
                {avgFocusPerDay}m / day avg
              </span>
            )}
            <span className="card-badge">Apple visionOS Matrix</span>
            <button 
              className="card-action-btn"
              onClick={() => { sounds.playTap(); onToggleCollapse(); }}
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
                onClick={() => { sounds.playTap(); onHide(); }}
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
          {/* Executive Circular Health & Velocity Gauges */}
          <div className="telemetry-rings-strip">
            {/* Ring 1: Focus Velocity */}
            <div className="telemetry-ring-card">
              <div className="ring-svg-wrapper">
                <svg width="68" height="68" viewBox="0 0 68 68" className="circular-gauge">
                  <circle cx="34" cy="34" r="24" className="gauge-bg" />
                  <circle 
                    cx="34" 
                    cy="34" 
                    r="24" 
                    className="gauge-fill gauge-cyan" 
                    style={{ strokeDasharray: circ, strokeDashoffset: focusOffset }}
                  />
                </svg>
                <div className="ring-center-stat">{focusGoalPercent}%</div>
              </div>
              <div className="ring-meta">
                <span className="ring-title">Focus Velocity</span>
                <span className="ring-subtitle">{totalFocusHours}h logged ({timeRange})</span>
              </div>
            </div>

            {/* Ring 2: Pipeline Conversion */}
            <div className="telemetry-ring-card">
              <div className="ring-svg-wrapper">
                <svg width="68" height="68" viewBox="0 0 68 68" className="circular-gauge">
                  <circle cx="34" cy="34" r="24" className="gauge-bg" />
                  <circle 
                    cx="34" 
                    cy="34" 
                    r="24" 
                    className="gauge-fill gauge-magenta" 
                    style={{ strokeDasharray: circ, strokeDashoffset: yieldOffset }}
                  />
                </svg>
                <div className="ring-center-stat">{pipelineYieldPercent}%</div>
              </div>
              <div className="ring-meta">
                <span className="ring-title">Interview Yield</span>
                <span className="ring-subtitle">{telemetry.interviewsCount} in progress</span>
              </div>
            </div>

            {/* Ring 3: Sobriety Stability */}
            <div className="telemetry-ring-card">
              <div className="ring-svg-wrapper">
                <svg width="68" height="68" viewBox="0 0 68 68" className="circular-gauge">
                  <circle cx="34" cy="34" r="24" className="gauge-bg" />
                  <circle 
                    cx="34" 
                    cy="34" 
                    r="24" 
                    className="gauge-fill gauge-emerald" 
                    style={{ strokeDasharray: circ, strokeDashoffset: streakOffset }}
                  />
                </svg>
                <div className="ring-center-stat">100%</div>
              </div>
              <div className="ring-meta">
                <span className="ring-title">Clean Stability</span>
                <span className="ring-subtitle">{telemetry.sobrietyDays}d streak solid</span>
              </div>
            </div>
          </div>

          {/* Liquid Glass Segmented Controls Bar */}
          <div className="telemetry-controls-bar">
            <div className="telemetry-segmented-tabs">
              <button 
                className={`telemetry-pill-tab ${activeTab === 'chart' ? 'active' : ''}`}
                onClick={() => { sounds.playTap(); setActiveTab('chart'); }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>
                </svg>
                <span>Velocity Spline</span>
              </button>
              <button 
                className={`telemetry-pill-tab ${activeTab === 'heatmap' ? 'active' : ''}`}
                onClick={() => { sounds.playTap(); setActiveTab('heatmap'); }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
                  <rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>
                </svg>
                <span>Consistency Matrix</span>
              </button>
              <button 
                className={`telemetry-pill-tab ${activeTab === 'correlations' ? 'active' : ''}`}
                onClick={() => { sounds.playTap(); setActiveTab('correlations'); }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="12" cy="12" r="9"/><path d="m12 7 3 5-6 1 3 4"/>
                </svg>
                <span>Correlation Index</span>
              </button>
            </div>

            {/* Time range selector */}
            <div className="telemetry-range-pill-group">
              {['7d', '14d', '30d'].map(r => (
                <button
                  key={r}
                  className={`range-pill ${timeRange === r ? 'active' : ''}`}
                  onClick={() => { sounds.playTap(); setTimeRange(r); }}
                >
                  {r.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* TAB 1: Smooth SVG Velocity Spline & Glow Bars */}
          {activeTab === 'chart' && (
            <div className="telemetry-chart-viewport">
              <div className="chart-legend-row">
                <div className="legend-chip">
                  <span className="legend-blob blob-focus" />
                  <span>Deep Work Focus (Mins)</span>
                </div>
                <div className="legend-chip">
                  <span className="legend-blob blob-app" />
                  <span>Job Submissions</span>
                </div>
                {hoveredPoint && (
                  <div className="hovered-chip-badge">
                    <strong>{hoveredPoint.day.shortDate}:</strong> {hoveredPoint.day.focusMins}m focus • {hoveredPoint.day.dayApps} apps
                  </div>
                )}
              </div>

              <div className="svg-canvas-container">
                <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="telemetry-svg">
                  <defs>
                    <linearGradient id="areaGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.45" />
                      <stop offset="60%" stopColor="#6366f1" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                    </linearGradient>

                    <linearGradient id="splineStroke" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#06b6d4" />
                      <stop offset="50%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>

                    <linearGradient id="roundBarGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.85" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0.25" />
                    </linearGradient>

                    <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* Horizontal Grid lines */}
                  <line x1="0" y1="35" x2={svgWidth} y2="35" stroke="var(--glass-border-subtle)" strokeDasharray="5 5" />
                  <line x1="0" y1="85" x2={svgWidth} y2="85" stroke="var(--glass-border-subtle)" strokeDasharray="5 5" />
                  <line x1="0" y1="135" x2={svgWidth} y2="135" stroke="var(--glass-border-subtle)" />

                  {/* Gradient Area under spline */}
                  {areaPath && (
                    <path d={areaPath} fill="url(#areaGlow)" />
                  )}

                  {/* Smooth Spline Curve */}
                  {splinePath && (
                    <path 
                      d={splinePath} 
                      fill="none" 
                      stroke="url(#splineStroke)" 
                      strokeWidth="3.2" 
                      strokeLinecap="round" 
                      filter="url(#glowFilter)"
                    />
                  )}

                  {/* Rounded Capsule Bars & Data Nodes */}
                  {points.map((pt, idx) => {
                    const barHeight = Math.max(8, Math.min(85, (pt.day.focusMins / maxFocus) * 85));
                    const barY = 135 - barHeight;
                    const isHovered = hoveredPoint?.day.dateStr === pt.day.dateStr;

                    return (
                      <g 
                        key={pt.day.dateStr} 
                        className="telemetry-bar-node-group"
                        onMouseEnter={() => { sounds.playTick(); setHoveredPoint(pt); }}
                        onMouseLeave={() => setHoveredPoint(null)}
                        style={{ cursor: 'pointer' }}
                      >
                        {/* Rounded glass vertical capsule */}
                        <rect
                          x={pt.x - 9}
                          y={barY}
                          width="18"
                          height={barHeight}
                          rx="9"
                          fill="url(#roundBarGrad)"
                          className={`telemetry-capsule ${isHovered ? 'hovered' : ''}`}
                        />

                        {/* Interactive Data Node on Spline */}
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isHovered ? "6.5" : "4.2"}
                          fill="#ffffff"
                          stroke="#06b6d4"
                          strokeWidth="2.5"
                          className="spline-node-dot"
                        />

                        {/* Application Indicator Ping */}
                        {pt.day.dayApps > 0 && (
                          <circle
                            cx={pt.x}
                            cy={pt.y - 12}
                            r="4.5"
                            fill="#ec4899"
                            stroke="#ffffff"
                            strokeWidth="1.8"
                            className="apps-indicator-pulse"
                          />
                        )}

                        {/* X-Axis Day Label */}
                        <text
                          x={pt.x}
                          y="152"
                          textAnchor="middle"
                          fill={isHovered ? "var(--text-primary)" : "var(--text-tertiary)"}
                          fontSize="10"
                          fontWeight={isHovered ? "700" : "600"}
                        >
                          {pt.day.dayLabel}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          )}

          {/* TAB 2: Round 28-Day Consistency Matrix */}
          {activeTab === 'heatmap' && (
            <div className="telemetry-heatmap-stage">
              <div className="heatmap-header-strip">
                <span className="heatmap-title">Trailing {telemetry.dailyActivity.length}-Day Neuro-Cognitive Consistency Matrix</span>
                <div className="heatmap-legend-pills">
                  <span className="legend-label">Rest</span>
                  <div className="round-heat-cell score-0" />
                  <div className="round-heat-cell score-1" />
                  <div className="round-heat-cell score-2" />
                  <div className="round-heat-cell score-3" />
                  <div className="round-heat-cell score-4" />
                  <span className="legend-label">Peak</span>
                </div>
              </div>

              <div className="round-heatmap-grid">
                {telemetry.dailyActivity.map((day) => (
                  <div
                    key={day.dateStr}
                    className={`round-heat-cell score-${day.score}`}
                    onMouseEnter={() => sounds.playTick()}
                  >
                    <div className="heat-cell-tooltip">
                      <strong>{day.shortDate} ({day.dayLabel})</strong>
                      <span>{day.focusMins}m focus</span>
                      {day.dayApps > 0 && <span>• {day.dayApps} job app{day.dayApps > 1 ? 's' : ''}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Round Correlation & Coefficient Cards */}
          {activeTab === 'correlations' && (
            <div className="telemetry-correlations-stage">
              <div className="round-correlation-grid">
                <div className="round-corr-card">
                  <div className="corr-card-top">
                    <span className="corr-pill-tag">PIPELINE CONVERSION</span>
                    <span className="corr-trend-delta">+12%</span>
                  </div>
                  <div className="corr-value-hero">{interviewRate}%</div>
                  <h4 className="corr-name">Interview Yield Velocity</h4>
                  <p className="corr-body">High-leverage interview conversion against total active applications.</p>
                </div>

                <div className="round-corr-card">
                  <div className="corr-card-top">
                    <span className="corr-pill-tag">DEEP WORK OUTPUT</span>
                    <span className="corr-trend-delta">+18%</span>
                  </div>
                  <div className="corr-value-hero">{totalFocusHours}h</div>
                  <h4 className="corr-name">Cumulative Focus Rhythm</h4>
                  <p className="corr-body">Consistent Pomodoro sprints logged over the selected telemetry window.</p>
                </div>

                <div className="round-corr-card">
                  <div className="corr-card-top">
                    <span className="corr-pill-tag">MINDFUL STABILITY</span>
                    <span className="corr-trend-delta">100%</span>
                  </div>
                  <div className="corr-value-hero">{telemetry.sobrietyDays}d</div>
                  <h4 className="corr-name">Clean Cadence Index</h4>
                  <p className="corr-body">Zero relapse variance supporting cognitive performance and flow states.</p>
                </div>
              </div>
            </div>
          )}

          {/* Rounded Capsule Footer Summary */}
          <div className="telemetry-footer-capsules">
            <div className="footer-capsule">
              <span className="capsule-icon">⏱️</span>
              <span className="capsule-label">Deep Work:</span>
              <strong className="capsule-val">{telemetry.focusMinutesWeek} mins</strong>
            </div>
            <div className="footer-capsule">
              <span className="capsule-icon">💼</span>
              <span className="capsule-label">Active Apps:</span>
              <strong className="capsule-val">{telemetry.totalApps} tracked</strong>
            </div>
            <div className="footer-capsule">
              <span className="capsule-icon">🧠</span>
              <span className="capsule-label">Reflections:</span>
              <strong className="capsule-val">{telemetry.therapyCount} sessions</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
