"use client"

import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { authClient, signOut } from "@/lib/auth-client"
import { Menu, X, ChevronRight, Store, Zap, BotMessageSquare, LogOut, Trash2, AlertTriangle } from "lucide-react"
import { Sidebar, NAV_SECTIONS } from "./Sidebar"
import {
  SidebarStorePanel,
  getInitials,
  getAvatarGradient,
  getRoleBadge,
  type SidebarBusiness,
} from "./SidebarStorePanel"
import JobsNotificationBar from "./JobsNotificationBar"
import { Router } from "next/router"

// ─── Types ────────────────────────────────────────────────────────────────────

export type SidebarUser = {
  id:    string
  name:  string
  email: string
  role:  string
}

// ─── Delete account dialog (portal) ──────────────────────────────────────────

function DeleteAccountDialog({
  user,
  onConfirm,
  onCancel,
  loading,
}: {
  user:      SidebarUser
  onConfirm: () => void
  onCancel:  () => void
  loading:   boolean
}) {
  const [typed, setTyped] = useState("")
  const match = user.email
  const confirmed = typed === match

  return createPortal(
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
        zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
      onClick={e => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div style={{
        background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 440,
        boxShadow: "0 24px 48px rgba(0,0,0,0.25)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, background: "#fef2f2",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Trash2 size={17} color="#ef4444" />
          </div>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111", marginBottom: 2 }}>
              Delete account permanently
            </h3>
            <p style={{ fontSize: 12, color: "#6b7280" }}>This action is irreversible</p>
          </div>
        </div>

        <div style={{
          background: "#fff7ed", border: "1px solid #fed7aa",
          borderRadius: 8, padding: "10px 12px", marginBottom: 16,
          display: "flex", gap: 8,
        }}>
          <AlertTriangle size={14} color="#f59e0b" style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12, color: "#92400e" }}>
            Your account, all stores, products, customers, orders, and every other record
            will be permanently deleted. You cannot undo this.
          </p>
        </div>

        <p style={{ fontSize: 13, color: "#374151", marginBottom: 8 }}>
          Type your email <strong>{match}</strong> to confirm:
        </p>
        <input
          value={typed}
          onChange={e => setTyped(e.target.value)}
          placeholder={match}
          autoFocus
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
            {loading ? "Deleting…" : "Delete my account"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ─── Profile menu ─────────────────────────────────────────────────────────────

function ProfileMenu({ user }: { user: SidebarUser }) {
  const [open,          setOpen]          = useState(false)
  const [showDelete,    setShowDelete]    = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [])

  async function handleDeleteAccount() {
    setDeleteLoading(true)
    try {
      const res = await fetch("/api/authService/delete-account", { method: "DELETE" })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `Server error ${res.status}`)
      }
      window.location.href = "/login"
    } catch (err) {
      alert(`Could not delete account: ${err instanceof Error ? err.message : "Unknown error"}`)
      setDeleteLoading(false)
    }
  }

  const badge = getRoleBadge(user.role)

  return (
    <>
      <div ref={ref} className="relative">
        {/* Avatar button */}
        <button
          onClick={() => setOpen(v => !v)}
          className={`w-8 h-8 rounded-full bg-linear-to-br ${getAvatarGradient(user.name)}
            flex items-center justify-center text-white text-xs font-bold
            ring-2 ring-white shadow-sm hover:ring-indigo-300 transition-all`}
          title={user.name}
        >
          {getInitials(user.name)}
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden z-50">
            {/* User identity */}
            <div className="px-4 py-3.5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-linear-to-br ${getAvatarGradient(user.name)}
                  flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm`}>
                  {getInitials(user.name)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{user.email}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-1.5 space-y-0.5">
              <button
                onClick={() => {
                  setOpen(false)
                  signOut({ fetchOptions: { onSuccess: () => { window.location.href = "/login" } } })
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors text-left"
              >
                <LogOut size={14} className="text-gray-400 shrink-0" />
                Sign out
              </button>

              <button
                onClick={() => { setOpen(false); setShowDelete(true) }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors text-left"
              >
                <Trash2 size={14} className="text-red-400 shrink-0" />
                Delete account
              </button>
            </div>
          </div>
        )}
      </div>

      {showDelete && (
        <DeleteAccountDialog
          user={user}
          loading={deleteLoading}
          onConfirm={handleDeleteAccount}
          onCancel={() => setShowDelete(false)}
        />
      )}
    </>
  )
}

// ─── Mobile drawer ────────────────────────────────────────────────────────────

function MobileDrawer({
  open, onClose, businesses, activeBusinessId, onSwitch,
}: {
  open:             boolean
  onClose:          () => void
  businesses:       SidebarBusiness[]
  activeBusinessId: string | null
  onSwitch:         (b: SidebarBusiness) => void
}) {
  const activeBusiness = businesses.find(b => b.id === activeBusinessId) ?? null
  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onClose} />
      <aside className="fixed inset-y-0 left-0 w-72 bg-white z-50 lg:hidden flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 h-14 border-b border-gray-100 shrink-0">
          <Link href="/dashboard" onClick={onClose} className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-linear-to-br from-indigo-600 to-violet-700 flex items-center justify-center shadow-sm">
              <Zap size={14} className="text-white" />
            </div>
            <span className="text-base font-bold text-gray-900">FUSE</span>
          </Link>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <X size={16} />
          </button>
        </div>

        <SidebarStorePanel
          businesses={businesses}
          active={activeBusiness}
          onSwitch={(b) => { onSwitch(b); onClose() }}
        />

        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4 min-h-0">
          {NAV_SECTIONS.map(section => (
            <div key={section.label}>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2.5 mb-1">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map(item => {
                  const Icon = item.icon
                  if (item.soon) {
                    return (
                      <div key={item.href} className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-gray-300 cursor-default">
                        <Icon size={16} className="shrink-0" />
                        <span className="font-medium truncate flex-1">{item.label}</span>
                        <span className="text-[9px] font-bold uppercase bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full">Soon</span>
                      </div>
                    )
                  }
                  return (
                    <Link key={item.href} href={item.href} onClick={onClose}
                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                      <Icon size={16} className="shrink-0" />
                      <span className="font-medium truncate">{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  )
}

// ─── Top header ───────────────────────────────────────────────────────────────

function TopHeader({
  user, activeBusiness, mobileMenuOpen, onMobileMenuToggle,
}: {
  user:               SidebarUser | null
  activeBusiness:     SidebarBusiness | null
  mobileMenuOpen:     boolean
  onMobileMenuToggle: () => void
}) {
  const pathname    = usePathname()
  const currentPage = NAV_SECTIONS
    .flatMap(s => s.items)
    .find(i => pathname === i.href || (i.href !== "/dashboard" && pathname.startsWith(i.href)))

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4 lg:px-6 h-14 flex items-center justify-between gap-4 shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        <button onClick={onMobileMenuToggle} className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
        <div className="flex items-center gap-1.5 text-sm min-w-0">
          {activeBusiness && (
            <>
              <Store size={13} className="text-gray-400 shrink-0" />
              <span className="text-gray-500 font-medium truncate max-w-30">{activeBusiness.name}</span>
              <ChevronRight size={13} className="text-gray-300 shrink-0" />
            </>
          )}
          <span className="font-semibold text-gray-900 truncate">
            {currentPage?.label ?? "Dashboard"}
          </span>
        </div>
      </div>

      <div className="flex items-center shrink-0">
        {user ? (
          <ProfileMenu user={user} />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
        )}
      </div>
    </header>
  )
}

// ─── Shell ────────────────────────────────────────────────────────────────────

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { data: session } = authClient.useSession()
  const router = useRouter();
  const isOnChat = usePathname().includes("chatbot")

  const [businesses,       setBusinesses]       = useState<SidebarBusiness[]>([])
  const [activeBusinessId, setActiveBusinessId] = useState<string | null>(null)
  const [userRole,         setUserRole]         = useState<string>("owner")
  const [collapsed,        setCollapsed]        = useState(false)
  const [mobileOpen,       setMobileOpen]       = useState(false)

  useEffect(() => {
    fetch("/api/me/context")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return
        if (d.activeBusinessId) setActiveBusinessId(d.activeBusinessId)
        if (d.role)             setUserRole(d.role)
        if (d.businesses)       setBusinesses(d.businesses)
      })
      .catch(() => {})
  }, [])

  async function handleSwitch(b: SidebarBusiness) {
    setActiveBusinessId(b.id)
    setUserRole(b.role)
    await fetch("/api/businesses/switch", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ businessId: b.id }),
    })
    router.refresh()
  }

  const user: SidebarUser | null = session?.user
    ? { id: session.user.id, name: session.user.name, email: session.user.email, role: userRole }
    : null

  const businessesWithRole: SidebarBusiness[] = businesses.map(b =>
    b.id === activeBusinessId ? { ...b, role: userRole } : b
  )

  const activeBusiness = businessesWithRole.find(b => b.id === activeBusinessId) ?? null

  return (
    <div className="flex h-screen bg-[#F7F7F8] overflow-hidden">

      <Sidebar
        businesses={businessesWithRole}
        activeBusinessId={activeBusinessId}
        onSwitch={handleSwitch}
        collapsed={collapsed}
        onToggle={() => setCollapsed(v => !v)}
      />
      <MobileDrawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        businesses={businessesWithRole}
        activeBusinessId={activeBusinessId}
        onSwitch={handleSwitch}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Link
          href="/chatbot"
          className={`rounded-full text-white bg-violet-600 hover:bg-violet-500 duration-200 absolute bottom-6 right-12 w-12 h-12 grid place-content-center z-20 ${isOnChat && "hidden"}`}
        >
          <BotMessageSquare className="text-xl" />
        </Link>
        <TopHeader
          user={user}
          activeBusiness={activeBusiness}
          mobileMenuOpen={mobileOpen}
          onMobileMenuToggle={() => setMobileOpen(v => !v)}
        />
        <JobsNotificationBar />
        <main key={activeBusinessId ?? "loading"} className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
