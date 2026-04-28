"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import {
  Search, Plus, X, Package, RefreshCw, Trash2, Edit3,
  Sparkles, Filter, ArrowUpRight, Layers,
} from "lucide-react"
import { useToast } from "@/hooks/useToast"
import { useBusinessRole } from "@/hooks/useBusinessRole"
import { ProductDialog, type Product, type ProductFormData } from "@/app/components/crm/products/ProductDialog"
import { ProductDetailDialog } from "@/app/components/crm/products/ProductDetailDialog"
import type { Category } from "@/app/components/crm/categories/CategoryDialog"
import type { SegmentsResponse } from "@/lib/jobs/types"

type StockFilter = "" | "out" | "low" | "ok"

// ─── Stock badge ─────────────────────────────────────────────────────────────

function StockBadge({ stock }: { stock: number | null }) {
  const qty = stock ?? 0
  const cfg = qty === 0
    ? { bg: "bg-rose-50",   text: "text-rose-700",   label: "Out of stock" }
    : qty <= 10
      ? { bg: "bg-amber-50", text: "text-amber-700",  label: `${qty} left` }
      : { bg: "bg-emerald-50", text: "text-emerald-700", label: `${qty} in stock` }

  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  )
}

// ─── Cluster chip ────────────────────────────────────────────────────────────

const CLUSTER_PALETTE = [
  "bg-sky-50 text-sky-700 border-sky-200",
  "bg-violet-50 text-violet-700 border-violet-200",
  "bg-emerald-50 text-emerald-700 border-emerald-200",
  "bg-amber-50 text-amber-700 border-amber-200",
  "bg-rose-50 text-rose-700 border-rose-200",
  "bg-indigo-50 text-indigo-700 border-indigo-200",
  "bg-teal-50 text-teal-700 border-teal-200",
  "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
]

