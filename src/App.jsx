import { useState, useEffect } from 'react';
import SobrietyTracker from './components/SobrietyTracker';
import JobSearchTracker from './components/JobSearchTracker';
import TherapyTracker from './components/TherapyTracker';
import WeeklyInsights from './components/WeeklyInsights';
import PomodoroTimer from './components/PomodoroTimer';
import AuthButton from './components/AuthButton';
import ChatWidget from './components/ChatWidget';
import './App.css';

function App() {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <div className="dashboard">
      <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme"></button>
      
      <header>
        <div className="logo-title">
          <img src="/clarity.svg" alt="Clarity" className="logo" />
          <h1>Clarity</h1>
        </div>
        <p>Your personal data dashboard</p>
        <AuthButton />
      </header>

      <main>
        <div className="top-row">
          <SobrietyTracker />
          <JobSearchTracker />
          <TherapyTracker />
        </div>

        <PomodoroTimer />
        <WeeklyInsights />
      </main>

      <ChatWidget />
    </div>
  );
}

export default App;