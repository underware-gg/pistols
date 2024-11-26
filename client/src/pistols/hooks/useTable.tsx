import { useMemo } from 'react'
import { getComponentValue } from '@dojoengine/recs'
import { useComponentValue } from '@dojoengine/react'
import { useDojoComponents } from '@/lib/dojo/DojoContext'
import { useGetChallengesByTableQuery } from './useSdkQueries'
import { bigintToEntity } from '@/lib/utils/types'
import { feltToString, stringToFelt } from '@/lib/utils/starknet'
import { LiveChallengeStates, PastChallengeStates } from '@/pistols/utils/pistols'
import { TableType, ChallengeState } from '@/games/pistols/generated/constants'

export const useTable = (tableId: string) => {
  const { TableConfig } = useDojoComponents()

  const table = useComponentValue(TableConfig, bigintToEntity(stringToFelt(tableId ?? '')))
  // console.log('>>>> table', tableId, table )

  const tableType = useMemo(() => ((table?.table_type as unknown as TableType) ?? null), [table])
  const tableTypeDescription = useMemo(() => (table?.table_type ? {
    [TableType.Classic]: 'Classic',
    [TableType.Tournament]: 'Tournament',
    [TableType.IRLTournament]: 'IRL Tournamment',
  }[table.table_type] : null), [table])

  return {
    tableId,
    description: table ? feltToString(table.description) : '?',
    feeMin: table?.fee_min ?? null,
    feePct: 0,
    tableType: tableTypeDescription ?? '?',
    tableIsOpen: table?.is_open ?? false,
    isTournament: (tableType == TableType.Tournament),
    isIRLTournament: (tableType == TableType.IRLTournament),
  }
}

export const useTableTotals = (tableId: string) => {
  const { challenges } = useGetChallengesByTableQuery(tableId)
  const { Challenge } = useDojoComponents()
  const result = useMemo(() => {
    const liveDuelsCount = challenges.reduce((acc: number, ch: any) => {
      const state = (getComponentValue(Challenge, bigintToEntity(ch.duel_id))?.state as unknown as ChallengeState) ?? ChallengeState.Null
      if (LiveChallengeStates.includes(state)) acc++
      return acc
    }, 0)
    const pastDuelsCount = challenges.reduce((acc: number, ch: any) => {
      const state = (getComponentValue(Challenge, bigintToEntity(ch.duel_id))?.state as unknown as ChallengeState) ?? ChallengeState.Null
      if (PastChallengeStates.includes(state)) acc++
      return acc
    }, 0)

    return {
      liveDuelsCount,
      pastDuelsCount
    }
  }, [challenges])

  return {
    ...result
  }
}
