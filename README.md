<div align="center">

<!-- ANIMATED HERO WAVE BANNER -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=0:06090e,35:0f172a,70:065f46,100:0891b2&height=230&section=header&text=SOCRATES%20AI%20%E2%80%94%20RESEARCH%20TERMINAL&fontSize=40&fontColor=ffffff&fontAlignY=38&desc=Institutional%20Next.js%2016%20%26%20React%2019%20Workstation%20%E2%80%A2%20Live%20RAG%20Telemetry%20%E2%80%A2%2060fps%20Quantum%20UX&descAlignY=60&descSize=15&animation=fadeIn" width="100%" alt="Socrates AI Frontend Banner" />

<!-- ANIMATED TYPING TELEMETRY SVG -->
<a href="https://socrates-frontend.vercel.app">
  <img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=700&size=18&duration=2600&pause=900&color=10B981&center=true&vCenter=true&width=920&lines=%F0%9F%96%A5%EF%B8%8F+Bloomberg-Grade+12-Column+Quantitative+Workstation+(Next.js+16.2+%26+React+19.2);%E2%9A%A1+Immortal+1.5s+Telemetry+Console+%E2%80%A2+Race-Condition-Immune+Request+Sequencing;%F0%9F%8E%AF+60fps+GPU-Accelerated+Quantum+Reticle+Cursor+%26+Keyboard-First+Command+Bar;%F0%9F%8F%A6+6+Institutional+Sector+Desks+(32+Equities)+%E2%80%A2+Curated+Intelligence+Vault+%E2%80%A2+TradingView" alt="Typing Telemetry SVG" />
</a>

<br />

<!-- TECH STACK & DEPLOYMENT BADGES -->
<p align="center">
  <a href="https://socrates-frontend.vercel.app"><img src="https://img.shields.io/badge/LAUNCH_TERMINAL-LIVE_DEMO-10B981?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Terminal" /></a>
  <img src="https://img.shields.io/badge/Next.js-16.2.9-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React-19.2.4-61DAFB?style=for-the-badge&logo=react&logoColor=000000" alt="React 19" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS v4" />
  <img src="https://img.shields.io/badge/TypeScript-5.0_Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript 5" />
  <img src="https://img.shields.io/badge/TradingView-Advanced_Widgets-131722?style=for-the-badge&logo=tradingview&logoColor=06B6D4" alt="TradingView" />
  <img src="https://img.shields.io/badge/Supabase-3--Tier_Sync-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
</p>

<!-- QUICK NAVIGATION BAR -->
<p align="center">
  <a href="#-executive-ux--performance-scorecard"><kbd>📊 UX Scorecard</kbd></a> •
  <a href="#️-visual-workstation-blueprint"><kbd>🖥️ Terminal Blueprint</kbd></a> •
  <a href="#-client-architecture--data-flow"><kbd>🧬 Client Architecture</kbd></a> •
  <a href="#-immortal-telemetry--non-blocking-rag-state-machine"><kbd>⚡ Immortal Polling</kbd></a> •
  <a href="#-3-tier-resilient-persistence-cascade"><kbd>🛡️ 3-Tier Persistence</kbd></a> •
  <a href="#-institutional-sector-desks-32-equities"><kbd>🏦 6 Sector Desks</kbd></a> •
  <a href="#-quick-start--local-development"><kbd>🚀 Quick Start</kbd></a>
</p>

</div>

---

## 📊 Executive UX & Performance Scorecard

<table>
  <tr>
    <td align="center" width="25%">
      <img src="https://img.shields.io/badge/TELEMETRY_STREAM-1500ms-10B981?style=for-the-badge" alt="Telemetry Stream" /><br />
      <sub><b>Immortal Polling Engine</b><br />Capped ring buffer (`MAX_LOGS = 60`) + monotonic `requestIdRef` concurrency guard</sub>
    </td>
    <td align="center" width="25%">
      <img src="https://img.shields.io/badge/CURSOR_PHYSICS-60_FPS-06B6D4?style=for-the-badge" alt="60fps Cursor" /><br />
      <sub><b>GPU-Accelerated Reticle</b><br />Zero-re-render `requestAnimationFrame` `translate3d` interpolation (`0.22` lerp)</sub>
    </td>
    <td align="center" width="25%">
      <img src="https://img.shields.io/badge/SECTOR_COVERAGE-32_EQUITIES-8B5CF6?style=for-the-badge" alt="Sector Coverage" /><br />
      <sub><b>6 Institutional Desks</b><br />1-click analysis across US Mega-Caps, Semis, Wall St, Defense &amp; `20-F` ADRs</sub>
    </td>
    <td align="center" width="25%">
      <img src="https://img.shields.io/badge/OFFLINE_RESILIENCE-3_TIERS-F59E0B?style=for-the-badge" alt="3-Tier Persistence" /><br />
      <sub><b>Zero-Data-Loss State</b><br />FastAPI Primary → Direct Supabase REST → `localStorage` Optimistic Sync</sub>
    </td>
  </tr>
