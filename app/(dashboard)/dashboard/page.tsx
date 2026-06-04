"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import Link from "next/link"
import {
  TrendingUp, Users, Package, ShoppingCart, AlertTriangle, ChevronRight,
  Upload, Plus, RefreshCw, Trophy, Activity, Sparkles, Layers,
  BarChart3, ArrowUpRight, ArrowDownRight,
} from "lucide-react"
import UploadDatasetModal from "@/app/components/dashboard/UploadDatasetModal"

// ─── Types ─────────────────────────────────────────────────────────────────────

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
type TopProduct           = { id: string; name: string; revenue: number; units: number }
type LowStockProduct      = { name: string; stock: number }
type RevenuePeriod        = "week" | "month" | "year"

type MetricsData = {
  metrics:          Metric[]
  orderMix:         OrderStatusBreakdown[]
  recent:           { orderNumber: string; customerName: string; total: number; status: string }[]
  topProducts:      TopProduct[]
  inventory:        { outOfStock: number; lowStock: number }
  allTimeRevenue:   number
  avgOrderValue:    number
  lowStockProducts: LowStockProduct[]
}

type SegmentsData = {
  hasResults:        boolean
  productCount:      number
  minProductsNeeded: number
  lastJobAt:         string | null
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtMoney(n: number | null | undefined): string {
  if (n == null || isNaN(Number(n))) return "EGP 0"
  const v = Number(n)
  const a = Math.abs(v)
  const sign = v < 0 ? "-" : ""
  if (a >= 1_000_000) return `${sign}EGP ${(a / 1_000_000).toFixed(2)}M`
  if (a >= 1_000)     return `${sign}EGP ${(a / 1_000).toFixed(1)}K`
  return `${sign}EGP ${Math.round(a).toLocaleString("en-EG")}`
}

const fmtMarginPct = (f: number | null) =>
  f == null ? "—" : `${(f * 100).toFixed(1)}%`
const fmtSharePct = (p: number | null) =>
  p == null ? "—" : `${p.toFixed(1)}%`

// ─── Reveal (staggered mount animation) ──────────────────────────────────────

function Reveal({
  delay = 0, className = "", children,
}: { delay?: number; className?: string; children: React.ReactNode }) {
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setShown(true), 20)
    return () => clearTimeout(t)
  }, [])
  return (
    <div
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-500 ease-out ${
        shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
      } ${className}`}
    >
      {children}
    </div>
  )
}

// ─── Card shell ───────────────────────────────────────────────────────────────

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(15,23,42,0.05)] ${className}`}>
      {children}
    </div>
  )
}

// ─── Stat cards ───────────────────────────────────────────────────────────────

const METRIC_ICONS = {
  revenue:   TrendingUp,
  orders:    ShoppingCart,
  customers: Users,
  products:  Package,
}

const METRIC_STYLES = {
  revenue:   { icon: "text-white",       iconBg: "bg-white/20",    card: "bg-gradient-to-br from-sky-500 to-sky-600 border-sky-400", val: "text-white", label: "text-sky-100",    change_up: "text-emerald-200", change_dn: "text-rose-200"  },
  orders:    { icon: "text-violet-600",  iconBg: "bg-violet-50",   card: "bg-white border-slate-100 hover:border-violet-200",        val: "text-slate-900", label: "text-slate-400", change_up: "text-emerald-600", change_dn: "text-rose-500" },
  customers: { icon: "text-emerald-600", iconBg: "bg-emerald-50",  card: "bg-white border-slate-100 hover:border-emerald-200",       val: "text-slate-900", label: "text-slate-400", change_up: "text-emerald-600", change_dn: "text-rose-500" },
  products:  { icon: "text-amber-600",   iconBg: "bg-amber-50",    card: "bg-white border-slate-100 hover:border-amber-200",         val: "text-slate-900", label: "text-slate-400", change_up: "text-emerald-600", change_dn: "text-rose-500" },
}

