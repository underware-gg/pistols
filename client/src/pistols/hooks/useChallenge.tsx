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
import { ChallengeState, Premise } from '@/games/pistols/generated/constants'
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

