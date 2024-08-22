import React, { useEffect, useMemo } from 'react'
import { Container, Table, Button, Image } from 'semantic-ui-react'
import { ArraySignatureType, TypedData } from 'starknet'
import { useAccount, useDisconnect } from '@starknet-react/core'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { useDojoStatus } from '@/lib/dojo/DojoContext'
import { useSelectedChain } from '@/lib/dojo/hooks/useChain'
import { useSignTypedMessage, useTypedMessage, useVerifyMessagesOffChain, useVerifyMessagesOnChain } from '@/lib/utils/hooks/useTypedMessage'
import { feltToString } from '@/lib/utils/starknet'
import { bigintToHex, shortAddress } from '@/lib/utils/types'
import { DojoStatus } from '@/lib/dojo/DojoStatus'
import { ChainSwitcher } from '@/lib/dojo/ChainSwitcher'
import { Messages } from '@/lib/utils/starknet_sign'
import StarknetConnectModal from '@/lib/dojo/StarknetConnectModal'
import App from '@/lib/ui/App'

//@ts-ignore
BigInt.prototype.toJSON = function () { return bigintToHex(this) }

// const Row = Grid.Row
// const Col = Grid.Column
const Row = Table.Row
const Cell = Table.Cell
const Body = Table.Body
const Header = Table.Header
const HeaderCell = Table.HeaderCell

export default function IndexPage() {
  return (
    <App>
      <Container>
        <DojoAccount />
        <Connect />
        <SignV0 />
        <SignV1 />
      </Container>
    </App>
  );
}


function DojoAccount() {
  const { isInitialized } = useDojoStatus()
  const { address } = useAccount()
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
          <Cell>Dojo.account</Cell>
          <Cell className='Code'>
            {address ?? 'none'}
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

      <ChainSwitcher />
      &nbsp;&nbsp;
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


function SignV0() {
  const { account, isConnected, chainId } = useAccount()

  const messages: Messages = useMemo(() => ({
    game: 'PISTOLS_AT_10_BLOCKS',
    purpose: 'SIGN_V0_TEST',
  }), [])
  const { typedMessage, messageHash } = useTypedMessage({
    revision: 0,
    messages,
    chainId,
    account,
  })
  const { sign, signAsync, isSigning, rawSignature, signaturePair } = useSignTypedMessage(typedMessage)
  const { isVerified, formatted } = useVerifyMessagesOffChain(account, typedMessage, rawSignature)
  useEffect(() => console.log(`SignV0`, isSigning, rawSignature, signaturePair, '>>>>>', isVerified), [isSigning, rawSignature, signaturePair, isVerified])

  return (
    <>
      <Button disabled={!isConnected || isSigning} onClick={() => sign()}>Sign V0</Button>
      <Sign
        messages={messages}
        typedMessage={typedMessage}
        messageHash={messageHash}
        rawSignature={rawSignature}
        signaturePair={signaturePair}
        verified={formatted}
      />
    </>
  )
}

function SignV1() {
  const { account, isConnected, chainId } = useAccount()

  const messages: Messages = useMemo(() => ({
    game: 'PISTOLS_AT_10_BLOCKS',
    purpose: 'SIGN_V1_TEST',
  }), [])
  const { typedMessage, messageHash } = useTypedMessage({
    account,
    revision: 1,
    chainId,
    messages,
  })
  const { sign, signAsync, isSigning, rawSignature, signaturePair } = useSignTypedMessage(typedMessage)
  const { isVerified, formatted } = useVerifyMessagesOnChain(account, typedMessage, rawSignature)
  useEffect(() => console.log(`SignV1`, isSigning, rawSignature, signaturePair, '>>>>>', isVerified, typedMessage), [isSigning, rawSignature, signaturePair, isVerified])

  // useEffect(() => console.log(`typedMessage/hash/data:`, typedMessage, hash, rawSignature), [typedMessage, hash, rawSignature])

  return (
    <>
      <Button disabled={!isConnected || isSigning} onClick={() => sign()}>Sign V1</Button>
      <Sign
        messages={messages}
        typedMessage={typedMessage}
        messageHash={messageHash}
        rawSignature={rawSignature}
        signaturePair={signaturePair}
        verified={formatted}
      />
    </>
  )
}


function Sign({
  messages,
  typedMessage,
  messageHash,
  rawSignature,
  signaturePair,
  verified,
}: {
  messages: Messages
  typedMessage: TypedData
  messageHash: string
  rawSignature: ArraySignatureType
  signaturePair: bigint[]
  verified: string
}) {
  return (
    <Table celled striped size='small' color={verified == 'true' ? 'green' : verified == 'false' ? 'red' : 'orange'}>
      <Body>
        <Row columns={'equal'} verticalAlign='top'>
          <Cell>
            Message
          </Cell>
          <Cell className='Code'>
            {Object.keys(messages).map((k, i) => <React.Fragment key={k}>{k}:{(messages[k] as string)}<br /></React.Fragment>)}
          </Cell>
        </Row>

        <Row columns={'equal'} verticalAlign='top'>
          <Cell className='Code'>
            Typed Data
          </Cell>
          <Cell className='Code'>
            {JSON.stringify(typedMessage)}
          </Cell>
        </Row>

        <Row columns={'equal'} verticalAlign='top'>
          <Cell>
            Hash
          </Cell>
          <Cell className='Code'>
            {/* {shortAddress(bigintToHex(hash))} */}
            {bigintToHex(messageHash)}
          </Cell>
        </Row>

        <Row columns={'equal'} verticalAlign='top'>
          <Cell>
            Signature
          </Cell>
          <Cell className='Code'>
            {/* {signature ?? <>?</>} */}
            {JSON.stringify(rawSignature ?? {})}
          </Cell>
        </Row>

        <Row columns={'equal'} verticalAlign='top'>
          <Cell>
            Signature (r,s)
          </Cell>
          <Cell className='Code'>
            {signaturePair ? <>
              r:{shortAddress(bigintToHex(signaturePair[0]))}<br />
              s:{shortAddress(bigintToHex(signaturePair[1]))}<br />
            </> : <>?</>}
          </Cell>
        </Row>

        <Row columns={'equal'} verticalAlign='top'>
          <Cell>
            Verified
          </Cell>
          <Cell className='Code'>
            {verified}
          </Cell>
        </Row>

      </Body>
    </Table>
  )
}
