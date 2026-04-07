"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import {
  Store, ChevronDown, ChevronUp, Check,
  Plus, Briefcase, LogOut,
} from "lucide-react"
import { signOut } from "@/lib/auth-client"

// ─── Shared types (exported so Sidebar + Shell can import them) ───────────────
export type SidebarBusiness = {
  id:         string
  name:       string
  tenantSlug: string
  industry:   string | null
  role:       string
}

export type SidebarUser = {
  id:    string
  name:  string
  email: string
  role:  string
}

// ─── Shared helpers (exported for reuse in Sidebar / TopHeader) ───────────────
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

// ─── Store card (with inline switcher) ───────────────────────────────────────
function StoreCard({
  businesses,
  active,
  onSwitch,
}: {
  businesses: SidebarBusiness[]
  active:     SidebarBusiness | null
  onSwitch:   (b: SidebarBusiness) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [])

  // ── Loading skeleton — shown while active is null ──
  if (!active) {
    return (
      <div className="rounded-xl border border-gray-100 bg-gray-50 p-2.5 animate-pulse">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gray-200 shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-gray-200 rounded w-3/4" />
            <div className="h-2.5 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      </div>
    )
  }

  const badge = getRoleBadge(active.role)

  return (
    <div ref={ref} className="rounded-xl border border-gray-200 bg-white">

      {/* Store identity row */}
      <div className="flex items-center gap-2.5 p-2.5">
        <div className={`w-9 h-9 rounded-lg bg-linear-to-br ${getAvatarGradient(active.name)}
          flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm`}>
          {getInitials(active.name)}
        </div>

        <div className="flex-1 min-w-0">
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
          {active.industry && (
            <div className="flex items-center gap-1">
              <Briefcase size={9} className="text-gray-400 shrink-0" />
              <p className="text-[10px] text-gray-400 truncate">{active.industry}</p>
            </div>
          )}
        </div>

        {/* Toggle */}
        <button
          onClick={() => setOpen(v => !v)}
          aria-label="Switch store"
          className="p-1 rounded-md hover:bg-gray-100 transition-colors shrink-0"
        >
          <ChevronDown
            size={14}
            className={`text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* Inline switcher */}
      {open && (
        <div className="border-t border-gray-100 rounded-b-xl overflow-hidden bg-gray-50">
          <div className="p-1.5 space-y-0.5 max-h-52 overflow-y-auto">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest px-2 pt-1 pb-0.5">
              Your stores
            </p>
            {businesses.map(b => {
              const isActive = b.id === active.id
              const bb = getRoleBadge(b.role)
              return (
                <button
                  key={b.id}
                  onClick={() => { onSwitch(b); setOpen(false) }}
                  className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-left transition-colors
                    ${isActive ? "bg-indigo-50 ring-1 ring-inset ring-indigo-200" : "hover:bg-white"}`}
                >
                  <div className={`w-7 h-7 rounded-md bg-linear-to-br ${getAvatarGradient(b.name)}
                    flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                    {getInitials(b.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{b.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className={`text-[9px] font-bold px-1 py-0.5 rounded-full ${bb.cls}`}>
                        {bb.label}
                      </span>
                      <span className="text-[9px] text-gray-400 font-mono truncate">/{b.tenantSlug}</span>
                    </div>
                  </div>
                  {isActive && <Check size={12} className="text-indigo-600 shrink-0" />}
                </button>
              )
            })}
          </div>

          <div className="border-t border-gray-200 p-1.5">
            <Link
              href="/onboarding"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-indigo-50 transition-colors text-indigo-600 w-full"
            >
              <Plus size={12} />
              <span className="text-xs font-semibold">Create new store</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── User card ────────────────────────────────────────────────────────────────
function UserCard({ user }: { user: SidebarUser | null }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [])

  // ── Loading skeleton — shown while user session is resolving ──
  if (!user) {
    return (
      <div className="rounded-xl border border-gray-100 bg-gray-50 p-2.5 animate-pulse">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-gray-200 rounded w-2/3" />
            <div className="h-2.5 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      </div>
    )
  }

  const badge = getRoleBadge(user.role)

  return (
    <div ref={ref} className="rounded-xl border border-gray-200 bg-white">
      {/* User row */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2.5 p-2.5 hover:bg-gray-50 rounded-xl transition-colors"
      >
        <div className={`w-8 h-8 rounded-full bg-linear-to-br ${getAvatarGradient(user.name)}
          flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm`}>
          {getInitials(user.name)}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-1.5 min-w-0">
            <p className="text-xs font-semibold text-gray-800 truncate">{user.name}</p>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${badge.cls}`}>
              {badge.label}
            </span>
          </div>
          <p className="text-[10px] text-gray-400 truncate mt-0.5">{user.email}</p>
        </div>
        <ChevronUp
          size={13}
          className={`text-gray-400 transition-transform duration-200 shrink-0 ${open ? "" : "rotate-180"}`}
        />
      </button>

      {/* User actions */}
      {open && (
        <div className="border-t border-gray-100 rounded-b-xl overflow-hidden bg-gray-50 p-1.5">
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={13} />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Composed panel ───────────────────────────────────────────────────────────
export function SidebarStorePanel({
  businesses,
  active,
  user,
  onSwitch,
}: {
  businesses: SidebarBusiness[]
  active:     SidebarBusiness | null
  user:       SidebarUser | null
  onSwitch:   (b: SidebarBusiness) => void
}) {
  return (
    <div className="border-b border-gray-100 px-3 py-3 space-y-2">
      {/* Store card — renders skeleton while active=null, real content once loaded */}
      <StoreCard businesses={businesses} active={active} onSwitch={onSwitch} />
      {/* User card — renders skeleton while user=null, real content once session resolves */}
      <UserCard user={user} />
    </div>
  )
}