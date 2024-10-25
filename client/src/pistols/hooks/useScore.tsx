import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { ComponentValue } from '@dojoengine/recs'
import { useComponentValue } from '@dojoengine/react'
import { useDojoComponents } from '@/lib/dojo/DojoContext'
import { stringToFelt, weiToEth, weiToEthString } from '@/lib/utils/starknet'
import { keysToEntity } from '@/lib/utils/types'
import { EMOJI } from '@/pistols/data/messages'
import { ArchetypeNames } from '@/pistols/utils/pistols'
import { Archetype, HONOUR } from '@/games/pistols/generated/constants'

// hijack Score type from Scoreboard
function _useScoreType() {
  const { Scoreboard } = useDojoComponents()
  return {} as ComponentValue<typeof Scoreboard.schema.score>
}
export type Score = ReturnType<typeof _useScoreType>

export const calcWinRatio = (total_duels: number, total_wins: number) => (total_duels > 0 ? (total_wins / total_duels) : null)

export function useScore(score: Score | undefined) {
  const total_duels = useMemo(() => (score?.total_duels ?? 0), [score])
  const total_wins = useMemo(() => (score?.total_wins ?? 0), [score])
  const total_losses = useMemo(() => (score?.total_losses ?? 0), [score])
  const total_draws = useMemo(() => (score?.total_draws ?? 0), [score])
  const honour = useMemo(() => ((score?.honour ?? 0) / 10.0), [score, total_duels])
  const honourDisplay = useMemo(() => (total_duels > 0 && honour > 0 ? honour.toFixed(1) : EMOJI.ZERO), [honour, total_duels])
  const honourAndTotal = useMemo(() => (total_duels > 0 && honour > 0 ? <>{honour.toFixed(1)}<span className='Smaller'>/{total_duels}</span></> : EMOJI.ZERO), [honour, total_duels])
  const winRatio = useMemo(() => calcWinRatio(total_duels, total_wins), [total_duels, total_wins])

  const isVillainous = useMemo(() => (total_duels > 0 && (honour * 10) < HONOUR.TRICKSTER_START), [honour, total_duels])
  const isTrickster = useMemo(() => ((honour * 10) >= HONOUR.TRICKSTER_START && (honour * 10) < HONOUR.LORD_START), [honour])
  const isHonourable = useMemo(() => ((honour * 10) >= HONOUR.LORD_START), [honour])
  const archetype = useMemo(() => (
    isHonourable ? Archetype.Honourable
      : isTrickster ? Archetype.Trickster
        : isVillainous ? Archetype.Villainous
          : Archetype.Undefined), [isVillainous, isTrickster, isHonourable])
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

export const useScoreboard = (tableId: string, duelistId: BigNumberish) => {
  const { Scoreboard } = useDojoComponents()
  const entityId = useMemo(() => keysToEntity([stringToFelt(tableId ?? ''), duelistId]), [tableId, duelistId])
  const scoreboard = useComponentValue(Scoreboard, entityId)

  const score = useScore(scoreboard?.score)

  return {
    score,
  }
}
