import React, { useMemo } from 'react'
import { Container, Table } from 'semantic-ui-react'
import { usePlayer, usePlayerStore } from '/src/stores/playerStore'
import { EntityStoreSync } from '/src/stores/sync/EntityStoreSync'
import { PlayerNameSync } from '/src/stores/sync/PlayerNameSync'
import { InternalPageMenu, InternalPageWrapper } from '/src/pages/internal/InternalPageIndex'
import { formatTimestampLocal } from '@underware/pistols-sdk/utils'
import { ExplorerLink } from '@underware/pistols-sdk/starknet/components'
import { LordsBalance } from '/src/components/account/LordsBalance'
import { Address } from '/src/components/ui/Address'
import { Connect } from '/src/pages/tests/ConnectTestPage'
import { BigNumberish } from 'starknet'
import { useFetchAccountsBalances } from '/src/stores/coinStore'
import { useTokenContracts } from '/src/hooks/useTokenContracts'
import { useAllStoreModels } from '@underware/pistols-sdk/dojo'
import { useDelay } from '@underware/pistols-sdk/utils/hooks'
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
    <AppDojo>
      <Container>
        <InternalPageMenu />
        <CurrentChainHint />
        <Connect />

        <InternalPageWrapper>
          <Players />
        </InternalPageWrapper>

        <EntityStoreSync />
        <PlayerNameSync />
      </Container>
    </AppDojo>
  );
}

function Players() {
  const entities = usePlayerStore((state) => state.entities)
  const players = useAllStoreModels<models.Player>(entities, 'Player')

  const playerAddresses = useMemo(() => players.map((p) => p.player_address), [players])

  const { lordsContractAddress } = useTokenContracts()
  const { isFinished } = useFetchAccountsBalances(lordsContractAddress, playerAddresses, true)

  return (
    <Table celled color='orange'>
      <Header>
        <Row className='H5'>
          <HeaderCell><h3 className='Important'>Registered ({playerAddresses.length})</h3></HeaderCell>
          <HeaderCell><h3 className='Important'>Address</h3></HeaderCell>
          <HeaderCell><h3 className='Important'>Username</h3></HeaderCell>
          <HeaderCell><h3 className='Important'>Alive Duelists</h3></HeaderCell>
          <HeaderCell><h3 className='Important'></h3></HeaderCell>
          <HeaderCell><h3 className='Important'>$LORDS</h3></HeaderCell>
        </Row>
      </Header>
      <Body>
        {isFinished && playerAddresses.map(address => (
          <PlayerRow key={address} address={address} />
        ))}
      </Body>
    </Table>
  );
}

function PlayerRow({
  address,
}: {
  address: BigNumberish,
}) {
  const { username, timestampRegistered, aliveDuelistCount } = usePlayer(address)
  const ready = useDelay(true, 2000) // wait to batch fetch
  return (
    <Row className='H5 Number'>
      <Cell>
        {formatTimestampLocal(timestampRegistered)}
      </Cell>
      <Cell>
        <Address address={address} />
      </Cell>
      <Cell>
        {username === undefined ? '...' : (username || '?')}
      </Cell>
      <Cell>
        {aliveDuelistCount}
      </Cell>
      <Cell>
        <ExplorerLink address={address} voyager />
      </Cell>
      <Cell>
        {!ready ? '...' : <LordsBalance address={address} size='big' />}
      </Cell>
    </Row>
  )
}

