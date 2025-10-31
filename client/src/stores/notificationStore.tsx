import React, { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback, ReactNode } from 'react'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import Dexie, { Table } from 'dexie'
import { useMyActiveDuels } from '/src/stores/challengeStore'
import { constants } from '@underware/pistols-sdk/pistols/gen'
import { useAccount } from '@starknet-react/core'

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

const getNotificationKey = (owner: string, duelId: number): string => {
  return `${owner}_${duelId}`
}

export type Notification = {
  id: string
  owner: string
  duelId: number
  type: 'duel' | 'system'
  timestamp: number
  isRead: boolean
  isDisplayed: boolean
  state: constants.ChallengeState
  requiresAction: boolean // Whether this notification requires user action
}

interface NotificationState {
  [key: string]: Notification
}

interface State {
  notifications: NotificationState
  hasInitialized: boolean
  markAsRead: (address: string, duelIds: number[]) => void
  markAsDisplayed: (address: string, duelIds: number[]) => void
  markAllAsRead: (address: string) => void
  markAllAsDisplayed: (address: string) => void
  getNotification: (address: string, duelId: number) => Notification | null
  addOrUpdateNotifications: (notifications: Notification[]) => void
  cleanupOldNotifications: () => void
}

async function migrateOldNotifications(): Promise<Notification[]> {
  try {
    const tempDb = new Dexie('NotificationDB')
    tempDb.version(1).stores({ 
      notifications: 'duelId,timestamp,isRead,requiresAction,owner' 
    })
    await tempDb.open()
    
    const old = await tempDb.table('notifications').toArray()
    await tempDb.close()
    
    if (!old.length) return []
    
    return old.map((n: any) => ({
      id: getNotificationKey(n.owner, n.duelId),
      ...n,
    }))
  } catch {
    return []
  }
}

class NotificationDatabase extends Dexie {
  notifications!: Table<Notification, string>

