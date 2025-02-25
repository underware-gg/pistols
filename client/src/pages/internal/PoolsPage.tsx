import React, { useMemo, useState } from 'react'
import { Container, Table } from 'semantic-ui-react'
import { useAccount } from '@starknet-react/core'
import { useDojoSystem, useDojoSystemCalls, useLordsBalance } from '@underware_gg/pistols-sdk/dojo'
import { usePackType } from '/src/stores/packStore'
import { LordsBalance } from '/src/components/account/LordsBalance'
import { LordsFaucet } from '/src/components/account/LordsFaucet'
import { ActionButton, BalanceRequiredButton } from '/src/components/ui/Buttons'
import { bigintToHex } from '@underware_gg/pistols-sdk/utils'
import { constants } from '@underware_gg/pistols-sdk/pistols/gen'
import { Connect } from '/src/pages/tests/ConnectTestPage'
import CurrentChainHint from '/src/components/CurrentChainHint'
import ChallengeModal from '/src/components/modals/ChallengeModal'
import StoreSync from '/src/stores/sync/StoreSync'
import AppDojo from '/src/components/AppDojo'
import * as ENV from '/src/utils/env'
import { FormInputNumber } from '/src/components/ui/Form'
import { Balance } from '/src/components/account/Balance'

const Row = Table.Row
const Cell = Table.Cell
const Body = Table.Body
const Header = Table.Header
const HeaderCell = Table.HeaderCell

export default function PoolsPage() {
  return (
    <AppDojo networkId={ENV.DEFAULT_NETWORK_ID} autoConnect>
      <Container>
        <CurrentChainHint />

        <Connect />
        <Account />
        <br />
        <Bank />
        <br />

        <StoreSync />
        <ChallengeModal />
      </Container>
    </AppDojo>
  );
}


function Account() {
  const { address } = useAccount()
  return (
    <>
      <Table celled striped size='small'>
        <Header>
          <Row>
            <HeaderCell width={3}><h3>Account</h3></HeaderCell>
            <HeaderCell><h5></h5></HeaderCell>
            <HeaderCell><h5></h5></HeaderCell>
          </Row>
        </Header>
        <Body className='H5'>
          <Row className='ModalText'>
            <Cell>$LORDS balance:</Cell>
            <Cell className='Code' textAlign='left'>
              <LordsBalance address={address} />
            </Cell>
            <Cell className='Code' textAlign='right'>
              <LordsFaucet />
            </Cell>
          </Row>
        </Body>
      </Table>
    </>
  )
}


function Bank() {
  const { account } = useAccount()
  const { contractAddress } = useDojoSystem('bank')
  const { priceLords } = usePackType(constants.PackType.WelcomePack)
  const [amount, setAmount] = useState(1)
  const fundAmount = useMemo(() => (priceLords * BigInt(amount)), [priceLords, amount])

  const { balance } = useLordsBalance(contractAddress)
  const fundedPacksCount = useMemo(() => Number(balance / priceLords), [balance, priceLords])
  
  const { bank } = useDojoSystemCalls()
  const _fund = () => {
    bank.sponsor_duelists(account, fundAmount)
  }

  return (
    <>
      <Table celled striped size='small' color='red'>
        <Header>
          <Row>
            <HeaderCell width={4}><h3>Bank</h3></HeaderCell>
            <HeaderCell><h5></h5></HeaderCell>
            <HeaderCell><h5></h5></HeaderCell>
          </Row>
        </Header>
        <Body className='H5'>
          <Row className='ModalText'>
            <Cell>$LORDS balance:</Cell>
            <Cell className='Code' textAlign='left'>
              <LordsBalance address={contractAddress} />
            </Cell>
            <Cell className='Code' textAlign='right'>
            </Cell>
          </Row>
          <Row className='ModalText'>
            <Cell>Funded Welcome Packs:</Cell>
            <Cell className='Code' textAlign='left'>
              {fundedPacksCount}
            </Cell>
            <Cell className='Code' textAlign='right'>
            </Cell>
          </Row>
          <Row>
            <Cell className='ModalText'>Fund Packs:</Cell>
            <Cell className='ModalText Code' textAlign='left'>
              <FormInputNumber
                // label='Amount:'
                value={amount}
                setValue={setAmount}
                minValue={1}
                maxValue={100}
                fluid={false}
              />
              &nbsp;
              <Balance lords wei={fundAmount} pre='Cost:' />
            </Cell>
            <Cell className='Code Smaller' textAlign='right'>
              <BalanceRequiredButton
                label={`Fund ${amount} Packs`}
                disabled={amount === 0}
                fee={fundAmount}
                fill={false}
                onClick={_fund}
              />
            </Cell>
          </Row>
        </Body>
      </Table>
    </>
  )
}
