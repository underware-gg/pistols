import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { getEntityMapModels, useSdkStateEntitiesGet } from '@underware/pistols-sdk/dojo'
import { PistolsClauseBuilder, PistolsQueryBuilder } from '@underware/pistols-sdk/pistols'
import { isPositiveBigint } from '@underware/pistols-sdk/utils'
import { stringToFelt } from '@underware/pistols-sdk/utils/starknet'
import { formatQueryValue } from '@underware/pistols-sdk/dojo'
import { models } from '@underware/pistols-sdk/pistols/gen'
import { useTableId } from '/src/stores/configStore'

export const useGetSeasonScoreboard = (duelist_id: BigNumberish) => {
  const { tableId } = useTableId()
  return useGetTableScoreboard(tableId, duelist_id)
}

export const useGetTableScoreboard = (table_id: string, duelist_id: BigNumberish) => {
  const query = useMemo<PistolsQueryBuilder>(() => (
    new PistolsQueryBuilder()
      .withClause(
        new PistolsClauseBuilder().keys(
          ["pistols-Scoreboard"],
          [formatQueryValue(duelist_id), formatQueryValue(stringToFelt(table_id))]
        ).build()
      )
      .withEntityModels(["pistols-Scoreboard"])
      .includeHashedKeys()
  ), [table_id, duelist_id])

  const enabled = useMemo(() => (isPositiveBigint(duelist_id) && Boolean(table_id)), [duelist_id, table_id])
  const { entities, isLoading } = useSdkStateEntitiesGet({
    query,
    enabled,
  })
  const scoreboard = useMemo(() => getEntityMapModels<models.TableScoreboard>(entities, 'TableScoreboard')?.[0], [entities])
  const points = useMemo(() => (scoreboard?.points), [scoreboard])

  if (enabled) console.warn("------------- useGetTableScoreboard()...", table_id, duelist_id)

  return {
    isLoading,
    points,
  }
}
