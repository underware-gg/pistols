import { useMemo } from 'react'
import { useComponentValue } from '@dojoengine/react'
import { useDojoComponents } from '@/lib/dojo/DojoContext'
import { keysToEntity } from '@/lib/utils/types'
import { stringToFelt, weiToEth, weiToEthString } from '@/lib/utils/starknet'
import { BigNumberish } from 'starknet'

export const useScore = (score: any) => {
  return {
    score,
  }
}

export const useScoreboard = (tableId: string, duelistId: BigNumberish) => {
  const { Scoreboard } = useDojoComponents()
  const scoreboard = useComponentValue(Scoreboard, keysToEntity([stringToFelt(tableId ?? ''), duelistId]))

  const { score } = useScore(scoreboard?.score)

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
