"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import {
  ArrowUpRight, ArrowDownRight, TrendingUp, Users, Package, Tag,
  ShoppingCart, BarChart3, Activity, Sparkles, Upload, Plus,
  BotMessageSquare, ChevronRight, Layers, AlertTriangle, Wallet,
  Receipt, Trophy, RefreshCw,
} from "lucide-react"
import UploadDatasetModal from "@/app/components/dashboard/UploadDatasetModal"

// ─── Types ────────────────────────────────────────────────────────────────────

type Metric = {
  type:   "revenue" | "orders" | "customers" | "products"
  label:  string
  value:  string
  change: string
  up:     boolean
  sub:    string
  href?:  string
}

type OrderStatusBreakdown = { status: string; count: number; pct: number }
type TopProduct = { id: string; name: string; revenue: number; units: number }
type Inventory  = { outOfStock: number; lowStock: number }

type MetricsResponse = {
  metrics:        Metric[]
  revenue:        { label: string; value: number }[]
  orderMix:       OrderStatusBreakdown[]
  recent:         { orderNumber: string; customerName: string; total: number; status: string }[]
  topProducts:    TopProduct[]
  inventory:      Inventory
  allTimeRevenue: number
  avgOrderValue:  number
}

type SegmentsResponse = {
  hasResults:        boolean
  productCount:      number
  minProductsNeeded: number
  lastJobAt:         string | null
  segments:          { productId: string; cluster: number; clusterName: string }[]
  clusters: {
    cluster:         number
    clusterName:     string
    numProducts:     number
    avgMargin:       number | null
    revenueSharePct: number | null
    profitSharePct:  number | null
    totalRevenue:    number | null
  }[]
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmtMoney(n: number | null | undefined): string {
  if (n == null || isNaN(Number(n))) return "EGP 0"
  const v = Number(n)
  const a = Math.abs(v)
  const sign = v < 0 ? "-" : ""
  if (a >= 1_000_000) return `${sign}EGP ${(a / 1_000_000).toFixed(2)}M`
  if (a >= 1_000)     return `${sign}EGP ${(a / 1_000).toFixed(1)}K`
  return `${sign}EGP ${Math.round(a).toLocaleString("en-EG")}`
}

// pipeline stores margins as fractions (0.07 = 7%)
const fmtMarginPct = (f: number | null) => f == null ? "—" : `${(f * 100).toFixed(1)}%`
const fmtSharePct  = (p: number | null) => p == null ? "—" : `${p.toFixed(1)}%`

const QUICK_ACTIONS = [
  { label: "New product", href: "/dashboard/products?new=1", icon: Plus },
  { label: "New order",   href: "/dashboard/orders?new=1",   icon: ShoppingCart },
]

const CLUSTER_DOTS = ["bg-sky-500", "bg-violet-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-indigo-500", "bg-teal-500", "bg-fuchsia-500"]

// ─── Mount reveal (staggered fade-up, no deps) ────────────────────────────────

function Reveal({ delay = 0, className = "", children }: { delay?: number; className?: string; children: React.ReactNode }) {
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setShown(true), 20)
    return () => clearTimeout(t)
  }, [])
  return (
    <div
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-500 ease-out ${shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"} ${className}`}
    >
      {children}
    </div>
  )
}

