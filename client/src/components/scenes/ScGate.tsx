import React, { useEffect, useState, useRef } from 'react'
import { usePistolsScene } from '/src/hooks/PistolsContext'
import { SceneName, TextureName } from '/src/data/assets'
import { useGameEvent } from '/src/hooks/useGameEvent'
import { useTextureShift } from '/src/hooks/useTextureShift'
import { DojoSetupErrorDetector } from '/src/components/account/DojoSetupErrorDetector'
import { _currentScene } from '/src/three/game'
import { InteractibleScene } from '/src/three/InteractibleScene'
import { useThreeJsContext } from '/src/hooks/ThreeJsContext'
import { AudioName } from '/src/data/audioAssets'
import Logo from '/src/components/Logo'
import AnimatedText from '/src/components/ui/AnimatedText'
import TWEEN from '@tweenjs/tween.js'

export default function ScGate() {
  const { dispatchSetScene } = usePistolsScene()
  
  const [textOpacity, setTextOpacity] = useState(0)
  const [text, setText] = useState('')
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const { value: itemClicked, timestamp } = useGameEvent('scene_click', null)
  const { x: bubbleShiftX, y: bubbleShiftY } = useTextureShift(1)
  const { x: logoShiftX, y: logoShiftY } = useTextureShift(5)

  const { gameImpl } = useThreeJsContext()
  
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
        scene.excludeItem(TextureName.bg_entrance_door_mask)
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
  }, [])

  useEffect(() => {
    if (itemClicked) {
      switch (itemClicked) {
        case 'door':
          gameImpl?.playAudio(AudioName.DOOR_KNOCKING)
          dispatchSetScene(SceneName.Door)
          break
      }
    }
  }, [itemClicked, timestamp, gameImpl])

  return (
    <>
      <div style={{ position: 'absolute', right: '4%', bottom: '6%', zIndex: 1, transform: `translate(${logoShiftX}px, ${logoShiftY}px)` }}>
        <Logo width={12} showName vertical />
      </div>

      {/* <BarkeepModal /> */}
      <div
        className='FillParent'
        style={{ 
          opacity: textOpacity,
          transform: `translate(${bubbleShiftX}px, ${bubbleShiftY}px)`
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
