"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import {
  ArrowUpRight, ArrowDownRight, TrendingUp, Users, Package, Tag,
  ShoppingCart, BarChart3, Activity, Sparkles, Upload, Plus,
  BotMessageSquare, ChevronRight, Layers,
} from "lucide-react"
import  UploadDatasetModal from "@/app/components/dashboard/UploadDatasetModal"

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

type SegmentsResponse = {
  hasResults:        boolean
  productCount:      number
  minProductsNeeded: number
  lastJobAt:         string | null
  segments:          { productId: string; cluster: number; clusterName: string }[]
  clusters:          {
    cluster:          number
    clusterName:      string
    numProducts:      number
    avgMargin:        number | null
    revenueSharePct:  number | null
    profitSharePct:   number | null
    totalRevenue:     number | null
  }[]
}

// ─── Quick actions ────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { label: "New product",  href: "/dashboard/products?new=1", icon: Plus },
  { label: "New order",    href: "/dashboard/orders?new=1",   icon: ShoppingCart },
]

// ─── Small reusable bits ──────────────────────────────────────────────────────

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${className}`}>
      {children}
    </div>
  )
}

function Sparkline({ up }: { up: boolean }) {
  // Tiny inline sparkline — purely decorative, scales with text color.
  const path = up
    ? "M2 14 L8 10 L14 12 L20 6 L26 8 L32 4"
    : "M2 4 L8 8 L14 6 L20 12 L26 10 L32 14"
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
            m.up
              ? isAccent ? "text-emerald-200" : "text-emerald-600"
              : isAccent ? "text-rose-200"   : "text-rose-500"
          }`}>
            {m.up ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
            {m.change}
          </span>
          <span className={`text-xs ${isAccent ? "text-sky-100" : "text-slate-400"}`}>{m.sub}</span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-auto">
        <p className={`text-xs font-medium ${isAccent ? "text-sky-100" : "text-slate-500"}`}>{m.label}</p>
        {m.href && !isAccent && (
          <ArrowUpRight size={13} className="text-slate-300 group-hover:text-sky-500 transition-colors" />
        )}
      </div>
    </div>
  )

  return m.href ? (
    <Link href={m.href} className="block h-full">{inner}</Link>
  ) : (
    <div className="h-full">{inner}</div>
  )
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

// ─── Revenue chart (pure SVG, no external deps) ──────────────────────────────

function RevenueChart({ points }: { points: { label: string; value: number }[] }) {
  const W = 520, H = 180, P = 24
  const max = Math.max(...points.map(p => p.value), 1)
  const stepX = (W - P * 2) / Math.max(points.length - 1, 1)

  const coords = points.map((p, i) => ({
    x: P + i * stepX,
    y: H - P - (p.value / max) * (H - P * 2),
    ...p,
  }))

  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ")
  const areaPath = `${linePath} L ${coords[coords.length - 1]?.x ?? P} ${H - P} L ${P} ${H - P} Z`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-44">
      <defs>
        <linearGradient id="rev-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#0ea5e9" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* horizontal grid */}
      {[0.25, 0.5, 0.75].map(t => (
        <line key={t} x1={P} x2={W - P} y1={P + t * (H - P * 2)} y2={P + t * (H - P * 2)}
          stroke="#f1f5f9" strokeWidth="1" />
      ))}
      <path d={areaPath} fill="url(#rev-grad)" />
      <path d={linePath} fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinejoin="round" />
      {coords.map((c) => (
        <circle key={c.label} cx={c.x} cy={c.y} r="3" fill="#fff" stroke="#0ea5e9" strokeWidth="1.5" />
      ))}
      {coords.map((c, i) => (
        <text key={i} x={c.x} y={H - 6} fontSize="10" textAnchor="middle" fill="#94a3b8">
          {c.label}
        </text>
      ))}
    </svg>
  )
}

// ─── Order status donut ───────────────────────────────────────────────────────

