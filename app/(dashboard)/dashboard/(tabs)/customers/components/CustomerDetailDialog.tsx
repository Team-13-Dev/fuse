"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { InferSelectModel, InferInsertModel } from "drizzle-orm"
import { customer } from "@/db/schema" 
 
import { getAvatarColor, getInitials, getSegmentStyle } from "@/lib/utils"


export type Customer = InferSelectModel<typeof customer>


type Props = {
  customer: Customer | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (customer: Customer) => void
}

function Field({ label, value, mono = false }: { label: string; value: string | null; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm text-foreground ${mono ? "font-mono" : ""}`}>{value || "—"}</span>
    </div>
  )
}

export function CustomerDetailDialog({ customer, open, onOpenChange, onEdit }: Props) {
  if (!customer) return null
  const { bg, text } = getAvatarColor(customer.fullName)
  const seg = getSegmentStyle(customer.segment)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Customer details</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3 py-2">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium shrink-0"
            style={{ background: bg, color: text }}
          >
            {getInitials(customer.fullName)}
          </div>
          <div>
            <p className="font-medium text-foreground">{customer.fullName}</p>
            {customer.segment && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block"
                style={{ background: seg.bg, color: seg.text }}
              >
                {customer.segment}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
          <Field label="Email" value={customer.email} />
          <Field label="Phone" value={customer.phoneNumber} />
          <Field label="Segment" value={customer.segment} />
          <Field label="Clerk ID" value={customer.clerkId} mono />
          <Field label="Customer ID" value={customer.id} mono />
          <Field label="Business ID" value={customer.businessId} mono />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition"
          >
            Close
          </button>
          <button
            onClick={() => { onOpenChange(false); onEdit(customer) }}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
          >
            Edit
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}