import { useState, useEffect } from 'react';
import SobrietyTracker from './components/SobrietyTracker';
import JobSearchTracker from './components/JobSearchTracker';
import TherapyTracker from './components/TherapyTracker';
import DailyInsights from './components/DailyInsights';
import PomodoroTimer from './components/PomodoroTimer';
import AuthButton from './components/AuthButton';
import VoiceAssistant from './components/VoiceAssistant';
import ThemeToggle from './components/ThemeToggle';
import './App.css';

function App() {
  return (
    <div className="dashboard">
      {/* Apple Fluid Ambient Gradient Canvas */}
      <div className="ambient-background" aria-hidden="true">
        <div className="ambient-orb orb-1"></div>
        <div className="ambient-orb orb-2"></div>
        <div className="ambient-orb orb-3"></div>
        <div className="ambient-orb orb-4"></div>
      </div>

      <header>
        <div className="header-left">
          <div className="logo-title">
            <div className="logo-container">
              <img src="/clarity.svg" alt="Clarity" className="logo" />
            </div>
            <div className="brand-text">
              <h1>
                Clarity <span className="brand-badge">PRO</span>
              </h1>
            </div>
          </div>
          <p>Executive life & growth telemetry</p>
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

      <VoiceAssistant />
      <ThemeToggle />
    </div>
  );
}

export default App;