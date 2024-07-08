import { useMemo } from 'react'
import { useComponentValue } from '@dojoengine/react'
import { useDojoComponents } from '@/lib/dojo/DojoContext'
import { useDojoConstants } from '@/lib/dojo/ConstantsContext'
import { useRouterTable } from '@/pistols/hooks/useRouterListener'
import { useERC20Balance } from '@/lib/utils/hooks/useERC20'
import { bigintToEntity } from '@/lib/utils/types'
import { feltToString, stringToFelt } from '@/lib/utils/starknet'
import { BigNumberish } from 'starknet'

export const useTable = (tableId: string) => {
  const { TableConfig } = useDojoComponents()
  // const { table_types } = useDojoConstants()
  const table = useComponentValue(TableConfig, bigintToEntity(stringToFelt(tableId ?? '')))
  const contractAddress = useMemo(() => (table?.contract_address ?? 0n), [table])
  // const tableType = useMemo(() => (table?.table_type ? {
  //   [table_types.CLASSIC]: 'Classic',
  //   [table_types.TOURNAMENT]: 'Tournament',
  //   [table_types.IRL_TOURNAMENT]: 'IRL Tournamment',
  // }[Number(table.table_type)] : null), [table])
  
  return {
    tableId,
    contractAddress,
    canWager: (contractAddress != 0n),
    description: table ? feltToString(table.description) : '?',
    wagerMin: table?.wager_min ?? null,
    feeMin: table?.fee_min ?? null,
    feePct: table?.fee_pct ?? null,
    // tableType: tableType ?? '?',
    tableType: table?.table_type ?? '?',
    tableIsOpen: table?.is_open ?? false,
  }
}

export const useTableBalance = (tableId: string, address: BigNumberish, fee: BigNumberish = 0n) => {
  const { contractAddress } = useTable(tableId)
  return useERC20Balance(contractAddress, address, fee)
}
