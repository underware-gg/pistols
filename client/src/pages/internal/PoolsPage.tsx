import React, { useMemo, useState } from 'react'
import { Container, Table } from 'semantic-ui-react'
import { useAccount } from '@starknet-react/core'
import { useDojoSystem, useDojoSystemCalls, useLordsBalance } from '@underware_gg/pistols-sdk/dojo'
import { usePackType } from '/src/stores/packStore'
import { FameBalance, LordsBalance } from '/src/components/account/LordsBalance'
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
import { usePool, useSeasonPool, UsePoolResult } from '/src/stores/bankStore'
import { useFameBalance } from '/src/hooks/useFame'

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
        <Pools />
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
              <LordsBalance address={address} big />
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

  const poolPurchases = usePool(constants.PoolType.Purchases)

  return (
    <Table celled striped size='small' color='orange'>
      <Header>
        <Row>
          <HeaderCell width={4}><h3>Welcome Packs</h3></HeaderCell>
          <HeaderCell><h5></h5></HeaderCell>
          <HeaderCell><h5></h5></HeaderCell>
        </Row>
      </Header>
      <Body className='H5'>
        <PoolRow pool={poolPurchases} displayFame={false} />
        <Row className='ModalText'>
          <Cell>Funded Packs:</Cell>
          <Cell className='Code' textAlign='left'>
            {fundedPacksCount}
          </Cell>
          <Cell className='Code' textAlign='right'>
          </Cell>
        </Row>
        <Row>
          <Cell className='ModalText'>Fund Packs:</Cell>
          <Cell className='ModalText' textAlign='left'>
            <FormInputNumber
              // label='Amount:'
              value={amount}
              setValue={setAmount}
              minValue={1}
              maxValue={100}
              fluid={false}
            />
            &nbsp;
            <Balance lords wei={fundAmount} pre='Cost:' big />
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
  )
}



function Pools() {
  const { contractAddress } = useDojoSystem('bank')
  const { balance: bankLordsBalance } = useLordsBalance(contractAddress)
  const { balance: bankFameBalance } = useFameBalance(contractAddress)

  const poolPurchases = usePool(constants.PoolType.Purchases)
  const poolFamePeg = usePool(constants.PoolType.FamePeg)
  const poolSacredFlame = usePool(constants.PoolType.SacredFlame)
  const poolSeason = useSeasonPool(1)

  const poolTotalLords = useMemo(() => (
    poolPurchases.balanceLords + poolFamePeg.balanceLords + poolSacredFlame.balanceLords + poolSeason.balanceLords
  ), [poolPurchases, poolFamePeg, poolSacredFlame, poolSeason])
  const poolTotalFame = useMemo(() => (
    poolPurchases.balanceFame + poolFamePeg.balanceFame + poolSacredFlame.balanceFame + poolSeason.balanceFame
  ), [poolPurchases, poolFamePeg, poolSacredFlame, poolSeason])

  const diffLords = useMemo(() => (bankLordsBalance - poolTotalLords), [bankLordsBalance, poolTotalLords])
  const diffFame = useMemo(() => (bankFameBalance - poolTotalFame), [bankFameBalance, poolTotalFame])

  return (
    <Table celled striped size='small' color='green'>
      <Header>
        <Row>
          <HeaderCell width={4}><h3>Balances</h3></HeaderCell>
          <HeaderCell><h3>$LORDS</h3></HeaderCell>
          <HeaderCell><h3>$FAME</h3></HeaderCell>
        </Row>
      </Header>
      <Body className='H5'>
        <Row className='ModalText'>
          <Cell>Bank</Cell>
          <Cell className='Code' textAlign='left'>
            <LordsBalance address={contractAddress} big />
          </Cell>
          <Cell className='Code' textAlign='left'>
            <FameBalance address={contractAddress} big />
          </Cell>
        </Row>
        <PoolRow pool={poolPurchases} />
        <PoolRow pool={poolFamePeg} />
        <PoolRow pool={poolSacredFlame} />
        <PoolRow pool={poolSeason} />
        <Row className='ModalText'>
          <Cell>Pools Total</Cell>
          <Cell className='Code' textAlign='left'>
            <Balance lords wei={poolTotalLords} big />
          </Cell>
          <Cell className='Code' textAlign='left'>
            <Balance fame wei={poolTotalFame} big />
          </Cell>
        </Row>
        <Row className='ModalText'>
          <Cell>Surplus</Cell>
          <Cell className='Code' textAlign='left'>
            {diffLords >= 0n ? <>✅</> : <>❌</>}
            &nbsp;
            <Balance lords wei={diffLords} big />
          </Cell>
          <Cell className='Code' textAlign='left'>
            {diffFame >= 0n ? <>✅</> : <>❌</>}
            &nbsp;
            <Balance fame wei={diffFame} big />
          </Cell>
        </Row>
      </Body>
    </Table>
  )
}


function PoolRow({
  pool,
  displayLords = true,
  displayFame = true,
}: {
  pool: UsePoolResult
  displayLords?: boolean
  displayFame?: boolean
}) {
  const { poolId, seasonId, tournamentId, balanceLords, balanceFame } = pool

  return (
    <Row className='ModalText'>
      <Cell>
        🏷️ Pool::{poolId}{seasonId ? `(${seasonId})` : ''}
        </Cell>
      <Cell className='Code' textAlign='left'>
        {displayLords && <Balance lords wei={balanceLords} big />}
      </Cell>
      <Cell className='Code Smaller' textAlign='left'>
        {displayFame && <Balance fame wei={balanceFame} big />}
      </Cell>
    </Row>
  )
}
