import { supabase } from './supabase'

type NotificationCallback = (title: string, body: string) => void

export function subscribeToRequestNotifications(
  role: 'manager' | 'warehouse_worker',
  onNotification: NotificationCallback
) {
  if (!supabase) {
    console.warn('Notification service: Supabase not configured')
    return () => {}
  }

  const channel = supabase
    .channel('request-notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'requests'
      },
      () => {
        // Warehouse workers get notified of new requests
        if (role === 'warehouse_worker') {
          onNotification(
            'New Request',
            'A new product request has been submitted'
          )
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'requests'
      },
      (payload: { new: { status?: string } }) => {
        const newStatus = payload.new.status

        // Managers get notified of status changes
        if (role === 'manager') {
          if (newStatus === 'ready') {
            onNotification(
              'Request Ready',
              'Your request is ready for pickup'
            )
          } else if (newStatus === 'delivered') {
            onNotification(
              'Request Delivered',
              'Your request has been delivered'
            )
          }
        }
      }
    )
    .subscribe()

  return () => {
    channel.unsubscribe()
  }
}
