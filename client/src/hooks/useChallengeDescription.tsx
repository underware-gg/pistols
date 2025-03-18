import { useMemo } from 'react'
import { useDuelist } from '/src/stores/duelistStore'
import { useGetChallenge } from '/src/stores/challengeStore'
import { ChallengeStateDescriptions } from '/src/utils/pistols'
import { useOwnerOfDuelist } from './useTokenDuelists'
import { usePlayer } from '../stores/playerStore'

export const useChallengeDescription = (duelId: bigint) => {
  const { state, duelistIdA, duelistIdB, winnerDuelistId, isTutorial } = useGetChallenge(duelId)
  const { name: nameDuelistA } = useDuelist(duelistIdA)
  const { name: nameDuelistB } = useDuelist(duelistIdB)
  const { owner: ownerA } = useOwnerOfDuelist(duelistIdA)
  const { owner: ownerB } = useOwnerOfDuelist(duelistIdB)
  const { name: nameA } = usePlayer(ownerA)
  const { name: nameB } = usePlayer(ownerB)

  const challengeDescription = useMemo(() => {
    if (!state) return null
    let result = ChallengeStateDescriptions[state]
    if (winnerDuelistId > 0 && winnerDuelistId == duelistIdA) result += ' in favor of Challenger'
    if (winnerDuelistId > 0 && winnerDuelistId == duelistIdB) result += ' in favor of Challenged'
    return result.replace('Challenger', isTutorial ? nameDuelistA ?? 'Duelist' : nameA ?? 'Duelist')
                .replace('Challenged', isTutorial ? nameDuelistB ?? 'Duelist' : nameB ?? 'Duelist')
  }, [state, winnerDuelistId, duelistIdA, duelistIdB, nameA, nameB, isTutorial])

  return {
    challengeDescription,
  }
}
