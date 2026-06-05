"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import {
  Sparkles, Layers, TrendingUp, Package,
  Users, ChevronDown, ChevronRight, AlertTriangle, Lock,
  ArrowDownRight, Crown, Boxes, Banknote, Gauge,
  Clock, ShoppingBag, Wallet, Mail, Gift, CalendarClock,
} from "lucide-react"
import { useToast } from "@/hooks/useToast"
import { useBusinessRole } from "@/hooks/useBusinessRole"
import { ProductDetailDialog } from "@/app/components/crm/products/ProductDetailDialog"
import type { Product } from "@/app/components/crm/products/ProductDialog"
import type {
  SegmentsResponse, ProductClusterSummary,
  CustomerSegmentsResponse, CustomerClusterSummary,
} from "@/lib/jobs/types"

// ─── Product cluster palette ──────────────────────────────────────────────────

const CLUSTER_COLORS = [
  { dot: "bg-sky-500",     soft: "bg-sky-50",     text: "text-sky-700",     bar: "bg-sky-400",     hex: "#0ea5e9" },
  { dot: "bg-violet-500",  soft: "bg-violet-50",  text: "text-violet-700",  bar: "bg-violet-400",  hex: "#8b5cf6" },
  { dot: "bg-emerald-500", soft: "bg-emerald-50", text: "text-emerald-700", bar: "bg-emerald-400", hex: "#10b981" },
  { dot: "bg-amber-500",   soft: "bg-amber-50",   text: "text-amber-700",   bar: "bg-amber-400",   hex: "#f59e0b" },
  { dot: "bg-rose-500",    soft: "bg-rose-50",    text: "text-rose-700",    bar: "bg-rose-400",    hex: "#f43f5e" },
  { dot: "bg-indigo-500",  soft: "bg-indigo-50",  text: "text-indigo-700",  bar: "bg-indigo-400",  hex: "#6366f1" },
  { dot: "bg-teal-500",    soft: "bg-teal-50",    text: "text-teal-700",    bar: "bg-teal-400",    hex: "#14b8a6" },
  { dot: "bg-fuchsia-500", soft: "bg-fuchsia-50", text: "text-fuchsia-700", bar: "bg-fuchsia-400", hex: "#d946ef" },
]

const clusterColorFor = (cluster: number) => CLUSTER_COLORS[cluster % CLUSTER_COLORS.length]

// ─── Customer segment palette (by name — stable across runs) ──────────────────

const SEGMENT_PALETTE: Record<string, { dot: string; soft: string; text: string; bar: string }> = {
  "Champions":         { dot: "bg-amber-500",   soft: "bg-amber-50",   text: "text-amber-700",   bar: "bg-amber-400"   },
  "Loyal Customers":   { dot: "bg-emerald-500", soft: "bg-emerald-50", text: "text-emerald-700", bar: "bg-emerald-400" },
  "High Value":        { dot: "bg-teal-500",    soft: "bg-teal-50",    text: "text-teal-700",    bar: "bg-teal-400"    },
  "Promising":         { dot: "bg-sky-500",     soft: "bg-sky-50",     text: "text-sky-700",     bar: "bg-sky-400"     },
  "New Customers":     { dot: "bg-violet-500",  soft: "bg-violet-50",  text: "text-violet-700",  bar: "bg-violet-400"  },
  "Active Customers":  { dot: "bg-green-500",   soft: "bg-green-50",   text: "text-green-700",   bar: "bg-green-400"   },
  "Need Attention":    { dot: "bg-orange-500",  soft: "bg-orange-50",  text: "text-orange-700",  bar: "bg-orange-400"  },
  "At-Risk":           { dot: "bg-rose-500",    soft: "bg-rose-50",    text: "text-rose-700",    bar: "bg-rose-400"    },
  "Lost Customers":    { dot: "bg-slate-400",   soft: "bg-slate-50",   text: "text-slate-600",   bar: "bg-slate-300"   },
  "Churned Customers": { dot: "bg-slate-500",   soft: "bg-slate-100",  text: "text-slate-700",   bar: "bg-slate-400"   },
}
const DEFAULT_SEG = { dot: "bg-indigo-500", soft: "bg-indigo-50", text: "text-indigo-700", bar: "bg-indigo-400" }
const segColorFor = (name: string) => SEGMENT_PALETTE[name] ?? DEFAULT_SEG

const CHURN_BADGE: Record<string, string> = {
  "LOW":       "bg-emerald-50 text-emerald-700 border-emerald-200",
  "MEDIUM":    "bg-amber-50 text-amber-700 border-amber-200",
  "HIGH":      "bg-orange-50 text-orange-700 border-orange-200",
  "VERY HIGH": "bg-rose-50 text-rose-700 border-rose-200",
  "CRITICAL":  "bg-red-100 text-red-800 border-red-200",
}

