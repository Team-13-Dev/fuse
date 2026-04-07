"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { InferSelectModel } from "drizzle-orm"
import { customer } from "@/db/schema"
import { getAvatarColor, getInitials, getSegmentStyle } from "@/lib/utils"
import { Mail, Phone, ShoppingBag, Hash, Building2 } from "lucide-react"

export type Customer = InferSelectModel<typeof customer> & {
  orderCount?: number
}

type Props = {
  customer:     Customer | null
  open:         boolean
  onOpenChange: (open: boolean) => void
  onEdit:       (customer: Customer) => void
  onDelete:     (customer: Customer) => void
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

export function CustomerDetailDialog({
  customer,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  canWrite,
  canDelete,
}: Props) {
  if (!customer) return null

  const { bg, text } = getAvatarColor(customer.fullName)
  const seg          = getSegmentStyle(customer.segment)
  const orderCount   = customer.orderCount ?? 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Customer details</DialogTitle>
        </DialogHeader>

        {/* Identity block */}
        <div className="flex items-center gap-3 py-2">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 select-none"
            style={{ background: bg, color: text }}
          >
            {getInitials(customer.fullName)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate">{customer.fullName}</p>
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              {customer.segment && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: seg.bg, color: seg.text }}
                >
                  {customer.segment}
                </span>
              )}
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <ShoppingBag size={11} />
                {orderCount} {orderCount === 1 ? "order" : "orders"}
              </span>
            </div>
          </div>
        </div>

        {/* Contact + Meta */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border pt-4">
          <div className="col-span-2">
            <Field label="Email"       value={customer.email}       icon={Mail}      />
          </div>
          <div className="col-span-2">
            <Field label="Phone"       value={customer.phoneNumber} icon={Phone}     />
          </div>
          <Field label="Clerk ID"      value={customer.clerkId}     icon={Hash}     mono />
          <Field label="Segment"       value={customer.segment}                          />
          <div className="col-span-2">
            <Field label="Customer ID" value={customer.id}          icon={Hash}     mono />
          </div>
          <div className="col-span-2">
            <Field label="Business ID" value={customer.businessId}  icon={Building2} mono />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between gap-2 pt-2">
          <div>
            {canDelete && (
              <button
                onClick={() => { onOpenChange(false); onDelete(customer) }}
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
                onClick={() => { onOpenChange(false); onEdit(customer) }}
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