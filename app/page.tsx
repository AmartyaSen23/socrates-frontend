"use client";

import { useState, useEffect } from "react";

const MAX_LOGS = 50;

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

  // Dedicated log fetcher to guarantee we can call it immediately upon completion
  const fetchLatestLogs = async (ticker: string) => {
    if (!ticker) return;
    try {
      const res = await fetch(`https://socrates-backend-kbyq.onrender.com/api/v1/ingestion/status/${ticker}`);
      if (res.ok) {
        const json = await res.json();
        if (json.logs && json.logs.length > 0) {
          // THE FIX: The backend returns the FULL history. We replace, we do NOT append!
          setLogs(json.logs.slice(-MAX_LOGS));
        }
      }
    } catch (e) {
      // Silently ignore network hiccups during polling
    }
  };

  // Immortal Polling: Polls ONLY while loading is true and report hasn't finished
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTicker && loading && !report) {
      interval = setInterval(() => {
        fetchLatestLogs(activeTicker);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTicker, loading, report]);

  const analyzeStock = async (isDeep = false) => {
    const targetTicker = tickerInput.trim().toUpperCase();
    if (!targetTicker) return;
    
    setLoading(true);
    setReport(null);
    setErrorMsg(null);
    setLogs([isDeep ? "Initiating DEEP RAG Pipeline..." : "Initiating Autonomous Pipeline..."]);
    setActiveTicker(targetTicker);

    const endpoint = isDeep 
      ? `/api/v1/ingestion/analyze/deep/${targetTicker}` 
      : `/api/v1/ingestion/analyze/${targetTicker}`;

    try {
      const res = await fetch(`https://socrates-backend-kbyq.onrender.com${endpoint}`, { method: "POST" });
      const json = await res.json();
      
      // THE FIX: The API just finished. Grab the absolute final logs IMMEDIATELY
      // before React has a chance to kill the polling interval!
      await fetchLatestLogs(targetTicker);
      
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

  return (
    <main className="min-h-screen bg-neutral-950 text-emerald-400 p-8 font-mono">
      <div className="max-w-7xl mx-auto">
        
        {/* MACRO HEADER */}
        <div className="flex flex-wrap gap-6 mb-12 text-xs border-b border-neutral-800 pb-4">
          <div className="text-neutral-600 font-bold tracking-widest">LIVE US MACRO:</div>
          {macroData.map((metric, index) => (
            <div key={index} className="flex gap-2">
              <span className="text-neutral-500">{metric.event_name.toUpperCase()}:</span>
              <span className="text-emerald-400 font-bold">{metric.actual_value}%</span>
            </div>
          ))}
        </div>

        <h1 className="text-4xl font-bold mb-2 text-white">Socrates Research Engine</h1>
        <p className="text-neutral-400 mb-8">Autonomous Quantitative Research Terminal</p>

        {/* MAIN GRID LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: Controls, Chart, Report (8 Cols) */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            <div className="flex gap-4">
              <input
                value={tickerInput}
                onChange={(e) => setTickerInput(e.target.value.toUpperCase())}
                placeholder="ENTER TICKER"
                className="bg-neutral-900 border border-emerald-900 p-3 rounded outline-none w-64 text-white uppercase"
              />
              <button 
                onClick={() => analyzeStock(false)} 
                disabled={loading} 
                className="bg-emerald-900 hover:bg-emerald-700 text-white px-6 py-3 rounded disabled:opacity-50 transition-colors"
              >
                FAST RESEARCH
              </button>
              <button 
                onClick={() => analyzeStock(true)} 
                disabled={loading} 
                className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 text-white px-6 py-3 rounded disabled:opacity-50 transition-colors"
              >
                DEEP SEC RAG
              </button>
            </div>

            {errorMsg && (
              <div className="bg-red-950/50 border border-red-900 text-red-400 p-4 rounded-md">
                <span className="font-bold">SYSTEM ALERT:</span> {errorMsg}
              </div>
            )}

            {activeTicker && (
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

            {report && (
              <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-xl font-bold text-white mb-4">Intelligence Report</h2>
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="bg-black/40 p-4 border border-neutral-800 rounded text-center">
                    <p className="text-neutral-500 text-xs tracking-widest mb-1">SENTIMENT</p>
                    <p className="text-lg font-bold text-white">{report.sentiment_label}</p>
                    <p className="text-emerald-500 text-[10px] mt-1">Normalized: {((report.sentiment_score / 50) - 1).toFixed(2)}</p>
                  </div>
                  <div className="bg-black/40 p-4 border border-neutral-800 rounded text-center">
                    <p className="text-neutral-500 text-xs tracking-widest mb-1">BULL SCORE</p>
                    <p className="text-2xl font-bold text-emerald-400">{report.bullish_score}</p>
                  </div>
                  <div className="bg-black/40 p-4 border border-neutral-800 rounded text-center">
                    <p className="text-neutral-500 text-xs tracking-widest mb-1">RISK SCORE</p>
                    <p className="text-2xl font-bold text-red-400">{report.risk_score}</p>
                  </div>
                </div>
                
                <h3 className="text-emerald-400 font-bold mb-2 tracking-wider">INSTITUTIONAL BULL CASE</h3>
                <p className="text-neutral-300 text-sm mb-6 leading-relaxed">{report.bull_case_summary}</p>
                
                <h3 className="text-red-400 font-bold mb-2 tracking-wider">INSTITUTIONAL BEAR CASE</h3>
                <p className="text-neutral-300 text-sm leading-relaxed mb-6">{report.bear_case_summary}</p>
                
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
            )}
          </div>

          {/* RIGHT COLUMN: Permanent Terminal (4 Cols) */}
          <div className="lg:col-span-4">
            <div className="bg-black border border-neutral-800 p-4 rounded-md font-mono text-xs text-emerald-500 h-[600px] overflow-y-auto flex flex-col sticky top-8 shadow-inner">
              <div className="text-neutral-500 border-b border-neutral-800 pb-2 mb-2 font-bold uppercase tracking-widest flex justify-between">
                <span>Terminal: {activeTicker || "Ready"}</span>
                {loading && <span className="text-emerald-500 animate-pulse">● LIVE</span>}
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-1">
                {logs.length > 0 ? (
                  logs.map((log, i) => (
                    <div key={i} className="flex gap-3">
                      <span className="text-neutral-700">{'>'}</span>
                      <span className="text-emerald-400 break-words">{log}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-neutral-700 italic flex gap-3">
                    <span className="text-neutral-700">{'>'}</span>
                    <span>Waiting for uplink...</span>
                  </div>
                )}
                {loading && !errorMsg && <div className="animate-pulse mt-1 text-emerald-700 font-bold">_</div>}
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </main>
  );
}