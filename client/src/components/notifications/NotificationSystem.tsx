import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { Image } from 'semantic-ui-react'
import { useNotifications, type Notification } from '/src/stores/notificationStore'
import { usePistolsContext, usePistolsScene } from '/src/hooks/PistolsContext'
import * as TWEEN from '@tweenjs/tween.js'
import { BannerButton } from '../Header'
import { emitter, playAudio } from '/src/three/game'
import { DuelNotificationItem } from './DuelNotificationItem'
import { PushNotification } from './PushNotification'
import { AudioName } from '/src/data/audioAssets'
import { SceneName } from '/src/data/assets'

const NOTIFICATION_DISPLAY_DURATION = 4000
const NOTIFICATION_ANIMATION_DURATION = 500
const NOTIFICATION_SOUND_COOLDOWN = 15000

export default function NotificationSystem() {
  const { sortedNotifications, markAsRead, markAsDisplayed } = useNotifications()
  const { dispatchSelectDuel, currentDuel, selectedDuelId, barkeepModalOpener } = usePistolsContext()
  const { dispatchSetScene, atDuel, atGate, atDoor, atTutorial } = usePistolsScene()
  
  const [currentNotifications, setCurrentNotifications] = useState<Notification[] | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [unreadNotifications, setUnreadNotifications] = useState<Notification[]>([])
  
  const bubbleRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()
  
  const notificationsRef = useRef<Notification[] | null>(null)
  const selectedDuelIdRef = useRef<number | null>(null)
  const currentDuelRef = useRef<number | null>(null)

  const hasDisplayedNotificationsRef = useRef(false)
  const swRegistrationRef = useRef<ServiceWorkerRegistration | null>(null)
  const lastSoundTimeRef = useRef<number>(0)

  // never display at gate or door (after disconnect)
  const wrongScene = useMemo(() => (atDuel || atGate || atDoor || atTutorial), [atDuel, atGate, atDoor, atTutorial])
  useEffect(() => {
    if (wrongScene) {
      setIsVisible(false)
    }
  }, [wrongScene])

  // Track tab focus state
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsFocused(!document.hidden)
    }

    const handleFocus = () => {
      setIsFocused(true)
    }

    const handleBlur = () => {
      setIsFocused(false)
    }

    // Listen for visibility changes (tab switching)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Listen for window focus/blur (alt-tab, etc)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)

    setIsFocused(!document.hidden)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
    }
  }, [])

  // Register service worker for browser notifications
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/notification-worker.js')

        // Request notification permission if needed
        if (Notification.permission !== "granted" && Notification.permission !== "denied") {
          await Notification.requestPermission()
        }

        swRegistrationRef.current = registration
      } catch (error) {
        console.error('[NOTIFY] Service worker registration failed:', error)
      }
    }

    registerSW()
  }, [])

  useEffect(() => {
    // console.log('unreadNotifications', isFocused) //TODO without this it doesnt update on focus change for some reason
  }, [isFocused])

  useEffect(() => {
    if(!sortedNotifications) return
    const newUnread = sortedNotifications.filter(n => !n.isDisplayed)
    setUnreadNotifications(newUnread)
  }, [sortedNotifications])

  useEffect(() => {
    if (unreadNotifications.length === 0 && !isAnimating) {
      setIsVisible(false)
      return
    }

    if (!currentNotifications && !isAnimating) {
      if (unreadNotifications.length > 2) {
        const nextNotifications = [...unreadNotifications]
        notificationsRef.current = nextNotifications
        setCurrentNotifications(nextNotifications)
      } else {
        const nextNotification = unreadNotifications[0]
        notificationsRef.current = [nextNotification]
        setCurrentNotifications([nextNotification])
      }
    }
  }, [unreadNotifications, currentNotifications, isAnimating])

  useEffect(() => {
    if (selectedDuelId) {
      markAsRead([Number(selectedDuelId)])
    }
    if (currentDuel) {
      markAsRead([Number(currentDuel)])
    }
    selectedDuelIdRef.current = Number(selectedDuelId)
    currentDuelRef.current = Number(currentDuel)
  }, [selectedDuelId, currentDuel])

  // Helper function to play notification sound with cooldown
  const playNotificationSound = (soundType: AudioName) => {
    const now = Date.now()
    if (now - lastSoundTimeRef.current >= NOTIFICATION_SOUND_COOLDOWN) {
      playAudio(soundType)
      lastSoundTimeRef.current = now
    }
  }

  // Handle notification clicks from service worker
  useEffect(() => {
    if (!navigator.serviceWorker) return

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'DUEL_NOTIFICATION_CLICK') {
        const duelIds = event.data.duelIds
        if (!duelIds) return
        
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = undefined
        }

        if (duelIds.length > 1) {
          dispatchSetScene(SceneName.Tavern)
          setTimeout(() => {
            barkeepModalOpener.open({ initialStage: 'notifications' })
          }, 200)
          onNotificationDismissed(false, duelIds)
        } else {
          dispatchSelectDuel(duelIds[0])
          onNotificationDismissed(true, duelIds)
        }
      }
    }

    navigator.serviceWorker.addEventListener('message', handleMessage)

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage)
    }
  }, [])

  const showNotification = () => {
    if (notificationsRef.current && notificationsRef.current.length === 1 && (selectedDuelIdRef.current === notificationsRef.current[0]?.duelId || currentDuelRef.current === notificationsRef.current[0]?.duelId)) {
      onNotificationShown()
      onNotificationDismissed(true, notificationsRef.current)
      return
    }
    
    if (!bubbleRef.current || !notificationsRef.current) return
    if (hasDisplayedNotificationsRef.current) return
    if (wrongScene) return

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    onNotificationShown()
    setIsAnimating(true)
    setIsVisible(true)

    playNotificationSound(AudioName.NOTIFICATION)

    timeoutRef.current = setTimeout(() => {
      if (notificationsRef.current) {
        hideNotification(false)
      }
    }, NOTIFICATION_DISPLAY_DURATION + (NOTIFICATION_ANIMATION_DURATION * 2))

    new TWEEN.Tween({ opacity: 0 })
      .to({ opacity: 1 }, NOTIFICATION_ANIMATION_DURATION)
      .delay(NOTIFICATION_ANIMATION_DURATION)
      .easing(TWEEN.Easing.Quadratic.Out)
      .onUpdate(({ opacity }) => {
        if (bubbleRef.current) {
          bubbleRef.current.style.opacity = opacity.toString()
        }
      })
      .start()
  }

  const showPushNotification = () => {
    if (notificationsRef.current && notificationsRef.current.length === 1 && (selectedDuelIdRef.current === notificationsRef.current[0]?.duelId || currentDuelRef.current === notificationsRef.current[0]?.duelId)) {
      onNotificationShown()
      onNotificationDismissed(true, notificationsRef.current)
      return
    }

    if (hasDisplayedNotificationsRef.current) return

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    playNotificationSound(AudioName.NOTIFICATION)

    onNotificationShown()

    timeoutRef.current = setTimeout(() => {
      if (notificationsRef.current) {
        onNotificationDismissed(false, notificationsRef.current)
      }
    }, NOTIFICATION_DISPLAY_DURATION)
  }

  const onNotificationShown = () => {
    hasDisplayedNotificationsRef.current = true
    markAsDisplayed(notificationsRef.current?.map(n => n.duelId))
  }

  const hideNotification = (hasSeen: boolean = false) => {
    if (!bubbleRef.current) return

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = undefined
    }

    setTimeout(() => {
      setIsAnimating(false)
      onNotificationDismissed(hasSeen, notificationsRef.current)
    }, NOTIFICATION_ANIMATION_DURATION)

    new TWEEN.Tween({ opacity: 1 })
      .to({ opacity: 0 }, NOTIFICATION_ANIMATION_DURATION)
      .easing(TWEEN.Easing.Quadratic.In)
      .onUpdate(({ opacity }) => {
        if (bubbleRef.current) {
          bubbleRef.current.style.opacity = opacity.toString()
        }
      })
      .start()
  }

  const onNotificationDismissed = (hasSeen: boolean, notifications?: Notification[]) => {
    if (hasSeen && notifications) {
      markAsRead(notifications.map(n => n.duelId))
    }
    notificationsRef.current = null
    hasDisplayedNotificationsRef.current = false
    setCurrentNotifications(null)

    emitter.emit('hover_description', null)
  }

  const handleClick = (e?: React.MouseEvent) => {
    const notifications = notificationsRef.current
    if (!notifications) return
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = undefined
    }

    if (notifications.length > 1) {
      dispatchSetScene(SceneName.Tavern)
      setTimeout(() => {
        barkeepModalOpener.open({ initialStage: 'notifications' })
      }, 200)
      hideNotification(false)
    } else {
      dispatchSelectDuel(notifications[0].duelId)
      hideNotification(true)
    }
    
  }

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation()
    hideNotification(true)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <>
      <BannerButton 
        visible={isVisible} 
        customOffset={!atDuel ? 4 : 2.5} 
        button={
          <Image 
            onClick={handleClick} 
            src='/images/ui/notification_bartender_head.png' 
            className="NotificationBartenderImage"
          />
        } 
      />

      <PushNotification 
        key={`push-${notificationsRef.current?.[0]?.duelId}`} 
        notifications={notificationsRef.current} 
        shouldShow={!isFocused && !hasDisplayedNotificationsRef.current} 
        showNotification={showPushNotification}
      />

      <div 
        ref={bubbleRef}
        className='NotificationTalkBaloon YesMouse'
        style={{
          display: isVisible ? 'block' : 'none',
          top: atDuel ? '15%' : '18%'
        }}
        data-tail="left"
        onClick={handleClick}
      >
        {currentNotifications && (
          <div className="Relative">
            <div 
              onClick={handleDismiss}
              className="NotificationDismissButton"
              onMouseEnter={(e) => {
                e.stopPropagation()
                emitter.emit('hover_description', 'Dismiss')
              }}
              onMouseLeave={(e) => {
                e.stopPropagation()
                emitter.emit('hover_description', null)
              }}
            >
              <Image src='/images/ui/duel/card_details/button_exit.png' className="NotificationDismissImage" />
            </div>

            <DuelNotificationItem
              notifications={currentNotifications}
              onAction={handleClick}
              canShow={!isAnimating && isFocused && !hasDisplayedNotificationsRef.current}
              onShow={showNotification}
              className="NotificationItemWrapper"
            />
          </div>
        )}
      </div>
    </>
  )
}