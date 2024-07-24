import React, { useMemo } from 'react'
import { ButtonGroup, Grid, Table } from 'semantic-ui-react'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { useQueryContext, DuelistColumn, SortDirection } from '@/pistols/hooks/QueryContext'
import { useDuelist } from '@/pistols/hooks/useDuelist'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { useTable } from '@/pistols/hooks/useTable'
import { useScoreboard } from '@/pistols/hooks/useScore'
import { useOpener } from '@/lib/ui/useOpener'
import { ProfileBadge, ProfileName } from '@/pistols/components/account/ProfileDescription'
import { ProfilePicSquare } from '@/pistols/components/account/ProfilePic'
import { LordsBagIcon } from '@/pistols/components/account/Balance'
import { FilterButton } from '@/pistols/components/ui/Buttons'
import { EMOJI } from '@/pistols/data/messages'
import AnonModal from '@/pistols/components/AnonModal'

const Row = Grid.Row
const Col = Grid.Column
const Cell = Table.Cell
const HeaderCell = Table.HeaderCell

export function DuelistTable() {
  const { tableId } = useSettings()
  const {
    duelistsAnon, 
    dispatchSelectDuelistId, dispatchDuelistsAnon
  } = usePistolsContext()
  const anonOpener = useOpener()

  // query
  const {
    queryDuelists,
    filterDuelistTable,
    filterDuelistActive,
    filterDuelistSortColumn: sortColumn,
    filterDuelistSortDirection: sortDirection,
    dispatchFilterDuelistTable,
    dispatchFilterDuelistSortColumn,
    dispatchFilterDuelistSortDirection,
    dispatchFilterDuelistSortSwitch,
    dispatchFilterDuelistActive,
  } = useQueryContext()

  const _sortBy = (column: DuelistColumn) => {
    if (column == sortColumn) {
      dispatchFilterDuelistSortSwitch()
    } else {
      dispatchFilterDuelistSortColumn(column)
      dispatchFilterDuelistSortDirection(column == DuelistColumn.Name ? SortDirection.Ascending : SortDirection.Descending)
    }
  }

  // Filters
  const currentTableId = useMemo(() => (filterDuelistTable ? tableId : null), [tableId, filterDuelistTable])
  const { canWager } = useTable(currentTableId)

  const _selectCallback = (duelistId: bigint) => {
    if (duelistId) {
      dispatchSelectDuelistId(duelistId)
    } else {
      anonOpener.open();
    }
  }

  const duelists = useMemo(() => {
    let result = []
    queryDuelists.forEach((row) => {
      result.push(<DuelistItem key={row.duelist_id}
        tableId={currentTableId}
        duelistId={row.duelist_id}
        sortColumn={sortColumn}
        selectCallback={_selectCallback}
        canWager={canWager}
      />)
    })
    return result
  }, [queryDuelists, currentTableId, sortColumn, canWager])

  const isEmpty = (duelists.length == 0)

  return (
    <>
      <Grid>
        <Row columns={'equal'}>
          <Col textAlign='left'>
            <ButtonGroup>
              <FilterButton label='Global' state={!filterDuelistTable} switchState={() => dispatchFilterDuelistTable(false)} />
              <FilterButton grouped label='Current Table' state={filterDuelistTable} switchState={() => dispatchFilterDuelistTable(true)} />
            </ButtonGroup>
            <FilterButton label='Active Only' state={filterDuelistActive} switchState={() => dispatchFilterDuelistActive(!filterDuelistActive)} />
            <FilterButton label='Wallets' state={duelistsAnon} switchState={() => dispatchDuelistsAnon(!duelistsAnon)} />
          </Col>
        </Row>
      </Grid>

      <Table selectable sortable={!isEmpty} className='Faded' color='orange' style={{ maxWidth: '100%' }}>
        <Table.Header className='TableHeader'>
          <Table.Row textAlign='center' verticalAlign='middle'>
            <HeaderCell width={1}></HeaderCell>
            <HeaderCell width={9} textAlign='left' sorted={sortColumn == DuelistColumn.Name ? sortDirection : null} onClick={() => _sortBy(DuelistColumn.Name)}>Duelist</HeaderCell>
            <HeaderCell width={1} sorted={sortColumn == DuelistColumn.Honour ? sortDirection : null} onClick={() => _sortBy(DuelistColumn.Honour)}>Honour</HeaderCell>
            <HeaderCell width={1} sorted={sortColumn == DuelistColumn.Level ? sortDirection : null} onClick={() => _sortBy(DuelistColumn.Level)}>{EMOJI.LORD}{EMOJI.TRICKSTER}{EMOJI.VILLAIN}<br />Level</HeaderCell>
            <HeaderCell width={1} sorted={sortColumn == DuelistColumn.Total ? sortDirection : null} onClick={() => _sortBy(DuelistColumn.Total)}>Total<br />Duels</HeaderCell>
            <HeaderCell width={1} sorted={sortColumn == DuelistColumn.Wins ? sortDirection : null} onClick={() => _sortBy(DuelistColumn.Wins)}>Wins</HeaderCell>
            <HeaderCell width={1} sorted={sortColumn == DuelistColumn.Losses ? sortDirection : null} onClick={() => _sortBy(DuelistColumn.Losses)}>Losses</HeaderCell>
            <HeaderCell width={1} sorted={sortColumn == DuelistColumn.Draws ? sortDirection : null} onClick={() => _sortBy(DuelistColumn.Draws)}>Draws</HeaderCell>
            <HeaderCell width={1} sorted={sortColumn == DuelistColumn.WinRatio ? sortDirection : null} onClick={() => _sortBy(DuelistColumn.WinRatio)}>Win<br />Ratio</HeaderCell>
            {canWager &&
              <HeaderCell width={1} sorted={sortColumn == DuelistColumn.Balance ? sortDirection : null} onClick={() => _sortBy(DuelistColumn.Balance)}><h3><LordsBagIcon /></h3></HeaderCell>
            }
          </Table.Row>
        </Table.Header>

        {!isEmpty ?
          <Table.Body className='TableBody'>
            {duelistsAnon && <DuelistItem
              tableId={currentTableId}
              duelistId={0n}
              sortColumn={sortColumn}
              selectCallback={_selectCallback}
              canWager={canWager}
            />}
            {duelists}
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

      <AnonModal opener={anonOpener} />
    </>
  )
}


function DuelistItem({
  tableId,
  duelistId,
  sortColumn,
  selectCallback,
  canWager,
}: {
  tableId: string
  duelistId: bigint
  sortColumn: DuelistColumn
  selectCallback: Function
  canWager: boolean
}) {
// duelist
  const duelistData = useDuelist(duelistId)
  const { profilePic, score: duelistScore } = duelistData

  // scoreboard
  const scoreboard = useScoreboard(tableId, duelistId)
  const { balanceFormatted, score: scoreboardScore } = scoreboard

  // score switcher
  const score = (tableId ? scoreboardScore : duelistScore)
  const {
    total_wins, total_losses, total_draws, total_duels,
    honourDisplay, levelDisplay, winRatio,
  } = score
  const isRookie = (total_duels == 0)

  const _colClass = (col: DuelistColumn) => (sortColumn == col ? 'Important' : null)

  return (
    <Table.Row textAlign='center' verticalAlign='middle' onClick={() => selectCallback(duelistId)}>
      <Cell>
        <ProfilePicSquare profilePic={profilePic} small />
      </Cell>

      <Cell textAlign='left' style={{ maxWidth: '175px' }}>
        {duelistId ?
          <>
            <h5 className='NoMargin'><ProfileName duelistId={duelistId} displayId={false} badges={false} /></h5>
            <div className='Normal NoMargin'>Duelist #{duelistId.toString()} <ProfileBadge duelistId={duelistId} /></div>
          </> : <>
            <h5 className='NoMargin'>Challenge a Wallet or Starknet ID</h5>
            <div className='Normal NoMargin'>Duelist #?</div>
          </>}
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
        {isRookie || winRatio === null ? '-' : <span className='TableValue'>{Math.floor(winRatio * 100)}%</span>}
      </Cell>

      {canWager &&
        <Cell className={_colClass(DuelistColumn.Balance)}>
          {isRookie ? '-' : <span className='TableValue'>{balanceFormatted}</span>}
        </Cell>
      }
    </Table.Row>
  )
}

