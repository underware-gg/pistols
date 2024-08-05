import React, { useEffect, useState } from 'react'
import { AccountInterface, typedData } from 'starknet'
import { Container, Table } from 'semantic-ui-react'
import { useAccount } from '@starknet-react/core'
import { useTypedMessage } from '@/lib/utils/hooks/useTypedMessage'
import { Messages, createTypedMessage } from '@/lib/utils/starknet_sign'
import { bigintToHex, shortAddress } from '@/lib/utils/types'
import AppPistols from '@/pistols/components/AppPistols'

//@ts-ignore
BigInt.prototype.toJSON = function () { return bigintToHex(this) }

const Row = Table.Row
const Cell = Table.Cell
const Body = Table.Body
const Header = Table.Header
const HeaderCell = Table.HeaderCell

export default function IndexPage() {
  return (
    <AppPistols>
      <Container>
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
    </AppPistols>
  )
}

function ConsoleTests() {
  const { account, address } = useAccount()
  useEffect(() => {
    if (!BigInt(address ?? 0)) return
    const _test = async () => {
      await testTypedData(account)
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

  const [signature, setSignature] = useState(null)
  const [verified, setVerifyed] = useState('...')

  const { typedMessage, messageHash } = useTypedMessage({
    revision: 0,
    messages,
  })

  useEffect(() => {
    const _validate = async () => {
      try {
        const _sig = await account.signMessage(typedMessage)
        setSignature(_sig)
        const _valid = await account.verifyMessage(typedMessage, _sig)
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


export async function testTypedData(account: AccountInterface) {
  const typedMessage0 = createTypedMessage({ revision: 1, messages: { key: '0x01111' } })
  const typedMessage1 = createTypedMessage({ revision: 1, messages: { key: '0x1111' } })
  const typedMessage2 = createTypedMessage({ revision: 1, messages: { key: '0x1112' } })
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
  console.log(`verifyMessage 0 > 0 (true)`, await account.verifyMessage(typedMessage0, signature0))
  console.log(`verifyMessage 0 > 1 (true)`, await account.verifyMessage(typedMessage0, signature1))
  console.log(`verifyMessage 0 > 2 (false)`, await account.verifyMessage(typedMessage0, signature2))
  console.log(`verifyMessage 1 > 0 (true)`, await account.verifyMessage(typedMessage1, signature0))
  console.log(`verifyMessage 1 > 1 (true)`, await account.verifyMessage(typedMessage1, signature1))
  console.log(`verifyMessage 1 > 2 (false)`, await account.verifyMessage(typedMessage1, signature2))
  console.log(`verifyMessage 2 > 0 (false)`, await account.verifyMessage(typedMessage2, signature0))
  console.log(`verifyMessage 2 > 1 (false)`, await account.verifyMessage(typedMessage2, signature1))
  console.log(`verifyMessage 2 > 2 (true)`, await account.verifyMessage(typedMessage2, signature2))
  let result: boolean = await account.verifyMessage(typedMessage1, signature1)
  return result
}
