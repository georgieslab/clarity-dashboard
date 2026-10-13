import { useState, useEffect, useRef } from 'react';
import { storage } from '../utils/storage';
import { sounds } from '../utils/audioEffects';

export const INITIAL_BOOKS = [
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
];

export default function ExecutiveLibrary({ isCollapsed, onToggleCollapse, onHide }) {
  const [books, setBooks] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'reading', 'completed'
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedInsightId, setExpandedInsightId] = useState(null);

  // Form states
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newCategory, setNewCategory] = useState('System Architecture');
  const [newStatus, setNewStatus] = useState('reading');
  const [newTotalPages, setNewTotalPages] = useState(300);
  const [newCurrentPage, setNewCurrentPage] = useState(0);
  const [newInsight, setNewInsight] = useState('');
  const [newTags, setNewTags] = useState('');

  const isInitialMount = useRef(true);

  // Load from storage
  useEffect(() => {
    const loadBooks = async () => {
      try {
        const saved = await storage.get('clarity_executive_library');
        if (saved && Array.isArray(saved) && saved.length > 0) {
          setBooks(saved);
        } else {
          setBooks(INITIAL_BOOKS);
        }
      } catch (err) {
        setBooks(INITIAL_BOOKS);
      }
      isInitialMount.current = false;
    };
    loadBooks();
  }, []);

  // Save changes
  useEffect(() => {
    if (!isInitialMount.current && books.length > 0) {
      storage.set('clarity_executive_library', books);
    }
  }, [books]);

  // Update progress
  const handleUpdateProgress = (id, delta) => {
    sounds.playTap();
    setBooks(prev => prev.map(b => {
      if (b.id !== id) return b;
      const newPage = Math.max(0, Math.min(b.totalPages, b.currentPage + delta));
      const newProgress = Math.round((newPage / b.totalPages) * 100);
      const isCompleted = newProgress === 100;
      if (isCompleted && b.status !== 'completed') {
        sounds.playMilestone();
      }
      return {
        ...b,
        currentPage: newPage,
        progress: newProgress,
        status: isCompleted ? 'completed' : (newProgress > 0 ? 'reading' : b.status)
      };
    }));
  };

  // Mark 100% complete
  const handleCompleteBook = (id) => {
    sounds.playMilestone();
    setBooks(prev => prev.map(b => {
      if (b.id !== id) return b;
      return {
        ...b,
        currentPage: b.totalPages,
        progress: 100,
        status: 'completed'
      };
    }));
  };

  // Add Book
  const handleAddBook = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    sounds.playSwitch(true);
    const totalP = Number(newTotalPages) || 100;
    const currentP = Math.min(totalP, Number(newCurrentPage) || 0);
    const prog = Math.round((currentP / totalP) * 100);

    const gradients = [
      'linear-gradient(135deg, #1e3a8a, #3b82f6)',
      'linear-gradient(135deg, #065f46, #10b981)',
      'linear-gradient(135deg, #7c2d12, #ea580c)',
      'linear-gradient(135deg, #581c87, #a855f7)',
      'linear-gradient(135deg, #831843, #ec4899)'
    ];
    const randomGrad = gradients[Math.floor(Math.random() * gradients.length)];

    const tagsArr = newTags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const newBook = {
      id: `book-${Date.now()}`,
      title: newTitle.trim(),
      author: newAuthor.trim() || 'Author',
      category: newCategory,
      status: prog === 100 ? 'completed' : newStatus,
      progress: prog,
      currentPage: currentP,
      totalPages: totalP,
      rating: 5,
      coverGradient: randomGrad,
      keyInsight: newInsight.trim() || 'Key takeaways being synthesized.',
      tags: tagsArr.length > 0 ? tagsArr : [newCategory]
    };

    setBooks(prev => [newBook, ...prev]);
    setNewTitle('');
    setNewAuthor('');
    setNewInsight('');
    setNewTags('');
    setNewCurrentPage(0);
    setShowAddModal(false);
  };

  // Delete Book
  const handleDeleteBook = (id) => {
    sounds.playTick();
    setBooks(prev => prev.filter(b => b.id !== id));
  };

  // Filter books
  const filteredBooks = books.filter(b => {
    if (filter === 'all') return true;
    return b.status === filter;
  });

  // Aggregated Stats
  const completedCount = books.filter(b => b.status === 'completed').length;
  const inFlightCount = books.filter(b => b.status === 'reading').length;
  const totalPagesRead = books.reduce((acc, b) => acc + (b.currentPage || 0), 0);
  const totalMentalModels = books.reduce((acc, b) => acc + (b.tags ? b.tags.length : 0), 0);

  return (
    <div className={`tracker-card card-library ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="card-header" onClick={isCollapsed ? onToggleCollapse : undefined}>
        <h2>
          <span className="card-title-group" onClick={onToggleCollapse} role="button" tabIndex={0}>
            <span>📚 Executive Library</span>
          </span>
          <div className="card-header-actions" onClick={e => e.stopPropagation()}>
            {isCollapsed && (
              <span className="card-stat-pill">
                {inFlightCount} Reading • {completedCount} Read • {totalPagesRead}p
              </span>
            )}
            <span className="card-badge">Thought Architecture</span>
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
        <div className="card-content library-content">
          {/* Metrics & Filter Bar */}
          <div className="library-top-bar">
            <div className="library-stats-strip">
              <div className="library-stat-pill">
                <span className="lib-stat-num">{completedCount}</span>
                <span className="lib-stat-text">Completed</span>
              </div>
              <div className="library-stat-pill">
                <span className="lib-stat-num text-cyan">{inFlightCount}</span>
                <span className="lib-stat-text">In Flight</span>
              </div>
              <div className="library-stat-pill">
                <span className="lib-stat-num text-amber">{totalPagesRead.toLocaleString()}</span>
                <span className="lib-stat-text">Pages Read</span>
              </div>
              <div className="library-stat-pill">
                <span className="lib-stat-num text-purple">{totalMentalModels}</span>
                <span className="lib-stat-text">Mental Models</span>
              </div>
            </div>

            <div className="library-action-row">
              <div className="library-filter-tabs">
                <button 
                  className={`lib-tab ${filter === 'all' ? 'active' : ''}`}
                  onClick={() => { sounds.playTap(); setFilter('all'); }}
                >
                  All ({books.length})
                </button>
                <button 
                  className={`lib-tab ${filter === 'reading' ? 'active' : ''}`}
                  onClick={() => { sounds.playTap(); setFilter('reading'); }}
                >
                  Reading ({inFlightCount})
                </button>
                <button 
                  className={`lib-tab ${filter === 'completed' ? 'active' : ''}`}
                  onClick={() => { sounds.playTap(); setFilter('completed'); }}
                >
                  Completed ({completedCount})
                </button>
              </div>

              <button 
                className="library-add-btn"
                onClick={() => { sounds.playTap(); setShowAddModal(true); }}
                title="Add a new executive book or paper"
              >
                <span>+ Add Book</span>
              </button>
            </div>
          </div>

          {/* Books List Grid */}
          <div className="library-books-grid">
            {filteredBooks.map((book) => {
              const isInsightExpanded = expandedInsightId === book.id;

              return (
                <div key={book.id} className="book-card">
                  {/* Book Spine / Cover Preview */}
                  <div className="book-cover-accent" style={{ background: book.coverGradient }}>
                    <div className="book-cover-ribbon">
                      <span>{book.category.split(' ')[0]}</span>
                    </div>
                  </div>

                  <div className="book-details">
                    <div className="book-head">
                      <div>
                        <div className="book-meta-top">
                          <span className="book-category-tag">{book.category}</span>
                          <span className={`book-status-badge ${book.status}`}>
                            {book.status === 'completed' ? '✓ Read' : `${book.progress}%`}
                          </span>
                        </div>
                        <h4 className="book-title">{book.title}</h4>
                        <p className="book-author">by {book.author}</p>
                      </div>
                      <button 
                        className="book-delete-btn" 
                        onClick={() => handleDeleteBook(book.id)}
                        title="Delete book"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Progress Bar & Page Stepper */}
                    <div className="book-progress-section">
                      <div className="book-progress-bar-wrap">
                        <div 
                          className="book-progress-fill" 
                          style={{ 
                            width: `${book.progress}%`,
                            background: book.status === 'completed' ? '#10b981' : 'linear-gradient(90deg, #38bdf8, #818cf8)'
                          }} 
                        />
                      </div>
                      <div className="book-pages-row">
                        <span className="pages-read-label">
                          {book.currentPage} / {book.totalPages} pages ({book.progress}%)
                        </span>
                        {book.status !== 'completed' && (
                          <div className="pages-stepper-btns">
                            <button 
                              onClick={() => handleUpdateProgress(book.id, -20)}
                              title="Decrease 20 pages"
                            >
                              -20p
                            </button>
                            <button 
                              onClick={() => handleUpdateProgress(book.id, 25)}
                              title="Advance 25 pages"
                            >
                              +25p
                            </button>
                            <button 
                              onClick={() => handleCompleteBook(book.id)}
                              className="btn-mark-done"
                              title="Mark as completed"
                            >
                              ✓ Done
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tags Pills */}
                    {book.tags && book.tags.length > 0 && (
                      <div className="book-tags-cluster">
                        {book.tags.map((tag, tIdx) => (
                          <span key={tIdx} className="book-tag-pill">{tag}</span>
                        ))}
                      </div>
                    )}

                    {/* Key Insight Accordion */}
                    {book.keyInsight && (
                      <div className="book-insight-box">
                        <button 
                          className="book-insight-toggle"
                          onClick={() => setExpandedInsightId(isInsightExpanded ? null : book.id)}
                        >
                          <span className="insight-sparkle">💡</span>
                          <span>Executive Mental Model & Takeaway</span>
                          <span className="insight-arrow">{isInsightExpanded ? '▲' : '▼'}</span>
                        </button>
                        {isInsightExpanded && (
                          <blockquote className="book-insight-quote">
                            "{book.keyInsight}"
                          </blockquote>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Book Modal */}
          {showAddModal && (
            <div className="library-modal-overlay" onClick={() => setShowAddModal(false)}>
              <div className="library-modal-card" onClick={e => e.stopPropagation()}>
                <div className="library-modal-header">
                  <h3>Add Executive Book or Paper</h3>
                  <button className="library-modal-close" onClick={() => setShowAddModal(false)}>✕</button>
                </div>
                <form onSubmit={handleAddBook} className="library-modal-form">
                  <div className="form-group">
                    <label>Book / Paper Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Accelerate, An Elegant Puzzle, Thinking Fast & Slow" 
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      autoFocus
                      required
                    />
                  </div>

                  <div className="form-row-2">
                    <div className="form-group">
                      <label>Author</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Nicole Forsgren, Gene Kim" 
                        value={newAuthor}
                        onChange={e => setNewAuthor(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Category</label>
                      <select value={newCategory} onChange={e => setNewCategory(e.target.value)}>
                        <option value="System Architecture">System Architecture</option>
                        <option value="Executive Leadership">Executive Leadership</option>
                        <option value="Behavioral Systems">Behavioral Systems</option>
                        <option value="Technical Craft">Technical Craft</option>
                        <option value="Psychology & Mindset">Psychology & Mindset</option>
                        <option value="Product Strategy">Product Strategy</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row-3">
                    <div className="form-group">
                      <label>Total Pages</label>
                      <input 
                        type="number" 
                        value={newTotalPages} 
                        onChange={e => setNewTotalPages(e.target.value)}
                        min="1"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Current Page</label>
                      <input 
                        type="number" 
                        value={newCurrentPage} 
                        onChange={e => setNewCurrentPage(e.target.value)}
                        min="0"
                      />
                    </div>
                    <div className="form-group">
                      <label>Status</label>
                      <select value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                        <option value="reading">Currently Reading</option>
                        <option value="completed">Completed</option>
                        <option value="up-next">Up Next / Backlog</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Key Mental Model or Takeaway Quote</label>
                    <textarea 
                      placeholder="What high-leverage principle or paradigm did you extract from this reading?"
                      value={newInsight}
                      onChange={e => setNewInsight(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="form-group">
                    <label>Tags & Mental Models (comma separated)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Distributed Consensus, Leverage, Flywheel"
                      value={newTags}
                      onChange={e => setNewTags(e.target.value)}
                    />
                  </div>

                  <div className="library-modal-actions">
                    <button type="button" className="btn-cancel" onClick={() => setShowAddModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn-save">
                      Save to Library
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

