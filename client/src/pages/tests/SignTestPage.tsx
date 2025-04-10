import React, { useEffect, useState } from 'react'
import { AccountInterface, RpcProvider, typedData } from 'starknet'
import { Container, Table } from 'semantic-ui-react'
import { useAccount } from '@starknet-react/core'
import { useTypedMessage } from '@underware/pistols-sdk/utils/hooks'
import { Messages, createTypedMessage } from '@underware/pistols-sdk/utils/starknet'
import { bigintToHex, shortAddress } from '@underware/pistols-sdk/utils'
import { useDojoSetup } from '@underware/pistols-sdk/dojo'
import { constants } from '@underware/pistols-sdk/pistols/gen'
import { TestPageMenu } from '/src/pages/tests/TestPageIndex'
import CurrentChainHint from '/src/components/CurrentChainHint'
import AppDojo from '/src/components/AppDojo'

//@ts-ignore
BigInt.prototype.toJSON = function () { return bigintToHex(this) }

const Row = Table.Row
const Cell = Table.Cell
const Body = Table.Body
const Header = Table.Header
const HeaderCell = Table.HeaderCell

const starknetDomain = {
  name: constants.TYPED_DATA.NAME,
  version: constants.TYPED_DATA.VERSION,
  chainId: 'UNDERWARE_GG',
  revision: '1',
}

export default function SignTestPage() {
  return (
    <AppDojo>
      <Container>
        <TestPageMenu />
        <CurrentChainHint />

        <Table celled striped size='small' color='orange'>
          <Header>
            <Row>
              <HeaderCell><h5>Messages</h5></HeaderCell>
              <HeaderCell><h5>Validated</h5></HeaderCell>
              <HeaderCell><h5>Signature</h5></HeaderCell>
              <HeaderCell><h5>Typed Data</h5></HeaderCell>
            </Row>
          </Header>
          <Body>
            <ValidateMessage messages={{ ff: 0xffn }} />
            <ValidateMessage messages={{ one: 1n, eleven: 0x11n }} />
            <ValidateMessage messages={{ bighex: 0x586fa47095df3960c7bfb369dc55487020c88d5dd51eb8d298f8a40ff010115n }} />
            <ValidateMessage messages={{ okstring: 'OK_STRING' }} />
            <ValidateMessage messages={{ toobig: 'qwertyuiopqwertyuiopqwertyuiopXX' }} />
          </Body>
        </Table>

        <ConsoleTests />
      </Container>
    </AppDojo>
  )
}

function ConsoleTests() {
  const { account, address } = useAccount()
  const { dojoProvider } = useDojoSetup()
  useEffect(() => {
    if (!BigInt(address ?? 0)) return
    const _test = async () => {
      await testTypedData(account, dojoProvider.provider)
    }
    _test()
  }, [account])
  return (<h5>console tests...</h5>)
}

function ValidateMessage({
  messages,
}: {
  messages: Messages
}) {
  const { account } = useAccount()
  const { dojoProvider } = useDojoSetup()

  const [signature, setSignature] = useState(null)
  const [verified, setVerifyed] = useState('...')

  const { typedMessage, messageHash } = useTypedMessage({
    account,
    starknetDomain,
    messages,
  })

  useEffect(() => {
    const _validate = async () => {
      try {
        const _sig = await account.signMessage(typedMessage)
        setSignature(_sig)
        const _valid = await dojoProvider.provider.verifyMessageInStarknet(typedMessage, _sig, account.address)
        setVerifyed(_valid ? 'OK' : 'failed')
      } catch {
        setVerifyed('ERROR')
      }
    }
    _validate()
  }, [])

  return (
    <Row columns={'equal'} verticalAlign='top'>
      <Cell className='Code'>
        {Object.keys(messages).map((k, i) => <React.Fragment key={k}>{k}:{messages[k].toString()}<br /></React.Fragment>)}
        hash:{shortAddress(bigintToHex(messageHash))}
      </Cell>
      <Cell>
        {verified}
      </Cell>
      <Cell className='Code'>
        {signature && <>
          r:{shortAddress(bigintToHex(signature.r))}<br />
          s:{shortAddress(bigintToHex(signature.s))}
        </>}
      </Cell>
      <Cell className='Code'>
        {JSON.stringify(typedMessage)}
      </Cell>
    </Row>
  )
}


export async function testTypedData(account: AccountInterface, provider: RpcProvider) {
  const typedMessage0 = createTypedMessage({ starknetDomain, messages: { key: '0x01111' } })
  const typedMessage1 = createTypedMessage({ starknetDomain, messages: { key: '0x1111' } })
  const typedMessage2 = createTypedMessage({ starknetDomain, messages: { key: '0x1112' } })
  const signature0 = await account.signMessage(typedMessage0)
  const signature1 = await account.signMessage(typedMessage1)
  const signature2 = await account.signMessage(typedMessage2)
  console.log(`typedMessage0`, typedMessage0)
  console.log(`typedMessage1`, typedMessage1)
  console.log(`typedMessage2`, typedMessage2)
  console.log(`messageHash0`, typedData.getMessageHash(typedMessage0, account.address))
  console.log(`messageHash1`, typedData.getMessageHash(typedMessage1, account.address))
  console.log(`messageHash2`, typedData.getMessageHash(typedMessage2, account.address))
  console.log(`signature0`, signature0)
  console.log(`signature1`, signature1)
  console.log(`signature2`, signature2)
  console.log(`verifyMessage 0 > 0 (true)`, await provider.verifyMessageInStarknet(typedMessage0, signature0, account.address))
  console.log(`verifyMessage 0 > 1 (true)`, await provider.verifyMessageInStarknet(typedMessage0, signature1, account.address))
  console.log(`verifyMessage 0 > 2 (false)`, await provider.verifyMessageInStarknet(typedMessage0, signature2, account.address))
  console.log(`verifyMessage 1 > 0 (true)`, await provider.verifyMessageInStarknet(typedMessage1, signature0, account.address))
  console.log(`verifyMessage 1 > 1 (true)`, await provider.verifyMessageInStarknet(typedMessage1, signature1, account.address))
  console.log(`verifyMessage 1 > 2 (false)`, await provider.verifyMessageInStarknet(typedMessage1, signature2, account.address))
  console.log(`verifyMessage 2 > 0 (false)`, await provider.verifyMessageInStarknet(typedMessage2, signature0, account.address))
  console.log(`verifyMessage 2 > 1 (false)`, await provider.verifyMessageInStarknet(typedMessage2, signature1, account.address))
  console.log(`verifyMessage 2 > 2 (true)`, await provider.verifyMessageInStarknet(typedMessage2, signature2, account.address))
  let result: boolean = await provider.verifyMessageInStarknet(typedMessage1, signature1, account.address)
  return result
}
