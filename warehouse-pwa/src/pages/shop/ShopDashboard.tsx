import { useAuth } from '../../contexts/AuthContext'

export function ShopDashboard() {
  const { profile, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Shop Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm opacity-75">Welcome, {profile?.name}</span>
            <button
              onClick={signOut}
              className="bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded text-sm"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Shop Manager Area</h2>
          <p className="text-gray-600">
            Shop features will be implemented in Phase 5.
          </p>
        </div>
      </main>
    </div>
  )
}
