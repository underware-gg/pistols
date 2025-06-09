import { useAccount } from '@starknet-react/core'
import { useFetchChallengeIdsByPlayer } from '/src/stores/challengeStore'
import { useFetchDuelistIdsByPlayer } from '/src/stores/duelistStore'
import { useFetchPacksOfPlayer } from '/src/stores/packStore'


//------------------------------------------------------
// Add only once to a top level component
//
export function PlayerSync() {
  const { address } = useAccount()
  useFetchChallengeIdsByPlayer(address)
  useFetchDuelistIdsByPlayer(address)
  useFetchPacksOfPlayer()
  return (<></>)
}
