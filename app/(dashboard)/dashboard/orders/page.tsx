"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  Plus, Search, ShoppingCart, TrendingUp, Clock,
  DollarSign, RefreshCw, X, ChevronDown, PackageCheck,
} from "lucide-react"
import { OrderDialog, OrderFormData } from "./components/OrderDialog"
import { OrderDetailDialog, Order } from "./components/OrderDetailDialog"
import { DeleteOrderDialog } from "./components/DeleteOrderDialog"

// ─── Role hook ────────────────────────────────────────────────────────────────
function useBusinessRole() {
  const [role, setRole] = useState<string | null>(null)
  useEffect(() => {
    fetch("/api/me/business-role")
      .then(r => r.json()).then(d => setRole(d.role ?? "member")).catch(() => setRole("member"))
  }, [])
  return role
}

// ─── Stacked toasts ───────────────────────────────────────────────────────────
type Toast = { id: number; msg: string; type: "success" | "error" }
let _tid = 0
function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])
  function push(msg: string, type: "success" | "error") {
    const id = ++_tid
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }
  function dismiss(id: number) { setToasts(prev => prev.filter(t => t.id !== id)) }
  return { toasts, push, dismiss }
}

// ─── Status config ────────────────────────────────────────────────────────────
export const ORDER_STATUSES = [
  { key: "pending",   label: "Pending",   bg: "#FEF3CD", text: "#664D03",  dot: "#B07B0A" },
  { key: "confirmed", label: "Confirmed", bg: "#E0F0FF", text: "#0A4A80",  dot: "#1A7FD4" },
  { key: "shipped",   label: "Shipped",   bg: "#E8F5E9", text: "#1B5E20",  dot: "#388E3C" },
  { key: "delivered", label: "Delivered", bg: "#E1F5EE", text: "#085041",  dot: "#1D9E75" },
  { key: "cancelled", label: "Cancelled", bg: "#FCEBEB", text: "#791F1F",  dot: "#E24B4A" },
  { key: "refunded",  label: "Refunded",  bg: "#F3E8FF", text: "#4A1575",  dot: "#9B59D4" },
] as const
export type OrderStatus = typeof ORDER_STATUSES[number]["key"]

const DATE_FILTERS = [
  { key: "today", label: "Today" },
  { key: "week",  label: "This week" },
  { key: "month", label: "This month" },
] as const
type DateFilter = typeof DATE_FILTERS[number]["key"] | ""

