import React, { useEffect } from 'react'
import { useThreeJsContext } from '@/pistols/hooks/ThreeJsContext'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { useDuel } from '../hooks/useDuel'
import { useDuelist } from '../hooks/useDuelist'
import { ProfileModels } from '../data/assets'

const PlayerSwitcher = () => {
  const { gameImpl } = useThreeJsContext()
  const { duelId } = usePistolsContext()
  const { challenge } = useDuel(duelId)

  const { profilePic: profilePicA } = useDuelist(challenge.duelistA)
  const { profilePic: profilePicB } = useDuelist(challenge.duelistB)

  useEffect(() => {
    if (profilePicA && profilePicB) {
      gameImpl?.switchPlayers(ProfileModels[profilePicA], ProfileModels[profilePicB])
    }
  }, [gameImpl, profilePicA, profilePicB])

  return <></>
}

export default PlayerSwitcher
