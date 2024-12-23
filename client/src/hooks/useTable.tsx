import { useEffect, useMemo } from 'react'
import { addAddressPadding, BigNumberish } from 'starknet'
import { useSdkState, getEntityMapModels } from '@underware_gg/pistols-sdk/dojo'
import { LiveChallengeStates, PastChallengeStates } from '@/utils/pistols'
import { constants, models, PistolsGetQuery } from '@underware_gg/pistols-sdk/pistols'
import { stringToFelt } from '@underware_gg/pistols-sdk/utils'


//--------------------------------
// Challenges by Table
// (ephemeral)
//

const useGetChallengesByTableQuery = (tableId: string) => {
  const query_get = useMemo<PistolsGetQuery>(() => ({
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
  const { entities } = useSdkState({ query_get })
  const challenges = useMemo(() => getEntityMapModels<models.Challenge>(entities, 'Challenge'), [entities])
  useEffect(() => console.log(`useGetChallengesByTableQuery()`, challenges), [challenges])
  return { challenges }
}

export const useTableTotals = (tableId: string) => {
  const { challenges } = useGetChallengesByTableQuery(tableId)
  const result = useMemo(() => {
    const liveDuelsCount = challenges.reduce((acc: number, ch: models.Challenge) => {
      const state = (ch.state as unknown as constants.ChallengeState) ?? constants.ChallengeState.Null
      if (LiveChallengeStates.includes(state)) acc++
      return acc
    }, 0)
    const pastDuelsCount = challenges.reduce((acc: number, ch: models.Challenge) => {
      const state = (ch.state as unknown as constants.ChallengeState) ?? constants.ChallengeState.Null
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
