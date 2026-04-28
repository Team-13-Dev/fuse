"use client"

import { useEffect, useState } from "react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Package, Tag, Layers, ShoppingCart, Calendar, Hash,
  FileText, Edit, Trash2, X, TrendingUp, Sparkles,
} from "lucide-react"
import type { Product } from "./ProductDialog"
import type { ProductSegment } from "@/lib/jobs/types"

const CLUSTER_PALETTE = [
  { bg: "#eff6ff", text: "#1d4ed8", dot: "#3b82f6" },
  { bg: "#f0fdf4", text: "#15803d", dot: "#22c55e" },
  { bg: "#fffbeb", text: "#b45309", dot: "#f59e0b" },
  { bg: "#faf5ff", text: "#7e22ce", dot: "#a855f7" },
  { bg: "#fff1f2", text: "#be123c", dot: "#f43f5e" },
  { bg: "#ecfeff", text: "#0e7490", dot: "#06b6d4" },
]

function clusterStyle(cluster: number) {
  return CLUSTER_PALETTE[cluster % CLUSTER_PALETTE.length]
}

interface Stats { unitsSold: number; lastSoldDate: string | null }

type Props = {
  product:      Product | null
  open:         boolean
  onOpenChange: (open: boolean) => void
  onEdit:       (p: Product) => void
  onDelete:     (p: Product) => Promise<void>
  canWrite:     boolean
  canDelete:    boolean
  segment?:     ProductSegment
}

export function ProductDetailDialog({ product, open, onOpenChange, onEdit, onDelete, canWrite, canDelete, segment }: Props) {
  const [stats,        setStats]        = useState<Stats | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)
  const [deleting,     setDeleting]     = useState(false)
  const [confirmDel,   setConfirmDel]   = useState(false)

  useEffect(() => {
    if (!open || !product) { setStats(null); setConfirmDel(false); return }
    setLoadingStats(true)
    fetch(`/api/products/${product.id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) setStats({ unitsSold: d.unitsSold ?? 0, lastSoldDate: d.lastSoldDate ?? null })
      })
      .finally(() => setLoadingStats(false))
  }, [open, product])

  if (!product) return null

  const price    = Number(product.price)
  const cost     = product.cost ? Number(product.cost) : null
  const margin   = cost !== null ? ((price - cost) / price) * 100 : null
  const lastSold = stats?.lastSoldDate
    ? new Date(stats.lastSoldDate).toLocaleDateString("en-EG", { month: "short", day: "numeric", year: "numeric" })
    : "—"

  async function handleDelete() {
    if (!confirmDel) { setConfirmDel(true); return }
    setDeleting(true)
    try { await onDelete(product!); onOpenChange(false) }
    finally { setDeleting(false); setConfirmDel(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Package size={14} className="text-indigo-600" />
            </div>
            Product Details
          </DialogTitle>
        </DialogHeader>

        {/* Product name + ID */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <h2 className="text-base font-bold text-gray-900 mb-0.5">{product.name}</h2>
          {product.description && (
            <p className="text-sm text-gray-500 leading-relaxed">{product.description}</p>
          )}
          <p className="text-[10px] text-gray-400 mt-2 font-mono">{product.id}</p>
        </div>

        {/* Segment chip */}
        {segment && (
          <div className="mb-4">
            <div className="flex items-center gap-2 p-3 rounded-xl border"
              style={{ background: clusterStyle(segment.cluster).bg, borderColor: clusterStyle(segment.cluster).dot + "40" }}>
              <Sparkles size={13} style={{ color: clusterStyle(segment.cluster).dot }} />
              <span className="text-sm font-semibold" style={{ color: clusterStyle(segment.cluster).text }}>
                {segment.clusterName}
              </span>
              <span className="text-xs ml-auto" style={{ color: clusterStyle(segment.cluster).text }}>
                AI Segment
              </span>
            </div>
          </div>
        )}

        {/* Pricing & margin */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center bg-indigo-50 rounded-xl p-3">
            <p className="text-xs text-indigo-600 font-medium mb-1">Price</p>
            <p className="text-base font-bold text-indigo-900">
              EGP {price.toLocaleString("en-EG", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="text-center bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 font-medium mb-1">Cost</p>
            <p className="text-base font-bold text-gray-700">
              {cost !== null ? `EGP ${cost.toLocaleString("en-EG", { minimumFractionDigits: 2 })}` : "—"}
            </p>
          </div>
          <div className={`text-center rounded-xl p-3 ${
            margin === null ? "bg-gray-50" :
            margin >= 40 ? "bg-emerald-50" : margin >= 20 ? "bg-amber-50" : "bg-red-50"
          }`}>
            <p className={`text-xs font-medium mb-1 ${
              margin === null ? "text-gray-400" :
              margin >= 40 ? "text-emerald-600" : margin >= 20 ? "text-amber-600" : "text-red-600"
            }`}>Margin</p>
            <p className={`text-base font-bold ${
              margin === null ? "text-gray-400" :
              margin >= 40 ? "text-emerald-700" : margin >= 20 ? "text-amber-700" : "text-red-700"
            }`}>
              {margin !== null ? `${margin.toFixed(1)}%` : "—"}
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
            <Layers size={15} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">In stock</p>
              <p className={`text-sm font-bold ${
                (product.stock ?? 0) === 0 ? "text-red-600" :
                (product.stock ?? 0) <= 10 ? "text-amber-600" : "text-gray-900"
              }`}>{product.stock ?? 0} units</p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
            <ShoppingCart size={15} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">Units sold</p>
              <p className="text-sm font-bold text-gray-900">
                {loadingStats ? "…" : (stats?.unitsSold ?? 0).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
            <Calendar size={15} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">Last sold</p>
              <p className="text-sm font-bold text-gray-900">{loadingStats ? "…" : lastSold}</p>
            </div>
          </div>
          {product.externalAccId && (
            <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
              <Hash size={15} className="text-gray-400" />
              <div className="min-w-0">
                <p className="text-xs text-gray-400">External ID</p>
                <p className="text-sm font-mono text-gray-700 truncate">{product.externalAccId}</p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
          {canDelete ? (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-xl transition
                ${confirmDel
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "border border-red-200 text-red-600 hover:bg-red-50"}`}
            >
              <Trash2 size={13}/> {confirmDel ? "Confirm delete" : "Delete"}
            </button>
          ) : <div />}
          <div className="flex gap-2">
            <button
              onClick={() => onOpenChange(false)}
              className="px-3.5 py-2 text-sm rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
            >
              Close
            </button>
            {canWrite && (
              <button
                onClick={() => { onOpenChange(false); onEdit(product) }}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition"
              >
                <Edit size={13}/> Edit
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}