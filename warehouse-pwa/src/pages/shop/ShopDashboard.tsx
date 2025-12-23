import { useState, useMemo } from 'react'
import { useProducts } from '../../hooks/useProducts'
import { useRequests } from '../../hooks/useRequests'
import { useAuth } from '../../contexts/AuthContext'
import { ProductCatalog } from '../../components/shop/ProductCatalog'
import { RequestList } from '../../components/shop/RequestList'
import { SearchBar } from '../../components/common/SearchBar'

type Tab = 'catalog' | 'requests'

export function ShopDashboard() {
  const { products, loading: productsLoading, error: productsError } = useProducts()
  const { requests, loading: requestsLoading, createRequest, error: requestsError } = useRequests()
  const { profile, signOut } = useAuth()

  // Debug logging
  console.log('ShopDashboard render:', { products: products.length, requests: requests.length, productsLoading, requestsLoading, productsError, requestsError })
  const [activeTab, setActiveTab] = useState<Tab>('catalog')
  const [searchTerm, setSearchTerm] = useState('')

  const displayProducts = useMemo(() => {
    if (!searchTerm) return products
    const lowerTerm = searchTerm.toLowerCase()
    return products.filter(p =>
      p.sku.toLowerCase().includes(lowerTerm) ||
      p.name.toLowerCase().includes(lowerTerm) ||
      (p.barcode && p.barcode.toLowerCase().includes(lowerTerm))
    )
  }, [searchTerm, products])
  const pendingRequests = requests.filter(r => r.status === 'pending').length

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">Shop</h1>
          <div className="flex items-center gap-4">
            <span>{profile?.name}</span>
            <button onClick={signOut} className="text-sm underline">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex border-b bg-white">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex-1 py-3 text-center ${
            activeTab === 'catalog'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500'
          }`}
        >
          Products
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex-1 py-3 text-center relative ${
            activeTab === 'requests'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500'
          }`}
        >
          Requests
          {pendingRequests > 0 && (
            <span className="absolute -top-1 right-4 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {pendingRequests}
            </span>
          )}
        </button>
      </div>

      <main className="p-4 max-w-4xl mx-auto">
        {activeTab === 'catalog' && (
          <>
            <div className="mb-4">
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search products..."
              />
            </div>
            {productsLoading ? (
              <div className="text-center py-8">Loading catalog...</div>
            ) : (
              <ProductCatalog
                products={displayProducts}
                onRequest={createRequest}
              />
            )}
          </>
        )}

        {activeTab === 'requests' && (
          requestsLoading ? (
            <div className="text-center py-8">Loading requests...</div>
          ) : (
            <RequestList requests={requests} />
          )
        )}
      </main>
    </div>
  )
}
