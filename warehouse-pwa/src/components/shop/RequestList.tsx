import type { Request } from '../../types/request'

interface RequestListProps {
  requests: Request[]
}

export function RequestList({ requests }: RequestListProps) {
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
        <RequestCard key={request.id} request={request} />
      ))}
    </div>
  )
}

function RequestCard({ request }: { request: Request }) {
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
        <span className={`px-3 py-1 rounded-full text-sm ${statusColors[request.status]}`}>
          {statusLabels[request.status]}
        </span>
      </div>
    </div>
  )
}
