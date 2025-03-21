import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { useTableId } from '/src/stores/configStore'
import { getEntityMapModels, useSdkStateEntitiesGet } from '@underware/pistols-sdk/dojo'
import { PistolsClauseBuilder, PistolsQueryBuilder } from '@underware/pistols-sdk/pistols'
import { isPositiveBigint } from '@underware/pistols-sdk/utils'
import { stringToFelt } from '@underware/pistols-sdk/utils/starknet'
import { formatQueryValue } from '@underware/pistols-sdk/dojo'
import { constants, models } from '@underware/pistols-sdk/pistols/gen'
import { ArchetypeNames } from '/src/utils/pistols'
import { EMOJI } from '/src/data/messages'

export const calcWinRatio = (total_duels: number, total_wins: number) => (total_duels > 0 ? (total_wins / total_duels) : null)

export function useScore(score: models.Score | undefined) {
  const total_duels = useMemo(() => Number(score?.total_duels ?? 0), [score])
  const total_wins = useMemo(() => Number(score?.total_wins ?? 0), [score])
  const total_losses = useMemo(() => Number(score?.total_losses ?? 0), [score])
  const total_draws = useMemo(() => Number(score?.total_draws ?? 0), [score])
  const honour = useMemo(() => (Number(score?.honour ?? 0) / 10.0), [score, total_duels])
  const honourDisplay = useMemo(() => (total_duels > 0 && honour > 0 ? honour.toFixed(1) : EMOJI.ZERO), [honour, total_duels])
  const honourAndTotal = useMemo(() => (total_duels > 0 && honour > 0 ? <>{honour.toFixed(1)}<span className='Smaller'>/{total_duels}</span></> : EMOJI.ZERO), [honour, total_duels])
  const winRatio = useMemo(() => calcWinRatio(total_duels, total_wins), [total_duels, total_wins])

  const isVillainous = useMemo(() => (total_duels > 0 && (honour * 10) < constants.HONOUR.TRICKSTER_START), [honour, total_duels])
  const isTrickster = useMemo(() => ((honour * 10) >= constants.HONOUR.TRICKSTER_START && (honour * 10) < constants.HONOUR.LORD_START), [honour])
  const isHonourable = useMemo(() => ((honour * 10) >= constants.HONOUR.LORD_START), [honour])
  const archetype = useMemo(() => (
    isHonourable ? constants.Archetype.Honourable
      : isTrickster ? constants.Archetype.Trickster
        : isVillainous ? constants.Archetype.Villainous
          : constants.Archetype.Undefined), [isVillainous, isTrickster, isHonourable])
  const archetypeName = useMemo(() => (ArchetypeNames[archetype]), [archetype])

  return {
    total_duels,
    total_wins,
    total_losses,
    total_draws,
    isVillainous,
    isTrickster,
    isHonourable,
    archetype,
    archetypeName,
    honour,
    honourDisplay,
    honourAndTotal,
    winRatio,
  }
}


export const useGetSeasonScoreboard = (duelist_id: BigNumberish) => {
  const { tableId } = useTableId()
  return useGetScoreboard(tableId, duelist_id)
}

export const useGetScoreboard = (table_id: string, duelist_id: BigNumberish) => {
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
  const scoreboard = useMemo(() => getEntityMapModels<models.Scoreboard>(entities, 'Scoreboard')?.[0], [entities])
  const score = useScore(scoreboard?.score)

  if (enabled) console.warn("useGetScoreboard()...", table_id, duelist_id)

    return {
    ...score,
    isLoading,
  }
}
