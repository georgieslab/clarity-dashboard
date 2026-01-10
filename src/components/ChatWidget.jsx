import { useState, useEffect, useRef } from 'react';
import { sendChatMessage } from '../utils/claude';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const isInitialMount = useRef(true);

  // Load chat history from storage
  useEffect(() => {
    const loadHistory = async () => {
      const saved = localStorage.getItem('chatHistory');
      if (saved) {
        setMessages(JSON.parse(saved));
      } else {
        // Welcome message
        setMessages([{
          role: 'assistant',
          content: "Hey! I'm Claude, your AI companion. I can help with:\n\n• Reflecting on your progress\n• Setting goals\n• Problem-solving\n• General conversation\n\nWhat's on your mind?",
          timestamp: new Date().toISOString()
        }]);
      }
      isInitialMount.current = false;
    };
    loadHistory();
  }, []);

  // Save chat history when messages change
  useEffect(() => {
    if (!isInitialMount.current && messages.length > 0) {
      localStorage.setItem('chatHistory', JSON.stringify(messages));
    }
  }, [messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Build conversation history for Claude
      const conversationHistory = [...messages, userMessage].map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Call Claude via our proxy function
      const responseText = await sendChatMessage(conversationHistory);

      const assistantMessage = {
        role: 'assistant',
        content: responseText,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearHistory = () => {
    if (confirm('Clear all chat history? This cannot be undone.')) {
      setMessages([{
        role: 'assistant',
        content: "Chat history cleared. What would you like to talk about?",
        timestamp: new Date().toISOString()
      }]);
      localStorage.removeItem('chatHistory');
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button 
        className={`chat-fab ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle chat"
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="chat-panel">
          <div className="chat-header">
            <div className="chat-header-info">
              <h3>Chat with Claude</h3>
              <span className="chat-status">● Online</span>
            </div>
            <button 
              onClick={clearHistory}
              className="clear-chat-btn"
              title="Clear history"
            >
              🗑️
            </button>
          </div>

          <div className="chat-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`chat-message ${msg.role}`}>
                <div className="message-content">
                  <div className="message-text">{msg.content}</div>
                  <div className="message-time">{formatTime(msg.timestamp)}</div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="chat-message assistant">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-container">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message... (Enter to send)"
              rows="1"
              disabled={isLoading}
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="send-btn"
            >
              {isLoading ? '⏳' : '➤'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}