import { useState, useMemo } from 'react'
import { useProducts } from '../../hooks/useProducts'
import { useRequests } from '../../hooks/useRequests'
import { ProductList } from '../../components/warehouse/ProductList'
import { ProductForm } from '../../components/warehouse/ProductForm'
import { WarehouseRequestList } from '../../components/warehouse/WarehouseRequestList'
import { SearchBar } from '../../components/common/SearchBar'
import { DataSync } from '../../components/warehouse/DataSync'
import { BarcodeScanner } from '../../components/common/BarcodeScanner'
import { useAuth } from '../../contexts/AuthContext'
import type { Product, ProductFormData } from '../../types/product'

type Tab = 'products' | 'requests'

export function WarehouseDashboard() {
  const {
    products,
    loading: productsLoading,
    error: productsError,
    createProduct,
    updateProduct,
    adjustQuantity,
    toggleLowStock,
    searchProducts,
  } = useProducts()
  const {
    requests,
    loading: requestsLoading,
    error: requestsError,
    updateStatus,
    deleteRequest,
  } = useRequests()
  const { profile, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('products')
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showScanner, setShowScanner] = useState(false)

  const displayProducts = useMemo(() => {
    return searchProducts(searchTerm)
  }, [searchProducts, searchTerm])

  const pendingRequests = requests.filter(r => r.status === 'pending').length

  function handleBarcodeScanned(barcode: string) {
    setShowScanner(false)

    // Search for product by barcode
    const product = products.find(p => p.barcode === barcode)

    if (product) {
      // Navigate to products tab and set search term to highlight the product
      setActiveTab('products')
      setSearchTerm(product.sku)
    } else {
      alert('Product not found for barcode: ' + barcode)
    }
  }

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

  const error = productsError || requestsError

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

      {/* Tabs */}
      <div className="flex border-b bg-white sticky top-14 z-30">
        <button
          onClick={() => setActiveTab('products')}
          className={`flex-1 py-3 text-center ${
            activeTab === 'products'
              ? 'border-b-2 border-green-600 text-green-600 font-medium'
              : 'text-gray-500'
          }`}
        >
          Products
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex-1 py-3 text-center relative ${
            activeTab === 'requests'
              ? 'border-b-2 border-green-600 text-green-600 font-medium'
              : 'text-gray-500'
          }`}
        >
          Requests
          {pendingRequests > 0 && (
            <span className="absolute top-1 right-1/4 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {pendingRequests}
            </span>
          )}
        </button>
      </div>

      <main className="p-4 max-w-4xl mx-auto">
        <DataSync />

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {activeTab === 'requests' && (
          requestsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4" />
              <p className="text-gray-500">Loading requests...</p>
            </div>
          ) : (
            <WarehouseRequestList
              requests={requests}
              onUpdateStatus={updateStatus}
              onDelete={deleteRequest}
            />
          )
        )}

        {activeTab === 'products' && (
          <>
            <div className="flex gap-2 mb-6">
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search by SKU, name, or barcode..."
              />
              <button
                onClick={() => setShowScanner(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors whitespace-nowrap"
              >
                Scan
              </button>
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
              >
                + Add
              </button>
            </div>

            {productsLoading ? (
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
          </>
        )}

        {showForm && (
          <ProductForm
            onSubmit={handleSubmit}
            onClose={handleCloseForm}
            initialData={editingProduct || undefined}
          />
        )}

        {showScanner && (
          <BarcodeScanner
            onScan={handleBarcodeScanned}
            onClose={() => setShowScanner(false)}
          />
        )}
      </main>
    </div>
  )
}
