import React, { useEffect, useMemo, useState } from 'react'
import { BigNumberish } from 'starknet'
import { Container, Table } from 'semantic-ui-react'
import { usePlayer, usePlayerEntityStore } from '/src/stores/playerStore'
import { useTokenContracts } from '/src/hooks/useTokenContracts'
import { useAllStoreModels } from '@underware/pistols-sdk/dojo'
import { useDiscordSocialLink } from '/src/stores/eventsModelStore'
import { useFetchAccountsBalances, useFoolsCoinStore, useLordsCoinStore } from '/src/stores/coinStore'
import { InternalPageMenu, InternalPageWrapper } from '/src/pages/internal/InternalPageIndex'
import { formatTimestampLocal, isPositiveBigint } from '@underware/pistols-sdk/utils'
import { EntityStoreSync } from '/src/stores/sync/EntityStoreSync'
import { PlayerNameSync } from '/src/stores/sync/PlayerNameSync'
import { EventsModelStoreSync } from '/src/stores/sync/EventsModelStoreSync'
import { ExplorerLink } from '@underware/pistols-sdk/starknet/components'
import { weiToEth } from '@underware/pistols-sdk/starknet'
import { Balance } from '/src/components/account/Balance'
import { Address } from '/src/components/ui/Address'
import { Connect } from '/src/pages/tests/ConnectTestPage'
import { models } from '@underware/pistols-sdk/pistols/gen'
import CurrentChainHint from '/src/components/CurrentChainHint'
import AppDojo from '/src/components/AppDojo'

// const Row = Grid.Row
// const Col = Grid.Column
const Row = Table.Row
const Cell = Table.Cell
const Body = Table.Body
const Header = Table.Header
const HeaderCell = Table.HeaderCell

export default function PlayersPage() {
  return (
    <AppDojo subtitle='Internal: Players'>
      <Container>
        <InternalPageMenu />
        <CurrentChainHint />
        <Connect />

        <InternalPageWrapper>
          <Players />
        </InternalPageWrapper>

        <EntityStoreSync />
        <EventsModelStoreSync />
        <PlayerNameSync />
      </Container>
    </AppDojo>
  );
}

type SortColumnsType = 'timestamp' | 'username' | 'discord' | 'duelists' | 'lords' | 'fools';
type SortDirectionsType = 'ascending' | 'descending';
const sortDirectionByType: Record<SortColumnsType, SortDirectionsType> = {
  timestamp: 'ascending',
  username: 'ascending',
  discord: 'descending',
  duelists: 'descending',
  lords: 'descending',
  fools: 'descending',
}

