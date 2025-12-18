import { useState } from 'react'
import type { Product } from '../../types/product'

interface ProductCardProps {
  product: Product
  onAdjustQuantity: (productId: string, change: number, note?: string) => Promise<void>
  onToggleLowStock: (productId: string) => Promise<void>
  onEdit: (product: Product) => void
}

export function ProductCard({ product, onAdjustQuantity, onToggleLowStock, onEdit }: ProductCardProps) {
  const [adjusting, setAdjusting] = useState(false)

  async function handleAdjust(change: number) {
    setAdjusting(true)
    try {
      await onAdjustQuantity(product.id, change)
    } catch (err) {
      console.error('Failed to adjust quantity:', err)
    }
    setAdjusting(false)
  }

  async function handleToggleLowStock() {
    try {
      await onToggleLowStock(product.id)
    } catch (err) {
      console.error('Failed to toggle low stock:', err)
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow p-4 ${product.is_low_stock ? 'border-2 border-yellow-400 bg-yellow-50' : ''}`}>
      <div className="flex gap-4">
        {product.photo_url ? (
          <img
            src={product.photo_url}
            alt={product.name}
            className="w-20 h-20 object-cover rounded"
          />
        ) : (
          <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
            No image
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{product.name}</h3>
          <p className="text-sm text-gray-600">SKU: {product.sku}</p>
          {product.location && (
            <p className="text-sm text-gray-500">Location: {product.location}</p>
          )}
          {product.brand && (
            <p className="text-xs text-gray-400">{product.brand}</p>
          )}
        </div>

        <button
          onClick={() => onEdit(product)}
          className="self-start text-gray-400 hover:text-gray-600"
          title="Edit product"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleAdjust(-1)}
            disabled={adjusting || product.quantity <= 0}
            className="w-10 h-10 rounded-full bg-red-100 text-red-600 font-bold text-xl disabled:opacity-50 hover:bg-red-200 transition-colors"
          >
            -
          </button>

          <span className="text-2xl font-bold w-16 text-center">
            {product.quantity}
          </span>

          <button
            onClick={() => handleAdjust(1)}
            disabled={adjusting}
            className="w-10 h-10 rounded-full bg-green-100 text-green-600 font-bold text-xl disabled:opacity-50 hover:bg-green-200 transition-colors"
          >
            +
          </button>
        </div>

        <button
          onClick={handleToggleLowStock}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            product.is_low_stock
              ? 'bg-yellow-400 text-yellow-900 hover:bg-yellow-500'
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
        >
          {product.is_low_stock ? 'Low Stock' : 'Mark Low'}
        </button>
      </div>
    </div>
  )
}
