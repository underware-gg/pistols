import { useMemo } from 'react'
import { HasValue, getComponentValue, Component } from '@dojoengine/recs'
import { useDojoComponents } from '@/lib/dojo/DojoContext'
import { useComponentValue } from "@dojoengine/react"
import { bigintToEntity } from '@/lib/utils/types'
import { feltToString, stringToFelt } from "@/lib/utils/starknet"
import { ChallengeState, ChallengeStateDescriptions, LiveChallengeStates, PastChallengeStates } from "@/pistols/utils/pistols"
import { useEntityKeys, useEntityKeysQuery } from '@/lib/dojo/hooks/useEntityKeys'
import { useClientTimestamp } from "@/lib/utils/hooks/useTimestamp"
import { useDuelist } from "@/pistols/hooks/useDuelist"
import { BigNumberish } from 'starknet'


const _challegeSorterByTimestamp = ((a: any, b: any) => Number((a.timestamp_end && b.timestamp_end) ? (a.timestamp_end - b.timestamp_end) : (a.timestamp_start - b.timestamp_start)))

const _filterComponentsByValue = (component: Component, entityIds: bigint[], keyName: string, values: any[], include: boolean, also: Function = null): bigint[] => (
  entityIds.reduce((acc: bigint[], id: bigint) => {
    const componentValue = getComponentValue(component, bigintToEntity(id))
    if (values.includes(componentValue[keyName]) == include && (also == null || also(componentValue))) {
      acc.push(id)
    }
    return acc
  }, [] as bigint[])
)

const _filterChallengesByTable = (component: Component, entityIds: bigint[], tableId: string): bigint[] => {
  const table_id = stringToFelt(tableId)
  return entityIds.reduce((acc: bigint[], id: bigint) => {
    const componentValue = getComponentValue(component, bigintToEntity(id))
    if (componentValue.table_id == table_id) {
      acc.push(id)
    }
    return acc
  }, [] as bigint[])
}

//-----------------------------
// All Challenges
//

export const useAllChallengeIds = (tableId?: string) => {
  const { Challenge } = useDojoComponents()
  const allChallengeIds: bigint[] = useEntityKeys(Challenge, 'duel_id')
  const challengeIds = useMemo(() => (
    tableId ? _filterChallengesByTable(Challenge, allChallengeIds, tableId) : allChallengeIds
  ), [allChallengeIds, tableId])
  return {
    challengeIds,
    challengeCount: challengeIds.length,
  }
}

export const useChallengeIdsByStates = (states: ChallengeState[], tableId?: string) => {
  const { challengeIds: allChallengeIds } = useAllChallengeIds(tableId)
  const { Challenge } = useDojoComponents()
  const challengeIds = useMemo(() => (
    _filterComponentsByValue(Challenge, allChallengeIds, 'state', states, true)
  ), [allChallengeIds])
  return {
    challengeIds,
    states,
  }
}

export const useLiveChallengeIds = (tableId?: string) => {
  return useChallengeIdsByStates(LiveChallengeStates, tableId)
}

export const usePastChallengeIds = (tableId?: string) => {
  return useChallengeIdsByStates(PastChallengeStates, tableId)
}

export const useActiveDuelists = (tableId?: string) => {
  const { challengeIds: allChallengeIds } = useAllChallengeIds(tableId)
  const { Challenge } = useDojoComponents()
  const activeDuelists = useMemo(() => (
    allChallengeIds.reduce((acc: bigint[], id: bigint) => {
      const componentValue = getComponentValue(Challenge, bigintToEntity(id))
      if (!acc.includes(componentValue.duelist_a)) acc.push(componentValue.duelist_a)
      if (!acc.includes(componentValue.duelist_b)) acc.push(componentValue.duelist_b)
      return acc
    }, [] as bigint[])
  ), [allChallengeIds])
  return {
    activeDuelists,
    activeDuelistsCount: activeDuelists.length,
  }
}


//-----------------------------
// Single Challenge
//

export const useChallenge = (duelId: BigNumberish) => {
  const { Challenge } = useDojoComponents()
  const challenge: any = useComponentValue(Challenge, bigintToEntity(duelId))
  // console.log(bigintToHex(duelId), challenge)

  const tableId = useMemo(() => feltToString(challenge?.table_id ?? 0n), [challenge])
  const duelistA = useMemo(() => BigInt(challenge?.duelist_a ?? 0), [challenge])
  const duelistB = useMemo(() => BigInt(challenge?.duelist_b ?? 0), [challenge])
  const winner = useMemo(() => (challenge?.winner ?? 0), [challenge])
  const message = useMemo(() => feltToString(challenge?.message ?? 0n), [challenge])
  const roundNumber = useMemo(() => (challenge?.round_number ?? 0), [challenge])
  const timestamp_start = useMemo(() => Number(challenge?.timestamp_start ?? 0), [challenge])
  const timestamp_end = useMemo(() => Number(challenge?.timestamp_end ?? 0), [challenge])

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
    duelId,
    tableId,
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

export const useChallengeIdsByDuelist = (address: bigint, tableId?: string) => {
  const { Challenge } = useDojoComponents()
  const challengerIds: bigint[] = useEntityKeysQuery(Challenge, 'duel_id', [HasValue(Challenge, { duelist_a: BigInt(address ?? 0n) })])
  const challengedIds: bigint[] = useEntityKeysQuery(Challenge, 'duel_id', [HasValue(Challenge, { duelist_b: BigInt(address ?? 0n) })])
  const allChallengeIds: bigint[] = useMemo(() => ([...challengerIds, ...challengedIds]), [challengerIds, challengedIds])
  const challengeIds = useMemo(() => (
    tableId ? _filterChallengesByTable(Challenge, allChallengeIds, tableId) : allChallengeIds
  ), [allChallengeIds, tableId])
  return {
    challengeIds,
    challengerIds,
    challengedIds,
  }
}

export const useChallengesByDuelist = (address: bigint, tableId?: string) => {
  const { Challenge } = useDojoComponents()
  const { challengeIds } = useChallengeIdsByDuelist(address, tableId)
  const raw_challenges: any[] = useMemo(() => (
    challengeIds.map((challengeId) => getComponentValue(Challenge, bigintToEntity(challengeId)))
      .sort(_challegeSorterByTimestamp)
  ), [challengeIds])
  return {
    raw_challenges,
    challengeIds,
  }
}

export const useChallengesByDuelistTotals = (address: bigint, tableId?: string) => {
  const { raw_challenges, challengeIds } = useChallengesByDuelist(address, tableId)
  // console.log(challenges)
  const counts: any = useMemo(() => {
    let result = {
      challengeCount: raw_challenges.length,
      awaitingCount: 0,
      inProgressCount: 0,
      drawCount: 0,
      winCount: 0,
      loseCount: 0,
      liveDuelsCount: 0,
    }
    raw_challenges.forEach(ch => {
      if (ch.state == ChallengeState.Awaiting) result.awaitingCount++;
      if (ch.state == ChallengeState.InProgress) result.inProgressCount++;
      if (ch.state == ChallengeState.Draw) result.drawCount++;
      if (ch.state == ChallengeState.Resolved) {
        let winnerDuelist = (ch.winner == 1 ? ch.duelistA : ch.winner == 2 ? ch.duelistB : 0n)
        if (winnerDuelist == address) result.winCount++;
        if (winnerDuelist != address) result.loseCount++;
      }
    })
    result.liveDuelsCount = (result.awaitingCount + result.inProgressCount)
    return result
  }, [raw_challenges])

  return {
    raw_challenges,
    challengeIds,
    ...counts
  }
}

