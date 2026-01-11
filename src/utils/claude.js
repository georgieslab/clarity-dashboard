// Client-side functions that call our secure backend

// CRITICAL FIX: Use empty string instead of localhost
// This makes fetch use relative paths: /api/chat instead of http://localhost:3000/api/chat
// Works in production because backend and frontend are on same domain
const API_URL = import.meta.env.VITE_API_URL || '';

export async function generateWeeklyInsights(data) {
  const { sobrietyDays, applications, therapySessions } = data;

  const recentApps = applications.filter(app => {
    const appDate = new Date(app.dateApplied);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return appDate >= weekAgo;
  });

  const prompt = `You are a brutally honest friend helping someone track their personal growth. Based on their data:

SOBRIETY: ${sobrietyDays} days clean

JOB SEARCH:
- Total applications: ${applications.length}
- Waiting for response: ${applications.filter(a => a.status === 'applied').length}
- Interviewed: ${applications.filter(a => a.status === 'interviewed').length}
- Rejected: ${applications.filter(a => a.status === 'rejected').length}
- Offers: ${applications.filter(a => a.status === 'offered').length}
- Applied this week: ${recentApps.length}

THERAPY:
- Total sessions: ${therapySessions.length}
- This week: ${therapySessions.filter(s => {
    const sessionDate = new Date(s.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return sessionDate >= weekAgo;
  }).length}
- Recent topics: ${therapySessions.slice(0, 3).map(s => s.topics).filter(Boolean).join(', ')}

Provide a weekly summary with these exact sections:
✨ What's Working
⚠️ What Needs Attention
🎯 One Action This Week

Be direct. No toxic positivity. Call out patterns. Give one concrete action.`;

  const response = await fetch(`${API_URL}/api/insights`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt })
  });

  if (!response.ok) {
    throw new Error('Failed to generate insights');
  }

  const data_response = await response.json();
  return data_response.content;
}

export async function sendChatMessage(conversationHistory) {
  const response = await fetch(`${API_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: conversationHistory,
      system: "You are a supportive AI companion helping someone track their personal growth. Be warm, honest, and helpful. Keep responses concise but thoughtful (2-4 paragraphs max). The user is working on sobriety, job search, therapy, and productivity. Reference their dashboard data when relevant. Be conversational and natural - like a friend who genuinely cares."
    })
  });

  if (!response.ok) {
    throw new Error('Failed to get chat response');
  }

  const data = await response.json();
  return data.content;
}