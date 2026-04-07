"use client"

import { X, Pencil, Trash2, ChevronDown, ExternalLink, User } from "lucide-react"
import { StatusBadge, ORDER_STATUSES, OrderStatus } from "../page"
import Link from "next/link"

export type Order = {
  id: string
  orderNumber: string
  customerId: string // Added to match your new schema
  customerName: string
  customerEmail: string
  customerPhone?: string | null
  status: string
  total: string | number
  itemCount: number
  notes?: string | null
  createdAt: string
  updatedAt: string
  // Updated items to match your database line-item structure
  items?: { 
    productId: string; 
    name: string; 
    quantity: number; 
    unitPrice: string | number 
  }[]
}

interface Props {
  order: Order | null
  open: boolean
  onOpenChange: (v: boolean) => void
  onEdit: (o: Order) => void
  onDelete: (o: Order) => void
  onStatusChange: (o: Order, status: OrderStatus) => void
  canWrite: boolean
  canDelete: boolean
}

export function OrderDetailDialog({
  order, open, onOpenChange, onEdit, onDelete, onStatusChange, canWrite, canDelete,
}: Props) {
  if (!open || !order) return null

  const initials = order.customerName
    ? order.customerName.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase()
    : "?"

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onOpenChange(false) }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center text-xs font-medium text-indigo-600 shrink-0">
              {initials}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{order.customerName}</p>
              <p className="text-xs text-gray-400 font-mono uppercase">{order.orderNumber}</p>
            </div>
          </div>
          <button onClick={() => onOpenChange(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 flex flex-col gap-5 max-h-[60vh] overflow-y-auto">

          {/* Status changer */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Order Status</p>
              {canWrite ? (
                <div className="relative inline-block">
                  <select
                    value={order.status}
                    onChange={e => onStatusChange(order, e.target.value as OrderStatus)}
                    className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 cursor-pointer"
                  >
                    {ORDER_STATUSES.map(s => (
                      <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              ) : (
                <StatusBadge status={order.status as OrderStatus} />
              )}
            </div>
            <div className="pb-1">
               <StatusBadge status={order.status as OrderStatus} />
            </div>
          </div>

          {/* Customer info */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Customer Details</p>
              <Link 
                href={`/customers/${order.customerId}`}
                className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
              >
                View Profile <ExternalLink size={10} />
              </Link>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 flex flex-col gap-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Name</span>
                <span className="font-medium text-gray-900">{order.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Email</span>
                <span className="text-gray-700">{order.customerEmail}</span>
              </div>
              {order.customerPhone && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Phone</span>
                  <span className="text-gray-700">{order.customerPhone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Line items (Products) */}
          {order.items && order.items.length > 0 ? (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Products</p>
              <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-50">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2.5 text-sm bg-white">
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-medium text-gray-700 tabular-nums">
                      EGP {(Number(item.unitPrice) * item.quantity).toLocaleString("en-EG", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
             <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Summary</p>
              <div className="bg-gray-50 rounded-xl p-3 flex flex-col gap-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Estimated Items</span>
                  <span className="font-medium text-gray-900">{order.itemCount}</span>
                </div>
              </div>
            </div>
          )}

          {/* Totals */}
          <div className="bg-indigo-600 rounded-xl p-4 text-white">
            <div className="flex justify-between items-center">
              <span className="text-indigo-100 text-xs uppercase font-semibold tracking-wider">Total Amount</span>
              <span className="text-lg font-bold">
                EGP {Number(order.total).toLocaleString("en-EG", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="mt-2 pt-2 border-t border-indigo-500/30 flex justify-between items-center text-[10px] text-indigo-200 uppercase">
              <span>Placed On</span>
              <span>{new Date(order.createdAt).toLocaleDateString("en-EG", { day: "numeric", month: "short", year: "numeric" })}</span>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Order Notes</p>
              <p className="text-sm text-gray-600 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5 italic">
                "{order.notes}"
              </p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {(canWrite || canDelete) && (
          <div className="flex gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50/50">
            {canWrite && (
              <button
                onClick={() => onEdit(order)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium border border-gray-200 rounded-xl hover:bg-white hover:shadow-sm text-gray-700 transition-all"
              >
                <Pencil size={14} /> Edit Order
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => onDelete(order)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium border border-red-100 rounded-xl hover:bg-red-50 text-red-600 transition-all"
              >
                <Trash2 size={14} /> Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}