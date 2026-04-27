"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  Folder, FolderOpen, Plus, Search, X, RefreshCw,
  ChevronRight, ChevronDown, ChevronLeft, AlertTriangle, Loader2, Tag,
} from "lucide-react"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { CategoryDialog, Category, CategoryFormData } from "@/app/components/crm/categories/CategoryDialog"

// ─── Role hook ────────────────────────────────────────────────────────────────
function useBusinessRole() {
  const [role, setRole] = useState<string | null>(null)
  useEffect(() => {
    fetch("/api/me/business-role")
      .then(r => r.json()).then(d => setRole(d.role ?? "member")).catch(() => setRole("member"))
  }, [])
  return role
}

// ─── Stacked toast ────────────────────────────────────────────────────────────
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

// ─── Delete confirmation dialog ───────────────────────────────────────────────
function DeleteCategoryDialog({
  category, open, onOpenChange, onConfirm, loading,
}: {
  category:     Category | null
  open:         boolean
  onOpenChange: (v: boolean) => void
  onConfirm:    (cat: Category, force: boolean) => Promise<void>
  loading:      boolean
}) {
  if (!category) return null
  const childCount   = category.children?.length ?? 0
  const productCount = category.productCount ?? 0
  const hasDeps      = childCount > 0 || productCount > 0

  return (
    <Dialog open={open} onOpenChange={v => { if (!loading) onOpenChange(v) }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle size={18} /> Delete category
          </DialogTitle>
          <DialogDescription>This action cannot be undone.</DialogDescription>
        </DialogHeader>
        <div className="py-2 space-y-3">
          <p className="text-sm">Are you sure you want to delete <strong>"{category.name}"</strong>?</p>
          {hasDeps && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-xs text-amber-800 space-y-1">
              {childCount > 0 && (
                <p>• {childCount} sub-categor{childCount === 1 ? "y" : "ies"} will become root categories.</p>
              )}
              {productCount > 0 && (
                <p>• {productCount} product assignment{productCount === 1 ? "" : "s"} will be removed.</p>
              )}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={() => onOpenChange(false)} disabled={loading}
            className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition disabled:opacity-50">
            Cancel
          </button>
          <button onClick={() => onConfirm(category, hasDeps)} disabled={loading}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-60 flex items-center gap-2">
            {loading && <Loader2 size={13} className="animate-spin" />}
            {hasDeps ? "Delete anyway" : "Delete"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Category tree node ───────────────────────────────────────────────────────
function CategoryNode({
  cat, depth, onEdit, onDelete, canWrite, canDelete,
}: {
  cat:       Category
  depth:     number
  onEdit:    (c: Category) => void
  onDelete:  (c: Category) => void
  canWrite:  boolean
  canDelete: boolean
}) {
  const [expanded, setExpanded] = useState(depth === 0)
  const hasChildren = (cat.children?.length ?? 0) > 0

  return (
    <div>
      <div
        className={`flex items-center gap-2 py-2.5 px-4 hover:bg-gray-50 group transition-colors rounded-lg`}
        style={{ paddingLeft: `${16 + depth * 24}px` }}
      >
        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(v => !v)}
          className={`shrink-0 transition-opacity ${hasChildren ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        >
          {expanded
            ? <ChevronDown size={14} className="text-gray-400" />
            : <ChevronRight size={14} className="text-gray-400" />}
        </button>

        {/* Icon */}
        {expanded && hasChildren
          ? <FolderOpen size={16} className="text-indigo-400 shrink-0" />
          : <Folder     size={16} className={`shrink-0 ${hasChildren ? "text-indigo-400" : "text-gray-300"}`} />
        }

        {/* Name */}
        <span className="text-sm font-medium text-gray-800 flex-1 truncate">{cat.name}</span>

        {/* Meta */}
        <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
          {cat.productCount !== undefined && cat.productCount > 0 && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Tag size={11} /> {cat.productCount}
            </span>
          )}
          {hasChildren && (
            <span className="text-xs text-gray-400">
              {cat.children!.length} sub
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {canWrite && (
            <button onClick={() => onEdit(cat)}
              className="px-2 py-1 text-xs rounded-md text-indigo-600 hover:bg-indigo-50 transition">
              Edit
            </button>
          )}
          {canDelete && (
            <button onClick={() => onDelete(cat)}
              className="px-2 py-1 text-xs rounded-md text-red-500 hover:bg-red-50 transition">
              Delete
            </button>
          )}
        </div>

        {/* Slug badge */}
        <span className="text-xs font-mono text-gray-300 hidden lg:block shrink-0">{cat.slug}</span>
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <div>
          {cat.children!.map(child => (
            <CategoryNode
              key={child.id}
              cat={child}
              depth={depth + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              canWrite={canWrite}
              canDelete={canDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Pagination Type ──────────────────────────────────────────────────────────
type PaginationData = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CategoriesPage() {
  const role      = useBusinessRole()
  const canWrite  = role === "owner" || role === "manager"
  const canDelete = role === "owner"

  // Data states
  const [categories,     setCategories]     = useState<Category[]>([])
  const [treeCategories, setTreeCategories] = useState<Category[]>([]) // Retains the full tree for the add/edit dialog selector
  const [flatAll,        setFlatAll]        = useState<Category[]>([]) // Flat list computed from tree for accurate metrics
  
  // Pagination / Search states
  const [pagination, setPagination] = useState<PaginationData | null>(null)
  const [page,       setPage]       = useState(1)
  const [search,     setSearch]     = useState("")
  const [dSearch,    setDSearch]    = useState("")
  const searchRef = useRef<HTMLInputElement>(null)

  // UI states
  const [loading,    setLoading]    = useState(true)
  const [addOpen,    setAddOpen]    = useState(false)
  const [editCat,    setEditCat]    = useState<Category | null>(null)
  const [deleteCat,  setDeleteCat]  = useState<Category | null>(null)
  const [deleteLoad, setDeleteLoad] = useState(false)

  const { toasts, push, dismiss } = useToast()

  // Debounce search and reset to page 1
  useEffect(() => {
    const t = setTimeout(() => {
      setDSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  // Global hotkey for search
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault(); searchRef.current?.focus()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // ── Fetch data ──────────────────────────────────────────────────────────────
  const fetchCategories = useCallback(async () => {
    setLoading(true)
    try {
      if (dSearch) {
        // Fetch paginated search results AND the full tree (for accurate dialogs/metrics)
        const qs = new URLSearchParams({ search: dSearch, flat: "true", page: page.toString(), limit: "20" })
        
        const [searchRes, treeRes] = await Promise.all([
          fetch(`/api/categories?${qs.toString()}`),
          fetch(`/api/categories`), 
        ])
        
        if (!searchRes.ok || !treeRes.ok) throw new Error("Failed to fetch")

        const searchJson = await searchRes.json()
        const treeJson   = await treeRes.json()

        // Wrap flat paginated items in pseudo-roots
        setCategories(searchJson.data.map((c: Category) => ({ ...c, children: [] })))
        setPagination(searchJson.pagination)
        setTreeCategories(treeJson.data)
        
        // Flatten tree locally for accurate top-level metrics regardless of search state
        function flatten(nodes: Category[]): Category[] {
          return nodes.reduce<Category[]>((acc, n) => {
            return [...acc, n, ...flatten(n.children || [])]
          }, [])
        }
        setFlatAll(flatten(treeJson.data))
      } else {
        // Fetch full tree
        const res = await fetch(`/api/categories`)
        if (!res.ok) throw new Error("Failed to fetch")
        
        const json = await res.json()
        
        setCategories(json.data)
        setPagination(null)
        setTreeCategories(json.data)

        function flatten(nodes: Category[]): Category[] {
          return nodes.reduce<Category[]>((acc, n) => {
            return [...acc, n, ...flatten(n.children || [])]
          }, [])
        }
        setFlatAll(flatten(json.data))
      }
    } catch {
      push("Failed to load categories", "error")
    } finally {
      setLoading(false)
    }
  }, [dSearch, page])

  useEffect(() => { fetchCategories() }, [fetchCategories])

  // ── CREATE ──────────────────────────────────────────────────────────────────
  async function handleCreate(data: CategoryFormData) {
    const res = await fetch("/api/categories", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error ?? "Failed to create category")
    }
    push(`"${data.name}" created`, "success")
    setAddOpen(false)
    await fetchCategories()
  }

  // ── UPDATE ──────────────────────────────────────────────────────────────────
  async function handleUpdate(data: CategoryFormData) {
    if (!editCat) return
    const res = await fetch(`/api/categories/${editCat.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error ?? "Failed to update category")
    }
    push(`"${data.name}" updated`, "success")
    setEditCat(null)
    await fetchCategories()
  }

  // ── DELETE ──────────────────────────────────────────────────────────────────
  async function handleDelete(cat: Category, force: boolean) {
    setDeleteLoad(true)
    try {
      const url = `/api/categories/${cat.id}${force ? "?force=true" : ""}`
      const res  = await fetch(url, { method: "DELETE" })
      const body = await res.json()

      if (res.status === 422 && !force) {
        setDeleteCat({ ...cat, children: cat.children, productCount: body.productCount })
        return
      }
      if (!res.ok) { push(body.error ?? "Failed to delete", "error"); return }
      push(`"${cat.name}" deleted`, "success")
      setDeleteCat(null)
      await fetchCategories()
    } catch {
      push("Unexpected error — please try again", "error")
    } finally {
      setDeleteLoad(false)
    }
  }

  // ── Metrics ──────────────────────────────────────────────────────────────────
  const totalCats  = flatAll.length
  const rootCats   = flatAll.filter(c => !c.parentId).length
  const withParent = flatAll.filter(c => !!c.parentId).length

  return (
    <div className="min-h-screen bg-[#F8F8F8] px-6 py-8 max-w-5xl mx-auto">

      {/* Toasts */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id}
            className={`px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 pointer-events-auto
              ${t.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>
            <span>{t.msg}</span>
            <button onClick={() => dismiss(t.id)} className="ml-1 hover:opacity-70"><X size={13} /></button>
          </div>
        ))}
      </div>

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Organise your product catalog with a hierarchical category tree (up to 3 levels deep).
          </p>
        </div>
        {canWrite && (
          <button onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-sm">
            <Plus size={16} /> Add category
          </button>
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total",       value: totalCats,  sub: "All categories" },
          { label: "Root",        value: rootCats,   sub: "Top-level"      },
          { label: "Sub-cats",    value: withParent, sub: "Nested"         },
        ].map(m => (
          <div key={m.label} className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{m.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{m.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Tree card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-800 shrink-0">
            Category tree{!loading && <span className="text-gray-400 font-normal ml-1">({totalCats})</span>}
          </h2>
          <div className="flex items-center gap-2">
            <div className="relative w-56">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={searchRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search… (/)"
                className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
              />
              {search && (
                <button onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={13} />
                </button>
              )}
            </div>
            <button onClick={fetchCategories} title="Refresh"
              className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Tree body */}
        <div className="flex-1">
          {loading ? (
            <div className="py-20 flex flex-col items-center gap-3 text-gray-400">
              <RefreshCw size={22} className="animate-spin text-indigo-300" />
              <span className="text-sm">Loading categories…</span>
            </div>
          ) : categories.length === 0 ? (
            <div className="py-20 flex flex-col items-center gap-3 text-gray-400">
              <Folder size={40} className="text-gray-200" />
              <p className="text-sm font-medium text-gray-500">
                {dSearch ? `No categories match "${dSearch}"` : "No categories yet"}
              </p>
              {!dSearch && canWrite && (
                <button onClick={() => setAddOpen(true)}
                  className="text-sm text-indigo-600 hover:underline">
                  Add your first category
                </button>
              )}
            </div>
          ) : (
            <div className="py-2">
              {categories.map(cat => (
                <CategoryNode
                  key={cat.id}
                  cat={cat}
                  depth={0}
                  onEdit={c  => setEditCat(c)}
                  onDelete={c => setDeleteCat(c)}
                  canWrite={canWrite}
                  canDelete={canDelete}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pagination footer (Search mode only) */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50">
            <span className="text-xs text-gray-500 font-medium">
              Showing <span className="text-gray-900">{categories.length}</span> of <span className="text-gray-900">{pagination.total}</span> results
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={!pagination.hasPrev}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-40 disabled:hover:bg-transparent transition"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-medium text-gray-600 px-2">
                Page {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={!pagination.hasNext}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-40 disabled:hover:bg-transparent transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Dialogs ── */}
      <CategoryDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSave={handleCreate}
        allCategories={treeCategories} // Pass the full tree so dropdowns remain complete
        canWrite={canWrite}
      />

      <CategoryDialog
        open={!!editCat}
        onOpenChange={v => { if (!v) setEditCat(null) }}
        onSave={handleUpdate}
        existing={editCat}
        allCategories={treeCategories}
        canWrite={canWrite}
      />

      <DeleteCategoryDialog
        category={deleteCat}
        open={!!deleteCat}
        onOpenChange={v => { if (!v) setDeleteCat(null) }}
        onConfirm={handleDelete}
        loading={deleteLoad}
      />
    </div>
  )
}