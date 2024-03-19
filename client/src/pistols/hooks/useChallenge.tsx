import { useMemo } from 'react'
import { HasValue, getComponentValue, Component } from '@dojoengine/recs'
import { useDojoComponents } from '@/dojo/DojoContext'
import { useComponentValue } from "@dojoengine/react"
import { bigintToEntity } from '@/lib/utils/type'
import { feltToString } from "@/lib/utils/starknet"
import { ChallengeState, ChallengeStateDescriptions, LiveChallengeStates, PastChallengeStates } from "@/pistols/utils/pistols"
import { useEntityKeys, useEntityKeysQuery } from '@/pistols/hooks/useEntityKeys'
import { useClientTimestamp } from "@/pistols/hooks/useTimestamp"
import { useDuelist } from "@/pistols/hooks/useDuelist"
import { BigNumberish } from 'starknet'


//-----------------------------
// All Challenges
//

export const useAllChallengeIds = () => {
  const { Challenge } = useDojoComponents()
  const challengeIds: bigint[] = useEntityKeys(Challenge, 'duel_id')
  return {
    challengeIds,
  }
}

export const useChallengeIdsByState = (state: ChallengeState) => {
  const { Challenge } = useDojoComponents()
  const challengeIds: bigint[] = useEntityKeysQuery(Challenge, 'duel_id', [HasValue(Challenge, { state: state })])
  return {
    challengeIds,
  }
}

const _filterComponentsByValue = (component: Component, entityIds: bigint[], keyName: string, values: any[], include: boolean, also: Function = null): bigint[] => (
  entityIds.reduce((acc: bigint[], id: bigint) => {
    const componentValue = getComponentValue(component, bigintToEntity(id))
    if (values.includes(componentValue[keyName]) == include && (also == null || also(componentValue))) {
      acc.push(id)
    }
    return acc
  }, [] as bigint[])
)

export const useChallengeIdsByStates = (states: ChallengeState[]) => {
  const { challengeIds: allChallengeIds } = useAllChallengeIds()
  const { Challenge } = useDojoComponents()
  const challengeIds = useMemo(() => (
    _filterComponentsByValue(Challenge, allChallengeIds, 'state', states, true)
  ), [allChallengeIds])
  return {
    challengeIds,
    states,
  }
}

export const useLiveChallengeIds = () => {
  return useChallengeIdsByStates(LiveChallengeStates)
}

export const usePastChallengeIds = () => {
  return useChallengeIdsByStates(PastChallengeStates)
}



//-----------------------------
// Single Challenge
//

export const useChallenge = (duelId: BigNumberish) => {
  const { Challenge } = useDojoComponents()
  const challenge: any = useComponentValue(Challenge, bigintToEntity(duelId))
  // console.log(bigintToHex(duelId), challenge)

  const duelistA = useMemo(() => BigInt(challenge?.duelist_a ?? 0), [challenge])
  const duelistB = useMemo(() => BigInt(challenge?.duelist_b ?? 0), [challenge])
  const winner = useMemo(() => (challenge?.winner ?? 0), [challenge])
  const message = useMemo(() => feltToString(challenge?.message ?? 0n), [challenge])
  const roundNumber = useMemo(() => (challenge?.round_number ?? 0), [challenge])
  const timestamp_start = useMemo(() => (challenge?.timestamp_start ?? 0), [challenge])
  const timestamp_end = useMemo(() => (challenge?.timestamp_end ?? 0), [challenge])

  const { clientTimestamp } = useClientTimestamp(false)
  let original_state = useMemo(() => (challenge?.state ?? null), [challenge])
  let state = useMemo(() => {
    if (original_state == ChallengeState.Awaiting && (timestamp_end < clientTimestamp)) {
      return ChallengeState.Expired
    }
    return original_state
  }, [original_state])

  return {
    challengeExists: (challenge != null),
    state,
    duelistA,
    duelistB,
    challenger: duelistA,
    challenged: duelistB,
    message,
    // progress and results
    roundNumber,
    winner,
    winnerDuelist: (winner == 1 ? duelistA : winner == 2 ? duelistB : 0n),
    isLive: (state == ChallengeState.Awaiting || state == ChallengeState.InProgress),
    isAwaiting: (state == ChallengeState.Awaiting),
    isInProgress: (state == ChallengeState.InProgress),
    isFinished: (state == ChallengeState.Resolved || state == ChallengeState.Draw),
    isResolved: (state == ChallengeState.Resolved),
    isDraw: (state == ChallengeState.Draw),
    isCanceled: (state == ChallengeState.Withdrawn || state == ChallengeState.Refused),
    isExpired: (state == ChallengeState.Expired),
    needToSyncExpired: (state == ChallengeState.Expired && state != original_state),
    // times
    timestamp_start,
    timestamp_end,
  }
}

