"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  Plus, Search, Package, TrendingUp, AlertTriangle,
  DollarSign, RefreshCw, X, ChevronDown, Sparkles,
} from "lucide-react"
import { ProductDialog, ProductFormData } from "@/app/components/crm/products/ProductDialog"
import { ProductDetailDialog, Product } from "@/app/components/crm/products/ProductDetailDialog"
import { DeleteProductDialog } from "@/app/components/crm/products/DeleteProductDialog"
import { Category } from "@/app/components/crm/categories/CategoryDialog"
import { SegmentsResponse } from "@/lib/jobs/types"

// type RawProduct = InferSelectModel<typeof product>

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

const STOCK_FILTERS = [
  { key: "out", label: "Out of stock", bg: "#FCEBEB", text: "#791F1F" },
  { key: "low", label: "Low stock",    bg: "#FEF3CD", text: "#664D03" },
  { key: "ok",  label: "In stock",     bg: "#E1F5EE", text: "#085041" },
] as const
type StockFilter = typeof STOCK_FILTERS[number]["key"] | ""

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

function StockBadge({ stock }: { stock: number | null }) {
  const qty = stock ?? 0
  if (qty === 0) return <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-50 text-red-600">Out of stock</span>
  if (qty <= 10) return <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-50 text-amber-700">Low · {qty}</span>
  return              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700">{qty} in stock</span>
}

