import React from 'react'
import { Container, Table } from 'semantic-ui-react'
import { ExplorerLink } from '@underware/pistols-sdk/starknet/components'
import { useConfig } from '/src/stores/configStore'
import { Address } from '/src/components/ui/Address'
import { LordsBalance } from '/src/components/account/LordsBalance'
import { EntityStoreSync } from '/src/stores/sync/EntityStoreSync'
import { InternalPageMenu } from '/src/pages/internal/InternalPageIndex'
// import { AdminPanel } from '/src/components/admin/AdminPanel'
import { Connect } from '/src/pages/tests/ConnectTestPage'
import CurrentChainHint from '/src/components/CurrentChainHint'
import AppDojo from '/src/components/AppDojo'

// const Row = Grid.Row
// const Col = Grid.Column
const Row = Table.Row
const Cell = Table.Cell
const Body = Table.Body
const Header = Table.Header
const HeaderCell = Table.HeaderCell


export default function AdminPage() {
  return (
    <AppDojo>
      <Container>
        <InternalPageMenu />
        <CurrentChainHint />
        <Connect />

        {/* <AdminPanel /> */}
        <Config />

        <EntityStoreSync />
      </Container>
    </AppDojo>
  );
}


function Config() {
  const { isPaused, currentSeasonId, treasuryAddress, vrfAddress, lordsAddress  } = useConfig()

  return (
    <Table celled striped size='small' color='orange'>
      <Header>
        <Row>
          <HeaderCell width={4}><h3>Config</h3></HeaderCell>
          <HeaderCell></HeaderCell>
          <HeaderCell></HeaderCell>
          <HeaderCell></HeaderCell>
        </Row>
      </Header>
      <Body className='H5 Code'>
        <Row>
          <Cell className='Important'>isPaused</Cell>
          <Cell textAlign='left'>
            {isPaused ? 'true' : 'false'}
          </Cell>
          <Cell></Cell>
          <Cell></Cell>
        </Row>
        <Row>
          <Cell className='Important'>currentSeasonId</Cell>
          <Cell textAlign='left'>
            {currentSeasonId}
          </Cell>
          <Cell></Cell>
          <Cell></Cell>
        </Row>
        <Row>
          <Cell className='Important'>Treasury</Cell>
          <Cell>
            <Address address={treasuryAddress} full />
          </Cell>
          <Cell className='Smaller'>
            <ExplorerLink address={treasuryAddress} voyager />
          </Cell>
          <Cell>
            <LordsBalance address={treasuryAddress} size='big' decimals={3} />
          </Cell>
        </Row>
        <Row>
          <Cell className='Important'>vrfAddress</Cell>
          <Cell>
            <Address address={vrfAddress} full />
          </Cell>
          <Cell className='Smaller'>
            <ExplorerLink address={vrfAddress} voyager />
          </Cell>
          <Cell></Cell>
        </Row>
        <Row>
          <Cell className='Important'>lordsAddress</Cell>
          <Cell>
            <Address address={lordsAddress} full />
          </Cell>
          <Cell className='Smaller'>
            <ExplorerLink address={lordsAddress} voyager />
          </Cell>
          <Cell></Cell>
        </Row>
      </Body>
    </Table>
  )
}
