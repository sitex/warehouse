import { useState, useRef } from 'react'
import type { ProductFormData, Product } from '../../types/product'

interface ProductFormProps {
  onSubmit: (data: ProductFormData, photo?: File) => Promise<void>
  onClose: () => void
  initialData?: Product
}

export function ProductForm({ onSubmit, onClose, initialData }: ProductFormProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    sku: initialData?.sku || '',
    barcode: initialData?.barcode || '',
    name: initialData?.name || '',
    brand: initialData?.brand || '',
    supplier: initialData?.supplier || '',
    quantity: initialData?.quantity || 0,
    qty_per_package: initialData?.qty_per_package || 1,
    location: initialData?.location || '',
  })
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(initialData?.photo_url || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setPhoto(file)
      setPhotoPreview(URL.createObjectURL(file))
    }
  }

  function handleCameraCapture() {
    fileInputRef.current?.click()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await onSubmit(formData, photo || undefined)
    } catch (err) {
      console.error('Failed to save product:', err)
      setError(err instanceof Error ? err.message : 'Failed to save product')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-lg font-bold">
            {initialData ? 'Edit Product' : 'Add Product'}
          </h2>
          <button onClick={onClose} className="text-gray-500 text-2xl hover:text-gray-700">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">Photo</label>
            <div className="flex gap-4 items-center">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="w-24 h-24 object-cover rounded" />
              ) : (
                <div className="w-24 h-24 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-sm">
                  No photo
                </div>
              )}
              <button
                type="button"
                onClick={handleCameraCapture}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Take Photo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>
          </div>

          {/* SKU */}
          <div>
            <label className="block text-sm font-medium mb-1">SKU *</label>
            <input
              type="text"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              required
              disabled={!!initialData}
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          {/* Barcode */}
          <div>
            <label className="block text-sm font-medium mb-1">Barcode</label>
            <input
              type="text"
              value={formData.barcode}
              onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Brand & Supplier */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Brand</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Supplier</label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Quantity & Per Package */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Quantity</label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Qty per Package</label>
              <input
                type="number"
                value={formData.qty_per_package}
                onChange={(e) => setFormData({ ...formData, qty_per_package: parseInt(e.target.value) || 1 })}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                min="1"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium mb-1">Location (Cabinet/Shelf)</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g., A-1, B-3"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border rounded hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-green-600 text-white rounded disabled:opacity-50 hover:bg-green-700 transition-colors"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
