"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://socrates-backend-kbyq.onrender.com";

const MAX_LOGS = 60;

interface FundamentalsData {
  ticker?: string;
  fiscal_date?: string;
  market_cap?: number | null;
  revenue?: number | null;
  total_debt?: number | null;
  eps?: number | null;
  pe_ratio?: number | null;
}

interface NewsArticle {
  title: string;
  summary?: string;
  url: string;
  published_at?: string;
}

interface SecFilingMeta {
  form_type?: string | null;
  filed_at?: string | null;
  is_ready?: boolean;
}

interface IntelligenceReport {
  id?: string;
  ticker: string;
  analysis_date?: string;
  is_deep_rag?: boolean;
  sentiment_score: number;
  sentiment_label: string;
  risk_score: number;
  major_risks: string[];
  bullish_score: number;
  growth_drivers: string[];
  confidence_score?: number;
  bull_case_summary: string;
  bear_case_summary: string;
  fundamentals?: FundamentalsData | null;
  news?: NewsArticle[];
  sec_filing?: SecFilingMeta | null;
  cached?: boolean;
  model_used?: string;
}

interface MacroMetric {
  id?: string;
  event_name: string;
  actual_value: number;
  released_at?: string;
}

interface WatchlistItem {
  ticker: string;
  is_active: boolean;
  added_at?: string;
  last_news_pull?: string;
  last_fund_pull?: string;
}

interface HistoryItem {
  id: string;
  ticker: string;
  analysis_date: string;
  is_deep_rag: boolean;
  sentiment_score: number;
  sentiment_label: string;
  risk_score: number;
  bullish_score: number;
  confidence_score?: number;
  created_at?: string;
}

const PRESET_SECTORS = [
  {
    name: "AI & Semiconductors",
    tickers: [
      { symbol: "NVDA", name: "NVIDIA Corp" },
      { symbol: "AMD", name: "Adv Micro Devices" },
      { symbol: "AVGO", name: "Broadcom Inc" },
      { symbol: "TSM", name: "Taiwan Semi" },
    ],
  },
  {
    name: "Hyperscale Cloud",
    tickers: [
      { symbol: "MSFT", name: "Microsoft Corp" },
      { symbol: "AAPL", name: "Apple Inc" },
      { symbol: "GOOG", name: "Alphabet Inc" },
      { symbol: "AMZN", name: "Amazon.com" },
    ],
  },
  {
    name: "Global IT & Enterprise",
    tickers: [
      { symbol: "TSLA", name: "Tesla Inc" },
      { symbol: "SAP", name: "SAP SE (20-F)" },
      { symbol: "INFY", name: "Infosys (20-F)" },
      { symbol: "WMT", name: "Walmart Inc" },
    ],
  },
];