// ─── Formatting ──────────────────────────────────────────────────────────────

function fmtMoney(v: number | null | undefined): string {
  if (v == null || isNaN(Number(v))) return "—"
  const n = Number(v)
  const sign = n < 0 ? "-" : ""
  const a = Math.abs(n)
  if (a >= 1_000_000) return `${sign}EGP ${(a / 1_000_000).toFixed(2)}M`
  if (a >= 1_000)     return `${sign}EGP ${(a / 1_000).toFixed(1)}K`
  return `${sign}EGP ${a.toLocaleString("en-EG", { maximumFractionDigits: 0 })}`
}

function fmtMarginPct(frac: number | null | undefined): string {
  if (frac == null || isNaN(Number(frac))) return "—"
  return `${(Number(frac) * 100).toFixed(1)}%`
}

function fmtSharePct(pct: number | null | undefined): string {
  if (pct == null || isNaN(Number(pct))) return "—"
  return `${Number(pct).toFixed(1)}%`
}

function fmtDays(d: number | null | undefined): string {
  if (d == null) return "—"
  const n = Math.round(Number(d))
  if (n < 2)   return "Today"
  if (n < 30)  return `${n}d`
  if (n < 365) return `${Math.round(n / 30)}mo`
  return `${(n / 365).toFixed(1)}yr`
}

// ─── Product trait badges ─────────────────────────────────────────────────────

type Tone = "emerald" | "sky" | "amber" | "rose" | "violet" | "indigo"

const TONE: Record<Tone, string> = {
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  sky:     "bg-sky-50 text-sky-700 border-sky-200",
  amber:   "bg-amber-50 text-amber-700 border-amber-200",
  rose:    "bg-rose-50 text-rose-700 border-rose-200",
  violet:  "bg-violet-50 text-violet-700 border-violet-200",
  indigo:  "bg-indigo-50 text-indigo-700 border-indigo-200",
}

