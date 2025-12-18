import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function WorkerLogin() {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signInWithPin } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signInWithPin(pin)
      navigate('/warehouse')
    } catch {
      setError('Invalid PIN')
    } finally {
      setLoading(false)
    }
  }

  function handlePinInput(value: string) {
    // Only allow digits, max 6 characters
    const cleaned = value.replace(/\D/g, '').slice(0, 6)
    setPin(cleaned)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Worker Login</h1>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="mb-6">
          <label className="block text-gray-700 mb-2">Enter PIN</label>
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            value={pin}
            onChange={(e) => handlePinInput(e.target.value)}
            className="w-full p-4 text-2xl text-center border rounded-lg tracking-widest"
            placeholder="------"
            maxLength={6}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading || pin.length < 4}
          className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Verifying...' : 'Enter'}
        </button>

        <Link
          to="/"
          className="block text-center mt-4 text-gray-600 hover:text-gray-800"
        >
          Back to login options
        </Link>
      </form>
    </div>
  )
}
