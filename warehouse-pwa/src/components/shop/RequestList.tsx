import { useState } from 'react'
import type { Request } from '../../types/request'

interface RequestListProps {
  requests: Request[]
  onDelete: (requestId: string) => Promise<void>
}

export function RequestList({ requests, onDelete }: RequestListProps) {
  if (requests.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No requests yet
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {requests.map(request => (
        <RequestCard key={request.id} request={request} onDelete={onDelete} />
      ))}
    </div>
  )
}

interface RequestCardProps {
  request: Request
  onDelete: (requestId: string) => Promise<void>
}

function RequestCard({ request, onDelete }: RequestCardProps) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm('Delete this request?')) return
    setDeleting(true)
    try {
      await onDelete(request.id)
    } catch (err) {
      console.error('Failed to delete:', err)
    }
    setDeleting(false)
  }
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    ready: 'bg-blue-100 text-blue-800',
    delivered: 'bg-green-100 text-green-800',
  }

  const statusLabels = {
    pending: 'Pending',
    ready: 'Ready for Pickup',
    delivered: 'Delivered',
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      {request.group_name && (
        <div className="mb-2">
          <span className="inline-block px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
            {request.group_name}
          </span>
        </div>
      )}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold">{request.product?.name || 'Unknown Product'}</h3>
          <p className="text-sm text-gray-600">SKU: {request.product?.sku || 'N/A'}</p>
          <div className="flex gap-4 mt-1">
            <p className="text-sm text-gray-600">
              Qty: <span className="font-semibold">{request.quantity_requested}</span>
            </p>
            <p className="text-sm text-gray-600">
              Left: <span className="font-semibold">{(request.product?.quantity ?? 0) - request.quantity_requested}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm ${statusColors[request.status]}`}>
            {statusLabels[request.status]}
          </span>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-2 py-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50 transition-colors"
            title="Delete request"
          >
            {deleting ? '...' : '✕'}
          </button>
        </div>
      </div>
    </div>
  )
}
