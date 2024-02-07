import React, { useEffect } from 'react'
import { useGameplayContext } from '@/pistols/hooks/GameplayContext'
import { useGameEvent } from '@/pistols/hooks/useGameEvent'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import GameCanvas from '@/pistols/components/GameCanvas'

const GameView = () => {
  const { gameImpl, dispatchAnimated } = useGameplayContext()
  const { sceneName } = usePistolsContext()

  const animated = useGameEvent('animated', -1)
  useEffect(() => {
    dispatchAnimated(animated)
  }, [animated])

  useEffect(() => {
    gameImpl?.switchScene(sceneName)
  }, [gameImpl, sceneName])

  return (
    <div className='Relative GameView'>
      <GameCanvas guiEnabled={null} />
    </div>
  )
}

export default GameView
