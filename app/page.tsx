import React from 'react';
import { Sparkles, BarChart3, Users, Zap, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import logo from "@/public/logo.png"

export default function FuseLandingPage() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-indigo-500/20">
      {/* Soft Background Glow Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-300/30 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-violet-300/30 blur-[120px]" />
      </div>

      {/* Glassmorphic Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-zinc-200/60 bg-white/60 backdrop-blur-xl supports-backdrop-filter:bg-white/40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Image src={logo} alt="logo"/>
            </div>
            <span className="text-xl font-semibold tracking-tight text-zinc-900">Fuse</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-500">
            <a href="#features" className="hover:text-zinc-900 transition-colors">Features</a>
            <a href="#solutions" className="hover:text-zinc-900 transition-colors">Solutions</a>
            <a href="#pricing" className="hover:text-zinc-900 transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">Log in</button>
            <a href="/register">
              <button className="h-9 px-4 rounded-full bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 transition-colors shadow-sm">
                Get Started
              </button>
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 pt-32 pb-20 px-6 sm:pt-40 sm:pb-24 lg:pb-32">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-zinc-200 shadow-sm text-xs font-medium text-zinc-600 mb-8">
            <Sparkles className="w-3 h-3 text-indigo-500" />
            <span>Fuse AI 2.0 is now available</span>
          </div>
          <h1 className="text-5xl sm:text-7xl font-bold tracking-tighter mb-8 text-transparent bg-clip-text bg-linear-to-b from-zinc-900 to-zinc-800">
            Customer intelligence, <br />
            beautifully automated.
          </h1>
          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-zinc-500 mb-10 leading-relaxed">
            Fuse merges advanced predictive AI with enterprise-grade CRM capabilities. Anticipate needs, automate workflows, and close deals faster with a system that thinks alongside you.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="w-full sm:w-auto h-12 px-8 rounded-full bg-zinc-900 text-white text-base font-semibold hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 shadow-md shadow-zinc-900/10">
              Start Free Trial <ChevronRight className="w-4 h-4" />
            </button>
            <button className="w-full sm:w-auto h-12 px-8 rounded-full bg-white text-zinc-900 border border-zinc-200 shadow-sm text-base font-medium hover:bg-zinc-50 transition-colors flex items-center justify-center">
              Book a Demo
            </button>
          </div>
        </div>
      </main>

      {/* App Preview Mockup (Layered Architecture) */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 pb-32">
        <div className="rounded-2xl border border-zinc-200/80 bg-white/40 backdrop-blur-2xl p-2 shadow-2xl shadow-zinc-200/50 overflow-hidden">
          <div className="rounded-xl border border-zinc-200/50 bg-white aspect-video flex items-center justify-center relative overflow-hidden shadow-inner">
            {/* Abstract UI representation */}
            <div className="absolute inset-0 bg-linear-to-br from-indigo-50/50 to-violet-50/50" />
            <div className="w-full h-full flex flex-col">
              <div className="h-12 border-b border-zinc-100 flex items-center px-4 gap-2 bg-white/80 backdrop-blur-sm">
                <div className="w-3 h-3 rounded-full bg-zinc-200" />
                <div className="w-3 h-3 rounded-full bg-zinc-200" />
                <div className="w-3 h-3 rounded-full bg-zinc-200" />
              </div>
              <div className="flex-1 p-8 flex gap-6 bg-zinc-50/50">
                <div className="w-64 space-y-4">
                  <div className="h-8 rounded-lg bg-white border border-zinc-100 shadow-sm w-full" />
                  <div className="h-8 rounded-lg bg-white border border-zinc-100 shadow-sm w-3/4" />
                  <div className="h-8 rounded-lg bg-white border border-zinc-100 shadow-sm w-5/6" />
                </div>
                <div className="flex-1 space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-1 h-32 rounded-xl border border-zinc-100 bg-white shadow-sm" />
                    <div className="flex-1 h-32 rounded-xl border border-zinc-100 bg-white shadow-sm" />
                    <div className="flex-1 h-32 rounded-xl border border-zinc-100 bg-white shadow-sm" />
                  </div>
                  <div className="h-64 rounded-xl border border-zinc-100 bg-white shadow-sm" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <section className="relative z-10 border-t border-zinc-200/60 bg-white py-32" id="features">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 mb-4">Intelligent by design.</h2>
            <p className="text-zinc-500 max-w-xl text-lg">Everything you need to manage relationships, supercharged by machine learning.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Feature Card 1 */}
            <div className="p-8 rounded-3xl border border-zinc-200/80 bg-zinc-50/50 hover:bg-white hover:shadow-lg hover:shadow-zinc-200/40 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="w-6 h-6 text-indigo-500" />
              </div>
              <h3 className="text-xl font-semibold text-zinc-900 mb-3">Predictive Forecasting</h3>
              <p className="text-zinc-500 leading-relaxed">
                Fuse analyzes historical data and market trends to predict deal closures with pinpoint accuracy.
              </p>
            </div>

            {/* Feature Card 2 */}
            <div className="p-8 rounded-3xl border border-zinc-200/80 bg-zinc-50/50 hover:bg-white hover:shadow-lg hover:shadow-zinc-200/40 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-6 h-6 text-violet-500" />
              </div>
              <h3 className="text-xl font-semibold text-zinc-900 mb-3">Smart Segmentation</h3>
              <p className="text-zinc-500 leading-relaxed">
                Automatically group your leads based on behavior, engagement, and likelihood to convert.
              </p>
            </div>

            {/* Feature Card 3 */}
            <div className="p-8 rounded-3xl border border-zinc-200/80 bg-zinc-50/50 hover:bg-white hover:shadow-lg hover:shadow-zinc-200/40 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-6 h-6 text-emerald-500" />
              </div>
              <h3 className="text-xl font-semibold text-zinc-900 mb-3">Automated Workflows</h3>
              <p className="text-zinc-500 leading-relaxed">
                Let the AI handle data entry, follow-up emails, and meeting scheduling while you focus on selling.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 py-12 px-6 bg-zinc-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span className="text-sm font-semibold text-zinc-900">Fuse CRM</span>
          </div>
          <p className="text-sm text-zinc-500">© 2026 Fuse Technologies. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}