import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { formatQueryValue, getEntityModel, useSdkStateEntitiesGet } from '@underware/pistols-sdk/dojo'
import { PistolsQueryBuilder, PistolsClauseBuilder } from '@underware/pistols-sdk/pistols'
import { parseEnumVariant, stringToFelt } from '@underware/pistols-sdk/utils/starknet'
import { constants, models } from '@underware/pistols-sdk/pistols/gen'
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
          new PistolsClauseBuilder().where(
            "pistols-Challenge", "table_id", "Eq", formatQueryValue(stringToFelt(tableId)),
          ).build()
        )
        .withEntityModels(
          ["pistols-Challenge"]
        )
        .includeHashedKeys()
      : null
  ), [tableId])
  const { entities } = useSdkStateEntitiesGet({ query })
  const challenges = useMemo(() => entities.map(e => getEntityModel<models.Challenge>(e, 'Challenge')), [entities])
  // useEffect(() => console.log(`useGetChallengesByTableQuery()`, challenges), [challenges])
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
    const duelistsCount = challenges.reduce((acc: Set<bigint>, ch: models.Challenge) => {
      acc.add(BigInt(ch.duelist_id_a))
      acc.add(BigInt(ch.duelist_id_b))
      return acc
    }, new Set<bigint>())
    const accountsCount = challenges.reduce((acc: Set<bigint>, ch: models.Challenge) => {
      acc.add(BigInt(ch.address_a))
      acc.add(BigInt(ch.address_b))
      return acc
    }, new Set<bigint>())

    return {
      liveDuelsCount,
      pastDuelsCount,
      duelistsCount: duelistsCount.size,
      accountsCount: accountsCount.size
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
