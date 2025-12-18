import { supabase } from './supabase'
import { getPendingChanges, clearPendingChange } from './offlineStorage'

export async function syncPendingChanges(): Promise<{ synced: number; failed: number }> {
  if (!supabase) {
    console.warn('Supabase not configured, cannot sync changes')
    return { synced: 0, failed: 0 }
  }

  const pending = getPendingChanges()
  let synced = 0
  let failed = 0

  for (const change of pending) {
    try {
      switch (change.type) {
        case 'quantity_adjust':
          await supabase
            .from('products')
            .update({ quantity: change.data.newQuantity })
            .eq('id', change.data.productId)

          await supabase
            .from('inventory_history')
            .insert([change.data.historyEntry])
          break

        case 'product_update':
          await supabase
            .from('products')
            .update(change.data.updates)
            .eq('id', change.data.productId)
          break

        case 'request_create':
          await supabase
            .from('requests')
            .insert([change.data])
          break
      }

      clearPendingChange(change.id)
      synced++
    } catch (error) {
      console.error('Failed to sync change:', change.id, error)
      failed++
    }
  }

  return { synced, failed }
}
