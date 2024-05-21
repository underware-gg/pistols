import { useComponentValue } from '@dojoengine/react'
import { useSettingsContext } from '@/pistols/hooks/SettingsContext'
import { useDojoComponents } from '@/lib/dojo/DojoContext'
import { useERC20Balance } from '@/lib/utils/hooks/useERC20'
import { bigintToEntity } from '@/lib/utils/types'
import { feltToString, stringToFelt } from '@/lib/utils/starknet'
import { BigNumberish } from 'starknet'

export const useTable = (tableId: string) => {
  const { TTable } = useDojoComponents()
  const table = useComponentValue(TTable, bigintToEntity(stringToFelt(tableId ?? '')))
  return {
    contractAddress: table?.contract_address ?? 0n,
    description: table ? feltToString(table.description) : '?',
    wagerMin: table?.wager_min ?? null,
    feeMin: table?.fee_min ?? null,
    feePct: table?.fee_pct ?? null,
    isOpen: table?.is_open ?? false,
  }
}

export const useCurrentTable = () => {
  const { tableId } = useSettingsContext()
  return useTable(tableId);
}

export const useTableBalance = (tableId: string, address: BigNumberish, fee: BigNumberish = 0n) => {
  const { contractAddress } = useTable(tableId)
  return useERC20Balance(contractAddress, address, fee)
}
