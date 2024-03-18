import React, { useEffect } from 'react'
import { useThreeJsContext } from '@/pistols/hooks/ThreeJsContext'
import { useGameplayContext } from '@/pistols/hooks/GameplayContext'
import { useGameEvent } from '@/pistols/hooks/useGameEvent'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import ThreeJsCanvas from '@/pistols/three/ThreeJsCanvas'
import { useDuel } from '../hooks/useDuel'
import { useDuelist } from '../hooks/useDuelist'
import { ProfileModels } from '../data/assets'

const GameCanvas = () => {
  const { gameImpl } = useThreeJsContext()
  const { dispatchAnimated } = useGameplayContext()
  const { sceneName, duelId } = usePistolsContext()
  const { challenge } = useDuel(duelId)

  const { profilePic: profilePicA } = useDuelist(challenge.duelistA)
  const { profilePic: profilePicB } = useDuelist(challenge.duelistB)

  const animated = useGameEvent('animated', -1)
  useEffect(() => {
    dispatchAnimated(animated)
  }, [animated])

  useEffect(() => {
    gameImpl?.switchScene(sceneName, ProfileModels[profilePicA], ProfileModels[profilePicB])
  }, [gameImpl, sceneName])

  return (
    <div className='Relative GameCanvas'>
      <ThreeJsCanvas guiEnabled={null} />
    </div>
  )
}

export default GameCanvas
