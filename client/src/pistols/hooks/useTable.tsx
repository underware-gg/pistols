import { useEffect, useMemo } from 'react'
import { addAddressPadding, BigNumberish } from 'starknet'
import { PistolsGetQuery, useSdkGet, filterEntitiesByModel } from '@/lib/dojo/hooks/useSdkGet'
import { LiveChallengeStates, PastChallengeStates } from '@/pistols/utils/pistols'
import { ChallengeState } from '@/games/pistols/generated/constants'
import { stringToFelt } from '@/lib/utils/starknet'
import * as models from '@/games/pistols/generated/typescript/models.gen'


//--------------------------------
// Challenges by Table
// (ephemeral)
//

const useGetChallengesByTableQuery = (tableId: string) => {
  const query = useMemo<PistolsGetQuery>(() => ({
    pistols: {
      Challenge: {
        $: {
          where: {
            table_id: { $eq: addAddressPadding(stringToFelt(tableId)) },
          },
        },
      },
    },
  }), [tableId])
  const { entities, isLoading, refetch } = useSdkGet({ query })
  const challenges = useMemo(() => filterEntitiesByModel<models.Challenge>(entities, 'Challenge'), [entities])
  useEffect(() => console.log(`useGetChallengesByTableQuery()`, challenges), [challenges])
  return { challenges, isLoading, refetch }
}

export const useTableTotals = (tableId: string) => {
  const { challenges } = useGetChallengesByTableQuery(tableId)
  const result = useMemo(() => {
    const liveDuelsCount = challenges.reduce((acc: number, ch: models.Challenge) => {
      const state = (ch.state as unknown as ChallengeState) ?? ChallengeState.Null
      if (LiveChallengeStates.includes(state)) acc++
      return acc
    }, 0)
    const pastDuelsCount = challenges.reduce((acc: number, ch: models.Challenge) => {
      const state = (ch.state as unknown as ChallengeState) ?? ChallengeState.Null
      if (PastChallengeStates.includes(state)) acc++
      return acc
    }, 0)

    return {
      liveDuelsCount,
      pastDuelsCount
    }
  }, [challenges])

  return {
    ...result
  }
}

export const useTableActiveDuelistIds = (tableId: string) => {
  const { challenges } = useGetChallengesByTableQuery(tableId)
  const activeDuelistIds = useMemo(() => (
    Array.from(challenges.reduce((acc: Set<BigNumberish>, ch: models.Challenge) => {
      acc.add(ch.duelist_id_a)
      acc.add(ch.duelist_id_b)
      return acc
    }, new Set<BigNumberish>()))
  ), [challenges])
  return {
    activeDuelistIds
  }
}
