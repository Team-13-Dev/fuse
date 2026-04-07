"use client"

import { useState, useEffect, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { InferSelectModel, InferInsertModel } from "drizzle-orm"
import { product } from "@/db/schema"
import { Loader2, X, Tag } from "lucide-react"
import { Category } from "../categories/CategoryDialog"

export type Product    = InferSelectModel<typeof product>
export type NewProduct = InferInsertModel<typeof product>

type NullifyUndefined<T> = {
  [K in keyof T]: undefined extends T[K] ? Exclude<T[K], undefined> | null : T[K]
}

export type ProductFormData = NullifyUndefined<
  Omit<NewProduct, "id" | "businessId" | "externalAccId" | "lastReprice" | "prediction" | "imagesUrl">
> & {
  categoryIds: string[]
}

// ─── Validation ───────────────────────────────────────────────────────────────
function validate(form: ProductFormData) {
  const errors: Partial<Record<keyof ProductFormData, string>> = {}

  if (!form.name.trim()) errors.name = "Product name is required"
  else if (form.name.trim().length < 2) errors.name = "Must be at least 2 characters"

  const priceNum = Number(form.price)
  if (form.price === null || form.price === "" || isNaN(priceNum))
    errors.price = "A valid price is required"
  else if (priceNum < 0) errors.price = "Price cannot be negative"
  else if (priceNum > 999_999_999.99) errors.price = "Price exceeds maximum allowed value"

  if (form.cost !== null && form.cost !== "") {
    const costNum = Number(form.cost)
    if (isNaN(costNum)) errors.cost = "Enter a valid cost"
    else if (costNum < 0) errors.cost = "Cost cannot be negative"
  }

  if (form.stock !== null && form.stock !== undefined) {
    const stockNum = Number(form.stock)
    if (isNaN(stockNum) || !Number.isInteger(stockNum)) errors.stock = "Stock must be a whole number"
    else if (stockNum < 0) errors.stock = "Stock cannot be negative"
  }

  return errors
}

// ─── Flatten tree for display ─────────────────────────────────────────────────
function flattenTree(nodes: Category[], depth = 0): { cat: Category; depth: number }[] {
  const result: { cat: Category; depth: number }[] = []
  for (const node of nodes) {
    result.push({ cat: node, depth })
    if (node.children?.length) result.push(...flattenTree(node.children, depth + 1))
  }
  return result
}

type Props = {
  open:          boolean
  onOpenChange:  (open: boolean) => void
  onSave:        (data: ProductFormData) => Promise<void>
  existing?:     Product | null
  existingCategoryIds?: string[]
  canWrite:      boolean
  categories:    Category[]   // full category tree
}

const EMPTY: ProductFormData = {
  name:        "",
  price:       "0",
  description: null,
  stock:       0,
  cost:        null,
  categoryIds: [],
}

export function ProductDialog({ open, onOpenChange, onSave, existing, existingCategoryIds, canWrite, categories }: Props) {
  const [form,     setForm]     = useState<ProductFormData>(EMPTY)
  const [errors,   setErrors]   = useState<Partial<Record<keyof ProductFormData, string>>>({})
  const [saving,   setSaving]   = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [catSearch, setCatSearch] = useState("")
  const nameRef = useRef<HTMLInputElement>(null)

  const isEdit = !!existing

  useEffect(() => {
    if (!open) return
    setForm(existing ? {
      name:        existing.name,
      price:       existing.price,
      description: existing.description,
      stock:       existing.stock,
      cost:        existing.cost,
      categoryIds: existingCategoryIds ?? [],
    } : EMPTY)
    setErrors({}); setApiError(null); setCatSearch("")
  }, [open, existing, existingCategoryIds])

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => nameRef.current?.focus(), 80)
      return () => clearTimeout(t)
    }
  }, [open])

  function setField<K extends keyof ProductFormData>(field: K, value: ProductFormData[K]) {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
    if (apiError) setApiError(null)
  }

  function toggleCategory(catId: string) {
    setField(
      "categoryIds",
      form.categoryIds.includes(catId)
        ? form.categoryIds.filter(id => id !== catId)
        : [...form.categoryIds, catId]
    )
  }

  async function handleSave() {
    if (!canWrite || saving) return
    const e = validate(form)
    if (Object.keys(e).length) { setErrors(e); return }
    setSaving(true); setApiError(null)
    try {
      await onSave({
        ...form,
        name:  form.name.trim(),
        price: String(Number(form.price).toFixed(2)),
        cost:  form.cost !== null && form.cost !== "" ? String(Number(form.cost).toFixed(2)) : null,
        stock: form.stock !== null ? Math.trunc(Number(form.stock)) : 0,
      })
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Something went wrong — please try again")
    } finally {
      setSaving(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey && !(e.target instanceof HTMLTextAreaElement) && !(e.target instanceof HTMLInputElement && e.currentTarget !== e.target)) {
      handleSave()
    }
  }

  const inputCls = (field: keyof ProductFormData) =>
    `w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500 transition
     disabled:opacity-50 disabled:cursor-not-allowed
     ${errors[field] ? "border-red-400 focus:ring-red-400" : "border-border"}`

  // Filtered flat list for category picker
  const flatCats = flattenTree(categories).filter(({ cat }) =>
    !catSearch || cat.name.toLowerCase().includes(catSearch.toLowerCase())
  )

  // Get names of selected categories for pill display
  const allFlat  = flattenTree(categories)
  const selectedCats = form.categoryIds
    .map(id => allFlat.find(({ cat }) => cat.id === id)?.cat)
    .filter(Boolean) as Category[]

  return (
    <Dialog open={open} onOpenChange={v => { if (!saving) onOpenChange(v) }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit product" : "Add new product"}</DialogTitle>
          <DialogDescription>
            {isEdit ? `Editing "${existing?.name}"` : "Fill in the details to create a new product."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {apiError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {apiError}
            </div>
          )}

          {/* Name */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">
              Product name <span className="text-red-500">*</span>
            </label>
            <input
              ref={nameRef}
              value={form.name}
              onChange={e => setField("name", e.target.value)}
              placeholder="e.g. Wireless Headphones"
              maxLength={255}
              disabled={!canWrite || saving}
              className={inputCls("name")}
            />
            {errors.name && <span className="text-xs text-red-500">{errors.name}</span>}
          </div>

          {/* Price & Cost */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Price (EGP) <span className="text-red-500">*</span></label>
              <input
                type="number" min="0" step="0.01"
                value={form.price ?? ""}
                onChange={e => setField("price", e.target.value)}
                placeholder="0.00"
                disabled={!canWrite || saving}
                className={inputCls("price")}
              />
              {errors.price && <span className="text-xs text-red-500">{errors.price}</span>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Cost (EGP)</label>
              <input
                type="number" min="0" step="0.01"
                value={form.cost ?? ""}
                onChange={e => setField("cost", e.target.value || null)}
                placeholder="0.00"
                disabled={!canWrite || saving}
                className={inputCls("cost")}
              />
              {errors.cost && <span className="text-xs text-red-500">{errors.cost}</span>}
            </div>
          </div>

          {/* Stock */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Stock quantity</label>
            <input
              type="number" min="0" step="1"
              value={form.stock ?? ""}
              onChange={e => setField("stock", e.target.value !== "" ? Number(e.target.value) : 0)}
              placeholder="0"
              disabled={!canWrite || saving}
              className={inputCls("stock")}
            />
            {errors.stock && <span className="text-xs text-red-500">{errors.stock}</span>}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={form.description ?? ""}
              onChange={e => setField("description", e.target.value || null)}
              placeholder="Short product description..."
              rows={2}
              disabled={!canWrite || saving}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* ── Category Picker ─────────────────────────────────────────── */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Tag size={13} className="text-indigo-500" />
                Categories
              </label>
              {selectedCats.length > 0 && (
                <button
                  onClick={() => setField("categoryIds", [])}
                  className="text-xs text-muted-foreground hover:text-red-500 transition"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Selected pills */}
            {selectedCats.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedCats.map(cat => (
                  <span
                    key={cat.id}
                    className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium"
                  >
                    {cat.name}
                    {canWrite && (
                      <button
                        onClick={() => toggleCategory(cat.id)}
                        className="hover:text-red-500 transition"
                      >
                        <X size={11} />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            )}

            {/* Searchable category list */}
            {categories.length > 0 && canWrite && (
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="px-2 py-1.5 border-b border-border bg-gray-50">
                  <input
                    value={catSearch}
                    onChange={e => setCatSearch(e.target.value)}
                    placeholder="Search categories..."
                    className="w-full text-xs bg-transparent focus:outline-none"
                    disabled={saving}
                  />
                </div>
                <div className="max-h-36 overflow-y-auto">
                  {flatCats.length === 0 ? (
                    <p className="text-xs text-gray-400 px-3 py-3 text-center">No categories found</p>
                  ) : (
                    flatCats.map(({ cat, depth }) => {
                      const selected = form.categoryIds.includes(cat.id)
                      return (
                        <button
                          key={cat.id}
                          onClick={() => toggleCategory(cat.id)}
                          disabled={saving}
                          className={`w-full text-left text-xs px-3 py-2 flex items-center gap-2 transition
                            ${selected ? "bg-indigo-50 text-indigo-700" : "hover:bg-gray-50 text-gray-700"}`}
                          style={{ paddingLeft: `${12 + depth * 16}px` }}
                        >
                          <span className={`w-3.5 h-3.5 rounded border shrink-0 flex items-center justify-center transition
                            ${selected ? "bg-indigo-600 border-indigo-600" : "border-gray-300"}`}
                          >
                            {selected && (
                              <svg viewBox="0 0 10 8" fill="none" className="w-2 h-2">
                                <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </span>
                          {depth > 0 && <span className="text-gray-300 text-[10px]">└</span>}
                          {cat.name}
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            )}

            {categories.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No categories exist yet.{" "}
                <a href="/dashboard/categories" className="text-indigo-600 hover:underline">
                  Add categories first →
                </a>
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={() => { if (!saving) onOpenChange(false) }}
            disabled={saving}
            className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition disabled:opacity-50"
          >
            Cancel
          </button>
          {canWrite && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-60 flex items-center gap-2"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? "Save changes" : "Add product"}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}