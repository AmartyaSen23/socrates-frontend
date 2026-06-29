🏛️ Socrates Research Engine - Frontend Interface

Autonomous Quantitative Research Terminal
Engineered for real-time institutional sentiment analysis and Deep SEC RAG.

🚀 Overview

The Socrates Frontend is a high-performance Next.js React application designed to mimic the aesthetic and functionality of a Bloomberg Terminal. It provides a seamless, non-blocking User Experience (UX) while the backend executes heavy quantitative pipelines, vectorizes SEC filings, and aggregates multi-API financial data.

🛠️ Key Architectural Triumphs

1. The "Immortal" Terminal Polling

Standard loading spinners are opaque. Socrates features a live, sticky terminal console (lg:col-span-4) that streams the backend's exact execution state to the user in real-time.

The Logic: A highly optimized useEffect interval polls the backend's /status/{ticker} endpoint every 1.5 seconds.

Resilience: It gracefully handles race conditions by strictly fetching logs immediately after the main API call resolves, guaranteeing that sub-second Cache Hits are perfectly rendered to the UI without skipping a beat.

2. Non-Blocking Background RAG (Deep SEC)

When triggering a "DEEP SEC RAG" analysis on a massive, un-vectorized 10-K filing, the UI doesn't crash or freeze.

It intercepts the backend's 400 HTTPException indicating background processing.

It displays a clean warning banner, transitions the terminal into a "LIVE" state, and streams the chunking and vector insertion process directly to the user while keeping the TradingView charts fully interactive.

3. Integrated Live Market Data

TradingView Advanced Charts: Embedded instantly upon ticker selection, providing live candlestick data, technical indicators, and historical context right next to the AI's fundamental analysis.

Live US Macro Dashboard: A dynamic header powered by the St. Louis FED API, tracking live US CPI Inflation, GDP, Unemployment, and Fed Funds Rates.

💻 Tech Stack

Framework: Next.js (React)

Styling: Tailwind CSS (Deep neutral/emerald color palette for quantitative aesthetics)

Components: Native HTML5 iframes (TradingView), pure React state management for log queues.

🧠 The Intelligence Dashboard

Once the backend Groq Agent resolves the data, the UI renders a 3-tier intelligence matrix:

Scoring: Normalized Sentiment ([-1.0 to 1.0]), Bull Score, and Risk Score.

Prose Analysis: Institutional Bull Case and Bear Case generated via Llama-3 70b.

Data Points: Extracted Growth Drivers and Major Risks mapped directly from SEC 10-K filings.

⚙️ Quick Start

# Install dependencies
npm install

# Run the development server
npm run dev


Open http://localhost:3000 with your browser to see the result.