function ClusterChip({ cluster, name }: { cluster: number; name: string }) {
  const tone = CLUSTER_PALETTE[cluster % CLUSTER_PALETTE.length]
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${tone} truncate max-w-30`}>
      {name}
    </span>
  )
}

// ─── Metric card ─────────────────────────────────────────────────────────────

function MetricCard({
  label, value, sub, icon: Icon, accent,
}: {
  label: string; value: string | number; sub?: string
  icon: React.ElementType; accent?: boolean
}) {
  return (
    <div className={`rounded-2xl p-5 border ${
      accent
        ? "bg-linear-to-br from-sky-500 to-sky-600 border-sky-500 text-white"
        : "bg-white border-slate-100 text-slate-900"
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-xl ${accent ? "bg-white/15" : "bg-sky-50"}`}>
          <Icon size={16} className={accent ? "text-white" : "text-sky-600"} />
        </div>
      </div>
      <p className={`text-2xl font-bold ${accent ? "text-white" : "text-slate-900"}`}>{value}</p>
      <p className={`text-xs mt-1 ${accent ? "text-sky-100" : "text-slate-400"}`}>{label}</p>
      {sub && <p className={`text-[11px] mt-1 ${accent ? "text-sky-100" : "text-slate-400"}`}>{sub}</p>}
    </div>
  )
}

// ─── Product row ─────────────────────────────────────────────────────────────

function ProductRow({
  product,
  categoryNames,
  onClick,
  clusterByProduct,
}: {
  product: Product
  categoryNames: string[]
  onClick: () => void
  clusterByProduct: Map<string, { name: string; cluster: number }>
}) {
  const cluster = clusterByProduct.get(product.id)
  const margin = (() => {
    const p = Number(product.price)
    const c = Number(product.cost)
    if (!product.cost || isNaN(c) || c === 0 || p === 0) return null
    return `${(((p - c) / p) * 100).toFixed(1)}%`
  })()

  return (
    <tr
      onClick={onClick}
      className="border-b border-slate-50 hover:bg-sky-50/30 cursor-pointer transition-colors"
    >
      <td className="py-3.5 px-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-900 truncate">{product.name}</p>
          <div className="flex flex-wrap items-center gap-1 mt-1">
            {cluster && <ClusterChip cluster={cluster.cluster} name={cluster.name} />}
            {categoryNames.slice(0, 2).map(cn => (
              <span key={cn} className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                {cn}
              </span>
            ))}
            {categoryNames.length > 2 && (
              <span className="text-[10px] text-slate-400">+{categoryNames.length - 2}</span>
            )}
          </div>
        </div>
      </td>
      <td className="py-3.5 px-4 text-sm text-slate-700">
        EGP {Number(product.price).toLocaleString("en-EG", { minimumFractionDigits: 2 })}
      </td>
      <td className="py-3.5 px-4 text-sm text-slate-700">
        {product.cost
          ? `EGP ${Number(product.cost).toLocaleString("en-EG", { minimumFractionDigits: 2 })}`
          : <span className="text-slate-300">—</span>}
      </td>
      <td className="py-3.5 px-4 text-sm">
        {margin
          ? <span className="text-sky-700 font-medium">{margin}</span>
          : <span className="text-slate-300">—</span>}
      </td>
      <td className="py-3.5 px-4">
        <StockBadge stock={product.stock} />
      </td>
    </tr>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const role      = useBusinessRole()
  const canWrite  = role === "owner" || role === "manager"
  const canDelete = role === "owner"

  const [products,      setProducts]     = useState<Product[]>([])
  const [loading,       setLoading]      = useState(true)
  const [search,        setSearch]       = useState("")
  const [dSearch,       setDSearch]      = useState("")
  const [stockFilter,   setStockFilter]  = useState<StockFilter>("")
  const [categories,    setCategories]   = useState<Category[]>([])
  const [productCatMap, setProductCatMap] = useState<Record<string, string[]>>({})

  const [addOpen,       setAddOpen]      = useState(false)
  const [detailProduct, setDetailProduct] = useState<Product | null>(null)
  const [editProduct,   setEditProduct]  = useState<Product | null>(null)
  const [deleteProduct, setDeleteProduct] = useState<(Product & { unitsSold?: number }) | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [page,       setPage]       = useState(1)
  const [pagination, setPagination] = useState<{
    page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean
  } | null>(null)

  const [segments,   setSegments]   = useState<SegmentsResponse | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const searchRef = useRef<HTMLInputElement>(null)
  const { toasts, push } = useToast()

  // ── Debounce search ────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setDSearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  // ── Keyboard shortcut ──────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = document.activeElement?.tagName
      if (e.key === "/" && t !== "INPUT" && t !== "TEXTAREA") {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // ── Categories ─────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/categories")
      .then(r => r.ok ? r.json() : [])
      .then(json => setCategories(json?.data ?? []))
      .catch(() => {})
  }, [])

  // ── Products fetch ─────────────────────────────────────────────────────────
  // NOTE: `push` intentionally NOT in the dep array — useToast returns a fresh
  // function reference each render, which would cause this fetcher (and the
  // useEffect below) to re-run on every render, hammering /api/products.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const qs = new URLSearchParams()
      if (dSearch)     qs.set("search", dSearch)
      if (stockFilter) qs.set("stock",  stockFilter)
      qs.set("page",  String(page))
      qs.set("limit", "20")

      const res = await fetch(`/api/products?${qs}`)
      if (res.status === 401) { push("Session expired — please refresh", "error"); return }
      if (!res.ok) throw new Error()

      const json = await res.json()
      setProducts(json.data)
      setPagination(json.pagination)
    } catch {
      push("Failed to load products", "error")
    } finally {
      setLoading(false)
    }
  }, [dSearch, stockFilter, page])

  useEffect(() => { fetchProducts() }, [fetchProducts])
  useEffect(() => { setPage(1) }, [dSearch, stockFilter])

  // ── Segments ───────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/segments/product")
      .then(r => r.ok ? r.json() : null)
      .then(setSegments)
      .catch(() => {})
  }, [])

  const clusterByProduct = new Map<string, { name: string; cluster: number }>()
  if (segments) {
    for (const s of segments.segments) {
      clusterByProduct.set(s.productId, { name: s.clusterName, cluster: s.cluster })
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  function flatten(nodes: Category[] | undefined | null): Category[] {
    if (!Array.isArray(nodes)) return []
    return nodes.reduce<Category[]>((a, n) => [...a, n, ...flatten(n.children)], [])
  }
  const flatCats = flatten(categories)
  function getCatNames(productId: string): string[] {
    const ids = productCatMap[productId] ?? []
    return ids.map(id => flatCats.find(c => c.id === id)?.name).filter(Boolean) as string[]
  }

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

  // ── Mutations ──────────────────────────────────────────────────────────────
  async function handleCreate(data: ProductFormData) {
    const { categoryIds, ...productData } = data
    const res = await fetch("/api/products", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productData),
    })
    if (!res.ok) { const e = await res.json(); throw new Error(e.error ?? "Failed to create") }
    const created: Product = await res.json()
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

  async function handleUpdate(data: ProductFormData) {
    if (!editProduct) return
    const { categoryIds, ...productData } = data
    const res = await fetch(`/api/products/${editProduct.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productData),
    })
    if (!res.ok) { const e = await res.json(); throw new Error(e.error ?? "Failed to update") }
    const updated: Product = await res.json()
    await fetch(`/api/products/${editProduct.id}/categories`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryIds }),
    })
    setProductCatMap(prev => ({ ...prev, [editProduct.id]: categoryIds }))
    setProducts(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p))
    push(`"${updated.name}" updated`, "success")
    setEditProduct(null)
  }

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

  // ── Refresh insights ───────────────────────────────────────────────────────
  async function handleRefreshInsights() {
    setRefreshing(true)
    try {
      const res = await fetch("/api/segments/product/refresh", { method: "POST" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        push(data.error ?? "Refresh failed — please try again later", "error")
        return
      }
      if (data.will_run === false) {
        // Pipeline correctly skipped — surface as success (the "no-op" is the right outcome).
        push(data.detail ?? "Not enough has changed to re-run yet", "success")
        return
      }
      push("Refreshing insights — this may take a minute", "success")
      // Soft-poll: re-fetch in 3s and 8s for the updated cluster data
      setTimeout(() => {
        fetch("/api/segments/product").then(r => r.ok ? r.json() : null).then(d => d && setSegments(d))
      }, 3000)
      setTimeout(() => {
        fetch("/api/segments/product").then(r => r.ok ? r.json() : null).then(d => d && setSegments(d))
      }, 8000)
    } catch {
      push("Could not reach the segmentation service", "error")
    } finally {
      setRefreshing(false)
    }
  }

  // ── Metrics ────────────────────────────────────────────────────────────────
  const total      = pagination?.total ?? 0
  const totalValue = products.reduce((acc, p) => acc + Number(p.price) * (p.stock ?? 0), 0)
  const outOfStock = products.filter(p => (p.stock ?? 0) === 0).length
  const avgMargin  = (() => {
    const wc = products.filter(p => p.cost && Number(p.cost) > 0)
    if (!wc.length) return null
    const m = wc.reduce((a, p) => a + ((Number(p.price) - Number(p.cost!)) / Number(p.price)) * 100, 0) / wc.length
    return `${m.toFixed(1)}%`
  })()

  const isFiltered = !!dSearch || !!stockFilter

  return (
    <div className="min-h-screen bg-slate-50/60 px-6 py-8 max-w-7xl mx-auto">

      {/* Toasts */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`px-4 py-3 rounded-xl shadow-lg text-sm font-medium pointer-events-auto ${
            t.type === "success" ? "bg-emerald-500 text-white"
              : t.type === "error" ? "bg-rose-500 text-white"
              : "bg-slate-900 text-white"
          }`}>{t.msg}</div>
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage your catalog, pricing, and stock levels.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {segments?.hasResults && canWrite && (
            <button
              onClick={handleRefreshInsights}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 transition disabled:opacity-60 disabled:cursor-wait"
            >
              <Sparkles size={14} className={refreshing ? "animate-pulse" : ""} />
              {refreshing ? "Refreshing…" : "Refresh insights"}
            </button>
          )}
          {canWrite && (
            <button
              onClick={() => setAddOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl bg-sky-500 text-white hover:bg-sky-600 transition shadow-sm"
            >
              <Plus size={14} />
              Add product
            </button>
          )}
        </div>
      </div>

      {/* Insufficient products notice */}
      {segments && segments.productCount < segments.minProductsNeeded && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 mb-6 flex items-center gap-3">
          <Sparkles size={16} className="text-amber-600 shrink-0" />
          <p className="text-sm text-amber-900">
            Add at least <strong>{segments.minProductsNeeded}</strong> products to unlock automated segmentation insights.
            You currently have <strong>{segments.productCount}</strong>.
          </p>
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Total products" value={total} icon={Package} accent />
        <MetricCard
          label="Catalog value"
          value={`EGP ${Math.round(totalValue).toLocaleString("en-EG")}`}
          icon={ArrowUpRight}
          sub="Stock × price"
        />
        <MetricCard label="Avg margin" value={avgMargin ?? "—"} icon={Layers} sub="With cost" />
        <MetricCard label="Out of stock" value={outOfStock} icon={X} sub="Need restock" />
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden">

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-50">
          <h2 className="text-sm font-semibold text-slate-800 shrink-0">
            All products
            {!loading && <span className="text-slate-400 font-normal"> ({total})</span>}
          </h2>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search products… (/)"
                className="w-full pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 bg-slate-50"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="relative">
              <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                value={stockFilter}
                onChange={e => setStockFilter(e.target.value as StockFilter)}
                className="appearance-none pl-8 pr-7 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 bg-slate-50 cursor-pointer"
              >
                <option value="">All stock</option>
                <option value="ok">In stock</option>
                <option value="low">Low stock</option>
                <option value="out">Out of stock</option>
              </select>
            </div>
          </div>
        </div>

        {/* Body */}
        {loading ? (
          <div className="py-24 flex flex-col items-center gap-3 text-slate-400">
            <RefreshCw size={24} className="animate-spin text-sky-300" />
            <span className="text-sm">Loading products…</span>
          </div>
        ) : products.length === 0 ? (
          <div className="py-24 flex flex-col items-center gap-3 text-slate-400">
            <Package size={40} className="text-slate-200" />
            <p className="text-sm font-medium text-slate-500">
              {isFiltered ? "No products match your filters" : "No products yet"}
            </p>
            {!isFiltered && canWrite && (
              <button onClick={() => setAddOpen(true)} className="text-sm text-sky-600 hover:underline">
                Add your first product
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-170">
              <thead>
                <tr className="text-left border-b border-slate-50">
                  {["Product & Categories", "Price", "Cost", "Margin", "Stock"].map(h => (
                    <th key={h} className="py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wide">{h}</th>
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

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-50">
            <span className="text-xs text-slate-400">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={!pagination.hasPrev}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 text-slate-700 hover:border-sky-300 hover:text-sky-700 disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-700 transition-colors"
              >
                Prev
              </button>
              <button
                disabled={!pagination.hasNext}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 text-slate-700 hover:border-sky-300 hover:text-sky-700 disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-700 transition-colors"
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
        onOpenChange={(v) => !v && setEditProduct(null)}
        onSave={handleUpdate}
        existing={editProduct}
        existingCategoryIds={editProduct ? productCatMap[editProduct.id] ?? [] : []}
        canWrite={canWrite}
        categories={categories}
      />
      <ProductDetailDialog
        product={detailProduct}
        open={!!detailProduct}
        onOpenChange={(v) => !v && setDetailProduct(null)}
        onEdit={handleOpenEdit}
        onDelete={async (p) => { setDeleteProduct(p) }}
        canWrite={canWrite}
        canDelete={canDelete}
      />

      {/* Delete confirm */}
      {deleteProduct && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 grid place-items-center p-4" onClick={() => setDeleteProduct(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 rounded-xl bg-rose-50 shrink-0">
                <Trash2 size={18} className="text-rose-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-slate-900">Delete product?</h3>
                <p className="text-sm text-slate-500 mt-1">
                  <strong>{deleteProduct.name}</strong> will be removed.
                  {deleteProduct.unitsSold ? (
                    <> It appears in <strong>{deleteProduct.unitsSold}</strong> order line(s); those orders will lose their product reference.</>
                  ) : null}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                onClick={() => setDeleteProduct(null)}
                className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteProduct, !!deleteProduct.unitsSold)}
                disabled={deleteLoading}
                className="px-3 py-2 text-sm font-medium rounded-xl bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-60 disabled:cursor-wait"
              >
                {deleteLoading ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}