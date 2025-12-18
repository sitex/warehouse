import { useState, useMemo } from 'react'
import { useProducts } from '../../hooks/useProducts'
import { ProductList } from '../../components/warehouse/ProductList'
import { ProductForm } from '../../components/warehouse/ProductForm'
import { SearchBar } from '../../components/common/SearchBar'
import { useAuth } from '../../contexts/AuthContext'
import type { Product, ProductFormData } from '../../types/product'

export function WarehouseDashboard() {
  const {
    loading,
    error,
    createProduct,
    updateProduct,
    adjustQuantity,
    toggleLowStock,
    searchProducts,
  } = useProducts()
  const { profile, signOut } = useAuth()
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const displayProducts = useMemo(() => {
    return searchProducts(searchTerm)
  }, [searchProducts, searchTerm])

  function handleEditProduct(product: Product) {
    setEditingProduct(product)
    setShowForm(true)
  }

  async function handleSubmit(data: ProductFormData, photo?: File) {
    if (editingProduct) {
      await updateProduct(editingProduct.id, data, photo)
    } else {
      await createProduct(data, photo)
    }
    setShowForm(false)
    setEditingProduct(null)
  }

  function handleCloseForm() {
    setShowForm(false)
    setEditingProduct(null)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-green-600 text-white p-4 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Warehouse</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm opacity-75">{profile?.name}</span>
            <button
              onClick={signOut}
              className="bg-green-700 hover:bg-green-800 px-3 py-1 rounded text-sm transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-4xl mx-auto">
        <div className="flex gap-4 mb-6">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search by SKU, name, or barcode..."
          />
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
          >
            + Add Product
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4" />
            <p className="text-gray-500">Loading products...</p>
          </div>
        ) : (
          <ProductList
            products={displayProducts}
            onAdjustQuantity={adjustQuantity}
            onToggleLowStock={toggleLowStock}
            onEditProduct={handleEditProduct}
          />
        )}

        {showForm && (
          <ProductForm
            onSubmit={handleSubmit}
            onClose={handleCloseForm}
            initialData={editingProduct || undefined}
          />
        )}
      </main>
    </div>
  )
}