function formatCompactCurrency(val?: number | null): string {
  if (val === null || val === undefined || Number.isNaN(Number(val))) {
    return "N/A";
  }
  const num = Number(val);
  const abs = Math.abs(num);
  if (abs >= 1_000_000_000_000) {
    return `$${(num / 1_000_000_000_000).toFixed(2)}T`;
  }
  if (abs >= 1_000_000_000) {
    return `$${(num / 1_000_000_000).toFixed(2)}B`;
  }
  if (abs >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(2)}M`;
  }
  return `$${num.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

function formatMacroValue(eventName: string, val: number): string {
  const lower = (eventName || "").toLowerCase();
  if (lower.includes("gdp") || lower.includes("product")) {
    // FRED GDP is in Billions of Dollars
    if (val >= 1000) {
      return `$${(val / 1000).toFixed(2)}T`;
    }
    return `$${val.toFixed(1)}B`;
  }
  if (lower.includes("cpi") || lower.includes("inflation")) {
    return `${val.toFixed(2)} pts`;
  }
  return `${val.toFixed(2)}%`;
}

function normalizeListField(val: unknown): string[] {
  if (Array.isArray(val)) {
    return val.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((x) => String(x).trim()).filter(Boolean);
        }
      } catch {
        // Handle single-quoted Python list representations
        const inner = trimmed.slice(1, -1);
        const matches = inner.match(/(?:'([^']*)'|"([^"]*)")/g);
        if (matches && matches.length > 0) {
          return matches
            .map((m) => m.slice(1, -1).trim())
            .filter(Boolean);
        }
      }
    }
    return trimmed
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function extractSuggestionTickers(errText: string | null): string[] {
  if (!errText) return [];
  const matches = errText.match(/\(([A-Z0-9.\-]{1,10})\)/g);
  if (!matches) return [];
  return Array.from(
    new Set(matches.map((m) => m.replace(/[()]/g, "").trim()).filter(Boolean))
  );
}

export default function Home() {
  // Core Research State
  const [tickerInput, setTickerInput] = useState("");
  const [activeTicker, setActiveTicker] = useState("");
  const [report, setReport] = useState<IntelligenceReport | null>(null);
  const [macroData, setMacroData] = useState<MacroMetric[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMode, setLoadingMode] = useState<"fast" | "deep" | "cache" | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  // Live SEC Vectorization & Status State
  const [isVectorizing, setIsVectorizing] = useState(false);
  const [secReady, setSecReady] = useState(false);
  const [secForm, setSecForm] = useState<string | null>(null);

  // Left Sidebar & Interactive Navigation State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"watchlist" | "history" | "sectors">("watchlist");
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [newWatchlistInput, setNewWatchlistInput] = useState("");
  const [watchlistBusy, setWatchlistBusy] = useState(false);
  const [macroRefreshing, setMacroRefreshing] = useState(false);

  // Dashboard Interactive View State
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<"thesis" | "filings" | "news">("thesis");
  const [chartInterval, setChartInterval] = useState<"D" | "W" | "60">("D");
  const [autoScrollLogs, setAutoScrollLogs] = useState(true);
  const [copiedReport, setCopiedReport] = useState(false);

  const terminalContainerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const requestIdRef = useRef<number>(0);

  // Fetch Macro Data
  const fetchMacro = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/ingestion/macro`);
      if (!res.ok) return;
      const json = await res.json();
      if (Array.isArray(json.data)) {
        const seen = new Set<string>();
        const deduped: MacroMetric[] = [];
        for (const item of json.data) {
          if (item?.event_name && !seen.has(item.event_name)) {
            seen.add(item.event_name);
            deduped.push(item);
          }
        }
        setMacroData(deduped);
      }
    } catch (error) {
      console.error("Failed to fetch macro data:", error);
    }
  }, []);

  // Fetch Sidebar Watchlist & History (with graceful local fallback if backend hasn't redeployed new routes yet)
  const fetchSidebarData = useCallback(async () => {
    try {
      const [watchRes, histRes] = await Promise.allSettled([
        fetch(`${API_BASE}/api/v1/ingestion/watchlist`),
        fetch(`${API_BASE}/api/v1/ingestion/history?limit=25`),
      ]);

      if (watchRes.status === "fulfilled" && watchRes.value.ok) {
        const wJson = await watchRes.value.json();
        if (Array.isArray(wJson.data)) {
          setWatchlist(wJson.data);
        }
      } else {
        const savedWatch = localStorage.getItem("soc_watchlist_fallback");
        if (savedWatch) {
          setWatchlist(JSON.parse(savedWatch));
        } else {
          setWatchlist([
            { ticker: "NVDA", is_active: true },
            { ticker: "MSFT", is_active: true },
            { ticker: "AAPL", is_active: true },
          ]);
        }
      }

      if (histRes.status === "fulfilled" && histRes.value.ok) {
        const hJson = await histRes.value.json();
        if (Array.isArray(hJson.data)) {
          setHistoryList(hJson.data);
        }
      } else {
        const savedHist = localStorage.getItem("soc_history_fallback");
        if (savedHist) {
          setHistoryList(JSON.parse(savedHist));
        }
      }
    } catch {
      // Ignore network errors on initial load
    }
  }, []);

  useEffect(() => {
    let active = true;
    const initDashboard = async () => {
      if (!active) return;
      await Promise.all([fetchMacro(), fetchSidebarData()]);
    };
    void initDashboard();
    return () => {
      active = false;
    };
  }, [fetchMacro, fetchSidebarData]);

  // Keyboard shortcut: '/' or 'Ctrl+K' focuses ticker input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Auto-scroll terminal container (scrolls only the inner container, never hijacks window scroll)
  useEffect(() => {
    if (autoScrollLogs && terminalContainerRef.current) {
      terminalContainerRef.current.scrollTop =
        terminalContainerRef.current.scrollHeight;
    }
  }, [logs, autoScrollLogs]);

  // Dedicated log & status fetcher
  const fetchLatestLogs = useCallback(async (ticker: string) => {
    if (!ticker) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/ingestion/status/${ticker}`);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.logs) && json.logs.length > 0) {
          setLogs(json.logs.slice(-MAX_LOGS));
          // Detect vectorization readiness from log stream even if backend status route is older
          const joined = json.logs.join(" ");
          if (
            joined.includes("Deep Research is Ready") ||
            joined.includes("SEC filing found in database") ||
            joined.includes("SEC filing verified in database")
          ) {
            setSecReady(true);
            setIsVectorizing(false);
          } else if (
            joined.includes("Triggering background ingestion") ||
            joined.includes("Starting embedding") ||
            joined.includes("Scrubbing ") ||
            joined.includes("Attempting to download ")
          ) {
            setIsVectorizing(true);
          }
        }
        if (typeof json.is_vectorizing === "boolean") {
          setIsVectorizing(json.is_vectorizing);
        }
        if (typeof json.sec_ready === "boolean") {
          setSecReady(json.sec_ready);
        }
        if (json.sec_form) {
          setSecForm(json.sec_form);
        }
      }
    } catch {
      // Silently ignore transient network hiccups during polling
    }
  }, []);

  // Immortal Polling: polls while waiting for a report OR while background SEC vectorization is running
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (activeTicker && (!report || isVectorizing || loading)) {
      interval = setInterval(() => {
        fetchLatestLogs(activeTicker);
      }, 1500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTicker, report, isVectorizing, loading, fetchLatestLogs]);

  // Normalize incoming report object and persist to local history fallback
  const applyReportData = useCallback(
    (rawReport: IntelligenceReport, fallbackTicker: string, isDeepFallback: boolean) => {
      const normalized: IntelligenceReport = {
        ...rawReport,
        ticker: (rawReport.ticker || fallbackTicker).toUpperCase(),
        is_deep_rag:
          typeof rawReport.is_deep_rag === "boolean"
            ? rawReport.is_deep_rag
            : isDeepFallback,
        sentiment_score: Number(rawReport.sentiment_score ?? 50),
        sentiment_label: rawReport.sentiment_label || "Neutral",
        bullish_score: Number(rawReport.bullish_score ?? 50),
        risk_score: Number(rawReport.risk_score ?? 50),
        confidence_score: Number(rawReport.confidence_score ?? 80),
        growth_drivers: normalizeListField(rawReport.growth_drivers),
        major_risks: normalizeListField(rawReport.major_risks),
      };

      setReport(normalized);
      if (normalized.sec_filing?.is_ready) {
        setSecReady(true);
      }
      if (normalized.sec_filing?.form_type) {
        setSecForm(normalized.sec_filing.form_type);
      }

      // Update history list in UI immediately
      setHistoryList((prev) => {
        const newEntry: HistoryItem = {
          id: normalized.id || `${normalized.ticker}-${Date.now()}`,
          ticker: normalized.ticker,
          analysis_date:
            normalized.analysis_date || new Date().toISOString().slice(0, 10),
          is_deep_rag: Boolean(normalized.is_deep_rag),
          sentiment_score: normalized.sentiment_score,
          sentiment_label: normalized.sentiment_label,
          risk_score: normalized.risk_score,
          bullish_score: normalized.bullish_score,
          confidence_score: normalized.confidence_score,
        };
        const filtered = prev.filter(
          (item) =>
            !(
              item.ticker === newEntry.ticker &&
              item.analysis_date === newEntry.analysis_date &&
              item.is_deep_rag === newEntry.is_deep_rag
            )
        );
        const updated = [newEntry, ...filtered].slice(0, 25);
        try {
          localStorage.setItem("soc_history_fallback", JSON.stringify(updated));
        } catch {
          // ignore storage quota errors
        }
        return updated;
      });
    },
    []
  );

  // Core Analyze Function (accepts optional overrideTicker so sidebar clicks never suffer from React state lag)
  const analyzeStock = async (isDeep = false, overrideTicker?: string) => {
    const rawTarget = overrideTicker !== undefined ? overrideTicker : tickerInput;
    const targetTicker = rawTarget.trim().replace(/^\$/, "").trim().toUpperCase();
    if (!targetTicker) return;

    const currentReqId = ++requestIdRef.current;

    if (overrideTicker !== undefined) {
      setTickerInput(targetTicker);
    }
    setMobileSidebarOpen(false);
    setLoading(true);
    setLoadingMode(isDeep ? "deep" : "fast");
    setReport(null);
    setErrorMsg(null);
    setSecReady(false);
    setSecForm(null);

    setLogs([
      isDeep
        ? `[${targetTicker}] Initiating Multi-Query DEEP SEC RAG Pipeline...`
        : `[${targetTicker}] Initiating Autonomous Quantitative Pipeline...`,
    ]);
    setActiveTicker(targetTicker);

    const endpoint = isDeep
      ? `/api/v1/ingestion/analyze/deep/${encodeURIComponent(targetTicker)}`
      : `/api/v1/ingestion/analyze/${encodeURIComponent(targetTicker)}`;

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, { method: "POST" });
      let json: { detail?: unknown; data?: IntelligenceReport } = {};
      try {
        json = (await res.json()) as {
          detail?: unknown;
          data?: IntelligenceReport;
        };
      } catch {
        json = { detail: `Unexpected HTTP ${res.status} response from server.` };
      }

      if (currentReqId !== requestIdRef.current) return;

      await fetchLatestLogs(targetTicker);

      if (!res.ok) {
        const detailStr =
          typeof json.detail === "string"
            ? json.detail
            : JSON.stringify(json.detail || "An error occurred during analysis.");
        setErrorMsg(detailStr);
        if (detailStr.toLowerCase().includes("vectoriz")) {
          setIsVectorizing(true);
        }
      } else if (json.data) {
        applyReportData(json.data, targetTicker, isDeep);
      }
    } catch {
      if (currentReqId !== requestIdRef.current) return;
      setErrorMsg("Failed to connect to the Socrates Backend. Please check network or server status.");
    } finally {
      if (currentReqId === requestIdRef.current) {
        setLoading(false);
        setLoadingMode(null);
      }
    }
  };

  // Load a specific historical report from cache (or fall back to analyzeStock if endpoint not available)
  const loadHistoryReport = async (item: HistoryItem) => {
    const targetTicker = item.ticker.toUpperCase();
    const currentReqId = ++requestIdRef.current;

    setTickerInput(targetTicker);
    setActiveTicker(targetTicker);
    setMobileSidebarOpen(false);
    setErrorMsg(null);
    setLoading(true);
    setLoadingMode("cache");
    setLogs([
      `[${targetTicker}] Retrieving archived ${item.is_deep_rag ? "Deep SEC RAG" : "Fast Research"} report (${item.analysis_date})...`,
    ]);

    try {
      const params = new URLSearchParams({
        is_deep_rag: String(item.is_deep_rag),
        analysis_date: item.analysis_date,
      });
      const res = await fetch(
        `${API_BASE}/api/v1/ingestion/report/${encodeURIComponent(targetTicker)}?${params.toString()}`
      );
      if (currentReqId !== requestIdRef.current) return;

      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          applyReportData(json.data, targetTicker, item.is_deep_rag);
          setLogs((prev) => [
            ...prev,
            `[${targetTicker}] ⚡ Loaded verified report snapshot (${item.analysis_date}) from database.`,
          ]);
          setLoading(false);
          setLoadingMode(null);
          return;
        }
      }
      // Fallback: trigger standard/deep analysis which hits the backend Tier-1 cache barrier
      await analyzeStock(item.is_deep_rag, targetTicker);
    } catch {
      if (currentReqId !== requestIdRef.current) return;
      await analyzeStock(item.is_deep_rag, targetTicker);
    } finally {
      if (currentReqId === requestIdRef.current) {
        setLoading(false);
        setLoadingMode(null);
      }
    }
  };

  // Add ticker to Watchlist
  const handleAddWatchlist = async (tickerToAdd?: string) => {
    const raw = tickerToAdd !== undefined ? tickerToAdd : newWatchlistInput;
    const clean = raw.trim().replace(/^\$/, "").trim().toUpperCase();
    if (!clean || !/^[A-Z0-9.\-]{1,12}$/.test(clean)) return;

    setWatchlistBusy(true);
    const optimisticItem: WatchlistItem = {
      ticker: clean,
      is_active: true,
      added_at: new Date().toISOString(),
    };

    setWatchlist((prev) => {
      if (prev.some((w) => w.ticker === clean)) return prev;
      const next = [...prev, optimisticItem];
      try {
        localStorage.setItem("soc_watchlist_fallback", JSON.stringify(next));
      } catch {}
      return next;
    });
    if (tickerToAdd === undefined) setNewWatchlistInput("");

    try {
      await fetch(`${API_BASE}/api/v1/ingestion/watchlist/${encodeURIComponent(clean)}`, {
        method: "POST",
      });
    } catch {
      // Optimistic state already updated
    } finally {
      setWatchlistBusy(false);
    }
  };

  // Remove ticker from Watchlist
  const handleRemoveWatchlist = async (tickerToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const clean = tickerToRemove.toUpperCase();
    setWatchlist((prev) => {
      const next = prev.filter((w) => w.ticker !== clean);
      try {
        localStorage.setItem("soc_watchlist_fallback", JSON.stringify(next));
      } catch {}
      return next;
    });

    try {
      await fetch(`${API_BASE}/api/v1/ingestion/watchlist/${encodeURIComponent(clean)}`, {
        method: "DELETE",
      });
    } catch {
      // Optimistic removal preserved
    }
  };

  // Refresh FRED Macro Data
  const handleRefreshMacro = async () => {
    if (macroRefreshing) return;
    setMacroRefreshing(true);
    try {
      await fetch(`${API_BASE}/api/v1/ingestion/macro`, { method: "POST" });
      await fetchMacro();
    } catch {
      // Ignore error
    } finally {
      setMacroRefreshing(false);
    }
  };

  // Copy Executive Report to Clipboard
  const handleCopyReport = () => {
    if (!report) return;
    const md = [
      `# SOCRATES AI RESEARCH BRIEF: $${report.ticker}`,
      `Date: ${report.analysis_date || "Latest"} | Mode: ${report.is_deep_rag ? "Deep SEC RAG" : "Fast Institutional"}`,
      `Sentiment: ${report.sentiment_label} (${report.sentiment_score}/100 | FinBERT Norm: ${(report.sentiment_score / 50 - 1).toFixed(2)})`,
      `Bull Score: ${report.bullish_score}/100 | Risk Score: ${report.risk_score}/100 | Confidence: ${report.confidence_score ?? 80}%`,
      "",
      "## INSTITUTIONAL BULL CASE",
      report.bull_case_summary,
      "",
      "## INSTITUTIONAL BEAR CASE",
      report.bear_case_summary,
      "",
      "## KEY GROWTH DRIVERS",
      ...(report.growth_drivers || []).map((d) => `- ${d}`),
      "",
      "## MAJOR INSTITUTIONAL RISKS",
      ...(report.major_risks || []).map((r) => `- ${r}`),
    ].join("\n");

    navigator.clipboard.writeText(md);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  const isCurrentTickerWatched = Boolean(
    activeTicker && watchlist.some((w) => w.ticker === activeTicker)
  );
  const suggestionTickers = extractSuggestionTickers(errorMsg);
  const finbertNormalized = report
    ? (report.sentiment_score / 50 - 1).toFixed(2)
    : "0.00";

  return (
    <div className="min-h-screen flex bg-[#06090e] text-slate-100 font-sans bg-quant-grid relative">
      {/* MOBILE SIDEBAR BACKDROP */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* ============================================================
          LEFT SIDEBAR: INSTITUTIONAL COMMAND & NAVIGATION DOCK
         ============================================================ */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen bg-[#080c14]/95 backdrop-blur-xl border-r border-slate-800/80 flex flex-col transition-all duration-300 ease-in-out select-none ${
          sidebarCollapsed ? "lg:w-20" : "lg:w-72"
        } ${
          mobileSidebarOpen
            ? "translate-x-0 w-72"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 border-b border-slate-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <span className="font-mono font-bold text-emerald-400 text-lg">
                Σ
              </span>
            </div>
            {!sidebarCollapsed && (
              <div className="leading-tight truncate">
                <div className="font-bold tracking-tight text-white text-sm flex items-center gap-1.5">
                  <span>SOCRATES</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    v2.4
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono truncate">
                  Quant RAG Terminal
                </p>
              </div>
            )}
          </div>

          {/* Collapse Toggle (Desktop) & Close Button (Mobile) */}
          <button
            onClick={() => {
              if (mobileSidebarOpen) {
                setMobileSidebarOpen(false);
              } else {
                setSidebarCollapsed((prev) => !prev);
              }
            }}
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/70 transition-colors"
          >
            <svg
              className={`w-4 h-4 transition-transform duration-300 ${
                sidebarCollapsed ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
              />
            </svg>
          </button>
        </div>

        {/* Sidebar Navigation Tabs */}
        {!sidebarCollapsed ? (
          <div className="p-3 border-b border-slate-800/80 shrink-0">
            <div className="grid grid-cols-3 gap-1 bg-[#05070b] p-1 rounded-lg border border-slate-800/70 text-[11px] font-mono">
              <button
                onClick={() => setSidebarTab("watchlist")}
                className={`py-1.5 rounded-md font-medium transition-all ${
                  sidebarTab === "watchlist"
                    ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                WATCH ({watchlist.length})
              </button>
              <button
                onClick={() => setSidebarTab("history")}
                className={`py-1.5 rounded-md font-medium transition-all ${
                  sidebarTab === "history"
                    ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                VAULT ({historyList.length})
              </button>
              <button
                onClick={() => setSidebarTab("sectors")}
                className={`py-1.5 rounded-md font-medium transition-all ${
                  sidebarTab === "sectors"
                    ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                DESKS
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-3 border-b border-slate-800/80">
            <button
              onClick={() => {
                setSidebarCollapsed(false);
                setSidebarTab("watchlist");
              }}
              title="Autonomous Watchlist"
              className={`p-2 rounded-lg border transition-colors ${
                sidebarTab === "watchlist"
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                  : "border-transparent text-slate-400 hover:bg-slate-800/60"
              }`}
            >
              ★
            </button>
            <button
              onClick={() => {
                setSidebarCollapsed(false);
                setSidebarTab("history");
              }}
              title="Intelligence Vault (Cached Reports)"
              className={`p-2 rounded-lg border transition-colors ${
                sidebarTab === "history"
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                  : "border-transparent text-slate-400 hover:bg-slate-800/60"
              }`}
            >
              ◷
            </button>
            <button
              onClick={() => {
                setSidebarCollapsed(false);
                setSidebarTab("sectors");
              }}
              title="Sector Desks"
              className={`p-2 rounded-lg border transition-colors ${
                sidebarTab === "sectors"
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                  : "border-transparent text-slate-400 hover:bg-slate-800/60"
              }`}
            >
              ❖
            </button>
          </div>
        )}

        {/* Sidebar Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {sidebarCollapsed ? (
            /* Collapsed Mini Ticker Pills */
            <div className="flex flex-col items-center gap-2">
              {watchlist.map((item) => {
                const isActive = activeTicker === item.ticker;
                return (
                  <button
                    key={item.ticker}
                    onClick={() => analyzeStock(false, item.ticker)}
                    title={`Analyze ${item.ticker}`}
                    className={`w-12 h-10 rounded-lg font-mono text-[11px] font-bold border transition-all flex items-center justify-center ${
                      isActive
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                        : "bg-slate-900/80 border-slate-800 text-slate-300 hover:border-emerald-500/50 hover:text-white"
                    }`}
                  >
                    {item.ticker.slice(0, 4)}
                  </button>
                );
              })}
            </div>
          ) : sidebarTab === "watchlist" ? (
            /* TAB 1: AUTONOMOUS WATCHLIST */
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  Tracked Equities
                </span>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  SEC RSS Live
                </span>
              </div>

              {/* Add Ticker to Watchlist Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddWatchlist();
                }}
                className="flex gap-1.5"
              >
                <input
                  value={newWatchlistInput}
                  onChange={(e) =>
                    setNewWatchlistInput(e.target.value.toUpperCase())
                  }
                  placeholder="Add ticker (e.g. AMD)"
                  maxLength={10}
                  className="flex-1 bg-[#05070b] border border-slate-800 focus:border-emerald-500/60 rounded-md px-2.5 py-1.5 text-xs font-mono text-white placeholder:text-slate-600 outline-none uppercase"
                />
                <button
                  type="submit"
                  disabled={watchlistBusy || !newWatchlistInput.trim()}
                  className="px-2.5 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 rounded-md text-xs font-mono font-bold disabled:opacity-40 transition-colors"
                >
                  +
                </button>
              </form>

              <div className="space-y-1.5">
                {watchlist.map((item) => {
                  const isActive = activeTicker === item.ticker;
                  const latestHist = historyList.find(
                    (h) => h.ticker === item.ticker
                  );
                  return (
                    <div
                      key={item.ticker}
                      onClick={() => analyzeStock(false, item.ticker)}
                      className={`group flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                        isActive
                          ? "bg-emerald-500/12 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                          : "bg-slate-900/40 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-white group-hover:text-emerald-300 transition-colors">
                            ${item.ticker}
                          </span>
                          {latestHist && (
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                                latestHist.sentiment_label === "Bullish"
                                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                  : latestHist.sentiment_label === "Bearish"
                                  ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                                  : "bg-amber-500/10 border-amber-500/30 text-amber-300"
                              }`}
                            >
                              {latestHist.sentiment_score}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono truncate mt-0.5">
                          {item.last_news_pull
                            ? `Synced ${item.last_news_pull.slice(0, 10)}`
                            : "Autonomous Cron Active"}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            analyzeStock(true, item.ticker);
                          }}
                          title="Run Deep SEC RAG on this ticker"
                          className="opacity-0 group-hover:opacity-100 px-1.5 py-1 rounded bg-cyan-500/15 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono transition-all"
                        >
                          RAG
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleRemoveWatchlist(item.ticker, e)}
                          title="Remove from Watchlist"
                          className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : sidebarTab === "history" ? (
            /* TAB 2: INTELLIGENCE VAULT (RECENT CACHED REPORTS) */
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1 mb-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  Cached Intelligence Vault
                </span>
                <button
                  onClick={fetchSidebarData}
                  className="text-[10px] font-mono text-emerald-400 hover:underline"
                >
                  Refresh
                </button>
              </div>

              {historyList.length === 0 ? (
                <div className="text-xs text-slate-500 font-mono p-4 text-center border border-dashed border-slate-800 rounded-lg">
                  No cached reports found. Run an analysis to populate the vault.
                </div>
              ) : (
                historyList.map((item, idx) => {
                  const isSelected =
                    activeTicker === item.ticker &&
                    report?.analysis_date === item.analysis_date &&
                    Boolean(report?.is_deep_rag) === Boolean(item.is_deep_rag);

                  return (
                    <button
                      key={`${item.id || idx}-${item.ticker}-${item.analysis_date}-${item.is_deep_rag}`}
                      onClick={() => loadHistoryReport(item)}
                      className={`w-full text-left p-2.5 rounded-lg border transition-all flex flex-col gap-1.5 ${
                        isSelected
                          ? "bg-emerald-500/15 border-emerald-500/50"
                          : "bg-slate-900/40 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-white">
                            ${item.ticker}
                          </span>
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-semibold ${
                              item.is_deep_rag
                                ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                                : "bg-slate-800 text-slate-300 border border-slate-700"
                            }`}
                          >
                            {item.is_deep_rag ? "DEEP RAG" : "FAST"}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-mono font-bold ${
                            item.sentiment_label === "Bullish"
                              ? "text-emerald-400"
                              : item.sentiment_label === "Bearish"
                              ? "text-rose-400"
                              : "text-amber-300"
                          }`}
                        >
                          {item.sentiment_label} ({item.sentiment_score})
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span>{item.analysis_date}</span>
                        <span>
                          Bull {item.bullish_score} / Risk {item.risk_score}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          ) : (
            /* TAB 3: INSTITUTIONAL SECTOR DESKS */
            <div className="space-y-4">
              {PRESET_SECTORS.map((sector) => (
                <div key={sector.name} className="space-y-1.5">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 px-1">
                    {sector.name}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {sector.tickers.map((t) => {
                      const isActive = activeTicker === t.symbol;
                      return (
                        <button
                          key={t.symbol}
                          onClick={() => analyzeStock(false, t.symbol)}
                          className={`p-2 rounded-lg border text-left transition-all ${
                            isActive
                              ? "bg-emerald-500/15 border-emerald-500/50 text-white"
                              : "bg-slate-900/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/50"
                          }`}
                        >
                          <div className="font-mono font-bold text-xs text-emerald-400">
                            ${t.symbol}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {t.name}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Footer: System Status & OmniStock Predictor Link */}
        <div className="p-3 border-t border-slate-800/80 bg-[#05070b]/90 shrink-0 space-y-2.5">
          {!sidebarCollapsed ? (
            <>
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
                  Groq + pgvector
                </span>
                <span className="text-slate-500">ONLINE</span>
              </div>
              <a
                href="https://omnistock-ai.streamlit.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-gradient-to-r from-emerald-500/15 to-cyan-500/15 hover:from-emerald-500/25 hover:to-cyan-500/25 border border-emerald-500/30 text-xs font-mono font-semibold text-emerald-300 transition-all"
              >
                <span>⚡ OmniStock Price AI</span>
                <span>↗</span>
              </a>
            </>
          ) : (
            <a
              href="https://omnistock-ai.streamlit.app/"
              target="_blank"
              rel="noopener noreferrer"
              title="Launch OmniStock Price Action Predictor"
              className="w-full py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-300 hover:bg-emerald-500/25 transition-all"
            >
              ⚡
            </a>
          )}
        </div>
      </aside>

      {/* ============================================================
          MAIN APPLICATION SHELL (TOP MACRO BAR + WORKSPACE + TERMINAL)
         ============================================================ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP MACRO & TELEMETRY RIBBON */}
        <header className="sticky top-0 z-30 h-16 bg-[#080c14]/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
              aria-label="Open Navigation Sidebar"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            {/* Macro Indicators Strip */}
            <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar py-1">
              <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-slate-400 shrink-0 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>US MACRO (FRED):</span>
              </div>

              {macroData.length > 0 ? (
                macroData.map((metric, index) => (
                  <div
                    key={`${metric.event_name}-${index}`}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/90 border border-slate-800/90 text-xs font-mono shrink-0"
                  >
                    <span className="text-slate-400">
                      {metric.event_name
                        .replace("Gross Domestic Product", "GDP")
                        .replace("Fed Funds Interest Rate", "FED FUNDS")
                        .replace("Unemployment Rate", "UNEMP")
                        .replace("Inflation (CPI)", "CPI INDEX")
                        .toUpperCase()}
                      :
                    </span>
                    <span className="text-emerald-400 font-bold">
                      {formatMacroValue(metric.event_name, metric.actual_value)}
                    </span>
                  </div>
                ))
              ) : (
                <span className="text-xs font-mono text-slate-500">
                  Syncing FRED telemetry...
                </span>
              )}

              <button
                onClick={handleRefreshMacro}
                disabled={macroRefreshing}
                title="Refresh Federal Reserve (FRED) Macroeconomic Indicators"
                className="p-1.5 rounded-md bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-emerald-400 text-xs font-mono transition-colors shrink-0 disabled:opacity-40"
              >
                {macroRefreshing ? "⟳" : "↻"}
              </button>
            </div>
          </div>

          {/* Right Header Status Pill */}
          <div className="hidden xl:flex items-center gap-3 shrink-0 font-mono text-xs">
            {activeTicker && (
              <div className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 flex items-center gap-2">
                <span className="text-slate-400">ACTIVE:</span>
                <span className="text-white font-bold">${activeTicker}</span>
                {secReady ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                    {secForm || "10-K"} READY
                  </span>
                ) : isVectorizing ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 animate-pulse">
                    EMBEDDING SEC...
                  </span>
                ) : null}
              </div>
            )}
          </div>
        </header>

        {/* MAIN WORKSPACE CONTAINER */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {/* COMMAND BAR & HERO TITLE */}
          <div className="mb-8 flex flex-col xl:flex-row xl:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[11px] font-mono mb-2">
                <span>AUTONOMOUS MULTI-AGENT EQUITY INTELLIGENCE</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
                Socrates Research Engine
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Audited SEC EDGAR XBRL Fundamentals • Cohere v3 Vector RAG •
                Groq Llama-3.3 Quantitative Synthesis
              </p>
            </div>

            {/* Interactive Search & Execution Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative flex-1 sm:w-64">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500 font-mono font-bold text-sm">
                  $
                </span>
                <input
                  ref={searchInputRef}
                  value={tickerInput}
                  onChange={(e) => setTickerInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !loading) {
                      e.preventDefault();
                      analyzeStock(e.shiftKey);
                    }
                  }}
                  placeholder="TICKER (e.g. NVDA)"
                  maxLength={12}
                  className="w-full bg-[#0a0f18] border border-slate-700/80 focus:border-emerald-500 rounded-lg pl-8 pr-12 py-3 text-sm font-mono font-bold text-white placeholder:text-slate-600 outline-none transition-all shadow-inner uppercase"
                />
                <kbd className="hidden sm:inline-block absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700">
                  /
                </kbd>
              </div>

              <button
                onClick={() => analyzeStock(false)}
                disabled={loading || !tickerInput.trim()}
                className="px-5 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-mono text-xs font-bold tracking-wider uppercase transition-all disabled:opacity-40 shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:shadow-[0_0_25px_rgba(16,185,129,0.45)] flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading && loadingMode === "fast" ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>ANALYZING...</span>
                  </>
                ) : (
                  <>
                    <span>⚡ FAST RESEARCH</span>
                  </>
                )}
              </button>

              <button
                onClick={() => analyzeStock(true)}
                disabled={loading || !tickerInput.trim()}
                className="px-5 py-3 rounded-lg bg-[#0d1522] hover:bg-cyan-950/60 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 font-mono text-xs font-bold tracking-wider uppercase transition-all disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading && loadingMode === "deep" ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-cyan-300/30 border-t-cyan-300 rounded-full animate-spin" />
                    <span>SYNTHESIZING RAG...</span>
                  </>
                ) : (
                  <>
                    <span>🔬 DEEP SEC RAG</span>
                  </>
                )}
              </button>

              {activeTicker && (
                <button
                  onClick={() =>
                    isCurrentTickerWatched
                      ? undefined
                      : handleAddWatchlist(activeTicker)
                  }
                  title={
                    isCurrentTickerWatched
                      ? `${activeTicker} is in your Watchlist`
                      : `Pin ${activeTicker} to Autonomous Watchlist`
                  }
                  className={`px-3.5 py-3 rounded-lg border font-mono text-xs transition-all ${
                    isCurrentTickerWatched
                      ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                  }`}
                >
                  {isCurrentTickerWatched ? "★ PINNED" : "☆ PIN"}
                </button>
              )}
            </div>
          </div>

          {/* 12-COLUMN INSTITUTIONAL WORKSPACE GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* LEFT/CENTER WORKSPACE (8 Cols) */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              {/* SYSTEM ALERT / FUZZY TICKER SUGGESTIONS / SEC VECTORIZATION BANNER */}
              {errorMsg && (
                <div className="bg-rose-950/40 border border-rose-500/40 text-rose-200 p-4 rounded-xl flex flex-col gap-3 shadow-lg">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 text-sm font-mono">
                      <span className="text-rose-400 font-bold shrink-0">
                        [SYSTEM ALERT]
                      </span>
                      <span className="leading-relaxed">{errorMsg}</span>
                    </div>
                    <button
                      onClick={() => setErrorMsg(null)}
                      className="text-rose-400 hover:text-white text-xs font-mono"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Clickable Fuzzy Suggestion Pills */}
                  {suggestionTickers.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-rose-500/20">
                      <span className="text-xs font-mono text-rose-300">
                        Quick Select Verified Equity:
                      </span>
                      {suggestionTickers.map((sym) => (
                        <button
                          key={sym}
                          onClick={() => analyzeStock(false, sym)}
                          className="px-2.5 py-1 rounded-md bg-rose-500/20 hover:bg-emerald-500/25 border border-rose-400/40 hover:border-emerald-400 text-white font-mono text-xs font-bold transition-all"
                        >
                          Analyze ${sym} →
                        </button>
                      ))}
                    </div>
                  )}

                  {/* One-click Deep RAG Retry when SEC Vectorization finishes */}
                  {secReady && errorMsg.toLowerCase().includes("vectoriz") && (
                    <div className="flex items-center justify-between pt-2 border-t border-emerald-500/30 bg-emerald-950/30 -mx-4 -mb-4 p-3 rounded-b-xl">
                      <span className="text-xs font-mono text-emerald-300 font-bold">
                        ✓ Background SEC Vectorization Complete! Ready for Deep RAG.
                      </span>
                      <button
                        onClick={() => analyzeStock(true, activeTicker)}
                        className="px-3 py-1.5 rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-bold transition-colors"
                      >
                        Launch Deep SEC RAG Now →
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* EMPTY STATE ONBOARDING (When no ticker selected yet) */}
              {!activeTicker && !loading && (
                <div className="bg-[#0a0f18]/90 border border-slate-800/90 rounded-2xl p-6 sm:p-8 shadow-2xl">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
                    <div>
                      <h2 className="text-lg font-bold text-white">
                        Select an Institutional Equity to Begin
                      </h2>
                      <p className="text-xs text-slate-400 font-mono mt-1">
                        Click any ticker below, choose from the left sidebar
                        vault, or enter a custom symbol above.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                      <span className="px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30">
                        Tier-1 Cache Barrier Active
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                    {[
                      {
                        sym: "NVDA",
                        label: "NVIDIA Corp",
                        tag: "AI Semiconductor",
                      },
                      {
                        sym: "MSFT",
                        label: "Microsoft",
                        tag: "Hyperscale Cloud",
                      },
                      {
                        sym: "AAPL",
                        label: "Apple Inc",
                        tag: "Consumer Ecosystem",
                      },
                      {
                        sym: "TSLA",
                        label: "Tesla Inc",
                        tag: "Autonomous & EV",
                      },
                      {
                        sym: "AMZN",
                        label: "Amazon.com",
                        tag: "AWS & Commerce",
                      },
                      {
                        sym: "GOOG",
                        label: "Alphabet Inc",
                        tag: "Search & Gemini AI",
                      },
                      {
                        sym: "INFY",
                        label: "Infosys ADR",
                        tag: "20-F Foreign Issuer",
                      },
                      {
                        sym: "SAP",
                        label: "SAP SE ADR",
                        tag: "20-F Enterprise ERP",
                      },
                    ].map((card) => (
                      <div
                        key={card.sym}
                        onClick={() => analyzeStock(false, card.sym)}
                        className="group p-3.5 rounded-xl bg-slate-900/60 hover:bg-emerald-500/10 border border-slate-800 hover:border-emerald-500/50 cursor-pointer transition-all flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-base text-white group-hover:text-emerald-300">
                            ${card.sym}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 group-hover:text-emerald-400">
                            →
                          </span>
                        </div>
                        <div className="mt-2">
                          <div className="text-xs font-medium text-slate-200 truncate">
                            {card.label}
                          </div>
                          <div className="text-[10px] font-mono text-slate-500 truncate">
                            {card.tag}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TRADINGVIEW LIVE INSTITUTIONAL CHART */}
              {activeTicker && (
                <div className="bg-[#0a0f18] border border-slate-800/90 rounded-2xl overflow-hidden shadow-2xl">
                  <div className="px-4 py-2.5 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 bg-[#070b12]">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-sm text-white">
                        ${activeTicker}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        LIVE PRICE ACTION & TECHNICALS
                      </span>
                    </div>
                    <div className="flex items-center gap-1 font-mono text-[11px]">
                      {(
                        [
                          { id: "60", label: "1H" },
                          { id: "D", label: "1D" },
                          { id: "W", label: "1W" },
                        ] as const
                      ).map((tf) => (
                        <button
                          key={tf.id}
                          onClick={() => setChartInterval(tf.id)}
                          className={`px-2 py-0.5 rounded transition-colors ${
                            chartInterval === tf.id
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          {tf.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="w-full h-[380px] sm:h-[420px]">
                    <iframe
                      key={`${activeTicker}-${chartInterval}`}
                      src={`https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(
                        activeTicker
                      )}&interval=${chartInterval}&hidesidetoolbar=1&symboledit=1&saveimage=1&toolbarbg=0a0f18&studies=%5B%5D&theme=dark&style=1&timezone=Etc%2FUTC`}
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      allowFullScreen
                      title={`${activeTicker} TradingView Chart`}
                    />
                  </div>
                </div>
              )}

              {/* LOADING SKELETON (When synthesizing report) */}
              {loading && !report && (
                <div className="bg-[#0a0f18] border border-slate-800/90 rounded-2xl p-6 sm:p-8 space-y-6 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="h-6 w-56 bg-slate-800 rounded" />
                    <div className="h-6 w-28 bg-emerald-500/20 rounded-full" />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="h-24 bg-slate-900 rounded-xl border border-slate-800" />
                    <div className="h-24 bg-slate-900 rounded-xl border border-slate-800" />
                    <div className="h-24 bg-slate-900 rounded-xl border border-slate-800" />
                    <div className="h-24 bg-slate-900 rounded-xl border border-slate-800" />
                  </div>
                  <div className="space-y-3">
                    <div className="h-4 w-40 bg-slate-800 rounded" />
                    <div className="h-20 bg-slate-900 rounded-xl border border-slate-800" />
                  </div>
                </div>
              )}

              {/* INTELLIGENCE REPORT DASHBOARD */}
              {report && (
                <div className="bg-[#0a0f18] border border-slate-800/90 rounded-2xl p-5 sm:p-8 shadow-2xl space-y-6">
                  {/* Report Top Header & Metadata Badges */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl sm:text-2xl font-bold text-white font-mono">
                          ${report.ticker} Intelligence Report
                        </h2>
                        <span
                          className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full font-semibold border ${
                            report.is_deep_rag
                              ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/40"
                              : "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
                          }`}
                        >
                          {report.is_deep_rag
                            ? "🔬 DEEP SEC RAG"
                            : "⚡ FAST INSTITUTIONAL"}
                        </span>
                        {report.cached && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            CACHED ({report.analysis_date})
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 font-mono mt-1">
                        Analysis Date: {report.analysis_date || "Today"} •{" "}
                        {report.sec_filing?.form_type
                          ? `SEC Filing: ${report.sec_filing.form_type} (${
                              report.sec_filing.is_ready
                                ? "Vectorized"
                                : "Indexing"
                            })`
                          : "Audited XBRL + Live Institutional News"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!report.is_deep_rag && (
                        <button
                          onClick={() => analyzeStock(true, report.ticker)}
                          disabled={loading}
                          className="px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold transition-all"
                        >
                          Upgrade to Deep RAG →
                        </button>
                      )}
                      <button
                        onClick={handleCopyReport}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono transition-colors"
                      >
                        {copiedReport ? "✓ Copied MD" : "Copy Brief"}
                      </button>
                    </div>
                  </div>

                  {/* 4-COLUMN QUANTITATIVE SCORE GAUGES */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                    {/* Sentiment Score */}
                    <div className="bg-[#06090f] p-4 rounded-xl border border-slate-800/90 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                          SENTIMENT
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {report.sentiment_score}/100
                        </span>
                      </div>
                      <div className="my-2">
                        <div
                          className={`text-lg sm:text-xl font-bold font-mono ${
                            report.sentiment_label === "Bullish"
                              ? "text-emerald-400"
                              : report.sentiment_label === "Bearish"
                              ? "text-rose-400"
                              : "text-amber-300"
                          }`}
                        >
                          {report.sentiment_label.toUpperCase()}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                          FinBERT Norm:{" "}
                          <span className="text-emerald-400 font-bold">
                            {Number(finbertNormalized) > 0
                              ? `+${finbertNormalized}`
                              : finbertNormalized}
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            report.sentiment_label === "Bullish"
                              ? "bg-emerald-500"
                              : report.sentiment_label === "Bearish"
                              ? "bg-rose-500"
                              : "bg-amber-400"
                          }`}
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(0, report.sentiment_score)
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Bull Score */}
                    <div className="bg-[#06090f] p-4 rounded-xl border border-slate-800/90 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                          BULL CONVICTION
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400">
                          UPSIDE
                        </span>
                      </div>
                      <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400 my-2">
                        {report.bullish_score}
                        <span className="text-xs text-slate-500 font-normal">
                          /100
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(0, report.bullish_score)
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Risk Score */}
                    <div className="bg-[#06090f] p-4 rounded-xl border border-slate-800/90 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                          INSTITUTIONAL RISK
                        </span>
                        <span className="text-[10px] font-mono text-rose-400">
                          HEADWINDS
                        </span>
                      </div>
                      <div className="text-2xl sm:text-3xl font-bold font-mono text-rose-400 my-2">
                        {report.risk_score}
                        <span className="text-xs text-slate-500 font-normal">
                          /100
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-rose-500 rounded-full transition-all duration-700"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(0, report.risk_score)
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Confidence Score */}
                    <div className="bg-[#06090f] p-4 rounded-xl border border-slate-800/90 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                          DATA CONFIDENCE
                        </span>
                        <span className="text-[10px] font-mono text-cyan-400">
                          AUDIT
                        </span>
                      </div>
                      <div className="text-2xl sm:text-3xl font-bold font-mono text-cyan-300 my-2">
                        {report.confidence_score ?? 80}
                        <span className="text-xs text-slate-500 font-normal">
                          %
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cyan-400 rounded-full transition-all duration-700"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(0, report.confidence_score ?? 80)
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* AUDITED FUNDAMENTALS BAR (Rendered when backend supplies supporting fundamentals) */}
                  {report.fundamentals && (
                    <div className="bg-[#06090f] border border-slate-800/90 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                          Audited SEC XBRL & Live Valuation Metrics
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          As of {report.fundamentals.fiscal_date || "Latest"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono">
                        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/70">
                          <div className="text-[10px] text-slate-400">
                            MARKET CAP
                          </div>
                          <div className="text-sm font-bold text-white mt-0.5">
                            {formatCompactCurrency(
                              report.fundamentals.market_cap
                            )}
                          </div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/70">
                          <div className="text-[10px] text-slate-400">
                            ANNUAL REVENUE
                          </div>
                          <div className="text-sm font-bold text-emerald-400 mt-0.5">
                            {formatCompactCurrency(report.fundamentals.revenue)}
                          </div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/70">
                          <div className="text-[10px] text-slate-400">
                            TOTAL DEBT
                          </div>
                          <div className="text-sm font-bold text-rose-300 mt-0.5">
                            {formatCompactCurrency(
                              report.fundamentals.total_debt
                            )}
                          </div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/70">
                          <div className="text-[10px] text-slate-400">
                            DILUTED EPS
                          </div>
                          <div className="text-sm font-bold text-white mt-0.5">
                            {report.fundamentals.eps !== null &&
                            report.fundamentals.eps !== undefined
                              ? `$${Number(report.fundamentals.eps).toFixed(2)}`
                              : "N/A"}
                          </div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/70">
                          <div className="text-[10px] text-slate-400">
                            P/E MULTIPLE
                          </div>
                          <div className="text-sm font-bold text-cyan-300 mt-0.5">
                            {report.fundamentals.pe_ratio !== null &&
                            report.fundamentals.pe_ratio !== undefined
                              ? `${Number(report.fundamentals.pe_ratio).toFixed(
                                  2
                                )}x`
                              : "N/A"}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* INTERACTIVE REPORT TABS (Thesis vs. Verified News vs. SEC Filing Status) */}
                  <div className="border-b border-slate-800 flex items-center gap-2 font-mono text-xs">
                    <button
                      onClick={() => setActiveWorkspaceTab("thesis")}
                      className={`px-4 py-2.5 border-b-2 font-bold transition-colors ${
                        activeWorkspaceTab === "thesis"
                          ? "border-emerald-400 text-emerald-400"
                          : "border-transparent text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      AI INSTITUTIONAL THESIS
                    </button>
                    <button
                      onClick={() => setActiveWorkspaceTab("news")}
                      className={`px-4 py-2.5 border-b-2 font-bold transition-colors flex items-center gap-1.5 ${
                        activeWorkspaceTab === "news"
                          ? "border-emerald-400 text-emerald-400"
                          : "border-transparent text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <span>INSTITUTIONAL NEWS</span>
                      {report.news && report.news.length > 0 && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                          {report.news.length}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => setActiveWorkspaceTab("filings")}
                      className={`px-4 py-2.5 border-b-2 font-bold transition-colors ${
                        activeWorkspaceTab === "filings"
                          ? "border-emerald-400 text-emerald-400"
                          : "border-transparent text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      SEC RAG TELEMETRY
                    </button>
                  </div>

                  {activeWorkspaceTab === "thesis" ? (
                    <div className="space-y-6">
                      {/* Bull & Bear Case Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="bg-emerald-950/15 border border-emerald-500/25 rounded-xl p-5">
                          <h3 className="text-emerald-400 font-mono font-bold text-xs tracking-widest uppercase mb-2.5 flex items-center gap-2">
                            <span>▲ INSTITUTIONAL BULL CASE</span>
                          </h3>
                          <p className="text-slate-200 text-sm leading-relaxed">
                            {report.bull_case_summary}
                          </p>
                        </div>

                        <div className="bg-rose-950/15 border border-rose-500/25 rounded-xl p-5">
                          <h3 className="text-rose-400 font-mono font-bold text-xs tracking-widest uppercase mb-2.5 flex items-center gap-2">
                            <span>▼ INSTITUTIONAL BEAR CASE</span>
                          </h3>
                          <p className="text-slate-200 text-sm leading-relaxed">
                            {report.bear_case_summary}
                          </p>
                        </div>
                      </div>

                      {/* Growth Drivers & Major Risks Matrices */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="bg-[#06090f] p-5 rounded-xl border border-slate-800/80">
                          <h3 className="text-emerald-400 font-mono font-bold mb-3.5 text-xs tracking-widest uppercase">
                            KEY GROWTH CATALYSTS
                          </h3>
                          <ul className="space-y-2.5 text-sm text-slate-300">
                            {report.growth_drivers?.map((driver, i) => (
                              <li key={i} className="flex items-start gap-2.5">
                                <span className="text-emerald-400 font-mono font-bold mt-0.5">
                                  0{i + 1}
                                </span>
                                <span className="leading-snug">{driver}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-[#06090f] p-5 rounded-xl border border-slate-800/80">
                          <h3 className="text-rose-400 font-mono font-bold mb-3.5 text-xs tracking-widest uppercase">
                            PRIMARY STRUCTURAL RISKS
                          </h3>
                          <ul className="space-y-2.5 text-sm text-slate-300">
                            {report.major_risks?.map((risk, i) => (
                              <li key={i} className="flex items-start gap-2.5">
                                <span className="text-rose-400 font-mono font-bold mt-0.5">
                                  0{i + 1}
                                </span>
                                <span className="leading-snug">{risk}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ) : activeWorkspaceTab === "news" ? (
                    /* VERIFIED INSTITUTIONAL NEWS FEED */
                    <div className="space-y-3">
                      {report.news && report.news.length > 0 ? (
                        report.news.map((article, idx) => (
                          <a
                            key={`${article.url}-${idx}`}
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-4 rounded-xl bg-[#06090f] hover:bg-slate-900 border border-slate-800/80 hover:border-emerald-500/40 transition-all group"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <h4 className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors">
                                {article.title}
                              </h4>
                              <span className="text-[10px] font-mono text-slate-500 shrink-0">
                                {article.published_at
                                  ? article.published_at.slice(0, 10)
                                  : "Verified"}
                              </span>
                            </div>
                            {article.summary &&
                              article.summary !== article.title && (
                                <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">
                                  {article.summary}
                                </p>
                              )}
                          </a>
                        ))
                      ) : (
                        <div className="p-6 text-center text-xs font-mono text-slate-400 bg-[#06090f] rounded-xl border border-slate-800">
                          News catalysts were synthesized directly into the
                          intelligence brief. Run a fresh analysis to refresh
                          individual article links.
                        </div>
                      )}
                    </div>
                  ) : (
                    /* SEC RAG TELEMETRY & PIPELINE ARCHITECTURE TAB */
                    <div className="bg-[#06090f] p-5 rounded-xl border border-slate-800 space-y-4 font-mono text-xs">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <span className="text-slate-400">
                          SEC EDGAR VECTOR STATUS:
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded font-bold ${
                            report.sec_filing?.is_ready || secReady
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                          }`}
                        >
                          {report.sec_filing?.is_ready || secReady
                            ? `READY (${
                                report.sec_filing?.form_type || secForm || "10-K/20-F"
                              })`
                            : "INDEXING IN BACKGROUND"}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-300">
                        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                          <div className="text-[10px] text-slate-500">
                            EMBEDDING ENGINE
                          </div>
                          <div className="font-bold text-white mt-1">
                            Cohere embed-english-v3.0
                          </div>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                          <div className="text-[10px] text-slate-500">
                            CHUNKING WINDOW
                          </div>
                          <div className="font-bold text-white mt-1">
                            1,500 chars / 200 overlap
                          </div>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                          <div className="text-[10px] text-slate-500">
                            MULTI-QUERY VECTORS
                          </div>
                          <div className="font-bold text-cyan-300 mt-1">
                            Risks • Catalysts • Margins
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* OMNISTOCK CTA FOOTER */}
                  <div className="pt-5 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <p className="text-slate-200 text-sm font-medium">
                        Want quantitative price action forecasting after fundamental research?
                      </p>
                      <p className="text-xs text-slate-400 font-mono">
                        Launch our companion ML forecasting suite for{" "}
                        <span className="text-emerald-400 font-bold">
                          ${report.ticker}
                        </span>
                      </p>
                    </div>
                    <a
                      href="https://omnistock-ai.streamlit.app/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-2.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold tracking-wider uppercase transition-all shrink-0"
                    >
                      PREDICT PRICE ACTION ↗
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: PERMANENT LIVE TELEMETRY TERMINAL (4 Cols) */}
            <div className="lg:col-span-4 lg:sticky lg:top-24">
              <div className="bg-[#04060a] border border-slate-800/90 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[540px] sm:h-[620px] font-mono text-xs">
                {/* Terminal Top Window Bar */}
                <div className="px-4 py-3 bg-[#080c14] border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
                    </div>
                    <span className="text-slate-300 font-bold tracking-wider uppercase ml-1">
                      TELEMETRY: {activeTicker ? `$${activeTicker}` : "STANDBY"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {(loading || isVectorizing) && (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold animate-pulse">
                        ● LIVE
                      </span>
                    )}
                    <button
                      onClick={() => setAutoScrollLogs((prev) => !prev)}
                      title="Toggle Auto-Scroll"
                      className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                        autoScrollLogs
                          ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                          : "border-slate-700 text-slate-500"
                      }`}
                    >
                      AUTO
                    </button>
                    <button
                      onClick={() => setLogs([])}
                      title="Clear Terminal Buffer"
                      className="text-[10px] px-1.5 py-0.5 rounded border border-slate-800 text-slate-400 hover:text-white"
                    >
                      CLR
                    </button>
                  </div>
                </div>

                {/* Pipeline Stage Indicator Strip */}
                <div className="px-4 py-2 bg-[#060a10] border-b border-slate-800/70 grid grid-cols-4 gap-1 text-[10px]">
                  <div
                    className={`truncate ${
                      activeTicker ? "text-emerald-400 font-bold" : "text-slate-600"
                    }`}
                  >
                    1.XBRL
                  </div>
                  <div
                    className={`truncate ${
                      logs.some((l) => l.toLowerCase().includes("news"))
                        ? "text-emerald-400 font-bold"
                        : "text-slate-600"
                    }`}
                  >
                    2.NEWS
                  </div>
                  <div
                    className={`truncate ${
                      secReady
                        ? "text-cyan-400 font-bold"
                        : isVectorizing
                        ? "text-amber-300 animate-pulse font-bold"
                        : "text-slate-600"
                    }`}
                  >
                    3.SEC-RAG
                  </div>
                  <div
                    className={`truncate ${
                      report ? "text-emerald-400 font-bold" : "text-slate-600"
                    }`}
                  >
                    4.GROQ
                  </div>
                </div>

                {/* Scrollable Log Stream */}
                <div
                  ref={terminalContainerRef}
                  className="flex-1 p-4 overflow-y-auto space-y-2 leading-relaxed"
                >
                  {logs.length > 0 ? (
                    logs.map((log, i) => {
                      const isErr =
                        log.toLowerCase().includes("error") ||
                        log.toLowerCase().includes("failed");
                      const isCache = log.toLowerCase().includes("cache hit");
                      const isReadyMsg = log
                        .toLowerCase()
                        .includes("ready to be initiated");

                      return (
                        <div key={i} className="flex items-start gap-2.5">
                          <span className="text-slate-600 select-none shrink-0">
                            {String(i + 1).padStart(2, "0")} &gt;
                          </span>
                          <span
                            className={`break-words ${
                              isErr
                                ? "text-rose-400 font-semibold"
                                : isCache
                                ? "text-cyan-300 font-bold"
                                : isReadyMsg
                                ? "text-emerald-300 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded"
                                : "text-emerald-400/90"
                            }`}
                          >
                            {log}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-slate-600 italic flex items-center gap-2">
                      <span>&gt;</span>
                      <span>
                        Uplink standing by. Select a ticker from the left
                        sidebar or command bar to stream execution telemetry...
                      </span>
                    </div>
                  )}
                  {(loading || isVectorizing) && (
                    <div className="flex items-center gap-2 text-emerald-500 font-bold pt-1">
                      <span>&gt;</span>
                      <span className="inline-block w-2 h-4 bg-emerald-400 animate-pulse" />
                    </div>
                  )}
                </div>

                {/* Terminal Footer Action (Shows when SEC Vectorization is ready) */}
                {secReady && activeTicker && !report?.is_deep_rag && (
                  <div className="p-3 bg-cyan-950/30 border-t border-cyan-500/30 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-cyan-300">
                      ✓ {activeTicker} SEC Vectors Ready
                    </span>
                    <button
                      onClick={() => analyzeStock(true, activeTicker)}
                      disabled={loading}
                      className="px-2.5 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[11px] transition-colors"
                    >
                      Run Deep RAG →
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}