</table>

---

## 🖥️ Visual Workstation Blueprint

The entire interface in [`app/page.tsx`](file:///C:/Users/Amart/Desktop/Projects/socrates-frontend/app/page.tsx) is engineered as a **zero-page-reload, single-screen institutional workstation** modeled after a Bloomberg Terminal:

```text
┌───────────────────┬──────────────────────────────────────────────────────────────────────────────────┐
│ 🏛️ SOCRATES v3.0  │ ● US MACRO (FRED):  GDP: $29.35T  │  CPI INDEX: 314.12 pts  │  FED FUNDS: 4.83% ↻ │
│ Quant RAG Terminal├──────────────────────────────────────────────────────────────────────────────────┤
├───────────────────┤ [AUTONOMOUS MULTI-AGENT EQUITY INTELLIGENCE]                                     │
│ [WATCH][VAULT][6] │ Socrates Research Engine        [$ NVDA        /] [⚡ FAST] [🔬 DEEP RAG] [★ PIN] │
├───────────────────┼───────────────────────────────────────────────────────┬──────────────────────────┤
│ ★ TRACKED ASSETS  │ 📈 $NVDA LIVE TRADINGVIEW CHART          [1H][1D][1W] │ ●●● TELEMETRY: $NVDA     │
│ ● SEC RSS Live    │ ┌───────────────────────────────────────────────────┐ │ [● LIVE]     [AUTO][CLR] │
│ ┌───────────────┐ │ │  Candlesticks + Volume + Technical Overlays       │ ├──────────────────────────┤
│ │ $NVDA   [88]  │ │ │  (Persistent HTML5 iframe — zero unmount churn)   │ │ 1.XBRL 2.NEWS 3.RAG 4.AI │
│ │ $MSFT   [82]  │ │ └───────────────────────────────────────────────────┘ ├──────────────────────────┤
│ │ $AAPL   [76]  │ ├───────────────────────────────────────────────────────┤ 01 > Validating equity...│
│ └───────────────┘ │ 🧠 $NVDA Intelligence Report       [🔬 DEEP SEC RAG]  │ 02 > SEC XBRL Success.   │
│                   │ ┌────────────┬────────────┬────────────┬────────────┐ │ 03 > FMP Valuation OK.   │
│ ◷ VAULT CURATION  │ │ SENTIMENT  │ BULL SCORE │ INST. RISK │ CONFIDENCE │ │ 04 > 15 Benzinga News.   │
│ [UNIQUE] [≥7D]    │ │ BULLISH 88 │   91/100   │   28/100   │    94%     │ │ 05 > 3-Query Cohere v3   │
│                   │ │ Norm +0.76 │ █████████░ │ ███░░░░░░░ │ █████████░ │ │ 06 > Groq Llama-3.3 70B  │
│ ❖ 6 SECTOR DESKS  │ └────────────┴────────────┴────────────┴────────────┘ │ 07 > Report Ready! ▊     │
│ • AI & Semis (6)  │ ┌───────────────────────────────────────────────────┐ ├──────────────────────────┤
│ • Hyperscale (6)  │ │ MKT CAP: $3.42T │ REV: $130.5B │ EPS: $2.94 │ P/E │ │ ✓ NVDA SEC Vectors Ready │
│ • Wall St (6)     │ └───────────────────────────────────────────────────┘ │         [Run Deep RAG →] │
│ • Cyber/Def (4)   │ [AI INSTITUTIONAL THESIS] [NEWS (15)] [SEC TELEMETRY] └──────────────────────────┘
│ • BioPharma (4)   │ ┌─────────────────────────┬─────────────────────────┐                            │
│ • Global ADRs (6) │ │ ▲ INSTITUTIONAL BULL    │ ▼ INSTITUTIONAL BEAR    │                            │
├───────────────────┤ │   Catalysts & Margins   │   Structural Headwinds  │                            │
│ ⚡ OmniStock AI ↗ │ └─────────────────────────┴─────────────────────────┘                            │
└───────────────────┴──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🧬 Client Architecture & Data Flow

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'primaryColor': '#0f172a', 'primaryTextColor': '#f8fafc', 'primaryBorderColor': '#10b981', 'lineColor': '#06b6d4', 'secondaryColor': '#1e293b'}}}%%
flowchart TB
    subgraph Shell["🖥️ NEXT.JS 16 APP ROUTER SHELL (app/layout.tsx & app/globals.css)"]
        Fonts["Geist Sans & Geist Mono Typography<br/>+ .bg-quant-grid Dark Theme (#06090e)"]
        Cursor["60fps Quantum Reticle Cursor<br/>(cursorDotRef + cursorRingRef + cursorGlowRef)"]
    end

    subgraph Dock["🧭 COLLAPSIBLE COMMAND DOCK (Left Sidebar)"]
        TabWatch["★ WATCHLIST TAB<br/>Optimistic Pin/Unpin + One-Click RAG"]
        TabVault["◷ INTELLIGENCE VAULT TAB<br/>curateVaultHistory() (Unique vs ≥7d Window)"]
        TabDesks["❖ SECTOR DESKS TAB<br/>6 Institutional Sectors • 32 Equities"]
    end

    subgraph MainGrid["📊 12-COLUMN QUANTITATIVE WORKSPACE (app/page.tsx)"]
        MacroBar["Top FRED Macro Ribbon<br/>(GDP • CPI • Unemployment • Fed Funds)"]
        CmdBar["Keyboard-First Command Bar ('/' or 'Ctrl+K')<br/>Fast Research (Enter) • Deep SEC RAG (Shift+Enter)"]
        TVChart["Persistent TradingView HTML5 Widget<br/>(Dynamic 1H / 1D / 1W Timeframes)"]
        Gauges["4-Column Quantitative Gauges<br/>Sentiment (+FinBERT Norm) • Bull • Risk • Confidence"]
        XBRLBar["5-Metric Audited XBRL & Valuation Strip<br/>Market Cap • Annual Revenue • Total Debt • Diluted EPS • P/E"]
        WorkspaceTabs["3 Interactive Report Views<br/>1. AI Thesis  2. Verified News  3. SEC RAG Telemetry"]
        Console["4-Column Sticky Telemetry Console<br/>Immortal 1.5s Polling + 4-Stage Pipeline Strip"]
    end

    subgraph Community["👨‍💻 ARCHITECT & SUPABASE TELEMETRY FOOTER"]
        Bio["System Architect Showcase (Amartya Sen)"]
        Feedback["Interactive 5-Star Rating & Review Terminal<br/>(soc_feedbacks 3-Tier Sync)"]
    end

    Shell --> Dock & MainGrid & Community
    Dock ==>|"analyzeStock(isDeep, ticker)"| CmdBar
    CmdBar ==> TVChart & Gauges & XBRLBar & WorkspaceTabs & Console
```

---

## ⚡ Immortal Telemetry & Non-Blocking RAG State Machine

Standard loading spinners hide backend complexity and break when a `10-K` or `20-F` filing requires 30+ seconds of background vectorization. [`app/page.tsx`](file:///C:/Users/Amart/Desktop/Projects/socrates-frontend/app/page.tsx) implements an **Immortal Polling & Concurrency State Machine**:

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'primaryColor': '#0f172a', 'primaryBorderColor': '#10b981', 'lineColor': '#06b6d4'}}}%%
stateDiagram-v2
    [*] --> Standby: Terminal Boot (Promise.allSettled Init)

    state "🟢 STANDBY & ONBOARDING" as Standby
    state "⚡ EXECUTING PIPELINE (requestId = ++requestIdRef)" as Executing
    state "🧬 BACKGROUND SEC VECTORIZATION (isVectorizing = true)" as Vectorizing
    state "📊 REPORT RENDERED (secReady = true)" as Rendered

    Standby --> Executing: User clicks Fast / Deep RAG or presses Enter
    Executing --> Rendered: HTTP 200 OK (Cache Hit <450ms or Fresh Synthesis)
    Executing --> Vectorizing: HTTP 400 ("Vectorization started in background...")
    Executing --> Standby: Invalid Ticker -> Extract Clickable Yahoo Fuzzy Pills

    state Vectorizing {
        [*] --> PollLoop: Poll GET /status/{ticker} every 1500ms
        PollLoop --> StreamChunks: Append Logs (Ring Buffer Cap = 60)
        StreamChunks --> DetectCompletion: Log matches "Deep Research is Ready" or sec_ready=true
    }

    Vectorizing --> Rendered: One-Click "Launch Deep SEC RAG Now →" Banner Appears
    Rendered --> Executing: Click "Upgrade to Deep RAG →" or Switch Ticker
