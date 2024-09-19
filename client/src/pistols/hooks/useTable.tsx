import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { getComponentValue } from '@dojoengine/recs'
import { useComponentValue } from '@dojoengine/react'
import { useDojoComponents } from '@/lib/dojo/DojoContext'
import { useERC20Balance } from '@/lib/utils/hooks/useERC20'
import { bigintToEntity, isPositiveBigint } from '@/lib/utils/types'
import { feltToString, stringToFelt } from '@/lib/utils/starknet'
import { useAllChallengeIds } from '@/pistols/hooks/useChallenge'
import { LiveChallengeStates, PastChallengeStates } from '@/pistols/utils/pistols'
import { TableType, ChallengeState } from '@/games/pistols/generated/constants'
import { useLordsContract } from '@/lib/dojo/hooks/useLords'

export const useTable = (tableId: string) => {
  const { TableConfig } = useDojoComponents()

  const table = useComponentValue(TableConfig, bigintToEntity(stringToFelt(tableId ?? '')))
  const feeContractAddress = useMemo(() => (table?.fee_contract_address ?? 0n), [table])
  // console.log('>>>> table', tableId, table )

  const tableType = useMemo(() => ((table?.table_type as unknown as TableType) ?? null), [table])
  const tableTypeDescription = useMemo(() => (table?.table_type ? {
    [TableType.Classic]: 'Classic',
    [TableType.Tournament]: 'Tournament',
    [TableType.IRLTournament]: 'IRL Tournamment',
  }[table.table_type] : null), [table])

  return {
    tableId,
    feeContractAddress: isPositiveBigint(feeContractAddress) ? feeContractAddress : null,
    canWager: false,
    description: table ? feltToString(table.description) : '?',
    feeMin: table?.fee_min ?? null,
    wagerMin: 0,
    feePct: 0,
    tableType: tableTypeDescription ?? '?',
    tableIsOpen: table?.is_open ?? false,
    isTournament: (tableType == TableType.Tournament),
    isIRLTournament: (tableType == TableType.IRLTournament),
  }
}

export const useTableAccountBalance = (tableId: string, address: BigNumberish, fee: BigNumberish = 0n) => {
  const { feeContractAddress } = useTable(tableId)
  return useERC20Balance(feeContractAddress, address, fee)
}

export const useTableTotals = (tableId: string) => {
  const { challengeIds: allChallengeIds } = useAllChallengeIds(tableId)
  const { Challenge } = useDojoComponents()
  const result = useMemo(() => {
    const liveDuelsCount = allChallengeIds.reduce((acc: number, id: bigint) => {
      const state = (getComponentValue(Challenge, bigintToEntity(id))?.state as unknown as ChallengeState) ?? ChallengeState.Null
      if (LiveChallengeStates.includes(state)) acc++
      return acc
    }, 0)
    const pastDuelsCount = allChallengeIds.reduce((acc: number, id: bigint) => {
      const state = (getComponentValue(Challenge, bigintToEntity(id))?.state as unknown as ChallengeState) ?? ChallengeState.Null
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
