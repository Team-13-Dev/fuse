"use client"

import { useState, useEffect, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, ChevronRight } from "lucide-react"

export type Category = {
  id:          string
  parentId:    string | null
  name:        string
  slug:        string
  description: string | null
  imageUrl:    string | null
  children?:   Category[]
  productCount?: number
}

export type CategoryFormData = {
  name:        string
  parentId:    string | null
  description: string | null
  imageUrl:    string | null
}

function validate(form: CategoryFormData) {
  const errors: Partial<Record<keyof CategoryFormData, string>> = {}
  if (!form.name.trim())
    errors.name = "Category name is required"
  else if (form.name.trim().length > 100)
    errors.name = "Must be 100 characters or fewer"
  if (form.imageUrl?.trim() && !isValidUrl(form.imageUrl.trim()))
    errors.imageUrl = "Enter a valid URL"
  return errors
}

function isValidUrl(url: string): boolean {
  try { new URL(url); return true; } catch { return false; }
}

// Flatten tree into indent-aware options for <select>
function flattenTree(nodes: Category[], depth = 0): { cat: Category; depth: number }[] {
  const result: { cat: Category; depth: number }[] = []
  for (const node of nodes) {
    result.push({ cat: node, depth })
    if (node.children?.length) {
      result.push(...flattenTree(node.children, depth + 1))
    }
  }
  return result
}

type Props = {
  open:         boolean
  onOpenChange: (open: boolean) => void
  onSave:       (data: CategoryFormData) => Promise<void>
  existing?:    Category | null
  allCategories: Category[]   // full tree for parent selector
  canWrite:     boolean
}

const EMPTY: CategoryFormData = {
  name:        "",
  parentId:    null,
  description: null,
  imageUrl:    null,
}

export function CategoryDialog({ open, onOpenChange, onSave, existing, allCategories, canWrite }: Props) {
  const [form,     setForm]     = useState<CategoryFormData>(EMPTY)
  const [errors,   setErrors]   = useState<Partial<Record<keyof CategoryFormData, string>>>({})
  const [saving,   setSaving]   = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  const isEdit = !!existing

  useEffect(() => {
    if (!open) return
    setForm(existing ? {
      name:        existing.name,
      parentId:    existing.parentId,
      description: existing.description,
      imageUrl:    existing.imageUrl,
    } : EMPTY)
    setErrors({})
    setApiError(null)
  }, [open, existing])

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => nameRef.current?.focus(), 80)
      return () => clearTimeout(t)
    }
  }, [open])

  function setField<K extends keyof CategoryFormData>(field: K, value: CategoryFormData[K]) {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
    if (apiError) setApiError(null)
  }

  async function handleSave() {
    if (!canWrite || saving) return
    const e = validate(form)
    if (Object.keys(e).length) { setErrors(e); return }
    setSaving(true); setApiError(null)
    try {
      await onSave({ ...form, name: form.name.trim() })
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Something went wrong — please try again")
    } finally {
      setSaving(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !(e.target instanceof HTMLTextAreaElement)) handleSave()
  }

  // Exclude self and own descendants from parent options (prevent cycles)
  function isDescendantOf(cat: Category, targetId: string): boolean {
    if (cat.id === targetId) return true
    return (cat.children ?? []).some(c => isDescendantOf(c, targetId))
  }

  const flatOptions = flattenTree(allCategories).filter(({ cat }) =>
    !existing || (cat.id !== existing.id && !isDescendantOf(cat, existing.id))
  )

  const inputCls = (field: keyof CategoryFormData) =>
    `w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500 transition
     disabled:opacity-50 disabled:cursor-not-allowed
     ${errors[field] ? "border-red-400 focus:ring-red-400" : "border-border"}`

  return (
    <Dialog open={open} onOpenChange={v => { if (!saving) onOpenChange(v) }}>
      <DialogContent className="sm:max-w-md" onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit category" : "Add new category"}</DialogTitle>
          <DialogDescription>
            {isEdit ? `Editing "${existing?.name}"` : "Categories organise your product catalog."}
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
              Name <span className="text-red-500">*</span>
            </label>
            <input
              ref={nameRef}
              value={form.name}
              onChange={e => setField("name", e.target.value)}
              placeholder="e.g. Accessories"
              maxLength={100}
              disabled={!canWrite || saving}
              className={inputCls("name")}
            />
            {errors.name && <span className="text-xs text-red-500">{errors.name}</span>}
          </div>

          {/* Parent category */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Parent category</label>
            <select
              value={form.parentId ?? ""}
              onChange={e => setField("parentId", e.target.value || null)}
              disabled={!canWrite || saving}
              className={`${inputCls("parentId")} bg-background`}
            >
              <option value="">None (root category)</option>
              {flatOptions.map(({ cat, depth }) => (
                <option key={cat.id} value={cat.id}>
                  {"  ".repeat(depth)}{depth > 0 ? "└ " : ""}{cat.name}
                </option>
              ))}
            </select>
            <span className="text-xs text-muted-foreground">
              Optional — leave empty to make this a top-level category.
            </span>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={form.description ?? ""}
              onChange={e => setField("description", e.target.value || null)}
              placeholder="Short description..."
              rows={2}
              disabled={!canWrite || saving}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Image URL */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Image URL</label>
            <input
              value={form.imageUrl ?? ""}
              onChange={e => setField("imageUrl", e.target.value || null)}
              placeholder="https://..."
              type="url"
              disabled={!canWrite || saving}
              className={inputCls("imageUrl")}
            />
            {errors.imageUrl && <span className="text-xs text-red-500">{errors.imageUrl}</span>}
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
              className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 transition disabled:opacity-60 flex items-center gap-2"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? "Save changes" : "Add category"}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}