function StatCard({ m }: { m: Metric }) {
  const Icon  = METRIC_ICONS[m.type]
  const s     = METRIC_STYLES[m.type]

  const body = (
    <div className={`rounded-2xl p-5 h-full flex flex-col gap-3.5 border transition-all hover:shadow-md ${s.card}`}>
      <div className="flex items-start justify-between">
        <div className={`p-2.5 rounded-xl ${s.iconBg}`}>
          <Icon size={18} className={s.icon} />
        </div>
        <span className={`text-xs font-medium flex items-center gap-0.5 ${m.up ? s.change_up : s.change_dn}`}>
          {m.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {m.change}
        </span>
      </div>
      <div>
        <p className={`text-2xl font-bold font-['Space_Mono',monospace] leading-none ${s.val}`}>{m.value}</p>
        <p className={`text-xs mt-1.5 ${s.label}`}>{m.label}</p>
      </div>
      <p className={`text-[11px] mt-auto ${s.label} opacity-70`}>{m.sub}</p>
    </div>
  )

  return m.href
    ? <Link href={m.href} className="block h-full">{body}</Link>
    : <div className="h-full">{body}</div>
}

// ─── Revenue line chart ────────────────────────────────────────────────────────

function RevenueLineChart({ points }: { points: { label: string; value: number }[] }) {
  const W = 560, H = 300, PX = 44, PY = 24

  if (!points.length) {
    return (
      <div className="h-[300px] grid place-content-center text-xs text-slate-400">
        No data for this period
      </div>
    )
  }

  const max    = Math.max(...points.map(p => p.value), 1)
  const stepX  = (W - PX * 2) / Math.max(points.length - 1, 1)
  const coords = points.map((p, i) => ({
    x: PX + i * stepX,
    y: PY + (1 - p.value / max) * (H - PY * 2 - 16),
    ...p,
  }))

  const line = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ")
  const area = `${line} L ${coords.at(-1)!.x.toFixed(1)} ${H - 20} L ${PX} ${H - 20} Z`

  const gridLevels = [0, 0.33, 0.67, 1]

  const showEvery = Math.ceil(points.length / 8)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 300 }}>
      <defs>
        <linearGradient id="rev-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#0ea5e9" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0"    />
        </linearGradient>
      </defs>

      {gridLevels.map(t => {
        const y = PY + t * (H - PY * 2 - 16)
        return (
          <g key={t}>
            <line x1={PX} x2={W - 12} y1={y} y2={y} stroke="#f1f5f9" strokeWidth="1" />
            <text x={PX - 6} y={y + 3.5} fontSize="8.5" fill="#94a3b8" textAnchor="end">
              {fmtMoney(max * (1 - t))}
            </text>
          </g>
        )
      })}

      <path d={area} fill="url(#rev-area)" />
      <path d={line}  fill="none" stroke="#0ea5e9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {coords.map(c => (
        <circle key={c.label} cx={c.x} cy={c.y} r="3.5" fill="white" stroke="#0ea5e9" strokeWidth="2" />
      ))}

      {coords
        .filter((_, i) => i % showEvery === 0 || i === coords.length - 1)
        .map(c => (
          <text key={c.label + "_lbl"} x={c.x} y={H - 4} fontSize="9" textAnchor="middle" fill="#94a3b8">
            {c.label}
          </text>
        ))}
    </svg>
  )
}

// ─── Order status ─────────────────────────────────────────────────────────────

const STATUS_META: Record<string, { color: string; bg: string; text: string; label: string }> = {
  pending:   { color: "#f59e0b", bg: "bg-amber-50",   text: "text-amber-600",   label: "Pending"   },
  confirmed: { color: "#0ea5e9", bg: "bg-sky-50",     text: "text-sky-600",     label: "Confirmed" },
  shipped:   { color: "#6366f1", bg: "bg-indigo-50",  text: "text-indigo-600",  label: "Shipped"   },
  delivered: { color: "#10b981", bg: "bg-emerald-50", text: "text-emerald-600", label: "Delivered" },
  completed: { color: "#10b981", bg: "bg-emerald-50", text: "text-emerald-600", label: "Completed" },
  cancelled: { color: "#ef4444", bg: "bg-rose-50",    text: "text-rose-500",    label: "Cancelled" },
}

