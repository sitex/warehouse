import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: ('manager' | 'warehouse_worker')[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!user || !profile) {
    return <Navigate to="/" replace />
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    // Redirect to appropriate app based on role
    return <Navigate to={profile.role === 'manager' ? '/shop' : '/warehouse'} replace />
  }

  return <>{children}</>
}
