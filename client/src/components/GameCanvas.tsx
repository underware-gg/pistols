import React, { useEffect } from 'react'
import { useThreeJsContext } from '@/hooks/ThreeJsContext'
import { useGameplayContext } from '@/hooks/GameplayContext'
import { useGameEvent } from '@/hooks/useGameEvent'
import { usePistolsContext } from '@/hooks/PistolsContext'
import ThreeJsCanvas from '@/three/ThreeJsCanvas'

const GameCanvas = () => {
  const { gameImpl } = useThreeJsContext()
  const { dispatchAnimated } = useGameplayContext()
  const { currentScene } = usePistolsContext()

  const { value: animated, timestamp } = useGameEvent('animated', -1)
  useEffect(() => {
    dispatchAnimated(animated)
  }, [animated, timestamp])

  useEffect(() => {
    gameImpl?.switchScene(currentScene)
  }, [gameImpl, currentScene])

  return (
    <div className='Relative GameCanvas'>
      <ThreeJsCanvas guiEnabled={false} />
    </div>
  )
}

export default GameCanvas