```

### Key Frontend Engineering Guards
* **Race-Condition Immunity (`requestIdRef`)**: Every `analyzeStock()` and `loadHistoryReport()` call increments a monotonic `requestIdRef`. If a user rapidly switches from `$NVDA` to `$MSFT`, stale network responses from `$NVDA` are immediately discarded before mutating state.
* **Sub-Second Cache-Hit Synchronization**: When the backend Tier-1 Cache Barrier resolves in `<450ms`, `analyzeStock()` forces an immediate synchronous `await fetchLatestLogs(targetTicker)` prior to unmounting the polling interval so the terminal always displays the full execution trail.
* **Smart Error Recovery & Fuzzy Ticker Pills (`extractSuggestionTickers`)**: If a user enters a company name or typo (e.g., `GOOGLE` or `TESLA`), the UI parses Yahoo Finance suggestions from the backend error payload and renders **1-click interactive ticker recovery pills**.

---

## 🛡️ 3-Tier Resilient Persistence Cascade

To ensure the terminal remains 100% interactive even during cold-starts or offline testing, Watchlist (`soc_watchlist`), Intelligence Vault (`soc_research_intelligence`), and Community Ratings (`soc_feedbacks`) operate on a **3-Tier Persistence Cascade**:

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'actorBkg': '#0f172a', 'actorBorder': '#10b981', 'actorTextColor': '#f8fafc', 'signalColor': '#06b6d4', 'signalTextColor': '#e2e8f0'}}}%%
sequenceDiagram
    autonumber
    participant User as 👤 Quant Operator
    participant State as ⚡ React 19 Optimistic State
    participant Tier1 as 🚀 Tier 1: FastAPI Backend
    participant Tier2 as 🗄️ Tier 2: Direct Supabase REST
    participant Tier3 as 💾 Tier 3: Browser localStorage

    User->>State: Pin Ticker / Submit 5-Star Review / Complete Analysis
    State->>State: Instant UI Update (0ms Perceived Latency)
    State->>Tier1: Fetch / POST to `/api/v1/ingestion/*`
    alt Tier 1 Online (HTTP 200 OK)
        Tier1-->>State: Confirmed Cloud Persistence
        State->>Tier3: Mirror Snapshot to `soc_*_fallback`
    else Tier 1 Cold-Starting or Unreachable
        State->>Tier2: Direct REST Call (`SUPABASE_URL/rest/v1/soc_*`)
        alt Tier 2 Configured & Reachable
            Tier2-->>State: Confirmed Direct Supabase Persistence
        else Offline / Local Demo Mode
            State->>Tier3: Persist to `localStorage` (`soc_watchlist_fallback` / `soc_history_fallback` / `soc_feedbacks_fallback`)
        end
    end
```

---

## 🏦 Institutional Sector Desks (32 Equities)

The left command dock includes **6 pre-configured Institutional Sector Desks** (`PRESET_SECTORS`) for instant 1-click coverage across US GAAP (`10-K`) and Foreign Private Issuer IFRS (`20-F`) equities:

| Sector Desk | Covered Equities (`10-K` & `20-F`) | Primary Research Focus |
| :--- | :--- | :--- |
| **1. AI & Semiconductors** | `$NVDA` • `$AMD` • `$AVGO` • `$TSM` • `$ASML` • `$ARM` | Wafer foundry capacity, custom ASICs, AI capex cycles |
| **2. Hyperscale Cloud & Big Tech** | `$MSFT` • `$AAPL` • `$GOOG` • `$AMZN` • `$META` • `$ORCL` | Cloud backlog, AI infrastructure capex, operating margins |
| **3. Wall Street & FinTech** | `$JPM` • `$GS` • `$V` • `$MA` • `$BLK` • `$COIN` | Net interest income, AUM flows, payment rail volumes |
| **4. Cybersecurity & Defense AI** | `$PLTR` • `$PANW` • `$CRWD` • `$LMT` | Sovereign defense contracts, ARR net retention, zero-trust |
| **5. Healthcare & BioPharma** | `$LLY` • `$UNH` • `$NVO` • `$ISRG` | GLP-1 pipeline, surgical robotics, FDA clinical catalysts |
| **6. Global ADRs & Consumer** | `$TSLA` • `$SAP` *(20-F)* • `$INFY` *(20-F)* • `$WIT` *(20-F)* • `$WMT` • `$COST` | Cross-border IFRS `20-F` accounting, EV margins, retail scale |

---

## 🎨 Signature UI/UX Micro-Interactions

<table>
  <tr>
    <td width="50%" valign="top">
      <h4>🎯 60fps Quantum Reticle Cursor</h4>
      <ul>
        <li>Implemented in <a href="file:///C:/Users/Amart/Desktop/Projects/socrates-frontend/app/page.tsx"><code>app/page.tsx</code></a> &amp; <a href="file:///C:/Users/Amart/Desktop/Projects/socrates-frontend/app/globals.css"><code>app/globals.css</code></a> exclusively for desktop fine pointers (<code>(pointer: fine)</code>).</li>
        <li>Uses 3 independent DOM refs (<code>cursorDotRef</code>, <code>cursorRingRef</code>, <code>cursorGlowRef</code>) updated via <code>requestAnimationFrame</code> with a <code>0.22</code> linear interpolation factor.</li>
        <li>Automatically morphs into a glowing cyan lock-on ring when hovering interactive buttons, inputs, or ticker cards.</li>
      </ul>
    </td>
    <td width="50%" valign="top">
      <h4>📋 1-Click Executive Markdown Brief Export</h4>
      <ul>
        <li><code>handleCopyReport()</code> synthesizes the active report into a clean, structured Markdown brief for investment memos.</li>
        <li>Includes the computed <b>FinBERT Normalized Score</b>:
          <br /><code>FinBERT_Norm = (sentiment_score / 50) - 1</code> (ranging from <code>-1.00</code> to <code>+1.00</code>).</li>
        <li>Seamless cross-link to the companion <b>OmniStock AI Price Action Predictor</b>.</li>
      </ul>
    </td>
  </tr>
</table>

---

## 📂 Repository Blueprint

```text
socrates-frontend/
├── app/
│   ├── layout.tsx                   # Root HTML shell, Geist Sans & Geist Mono fonts, SEO metadata
│   ├── globals.css                  # Tailwind CSS v4 @theme config, .bg-quant-grid, custom cursor & scrollbars
│   ├── page.tsx                     # Complete 2,894-line Institutional Research Terminal client application
│   ├── LinkedIn_Pfp.jpg             # System Architect portrait asset rendered via next/image
│   └── favicon.ico                  # Terminal crest icon
├── public/                          # Static SVG assets
├── next.config.ts                   # Next.js 16 TypeScript configuration
├── postcss.config.mjs               # Tailwind v4 @tailwindcss/postcss pipeline
├── eslint.config.mjs                # ESLint 9 flat configuration
├── tsconfig.json                    # Strict TypeScript 5 configuration
└── package.json                     # Next.js 16.2.9, React 19.2.4, Tailwind CSS v4 dependencies
```

---

## 🚀 Quick Start & Local Development

### 1. Configure Environment Variables (Optional)
By default, the terminal connects directly to the production Socrates Cloud Engine (`https://socrates-backend-kbyq.onrender.com`). To point to a local backend or enable Tier-2 direct Supabase REST fallback, create `.env.local`:

```ini
# Point to local FastAPI engine (defaults to Render production URL if omitted)
NEXT_PUBLIC_API_BASE_URL="http://localhost:8000"

# Optional Tier-2 Direct Supabase REST Fallback for soc_feedbacks
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

### 2. Install & Boot the Terminal

```bash
# Install dependencies
npm install

# Start the Next.js 16 development server
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser and press <kbd>/</kbd> or <kbd>Ctrl</kbd>+<kbd>K</kbd> to initiate a quantitative research uplink.

---

<div align="center">

### 👨‍💻 System Architect & Creator

**Amartya Sen**  
*B.Tech in Computer Science & Engineering (Artificial Intelligence & Machine Learning)*  
Architecting fault-tolerant, autonomous AI systems at the intersection of quantitative finance and deep learning.

<p align="center">
  <a href="https://www.linkedin.com/in/amartya-sen"><img src="https://img.shields.io/badge/LinkedIn-Amartya_Sen-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn" /></a>
  <a href="https://github.com/AmartyaSen23"><img src="https://img.shields.io/badge/GitHub-@AmartyaSen23-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub" /></a>
  <a href="https://omnistock-ai.streamlit.app/"><img src="https://img.shields.io/badge/Companion_App-OmniStock_AI-06B6D4?style=for-the-badge&logo=streamlit&logoColor=white" alt="OmniStock AI" /></a>
</p>

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:06090e,50:065f46,100:0891b2&height=110&section=footer" width="100%" alt="Footer Wave" />

</div>