  constructor() {
    super('NotificationDB')
    this.version(1).stores({
      notifications: 'duelId,timestamp,isRead,requiresAction,owner',
    })

    this.version(2).stores({
      notifications: '&id,timestamp,isRead,requiresAction,owner,duelId',
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

    markAsRead: (address: string, duelIds: number[]) => {
      if (!address || !duelIds || duelIds.length === 0) return
      set((state: State) => {
        const keysToUpdate = duelIds
          .map(duelId => getNotificationKey(address, duelId))
          .filter(key => state.notifications[key])
        
        if (keysToUpdate.length === 0) return
        
        keysToUpdate.forEach(key => {
          const notification = state.notifications[key]
          if (notification && notification.owner === address) {
            notification.isRead = true
          }
        })
        // Update in IndexedDB
        db.notifications.bulkUpdate(keysToUpdate.map(key => ({ key, changes: { isRead: true } })))
      })
    },

    markAsDisplayed: (address: string, duelIds: number[]) => {
      if (!address || !duelIds || duelIds.length === 0) return
      set((state: State) => {
        const keysToUpdate = duelIds
          .map(duelId => getNotificationKey(address, duelId))
          .filter(key => state.notifications[key])
        
        if (keysToUpdate.length === 0) return
        
        keysToUpdate.forEach(key => {
          const notification = state.notifications[key]
          if (notification && notification.owner === address) {
            notification.isDisplayed = true
          }
        })
        // Update in IndexedDB
        db.notifications.bulkUpdate(keysToUpdate.map(key => ({ key, changes: { isDisplayed: true } })))
      })
    },

    markAllAsRead: (address: string) => {
      if (!address) return
      set((state: State) => {
        Object.values(state.notifications).filter(n => n.owner === address).forEach(n => {
          n.isRead = true
        })
        // Update all in IndexedDB
        db.notifications.where('owner').equals(address).modify({ isRead: true })
      })
    },

    markAllAsDisplayed: (address: string) => {
      if (!address) return
      set((state: State) => {
        Object.values(state.notifications).filter(n => n.owner === address).forEach(n => {
          n.isDisplayed = true
        })
        // Update all in IndexedDB
        db.notifications.where('owner').equals(address).modify({ isDisplayed: true })
      })
    },

    getNotification: (address: string, duelId: number) => {
      if (!address) return null
      const key = getNotificationKey(address, duelId)
      return get().notifications[key] || null
    },

    addOrUpdateNotifications: (notifications: Notification[]) => {
      set((state: State) => {
        let didChange = false
        const toPut: Notification[] = []

        // Update existing notifications with enhanced logic
        const updatedNotifications = Object.values(state.notifications).map(existing => {
          const newNotif = notifications.find(n => 
            n.duelId === existing.duelId && n.owner === existing.owner
          )
          if (!newNotif) return existing

          if (newNotif.timestamp !== existing.timestamp || newNotif.state !== existing.state || newNotif.requiresAction !== existing.requiresAction) {
            const updatedNotification = {
              ...existing,
              id: newNotif.id,
              timestamp: newNotif.timestamp,
              isRead: newNotif.isRead,
              isDisplayed: !newNotif.requiresAction && existing.isDisplayed,
              state: newNotif.state,
              requiresAction: newNotif.requiresAction,
            }
            
            state.notifications[updatedNotification.id] = updatedNotification
            toPut.push(updatedNotification)
            didChange = true
            return updatedNotification
          }
          return existing
        })
        
        // Handle brand new notifications
        const existingKeys = updatedNotifications.map(n => n.id)
        const brandNewNotifications = notifications.filter(n => 
          !existingKeys.includes(n.id)
        )
        
        brandNewNotifications.forEach(notification => {
          state.notifications[notification.id] = notification
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
      const sixtyDaysAgo = Math.floor(Date.now() / 1000) - 60 * 24 * 60 * 60;
      
      const oldKeys = await db.notifications
        .where('timestamp')
        .below(sixtyDaysAgo)
        .and(n => n.requiresAction === false)
        .and(n => n.isDisplayed === true)
        .and(n => n.isRead === true)
        .and(n => n.state !== constants.ChallengeState.Awaiting && n.state !== constants.ChallengeState.InProgress)
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

      const oldNotifications = await migrateOldNotifications()
      if (oldNotifications.length > 0) {
        await new Promise<void>((resolve) => {
          const req = indexedDB.deleteDatabase('NotificationDB')
          req.onsuccess = () => resolve()
          req.onerror = () => resolve()
          req.onblocked = () => {
            db.close()
            setTimeout(() => resolve(), 100)
          }
        })
      }

      await db.open()
      
      if (oldNotifications.length > 0 && (await db.notifications.count()) === 0) {
        await db.notifications.bulkPut(oldNotifications)
      }

      // Clean up old notifications
      await store.getState().cleanupOldNotifications()
      
      // Load from IndexedDB
      const storedNotifications = await db.notifications.toArray()
      
      // Update store
      store.setState({
        notifications: storedNotifications.reduce((acc, n) => {
          acc[n.id] = n
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
  sortedNotifications: Notification[]
  markAsRead: (duelIds: number[]) => void
  markAsDisplayed: (duelIds: number[]) => void
  markAllAsRead: (address: string) => void
  markAllAsDisplayed: (address: string) => void
  hasUnreadNotifications: boolean
  getNotification: (duelId: number) => Notification | null
}

const NotificationContext = createContext<NotificationContextType | null>(null)

export const useNotificationContext = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { address } = useAccount()
  const store = useNotificationStore()
  const { notifications, hasInitialized, markAsRead, markAsDisplayed, markAllAsRead, markAllAsDisplayed, getNotification, addOrUpdateNotifications } = store
  const batchedAdd = useRef(debounce(addOrUpdateNotifications, 100)).current

  const sortedNotifications = useMemo(() => {
    if (!address) return []
      return Object.values(notifications).filter(n => n.owner === address).sort((a, b) => {
        if (a.requiresAction !== b.requiresAction) {
          return a.requiresAction ? -1 : 1
        }
        return b.timestamp - a.timestamp
      })
  }, [notifications, address])

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
    if (activeDuels.length === 0 || !hasInitialized || !address) return
    
    const newNotifications = activeDuels
      .map(duel => ({
        id: getNotificationKey(address, Number(duel.duel_id)),
        owner: address,
        duelId: Number(duel.duel_id),
        type: 'duel' as const,
        timestamp: duel.timestamp,
        isRead: !duel.hasOpponent || !duel.callToAction,
        isDisplayed: !duel.hasOpponent || (!duel.callToAction && (duel.state === constants.ChallengeState.Awaiting || duel.state === constants.ChallengeState.InProgress)),
        state: duel.state,
        requiresAction: duel.callToAction && (duel.state !== constants.ChallengeState.Withdrawn && duel.state !== constants.ChallengeState.Expired && duel.state !== constants.ChallengeState.Refused),
      }))

    batchedAdd(newNotifications)
  }, [activeDuels, hasInitialized, address])

  const hasUnreadNotifications = useMemo(() => {
    return sortedNotifications.some(n => !n.isRead)
  }, [sortedNotifications])

  const markAsReadWithAddress = useCallback((duelIds: number[]) => {
    if (!address) return
    markAsRead(address, duelIds)
  }, [address, markAsRead])

  const markAsDisplayedWithAddress = useCallback((duelIds: number[]) => {
    if (!address) return
    markAsDisplayed(address, duelIds)
  }, [address, markAsDisplayed])

  const getNotificationWithAddress = useCallback((duelId: number) => {
    if (!address) return null
    return getNotification(address, duelId)
  }, [address, getNotification])

  const value = React.useMemo(() => ({
    sortedNotifications,
    markAsRead: markAsReadWithAddress,
    markAsDisplayed: markAsDisplayedWithAddress,
    markAllAsRead: (addr: string) => markAllAsRead(addr || address || ''),
    markAllAsDisplayed: (addr: string) => markAllAsDisplayed(addr || address || ''),
    hasUnreadNotifications,
    getNotification: getNotificationWithAddress
  }), [sortedNotifications, markAsReadWithAddress, markAsDisplayedWithAddress, markAllAsRead, markAllAsDisplayed, address, hasUnreadNotifications, getNotificationWithAddress])

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