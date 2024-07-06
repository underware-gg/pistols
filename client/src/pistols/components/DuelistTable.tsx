import React, { useEffect, useMemo, useState } from 'react'
import { Grid, Table } from 'semantic-ui-react'
import { useAccount } from '@starknet-react/core'
import { useAllDuelistKeys, useDuelist } from '@/pistols/hooks/useDuelist'
import { AddressShort } from '@/lib/ui/AddressShort'
import { ProfilePicSquare } from '@/pistols/components/account/ProfilePic'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { ProfileName } from './account/ProfileDescription'
import { bigintEquals } from '@/lib/utils/types'
import { EMOJI } from '@/pistols/data/messages'
import { BigNumberish } from 'starknet'

const Row = Grid.Row
const Col = Grid.Column
const Cell = Table.Cell
const HeaderCell = Table.HeaderCell

enum DuelistColumn {
  Name = 'Name',
  Honour = 'Honour',
  Level = 'Level',
  TotalHonour = 'TotalHonour',
  Wins = 'Wins',
  Losses = 'Losses',
  Draws = 'Draws',
  Total = 'Total',
  WinRatio = 'WinRatio',
}
enum SortDirection {
  Ascending = 'ascending',
  Descending = 'descending',
}

export function DuelistTable() {
  const { address } = useAccount()
  const { duelistKeys } = useAllDuelistKeys()

  // Sort
  const [sortColumn, setSortColumn] = useState(DuelistColumn.Honour)
  const [sortDirection, setSortDirection] = useState(SortDirection.Descending)
  const _sortBy = (column: DuelistColumn) => {
    if (column == sortColumn) {
      setSortDirection(sortDirection == SortDirection.Ascending ? SortDirection.Descending : SortDirection.Ascending)
    } else {
      setSortColumn(column)
      setSortDirection(column == DuelistColumn.Name ? SortDirection.Ascending : SortDirection.Descending)
    }
  }
  
  // callback to store each Duelist data for sorting
  const [duelistsData, setDuelistsData] = useState({})
  const _dataCallback = (address:bigint, data:any) => {
    // this pattern can handle simultaneous state set
    setDuelistsData(o => ({ ...o, [address.toString()]: data }))
  }

  const rows = useMemo(() => {
    let result = []
    duelistKeys.forEach((duelistId, index) => {
      const isYou = bigintEquals(duelistId, address)
      result.push(<DuelistItem key={duelistId} duelistId={duelistId} index={index} isYou={isYou} sortColumn={sortColumn} dataCallback={_dataCallback}/>)
    })
    return result
  }, [duelistKeys, sortColumn])

  // Sort rows
  const sortedRows = useMemo(() => rows.sort((a, b) => {
    const dataA = duelistsData[a.props.address]
    const dataB = duelistsData[b.props.address]
    if (!dataA && !dataB) return 0
    if (!dataA) return 1
    if (!dataB) return -1
    const isAscending = (sortDirection == SortDirection.Ascending)
    if (sortColumn == DuelistColumn.Name) {
      return isAscending ? dataA.name.localeCompare(dataB.name) : dataB.name.localeCompare(dataA.name) 
    }
    const _sortTotals = (a, b) => (!isAscending ? (b - a) : (a && !b) ? -1 : (!a && b) ? 1 : (a - b))
    if (sortColumn == DuelistColumn.Honour) return _sortTotals(dataA.honour, dataB.honour)
    if (sortColumn == DuelistColumn.Level) return _sortTotals(dataA.level, dataB.level)
    if (sortColumn == DuelistColumn.TotalHonour) return _sortTotals(dataA.total_honour, dataB.total_honour)
    if (sortColumn == DuelistColumn.Wins) return _sortTotals(dataA.total_wins, dataB.total_wins)
    if (sortColumn == DuelistColumn.Losses) return _sortTotals(dataA.total_losses, dataB.total_losses)
    if (sortColumn == DuelistColumn.Draws) return _sortTotals(dataA.total_draws, dataB.total_draws)
    if (sortColumn == DuelistColumn.Total) return _sortTotals(dataA.total_duels, dataB.total_duels)
    if (sortColumn == DuelistColumn.WinRatio) return _sortTotals(dataA.winRatio, dataB.winRatio)
    return 0
  }), [rows, duelistsData, sortColumn, sortDirection])

  const isEmpty = (sortedRows.length == 0)

  return (
    <Table selectable sortable={!isEmpty} className='Faded' color='orange' style={{ maxWidth: '100%' }}>
      <Table.Header className='TableHeader'>
        <Table.Row textAlign='center' verticalAlign='middle'>
          <HeaderCell width={1}></HeaderCell>
          <HeaderCell width={9} textAlign='left' sorted={sortColumn == DuelistColumn.Name ? sortDirection : null} onClick={() => _sortBy(DuelistColumn.Name)}>Duelist</HeaderCell>
          <HeaderCell width={1} sorted={sortColumn == DuelistColumn.Honour ? sortDirection : null} onClick={() => _sortBy(DuelistColumn.Honour)}>Honour</HeaderCell>
          <HeaderCell width={1} sorted={sortColumn == DuelistColumn.Level ? sortDirection : null} onClick={() => _sortBy(DuelistColumn.Level)}>{EMOJI.LORD}{EMOJI.TRICKSTER}{EMOJI.VILLAIN}<br />Level</HeaderCell>
          <HeaderCell width={1} sorted={sortColumn == DuelistColumn.Total ? sortDirection : null} onClick={() => _sortBy(DuelistColumn.Total)}>Total<br />Duels</HeaderCell>
          <HeaderCell width={1} sorted={sortColumn == DuelistColumn.TotalHonour ? sortDirection : null} onClick={() => _sortBy(DuelistColumn.TotalHonour)}>Total<br />Honour</HeaderCell>
          <HeaderCell width={1} sorted={sortColumn == DuelistColumn.Wins ? sortDirection : null} onClick={() => _sortBy(DuelistColumn.Wins)}>Wins</HeaderCell>
          <HeaderCell width={1} sorted={sortColumn == DuelistColumn.Losses ? sortDirection : null} onClick={() => _sortBy(DuelistColumn.Losses)}>Losses</HeaderCell>
          <HeaderCell width={1} sorted={sortColumn == DuelistColumn.Draws ? sortDirection : null} onClick={() => _sortBy(DuelistColumn.Draws)}>Draws</HeaderCell>
          <HeaderCell width={1} sorted={sortColumn == DuelistColumn.WinRatio ? sortDirection : null} onClick={() => _sortBy(DuelistColumn.WinRatio)}>Win<br />Ratio</HeaderCell>
        </Table.Row>
      </Table.Header>

      {!isEmpty ?
        <Table.Body className='TableBody'>
          {sortedRows}
        </Table.Body>
        :
        <Table.Footer fullWidth>
          <Table.Row>
            <Cell colSpan='100%' textAlign='center'>
              no duelists here
            </Cell>
          </Table.Row>
        </Table.Footer>
      }
    </Table>
  )
}


