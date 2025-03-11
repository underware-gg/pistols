import { useEffect, useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { getEntityMapModels, formatQueryValue, useSdkStateEntitiesGet } from '@underware/pistols-sdk/dojo'
import { PistolsQueryBuilder, PistolsClauseBuilder } from '@underware/pistols-sdk/pistols'
import { constants, models } from '@underware/pistols-sdk/pistols/gen'
import { parseEnumVariant, stringToFelt } from '@underware/pistols-sdk/utils'
import { LiveChallengeStates, PastChallengeStates } from '/src/utils/pistols'


//--------------------------------
// Challenges by Table
// (ephemeral)
//

const useGetChallengesByTableQuery = (tableId: string) => {
  // const query_get = useMemo<PistolsQueryBuilder>(() => ({
  //   pistols: {
  //     Challenge: {
  //       $: {
  //         where: {
  //           table_id: { $eq: formatQueryValue(stringToFelt(tableId)) },
  //         },
  //       },
  //     },
  //   },
  // }), [tableId])
  const query = useMemo<PistolsQueryBuilder>(() => (
    tableId
      ? new PistolsQueryBuilder()
        .withClause(
          new PistolsClauseBuilder().keys(
            ["pistols-Challenge"],
            [formatQueryValue(stringToFelt(tableId))]
          ).build()
        )
        .withEntityModels(
          ["pistols-Challenge"]
        )
        .includeHashedKeys()
      : null
  ), [tableId])
  const { entities } = useSdkStateEntitiesGet({ query })
  const challenges = useMemo(() => getEntityMapModels<models.Challenge>(entities, 'Challenge'), [entities])
  useEffect(() => console.log(`useGetChallengesByTableQuery()`, challenges), [challenges])
  return { challenges }
}

export const useTableTotals = (tableId: string) => {
  const { challenges } = useGetChallengesByTableQuery(tableId)
  const result = useMemo(() => {
    const liveDuelsCount = challenges.reduce((acc: number, ch: models.Challenge) => {
      const state = parseEnumVariant<constants.ChallengeState>(ch.state) ?? constants.ChallengeState.Null
      if (LiveChallengeStates.includes(state)) acc++
      return acc
    }, 0)
    const pastDuelsCount = challenges.reduce((acc: number, ch: models.Challenge) => {
      const state = parseEnumVariant<constants.ChallengeState>(ch.state) ?? constants.ChallengeState.Null
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
