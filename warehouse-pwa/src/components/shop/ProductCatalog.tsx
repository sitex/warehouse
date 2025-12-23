import { useState } from 'react'
import type { Product } from '../../types/product'
import type { RequestFormData } from '../../types/request'

interface ProductCatalogProps {
  products: Product[]
  onRequest: (data: RequestFormData) => Promise<void>
}

export function ProductCatalog({ products, onRequest }: ProductCatalogProps) {
  const [requesting, setRequesting] = useState<string | null>(null)
  const [groupName, setGroupName] = useState('')

  async function handleRequest(product: Product, quantity: number) {
    setRequesting(product.id)
    try {
      await onRequest({
        product_id: product.id,
        quantity_requested: quantity,
        group_name: groupName || undefined,
      })
      alert('Request created successfully!')
    } catch (err) {
      alert('Failed to create request')
    }
    setRequesting(null)
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No products found
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-3">
        <label className="block text-sm text-gray-600 mb-1">Group (optional)</label>
        <input
          type="text"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="e.g. Client name, order #..."
          className="w-full p-2 border rounded text-sm"
        />
      </div>
      <div className="grid gap-4">
        {products.map(product => (
          <CatalogItem
            key={product.id}
            product={product}
            onRequest={handleRequest}
            isRequesting={requesting === product.id}
          />
        ))}
      </div>
    </div>
  )
}

interface CatalogItemProps {
  product: Product
  onRequest: (product: Product, quantity: number) => void
  isRequesting: boolean
}

function CatalogItem({ product, onRequest, isRequesting }: CatalogItemProps) {
  const [quantity, setQuantity] = useState(1)
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex gap-4">
        {product.photo_url ? (
          <img
            src={product.photo_url}
            alt={product.name}
            className="w-20 h-20 object-cover rounded"
          />
        ) : (
          <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center text-gray-400">
            No image
          </div>
        )}

        <div className="flex-1">
          <h3 className="font-semibold">{product.name}</h3>
          <p className="text-sm text-gray-600">SKU: {product.sku}</p>
          {product.brand && (
            <p className="text-sm text-gray-500">{product.brand}</p>
          )}
          <p className="text-sm mt-1">
            <span className={product.quantity > 0 ? 'text-green-600' : 'text-red-600'}>
              {product.quantity > 0 ? `In Stock: ${product.quantity}` : 'Out of Stock'}
            </span>
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          disabled={product.quantity === 0}
          className="self-start px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          Request
        </button>
      </div>

      {showForm && (
        <div className="mt-4 pt-4 border-t flex items-center gap-4">
          <label className="text-sm">Quantity:</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-20 p-2 border rounded"
            min="1"
            max={product.quantity}
          />
          <button
            onClick={() => {
              onRequest(product, quantity)
              setShowForm(false)
              setQuantity(1)
            }}
            disabled={isRequesting}
            className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
          >
            {isRequesting ? 'Sending...' : 'Send Request'}
          </button>
        </div>
      )}
    </div>
  )
}
