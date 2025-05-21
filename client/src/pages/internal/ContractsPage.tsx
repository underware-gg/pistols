import React, { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { Container, Table } from 'semantic-ui-react'
import { getAdminAddress, getBankAddress, getGameAddress, getWorldAddress } from '@underware/pistols-sdk/pistols/config'
import { useStarknetContext } from '@underware/pistols-sdk/dojo'
import { useTokenContracts } from '/src/hooks/useTokenContracts'
import { ExplorerLink } from '@underware/pistols-sdk/starknet/components'
import { Address } from '/src/components/ui/Address'
import { Connect } from '/src/pages/tests/ConnectTestPage'
import { InternalPageMenu } from '/src/pages/internal/InternalPageIndex'
import CurrentChainHint from '/src/components/CurrentChainHint'
import AppDojo from '/src/components/AppDojo'

// const Row = Grid.Row
// const Col = Grid.Column
const Row = Table.Row
const Cell = Table.Cell
const Body = Table.Body
const Header = Table.Header
const HeaderCell = Table.HeaderCell


export default function ContractsPage() {
  return (
    <AppDojo>
      <Container>
        <InternalPageMenu />
        <CurrentChainHint />
        <Connect />

        <Contracts />

      </Container>
    </AppDojo>
  );
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
          <HeaderCell width={1}><h3>Contracts</h3></HeaderCell>
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
          <HeaderCell width={1}><h3>ERC-20</h3></HeaderCell>
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
          <HeaderCell width={1}><h3>ERC-721</h3></HeaderCell>
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
  full = true,
}: {
  name: string,
  address: BigNumberish,
  full?: boolean,
}) {
  return (
    <Row className='H5'>
      <Cell>
        {name}
      </Cell>
      <Cell className='Smaller'>
        <Address address={address} full={full} />
      </Cell>
      <Cell>
        <ExplorerLink address={address} cartridge />
      </Cell>
      <Cell>
        <ExplorerLink address={address} voyager />
      </Cell>
      <Cell>
        <ExplorerLink address={address} starkscan />
      </Cell>
      <Cell>
        <ExplorerLink address={address} viewblock />
      </Cell>
    </Row>
  )
}