function clusterTraits(c: ProductClusterSummary): { label: string; tone: Tone }[] {
  const out: { label: string; tone: Tone }[] = []

  const m = c.avgMargin
  if (m != null) {
    if (m >= 0.3)      out.push({ label: "High margin",    tone: "emerald" })
    else if (m >= 0.1) out.push({ label: "Healthy margin", tone: "sky"     })
    else if (m >= 0)   out.push({ label: "Thin margin",    tone: "amber"   })
    else               out.push({ label: "Loss-making",    tone: "rose"    })
  }

  if (c.avgStock != null && c.avgQuantity != null) {
    const turnover = c.avgStock > 0 ? c.avgQuantity / c.avgStock : Infinity
    if (turnover >= 50)                          out.push({ label: "Fast moving", tone: "violet" })
    else if (c.avgStock >= 50 && turnover < 10)  out.push({ label: "Overstocked", tone: "amber"  })
  }

  if (c.revenueSharePct != null && c.revenueSharePct >= 40)
    out.push({ label: "Revenue driver", tone: "indigo" })

  return out
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function ShareBar({ label, pct, barClass }: { label: string; pct: number; barClass: string }) {
  const w = Math.max(0, Math.min(pct, 100))
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] w-12 text-slate-400 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full ${barClass} transition-all`} style={{ width: `${w}%` }} />
      </div>
      <span className="text-[10px] text-slate-500 w-10 text-right shrink-0">{pct.toFixed(0)}%</span>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-800">{value}</dd>
    </div>
  )
}

function EmptyCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
      <div className="mx-auto mb-3 w-fit">{icon}</div>
      <p className="text-sm font-medium text-slate-700">{title}</p>
      <p className="text-xs text-slate-500 mt-1">{body}</p>
    </div>
  )
}

// ─── Product components ───────────────────────────────────────────────────────

function ProductDistributionBar({ clusters, total }: { clusters: ProductClusterSummary[]; total: number }) {
  const ordered = clusters.slice().sort((a, b) => b.numProducts - a.numProducts)
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-800">Catalog distribution</h3>
        <span className="text-xs text-slate-400">{total} products · {clusters.length} clusters</span>
      </div>
      <div className="flex h-3 rounded-full overflow-hidden bg-slate-100">
        {ordered.map(c => {
          const pct = (c.numProducts / Math.max(total, 1)) * 100
          return (
            <div
              key={c.cluster}
              className={`${clusterColorFor(c.cluster).dot} h-full first:rounded-l-full last:rounded-r-full transition-all`}
              style={{ width: `${pct}%` }}
              title={`${c.clusterName}: ${c.numProducts} (${pct.toFixed(1)}%)`}
            />
          )
        })}
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4">
        {ordered.map(c => {
          const pct = (c.numProducts / Math.max(total, 1)) * 100
          return (
            <div key={c.cluster} className="flex items-center gap-2 min-w-0">
              <span className={`w-2.5 h-2.5 rounded-sm ${clusterColorFor(c.cluster).dot} shrink-0`} />
              <span className="text-xs text-slate-600 truncate">{c.clusterName}</span>
              <span className="text-xs font-medium text-slate-400">{pct.toFixed(0)}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ProductClusterCard({ cluster, total, onProductClick }: {
  cluster: ProductClusterSummary
  total: number
  onProductClick: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const c = clusterColorFor(cluster.cluster)
  const sharePct = (cluster.numProducts / Math.max(total, 1)) * 100
  const traits = clusterTraits(cluster)

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden transition-all ${
      expanded ? "border-slate-200 shadow-md" : "border-slate-100 hover:border-slate-200 hover:shadow-sm"
    }`}>
      <button onClick={() => setExpanded(v => !v)} className="w-full text-left p-5 flex gap-4">
        <div className="flex flex-col items-center gap-2 shrink-0">
          <div className={`w-11 h-11 rounded-xl ${c.dot} grid place-content-center`}>
            <Layers size={18} className="text-white" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-slate-900 truncate">{cluster.clusterName}</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {cluster.numProducts} products · {sharePct.toFixed(1)}% of catalog
              </p>
            </div>
            <ChevronDown size={16} className={`text-slate-400 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </div>

          {traits.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {traits.map(t => (
                <span key={t.label} className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${TONE[t.tone]}`}>
                  {t.label}
                </span>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <ProductMetric icon={Boxes}     label="Avg margin"    value={fmtMarginPct(cluster.avgMargin)}
              tone={cluster.avgMargin != null && cluster.avgMargin < 0 ? "rose" : "slate"} />
            <ProductMetric icon={Banknote}  label="Revenue share" value={fmtSharePct(cluster.revenueSharePct)} />
            <ProductMetric icon={TrendingUp} label="Profit share"  value={fmtSharePct(cluster.profitSharePct)} />
            <ProductMetric icon={Gauge}     label="Avg price"     value={fmtMoney(cluster.avgPrice)} />
          </div>

          <div className="mt-4 space-y-2">
            <ShareBar label="Catalog" pct={sharePct}                    barClass={c.bar} />
            <ShareBar label="Revenue" pct={cluster.revenueSharePct ?? 0} barClass={c.bar} />
            <ShareBar label="Profit"  pct={cluster.profitSharePct ?? 0}  barClass={c.bar} />
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-slate-50">
          <div className="grid sm:grid-cols-2 gap-6 pt-5">
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">Cluster economics</h4>
              <dl className="space-y-2 text-sm">
                <Row label="Avg price"      value={fmtMoney(cluster.avgPrice)} />
                <Row label="Avg cost"       value={fmtMoney(cluster.avgCost)} />
                <Row label="Avg margin"     value={fmtMarginPct(cluster.avgMargin)} />
                <Row label="Avg stock"      value={cluster.avgStock != null ? Math.round(cluster.avgStock).toLocaleString() : "—"} />
                <Row label="Avg units sold" value={cluster.avgQuantity != null ? Math.round(cluster.avgQuantity).toLocaleString() : "—"} />
                <Row label="Total revenue"  value={fmtMoney(cluster.totalRevenue)} />
                <Row label="Total profit"   value={fmtMoney(cluster.totalProfit)} />
              </dl>
            </div>

            <div className="space-y-5">
              {cluster.topProducts?.length > 0 && (
                <ProductRankedList
                  title="Top performers"
                  icon={<Crown size={12} className="text-amber-500" />}
                  valueLabel="Price"
                  onItemClick={onProductClick}
                  items={cluster.topProducts.slice(0, 4).map(p => ({
                    id:    p.product_id,
                    name:  p.name ?? `${p.product_id.slice(0, 8)}…`,
                    value: p.price != null ? fmtMoney(p.price) : "—",
                    tone:  "emerald" as const,
                  }))}
                />
              )}
              {cluster.bottomProducts?.length > 0 && (
                <ProductRankedList
                  title="Underperformers"
                  icon={<ArrowDownRight size={12} className="text-rose-500" />}
                  valueLabel="Price"
                  onItemClick={onProductClick}
                  items={cluster.bottomProducts.slice(0, 4).map(p => ({
                    id:    p.product_id,
                    name:  p.name ?? `${p.product_id.slice(0, 8)}…`,
                    value: p.price != null ? fmtMoney(p.price) : "—",
                    tone:  "rose" as const,
                  }))}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ProductMetric({ icon: Icon, label, value, tone = "slate" }: {
  icon: React.ElementType; label: string; value: string; tone?: "slate" | "rose"
}) {
  return (
    <div>
      <div className="flex items-center gap-1 text-slate-400">
        <Icon size={11} />
        <span className="text-[10px] uppercase tracking-wide font-medium">{label}</span>
      </div>
      <p className={`text-sm font-semibold mt-1 ${tone === "rose" ? "text-rose-600" : "text-slate-900"}`}>{value}</p>
    </div>
  )
}

function ProductRankedList({ title, icon, valueLabel, items, onItemClick }: {
  title: string
  icon: React.ReactNode
  valueLabel: string
  onItemClick?: (id: string) => void
  items: { id: string; name: string; value: string; tone: "emerald" | "rose" }[]
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          {icon} {title}
        </h4>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{valueLabel}</span>
      </div>
      <ul className="space-y-1">
        {items.map(p => (
          <li key={p.id}>
            <button
              onClick={() => onItemClick?.(p.id)}
              className="w-full flex items-center justify-between gap-2 text-xs py-1 border-b border-slate-50 last:border-0 hover:bg-slate-50 rounded px-1 -mx-1 transition-colors text-left group cursor-pointer"
            >
              <span className="text-slate-700 truncate group-hover:text-slate-900">{p.name}</span>
              <span className={`font-semibold shrink-0 ${p.tone === "emerald" ? "text-emerald-600" : "text-rose-600"}`}>
                {p.value}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ProductSummaryStat({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string; sub?: string
  icon: React.ElementType; accent?: boolean
}) {
  return (
    <div className={`rounded-2xl p-5 border ${
      accent ? "bg-linear-to-br from-sky-500 to-sky-600 border-sky-500 text-white" : "bg-white border-slate-100 text-slate-900"
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

function ProductsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid sm:grid-cols-3 gap-4">
        {[0, 1, 2].map(i => (
          <div key={i} className="rounded-2xl p-5 border border-slate-100 bg-white">
            <div className="w-9 h-9 rounded-xl bg-slate-100 mb-3" />
            <div className="h-7 w-16 rounded bg-slate-100" />
            <div className="h-3 w-24 rounded bg-slate-100 mt-2" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-slate-100 bg-white p-5">
        <div className="h-4 w-40 rounded bg-slate-100 mb-4" />
        <div className="h-3 rounded-full bg-slate-100" />
      </div>
      <div className="space-y-3">
        {[0, 1, 2].map(i => (
          <div key={i} className="rounded-2xl border border-slate-100 bg-white p-5 flex gap-4">
            <div className="w-11 h-11 rounded-xl bg-slate-100 shrink-0" />
            <div className="flex-1">
              <div className="h-4 w-40 rounded bg-slate-100" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                {[0, 1, 2, 3].map(j => (
                  <div key={j}>
                    <div className="h-2.5 w-12 rounded bg-slate-100" />
                    <div className="h-3.5 w-10 rounded bg-slate-100 mt-1.5" />
                  </div>
                ))}
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 mt-4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Customer components ──────────────────────────────────────────────────────

function CustomerDistributionBar({ clusters }: { clusters: CustomerClusterSummary[] }) {
  const total = clusters.reduce((a, c) => a + c.numCustomers, 0) || 1
  const ordered = clusters.slice().sort((a, b) => b.numCustomers - a.numCustomers)
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-800">Customer distribution</h3>
        <span className="text-xs text-slate-400">{total} customers · {clusters.length} segments</span>
      </div>
      <div className="flex h-3 rounded-full overflow-hidden bg-slate-100">
        {ordered.map(c => {
          const pct = (c.numCustomers / total) * 100
          return (
            <div
              key={c.cluster}
              className={`${segColorFor(c.segmentName).dot} h-full first:rounded-l-full last:rounded-r-full transition-all`}
              style={{ width: `${pct}%` }}
              title={`${c.segmentName}: ${c.numCustomers} (${pct.toFixed(1)}%)`}
            />
          )
        })}
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4">
        {ordered.map(c => {
          const pct = (c.numCustomers / total) * 100
          return (
            <div key={c.cluster} className="flex items-center gap-2 min-w-0">
              <span className={`w-2.5 h-2.5 rounded-sm ${segColorFor(c.segmentName).dot} shrink-0`} />
              <span className="text-xs text-slate-600 truncate">{c.segmentName}</span>
              <span className="text-xs font-medium text-slate-400">{pct.toFixed(0)}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CustomerSegmentCard({ seg }: { seg: CustomerClusterSummary }) {
  const [expanded, setExpanded] = useState(false)
  const c = segColorFor(seg.segmentName)
  const churnStyle = CHURN_BADGE[seg.churnRisk] ?? CHURN_BADGE["MEDIUM"]

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden transition-all ${
      expanded ? "border-slate-200 shadow-md" : "border-slate-100 hover:border-slate-200 hover:shadow-sm"
    }`}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <button onClick={() => setExpanded(v => !v)} className="w-full text-left p-5 flex gap-4">
        {/* Icon */}
        <div className="shrink-0">
          <div className={`w-11 h-11 rounded-xl ${c.dot} grid place-content-center`}>
            <Users size={18} className="text-white" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-semibold text-slate-900">{seg.segmentName}</h3>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${churnStyle}`}>
                  {seg.churnRisk} churn
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {seg.numCustomers.toLocaleString()} customers · {seg.customerPct.toFixed(1)}% of base
              </p>
            </div>
            <ChevronDown size={16} className={`text-slate-400 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </div>

          {/* RFM metrics */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-4">
            <CustomerMetric icon={Clock}       label="Recency"   value={fmtDays(seg.recencyMedian)}   />
            <CustomerMetric icon={ShoppingBag} label="Frequency" value={`${Math.round(seg.frequencyMedian)} orders`} />
            <CustomerMetric icon={Wallet}      label="Spend"     value={fmtMoney(seg.monetaryMedian)} />
            {seg.aovMedian != null && (
              <CustomerMetric icon={Banknote}  label="Avg order" value={fmtMoney(seg.aovMedian)} />
            )}
            <CustomerMetric icon={TrendingUp}  label="Rev share" value={`${seg.revenuePct.toFixed(1)}%`} />
          </div>

          {/* Revenue share bar */}
          <div className="mt-4 space-y-2">
            <ShareBar label="Customers" pct={seg.customerPct} barClass={c.bar} />
            <ShareBar label="Revenue"   pct={seg.revenuePct}  barClass={c.bar} />
          </div>

          {/* Action row */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4 pt-3.5 border-t border-slate-50">
            <ActionChip icon={Mail}         label={seg.channel} />
            <ActionChip icon={Gift}         label={seg.offer} />
            <ActionChip icon={CalendarClock} label={seg.campaignFreq} />
          </div>
        </div>
      </button>

      {/* ── Expanded: top customers ─────────────────────────────────────── */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-slate-50">
          <div className="grid sm:grid-cols-2 gap-6 pt-5">
            {/* Segment stats */}
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">Segment profile</h4>
              <dl className="space-y-2 text-sm">
                <Row label="Median recency"   value={`${Math.round(seg.recencyMedian)} days since last order`} />
                <Row label="Median orders"    value={`${Math.round(seg.frequencyMedian)} orders per customer`} />
                <Row label="Median spend"     value={fmtMoney(seg.monetaryMedian)} />
                <Row label="Total revenue"    value={fmtMoney(seg.monetarySum)} />
                {seg.aovMedian != null && (
                  <Row label="Avg order value" value={fmtMoney(seg.aovMedian)} />
                )}
                {seg.tenureMedian != null && (
                  <Row label="Median tenure"   value={fmtDays(seg.tenureMedian)} />
                )}
              </dl>

              {/* Upsell indicator */}
              <div className="mt-4 pt-3 border-t border-slate-50">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-medium text-slate-700">Upsell potential:</span>
                  <span>{seg.upsell}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                  <span className="font-medium text-slate-700">Priority:</span>
                  <span>{seg.priority}</span>
                </div>
              </div>
            </div>

            {/* Top customers */}
            {seg.topCustomers?.length > 0 && (
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
                  <Crown size={12} className="text-amber-500" /> Top customers
                </h4>
                <ul className="space-y-1">
                  {seg.topCustomers.slice(0, 5).map(cu => (
                    <li
                      key={cu.customer_id}
                      className="flex items-center justify-between gap-2 text-xs py-1.5 border-b border-slate-50 last:border-0"
                    >
                      <div className="min-w-0">
                        <p className="text-slate-700 font-medium truncate">
                          {cu.name ?? `Customer ${cu.customer_id.slice(0, 8)}…`}
                        </p>
                        <p className="text-slate-400">{cu.frequency} orders · last {fmtDays(cu.recency)} ago</p>
                      </div>
                      <span className="font-semibold text-emerald-600 shrink-0">{fmtMoney(cu.monetary)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function CustomerMetric({ icon: Icon, label, value }: {
  icon: React.ElementType; label: string; value: string
}) {
  return (
    <div>
      <div className="flex items-center gap-1 text-slate-400">
        <Icon size={11} />
        <span className="text-[10px] uppercase tracking-wide font-medium">{label}</span>
      </div>
      <p className="text-sm font-semibold mt-1 text-slate-900 truncate">{value}</p>
    </div>
  )
}

function ActionChip({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-1 text-xs text-slate-500">
      <Icon size={11} className="text-slate-400 shrink-0" />
      <span className="truncate max-w-40">{label}</span>
    </div>
  )
}

function CustomerSummaryStat({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string; sub?: string
  icon: React.ElementType; accent?: boolean
}) {
  return (
    <div className={`rounded-2xl p-5 border ${
      accent ? "bg-linear-to-br from-violet-500 to-violet-600 border-violet-500" : "bg-white border-slate-100"
    }`}>
      <div className="mb-3">
        <div className={`w-fit p-2 rounded-xl ${accent ? "bg-white/15" : "bg-violet-50"}`}>
          <Icon size={16} className={accent ? "text-white" : "text-violet-600"} />
        </div>
      </div>
      <p className={`text-2xl font-bold ${accent ? "text-white" : "text-slate-900"}`}>{value}</p>
      <p className={`text-xs mt-1 ${accent ? "text-violet-100" : "text-slate-400"}`}>{label}</p>
      {sub && <p className={`text-[11px] mt-0.5 ${accent ? "text-violet-100" : "text-slate-400"}`}>{sub}</p>}
    </div>
  )
}

function CustomersSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid sm:grid-cols-3 gap-4">
        {[0, 1, 2].map(i => (
          <div key={i} className="rounded-2xl p-5 border border-slate-100 bg-white">
            <div className="w-9 h-9 rounded-xl bg-slate-100 mb-3" />
            <div className="h-7 w-16 rounded bg-slate-100" />
            <div className="h-3 w-24 rounded bg-slate-100 mt-2" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-slate-100 bg-white p-5">
        <div className="h-4 w-40 rounded bg-slate-100 mb-4" />
        <div className="h-3 rounded-full bg-slate-100" />
      </div>
      <div className="space-y-3">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="rounded-2xl border border-slate-100 bg-white p-5 flex gap-4">
            <div className="w-11 h-11 rounded-xl bg-slate-100 shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="h-4 w-48 rounded bg-slate-100" />
              <div className="grid grid-cols-3 gap-3">
                {[0, 1, 2].map(j => (
                  <div key={j}>
                    <div className="h-2.5 w-14 rounded bg-slate-100" />
                    <div className="h-3.5 w-12 rounded bg-slate-100 mt-1.5" />
                  </div>
                ))}
              </div>
              <div className="h-1.5 rounded-full bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Tab content wrappers ─────────────────────────────────────────────────────

function ProductsTabContent({ segments, loading, onProductClick }: {
  segments: SegmentsResponse | null
  loading: boolean
  onProductClick: (id: string) => void
}) {
  if (loading) return <ProductsSkeleton />

  if (!segments) {
    return (
      <EmptyCard
        icon={<AlertTriangle size={28} className="text-slate-300" />}
        title="Couldn't load segments right now."
        body="Try refreshing the page."
      />
    )
  }

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

  if (!segments.hasResults) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
        <div className="w-12 h-12 rounded-xl bg-sky-50 grid place-content-center mx-auto mb-4">
          <Sparkles size={20} className="text-sky-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">First-run pending</h3>
        <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
          You have enough products to segment ({segments.productCount}). Click <strong>Refresh insights</strong> above to run for the first time.
        </p>
      </div>
    )
  }

  const totalProducts = segments.clusters.reduce((a, c) => a + c.numProducts, 0) || 1

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-4">
        <ProductSummaryStat label="Clusters discovered" value={segments.clusters.length.toString()} icon={Layers} accent />
        <ProductSummaryStat label="Products segmented"  value={totalProducts.toString()} icon={Package} sub={`of ${segments.productCount}`} />
        <ProductSummaryStat
          label="Last updated"
          value={segments.lastJobAt
            ? new Date(segments.lastJobAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
            : "—"}
          icon={TrendingUp}
          sub={segments.lastJobAt
            ? new Date(segments.lastJobAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
            : "Never"}
        />
      </div>

      <ProductDistributionBar clusters={segments.clusters} total={totalProducts} />

      <div className="space-y-3">
        {segments.clusters
          .slice()
          .sort((a, b) => b.numProducts - a.numProducts)
          .map(c => (
            <ProductClusterCard key={c.cluster} cluster={c} total={totalProducts} onProductClick={onProductClick} />
          ))}
      </div>

      <details className="group bg-white rounded-2xl border border-slate-100 p-5 open:shadow-sm transition-shadow">
        <summary className="cursor-pointer text-sm font-medium text-slate-600 hover:text-slate-800 flex items-center gap-2 list-none">
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

function CustomersTabContent({ segments, loading }: {
  segments: CustomerSegmentsResponse | null
  loading: boolean
}) {
  if (loading) return <CustomersSkeleton />

  if (!segments) {
    return (
      <EmptyCard
        icon={<AlertTriangle size={28} className="text-slate-300" />}
        title="Couldn't load customer segments right now."
        body="Try refreshing the page."
      />
    )
  }

  if (segments.customerCount < segments.minCustomersNeeded) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
        <div className="w-12 h-12 rounded-xl bg-amber-50 grid place-content-center mx-auto mb-4">
          <Lock size={20} className="text-amber-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">Customer segmentation locked</h3>
        <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
          Add at least <strong>{segments.minCustomersNeeded}</strong> customers with orders to unlock RFM segmentation.
          You currently have <strong>{segments.customerCount}</strong>.
        </p>
        <a
          href="/dashboard/customers"
          className="inline-flex items-center gap-1.5 mt-4 px-3 py-2 text-sm font-medium rounded-xl bg-violet-500 text-white hover:bg-violet-600 transition"
        >
          Go to Customers <ChevronRight size={14} />
        </a>
      </div>
    )
  }

  if (!segments.hasResults) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
        <div className="w-12 h-12 rounded-xl bg-violet-50 grid place-content-center mx-auto mb-4">
          <Sparkles size={20} className="text-violet-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">First-run pending</h3>
        <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
          You have <strong>{segments.customerCount}</strong> customers with orders. Click <strong>Refresh insights</strong> above to discover your first segments.
        </p>
      </div>
    )
  }

  const totalCustomers = segments.clusters.reduce((a, c) => a + c.numCustomers, 0) || 1
  const sorted = segments.clusters.slice().sort((a, b) => b.monetarySum - a.monetarySum)

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <CustomerSummaryStat label="Segments discovered" value={segments.clusters.length.toString()} icon={Users} accent />
        <CustomerSummaryStat
          label="Customers segmented"
          value={totalCustomers.toLocaleString()}
          icon={TrendingUp}
          sub={`of ${segments.customerCount} total`}
        />
        <CustomerSummaryStat
          label="Last updated"
          value={segments.lastJobAt
            ? new Date(segments.lastJobAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
            : "—"}
          icon={Clock}
          sub={segments.lastJobAt
            ? new Date(segments.lastJobAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
            : "Never"}
        />
      </div>

      {/* Distribution bar */}
      <CustomerDistributionBar clusters={segments.clusters} />

      {/* Segment cards */}
      <div className="space-y-3">
        {sorted.map(seg => (
          <CustomerSegmentCard key={seg.cluster} seg={seg} />
        ))}
      </div>

      {/* Methodology */}
      <details className="group bg-white rounded-2xl border border-slate-100 p-5 open:shadow-sm transition-shadow">
        <summary className="cursor-pointer text-sm font-medium text-slate-600 hover:text-slate-800 flex items-center gap-2 list-none">
          <ChevronRight size={14} className="transition-transform group-open:rotate-90" />
          How are customer segments built?
        </summary>
        <div className="mt-3 text-xs text-slate-500 leading-relaxed space-y-2 pl-5">
          <p>
            Segments are built on <strong className="text-slate-700">RFM features</strong>:
            Recency (days since last order), Frequency (unique orders), and Monetary (total spend).
            Average Order Value and customer Tenure are included as supporting features.
          </p>
          <p>
            KMeans and GMM are compared across k=2 to k=8 using a weighted score of Silhouette (60%),
            Davies-Bouldin index (25%), and Elbow curve (15%). GMM receives a size-based bias penalty
            to avoid overfitting on small datasets.
          </p>
          <p>
            Segments are ranked by composite RFM score and assigned names — Champions, Loyal Customers,
            At-Risk, Lost Customers, etc. — with recommended actions for each group.
          </p>
        </div>
      </details>
    </div>
  )
}

// ─── Tab button ───────────────────────────────────────────────────────────────

function TabButton({ active, onClick, icon: Icon, children }: {
  active: boolean
  onClick: () => void
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
        active ? "border-sky-500 text-sky-700" : "border-transparent text-slate-500 hover:text-slate-700"
      }`}
    >
      <Icon size={14} />
      {children}
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = "products" | "customers"

export default function SegmentsPage() {
  const role     = useBusinessRole()
  const canWrite = role === "owner" || role === "manager"

  const [tab,                setTab]                = useState<Tab>("products")
  const [segments,           setSegments]           = useState<SegmentsResponse | null>(null)
  const [loading,            setLoading]            = useState(true)
  const [refreshing,         setRefreshing]         = useState(false)
  const [customerSegments,   setCustomerSegments]   = useState<CustomerSegmentsResponse | null>(null)
  const [customerLoading,    setCustomerLoading]    = useState(false)
  const [customerRefreshing, setCustomerRefreshing] = useState(false)
  const [detailProduct,      setDetailProduct]      = useState<Product | null>(null)
  const [detailOpen,         setDetailOpen]         = useState(false)
  const customerFetchedRef = useRef(false)
  const { toasts, push } = useToast()

  const openProduct = useCallback(async (productId: string) => {
    const res = await fetch(`/api/products/${productId}`)
    if (!res.ok) return
    const data = await res.json()
    setDetailProduct(data)
    setDetailOpen(true)
  }, [])

  // Eager-load products
  useEffect(() => {
    fetch("/api/segments/product")
      .then(r => r.ok ? r.json() : null)
      .then(d => { setSegments(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // Lazy-load customers (only on first tab switch)
  useEffect(() => {
    if (tab !== "customers" || customerFetchedRef.current) return
    customerFetchedRef.current = true
    setCustomerLoading(true)
    fetch("/api/segments/customer")
      .then(r => r.ok ? r.json() : null)
      .then(d => { setCustomerSegments(d); setCustomerLoading(false) })
      .catch(() => setCustomerLoading(false))
  }, [tab])

  // Re-fetch both on insights:updated
  useEffect(() => {
    function onInsightsUpdated() {
      fetch("/api/segments/product")
        .then(r => r.ok ? r.json() : null)
        .then(d => d && setSegments(d))
        .catch(() => {})
      if (customerFetchedRef.current) {
        fetch("/api/segments/customer")
          .then(r => r.ok ? r.json() : null)
          .then(d => d && setCustomerSegments(d))
          .catch(() => {})
      }
    }
    window.addEventListener("insights:updated", onInsightsUpdated)
    return () => window.removeEventListener("insights:updated", onInsightsUpdated)
  }, [])

  async function handleRefresh() {
    setRefreshing(true)
    try {
      const res  = await fetch("/api/segments/product/refresh", { method: "POST" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { push(data.error ?? "Refresh failed — please try again later", "error"); return }
      if (data.will_run === false) {
        push(data.detail ?? "No re-run needed yet", "success")
        return
      }
      push("Refreshing — new clusters will appear in a moment", "success")
      ;[3000, 8000, 15000].forEach(ms => {
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

  async function handleCustomerRefresh() {
    setCustomerRefreshing(true)
    try {
      const res  = await fetch("/api/segments/customer/refresh", { method: "POST" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { push(data.error ?? "Refresh failed — please try again later", "error"); return }
      if (data.will_run === false) {
        push(data.detail ?? "No re-run needed yet", "success")
        return
      }
      push("Refreshing — new segments will appear in a moment", "success")
      ;[3000, 8000, 15000].forEach(ms => {
        setTimeout(() => {
          fetch("/api/segments/customer")
            .then(r => r.ok ? r.json() : null)
            .then(d => d && setCustomerSegments(d))
            .catch(() => {})
        }, ms)
      })
    } catch {
      push("Could not reach the segmentation service", "error")
    } finally {
      setCustomerRefreshing(false)
    }
  }

  const showProductRefresh =
    tab === "products" && canWrite && segments != null &&
    segments.productCount >= segments.minProductsNeeded

  const showCustomerRefresh =
    tab === "customers" && canWrite && customerSegments != null &&
    customerSegments.customerCount >= customerSegments.minCustomersNeeded

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

        {showProductRefresh && (
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 transition disabled:opacity-60 disabled:cursor-wait"
          >
            <Sparkles size={14} className={refreshing ? "animate-pulse" : ""} />
            {refreshing ? "Refreshing…" : "Refresh insights"}
          </button>
        )}

        {showCustomerRefresh && (
          <button
            onClick={handleCustomerRefresh}
            disabled={customerRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 transition disabled:opacity-60 disabled:cursor-wait"
          >
            <Sparkles size={14} className={customerRefreshing ? "animate-pulse" : ""} />
            {customerRefreshing ? "Refreshing…" : "Refresh segments"}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-slate-200">
        <TabButton active={tab === "products"}  onClick={() => setTab("products")}  icon={Package}>Products</TabButton>
        <TabButton active={tab === "customers"} onClick={() => setTab("customers")} icon={Users}>Customers</TabButton>
      </div>

      {/* Content */}
      {tab === "products" ? (
        <ProductsTabContent segments={segments} loading={loading} onProductClick={openProduct} />
      ) : (
        <CustomersTabContent segments={customerSegments} loading={customerLoading} />
      )}

      <ProductDetailDialog
        product={detailProduct}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={() => setDetailOpen(false)}
        onDelete={async () => { setDetailOpen(false) }}
        canWrite={false}
        canDelete={false}
        segment={segments?.segments.find(s => s.productId === detailProduct?.id)}
      />
    </div>
  )
}
