import React, { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { Container, Table } from 'semantic-ui-react'
import { contractPolicyDescriptions_pistols } from '@underware/pistols-sdk/pistols/dojo'
import { useDojoSystem } from '@underware/pistols-sdk/dojo'
import { isPositiveBigint } from '@underware/pistols-sdk/utils'
import { ExplorerLink } from '@underware/pistols-sdk/starknet/components'
import { Address } from '/src/components/ui/Address'
import AppDojo from '/src/components/AppDojo'

const Row = Table.Row
const Cell = Table.Cell
const Body = Table.Body
const Header = Table.Header
const HeaderCell = Table.HeaderCell

export default function ContractsPage() {
  return (
    <AppDojo backgroundImage={null}>
      <Container>
        <h1>Pistols at Dawn Contracts</h1>
        <Contracts />
      </Container>
    </AppDojo>
  );
}

function Contracts() {
  const {
    mainContracts,
    tokenContracts,
    coinContracts,
  } = useMemo(() => {
    const mainContracts: string[] = [];
    const tokenContracts: string[] = [];
    const coinContracts: string[] = [];
    for (const [name, desc] of Object.entries(contractPolicyDescriptions_pistols)) {
      if (desc.name.includes('token')) {
        tokenContracts.push(name);
      } else if (desc.name.includes('coin')) {
        coinContracts.push(name);
      } else {
        mainContracts.push(name);
      }
    }
    return {
      mainContracts,
      tokenContracts,
      coinContracts,
    }
  }, []);
  return (
    <>
      <ContractGroup contracts={mainContracts} title='Game' />
      <ContractGroup contracts={tokenContracts} title='ERC-721' />
      <ContractGroup contracts={coinContracts} title='ERC-20' />
    </>
  )
}

function ContractGroup({
  contracts,
  title,
}: {
  contracts: string[]
  title: string
}) {
  return (
    <>
      <Table>
        <Header>
          <Row className='ModalText Important'>
            <HeaderCell width={2}>{title}</HeaderCell>
            <HeaderCell width={2}></HeaderCell>
            <HeaderCell width={4}></HeaderCell>
            <HeaderCell width={1}></HeaderCell>
            <HeaderCell width={1}></HeaderCell>
            <HeaderCell width={1}></HeaderCell>
          </Row>
        </Header>
        <Body className='Smaller'>
          {contracts.map((name) => (
            <ContractRow key={name} name={name} />
          ))}
        </Body>
      </Table>
    </>
  )
}

function ContractRow({
  name,
  address,
  description,
  lordsBalance = false,
  foolsBalance = false,
  fameBalance = false,
}: {
  name: string,
  address?: BigNumberish,
  description?: string,
  lordsBalance?: boolean,
  foolsBalance?: boolean,
  fameBalance?: boolean,
}) {
  const { contractAddress } = useDojoSystem(name)
  const _address = address ?? contractAddress
  const _description = description ?? contractPolicyDescriptions_pistols[name]?.description
  if (!isPositiveBigint(_address)) {
    return null;
  }
  return (
    <Row className='H5'>
      <Cell>
        {name}
      </Cell>
      <Cell>
        {isPositiveBigint(_address)
          ? <Address address={_address} full={false} />
          : <>Not deployed yet</>
        }
      </Cell>
      <Cell>
        {`Pistols at Dawn ${_description}`}
      </Cell>
      <Cell>
        <ExplorerLink address={_address} voyager />
      </Cell>
      <Cell>
        <ExplorerLink address={_address} starkscan />
      </Cell>
      <Cell>
        <ExplorerLink address={_address} cartridge />
      </Cell>
    </Row>
  )
}
