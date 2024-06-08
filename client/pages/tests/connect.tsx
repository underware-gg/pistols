import React, { useEffect, useMemo, useState } from 'react'
import { Container, Table, Button, Image } from 'semantic-ui-react'
import { ArraySignatureType, typedData } from 'starknet'
import { useAccount, useDisconnect, useSignTypedData } from '@starknet-react/core'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { useDojoAccount, useDojoStatus } from '@/lib/dojo/DojoContext'
import { useSelectedChain } from '@/lib/dojo/hooks/useChain'
import { feltToString } from '@/lib/utils/starknet'
import { bigintToHex, shortAddress } from '@/lib/utils/types'
import { Messages, createTypedMessage } from '@/lib/utils/starknet_sign'
import { makeDojoAppConfig } from '@/games/pistols/config'
import { DojoStatus } from '@/lib/dojo/DojoStatus'
import StarknetConnectModal from '@/lib/dojo/StarknetConnectModal'
import AppDojo from '@/lib/ui/AppDojo'

// const Row = Grid.Row
// const Col = Grid.Column
const Row = Table.Row
const Cell = Table.Cell
const Body = Table.Body
const Header = Table.Header
const HeaderCell = Table.HeaderCell

export default function IndexPage() {
  return (
    <AppDojo dojoAppConfig={makeDojoAppConfig()}>
      <Container>
        <DojoAccount />
        <Connect />
        <Sign />
      </Container>
    </AppDojo>
  );
}


function DojoAccount() {
  const { isInitialized } = useDojoStatus()
  const { account, masterAccount, isGuest } = useDojoAccount()
  const { selectedChainConfig } = useSelectedChain()

  if (!isInitialized) {
    return <DojoStatus message={'Loading Pistols...'} />
  }

  return (
    <Table celled striped color='orange' size='small'>
      {/* <Header>
        <Row>
          <HeaderCell width={4}><h5>Wager</h5></HeaderCell>
          <HeaderCell>{bigintToHex(duelId)}</HeaderCell>
        </Row>
      </Header> */}

      <Body>
        <Row>
          <Cell>process.env.NODE_ENV</Cell>
          <Cell className='Code Important'>
            {process.env.NODE_ENV}
          </Cell>
        </Row>
        <Row>
          <Cell>NEXT_PUBLIC_MASTER_ADDRESS</Cell>
          <Cell className='Code'>
            {selectedChainConfig.masterAddress}
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
            {account?.address ?? 'none'}
          </Cell>
        </Row>
        <Row>
          <Cell>isGuest</Cell>
          <Cell className='Code Important'>
            {isGuest ? 'true' : 'false'}
          </Cell>
        </Row>
      </Body>
    </Table>
  )
}


function Connect() {
  const { address, isConnecting, isConnected, connector, chainId } = useAccount()
  const { disconnect } = useDisconnect()
  const { connectOpener } = usePistolsContext()
  return (
    <>
      <StarknetConnectModal opener={connectOpener} />

      <Button disabled={isConnected || isConnecting} onClick={() => connectOpener.open()}>Connect</Button>
      &nbsp;&nbsp;
      <Button disabled={!isConnected || isConnecting} onClick={() => disconnect()}>Disconnect</Button>

      <Table celled striped color={isConnected ? 'green' : 'red'} size='small'>
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
                <Image className='ProfilePicSmall' spaced src={connector.icon.dark} /> {connector.name}
              </>}

            </Cell>
          </Row>
          <Row>
            <Cell>Chain Id</Cell>
            <Cell className='Code'>
              {chainId && <>
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


function Sign() {
  const { account, isConnected, chainId } = useAccount()

  const messages: Messages = { game: 'PISTOLS_AT_10_BLOCKS', purpose: 'DUELIST_ACCOUNT' }
  const typedMessage = useMemo(() => (createTypedMessage({
    chainId: chainId ? feltToString(chainId) : undefined,
    messages,
  })), [chainId, messages])
  const hash = useMemo(() => (account ? typedData.getMessageHash(typedMessage, account.address) : null), [account, typedMessage])

  const { data, signTypedData, signTypedDataAsync, isPending } = useSignTypedData(typedMessage)

  const signature = useMemo(() => (data as ArraySignatureType ?? null), [data])

  const [verifyied, setVerifyed] = useState('?')
  useEffect(() => {
    const _verify = async () => {
      const _v = await account.verifyMessage(typedMessage, signature)
      setVerifyed(_v ? 'true' : 'false')
    }
    if (account && signature) {
      setVerifyed('...')
      _verify()
    } else {
      setVerifyed('?')
    }
  }, [account, typedMessage, signature])

  return (
    <>
      <Button disabled={!isConnected || isPending} onClick={() => signTypedData()}>Sign</Button>

      <Table celled striped size='small' color={verifyied == 'true' ? 'green' : verifyied == 'false' ? 'red' : 'orange'}>
        <Header>
          <Row>
            <HeaderCell><h5>Messages</h5></HeaderCell>
            <HeaderCell><h5>Validated</h5></HeaderCell>
            <HeaderCell><h5>Signature</h5></HeaderCell>
            <HeaderCell><h5>Typed Data</h5></HeaderCell>
          </Row>
        </Header>

        <Body>
          <Row columns={'equal'} verticalAlign='top'>
            <Cell className='Code'>
              {Object.keys(messages).map((k, i) => <React.Fragment key={k}>{k}:{shortAddress(messages[k])}<br /></React.Fragment>)}
              hash:{shortAddress(bigintToHex(hash))}
            </Cell>
            <Cell className='Code'>
              {verifyied}
            </Cell>
            <Cell className='Code'>
              {signature && <>
                r:{shortAddress(bigintToHex(signature[0]))}<br />
                s:{shortAddress(bigintToHex(signature[1]))}<br />
              </>}
            </Cell>
            <Cell className='Code'>
              {JSON.stringify(typedMessage)}
            </Cell>
          </Row>
        </Body>

      </Table>
    </>
  )
}
