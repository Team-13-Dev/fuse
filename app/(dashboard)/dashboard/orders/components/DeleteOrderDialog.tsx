"use client"

import { Trash2, X, Loader2 } from "lucide-react"
import { Order } from "./OrderDetailDialog"

interface Props {
  order: Order | null
  open: boolean
  onOpenChange: (v: boolean) => void
  onConfirm: (o: Order) => Promise<void>
  loading: boolean
}

export function DeleteOrderDialog({ order, open, onOpenChange, onConfirm, loading }: Props) {
  if (!open || !order) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onOpenChange(false) }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
              <Trash2 size={15} className="text-red-500" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">Delete order</h2>
          </div>
          <button onClick={() => onOpenChange(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5">
          <p className="text-sm text-gray-600 leading-relaxed">
            Are you sure you want to delete order{" "}
            <span className="font-mono font-medium text-gray-900">{order.orderNumber}</span>{" "}
            for <span className="font-medium text-gray-900">{order.customerName}</span>?
            This action cannot be undone.
          </p>
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 pb-5">
          <button
            onClick={() => onOpenChange(false)}
            className="flex-1 py-2 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-700 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(order)}
            disabled={loading}
            className="flex-1 py-2 text-sm font-medium rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={13} className="animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}