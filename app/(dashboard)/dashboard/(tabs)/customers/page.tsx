"use client"

import { useState, useMemo } from "react"
import { InferSelectModel, InferInsertModel } from "drizzle-orm"
import { customer } from "@/db/schema" 
import { CustomerDialog } from "./components/CustomerDialog"
import { CustomerDetailDialog } from "./components/CustomerDetailDialog"
import { MetricCard } from "./components/MetricCard"
import { getAvatarColor, getInitials, getSegmentStyle } from "@/lib/utils"

export type Customer = InferSelectModel<typeof customer>
export type NewCustomer = InferInsertModel<typeof customer>
 
type NullifyUndefined<T> = {
  [K in keyof T]: undefined extends T[K] ? Exclude<T[K], undefined> | null : T[K]
}
 
export type CustomerFormData = NullifyUndefined<Omit<NewCustomer, "id" | "businessId">>

const MOCK_CUSTOMERS: Customer[] = [
  { id: "1", businessId: "biz_1", clerkId: "clk_a1", fullName: "Aisha Hassan",    email: "aisha@example.com",   phoneNumber: "+20 1012345678", segment: "VIP" },
  { id: "2", businessId: "biz_1", clerkId: "clk_a2", fullName: "Mohamed Ibrahim", email: "mibrahim@example.com", phoneNumber: "+20 1023456789", segment: "Regular" },
  { id: "3", businessId: "biz_1", clerkId: null,      fullName: "Sara Ali",        email: "sara.ali@example.com", phoneNumber: "+20 1034567890", segment: "New" },
  { id: "4", businessId: "biz_1", clerkId: "clk_a4", fullName: "Omar Mostafa",    email: "omar@example.com",    phoneNumber: null,             segment: "At-risk" },
  { id: "5", businessId: "biz_1", clerkId: "clk_a5", fullName: "Layla El-Sayed",  email: null,                  phoneNumber: "+20 1056789012", segment: "Inactive" },
  { id: "6", businessId: "biz_1", clerkId: "clk_a6", fullName: "Youssef Kamel",   email: "ykamel@example.com",  phoneNumber: "+20 1067890123", segment: "VIP" },
  { id: "7", businessId: "biz_1", clerkId: null,      fullName: "Nour Nasser",     email: "nour@example.com",    phoneNumber: "+20 1078901234", segment: "Regular" },
  { id: "8", businessId: "biz_1", clerkId: "clk_a8", fullName: "Khalid Amin",     email: "khalid@example.com",  phoneNumber: "+20 1089012345", segment: "New" },
  { id: "9", businessId: "biz_1", clerkId: "clk_a9", fullName: "Rana Farouk",     email: "rana@example.com",    phoneNumber: null,             segment: "VIP" },
  { id: "10",businessId: "biz_1", clerkId: null,      fullName: "Tarek Saad",      email: "tarek@example.com",   phoneNumber: "+20 1001234567", segment: "At-risk" },
  { id: "11",businessId: "biz_1", clerkId: "clk_b1", fullName: "Fatima Mansour",  email: "fatima@example.com",  phoneNumber: "+20 1011234567", segment: "Regular" },
  { id: "12",businessId: "biz_1", clerkId: "clk_b2", fullName: "Ahmed Qasim",     email: "ahmed@example.com",   phoneNumber: "+20 1022345678", segment: "New" },
]

const SEGMENTS = ["VIP", "Regular", "New", "At-risk", "Inactive"]
const PAGE_SIZE = 8

