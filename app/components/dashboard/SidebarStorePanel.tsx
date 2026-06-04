"use client"

import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Store, ChevronDown, Check,
  Plus, Briefcase, Trash2, AlertTriangle,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

export type SidebarBusiness = {
  id:         string
  name:       string
  tenantSlug: string
  industry:   string | null
  role:       string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
}

export function getAvatarGradient(name: string) {
  const g = [
    "from-violet-500 to-indigo-600",
    "from-blue-500 to-cyan-600",
    "from-emerald-500 to-teal-600",
    "from-orange-500 to-rose-600",
    "from-pink-500 to-purple-600",
    "from-amber-500 to-orange-600",
  ]
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % g.length
  return g[h]
}

export function getRoleBadge(role: string) {
  const map: Record<string, { label: string; cls: string }> = {
    owner:   { label: "Owner",   cls: "bg-indigo-100 text-indigo-700" },
    manager: { label: "Manager", cls: "bg-blue-100 text-blue-700"     },
    member:  { label: "Member",  cls: "bg-gray-100 text-gray-600"     },
  }
  return map[role] ?? map.member
}

// ─── Delete confirmation dialog (portal-rendered) ─────────────────────────────

function DeleteStoreDialog({
  business,
  onConfirm,
  onCancel,
  loading,
}: {
  business: SidebarBusiness
  onConfirm: () => void
  onCancel:  () => void
  loading:   boolean
}) {
  const [typed, setTyped] = useState("")
  const confirmed = typed === business.name

  return createPortal(
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
        zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
      onClick={e => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div style={{
        background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 420,
        boxShadow: "0 24px 48px rgba(0,0,0,0.2)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: "#fef2f2",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Trash2 size={16} color="#ef4444" />
          </div>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111", marginBottom: 2 }}>
              Delete store permanently
            </h3>
            <p style={{ fontSize: 12, color: "#6b7280" }}>This cannot be undone</p>
          </div>
        </div>

        <div style={{
          background: "#fff7ed", border: "1px solid #fed7aa",
          borderRadius: 8, padding: "10px 12px", marginBottom: 16,
          display: "flex", gap: 8,
        }}>
          <AlertTriangle size={14} color="#f59e0b" style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12, color: "#92400e" }}>
            All customers, products, orders and records in{" "}
            <strong>{business.name}</strong> will be permanently deleted.
          </p>
        </div>

        <p style={{ fontSize: 13, color: "#374151", marginBottom: 8 }}>
          Type <strong>{business.name}</strong> to confirm:
        </p>
        <input
          value={typed}
          onChange={e => setTyped(e.target.value)}
          placeholder={business.name}
          style={{
            width: "100%", padding: "8px 12px", fontSize: 13,
            border: `1px solid ${confirmed ? "#ef4444" : "#e5e7eb"}`,
            borderRadius: 8, outline: "none", marginBottom: 16, color: "#111",
            boxSizing: "border-box",
          }}
        />

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: "8px 16px", borderRadius: 8, border: "1px solid #e5e7eb",
              background: "transparent", color: "#6b7280", cursor: "pointer", fontSize: 13,
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!confirmed || loading}
            style={{
              padding: "8px 16px", borderRadius: 8, border: "none",
              background: confirmed ? "#ef4444" : "#fca5a5",
              color: "#fff", cursor: confirmed ? "pointer" : "not-allowed",
              fontSize: 13, fontWeight: 600, opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Deleting…" : "Delete store"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ─── Store panel ──────────────────────────────────────────────────────────────

export function SidebarStorePanel({
  businesses,
  active,
  onSwitch,
  onDeleted,
}: {
  businesses: SidebarBusiness[]
  active:     SidebarBusiness | null
  onSwitch:   (b: SidebarBusiness) => void
  onDeleted?: (id: string) => void
}) {
  const router = useRouter()
  const [open,          setOpen]          = useState(false)
  const [deleteTarget,  setDeleteTarget]  = useState<SidebarBusiness | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [])

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/businesses/${deleteTarget.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Delete failed")
      onDeleted?.(deleteTarget.id)
      setDeleteTarget(null)
      setOpen(false)
      if (deleteTarget.id === active?.id) {
        router.push("/dashboard")
        router.refresh()
      }
    } catch {
      alert("Could not delete store. Please try again.")
    } finally {
      setDeleteLoading(false)
    }
  }

  // ── Skeleton while loading ────────────────────────────────────────────────
  if (!active) {
    return (
      <div className="px-3 py-3 border-b border-gray-100">
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-2.5 animate-pulse">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gray-200 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 bg-gray-200 rounded w-3/4" />
              <div className="h-2.5 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const badge = getRoleBadge(active.role)

  return (
    <>
      <div ref={ref} className="px-3 py-3 border-b border-gray-100">
        {/* Active store row */}
        <button
          onClick={() => setOpen(v => !v)}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-gray-50 transition-colors group"
        >
          <div className={`w-9 h-9 rounded-lg bg-linear-to-br ${getAvatarGradient(active.name)}
            flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm`}>
            {getInitials(active.name)}
          </div>

          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-1.5 min-w-0">
              <p className="text-xs font-bold text-gray-900 truncate">{active.name}</p>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${badge.cls}`}>
                {badge.label}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <Store size={9} className="text-gray-400 shrink-0" />
              <p className="text-[10px] text-gray-400 font-mono truncate">/{active.tenantSlug}</p>
            </div>
          </div>

          <ChevronDown
            size={13}
            className={`text-gray-400 transition-transform duration-200 shrink-0 ${open ? "rotate-180" : ""}`}
          />
        </button>

        {/* Dropdown */}
        {open && (
          <div className="mt-1 rounded-xl border border-gray-100 bg-white shadow-lg overflow-hidden">
            {/* Store list */}
            <div className="p-1.5 space-y-0.5 max-h-56 overflow-y-auto">
              {businesses.map(b => {
                const isActive = b.id === active.id
                const isOwner  = b.role === "owner"
                return (
                  <div key={b.id} className="flex items-center gap-1">
                    <button
                      onClick={() => { onSwitch(b); setOpen(false) }}
                      className={`flex-1 flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors
                        ${isActive ? "bg-indigo-50 ring-1 ring-inset ring-indigo-200" : "hover:bg-gray-50"}`}
                    >
                      <div className={`w-7 h-7 rounded-md bg-linear-to-br ${getAvatarGradient(b.name)}
                        flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                        {getInitials(b.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">{b.name}</p>
                        {b.industry && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Briefcase size={8} className="text-gray-400 shrink-0" />
                            <span className="text-[10px] text-gray-400 truncate">{b.industry}</span>
                          </div>
                        )}
                      </div>
                      {isActive && <Check size={12} className="text-indigo-600 shrink-0" />}
                    </button>

                    {isOwner && (
                      <button
                        onClick={e => { e.stopPropagation(); setDeleteTarget(b) }}
                        title="Delete this store"
                        className="p-1.5 rounded-md hover:bg-red-50 transition-colors shrink-0 group"
                      >
                        <Trash2 size={12} className="text-gray-300 group-hover:text-red-500 transition-colors" />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Create new store */}
            <div className="border-t border-gray-100 p-1.5">
              <Link
                href="/onboarding"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-indigo-50 transition-colors text-indigo-600 w-full"
              >
                <Plus size={12} />
                <span className="text-xs font-semibold">New store</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {deleteTarget && (
        <DeleteStoreDialog
          business={deleteTarget}
          loading={deleteLoading}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  )
}
