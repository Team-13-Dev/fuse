"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  Users,
  UserPlus,
  Search,
  X,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  ChevronDown,
} from "lucide-react"
import { InferSelectModel } from "drizzle-orm"
import { customer } from "@/db/schema"
import { getAvatarColor, getInitials, getSegmentStyle } from "@/lib/utils"
import { CustomerDialog, CustomerFormData, SEGMENTS } from "@/app/components/crm/customers/CustomerDialog"
import { CustomerDetailDialog, Customer } from "@/app/components/crm/customers/CustomerDetailDialog"
import { DeleteCustomerDialog } from "@/app/components/crm/customers/DeleteCustomerDialog"

// ─── Types ────────────────────────────────────────────────────────────────────
type RawCustomer = InferSelectModel<typeof customer>

// ─── Role hook ────────────────────────────────────────────────────────────────
function useBusinessRole() {
  const [role, setRole] = useState<string | null>(null)
  useEffect(() => {
    fetch("/api/me/business-role")
      .then(r => r.json())
      .then(d => setRole(d.role ?? "member"))
      .catch(() => setRole("member"))
  }, [])
  return role
}

// ─── Toast ────────────────────────────────────────────────────────────────────
type Toast = { id: number; msg: string; type: "success" | "error" }
let _toastId = 0

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])
  function push(msg: string, type: "success" | "error") {
    const id = ++_toastId
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }
  function dismiss(id: number) { setToasts(prev => prev.filter(t => t.id !== id)) }
  return { toasts, push, dismiss }
}

