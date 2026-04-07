"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { Bell, Search, Menu, X, ChevronRight, Store, Zap } from "lucide-react"
import { Sidebar, NAV_SECTIONS } from "./Sidebar"
import {
  SidebarStorePanel,
  getInitials,
  getAvatarGradient,
  getRoleBadge,
  type SidebarBusiness,
  type SidebarUser,
} from "./SidebarStorePanel"

// ─── Mobile drawer ────────────────────────────────────────────────────────────
function MobileDrawer({
  open, onClose, businesses, activeBusinessId, user, onSwitch,
}: {
  open:             boolean
  onClose:          () => void
  businesses:       SidebarBusiness[]
  activeBusinessId: string | null
  user:             SidebarUser | null
  onSwitch:         (b: SidebarBusiness) => void
}) {
  const activeBusiness = businesses.find(b => b.id === activeBusinessId) ?? null
  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onClose} />
      <aside className="fixed inset-y-0 left-0 w-72 bg-white z-50 lg:hidden flex flex-col shadow-2xl">

        <div className="flex items-center justify-between px-4 h-14 border-b border-gray-100 shrink-0">
          <Link href="/" onClick={onClose} className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-linear-to-br from-indigo-600 to-violet-700 flex items-center justify-center shadow-sm">
              <Zap size={14} className="text-white" />
            </div>
            <span className="text-base font-bold text-gray-900">FUSE</span>
          </Link>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <X size={16} />
          </button>
        </div>

        {/* Same store+user panel as desktop */}
        <SidebarStorePanel
          businesses={businesses}
          active={activeBusiness}
          user={user}
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

      <div className="flex items-center gap-2 shrink-0">
        <div className="relative hidden sm:block">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="Search…"
            className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-gray-50
              focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white
              w-44 transition-all focus:w-56"
          />
        </div>
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell size={16} className="text-gray-500" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-indigo-600 rounded-full" />
        </button>
        {user ? (
          <div
            title={`${user.name} · ${getRoleBadge(user.role).label}`}
            className={`w-8 h-8 rounded-full bg-linear-to-br ${getAvatarGradient(user.name)}
              flex items-center justify-center text-white text-xs font-bold
              cursor-pointer ring-2 ring-white shadow-sm`}
          >
            {getInitials(user.name)}
          </div>
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
    await fetch("/api/business/switch", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ businessId: b.id }),
    })
    window.location.reload()
  }

  // Build typed objects — safe to be null while loading, each child handles its own skeleton
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
        user={user}
        onSwitch={handleSwitch}
        collapsed={collapsed}
        onToggle={() => setCollapsed(v => !v)}
      />
      <MobileDrawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        businesses={businessesWithRole}
        activeBusinessId={activeBusinessId}
        user={user}
        onSwitch={handleSwitch}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopHeader
          user={user}
          activeBusiness={activeBusiness}
          mobileMenuOpen={mobileOpen}
          onMobileMenuToggle={() => setMobileOpen(v => !v)}
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}