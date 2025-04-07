import React, { useMemo, useState } from 'react'
import { Container, Table } from 'semantic-ui-react'
import { useAccount } from '@starknet-react/core'
import { useDojoSystem, useDojoSystemCalls } from '@underware/pistols-sdk/dojo'
import { usePool, useSeasonPool, UsePoolResult, useFundedStarterPackCount } from '/src/stores/bankStore'
import { useFameBalance, useLordsBalance } from '/src/stores/coinStore'
import { usePackType } from '/src/stores/packStore'
import { useConfig } from '/src/stores/configStore'
import { FameBalance, LordsBalance } from '/src/components/account/LordsBalance'
import { FormInputNumber } from '/src/components/ui/Form'
import { LordsFaucet } from '/src/components/account/LordsFaucet'
import { BalanceRequiredButton } from '/src/components/ui/Buttons'
import { Balance } from '/src/components/account/Balance'
import { Connect } from '/src/pages/tests/ConnectTestPage'
import { constants } from '@underware/pistols-sdk/pistols/gen'
import { InternalPageMenu } from './InternalPageIndex'
import CurrentChainHint from '/src/components/CurrentChainHint'
import ChallengeModal from '/src/components/modals/ChallengeModal'
import StoreSync from '/src/stores/sync/StoreSync'
import AppDojo from '/src/components/AppDojo'
import * as ENV from '/src/utils/env'
import { ethToWei } from '@underware/pistols-sdk/utils/starknet'

const Row = Table.Row
const Cell = Table.Cell
const Body = Table.Body
const Header = Table.Header
const HeaderCell = Table.HeaderCell

export default function PoolsPage() {
  return (
    <AppDojo networkId={ENV.DEFAULT_NETWORK_ID} autoConnect>
      <Container>
        <InternalPageMenu />
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
              <LordsBalance address={address} size='big' />
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
  const { priceLords } = usePackType(constants.PackType.StarterPack)
  const [packCount, setPackCount] = useState(1)
  const [sponsorLords, setSponsorLords] = useState(1000)
  const fundAmount = useMemo(() => (priceLords * BigInt(packCount)), [priceLords, packCount])

  const { fundedCount } = useFundedStarterPackCount()

  const { bank } = useDojoSystemCalls()
  const _fund_packs = () => {
    bank.sponsor_duelists(account, fundAmount)
  }
  const _sponsor_season = () => {
    bank.sponsor_season(account, ethToWei(sponsorLords))
  }

  const poolPurchases = usePool(constants.PoolType.Purchases)

  return (
    <Table celled striped size='small' color='orange'>
      <Header>
        <Row>
          <HeaderCell width={4}><h3>Starter Packs</h3></HeaderCell>
          <HeaderCell><h5></h5></HeaderCell>
          <HeaderCell><h5></h5></HeaderCell>
        </Row>
      </Header>
      <Body className='H5'>
        <PoolRow pool={poolPurchases} displayFame={false} />
        <Row className='ModalText'>
          <Cell>Funded Packs:</Cell>
          <Cell className='Code' textAlign='left'>
            {fundedCount}
          </Cell>
          <Cell className='Code' textAlign='right'>
          </Cell>
        </Row>
        <Row>
          <Cell className='ModalText'>Sponsor Packs:</Cell>
          <Cell className='ModalText' textAlign='left'>
            <FormInputNumber
              value={packCount}
              setValue={setPackCount}
              minValue={1}
              maxValue={1000}
              fluid={false}
            />
            &nbsp;
            <Balance lords wei={fundAmount} pre='Cost:' size='big' />
          </Cell>
          <Cell className='Code Smaller' textAlign='right'>
            <BalanceRequiredButton
              label={`Fund ${packCount} More Packs`}
              disabled={packCount === 0}
              fee={fundAmount}
              fill={false}
              onClick={_fund_packs}
            />
          </Cell>
        </Row>
        <Row>
          <Cell className='ModalText'>Sponsor Season:</Cell>
          <Cell className='ModalText' textAlign='left'>
            <FormInputNumber
              // label='Amount:'
              value={sponsorLords}
              setValue={setSponsorLords}
              minValue={1}
              maxValue={100000}
              fluid={false}
            />
            &nbsp;
            <Balance lords eth={sponsorLords} size='big' />
          </Cell>
          <Cell className='Code Smaller' textAlign='right'>
            <BalanceRequiredButton
              label={`Sponsor Season`}
              disabled={sponsorLords === 0}
              fee={sponsorLords}
              fill={false}
              onClick={_sponsor_season}
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

  const { seasonTableId } = useConfig()
  const poolSeason = useSeasonPool(seasonTableId)

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
            <LordsBalance address={contractAddress} size='big' />
          </Cell>
          <Cell className='Code' textAlign='left'>
            <FameBalance address={contractAddress} size='big' />
          </Cell>
        </Row>
        <PoolRow pool={poolPurchases} />
        <PoolRow pool={poolFamePeg} />
        <PoolRow pool={poolSacredFlame} />
        <PoolRow pool={poolSeason} />
        <Row className='ModalText'>
          <Cell>Pools Total</Cell>
          <Cell className='Code' textAlign='left'>
            <Balance lords wei={poolTotalLords} size='big' />
          </Cell>
          <Cell className='Code' textAlign='left'>
            <Balance fame wei={poolTotalFame} size='big' />
          </Cell>
        </Row>
        <Row className='ModalText'>
          <Cell>Surplus</Cell>
          <Cell className='Code' textAlign='left'>
            {diffLords >= 0n ? <>✅</> : <>❌</>}
            &nbsp;
            <Balance lords wei={diffLords} size='big' />
          </Cell>
          <Cell className='Code' textAlign='left'>
            {diffFame >= 0n ? <>✅</> : <>❌</>}
            &nbsp;
            <Balance fame wei={diffFame} size='big' />
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
  const { poolType, seasonId, tournamentId, balanceLords, balanceFame } = pool

  return (
    <Row className='ModalText'>
      <Cell>
        🏷️ Pool::{poolType}{seasonId ? `(${seasonId})` : ''}
        </Cell>
      <Cell className='Code' textAlign='left'>
        {displayLords && <Balance lords wei={balanceLords} size='big' />}
      </Cell>
      <Cell className='Code Smaller' textAlign='left'>
        {displayFame && <Balance fame wei={balanceFame} size='big' />}
      </Cell>
    </Row>
  )
}