// ─── Metric card ─────────────────────────────────────────────────────────────
function MetricCard({
  label, value, sub, icon: Icon, accent = false,
}: {
  label: string; value: string | number; sub?: string
  icon: React.ElementType; accent?: boolean
}) {
  return (
    <div className={`rounded-2xl p-5 flex flex-col gap-3 border ${
      accent
        ? "bg-indigo-600 border-indigo-600 text-white"
        : "bg-white border-gray-100"
    }`}>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium uppercase tracking-wide ${accent ? "text-indigo-200" : "text-gray-500"}`}>
          {label}
        </span>
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

// ─── Customer row ─────────────────────────────────────────────────────────────
function CustomerRow({
  customer,
  onClick,
}: {
  customer: Customer
  onClick: () => void
}) {
  const { bg, text } = getAvatarColor(customer.fullName)
  const seg           = getSegmentStyle(customer.segment)

  return (
    <tr
      onClick={onClick}
      className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors cursor-pointer group"
    >
      <td className="py-3.5 px-4">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 select-none"
            style={{ background: bg, color: text }}
          >
            {getInitials(customer.fullName)}
          </div>
          <span className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors truncate max-w-45">
            {customer.fullName}
          </span>
        </div>
      </td>
      <td className="py-3.5 px-4 text-sm text-gray-500 truncate max-w-45">
        {customer.email ?? <span className="text-gray-300">—</span>}
      </td>
      <td className="py-3.5 px-4 text-sm text-gray-500">
        {customer.phoneNumber ?? <span className="text-gray-300">—</span>}
      </td>
      <td className="py-3.5 px-4">
        {customer.segment ? (
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: seg.bg, color: seg.text }}
          >
            {customer.segment}
          </span>
        ) : (
          <span className="text-gray-300 text-xs">—</span>
        )}
      </td>
    </tr>
  )
}

// ─── Empty state ─────────────────────────────────────────────────────────────
function EmptyState({ filtered, onAdd, canWrite }: { filtered: boolean; onAdd: () => void; canWrite: boolean }) {
  return (
    <div className="py-24 flex flex-col items-center justify-center gap-3 text-gray-400">
      <Users size={40} className="text-gray-200" />
      <p className="text-sm font-medium text-gray-500">
        {filtered ? "No customers match your filters" : "No customers yet"}
      </p>
      {!filtered && canWrite && (
        <button
          onClick={onAdd}
          className="mt-1 text-sm text-indigo-600 hover:underline"
        >
          Add your first customer
        </button>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CustomersPage() {
  const role     = useBusinessRole()
  const canWrite  = role === "owner" || role === "manager"
  const canDelete = role === "owner"

  const [customers, setCustomers]     = useState<Customer[]>([])
  const [loading,   setLoading]       = useState(true)
  const [search,    setSearch]        = useState("")
  const [segment,   setSegment]       = useState("")
  const [dSearch,   setDSearch]       = useState("")  // debounced search
  const searchRef = useRef<HTMLInputElement>(null)

  // Dialogs
  const [addOpen,     setAddOpen]     = useState(false)
  const [detailCust,  setDetailCust]  = useState<Customer | null>(null)
  const [editCust,    setEditCust]    = useState<Customer | null>(null)
  const [deleteCust,  setDeleteCust]  = useState<Customer | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const { toasts, push, dismiss } = useToast()

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDSearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  // Keyboard shortcut: / to focus search
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const qs = new URLSearchParams()
      if (dSearch) qs.set("search", dSearch)
      if (segment) qs.set("segment", segment)
      const res = await fetch(`/api/customers?${qs}`)
      if (res.status === 401) { push("Session expired — please refresh", "error"); return }
      if (!res.ok) throw new Error("Failed to fetch customers")
      const data: Customer[] = await res.json()
      setCustomers(data)
    } catch {
      push("Failed to load customers", "error")
    } finally {
      setLoading(false)
    }
  }, [dSearch, segment])

  useEffect(() => { fetchCustomers() }, [fetchCustomers])

  // ── Metrics ────────────────────────────────────────────────────────────────
  const total      = customers.length
  const vipCount   = customers.filter(c => c.segment === "VIP").length
  const atRisk     = customers.filter(c => c.segment === "At-risk").length
  const withEmail  = customers.filter(c => !!c.email).length
  const segCounts  = SEGMENTS.reduce<Record<string, number>>((acc, s) => {
    acc[s] = customers.filter(c => c.segment === s).length
    return acc
  }, {} as Record<string, number>)

  // ── CREATE ──────────────────────────────────────────────────────────────────
  async function handleCreate(data: CustomerFormData) {
    const res = await fetch("/api/customers", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error ?? "Failed to create customer")
    }
    const created: Customer = await res.json()
    setCustomers(prev => [created, ...prev])
    push(`"${created.fullName}" added`, "success")
    setAddOpen(false)
  }

  // ── UPDATE ──────────────────────────────────────────────────────────────────
  async function handleUpdate(data: CustomerFormData) {
    if (!editCust) return
    const res = await fetch(`/api/customers/${editCust.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error ?? "Failed to update customer")
    }
    const updated: Customer = await res.json()
    setCustomers(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c))
    push(`"${updated.fullName}" updated`, "success")
    setEditCust(null)
  }

  // ── DELETE ──────────────────────────────────────────────────────────────────
  async function handleDelete(cust: Customer, force: boolean) {
    setDeleteLoading(true)
    try {
      const url = `/api/customers/${cust.id}${force ? "?force=true" : ""}`
      const res = await fetch(url, { method: "DELETE" })
      const body = await res.json()

      if (res.status === 422 && !force) {
        // Server returned order-guard warning — show with orders populated
        setDeleteCust({ ...cust, orderCount: body.orderCount })
        return
      }
      if (!res.ok) {
        push(body.error ?? "Failed to delete customer", "error")
        return
      }
      setCustomers(prev => prev.filter(c => c.id !== cust.id))
      push(`"${cust.fullName}" deleted`, "success")
      setDeleteCust(null)
    } catch {
      push("Unexpected error — please try again", "error")
    } finally {
      setDeleteLoading(false)
    }
  }

  const isFiltered = !!dSearch || !!segment

  return (
    <div className="min-h-screen bg-[#F8F8F8] px-6 py-8 max-w-7xl mx-auto">

      {/* Toast stack */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 pointer-events-auto transition-all
              ${t.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}
          >
            <span>{t.msg}</span>
            <button onClick={() => dismiss(t.id)} className="ml-1 hover:opacity-70">
              <X size={13} />
            </button>
          </div>
        ))}
      </div>

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage your customer base, segments, and contact info.
          </p>
        </div>
        {canWrite && (
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-sm"
          >
            <UserPlus size={16} />
            Add customer
          </button>
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Total customers" value={total}    icon={Users}      accent />
        <MetricCard label="VIP"             value={vipCount} icon={ShieldCheck} sub="Top tier segment" />
        <MetricCard label="At-risk"         value={atRisk}   icon={AlertCircle} sub="Need attention" />
        <MetricCard
          label="Contact coverage"
          value={total ? `${Math.round((withEmail / total) * 100)}%` : "—"}
          icon={TrendingUp}
          sub="Have email on file"
        />
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-800 shrink-0">
            All customers{" "}
            {!loading && <span className="text-gray-400 font-normal">({total})</span>}
          </h2>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={searchRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search name, email, phone… (/)"
                className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Segment filter */}
            <div className="relative">
              <select
                value={segment}
                onChange={e => setSegment(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 cursor-pointer"
              >
                <option value="">All segments</option>
                {SEGMENTS.map(s => (
                  <option key={s} value={s}>{s} ({segCounts[s] ?? 0})</option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* Refresh */}
            <button
              onClick={fetchCustomers}
              title="Refresh"
              className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Segment pills strip */}
        {!loading && !isFiltered && (
          <div className="flex items-center gap-2 px-5 py-2.5 border-b border-gray-50 overflow-x-auto">
            {SEGMENTS.map(s => {
              const count = segCounts[s] ?? 0
              const { bg, text } = getSegmentStyle(s)
              return (
                <button
                  key={s}
                  onClick={() => setSegment(prev => prev === s ? "" : s)}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium transition hover:opacity-80 shrink-0"
                  style={{ background: bg, color: text }}
                >
                  {s}
                  <span className="opacity-70">{count}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-gray-400">
            <RefreshCw size={24} className="animate-spin text-indigo-300" />
            <span className="text-sm">Loading customers…</span>
          </div>
        ) : customers.length === 0 ? (
          <EmptyState filtered={isFiltered} onAdd={() => setAddOpen(true)} canWrite={canWrite} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-145">
              <thead>
                <tr className="text-left border-b border-gray-50">
                  {["Customer", "Email", "Phone", "Segment"].map(h => (
                    <th key={h} className="py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <CustomerRow
                    key={c.id}
                    customer={c}
                    onClick={() => setDetailCust(c)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Dialogs ──────────────────────────────────────────────────────────── */}

      {/* Add */}
      <CustomerDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSave={handleCreate}
        canWrite={canWrite}
      />

      {/* Edit */}
      <CustomerDialog
        open={!!editCust}
        onOpenChange={v => { if (!v) setEditCust(null) }}
        onSave={handleUpdate}
        existing={editCust}
        canWrite={canWrite}
      />

      {/* Detail */}
      <CustomerDetailDialog
        customer={detailCust}
        open={!!detailCust}
        onOpenChange={v => { if (!v) setDetailCust(null) }}
        onEdit={c  => { setDetailCust(null); setEditCust(c) }}
        onDelete={c => { setDetailCust(null); setDeleteCust(c) }}
        canWrite={canWrite}
        canDelete={canDelete}
      />

      {/* Delete */}
      <DeleteCustomerDialog
        customer={deleteCust}
        open={!!deleteCust}
        onOpenChange={v => { if (!v) setDeleteCust(null) }}
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </div>
  )
}