export const useChallengeDescription = (duelId: bigint) => {
  const { state, duelistA, duelistB, winnerDuelist } = useChallenge(duelId)
  const { name: nameA } = useDuelist(duelistA)
  const { name: nameB } = useDuelist(duelistB)

  const challengeDescription = useMemo(() => {
    let result = ChallengeStateDescriptions[state]
    if (winnerDuelist == duelistA) result += ' in favor of Challenger'
    if (winnerDuelist == duelistB) result += ' in favor of Challenged'
    return result.replace('Challenger', nameA).replace('Challenged', nameB)
  }, [state, winnerDuelist, duelistA, duelistB, nameA, nameB])

  return {
    challengeDescription,
  }
}



//-----------------------------
// Challenges by Duelist
//

export const useChallengeIdsByDuelist = (address: bigint) => {
  const { Challenge } = useDojoComponents()
  const challengerIds: bigint[] = useEntityKeysQuery(Challenge, 'duel_id', [HasValue(Challenge, { duelist_a: BigInt(address) })])
  const challengedIds: bigint[] = useEntityKeysQuery(Challenge, 'duel_id', [HasValue(Challenge, { duelist_b: BigInt(address) })])
  const challengeIds: bigint[] = useMemo(() => (
    [...challengerIds, ...challengedIds]
  ), [challengerIds, challengedIds])
  // console.log(address, challengeIds)
  return {
    challengeIds,
  }
}

export const useChallengesByDuelist = (address: bigint) => {
  const { Challenge } = useDojoComponents()
  const { challengeIds } = useChallengeIdsByDuelist(address)

  const challenges: any[] = useMemo(() => challengeIds.map((challengeId) => getComponentValue(Challenge, bigintToEntity(challengeId))).sort((a, b) => (a.timestamp - b.timestamp)), [challengeIds])
  // console.log(challenges)
  const stats: any = useMemo(() => {
    let result = {
      challengeCount: challenges.length,
      awaitingCount: challenges.reduce((acc, ch) => {
        if (ch.state == ChallengeState.Awaiting) acc++;
        return acc;
      }, 0),
      inProgressCount: challenges.reduce((acc, ch) => {
        if (ch.state == ChallengeState.InProgress) acc++;
        return acc;
      }, 0),
      drawCount: challenges.reduce((acc, ch) => {
        if (ch.state == ChallengeState.Draw) acc++;
        return acc;
      }, 0),
      winCount: challenges.reduce((acc, ch) => {
        let winnerDuelist = (ch.winner == 1 ? ch.duelistA : ch.winner == 2 ? ch.duelistB : 0n)
        if (ch.state == ChallengeState.Resolved && winnerDuelist == address) acc++;
        return acc;
      }, 0),
      loseCount: challenges.reduce((acc, ch) => {
        let winnerDuelist = (ch.winner == 1 ? ch.duelistA : ch.winner == 2 ? ch.duelistB : 0n)
        if (ch.state == ChallengeState.Resolved && winnerDuelist != address) acc++;
        return acc;
      }, 0),
    }
    return result
  }, [challenges])

  return {
    challengeIds,
    challenges,
    ...stats
  }
}

