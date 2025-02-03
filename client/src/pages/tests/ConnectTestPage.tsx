import React, { useMemo, useState } from 'react'
import { EthSigner, Signature } from 'starknet'
import { Container, Table, Button, Image } from 'semantic-ui-react'
import { useAccount, useConnect, useDisconnect, useNetwork } from '@starknet-react/core'
import { usePistolsContext } from '/src/hooks/PistolsContext'
import { useDojoSetup, useStarknetContext, getConnectorIcon } from '@underware_gg/pistols-sdk/dojo'
import { useTypedMessage, useAsyncMemo } from '@underware_gg/pistols-sdk/utils/hooks'
import { Messages, Revision, splitSignature, feltToString, bigintToHex, shortAddress } from '@underware_gg/pistols-sdk/utils'
import { TestPageMenu } from '/src/pages/tests/TestPageIndex'
import StarknetConnectModal from '/src/components/starknet/StarknetConnectModal'
import CurrentChainHint from '/src/components/CurrentChainHint'
import AppDojo from '/src/components/AppDojo'

//@ts-ignore
BigInt.prototype.toJSON = function () { return bigintToHex(this) }

// const Row = Grid.Row
// const Col = Grid.Column
const Row = Table.Row
const Cell = Table.Cell
const Body = Table.Body
const Header = Table.Header
const HeaderCell = Table.HeaderCell

export default function ConnectTestPage() {
  return (
    <AppDojo>
      <Container>
        <TestPageMenu />
        <CurrentChainHint />
        {/* <DojoAccount /> */}
        <Connect />
        {/* <Sign revision={0} /> */}
        <Sign revision={1} />
        <EthSign />
      </Container>
    </AppDojo>
  );
}


export function DojoAccount() {
  const { address } = useAccount()
  const { selectedNetworkConfig } = useStarknetContext()

  return (
    <Table celled striped color='orange' size='small'>
      <Body>
        <Row>
          <Cell>import.meta.env.NODE_ENV</Cell>
          <Cell className='Code Important'>
            {import.meta.env.NODE_ENV}
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


export function Connect() {
  const { address, isConnecting, isConnected, connector } = useAccount()
  const { selectedNetworkConfig } = useStarknetContext()
  const { connectors } = useConnect();
  const { chain } = useNetwork()
  const { disconnect } = useDisconnect()
  const { connectOpener } = usePistolsContext()
  return (
    <>
      <StarknetConnectModal opener={connectOpener} />

      <Table celled striped color={isConnected ? 'green' : 'red'} size='small'>
        <Body className='H4'>
          <Row>
            <Cell>Network : Chain</Cell>
            <Cell className='Code Important'>
              {/* {chain && <>{bigintToHex(chain.id)} : {feltToString(chain.id)}</>} */}
              {selectedNetworkConfig.networkId}
              {' : '}
              {selectedNetworkConfig.chainId}
            </Cell>
          </Row>
          <Row>
            <Cell>Connected</Cell>
            <Cell className='Code'>
              {isConnected
                ? <span className='Important'>{feltToString(chain.id)}</span>
                : <span className='Negative'>Disconnected</span>
              }
            </Cell>
          </Row>
          <Row>
            <Cell>Connector</Cell>
            <Cell className='TitleCase'>
              {connector && <>
                <Image className='ProfilePicSmall' spaced src={getConnectorIcon(connector)} /> {connector.name}
              </>}
              {!connector && JSON.stringify(connectors.map(c => c.id))}
            </Cell>
          </Row>
          <Row className='H5'>
            <Cell>Account</Cell>
            <Cell className='Code'>
              {address}
            </Cell>
          </Row>
          <Row>
            <Cell></Cell>
            <Cell>
              {/* <ChainSwitcher /> */}
              {/* &nbsp;&nbsp; */}
              <Button disabled={isConnected || isConnecting} onClick={() => connectOpener.open()}>Connect</Button>
              &nbsp;&nbsp;
              <Button disabled={!isConnected || isConnecting} onClick={() => disconnect()}>Disconnect</Button>
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
  const { starknetDomain, dojoProvider } = useDojoSetup()

  const messages: Messages = useMemo(() => ({
    game: 'PISTOLS_AT_10_BLOCKS',
    purpose: `SIGN_V${revision}_TEST`,
  }), [])
  const { typedMessage, messageHash, typeHash } = useTypedMessage({
    account,
    starknetDomain,
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
    const result = await dojoProvider.provider.verifyMessageInStarknet(typedMessage, signature, account.address)
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
            <Cell>
              Typed Data
            </Cell>
            <Cell className='Code'>
              {JSON.stringify(typedMessage)}
            </Cell>
          </Row>

          <Row columns={'equal'} verticalAlign='top'>
            <Cell>
              Type_Hash
            </Cell>
            <Cell className='Code'>
              {bigintToHex(typeHash)}
            </Cell>
          </Row>

          <Row columns={'equal'} verticalAlign='top'>
            <Cell>
              Message_Hash
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
              Signature_Pair
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


function EthSign({
}: {
  }) {
  const { account, isConnected } = useAccount()
  const { starknetDomain } = useDojoSetup()

  const address = '0xe29882a1fcba1e7e10cad46212257fea5c752a4f9b1b1ec683c503a2cf5c8a'
  const privateKey = '0x14d6672dcb4b77ca36a887e9a11cd9d637d5012468175829e9c6e770c61642'
  const isVerified = undefined

  const messages: Messages = useMemo(() => ({
    game: 'PISTOLS_AT_10_BLOCKS',
    purpose: `ETH_SIGNER_TEST`,
  }), [])
  const { typedMessage, messageHash, typeHash } = useTypedMessage({
    account,
    starknetDomain,
    messages,
  })

  const [isSigning, setIsSigning] = useState<boolean>(false)
  const [signature, setSignature] = useState<Signature | string[]>([])

  const _sign = async () => {
    console.log(`SIGN message:`, typedMessage)
    setIsSigning(true)
    setSignature([])
    const myEthSigner = new EthSigner(privateKey)
    // const pubKey = await myEthSigner.getPubKey()
    const sig = await myEthSigner.signMessage(typedMessage, address);
    setSignature(sig)
    setIsSigning(false)
  }

  return (
    <>
      <Button disabled={!isConnected || isSigning} onClick={() => _sign()}>ETH Sign</Button>
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
            <Cell>
              Typed Data
            </Cell>
            <Cell className='Code'>
              {JSON.stringify(typedMessage, null, ' ')}
            </Cell>
          </Row>

          <Row columns={'equal'} verticalAlign='top'>
            <Cell>
              Type_Hash
            </Cell>
            <Cell className='Code'>
              {bigintToHex(typeHash)}
            </Cell>
          </Row>

          <Row columns={'equal'} verticalAlign='top'>
            <Cell>
              Message_Hash
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
              {/* ({signature.length})  */}
              {JSON.stringify(signature, null, ' ')}
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
