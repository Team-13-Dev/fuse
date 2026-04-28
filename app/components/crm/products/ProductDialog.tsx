"use client"

import { useState, useEffect, useRef } from "react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { InferSelectModel, InferInsertModel } from "drizzle-orm"
import { product } from "@/db/schema"
import { Loader2, X, Tag, Package, DollarSign, Layers, FileText, ChevronDown, ChevronUp } from "lucide-react"
import { Category } from "../categories/CategoryDialog"

export type Product    = InferSelectModel<typeof product>
export type NewProduct = InferInsertModel<typeof product>

type NullifyUndefined<T> = {
  [K in keyof T]: undefined extends T[K] ? Exclude<T[K], undefined> | null : T[K]
}

export type ProductFormData = NullifyUndefined<
  Omit<NewProduct, "id" | "businessId" | "externalAccId" | "lastReprice" | "prediction" | "imagesUrl">
> & { categoryIds: string[] }

const EMPTY: ProductFormData = {
  name: "", price: "0", description: null, stock: 0, cost: null, categoryIds: [],
}

function validate(form: ProductFormData) {
  const e: Partial<Record<keyof ProductFormData, string>> = {}
  if (!form.name.trim())                        e.name  = "Product name is required"
  else if (form.name.trim().length < 2)          e.name  = "Must be at least 2 characters"
  const p = Number(form.price)
  if (form.price === null || form.price === "" || isNaN(p))   e.price = "A valid price is required"
  else if (p < 0)                                e.price = "Price cannot be negative"
  if (form.cost !== null && form.cost !== "") {
    const c = Number(form.cost)
    if (isNaN(c))  e.cost = "Enter a valid cost"
    else if (c < 0) e.cost = "Cost cannot be negative"
    else if (c > p) e.cost = "Cost cannot exceed the selling price"
  }
  if (form.stock !== null && form.stock !== undefined) {
    const s = Number(form.stock)
    if (isNaN(s) || !Number.isInteger(s))  e.stock = "Stock must be a whole number"
    else if (s < 0)                         e.stock = "Stock cannot be negative"
  }
  return e
}

function flattenTree(nodes: unknown, depth = 0): { cat: Category; depth: number }[] {
  const result: { cat: Category; depth: number }[] = []
  if (!Array.isArray(nodes)) return result
  for (const node of nodes) {
    result.push({ cat: node, depth })
    if (node.children?.length) result.push(...flattenTree(node.children, depth + 1))
  }
  return result
}

type Props = {
  open:               boolean
  onOpenChange:       (v: boolean) => void
  onSave:             (data: ProductFormData) => Promise<void>
  existing?:          Product | null
  existingCategoryIds?: string[]
  canWrite:           boolean
  categories:         Category[]
}

