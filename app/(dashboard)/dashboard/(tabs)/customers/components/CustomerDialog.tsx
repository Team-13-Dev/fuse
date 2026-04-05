"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { InferSelectModel, InferInsertModel } from "drizzle-orm"
import { customer } from "@/db/schema" 


export type Customer = InferSelectModel<typeof customer>
export type NewCustomer = InferInsertModel<typeof customer>


type NullifyUndefined<T> = {
  [K in keyof T]: undefined extends T[K] ? Exclude<T[K], undefined> | null : T[K]
}
 
export type CustomerFormData = NullifyUndefined<Omit<NewCustomer, "id" | "businessId">>

 
const SEGMENTS = ["VIP", "Regular", "New", "At-risk", "Inactive"]

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: CustomerFormData) => void
  existing?: Customer | null
}

const empty: CustomerFormData = {
  clerkId: null,
  fullName: "",
  email: null,
  phoneNumber: null,
  segment: "New",
}

export function CustomerDialog({ open, onOpenChange, onSave, existing }: Props) {
  const [form, setForm] = useState<CustomerFormData>(empty)
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerFormData, string>>>({})

  useEffect(() => {
    if (open) {
      setForm(existing ? {
        clerkId: existing.clerkId,
        fullName: existing.fullName,
        email: existing.email,
        phoneNumber: existing.phoneNumber,
        segment: existing.segment,
      } : empty)
      setErrors({})
    }
  }, [open, existing])

  function set(field: keyof CustomerFormData, value: string) {
    setForm(prev => ({ ...prev, [field]: value || null }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  function validate() {
    const e: typeof errors = {}
    if (!form.fullName.trim()) e.fullName = "Full name is required"
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email"
    return e
  }

  function handleSave() {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    onSave({ ...form, fullName: form.fullName.trim() })
    onOpenChange(false)
  }

  const isEdit = !!existing

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit customer" : "Add new customer"}</DialogTitle>
          <DialogDescription>
            {isEdit ? `Editing ${existing?.fullName}` : "Fill in the details to create a new customer record."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">
              Full name <span className="text-red-500">*</span>
            </label>
            <input
              value={form.fullName}
              onChange={e => set("fullName", e.target.value)}
              placeholder="e.g. Sara Ali"
              maxLength={255}
              className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.fullName ? "border-red-400" : "border-border"}`}
            />
            {errors.fullName && <span className="text-xs text-red-500">{errors.fullName}</span>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                value={form.email ?? ""}
                onChange={e => set("email", e.target.value)}
                placeholder="name@example.com"
                maxLength={255}
                className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.email ? "border-red-400" : "border-border"}`}
              />
              {errors.email && <span className="text-xs text-red-500">{errors.email}</span>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Phone</label>
              <input
                value={form.phoneNumber ?? ""}
                onChange={e => set("phoneNumber", e.target.value)}
                placeholder="+20 1..."
                maxLength={50}
                className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Segment */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Segment</label>
            <select
              value={form.segment ?? ""}
              onChange={e => set("segment", e.target.value)}
              className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-background"
            >
              <option value="">No segment</option>
              {SEGMENTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 transition"
          >
            {isEdit ? "Save changes" : "Add customer"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}