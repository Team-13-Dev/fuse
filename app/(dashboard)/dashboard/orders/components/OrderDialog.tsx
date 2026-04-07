"use client"

import { useState, useEffect } from "react"
import { X, Loader2, Search, Plus, Minus, Trash2, User, Package } from "lucide-react"
import { ORDER_STATUSES, OrderStatus } from "../page"

// --- Types ---
export type OrderFormData = {
  customerId: string
  status: OrderStatus
  items: {
    productId: string
    name: string // for UI display
    quantity: number
    unitPrice: number
  }[]
  notes?: string
}

interface Customer { id: string; fullName: string; email: string }
interface Product { id: string; name: string; price: string | number; stock: number }

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSave: (data: OrderFormData) => Promise<void>
  canWrite: boolean
}

export function OrderDialog({ open, onOpenChange, onSave, canWrite }: Props) {
  const [form, setForm] = useState<OrderFormData>({
    customerId: "",
    status: "pending",
    items: [],
    notes: "",
  })

  const [saving, setSaving] = useState(false)
  
  // Search States
  const [custSearch, setCustSearch] = useState("")
  const [customers, setCustomers] = useState<Customer[]>([])
  const [prodSearch, setProdSearch] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [searching, setSearching] = useState({ cust: false, prod: false })

  // --- Search Logic (Debounced) ---
  useEffect(() => {
    const delay = setTimeout(async () => {
      if (!custSearch.trim()) return setCustomers([])
      setSearching(s => ({ ...s, cust: true }))
      const res = await fetch(`/api/customers?search=${encodeURIComponent(custSearch)}&limit=5`)
      if (res.ok) setCustomers(await res.json())
      setSearching(s => ({ ...s, cust: false }))
    }, 400)
    return () => clearTimeout(delay)
  }, [custSearch])

  useEffect(() => {
    const delay = setTimeout(async () => {
      if (!prodSearch.trim()) return setProducts([])
      setSearching(s => ({ ...s, prod: true }))
      const res = await fetch(`/api/products?search=${encodeURIComponent(prodSearch)}&limit=5`)
      if (res.ok) setProducts(await res.json())
      setSearching(s => ({ ...s, prod: false }))
    }, 400)
    return () => clearTimeout(delay)
  }, [prodSearch])

  // --- Handlers ---
  const addItem = (p: Product) => {
    setForm(prev => {
      const existing = prev.items.find(i => i.productId === p.id)
      if (existing) {
        return {
          ...prev,
          items: prev.items.map(i => i.productId === p.id ? { ...i, quantity: i.quantity + 1 } : i)
        }
      }
      return {
        ...prev,
        items: [...prev.items, { productId: p.id, name: p.name, quantity: 1, unitPrice: Number(p.price) }]
      }
    })
    setProdSearch("")
    setProducts([])
  }

  const updateQty = (id: string, delta: number) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.map(i => i.productId === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i)
    }))
  }

  const removeItem = (id: string) => {
    setForm(prev => ({ ...prev, items: prev.items.filter(i => i.productId !== id) }))
  }

  const totalAmount = form.items.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold text-gray-900">Create New Order</h2>
          <button onClick={() => onOpenChange(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* 1. Customer Selection */}
          <section>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Customer</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Search name or email..."
                value={custSearch}
                onChange={e => setCustSearch(e.target.value)}
              />
              {searching.cust && <Loader2 className="absolute right-3 top-2.5 animate-spin text-indigo-500" size={16} />}
              
              {customers.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-xl shadow-xl overflow-hidden">
                  {customers.map(c => (
                    <button key={c.id} onClick={() => { setForm(f=>({...f, customerId: c.id})); setCustSearch(c.fullName); setCustomers([]) }}
                      className="w-full text-left px-4 py-2 hover:bg-indigo-50 border-b last:border-0">
                      <p className="text-sm font-medium">{c.fullName}</p>
                      <p className="text-xs text-gray-500">{c.email}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* 2. Product Search */}
          <section>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Add Products</label>
            <div className="relative">
              <Package className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Search products..."
                value={prodSearch}
                onChange={e => setProdSearch(e.target.value)}
              />
              {products.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-xl shadow-xl">
                  {products.map(p => (
                    <button key={p.id} onClick={() => addItem(p)} className="w-full flex justify-between items-center px-4 py-2 hover:bg-indigo-50 border-b last:border-0">
                      <div className="text-left">
                        <p className="text-sm font-medium">{p.name}</p>
                        <p className="text-xs text-gray-500">EGP {Number(p.price).toFixed(2)} • {p.stock} in stock</p>
                      </div>
                      <Plus size={16} className="text-indigo-600" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* 3. Selected Items List */}
          {form.items.length > 0 && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase">Items List</label>
              <div className="border rounded-xl divide-y bg-gray-50/50">
                {form.items.map(item => (
                  <div key={item.productId} className="flex items-center justify-between p-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">EGP {item.unitPrice.toFixed(2)} / unit</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border rounded-lg bg-white">
                        <button type="button" onClick={() => updateQty(item.productId, -1)} className="p-1 hover:bg-gray-100"><Minus size={14}/></button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <button type="button" onClick={() => updateQty(item.productId, 1)} className="p-1 hover:bg-gray-100"><Plus size={14}/></button>
                      </div>
                      <button type="button" onClick={() => removeItem(item.productId)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Notes */}
          <textarea
            className="w-full p-3 bg-gray-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Add delivery notes or special requests..."
            rows={2}
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          />
        </div>

        {/* Footer */}
        <div className="p-5 border-t bg-gray-50 rounded-b-2xl">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-500 font-medium">Total Amount</span>
            <span className="text-xl font-bold text-indigo-600">EGP {totalAmount.toLocaleString("en-EG", { minimumFractionDigits: 2 })}</span>
          </div>
          <button
            onClick={() => onSave(form)}
            disabled={saving || !form.customerId || form.items.length === 0}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : "Create Order"}
          </button>
        </div>
      </div>
    </div>
  )
}