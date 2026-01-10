import { useState, useEffect, useRef } from 'react';
import { storage } from '../utils/storage';

export default function PomodoroTimer() {
  const [mode, setMode] = useState('work');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0); // today
  const [totalTime, setTotalTime] = useState(0); // today
  const [weekSessions, setWeekSessions] = useState(0);
  const [weekTime, setWeekTime] = useState(0);
  const [monthSessions, setMonthSessions] = useState(0);
  const [monthTime, setMonthTime] = useState(0);
  const [settings, setSettings] = useState({
    workDuration: 25,
    shortBreak: 5,
    longBreak: 15,
    autoStart: false,
    sound: true
  });
  const [showSettings, setShowSettings] = useState(false);
  const isInitialMount = useRef(true);
  const intervalRef = useRef(null);

  // Helper functions for date ranges
  const getWeekStart = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
    return new Date(now.setDate(diff)).toDateString();
  };

  const getMonthStart = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toDateString();
  };

  // Load data from storage
  useEffect(() => {
    const loadData = async () => {
      const savedSettings = await storage.get('pomodoroSettings');
      const savedHistory = await storage.get('pomodoroHistory') || [];
      
      if (savedSettings) {
        setSettings(savedSettings);
        setTimeLeft(savedSettings.workDuration * 60);
      }
      
      // Calculate stats from history
      const today = new Date().toDateString();
      const weekStart = getWeekStart();
      const monthStart = getMonthStart();

      let todaySessions = 0, todayTime = 0;
      let weekSess = 0, weekTm = 0;
      let monthSess = 0, monthTm = 0;

      savedHistory.forEach(entry => {
        const entryDate = new Date(entry.date).toDateString();
        
        if (entryDate === today) {
          todaySessions += entry.sessions;
          todayTime += entry.minutes;
        }
        
        if (new Date(entry.date) >= new Date(weekStart)) {
          weekSess += entry.sessions;
          weekTm += entry.minutes;
        }
        
        if (new Date(entry.date) >= new Date(monthStart)) {
          monthSess += entry.sessions;
          monthTm += entry.minutes;
        }
      });

      setSessions(todaySessions);
      setTotalTime(todayTime);
      setWeekSessions(weekSess);
      setWeekTime(weekTm);
      setMonthSessions(monthSess);
      setMonthTime(monthTm);
      
      isInitialMount.current = false;
    };
    loadData();
  }, []);

  // Save settings when they change
  useEffect(() => {
    if (!isInitialMount.current) {
      storage.set('pomodoroSettings', settings);
    }
  }, [settings]);

  // Save stats when sessions change
  useEffect(() => {
    if (!isInitialMount.current && sessions > 0) {
      const saveStats = async () => {
        const history = await storage.get('pomodoroHistory') || [];
        const today = new Date().toDateString();
        
        // Update or add today's entry
        const existingIndex = history.findIndex(entry => 
          new Date(entry.date).toDateString() === today
        );
        
        if (existingIndex >= 0) {
          history[existingIndex] = {
            date: new Date().toISOString(),
            sessions,
            minutes: totalTime
          };
        } else {
          history.push({
            date: new Date().toISOString(),
            sessions,
            minutes: totalTime
          });
        }
        
        await storage.set('pomodoroHistory', history);
        
        // Recalculate week/month stats
        const weekStart = getWeekStart();
        const monthStart = getMonthStart();
        
        let weekSess = 0, weekTm = 0;
        let monthSess = 0, monthTm = 0;
        
        history.forEach(entry => {
          if (new Date(entry.date) >= new Date(weekStart)) {
            weekSess += entry.sessions;
            weekTm += entry.minutes;
          }
          if (new Date(entry.date) >= new Date(monthStart)) {
            monthSess += entry.sessions;
            monthTm += entry.minutes;
          }
        });
        
        setWeekSessions(weekSess);
        setWeekTime(weekTm);
        setMonthSessions(monthSess);
        setMonthTime(monthTm);
      };
      
      saveStats();
    }
  }, [sessions, totalTime]);

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      handleTimerComplete();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    
    // Play sound
    if (settings.sound) {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVqzn77BdGAg+ltryxnMpBSh+zPLaizsIGGS57OihUBELTKXh8bllHAU2jdXzz3sxBSF1xu/glEILElyx6OyrWBUIQ5zd8sFuJAUuhM/z1YU2Bhxqvu7mnEoODlOq5O+zYBoGPJPY88p2KwUme8rx3I4+CRZiturqpVITC0mi4PK8aB8FM4nU89F+MwUgccXv45ZFCxNbr+ftrVoXCECY3PLEcSYELIHO89qKOQcZaLvt559NEAxPqOPwtmQcBjiP1/PMeS0GI3fH8N2RQAoUXrTp66hVFApGnt/yvmwhBTCG0fPTgjQGHW/A7eSaRw0PVqzl77BeGQc9ltvyxnUoBSh+zPDaizsIGGS56+mjTxELTKXh8bllHAU1jdT0z3sxBSF1xe/glEILElyx6OyrWRUIRJvd8sFuJAUuhM/y1oU2Bhxqvu3mnEoPDlOq5PC0YRsGPJLY88p3KgUme8rx3I4+CRVht+rqpVMSC0mh4fK8aiAFM4nU89F+MwUgccXu45dGChNbr+ftrVwWCECY3PLEcSYGK4DN8tqKOQcZZ7zs56BODwxPpuPxt2MdBTiP1/PMeywGI3fH8N+RQAoUXrTp66hVFApGnt/yv2wiBDCG0fPTgzQGHG7A7eSaSQ0PVqvm77BeGQc9ltrzxnUoBSh9y/HajDsIF2W56+mjUREKTKPi8blnGwU1jdTy0HwwBSJzxe/glEMLEVux6eyrWRUIRJrd8sFuJQUtg87y1oY1BRxpvuznnEwODVKp5PC0YRsGOpHY88p3KgUme8nu3I8+CRVht+rqpVMSC0mh4fK8aiAFMojT89GAN');
      audio.play().catch(() => {});
    }

    // Update stats and switch mode
    if (mode === 'work') {
      setSessions(prev => prev + 1);
      setTotalTime(prev => prev + settings.workDuration);
      
      const breakMode = sessions > 0 && (sessions + 1) % 4 === 0 ? 'longBreak' : 'shortBreak';
      setMode(breakMode);
      setTimeLeft(breakMode === 'longBreak' ? settings.longBreak * 60 : settings.shortBreak * 60);
      
      if (settings.autoStart) {
        setIsRunning(true);
      }
    } else {
      setMode('work');
      setTimeLeft(settings.workDuration * 60);
      
      if (settings.autoStart) {
        setIsRunning(true);
      }
    }
  };

  const handleStart = () => {
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    const duration = mode === 'work' ? settings.workDuration : 
                     mode === 'shortBreak' ? settings.shortBreak : 
                     settings.longBreak;
    setTimeLeft(duration * 60);
  };

  const handleModeSwitch = (newMode) => {
    setIsRunning(false);
    setMode(newMode);
    const duration = newMode === 'work' ? settings.workDuration : 
                     newMode === 'shortBreak' ? settings.shortBreak : 
                     settings.longBreak;
    setTimeLeft(duration * 60);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = () => {
    const total = mode === 'work' ? settings.workDuration * 60 : 
                  mode === 'shortBreak' ? settings.shortBreak * 60 : 
                  settings.longBreak * 60;
    return ((total - timeLeft) / total) * 100;
  };

  return (
    <div className="tracker-card pomodoro-wide">
      <h2>🍅 Pomodoro Timer</h2>

      <div className="pomodoro-content">
        {/* Left: Timer */}
        <div className="pomodoro-timer-section">
          <div className="pomodoro-tabs">
            <button 
              className={mode === 'work' ? 'active' : ''}
              onClick={() => handleModeSwitch('work')}
            >
              Work
            </button>
            <button 
              className={mode === 'shortBreak' ? 'active' : ''}
              onClick={() => handleModeSwitch('shortBreak')}
            >
              Short Break
            </button>
            <button 
              className={mode === 'longBreak' ? 'active' : ''}
              onClick={() => handleModeSwitch('longBreak')}
            >
              Long Break
            </button>
          </div>

          <div className="timer-circle">
            <svg viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" className="timer-bg" />
              <circle 
                cx="60" 
                cy="60" 
                r="54" 
                className="timer-progress"
                style={{
                  strokeDasharray: `${2 * Math.PI * 54}`,
                  strokeDashoffset: `${2 * Math.PI * 54 * (1 - progress() / 100)}`
                }}
              />
            </svg>
            <div className="timer-text">
              <span className="time">{formatTime(timeLeft)}</span>
              <span className="mode-label">{mode.replace(/([A-Z])/g, ' $1').trim()}</span>
            </div>
          </div>

          <div className="timer-controls">
            {!isRunning ? (
              <button onClick={handleStart} className="start-btn">
                Start
              </button>
            ) : (
              <button onClick={handlePause} className="pause-btn">
                Pause
              </button>
            )}
            <button onClick={handleReset} className="reset-btn">
              Reset
            </button>
          </div>
        </div>

        {/* Right: Stats */}
        <div className="pomodoro-stats-section">
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-period">Today</span>
              <span className="stat-number">{sessions}</span>
              <span className="stat-label">sessions</span>
              <span className="stat-time">{totalTime} min</span>
            </div>
            
            <div className="stat-card">
              <span className="stat-period">This Week</span>
              <span className="stat-number">{weekSessions}</span>
              <span className="stat-label">sessions</span>
              <span className="stat-time">{weekTime} min</span>
            </div>
            
            <div className="stat-card">
              <span className="stat-period">This Month</span>
              <span className="stat-number">{monthSessions}</span>
              <span className="stat-label">sessions</span>
              <span className="stat-time">{monthTime} min</span>
            </div>
          </div>

          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="settings-toggle"
          >
            ⚙️ {showSettings ? 'Hide' : 'Show'} Settings
          </button>

          {showSettings && (
            <div className="pomodoro-settings">
              <div className="setting-row">
                <label>Work Duration (min)</label>
                <input 
                  type="number" 
                  min="1" 
                  max="60"
                  value={settings.workDuration}
                  onChange={(e) => setSettings({...settings, workDuration: parseInt(e.target.value) || 25})}
                />
              </div>
              <div className="setting-row">
                <label>Short Break (min)</label>
                <input 
                  type="number" 
                  min="1" 
                  max="30"
                  value={settings.shortBreak}
                  onChange={(e) => setSettings({...settings, shortBreak: parseInt(e.target.value) || 5})}
                />
              </div>
              <div className="setting-row">
                <label>Long Break (min)</label>
                <input 
                  type="number" 
                  min="1" 
                  max="60"
                  value={settings.longBreak}
                  onChange={(e) => setSettings({...settings, longBreak: parseInt(e.target.value) || 15})}
                />
              </div>
              <div className="setting-row">
                <label>Auto-start breaks/work</label>
                <input 
                  type="checkbox"
                  checked={settings.autoStart}
                  onChange={(e) => setSettings({...settings, autoStart: e.target.checked})}
                />
              </div>
              <div className="setting-row">
                <label>Sound notification</label>
                <input 
                  type="checkbox"
                  checked={settings.sound}
                  onChange={(e) => setSettings({...settings, sound: e.target.checked})}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}