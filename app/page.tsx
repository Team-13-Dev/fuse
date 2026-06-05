"use client"

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import logo from "@/public/logo.png";
import { authClient } from '@/lib/auth-client';
import {
  ChevronRight, ArrowUpRight, Menu, X, Check,
  TrendingUp, Users, Package, ShoppingCart, Sparkles,
  BarChart2, Globe, BotMessageSquare, Zap, Upload,
  ArrowDownRight, Activity, RefreshCw, Database, Layers,
  Target, Brain, PieChart, MessageSquare,
} from 'lucide-react';

/* ─── Noise overlay ─────────────────────────────────────────────────────────── */
const NoiseOverlay = () => (
  <svg className="pointer-events-none fixed inset-0 z-50 h-full w-full opacity-[0.035] mix-blend-multiply" aria-hidden>
    <filter id="noise">
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
    </filter>
    <rect width="100%" height="100%" filter="url(#noise)" />
  </svg>
);

/* ─── Navbar ─────────────────────────────────────────────────────────────────── */
function Navbar() {
  const { data: session } = authClient.useSession();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <nav className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${
      scrolled ? 'bg-white/95 backdrop-blur-xl shadow-[0_1px_0_rgba(0,0,0,0.06)] text-[#111]' : 'bg-transparent text-white'
    }`}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src={logo} alt="Fuse" width={32} className="rounded-md" />
            <span className="font-bold text-lg tracking-tight font-[family-name:var(--font-body)]">FUSE</span>
          </Link>
          <div className="hidden md:flex items-center gap-7 text-sm font-medium opacity-80">
            {[
              { label: 'CRM', href: '#crm' },
              { label: 'AI', href: '#ai' },
              { label: 'Web Builder', href: '#builder' },
              { label: 'Pricing', href: '#pricing' },
            ].map(l => (
              <a key={l.label} href={l.href} className="hover:opacity-100 transition-opacity">{l.label}</a>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-4">
          {session ? (
            <Link href="/dashboard">
              <button className={`h-9 px-5 rounded-full text-sm font-semibold transition-all ${
                scrolled ? 'bg-[#2F47F2] text-white hover:bg-[#2438e0]' : 'bg-white text-[#111] hover:bg-white/90'
              }`}>
                Dashboard <ArrowUpRight size={14} className="inline ml-1" />
              </button>
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium opacity-70 hover:opacity-100 transition-opacity">Sign in</Link>
              <Link href="/register">
                <button className={`h-9 px-5 rounded-full text-sm font-semibold transition-all ${
                  scrolled ? 'bg-[#2F47F2] text-white hover:bg-[#2438e0]' : 'bg-white text-[#111] hover:bg-white/90'
                }`}>
                  Get started free
                </button>
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden absolute inset-x-0 top-16 bg-white text-[#111] border-b border-slate-100 px-6 py-5 flex flex-col gap-4">
          {['CRM', 'AI', 'Web Builder', 'Pricing'].map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(' ', '-')}`} onClick={() => setOpen(false)} className="text-sm font-medium text-slate-600">{l}</a>
          ))}
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-3">
            <Link href="/login" className="text-sm text-center text-slate-600">Sign in</Link>
            <Link href="/register">
              <button className="w-full py-2.5 rounded-full bg-[#2F47F2] text-white text-sm font-semibold">Get started free</button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

/* ─── Hero ───────────────────────────────────────────────────────────────────── */
function Hero() {
  const { data: session } = authClient.useSession();
  const [on, setOn] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setOn(true), 40);
    return () => clearTimeout(t);
  }, []);

  const fade = (delay: number, extra = '') =>
    `transition-all duration-700 ease-out ${extra} ${on ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`;

  const MARQUEE_ITEMS = [
    'CRM Dashboard', 'AI Segmentation', 'Sales Forecasting',
    'Web Builder', 'Customer Intelligence', 'Order Management',
    'Product Clusters', 'AI Chatbot', 'Revenue Analytics',
  ];

  return (
    <section className="relative bg-[#07080e] pt-16 overflow-hidden flex flex-col min-h-screen">
      {/* Signature depth — subtle radial light centered on the product */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 68% 50%, rgba(47,71,242,0.09) 0%, transparent 70%)' }}
      />

      {/* ── Main content ──────────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center">
        <div className="w-full max-w-[1380px] mx-auto px-6 lg:px-12 py-16 lg:py-0">
          <div className="grid lg:grid-cols-[1fr_1.15fr] gap-10 xl:gap-20 items-center">

            {/* ── Left: Copy ─────────────────────────────────────────────────── */}
            <div>
              {/* Eyebrow — version/year tag */}
              <div className={fade(0)} style={{ transitionDelay: '0ms' }}>
                <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-white/30 font-[family-name:var(--font-mono)]">
                  <span className="w-1 h-1 rounded-full bg-[#2F47F2]" />
                  Fuse — 2026
                </span>
              </div>

              {/* Headline */}
              <h1 className="mt-7 mb-0" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(3rem, 6vw, 5.4rem)', fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.02em' }}>
                <span className={`block text-white ${fade(80)}`} style={{ transitionDelay: '80ms' }}>
                  Stop running blind.
                </span>
                <span className={`block text-white ${fade(160)}`} style={{ transitionDelay: '160ms' }}>
                  Start running <span style={{ color: '#2F47F2' }}>Fuse.</span>
                </span>
              </h1>

              {/* Divider */}
              <div
                className={`mt-9 mb-9 h-px bg-white/8 ${fade(240)}`}
                style={{ transitionDelay: '240ms' }}
              />

              {/* Descriptor */}
              <p
                className={`text-[15px] text-white/45 leading-[1.65] max-w-[390px] ${fade(280)}`}
                style={{ transitionDelay: '280ms' }}
              >
                One platform for your products, orders, customers, and AI — so you see exactly what&apos;s working and what&apos;s not.
              </p>

              {/* CTA row */}
              <div
                className={`mt-10 flex items-center gap-5 ${fade(340)}`}
                style={{ transitionDelay: '340ms' }}
              >
                <Link href={session ? '/dashboard' : '/register'}>
                  <button className="group relative h-11 px-7 rounded-full bg-[#2F47F2] text-white text-[13px] font-semibold tracking-wide hover:bg-[#2438e0] active:scale-[0.98] transition-all duration-200 flex items-center gap-2 shadow-lg shadow-[#2F47F2]/25">
                    {session ? 'Open Dashboard' : 'Start for free'}
                    <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
                  </button>
                </Link>
                {!session && (
                  <Link href="/login" className="text-[13px] text-white/35 hover:text-white/65 transition-colors duration-200 font-medium">
                    Sign in
                  </Link>
                )}
              </div>

              {/* Social proof line */}
              <p
                className={`mt-8 text-[11px] text-white/20 font-[family-name:var(--font-mono)] tracking-wide ${fade(400)}`}
                style={{ transitionDelay: '400ms' }}
              >
                Trusted by Egypt&apos;s fastest-growing local brands
              </p>
            </div>

            {/* ── Right: Product — perspective tilt ─────────────────────────── */}
            <div
              className={`relative hidden lg:block ${fade(200)}`}
              style={{ transitionDelay: '200ms' }}
            >
              {/* Floating chip — Revenue */}
              <div className="absolute -top-5 -left-10 z-20 bg-white rounded-2xl shadow-2xl shadow-black/40 px-4 py-3 flex items-center gap-3 border border-slate-100/80">
                <div className="w-8 h-8 rounded-xl bg-sky-500 flex items-center justify-center shrink-0">
                  <TrendingUp size={14} className="text-white" />
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wide">Monthly Revenue</p>
                  <p className="text-sm font-bold text-slate-900 font-[family-name:var(--font-mono)] leading-tight">EGP 2.4M</p>
                </div>
                <span className="text-[10px] font-bold text-emerald-500 ml-1">↑ 12%</span>
              </div>

              {/* Floating chip — Segments */}
              <div className="absolute -bottom-5 left-6 z-20 bg-white rounded-2xl shadow-2xl shadow-black/40 px-4 py-3 border border-slate-100/80">
                <p className="text-[9px] text-slate-400 uppercase tracking-wide font-medium mb-2">AI Segments</p>
                <div className="flex items-center gap-1.5">
                  {[
                    { label: 'Champions', bg: 'bg-emerald-500' },
                    { label: 'Loyal', bg: 'bg-sky-500' },
                    { label: 'At Risk', bg: 'bg-amber-500' },
                  ].map(s => (
                    <span key={s.label} className={`text-[8px] text-white font-bold px-2 py-0.5 rounded-full ${s.bg}`}>{s.label}</span>
                  ))}
                </div>
              </div>

              {/* Floating chip — AI active */}
              <div className="absolute top-10 -right-8 z-20 bg-[#2F47F2] rounded-2xl shadow-2xl shadow-[#2F47F2]/40 px-4 py-3 flex items-center gap-2.5">
                <Sparkles size={13} className="text-white" />
                <div>
                  <p className="text-[8px] text-blue-200 font-medium">AI Segmentation</p>
                  <p className="text-[10px] text-white font-bold">4 clusters found</p>
                </div>
              </div>

              {/* Screenshot wrapper with perspective */}
              <div
                style={{
                  transform: 'perspective(1400px) rotateY(-10deg) rotateX(3deg) scale(1.02)',
                  transformOrigin: 'right center',
                  willChange: 'transform',
                }}
              >
                <div className="rounded-2xl overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.7)] ring-1 ring-white/8">
                  <DashboardScreenshot />
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Marquee ────────────────────────────────────────────────────────────── */}
      <div className="border-t border-white/[0.06] py-5 overflow-hidden shrink-0">
        <style>{`
          @keyframes fuse-marquee {
            from { transform: translateX(0); }
            to   { transform: translateX(-50%); }
          }
          .fuse-marquee { animation: fuse-marquee 32s linear infinite; }
          .fuse-marquee:hover { animation-play-state: paused; }
        `}</style>
        <div className="fuse-marquee flex gap-0 whitespace-nowrap w-max">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} className="inline-flex items-center gap-5 px-7 text-[11px] uppercase tracking-[0.18em] text-white/25 font-[family-name:var(--font-mono)]">
              {item}
              <span className="w-1 h-1 rounded-full bg-[#2F47F2]/60 shrink-0" />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Dashboard Mock Screenshot ──────────────────────────────────────────────── */
