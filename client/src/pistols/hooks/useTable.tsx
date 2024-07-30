import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { getComponentValue } from '@dojoengine/recs'
import { useComponentValue } from '@dojoengine/react'
import { useDojoComponents, useDojoConstants } from '@/lib/dojo/DojoContext'
import { useERC20Balance } from '@/lib/utils/hooks/useERC20'
import { bigintToEntity } from '@/lib/utils/types'
import { feltToString, stringToFelt } from '@/lib/utils/starknet'
import { useAllChallengeIds } from '@/pistols/hooks/useChallenge'
import { ChallengeState, LiveChallengeStates, PastChallengeStates } from '@/pistols/utils/pistols'

export const useTable = (tableId: string) => {
  const { TableConfig } = useDojoComponents()
  const { TableType } = useDojoConstants()

  const table = useComponentValue(TableConfig, bigintToEntity(stringToFelt(tableId ?? '')))
  const wagerContractAddress = useMemo(() => (table?.wager_contract_address ?? 0n), [table])

  const tableType = useMemo(() => (table?.table_type ? {
    [TableType.Classic]: 'Classic',
    [TableType.Tournament]: 'Tournament',
    [TableType.IRLTournament]: 'IRL Tournamment',
  }[table.table_type] : null), [table])

  return {
    tableId,
    wagerContractAddress,
    canWager: (wagerContractAddress != 0n),
    description: table ? feltToString(table.description) : '?',
    wagerMin: table?.wager_min ?? null,
    feeMin: table?.fee_min ?? null,
    feePct: table?.fee_pct ?? null,
    tableType: tableType ?? '?',
    tableIsOpen: table?.is_open ?? false,
    isTournament: (table?.table_type == TableType.Tournament),
    isIRLTournament: (table?.table_type == TableType.IRLTournament),
  }
}

export const useTableAccountBalance = (tableId: string, address: BigNumberish, fee: BigNumberish = 0n) => {
  const { wagerContractAddress } = useTable(tableId)
  return useERC20Balance(wagerContractAddress, address, fee)
}

export const useTableTotals = (tableId: string) => {
  const { challengeIds: allChallengeIds } = useAllChallengeIds(tableId)
  const { Challenge } = useDojoComponents()
  const result = useMemo(() => {
    const liveDuelsCount = allChallengeIds.reduce((acc: number, id: bigint) => {
      const state = getComponentValue(Challenge, bigintToEntity(id))?.state ?? ChallengeState.Null
      if (LiveChallengeStates.includes(state)) acc++
      return acc
    }, 0)
    const pastDuelsCount = allChallengeIds.reduce((acc: number, id: bigint) => {
      const state = getComponentValue(Challenge, bigintToEntity(id))?.state ?? ChallengeState.Null
      if (PastChallengeStates.includes(state)) acc++
      return acc
    }, 0)

    return {
      liveDuelsCount,
      pastDuelsCount
    }
  }, [allChallengeIds])

  return {
    ...result
  }
}
