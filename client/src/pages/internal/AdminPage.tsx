import React, { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { Container, Table } from 'semantic-ui-react'
import { getAdminAddress, getBankAddress, getGameAddress, getWorldAddress } from '@underware/pistols-sdk/pistols/config'
import { useStarknetContext } from '@underware/pistols-sdk/dojo'
import { useTokenContracts } from '/src/hooks/useTokenContracts'
import { ExplorerLink } from '@underware/pistols-sdk/starknet/components'
import { useConfig } from '/src/stores/configStore'
import { Address } from '/src/components/ui/Address'
import { LordsBalance } from '/src/components/account/LordsBalance'
import { EntityStoreSync } from '/src/stores/sync/EntityStoreSync'
import { InternalPageMenu, InternalPageWrapper } from '/src/pages/internal/InternalPageIndex'
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
        <EntityStoreSync />

        <InternalPageWrapper>
          {/* <AdminPanel /> */}
          <Config />
          <Contracts />
          <br />
          <EntityStoreSync />
        </InternalPageWrapper>
        
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
          <HeaderCell width={3}><h3>Config</h3></HeaderCell>
          <HeaderCell></HeaderCell>
          <HeaderCell></HeaderCell>
          <HeaderCell></HeaderCell>
        </Row>
      </Header>
      <Body className='Code'>
        <Row className='H5'>
          <Cell className='Important'>isPaused</Cell>
          <Cell textAlign='left'>
            {isPaused ? 'true' : 'false'}
          </Cell>
          <Cell></Cell>
          <Cell></Cell>
        </Row>
        <Row className='H5'>
          <Cell className='Important'>currentSeasonId</Cell>
          <Cell textAlign='left'>
            {currentSeasonId}
          </Cell>
          <Cell></Cell>
          <Cell></Cell>
        </Row>
        <Row className='H5'>
          <Cell className='Important'>Treasury</Cell>
          <Cell>
            <Address address={treasuryAddress} full />
          </Cell>
          <Cell className='Smaller'>
            <ExplorerLink address={treasuryAddress} voyager />
          </Cell>
          <Cell>
            <LordsBalance address={treasuryAddress} decimals={3} />
          </Cell>
        </Row>
        <Row className='H5'>
          <Cell className='Important'>vrfAddress</Cell>
          <Cell>
            <Address address={vrfAddress} full />
          </Cell>
          <Cell className='Smaller'>
            <ExplorerLink address={vrfAddress} voyager />
          </Cell>
          <Cell></Cell>
        </Row>
        <Row className='H5'>
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


function Contracts() {
  const { selectedNetworkId } = useStarknetContext()
  const worldContractAddress = useMemo(() => getWorldAddress(selectedNetworkId), [selectedNetworkId])
  const gameContractAddress = useMemo(() => getGameAddress(selectedNetworkId), [selectedNetworkId])
  const adminContractAddress = useMemo(() => getAdminAddress(selectedNetworkId), [selectedNetworkId])
  const bankContractAddress = useMemo(() => getBankAddress(selectedNetworkId), [selectedNetworkId])
  
  const {
    // lordsContractAddress,
    fameContractAddress,
    foolsContractAddress,
    duelistContractAddress,
    duelContractAddress,
    packContractAddress,
    tournamentContractAddress,
  } = useTokenContracts()

  return (
    <Table celled striped size='small' color='orange'>
      <Header>
        <Row className='H5'>
          <HeaderCell width={3}><h3>Contracts</h3></HeaderCell>
          <HeaderCell></HeaderCell>
          <HeaderCell></HeaderCell>
          <HeaderCell></HeaderCell>
          <HeaderCell></HeaderCell>
          <HeaderCell></HeaderCell>
        </Row>
      </Header>
      <Body className='H5 Code'>
        <ContractRow name='World' address={worldContractAddress} />
        <ContractRow name='Game' address={gameContractAddress} />
        <ContractRow name='Admin' address={adminContractAddress} />
        <ContractRow name='Bank' address={bankContractAddress} />
      </Body>
      <Header>
        <Row className='H5'>
          <HeaderCell width={3}><h3>ERC-20</h3></HeaderCell>
          <HeaderCell></HeaderCell>
          <HeaderCell></HeaderCell>
          <HeaderCell></HeaderCell>
          <HeaderCell></HeaderCell>
          <HeaderCell></HeaderCell>
        </Row>
      </Header>
      <Body className='H5 Code'>
        <ContractRow name='Fame' address={fameContractAddress} />
        <ContractRow name='Fools' address={foolsContractAddress} />
      </Body>
      <Header>
        <Row className='H5'>
          <HeaderCell width={3}><h3>ERC-721</h3></HeaderCell>
          <HeaderCell></HeaderCell>
          <HeaderCell></HeaderCell>
          <HeaderCell></HeaderCell>
          <HeaderCell></HeaderCell>
          <HeaderCell></HeaderCell>
        </Row>
      </Header>
      <Body className='H5 Code'>
        <ContractRow name='Duels' address={duelContractAddress} />
        <ContractRow name='Duelists' address={duelistContractAddress} />
        <ContractRow name='Packs' address={packContractAddress} />
        <ContractRow name='Tournaments' address={tournamentContractAddress} />
      </Body>
    </Table>
  )
}

function ContractRow({
  name,
  address,
  short = false,
}: {
  name: string,
  address: BigNumberish,
  short?: boolean,
}) {
  return (
    <Row className='H5'>
      <Cell>
        {name}
      </Cell>
      <Cell>
        <Address address={address} full={!short} />
      </Cell>
      <Cell className='Smaller'>
        <ExplorerLink address={address} cartridge />
      </Cell>
      <Cell className='Smaller'>
        <ExplorerLink address={address} voyager />
      </Cell>
      <Cell className='Smaller'>
        <ExplorerLink address={address} starkscan />
      </Cell>
      <Cell className='Smaller'>
        <ExplorerLink address={address} viewblock />
      </Cell>
    </Row>
  )
}
