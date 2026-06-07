"use client"
import { useState, useEffect, useRef } from 'react';
import { 
  TrendingUp, AlertCircle, 
  ArrowUpRight, Zap, 
  RefreshCw, Calendar, Loader2,
  BarChart2,
  AlertTriangle,
  Activity
} from 'lucide-react';
import Image from 'next/image';
import AILogo from "@/public/ai.png";

// --- TYPES ---
interface RevenueForecast {
  expected_revenue: number;
  lower_bound: number;
  upper_bound: number;
}

interface ForecastData {
  next_30_days: RevenueForecast;
  next_90_days: RevenueForecast;
  peak_days: string[];
  risk_factors: string[];
  growth_rate_yoy: number;
}

// --- HELPERS ---
const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(val);

const formatShortCurrency = (val: number) =>
  `EGP ${Math.round(val / 1000)}k`;

const formatPercent = (val: number) =>
  `${val > 0 ? '+' : ''}${(val * 100).toFixed(0)}%`;

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

const formatRiskTitle = (str: string) =>
  str.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

const CACHE_KEY      = "forecast_ai_data";
const CACHE_TIME_KEY = "forecast_ai_timestamp";
const CACHE_TTL      = 24 * 60 * 60 * 1000;

// --- PROGRESS BAR STAGES (shown while streaming) ---
const STAGE_LABELS: Record<number, string> = {
  5:  "Scaling features…",
  10: "Building training dataset…",
  15: "Training gradient boosting model…",
  60: "Training histogram boosting model…",
  80: "Optimising ensemble blend…",
  88: "Generating 90-day forecast…",
  94: "Analysing risk factors…",
  99: "Finalising results…",
  100:"Done!",
};

