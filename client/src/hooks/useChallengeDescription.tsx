import { useMemo } from 'react'
import { useDuelist } from '/src/stores/duelistStore'
import { useChallenge } from '/src/stores/challengeStore'
import { ChallengeStateDescriptions } from '/src/utils/pistols'

export const useChallengeDescription = (duelId: bigint) => {
  const { state, duelistIdA, duelistIdB, winnerDuelistId } = useChallenge(duelId)
  const { name: nameA } = useDuelist(duelistIdA)
  const { name: nameB } = useDuelist(duelistIdB)

  const challengeDescription = useMemo(() => {
    if (!state) return null
    let result = ChallengeStateDescriptions[state]
    if (winnerDuelistId > 0 && winnerDuelistId == duelistIdA) result += ' in favor of Challenger'
    if (winnerDuelistId > 0 && winnerDuelistId == duelistIdB) result += ' in favor of Challenged'
    return result.replace('Challenger', nameA ?? 'Duelist').replace('Challenged', nameB ?? 'Duelist')
  }, [state, winnerDuelistId, duelistIdA, duelistIdB, nameA, nameB])

  return {
    challengeDescription,
  }
}
