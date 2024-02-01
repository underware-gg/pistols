import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Grid, Table } from 'semantic-ui-react'
import { useDojoAccount } from '@/dojo/DojoContext'
import { useAllDuelistIds, useDuelist } from '@/pistols/hooks/useDuelist'
import { AccountShort } from '@/pistols/components/ui/Account'
import { ProfilePicSquare } from '@/pistols/components/account/ProfilePic'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'

const Row = Grid.Row
const Col = Grid.Column
const Cell = Table.Cell
const HeaderCell = Table.HeaderCell

enum DuelistColumn {
  Name = 'Name',
  Honour = 'Honour',
  TotalHonour = 'TotalHonour',
  Wins = 'Wins',
  Losses = 'Losses',
  Draws = 'Draws',
  Total = 'Total',
}
enum SortDirection {
  Ascending = 'ascending',
  Descending = 'descending',
}

export function DuelistTable() {
  const { account } = useDojoAccount()
  const { duelistIds } = useAllDuelistIds()

  // callback to store each Duelist data for sorting
  const [duelistsData, setDuelistsData] = useState({})
  const _dataCallback = (address:bigint, data:any) => {
    // this pattern can handle simultaneous state set
    setDuelistsData(o => ({ ...o, [address.toString()]: data }))
  }

  const rows = useMemo(() => {
    let result = []
    duelistIds.forEach((duelistId, index) => {
      const isYou = (duelistId == BigInt(account.address))
      result.push(<DuelistItem key={duelistId} address={duelistId} index={index} isYou={isYou} dataCallback={_dataCallback}/>)
    })
    return result
  }, [duelistIds])

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
    if (sortColumn == DuelistColumn.TotalHonour) return _sortTotals(dataA.total_honour, dataB.total_honour)
    if (sortColumn == DuelistColumn.Wins) return _sortTotals(dataA.total_wins, dataB.total_wins)
    if (sortColumn == DuelistColumn.Losses) return _sortTotals(dataA.total_losses, dataB.total_losses)
    if (sortColumn == DuelistColumn.Draws) return _sortTotals(dataA.total_draws, dataB.total_draws)
    if (sortColumn == DuelistColumn.Total) return _sortTotals(dataA.total_duels, dataB.total_duels)
    return 0
  }), [rows, duelistsData, sortColumn, sortDirection])

  const isEmpty = (sortedRows.length == 0)

  return (
    <Table selectable sortable={!isEmpty} className='Faded' color='orange'>
      <Table.Header className='TableHeader'>
        <Table.Row textAlign='center' verticalAlign='middle'>
          <HeaderCell width={1}></HeaderCell>
          <HeaderCell width={9} textAlign='left' sorted={sortColumn == DuelistColumn.Name ? sortDirection : null} onClick={() => _sortBy(DuelistColumn.Name)}>Duelist</HeaderCell>
          <HeaderCell width={1} sorted={sortColumn == DuelistColumn.Honour ? sortDirection : null} onClick={() => _sortBy(DuelistColumn.Honour)}>Honour</HeaderCell>
          <HeaderCell width={1} sorted={sortColumn == DuelistColumn.Wins ? sortDirection : null} onClick={() => _sortBy(DuelistColumn.Wins)}>Total<br />Wins</HeaderCell>
          <HeaderCell width={1} sorted={sortColumn == DuelistColumn.Losses ? sortDirection : null} onClick={() => _sortBy(DuelistColumn.Losses)}>Total<br />Losses</HeaderCell>
          <HeaderCell width={1} sorted={sortColumn == DuelistColumn.Draws ? sortDirection : null} onClick={() => _sortBy(DuelistColumn.Draws)}>Total<br />Draws</HeaderCell>
          <HeaderCell width={1} sorted={sortColumn == DuelistColumn.TotalHonour ? sortDirection : null} onClick={() => _sortBy(DuelistColumn.TotalHonour)}>Total<br />Honour</HeaderCell>
          <HeaderCell width={1} sorted={sortColumn == DuelistColumn.Total ? sortDirection : null} onClick={() => _sortBy(DuelistColumn.Total)}>Total<br />Duels</HeaderCell>
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
  address,
  index,
  isYou,
  dataCallback,
}) {
  const duelistData = useDuelist(address)
  const { name, profilePic, total_wins, total_losses, total_draws, total_duels, total_honour, honourDisplay } = duelistData
  const { dispatchSetDuelist } = usePistolsContext()

  useEffect(() => {
    // console.log(duelistData)
    dataCallback(address, duelistData)
  }, [duelistData])

  const isRookie = (total_duels == 0)

  return (
    <Table.Row textAlign='center' verticalAlign='middle' onClick={() => dispatchSetDuelist(address)}>
      <Cell>
        <ProfilePicSquare profilePic={profilePic} small />
      </Cell>

      <Cell textAlign='left'>
        <h4>{name}</h4>
        <AccountShort address={address} copyLink={false} />
      </Cell>

      <Cell className='Important'>
        {isRookie ? '-' : <span className='TableValue'>{honourDisplay}</span>}
      </Cell>

      <Cell>
        {isRookie ? '-' : <span className='TableValue'>{total_wins}</span>}
      </Cell>

      <Cell>
        {isRookie ? '-' : <span className='TableValue'>{total_losses}</span>}
      </Cell>

      <Cell>
        {isRookie ? '-' : <span className='TableValue'>{total_draws}</span>}
      </Cell>

      <Cell>
        {isRookie ? '-' : <span className='TableValue'>{total_honour}</span>}
      </Cell>

      <Cell>
        {isRookie ? '-' : <span className='TableValue'>{total_duels}</span>}
      </Cell>
    </Table.Row>
  )
}

