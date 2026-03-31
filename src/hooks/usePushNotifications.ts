'use client'

import { useState, useEffect } from 'react'

interface OneSignalPushSubscription {
  id: string | null
  optedIn: boolean
  optOut(): Promise<void>
}

interface OneSignalNotifications {
  permission: boolean
  isPushSupported(): boolean
  requestPermission(): Promise<void>
}

interface OneSignalNamespace {
  Notifications: OneSignalNotifications
  User?: { PushSubscription?: OneSignalPushSubscription }
}

declare global {
  interface Window {
    OneSignalDeferred?: ((os: OneSignalNamespace) => void | Promise<void>)[]
    OneSignal?: OneSignalNamespace
  }
}

export function usePushNotifications() {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [sdkReady, setSdkReady] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const check = async () => {
      if (window.OneSignal && window.OneSignal.Notifications) {
        setSdkReady(true)
        const supported = window.OneSignal.Notifications.isPushSupported()
        setIsSupported(supported)
        if (supported) {
          const permission = window.OneSignal.Notifications.permission
          const optedIn = window.OneSignal.User?.PushSubscription?.optedIn
          setIsSubscribed(!!permission && !!optedIn)
        }
      } else {
        setTimeout(check, 500)
      }
    }

    check()
  }, [])

  const subscribe = async () => {
    if (!sdkReady || isLoading) return
    setIsLoading(true)

    try {
      // requestPermission ПЕРВЫМ — сразу после проверок, без await до него
      // Браузер считает это прямым ответом на клик пользователя
      await window.OneSignal!.Notifications.requestPermission()

      console.log('[Push] permission result=', window.OneSignal!.Notifications.permission)

      if (window.OneSignal!.Notifications.permission) {
        // Ждём дольше — OneSignal регистрирует подписчика асинхронно
        await new Promise(resolve => setTimeout(resolve, 3000))

        const playerId = window.OneSignal!.User?.PushSubscription?.id
        console.log('[Push] player_id after 3s:', playerId)

        if (playerId) {
          const res = await fetch('/api/push/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ player_id: playerId }),
          })
          console.log('[Push] register response:', res.status)
        } else {
          console.warn('[Push] player_id is null after 3s wait')
        }
        setIsSubscribed(true)
      } else {
        console.log('[Push] permission denied or dismissed')
      }
    } catch (e) {
      console.error('[Push] subscribe error:', e)
    } finally {
      setIsLoading(false)
    }
  }

  const unsubscribe = async () => {
    if (!sdkReady || isLoading) return
    setIsLoading(true)
    try {
      const playerId = window.OneSignal!.User?.PushSubscription?.id
      await window.OneSignal!.User?.PushSubscription?.optOut()
      if (playerId) {
        await fetch('/api/push/unregister', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ player_id: playerId }),
        })
      }
      setIsSubscribed(false)
    } catch (e) {
      console.error('Push unsubscribe error:', e)
    } finally {
      setIsLoading(false)
    }
  }

  return { isSubscribed, isSupported, isLoading, sdkReady, subscribe, unsubscribe }
}
