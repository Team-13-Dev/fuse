import React from 'react';
import { 
  ChevronDown, Bell, Search, Sparkles, 
  TrendingUp, AlertCircle, UserCheck, MessageSquare, 
  ArrowUpRight, ArrowDownRight, Clock, Zap, Target,
  SlidersHorizontal, Brain, RefreshCw
} from 'lucide-react';
import Image from 'next/image';
import AILogo from "@/public/ai.png"

export default function CRMAIInsights() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-white">
      
      {/* --- TOP NAVIGATION --- */}
      <header className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white z-10">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-1.5 rounded-xl aspect-square grid place-content-center">
              <Image src={AILogo} alt='ai-logo' width={1000} className='w-[25px]'/>
            </div>
            <span>
                Insights
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
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-md text-sm font-medium transition-colors">
            Generate Report
          </button>
        </div>
      </header>

      {/* --- MAIN LAYOUT --- */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* LEFT WORKSPACE (Canvas) */}
        <main className="flex-1 flex flex-col bg-[#f8f9fa] overflow-y-auto relative bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]">
          
          <div className="p-8 max-w-5xl mx-auto w-full">
            
            {/* Header Area */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  AI Intelligence Hub
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Analyzing 12,450 interactions across your pipeline this week.
                </p>
              </div>
              <div className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium flex items-center">
                <Brain className="w-4 h-4 mr-2" />
                Model Confidence: 94%
              </div>
            </div>

            {/* Top KPI Cards */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              {/* Card 1 */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center text-green-600">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">
                    <ArrowUpRight className="w-3 h-3 mr-1" /> +12%
                  </span>
                </div>
                <h3 className="text-gray-500 text-sm font-medium">AI Forecasted Revenue</h3>
                <p className="text-2xl font-bold text-gray-900 mt-1">$2.4M</p>
              </div>

              {/* Card 2 */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <span className="flex items-center text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-md">
                    3 Accounts
                  </span>
                </div>
                <h3 className="text-gray-500 text-sm font-medium">High Churn Risk</h3>
                <p className="text-2xl font-bold text-gray-900 mt-1">$450k <span className="text-sm font-normal text-gray-400">at risk</span></p>
              </div>

              {/* Card 3 */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <span className="flex items-center text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                    <Zap className="w-3 h-3 mr-1" /> High Intent
                  </span>
                </div>
                <h3 className="text-gray-500 text-sm font-medium">Hot Leads Detected</h3>
                <p className="text-2xl font-bold text-gray-900 mt-1">28</p>
              </div>
            </div>

            {/* Next Best Actions Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <Target className="w-5 h-5 mr-2 text-indigo-500" />
                  Next Best Actions
                </h3>
                <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">View All</button>
              </div>
              
              <div className="divide-y divide-gray-100">
                {/* Action Item 1 */}
                <div className="p-6 flex items-start hover:bg-gray-50 transition-colors">
                  <div className="mt-1 w-2 h-2 rounded-full bg-red-500 ring-4 ring-red-50 mr-4"></div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h4 className="text-sm font-bold text-gray-900">Increase the stock of *Product Name* (High Demand)</h4>
                      <span className="text-xs text-gray-500 flex items-center"><Clock className="w-3 h-3 mr-1"/> 2 hrs ago</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 mb-3">
                      <strong className="text-gray-800">Insight:</strong> Stock quantity dropped by 40% in the last 48 hours.
                    </p>
                    <div className="flex space-x-3">
                      <button className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded border border-indigo-100 hover:bg-indigo-100 transition-colors">
                        Stock Control
                      </button>
                      <button className="text-xs font-semibold bg-white text-gray-600 px-3 py-1.5 rounded border border-gray-200 hover:bg-gray-50 transition-colors">
                        Schedule Notification To Team
                      </button>
                    </div>
                  </div>
                </div>

                {/* Action Item 2 */}
                <div className="p-6 flex items-start hover:bg-gray-50 transition-colors">
                  <div className="mt-1 w-2 h-2 rounded-full bg-green-500 ring-4 ring-green-50 mr-4"></div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h4 className="text-sm font-bold text-gray-900">Initiate Summer Marketing Campaign</h4>
                      <span className="text-xs text-gray-500 flex items-center"><Clock className="w-3 h-3 mr-1"/> 5 hrs ago</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 mb-3">
                      <strong className="text-gray-800">Insight:</strong> We are approaching the end of winter, getting summer campaign ready would ease future business operations
                    </p>
                    <div className="flex space-x-3">
                      <button className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded border border-indigo-100 hover:bg-indigo-100 transition-colors">
                        Generate Marketing Cards via AI
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </main>

        {/* RIGHT SIDEBAR (AI Controls & Filters) */}
        <aside className="w-80 bg-white border-l border-gray-200 flex flex-col overflow-y-auto">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900 flex items-center">
              <SlidersHorizontal className="w-4 h-4 mr-2 text-gray-500" />
              Insight Parameters
            </h2>
            <p className="text-xs text-gray-500 mt-1">Tune how the AI evaluates your CRM data.</p>
          </div>

          <div className="p-6 flex-1">
            <h3 className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-5">Active Models</h3>
            
            {/* Toggles */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-gray-700 block">Lead Scoring</span>
                  <span className="text-xs text-gray-500">Predicts conversion likelihood</span>
                </div>
                <div className="w-10 h-5 bg-indigo-600 rounded-full relative cursor-pointer">
                  <div className="w-3.5 h-3.5 bg-white rounded-full absolute right-1 top-0.5 shadow-sm"></div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-gray-700 block">Churn Prediction</span>
                  <span className="text-xs text-gray-500">Flags at-risk accounts</span>
                </div>
                <div className="w-10 h-5 bg-indigo-600 rounded-full relative cursor-pointer">
                  <div className="w-3.5 h-3.5 bg-white rounded-full absolute right-1 top-0.5 shadow-sm"></div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-gray-700 block">Sentiment Analysis</span>
                  <span className="text-xs text-gray-500">Scans emails & call transcripts</span>
                </div>
                <div className="w-10 h-5 bg-gray-200 rounded-full relative cursor-pointer">
                  <div className="w-3.5 h-3.5 bg-white rounded-full absolute left-1 top-0.5 shadow-sm"></div>
                </div>
              </div>
            </div>

            <h3 className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-5">Sensitivity</h3>
            
            {/* Slider Mockup */}
            <div className="mb-6">
              <div className="flex justify-between text-xs text-gray-600 mb-2">
                <span>Low Alert</span>
                <span className="font-bold text-indigo-600">Balanced</span>
                <span>High Alert</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full relative">
                <div className="absolute left-0 top-0 h-full w-1/2 bg-indigo-500 rounded-l-full"></div>
                <div className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-indigo-600 rounded-full shadow-sm cursor-pointer"></div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mt-8">
              <h4 className="text-sm font-bold text-blue-900 mb-1">Data Freshness</h4>
              <p className="text-xs text-blue-700 mb-3">Your models were last trained 4 hours ago. Keeping data synced improves insight accuracy.</p>
              <button className="text-xs font-semibold bg-white text-blue-600 px-3 py-2 rounded-md border border-blue-200 hover:bg-blue-50 w-full transition-colors">
                View Sync Logs
              </button>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}