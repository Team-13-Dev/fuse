"use client"
import { useState, useEffect } from 'react';
import { 
  ChevronDown, Bell, Search, 
  TrendingUp, AlertCircle, UserCheck, 
  ArrowUpRight, Clock, Zap, Target,
  SlidersHorizontal, Brain, RefreshCw, Calendar, Loader2,
  BarChart2,
  AlertTriangle,
  Activity
} from 'lucide-react';
import Image from 'next/image';
import AILogo from "@/public/ai.png";

// --- TYPES & INTERFACES ---
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

interface SalesDataPoint {
  "Order Date": string;
  Calculated_Total: number;
}

type FrequencyType = "30" | "90" | "D";

// --- HELPER FUNCTIONS ---
const formatCurrency = (val: number): string => 
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

const formatShortCurrency = (val: number): string => 
  `$${Math.round(val / 1000)}k`;

const formatPercent = (val: number): string => 
  `${(val > 0 ? '+' : '')}${(val * 100).toFixed(0)}%`;

const formatDate = (dateStr: string): string => 
  new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

const formatRiskTitle = (str: string): string => 
  str.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');


export default function SalesForecastHub() {
  // State variables with strict types
  const [frequency, setFrequency] = useState<FrequencyType>("D"); 
  const [isPredicting, setIsPredicting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("");
  
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data on mount
  useEffect(() => {
    const fetchForecastData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/fore-cast');
        if (!response.ok) {
          throw new Error('Failed to fetch forecast data');
        }
        const data: ForecastData = await response.json();

        const forecastRes = await fetch("https://web-production-3f0f2.up.railway.app/api/v1/forecast-recommendations", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        })
        const forecastData = await forecastRes.json();
        console.log(forecastData);
        setForecastData(forecastData);
      } catch (err) {
        console.error(err);
        setError("Unable to load forecast data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchForecastData();
  }, []);

  const handlePredict = async () => {
    setIsPredicting(true);
    setStatusMessage("Initializing forecast model...");
    
    const dummyData: SalesDataPoint[] = Array.from({ length: 1000 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (100 - i));
        return {
            "Order Date": date.toISOString().split("T")[0],
            Calculated_Total: Math.floor(Math.random() * 500) + 100,
        };
    });

    try {
        const response = await fetch(`http://127.0.0.1:8000/predict`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json", 
            "X-Frequency": frequency 
          },
          body: JSON.stringify({
              sales_data: dummyData,
              callback_url: `http://localhost:3000/api/webhooks/forecast` 
          }),
        });

      if (response.ok) {
        setStatusMessage("Forecast queued. Awaiting webhook response.");
        setTimeout(() => setStatusMessage(""), 5000);
      } else {
        setStatusMessage("Failed to initiate forecast.");
      }
    } catch (error) {
      console.error("Prediction error:", error);
      setStatusMessage("Network error occurred.");
    } finally {
      setIsPredicting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-white">
      {/* --- HEADER --- */}
      <header className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white z-10">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-1.5 rounded-xl aspect-square grid place-content-center">
              <Image src={AILogo} alt='ai-logo' width={25} height={25} className='w-6.25'/>
            </div>
            <span className="font-semibold text-gray-900">
              Forecasting
            </span>
          </div>
          <div className="w-px h-6 bg-gray-300"></div>
          <button className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900">
            Workspace: Local Business Inc.
            <ChevronDown className="w-4 h-4 ml-1" />
          </button>
        </div>

        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-4 text-gray-500">
            <Search className="w-5 h-5 cursor-pointer hover:text-gray-900" />
            <Bell className="w-5 h-5 cursor-pointer hover:text-gray-900" />
          </div>
          <div className="w-px h-6 bg-gray-300"></div>
          <button className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center">
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync Data
          </button>
          <button 
            onClick={handlePredict}
            disabled={isPredicting}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-5 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
          >
            {isPredicting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {isPredicting ? 'Predicting...' : 'Generate Forecast'}
          </button>
        </div>
      </header>

      {/* --- MAIN LAYOUT --- */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* LEFT WORKSPACE (Canvas) */}
        <main className="flex-1 flex flex-col bg-[#f8f9fa] overflow-y-auto relative bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[20px_20px]">
          <div className="p-8 max-w-5xl mx-auto w-full">
            
            {/* Header Area */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  Sales Forecast Hub
                </h2>
                <p className="text-sm text-gray-500 mt-1 flex items-center">
                  {statusMessage ? (
                    <span className="text-indigo-600 font-medium">{statusMessage}</span>
                  ) : (
                    `Displaying predictive revenue insights and active risk analysis.`
                  )}
                </p>
              </div>
            </div>

            {/* Loading/Error States */}
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : error ? (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                {error}
              </div>
            ) : forecastData ? (
              <>
                {/* Top KPI Cards */}
                <div className="grid grid-cols-3 gap-6 mb-8">
                  {/* Card 1: 30-Day Forecast */}
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center text-green-600">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">
                        <ArrowUpRight className="w-3 h-3 mr-1" /> {formatPercent(forecastData.growth_rate_yoy)} YoY
                      </span>
                    </div>
                    <h3 className="text-gray-500 text-sm font-medium">30-Day Expected Revenue</h3>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(forecastData.next_30_days.expected_revenue)}</p>
                    <p className="text-xs text-gray-400 mt-2 font-medium">Range: {formatShortCurrency(forecastData.next_30_days.lower_bound)} — {formatShortCurrency(forecastData.next_30_days.upper_bound)}</p>
                  </div>

                  {/* Card 2: 90-Day Forecast */}
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                        <BarChart2 className="w-5 h-5" />
                      </div>
                    </div>
                    <h3 className="text-gray-500 text-sm font-medium">90-Day Expected Revenue</h3>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(forecastData.next_90_days.expected_revenue)}</p>
                    <p className="text-xs text-gray-400 mt-2 font-medium">Range: {formatShortCurrency(forecastData.next_90_days.lower_bound)} — {formatShortCurrency(forecastData.next_90_days.upper_bound)}</p>
                  </div>

                  {/* Card 3: Peak Days */}
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
                    <p className="text-2xl font-bold text-gray-900 mt-1">{forecastData.peak_days.length} Dates</p>
                    <p className="text-xs text-gray-500 mt-2 font-medium tracking-tight">
                      {forecastData.peak_days.map(date => formatDate(date)).join(' • ')}
                    </p>
                  </div>
                </div>

                {/* Risk Factors Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center">
                      <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
                      Active Risk Factors
                    </h3>
                    <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">Mitigation Hub</button>
                  </div>
                  
                  <div className="divide-y divide-gray-100">
                    {forecastData.risk_factors.map((risk, index) => (
                      <div key={index} className="p-6 flex items-start hover:bg-gray-50 transition-colors">
                        <div className={`mt-1 w-2 h-2 rounded-full mr-4 ring-4 ${index % 2 === 0 ? 'bg-red-500 ring-red-50' : 'bg-orange-500 ring-orange-50'}`}></div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <h4 className="text-sm font-bold text-gray-900">{formatRiskTitle(risk)}</h4>
                            <span className="text-xs text-gray-500 flex items-center">
                              {index % 2 === 0 ? <AlertCircle className="w-3 h-3 mr-1"/> : <Activity className="w-3 h-3 mr-1"/>} 
                              {index % 2 === 0 ? 'High Impact' : 'Moderate Impact'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1 mb-3">
                            <strong className="text-gray-800">Insight:</strong> AI models indicate this factor could shift expected revenue toward the lower bound projections.
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
            ) : null}
          </div>
        </main>

        {/* RIGHT SIDEBAR (Parameters) */}
        <aside className="w-80 bg-white border-l border-gray-200 flex flex-col overflow-y-auto">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900 flex items-center">
              <SlidersHorizontal className="w-4 h-4 mr-2 text-gray-500" />
              Forecast Parameters
            </h2>
            <p className="text-xs text-gray-500 mt-1">Configure inputs to adjust active predictions.</p>
          </div>

          <div className="p-6 flex-1">
            
            {/* Time Horizon Selector */}
            <h3 className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-3 flex items-center">
              <Calendar className="w-3 h-3 mr-1" /> Time Horizon
            </h3>
            
            <div className="bg-gray-100 p-1 rounded-lg flex mb-8">
              <button 
                onClick={() => setFrequency("30")}
                className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all ${frequency === '30' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                30 Days
              </button>
              <button 
                onClick={() => setFrequency("90")}
                className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all ${frequency === '90' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                90 Days
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mt-8">
              <h4 className="text-sm font-bold text-blue-900 mb-1">Data Freshness</h4>
              <p className="text-xs text-blue-700 mb-3">Your sales dataset was synced 12 mins ago. The forecast currently reflects the latest pipeline data.</p>
              <button className="text-xs font-semibold bg-white text-blue-600 px-3 py-2 rounded-md border border-blue-200 hover:bg-blue-50 w-full transition-colors">
                View Data Sources
              </button>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}