function Players() {
  const entities = usePlayerEntityStore((state) => state.entities)
  const players = useAllStoreModels<models.Player>(entities, 'Player')

  const playerAddresses = useMemo(() => players.map((p) => p.player_address), [players])

  const { lordsContractAddress, foolsContractAddress } = useTokenContracts()
  const { isFinished: isFinishedLords } = useFetchAccountsBalances(lordsContractAddress, playerAddresses, true)
  const { isFinished: isFinishedFools } = useFetchAccountsBalances(foolsContractAddress, playerAddresses, true)

  // store rendered row data for sorting
  const [rowData, setRowData] = useState<{
    [playerIndex: number]: any,
  }>({})
  const _setRowData = (playerIndex: number, data: any) => {
    setRowData((prev) => ({
      ...prev,
      [playerIndex]: data,
    }))
  }

  // sort
  const [sortColumn, setSortColumn] = useState<SortColumnsType>('timestamp')
  const [sortDirection, setSortDirection] = useState<SortDirectionsType>('ascending')
  const _sort = (column: SortColumnsType) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'ascending' ? 'descending' : 'ascending')
    } else {
      setSortColumn(column)
      setSortDirection(sortDirectionByType[column])
    }
  }
  const sortedIndices = useMemo(() => {
    let sortedRowData = Object.values(rowData)
    if (sortColumn === 'timestamp') {
      sortedRowData = sortedRowData.sort((a, b) => sortDirection === 'ascending' ? a.timestamp - b.timestamp : b.timestamp - a.timestamp)
    } else if (sortColumn === 'username') {
      sortedRowData = sortedRowData.sort((a, b) => sortDirection === 'ascending' ? a.username.localeCompare(b.username) : b.username.localeCompare(a.username))
    } else if (sortColumn === 'discord') {
      sortedRowData = sortedRowData.sort((a, b) => sortDirection === 'ascending' ? a.discord.localeCompare(b.discord) : b.discord.localeCompare(a.discord))
    } else if (sortColumn === 'duelists') {
      sortedRowData = sortedRowData.sort((a, b) => sortDirection === 'ascending' ? a.aliveDuelistCount - b.aliveDuelistCount : b.aliveDuelistCount - a.aliveDuelistCount)
    } else if (sortColumn === 'lords') {
      sortedRowData = sortedRowData.sort((a, b) => sortDirection === 'ascending' ? a.lordsBalance - b.lordsBalance : b.lordsBalance - a.lordsBalance)
    } else if (sortColumn === 'fools') {
      sortedRowData = sortedRowData.sort((a, b) => sortDirection === 'ascending' ? a.foolsBalance - b.foolsBalance : b.foolsBalance - a.foolsBalance)
    }
    return sortedRowData.map((row) => row.playerIndex);
  }, [rowData, sortColumn, sortDirection])

  // render rows
  const rows = useMemo(() => (isFinishedLords && isFinishedFools) ? playerAddresses.filter(isPositiveBigint).map((address, index) => (
    <PlayerRow key={address}
      address={address} playerIndex={index} sequentialOrder={(sortedIndices.indexOf(index) ?? index) + 1} setRowData={_setRowData}
    />
  )) : [], [playerAddresses, sortedIndices, isFinishedLords, isFinishedFools])


  const sortedRows = useMemo(() => {
    return rows.sort((a, b) => {
      return sortedIndices.indexOf(a.props.playerIndex) - sortedIndices.indexOf(b.props.playerIndex);
    });
  }, [rows, sortedIndices])

  return (
    <Table celled color='orange' sortable>
      <Header>
        <Row className='H5'>
          <HeaderCell width={1} className='Important'>#</HeaderCell>
          <HeaderCell className='Important' sorted={sortColumn === 'timestamp' ? sortDirection : null} onClick={() => _sort('timestamp')}>
            Registered ({playerAddresses.length})
          </HeaderCell>
          <HeaderCell className='Important'>Address</HeaderCell>
          <HeaderCell className='Important'></HeaderCell>
          <HeaderCell className='Important' sorted={sortColumn === 'username' ? sortDirection : null} onClick={() => _sort('username')}>
            Username
          </HeaderCell>
          <HeaderCell className='Important' sorted={sortColumn === 'discord' ? sortDirection : null} onClick={() => _sort('discord')}>
            Discord
          </HeaderCell>
          <HeaderCell className='Important' sorted={sortColumn === 'duelists' ? sortDirection : null} onClick={() => _sort('duelists')}>
            Alive Duelists
          </HeaderCell>
          <HeaderCell className='Important' sorted={sortColumn === 'lords' ? sortDirection : null} onClick={() => _sort('lords')}>
            $LORDS
          </HeaderCell>
          <HeaderCell className='Important' sorted={sortColumn === 'fools' ? sortDirection : null} onClick={() => _sort('fools')}>
            $FOOLS
          </HeaderCell>
        </Row>
      </Header>
      <Body>
        {sortedRows}
      </Body>
    </Table>
  );
}

function PlayerRow({
  address,
  playerIndex,
  sequentialOrder,
  setRowData,
}: {
  address: BigNumberish,
  playerIndex: number,
  sequentialOrder: number,
  setRowData: (playerIndex: number, data: any) => void,
}) {
  const { username, timestampRegistered, aliveDuelistCount } = usePlayer(address)
  const stateLords = useLordsCoinStore((state) => state)
  const stateFools = useFoolsCoinStore((state) => state)
  const lordsBalance = useMemo(() => stateLords.getBalance(address), [stateLords.accounts, address])
  const foolsBalance = useMemo(() => stateFools.getBalance(address), [stateFools.accounts, address])
  const { userName } = useDiscordSocialLink(address)
  useEffect(() => {
    setRowData(playerIndex, {
      playerIndex,
      username,
      discord: userName,
      timestamp: timestampRegistered,
      aliveDuelistCount,
      address,
      lordsBalance: Number(weiToEth(lordsBalance ?? 0n)),
      foolsBalance: Number(weiToEth(foolsBalance ?? 0n)),
    });
  }, [playerIndex, username, timestampRegistered, aliveDuelistCount, address]);
  return (
    <Row className='Number Smaller'>
      <Cell>
        {sequentialOrder}
      </Cell>
      <Cell>
        {formatTimestampLocal(timestampRegistered)}
      </Cell>
      <Cell>
        <Address address={address} />
      </Cell>
      <Cell>
        <ExplorerLink address={address} voyager />
      </Cell>
      <Cell>
        {username === undefined ? '...' : (username || '?')}
      </Cell>
      <Cell>
        {userName || '...'}
      </Cell>
      <Cell>
        {aliveDuelistCount}
      </Cell>
      <Cell>
        {<Balance lords wei={lordsBalance} />}
      </Cell>
      <Cell>
        {<Balance fools wei={foolsBalance} />}
      </Cell>
    </Row>
  )
}

