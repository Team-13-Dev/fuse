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
import { customer } from "@/db/schema"
import { Loader2 } from "lucide-react"

export type Customer    = InferSelectModel<typeof customer>
export type NewCustomer = InferInsertModel<typeof customer>

type NullifyUndefined<T> = {
  [K in keyof T]: undefined extends T[K] ? Exclude<T[K], undefined> | null : T[K]
}

export type CustomerFormData = NullifyUndefined<Omit<NewCustomer, "id" | "businessId">>

export const SEGMENTS = ["VIP", "Regular", "New", "At-risk", "Inactive"] as const
export type Segment = typeof SEGMENTS[number]

// ─── Validation helpers ───────────────────────────────────────────────────────
const EMAIL_RE  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE  = /^[+\d\s\-().]{7,20}$/

function validate(form: CustomerFormData) {
  const errors: Partial<Record<keyof CustomerFormData, string>> = {}

  if (!form.fullName.trim())
    errors.fullName = "Full name is required"
  else if (form.fullName.trim().length < 2)
    errors.fullName = "Must be at least 2 characters"

  if (form.email && !EMAIL_RE.test(form.email))
    errors.email = "Enter a valid email address"

  if (form.phoneNumber && !PHONE_RE.test(form.phoneNumber))
    errors.phoneNumber = "Enter a valid phone number"

  return errors
}

// ─── Types ────────────────────────────────────────────────────────────────────
type Props = {
  open:         boolean
  onOpenChange: (open: boolean) => void
  /** Called after successful server response – receives the persisted record */
  onSave:       (data: CustomerFormData) => Promise<void>
  existing?:    Customer | null
  canWrite:     boolean
}

const EMPTY: CustomerFormData = {
  clerkId:     null,
  fullName:    "",
  email:       null,
  phoneNumber: null,
  segment:     "New",
}

// ─── Component ────────────────────────────────────────────────────────────────
export function CustomerDialog({ open, onOpenChange, onSave, existing, canWrite }: Props) {
  const [form,    setForm]    = useState<CustomerFormData>(EMPTY)
  const [errors,  setErrors]  = useState<Partial<Record<keyof CustomerFormData, string>>>({})
  const [saving,  setSaving]  = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const firstInputRef = useRef<HTMLInputElement>(null)

  const isEdit = !!existing

  // Reset on open
  useEffect(() => {
    if (!open) return
    setForm(
      existing
        ? {
            clerkId:     existing.clerkId,
            fullName:    existing.fullName,
            email:       existing.email,
            phoneNumber: existing.phoneNumber,
            segment:     existing.segment,
          }
        : EMPTY
    )
    setErrors({})
    setApiError(null)
  }, [open, existing])

  // Auto-focus first field
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => firstInputRef.current?.focus(), 80)
      return () => clearTimeout(t)
    }
  }, [open])

  function setField(field: keyof CustomerFormData, raw: string) {
    const value = field === "fullName" ? raw : (raw || null)
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field])  setErrors(prev  => ({ ...prev, [field]: undefined }))
    if (apiError)       setApiError(null)
  }

  async function handleSave() {
    if (!canWrite || saving) return

    const e = validate(form)
    if (Object.keys(e).length) { setErrors(e); return }

    setSaving(true)
    setApiError(null)
    try {
      await onSave({ ...form, fullName: form.fullName.trim() })
      // Parent closes dialog on success
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Something went wrong — please try again")
    } finally {
      setSaving(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) handleSave()
  }

  const inputCls = (field: keyof CustomerFormData) =>
    `w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500 transition
     disabled:opacity-50 disabled:cursor-not-allowed
     ${errors[field] ? "border-red-400 focus:ring-red-400" : "border-border"}`

  return (
    <Dialog open={open} onOpenChange={v => { if (!saving) onOpenChange(v) }}>
      <DialogContent className="sm:max-w-md" onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit customer" : "Add new customer"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? `Editing record for ${existing?.fullName}`
              : "Fill in the details to create a new customer record."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">

          {/* API-level error banner */}
          {apiError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {apiError}
            </div>
          )}

          {/* Full Name */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">
              Full name <span className="text-red-500">*</span>
            </label>
            <input
              ref={firstInputRef}
              value={form.fullName ?? ""}
              onChange={e => setField("fullName", e.target.value)}
              placeholder="e.g. Sara Ali"
              maxLength={255}
              disabled={!canWrite || saving}
              className={inputCls("fullName")}
            />
            {errors.fullName && (
              <span className="text-xs text-red-500">{errors.fullName}</span>
            )}
          </div>

          {/* Email + Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                value={form.email ?? ""}
                onChange={e => setField("email", e.target.value)}
                placeholder="name@example.com"
                maxLength={255}
                disabled={!canWrite || saving}
                className={inputCls("email")}
              />
              {errors.email && (
                <span className="text-xs text-red-500">{errors.email}</span>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Phone</label>
              <input
                type="tel"
                value={form.phoneNumber ?? ""}
                onChange={e => setField("phoneNumber", e.target.value)}
                placeholder="+20 1..."
                maxLength={50}
                disabled={!canWrite || saving}
                className={inputCls("phoneNumber")}
              />
              {errors.phoneNumber && (
                <span className="text-xs text-red-500">{errors.phoneNumber}</span>
              )}
            </div>
          </div>

          {/* Segment */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Segment</label>
            <select
              value={form.segment ?? ""}
              onChange={e => setField("segment", e.target.value)}
              disabled={!canWrite || saving}
              className={`${inputCls("segment")} bg-background`}
            >
              <option value="">No segment</option>
              {SEGMENTS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Clerk ID – advanced / optional */}
          <details className="group">
            <summary className="text-xs text-muted-foreground cursor-pointer select-none hover:text-foreground transition list-none flex items-center gap-1">
              <span className="group-open:hidden">▸</span>
              <span className="hidden group-open:inline">▾</span>
              Advanced
            </summary>
            <div className="mt-2 flex flex-col gap-1">
              <label className="text-sm font-medium">Clerk ID</label>
              <input
                value={form.clerkId ?? ""}
                onChange={e => setField("clerkId", e.target.value)}
                placeholder="clerk_..."
                maxLength={255}
                disabled={!canWrite || saving}
                className={inputCls("clerkId")}
              />
              <span className="text-xs text-muted-foreground">
                Optional — links this record to a Clerk authentication identity.
              </span>
            </div>
          </details>
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
              disabled={saving || !canWrite}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 transition disabled:opacity-60 flex items-center gap-2"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? "Save changes" : "Add customer"}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}