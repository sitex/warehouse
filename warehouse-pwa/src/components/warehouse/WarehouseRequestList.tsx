import { useState } from 'react'
import type { Request, RequestStatus } from '../../types/request'

interface WarehouseRequestListProps {
  requests: Request[]
  onUpdateStatus: (requestId: string, status: RequestStatus) => Promise<void>
}

function printRequests(requests: Request[]) {
  // Filter to only pending and ready requests for printing
  const printableRequests = requests.filter(r => r.status === 'pending' || r.status === 'ready')

  if (printableRequests.length === 0) {
    alert('No pending or ready requests to print')
    return
  }

  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('Please allow popups to print')
    return
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Requests List</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          font-size: 13px;
          padding: 20px;
        }
        h1 {
          font-size: 18px;
          margin-bottom: 20px;
          text-align: center;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }
        th, td {
          border: 1px solid #ccc;
          padding: 4px 6px;
          text-align: left;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        th {
          background-color: #4a5568;
          color: white;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0.5px;
        }
        tr:nth-child(even) {
          background-color: #f7fafc;
        }
        tr:hover {
          background-color: #edf2f7;
        }
        td.num {
          text-align: center;
          font-weight: 600;
        }
        .col-location { width: 5%; }
        .col-sku { width: 15%; }
        .col-title { width: 70%; }
        .col-needed { width: 5%; }
        .col-left { width: 5%; }
        @media print {
          body { padding: 10px; }
          tr:hover { background-color: inherit; }
        }
      </style>
    </head>
    <body>
      <h1>Requests - ${new Date().toLocaleDateString()}</h1>
      <table>
        <thead>
          <tr>
            <th class="col-location">Loc</th>
            <th class="col-sku">SKU</th>
            <th class="col-title">Title</th>
            <th class="col-needed">Qty</th>
            <th class="col-left">Lft</th>
          </tr>
        </thead>
        <tbody>
          ${printableRequests.map(request => {
            const sku = request.product?.sku || 'N/A'
            const name = request.product?.name || 'Unknown'
            const amountNeeded = request.quantity_requested
            const currentStock = request.product?.quantity ?? 0
            const amountLeft = currentStock - amountNeeded
            const location = request.product?.location || 'N/A'
            return `<tr>
              <td class="col-location">${location}</td>
              <td class="col-sku">${sku}</td>
              <td class="col-title">${name}</td>
              <td class="col-needed num">${amountNeeded}</td>
              <td class="col-left num">${amountLeft}</td>
            </tr>`
          }).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `)
  printWindow.document.close()
  printWindow.print()
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

  const pendingAndReadyCount = requests.filter(r => r.status === 'pending' || r.status === 'ready').length

  return (
    <div className="space-y-4">
      {pendingAndReadyCount > 0 && (
        <div className="flex justify-end">
          <button
            onClick={() => printRequests(requests)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
            </svg>
            Print Requests
          </button>
        </div>
      )}
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
