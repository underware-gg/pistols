import React, { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback, ReactNode } from 'react'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import Dexie, { Table } from 'dexie'
import { useMyActiveDuels } from '/src/stores/challengeStore'
import { constants } from '@underware/pistols-sdk/pistols/gen'

const STORAGE_KEY = 'pistols_notifications'

function debounce<T extends (...args: any[]) => void>(func: T, wait: number): T {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return function(this: any, ...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(this, args), wait)
  } as T
}

const setsAreEqual = <T,>(a: Set<T>, b: Set<T>): boolean => {
  if (a.size !== b.size) return false
  for (const item of a) if (!b.has(item)) return false
  return true
}

export type Notification = {
  duelId: number
  type: 'duel' | 'system'
  timestamp: number
  isRead: boolean
  isDisplayed: boolean
  state: constants.ChallengeState
  requiresAction: boolean // Whether this notification requires user action
}

interface NotificationState {
  [key: number]: Notification
}

interface State {
  notifications: NotificationState
  hasInitialized: boolean
  markAsRead: (duelIds: number[]) => void
  markAsDisplayed: (duelIds: number[]) => void
  markAllAsRead: () => void
  markAllAsDisplayed: () => void
  getNotification: (duelId: number) => Notification | null
  addOrUpdateNotifications: (notifications: Notification[]) => void
  cleanupOldNotifications: () => void
}

class NotificationDatabase extends Dexie {
  notifications!: Table<Notification>

  constructor() {
    super('NotificationDB')
    this.version(1).stores({
      notifications: 'duelId,timestamp,isRead,requiresAction',
    })
  }
}

const db = new NotificationDatabase()

// Clear localStorage once
const clearLocalStorage = () => {
  try {
    if (localStorage.getItem(STORAGE_KEY)) {
      localStorage.removeItem(STORAGE_KEY)
      console.log('Cleared old localStorage notifications')
    }
  } catch (e) {
    console.error('Failed to clear localStorage:', e)
  }
}

// Create the notifications store
const createStore = () => {
  const store = create<State>()(immer((set, get) => ({
    notifications: {},
    hasInitialized: false,

    markAsRead: (duelIds: number[]) => {
      set((state: State) => {
        duelIds.forEach(duelId => {
          const notification = state.notifications[duelId]
          if (notification) {
            notification.isRead = true
          }
        })
        // Update in IndexedDB
        db.notifications.bulkUpdate(duelIds.map(duelId => ({ key: duelId, changes: { isRead: true } })))
      })
    },

    markAsDisplayed: (duelIds: number[]) => {
      set((state: State) => {
        duelIds.forEach(duelId => {
          const notification = state.notifications[duelId]
          if (notification) {
            notification.isDisplayed = true
          }
        })
        // Update in IndexedDB
        db.notifications.bulkUpdate(duelIds.map(duelId => ({ key: duelId, changes: { isDisplayed: true } })))
      })
    },

    markAllAsRead: () => {
      set((state: State) => {
        Object.values(state.notifications).forEach(n => {
          n.isRead = true
        })
        // Update all in IndexedDB
        db.notifications.toCollection().modify({ isRead: true })
      })
    },

    markAllAsDisplayed: () => {
      set((state: State) => {
        Object.values(state.notifications).forEach(n => {
          n.isDisplayed = true
        })
        // Update all in IndexedDB
        db.notifications.toCollection().modify({ isDisplayed: true })
      })
    },

    getNotification: (duelId: number) => {
      return get().notifications[duelId] || null
    },

    addOrUpdateNotifications: (notifications: Notification[]) => {
      set((state: State) => {
        let didChange = false
        const toPut: Notification[] = []

        // Update existing notifications with enhanced logic
        const updatedNotifications = Object.values(state.notifications).map(existing => {
          const newNotif = notifications.find(n => n.duelId === existing.duelId)
          if (!newNotif) return existing

          if (newNotif.timestamp !== existing.timestamp || newNotif.state !== existing.state ||
            (newNotif.requiresAction !== existing.requiresAction && (newNotif.state === constants.ChallengeState.Resolved || newNotif.state === constants.ChallengeState.Draw))
          ) {
            const updatedNotification = {
              ...existing,
              timestamp: newNotif.timestamp,
              isRead: newNotif.isRead,
              isDisplayed: !newNotif.requiresAction && existing.isDisplayed,
              state: newNotif.state,
              requiresAction: newNotif.requiresAction
            }
            
            state.notifications[existing.duelId] = updatedNotification
            toPut.push(updatedNotification)
            didChange = true
            return updatedNotification
          }
          return existing
        })
        
        // Handle brand new notifications
        const existingIds = updatedNotifications.map(n => n.duelId)
        const brandNewNotifications = notifications.filter(n => !existingIds.includes(n.duelId))
        
        brandNewNotifications.forEach(notification => {
          state.notifications[notification.duelId] = notification
          toPut.push(notification)
          didChange = true
        })

        if (toPut.length > 0) {
          db.notifications.bulkPut(toPut)
        }

        if (!didChange) return
      })
    },

    cleanupOldNotifications: async () => {
      const twentyOneDaysAgo = Math.floor(Date.now() / 1000) - 21 * 24 * 60 * 60;
      
      const oldKeys = await db.notifications
        .where('timestamp')
        .below(twentyOneDaysAgo)
        .primaryKeys();

      if (oldKeys.length === 0) return;
      
      // Clean up IndexedDB
      await db.notifications.bulkDelete(oldKeys)
    },
  })))

  // Load notifications from IndexedDB on store creation
  const initializeStore = async () => {
    try {
      // Clear localStorage once
      clearLocalStorage()

      // Clean up old notifications
      await store.getState().cleanupOldNotifications()
      
      // Load from IndexedDB
      const storedNotifications = await db.notifications.toArray()
      
      // Update store
      store.setState({
        notifications: storedNotifications.reduce((acc, n) => {
          acc[Number(n.duelId)] = n
          return acc
        }, {} as NotificationState),
        hasInitialized: true,
      })
    } catch (error) {
      console.error('Failed to initialize notification store:', error)
    }
  }

  // Initialize the store
  initializeStore()

  return store
}

