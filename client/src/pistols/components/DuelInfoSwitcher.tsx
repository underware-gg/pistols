import React, { useEffect } from 'react'
import { useThreeJsContext } from '@/pistols/hooks/ThreeJsContext'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { useDuel } from '../hooks/useDuel'
import { useDuelist } from '../hooks/useDuelist'
import { ProfileModels } from '../data/assets'
import { useClientTimestamp } from '@/lib/utils/hooks/useTimestamp'

const DuelInfoSwitcher = () => {
  const { gameImpl } = useThreeJsContext()
  const { duelId } = usePistolsContext()
  const { challenge } = useDuel(duelId)
  const { clientTimestamp } = useClientTimestamp(false)

  const { profilePic: profilePicA, name: nameA } = useDuelist(challenge.duelistA)
  const { profilePic: profilePicB, name: nameB } = useDuelist(challenge.duelistB)

  useEffect(() => {
    if (profilePicA && profilePicB && nameA && nameB) {
      gameImpl?.switchPlayers(nameA, ProfileModels[profilePicA], nameB, ProfileModels[profilePicB])
    }
  }, [gameImpl, profilePicA, profilePicB, nameA, nameB])

  useEffect(() => {
    if (clientTimestamp && challenge.timestamp_start) {
      gameImpl?.setDuelTimePercentage( clientTimestamp - challenge.timestamp_start )
    }
  }, [gameImpl, challenge, clientTimestamp])

  return <></>
}

export default DuelInfoSwitcher
