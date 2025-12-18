import { useState, useEffect, useCallback } from 'react'

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [supported, setSupported] = useState(false)

  useEffect(() => {
    setSupported('Notification' in window)
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = useCallback(async () => {
    if (!supported) return false

    const result = await Notification.requestPermission()
    setPermission(result)
    return result === 'granted'
  }, [supported])

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (permission !== 'granted') return

    new Notification(title, {
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      ...options
    })
  }, [permission])

  return {
    supported,
    permission,
    requestPermission,
    showNotification,
  }
}
