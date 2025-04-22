import { useEffect, useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { formatQueryValue, getEntityModel, useSdkStateEntitiesGet } from '@underware/pistols-sdk/dojo'
import { PistolsQueryBuilder, PistolsClauseBuilder } from '@underware/pistols-sdk/pistols'
import { parseEnumVariant, stringToFelt } from '@underware/pistols-sdk/utils/starknet'
import { constants, models } from '@underware/pistols-sdk/pistols/gen'
import { LiveChallengeStates, PastChallengeStates } from '/src/utils/pistols'


//--------------------------------
// Challenges by Season
// (ephemeral)
//

const useGetChallengesBySeasonQuery = (seasonId: BigNumberish) => {
  const query = useMemo<PistolsQueryBuilder>(() => (
    seasonId
      ? new PistolsQueryBuilder()
        .withClause(
          new PistolsClauseBuilder().where(
            "pistols-Challenge", "season_id", "Eq", formatQueryValue(seasonId),
          ).build()
        )
        .withEntityModels([
          "pistols-Challenge",
        ])
        .includeHashedKeys()
      : null
  ), [seasonId])
  const { entities } = useSdkStateEntitiesGet({ query })
  const challenges = useMemo(() => entities.map(e => getEntityModel<models.Challenge>(e, 'Challenge')), [entities])
  // useEffect(() => console.log(`useGetChallengesBySeasonQuery()`, challenges), [challenges])
  return { challenges }
}

export const useSeasonTotals = (seasonId: BigNumberish) => {
  const { challenges } = useGetChallengesBySeasonQuery(seasonId)
  const result = useMemo(() => {
    const duelIds = challenges.map((ch: models.Challenge) => BigInt(ch.duel_id))
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
    const duelistIds = Array.from(challenges.reduce((acc: Set<bigint>, ch: models.Challenge) => {
      acc.add(BigInt(ch.duelist_id_a))
      acc.add(BigInt(ch.duelist_id_b))
      return acc
    }, new Set<bigint>())).filter(id => id !== 0n)
    const accountIds = Array.from(challenges.reduce((acc: Set<bigint>, ch: models.Challenge) => {
      acc.add(BigInt(ch.address_a))
      acc.add(BigInt(ch.address_b))
      return acc
    }, new Set<bigint>())).filter(id => id !== 0n)

    return {
      duelIds,
      liveDuelsCount,
      pastDuelsCount,
      duelistsCount: duelistIds.length,
      accountsCount: accountIds.length,
      duelistIds,
      accountIds,
    }
  }, [challenges])

  return result
}

export const useSeasonActiveDuelistIds = (seasonId: BigNumberish) => {
  const { challenges } = useGetChallengesBySeasonQuery(seasonId)
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