function DashboardScreenshot() {
  // Real sidebar nav from app/components/dashboard/Sidebar.tsx
  const NAV: { section: string; items: { icon: React.ElementType; label: string; active?: boolean; soon?: boolean }[] }[] = [
    { section: 'Overview',  items: [{ icon: LayoutDashboard, label: 'Dashboard', active: true }, { icon: BarChart2, label: 'Analytics', soon: true }] },
    { section: 'Catalog',   items: [{ icon: Package, label: 'Products' }, { icon: Layers, label: 'Segments' }, { icon: Target, label: 'Categories' }] },
    { section: 'Commerce',  items: [{ icon: Users, label: 'Customers' }, { icon: ShoppingCart, label: 'Orders' }] },
    { section: 'Growth',    items: [{ icon: Sparkles, label: 'AI Insights' }] },
    { section: 'Platform',  items: [{ icon: Globe, label: 'Web Builder' }] },
  ];

  // Real order status data (STATUS_META colors from dashboard/page.tsx)
  const C = 2 * Math.PI * 36; // circumference ≈ 226.2
  const orderSegments = [
    { color: '#10b981', pct: 44, label: 'Delivered', count: 549 },
    { color: '#6366f1', pct: 21, label: 'Shipped',   count: 262 },
    { color: '#0ea5e9', pct: 16, label: 'Confirmed', count: 200 },
    { color: '#f59e0b', pct: 12, label: 'Pending',   count: 150 },
    { color: '#ef4444', pct:  7, label: 'Cancelled', count: 87  },
  ];
  let cumOffset = 0;
  const donutArcs = orderSegments.map(s => {
    const len = (s.pct / 100) * C;
    const arc = { ...s, len, offset: cumOffset };
    cumOffset += len + 1.4;
    return arc;
  });

  // Real customer clusters from CUSTOMER_CLUSTERS in dashboard/page.tsx
  const customerClusters = [
    { name: 'Champions',         pct: 18, hex: '#10b981', dot: 'bg-emerald-500', soft: 'bg-emerald-50', text: 'text-emerald-700', desc: 'Recent · frequent · top spend',  ltv: 'EGP 24.8K' },
    { name: 'Loyal',             pct: 26, hex: '#0ea5e9', dot: 'bg-sky-500',     soft: 'bg-sky-50',     text: 'text-sky-700',     desc: 'Consistent repeat buyers',       ltv: 'EGP 12.3K' },
    { name: 'Pot. loyalist',     pct: 17, hex: '#8b5cf6', dot: 'bg-violet-500',  soft: 'bg-violet-50',  text: 'text-violet-700',  desc: 'Recent, growing engagement',     ltv: 'EGP 6.1K'  },
    { name: 'At risk',           pct: 14, hex: '#f59e0b', dot: 'bg-amber-500',   soft: 'bg-amber-50',   text: 'text-amber-700',   desc: 'Slipping — win them back',        ltv: 'EGP 9.4K'  },
    { name: 'Dormant',           pct: 15, hex: '#94a3b8', dot: 'bg-slate-400',   soft: 'bg-slate-100',  text: 'text-slate-600',   desc: 'No activity in 90+ days',        ltv: 'EGP 3.2K'  },
    { name: 'New',               pct: 10, hex: '#f43f5e', dot: 'bg-rose-500',    soft: 'bg-rose-50',    text: 'text-rose-700',    desc: 'First purchase this month',      ltv: 'EGP 1.8K'  },
  ];

  // Real product clusters
  const productClusters = [
    { name: 'Premium Line', n: 42, rev: '42.8%', margin: '34.2%', hex: '#0ea5e9', trait: 'High margin' },
    { name: 'Core Catalog', n: 58, rev: '35.1%', margin: '18.5%', hex: '#8b5cf6', trait: 'Revenue driver' },
    { name: 'Budget Range', n: 38, rev: '15.3%', margin: '7.1%',  hex: '#10b981', trait: 'Fast moving' },
    { name: 'Niche Items',  n: 26, rev: '6.8%',  margin: '-2.4%', hex: '#f59e0b', trait: 'Loss-making' },
  ];
  const totalProds = 164;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-1.5 shadow-2xl shadow-black/60">
      {/* Browser chrome */}
      <div className="rounded-xl overflow-hidden bg-[#f8f9fc]">
        {/* URL bar */}
        <div className="h-8 bg-white border-b border-slate-100 flex items-center px-3 gap-2 shrink-0">
          <div className="flex gap-1">
            {['#f43f5e','#f59e0b','#10b981'].map(c => (
              <div key={c} className="w-2 h-2 rounded-full" style={{ background: c }} />
            ))}
          </div>
          <div className="flex-1 mx-3 h-4 rounded-full bg-slate-100 flex items-center px-2.5">
            <span className="text-[8px] text-slate-400 font-[family-name:var(--font-mono)]">https://fuse-eg.vercel.app/dashboard</span>
          </div>
          <div className="w-12 h-4 rounded bg-slate-100" />
        </div>

        {/* App body */}
        <div className="flex" style={{ height: 580 }}>

          {/* ── Sidebar ────────────────────────────────────────────────────── */}
          <div className="w-36 shrink-0 bg-white border-r border-slate-100 flex flex-col py-3 px-2 overflow-hidden">
            {/* Logo */}
            <div className="flex items-center gap-1.5 px-1 mb-4">
              <div className="w-5 h-5 rounded-md bg-[#2F47F2] flex items-center justify-center shrink-0">
                <Zap size={9} className="text-white" />
              </div>
              <span className="text-[10px] font-bold text-slate-800 tracking-tight">FUSE</span>
            </div>

            {/* Nav sections */}
            {NAV.map(sec => (
              <div key={sec.section} className="mb-3">
                <p className="text-[7px] font-bold uppercase tracking-wider text-slate-300 px-2 mb-1">{sec.section}</p>
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className={`flex items-center gap-1.5 px-2 py-1 rounded-md mb-px ${
                      item.active ? 'bg-[#2F47F2]/8 text-[#2F47F2]' : 'text-slate-400'
                    }`}>
                      <Icon size={10} />
                      <span className="text-[9px] font-medium">{item.label}</span>
                      {item.soon && (
                        <span className="ml-auto text-[6px] font-bold bg-amber-100 text-amber-700 px-0.5 rounded">soon</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* ── Main content ──────────────────────────────────────────────── */}
          <div className="flex-1 overflow-hidden bg-slate-50/40 p-3 flex flex-col gap-2.5 min-w-0">

            {/* Header row */}
            <div className="flex items-center justify-between shrink-0">
              <div>
                <p className="text-[11px] font-bold text-slate-900">Dashboard</p>
                <p className="text-[8px] text-slate-400">Thursday, June 5, 2026</p>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-5 px-2 rounded-lg border border-slate-200 bg-white flex items-center gap-1">
                  <ShoppingCart size={7} className="text-slate-500" />
                  <span className="text-[7px] text-slate-600">New order</span>
                </div>
                <div className="h-5 px-2 rounded-lg bg-sky-500 flex items-center gap-1">
                  <Upload size={7} className="text-white" />
                  <span className="text-[7px] text-white font-medium">Upload</span>
                </div>
              </div>
            </div>

            {/* ── Stat cards ── */}
            <div className="grid grid-cols-4 gap-2 shrink-0">
              {/* Revenue — sky gradient (from-sky-500 to-sky-600) */}
              <div className="rounded-xl p-2.5 border border-sky-400 shadow-sm" style={{ background: 'linear-gradient(135deg,#0ea5e9,#0284c7)' }}>
                <div className="flex items-start justify-between mb-2">
                  <div className="p-1 rounded-lg bg-white/20">
                    <TrendingUp size={9} className="text-white" />
                  </div>
                  <span className="text-[7px] font-bold text-emerald-200">↑ 12.4%</span>
                </div>
                <p className="text-[11px] font-bold text-white font-[family-name:var(--font-mono)] leading-none">EGP 2.4M</p>
                <p className="text-[7px] text-sky-100 mt-0.5">Total revenue</p>
              </div>
              {/* Orders — white/violet */}
              <div className="rounded-xl p-2.5 border border-slate-100 bg-white shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="p-1 rounded-lg bg-violet-50">
                    <ShoppingCart size={9} className="text-violet-600" />
                  </div>
                  <span className="text-[7px] font-bold text-emerald-600">↑ 8.1%</span>
                </div>
                <p className="text-[11px] font-bold text-slate-900 font-[family-name:var(--font-mono)] leading-none">1,248</p>
                <p className="text-[7px] text-slate-400 mt-0.5">Total orders</p>
              </div>
              {/* Customers — white/emerald */}
              <div className="rounded-xl p-2.5 border border-slate-100 bg-white shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="p-1 rounded-lg bg-emerald-50">
                    <Users size={9} className="text-emerald-600" />
                  </div>
                  <span className="text-[7px] font-bold text-emerald-600">↑ 5.2%</span>
                </div>
                <p className="text-[11px] font-bold text-slate-900 font-[family-name:var(--font-mono)] leading-none">892</p>
                <p className="text-[7px] text-slate-400 mt-0.5">Customers</p>
              </div>
              {/* Products — white/amber */}
              <div className="rounded-xl p-2.5 border border-slate-100 bg-white shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="p-1 rounded-lg bg-amber-50">
                    <Package size={9} className="text-amber-600" />
                  </div>
                  <span className="text-[7px] font-bold text-rose-500">↓ 2.3%</span>
                </div>
                <p className="text-[11px] font-bold text-slate-900 font-[family-name:var(--font-mono)] leading-none">164</p>
                <p className="text-[7px] text-slate-400 mt-0.5">Products</p>
              </div>
            </div>

            {/* ── Charts row: Revenue line + Order donut ── */}
            <div className="grid grid-cols-5 gap-2 shrink-0">

              {/* Revenue line chart */}
              <div className="col-span-3 bg-white rounded-xl border border-slate-100 p-2.5">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[8px] font-semibold text-slate-800">Revenue growth</p>
                  <div className="flex items-center gap-0.5 bg-slate-100 rounded-md p-0.5">
                    {['Week','Month','Year'].map((p, i) => (
                      <span key={p} className={`text-[6px] px-1 py-0.5 rounded ${i === 2 ? 'bg-white text-slate-800 shadow-sm font-semibold' : 'text-slate-400'}`}>{p}</span>
                    ))}
                  </div>
                </div>
                <svg viewBox="0 0 260 70" className="w-full" style={{ height: 62 }}>
                  <defs>
                    <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {/* Grid */}
                  {[12, 30, 48].map(y => (
                    <line key={y} x1="28" x2="255" y1={y} y2={y} stroke="#f1f5f9" strokeWidth="0.8" />
                  ))}
                  {/* Y labels */}
                  {[['2.4M', 10], ['1.2M', 28], ['0', 46]].map(([l, y]) => (
                    <text key={String(l)} x="24" y={Number(y) + 3} fontSize="5.5" fill="#94a3b8" textAnchor="end">{l}</text>
                  ))}
                  {/* Area + line — ascending trend */}
                  <path d="M28 55 L55 50 L82 44 L109 38 L136 32 L163 26 L190 21 L217 16 L244 11" fill="none" stroke="#0ea5e9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M28 55 L55 50 L82 44 L109 38 L136 32 L163 26 L190 21 L217 16 L244 11 L244 62 L28 62 Z" fill="url(#rg)"/>
                  {/* Dots */}
                  {[[28,55],[55,50],[82,44],[109,38],[136,32],[163,26],[190,21],[217,16],[244,11]].map(([cx,cy],i) => (
                    <circle key={i} cx={cx} cy={cy} r="1.8" fill="white" stroke="#0ea5e9" strokeWidth="1.2"/>
                  ))}
                  {/* X labels */}
                  {['Jan','Mar','May','Jul','Sep','Nov'].map((m, i) => (
                    <text key={m} x={28 + i * 43} y={69} fontSize="5.5" fill="#94a3b8" textAnchor="middle">{m}</text>
                  ))}
                </svg>
              </div>

              {/* Order status donut — exact replica of real OrderStatusPie */}
              <div className="col-span-2 bg-white rounded-xl border border-slate-100 p-2.5">
                <div className="flex items-center gap-1.5 mb-2">
                  <Activity size={8} className="text-sky-500" />
                  <p className="text-[8px] font-semibold text-slate-800">Order status</p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Ring chart — matching real SVG ring approach */}
                  <div className="relative shrink-0">
                    <svg viewBox="0 0 100 100" className="-rotate-90" style={{ width: 64, height: 64 }}>
                      <circle cx="50" cy="50" r="36" stroke="#f8fafc" strokeWidth="10" fill="none"/>
                      {donutArcs.map(arc => (
                        <circle
                          key={arc.label}
                          cx="50" cy="50" r="36"
                          stroke={arc.color}
                          strokeWidth="10"
                          fill="none"
                          strokeLinecap="round"
                          strokeDasharray={`${Math.max(arc.len - 1.4, 0)} ${C}`}
                          strokeDashoffset={-arc.offset}
                        />
                      ))}
                    </svg>
                    {/* Center total */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0 pointer-events-none">
                      <span className="text-[10px] font-bold text-slate-900 font-[family-name:var(--font-mono)] leading-none">1,248</span>
                      <span className="text-[6px] text-slate-400 uppercase tracking-wide">orders</span>
                    </div>
                  </div>
                  {/* Legend — color bar + label + count */}
                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    {orderSegments.map(s => (
                      <div key={s.label} className="flex items-center gap-1.5">
                        <div className="w-0.5 h-4 rounded-full shrink-0" style={{ background: s.color }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-[7px] font-medium text-slate-600">{s.label}</span>
                            <span className="text-[7px] font-bold text-slate-800 font-[family-name:var(--font-mono)]">{s.count}</span>
                          </div>
                          <div className="h-0.5 rounded-full bg-slate-100 mt-px overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${s.pct}%`, background: s.color }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Product segmentation ── */}
            <div className="bg-white rounded-xl border border-slate-100 p-2.5 shrink-0">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="p-0.5 rounded bg-sky-50"><Sparkles size={8} className="text-sky-500" /></div>
                  <p className="text-[8px] font-semibold text-slate-800">Product segmentation</p>
                  <span className="text-[6px] text-slate-400">· Updated Jun 5</span>
                </div>
                <span className="text-[7px] text-sky-500 font-medium">View all →</span>
              </div>
              {/* Distribution bar */}
              <div className="flex h-1.5 rounded-full overflow-hidden bg-slate-100 mb-2">
                {productClusters.map(c => (
                  <div key={c.name} className="h-full" style={{ background: c.hex, width: `${(c.n / totalProds) * 100}%` }} />
                ))}
              </div>
              {/* Cluster cards */}
              <div className="grid grid-cols-4 gap-1.5">
                {productClusters.map(c => (
                  <div key={c.name} className="rounded-lg border border-slate-100 p-1.5 hover:border-slate-200">
                    <div className="flex items-center gap-1 mb-1">
                      <div className="w-2 h-2 rounded-sm shrink-0" style={{ background: c.hex }} />
                      <span className="text-[7px] font-semibold text-slate-800 truncate">{c.name}</span>
                      <span className="ml-auto text-[6px] font-bold bg-sky-50 text-sky-700 px-0.5 rounded shrink-0">{c.n}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-1 text-[6.5px]">
                      <div>
                        <p className="text-slate-400">Margin</p>
                        <p className={`font-semibold ${c.margin.startsWith('-') ? 'text-rose-600' : 'text-slate-700'}`}>{c.margin}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Revenue</p>
                        <p className="font-semibold text-slate-700">{c.rev}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Customer segmentation ── */}
            <div className="bg-white rounded-xl border border-slate-100 p-2.5 shrink-0">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="p-0.5 rounded bg-violet-50"><Users size={8} className="text-violet-500" /></div>
                  <p className="text-[8px] font-semibold text-slate-800">Customer segmentation</p>
                  <span className="text-[6px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 px-1 py-px rounded ml-1">Preview</span>
                </div>
              </div>
              {/* Distribution bar */}
              <div className="flex h-1.5 rounded-full overflow-hidden bg-slate-100 mb-2">
                {customerClusters.map(c => (
                  <div key={c.name} className="h-full" style={{ background: c.hex, width: `${c.pct}%` }} />
                ))}
              </div>
              {/* Segment cards — 3 cols × 2 rows */}
              <div className="grid grid-cols-3 gap-1.5">
                {customerClusters.map(c => (
                  <div key={c.name} className="rounded-lg border border-slate-100 p-1.5">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1 min-w-0">
                        <span className={`w-2 h-2 rounded-sm shrink-0 ${c.dot}`} />
                        <span className="text-[7px] font-semibold text-slate-800 truncate">{c.name}</span>
                      </div>
                      <span className={`text-[6px] font-bold px-1 py-px rounded ${c.soft} ${c.text} shrink-0 ml-1`}>{c.pct}%</span>
                    </div>
                    <p className="text-[6px] text-slate-400 truncate">{c.desc}</p>
                    <p className="text-[6.5px] text-slate-500 mt-0.5">LTV <span className="font-semibold text-slate-700">{c.ltv}</span></p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

function LayoutDashboard({ size, className }: { size: number; className?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>;
}

/* ─── CRM Section ────────────────────────────────────────────────────────────── */
function CRMSection() {
  return (
    <section id="crm" className="py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="max-w-2xl mb-20">
          <span className="text-xs font-bold uppercase tracking-widest text-[#2F47F2] font-[family-name:var(--font-mono)] block mb-4">CRM Platform</span>
          <h2 className="text-5xl sm:text-6xl font-bold text-[#111] leading-none tracking-tight mb-6">
            Everything your<br />
            <span className="font-[family-name:var(--font-display)] italic text-[#2F47F2]">team needs.</span>
          </h2>
          <p className="text-lg text-slate-500 leading-relaxed">
            Manage your entire business from one unified platform. Products, orders, customers, categories — all connected, all intelligent.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Package,
              title: 'Product Catalog',
              desc: 'Manage your entire product inventory with prices, costs, stock levels, and categories. Get instant margin analysis on every item.',
              color: 'bg-amber-50 text-amber-600',
              mock: <ProductMock />,
            },
            {
              icon: Users,
              title: 'Customer Intelligence',
              desc: 'Track every customer interaction, purchase history, and lifetime value. Understand who your best customers truly are.',
              color: 'bg-emerald-50 text-emerald-600',
              mock: <CustomerMock />,
            },
            {
              icon: ShoppingCart,
              title: 'Order Management',
              desc: 'Full order lifecycle from pending to delivered. Status tracking, filtering, and comprehensive order history at a glance.',
              color: 'bg-violet-50 text-violet-600',
              mock: <OrderMock />,
            },
          ].map(f => (
            <div key={f.title} className="rounded-3xl border border-slate-100 bg-slate-50/40 p-7 hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300 group">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-5 ${f.color}`}>
                <f.icon size={20} />
              </div>
              <h3 className="text-xl font-bold text-[#111] mb-2">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">{f.desc}</p>
              <div className="rounded-2xl overflow-hidden border border-slate-100 bg-white">
                {f.mock}
              </div>
            </div>
          ))}
        </div>

        {/* Upload flow callout */}
        <div className="mt-10 rounded-3xl bg-[#0C0C0C] p-10 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1">
            <span className="text-xs font-bold uppercase tracking-widest text-[#2F47F2] font-[family-name:var(--font-mono)] block mb-3">Data Import</span>
            <h3 className="text-3xl font-bold text-white mb-3">Upload your existing data. We&apos;ll handle the rest.</h3>
            <p className="text-slate-400 text-sm leading-relaxed max-w-md">
              Import your Excel or CSV product catalog. Fuse parses, cleans, and enriches your data — then runs AI segmentation automatically.
            </p>
          </div>
          <div className="shrink-0">
            <UploadFlowMock />
          </div>
        </div>
      </div>
    </section>
  );
}

function ProductMock() {
  return (
    <div className="p-3">
      {[
        { name: 'Premium Skincare Set', price: 'EGP 850', stock: 24, status: 'high' },
        { name: 'Moisturizing Cream', price: 'EGP 320', stock: 6, status: 'low' },
        { name: 'Essential Oil Blend', price: 'EGP 175', stock: 0, status: 'out' },
      ].map(p => (
        <div key={p.name} className="flex items-center gap-2 py-2 border-b border-slate-50 last:border-0">
          <div className="w-6 h-6 rounded-md bg-slate-100 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-medium text-slate-700 truncate">{p.name}</p>
            <p className="text-[8px] text-slate-400 font-[family-name:var(--font-mono)]">{p.price}</p>
          </div>
          <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full ${
            p.status === 'high' ? 'bg-emerald-50 text-emerald-700' :
            p.status === 'low' ? 'bg-amber-50 text-amber-700' :
            'bg-rose-50 text-rose-700'
          }`}>{p.stock === 0 ? 'Out' : p.stock}</span>
        </div>
      ))}
    </div>
  );
}

function CustomerMock() {
  return (
    <div className="p-3">
      {[
        { name: 'Sara Hassan', orders: 12, ltv: 'EGP 9.4K', badge: 'Champion', color: 'bg-emerald-100 text-emerald-700' },
        { name: 'Ahmed Kamal', orders: 7, ltv: 'EGP 4.2K', badge: 'Loyal', color: 'bg-sky-100 text-sky-700' },
        { name: 'Mona Ibrahim', orders: 1, ltv: 'EGP 350', badge: 'New', color: 'bg-rose-100 text-rose-700' },
      ].map(c => (
        <div key={c.name} className="flex items-center gap-2 py-2 border-b border-slate-50 last:border-0">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-sky-400 to-violet-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-medium text-slate-700">{c.name}</p>
            <p className="text-[8px] text-slate-400">{c.orders} orders · {c.ltv}</p>
          </div>
          <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full ${c.color}`}>{c.badge}</span>
        </div>
      ))}
    </div>
  );
}

function OrderMock() {
  return (
    <div className="p-3">
      {[
        { id: '#ORD-2841', customer: 'Sara Hassan', total: 'EGP 850', status: 'Delivered', color: 'bg-emerald-50 text-emerald-700' },
        { id: '#ORD-2840', customer: 'Ahmed Kamal', total: 'EGP 1,200', status: 'Shipped', color: 'bg-indigo-50 text-indigo-700' },
        { id: '#ORD-2839', customer: 'Mona Ibrahim', total: 'EGP 350', status: 'Pending', color: 'bg-amber-50 text-amber-700' },
      ].map(o => (
        <div key={o.id} className="flex items-center gap-2 py-2 border-b border-slate-50 last:border-0">
          <div className="w-6 h-6 rounded-md bg-violet-50 flex items-center justify-center shrink-0">
            <ShoppingCart size={9} className="text-violet-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-medium text-slate-700">{o.id}</p>
            <p className="text-[8px] text-slate-400">{o.customer}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[8px] font-bold text-slate-900 font-[family-name:var(--font-mono)]">{o.total}</p>
            <span className={`text-[7px] font-bold px-1 py-0.5 rounded ${o.color}`}>{o.status}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function UploadFlowMock() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep(s => (s + 1) % 4), 1800);
    return () => clearInterval(id);
  }, []);

  const steps = [
    { icon: Upload, label: 'Upload CSV / Excel', color: 'text-[#2F47F2]', bg: 'bg-[#2F47F2]/10' },
    { icon: Database, label: 'Parse & Clean', color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { icon: Brain, label: 'AI Segmentation', color: 'text-violet-400', bg: 'bg-violet-400/10' },
    { icon: Sparkles, label: 'Insights Ready', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  ];

  return (
    <div className="flex items-center gap-3">
      {steps.map((s, i) => (
        <React.Fragment key={s.label}>
          <div className={`flex flex-col items-center gap-2 transition-all duration-500 ${
            i === step ? 'scale-110 opacity-100' : i < step ? 'opacity-60' : 'opacity-30'
          }`}>
            <div className={`w-12 h-12 rounded-2xl ${s.bg} flex items-center justify-center ${i === step ? 'ring-2 ring-white/20' : ''}`}>
              <s.icon size={20} className={s.color} />
            </div>
            <span className="text-[9px] font-medium text-white/60 text-center w-16">{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`w-6 h-px transition-all duration-500 ${i < step ? 'bg-[#2F47F2]' : 'bg-white/10'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ─── AI Segmentation Section ────────────────────────────────────────────────── */
function AISection() {
  return (
    <section id="ai" className="py-32 bg-[#0C0C0C]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#2F47F2] font-[family-name:var(--font-mono)] block mb-4">AI Intelligence</span>
            <h2 className="text-5xl sm:text-6xl font-bold text-white leading-none tracking-tight mb-6">
              Your data,<br />
              <span className="font-[family-name:var(--font-display)] italic text-[#F5F3EE]">understood.</span>
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed mb-10">
              Fuse runs KMeans and Gaussian Mixture Models on your product catalog to discover clusters automatically. No setup. No data science degree required.
            </p>

            <div className="space-y-5">
              {[
                { icon: Layers, title: 'Product Clusters', desc: 'Automatically groups products by margin, price, and turnover into actionable clusters.' },
                { icon: Users, title: 'Customer Segments', desc: 'RFM-based segments: Champions, Loyal, At-Risk, Dormant — with LTV forecasts for each.' },
                { icon: TrendingUp, title: 'Sales Forecasting', desc: 'Predict future revenue with time-series AI models trained on your actual order history.' },
                { icon: Target, title: 'Recommendations', desc: 'Get AI-generated recommendations for pricing, restocking, and campaign targeting.' },
              ].map(f => (
                <div key={f.title} className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#2F47F2]/10 flex items-center justify-center shrink-0">
                    <f.icon size={18} className="text-[#2F47F2]" />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-white mb-1">{f.title}</h4>
                    <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <SegmentationMock />
          </div>
        </div>
      </div>
    </section>
  );
}

function SegmentationMock() {
  const clusters = [
    { name: 'Premium Line', products: 42, margin: '34.2%', revenue: '42.8%', color: '#0ea5e9', soft: 'rgba(14,165,233,0.1)', trait: 'High margin' },
    { name: 'Core Catalog', products: 58, margin: '18.5%', revenue: '35.1%', color: '#8b5cf6', soft: 'rgba(139,92,246,0.1)', trait: 'Revenue driver' },
    { name: 'Budget Range', products: 38, margin: '7.1%', revenue: '15.3%', color: '#10b981', soft: 'rgba(16,185,129,0.1)', trait: 'Fast moving' },
    { name: 'Niche Items', products: 26, margin: '-2.4%', revenue: '6.8%', color: '#f59e0b', soft: 'rgba(245,158,11,0.1)', trait: 'Loss-making' },
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5">
      {/* Browser chrome */}
      <div className="flex items-center gap-1.5 mb-4">
        {['#f43f5e','#f59e0b','#10b981'].map(c => <div key={c} className="w-2 h-2 rounded-full" style={{ background: c }} />)}
        <div className="flex-1 mx-3 h-4 rounded bg-white/5 flex items-center px-2">
          <span className="text-[8px] text-white/30 font-[family-name:var(--font-mono)]">fusehq.com/dashboard/segments</span>
        </div>
      </div>

      <p className="text-[10px] font-bold text-white/80 mb-1">Segmentation</p>
      <p className="text-[8px] text-white/30 mb-4">AI-driven groups discovered in your data, refreshed automatically.</p>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: 'Clusters discovered', value: '4', accent: true },
          { label: 'Products segmented', value: '164', accent: false },
          { label: 'Last updated', value: 'Jun 5', accent: false },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-3 border ${s.accent ? 'bg-sky-500 border-sky-500' : 'bg-white/5 border-white/10'}`}>
            <p className={`text-base font-bold font-[family-name:var(--font-mono)] ${s.accent ? 'text-white' : 'text-white/80'}`}>{s.value}</p>
            <p className={`text-[8px] mt-0.5 ${s.accent ? 'text-sky-100' : 'text-white/40'}`}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Distribution bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] font-semibold text-white/60">Catalog distribution</span>
          <span className="text-[8px] text-white/30">164 products · 4 clusters</span>
        </div>
        <div className="flex h-2.5 rounded-full overflow-hidden bg-white/5">
          {clusters.map(c => (
            <div key={c.name} style={{ background: c.color, width: `${(c.products / 164) * 100}%` }} className="h-full transition-all" />
          ))}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2">
          {clusters.map(c => (
            <div key={c.name} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm" style={{ background: c.color }} />
              <span className="text-[8px] text-white/50">{c.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Cluster cards */}
      <div className="space-y-2">
        {clusters.map(c => (
          <div key={c.name} className="rounded-xl border border-white/5 p-3" style={{ background: c.soft }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: c.color }}>
                <Layers size={12} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-semibold text-white/80">{c.name}</p>
                <p className="text-[7px] text-white/40">{c.products} products</p>
              </div>
              <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-full border text-white/60 border-white/10">{c.trait}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Avg margin', value: c.margin },
                { label: 'Revenue share', value: c.revenue },
                { label: 'Products', value: String(c.products) },
              ].map(m => (
                <div key={m.label}>
                  <p className="text-[7px] text-white/30">{m.label}</p>
                  <p className={`text-[9px] font-semibold ${m.value.startsWith('-') ? 'text-rose-400' : 'text-white/80'}`}>{m.value}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── User Flow Section ──────────────────────────────────────────────────────── */
function FlowSection() {
  const steps = [
    {
      num: '01',
      title: 'Upload your data',
      desc: 'Import your product catalog, orders, and customer records from Excel or CSV. Fuse supports any column structure — our parser figures out the rest.',
      icon: Upload,
      color: 'bg-[#2F47F2]/10 text-[#2F47F2]',
      border: 'border-[#2F47F2]/20',
    },
    {
      num: '02',
      title: 'AI cleans & structures',
      desc: 'Our pipeline validates, deduplicates, and normalizes your data. Missing values are handled intelligently so your analysis is always accurate.',
      icon: Database,
      color: 'bg-emerald-50 text-emerald-600',
      border: 'border-emerald-100',
    },
    {
      num: '03',
      title: 'Segments are discovered',
      desc: 'KMeans and GMM models run automatically on your catalog. Products are grouped by margin, turnover, and price. Customer RFM segments are calculated.',
      icon: PieChart,
      color: 'bg-violet-50 text-violet-600',
      border: 'border-violet-100',
    },
    {
      num: '04',
      title: 'Insights fuel growth',
      desc: 'Your dashboard shows revenue trends, top performers, low-stock alerts, and AI recommendations — all updated as your data changes.',
      icon: Sparkles,
      color: 'bg-amber-50 text-amber-600',
      border: 'border-amber-100',
    },
  ];

  return (
    <section className="py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-20">
          <span className="text-xs font-bold uppercase tracking-widest text-[#2F47F2] font-[family-name:var(--font-mono)] block mb-4">How it works</span>
          <h2 className="text-5xl sm:text-6xl font-bold text-[#111] leading-none tracking-tight mb-6">
            From data to<br />
            <span className="font-[family-name:var(--font-display)] italic text-[#2F47F2]">decisions.</span>
          </h2>
          <p className="text-lg text-slate-500">Four steps from raw spreadsheet to AI-powered growth engine.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <div key={step.num} className={`relative rounded-3xl border p-8 ${step.border} bg-slate-50/40 hover:bg-white hover:shadow-lg hover:shadow-slate-200/60 transition-all duration-300`}>
              <div className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-[#111] text-white text-[10px] font-bold font-[family-name:var(--font-mono)] flex items-center justify-center">
                {i + 1}
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${step.color}`}>
                <step.icon size={22} />
              </div>
              <span className="text-xs font-bold text-slate-300 font-[family-name:var(--font-mono)] block mb-2">{step.num}</span>
              <h3 className="text-lg font-bold text-[#111] mb-3">{step.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Sales Forecast Section ──────────────────────────────────────────────────── */
function ForecastSection() {
  return (
    <section className="py-32 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1">
            <ForecastMock />
          </div>
          <div className="order-1 lg:order-2">
            <span className="text-xs font-bold uppercase tracking-widest text-[#2F47F2] font-[family-name:var(--font-mono)] block mb-4">Predictive Analytics</span>
            <h2 className="text-5xl sm:text-6xl font-bold text-[#111] leading-none tracking-tight mb-6">
              See revenue<br />
              <span className="font-[family-name:var(--font-display)] italic text-[#2F47F2]">before it happens.</span>
            </h2>
            <p className="text-slate-500 text-lg leading-relaxed mb-8">
              Fuse&apos;s time-series models analyze your historical order data to forecast future revenue with confidence intervals. Plan inventory, budget, and campaigns with precision.
            </p>
            <ul className="space-y-3">
              {[
                'Revenue forecasts for 7, 30, and 90-day windows',
                'Seasonal trend detection and adjustment',
                'SKU-level demand prediction',
                'Confidence bands so you know the range, not just the guess',
              ].map(item => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-600">
                  <Check size={16} className="text-[#2F47F2] shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function ForecastMock() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/40 overflow-hidden">
      <div className="h-8 bg-slate-50 border-b border-slate-100 flex items-center px-3 gap-1.5">
        {['#f43f5e','#f59e0b','#10b981'].map(c => <div key={c} className="w-2 h-2 rounded-full" style={{ background: c }} />)}
        <div className="flex-1 mx-3 h-4 rounded-full bg-slate-100" />
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Sparkles size={13} className="text-sky-500" />
            <p className="text-sm font-bold text-slate-900">Sales Forecast</p>
          </div>
          <div className="flex gap-1">
            {['7D','30D','90D'].map((t, i) => (
              <span key={t} className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${i === 1 ? 'bg-sky-500 text-white' : 'text-slate-400'}`}>{t}</span>
            ))}
          </div>
        </div>
        <p className="text-xs text-slate-400 mb-5">Next 30 days · based on 12 months of history</p>

        {/* Chart */}
        <svg viewBox="0 0 340 120" className="w-full" style={{ height: 120 }}>
          <defs>
            <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="fg2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid */}
          {[20, 50, 80, 110].map(y => (
            <line key={y} x1="20" x2="330" y1={y} y2={y} stroke="#f1f5f9" strokeWidth="1" />
          ))}

          {/* Confidence band */}
          <path d="M 175 52 L 200 46 L 225 42 L 250 36 L 275 32 L 300 28 L 320 24 L 320 38 L 300 42 L 275 48 L 250 52 L 225 57 L 200 61 L 175 67 Z" fill="url(#fg2)" />

          {/* Historical line */}
          <path d="M 20 90 L 45 82 L 70 75 L 95 70 L 120 64 L 145 58 L 170 52" fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" />
          <path d="M 20 90 L 45 82 L 70 75 L 95 70 L 120 64 L 145 58 L 170 52 L 170 110 L 20 110 Z" fill="url(#fg)" />

          {/* Forecast line (dashed) */}
          <path d="M 170 52 L 195 46 L 220 40 L 245 34 L 270 30 L 295 26 L 320 22" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="4 2" strokeLinecap="round" />

          {/* Vertical divider */}
          <line x1="170" x2="170" y1="15" y2="110" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 2" />
          <text x="172" y="12" fontSize="7" fill="#94a3b8">Forecast →</text>

          {/* Dots */}
          {[[170, 52], [195, 46], [220, 40], [245, 34]].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="3" fill="white" stroke="#8b5cf6" strokeWidth="1.5" />
          ))}

          {/* Labels */}
          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((m, i) => (
            <text key={m} x={20 + i * 58} y="118" fontSize="7" fill="#94a3b8" textAnchor="middle">{m}</text>
          ))}
        </svg>

        {/* Legend */}
        <div className="flex items-center gap-5 mt-3">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-0.5 bg-sky-500 rounded-full" />
            <span className="text-[9px] text-slate-500">Actual</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-0.5 border-t-2 border-dashed border-violet-500" />
            <span className="text-[9px] text-slate-500">Forecast</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-2 bg-violet-100 rounded-sm" />
            <span className="text-[9px] text-slate-500">Confidence</span>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          {[
            { label: 'Forecasted revenue', value: 'EGP 284K', sub: 'Next 30 days', up: true },
            { label: 'vs last month', value: '+18.4%', sub: 'Projected growth', up: true },
            { label: 'Confidence', value: '91%', sub: 'Model accuracy', up: true },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
              <p className="text-[9px] text-slate-500 mb-1">{s.label}</p>
              <p className="text-sm font-bold text-slate-900 font-[family-name:var(--font-mono)]">{s.value}</p>
              <p className="text-[8px] text-emerald-600 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Web Builder Section ────────────────────────────────────────────────────── */
function WebBuilderSection() {
  return (
    <section id="builder" className="py-32 bg-[#0C0C0C]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#2F47F2] font-[family-name:var(--font-mono)] block mb-4">Web Builder</span>
            <h2 className="text-5xl sm:text-6xl font-bold text-white leading-none tracking-tight mb-6">
              Build your<br />
              <span className="font-[family-name:var(--font-display)] italic text-[#F5F3EE]">storefront.</span>
              <br />
              <span className="text-white/30">No code.</span>
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed mb-8">
              Create beautiful custom pages for your brand directly inside Fuse. Drag, configure, publish — your products are automatically connected.
            </p>
            <ul className="space-y-3">
              {[
                'Hero sections, product grids, and text blocks',
                'Live preview as you build',
                'Products sync automatically from your catalog',
                'Custom domain support',
                'Mobile-responsive by default',
              ].map(item => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-400">
                  <Check size={16} className="text-[#2F47F2] shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <WebBuilderMock />
          </div>
        </div>
      </div>
    </section>
  );
}

function WebBuilderMock() {
  const [selectedBlock, setSelectedBlock] = useState<number | null>(0);

  const blocks = [
    { type: 'Hero', icon: '🎯', desc: 'Full-width banner' },
    { type: 'Products', icon: '📦', desc: 'Product grid' },
    { type: 'Text', icon: '✍️', desc: 'Rich text block' },
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-2">
      <div className="rounded-xl overflow-hidden bg-[#1a1a1a]">
        {/* Title bar */}
        <div className="h-8 border-b border-white/5 flex items-center px-3 gap-2">
          <div className="flex gap-1">
            {['#f43f5e','#f59e0b','#10b981'].map(c => <div key={c} className="w-2 h-2 rounded-full" style={{ background: c }} />)}
          </div>
          <div className="flex-1 mx-2 h-4 rounded bg-white/5 flex items-center px-2">
            <span className="text-[8px] text-white/30 font-[family-name:var(--font-mono)]">Web Builder — My Store</span>
          </div>
          <span className="text-[8px] bg-[#2F47F2] text-white px-2 py-0.5 rounded font-semibold">Publish</span>
        </div>

        <div className="flex h-80">
          {/* Block panel */}
          <div className="w-36 border-r border-white/5 bg-black/20 p-3">
            <p className="text-[8px] font-bold uppercase tracking-wider text-white/30 mb-3">Add blocks</p>
            {blocks.map((b, i) => (
              <button
                key={b.type}
                onClick={() => setSelectedBlock(i)}
                className={`w-full text-left rounded-lg p-2 mb-1.5 transition-all ${
                  selectedBlock === i ? 'bg-[#2F47F2]/20 border border-[#2F47F2]/40' : 'bg-white/5 border border-white/5 hover:bg-white/10'
                }`}
              >
                <span className="text-sm">{b.icon}</span>
                <p className="text-[9px] font-semibold text-white/70 mt-0.5">{b.type}</p>
                <p className="text-[7px] text-white/30">{b.desc}</p>
              </button>
            ))}
          </div>

          {/* Canvas */}
          <div className="flex-1 bg-slate-100 overflow-hidden">
            {/* Page preview */}
            <div className="bg-white h-full overflow-hidden">
              {/* Hero block */}
              <div className={`relative border-2 ${selectedBlock === 0 ? 'border-[#2F47F2]' : 'border-transparent'} transition-all`}>
                <div className="h-20 bg-gradient-to-r from-[#2F47F2] to-[#4F67FF] flex items-center px-5">
                  <div>
                    <p className="text-[9px] font-bold text-white">Welcome to our store</p>
                    <p className="text-[7px] text-white/70 mt-0.5">Premium skincare made in Egypt</p>
                    <div className="mt-2 px-2 py-0.5 bg-white rounded-full inline-block">
                      <p className="text-[7px] font-bold text-[#2F47F2]">Shop now →</p>
                    </div>
                  </div>
                </div>
                {selectedBlock === 0 && (
                  <div className="absolute top-1 right-1 bg-[#2F47F2] text-white text-[7px] px-1.5 py-0.5 rounded font-bold">Hero</div>
                )}
              </div>

              {/* Products block */}
              <div className={`relative border-2 ${selectedBlock === 1 ? 'border-[#2F47F2]' : 'border-transparent'} transition-all p-3`}>
                <p className="text-[8px] font-bold text-slate-700 mb-2">Featured Products</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {['Skincare Set', 'Moisturizer', 'Essential Oil'].map(p => (
                    <div key={p} className="rounded-md border border-slate-100 bg-slate-50 p-1.5">
                      <div className="h-8 bg-slate-200 rounded mb-1" />
                      <p className="text-[7px] font-medium text-slate-700 truncate">{p}</p>
                      <p className="text-[7px] text-[#2F47F2] font-bold">EGP 320</p>
                    </div>
                  ))}
                </div>
                {selectedBlock === 1 && (
                  <div className="absolute top-1 right-1 bg-[#2F47F2] text-white text-[7px] px-1.5 py-0.5 rounded font-bold">Products</div>
                )}
              </div>

              {/* Text block */}
              <div className={`relative border-2 ${selectedBlock === 2 ? 'border-[#2F47F2]' : 'border-transparent'} transition-all p-3`}>
                <p className="text-[8px] font-bold text-slate-700 mb-1">Our story</p>
                <div className="space-y-1">
                  <div className="h-1.5 rounded-full bg-slate-100 w-full" />
                  <div className="h-1.5 rounded-full bg-slate-100 w-5/6" />
                  <div className="h-1.5 rounded-full bg-slate-100 w-4/6" />
                </div>
                {selectedBlock === 2 && (
                  <div className="absolute top-1 right-1 bg-[#2F47F2] text-white text-[7px] px-1.5 py-0.5 rounded font-bold">Text</div>
                )}
              </div>
            </div>
          </div>

          {/* Props panel */}
          <div className="w-32 border-l border-white/5 bg-black/20 p-3">
            <p className="text-[8px] font-bold uppercase tracking-wider text-white/30 mb-3">Properties</p>
            {selectedBlock !== null && (
              <div className="space-y-3">
                <div>
                  <p className="text-[7px] text-white/40 mb-1">Background</p>
                  <div className="flex gap-1">
                    {['#2F47F2','#111','#fff','#f59e0b'].map(c => (
                      <div key={c} className="w-5 h-5 rounded cursor-pointer border border-white/10" style={{ background: c }} />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[7px] text-white/40 mb-1">Padding</p>
                  <div className="h-4 bg-white/5 rounded border border-white/10 flex items-center px-1.5">
                    <span className="text-[8px] text-white/50">16px</span>
                  </div>
                </div>
                <div>
                  <p className="text-[7px] text-white/40 mb-1">Alignment</p>
                  <div className="flex gap-1">
                    {['←','↔','→'].map(a => (
                      <div key={a} className={`flex-1 h-4 rounded text-[8px] flex items-center justify-center ${a === '←' ? 'bg-[#2F47F2]/30 text-[#2F47F2]' : 'bg-white/5 text-white/30'}`}>{a}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Chatbot Section ────────────────────────────────────────────────────────── */
function ChatbotSection() {
  const messages = [
    { role: 'user', text: 'Which products have the highest profit margin?' },
    { role: 'ai', text: 'Your "Premium Skincare Set" cluster has an average margin of 34.2%, generating 42.8% of your total revenue. I recommend prioritizing inventory for these 42 products heading into summer.' },
    { role: 'user', text: 'How many customers are at risk of churning?' },
    { role: 'ai', text: 'Based on RFM analysis, 14% of your customers (≈125 people) are classified as "At Risk" — they haven\'t purchased in 60+ days. Their avg LTV is EGP 9.4K. I can draft a re-engagement campaign.' },
  ];

  return (
    <section className="py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#2F47F2] font-[family-name:var(--font-mono)] block mb-4">AI Assistant</span>
            <h2 className="text-5xl sm:text-6xl font-bold text-[#111] leading-none tracking-tight mb-6">
              Ask anything<br />
              <span className="font-[family-name:var(--font-display)] italic text-[#2F47F2]">about your business.</span>
            </h2>
            <p className="text-slate-500 text-lg leading-relaxed mb-8">
              Fuse&apos;s AI chatbot is connected to your live business data. Ask in plain English and get instant, data-backed answers about your products, customers, orders, and forecasts.
            </p>
            <ul className="space-y-3">
              {[
                'Queries your actual CRM data in real-time',
                '"Which customers haven\'t ordered in 30 days?"',
                '"What\'s my best-performing product category?"',
                '"Show me the revenue breakdown by segment"',
              ].map(item => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-600">
                  <MessageSquare size={16} className="text-[#2F47F2] shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Chat mock */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/40 overflow-hidden">
            <div className="h-9 border-b border-slate-100 flex items-center px-4 gap-2 bg-slate-50">
              <div className="flex gap-1">
                {['#f43f5e','#f59e0b','#10b981'].map(c => <div key={c} className="w-2 h-2 rounded-full" style={{ background: c }} />)}
              </div>
              <div className="flex items-center gap-2 flex-1 mx-3">
                <div className="w-6 h-6 rounded-full bg-[#2F47F2] flex items-center justify-center">
                  <Sparkles size={10} className="text-white" />
                </div>
                <span className="text-[10px] font-semibold text-slate-700">Fuse AI Assistant</span>
                <span className="text-[8px] text-emerald-500 flex items-center gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Online
                </span>
              </div>
            </div>

            <div className="p-4 space-y-4 h-80 overflow-y-auto bg-slate-50/30">
              {messages.map((m, i) => (
                <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {m.role === 'ai' ? (
                    <div className="w-7 h-7 rounded-full bg-[#2F47F2] flex items-center justify-center shrink-0">
                      <Sparkles size={12} className="text-white" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                      <Users size={12} className="text-slate-500" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-[#2F47F2] text-white rounded-tr-sm'
                      : 'bg-white border border-slate-100 text-slate-700 rounded-tl-sm shadow-sm'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-[#2F47F2] flex items-center justify-center shrink-0">
                  <Sparkles size={12} className="text-white" />
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1 shadow-sm">
                  {[0, 1, 2].map(i => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            </div>

            {/* Input */}
            <div className="border-t border-slate-100 p-3 flex items-center gap-3 bg-white">
              <div className="flex-1 h-9 rounded-xl border border-slate-200 bg-slate-50 flex items-center px-3">
                <span className="text-[10px] text-slate-400">Ask about your business data…</span>
              </div>
              <button className="w-9 h-9 rounded-xl bg-[#2F47F2] flex items-center justify-center shrink-0">
                <ArrowUpRight size={14} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Pricing Section ────────────────────────────────────────────────────────── */
function PricingSection() {
  const tiers = [
    {
      name: 'Essential',
      price: 'EGP 1,200',
      period: '/mo',
      desc: 'For emerging local brands.',
      features: [
        'Up to 200 products',
        'Full CRM dashboard',
        'Order management',
        'Customer records',
        'CSV import',
        'Standard reports',
      ],
      cta: 'Get started',
      highlight: false,
    },
    {
      name: 'Performance',
      price: 'EGP 3,500',
      period: '/mo',
      desc: 'AI engine fully activated.',
      features: [
        'Unlimited products',
        'AI product segmentation',
        'Sales forecasting',
        'Customer RFM segments',
        'AI chatbot assistant',
        'Web builder (3 pages)',
        'Priority support',
      ],
      cta: 'Start now',
      highlight: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      desc: 'Scale at high velocity.',
      features: [
        'Everything in Performance',
        'Dedicated infrastructure',
        'Custom AI models',
        'Unlimited web pages',
        'API access',
        '24/7 dedicated support',
        'SLA guarantee',
      ],
      cta: 'Contact sales',
      highlight: false,
    },
  ];

  return (
    <section id="pricing" className="py-32 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-20">
          <span className="text-xs font-bold uppercase tracking-widest text-[#2F47F2] font-[family-name:var(--font-mono)] block mb-4">Pricing</span>
          <h2 className="text-5xl sm:text-6xl font-bold text-[#111] leading-none tracking-tight mb-6">
            Simple,<br />
            <span className="font-[family-name:var(--font-display)] italic text-[#2F47F2]">transparent.</span>
          </h2>
          <p className="text-lg text-slate-500">Start free. Scale as you grow. No hidden fees, no contracts.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-center">
          {tiers.map(tier => (
            <div key={tier.name} className={`rounded-3xl p-8 ${
              tier.highlight
                ? 'bg-[#111] shadow-2xl shadow-black/20 scale-105 relative'
                : 'bg-white border border-slate-200 shadow-sm'
            }`}>
              {tier.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#2F47F2] text-white text-xs font-bold px-4 py-1 rounded-full">
                  Most popular
                </div>
              )}
              <div className="mb-6">
                <h3 className={`text-xl font-bold mb-1 ${tier.highlight ? 'text-white' : 'text-[#111]'}`}>{tier.name}</h3>
                <p className={`text-sm mb-4 ${tier.highlight ? 'text-slate-400' : 'text-slate-500'}`}>{tier.desc}</p>
                <div className={`text-4xl font-bold font-[family-name:var(--font-mono)] ${tier.highlight ? 'text-[#2F47F2]' : 'text-[#111]'}`}>
                  {tier.price}<span className={`text-base font-normal ${tier.highlight ? 'text-slate-400' : 'text-slate-400'}`}>{tier.period}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {tier.features.map(f => (
                  <li key={f} className={`flex items-center gap-2.5 text-sm ${tier.highlight ? 'text-slate-300' : 'text-slate-600'}`}>
                    <Check size={15} className="text-[#2F47F2] shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link href="/register">
                <button className={`w-full py-3.5 rounded-full font-semibold text-sm transition-all ${
                  tier.highlight
                    ? 'bg-[#2F47F2] text-white hover:bg-[#2438e0]'
                    : 'border-2 border-[#111] text-[#111] hover:bg-[#111] hover:text-white'
                }`}>
                  {tier.cta}
                </button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── CTA Section ────────────────────────────────────────────────────────────── */
function CTASection() {
  const { data: session } = authClient.useSession();
  return (
    <section className="py-32 bg-[#0C0C0C]">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-[#2F47F2]/15 blur-[100px]" />
        </div>
        <h2 className="text-6xl sm:text-7xl font-bold text-white leading-none tracking-tight mb-6 relative">
          Ready to<br />
          <span className="font-[family-name:var(--font-display)] italic text-[#F5F3EE]">fuse it all?</span>
        </h2>
        <p className="text-lg text-slate-400 mb-10 max-w-xl mx-auto relative">
          Join Egypt&apos;s fastest-growing brands using Fuse to turn data into decisions.
        </p>
        <div className="relative flex flex-col sm:flex-row items-center justify-center gap-4">
          {session ? (
            <Link href="/dashboard">
              <button className="group h-14 px-10 rounded-full bg-[#2F47F2] text-white font-semibold text-lg hover:bg-[#2438e0] transition-all flex items-center gap-2">
                Open Dashboard <ArrowUpRight size={18} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </Link>
          ) : (
            <>
              <Link href="/register">
                <button className="group h-14 px-10 rounded-full bg-[#2F47F2] text-white font-semibold text-lg hover:bg-[#2438e0] transition-all flex items-center gap-2">
                  Start free today <ArrowUpRight size={18} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              </Link>
              <p className="text-sm text-slate-500">No credit card required · Free forever plan available</p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

/* ─── Footer ─────────────────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="bg-[#0C0C0C] border-t border-white/5 pt-20 pb-10 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-16">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <Image src={logo} alt="Fuse" width={28} className="rounded-md" />
              <span className="font-bold text-lg text-white">FUSE</span>
            </div>
            <p className="text-sm text-slate-500 max-w-xs leading-relaxed mb-6">
              The AI-native CRM built for Egypt&apos;s leading local brands. From upload to insights in minutes.
            </p>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 text-xs text-white/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              All systems operational
            </div>
          </div>

          {[
            {
              title: 'Product',
              links: ['Dashboard', 'CRM', 'AI Segmentation', 'Sales Forecasting', 'Web Builder', 'AI Assistant'],
            },
            {
              title: 'Company',
              links: ['About', 'Blog', 'Careers', 'Press', 'Contact'],
            },
            {
              title: 'Legal',
              links: ['Privacy Policy', 'Terms of Service', 'Security', 'Cookies'],
            },
          ].map(col => (
            <div key={col.title}>
              <h4 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-4">{col.title}</h4>
              <ul className="space-y-3">
                {col.links.map(link => (
                  <li key={link}>
                    <a href="#" className="text-sm text-slate-500 hover:text-white transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-600">© 2026 Fuse Technologies. All rights reserved.</p>
          <p className="text-xs text-slate-600 font-[family-name:var(--font-mono)]">ENGINEERED IN EGYPT 🇪🇬</p>
        </div>
      </div>
    </footer>
  );
}

/* ─── Root ───────────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-white selection:bg-[#2F47F2] selection:text-white font-[family-name:var(--font-body)]">
      <NoiseOverlay />
      <Navbar />
      <Hero />
      <CRMSection />
      <AISection />
      <FlowSection />
      <ForecastSection />
      <WebBuilderSection />
      <ChatbotSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </div>
  );
}
