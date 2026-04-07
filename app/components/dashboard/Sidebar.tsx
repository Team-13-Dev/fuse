"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, Package, Users, Tag, Sparkles, Globe,
  ShoppingCart, BarChart3, Megaphone, Ticket, Settings,
  Zap, ChevronsLeft, ChevronsRight,
} from "lucide-react"
import {
  SidebarStorePanel,
  getInitials,
  getAvatarGradient,
  type SidebarBusiness,
  type SidebarUser,
} from "./SidebarStorePanel"

// ─── Nav config (exported so MobileDrawer + TopHeader can reuse it) ───────────
export const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard",    href: "/dashboard",              icon: LayoutDashboard             },
      { label: "Analytics",    href: "/dashboard/analytics",    icon: BarChart3,    soon: true    },
    ],
  },
  {
    label: "Catalog",
    items: [
      { label: "Products",     href: "/dashboard/products",     icon: Package                     },
      { label: "Categories",   href: "/dashboard/categories",   icon: Tag                         },
    ],
  },
  {
    label: "Commerce",
    items: [
      { label: "Customers",    href: "/dashboard/customers",    icon: Users                       },
      { label: "Orders",       href: "/dashboard/orders",       icon: ShoppingCart    },
      { label: "Coupons",      href: "/dashboard/coupons",      icon: Ticket,       soon: true    },
    ],
  },
  {
    label: "Growth",
    items: [
      { label: "Campaigns",    href: "/dashboard/campaigns",    icon: Megaphone,    soon: true    },
      { label: "AI Insights",  href: "/dashboard/ai-insights",  icon: Sparkles,     soon: true    },
      { label: "Integrations", href: "/dashboard/integrations", icon: Zap,          soon: true    },
    ],
  },
  {
    label: "Platform",
    items: [
      { label: "Web Builder",  href: "/dashboard/web-builder",  icon: Globe,        soon: true    },
      { label: "Settings",     href: "/dashboard/settings",     icon: Settings,     soon: true    },
    ],
  },
]

// ─── Single nav item ──────────────────────────────────────────────────────────
function NavItem({
  item,
  collapsed,
}: {
  item:      (typeof NAV_SECTIONS)[0]["items"][0]
  collapsed: boolean
}) {
  const pathname = usePathname()
  const isActive =
    pathname === item.href ||
    (item.href !== "/dashboard" && pathname.startsWith(item.href))
  const Icon = item.icon

  // Soon — non-interactive, dimmed
  if (item.soon) {
    return (
      <div
        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm
          text-gray-300 cursor-default select-none
          ${collapsed ? "justify-center" : ""}`}
        title={collapsed ? `${item.label} (coming soon)` : undefined}
      >
        <Icon size={16} className="shrink-0" />
        {!collapsed && (
          <>
            <span className="font-medium truncate flex-1">{item.label}</span>
            <span className="text-[9px] font-bold uppercase tracking-wider bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full">
              Soon
            </span>
          </>
        )}
      </div>
    )
  }

  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={`
        relative flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm
        transition-colors group
        ${collapsed ? "justify-center" : ""}
        ${isActive
          ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
          : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"}
      `}
    >
      <Icon size={16} className="shrink-0" />
      {!collapsed && (
        <span className="font-medium truncate">{item.label}</span>
      )}
      {/* Tooltip — only when collapsed */}
      {collapsed && (
        <span className="
          absolute left-full ml-3 top-1/2 -translate-y-1/2
          whitespace-nowrap text-xs font-semibold
          bg-gray-900 text-white px-2.5 py-1.5 rounded-lg shadow-lg
          opacity-0 group-hover:opacity-100 transition-opacity
          pointer-events-none z-100
        ">
          {item.label}
        </span>
      )}
    </Link>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
export function Sidebar({
  businesses,
  activeBusinessId,
  user,
  onSwitch,
  collapsed,
  onToggle,
}: {
  businesses:       SidebarBusiness[]
  activeBusinessId: string | null
  user:             SidebarUser | null
  onSwitch:         (b: SidebarBusiness) => void
  collapsed:        boolean
  onToggle:         () => void
}) {
  const activeBusiness = businesses.find(b => b.id === activeBusinessId) ?? null

  return (
    <aside className={`
      hidden lg:flex flex-col h-screen sticky top-0
      bg-white border-r border-gray-100
      transition-[width] duration-300 ease-in-out shrink-0 overflow-x-hidden
      ${collapsed ? "w-15" : "w-60"}
    `}>

      {/* ── Logo + collapse toggle ───────────────────────────────────────── */}
      <div className={`
        flex items-center h-14 px-3 border-b border-gray-100 shrink-0
        ${collapsed ? "justify-center" : "justify-between"}
      `}>
        <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-linear-to-br from-indigo-600 to-violet-700 flex items-center justify-center shadow-sm shrink-0">
            <Zap size={14} className="text-white" />
          </div>
          {!collapsed && (
            <span className="text-base font-bold text-gray-900 tracking-tight">FUSE</span>
          )}
        </Link>
        {!collapsed && (
          <button
            onClick={onToggle}
            title="Collapse sidebar"
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700 shrink-0"
          >
            <ChevronsLeft size={15} />
          </button>
        )}
      </div>

      {/* ── Store + User area ────────────────────────────────────────────── */}
      {collapsed ? (
        // Collapsed: just show the store avatar as an expand trigger
        <div className="flex flex-col items-center py-3 border-b border-gray-100 shrink-0">
          {activeBusiness ? (
            <button
              onClick={onToggle}
              title={`${activeBusiness.name} — click to expand`}
              className={`
                w-9 h-9 rounded-xl bg-linear-to-br ${getAvatarGradient(activeBusiness.name)}
                flex items-center justify-center text-white text-xs font-bold
                shadow-md hover:scale-105 active:scale-95 transition-transform
              `}
            >
              {getInitials(activeBusiness.name)}
            </button>
          ) : (
            // Skeleton while loading
            <div className="w-9 h-9 rounded-xl bg-gray-100 animate-pulse" />
          )}
        </div>
      ) : (
        // Expanded: full store panel + user card
        <SidebarStorePanel
          businesses={businesses}
          active={activeBusiness}
          user={user}
          onSwitch={onSwitch}
        />
      )}

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 space-y-4 min-h-0">
        {NAV_SECTIONS.map(section => (
          <div key={section.label}>
            {collapsed
              ? <div className="h-px bg-gray-100 mx-1 mb-2" />
              : <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2.5 mb-1">{section.label}</p>
            }
            <div className="space-y-0.5">
              {section.items.map(item => (
                <NavItem key={item.href} item={item} collapsed={collapsed} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      {/* Expand button — ONLY rendered when collapsed, always reachable */}
      <div className={`border-t border-gray-100 p-2 shrink-0 ${collapsed ? "flex justify-center" : ""}`}>
        {collapsed && (
          <button
            onClick={onToggle}
            title="Expand sidebar"
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <ChevronsRight size={16} />
          </button>
        )}
      </div>
    </aside>
  )
}