export function ProductDialog({ open, onOpenChange, onSave, existing, existingCategoryIds, canWrite, categories }: Props) {
  const [form,      setForm]      = useState<ProductFormData>(EMPTY)
  const [errors,    setErrors]    = useState<Partial<Record<keyof ProductFormData, string>>>({})
  const [saving,    setSaving]    = useState(false)
  const [apiError,  setApiError]  = useState<string | null>(null)
  const [catOpen,   setCatOpen]   = useState(false)
  const [catSearch, setCatSearch] = useState("")
  const nameRef = useRef<HTMLInputElement>(null)
  const isEdit  = !!existing

  // Derived margin preview
  const price  = Number(form.price)
  const cost   = form.cost !== null && form.cost !== "" ? Number(form.cost) : null
  const margin = cost !== null && price > 0 ? ((price - cost) / price) * 100 : null

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
    setErrors({}); setApiError(null); setCatSearch(""); setCatOpen(false)
  }, [open, existing, existingCategoryIds])

  useEffect(() => {
    if (open) { const t = setTimeout(() => nameRef.current?.focus(), 80); return () => clearTimeout(t) }
  }, [open])

  function setField<K extends keyof ProductFormData>(k: K, v: ProductFormData[K]) {
    setForm(p => ({ ...p, [k]: v }))
    if (errors[k]) setErrors(p => ({ ...p, [k]: undefined }))
    if (apiError) setApiError(null)
  }

  function toggleCat(id: string) {
    setField("categoryIds", form.categoryIds.includes(id)
      ? form.categoryIds.filter(c => c !== id)
      : [...form.categoryIds, id])
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
      setApiError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  const inp = (field: keyof ProductFormData) =>
    `w-full border rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition
     disabled:opacity-50 disabled:cursor-not-allowed
     ${errors[field] ? "border-red-400 focus:ring-red-400" : "border-gray-200"}`

  const flatCats = flattenTree(categories).filter(({ cat }) =>
    !catSearch || cat.name.toLowerCase().includes(catSearch.toLowerCase())
  )
  const allFlat     = flattenTree(categories)
  const selectedCats = form.categoryIds
    .map(id => allFlat.find(({ cat }) => cat.id === id)?.cat)
    .filter(Boolean) as Category[]

  return (
    <Dialog open={open} onOpenChange={v => { if (!saving) onOpenChange(v) }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Package size={13} className="text-indigo-600" />
            </div>
            {isEdit ? "Edit Product" : "Add New Product"}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? `Editing "${existing?.name}"` : "Fill in the details below to add a product to your catalog."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {apiError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5 flex items-start gap-2">
              <X size={14} className="shrink-0 mt-0.5" />
              {apiError}
            </div>
          )}

          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-800">
              Product name <span className="text-red-400">*</span>
            </label>
            <input
              ref={nameRef}
              value={form.name}
              onChange={e => setField("name", e.target.value)}
              placeholder="e.g. Summer Linen Shirt"
              maxLength={255}
              disabled={!canWrite || saving}
              className={inp("name")}
            />
            {errors.name && <span className="text-xs text-red-500">{errors.name}</span>}
          </div>

          {/* Price + Cost */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-800">
                Selling price (EGP) <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <DollarSign size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="number" min="0" step="0.01"
                  value={form.price ?? ""}
                  onChange={e => setField("price", e.target.value)}
                  placeholder="0.00"
                  disabled={!canWrite || saving}
                  className={`${inp("price")} pl-8`}
                />
              </div>
              {errors.price && <span className="text-xs text-red-500">{errors.price}</span>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-800">
                Cost price (EGP)
                <span className="text-xs font-normal text-gray-400 ml-1">optional</span>
              </label>
              <div className="relative">
                <Tag size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="number" min="0" step="0.01"
                  value={form.cost ?? ""}
                  onChange={e => setField("cost", e.target.value || null)}
                  placeholder="0.00"
                  disabled={!canWrite || saving}
                  className={`${inp("cost")} pl-8`}
                />
              </div>
              {errors.cost && <span className="text-xs text-red-500">{errors.cost}</span>}
            </div>
          </div>

          {/* Margin preview */}
          {margin !== null && (
            <div className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm
              ${margin >= 40 ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : margin >= 20 ? "bg-amber-50 text-amber-700 border border-amber-200"
                : "bg-red-50 text-red-700 border border-red-200"}`}>
              <span className="font-semibold">Profit margin: {margin.toFixed(1)}%</span>
              <span className="text-xs opacity-70">
                (EGP {(price - (cost ?? 0)).toFixed(2)} per unit)
              </span>
            </div>
          )}

          {/* Stock */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-800">Stock quantity</label>
            <div className="relative">
              <Layers size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="number" min="0" step="1"
                value={form.stock ?? ""}
                onChange={e => setField("stock", e.target.value !== "" ? Number(e.target.value) : 0)}
                placeholder="0"
                disabled={!canWrite || saving}
                className={`${inp("stock")} pl-8`}
              />
            </div>
            {errors.stock && <span className="text-xs text-red-500">{errors.stock}</span>}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-800">
              Description
              <span className="text-xs font-normal text-gray-400 ml-1">optional</span>
            </label>
            <textarea
              value={form.description ?? ""}
              onChange={e => setField("description", e.target.value || null)}
              placeholder="Brief description of this product…"
              rows={3}
              disabled={!canWrite || saving}
              className={`${inp("description")} resize-none`}
            />
          </div>

          {/* Categories */}
          {categories.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-800">Categories</label>

              {/* Selected pills */}
              {selectedCats.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-1">
                  {selectedCats.map(cat => (
                    <span key={cat.id}
                      className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 font-medium">
                      {cat.name}
                      <button type="button" onClick={() => toggleCat(cat.id)} className="hover:opacity-60">
                        <X size={10}/>
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => setCatOpen(v => !v)}
                disabled={!canWrite || saving}
                className="flex items-center justify-between px-3.5 py-2.5 text-sm border border-gray-200
                  rounded-xl hover:border-indigo-300 transition text-gray-600 bg-white"
              >
                <span>{selectedCats.length ? `${selectedCats.length} selected` : "Select categories"}</span>
                {catOpen ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
              </button>

              {catOpen && (
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="p-2 border-b border-gray-100">
                    <input
                      value={catSearch}
                      onChange={e => setCatSearch(e.target.value)}
                      placeholder="Search categories…"
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg
                        focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    />
                  </div>
                  <div className="max-h-40 overflow-y-auto">
                    {flatCats.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-3">No categories found</p>
                    ) : flatCats.map(({ cat, depth }) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCat(cat.id)}
                        className={`w-full text-left flex items-center gap-2 px-3 py-2 text-sm hover:bg-indigo-50 transition
                          ${form.categoryIds.includes(cat.id) ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-700"}`}
                        style={{ paddingLeft: `${12 + depth * 16}px` }}
                      >
                        <span className={`w-3.5 h-3.5 rounded border shrink-0 flex items-center justify-center
                          ${form.categoryIds.includes(cat.id) ? "bg-indigo-600 border-indigo-600" : "border-gray-300"}`}>
                          {form.categoryIds.includes(cat.id) && (
                            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                              <path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                          )}
                        </span>
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-2">
          <button
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="px-4 py-2.5 text-sm rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          {canWrite && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl
                bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-60"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? "Saving…" : isEdit ? "Save changes" : "Add product"}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}