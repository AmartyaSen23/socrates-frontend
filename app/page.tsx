"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [tickerInput, setTickerInput] = useState("");
  const [activeTicker, setActiveTicker] = useState("");
  const [report, setReport] = useState<any>(null);
  const [macroData, setMacroData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const fetchMacro = async () => {
      try {
        const res = await fetch("https://socrates-backend-kbyq.onrender.com/api/v1/ingestion/macro");
        const json = await res.json();
        if (json.data) setMacroData(json.data);
      } catch (error) {
        console.error("Failed to fetch macro data:", error);
      }
    };
    fetchMacro();
  }, []);

  // TIER 4 FIX: Immortal Polling
  // It now polls as long as we are looking at a ticker and haven't finished the report
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTicker && !report) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`https://socrates-backend-kbyq.onrender.com/api/v1/ingestion/status/${activeTicker}`);
          if (res.ok) {
            const json = await res.json();
            if (json.logs) setLogs(json.logs);
          }
        } catch (e) {
          // Silently ignore fetch errors during polling
        }
      }, 800); 
    }
    return () => clearInterval(interval);
  }, [activeTicker, report]);

  const analyzeStock = async () => {
    if (!tickerInput) return;
    setLoading(true);
    setReport(null);
    setErrorMsg(null);
    setLogs([]); 
    setActiveTicker(tickerInput.toUpperCase());

    try {
      const res = await fetch(`https://socrates-backend-kbyq.onrender.com/api/v1/ingestion/analyze/${tickerInput}`, {
        method: "POST",
      });
      const json = await res.json();
      
      if (!res.ok) {
        setErrorMsg(json.detail || "An error occurred during analysis.");
      } else {
        setReport(json.data);
      }
    } catch (error) {
      setErrorMsg("Failed to connect to the Socrates Backend.");
    }

    setLoading(false);
  };

  const deepAnalyzeStock = async () => {
    if (!tickerInput) return;
    setLoading(true);
    setReport(null);
    setErrorMsg(null);
    // Notice we do NOT clear logs here! We want to keep seeing background progress!
    setActiveTicker(tickerInput.toUpperCase());

    try {
      const res = await fetch(`https://socrates-backend-kbyq.onrender.com/api/v1/ingestion/analyze/deep/${tickerInput}`, {
        method: "POST",
      });
      
      const json = await res.json();
      
      if (res.status === 400) {
        setErrorMsg(json.detail || "SEC Vectorization in progress. Please wait.");
      } else if (!res.ok) {
        setErrorMsg(json.detail || "An error occurred during deep RAG analysis.");
      } else {
        setReport(json.data);
      }
    } catch (error) {
        setErrorMsg("Failed to connect to the Socrates Backend.");
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-emerald-400 p-8 font-mono">
      <div className="max-w-4xl mx-auto">
        
        {/* MACRO ECONOMICS PANEL */}
        <div className="flex flex-wrap gap-6 mb-12 text-xs border-b border-neutral-800 pb-4">
          <div className="text-neutral-600 font-bold tracking-widest">LIVE US MACRO:</div>
          {macroData.map((metric, index) => (
            <div key={index} className="flex gap-2">
              <span className="text-neutral-500">{metric.event_name.toUpperCase()}:</span>
              <span className="text-emerald-400 font-bold">
                {metric.actual_value}{metric.event_name.includes("Rate") || metric.event_name.includes("Inflation") ? "%" : ""}
              </span>
            </div>
          ))}
        </div>

        <h1 className="text-4xl font-bold mb-2 text-white">Socrates Research Engine</h1>
        <p className="text-neutral-400 mb-8">Autonomous Quantitative Research Terminal</p>

        {/* Search Bar & Controls */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              value={tickerInput}
              onChange={(e) => setTickerInput(e.target.value.toUpperCase())}
              placeholder="ENTER TICKER (e.g. AAPL)"
              className="bg-neutral-900 border border-emerald-900 p-3 rounded outline-none focus:border-emerald-500 w-64 text-white placeholder-neutral-600 uppercase"
            />
            <button
              onClick={analyzeStock}
              disabled={loading}
              className="bg-emerald-900 hover:bg-emerald-700 text-white px-6 py-3 rounded transition-colors disabled:opacity-50 min-w-[200px]"
            >
              {loading && !errorMsg ? "GATHERING INTEL..." : "FAST RESEARCH"}
            </button>
            
            <button
              onClick={deepAnalyzeStock}
              disabled={loading}
              className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 text-white px-6 py-3 rounded transition-colors disabled:opacity-50"
            >
              {loading && !errorMsg ? "ANALYZING SEC..." : "DEEP SEC RAG"}
            </button>
          </div>

          {/* Race Condition Error Banner */}
          {errorMsg && (
            <div className="bg-red-950/50 border border-red-900 text-red-400 p-4 rounded-md w-full animate-in fade-in">
              <span className="font-bold mr-2">SYSTEM ALERT:</span>
              {errorMsg}
            </div>
          )}

          {/* IMMORTAL LIVE TERMINAL CONSOLE */}
          {(!report && activeTicker && logs.length > 0) && (
            <div className="bg-black border border-neutral-800 p-4 rounded-md font-mono text-xs text-emerald-500 h-48 overflow-y-auto flex flex-col w-full shadow-inner animate-in fade-in mt-4">
              <div className="text-neutral-500 border-b border-neutral-800 pb-2 mb-2">SOCRATES NEURAL LINK // ACTIVE CONNECTION</div>
              {logs.map((log, i) => (
                <div key={i} className="flex gap-3 mb-1">
                  <span className="text-neutral-600 font-bold">{'>'}</span>
                  <span className="text-emerald-400">{log}</span>
                </div>
              ))}
              <div className="animate-pulse mt-1 text-emerald-700 font-bold">_</div>
            </div>
          )}
        </div>

        {/* Live TradingView Chart */}
        {activeTicker && !report && !errorMsg && (
          <div className="w-full h-[400px] mb-8 rounded-lg overflow-hidden border border-neutral-800 shadow-2xl animate-in fade-in duration-700">
            <iframe
              src={`https://s.tradingview.com/widgetembed/?symbol=${activeTicker}&interval=D&hidesidetoolbar=1&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=%5B%5D&theme=dark&style=1&timezone=Etc%2FUTC`}
              width="100%"
              height="100%"
              frameBorder="0"
              allowFullScreen
            ></iframe>
          </div>
        )}

        {/* AI Intelligence Dashboard */}
        {report && (
          <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-lg shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="p-6 border border-emerald-900/50 rounded-lg bg-black/40 flex flex-col justify-center items-center text-center">
                <p className="text-neutral-500 text-sm tracking-widest mb-2">SENTIMENT</p>
                <p className="text-3xl font-bold text-white">{report.sentiment_label}</p>
                {/* Normalized FinBERT Score visual representation */}
                <p className="text-emerald-500 text-sm mt-1">Normalized: {((report.sentiment_score / 50) - 1).toFixed(2)}</p>
              </div>
              <div className="p-6 border border-emerald-900/50 rounded-lg bg-black/40 flex flex-col justify-center items-center text-center">
                <p className="text-neutral-500 text-sm tracking-widest mb-2">BULL SCORE</p>
                <p className="text-4xl font-bold text-emerald-400">{report.bullish_score}</p>
              </div>
              <div className="p-6 border border-red-900/50 rounded-lg bg-black/40 flex flex-col justify-center items-center text-center">
                <p className="text-neutral-500 text-sm tracking-widest mb-2">RISK SCORE</p>
                <p className="text-4xl font-bold text-red-400">{report.risk_score}</p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-black/20 p-6 rounded-lg border border-neutral-800/50">
                <h3 className="text-emerald-400 font-bold border-b border-neutral-800 pb-3 mb-4 tracking-wider">INSTITUTIONAL BULL CASE</h3>
                <p className="text-neutral-300 text-sm leading-relaxed">{report.bull_case_summary}</p>
              </div>
              <div className="bg-black/20 p-6 rounded-lg border border-neutral-800/50">
                <h3 className="text-red-400 font-bold border-b border-neutral-800 pb-3 mb-4 tracking-wider">INSTITUTIONAL BEAR CASE</h3>
                <p className="text-neutral-300 text-sm leading-relaxed">{report.bear_case_summary}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-8 pt-4">
                <div className="bg-black/20 p-6 rounded-lg border border-neutral-800/50">
                  <h3 className="text-emerald-500 font-bold mb-4 text-sm tracking-widest">GROWTH DRIVERS</h3>
                  <ul className="list-disc list-inside text-sm text-neutral-300 space-y-2 marker:text-emerald-500">
                    {report.growth_drivers?.map((driver: string, i: number) => <li key={i}>{driver}</li>)}
                  </ul>
                </div>
                <div className="bg-black/20 p-6 rounded-lg border border-neutral-800/50">
                  <h3 className="text-red-500 font-bold mb-4 text-sm tracking-widest">MAJOR RISKS</h3>
                  <ul className="list-disc list-inside text-sm text-neutral-300 space-y-2 marker:text-red-500">
                    {report.major_risks?.map((risk: string, i: number) => <li key={i}>{risk}</li>)}
                  </ul>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-neutral-800 text-center">
                <p className="text-neutral-400 mb-3 text-sm">Wanna use our New Model to predict stocks after researching?</p>
                <a 
                  href="https://omnistock-ai.streamlit.app/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block bg-neutral-800 hover:bg-emerald-900 border border-neutral-600 text-white px-6 py-2 rounded-md transition-colors text-sm font-bold tracking-wide"
                >
                  PREDICT PRICE ACTION
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}