export const useNotificationStore = createStore()

type NotificationContextType = {
  notifications: Notification[]
  markAsRead: (duelIds: number[]) => void
  markAsDisplayed: (duelIds: number[]) => void
  markAllAsRead: () => void
  markAllAsDisplayed: () => void
  hasUnreadNotifications: boolean
  getNotification: (duelId: number) => Notification | null
}

const NotificationContext = createContext<NotificationContextType | null>(null)

export const useNotificationContext = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const store = useNotificationStore()
  const { notifications: dbNotifications, hasInitialized, markAsRead, markAsDisplayed, markAllAsRead, markAllAsDisplayed, getNotification, addOrUpdateNotifications } = store
  const batchedAdd = useRef(debounce(addOrUpdateNotifications, 100)).current

  const sortedNotifications = useMemo(() => {
    return Object.values(dbNotifications).sort((a, b) => {
      if (a.requiresAction !== b.requiresAction) {
        return a.requiresAction ? -1 : 1
      }
      return b.timestamp - a.timestamp
    })
  }, [dbNotifications])

  const [notificationDuelIds, setNotificationDuelIds] = useState<number[]>([])

  useEffect(() => {
    const newDuelIds = new Set(sortedNotifications.map(n => n.duelId))
    const oldDuelIds = new Set(notificationDuelIds)

    if (!setsAreEqual(newDuelIds, oldDuelIds)) {
      setNotificationDuelIds(Array.from(newDuelIds))
    }
  }, [sortedNotifications])

  const activeDuels = useMyActiveDuels(notificationDuelIds.map(id => BigInt(id)))

  useEffect(() => {
    if (activeDuels.length === 0 || !hasInitialized) return
    
    const newNotifications = activeDuels
      .map(duel => ({
        duelId: Number(duel.duel_id),
        type: 'duel' as const,
        timestamp: duel.timestamp,
        isRead: false,
        isDisplayed: !duel.callToAction && (duel.state === constants.ChallengeState.Awaiting || duel.state === constants.ChallengeState.InProgress),
        state: duel.state,
        requiresAction: duel.callToAction && (duel.state !== constants.ChallengeState.Withdrawn && duel.state !== constants.ChallengeState.Expired && duel.state !== constants.ChallengeState.Refused),
      }))

    batchedAdd(newNotifications)
  }, [activeDuels, hasInitialized])

  const hasUnreadNotifications = useMemo(() => {
    return Object.values(dbNotifications).some(n => !n.isRead)
  }, [dbNotifications])

  const value = React.useMemo(() => ({
    notifications: sortedNotifications,
    markAsRead,
    markAsDisplayed,
    markAllAsRead,
    markAllAsDisplayed,
    hasUnreadNotifications,
    getNotification
  }), [dbNotifications, markAsRead, markAsDisplayed, markAllAsRead, markAllAsDisplayed, hasUnreadNotifications, getNotification])

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