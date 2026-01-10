import { useState, useEffect } from 'react';
import SobrietyTracker from './components/SobrietyTracker';
import JobSearchTracker from './components/JobSearchTracker';
import TherapyTracker from './components/TherapyTracker';
import DailyInsights from './components/DailyInsights';
import PomodoroTimer from './components/PomodoroTimer';
import AuthButton from './components/AuthButton';
import ChatWidget from './components/ChatWidget';
import ThemeToggle from './components/ThemeToggle';
import './App.css';

function App() {
  return (
    <div className="dashboard">
      <header>
        <div className="header-left">
          <div className="logo-title">
            <img src="/clarity.svg" alt="Clarity" className="logo" />
            <h1>Clarity</h1>
          </div>
          <p>Your personal data dashboard</p>
        </div>
        
        <div className="header-right">
          <AuthButton />
        </div>
      </header>

      <main>
        <div className="top-row">
          <SobrietyTracker />
          <JobSearchTracker />
          <TherapyTracker />
        </div>

        <PomodoroTimer />
        <DailyInsights />
      </main>

      <ChatWidget />
      <ThemeToggle />
    </div>
  );
}

export default App;