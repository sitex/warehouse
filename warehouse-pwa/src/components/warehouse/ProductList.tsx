import type { Product } from '../../types/product'
import { ProductCard } from './ProductCard'

interface ProductListProps {
  products: Product[]
  onAdjustQuantity: (productId: string, change: number, note?: string) => Promise<void>
  onToggleLowStock: (productId: string) => Promise<void>
  onEditProduct: (product: Product) => void
}

export function ProductList({ products, onAdjustQuantity, onToggleLowStock, onEditProduct }: ProductListProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No products found
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {products.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          onAdjustQuantity={onAdjustQuantity}
          onToggleLowStock={onToggleLowStock}
          onEdit={onEditProduct}
        />
      ))}
    </div>
  )
}