function StatusDonut({ data }: { data: OrderStatusBreakdown[] }) {
  const colors: Record<string, string> = {
    pending:   "#f59e0b",
    confirmed: "#0ea5e9",
    shipped:   "#6366f1",
    delivered: "#10b981",
    cancelled: "#ef4444",
  }
  const C = 2 * Math.PI * 38 // circumference
  let offset = 0
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 100 100" className="w-28 h-28 -rotate-90">
        <circle cx="50" cy="50" r="38" stroke="#f1f5f9" strokeWidth="14" fill="none" />
        {data.map(d => {
          const len = (d.pct / 100) * C
          const circle = (
            <circle
              key={d.status}
              cx="50" cy="50" r="38"
              stroke={colors[d.status] ?? "#94a3b8"}
              strokeWidth="14"
              fill="none"
              strokeDasharray={`${len} ${C}`}
              strokeDashoffset={-offset}
            />
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

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [metrics,    setMetrics]    = useState<Metric[]>([])
  const [revenue,    setRevenue]    = useState<{ label: string; value: number }[]>([])
  const [orderMix,   setOrderMix]   = useState<OrderStatusBreakdown[]>([])
  const [recent,     setRecent]     = useState<{ orderNumber: string; customerName: string; total: number; status: string }[]>([])
  const [segments,   setSegments]   = useState<SegmentsResponse | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [uploadOpen, setUploadOpen] = useState(false)

  const greeting = useMemo(() => {
    const h = new Date().getHours()
    if (h < 12)  return "Good morning"
    if (h < 18) return "Good afternoon"
    return "Good evening"
  }, [])

  // Fetch metrics
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/metrics")
        if (!res.ok) throw new Error()
        const d = await res.json()
        setMetrics(d.metrics ?? [])
        setRevenue(d.revenue ?? [])
        setOrderMix(d.orderMix ?? [])
        setRecent(d.recent  ?? [])
      } catch {
        // Soft-fail: empty dashboard rather than crashing.
        setMetrics([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Fetch segmentation (background — not blocking)
  useEffect(() => {
    fetch("/api/segments/product")
      .then(r => r.ok ? r.json() : null)
      .then(setSegments)
      .catch(() => {})
  }, [])

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="px-6 py-8 max-w-7xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{greeting} 👋</p>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">Overview</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {QUICK_ACTIONS.map(a => (
            <Link
              key={a.label}
              href={a.href}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-sky-200 hover:text-sky-700 transition-colors"
            >
              <a.icon size={14} />
              <span className="hidden sm:inline">{a.label}</span>
            </Link>
          ))}
          <button
            onClick={() => setUploadOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-sky-500 rounded-xl hover:bg-sky-600 transition-colors shadow-sm"
          >
            <Upload size={14} />
            Upload dataset
          </button>
        </div>
      </div>

      <UploadDatasetModal open={uploadOpen} onClose={() => setUploadOpen(false)} />

      {/* Metric cards */}
      {loading ? <MetricSkeleton /> : (
        metrics.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((m, i) => <MetricCard key={i} m={m} />)}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-sm text-slate-500">
              No data yet — upload a dataset to see your metrics.
            </p>
          </Card>
        )
      )}

      {/* Revenue chart + order mix */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Revenue overview</h2>
              <p className="text-xs text-slate-400 mt-0.5">Last 6 months</p>
            </div>
            <div className="inline-flex items-center gap-1 text-xs bg-sky-50 text-sky-700 font-medium px-2.5 py-1 rounded-full">
              <TrendingUp size={11} />
              Live
            </div>
          </div>
          {revenue.length > 0
            ? <RevenueChart points={revenue} />
            : <div className="h-44 grid place-content-center text-xs text-slate-400">No revenue data yet</div>}
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900">Order status</h2>
            <Activity size={14} className="text-slate-300" />
          </div>
          {orderMix.length > 0
            ? <StatusDonut data={orderMix} />
            : <p className="text-xs text-slate-400 py-12 text-center">No orders yet</p>}
        </Card>
      </div>

      {/* ML Insights + Recent activity */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Product segmentation insights */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
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
              className="text-xs font-medium text-sky-600 hover:text-sky-700 inline-flex items-center gap-1"
            >
              View all <ChevronRight size={12} />
            </Link>
          </div>

          {!segments ? (
            <div className="h-32 grid place-content-center text-xs text-slate-400">Loading insights…</div>
          ) : !segments.hasResults ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
              <Layers size={20} className="text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">
                {segments.productCount < segments.minProductsNeeded
                  ? `Add at least ${segments.minProductsNeeded} products to unlock`
                  : "Segmentation will run on your next data update"}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                You currently have {segments.productCount} product{segments.productCount === 1 ? "" : "s"}.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {segments.clusters.slice(0, 4).map(c => (
                <div key={c.cluster} className="rounded-xl border border-slate-100 p-3 hover:border-sky-200 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-slate-900 truncate">{c.clusterName}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wide bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded">
                      {c.numProducts}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <p className="text-slate-400">Avg margin</p>
                      <p className="font-medium text-slate-700">
                        {c.avgMargin != null ? `${c.avgMargin.toFixed(1)}%` : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">Revenue share</p>
                      <p className="font-medium text-slate-700">
                        {c.revenueSharePct != null ? `${c.revenueSharePct.toFixed(1)}%` : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent activity */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900">Recent orders</h2>
            <Link href="/dashboard/orders" className="text-xs text-sky-600 hover:text-sky-700">All</Link>
          </div>
          <div className="space-y-3">
            {recent.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">No recent orders</p>
            ) : recent.slice(0, 5).map((o, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="min-w-0">
                  <p className="font-medium text-slate-800 truncate">{o.customerName ?? "Customer"}</p>
                  <p className="text-slate-400 truncate">{o.orderNumber ?? `#${i + 1}`}</p>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <p className="font-medium text-slate-800">EGP {Number(o.total).toLocaleString()}</p>
                  <p className="text-[10px] text-slate-400 capitalize">{o.status}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* AI tools row: chatbot + customer segmentation soon */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Chatbot */}
        <Link href="/chatbot" className="block">
          <Card className="p-6 hover:border-sky-200 transition-colors h-full">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-linear-to-br from-sky-50 to-sky-100">
                <BotMessageSquare size={20} className="text-sky-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">AI Assistant</h3>
                  <ArrowUpRight size={14} className="text-slate-300" />
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Ask questions about your data — sales trends, top products, customer behavior. Get instant answers.
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-sky-700 bg-sky-50 px-2 py-1 rounded-md">
                  <Sparkles size={11} />
                  Powered by your data
                </div>
              </div>
            </div>
          </Card>
        </Link>

        {/* Customer Segmentation — Soon */}
        <Card className="p-6 relative overflow-hidden">
          <div className="absolute top-3 right-3">
            <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
              Soon
            </span>
          </div>
          <div className="flex items-start gap-4 opacity-70">
            <div className="p-3 rounded-xl bg-slate-100">
              <Users size={20} className="text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-slate-700">Customer segmentation</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Auto-cluster your customers by behavior — VIPs, at-risk, new, dormant. Personalized campaigns coming soon.
              </p>
              <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-slate-500">
                <BarChart3 size={11} />
                In development
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* CRM quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Customers",  href: "/dashboard/customers",  icon: Users,   desc: "Manage your customer base" },
          { label: "Products",   href: "/dashboard/products",   icon: Package, desc: "Catalog, pricing & stock" },
          { label: "Categories", href: "/dashboard/categories", icon: Tag,     desc: "Organise your catalog" },
        ].map(c => {
          const Icon = c.icon
          return (
            <Link key={c.label} href={c.href} className="group">
              <Card className="p-5 hover:border-sky-200 transition-colors h-full">
                <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center mb-3 group-hover:bg-sky-100 transition-colors">
                  <Icon size={18} className="text-sky-600" />
                </div>
                <p className="text-sm font-semibold text-slate-900">{c.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{c.desc}</p>
                <div className="flex items-center gap-1 mt-3 text-xs text-sky-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  Go to {c.label} <ArrowUpRight size={11} />
                </div>
              </Card>
            </Link>
          )
        })}
      </div>

    </div>
  )
}