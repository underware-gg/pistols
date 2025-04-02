import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { getEntityModel, useSdkStateEntitiesGet } from '@underware/pistols-sdk/dojo'
import { PistolsClauseBuilder, PistolsQueryBuilder } from '@underware/pistols-sdk/pistols'
import { formatQueryValue } from '@underware/pistols-sdk/dojo'
import { isPositiveBigint } from '@underware/pistols-sdk/utils'
import { useConfig } from '/src/stores/configStore'
import { models } from '@underware/pistols-sdk/pistols/gen'

export const useGetCurrentSeasonScoreboard = (duelist_id: BigNumberish) => {
  const { currentSeasonId } = useConfig()
  return useGetSeasonScoreboard(currentSeasonId, duelist_id)
}

export const useGetSeasonScoreboard = (season_id: BigNumberish, duelist_id: BigNumberish) => {
  const query = useMemo<PistolsQueryBuilder>(() => (
    new PistolsQueryBuilder()
      .withClause(
        new PistolsClauseBuilder().keys(
          ["pistols-SeasonScoreboard"],
          [formatQueryValue(season_id), formatQueryValue(duelist_id)]
        ).build()
      )
      .withEntityModels(["pistols-SeasonScoreboard"])
      .includeHashedKeys()
  ), [season_id, duelist_id])

  const enabled = useMemo(() => (isPositiveBigint(duelist_id) && isPositiveBigint(season_id)), [duelist_id, season_id])
  const { entities, isLoading } = useSdkStateEntitiesGet({
    query,
    enabled,
  })
  const scoreboard = useMemo(() => entities.map(e => getEntityModel<models.SeasonScoreboard>(e, 'SeasonScoreboard'))?.[0], [entities])
  const points = useMemo(() => Number(scoreboard?.points ?? 0), [scoreboard])
  // console.log("------------- useGetSeasonScoreboard()...", enabled, isLoading, season_id, duelist_id, points)

  return {
    isLoading,
    points,
  }
}
