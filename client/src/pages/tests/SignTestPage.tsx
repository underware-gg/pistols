import React, { useEffect, useMemo, useState } from 'react'
import { Button, Container, Grid, Table } from 'semantic-ui-react'
import { useAccount } from '@starknet-react/core'
import { useDojoSetup, useVerifyControllerSignature } from '@underware/pistols-sdk/dojo'
import { useTypedMessage } from '@underware/pistols-sdk/utils/hooks'
import { useVerifyControllerSignatureApi, useGenerateControllerSaltApi } from '@underware/pistols-sdk/api'
import { Messages } from '@underware/pistols-sdk/starknet'
import { bigintToHex, isPositiveBigint } from '@underware/pistols-sdk/utils'
import { CommitMoveMessage } from '@underware/pistols-sdk/pistols/config'
import { TestPageMenu } from '/src/pages/tests/TestPageIndex'
import { SALT_SERVER_URL } from '/src/utils/env'
import { Connect } from './ConnectTestPage'
import CurrentChainHint from '/src/components/CurrentChainHint'
import AppDojo from '/src/components/AppDojo'

//@ts-ignore
BigInt.prototype.toJSON = function () { return bigintToHex(this) }

const Row = Table.Row
const Cell = Table.Cell
const Body = Table.Body
const Header = Table.Header
const HeaderCell = Table.HeaderCell

export default function SignTestPage() {
  const testMessages: Messages = useMemo(() => ({
    game: 'PISTOLS_AT_10_BLOCKS',
    purpose: `SIGN_TEST`,
    nonce: 1n,
  }), [])
  const messagesDuel1: CommitMoveMessage = useMemo(() => ({
    duelId: 100n,
    duelistId: 1n,
  }), [])
  const messagesDuel2: CommitMoveMessage = useMemo(() => ({
    duelId: 100n,
    duelistId: 2n,
  }), [])

  return (
    <AppDojo>
      <TestPageMenu />
      <CurrentChainHint />

      <Container>
        <Connect />

        <Grid columns={'equal'} style={{ width: '1450px' }}>
          <Grid.Row>
            {/* <Grid.Column>
              <Sign messages={testMessages} />
            </Grid.Column> */}
            <Grid.Column>
              <Sign messages={messagesDuel2} />
            </Grid.Column>
            <Grid.Column>
              <Sign messages={messagesDuel2} />
            </Grid.Column>
            <Grid.Column>
              <Sign messages={messagesDuel2} fromAccount='0x0458f10bf89dfd916eaeabbf6866870bd5bb8b05c6df7de0ad36bb8ad66dce69' />
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </Container>
    </AppDojo>
  )
}


function Sign({
  messages,
  fromAccount,
}: {
  messages: Messages,
  fromAccount?: string,
}) {
  const { account, isConnected } = useAccount()
  const { starknetDomain } = useDojoSetup()

  const { typedMessage, messageHash, typeHash } = useTypedMessage({
    account,
    starknetDomain,
    messages,
  })

  const [isSigning, setIsSigning] = useState<boolean>(false)
  const [signature, setSignature] = useState<string[]>([])
  // const signaturePair = useMemo(() => signature?.length == 2 ? splitSignature(signature) : null, [signature])

  useEffect(() => {
    setIsSigning(false)
    setSignature([])
  }, [isConnected, account])

  const _sign = async () => {
    console.log(`SIGN message:`, typedMessage)
    setIsSigning(true)
    setSignature([])
    const signature = (await account.signMessage(typedMessage)) as string[];
    setSignature(signature ?? [])
    setIsSigning(false)
  }
  const { isLoading, isValid } = useVerifyControllerSignature(messageHash, signature)
  const { isLoading: isLoadingApi, isValid: isValidApi } = useVerifyControllerSignatureApi(SALT_SERVER_URL, messageHash, signature, fromAccount)
  const { isLoading: isLoadingSalt, isError: isErrorSalt, salt } = useGenerateControllerSaltApi(SALT_SERVER_URL, starknetDomain, messageHash, signature, fromAccount)

  return (
    <>
      <Button disabled={!isConnected || isSigning} onClick={() => _sign()}>Sign Messages</Button>
      <Table celled striped size='small' color={isValid === true ? 'green' : isValid === false ? 'red' : 'orange'}>
        <Body className='Smaller'>

          <Row columns={'equal'} verticalAlign='top'>
            <Cell>
              Messages
            </Cell>
            <Cell className='Code'>
              <pre>
                {JSON.stringify(messages, null, ' ')}
              </pre>
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
              Verified (on-chain)
            </Cell>
            <Cell className={`Code ${isValid === true ? 'Darkest BgPositive' : isValid === false ? 'BgNegative' : ''}`}>
              {isLoading ? 'verifying...' : isValid === true ? 'VALIDATED' : isValid === false ? 'INVALID' : '?'}
            </Cell>
          </Row>

          <Row columns={'equal'} verticalAlign='top'>
            <Cell>
              Verified (API)
            </Cell>
            <Cell className={`Code ${isValidApi === true ? 'Darkest BgPositive' : isValidApi === false ? 'BgNegative' : ''}`}>
              {isLoadingApi ? 'verifying...' : isValidApi === true ? 'VALIDATED' : isValidApi === false ? 'INVALID' : '?'}
            </Cell>
          </Row>

          <Row columns={'equal'} verticalAlign='top'>
            <Cell>
              Salt Server:
            </Cell>
            <Cell className='Code'>
              {SALT_SERVER_URL}
            </Cell>
          </Row>

          <Row columns={'equal'} verticalAlign='top'>
            <Cell>
              Salt (API)
            </Cell>
            <Cell className={`Code ${isPositiveBigint(salt) ? 'Darkest BgPositive' : isErrorSalt ? 'BgNegative' : ''}`}>
              {isLoadingSalt ? 'generating...' : isPositiveBigint(salt) ? bigintToHex(salt) : isErrorSalt ? 'ERROR' : '?'}
            </Cell>
          </Row>

          <Row columns={'equal'} verticalAlign='top'>
            <Cell>
              Signature Size
            </Cell>
            <Cell className='Code'>
              ({signature.length})
            </Cell>
          </Row>

          <Row columns={'equal'} verticalAlign='top'>
            <Cell>
              Signature
            </Cell>
            <Cell className='Code'>
              {signature.map(s => bigintToHex(s)).map((s, i) => (
                <React.Fragment key={i}>
                  <span className='Inactive'>
                    {/* {`0${(s.length - 2)}`.slice(-2)}:{s} */}
                    {`00${(i)}`.slice(-3)}:{s}
                  </span>
                  <br />
                </React.Fragment>
              ))}
            </Cell>
          </Row>

        </Body>
      </Table>
    </>
  )
}
