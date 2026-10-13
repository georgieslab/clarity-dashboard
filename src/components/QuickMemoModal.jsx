import { useState, useEffect } from 'react';
import { sounds } from '../utils/audioEffects';

const CATEGORIES = [
  { id: 'breakthrough', label: '💡 Breakthrough', color: '#38bdf8' },
  { id: 'task', label: '⚡ Action Item', color: '#f59e0b' },
  { id: 'gratitude', label: '🌿 Gratitude', color: '#10b981' },
  { id: 'meeting', label: '🤝 Meeting Note', color: '#a78bfa' }
];

const STORAGE_KEY = 'clarity_quick_memos';

export default function QuickMemoModal({ isOpen, onClose, onSynthesizeWithLumen }) {
  const [memos, setMemos] = useState([]);
  const [text, setText] = useState('');
  const [category, setCategory] = useState('breakthrough');
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setMemos(JSON.parse(saved));
      } else {
        // Initial sample memo
        const initial = [
          {
            id: 'sample-1',
            text: 'Key architectural insight: decoupling Web Audio nodes from React component lifecycles ensures zero clicks during tab changes.',
            category: 'breakthrough',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date: new Date().toLocaleDateString()
          }
        ];
        setMemos(initial);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      }
    } catch (e) {
      console.warn('Failed to load memos:', e);
    }
  }, []);

  const saveMemos = (newMemos) => {
    setMemos(newMemos);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newMemos));
    } catch (e) {}
  };

  const handleAddMemo = (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    sounds.playSuccess();
    const newMemo = {
      id: `memo-${Date.now()}`,
      text: text.trim(),
      category,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString()
    };

    saveMemos([newMemo, ...memos]);
    setText('');
  };

  const handleDeleteMemo = (id) => {
    sounds.playTap();
    saveMemos(memos.filter((m) => m.id !== id));
  };

  const handleCopyMemo = (memo) => {
    sounds.playTap();
    navigator.clipboard.writeText(memo.text);
    setCopiedId(memo.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleLumenSynthesize = (memo) => {
    sounds.playTap();
    if (onSynthesizeWithLumen) {
      onSynthesizeWithLumen(memo.text);
    } else {
      window.dispatchEvent(new CustomEvent('clarity-ask-lumen', { detail: { query: `Please analyze and turn this note into high-leverage executive action items: "${memo.text}"` } }));
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="executive-modal-backdrop" onClick={onClose}>
      <div 
        className="executive-glass-modal memo-modal-card" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-badge-pill">⚡ Rapid Capture</span>
            <h2 className="modal-title">Executive Memo & Idea Inbox</h2>
            <p className="modal-subtitle">Frictionless scratchpad for fleeting breakthroughs, tasks, and reflections</p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleAddMemo} className="memo-input-box">
          <textarea
            className="memo-textarea"
            placeholder="Jot down a fleeting thought, strategic decision, or gratitude reflection..."
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleAddMemo(e);
              }
            }}
          />

          <div className="memo-input-footer">
            <div className="memo-category-pills">
              {CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  className={`memo-cat-btn ${category === cat.id ? 'active' : ''}`}
                  onClick={() => { sounds.playTick(); setCategory(cat.id); }}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <button 
              type="submit" 
              className="memo-submit-btn" 
              disabled={!text.trim()}
            >
              <span>+ Save Memo</span>
              <kbd className="memo-kbd-shortcut">⌘⏎</kbd>
            </button>
          </div>
        </form>

        {/* Memos List */}
        <div className="memo-list-section">
          <div className="memo-list-header">
            <span className="memo-count-label">Captured Items ({memos.length})</span>
            {memos.length > 0 && (
              <button 
                className="memo-clear-all-link"
                onClick={() => {
                  if (window.confirm('Clear all memos?')) {
                    saveMemos([]);
                  }
                }}
              >
                Clear all
              </button>
            )}
          </div>

          <div className="memo-scroll-area">
            {memos.length === 0 ? (
              <div className="memo-empty-state">
                <span className="memo-empty-icon">📝</span>
                <p>Inbox is clear. Dump fleeting ideas here to preserve focus.</p>
              </div>
            ) : (
              memos.map((memo) => {
                const catObj = CATEGORIES.find((c) => c.id === memo.category) || CATEGORIES[0];
                return (
                  <div key={memo.id} className="memo-item-card">
                    <div className="memo-item-top">
                      <span 
                        className="memo-item-category-tag" 
                        style={{ color: catObj.color, borderColor: `${catObj.color}40`, background: `${catObj.color}15` }}
                      >
                        {catObj.label}
                      </span>
                      <span className="memo-item-time">{memo.timestamp}</span>
                    </div>

                    <p className="memo-item-text">{memo.text}</p>

                    <div className="memo-item-actions">
                      <button 
                        className="memo-action-btn copy-btn"
                        onClick={() => handleCopyMemo(memo)}
                        title="Copy to clipboard"
                      >
                        {copiedId === memo.id ? '✓ Copied!' : '📋 Copy'}
                      </button>

                      <button 
                        className="memo-action-btn lumen-btn"
                        onClick={() => handleLumenSynthesize(memo)}
                        title="Analyze with Lumen AI Copilot"
                      >
                        ✨ Synthesize with Lumen
                      </button>

                      <button 
                        className="memo-action-btn delete-btn"
                        onClick={() => handleDeleteMemo(memo.id)}
                        title="Delete memo"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

