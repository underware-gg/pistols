import { useMemo } from 'react'
import { useComponentValue } from '@dojoengine/react'
import { useDojoComponents, useDojoConstants } from '@/lib/dojo/DojoContext'
import { useERC20Balance } from '@/lib/utils/hooks/useERC20'
import { bigintToEntity } from '@/lib/utils/types'
import { feltToString, stringToFelt } from '@/lib/utils/starknet'
import { BigNumberish } from 'starknet'

export const useTable = (tableId: string) => {
  const { TableConfig } = useDojoComponents()
  const { table_types } = useDojoConstants()

  const table = useComponentValue(TableConfig, bigintToEntity(stringToFelt(tableId ?? '')))
  const wagerContractAddress = useMemo(() => (table?.wager_contract_address ?? 0n), [table])

  // const tableType = useMemo(() => (table?.table_type ? {
  //   [table_types.CLASSIC]: 'Classic',
  //   [table_types.TOURNAMENT]: 'Tournament',
  //   [table_types.IRL_TOURNAMENT]: 'IRL Tournamment',
  // }[Number(table.table_type)] : null), [table])
  
  return {
    tableId,
    wagerContractAddress,
    canWager: (wagerContractAddress != 0n),
    description: table ? feltToString(table.description) : '?',
    wagerMin: table?.wager_min ?? null,
    feeMin: table?.fee_min ?? null,
    feePct: table?.fee_pct ?? null,
    // tableType: tableType ?? '?',
    tableType: table?.table_type ?? '?',
    tableIsOpen: table?.is_open ?? false,
    //@ts-ignore
    isTournament: (table?.table_type == 'Tournament'),
    //@ts-ignore
    isIRLTournament: (table?.table_type == 'IRLTournament'),
  }
}

export const useTableAccountBalance = (tableId: string, address: BigNumberish, fee: BigNumberish = 0n) => {
  const { wagerContractAddress } = useTable(tableId)
  return useERC20Balance(wagerContractAddress, address, fee)
}