function MetricCard({ label, value, sub, icon: Icon, accent = false }: {
  label: string; value: string | number; sub?: string; icon: React.ElementType; accent?: boolean
}) {
  return (
    <div className={`rounded-2xl p-5 flex flex-col gap-3 border ${
      accent ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-gray-100"
    }`}>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium uppercase tracking-wide ${accent ? "text-indigo-200" : "text-gray-500"}`}>{label}</span>
        <div className={`p-2 rounded-lg ${accent ? "bg-indigo-500" : "bg-indigo-50"}`}>
          <Icon size={16} className={accent ? "text-indigo-100" : "text-indigo-500"} />
        </div>
      </div>
      <div>
        <p className={`text-2xl font-bold ${accent ? "text-white" : "text-gray-900"}`}>{value}</p>
        {sub && <p className={`text-xs mt-0.5 ${accent ? "text-indigo-200" : "text-gray-400"}`}>{sub}</p>}
      </div>
    </div>
  )
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = ORDER_STATUSES.find(s => s.key === status) ?? ORDER_STATUSES[0]
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ background: cfg.bg, color: cfg.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  )
}

function OrderRow({ order, onClick }: { order: Order; onClick: () => void }) {
  // const initials = order.customerName
  //   .split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase()

  return (
    <tr onClick={onClick} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors cursor-pointer group">
      <td className="py-3.5 px-4">
        <span className="text-xs font-mono font-medium text-gray-700 group-hover:text-indigo-600 transition-colors">
          {order.id}
        </span>
      </td>
      <td className="py-3.5 px-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 text-[11px] font-medium text-indigo-600">
            {/* {initials} */}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{order.customerName}</p>
            <p className="text-[11px] text-gray-400 truncate">{order.customerEmail}</p>
          </div>
        </div>
      </td>
      <td className="py-3.5 px-4 text-sm font-medium text-gray-900 tabular-nums">
        EGP {Number(order.total).toLocaleString("en-EG", { minimumFractionDigits: 2 })}
      </td>
      <td className="py-3.5 px-4"><StatusBadge status={order.status as OrderStatus} /></td>
      <td className="py-3.5 px-4 text-xs text-gray-400 tabular-nums">
        {new Date(order.createdAt).toLocaleDateString("en-EG", { day: "numeric", month: "short", year: "numeric" })}
      </td>
    </tr>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function OrdersPage() {
  const role      = useBusinessRole()
  const canWrite  = role === "owner" || role === "manager"
  const canDelete = role === "owner"

  const [orders,        setOrders]        = useState<Order[]>([])
  const [loading,       setLoading]       = useState(true)
  const [search,        setSearch]        = useState("")
  const [dSearch,       setDSearch]       = useState("")
  const [statusFilter,  setStatusFilter]  = useState<OrderStatus | "">("")
  const [dateFilter,    setDateFilter]    = useState<DateFilter>("")
  const [activePill,    setActivePill]    = useState<OrderStatus | "">("")

  const [addOpen,       setAddOpen]       = useState(false)
  const [detailOrder,   setDetailOrder]   = useState<Order | null>(null)
  const [editOrder,     setEditOrder]     = useState<Order | null>(null)
  const [deleteOrder,   setDeleteOrder]   = useState<Order | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const searchRef = useRef<HTMLInputElement>(null)
  const { toasts, push, dismiss } = useToast()

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDSearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  // Keyboard shortcut
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault(); searchRef.current?.focus()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // ── Fetch orders ─────────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const qs = new URLSearchParams()
      if (dSearch)      qs.set("search", dSearch)
      if (statusFilter) qs.set("status", statusFilter)
      if (dateFilter)   qs.set("date",   dateFilter)
      const res = await fetch(`/api/orders?${qs}`)
      if (!res.ok) throw new Error()

      const data = await res.json()

      // If your API returns { orders: [...] }
      if (data && Array.isArray(data.orders)) {
        setOrders(data.orders)
      } 
      // If your API returns [...]
      else if (Array.isArray(data)) {
        setOrders(data)
      } 
      else {
        console.error("API did not return an array:", data)
        setOrders([]) // Fallback to empty array to prevent crashes
      }
    } catch {
      push("Failed to load orders", "error")
    } finally {
      setLoading(false)
    }
  }, [dSearch, statusFilter, dateFilter])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  // ── Metrics ──────────────────────────────────────────────────────────────────
 // ── Metrics ──────────────────────────────────────────────────────────────────
const isOrdersArray = Array.isArray(orders);

const metrics = isOrdersArray 
  ? orders.reduce((acc, o) => {
      const val = Number(o.total || 0);
      
      // 1. Always track global totals
      acc.totalCount += 1;
      acc.allTotalSum += val;

      // 2. Track specific statuses
      if (o.status === "pending") {
        acc.pendingCount += 1;
      }

      // 3. Revenue logic (Excluding failed orders)
      if (o.status !== "cancelled" && o.status !== "refunded") {
        acc.revenue += val;
        acc.validOrderCount += 1;
      }

      return acc;
    }, { 
      revenue: 0, 
      validOrderCount: 0, 
      pendingCount: 0, 
      totalCount: 0, 
      allTotalSum: 0 
    })
  : { revenue: 0, validOrderCount: 0, pendingCount: 0, totalCount: 0, allTotalSum: 0 };

  // ── Derived Values ──────────────────────────────────────────────────────────
  const total        = metrics.totalCount;
  const totalRev     = metrics.revenue;
  const pending      = metrics.pendingCount;

  const avgOrder = metrics.totalCount > 0
    ? `EGP ${(metrics.allTotalSum / metrics.totalCount).toLocaleString("en-EG", { 
        maximumFractionDigits: 0 
      })}`
    : "—"

  const isFiltered = !!dSearch || !!statusFilter || !!dateFilter

  function handlePill(key: OrderStatus) {
    if (activePill === key) {
      setActivePill("")
      setStatusFilter("")
    } else {
      setActivePill(key)
      setStatusFilter(key)
    }
  }

  // ── CREATE ───────────────────────────────────────────────────────────────────
  async function handleCreate(data: OrderFormData) {
    const res = await fetch("/api/orders", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error ?? "Failed to create order")
    }
    const created: Order = await res.json()
    setOrders(prev => [created, ...prev])
    push(`Order ${created.orderNumber} created`, "success")
    setAddOpen(false)
  }

  // ── UPDATE ───────────────────────────────────────────────────────────────────
  async function handleUpdate(data: OrderFormData) {
    if (!editOrder) return
    const res = await fetch(`/api/orders/${editOrder.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error ?? "Failed to update order")
    }
    const updated: Order = await res.json()
    setOrders(prev => prev.map(o => o.id === updated.id ? { ...o, ...updated } : o))
    push(`Order ${updated.orderNumber} updated`, "success")
    setEditOrder(null)
  }

  // ── STATUS UPDATE (inline from detail) ───────────────────────────────────────
  async function handleStatusChange(order: Order, status: OrderStatus) {
    const res = await fetch(`/api/orders/${order.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    if (!res.ok) { push("Failed to update status", "error"); return }
    const updated: Order = await res.json()
    setOrders(prev => prev.map(o => {
      if (o.id === updated.id) {
        return { ...o, ...updated };
      }
      return o;
  }));
    setDetailOrder(updated)
    push(`Status updated to ${status}`, "success")
  }

  // ── DELETE ───────────────────────────────────────────────────────────────────
  async function handleDelete(o: Order) {
    setDeleteLoading(true)
    try {
      const res  = await fetch(`/api/orders/${o.id}`, { method: "DELETE" })
      const body = await res.json()
      if (!res.ok) { push(body.error ?? "Failed to delete", "error"); return }
      setOrders(prev => prev.filter(x => x.id !== o.id))
      push(`Order ${o.id} deleted`, "success")
      setDeleteOrder(null)
    } catch {
      push("Unexpected error — please try again", "error")
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8] px-6 py-8 max-w-7xl mx-auto">

      {/* Toasts */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 pointer-events-auto
            ${t.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>
            <span>{t.msg}</span>
            <button onClick={() => dismiss(t.id)} className="ml-1 hover:opacity-70"><X size={13} /></button>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track, manage, and fulfil customer orders across all channels.</p>
        </div>
        {canWrite && (
          <button onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-sm">
            <Plus size={16} /> New order
          </button>
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Total orders"  value={total}    icon={ShoppingCart} accent />
        <MetricCard label="Revenue"       value={`EGP ${totalRev.toLocaleString("en-EG", { maximumFractionDigits: 0 })}`} icon={DollarSign} sub="Excl. cancelled & refunded" />
        <MetricCard label="Avg. order"    value={avgOrder} icon={TrendingUp}   sub="All orders" />
        <MetricCard label="Pending"       value={pending}  icon={Clock}        sub={pending > 0 ? "Awaiting confirmation" : "All confirmed"} />
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-800 shrink-0">
            All orders {!loading && <span className="text-gray-400 font-normal">({total})</span>}
          </h2>
          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            <div className="relative flex-1 sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={searchRef} value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search order # or customer… (/)"
                className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="relative">
              <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value as OrderStatus | ""); setActivePill("") }}
                className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 cursor-pointer">
                <option value="">All statuses</option>
                {ORDER_STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            <div className="relative">
              <select value={dateFilter} onChange={e => setDateFilter(e.target.value as DateFilter)}
                className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 cursor-pointer">
                <option value="">All time</option>
                {DATE_FILTERS.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            <button onClick={fetchOrders} title="Refresh"
              className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Status pills */}
        {!loading && !isFiltered && (
          <div className="flex items-center gap-2 px-5 py-2.5 border-b border-gray-50 overflow-x-auto">
            {ORDER_STATUSES.map(s => {
              const count = Array.isArray(orders) 
              ? orders.filter(o => o.status === s.key).length 
              : 0;
              
              const active = activePill === s.key
              return (
                <button key={s.key}
                  onClick={() => handlePill(s.key)}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium transition hover:opacity-80 shrink-0"
                  style={{
                    background: s.bg, color: s.text,
                    outline: active ? `2px solid ${s.dot}` : "none",
                    outlineOffset: "1px",
                  }}>
                  {s.label} <span className="opacity-70">{count}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="py-24 flex flex-col items-center gap-3 text-gray-400">
            <RefreshCw size={24} className="animate-spin text-indigo-300" />
            <span className="text-sm">Loading orders…</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-24 flex flex-col items-center gap-3 text-gray-400">
            <PackageCheck size={40} className="text-gray-200" />
            <p className="text-sm font-medium text-gray-500">
              {isFiltered ? "No orders match your filters" : "No orders yet"}
            </p>
            {!isFiltered && canWrite && (
              <button onClick={() => setAddOpen(true)} className="text-sm text-indigo-600 hover:underline">
                Create your first order
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-175">
              <thead>
                <tr className="text-left border-b border-gray-50">
                  {["Order #", "Customer", "Total", "Status", "Date"].map(h => (
                    <th key={h} className="py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <OrderRow key={o.id} order={o} onClick={() => setDetailOrder(o)} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <OrderDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSave={handleCreate}
        canWrite={canWrite}
      />

      <OrderDialog
        open={!!editOrder}
        onOpenChange={v => { if (!v) setEditOrder(null) }}
        onSave={handleUpdate}
        canWrite={canWrite}
      />

      <OrderDetailDialog
        order={detailOrder}
        open={!!detailOrder}
        onOpenChange={v => { if (!v) setDetailOrder(null) }}
        onEdit={o => { setDetailOrder(null); setEditOrder(o) }}
        onDelete={o => { setDetailOrder(null); setDeleteOrder(o) }}
        onStatusChange={handleStatusChange}
        canWrite={canWrite}
        canDelete={canDelete}
      />

      <DeleteOrderDialog
        order={deleteOrder}
        open={!!deleteOrder}
        onOpenChange={v => { if (!v) setDeleteOrder(null) }}
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </div>
  )
}