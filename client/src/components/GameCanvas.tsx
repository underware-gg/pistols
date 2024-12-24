import React, { useEffect } from 'react'
import { useThreeJsContext } from '/src/hooks/ThreeJsContext'
import { useGameplayContext } from '/src/hooks/GameplayContext'
import { useGameEvent } from '/src/hooks/useGameEvent'
import { usePistolsContext } from '/src/hooks/PistolsContext'
import ThreeJsCanvas from '/src/three/ThreeJsCanvas'

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
