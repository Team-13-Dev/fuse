"use client"

import { useEffect, useState } from "react"
import {
  Sparkles, RefreshCw, Layers, TrendingUp, Package,
  Users, ChevronDown, ChevronRight, AlertTriangle, Lock,
  ArrowUpRight, ArrowDownRight, Crown,
} from "lucide-react"
import { useToast } from "@/hooks/useToast"
import { useBusinessRole } from "@/hooks/useBusinessRole"
import type { SegmentsResponse, ProductClusterSummary } from "@/lib/jobs/types"

// ─── Cluster palette (matches products page) ────────────────────────────────

const CLUSTER_COLORS = [
  { bg: "bg-sky-500",     soft: "bg-sky-50",     text: "text-sky-700",     ring: "ring-sky-200"     },
  { bg: "bg-violet-500",  soft: "bg-violet-50",  text: "text-violet-700",  ring: "ring-violet-200"  },
  { bg: "bg-emerald-500", soft: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200" },
  { bg: "bg-amber-500",   soft: "bg-amber-50",   text: "text-amber-700",   ring: "ring-amber-200"   },
  { bg: "bg-rose-500",    soft: "bg-rose-50",    text: "text-rose-700",    ring: "ring-rose-200"    },
  { bg: "bg-indigo-500",  soft: "bg-indigo-50",  text: "text-indigo-700",  ring: "ring-indigo-200"  },
  { bg: "bg-teal-500",    soft: "bg-teal-50",    text: "text-teal-700",    ring: "ring-teal-200"    },
  { bg: "bg-fuchsia-500", soft: "bg-fuchsia-50", text: "text-fuchsia-700", ring: "ring-fuchsia-200" },
]

const colorFor = (cluster: number) => CLUSTER_COLORS[cluster % CLUSTER_COLORS.length]

// ─── Cluster card ────────────────────────────────────────────────────────────

function ClusterCard({
  cluster, total,
}: {
  cluster: ProductClusterSummary
  total:   number
}) {
  const [expanded, setExpanded] = useState(false)
  const c = colorFor(cluster.cluster)

  const sharePct = (cluster.numProducts / Math.max(total, 1)) * 100

  return (
    <div className={`bg-white rounded-2xl border border-slate-100 overflow-hidden transition-all ${expanded ? "shadow-md" : "hover:shadow-sm"}`}>

      {/* Header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full text-left p-5 flex items-start gap-4"
      >
        {/* Color dot */}
        <div className={`w-10 h-10 rounded-xl ${c.bg} grid place-content-center shrink-0`}>
          <Layers size={18} className="text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h3 className="text-base font-semibold text-slate-900 truncate">{cluster.clusterName}</h3>
            <ChevronDown size={16}
              className={`text-slate-400 transition-transform shrink-0 ${expanded ? "rotate-180" : ""}`} />
          </div>

          {/* Quick stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Products" value={cluster.numProducts.toString()} sub={`${sharePct.toFixed(1)}% of catalog`} />
            <Stat
              label="Avg margin"
              value={cluster.avgMargin != null ? `${cluster.avgMargin.toFixed(1)}%` : "—"}
            />
            <Stat
              label="Revenue share"
              value={cluster.revenueSharePct != null ? `${cluster.revenueSharePct.toFixed(1)}%` : "—"}
            />
            <Stat
              label="Profit share"
              value={cluster.profitSharePct != null ? `${cluster.profitSharePct.toFixed(1)}%` : "—"}
            />
          </div>

          {/* Mini share bar */}
          <div className="mt-3 h-1 rounded-full bg-slate-100 overflow-hidden">
            <div className={`h-full ${c.bg} transition-all`} style={{ width: `${Math.min(sharePct, 100)}%` }} />
          </div>
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-5 pb-5 pt-0 border-t border-slate-50 mt-1">
          <div className="grid sm:grid-cols-2 gap-6 pt-5">

            {/* Numeric details */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Cluster details</h4>
              <dl className="space-y-2 text-sm">
                <Row label="Avg price"     value={fmtMoney(cluster.avgPrice)} />
                <Row label="Avg cost"      value={fmtMoney(cluster.avgCost)} />
                <Row label="Avg stock"     value={cluster.avgStock != null ? cluster.avgStock.toFixed(0) : "—"} />
                <Row label="Avg quantity"  value={cluster.avgQuantity != null ? cluster.avgQuantity.toFixed(0) : "—"} />
                <Row label="Total revenue" value={fmtMoney(cluster.totalRevenue)} />
                <Row label="Total profit"  value={fmtMoney(cluster.totalProfit)} />
              </dl>
            </div>

            {/* Top / bottom products */}
            <div className="space-y-4">
              {cluster.topProducts && cluster.topProducts.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
                    <Crown size={11} className="text-amber-500" /> Top performers
                  </h4>
                  <ul className="space-y-1.5">
                    {cluster.topProducts.slice(0, 3).map((p, i) => (
                      <li key={i} className="flex items-center justify-between text-xs">
                        <span className="text-slate-700 truncate">{String(p.product_id).slice(0, 8)}…</span>
                        <span className="text-emerald-600 font-medium ml-2">{fmtMoney(p.profit ?? 0)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {cluster.bottomProducts && cluster.bottomProducts.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
                    <ArrowDownRight size={11} className="text-rose-500" /> Underperformers
                  </h4>
                  <ul className="space-y-1.5">
                    {cluster.bottomProducts.slice(0, 3).map((p, i) => (
                      <li key={i} className="flex items-center justify-between text-xs">
                        <span className="text-slate-700 truncate">{String(p.product_id).slice(0, 8)}…</span>
                        <span className="text-rose-600 font-medium ml-2">
                          {p.profit_margin != null ? `${Number(p.profit_margin).toFixed(1)}%` : "—"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-slate-400 font-medium">{label}</p>
      <p className="text-sm font-semibold text-slate-900 mt-0.5">{value}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-800">{value}</dd>
    </div>
  )
}

function fmtMoney(v: number | null | undefined): string {
  if (v == null || isNaN(Number(v))) return "—"
  const n = Number(v)
  if (Math.abs(n) >= 1_000_000) return `EGP ${(n / 1_000_000).toFixed(2)}M`
  if (Math.abs(n) >= 1_000)     return `EGP ${(n / 1_000).toFixed(1)}K`
  return `EGP ${n.toLocaleString("en-EG", { maximumFractionDigits: 0 })}`
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = "products" | "customers"

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SegmentsPage() {
  const role     = useBusinessRole()
  const canWrite = role === "owner" || role === "manager"

  const [tab,        setTab]        = useState<Tab>("products")
  const [segments,   setSegments]   = useState<SegmentsResponse | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { toasts, push } = useToast()

  useEffect(() => {
    fetch("/api/segments/product")
      .then(r => r.ok ? r.json() : null)
      .then(d => { setSegments(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function handleRefresh() {
    setRefreshing(true)
    try {
      const res = await fetch("/api/segments/product/refresh", { method: "POST" })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        push(data.error ?? "Refresh failed — please try again later", "error")
        return
      }
      if (data.will_run === false) {
        // Pipeline correctly skipped — surface as success (the "no-op" is the right outcome).
        if (data.reason === "insufficient_products") {
          push(data.detail ?? "Not enough products to run segmentation", "success")
        } else {
          push(data.detail ?? "No re-run needed yet", "success")
        }
        return
      }
      push("Refreshing — new clusters will appear in a moment", "success")

      // Soft-poll for the updated data
      const tries = [3000, 8000, 15000]
      tries.forEach(ms => {
        setTimeout(() => {
          fetch("/api/segments/product")
            .then(r => r.ok ? r.json() : null)
            .then(d => d && setSegments(d))
            .catch(() => {})
        }, ms)
      })
    } catch {
      push("Could not reach the segmentation service", "error")
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/60 px-6 py-8 max-w-7xl mx-auto">

      {/* Toasts */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`px-4 py-3 rounded-xl shadow-lg text-sm font-medium pointer-events-auto ${
            t.type === "success" ? "bg-emerald-500 text-white"
              : t.type === "error" ? "bg-rose-500 text-white"
              : "bg-slate-900 text-white"
          }`}>{t.msg}</div>
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Segmentation</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            AI-driven groups discovered in your data, refreshed automatically as it changes.
          </p>
        </div>
        {tab === "products" && segments?.hasResults && canWrite && (
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 transition disabled:opacity-60 disabled:cursor-wait"
          >
            <Sparkles size={14} className={refreshing ? "animate-pulse" : ""} />
            {refreshing ? "Refreshing…" : "Refresh insights"}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-slate-200">
        <TabButton active={tab === "products"} onClick={() => setTab("products")} icon={Package}>
          Products
        </TabButton>
        <TabButton active={tab === "customers"} onClick={() => setTab("customers")} icon={Users} soon>
          Customers
        </TabButton>
      </div>

      {/* Content */}
      {tab === "products" ? (
        <ProductsTabContent
          segments={segments}
          loading={loading}
        />
      ) : (
        <CustomersSoonState />
      )}
    </div>
  )
}

// ─── Tab button ──────────────────────────────────────────────────────────────

function TabButton({
  active, onClick, icon: Icon, soon, children,
}: {
  active: boolean
  onClick: () => void
  icon: React.ElementType
  soon?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
        active
          ? "border-sky-500 text-sky-700"
          : "border-transparent text-slate-500 hover:text-slate-700"
      }`}
    >
      <Icon size={14} />
      {children}
      {soon && (
        <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded ml-1">
          Soon
        </span>
      )}
    </button>
  )
}

// ─── Products tab ────────────────────────────────────────────────────────────

function ProductsTabContent({
  segments, loading,
}: {
  segments: SegmentsResponse | null
  loading: boolean
}) {
  if (loading) {
    return (
      <div className="grid place-content-center py-24">
        <div className="flex items-center gap-2 text-slate-400">
          <RefreshCw size={20} className="animate-spin text-sky-300" />
          <span className="text-sm">Loading segments…</span>
        </div>
      </div>
    )
  }

  if (!segments) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
        <AlertTriangle size={32} className="text-slate-300 mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-700">Couldn't load segments right now.</p>
        <p className="text-xs text-slate-500 mt-1">Try refreshing the page.</p>
      </div>
    )
  }

  // Insufficient products
  if (segments.productCount < segments.minProductsNeeded) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
        <div className="w-12 h-12 rounded-xl bg-amber-50 grid place-content-center mx-auto mb-4">
          <Lock size={20} className="text-amber-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">Segmentation locked</h3>
        <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
          Add at least <strong>{segments.minProductsNeeded}</strong> products to unlock automated insights.
          You currently have <strong>{segments.productCount}</strong>.
        </p>
        <a
          href="/dashboard/products"
          className="inline-flex items-center gap-1.5 mt-4 px-3 py-2 text-sm font-medium rounded-xl bg-sky-500 text-white hover:bg-sky-600 transition"
        >
          Add products <ChevronRight size={14} />
        </a>
      </div>
    )
  }

  // No results yet (enough products but no run completed)
  if (!segments.hasResults) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
        <div className="w-12 h-12 rounded-xl bg-sky-50 grid place-content-center mx-auto mb-4">
          <Sparkles size={20} className="text-sky-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">First-run pending</h3>
        <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
          You have enough products to segment ({segments.productCount}). Click "Refresh insights" above to run for the first time.
        </p>
      </div>
    )
  }

  // Got results
  const totalProducts = segments.clusters.reduce((a, c) => a + c.numProducts, 0) || 1

  return (
    <div className="space-y-6">

      {/* Top summary card */}
      <div className="grid sm:grid-cols-3 gap-4">
        <SummaryStat
          label="Total clusters"
          value={segments.clusters.length.toString()}
          icon={Layers}
          accent
        />
        <SummaryStat
          label="Products segmented"
          value={totalProducts.toString()}
          icon={Package}
          sub={`Out of ${segments.productCount}`}
        />
        <SummaryStat
          label="Last updated"
          value={
            segments.lastJobAt
              ? new Date(segments.lastJobAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
              : "—"
          }
          icon={TrendingUp}
          sub={
            segments.lastJobAt
              ? new Date(segments.lastJobAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
              : "Never"
          }
        />
      </div>

      {/* Cluster cards */}
      <div className="space-y-3">
        {segments.clusters
          .slice()
          .sort((a, b) => b.numProducts - a.numProducts)
          .map(c => (
            <ClusterCard key={c.cluster} cluster={c} total={totalProducts} />
          ))}
      </div>

      {/* Methodology footer */}
      <details className="bg-white rounded-2xl border border-slate-100 p-5 open:shadow-sm transition-shadow">
        <summary className="cursor-pointer text-sm font-medium text-slate-600 hover:text-slate-800 flex items-center gap-2">
          <ChevronRight size={14} className="transition-transform group-open:rotate-90" />
          How are clusters built?
        </summary>
        <div className="mt-3 text-xs text-slate-500 leading-relaxed space-y-2 pl-5">
          <p>
            Clusters are computed using KMeans and Gaussian Mixture Models on three engineered features:
            <strong className="text-slate-700"> profit margin</strong>,
            <strong className="text-slate-700"> absolute margin</strong> (price − cost), and
            <strong className="text-slate-700"> stock turnover</strong> (units sold ÷ stock).
          </p>
          <p>
            Features are normalized with Yeo-Johnson and RobustScaler. The pipeline tries k=2 through k=10 with both
            algorithms and picks the model with the highest silhouette score.
          </p>
          <p>
            A re-run is triggered automatically when at least 5 products are added/edited or 50 new sales come in
            since the last run, with a weekly drift safety net.
          </p>
        </div>
      </details>
    </div>
  )
}

function SummaryStat({
  label, value, sub, icon: Icon, accent,
}: {
  label: string; value: string; sub?: string
  icon: React.ElementType; accent?: boolean
}) {
  return (
    <div className={`rounded-2xl p-5 border ${
      accent
        ? "bg-linear-to-br from-sky-500 to-sky-600 border-sky-500 text-white"
        : "bg-white border-slate-100 text-slate-900"
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-xl ${accent ? "bg-white/15" : "bg-sky-50"}`}>
          <Icon size={16} className={accent ? "text-white" : "text-sky-600"} />
        </div>
      </div>
      <p className={`text-2xl font-bold ${accent ? "text-white" : "text-slate-900"}`}>{value}</p>
      <p className={`text-xs mt-1 ${accent ? "text-sky-100" : "text-slate-400"}`}>{label}</p>
      {sub && <p className={`text-[11px] mt-0.5 ${accent ? "text-sky-100" : "text-slate-400"}`}>{sub}</p>}
    </div>
  )
}

// ─── Customers tab — Soon state ──────────────────────────────────────────────

function CustomersSoonState() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center max-w-2xl mx-auto">
      <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-sky-100 to-sky-200 grid place-content-center mx-auto mb-4">
        <Users size={24} className="text-sky-700" />
      </div>
      <h3 className="text-xl font-semibold text-slate-900">Customer segmentation</h3>
      <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
        Auto-cluster your customers by spending behavior, purchase frequency, and recency.
        Discover your VIPs, at-risk customers, and one-time buyers — then act on each group.
      </p>

      <div className="grid sm:grid-cols-3 gap-3 mt-8 max-w-lg mx-auto">
        {[
          { label: "Behavioral",  desc: "Frequency · Recency · Value" },
          { label: "Predictive",  desc: "Churn risk · LTV forecast" },
          { label: "Actionable",  desc: "Targeted campaigns" },
        ].map(f => (
          <div key={f.label} className="rounded-xl border border-slate-100 p-3 bg-slate-50/60">
            <p className="text-xs font-semibold text-slate-700">{f.label}</p>
            <p className="text-[11px] text-slate-500 mt-1">{f.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full">
        <Sparkles size={11} />
        Coming soon
      </div>
    </div>
  )
}