function ProductRow({ product, categoryNames, onClick, clusterByProduct }: {
  product: Product; categoryNames: string[]; onClick: () => void
  clusterByProduct?: Map<string, { name: string; cluster: number }>
}) {
  const margin =
    product.cost && Number(product.cost) > 0
      ? (((Number(product.price) - Number(product.cost)) / Number(product.price)) * 100).toFixed(1) + "%"
      : null

  return (
    <tr onClick={onClick} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors cursor-pointer group">
      <td className="py-3.5 px-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
            <Package size={16} className="text-indigo-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
              {product.name}
            </p>
            {categoryNames.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-0.5">
                {categoryNames.slice(0, 2).map(n => (
                  <span key={n} className="text-[10px] px-1.5 py-0 rounded-full bg-indigo-50 text-indigo-600 font-medium">{n}</span>
                ))}
                {categoryNames.length > 2 && (
                  <span className="text-[10px] text-gray-400">+{categoryNames.length - 2}</span>
                )}
              </div>
            )}
            {(() => {
              const seg = clusterByProduct?.get(product.id)
              if (!seg) return null
              const palette = ["#3344FC", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#ec4899", "#84cc16", "#f97316", "#6366f1"]
              const color = palette[seg.cluster % palette.length]
              return (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "2px 8px", borderRadius: 999,
                  background: `${color}18`, color,
                  fontSize: 11, fontWeight: 600,
                  whiteSpace: "nowrap",
                }}>
                  <Sparkles size={10}/> {seg.name}
                </span>
              )
            })()}
          </div>
        </div>
      </td>
      <td className="py-3.5 px-4 text-sm text-gray-900 font-medium tabular-nums">
        EGP {Number(product.price).toLocaleString("en-EG", { minimumFractionDigits: 2 })}
      </td>
      <td className="py-3.5 px-4 text-sm text-gray-500 tabular-nums">
        {product.cost ? `EGP ${Number(product.cost).toLocaleString("en-EG", { minimumFractionDigits: 2 })}` : <span className="text-gray-300">—</span>}
      </td>
      <td className="py-3.5 px-4 text-sm">
        {margin ? <span className="text-indigo-600 font-medium">{margin}</span> : <span className="text-gray-300">—</span>}
      </td>
      <td className="py-3.5 px-4"><StockBadge stock={product.stock} /></td>
    </tr>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ProductsPage() {
  const role      = useBusinessRole()
  const canWrite  = role === "owner" || role === "manager"
  const canDelete = role === "owner"

  const [products,       setProducts]       = useState<Product[]>([])
  const [loading,        setLoading]        = useState(true)
  const [search,         setSearch]         = useState("")
  const [dSearch,        setDSearch]        = useState("")
  const [stockFilter,    setStockFilter]    = useState<StockFilter>("")

  // Category state — fetched once, shared across dialogs
  const [categories,     setCategories]     = useState<Category[]>([])
  // Map productId → categoryIds (for editing existing products)
  const [productCatMap,  setProductCatMap]  = useState<Record<string, string[]>>({})

  const [addOpen,        setAddOpen]        = useState(false)
  const [detailProduct,  setDetailProduct]  = useState<Product | null>(null)
  const [editProduct,    setEditProduct]    = useState<Product | null>(null)
  const [deleteProduct,  setDeleteProduct]  = useState<Product | null>(null)
  const [deleteLoading,  setDeleteLoading]  = useState(false)

  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<{
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  } | null>(null);

  const [segments, setSegments]             = useState<SegmentsResponse | null>(null)
  const [refreshing, setRefreshing]         = useState(false)

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

  // Fetch categories once (flat, for the picker)
  useEffect(() => {
    fetch("/api/categories")
      .then(r => r.ok ? r.json() : [])
      .then(json => setCategories(json?.data ?? []))
      .catch((error) => {
        console.error(error)
      })
  }, [])

  // ── Fetch products ──────────────────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const qs = new URLSearchParams()

      if (dSearch) qs.set("search", dSearch)
      if (stockFilter) qs.set("stock", stockFilter)

      qs.set("page", String(page))
      qs.set("limit", "20") // you can make this dynamic later

      const res = await fetch(`/api/products?${qs}`)

      if (res.status === 401) {
        push("Session expired — please refresh", "error")
        return
      }

      if (!res.ok) throw new Error()

      const json = await res.json()

      setProducts(json.data)           // ✅ FIXED
      setPagination(json.pagination)   // ✅ NEW

    } catch {
      push("Failed to load products", "error")
    } finally {
      setLoading(false)
    }
  }, [dSearch, stockFilter, page])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  useEffect(() => {
    setPage(1)
  }, [dSearch, stockFilter])


  // ── Fetch category assignments for a product when opening edit/detail ────────
  async function loadProductCategories(productId: string): Promise<string[]> {
    if (productCatMap[productId]) return productCatMap[productId]
    try {
      const res = await fetch(`/api/products/${productId}/categories`)
      if (!res.ok) return []
      const data: { category: { id: string } }[] = await res.json()
      const ids = data.map(d => d.category.id)
      setProductCatMap(prev => ({ ...prev, [productId]: ids }))
      return ids
    } catch { return [] }
  }

  async function handleOpenEdit(p: Product) {
    await loadProductCategories(p.id)
    setDetailProduct(null)
    setEditProduct(p)
  }

  async function handleOpenDetail(p: Product) {
    await loadProductCategories(p.id)
    setDetailProduct(p)
  }

  
  // ── Fetch Segments ──────────────────────────────────────────────────────────
  useEffect(() => {
  fetch("/api/segments/product")
    .then(r => r.ok ? r.json() : null)
    .then(setSegments)
    .catch(() => {})
  }, [])

  // Build a quick lookup map: productId → clusterName
  const clusterByProduct = new Map<string, { name: string; cluster: number }>()
  if (segments) {
    for (const s of segments.segments) {
      clusterByProduct.set(s.productId, { name: s.clusterName, cluster: s.cluster })
    }
  }


  // ── Metrics ─────────────────────────────────────────────────────────────────
  const total = pagination?.total ?? 0;
  const totalValue = products.reduce((acc, p) => acc + Number(p.price) * (p.stock ?? 0), 0)
  const outOfStock = products.filter(p => (p.stock ?? 0) === 0).length
  const avgMargin  = (() => {
    const wc = products.filter(p => p.cost && Number(p.cost) > 0)
    if (!wc.length) return null
    return `${(wc.reduce((a, p) => a + ((Number(p.price) - Number(p.cost!)) / Number(p.price)) * 100, 0) / wc.length).toFixed(1)}%`
  })()

  // Flatten category tree for name lookup
  function flatten(nodes: Category[] | undefined | null): Category[] {
    if (!Array.isArray(nodes)) return [];

    return nodes.reduce<Category[]>((acc, n) => {
      return [...acc, n, ...flatten(n.children)];
    }, []);
  }

  const flatCats = flatten(categories ?? [])

  function getCatNames(productId: string): string[] {
    const ids = productCatMap[productId] ?? []
    return ids.map(id => flatCats.find(c => c.id === id)?.name).filter(Boolean) as string[]
  }

  // ── CREATE ──────────────────────────────────────────────────────────────────
  async function handleCreate(data: ProductFormData) {
    const { categoryIds, ...productData } = data
    const res = await fetch("/api/products", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productData),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error ?? "Failed to create product")
    }
    const created: Product = await res.json()

    // Assign categories if any selected
    if (categoryIds.length > 0) {
      await fetch(`/api/products/${created.id}/categories`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryIds }),
      })
      setProductCatMap(prev => ({ ...prev, [created.id]: categoryIds }))
    }

    setProducts(prev => [created, ...prev])
    push(`"${created.name}" added`, "success")
    setAddOpen(false)
  }

  // ── UPDATE ──────────────────────────────────────────────────────────────────
  async function handleUpdate(data: ProductFormData) {
    if (!editProduct) return
    const { categoryIds, ...productData } = data
    const res = await fetch(`/api/products/${editProduct.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productData),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error ?? "Failed to update product")
    }
    const updated: Product = await res.json()

    // Always sync categories (PUT replaces the full set)
    await fetch(`/api/products/${editProduct.id}/categories`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryIds }),
    })
    setProductCatMap(prev => ({ ...prev, [editProduct.id]: categoryIds }))

    setProducts(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p))
    push(`"${updated.name}" updated`, "success")
    setEditProduct(null)
  }

  // ── DELETE ──────────────────────────────────────────────────────────────────
  async function handleDelete(p: Product, force: boolean) {
    setDeleteLoading(true)
    try {
      const url  = `/api/products/${p.id}${force ? "?force=true" : ""}`
      const res  = await fetch(url, { method: "DELETE" })
      const body = await res.json()
      if (res.status === 422 && !force) {
        setDeleteProduct({ ...p, unitsSold: body.refCount }); return
      }
      if (!res.ok) { push(body.error ?? "Failed to delete", "error"); return }
      setProducts(prev => prev.filter(x => x.id !== p.id))
      setProductCatMap(prev => { const n = { ...prev }; delete n[p.id]; return n })
      push(`"${p.name}" deleted`, "success")
      setDeleteProduct(null)
    } catch {
      push("Unexpected error — please try again", "error")
    } finally {
      setDeleteLoading(false)
    }
  }

  const isFiltered = !!dSearch || !!stockFilter

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
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your product catalog, pricing, inventory, and categories.</p>
        </div>
        {canWrite && (
          <button onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-sm">
            <Plus size={16} /> Add product
          </button>
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Total products"  value={total}          icon={Package}       accent />
        <MetricCard label="Catalog value"   value={`EGP ${totalValue.toLocaleString("en-EG", { maximumFractionDigits: 0 })}`} icon={DollarSign} sub="Price × stock" />
        <MetricCard label="Avg. margin"     value={avgMargin ?? "—"} icon={TrendingUp}  sub="Products with cost" />
        <MetricCard label="Out of stock"    value={outOfStock}     icon={AlertTriangle} sub={outOfStock > 0 ? "Needs restocking" : "All stocked"} />
      </div>

      {segments && segments.productCount >= segments.minProductsNeeded && (
        <button
          onClick={async () => {
            setRefreshing(true)
            try {
              const res = await fetch("/api/segments/refresh", { method: "POST" })
              const data = await res.json()
              if (!res.ok) {
                alert(data.error ?? "Refresh failed")
              }
            } finally {
              setRefreshing(false)
            }
          }}
          disabled={refreshing}
          style={{
            padding: "8px 14px", borderRadius: 8, border: "1px solid #c7d2fe",
            background: "#eef2ff", color: "#3730a3",
            fontSize: 12, fontWeight: 600, cursor: refreshing ? "wait" : "pointer",
            display: "flex", alignItems: "center", gap: 6,
          }}
        >
          <Sparkles size={13}/> {refreshing ? "Refreshing…" : "Refresh insights"}
        </button>
      )}

      {segments && segments.productCount < segments.minProductsNeeded && (
        <div style={{
          background: "#fef3c7", border: "1px solid #fde68a",
          borderRadius: 10, padding: "10px 14px", marginBottom: 16,
          display: "flex", alignItems: "center", gap: 10,
          fontSize: 13, color: "#92400e",
        }}>
          <Sparkles size={15}/>
          Add at least {segments.minProductsNeeded} products to unlock automated segmentation insights.
          You currently have {segments.productCount}.
        </div>
      )}

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-800 shrink-0">
            All products {!loading && <span className="text-gray-400 font-normal">({total})</span>}
          </h2>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search name or description… (/)"
                className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={13} />
                </button>
              )}
            </div>
            <div className="relative">
              <select value={stockFilter} onChange={e => setStockFilter(e.target.value as StockFilter)}
                className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 cursor-pointer">
                <option value="">All stock</option>
                <option value="out">Out of stock</option>
                <option value="low">Low (1–10)</option>
                <option value="ok">In stock (&gt;10)</option>
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <button onClick={fetchProducts} title="Refresh"
              className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Stock pills */}
        {!loading && !isFiltered && (
          <div className="flex items-center gap-2 px-5 py-2.5 border-b border-gray-50 overflow-x-auto">
            {STOCK_FILTERS.map(f => {
              const count = f.key === "out" ? products.filter(p => (p.stock ?? 0) === 0).length
                          : f.key === "low" ? products.filter(p => { const s = p.stock ?? 0; return s >= 1 && s <= 10 }).length
                          : products.filter(p => (p.stock ?? 0) > 10).length
              return (
                <button key={f.key}
                  onClick={() => setStockFilter(prev => prev === f.key ? "" : f.key)}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium transition hover:opacity-80 shrink-0"
                  style={{ background: f.bg, color: f.text }}>
                  {f.label} <span className="opacity-70">{count}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="py-24 flex flex-col items-center gap-3 text-gray-400">
            <RefreshCw size={24} className="animate-spin text-indigo-300" />
            <span className="text-sm">Loading products…</span>
          </div>
        ) : products.length === 0 ? (
          <div className="py-24 flex flex-col items-center gap-3 text-gray-400">
            <Package size={40} className="text-gray-200" />
            <p className="text-sm font-medium text-gray-500">
              {isFiltered ? "No products match your filters" : "No products yet"}
            </p>
            {!isFiltered && canWrite && (
              <button onClick={() => setAddOpen(true)} className="text-sm text-indigo-600 hover:underline">
                Add your first product
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-170">
              <thead>
                <tr className="text-left border-b border-gray-50">
                  {["Product & Categories", "Price", "Cost", "Margin", "Stock"].map(h => (
                    <th key={h} className="py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <ProductRow
                    key={p.id}
                    product={p}
                    categoryNames={getCatNames(p.id)}
                    onClick={() => handleOpenDetail(p)}
                    clusterByProduct={clusterByProduct}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-50">
            
            <span className="text-xs text-gray-400">
              Page {pagination.page} of {pagination.totalPages}
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={!pagination.hasPrev}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40"
              >
                Prev
              </button>

              <button
                disabled={!pagination.hasNext}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <ProductDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSave={handleCreate}
        canWrite={canWrite}
        categories={categories}
      />

      <ProductDialog
        open={!!editProduct}
        onOpenChange={v => { if (!v) setEditProduct(null) }}
        onSave={handleUpdate}
        existing={editProduct}
        existingCategoryIds={editProduct ? (productCatMap[editProduct.id] ?? []) : []}
        canWrite={canWrite}
        categories={categories}
      />

      <ProductDetailDialog
        product={detailProduct}
        open={!!detailProduct}
        onOpenChange={v => { if (!v) setDetailProduct(null) }}
        onEdit={handleOpenEdit}
        onDelete={p => { setDetailProduct(null); setDeleteProduct(p) }}
        canWrite={canWrite}
        canDelete={canDelete}
      />

      <DeleteProductDialog
        product={deleteProduct}
        open={!!deleteProduct}
        onOpenChange={v => { if (!v) setDeleteProduct(null) }}
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </div>
  )
}