import React, { useMemo, useState } from 'react'
import { Container, Table, Button, Image } from 'semantic-ui-react'
import { useAccount, useDisconnect, useNetwork } from '@starknet-react/core'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { useDojoStatus } from '@/lib/dojo/DojoContext'
import { useSelectedChain } from '@/lib/dojo/hooks/useChain'
import { useTypedMessage } from '@/lib/utils/hooks/useTypedMessage'
import { feltToString } from '@/lib/utils/starknet'
import { bigintToHex, shortAddress } from '@/lib/utils/types'
import { DojoStatus } from '@/lib/dojo/DojoStatus'
import { ChainSwitcher } from '@/lib/dojo/ChainSwitcher'
import { Messages, Revision, splitSignature } from '@/lib/utils/starknet_sign'
import { getConnectorIcon } from '@/lib/dojo/setup/connectors'
import StarknetConnectModal from '@/lib/dojo/StarknetConnectModal'
import App from '@/lib/ui/App'
import { useAsyncMemo } from '@/lib/utils/hooks/useAsyncMemo'

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
        {/* <Sign revision={0} /> */}
        <Sign revision={1} />
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
  const { address, isConnecting, isConnected, connector } = useAccount()
  const { chain } = useNetwork()
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
                <Image className='ProfilePicSmall' spaced src={getConnectorIcon(connector)} /> {connector.name}
              </>}

            </Cell>
          </Row>
          <Row>
            <Cell>Chain Id</Cell>
            <Cell className='Code'>
              {chain && <>
                {bigintToHex(chain.id)} : {feltToString(chain.id)}
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

function Sign({
  revision,
}: {
  revision: Revision
}) {
  const { account, isConnected } = useAccount()
  const { chain } = useNetwork()

  const messages: Messages = useMemo(() => ({
    game: 'PISTOLS_AT_10_BLOCKS',
    purpose: `SIGN_V${revision}_TEST`,
  }), [])
  const { typedMessage, messageHash, typeHash } = useTypedMessage({
    account,
    revision,
    chainId: chain.id,
    messages,
  })

  const [isSigning, setIsSigning] = useState<boolean>(false)
  const [signature, setSignature] = useState<string[]>([])
  const signaturePair = useMemo(() => signature?.length == 2 ? splitSignature(signature) : null, [signature])

  const _sign = async () => {
    console.log(`SIGN message:`, typedMessage)
    setIsSigning(true)
    setSignature([])
    const signature = (await account.signMessage(typedMessage)) as string[];
    setSignature(signature ?? [])
    setIsSigning(false)
  }

  const { value: isVerified } = useAsyncMemo(async () => {
    if (!signature || signature.length == 0) return undefined
    console.log(`V${revision} verifying...`)
    const result = await account.verifyMessage(typedMessage, signature)
    console.log(`V${revision} verifyed:`, result)
    return result
  }, [signature, typedMessage], undefined, false)

  return (
    <>
      <Button disabled={!isConnected || isSigning} onClick={() => _sign()}>Sign V{revision}</Button>
      <Table celled striped size='small' color={isVerified == true ? 'green' : isVerified === false ? 'red' : 'orange'}>
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
              Type Hash
            </Cell>
            <Cell className='Code'>
              {bigintToHex(typeHash)}
            </Cell>
          </Row>

          <Row columns={'equal'} verticalAlign='top'>
            <Cell>
              Message Hash
            </Cell>
            <Cell className='Code'>
              {bigintToHex(messageHash)}
            </Cell>
          </Row>

          <Row columns={'equal'} verticalAlign='top'>
            <Cell>
              Signature
            </Cell>
            <Cell className='Code'>
              {/* {signature ?? <>?</>} */}
              ({signature.length}) {JSON.stringify(signature, null, ' ')}
            </Cell>
          </Row>

          <Row columns={'equal'} verticalAlign='top'>
            <Cell>
              Signature Pair
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
              {isVerified === true ? 'true' : isVerified === false ? 'false' : 'unknown'}
            </Cell>
          </Row>

        </Body>
      </Table>
    </>
  )
}
