import { useMemo } from 'react'
import { ComponentValue } from '@dojoengine/recs'
import { useComponentValue } from '@dojoengine/react'
import { useDojoComponents } from '@/lib/dojo/DojoContext'
import { stringToFelt, weiToEth, weiToEthString } from '@/lib/utils/starknet'
import { keysToEntity } from '@/lib/utils/types'
import { Archetype, ArchetypeNames } from '@/pistols/utils/pistols'
import { BigNumberish } from 'starknet'

// hijack Score type from Scoreboard
function _useScoreType() {
  const { Scoreboard } = useDojoComponents()
  return {} as ComponentValue<typeof Scoreboard.schema.score>
}
export type Score = ReturnType<typeof _useScoreType>

export function useScore(score: Score | undefined) {
  const total_duels = useMemo(() => (score?.total_duels ?? 0), [score])
  const total_wins = useMemo(() => (score?.total_wins ?? 0), [score])
  const total_losses = useMemo(() => (score?.total_losses ?? 0), [score])
  const total_draws = useMemo(() => (score?.total_draws ?? 0), [score])
  const total_honour = useMemo(() => (score?.total_honour ?? 0), [score])
  const honour = useMemo(() => ((score?.honour ?? 0) / 10.0), [score, total_duels])
  const honourDisplay = useMemo(() => (total_duels > 0 && honour > 0 ? honour.toFixed(1) : '—'), [honour, total_duels])
  const honourAndTotal = useMemo(() => (total_duels > 0 && honour > 0 ? <>{honour.toFixed(1)}<span className='Smaller'>/{total_duels}</span></> : '—'), [honour, total_duels])
  const winRatio = useMemo(() => (total_duels > 0 ? (total_wins / total_duels) : null), [total_wins, total_duels])

  const level_villain = useMemo(() => ((score?.level_villain ?? 0) / 10.0), [score, total_duels])
  const level_trickster = useMemo(() => ((score?.level_trickster ?? 0) / 10.0), [score, total_duels])
  const level_lord = useMemo(() => ((score?.level_lord ?? 0) / 10.0), [score, total_duels])
  const level = useMemo(() => Math.max(level_villain, level_trickster, level_lord), [level_villain, level_trickster, level_lord])
  const levelDisplay = useMemo(() => (total_duels > 0 && level > 0 ? level.toFixed(1) : '—'), [level, total_duels])
  const levelAndTotal = useMemo(() => (total_duels > 0 && level > 0 ? <>{level.toFixed(1)}<span className='Smaller'>/{total_duels}</span></> : '—'), [level, total_duels])

  const isVillainous = useMemo(() => (level_villain > 0), [level_villain])
  const isTrickster = useMemo(() => (level_trickster > 0), [level_trickster])
  const isHonourable = useMemo(() => (level_lord > 0), [level_lord])
  const archetype = useMemo(() => (isVillainous ? Archetype.Villainous : isTrickster ? Archetype.Trickster : isHonourable ? Archetype.Honourable : Archetype.Undefined), [level_villain, level_trickster, level_lord])
  const archetypeName = useMemo(() => (ArchetypeNames[archetype]), [archetype])

  return {
    total_duels,
    total_wins,
    total_losses,
    total_draws,
    total_honour,
    level_villain,
    level_trickster,
    level_lord,
    level,
    levelDisplay,
    levelAndTotal,
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
  const scoreboard = useComponentValue(Scoreboard, keysToEntity([stringToFelt(tableId ?? ''), duelistId]))

  const score = useScore(scoreboard?.score)

  const wagerWonWei = useMemo(() => BigInt(scoreboard?.wager_won ?? 0n), [scoreboard])
  const wagerLostWei = useMemo(() => BigInt(scoreboard?.wager_lost ?? 0n), [scoreboard])
  const wagerBalanceWei = useMemo(() => (wagerWonWei - wagerLostWei), [wagerWonWei, wagerLostWei])
  const wagerWon = useMemo(() => weiToEth(wagerWonWei), [wagerWonWei])
  const wagerLost = useMemo(() => weiToEth(wagerLostWei), [wagerLostWei])
  const wagerBalance = useMemo(() => weiToEth(wagerBalanceWei), [wagerBalanceWei])
  const balance = useMemo(() => Number(wagerBalance), [wagerBalance])
  const balanceFormatted = useMemo(() => weiToEthString(wagerBalanceWei), [wagerBalanceWei])

  return {
    score,
    wagerWonWei,
    wagerLostWei,
    wagerBalanceWei,
    wagerWon,
    wagerLost,
    wagerBalance,
    balance,
    balanceFormatted,
  }
}
