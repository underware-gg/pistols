import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNotifications, type Notification } from '/src/stores/notificationStore'
import { usePistolsContext } from '/src/hooks/PistolsContext'
import * as TWEEN from '@tweenjs/tween.js'
import { BannerButton } from '../Header'
import { Image } from 'semantic-ui-react'
import { emitter, playAudio } from '/src/three/game'
import { DuelNotificationItem } from './DuelNotificationItem'
import { PushNotification } from './PushNotification'
import { AudioName } from '/src/data/audioAssets'

const NOTIFICATION_DISPLAY_DURATION = 4000
const NOTIFICATION_ANIMATION_DURATION = 500
const NOTIFICATION_SOUND_COOLDOWN = 15000

export default function NotificationSystem() {
  const { notifications, markAsRead, markAsDisplayed } = useNotifications()
  const { dispatchSelectDuel, currentDuel, selectedDuelId } = usePistolsContext()
  
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [unreadNotifications, setUnreadNotifications] = useState<Notification[]>([])
  
  const bubbleRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()
  const notificationRef = useRef<Notification | null>(null)
  const hasDisplayedNotificationRef = useRef(false)
  const swRegistrationRef = useRef<ServiceWorkerRegistration | null>(null)
  const lastSoundTimeRef = useRef<number>(0)

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
    const newUnread = notifications.filter(n => !n.isDisplayed)
    setUnreadNotifications(newUnread)
  }, [notifications])

  useEffect(() => {
    if (unreadNotifications.length === 0 && !isAnimating) {
      setIsVisible(false)
      return
    }

    if (!currentNotification && !isAnimating) {
      const nextNotification = unreadNotifications[0]
      notificationRef.current = nextNotification
      setCurrentNotification(nextNotification)
    }
  }, [unreadNotifications, currentNotification, isAnimating])

  useEffect(() => {
    if (selectedDuelId) {
      markAsRead(selectedDuelId)
    }
    if (currentDuel) {
      markAsRead(currentDuel)
    }
  }, [selectedDuelId, currentDuel])

  // Helper function to play notification sound with cooldown
  const playNotificationSound = (soundType: AudioName) => {
    const now = Date.now()
    if (now - lastSoundTimeRef.current >= NOTIFICATION_SOUND_COOLDOWN) {
      playAudio(soundType)
      lastSoundTimeRef.current = now
    }
  }

  // Handle in-game notification sound
  useEffect(() => {
    if (isVisible && currentNotification) {
      playNotificationSound(AudioName.NOTIFICATION)
    }
  }, [isVisible, currentNotification])

  // Handle notification clicks from service worker
  useEffect(() => {
    if (!navigator.serviceWorker) return

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'DUEL_NOTIFICATION_CLICK') {
        const duelId = event.data.duelId
        if (!duelId) return
        
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = undefined
        }
        
        dispatchSelectDuel(duelId)
        onNotificationDismissed(true, duelId)
      }
    }

    navigator.serviceWorker.addEventListener('message', handleMessage)

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage)
    }
  }, [])

  const showNotification = () => {
    if (selectedDuelId === notificationRef.current?.duelId || currentDuel === notificationRef.current?.duelId) {
      onNotificationShown()
      onNotificationDismissed(true, notificationRef.current?.duelId)
      return
    }
    
    if (!bubbleRef.current || !notificationRef.current) return
    if (hasDisplayedNotificationRef.current) return

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    onNotificationShown()
    setIsAnimating(true)
    setIsVisible(true)

    timeoutRef.current = setTimeout(() => {
      if (notificationRef.current) {
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
    if (selectedDuelId === notificationRef.current?.duelId || currentDuel === notificationRef.current?.duelId) {
      onNotificationShown()
      onNotificationDismissed(true, notificationRef.current?.duelId)
      return
    }

    if (hasDisplayedNotificationRef.current) return

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    playNotificationSound(AudioName.NOTIFICATION)

    onNotificationShown()

    timeoutRef.current = setTimeout(() => {
      if (notificationRef.current) {
        onNotificationDismissed(false, notificationRef.current?.duelId)
      }
    }, NOTIFICATION_DISPLAY_DURATION)
  }

  const onNotificationShown = () => {
    hasDisplayedNotificationRef.current = true
    markAsDisplayed(notificationRef.current?.duelId)
  }

  const hideNotification = (hasSeen: boolean = false) => {
    if (!bubbleRef.current) return

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = undefined
    }

    setTimeout(() => {
      setIsAnimating(false)
      onNotificationDismissed(hasSeen, notificationRef.current?.duelId)
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

  const onNotificationDismissed = (hasSeen: boolean, duelId?: bigint) => {
    if (hasSeen && duelId) {
      markAsRead(duelId)
    }
    notificationRef.current = null
    hasDisplayedNotificationRef.current = false
    setCurrentNotification(null)

    emitter.emit('hover_description', null)
  }

  const handleClick = (e?: React.MouseEvent) => {
    const notification = notificationRef.current
    if (!notification?.duelId) return
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = undefined
    }
    
    dispatchSelectDuel(notification.duelId)
    hideNotification(true)
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
        long 
        button={
          <Image 
            onClick={handleClick} 
            src='/images/ui/notification_bartender_head.png' 
            className="NotificationBartenderImage"
          />
        } 
      />

      <PushNotification 
        key={`push-${currentNotification?.duelId}`} 
        notification={currentNotification} 
        shouldShow={!isFocused && !hasDisplayedNotificationRef.current} 
        showNotification={showPushNotification}
      />

      <div 
        ref={bubbleRef}
        className='NotificationTalkBaloon YesMouse'
        style={{
          display: isVisible ? 'block' : 'none'
        }}
        data-tail="left"
        onClick={handleClick}
      >
        {currentNotification && (
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
              notification={currentNotification}
              onAction={handleClick}
              canShow={!isAnimating && isFocused && !hasDisplayedNotificationRef.current}
              onShow={showNotification}
              className="NotificationItemWrapper"
            />
          </div>
        )}
      </div>
    </>
  )
}