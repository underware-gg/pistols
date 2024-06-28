import { useComponentValue } from '@dojoengine/react'
import { useDojoComponents } from '@/lib/dojo/DojoContext'
import { useRouterTable } from '@/pistols/hooks/useRouterListener'
import { useERC20Balance } from '@/lib/utils/hooks/useERC20'
import { bigintToEntity } from '@/lib/utils/types'
import { feltToString, stringToFelt } from '@/lib/utils/starknet'
import { BigNumberish } from 'starknet'
import { useMemo } from 'react'

export const useTable = (tableId: string) => {
  const { TableConfig } = useDojoComponents()
  const table = useComponentValue(TableConfig, bigintToEntity(stringToFelt(tableId ?? '')))
  const contractAddress = useMemo(() => (table?.contract_address ?? 0n), [table])
  return {
    tableId,
    contractAddress,
    canWager: (contractAddress != 0n),
    description: table ? feltToString(table.description) : '?',
    wagerMin: table?.wager_min ?? null,
    feeMin: table?.fee_min ?? null,
    feePct: table?.fee_pct ?? null,
    tableIsOpen: table?.is_open ?? false,
  }
}

export const useCurrentTable = () => {
  const { tableId } = useRouterTable()
  return useTable(tableId);
}

export const useTableBalance = (tableId: string, address: BigNumberish, fee: BigNumberish = 0n) => {
  const { contractAddress } = useTable(tableId)
  return useERC20Balance(contractAddress, address, fee)
}
