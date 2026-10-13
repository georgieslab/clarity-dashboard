import { sounds } from '../utils/audioEffects';

export default function ArchitectureModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="arch-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="arch-modal-card" onClick={e => e.stopPropagation()}>
        <header className="arch-modal-header">
          <div className="arch-modal-title-group">
            <div className="arch-badge-pill">⚡ System Architecture & Specs</div>
            <h2>Clarity — Full-Stack Telemetry & Multimodal Copilot</h2>
            <p>Engineered with React 18, Vite 6, Express, Amazon Bedrock, Polly Neural Engine, and visionOS Liquid Glass.</p>
          </div>
          <button 
            className="arch-close-btn" 
            onClick={() => { sounds.playTap(); onClose(); }}
            aria-label="Close architecture modal"
          >
            ✕
          </button>
        </header>

        <div className="arch-modal-body">
          {/* Section 1: Architecture Pipeline Visualization */}
          <div className="arch-section">
            <h3 className="arch-section-title">🔮 End-to-End Multimodal Intelligence Pipeline</h3>
            <div className="arch-pipeline-grid">
              <div className="arch-pipeline-step">
                <span className="step-num">01</span>
                <h4>Client Audio & Vision Capture</h4>
                <p>Web Speech API continuous recognition paired with HTML5 Canvas downscaling (720px JPEG, ~35KB) for sub-second vision payloads.</p>
                <div className="step-tag">HTML5 Canvas • Web Audio</div>
              </div>

              <div className="arch-pipeline-arrow">→</div>

              <div className="arch-pipeline-step">
                <span className="step-num">02</span>
                <h4>Node / Express Gateway</h4>
                <p>Extended 15MB base64 payload processor, CORS security headers, error-tolerant model router with OpenAI direct fallback.</p>
                <div className="step-tag">Node.js • Express • REST</div>
              </div>

              <div className="arch-pipeline-arrow">→</div>

              <div className="arch-pipeline-step">
                <span className="step-num">03</span>
                <h4>Amazon Bedrock + DeepSeek-V3.2</h4>
                <p>Bedrock Converse API priority routing to DeepSeek-V3.2 in eu-north-1 with multi-turn telemetry memory injection.</p>
                <div className="step-tag">AWS Bedrock • DeepSeek-V3.2</div>
              </div>

              <div className="arch-pipeline-arrow">→</div>

              <div className="arch-pipeline-step">
                <span className="step-num">04</span>
                <h4>Amazon Polly Neural Voice</h4>
                <p>Ireland region (eu-west-1) neural TTS streaming Matthew voice back as raw MP3 audio buffer directly into HTML5 Audio.</p>
                <div className="step-tag">Amazon Polly Neural</div>
              </div>
            </div>
          </div>

          {/* Section 2: Technical Highlights & Engineering Decisions */}
          <div className="arch-section">
            <h3 className="arch-section-title">🛡️ Resilient Systems & Core Design Decisions</h3>
            <div className="arch-cards-grid">
              <div className="arch-highlight-card">
                <div className="arch-card-icon">💽</div>
                <h4>Dual-Layer Storage & Quota Shield</h4>
                <p>
                  Combines Firebase Cloud Firestore with offline-first localStorage. Automatically strips heavy base64 vision images from local storage to prevent <code>QuotaExceededError</code> browser crashes while preserving chat transcripts.
                </p>
              </div>

              <div className="arch-highlight-card">
                <div className="arch-card-icon">🎨</div>
                <h4>visionOS Liquid Glass Geometry</h4>
                <p>
                  Multi-stop specular highlights, concentric corner radii calculation (<var>R<sub>inner</sub> = R<sub>outer</sub> - padding</var>), dynamic cursor-tracking specular light glints, and hardware-accelerated CSS backdrop filters.
                </p>
              </div>

              <div className="arch-highlight-card">
                <div className="arch-card-icon">🔊</div>
                <h4>Native Web Audio Micro-Haptics</h4>
                <p>
                  Zero external sound assets. Pure mathematical sine and triangle wave synthesis for tactile glass taps, toggle clicks, and milestone chords, keeping total bundle size lean.
                </p>
              </div>

              <div className="arch-highlight-card">
                <div className="arch-card-icon">⚡</div>
                <h4>Zero-Latency esbuild Bundler</h4>
                <p>
                  Custom high-speed esbuild build pipeline in <code>build.js</code> bundling JSX, modern CSS variables, and vendor packages into production distribution in under 300ms.
                </p>
              </div>

              <div className="arch-highlight-card">
                <div className="arch-card-icon">📲</div>
                <h4>PWA & Offline Service Worker</h4>
                <p>
                  Full standalone Web App Manifest, Service Worker cache-first shell strategy, 192/512px maskable icons, and native iOS Home Screen installation instructions.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Tech Stack Breakdown */}
          <div className="arch-section">
            <h3 className="arch-section-title">📦 Technology Matrix</h3>
            <div className="arch-tech-pills">
              <span className="tech-pill">React 18.3</span>
              <span className="tech-pill">Vite 6</span>
              <span className="tech-pill">Progressive Web App (PWA)</span>
              <span className="tech-pill">Service Worker Cache API</span>
              <span className="tech-pill">AWS Bedrock SDK</span>
              <span className="tech-pill">Amazon Polly Neural</span>
              <span className="tech-pill">OpenAI GPT-4o / GPT-6.1 Sol</span>
              <span className="tech-pill">Node.js & Express</span>
              <span className="tech-pill">Firebase Firestore & Auth</span>
              <span className="tech-pill">Web Audio API</span>
              <span className="tech-pill">HTML5 Canvas API</span>
              <span className="tech-pill">visionOS CSS Tokens</span>
            </div>
          </div>
        </div>

        <footer className="arch-modal-footer">
          <a 
            href="https://github.com/georgieslab/clarity-dashboard" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="arch-github-link"
          >
            <span>View Source on GitHub</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg>
          </a>
          <button 
            className="arch-done-btn"
            onClick={() => { sounds.playTap(); onClose(); }}
          >
            Done
          </button>
        </footer>
      </div>
    </div>
  );
}
