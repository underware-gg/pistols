import React, { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback, ReactNode } from 'react'
import { useMyActiveDuels } from './challengeQueryStore'
import { constants } from '@underware/pistols-sdk/pistols/gen'

const STORAGE_KEY = 'pistols_notifications'

const setsAreEqual = <T,>(a: Set<T>, b: Set<T>): boolean => {
  if (a.size !== b.size) return false
  for (const item of a) if (!b.has(item)) return false
  return true
}

export type Notification = {
  duelId: bigint
  type: 'duel' | 'system'
  timestamp: number
  isRead: boolean
  isDisplayed: boolean
  state: constants.ChallengeState
  requiresAction: boolean // Whether this notification requires user action
}

const loadNotificationsFromStorage = (): Notification[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    return parsed.map((n: any) => ({
      ...n,
      duelId: BigInt(n.duelId)
    }))
  } catch (e) {
    console.error('Failed to load notifications from storage:', e)
    return []
  }
}

const saveNotificationsToStorage = (notifications: Notification[]) => {
  try {
    const toStore = notifications.map(n => ({
      ...n,
      duelId: n.duelId.toString()
    }))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore))
  } catch (e) {
    console.error('Failed to save notifications to storage:', e)
  }
}

type NotificationContextType = {
  notifications: Notification[]
  markAsRead: (duelId: bigint) => void
  markAsDisplayed: (duelId: bigint) => void
  clearNotifications: () => void
  hasUnreadNotifications: boolean
  getNotification: (duelId: bigint) => Notification | null
}

const NotificationContext = createContext<NotificationContextType | null>(null)

export const useNotificationContext = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    return loadNotificationsFromStorage()
  })

  const [notificationDuelIds, setNotificationDuelIds] = useState<bigint[]>(() => {
    return notifications.map(n => n.duelId)
  })

  const activeDuels = useMyActiveDuels(notificationDuelIds)
  
  useEffect(() => {
    saveNotificationsToStorage(notifications)
  }, [notifications])

  useEffect(() => {
    if (activeDuels.length === 0) return
    
    const newNotifications = activeDuels
      .map(duel => ({
        duelId: duel.duel_id,
        type: 'duel' as const,
        timestamp: duel.timestamp,
        isRead: false,
        isDisplayed: !duel.callToAction && (duel.state === constants.ChallengeState.Awaiting || duel.state === constants.ChallengeState.InProgress),
        state: duel.state,
        requiresAction: duel.callToAction,
      }))
      .sort((a, b) => {
        if (a.requiresAction !== b.requiresAction) {
          return a.requiresAction ? -1 : 1
        }
        return b.timestamp - a.timestamp
      })

    setNotifications(prev => {
      const updatedNotifications = prev.map(existing => {
        const newNotif = newNotifications.find(n => n.duelId === existing.duelId)
        if (!newNotif) return existing

        if (newNotif.timestamp !== existing.timestamp || 
          (newNotif.requiresAction !== existing.requiresAction && (newNotif.state === constants.ChallengeState.Resolved || newNotif.state === constants.ChallengeState.Draw))
        ) {
          return {
            ...existing,
            timestamp: newNotif.timestamp,
            isRead: newNotif.isRead,
            isDisplayed: !newNotif.requiresAction && existing.isDisplayed,
            state: newNotif.state,
            requiresAction: newNotif.requiresAction
          }
        }
        return existing
      })

      const existingIds = updatedNotifications.map(n => n.duelId)
      const brandNewNotifications = newNotifications.filter(n => !existingIds.includes(n.duelId))

      const TEN_DAYS_MS = 14 * 24 * 60 * 60
      const now = Date.now() / 1000
      
      const filteredNotifications = [...brandNewNotifications, ...updatedNotifications]
      .filter(notification => {
        if (notification.state === constants.ChallengeState.Awaiting || notification.state === constants.ChallengeState.InProgress) {
          return true
        }
        
        return (now - notification.timestamp) < TEN_DAYS_MS
      })

      // Check if the set of duel IDs has changed and update state if needed
      const currentDuelIds = new Set(filteredNotifications.map(n => n.duelId))
      const previousDuelIds = new Set(notificationDuelIds)
      
      if (!setsAreEqual(currentDuelIds, previousDuelIds)) {
        setNotificationDuelIds(Array.from(currentDuelIds))
      }

      return filteredNotifications
    })
  }, [activeDuels])

  const markAsRead = useCallback((duelId: bigint) => {
    setNotifications(prev => 
      prev.map(n => n.duelId === duelId ? { ...n, isRead: true } : n)
    )
  }, [])

  const markAsDisplayed = useCallback((duelId: bigint) => {
    setNotifications(prev => 
      prev.map(n => n.duelId === duelId ? { ...n, isDisplayed: true } : n)
    )
  }, [])

  const clearNotifications = useCallback(() => {
    setNotifications([])
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const hasUnreadNotifications = useMemo(() => {
    return notifications.some(n => !n.isRead)
  }, [notifications])

  const getNotification = useCallback((duelId: bigint) => {
    const notification = notifications.find(n => 
      n.duelId === duelId && 
      !n.isRead
    )
    return notification || null
  }, [notifications])

  const value = React.useMemo(() => ({
    notifications,
    markAsRead,
    markAsDisplayed,
    clearNotifications,
    hasUnreadNotifications,
    getNotification
  }), [notifications, markAsRead, markAsDisplayed, clearNotifications, hasUnreadNotifications, getNotification])

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications(): NotificationContextType {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
} 