"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Users, Package, Tag, ShoppingCart, TrendingUp,
  ArrowUpRight, ArrowDownRight, ChevronRight,
  Zap, Activity, DollarSign, Star,
  Clock, CheckCircle2, AlertCircle,
  Upload
  } from "lucide-react"
import UploadDatasetModal from "@/app/components/dashboard/UploadDatasetModal"

// ─── Dummy data ───────────────────────────────────────────────────────────────
const METRICS = [
  {
    label:    "Total Revenue",
    value:    "EGP 284,390",
    change:   "+18.2%",
    up:       true,
    sub:      "vs last month",
    icon:     DollarSign,
    accent:   true,
  },
  {
    label:    "Customers",
    value:    "1,284",
    change:   "+9.4%",
    up:       true,
    sub:      "active records",
    icon:     Users,
    href:     "/dashboard/customers",
  },
  {
    label:    "Products",
    value:    "347",
    change:   "+3",
    up:       true,
    sub:      "in catalog",
    icon:     Package,
    href:     "/dashboard/products",
  },
  {
    label:    "Orders",
    value:    "2,841",
    change:   "-2.1%",
    up:       false,
    sub:      "this month",
    icon:     ShoppingCart,
  },
]

const RECENT_ORDERS = [
  { id: "#ORD-9821", customer: "Sara Ali",       amount: "EGP 1,240", status: "completed", time: "2m ago" },
  { id: "#ORD-9820", customer: "Mohamed Hassan", amount: "EGP 890",   status: "pending",   time: "14m ago" },
  { id: "#ORD-9819", customer: "Layla Mahmoud",  amount: "EGP 3,450", status: "completed", time: "1h ago" },
  { id: "#ORD-9818", customer: "Ahmed Karim",    amount: "EGP 560",   status: "failed",    time: "2h ago" },
  { id: "#ORD-9817", customer: "Nour Ibrahim",   amount: "EGP 2,100", status: "completed", time: "3h ago" },
]

const TOP_PRODUCTS = [
  { name: "Wireless Headphones Pro", sold: 284, revenue: "EGP 42,600", change: "+12%" },
  { name: "Summer Linen Shirt",      sold: 231, revenue: "EGP 18,480", change: "+8%"  },
  { name: "Leather Wallet Slim",     sold: 198, revenue: "EGP 13,860", change: "+21%" },
  { name: "Arabic Coffee Set",       sold: 176, revenue: "EGP 35,200", change: "+5%"  },
  { name: "Smart Watch Band",        sold: 154, revenue: "EGP 9,240",  change: "-3%"  },
]

const ACTIVITY = [
  { icon: Users,    text: "New customer Sara Ali registered",        time: "2m ago",  color: "text-blue-500",   bg: "bg-blue-50"   },
  { icon: Package,  text: "Product 'Wireless Headphones' restocked", time: "18m ago", color: "text-emerald-500", bg: "bg-emerald-50" },
  { icon: Star,     text: "New 5-star review on Arabic Coffee Set",  time: "45m ago", color: "text-amber-500",  bg: "bg-amber-50"  },
  { icon: Zap,      text: "Shopify integration synced 47 products",  time: "1h ago",  color: "text-violet-500", bg: "bg-violet-50" },
  { icon: Users,    text: "Mohamed Hassan upgraded to VIP segment",  time: "2h ago",  color: "text-indigo-500", bg: "bg-indigo-50" },
]

const QUICK_ACTIONS = [
  { label: "Add Product",   href: "/dashboard/products",   icon: Package,     color: "bg-indigo-600 hover:bg-indigo-700" },
  { label: "Add Customer",  href: "/dashboard/customers",  icon: Users,       color: "bg-violet-600 hover:bg-violet-700" },
  { label: "New Category",  href: "/dashboard/categories", icon: Tag,         color: "bg-blue-600 hover:bg-blue-700"    },
]

// ─── Sparkline (CSS-only fake chart) ─────────────────────────────────────────
function Sparkline({ up }: { up: boolean }) {
  const points = up
    ? [30, 25, 35, 28, 38, 32, 42, 36, 48, 42, 55, 50]
    : [55, 50, 48, 52, 44, 48, 40, 44, 36, 40, 32, 38]

  const max = Math.max(...points)
  const min = Math.min(...points)
  const h = 32
  const w = 80
  const step = w / (points.length - 1)

  const path = points
    .map((p, i) => {
      const x = i * step
      const y = h - ((p - min) / (max - min)) * h
      return `${i === 0 ? "M" : "L"} ${x} ${y}`
    })
    .join(" ")

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
      <path d={path} stroke={up ? "#10b981" : "#ef4444"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; icon: React.ElementType; cls: string }> = {
    completed: { label: "Completed", icon: CheckCircle2, cls: "bg-emerald-50 text-emerald-700" },
    pending:   { label: "Pending",   icon: Clock,        cls: "bg-amber-50 text-amber-700"    },
    failed:    { label: "Failed",    icon: AlertCircle,  cls: "bg-red-50 text-red-600"         },
  }
  const { label, icon: Icon, cls } = map[status] ?? map.pending
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>
      <Icon size={10} />
      {label}
    </span>
  )
}

