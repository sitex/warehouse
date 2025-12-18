const PENDING_CHANGES_KEY = 'warehouse_pending_changes'

interface PendingChange {
  id: string
  type: 'product_update' | 'quantity_adjust' | 'request_create'
  data: any
  timestamp: number
}

export function savePendingChange(change: Omit<PendingChange, 'id' | 'timestamp'>) {
  const pending = getPendingChanges()
  pending.push({
    ...change,
    id: crypto.randomUUID(),
    timestamp: Date.now()
  })
  localStorage.setItem(PENDING_CHANGES_KEY, JSON.stringify(pending))
}

export function getPendingChanges(): PendingChange[] {
  const stored = localStorage.getItem(PENDING_CHANGES_KEY)
  return stored ? JSON.parse(stored) : []
}

export function clearPendingChange(id: string) {
  const pending = getPendingChanges().filter(c => c.id !== id)
  localStorage.setItem(PENDING_CHANGES_KEY, JSON.stringify(pending))
}

export function clearAllPendingChanges() {
  localStorage.removeItem(PENDING_CHANGES_KEY)
}
