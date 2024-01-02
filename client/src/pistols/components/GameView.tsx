import React, { useEffect } from 'react'
import { useGameplayContext, GameState } from '@/pistols/hooks/GameplayContext'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { useSettingsContext } from '@/pistols/hooks/SettingsContext'
import { useGameEvent } from '@/pistols/hooks/useGameEvent'
import GameCanvas from '@/pistols/components/GameCanvas'
import { AudioName } from '@/pistols/data/assets'


const GameView = () => {
  const { duelId } = usePistolsContext()
  const { gameImpl, isPlaying, dispatchAnimated} = useGameplayContext()

  const animated = useGameEvent('animated', -1)
  useEffect(() => {
    dispatchAnimated(animated)
  }, [animated])

  return (
    <div className='Relative GameView'>
      <GameCanvas guiEnabled={null} />
    </div>
  )
}


export default GameView