// ─── Bar chart placeholder ─────────────────────────────────────────────────────
function RevenueChart() {
  const bars = [65, 80, 55, 90, 70, 85, 60, 95, 75, 88, 72, 100]
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

  return (
    <div className="flex items-end gap-1.5 h-28 w-full">
      {bars.map((h, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
          <div
            className="w-full rounded-t-md bg-indigo-100 group-hover:bg-indigo-500 transition-all duration-300 relative overflow-hidden"
            style={{ height: `${h}%` }}
          >
            <div className="absolute inset-0 bg-linear-to-t from-indigo-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <span className="text-[9px] text-gray-400">{months[i]}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [greeting, setGreeting] = useState("Good morning")
  const [uploadOpen, setUploadOpen] = useState(false)


  useEffect(() => {
    const h = new Date().getHours()
    if (h < 12) setGreeting("Good morning")
    else if (h < 17) setGreeting("Good afternoon")
    else setGreeting("Good evening")
  }, [])

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto space-y-8">

      {/* Page title + quick actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">{greeting} 👋</p>
          <h1 className="text-2xl font-bold text-gray-900 mt-0.5">Overview</h1>
        </div>
        <div className="flex items-center gap-2">
          {QUICK_ACTIONS.map(a => (
            <Link
              key={a.label}
              href={a.href}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-white transition-colors shadow-sm ${a.color}`}
            >
              <a.icon size={14} />
              <span className="hidden sm:inline">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>
      <button
        onClick={() => setUploadOpen(true)}
        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
      >
        <Upload className="w-4 h-4" />
        Upload dataset
      </button>
      <UploadDatasetModal open={uploadOpen} onClose={() => setUploadOpen(false)} />

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {METRICS.map(m => {
          const Icon = m.icon
          const card = (
            <div className={`rounded-2xl p-5 border flex flex-col gap-4 transition-all hover:shadow-md
              ${m.accent ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-gray-100 text-gray-900"}`}>
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-xl ${m.accent ? "bg-indigo-500" : "bg-gray-50"}`}>
                  <Icon size={16} className={m.accent ? "text-white" : "text-indigo-600"} />
                </div>
                <Sparkline up={m.up} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${m.accent ? "text-white" : "text-gray-900"}`}>{m.value}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`text-xs font-medium flex items-center gap-0.5
                    ${m.up
                      ? m.accent ? "text-emerald-300" : "text-emerald-600"
                      : m.accent ? "text-red-300" : "text-red-500"
                    }`}>
                    {m.up ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                    {m.change}
                  </span>
                  <span className={`text-xs ${m.accent ? "text-indigo-200" : "text-gray-400"}`}>{m.sub}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className={`text-xs font-medium ${m.accent ? "text-indigo-200" : "text-gray-500"}`}>{m.label}</p>
                {m.href && !m.accent && (
                  <ArrowUpRight size={13} className="text-gray-300 group-hover:text-indigo-500" />
                )}
              </div>
            </div>
          )
          return m.href ? (
            <Link key={m.label} href={m.href} className="group block">{card}</Link>
          ) : (
            <div key={m.label}>{card}</div>
          )
        })}
      </div>

      {/* Revenue chart + Activity */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Revenue chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Revenue Overview</h2>
              <p className="text-xs text-gray-400 mt-0.5">Monthly breakdown · 2025</p>
            </div>
            <div className="flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 font-medium px-2.5 py-1 rounded-full">
              <TrendingUp size={11} />
              +18.2% YoY
            </div>
          </div>
          <RevenueChart />
        </div>

        {/* Activity feed */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-gray-900">Live Activity</h2>
            <Activity size={14} className="text-gray-300 animate-pulse" />
          </div>
          <div className="space-y-3">
            {ACTIVITY.map((a, i) => {
              const Icon = a.icon
              return (
                <div key={i} className="flex items-start gap-2.5">
                  <div className={`w-7 h-7 rounded-lg ${a.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                    <Icon size={13} className={a.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 leading-relaxed">{a.text}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{a.time}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Recent orders + Top products */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Recent orders */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-900">Recent Orders</h2>
            <Link href="/dashboard/orders" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
              View all <ChevronRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {RECENT_ORDERS.map((o, i) => (
              <div key={i} className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{o.customer}</p>
                  <p className="text-xs text-gray-400 font-mono">{o.id}</p>
                </div>
                <StatusBadge status={o.status} />
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-gray-900 tabular-nums">{o.amount}</p>
                  <p className="text-[10px] text-gray-400">{o.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top products */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-900">Top Products</h2>
            <Link href="/dashboard/products" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
              View all <ChevronRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {TOP_PRODUCTS.map((p, i) => (
              <div key={i} className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 transition-colors">
                <div className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.sold} sold</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-gray-900 tabular-nums">{p.revenue}</p>
                  <p className={`text-xs font-medium ${p.change.startsWith("+") ? "text-emerald-600" : "text-red-500"}`}>
                    {p.change}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CRM quick links */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Customers",  href: "/dashboard/customers",  icon: Users,   desc: "Manage your customer base", color: "from-blue-500 to-indigo-600"    },
          { label: "Products",   href: "/dashboard/products",   icon: Package, desc: "Catalog, pricing & stock",  color: "from-indigo-500 to-violet-600"  },
          { label: "Categories", href: "/dashboard/categories", icon: Tag,     desc: "Organise your catalog",     color: "from-violet-500 to-purple-600"  },
        ].map(c => {
          const Icon = c.icon
          return (
            <Link key={c.label} href={c.href}
              className="group bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all hover:border-indigo-100">
              <div className={`w-10 h-10 rounded-xl bg-linear-to-br ${c.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <Icon size={18} className="text-white" />
              </div>
              <p className="text-sm font-semibold text-gray-900">{c.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{c.desc}</p>
              <div className="flex items-center gap-1 mt-3 text-xs text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                Go to {c.label} <ArrowUpRight size={11} />
              </div>
            </Link>
          )
        })}
      </div>

    </div>
  )
}