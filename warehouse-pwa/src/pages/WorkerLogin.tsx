import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

interface User {
  id: string
  name: string
  email: string
}

export function WorkerLogin() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [pinSent, setPinSent] = useState(false)
  const { sendEmailOtp, verifyEmailOtp } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    async function fetchUsers() {
      if (!supabase) {
        setLoadingUsers(false)
        return
      }

      const { data, error } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('role', 'warehouse_worker')
        .order('name')

      if (!error && data && data.length > 0) {
        setSelectedUser(data[0] as User)
      }
      setLoadingUsers(false)
    }

    fetchUsers()
  }, [])

  async function handleSendPin(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedUser) return

    setError('')
    setSuccess('')
    setLoading(true)

    try {
      await sendEmailOtp(selectedUser.email)
      setPinSent(true)
      setSuccess('PIN sent to your email')
    } catch {
      setError('Failed to send PIN')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyPin(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedUser) return

    setError('')
    setLoading(true)

    try {
      await verifyEmailOtp(selectedUser.email, pin)
      navigate('/warehouse')
    } catch {
      setError('Invalid PIN')
    } finally {
      setLoading(false)
    }
  }

  function handlePinInput(value: string) {
    const cleaned = value.replace(/\D/g, '').slice(0, 8)
    setPin(cleaned)
  }

  if (loadingUsers) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Warehouse Login</h1>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 text-green-700 p-3 rounded mb-4">
            {success}
          </div>
        )}

        {!pinSent ? (
          <form onSubmit={handleSendPin}>
            {selectedUser && (
              <div className="mb-6 text-center text-gray-600">
                Welcome, <strong>{selectedUser.name}</strong>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !selectedUser}
              className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send PIN to Email'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyPin}>
            <div className="mb-2 text-sm text-gray-600">
              PIN sent to: <strong>{selectedUser?.name}</strong>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 mb-2">Enter PIN from email</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={pin}
                onChange={(e) => handlePinInput(e.target.value)}
                className="w-full p-4 text-2xl text-center border rounded-lg tracking-widest"
                placeholder="--------"
                maxLength={8}
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading || pin.length < 6}
              className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 mb-3"
            >
              {loading ? 'Verifying...' : 'Login'}
            </button>

            <button
              type="button"
              onClick={() => {
                setPinSent(false)
                setPin('')
                setError('')
                setSuccess('')
              }}
              className="w-full py-2 text-gray-600 hover:text-gray-800"
            >
              Back
            </button>
          </form>
        )}

        <Link
          to="/"
          className="block text-center mt-4 text-gray-600 hover:text-gray-800"
        >
          Back to login options
        </Link>
      </div>
    </div>
  )
}