function OrderStatusPie({ data }: { data: OrderStatusBreakdown[] }) {
  const sorted = [...data].sort((a, b) => b.count - a.count)
  const total  = data.reduce((s, d) => s + d.count, 0)

  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-2">
        <div className="w-14 h-14 rounded-full border-4 border-slate-100" />
        <p className="text-xs text-slate-400">No orders yet</p>
      </div>
    )
  }

  // Build ring segments using SVG arc paths for a proper pie feel
  const R = 36, CX = 50, CY = 50
  const C = 2 * Math.PI * R
  let offset = 0

  return (
    <div className="flex flex-col gap-5">
      {/* Ring chart with total in center */}
      <div className="flex justify-center">
        <div className="relative">
          <svg viewBox="0 0 100 100" className="w-56 h-56 -rotate-90">
            <circle cx={CX} cy={CY} r={R} stroke="#f8fafc" strokeWidth="10" fill="none" />
            {sorted.map(d => {
              const meta = STATUS_META[d.status]
              const len  = (d.pct / 100) * C
              const gap  = 1.5
              const el = (
                <circle
                  key={d.status}
                  cx={CX} cy={CY} r={R}
                  stroke={meta?.color ?? "#94a3b8"}
                  strokeWidth="10"
                  fill="none"
                  strokeDasharray={`${Math.max(len - gap, 0)} ${C}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="round"
                />
              )
              offset += len
              return el
            })}
          </svg>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0 pointer-events-none">
            <span className="text-3xl font-bold text-slate-900 font-['Space_Mono',monospace] leading-none">{total}</span>
            <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-wide">orders</span>
          </div>
        </div>
      </div>

      {/* Legend rows */}
      <div className="space-y-2">
        {sorted.map(d => {
          const meta = STATUS_META[d.status]
          return (
            <div key={d.status} className="flex items-center gap-3">
              {/* Color bar */}
              <div className="w-1 h-7 rounded-full shrink-0" style={{ background: meta?.color ?? "#94a3b8" }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-medium text-slate-700">{meta?.label ?? d.status}</span>
                  <span className="text-xs font-bold text-slate-900 font-['Space_Mono',monospace]">{d.count}</span>
                </div>
                <div className="h-1 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${d.pct}%`, background: meta?.color ?? "#94a3b8" }}
                  />
                </div>
              </div>
              <span className="text-[11px] text-slate-400 tabular-nums w-8 text-right shrink-0">
                {d.pct.toFixed(0)}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Top products list ────────────────────────────────────────────────────────

function TopProductsList({ products }: { products: TopProduct[] }) {
  if (!products.length) {
    return <p className="text-xs text-slate-400 py-10 text-center">No sales recorded yet</p>
  }
  const max = products[0]?.revenue || 1
  return (
    <ul className="space-y-1">
      {products.map((p, i) => (
        <li key={p.id} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
          <span className={`w-6 h-6 rounded-lg grid place-content-center text-[10px] font-bold shrink-0 mt-0.5 ${
            i === 0 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-400"
          }`}>{i + 1}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <span className="text-sm text-slate-800 truncate font-medium">{p.name}</span>
              <span className="text-sm font-bold text-slate-900 shrink-0 font-['Space_Mono',monospace]">
                {fmtMoney(p.revenue)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[10px] text-slate-400 font-['Space_Mono',monospace]">
                #{p.id.slice(0, 8).toUpperCase()}
              </span>
              <span className="text-[10px] text-slate-400">{p.units} sold</span>
            </div>
            <div className="h-1 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-sky-400 rounded-full transition-all duration-700"
                style={{ width: `${(p.revenue / max) * 100}%` }}
              />
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}

// ─── Recent orders ────────────────────────────────────────────────────────────

const ORDER_BADGE: Record<string, string> = {
  pending:   "bg-amber-50 text-amber-700",
  confirmed: "bg-sky-50 text-sky-700",
  shipped:   "bg-indigo-50 text-indigo-700",
  delivered: "bg-emerald-50 text-emerald-700",
  completed: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-rose-50 text-rose-600",
}

function RecentOrdersList({
  orders,
}: { orders: { orderNumber: string; customerName: string; total: number; status: string }[] }) {
  if (!orders.length) {
    return <p className="text-xs text-slate-400 py-10 text-center">No recent orders</p>
  }
  return (
    <div className="space-y-1">
      {orders.map((o, i) => (
        <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
          <div className="w-8 h-8 rounded-full bg-slate-100 grid place-content-center shrink-0">
            <ShoppingCart size={13} className="text-slate-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">{o.customerName}</p>
            <p className="text-[10px] text-slate-400 font-['Space_Mono',monospace]">{o.orderNumber}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-bold text-slate-900 font-['Space_Mono',monospace]">{fmtMoney(o.total)}</p>
            <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${ORDER_BADGE[o.status] ?? "bg-slate-100 text-slate-500"}`}>
              {o.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Low-stock horizontal bar chart ───────────────────────────────────────────

function LowStockChart({ products }: { products: LowStockProduct[] }) {
  if (!products.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2">
        <Package size={24} className="text-emerald-300" />
        <p className="text-xs text-slate-400">All products well stocked</p>
      </div>
    )
  }
  const cap = Math.max(...products.map(p => p.stock), 10)
  return (
    <div className="space-y-3">
      {products.map(p => {
        const pct      = p.stock === 0 ? 100 : (p.stock / cap) * 100
        const isOut    = p.stock === 0
        const isLow    = !isOut && p.stock <= 5
        const barColor = isOut ? "bg-rose-400" : isLow ? "bg-amber-400" : "bg-yellow-300"
        const valColor = isOut ? "text-rose-600 font-bold" : isLow ? "text-amber-600 font-semibold" : "text-slate-500"
        return (
          <div key={p.name}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-slate-700 truncate max-w-[72%] leading-none">{p.name}</span>
              <span className={`text-[11px] tabular-nums font-['Space_Mono',monospace] ${valColor}`}>
                {isOut ? "0 — out" : p.stock}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                style={{ width: `${Math.max(pct, 4)}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Segmentation ─────────────────────────────────────────────────────────────

const CLUSTER_DOTS = [
  "bg-sky-500", "bg-violet-500", "bg-emerald-500", "bg-amber-500",
  "bg-rose-500", "bg-indigo-500", "bg-teal-500",   "bg-fuchsia-500",
]

const CUSTOMER_CLUSTERS = [
  { name: "Champions",          pct: 18, dot: "bg-emerald-500", soft: "bg-emerald-50", text: "text-emerald-700", desc: "Recent · frequent · top spend",   ltv: "EGP 24.8K" },
  { name: "Loyal",              pct: 26, dot: "bg-sky-500",     soft: "bg-sky-50",     text: "text-sky-700",     desc: "Consistent repeat buyers",        ltv: "EGP 12.3K" },
  { name: "Potential loyalist", pct: 17, dot: "bg-violet-500",  soft: "bg-violet-50",  text: "text-violet-700",  desc: "Recent, growing engagement",      ltv: "EGP 6.1K"  },
  { name: "At risk",            pct: 14, dot: "bg-amber-500",   soft: "bg-amber-50",   text: "text-amber-700",   desc: "Slipping — win them back",         ltv: "EGP 9.4K"  },
  { name: "Dormant",            pct: 15, dot: "bg-slate-400",   soft: "bg-slate-100",  text: "text-slate-600",   desc: "No activity in 90+ days",         ltv: "EGP 3.2K"  },
  { name: "New",                pct: 10, dot: "bg-rose-500",    soft: "bg-rose-50",    text: "text-rose-700",    desc: "First purchase this month",       ltv: "EGP 1.8K"  },
]

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [data,       setData]       = useState<MetricsData | null>(null)
  const [segments,   setSegments]   = useState<SegmentsData | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [period,     setPeriod]     = useState<RevenuePeriod>("year")
  const [revPoints,  setRevPoints]  = useState<{ label: string; value: number }[]>([])
  const [revLoading, setRevLoading] = useState(false)

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

  const loadRevenue = useCallback(async (p: RevenuePeriod) => {
    setRevLoading(true)
    try {
      const res = await fetch(`/api/metrics/revenue?period=${p}`)
      if (!res.ok) throw new Error()
      const json = await res.json()
      setRevPoints(json.points ?? [])
    } catch {
      setRevPoints([])
    } finally {
      setRevLoading(false)
    }
  }, [])

  useEffect(() => { loadMetrics() }, [])
  useEffect(() => { loadRevenue(period) }, [period, loadRevenue])

  useEffect(() => {
    fetch("/api/segments/product")
      .then(r => r.ok ? r.json() : null)
      .then(setSegments)
      .catch(() => {})
  }, [])

  const metrics       = data?.metrics       ?? []
  const orderMix      = data?.orderMix      ?? []
  const recent        = data?.recent        ?? []
  const topProducts   = data?.topProducts   ?? []
  const inventory     = data?.inventory     ?? { outOfStock: 0, lowStock: 0 }
  const lowStockProds = data?.lowStockProducts ?? []
  const stockIssues   = inventory.outOfStock + inventory.lowStock

  const warningMsg = useMemo(() => {
    if (!data) return null
    if (inventory.outOfStock > 0 && inventory.lowStock > 0)
      return `${inventory.outOfStock} product${inventory.outOfStock > 1 ? "s" : ""} out of stock · ${inventory.lowStock} running low — review your inventory now.`
    if (inventory.outOfStock > 0)
      return `${inventory.outOfStock} product${inventory.outOfStock > 1 ? "s are" : " is"} out of stock — restock immediately.`
    if (inventory.lowStock > 0)
      return `${inventory.lowStock} product${inventory.lowStock > 1 ? "s are" : " is"} running low — reorder soon.`
    return null
  }, [data, inventory])

  return (
    <div className="min-h-screen bg-slate-50/40">
      <div className="px-6 py-8 max-w-7xl mx-auto space-y-6">

        {/* ── Title ───────────────────────────────────────────────────────── */}
        <Reveal>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
              <p className="text-sm text-slate-400 mt-1">
                {new Date().toLocaleDateString("en-EG", {
                  weekday: "long", year: "numeric", month: "long", day: "numeric",
                })}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href="/dashboard/products?new=1"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-sky-200 hover:text-sky-700 transition-colors shadow-sm"
              >
                <Plus size={14} />
                <span className="hidden sm:inline">New product</span>
              </Link>
              <Link
                href="/dashboard/orders?new=1"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-sky-200 hover:text-sky-700 transition-colors shadow-sm"
              >
                <ShoppingCart size={14} />
                <span className="hidden sm:inline">New order</span>
              </Link>
              <button
                onClick={() => setUploadOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-sky-500 rounded-xl hover:bg-sky-600 transition-colors shadow-sm"
              >
                <Upload size={14} />
                Upload dataset
              </button>
            </div>
          </div>
        </Reveal>

        <UploadDatasetModal open={uploadOpen} onClose={() => setUploadOpen(false)} />

        {/* ── Warning banner ───────────────────────────────────────────────── */}
        {!loading && warningMsg && (
          <Reveal className="block">
            <Link
              href="/dashboard/products"
              className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 hover:bg-amber-100/70 transition-colors"
            >
              <div className="p-1.5 rounded-lg bg-amber-100 shrink-0">
                <AlertTriangle size={15} className="text-amber-600" />
              </div>
              <p className="text-sm text-amber-900 flex-1">{warningMsg}</p>
              <ChevronRight size={15} className="text-amber-500 shrink-0" />
            </Link>
          </Reveal>
        )}

        {/* ── 4 stat cards ─────────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-36 rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <Card className="p-8 text-center">
            <AlertTriangle size={24} className="text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-600 font-medium">Couldn&apos;t load your metrics.</p>
            <button
              onClick={loadMetrics}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 text-slate-700 hover:border-sky-200 hover:text-sky-700 transition-colors"
            >
              <RefreshCw size={13} /> Retry
            </button>
          </Card>
        ) : (
          <Reveal delay={60}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {metrics.map((m, i) => <StatCard key={i} m={m} />)}
            </div>
          </Reveal>
        )}

        {/* ── Top products (left) + Revenue chart (right) ───────────────────── */}
        <Reveal delay={120}>
          <div className="grid lg:grid-cols-5 gap-6">

            {/* Top products */}
            <Card className="lg:col-span-2 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-50">
                    <Trophy size={14} className="text-amber-600" />
                  </div>
                  <h2 className="text-sm font-semibold text-slate-900">Top products by revenue</h2>
                </div>
                <Link
                  href="/dashboard/products"
                  className="text-xs font-medium text-sky-600 hover:text-sky-700 inline-flex items-center gap-0.5"
                >
                  View all <ChevronRight size={12} />
                </Link>
              </div>
              {loading
                ? <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 rounded-xl bg-slate-50 animate-pulse" />)}</div>
                : <TopProductsList products={topProducts} />
              }
            </Card>

            {/* Revenue chart with period filter */}
            <Card className="lg:col-span-3 p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Revenue growth</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {period === "week" ? "Last 7 days (daily)" : period === "month" ? "Last 4 weeks (weekly)" : "Last 12 months"}
                  </p>
                </div>
                <div className="flex items-center gap-0.5 bg-slate-100 rounded-xl p-1">
                  {(["week", "month", "year"] as RevenuePeriod[]).map(p => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all capitalize ${
                        period === p
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              {revLoading
                ? <div className="h-[300px] rounded-xl bg-slate-50 animate-pulse" />
                : <RevenueLineChart points={revPoints} />
              }
            </Card>
          </div>
        </Reveal>

        {/* ── Order status | Recent orders | Low stock ──────────────────────── */}
        <Reveal delay={180}>
          <div className="grid lg:grid-cols-3 gap-6">

            {/* Order status donut */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="p-1.5 rounded-lg bg-sky-50">
                  <Activity size={14} className="text-sky-600" />
                </div>
                <h2 className="text-sm font-semibold text-slate-900">Order status</h2>
              </div>
              {loading
                ? <div className="h-40 rounded-xl bg-slate-50 animate-pulse" />
                : <OrderStatusPie data={orderMix} />
              }
            </Card>

            {/* Recent orders */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-violet-50">
                    <ShoppingCart size={14} className="text-violet-600" />
                  </div>
                  <h2 className="text-sm font-semibold text-slate-900">Recent orders</h2>
                </div>
                <Link href="/dashboard/orders" className="text-xs font-medium text-sky-600 hover:text-sky-700">
                  View all
                </Link>
              </div>
              {loading
                ? <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-11 rounded-xl bg-slate-50 animate-pulse" />)}</div>
                : <RecentOrdersList orders={recent} />
              }
            </Card>

            {/* Low stock bar chart */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-rose-50">
                    <Package size={14} className="text-rose-500" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">Low stock</h2>
                    {stockIssues > 0 && (
                      <p className="text-[10px] text-rose-500 font-medium mt-0.5">
                        {stockIssues} item{stockIssues > 1 ? "s" : ""} need attention
                      </p>
                    )}
                  </div>
                </div>
                <Link href="/dashboard/products" className="text-xs font-medium text-sky-600 hover:text-sky-700">
                  Manage
                </Link>
              </div>
              {loading
                ? <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-7 rounded-xl bg-slate-50 animate-pulse" />)}</div>
                : <LowStockChart products={lowStockProds} />
              }
            </Card>
          </div>
        </Reveal>

        {/* ── Product segmentation ──────────────────────────────────────────── */}
        <Reveal delay={240}>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-sky-50">
                  <Sparkles size={14} className="text-sky-600" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Product segmentation</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {segments?.lastJobAt
                      ? `Updated ${new Date(segments.lastJobAt).toLocaleDateString()}`
                      : "AI-driven product clusters"}
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/segments"
                className="text-xs font-medium text-sky-600 hover:text-sky-700 inline-flex items-center gap-0.5"
              >
                View all <ChevronRight size={12} />
              </Link>
            </div>

            {!segments ? (
              <div className="h-24 grid place-content-center">
                <span className="inline-flex items-center gap-2 text-xs text-slate-400">
                  <RefreshCw size={13} className="animate-spin text-sky-300" /> Loading insights…
                </span>
              </div>
            ) : !segments.hasResults ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
                <Layers size={20} className="text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-700">
                  {segments.productCount < segments.minProductsNeeded
                    ? `Add at least ${segments.minProductsNeeded} products to unlock`
                    : "Run segmentation to discover product clusters"}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  You currently have {segments.productCount} product{segments.productCount !== 1 ? "s" : ""}.
                </p>
                <Link
                  href="/dashboard/segments"
                  className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 text-sm font-medium rounded-lg bg-sky-500 text-white hover:bg-sky-600 transition-colors"
                >
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
                    <div key={c.cluster} className="rounded-xl border border-slate-100 p-3.5 hover:border-sky-200 transition-colors">
                      <div className="flex items-center gap-2 mb-2.5 min-w-0">
                        <span className={`w-2.5 h-2.5 rounded-sm shrink-0 ${CLUSTER_DOTS[c.cluster % CLUSTER_DOTS.length]}`} />
                        <span className="text-sm font-semibold text-slate-900 truncate flex-1">{c.clusterName}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wide bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded shrink-0">
                          {c.numProducts}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px]">
                        <div>
                          <p className="text-slate-400">Avg margin</p>
                          <p className={`font-medium ${c.avgMargin != null && c.avgMargin < 0 ? "text-rose-600" : "text-slate-700"}`}>
                            {fmtMarginPct(c.avgMargin)}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400">Revenue share</p>
                          <p className="font-medium text-slate-700">{fmtSharePct(c.revenueSharePct)}</p>
                        </div>
                        {c.totalRevenue != null && (
                          <div className="col-span-2">
                            <p className="text-slate-400">Total revenue</p>
                            <p className="font-medium text-slate-700">{fmtMoney(c.totalRevenue)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </Card>
        </Reveal>

        {/* ── Customer segmentation (preview) ───────────────────────────────── */}
        <Reveal delay={300}>
          <Card className="p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-violet-50">
                  <Users size={14} className="text-violet-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-slate-900">Customer segmentation</h2>
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                      Preview
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Sample distribution — activates with your customer history
                  </p>
                </div>
              </div>
            </div>

            {/* Distribution bar */}
            <div className="flex h-2.5 rounded-full overflow-hidden bg-slate-100 mb-5">
              {CUSTOMER_CLUSTERS.map(s => (
                <div
                  key={s.name}
                  className={`${s.dot} h-full`}
                  style={{ width: `${s.pct}%` }}
                  title={`${s.name}: ${s.pct}%`}
                />
              ))}
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {CUSTOMER_CLUSTERS.map(s => (
                <div key={s.name} className="rounded-xl border border-slate-100 p-3.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2.5 h-2.5 rounded-sm ${s.dot} shrink-0`} />
                      <span className="text-sm font-semibold text-slate-900 truncate">{s.name}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${s.soft} ${s.text}`}>
                      {s.pct}%
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">{s.desc}</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Avg LTV <span className="font-semibold text-slate-700">{s.ltv}</span>
                  </p>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-400 mt-4 flex items-center gap-1.5">
              <BarChart3 size={11} className="text-slate-300" />
              Figures shown are illustrative samples. Connect order history to compute live RFM segments.
            </p>
          </Card>
        </Reveal>

      </div>
    </div>
  )
}
