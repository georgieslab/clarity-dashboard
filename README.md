# 🔮 Clarity — Executive Telemetry, Multimodal AI & Apple Glass PWA

[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Amazon Bedrock](https://img.shields.io/badge/Cloud_AI-Amazon_Bedrock-FF9900?logo=amazon-aws&logoColor=white)](https://aws.amazon.com/bedrock/)
[![Amazon Polly](https://img.shields.io/badge/Voice_AI-Amazon_Polly-FF9900?logo=amazon-aws&logoColor=white)](https://aws.amazon.com/polly/)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable_&_Offline-4A154B?logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Clarity** is an executive-grade life telemetry dashboard, multimodal AI copilot, and Progressive Web App built with Apple’s **visionOS 2.0 / macOS Sequoia liquid glass** design system. 

It combines holistic executive wellness and career tracking (Sobriety, Career Pipeline, Therapy, Atomic Habits, Executive Thought Library, and Focus Rhythm) with **Lumen**, an ambient multimodal voice and vision partner powered by **Amazon Bedrock (DeepSeek-V3.2 / Converse API)** and **Amazon Polly Neural Voice (Matthew)**.

---

## 🌟 What's Inside

### 📱 1. Standalone Progressive Web App (PWA) & Offline Resilience
* **Desktop & Mobile Installability**: Runs borderless as a standalone native app on macOS, Windows, iOS, and Android.
* **Service Worker Cache-First Engine** (`public/sw.js`): High-speed asset precaching with graceful offline API fallback telemetry.
* **Apple Mobile Integration**: Native iOS status bar translucency, notch/Dynamic Island edge-to-edge support (`viewport-fit=cover`), and home-screen install guide.

### 🎙️ 2. Lumen — Multimodal Voice & Vision Copilot
* **Amazon Bedrock DeepSeek-V3.2 Engine**: Real-time conversational partner powered by high-reasoning LLMs via the AWS Converse API.
* **Amazon Polly Neural TTS**: Spoken responses generated with Polly's natural, calm male executive voice (*Matthew*).
* **HTML5 Canvas Downscaled Vision**: Instant camera & screenshot analysis compressed to optimized `720px / ~35KB` JPEG payloads.
* **Interactive Floating Capsule**: Spatial frosted glass indicator with live audio waveform pulses.

### 🫁 3. VisionDock & The Executive Utilities Suite
Floating visionOS bottom dock stripped of duplicate tiles and equipped with high-leverage daily executive micro-tools:
* **🫁 Vagus Nerve Box Breathing Reset**: 4-4-4-4 resonant respiratory protocol (Inhale 4s &rarr; Hold 4s &rarr; Exhale 4s &rarr; Rest 4s) with an animated liquid orb and harmonic chimes.
* **🎧 Binaural Flow Soundscapes**: Zero-dependency, 100% offline procedural Web Audio synthesizer:
  * **40Hz Gamma Focus** (216Hz + 256Hz binaural beat for deep cognitive flow)
  * **Rain on Glass** (Acoustic pink noise filter)
  * **Deep Ocean Waves** (0.12Hz LFO rhythmic tidal sweep)
  * **Zen Resonance** (432Hz harmonic drone)
* **⚡ Executive Quick Memo & Idea Inbox**: Frictionless scratchpad with instant local persistence and **"✨ Synthesize with Lumen"** task extraction.
* **🛡️ 90-Second Urge Surfer & Anchor**: Alan Marlatt craving regulation protocol with a 90-second circular countdown, 5-4-3-2-1 sensory grounding, Matthew voice anchor, and 988 emergency lifelines.
* **🔊 Audio Micro-Haptics Engine**: Native Web Audio synthesized spatial taps, ticks, and chimes with mute toggle.

### 📊 4. Core Executive Telemetry Modules
* **⚡ Atomic Habits Matrix**: 7-day rolling micro-habit matrix, today highlight pills, streak engine, and tactile audio feedback.
* **📚 Executive Thought & Reading Library**: 3D liquid glass book spines, page reading stepper (`-20p`, `+25p`, `✓ Done`), and mental model drawer.
* **📈 Life Velocity Analytics**: Interactive SVG velocity chart (7d/14d/30d applications vs. deep work) and 28-day consistency heatmap matrix.
* **🌱 Sobriety Tracker**: Real-time milestone unlocks with celebratory confetti micro-effects.
* **💼 Career Pipeline**: Drag-and-stage application tracker with active **Interview Shimmer Mode**.
* **🧠 Therapy Tracker**: Reflection logs, emotional horizon trends, and mental health micro-badges.
* **⏳ Focus Rhythm (Pomodoro)**: Customizable work/break routines with daily velocity logs.
* **✨ Executive Intelligence Briefing**: AI daily synthesis report with behavioral correlation insights.

### ⌘ 5. Spotlight Command Palette & Showcase Modals
* **Command Palette (<kbd>⌘K</kbd> / <kbd>Ctrl+K</kbd>)**: Keyboard-first navigation to jump to any module or launch executive tools.
* **⚡ Engineering Architecture Modal**: Interactive system specs covering AWS Bedrock, Polly, Web Audio, and Firestore synchronization.
* **🪄 Share Executive Telemetry Card**: Generate and export high-res frosted glass metric badges for social/portfolio showcase.
* **✨ 1-Click Executive Demo Mode**: Pre-seeded recruiter persona (142d sobriety, active offers, deep work logs) with zero-risk state restoration.

---

## 🏗️ Architecture & Technology Stack

```
                                  ┌───────────────────────────────┐
                                  │      Client (React + Vite)    │
                                  │   visionOS Liquid Glass UI    │
                                  └───────────────┬───────────────┘
                                                  │
                    ┌─────────────────────────────┼─────────────────────────────┐
                    ▼                             ▼                             ▼
       ┌────────────────────────┐    ┌────────────────────────┐    ┌────────────────────────┐
       │   PWA Service Worker   │    │  Web Audio Synthesizer │    │   Spotlight & Canvas   │
       │ Cache-First / Offline  │    │  Binaural 40Hz + Beats │    │ 720px Compressed Vision│
       └────────────────────────┘    └────────────────────────┘    └────────────────────────┘
                                                  │
                                                  ▼
                                  ┌───────────────────────────────┐
                                  │     Node.js / Express API     │
                                  │    Quota Shield & Fallback    │
                                  └───────────────┬───────────────┘
                                                  │
                    ┌─────────────────────────────┴─────────────────────────────┐
                    ▼                                                           ▼
       ┌────────────────────────┐                                  ┌────────────────────────┐
       │  Amazon Bedrock Engine │                                  │  Amazon Polly Service  │
       │     DeepSeek-V3.2      │                                  │  Neural Voice: Matthew │
       │  Converse API Routing  │                                  │  `eu-west-1` Ireland   │
       └────────────────────────┘                                  └────────────────────────┘
```

* **Frontend**: React 18, Vite 6, Web Audio API procedural synthesis, HTML5 Canvas API, PWA Service Worker.
* **Backend**: Node.js, Express, AWS SDK v3 (`@aws-sdk/client-bedrock-runtime`, `@aws-sdk/client-polly`).
* **Cloud AI**: Amazon Bedrock (`deepseek.v3.2`), Amazon Polly Neural Voice (`Matthew`).
* **Data & Cloud Sync**: Firebase Authentication (Google OAuth), Cloud Firestore, resilient `localStorage` quota shield.

---

## 🚀 Getting Started

### Prerequisites
* **Node.js** v18.0.0 or higher
* **npm** v9.0.0 or higher

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/georgieslab/clarity-dashboard.git
   cd clarity-dashboard/clarity
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the `clarity/` root directory:
   ```env
   PORT=3000
   NODE_ENV=development

   # AWS Bedrock & Polly Credentials
   AWS_REGION=eu-north-1
   POLLY_REGION=eu-west-1
   POLLY_VOICE_ID=Matthew
   BEDROCK_MODEL_ID=deepseek.v3.2
   AWS_ACCESS_KEY_ID=your_aws_access_key_id
   AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
   ```

4. **Launch Development Environment**:
   ```bash
   npm run dev:all
   ```
   * Open [http://localhost:5173](http://localhost:5173) in your browser.

5. **Production Build & Execution**:
   ```bash
   npm run build
   npm start
   ```
   * Accessible at [http://localhost:3000](http://localhost:3000).

---

## 📂 Project Directory Structure

```text
clarity/
├── dist/                          # Minified production bundle & service worker
├── public/                        # PWA Manifest, SW, logos & 192/512 icons
│   ├── manifest.json              # Web App Manifest (standalone, theme colors)
│   ├── sw.js                      # Cache-First Service Worker
│   ├── icon-192.png               # High-res PWA icon (192x192)
│   ├── icon-512.png               # High-res PWA icon (512x512)
│   └── clarity.svg                # Brand SVG aperture logo
├── src/
│   ├── components/
│   │   ├── VoiceAssistant.jsx     # Lumen Multimodal Voice & Vision Copilot
│   │   ├── VisionDock.jsx         # visionOS floating dock with executive tools
│   │   ├── BreathingResetModal.jsx# 4-4-4-4 Vagus Nerve Box Breathing
│   │   ├── BinauralFlowModal.jsx  # 40Hz Gamma & Ambient Soundscapes Modal
│   │   ├── QuickMemoModal.jsx     # Executive Quick Memo & Idea Inbox
│   │   ├── UrgeSurferModal.jsx    # 90-Second Urge Surfer & Anchor
│   │   ├── AtomicHabits.jsx       # 7-day rolling micro-habit matrix
│   │   ├── ExecutiveLibrary.jsx   # 3D glass book spines & reading tracker
│   │   ├── SpotlightCommand.jsx   # ⌘K Fuzzy Command Palette
│   │   ├── ArchitectureModal.jsx  # Engineering specs & architecture modal
│   │   ├── ShareCardModal.jsx     # Exportable glass executive telemetry card
│   │   ├── PWAInstallBanner.jsx   # Standalone PWA install pill & iOS guide
│   │   ├── DailyInsights.jsx      # Executive AI intelligence briefing
│   │   ├── TelemetryAnalytics.jsx # Velocity charts & 28-day consistency heatmap
│   │   ├── JobSearchTracker.jsx   # Job Pipeline & Interview Shimmer Mode
│   │   ├── SobrietyTracker.jsx    # Clean streak counter & milestones
│   │   ├── TherapyTracker.jsx     # Reflection logs & emotional horizon
│   │   └── PomodoroTimer.jsx      # Focus rhythm timer
│   ├── utils/
│   │   ├── audioEffects.js        # Spatial Web Audio micro-haptics
│   │   ├── binauralEngine.js      # Procedural Web Audio synthesizer (100% offline)
│   │   ├── demoData.js            # Recruiter persona seeding & restore engine
│   │   ├── firebase.js            # Firestore & Google Auth integration
│   │   ├── storage.js             # Dual local/cloud quota shield manager
│   │   └── openai.js              # Bedrock DeepSeek-V3.2 API client
│   ├── App.jsx                    # Core layout container & modal router
│   ├── App.css                    # visionOS 2.0 liquid glass tokens & animations
│   └── main.jsx                   # React 18 DOM mount point
├── build.js                       # High-performance esbuild bundler script
├── server.js                      # Express API server for Bedrock, Polly & Vision
└── package.json
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

<p align="center">
  Built with precision by <strong>Georgie Akopashvili</strong> 🔮
</p>
