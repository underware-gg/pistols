import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { getEntityModel, useSdkStateEntitiesGet } from '@underware/pistols-sdk/dojo'
import { PistolsClauseBuilder, PistolsQueryBuilder } from '@underware/pistols-sdk/pistols'
import { stringToFelt } from '@underware/pistols-sdk/utils/starknet'
import { formatQueryValue } from '@underware/pistols-sdk/dojo'
import { isPositiveBigint } from '@underware/pistols-sdk/utils'
import { useTableId } from '/src/stores/configStore'
import { models } from '@underware/pistols-sdk/pistols/gen'

export const useGetSeasonScoreboard = (duelist_id: BigNumberish) => {
  const { tableId } = useTableId()
  return useGetTableScoreboard(tableId, duelist_id)
}

export const useGetTableScoreboard = (table_id: string, duelist_id: BigNumberish) => {
  const query = useMemo<PistolsQueryBuilder>(() => (
    new PistolsQueryBuilder()
      .withClause(
        new PistolsClauseBuilder().keys(
          ["pistols-TableScoreboard"],
          [formatQueryValue(stringToFelt(table_id)), formatQueryValue(duelist_id)]
        ).build()
      )
      .withEntityModels(["pistols-TableScoreboard"])
      .includeHashedKeys()
  ), [table_id, duelist_id])

  const enabled = useMemo(() => (isPositiveBigint(duelist_id) && Boolean(table_id)), [duelist_id, table_id])
  const { entities, isLoading } = useSdkStateEntitiesGet({
    query,
    enabled,
  })
  const scoreboard = useMemo(() => entities.map(e => getEntityModel<models.TableScoreboard>(e, 'TableScoreboard'))?.[0], [entities])
  const points = useMemo(() => Number(scoreboard?.points ?? 0), [scoreboard])
  // console.log("------------- useGetTableScoreboard()...", enabled, isLoading, table_id, duelist_id, points)

  return {
    isLoading,
    points,
  }
}
