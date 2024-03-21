import React, { useEffect, useState } from 'react'
import { Container, Table, Button, Image } from 'semantic-ui-react'
import { useAccount, useDisconnect } from '@starknet-react/core'
import { useDojoAccount } from '@/dojo/DojoContext'
import AppDojo from '@/lib/dojo/AppDojo'
import StarknetConnectModal from '@/lib/dojo/StarknetConnectModal'
import { feltToString } from '@/lib/utils/starknet'
import { bigintToHex } from '@/lib/utils/type'
import { useOpener } from '@/lib/ui/useOpener'

// const Row = Grid.Row
// const Col = Grid.Column
const Row = Table.Row
const Cell = Table.Cell
const Body = Table.Body
const Header = Table.Header
const HeaderCell = Table.HeaderCell

export default function IndexPage() {
  return (
    <AppDojo>
      <Container text>
        <DojoAccount />

        <Connect />

      </Container>
    </AppDojo>
  );
}


function DojoAccount() {
  const { account, masterAccount, isMasterAccount } = useDojoAccount()

  return (
    <Table celled striped color='orange'>
      {/* <Header>
        <Row>
          <HeaderCell width={4}><h5>Wager</h5></HeaderCell>
          <HeaderCell>{bigintToHex(duelId)}</HeaderCell>
        </Row>
      </Header> */}

      <Body>
        <Row>
          <Cell>MASTER_ADDRESS</Cell>
          <Cell className='Code'>
            {process.env.NEXT_PUBLIC_MASTER_ADDRESS}
          </Cell>
        </Row>
        <Row>
          <Cell>Dojo.masterAccount</Cell>
          <Cell className='Code'>
            {masterAccount.address}
          </Cell>
        </Row>
        <Row>
          <Cell>Dojo.account</Cell>
          <Cell className='Code'>
            {account.address}
          </Cell>
        </Row>
        <Row>
          <Cell>isMasterAccount</Cell>
          <Cell className='Code Important'>
            {isMasterAccount ? 'true' : 'false'}
          </Cell>
        </Row>
      </Body>
    </Table>
  )
}


function Connect() {
  const { address, isConnecting, isConnected, connector, chainId } = useAccount()
  const { disconnect } = useDisconnect()

  const opener = useOpener()

  return (
    <>
      <StarknetConnectModal opener={opener} />

      <Button disabled={isConnected || isConnecting} onClick={() => opener.open()}>Connect</Button>
      &nbsp;&nbsp;
      <Button disabled={!isConnected || isConnecting} onClick={() => disconnect()}>Disconnect</Button>

      <Table celled striped color={isConnected ? 'green' : 'red'}>
        <Body>
          <Row>
            <Cell>isConnected</Cell>
            <Cell className='Code'>
              {isConnected ? 'true' : 'false'}
            </Cell>
          </Row>
          <Row>
            <Cell>wallet</Cell>
            <Cell className='Code'>
              {connector && <>
                <Image spaced src={connector.icon.dark} /> {connector.name}
              </>}

            </Cell>
          </Row>
          <Row>
            <Cell>Chain Id</Cell>
            <Cell className='Code'>
              {isConnected && <>
                {bigintToHex(chainId)} : {feltToString(chainId)}
              </>}
            </Cell>
          </Row>
          <Row>
            <Cell>Starknet Account</Cell>
            <Cell className='Code'>
              {address}
            </Cell>
          </Row>
        </Body>
      </Table>

    </>
  )
}

