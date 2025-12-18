import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ProtectedRoute } from './components/common/ProtectedRoute'
import { LoginSelect } from './pages/LoginSelect'
import { ManagerLogin } from './pages/ManagerLogin'
import { WorkerLogin } from './pages/WorkerLogin'
import { ShopDashboard } from './pages/shop/ShopDashboard'
import { WarehouseDashboard } from './pages/warehouse/WarehouseDashboard'

function AppRoutes() {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  // If user is already logged in, redirect from login pages
  const isAuthenticated = user && profile

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to={profile.role === 'manager' ? '/shop' : '/warehouse'} replace />
          ) : (
            <LoginSelect />
          )
        }
      />
      <Route
        path="/login/manager"
        element={
          isAuthenticated ? (
            <Navigate to="/shop" replace />
          ) : (
            <ManagerLogin />
          )
        }
      />
      <Route
        path="/login/worker"
        element={
          isAuthenticated ? (
            <Navigate to="/warehouse" replace />
          ) : (
            <WorkerLogin />
          )
        }
      />

      {/* Protected routes - Shop (Managers) */}
      <Route
        path="/shop/*"
        element={
          <ProtectedRoute allowedRoles={['manager']}>
            <ShopDashboard />
          </ProtectedRoute>
        }
      />

      {/* Protected routes - Warehouse (Workers) */}
      <Route
        path="/warehouse/*"
        element={
          <ProtectedRoute allowedRoles={['warehouse_worker']}>
            <WarehouseDashboard />
          </ProtectedRoute>
        }
      />

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