function DuelistItem({
  duelistId,
  sortColumn,
  dataCallback,
  index,
  isYou,
}: {
  duelistId: BigNumberish
  sortColumn: DuelistColumn
  dataCallback: Function
  index?: number
  isYou?: boolean
}) {
  const duelistData = useDuelist(duelistId)
  const {
    profilePic,
    total_wins, total_losses, total_draws, total_duels, total_honour,
    honourDisplay, levelDisplay, winRatio,
  } = duelistData
  const { dispatchSelectDuelistId } = usePistolsContext()

  useEffect(() => {
    // console.log(duelistData)
    dataCallback(duelistId, duelistData)
  }, [duelistData])

  const _colClass = (col: DuelistColumn) => (sortColumn == col ? 'Important' : null)

  const isRookie = (total_duels == 0)

  return (
    <Table.Row textAlign='center' verticalAlign='middle' onClick={() => dispatchSelectDuelistId(duelistId)}>
      <Cell>
        <ProfilePicSquare profilePic={profilePic} small />
      </Cell>

      <Cell textAlign='left' style={{ maxWidth: '175px' }}>
        <h5 className='NoMargin'><ProfileName duelistId={duelistId} /></h5>
        {/* <AddressShort address={address} copyLink={false} /> */}
      </Cell>

      <Cell className={_colClass(DuelistColumn.Honour)}>
        {isRookie ? '-' : <span className='TableValue'>{honourDisplay}</span>}
      </Cell>

      <Cell className={_colClass(DuelistColumn.Level)}>
        {isRookie ? '-' : <span className='TableValue'>{levelDisplay}</span>}
      </Cell>

      <Cell className={_colClass(DuelistColumn.Total)}>
        {isRookie ? '-' : <span className='TableValue'>{total_duels}</span>}
      </Cell>

      <Cell className={_colClass(DuelistColumn.TotalHonour)}>
        {isRookie ? '-' : <span className='TableValue'>{total_honour}</span>}
      </Cell>

      <Cell className={_colClass(DuelistColumn.Wins)}>
        {isRookie ? '-' : <span className='TableValue'>{total_wins}</span>}
      </Cell>

      <Cell className={_colClass(DuelistColumn.Losses)}>
        {isRookie ? '-' : <span className='TableValue'>{total_losses}</span>}
      </Cell>

      <Cell className={_colClass(DuelistColumn.Draws)}>
        {isRookie ? '-' : <span className='TableValue'>{total_draws}</span>}
      </Cell>

      <Cell className={_colClass(DuelistColumn.WinRatio)}>
        {winRatio === null ? '-' : <span className='TableValue'>{Math.floor(winRatio * 100)}%</span>}
      </Cell>
    </Table.Row>
  )
}

