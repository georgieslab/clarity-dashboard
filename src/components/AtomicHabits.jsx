import { useState, useEffect, useRef } from 'react';
import { storage } from '../utils/storage';
import { sounds } from '../utils/audioEffects';

export const INITIAL_HABITS = [
  {
    id: 'habit-1',
    title: 'Zone-2 Cardio & Heavy Compound Lift',
    category: 'Fitness',
    icon: '🏋️‍♂️',
    targetPerWeek: 5,
    streak: 21,
    // Days 0-6 (Mon-Sun of current week)
    days: [true, true, true, true, false, true, true]
  },
  {
    id: 'habit-2',
    title: 'Mindfulness & Box Breathing (15m)',
    category: 'Mindset',
    icon: '🧘',
    targetPerWeek: 7,
    streak: 34,
    days: [true, true, true, true, true, true, true]
  },
  {
    id: 'habit-3',
    title: 'Clean Nutrition & Zero Refined Sugar',
    category: 'Health',
    icon: '🥗',
    targetPerWeek: 6,
    streak: 18,
    days: [true, true, false, true, true, true, true]
  },
  {
    id: 'habit-4',
    title: '90m Deep Code & Architecture Sprint',
    category: 'Craft',
    icon: '💻',
    targetPerWeek: 5,
    streak: 14,
    days: [true, true, true, true, true, false, false]
  },
  {
    id: 'habit-5',
    title: 'Digital Sunset (No Screens 22:00)',
    category: 'Recovery',
    icon: '🌙',
    targetPerWeek: 6,
    streak: 11,
    days: [true, false, true, true, true, true, false]
  }
];

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function AtomicHabits({ isCollapsed, onToggleCollapse, onHide }) {
  const [habits, setHabits] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Mindset');
  const [newIcon, setNewIcon] = useState('⚡');
  const [newTarget, setNewTarget] = useState(5);
  const isInitialMount = useRef(true);

  // Compute current day index in Mon-Sun (0 = Mon, 6 = Sun)
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 is Sun, 1 is Mon...
  const todayIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  // Generate dynamic date numbers for current week
  const getWeekDates = () => {
    const dates = [];
    const current = new Date(today);
    // Move to Monday of current week
    const currentDay = current.getDay();
    const diff = current.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
    const monday = new Date(current.setDate(diff));

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dates.push(d.getDate());
    }
    return dates;
  };

  const weekDates = getWeekDates();

  // Load from storage
  useEffect(() => {
    const loadHabits = async () => {
      try {
        const saved = await storage.get('clarity_atomic_habits');
        if (saved && Array.isArray(saved) && saved.length > 0) {
          setHabits(saved);
        } else {
          setHabits(INITIAL_HABITS);
        }
      } catch (err) {
        setHabits(INITIAL_HABITS);
      }
      isInitialMount.current = false;
    };
    loadHabits();
  }, []);

  // Save changes
  useEffect(() => {
    if (!isInitialMount.current && habits.length > 0) {
      storage.set('clarity_atomic_habits', habits);
    }
  }, [habits]);

  // Toggle single day bubble
  const toggleHabitDay = (habitId, dayIndex) => {
    sounds.playTap();
    setHabits(prev => prev.map(h => {
      if (h.id !== habitId) return h;
      const newDays = [...h.days];
      const willBeChecked = !newDays[dayIndex];
      newDays[dayIndex] = willBeChecked;

      // Adjust streak if toggling today
      let newStreak = h.streak;
      if (dayIndex === todayIdx) {
        newStreak = willBeChecked ? h.streak + 1 : Math.max(0, h.streak - 1);
      }

      return {
        ...h,
        days: newDays,
        streak: newStreak
      };
    }));

    // Check if all habits for today are now completed
    setTimeout(() => {
      setHabits(currentHabits => {
        const allCompletedToday = currentHabits.every(h => h.days[todayIdx]);
        if (allCompletedToday) {
          sounds.playMilestone();
        }
        return currentHabits;
      });
    }, 50);
  };

  // Add new habit
  const handleAddHabit = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    sounds.playSwitch(true);
    const newHabit = {
      id: `habit-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      icon: newIcon,
      targetPerWeek: Number(newTarget),
      streak: 1,
      days: [false, false, false, false, false, false, false].map((_, i) => i === todayIdx)
    };

    setHabits(prev => [...prev, newHabit]);
    setNewTitle('');
    setShowAddModal(false);
  };

  // Delete habit
  const handleDeleteHabit = (id) => {
    sounds.playTick();
    setHabits(prev => prev.filter(h => h.id !== id));
  };

  // Aggregated calculations
  const totalCompletedDays = habits.reduce((acc, h) => acc + h.days.filter(Boolean).length, 0);
  const totalPossibleDays = habits.length * 7;
  const consistencyPercent = totalPossibleDays > 0 ? Math.round((totalCompletedDays / totalPossibleDays) * 100) : 0;
  const todayCompletedCount = habits.filter(h => h.days[todayIdx]).length;
  const totalStreaks = habits.reduce((acc, h) => acc + (h.streak || 0), 0);

  return (
    <div className={`tracker-card card-habits ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="card-header" onClick={isCollapsed ? onToggleCollapse : undefined}>
        <h2>
          <span className="card-title-group" onClick={onToggleCollapse} role="button" tabIndex={0}>
            <span>⚡ Atomic Habits</span>
          </span>
          <div className="card-header-actions" onClick={e => e.stopPropagation()}>
            {isCollapsed && (
              <span className="card-stat-pill">
                {todayCompletedCount}/{habits.length} Today • {consistencyPercent}%
              </span>
            )}
            <span className="card-badge">Daily Consistency</span>
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
        <div className="card-content habits-content">
          {/* Top Performance Bar */}
          <div className="habits-stats-bar">
            <div className="habits-stat-block">
              <span className="habits-stat-val">{todayCompletedCount}/{habits.length}</span>
              <span className="habits-stat-lbl">Today's Target</span>
            </div>
            <div className="habits-stat-divider"></div>
            <div className="habits-stat-block">
              <span className="habits-stat-val text-emerald">{consistencyPercent}%</span>
              <span className="habits-stat-lbl">Weekly Yield</span>
            </div>
            <div className="habits-stat-divider"></div>
            <div className="habits-stat-block">
              <span className="habits-stat-val text-amber">🔥 {totalStreaks}d</span>
              <span className="habits-stat-lbl">Cumulative Streak</span>
            </div>
            <button 
              className="habits-add-trigger-btn"
              onClick={() => { sounds.playTap(); setShowAddModal(true); }}
              title="Add a new habit"
            >
              <span>+ Add Habit</span>
            </button>
          </div>

          {/* 7-Day Rolling Matrix Table */}
          <div className="habits-matrix-wrapper">
            <div className="habits-matrix-header">
              <div className="habits-col-meta">Habit & Routine</div>
              <div className="habits-days-header-grid">
                {DAY_LABELS.map((label, idx) => {
                  const isToday = idx === todayIdx;
                  return (
                    <div key={label} className={`habits-day-head-cell ${isToday ? 'today-col' : ''}`}>
                      <span className="day-name">{label}</span>
                      <span className="day-date">{weekDates[idx]}</span>
                      {isToday && <span className="today-dot" />}
                    </div>
                  );
                })}
              </div>
              <div className="habits-col-streak">Streak</div>
            </div>

            <div className="habits-rows-list">
              {habits.map((habit) => {
                const completedThisWeek = habit.days.filter(Boolean).length;
                const isTargetMet = completedThisWeek >= habit.targetPerWeek;

                return (
                  <div key={habit.id} className="habit-row">
                    <div className="habit-meta-cell">
                      <span className="habit-icon">{habit.icon}</span>
                      <div className="habit-titles">
                        <span className="habit-name">{habit.title}</span>
                        <div className="habit-submeta">
                          <span className="habit-cat-tag">{habit.category}</span>
                          <span className={`habit-target-pill ${isTargetMet ? 'achieved' : ''}`}>
                            {completedThisWeek}/{habit.targetPerWeek}w
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="habit-days-grid">
                      {habit.days.map((isDone, dayIdx) => {
                        const isToday = dayIdx === todayIdx;
                        return (
                          <div 
                            key={dayIdx} 
                            className={`habit-day-bubble-wrap ${isToday ? 'today-slot' : ''}`}
                          >
                            <button
                              type="button"
                              className={`habit-bubble ${isDone ? 'checked' : 'empty'} ${isToday ? 'is-today' : ''}`}
                              onClick={() => toggleHabitDay(habit.id, dayIdx)}
                              aria-label={`Toggle ${habit.title} for ${DAY_LABELS[dayIdx]}`}
                              title={`${isDone ? 'Completed' : 'Tap to complete'} on ${DAY_LABELS[dayIdx]}`}
                            >
                              {isDone ? (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              ) : (
                                <span className="bubble-hollow-dot" />
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    <div className="habit-streak-cell">
                      <span className="streak-badge">
                        🔥 {habit.streak}d
                      </span>
                      <button 
                        className="habit-del-btn" 
                        onClick={() => handleDeleteHabit(habit.id)}
                        title="Delete habit"
                        aria-label="Delete habit"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add Habit Modal */}
          {showAddModal && (
            <div className="habits-modal-overlay" onClick={() => setShowAddModal(false)}>
              <div className="habits-modal-card" onClick={e => e.stopPropagation()}>
                <div className="habits-modal-header">
                  <h3>New Atomic Habit</h3>
                  <button className="habits-modal-close" onClick={() => setShowAddModal(false)}>✕</button>
                </div>
                <form onSubmit={handleAddHabit} className="habits-modal-form">
                  <div className="form-group">
                    <label>Habit Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Cold Plunge (3m), Reading 20m, Zero Sugar" 
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      autoFocus
                      required
                    />
                  </div>

                  <div className="form-row-2">
                    <div className="form-group">
                      <label>Category</label>
                      <select value={newCategory} onChange={e => setNewCategory(e.target.value)}>
                        <option value="Fitness">Fitness</option>
                        <option value="Mindset">Mindset</option>
                        <option value="Health">Health</option>
                        <option value="Craft">Craft</option>
                        <option value="Recovery">Recovery</option>
                        <option value="Finance">Finance</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Target Days / Week</label>
                      <select value={newTarget} onChange={e => setNewTarget(e.target.value)}>
                        <option value="7">Every day (7d)</option>
                        <option value="6">6 days / week</option>
                        <option value="5">5 days / week (Workdays)</option>
                        <option value="4">4 days / week</option>
                        <option value="3">3 days / week</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Icon Emoji</label>
                    <div className="emoji-preset-pills">
                      {['⚡', '🏋️‍♂️', '🧘', '🥗', '💻', '📖', '💧', '🏃', '🧠', '🌙'].map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          className={`emoji-btn ${newIcon === emoji ? 'selected' : ''}`}
                          onClick={() => setNewIcon(emoji)}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="habits-modal-actions">
                    <button type="button" className="btn-cancel" onClick={() => setShowAddModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn-save">
                      Save Habit
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

