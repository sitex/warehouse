import { useOnlineStatus } from '../../hooks/useOnlineStatus'
import { getPendingChanges } from '../../lib/offlineStorage'
import { syncPendingChanges } from '../../lib/syncService'
import { useState, useEffect } from 'react'

export function OfflineIndicator() {
  const isOnline = useOnlineStatus()
  const [pendingCount, setPendingCount] = useState(0)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    setPendingCount(getPendingChanges().length)
  }, [])

  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      handleSync()
    }
  }, [isOnline])

  async function handleSync() {
    setSyncing(true)
    const result = await syncPendingChanges()
    setPendingCount(getPendingChanges().length)
    setSyncing(false)

    if (result.synced > 0) {
      // Optionally show success message
    }
  }

  if (isOnline && pendingCount === 0) {
    return null // Don't show anything when online and synced
  }

  return (
    <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg ${
      isOnline ? 'bg-yellow-500' : 'bg-red-500'
    } text-white`}>
      {!isOnline && (
        <span>Offline Mode</span>
      )}
      {isOnline && pendingCount > 0 && (
        <span>
          {syncing ? 'Syncing...' : `${pendingCount} changes pending`}
        </span>
      )}
    </div>
  )
}
