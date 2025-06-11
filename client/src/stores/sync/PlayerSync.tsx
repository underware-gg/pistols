import { useEffect } from 'react'
import { useAccount } from '@starknet-react/core'
import { useFetchChallengeIdsByPlayer } from '/src/stores/challengeStore'
import { useFetchDuelistIdsByPlayer } from '/src/stores/duelistStore'
import { useFetchPacksOfPlayer } from '/src/stores/packStore'
import { useProgressStore } from '../progressStore'


//------------------------------------------------------
// Add only once to a top level component
//
export function PlayerSync() {  
  const { address } = useAccount()
  const { isFinished: isFinishedChallenges } = useFetchChallengeIdsByPlayer(address)
  const { isFinished: isFinishedDuelists } = useFetchDuelistIdsByPlayer(address)
  const { isFinished: isFinishedPacks } = useFetchPacksOfPlayer()

  // update progress
  const updateProgress = useProgressStore((state) => state.updateProgress)
  useEffect(() => {
    if (address) {
      updateProgress('player_challenges', 0, false)
      updateProgress('player_duelists', 0, false)
      updateProgress('player_packs', 0, false)
    }
  }, [address])
  useEffect(() => {
    if (isFinishedChallenges) updateProgress('player_challenges', 1, true)
  }, [isFinishedChallenges])
  useEffect(() => {
    if (isFinishedDuelists) updateProgress('player_duelists', 1, true)
  }, [isFinishedDuelists])
  useEffect(() => {
    if (isFinishedPacks) updateProgress('player_packs', 1, true)
  }, [isFinishedPacks])
  // console.log('>>>>>>PROGRESSS', isFinishedChallenges, isFinishedDuelists, isFinishedPacks)

  return (<></>)
}