export default function SalesForecastHub() {
  const [forecastData, setForecastData]   = useState<ForecastData | null>(null);
  const [isStreaming, setIsStreaming]      = useState(false);   // ML pipeline running
  const [isLoadingCache, setIsLoadingCache] = useState(true);  // initial cache check
  const [progress, setProgress]           = useState(0);
  const [progressMsg, setProgressMsg]     = useState("");
  const [error, setError]                 = useState<string | null>(null);

  // Prevent double-fire in StrictMode
  const hasFetched = useRef(false);

  const fetchForecastData = async (forceRefresh = false) => {
    if (isStreaming) return;
    setError(null);

    // --- CACHE CHECK ---
    if (!forceRefresh) {
      const cached     = localStorage.getItem(CACHE_KEY);
      const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
      if (cached && cachedTime && Date.now() - parseInt(cachedTime) < CACHE_TTL) {
        setForecastData(JSON.parse(cached));
        setIsLoadingCache(false);
        return;
      }
    }

    // --- STREAM FROM API ---
    setIsStreaming(true);
    setIsLoadingCache(false);
    setProgress(0);
    setProgressMsg("Preparing data…");

    try {
      // 1. Fetch the raw sales payload from our own Next.js route
      const baseRes = await fetch('/api/fore-cast');
      if (!baseRes.ok) throw new Error('Failed to fetch base sales data');
      const salesPayload = await baseRes.json();

      // 2. POST to Railway and read the SSE stream
      const forecastRes = await fetch(
        "https://web-production-3f0f2.up.railway.app/api/v1/forecast-recommendations",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(salesPayload),
        }
      );

      if (!forecastRes.ok) {
        const text = await forecastRes.text();
        throw new Error(`Forecast API error ${forecastRes.status}: ${text}`);
      }

      if (!forecastRes.body) throw new Error("No response body from forecast API");

      const reader  = forecastRes.body.getReader();
      const decoder = new TextDecoder();
      let   buffer  = "";   // accumulate partial chunks

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Buffer handles cases where a chunk splits across an SSE boundary
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        // Keep the last (potentially incomplete) line in the buffer
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));

            if (event.type === "progress") {
              setProgress(event.pct);
              setProgressMsg(event.message ?? STAGE_LABELS[event.pct] ?? "");
            }

            if (event.type === "result") {
              setForecastData(event.data);
              // Persist to cache
              localStorage.setItem(CACHE_KEY, JSON.stringify(event.data));
              localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
            }

            if (event.type === "error") {
              throw new Error(event.message);
            }
          } catch (parseErr) {
            // Malformed SSE line — skip silently
            console.warn("SSE parse error:", parseErr);
          }
        }
      }
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unable to load forecast data.");
    } finally {
      setIsStreaming(false);
    }
  };

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchForecastData();
  }, []);

  // --- DERIVED UI STATE ---
  const showSpinner  = isLoadingCache;
  const showProgress = isStreaming;
  const showData     = !isLoadingCache && !isStreaming && forecastData;
  const showError    = !isLoadingCache && !isStreaming && error;

  return (
    <div className="min-h-screen flex flex-col font-sans bg-white">
      {/* HEADER */}
      <header className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white z-10">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-1.5 rounded-xl aspect-square grid place-content-center">
              <Image src={AILogo} alt="ai-logo" width={25} height={25} className="w-6.25" />
            </div>
            <span className="font-semibold text-gray-900">Forecasting</span>
          </div>
          <div className="w-px h-6 bg-gray-300" />
        </div>

        <div className="flex items-center space-x-6">
          <div className="w-px h-6 bg-gray-300" />
          <button
            onClick={() => fetchForecastData(true)}
            disabled={isStreaming || isLoadingCache}
            className="bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isStreaming || isLoadingCache ? 'animate-spin' : ''}`} />
            {isStreaming ? 'Running…' : isLoadingCache ? 'Loading…' : 'Sync Data'}
          </button>
          <button
            onClick={() => fetchForecastData(false)}
            disabled={isStreaming || isLoadingCache}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-5 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
          >
            {isStreaming && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isStreaming ? 'Predicting…' : 'Generate Forecast'}
          </button>
        </div>
      </header>

      {/* MAIN */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 flex flex-col bg-[#f8f9fa] overflow-y-auto relative bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[20px_20px]">
          <div className="p-8 max-w-5xl mx-auto w-full">

            {/* Page title */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Sales Forecast Hub</h2>
              <p className="text-sm text-gray-500 mt-1">
                {isStreaming
                  ? <span className="text-indigo-600 font-medium">{progressMsg}</span>
                  : "Displaying predictive revenue insights and active risk analysis."}
              </p>
            </div>

            {/* ── INITIAL CACHE SPINNER ── */}
            {showSpinner && (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            )}

            {/* ── STREAMING PROGRESS ── */}
            {showProgress && (
              <div className="flex flex-col items-center justify-center h-64 space-y-6">
                <div className="w-full max-w-md">
                  <div className="flex justify-between text-sm font-medium text-gray-600 mb-2">
                    <span>{progressMsg || "Starting…"}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-3 text-center">
                    This takes 30–90 seconds depending on server load.
                  </p>
                </div>
              </div>
            )}

            {/* ── ERROR ── */}
            {showError && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 shrink-0" />
                {error}
              </div>
            )}

            {/* ── FORECAST DATA ── */}
            {showData && forecastData && (
              <>
                {/* KPI Cards */}
                <div className="grid grid-cols-3 gap-6 mb-8">
                  {/* 30-Day */}
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center text-green-600">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">
                        <ArrowUpRight className="w-3 h-3 mr-1" />
                        {formatPercent(forecastData.growth_rate_yoy)} YoY
                      </span>
                    </div>
                    <h3 className="text-gray-500 text-sm font-medium">30-Day Expected Revenue</h3>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {formatCurrency(forecastData.next_30_days.expected_revenue)}
                    </p>
                    <p className="text-xs text-gray-400 mt-2 font-medium">
                      Range: {formatShortCurrency(forecastData.next_30_days.lower_bound)} — {formatShortCurrency(forecastData.next_30_days.upper_bound)}
                    </p>
                  </div>

                  {/* 90-Day */}
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                        <BarChart2 className="w-5 h-5" />
                      </div>
                    </div>
                    <h3 className="text-gray-500 text-sm font-medium">90-Day Expected Revenue</h3>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {formatCurrency(forecastData.next_90_days.expected_revenue)}
                    </p>
                    <p className="text-xs text-gray-400 mt-2 font-medium">
                      Range: {formatShortCurrency(forecastData.next_90_days.lower_bound)} — {formatShortCurrency(forecastData.next_90_days.upper_bound)}
                    </p>
                  </div>

                  {/* Peak Days */}
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <span className="flex items-center text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-md">
                        <Zap className="w-3 h-3 mr-1" /> High Traffic
                      </span>
                    </div>
                    <h3 className="text-gray-500 text-sm font-medium">Upcoming Peak Days</h3>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {forecastData.peak_days.length} Dates
                    </p>
                    <p className="text-xs text-gray-500 mt-2 font-medium tracking-tight">
                      {forecastData.peak_days.map(formatDate).join(' • ')}
                    </p>
                  </div>
                </div>

                {/* Risk Factors */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center">
                      <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
                      Active Risk Factors
                    </h3>
                    <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                      Mitigation Hub
                    </button>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {forecastData.risk_factors.map((risk, index) => (
                      <div key={index} className="p-6 flex items-start hover:bg-gray-50 transition-colors">
                        <div className={`mt-1 w-2 h-2 rounded-full mr-4 ring-4 ${
                          index % 2 === 0 ? 'bg-red-500 ring-red-50' : 'bg-orange-500 ring-orange-50'
                        }`} />
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <h4 className="text-sm font-bold text-gray-900">{formatRiskTitle(risk)}</h4>
                            <span className="text-xs text-gray-500 flex items-center">
                              {index % 2 === 0
                                ? <><AlertCircle className="w-3 h-3 mr-1" /> High Impact</>
                                : <><Activity className="w-3 h-3 mr-1" /> Moderate Impact</>}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1 mb-3">
                            <strong className="text-gray-800">Insight:</strong> AI models indicate this factor
                            could shift expected revenue toward the lower bound projections.
                          </p>
                          <div className="flex space-x-3">
                            <button className={`text-xs font-semibold px-3 py-1.5 rounded border transition-colors ${
                              index % 2 === 0
                                ? 'bg-red-50 text-red-700 border-red-100 hover:bg-red-100'
                                : 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100'
                            }`}>
                              {index % 2 === 0 ? 'Review Inventory' : 'Plan Counter-Promotion'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}