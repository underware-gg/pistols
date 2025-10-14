import { useMemo } from 'react'
import { useDuelist } from '/src/stores/duelistStore'
import { useGetChallenge, useRound } from '/src/stores/challengeStore'
import { ChallengeStateDescriptions } from '/src/utils/pistols'
import { useOwnerOfDuelist } from './useTokenDuelists'
import { usePlayer } from '/src/stores/playerStore'

export const useChallengeDescription = (duelId: bigint) => {
  const { state, duelistIdA, duelistIdB, duelistAddressA, duelistAddressB, winner, winnerDuelistId, isTutorial, isAwaiting, isMatchmaking } = useGetChallenge(duelId)
  const { endedInAbandon } = useRound(duelId)
  const { name: nameDuelistA } = useDuelist(duelistIdA)
  const { name: nameDuelistB } = useDuelist(duelistIdB)
  const { name: nameA } = usePlayer(duelistAddressA)
  const { name: nameB } = usePlayer(duelistAddressB)

  const challengeDescription = useMemo(() => {
    if (!state) return null
    let result = '';
    if (endedInAbandon && winner != 0) {
      result = `Abandoned by ${winner == 1 ? nameB : nameA}`
    } else if (isAwaiting && isMatchmaking) {
      result = 'Waiting to be matched...'
    } else {
      result = ChallengeStateDescriptions[state]
      if (winnerDuelistId > 0 && winnerDuelistId == duelistIdA) result += ' in favor of Challenger'
      if (winnerDuelistId > 0 && winnerDuelistId == duelistIdB) result += ' in favor of Challenged'
    }
    return result.replace('Challenger', isTutorial ? nameDuelistA ?? 'Duelist' : nameA ?? 'Duelist')
                .replace('Challenged', isTutorial ? nameDuelistB ?? 'Duelist' : nameB ?? 'Duelist')
  }, [state, winnerDuelistId, duelistIdA, duelistIdB, nameA, nameB, isTutorial])

  return {
    challengeDescription,
  }
}
