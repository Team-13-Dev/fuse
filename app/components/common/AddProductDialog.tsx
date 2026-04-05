import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const AddProductDialog = () => {
  const [form, setForm] = useState({
    name: '',
    price: '',
    cost: '',
    stock: '0',
    description: '',
    imagesUrl: '',
    externalAccId: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = (e: React.MouseEvent) => {
    e.preventDefault()
    console.log('Submitting product:', form)
  }

  return (
    <div>
      <Dialog>
        <DialogTrigger className="cursor-pointer w-full text-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150">
          Add New Product
        </DialogTrigger>

        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Add New Product</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Fill in the product details below. Fields marked <span className="text-red-500">*</span> are required.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Product name"
                maxLength={255}
                className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">
                  Price <span className="text-red-500">*</span>
                </label>
                <input
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Cost</label>
                <input
                  name="cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.cost}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Stock</label>
              <input
                name="stock"
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={handleChange}
                placeholder="0"
                className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Optional product description"
                rows={3}
                className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Images URL</label>
              <input
                name="imagesUrl"
                value={form.imagesUrl}
                onChange={handleChange}
                placeholder='["https://example.com/img1.jpg"]'
                className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-muted-foreground">JSON array of image URLs</p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="px-4 py-2 text-sm rounded-md border hover:bg-gray-50 transition cursor-pointer"
              onClick={() => setForm({ name: '', price: '', cost: '', stock: '0', description: '', imagesUrl: '', externalAccId: '' })}
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="cursor-pointer px-4 py-2 text-sm font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            >
              Save Product
            </button>
          </div>

        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AddProductDialog