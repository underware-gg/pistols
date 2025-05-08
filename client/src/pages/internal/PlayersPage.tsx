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
import CurrentChainHint from '/src/components/CurrentChainHint'
import AppDojo from '/src/components/AppDojo'
import { BigNumberish } from 'starknet'
import { useFetchAccountsBalances } from '/src/stores/coinStore'
import { useTokenContracts } from '/src/hooks/useTokenContracts'
import { useDelay } from '@underware/pistols-sdk/utils/hooks'

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
  const players = usePlayerStore.getState().players

  const playerAddresses = useMemo(() => Object.keys(players), [players])

  const { lordsContractAddress } = useTokenContracts()
  useFetchAccountsBalances(lordsContractAddress, playerAddresses)

  return (
    <Table celled color='orange'>
      <Header>
        <Row className='H5'>
          <HeaderCell><h3 className='Important'>Registered</h3></HeaderCell>
          <HeaderCell><h3 className='Important'>Username</h3></HeaderCell>
          <HeaderCell><h3 className='Important'>Address</h3></HeaderCell>
          <HeaderCell><h3 className='Important'></h3></HeaderCell>
          <HeaderCell><h3 className='Important'>$LORDS</h3></HeaderCell>
        </Row>
      </Header>
      <Body>
        {playerAddresses.map(address => (
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
  const { isNew, username, timestampRegistered } = usePlayer(address)
  const ready = useDelay(true, 2000) // wait to batch fetch
  return (
    <Row className='H5 Number'>
      <Cell>
        {formatTimestampLocal(timestampRegistered)}
      </Cell>
      <Cell>
        {isNew ? '...' : (username || '?')}
      </Cell>
      <Cell>
        <Address address={address} full />
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

