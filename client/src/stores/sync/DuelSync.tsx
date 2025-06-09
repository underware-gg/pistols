import { useGetChallenge } from '/src/stores/challengeStore'
import { useFetchDuelistIds } from '/src/stores/duelistStore'
import { usePistolsContext, usePistolsScene } from '/src/hooks/PistolsContext'

//------------------------------------------------------
// quickly fetch a Duel data from the store
// (for when the game is loaded from a Duel screen)
//
export function DuelSync() {
  const { atDuel } = usePistolsScene()
  const { currentDuel } = usePistolsContext()
  const { duelistIdA, duelistIdB } = useGetChallenge(atDuel ? currentDuel : undefined)
  const { isLoading } = useFetchDuelistIds(atDuel ? [duelistIdA, duelistIdB] : [])
  return (<></>)
}
