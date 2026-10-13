/**
 * Executive Demo Persona Data
 * Provides realistic, inspiring telemetry data for portfolio demonstrations and recruiter reviews.
 */

export const DEMO_DATA = {
  sobriety: {
    startDate: new Date(Date.now() - 142 * 24 * 60 * 60 * 1000).toISOString() // 142 days clean
  },
  
  applications: [
    {
      id: 1001,
      company: 'Linear',
      role: 'Staff Frontend Architect',
      status: 'Interview',
      dateApplied: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    },
    {
      id: 1002,
      company: 'Vercel',
      role: 'Principal Design Engineer',
      status: 'Offer',
      dateApplied: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    },
    {
      id: 1003,
      company: 'OpenAI',
      role: 'Lead Telemetry & HCI Engineer',
      status: 'Interview',
      dateApplied: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    },
    {
      id: 1004,
      company: 'Apple',
      role: 'Senior visionOS UI Engineer',
      status: 'applied',
      dateApplied: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    },
    {
      id: 1005,
      company: 'Stripe',
      role: 'Staff Product Infrastructure Engineer',
      status: 'applied',
      dateApplied: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
  ],

  therapy: [
    {
      id: 2001,
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      topics: 'High-Stakes Leadership & Cognitive Flow',
      notes: 'Explored boundary-setting during intense interview loops. Discussed mindfulness practices to stay anchored during executive technical debriefs.',
      feeling: 'positive'
    },
    {
      id: 2002,
      date: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      topics: 'Sustained Sobriety & Habit Scaffolding',
      notes: 'Celebrated passing the 4-month milestone. Focused on energy management rituals, sleep hygiene, and avoiding dopamine burnout.',
      feeling: 'positive'
    },
    {
      id: 2003,
      date: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      topics: 'Emotional Horizon & Creative Anxiety',
      notes: 'Reflected on transition anxiety between career chapters. Re-framed ambiguity as creative white-space rather than unpredictability.',
      feeling: 'neutral'
    }
  ],

  // 28-day Pomodoro history for velocity chart and heatmap
  pomodoroHistory: (() => {
    const history = [];
    const now = new Date();
    // Generate 28 days of realistic focus sessions
    for (let i = 27; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      
      // Weekdays: 3 to 7 sessions (75 - 175 mins). Weekends: 1 to 3 sessions (25 - 75 mins)
      const sessionCount = isWeekend ? (i % 2 === 0 ? 2 : 1) : (3 + (i % 4));
      
      for (let s = 0; s < sessionCount; s++) {
        history.push({
          id: `pomo-${i}-${s}`,
          date: d.toISOString(),
          minutes: 25,
          mode: 'work',
          type: 'focus'
        });
      }
    }
    return history;
  })(),

  weeklyInsights: {
    timestamp: new Date().toISOString(),
    insights: `✨ What's Working
142 Days clean and strong. You have maintained a rock-solid sobriety foundation that is directly driving cognitive clarity. Deep work focus velocity is up 18% this week with over 20+ hours logged across Pomodoro sessions. Your career pipeline is high-leverage: advanced interview rounds at Linear and an active offer at Vercel prove that sustained routine translates into tangible executive outcomes.

⚠️ What Needs Attention
You are loading intense cognitive sprints back-to-back without restorative down-regulation. The therapy logs indicate slight anxiety around executive debriefs and imposter syndrome during director-level loops. Do not skip the 15-minute breaks between focus sessions—fatigue can subtly erode decision quality.

🎯 One Action This Week
Schedule a dedicated 60-minute compensation and systems review block for the Vercel offer before Friday, and cap your daily deep work sessions at 4 blocks to protect recovery windows.`
  },

  lumenChatHistory: [
    {
      id: 'lumen-init',
      role: 'assistant',
      text: "Welcome back, Georgie. You're at day 142 of your sobriety journey, your focus velocity is up 18% this week, and you have active interview stages with Linear and Vercel. What would you like to concentrate on today?",
      timestamp: Date.now() - 3600000
    },
    {
      id: 'lumen-user-1',
      role: 'user',
      text: "How should I structure my focus sessions before the Linear system architecture round?",
      timestamp: Date.now() - 1800000
    },
    {
      id: 'lumen-asst-1',
      role: 'assistant',
      text: "I recommend two 50-minute deep work blocks: Block 1 for high-throughput distributed state review and local-first syncing patterns; Block 2 for visionOS liquid glass and fluid gesture telemetry. Take a 15-minute cognitive reset in between.",
      timestamp: Date.now() - 1700000
    }
  ],

  atomicHabits: [
    {
      id: 'habit-1',
      title: 'Zone-2 Cardio & Heavy Compound Lift',
      category: 'Fitness',
      icon: '🏋️‍♂️',
      targetPerWeek: 5,
      streak: 21,
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
  ],

  executiveLibrary: [
    {
      id: 'book-1',
      title: 'Designing Data-Intensive Applications',
      author: 'Martin Kleppmann',
      category: 'System Architecture',
      status: 'reading',
      progress: 78,
      currentPage: 432,
      totalPages: 554,
      rating: 5,
      coverGradient: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
      keyInsight: 'Reliability, scalability, and maintainability are not trade-offs against feature velocity—they are the architectural prerequisites for sustainable velocity.',
      tags: ['Distributed Systems', 'LSM-Trees', 'Consensus Algorithms']
    },
    {
      id: 'book-2',
      title: 'High Output Management',
      author: 'Andrew S. Grove',
      category: 'Executive Leadership',
      status: 'completed',
      progress: 100,
      currentPage: 272,
      totalPages: 272,
      rating: 5,
      coverGradient: 'linear-gradient(135deg, #065f46, #10b981)',
      keyInsight: 'A manager’s output = the output of their organization + the output of the neighboring organizations under their influence. Leverage is everything.',
      tags: ['Managerial Leverage', 'OKRs', 'Operational Excellence']
    },
    {
      id: 'book-3',
      title: 'Atomic Habits',
      author: 'James Clear',
      category: 'Behavioral Systems',
      status: 'completed',
      progress: 100,
      currentPage: 320,
      totalPages: 320,
      rating: 5,
      coverGradient: 'linear-gradient(135deg, #7c2d12, #ea580c)',
      keyInsight: 'You do not rise to the level of your goals; you fall to the level of your systems. Focus on identity shifts rather than transient outcome targets.',
      tags: ['Identity Shift', 'Habit Loops', '1% Compounding']
    },
    {
      id: 'book-4',
      title: 'Staff Engineer: Leadership Beyond the Management Track',
      author: 'Will Larson',
      category: 'Technical Craft',
      status: 'reading',
      progress: 46,
      currentPage: 160,
      totalPages: 348,
      rating: 5,
      coverGradient: 'linear-gradient(135deg, #581c87, #a855f7)',
      keyInsight: 'Staff+ engineers operate as force multipliers by building organizational trust and setting architectural direction in highly ambiguous problem spaces.',
      tags: ['Staff Archetypes', 'Technical Direction', 'Executive Presence']
    }
  ]
};

/**
 * Loads the executive demo data into storage, backing up any existing data first.
 */
export async function loadDemoData(storage) {
  try {
    // Check if there is existing data and back it up
    const existing = {
      sobriety: await storage.get('sobriety'),
      applications: await storage.get('applications'),
      therapy: await storage.get('therapy'),
      pomodoroHistory: await storage.get('pomodoroHistory'),
      weeklyInsights: await storage.get('weeklyInsights'),
      lumenChatHistory: await storage.get('lumen_chat_history'),
      atomicHabits: await storage.get('clarity_atomic_habits'),
      executiveLibrary: await storage.get('clarity_executive_library'),
      isDemo: true
    };
    
    // Save backup if not already demo
    const wasDemo = await storage.get('clarity_is_demo_mode');
    if (!wasDemo) {
      await storage.set('clarity_user_backup', existing);
    }

    // Set demo data
    await storage.set('sobriety', DEMO_DATA.sobriety);
    await storage.set('applications', DEMO_DATA.applications);
    await storage.set('therapy', DEMO_DATA.therapy);
    await storage.set('pomodoroHistory', DEMO_DATA.pomodoroHistory);
    await storage.set('weeklyInsights', DEMO_DATA.weeklyInsights);
    await storage.set('lumen_chat_history', DEMO_DATA.lumenChatHistory);
    await storage.set('clarity_atomic_habits', DEMO_DATA.atomicHabits);
    await storage.set('clarity_executive_library', DEMO_DATA.executiveLibrary);
    await storage.set('clarity_is_demo_mode', true);

    return true;
  } catch (err) {
    console.error('Failed to load demo data:', err);
    return false;
  }
}

/**
 * Restores user data from backup or resets demo data.
 */
export async function restoreUserData(storage) {
  try {
    const backup = await storage.get('clarity_user_backup');
    if (backup) {
      await storage.set('sobriety', backup.sobriety || null);
      await storage.set('applications', backup.applications || []);
      await storage.set('therapy', backup.therapy || []);
      await storage.set('pomodoroHistory', backup.pomodoroHistory || []);
      await storage.set('weeklyInsights', backup.weeklyInsights || null);
      await storage.set('lumen_chat_history', backup.lumenChatHistory || []);
      await storage.set('clarity_atomic_habits', backup.atomicHabits || null);
      await storage.set('clarity_executive_library', backup.executiveLibrary || null);
      await storage.remove('clarity_user_backup');
    } else {
      // Clear demo
      await storage.remove('sobriety');
      await storage.remove('applications');
      await storage.remove('therapy');
      await storage.remove('pomodoroHistory');
      await storage.remove('weeklyInsights');
      await storage.remove('lumen_chat_history');
      await storage.remove('clarity_atomic_habits');
      await storage.remove('clarity_executive_library');
    }
    await storage.set('clarity_is_demo_mode', false);
    return true;
  } catch (err) {
    console.error('Failed to restore user data:', err);
    return false;
  }
}
