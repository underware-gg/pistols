import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { HasValue, getComponentValue, Component } from '@dojoengine/recs'
import { useDojoComponents } from '@/lib/dojo/DojoContext'
import { useComponentValue } from "@dojoengine/react"
import { useEntityKeys, useEntityKeysQuery } from '@/lib/dojo/hooks/useEntityKeys'
import { useClientTimestamp } from "@/lib/utils/hooks/useTimestamp"
import { useDuelist } from "@/pistols/hooks/useDuelist"
import { bigintToEntity } from '@/lib/utils/types'
import { feltToString, stringToFelt } from "@/lib/utils/starknet"
import { ChallengeState, getChallengeState } from '@/games/pistols/generated/constants'
import { ChallengeStateDescriptions } from "@/pistols/utils/pistols"


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

export const useActiveDuelistIds = (tableId?: string) => {
  const { challengeIds: allChallengeIds } = useAllChallengeIds(tableId)
  const { Challenge } = useDojoComponents()
  const activeDuelistIds = useMemo(() => (
    allChallengeIds.reduce((acc: bigint[], id: bigint) => {
      const componentValue = getComponentValue(Challenge, bigintToEntity(id))
      if (!acc.includes(componentValue.duelist_id_a)) acc.push(componentValue.duelist_id_a)
      if (!acc.includes(componentValue.duelist_id_b)) acc.push(componentValue.duelist_id_b)
      return acc
    }, [] as bigint[])
  ), [allChallengeIds])
  return {
    activeDuelistIds,
    activeDuelistIdsCount: activeDuelistIds.length,
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
  const duelistAddressA = useMemo(() => BigInt(challenge?.address_a ?? 0), [challenge])
  const duelistAddressB = useMemo(() => BigInt(challenge?.address_b ?? 0), [challenge])
  const duelistIdA = useMemo(() => BigInt(challenge?.duelist_id_a ?? 0), [challenge])
  const duelistIdB = useMemo(() => BigInt(challenge?.duelist_id_b ?? 0), [challenge])
  const winner = useMemo(() => (challenge?.winner ?? 0), [challenge])
  const quote = useMemo(() => feltToString(challenge?.quote ?? 0n), [challenge])
  const roundNumber = useMemo(() => (challenge?.round_number ?? 0), [challenge])
  const timestamp_start = useMemo(() => Number(challenge?.timestamp_start ?? 0), [challenge])
  const timestamp_end = useMemo(() => Number(challenge?.timestamp_end ?? 0), [challenge])

  const { clientTimestamp } = useClientTimestamp(false)
  let original_state = useMemo(() => (challenge ? getChallengeState(challenge.state) : null), [challenge])
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
    duelistAddressA,
    duelistAddressB,
    duelistIdA,
    duelistIdB,
    challengerId: duelistIdA,
    challengedId: duelistIdB,
    quote,
    // progress and results
    roundNumber,
    winner,
    winnerDuelistId: (winner == 1 ? duelistIdA : winner == 2 ? duelistIdB : 0n),
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



//-----------------------------
// Challenges by Duelist Owner
//

const invalidId = 9999999999999n

export const useChallengeIdsByOwner = (address: BigNumberish, tableId?: string) => {
  const { Challenge } = useDojoComponents()
  const challengerIds: bigint[] = useEntityKeysQuery(Challenge, 'duel_id', [HasValue(Challenge, { address_a: BigInt(address ?? invalidId) })])
  const challengedIds: bigint[] = useEntityKeysQuery(Challenge, 'duel_id', [HasValue(Challenge, { address_b: BigInt(address ?? invalidId) })])
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

export const useChallengesByOwner = (address: BigNumberish, tableId?: string) => {
  const { Challenge } = useDojoComponents()
  const { challengeIds } = useChallengeIdsByOwner(address, tableId)
  const raw_challenges: any[] = useMemo(() => (
    challengeIds.map((challengeId) => getComponentValue(Challenge, bigintToEntity(challengeId)))
      .sort(_challegeSorterByTimestamp)
  ), [challengeIds])
  return {
    raw_challenges,
    challengeIds,
  }
}

