# 🔮 Clarity — Executive Telemetry & Multimodal AI Copilot

[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![OpenAI GPT-6.1 Sol](https://img.shields.io/badge/AI_Engine-OpenAI_ChatGPT-412991?logo=openai&logoColor=white)](https://openai.com/)
[![AWS Bedrock](https://img.shields.io/badge/Cloud_AI-Amazon_Bedrock-FF9900?logo=amazon-aws&logoColor=white)](https://aws.amazon.com/bedrock/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Clarity** is a full-stack executive life telemetry dashboard and multimodal AI copilot built on Apple's **visionOS liquid glass design system**. It combines personal wellness tracking (sobriety, therapy, focus routines, and job search pipeline) with **Lumen**, a real-time voice and vision AI copilot powered by **OpenAI ChatGPT / GPT-6.1 Sol** and **Amazon Bedrock**.

---

## 🌟 Key Features

### 🎙️ 1. Lumen — Multimodal Voice & Vision Copilot
- **Voice-to-Voice Intelligence**: Conversational voice agent backed by **Amazon Polly Neural Engine** (Calm Male Voice: *Matthew*) and Web Speech API fallbacks.
- **Multimodal AI Vision**: Capture or attach photos to analyze physical notes, documents, or environments. Features client-side HTML5 canvas downscaling (`720px / ~35KB JPEG payloads`) for instant response times.
- **ChatGPT Engine Routing**: Priority model chain powered by **OpenAI GPT-6.1 Sol**, **GPT-4o**, and **Amazon Bedrock**.
- **Collapsed Floating Badge**: Sleek floating glass badge with live status pulse dot that opens the Lumen assistant from anywhere.

### 📊 2. Executive Telemetry Dashboard Modules
- **📈 Life Velocity & Telemetry Analytics**: Interactive SVG velocity chart (7d/14d/30d focus vs. applications), 28-day consistency heatmap matrix, and correlation index metrics (Interview yield %, Focus velocity, Sobriety stability).
- **🌱 Sobriety Tracker**: Real-time clean streak counter with milestone badges and motivational celebrations.
- **💼 Job Search Pipeline**: Drag-and-stage application tracker with active **Interview Shimmer Mode** for glowing active interview cards.
- **🧠 Therapy Tracker**: Reflection logs, emotional horizon trends, and mental health micro-badges.
- **⏳ Focus Rhythm (Pomodoro)**: Customizable work/break timer routines with daily telemetry metrics.
- **✨ Executive Intelligence Briefing**: AI daily synthesis report powered by **OpenAI ChatGPT** with a dynamic 3D neural thinking orb stage.

### 🎨 3. Apple visionOS Liquid Glass Design System
- **Specular Highlights & Ambient Fluid Orbs**: Multi-stop glass refraction edges and organic ambient background blur.
- **Customizable Neon Tile Outer Glows**: Distinct aura glows for each module (Rose, Emerald, Indigo, Amber, Cyan) with global and per-popover ON/OFF controls.
- **Tiles Layout Customizer**: Collapse, expand, or hide modules to tailor your workflow workspace.
- **Mobile-First Responsiveness**: Converts into a native mobile bottom-sheet drawer on smartphones and responsive single-column layouts across all devices.

### 🛡️ 4. Enterprise-Grade Storage & Cloud Resilience
- **Dual-Storage Synchronization**: Cloud sync via **Firebase Auth** and **Firestore** paired with local `localStorage` persistence.
- **Storage Quota Protection**: Sanitizes image payloads to protect `localStorage` from `QuotaExceededError` crashes and isolates offline local state from cloud permission drops.

---

## 🏗️ Architecture & Tech Stack

- **Frontend**: React 18, Vite 6, HTML5 Canvas API, Web Audio API, CSS3 Liquid Glass Tokens.
- **Backend & Middleware**: Node.js, Express, CORS, dotenv, 15MB extended body parser.
- **AI & Multimodal Engines**:
  - **Amazon Bedrock**: `openai.gpt-6.1-sol`, `openai.gpt-6.1`, `openai.gpt-oss-120b-1:0`
  - **OpenAI Direct API Fallback**: `gpt-4o`, `gpt-4o-mini`
  - **Amazon Polly**: Neural Voice engine (`eu-west-1` Ireland deployment)
- **Database & Auth**: Firebase Firestore, Firebase Authentication (Google Sign-In).
- **Deployment**: Render / Node.js production server with automated GitHub CI/CD.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18.0.0 or higher
- **npm** v8.0.0 or higher

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
   Create a `.env` file in the `clarity/` directory:
   ```env
   PORT=3000
   NODE_ENV=development

   # Amazon Bedrock & Polly Credentials
   AWS_ACCESS_KEY_ID=your_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   AWS_REGION=eu-north-1
   POLLY_REGION=eu-west-1
   POLLY_VOICE_ID=Matthew

   # OpenAI Direct API Fallback Key
   OPENAI_API_KEY=your_openai_api_key
   VITE_OPENAI_API_KEY=your_openai_api_key
   ```

4. **Run the Application**:

   - **Development (Frontend + Backend concurrently)**:
     ```bash
     npm run dev:all
     ```
     - Open [http://localhost:5173](http://localhost:5173) in your browser.

   - **Production Build & Server**:
     ```bash
     npm run build
     npm start
     ```

---

## 📂 Project Structure

```text
clarity/
├── dist/                      # Static production bundle
├── public/                    # Logos, SVG assets, and icons
├── src/
│   ├── components/
│   │   ├── VoiceAssistant.jsx # Lumen Multimodal Voice & Vision Copilot
│   │   ├── DailyInsights.jsx  # Executive Intelligence Briefing
│   │   ├── TelemetryAnalytics.jsx # Life Velocity & Telemetry Analytics (SVG charts & heatmap)
│   │   ├── JobSearchTracker.jsx# Job Pipeline & Interview Shimmer Mode
│   │   ├── SobrietyTracker.jsx# Clean streak counter & milestones
│   │   ├── TherapyTracker.jsx  # Reflection log & emotional horizon
│   │   ├── PomodoroTimer.jsx   # Focus rhythm timer
│   │   ├── AuthButton.jsx      # Google Firebase Sign-In
│   │   └── ThemeToggle.jsx     # Floating theme switcher
│   ├── utils/
│   │   ├── firebase.js        # Firebase Firestore & Auth integration
│   │   ├── storage.js         # Decoupled LocalStorage & Cloud storage manager
│   │   └── openai.js          # OpenAI ChatGPT backend API utilities
│   ├── App.jsx                # Main dashboard container & tile customizer
│   ├── App.css                # Apple visionOS liquid glass design system
│   └── main.jsx               # React entry point
├── build.js                   # High-performance esbuild bundler script
├── server.js                  # Express API server for Bedrock OpenAI, Polly & Vision
└── package.json
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">
  Built with precision by <strong>Georgie Akopashvili</strong> 🔮
</p>
