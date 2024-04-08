import React, { useEffect, useState } from 'react'
import { Container, Table } from 'semantic-ui-react'
import { useDojoAccount } from '@/lib/dojo/DojoContext'
import { Messages, createTypedMessage } from '@/lib/utils/starknet_sign'
import AppPistols from '@/pistols/components/AppPistols'
import { Account, typedData } from 'starknet'
import { bigintToHex, shortAddress } from '@/lib/utils/types'
import { useEffectOnce } from '@/lib/utils/hooks/useEffectOnce'

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
            <ValidateMessage messages={{ ff:'0xff'}} />
            <ValidateMessage messages={{ one: '0x1', eleven: '0x11' }} />
            <ValidateMessage messages={{ bighex: '0x586fa47095df3960c7bfb369dc55487020c88d5dd51eb8d298f8a40ff010115' }} />
            <ValidateMessage messages={{ toobig: 'qwertyuiopqwertyuiopqwertyuiopXX' }} />
          </Body>
        </Table>

        <ConsoleTests />

      </Container>
    </AppPistols>
  )
}

function ConsoleTests() {
  const { masterAccount } = useDojoAccount()
  useEffectOnce(() => {
    const _test = async () => {
      await testTypedData(masterAccount)
    }
    _test()
  }, [])
  return (<h5>console tests...</h5>)
}

function ValidateMessage({
  messages,
}: {
  messages: Messages
}) {
  const { masterAccount } = useDojoAccount()

  const [typedMessage, setTypedMessage] = useState(null)
  const [signature, setSignature] = useState(null)
  const [hash, setHash] = useState(null)
  const [verifyied, setVerifyed] = useState('...')

  useEffect(() => {
    const _validate = async () => {
      const _msg = createTypedMessage({ messages })
      setTypedMessage(_msg)
      console.log(messages, _msg)
      try {
        const _sig = await masterAccount.signMessage(_msg)
        const _hash = typedData.getMessageHash(_msg, masterAccount.address)
        setSignature(_sig)
        setHash(_hash)
        const _valid = await masterAccount.verifyMessage(_msg, _sig)
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
        {Object.keys(messages).map((k, i) => <React.Fragment key={k}>{k}:{shortAddress(messages[k])}<br /></React.Fragment>)}
        hash:{shortAddress(bigintToHex(hash))}
      </Cell>
      <Cell>
        {verifyied}
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


export async function testTypedData(account: Account) {
  const typedMessage0 = createTypedMessage({ messages: { key: '0x01111' } })
  const typedMessage1 = createTypedMessage({ messages: { key: '0x1111' } })
  const typedMessage2 = createTypedMessage({ messages: { key: '0x1112' } })
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
