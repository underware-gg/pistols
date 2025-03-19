import React, { useEffect, useState, useRef } from 'react'
import { usePistolsContext, usePistolsScene } from '/src/hooks/PistolsContext'
import { SceneName } from '/src/data/assets'
import { useGameEvent } from '/src/hooks/useGameEvent'
import { TavernAudios } from '/src/components/GameContainer'
import { DojoSetupErrorDetector } from '../account/DojoSetupErrorDetector'
import Logo from '/src/components/Logo'
import AnimatedText from '../ui/AnimatedText'
import TWEEN from '@tweenjs/tween.js'

export default function ScGate() {
  const { tableOpener } = usePistolsContext()
  const { dispatchSetScene } = usePistolsScene()
  
  const [textOpacity, setTextOpacity] = useState(0)
  const [text, setText] = useState('')

  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const { value: itemClicked, timestamp } = useGameEvent('scene_click', null)
  
  useEffect(() => {
    // Start a 10 second timer when entering the screen
    timerRef.current = setTimeout(() => {
      // Animate opacity for text
      setText('I should try Knocking on the door...')
      new TWEEN.Tween({ opacity: 0 })
        .to({ opacity: 1 }, 1000)
        .easing(TWEEN.Easing.Cubic.Out)
        .onUpdate(({ opacity }) => {
          setTextOpacity(opacity)
        })
        .start()
    }, 10000)

    // Clean up timer when leaving the screen
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
          dispatchSetScene(SceneName.Door)
          break
      }
    }
  }, [itemClicked, timestamp])

  return (
    <>
      <div style={{ position: 'absolute', left: '4%', bottom: '6%',zIndex: 1 }}>
        <Logo width={12} showName square />
      </div>

      <TavernAudios />
      {/* <BarkeepModal /> */}
      <div className='GateTalkBaloon NoMouse NoDrag' style={{ opacity: textOpacity }}>
        <AnimatedText text={text} delayPerCharacter={50} />
      </div>

      <DojoSetupErrorDetector />

    </>
  )
}
