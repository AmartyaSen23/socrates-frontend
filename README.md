# 🖥️ Socrates AI: Institutional Research Terminal (Frontend)
![Next.js](https://img.shields.io/badge/Next.js-14+-black.svg?logo=next.js)
![React](https://img.shields.io/badge/React-18.0-61DAFB.svg?logo=react)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.0-38B2AC.svg?logo=tailwind-css)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6.svg?logo=typescript)
![Vercel](https://img.shields.io/badge/Vercel-Deployment-000000.svg?logo=vercel)
## 🧠 Overview

The Socrates Frontend is a high-performance, asynchronous React application designed to replicate the aesthetic, speed, and functionality of an institutional Bloomberg Terminal.

It provides a seamless, non-blocking User Experience (UX) while orchestrating complex backend pipelines, streaming Deep SEC RAG vectorization logs, and rendering multi-dimensional financial intelligence in real-time.

## ✨ Key Technical Achievements (The "Wow" Factor)

### 1. The "Immortal" Terminal Polling Architecture

Standard loading spinners are opaque and represent poor UX for data-heavy applications. Socrates features a live, sticky terminal console that streams the backend's exact execution telemetry to the user.

Optimized State Management: Employs functional React state updates (setLogs(prev => [...])) and strict array capping (MAX_LOGS = 50) to entirely prevent memory bloat and DOM churn during high-frequency polling.

Race-Condition Immunity: Engineered to handle microsecond backend cache-hits. It forces an immediate, synchronous log-fetch upon main API resolution, guaranteeing that even sub-second 200 OK responses update the terminal correctly before the unmounting of the polling interval.

### 2. Non-Blocking Background RAG UX

When triggering a "DEEP SEC RAG" analysis on a massive, un-vectorized 10-K filing, the UI intelligently intercepts HTTP 400 (Vectorization in progress) status codes.

Instead of crashing or hanging, the UI cleanly detaches the main request, displays a system alert, and transitions the terminal into a "LIVE" state.

It streams the recursive chunking and PostgreSQL vector insertion process directly to the user, keeping the operator engaged while the backend processes thousands of semantic chunks.

### 3. Asynchronous Market Integrations

TradingView Institutional Charts: Embedded via highly optimized HTML5 iframes that persist dynamically based on the activeTicker state, refusing to unmount during active AI RAG queries.

Live US Macro Dashboard: A dynamic header asynchronously fetching US CPI Inflation, GDP, Unemployment, and Fed Funds Rates to establish a top-down macroeconomic view before localized stock-specific research.

### 4. Grid-Stabilized UI/UX

Engineered using a strict 12-column CSS Grid architecture. The terminal operates as a persistent, sticky 4-column sidebar that maps execution telemetry alongside an 8-column primary dashboard rendering Llama-3's intelligence output (Sentiment, Bull/Bear Cases, Risk/Growth matrices).

## 🛠️ Tech Stack & Requirements

Framework: Next.js (App Router compatible), React 18+

Styling: Tailwind CSS (Deep neutral/emerald/red quantitative palette)

Data Fetching: Native fetch API with highly optimized useEffect interval cleanup.

Charting: Embedded TradingView Advanced Chart Widgets.

## 🚀 Quick Start
```
# Install dependencies
npm install

# Boot the terminal in development mode
npm run dev
```

(Open http://localhost:3000 to initiate the uplink).

## 👨‍💻 Author

Amartya Sen | B.Tech in Artificial Intelligence and Machine Learning (Core CSE with Specialization)
Architecting resilient, autonomous AI systems at the intersection of quantitative finance and deep learning.
