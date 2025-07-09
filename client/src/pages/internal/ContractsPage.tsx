import React, { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { Container, Table } from 'semantic-ui-react'
import { getWorldAddress } from '@underware/pistols-sdk/pistols/config'
import { contractPolicyDescriptions_pistols } from '@underware/pistols-sdk/pistols/dojo'
import { useDojoSystem, useDojoSetup } from '@underware/pistols-sdk/dojo'
import { isPositiveBigint } from '@underware/pistols-sdk/utils'
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
  const { selectedNetworkId } = useDojoSetup()
  const worldContractAddress = useMemo(() => getWorldAddress(selectedNetworkId), [selectedNetworkId])

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
          <HeaderCell></HeaderCell>
          <HeaderCell></HeaderCell>
        </Row>
      </Header>
      <Body className='H5 Code'>
        <ContractRow name='world' address={worldContractAddress} description='Dojo world contract' />
        <ContractRow name='game' />
        <ContractRow name='game_loop' />
        <ContractRow name='tutorial' />
        <ContractRow name='admin' />
        <ContractRow name='bank' />
      </Body>
      <Header>
        <Row className='H5'>
          <HeaderCell width={1}><h3>ERC-20</h3></HeaderCell>
          <HeaderCell></HeaderCell>
          <HeaderCell></HeaderCell>
          <HeaderCell></HeaderCell>
          <HeaderCell></HeaderCell>
          <HeaderCell></HeaderCell>
          <HeaderCell></HeaderCell>
          <HeaderCell></HeaderCell>
        </Row>
      </Header>
      <Body className='H5 Code'>
        <ContractRow name='fame_coin' />
        <ContractRow name='fools_coin' />
      </Body>
      <Header>
        <Row className='H5'>
          <HeaderCell width={1}><h3>ERC-721</h3></HeaderCell>
          <HeaderCell></HeaderCell>
          <HeaderCell></HeaderCell>
          <HeaderCell></HeaderCell>
          <HeaderCell></HeaderCell>
          <HeaderCell></HeaderCell>
          <HeaderCell></HeaderCell>
          <HeaderCell></HeaderCell>
        </Row>
      </Header>
      <Body className='H5 Code'>
        <ContractRow name='duel_token' />
        <ContractRow name='duelist_token' />
        <ContractRow name='pack_token' />
        <ContractRow name='ring_token' />
        <ContractRow name='tournament_token' />
      </Body>
    </Table>
  )
}

function ContractRow({
  name,
  address,
  description,
}: {
  name: string,
  address?: BigNumberish,
  description?: string,
}) {
  const { contractAddress } = useDojoSystem(name)
  const _address = address ?? contractAddress
  const _description = description ?? contractPolicyDescriptions_pistols[name]?.description
  return (
    <Row className='H5'>
      <Cell>
        {name}
      </Cell>
      <Cell className='Smaller'>
        {isPositiveBigint(_address)
          ? <Address address={_address} full={false} />
          : <>Not deployed yet</>
        }
      </Cell>
      <Cell className='Smaller'>
        {`Pistols at Dawn ${_description}`}
      </Cell>
      <Cell>
        <ExplorerLink address={_address} cartridge />
      </Cell>
      <Cell>
        <ExplorerLink address={_address} voyager />
      </Cell>
      <Cell>
        <ExplorerLink address={_address} starkscan />
      </Cell>
      <Cell>
        <ExplorerLink address={_address} viewblock />
      </Cell>
    </Row>
  )
}
