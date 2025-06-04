import React, { useEffect, useState, useRef } from 'react'
import { usePistolsScene } from '/src/hooks/PistolsContext'
import { SceneName, TextureName } from '/src/data/assets'
import { useGameEvent } from '/src/hooks/useGameEvent'
import { DojoSetupErrorDetector } from '/src/components/account/DojoSetupErrorDetector'
import { _currentScene } from '/src/three/game'
import { InteractibleScene } from '/src/three/InteractibleScene'
import BarkeepModal from '/src/components/modals/BarkeepModal'
import ActivityPanel from '/src/components/ActivityPanel'
import { Image } from 'semantic-ui-react'
import { useTextureShift } from '/src/hooks/useTextureShift'
import { useGameAspect } from '/src/hooks/useGameAspect'
import { useNotifications } from '/src/stores/notificationStore'
import * as TWEEN from '@tweenjs/tween.js'
import { emitter } from '/src/three/game'

export default function ScTavern() {
  const { dispatchSetScene } = usePistolsScene()
  const { aspectWidth } = useGameAspect()
  const { hasUnreadNotifications } = useNotifications()

  const { value: itemClicked, timestamp } = useGameEvent('scene_click', null)
  const { x: notificationShiftX, y: notificationShiftY } = useTextureShift(1)

  const [open, setOpen] = useState(false)
  const [exclamationOpacity, setExclamationOpacity] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [pulseIntensity, setPulseIntensity] = useState(8)
  const [verticalShift, setVerticalShift] = useState(0)
  
  const opacityTweenRef = useRef<TWEEN.Tween<any> | null>(null)
  const pulseTweenRef = useRef<TWEEN.Tween<any> | null>(null)
  const floatTweenRef = useRef<TWEEN.Tween<any> | null>(null)

  useEffect(() => {
    if (opacityTweenRef.current) {
      opacityTweenRef.current.stop()
    }

    const targetOpacity = hasUnreadNotifications && !open ? 1 : 0
    opacityTweenRef.current = new TWEEN.Tween({ opacity: exclamationOpacity })
      .to({ opacity: targetOpacity }, 200)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .onUpdate(({ opacity }) => {
        setExclamationOpacity(opacity)
      })
      .start()
  }, [hasUnreadNotifications, open])

  useEffect(() => {
    if (pulseTweenRef.current) {
      pulseTweenRef.current.stop()
    }
    if (floatTweenRef.current) {
      floatTweenRef.current.stop()
    }

    if (exclamationOpacity > 0 && !isHovered && !open) {
      pulseTweenRef.current = new TWEEN.Tween({ intensity: pulseIntensity })
        .to({ intensity: 16 }, 800)
        .easing(TWEEN.Easing.Sinusoidal.InOut)
        .yoyo(true)
        .repeat(Infinity)
        .onUpdate(({ intensity }) => {
          setPulseIntensity(intensity)
        })
        .start()

      floatTweenRef.current = new TWEEN.Tween({ shift: verticalShift })
        .to({ shift: 8 }, 800)
        .easing(TWEEN.Easing.Sinusoidal.InOut)
        .yoyo(true)
        .repeat(Infinity)
        .onUpdate(({ shift }) => {
          setVerticalShift(shift)
        })
        .start()
    } else {
      setPulseIntensity(isHovered ? 16 : 8)
      setVerticalShift(0)
    }
  }, [exclamationOpacity, isHovered, open])
  
  useEffect(() => {
    if (itemClicked) {
      switch (itemClicked) {
        case 'pistol':
          dispatchSetScene(SceneName.Leaderboards)
          break
        case 'bottle':
          dispatchSetScene(SceneName.Duelists)
          break
        case 'shovel':
          dispatchSetScene(SceneName.Graveyard)
          break
        case 'bartender':
          setOpen(true);
          (_currentScene as InteractibleScene)?.excludeItem(TextureName.bg_tavern_bartender_mask);
          (_currentScene as InteractibleScene)?.toggleBlur(true);
          (_currentScene as InteractibleScene)?.setClickable(false);
          break;
      }
    }
  }, [itemClicked, timestamp])

  useEffect(() => {
    if (!open && _currentScene && _currentScene instanceof InteractibleScene) {
      (_currentScene as InteractibleScene)?.toggleBlur?.(false);
      (_currentScene as InteractibleScene)?.setClickable?.(true);
      setTimeout(() => {
        (_currentScene as InteractibleScene)?.excludeItem?.(null);
      }, 400)
    }
  }, [open])

  const handleMouseEnter = () => {
    setIsHovered(true)
    emitter.emit('hover_description', 'You have unread notifications')
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    emitter.emit('hover_description', '')
  }

  return (
    <div>
      <Image 
        src="/images/ui/notification_exclamation.png"
        className="YeMouse NoDrag"
        style={{
          position: 'absolute',
          display: exclamationOpacity > 0 ? 'block' : 'none',
          top: '30%',
          left: '46%',
          rotate: '-20deg',
          width: aspectWidth(10),
          height: 'auto',
          transform: `translate(${notificationShiftX}px, ${notificationShiftY + verticalShift}px) scale(${isHovered ? 1.2 : 1})`, 
          cursor: 'pointer',
          opacity: exclamationOpacity,
          filter: `drop-shadow(0 0 ${pulseIntensity}px rgba(255, 255, 255, ${isHovered ? 1 : 0.8}))`,
          transition: 'transform 0.2s ease-out'
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={() => setOpen(true)}
      />

      <ActivityPanel />
      <BarkeepModal open={open} setOpen={setOpen} />

      <DojoSetupErrorDetector />
    </div>
  )
}
