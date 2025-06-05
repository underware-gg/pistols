import { useAccount } from '@starknet-react/core'
import { useFetchChallengeIdsByPlayer } from '/src/stores/challengeStore'


//------------------------------------------------------
// Add only once to a top level component
//
export function PlayerSync() {
  const { address } = useAccount()
  useFetchChallengeIdsByPlayer(address)
  return (<></>)
}