type SortKey = keyof Pick<Customer, "fullName" | "email" | "phoneNumber" | "segment">

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>(MOCK_CUSTOMERS)
  const [search, setSearch] = useState("")
  const [segFilter, setSegFilter] = useState("")
  const [sortCol, setSortCol] = useState<SortKey>("fullName")
  const [sortDir, setSortDir] = useState<1 | -1>(1)
  const [page, setPage] = useState(1)

  const [addOpen, setAddOpen] = useState(false)
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null)
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null)

  const metrics = useMemo(() => ({
    total:  customers.length,
    vip:    customers.filter(c => c.segment === "VIP").length,
    newSeg: customers.filter(c => c.segment === "New").length,
    atRisk: customers.filter(c => c.segment === "At-risk").length,
  }), [customers])

  // Filtered + sorted list
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return customers
      .filter(c => {
        const matchQ = !q || c.fullName.toLowerCase().includes(q)
          || (c.email ?? "").toLowerCase().includes(q)
          || (c.phoneNumber ?? "").includes(q)
        const matchS = !segFilter || c.segment === segFilter
        return matchQ && matchS
      })
      .sort((a, b) => {
        const av = (a[sortCol] ?? "").toLowerCase()
        const bv = (b[sortCol] ?? "").toLowerCase()
        return av < bv ? -sortDir : av > bv ? sortDir : 0
      })
  }, [customers, search, segFilter, sortCol, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageSlice  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function handleSort(col: SortKey) {
    if (col === sortCol) setSortDir(d => (d === 1 ? -1 : 1))
    else { setSortCol(col); setSortDir(1) }
    setPage(1)
  }

  function handleAdd(data: CustomerFormData) {
    const next: Customer = { ...data, id: crypto.randomUUID(), businessId: "biz_1" }
    setCustomers(prev => [next, ...prev])
  }

  function handleEdit(data: CustomerFormData) {
    if (!editCustomer) return
    setCustomers(prev => prev.map(c => c.id === editCustomer.id ? { ...c, ...data } : c))
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this customer?")) return
    setCustomers(prev => prev.filter(c => c.id !== id))
    if (pageSlice.length === 1 && page > 1) setPage(p => p - 1)
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortCol !== col) return <span className="ml-1 opacity-30">↕</span>
    return <span className="ml-1 opacity-70">{sortDir === 1 ? "↑" : "↓"}</span>
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-medium text-foreground">Customers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {metrics.total} total customers across all segments
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
        >
          + Add customer
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <MetricCard label="Total customers" value={metrics.total} />
        <MetricCard
          label="VIP"
          value={metrics.vip}
          badge={{ label: "Premium tier", bg: "#EEEDFE", color: "#3C3489" }}
        />
        <MetricCard label="New" value={metrics.newSeg} />
        <MetricCard
          label="At-risk"
          value={metrics.atRisk}
          badge={{ label: "Needs attention", bg: "#FCEBEB", color: "#791F1F" }}
        />
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search by name, email, phone…"
          className="border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[220px]"
        />
        <select
          value={segFilter}
          onChange={e => { setSegFilter(e.target.value); setPage(1) }}
          className="border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All segments</option>
          {SEGMENTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {(search || segFilter) && (
          <button
            onClick={() => { setSearch(""); setSegFilter(""); setPage(1) }}
            className="px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted transition"
          >
            Clear
          </button>
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {(["fullName", "email", "phoneNumber", "segment"] as SortKey[]).map(col => (
                  <th
                    key={col}
                    onClick={() => handleSort(col)}
                    className="px-4 py-3 text-left text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground whitespace-nowrap select-none border-b border-border"
                  >
                    {{ fullName: "Name", email: "Email", phoneNumber: "Phone", segment: "Segment" }[col]}
                    <SortIcon col={col} />
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground border-b border-border">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {pageSlice.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground text-sm">
                    No customers match your filters.
                  </td>
                </tr>
              ) : (
                pageSlice.map((c, i) => {
                  const av  = getAvatarColor(c.fullName)
                  const seg = getSegmentStyle(c.segment)
                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-muted/30 transition-colors ${i < pageSlice.length - 1 ? "border-b border-border" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0"
                            style={{ background: av.bg, color: av.text }}
                          >
                            {getInitials(c.fullName)}
                          </div>
                          <span className="font-medium text-foreground">{c.fullName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{c.email ?? "—"}</td>
                      <td className="px-4 py-3 text-foreground">{c.phoneNumber ?? "—"}</td>
                      <td className="px-4 py-3">
                        {c.segment ? (
                          <span
                            className="text-xs px-2 py-1 rounded-full font-medium"
                            style={{ background: seg.bg, color: seg.text }}
                          >
                            {c.segment}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setDetailCustomer(c)}
                            className="px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-muted transition"
                          >
                            View
                          </button>
                          <button
                            onClick={() => setEditCustomer(c)}
                            className="px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-muted transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="px-3 py-1.5 text-xs rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-border text-sm text-muted-foreground">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => totalPages <= 7 || p <= 2 || p >= totalPages - 1 || Math.abs(p - page) <= 1)
              .reduce<(number | "…")[]>((acc, p, i, arr) => {
                if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push("…")
                acc.push(p)
                return acc
              }, [])
              .map((p, i) =>
                p === "…" ? (
                  <span key={`e${i}`} className="px-2 py-1 text-xs text-muted-foreground">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={`px-3 py-1 text-xs rounded-lg border transition ${
                      p === page
                        ? "bg-foreground text-background border-foreground"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
          </div>
        </div>
      </div>

      <CustomerDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSave={handleAdd}
      />
      <CustomerDialog
        open={!!editCustomer}
        onOpenChange={open => { if (!open) setEditCustomer(null) }}
        onSave={handleEdit}
        existing={editCustomer}
      />
      <CustomerDetailDialog
        customer={detailCustomer}
        open={!!detailCustomer}
        onOpenChange={open => { if (!open) setDetailCustomer(null) }}
        onEdit={c => { setDetailCustomer(null); setEditCustomer(c) }}
      />
    </div>
  )
}