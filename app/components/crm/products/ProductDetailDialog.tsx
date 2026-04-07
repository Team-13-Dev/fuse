"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { InferSelectModel } from "drizzle-orm"
import { product } from "@/db/schema"
import { Package, Tag, DollarSign, Layers, FileText, Hash, ShoppingCart, Calendar } from "lucide-react"

export type Product = InferSelectModel<typeof product> & {
  unitsSold?:    number
  lastSoldDate?: string | Date | null
}

type Props = {
  product:      Product | null
  open:         boolean
  onOpenChange: (open: boolean) => void
  onEdit:       (product: Product) => void
  onDelete:     (product: Product) => void
  canWrite:     boolean
  canDelete:    boolean
}

function Field({
  label,
  value,
  mono = false,
  icon: Icon,
}: {
  label:  string
  value:  string | number | null | undefined
  mono?:  boolean
  icon?:  React.ElementType
}) {
  const display = value !== null && value !== undefined && value !== "" ? value : "—"
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground flex items-center gap-1">
        {Icon && <Icon size={11} />}
        {label}
      </span>
      <span className={`text-sm text-foreground break-all ${mono ? "font-mono text-[11px]" : ""}`}>
        {display}
      </span>
    </div>
  )
}

function getStockBadge(stock: number | null) {
  const qty = stock ?? 0
  if (qty === 0) return { label: "Out of stock", bg: "#FCEBEB", text: "#791F1F" }
  if (qty <= 10) return { label: "Low stock",    bg: "#FEF3CD", text: "#664D03" }
  return              { label: "In stock",       bg: "#E1F5EE", text: "#085041" }
}

function getMargin(price: string, cost: string | null) {
  const p = Number(price)
  const c = Number(cost)
  if (!cost || isNaN(c) || c === 0 || p === 0) return null
  return `${(((p - c) / p) * 100).toFixed(1)}%`
}

export function ProductDetailDialog({
  product,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  canWrite,
  canDelete,
}: Props) {
  if (!product) return null

  const stockBadge  = getStockBadge(product.stock)
  const margin      = getMargin(product.price, product.cost)
  const unitsSold   = product.unitsSold ?? 0
  const lastSold    = product.lastSoldDate
    ? new Date(product.lastSoldDate).toLocaleDateString("en-EG", { year: "numeric", month: "short", day: "numeric" })
    : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Product details</DialogTitle>
        </DialogHeader>

        {/* Identity block */}
        <div className="flex items-start gap-3 py-2">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
            <Package size={22} className="text-indigo-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate">{product.name}</p>
            <div className="flex items-center gap-2 flex-wrap mt-1">
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: stockBadge.bg, color: stockBadge.text }}
              >
                {stockBadge.label}
              </span>
              {margin && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-indigo-50 text-indigo-700">
                  {margin} margin
                </span>
              )}
              {unitsSold > 0 && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <ShoppingCart size={11} />
                  {unitsSold} sold
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Fields */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border pt-4">
          <Field
            label="Price"
            value={`EGP ${Number(product.price).toLocaleString("en-EG", { minimumFractionDigits: 2 })}`}
            icon={DollarSign}
          />
          <Field
            label="Cost"
            value={product.cost ? `EGP ${Number(product.cost).toLocaleString("en-EG", { minimumFractionDigits: 2 })}` : null}
            icon={Tag}
          />
          <Field label="Stock qty"      value={product.stock ?? 0}    icon={Layers}   />
          <Field label="Units sold"     value={unitsSold}              icon={ShoppingCart} />
          <Field label="Last sold"      value={lastSold}               icon={Calendar} />
          <Field label="External ID"    value={product.externalAccId}  icon={Hash} mono />
          <div className="col-span-2">
            <Field label="Description"  value={product.description}    icon={FileText} />
          </div>
          <div className="col-span-2">
            <Field label="Product ID"   value={product.id}             icon={Hash} mono />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between gap-2 pt-2">
          <div>
            {canDelete && (
              <button
                onClick={() => { onOpenChange(false); onDelete(product) }}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition"
              >
                Delete
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition"
            >
              Close
            </button>
            {canWrite && (
              <button
                onClick={() => { onOpenChange(false); onEdit(product) }}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
              >
                Edit
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}