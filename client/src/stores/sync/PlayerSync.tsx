import { useEffect } from 'react'
import { useAccount } from '@starknet-react/core'
import { useFetchChallengeIdsOwnedByAccount } from '/src/stores/challengeStore'
import { useFetchDuelistIdsOwnedByAccount } from '/src/stores/duelistStore'
import { useFetchPacksOwnedByPlayer } from '/src/stores/packStore'
import { useProgressStore } from '/src/stores/progressStore'


//------------------------------------------------------
// Add only once to a top level component
//
export function PlayerSync() {  
  const { address } = useAccount()
  const { isFinished: isFinishedChallenges } = useFetchChallengeIdsOwnedByAccount(address)
  const { isFinished: isFinishedDuelists } = useFetchDuelistIdsOwnedByAccount(address)
  const { isFinished: isFinishedPacks } = useFetchPacksOwnedByPlayer()

  // update progress
  const updateProgress = useProgressStore((state) => state.updateProgress)
  useEffect(() => {
    if (address) {
      updateProgress('player_challenges', 0, false)
      updateProgress('player_duelists', 0, false)
      // updateProgress('player_packs', 0, false) // player can have no packs!
    }
  }, [address])
  useEffect(() => {
    if (isFinishedChallenges) updateProgress('player_challenges', 1, true)
  }, [isFinishedChallenges])
  useEffect(() => {
    if (isFinishedDuelists) updateProgress('player_duelists', 1, true)
  }, [isFinishedDuelists])
  // useEffect(() => {
  //   if (isFinishedPacks) updateProgress('player_packs', 1, true)
  // }, [isFinishedPacks])
  // console.log('>>>>>> PLAYER PROGRESSS', isFinishedChallenges, isFinishedDuelists, isFinishedPacks)

  return (<></>)
}
