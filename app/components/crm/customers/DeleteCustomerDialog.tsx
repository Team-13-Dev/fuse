"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AlertTriangle, Loader2, ShoppingBag } from "lucide-react"
import { Customer } from "./CustomerDetailDialog"

type Props = {
  customer:     Customer | null
  open:         boolean
  onOpenChange: (open: boolean) => void
  /**
   * Called with force=true when the customer has orders and the user
   * has already acknowledged the warning.
   */
  onConfirm:    (customer: Customer, force: boolean) => Promise<void>
  loading?:     boolean
}

export function DeleteCustomerDialog({ customer, open, onOpenChange, onConfirm, loading }: Props) {
  if (!customer) return null

  const orderCount   = customer.orderCount ?? 0
  const hasOrders    = orderCount > 0

  return (
    <Dialog open={open} onOpenChange={v => { if (!loading) onOpenChange(v) }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle size={18} />
            Delete customer
          </DialogTitle>
          <DialogDescription>
            This action is permanent and cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-3">
          <p className="text-sm text-foreground">
            Are you sure you want to delete{" "}
            <strong className="font-semibold">"{customer.fullName}"</strong>?
          </p>

          {hasOrders && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
              <ShoppingBag size={15} className="text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-800 leading-relaxed">
                This customer has{" "}
                <strong>{orderCount} associated {orderCount === 1 ? "order" : "orders"}</strong>.
                Deleting will permanently remove the customer <em>and all their order history</em>.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(customer, hasOrders)}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-60 flex items-center gap-2"
          >
            {loading && <Loader2 size={13} className="animate-spin" />}
            {hasOrders ? "Delete with orders" : "Delete customer"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}