import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const output = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i)
  return output
}

const isPushSupported =
  typeof window !== 'undefined' &&
  'Notification' in window &&
  'serviceWorker' in navigator &&
  'PushManager' in window

interface NotificationsContextType {
  isSubscribed: boolean
  showPrompt: boolean
  subscribe: () => Promise<void>
  dismiss: () => void
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)

  const saveSubscription = useCallback(
    async (sub: PushSubscription) => {
      if (!user) return
      await supabase.from('push_subscriptions').upsert(
        { user_id: user.id, subscription: sub.toJSON() },
        { onConflict: 'user_id' }
      )
    },
    [user]
  )

  const checkSubscription = useCallback(async () => {
    if (!isPushSupported || !user || !VAPID_PUBLIC_KEY) return
    try {
      const reg = await navigator.serviceWorker.ready
      const existing = await reg.pushManager.getSubscription()
      if (existing) {
        setIsSubscribed(true)
        setShowPrompt(false)
        // Keep DB in sync in case it was lost
        await saveSubscription(existing)
        return
      }
      // No subscription — show prompt unless denied or dismissed
      if (
        Notification.permission !== 'denied' &&
        !localStorage.getItem('push-dismissed')
      ) {
        // Small delay so the app renders first
        setTimeout(() => setShowPrompt(true), 2000)
      }
    } catch {
      // Silently fail — push is non-critical
    }
  }, [user, saveSubscription])

  useEffect(() => {
    if (!user) {
      setIsSubscribed(false)
      setShowPrompt(false)
      return
    }
    checkSubscription()
  }, [user, checkSubscription])

  async function subscribe() {
    if (!isPushSupported || !user || !VAPID_PUBLIC_KEY) return
    setShowPrompt(false)
    try {
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') return
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as ArrayBuffer,
      })
      await saveSubscription(sub)
      setIsSubscribed(true)
    } catch {
      // Silently fail
    }
  }

  function dismiss() {
    localStorage.setItem('push-dismissed', 'true')
    setShowPrompt(false)
  }

  return (
    <NotificationsContext.Provider value={{ isSubscribed, showPrompt, subscribe, dismiss }}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider')
  return ctx
}
