import React, { useEffect, useMemo, useState } from 'react'
import { Button, Container, Grid, Table } from 'semantic-ui-react'
import { useAccount } from '@starknet-react/core'
import { useDojoSetup, useVerifyControllerSignature } from '@underware/pistols-sdk/dojo'
import { useTypedMessage } from '@underware/pistols-sdk/utils/hooks'
import { Messages, poseidon } from '@underware/pistols-sdk/starknet'
import { bigintToHex } from '@underware/pistols-sdk/utils'
import { constants } from '@underware/pistols-sdk/pistols/gen'
import { TestPageMenu } from '/src/pages/tests/TestPageIndex'
import CurrentChainHint from '/src/components/CurrentChainHint'
import AppDojo from '/src/components/AppDojo'
import { Connect } from './ConnectTestPage'

//@ts-ignore
BigInt.prototype.toJSON = function () { return bigintToHex(this) }

const Row = Table.Row
const Cell = Table.Cell
const Body = Table.Body
const Header = Table.Header
const HeaderCell = Table.HeaderCell

type SignResult = 'unique' | 'equal' | 'deterministic' | 'unknown'
type SignColor = null | 'Inactive' | 'Negative' | 'Positive'

const useDeternimisticSign = (
  sig1: bigint[], // target signed message once
  sig2: bigint[], // target signed message twice
  sig3: bigint[], // signed message with different nonce
) => {
  const result = useMemo(() => {
    const values: bigint[] = [];
    const comps: SignResult[] = [];
    const colors1: SignColor[] = [];
    const colors2: SignColor[] = [];
    const colors3: SignColor[] = [];
    if (sig1.length > 0 && sig1.length == sig2.length && sig1.length == sig3.length) {
      for (let i = 0; i < sig1.length; i++) {
        const v1 = sig1[i];
        const v2 = sig2[i];
        const v3 = sig3[i];
        if (v1 == v2 && v1 != v3) {
          comps.push('deterministic');
          colors1.push('Positive');
          colors2.push('Positive');
          colors3.push('Negative');
          values.push(v1);
        } else if (v1 == v2 && v1 == v3) {
          comps.push('equal');
          colors1.push('Inactive');
          colors2.push('Inactive');
          colors3.push('Inactive');
        } else if (v1 != v2 && v1 != v3 && v2 != v3) {
          comps.push('unique');
          colors1.push('Negative');
          colors2.push('Negative');
          colors3.push('Negative');
        } else {
          comps.push('unknown');
          colors1.push(null);
          colors2.push(null);
          colors3.push(null);
        }
      }
    }
    const hash = values.length > 0 ? poseidon(values) : 0n;
    return {
      comps,
      colors1,
      colors2,
      colors3,
      values,
      hash,
    }
  }, [sig1, sig2, sig3])

  return result
}

export default function SignTestPage() {
  const [sig1, setSig1] = useState<bigint[]>([])
  const [sig2, setSig2] = useState<bigint[]>([])
  const [sig3, setSig3] = useState<bigint[]>([])
  const { comps, colors1, colors2, colors3, values, hash } = useDeternimisticSign(sig1, sig2, sig3)

  return (
    <AppDojo>
      <TestPageMenu />
      <CurrentChainHint />

      <Container>
        <Connect />

        <Grid columns={'equal'} style={{ width: '1450px' }}>
          <Grid.Row>
            <Grid.Column>
              <Sign nonce={1} setSig={setSig1} colors={colors1} values={values} hash={hash} />
            </Grid.Column>
            <Grid.Column>
              <Sign nonce={1} setSig={setSig2} colors={colors2} values={values} hash={hash} />
            </Grid.Column>
            <Grid.Column>
              <Sign nonce={2} setSig={setSig3} colors={colors3} values={[]} hash={0n} />
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </Container>

    </AppDojo>
  )
}


function Sign({
  nonce,
  setSig,
  colors,
  values,
  hash,
}: {
  nonce: number,
  setSig: (sig: bigint[]) => void,
  colors: SignColor[],
  values: bigint[],
  hash: bigint,
}) {
  const { account, isConnected } = useAccount()
  const { starknetDomain, dojoProvider } = useDojoSetup()

  const messages: Messages = useMemo(() => ({
    game: 'PISTOLS_AT_10_BLOCKS',
    purpose: `SIGN_TEST`,
    nonce: `${nonce}`,
  }), [])
  const { typedMessage, messageHash, typeHash } = useTypedMessage({
    account,
    starknetDomain,
    messages,
  })

  const [isSigning, setIsSigning] = useState<boolean>(false)
  const [signature, setSignature] = useState<string[]>([])
  // const signaturePair = useMemo(() => signature?.length == 2 ? splitSignature(signature) : null, [signature])

  const _sign = async () => {
    console.log(`SIGN message:`, typedMessage)
    setIsSigning(true)
    setSignature([])
    const signature = (await account.signMessage(typedMessage)) as string[];
    setSignature(signature ?? [])
    setIsSigning(false)
  }

  useEffect(() => {
    setSig(signature.map(s => BigInt(s)))
  }, [signature])

  const { isLoading, isValid } = useVerifyControllerSignature(messageHash, signature)

  return (
    <>
      <Button disabled={!isConnected || isSigning} onClick={() => _sign()}>Sign Nonce {nonce}</Button>
      <Table celled striped size='small' color={isValid === true ? 'green' : isValid === false ? 'red' : 'orange'}>
        <Body className='Smaller'>
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
              {/* <pre> */}
              {JSON.stringify(typedMessage, null, ' ')}
              {/* </pre> */}
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
              Verified
            </Cell>
            <Cell className={`Code ${isValid === true ? 'BgPositive' : isValid === false ? 'BgNegative' : ''}`}>
              {isLoading ? 'verifying...' : isValid === true ? 'VALIDATED' : isValid === false ? 'INVALID' : '?'}
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
                  <span className={colors[i]}>
                    {/* {`0${(s.length - 2)}`.slice(-2)}:{s} */}
                    {`00${(i)}`.slice(-3)}:{s}
                  </span>
                  <br />
                </React.Fragment>
              ))}
            </Cell>
          </Row>

          <Row columns={'equal'} verticalAlign='top'>
            <Cell>
              Values
            </Cell>
            <Cell className='Code'>
              {values.map((s, i) => (
                <React.Fragment key={i}>
                  <span className=''>{bigintToHex(s)}</span>
                  <br />
                </React.Fragment>
              ))}
            </Cell>
          </Row>

          <Row columns={'equal'} verticalAlign='top'>
            <Cell>
              Hash
            </Cell>
            <Cell className='Code'>
              <span className='Important'>{bigintToHex(hash)}</span>
            </Cell>
          </Row>

        </Body>
      </Table>
    </>
  )
}
