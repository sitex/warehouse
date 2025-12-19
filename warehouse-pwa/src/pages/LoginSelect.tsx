import { Link } from 'react-router-dom'

export function LoginSelect() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-8">
          Warehouse Inventory
        </h1>

        <div className="space-y-4">
          <Link
            to="/login/manager"
            className="block w-full py-4 px-6 text-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Shop Login
            <span className="block text-sm opacity-75">Email PIN</span>
          </Link>

          <Link
            to="/login/worker"
            className="block w-full py-4 px-6 text-center bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Warehouse Login
            <span className="block text-sm opacity-75">PIN Code</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
