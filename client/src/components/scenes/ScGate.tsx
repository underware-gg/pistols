import React, { useEffect, useState, useRef } from 'react'
import { usePistolsContext, usePistolsScene } from '/src/hooks/PistolsContext'
import { sceneBackgrounds, SceneName } from '/src/data/assets'
import { useGameEvent } from '/src/hooks/useGameEvent'
import { TavernAudios } from '/src/components/GameContainer'
import { DojoSetupErrorDetector } from '../account/DojoSetupErrorDetector'
import Logo from '/src/components/Logo'
import AnimatedText from '../ui/AnimatedText'
import TWEEN from '@tweenjs/tween.js'
import { _currentScene, emitter } from '/src/three/game'
import { InteractibleScene } from '/src/three/InteractibleScene'
import { useGameAspect } from '/src/hooks/useGameAspect'

export default function ScGate() {
  const { aspectWidth, aspectHeight } = useGameAspect()

  const { tableOpener } = usePistolsContext()
  const { dispatchSetScene } = usePistolsScene()
  
  const [textOpacity, setTextOpacity] = useState(0)
  const [text, setText] = useState('')
  const [balloonPosition, setBalloonPosition] = useState({ x: 0, y: 0 })
  const [logoPosition, setLogoPosition] = useState({ x: 0, y: 0 })
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const { value: itemClicked, timestamp } = useGameEvent('scene_click', null)
  const { value: textureShiftBubble, timestamp: textureShiftBubbleTimestamp } = useGameEvent('texture_shift_1', null)
  const { value: textureShiftLogo, timestamp: textureShiftLogoTimestamp } = useGameEvent('texture_shift_3', null)
  
  useEffect(() => {
    // Set up the text display with delay
    timerRef.current = setTimeout(() => {
      setText('OY! Ye just standin\' there wastin\' me precious time or will ye enter?!')
      
      new TWEEN.Tween({ opacity: 0 })
        .to({ opacity: 1 }, 1000)
        .easing(TWEEN.Easing.Cubic.Out)
        .onUpdate(({ opacity }) => {
          setTextOpacity(opacity)
        })
        .start()
        
      const scene = (_currentScene as InteractibleScene);
      if (scene) {
        scene.excludeItem(sceneBackgrounds.Gate.items[0])
        scene.toggleBlur(true)
        
        setTimeout(() => {
          scene.toggleBlur(false)
        }, 3000)
      }
    }, 7000)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [tableOpener])

  useEffect(() => {
    const handleTextureShift = (shift: { x: number, y: number }) => {
      const scaledX = -shift.x * aspectWidth(100)
      const scaledY = shift.y * aspectHeight(100)
      setBalloonPosition({ x: scaledX, y: scaledY })
    }

    if (textureShiftBubble && text.includes('OY!')) {
      handleTextureShift(textureShiftBubble)
    }
  }, [textureShiftBubble, textureShiftBubbleTimestamp, text])

  useEffect(() => {
    const handleTextureShift = (shift: { x: number, y: number }) => {
      const scaledX = -shift.x * aspectWidth(100)
      const scaledY = shift.y * aspectHeight(100)
      setLogoPosition({ x: scaledX, y: scaledY })
    }

    if (textureShiftLogo) {
      handleTextureShift(textureShiftLogo)
    }
  }, [textureShiftLogo, textureShiftLogoTimestamp])

  useEffect(() => {
    if (itemClicked) {
      switch (itemClicked) {
        case 'door':
          dispatchSetScene(SceneName.Door)
          break
      }
    }
  }, [itemClicked, timestamp])

  return (
    <>
      <div style={{ position: 'absolute', right: '4%', bottom: '6%', zIndex: 1, transform: `translate(${logoPosition.x}px, ${logoPosition.y}px)` }}>
        <Logo width={12} showName vertical />
      </div>

      <TavernAudios />
      {/* <BarkeepModal /> */}
      <div
        className='FillParent'
        style={{ 
          opacity: textOpacity,
          transform: `translate(${balloonPosition.x}px, ${balloonPosition.y}px)`
        }}
      >
        <div className='GateTalkBaloon NoMouse NoDrag' data-tail="left" >
          <AnimatedText text={text} delayPerCharacter={50} />
        </div>
      </div>

      <DojoSetupErrorDetector />

    </>
  )
}