// ─── Reusable bits ────────────────────────────────────────────────────────────

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${className}`}>
      {children}
    </div>
  )
}

function Sparkline({ up }: { up: boolean }) {
  const path = up ? "M2 14 L8 10 L14 12 L20 6 L26 8 L32 4" : "M2 4 L8 8 L14 6 L20 12 L26 10 L32 14"
  const stroke = up ? "#0ea5e9" : "#94a3b8"
  return (
    <svg width="40" height="18" viewBox="0 0 34 18" fill="none">
      <path d={path} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function MetricCard({ m }: { m: Metric }) {
  const isAccent = m.type === "revenue"
  const ICON_MAP = { revenue: TrendingUp, orders: ShoppingCart, customers: Users, products: Package }
  const Icon = ICON_MAP[m.type]

  const inner = (
    <div className={`group rounded-2xl p-5 border h-full flex flex-col gap-4 transition-all hover:shadow-md ${
      isAccent
        ? "bg-linear-to-br from-sky-500 to-sky-600 border-sky-500 text-white"
        : "bg-white border-slate-100 text-slate-900 hover:border-sky-200"
    }`}>
      <div className="flex items-center justify-between">
        <div className={`p-2 rounded-xl ${isAccent ? "bg-white/15" : "bg-sky-50"}`}>
          <Icon size={16} className={isAccent ? "text-white" : "text-sky-600"} />
        </div>
        <Sparkline up={m.up} />
      </div>
      <div>
        <p className={`text-2xl font-bold ${isAccent ? "text-white" : "text-slate-900"}`}>{m.value}</p>
        <div className="flex items-center gap-1.5 mt-1">
          <span className={`text-xs font-medium flex items-center gap-0.5 ${
            m.up ? (isAccent ? "text-emerald-200" : "text-emerald-600") : (isAccent ? "text-rose-200" : "text-rose-500")
          }`}>
            {m.up ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
            {m.change}
          </span>
          <span className={`text-xs ${isAccent ? "text-sky-100" : "text-slate-400"}`}>{m.sub}</span>
        </div>
      </div>
      <div className="flex items-center justify-between mt-auto">
        <p className={`text-xs font-medium ${isAccent ? "text-sky-100" : "text-slate-500"}`}>{m.label}</p>
        {m.href && !isAccent && <ArrowUpRight size={13} className="text-slate-300 group-hover:text-sky-500 transition-colors" />}
      </div>
    </div>
  )

  return m.href ? <Link href={m.href} className="block h-full">{inner}</Link> : <div className="h-full">{inner}</div>
}

function MetricSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-37 rounded-2xl bg-slate-100 animate-pulse" />
      ))}
    </div>
  )
}

// ─── Secondary stat tile ──────────────────────────────────────────────────────

function StatTile({
  icon: Icon, label, value, sub, tone = "slate", href,
}: {
  icon: React.ElementType; label: string; value: string; sub?: string
  tone?: "slate" | "amber" | "rose" | "emerald"; href?: string
}) {
  const tones = {
    slate:   { ic: "text-slate-500",   bg: "bg-slate-100" },
    amber:   { ic: "text-amber-600",   bg: "bg-amber-50" },
    rose:    { ic: "text-rose-600",    bg: "bg-rose-50" },
    emerald: { ic: "text-emerald-600", bg: "bg-emerald-50" },
  }[tone]

  const body = (
    <div className="flex items-center gap-3.5 px-4 py-3.5 h-full">
      <div className={`p-2.5 rounded-xl shrink-0 ${tones.bg}`}>
        <Icon size={16} className={tones.ic} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">{label}</p>
        <p className="text-lg font-bold text-slate-900 leading-tight truncate">{value}</p>
        {sub && <p className="text-[11px] text-slate-400 truncate">{sub}</p>}
      </div>
    </div>
  )
  return (
    <Card className={`overflow-hidden ${href ? "transition-colors hover:border-sky-200" : ""}`}>
      {href ? <Link href={href} className="block h-full">{body}</Link> : body}
    </Card>
  )
}

// ─── Revenue chart ────────────────────────────────────────────────────────────

function RevenueChart({ points }: { points: { label: string; value: number }[] }) {
  const W = 520, H = 180, P = 24
  const max = Math.max(...points.map(p => p.value), 1)
  const stepX = (W - P * 2) / Math.max(points.length - 1, 1)
  const coords = points.map((p, i) => ({ x: P + i * stepX, y: H - P - (p.value / max) * (H - P * 2), ...p }))
  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ")
  const areaPath = `${linePath} L ${coords[coords.length - 1]?.x ?? P} ${H - P} L ${P} ${H - P} Z`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-44">
      <defs>
        <linearGradient id="rev-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map(t => (
        <line key={t} x1={P} x2={W - P} y1={P + t * (H - P * 2)} y2={P + t * (H - P * 2)} stroke="#f1f5f9" strokeWidth="1" />
      ))}
      <path d={areaPath} fill="url(#rev-grad)" />
      <path d={linePath} fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinejoin="round" />
      {coords.map(c => <circle key={c.label} cx={c.x} cy={c.y} r="3" fill="#fff" stroke="#0ea5e9" strokeWidth="1.5" />)}
      {coords.map((c, i) => <text key={i} x={c.x} y={H - 6} fontSize="10" textAnchor="middle" fill="#94a3b8">{c.label}</text>)}
    </svg>
  )
}

// ─── Order status donut ───────────────────────────────────────────────────────

function StatusDonut({ data }: { data: OrderStatusBreakdown[] }) {
  const colors: Record<string, string> = {
    pending: "#f59e0b", confirmed: "#0ea5e9", shipped: "#6366f1", delivered: "#10b981", cancelled: "#ef4444",
  }
  const C = 2 * Math.PI * 38
  let offset = 0
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 100 100" className="w-28 h-28 -rotate-90">
        <circle cx="50" cy="50" r="38" stroke="#f1f5f9" strokeWidth="14" fill="none" />
        {data.map(d => {
          const len = (d.pct / 100) * C
          const circle = (
            <circle key={d.status} cx="50" cy="50" r="38" stroke={colors[d.status] ?? "#94a3b8"} strokeWidth="14"
              fill="none" strokeDasharray={`${len} ${C}`} strokeDashoffset={-offset} />
          )
          offset += len
          return circle
        })}
      </svg>
      <div className="flex-1 space-y-1.5">
        {data.map(d => (
          <div key={d.status} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: colors[d.status] ?? "#94a3b8" }} />
              <span className="text-slate-600 capitalize">{d.status}</span>
            </div>
            <span className="font-medium text-slate-700">{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Customer segmentation preview (sample data) ──────────────────────────────

const CUSTOMER_SAMPLE = [
  { name: "Champions",         pct: 18, dot: "bg-emerald-500", soft: "bg-emerald-50", text: "text-emerald-700", desc: "Recent · frequent · top spend", ltv: "EGP 24.8K" },
  { name: "Loyal",             pct: 26, dot: "bg-sky-500",     soft: "bg-sky-50",     text: "text-sky-700",     desc: "Consistent repeat buyers",       ltv: "EGP 12.3K" },
  { name: "Potential loyalist", pct: 17, dot: "bg-violet-500", soft: "bg-violet-50",  text: "text-violet-700",  desc: "Recent, growing engagement",     ltv: "EGP 6.1K" },
  { name: "At risk",           pct: 14, dot: "bg-amber-500",   soft: "bg-amber-50",   text: "text-amber-700",   desc: "Slipping — win them back",        ltv: "EGP 9.4K" },
  { name: "Dormant",           pct: 15, dot: "bg-slate-400",   soft: "bg-slate-100",  text: "text-slate-600",   desc: "No activity in 90+ days",        ltv: "EGP 3.2K" },
  { name: "New",               pct: 10, dot: "bg-rose-500",    soft: "bg-rose-50",    text: "text-rose-700",    desc: "First purchase this month",      ltv: "EGP 1.8K" },
]

function CustomerSegmentationPreview() {
  return (
    <Card className="p-6 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-violet-50">
            <Users size={14} className="text-violet-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-900">Customer segmentation</h2>
              <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Preview</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Sample distribution — activates with your customer history</p>
          </div>
        </div>
        <span className="text-xs font-medium text-slate-300 inline-flex items-center gap-1 cursor-not-allowed">
          Soon <ChevronRight size={12} />
        </span>
      </div>

      {/* Distribution bar */}
      <div className="flex h-3 rounded-full overflow-hidden bg-slate-100 mb-4">
        {CUSTOMER_SAMPLE.map(s => (
          <div key={s.name} className={`${s.dot} h-full first:rounded-l-full last:rounded-r-full`} style={{ width: `${s.pct}%` }} title={`${s.name}: ${s.pct}%`} />
        ))}
      </div>

      {/* Segment cards (sample) */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {CUSTOMER_SAMPLE.map(s => (
          <div key={s.name} className="rounded-xl border border-slate-100 p-3">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`w-2.5 h-2.5 rounded-sm ${s.dot} shrink-0`} />
                <span className="text-sm font-semibold text-slate-900 truncate">{s.name}</span>
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${s.soft} ${s.text}`}>{s.pct}%</span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">{s.desc}</p>
            <p className="text-[11px] text-slate-500 mt-1">Avg LTV <span className="font-semibold text-slate-700">{s.ltv}</span></p>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-slate-400 mt-4 flex items-center gap-1.5">
        <BarChart3 size={11} className="text-slate-300" />
        Figures shown are illustrative samples. Connect order history to compute live RFM segments.
      </p>
    </Card>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [data,     setData]     = useState<MetricsResponse | null>(null)
  const [segments, setSegments] = useState<SegmentsResponse | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)

  const greeting = useMemo(() => {
    const h = new Date().getHours()
    if (h < 12) return "Good morning"
    if (h < 18) return "Good afternoon"
    return "Good evening"
  }, [])

  async function loadMetrics() {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch("/api/metrics")
      if (!res.ok) throw new Error()
      setData(await res.json())
    } catch {
      setError(true)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadMetrics() }, [])

  useEffect(() => {
    fetch("/api/segments/product")
      .then(r => r.ok ? r.json() : null)
      .then(setSegments)
      .catch(() => {})
  }, [])

  const metrics  = data?.metrics ?? []
  const revenue  = data?.revenue ?? []
  const orderMix = data?.orderMix ?? []
  const recent   = data?.recent ?? []
  const topProducts = data?.topProducts ?? []
  const inventory   = data?.inventory ?? { outOfStock: 0, lowStock: 0 }
  const stockIssues = inventory.outOfStock + inventory.lowStock

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto space-y-7">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{greeting} 👋</p>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">Overview</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {QUICK_ACTIONS.map(a => (
            <Link key={a.label} href={a.href}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-sky-200 hover:text-sky-700 transition-colors">
              <a.icon size={14} />
              <span className="hidden sm:inline">{a.label}</span>
            </Link>
          ))}
          <button onClick={() => setUploadOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-sky-500 rounded-xl hover:bg-sky-600 transition-colors shadow-sm">
            <Upload size={14} />
            Upload dataset
          </button>
        </div>
      </div>

      <UploadDatasetModal open={uploadOpen} onClose={() => setUploadOpen(false)} />

      {/* Inventory alert */}
      {!loading && stockIssues > 0 && (
        <Reveal className="block">
          <Link href="/dashboard/products"
            className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 hover:bg-amber-100/70 transition-colors">
            <AlertTriangle size={16} className="text-amber-600 shrink-0" />
            <p className="text-sm text-amber-900 flex-1">
              {inventory.outOfStock > 0 && <><strong>{inventory.outOfStock}</strong> out of stock</>}
              {inventory.outOfStock > 0 && inventory.lowStock > 0 && " · "}
              {inventory.lowStock > 0 && <><strong>{inventory.lowStock}</strong> running low</>}
              <span className="text-amber-700"> — review your inventory.</span>
            </p>
            <ChevronRight size={15} className="text-amber-500 shrink-0" />
          </Link>
        </Reveal>
      )}

      {/* Metric cards */}
      {loading ? <MetricSkeleton /> : error ? (
        <Card className="p-8 text-center">
          <AlertTriangle size={24} className="text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-600 font-medium">Couldn't load your metrics.</p>
          <button onClick={loadMetrics}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 text-slate-700 hover:border-sky-200 hover:text-sky-700 transition-colors">
            <RefreshCw size={13} /> Retry
          </button>
        </Card>
      ) : metrics.length > 0 ? (
        <Reveal>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((m, i) => <MetricCard key={i} m={m} />)}
          </div>
        </Reveal>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-sm text-slate-500">No data yet — upload a dataset to see your metrics.</p>
        </Card>
      )}

      {/* Secondary stat strip */}
      {!loading && !error && data && (
        <Reveal delay={60}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatTile icon={Wallet}  label="All-time revenue" value={fmtMoney(data.allTimeRevenue)} sub="Gross sales" tone="emerald" />
            <StatTile icon={Receipt} label="Avg order value"  value={fmtMoney(data.avgOrderValue)}  sub="Per order" />
            <StatTile
              icon={Package}
              label="Inventory health"
              value={stockIssues > 0 ? `${stockIssues} need${stockIssues === 1 ? "s" : ""} attention` : "All stocked"}
              sub={stockIssues > 0 ? `${inventory.outOfStock} out · ${inventory.lowStock} low` : "No stock alerts"}
              tone={inventory.outOfStock > 0 ? "rose" : inventory.lowStock > 0 ? "amber" : "emerald"}
              href="/dashboard/products"
            />
          </div>
        </Reveal>
      )}

      {/* Revenue chart + order mix */}
      <Reveal delay={120}>
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Revenue overview</h2>
                <p className="text-xs text-slate-400 mt-0.5">Last 6 months</p>
              </div>
              <div className="inline-flex items-center gap-1 text-xs bg-sky-50 text-sky-700 font-medium px-2.5 py-1 rounded-full">
                <TrendingUp size={11} /> Live
              </div>
            </div>
            {loading ? <div className="h-44 rounded-xl bg-slate-50 animate-pulse" />
              : revenue.length > 0 ? <RevenueChart points={revenue} />
              : <div className="h-44 grid place-content-center text-xs text-slate-400">No revenue data yet</div>}
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-900">Order status</h2>
              <Activity size={14} className="text-slate-300" />
            </div>
            {loading ? <div className="h-28 rounded-xl bg-slate-50 animate-pulse" />
              : orderMix.length > 0 ? <StatusDonut data={orderMix} />
              : <p className="text-xs text-slate-400 py-12 text-center">No orders yet</p>}
          </Card>
        </div>
      </Reveal>

      {/* Top products + recent orders */}
      <Reveal delay={180}>
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Top products */}
          <Card className="lg:col-span-2 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-50"><Trophy size={14} className="text-amber-600" /></div>
                <h2 className="text-sm font-semibold text-slate-900">Top products by revenue</h2>
              </div>
              <Link href="/dashboard/products" className="text-xs font-medium text-sky-600 hover:text-sky-700 inline-flex items-center gap-1">
                View all <ChevronRight size={12} />
              </Link>
            </div>
            {loading ? (
              <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-11 rounded-lg bg-slate-50 animate-pulse" />)}</div>
            ) : topProducts.length === 0 ? (
              <p className="text-xs text-slate-400 py-10 text-center">No sales recorded yet</p>
            ) : (
              <ul className="space-y-1">
                {topProducts.map((p, i) => {
                  const max = topProducts[0]?.revenue || 1
                  return (
                    <li key={p.id} className="flex items-center gap-3 py-2">
                      <span className={`w-6 h-6 rounded-lg grid place-content-center text-[11px] font-bold shrink-0 ${
                        i === 0 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"
                      }`}>{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm text-slate-800 truncate">{p.name}</span>
                          <span className="text-sm font-semibold text-slate-900 shrink-0">{fmtMoney(p.revenue)}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div className="h-full bg-sky-400 rounded-full" style={{ width: `${(p.revenue / max) * 100}%` }} />
                          </div>
                          <span className="text-[10px] text-slate-400 shrink-0">{p.units} sold</span>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>

          {/* Recent orders */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-900">Recent orders</h2>
              <Link href="/dashboard/orders" className="text-xs text-sky-600 hover:text-sky-700">All</Link>
            </div>
            {loading ? (
              <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-9 rounded-lg bg-slate-50 animate-pulse" />)}</div>
            ) : recent.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">No recent orders</p>
            ) : (
              <div className="space-y-3">
                {recent.slice(0, 5).map((o, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 truncate">{o.customerName ?? "Customer"}</p>
                      <p className="text-slate-400 truncate">{o.orderNumber ?? `#${i + 1}`}</p>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="font-medium text-slate-800">{fmtMoney(o.total)}</p>
                      <p className="text-[10px] text-slate-400 capitalize">{o.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </Reveal>

      {/* Product segmentation (real) */}
      <Reveal delay={240}>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-sky-50"><Sparkles size={14} className="text-sky-600" /></div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Product segmentation</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {segments?.lastJobAt ? `Updated ${new Date(segments.lastJobAt).toLocaleDateString()}` : "AI-driven product clusters"}
                </p>
              </div>
            </div>
            <Link href="/dashboard/segments" className="text-xs font-medium text-sky-600 hover:text-sky-700 inline-flex items-center gap-1">
              View all <ChevronRight size={12} />
            </Link>
          </div>

          {!segments ? (
            <div className="h-32 grid place-content-center text-xs text-slate-400">
              <span className="inline-flex items-center gap-2"><RefreshCw size={14} className="animate-spin text-sky-300" /> Loading insights…</span>
            </div>
          ) : !segments.hasResults ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
              <Layers size={20} className="text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">
                {segments.productCount < segments.minProductsNeeded
                  ? `Add at least ${segments.minProductsNeeded} products to unlock`
                  : "Run segmentation to discover product clusters"}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                You currently have {segments.productCount} product{segments.productCount === 1 ? "" : "s"}.
              </p>
              <Link href="/dashboard/segments" className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 text-sm font-medium rounded-lg bg-sky-500 text-white hover:bg-sky-600 transition-colors">
                Go to segmentation <ChevronRight size={13} />
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {segments.clusters
                .slice()
                .sort((a, b) => b.numProducts - a.numProducts)
                .slice(0, 4)
                .map(c => (
                  <div key={c.cluster} className="rounded-xl border border-slate-100 p-3 hover:border-sky-200 transition-colors">
                    <div className="flex items-center gap-2 mb-2 min-w-0">
                      <span className={`w-2.5 h-2.5 rounded-sm shrink-0 ${CLUSTER_DOTS[c.cluster % CLUSTER_DOTS.length]}`} />
                      <span className="text-sm font-semibold text-slate-900 truncate flex-1">{c.clusterName}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wide bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded shrink-0">{c.numProducts}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <p className="text-slate-400">Avg margin</p>
                        <p className={`font-medium ${c.avgMargin != null && c.avgMargin < 0 ? "text-rose-600" : "text-slate-700"}`}>{fmtMarginPct(c.avgMargin)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Revenue share</p>
                        <p className="font-medium text-slate-700">{fmtSharePct(c.revenueSharePct)}</p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </Card>
      </Reveal>

      {/* Customer segmentation (preview) */}
      <Reveal delay={300}>
        <CustomerSegmentationPreview />
      </Reveal>

      {/* AI assistant + quick links */}
      <Reveal delay={360}>
        <div className="grid lg:grid-cols-4 gap-4">
          {/* Chatbot */}
          <Link href="/chatbot" className="block lg:col-span-1">
            <Card className="p-5 hover:border-sky-200 transition-colors h-full">
              <div className="p-3 rounded-xl bg-linear-to-br from-sky-50 to-sky-100 w-fit mb-3">
                <BotMessageSquare size={20} className="text-sky-600" />
              </div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-900">AI Assistant</h3>
                <ArrowUpRight size={14} className="text-slate-300" />
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">Ask about sales trends, top products & customers.</p>
            </Card>
          </Link>

          {/* CRM quick links */}
          {[
            { label: "Customers",  href: "/dashboard/customers",  icon: Users,   desc: "Manage your customer base" },
            { label: "Products",   href: "/dashboard/products",   icon: Package, desc: "Catalog, pricing & stock" },
            { label: "Categories", href: "/dashboard/categories", icon: Tag,     desc: "Organise your catalog" },
          ].map(c => {
            const Icon = c.icon
            return (
              <Link key={c.label} href={c.href} className="group block">
                <Card className="p-5 hover:border-sky-200 transition-colors h-full">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center mb-3 group-hover:bg-sky-100 transition-colors">
                    <Icon size={18} className="text-sky-600" />
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{c.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{c.desc}</p>
                  <div className="flex items-center gap-1 mt-3 text-xs text-sky-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    Open <ArrowUpRight size={11} />
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      </Reveal>

    </div>
  )
}
