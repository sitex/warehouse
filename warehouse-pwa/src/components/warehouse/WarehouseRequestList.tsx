import { useState } from 'react'
import type { Request, RequestStatus } from '../../types/request'

interface WarehouseRequestListProps {
  requests: Request[]
  onUpdateStatus: (requestId: string, status: RequestStatus) => Promise<void>
}

export function WarehouseRequestList({ requests, onUpdateStatus }: WarehouseRequestListProps) {
  if (requests.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No requests to process
      </div>
    )
  }

  // Sort: pending first, then ready, then delivered
  const sortedRequests = [...requests].sort((a, b) => {
    const order = { pending: 0, ready: 1, delivered: 2 }
    return order[a.status] - order[b.status]
  })

  return (
    <div className="space-y-4">
      {sortedRequests.map(request => (
        <RequestCard
          key={request.id}
          request={request}
          onUpdateStatus={onUpdateStatus}
        />
      ))}
    </div>
  )
}

interface RequestCardProps {
  request: Request
  onUpdateStatus: (requestId: string, status: RequestStatus) => Promise<void>
}

function RequestCard({ request, onUpdateStatus }: RequestCardProps) {
  const [updating, setUpdating] = useState(false)

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    ready: 'bg-blue-100 text-blue-800 border-blue-300',
    delivered: 'bg-green-100 text-green-800 border-green-300',
  }

  const statusLabels = {
    pending: 'Pending',
    ready: 'Ready for Pickup',
    delivered: 'Delivered',
  }

  async function handleStatusChange(newStatus: RequestStatus) {
    setUpdating(true)
    try {
      await onUpdateStatus(request.id, newStatus)
    } catch (err) {
      console.error('Failed to update status:', err)
    }
    setUpdating(false)
  }

  return (
    <div className={`bg-white rounded-lg shadow p-4 border-l-4 ${statusColors[request.status]}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{request.product?.name || 'Unknown Product'}</h3>
          <p className="text-sm text-gray-600">SKU: {request.product?.sku || 'N/A'}</p>
          {request.product?.location && (
            <p className="text-sm text-gray-500">Location: {request.product.location}</p>
          )}
        </div>
        <div className="text-right">
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusColors[request.status]}`}>
            {statusLabels[request.status]}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between border-t pt-3">
        <div>
          <p className="text-2xl font-bold text-gray-800">
            Qty: {request.quantity_requested}
          </p>
          <p className="text-xs text-gray-400">
            {new Date(request.created_at).toLocaleString()}
          </p>
        </div>

        <div className="flex gap-2">
          {request.status === 'pending' && (
            <button
              onClick={() => handleStatusChange('ready')}
              disabled={updating}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {updating ? 'Updating...' : 'Mark Ready'}
            </button>
          )}
          {request.status === 'ready' && (
            <button
              onClick={() => handleStatusChange('delivered')}
              disabled={updating}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {updating ? 'Updating...' : 'Mark Delivered'}
            </button>
          )}
          {request.status === 'delivered' && (
            <span className="px-4 py-2 text-green-600 font-medium">
              Completed
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
