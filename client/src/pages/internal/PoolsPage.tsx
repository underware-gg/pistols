import React, { useMemo, useState } from 'react'
import { Container, Table } from 'semantic-ui-react'
import { useAccount } from '@starknet-react/core'
import { useDojoSystem, useDojoSystemCalls } from '@underware/pistols-sdk/dojo'
import { usePool, useSeasonPool, UsePoolResult, useFundedStarterPackCount, usePurchasedUnopenedDuelistPackCount } from '/src/stores/bankStore'
import { useFameBalance, useLordsBalance } from '/src/stores/coinStore'
import { useERC20TotalSupply } from '@underware/pistols-sdk/utils/hooks'
import { useTokenContracts } from '/src/hooks/useTokenContracts'
import { usePackType } from '/src/stores/packStore'
import { useConfig } from '/src/stores/configStore'
import { ethToWei, weiToEth } from '@underware/pistols-sdk/starknet'
import { bigintToDecimal, isBigint } from '@underware/pistols-sdk/utils'
import { FameBalance, LordsBalance } from '/src/components/account/LordsBalance'
import { FormInputNumber } from '/src/components/ui/Form'
import { LordsFaucet } from '/src/components/account/LordsFaucet'
import { BalanceRequiredButton } from '/src/components/ui/Buttons'
import { Balance } from '/src/components/account/Balance'
import { Connect } from '/src/pages/tests/ConnectTestPage'
import { constants } from '@underware/pistols-sdk/pistols/gen'
import { InternalPageMenu, InternalPageWrapper } from './InternalPageIndex'
import CurrentChainHint from '/src/components/CurrentChainHint'
import StoreSync from '/src/stores/sync/StoreSync'
import AppDojo from '/src/components/AppDojo'
import * as ENV from '/src/utils/env'

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

        <InternalPageWrapper>
          <Connect />
          <Account />
          <br />
          <Bank />
          <br />
          <Pools />
          <br />
        </InternalPageWrapper>

        <StoreSync />
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
  const [packCount, setPackCount] = useState(1)
  const [sponsorLords, setSponsorLords] = useState(1000)

  const { fundedCount, priceLords, balanceLords } = useFundedStarterPackCount()
  const fundAmount = useMemo(() => (priceLords * BigInt(packCount)), [priceLords, packCount])

  const { fundedCount: duelistPackCount, priceLords: duelistPackPriceLords, balanceLords: duelistPackBalanceLords } = usePurchasedUnopenedDuelistPackCount()

  const { bank } = useDojoSystemCalls()
  const _fund_packs = () => {
    bank.sponsor_duelists(account, fundAmount)
  }
  const _sponsor_season = () => {
    bank.sponsor_season(account, ethToWei(sponsorLords))
  }

  return (
    <Table celled striped size='small' color='orange'>
      <Header>
        <Row>
          <HeaderCell width={4}><h3>Starter Packs</h3></HeaderCell>
          <HeaderCell><h5>Quantity</h5></HeaderCell>
          <HeaderCell><h5>Cost per Pack</h5></HeaderCell>
          <HeaderCell><h5>Balance</h5></HeaderCell>
          <HeaderCell><h5></h5></HeaderCell>
        </Row>
      </Header>
      <Body className='H5'>
        <Row className='ModalText'>
          <Cell>Funded Starter Packs:</Cell>
          <Cell className='Code' textAlign='left'>
            {fundedCount}
          </Cell>
          <Cell className='Code' textAlign='left'>
            <Balance lords wei={priceLords} size='big' />
          </Cell>
          <Cell className='Code' textAlign='left'>
            <Balance lords wei={balanceLords} size='big' />
          </Cell>
        </Row>
        <Row className='ModalText'>
          <Cell>Unopened Genesis Packs:</Cell>
          <Cell className='Code' textAlign='left'>
            {duelistPackCount}
          </Cell>
          <Cell className='Code' textAlign='left'>
            <Balance lords wei={duelistPackPriceLords} size='big' />
          </Cell>
          <Cell className='Code' textAlign='left'>
            <Balance lords wei={duelistPackBalanceLords} size='big' />
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
          <Cell className='Smaller'>
            <BalanceRequiredButton
              label={`Fund ${packCount} More Packs`}
              disabled={packCount === 0}
              fee={fundAmount}
              fill={false}
              onClick={_fund_packs}
            />
          </Cell>
          <Cell></Cell>
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
          <Cell className='Smaller'>
            <BalanceRequiredButton
              label={`Sponsor Season`}
              disabled={sponsorLords === 0}
              fee={sponsorLords}
              fill={false}
              onClick={_sponsor_season}
            />
          </Cell>
          <Cell></Cell>
        </Row>
      </Body>
    </Table>
  )
}



function Pools() {
  // FAME supply
  const { fameContractAddress } = useTokenContracts()
  const { totalSupply: fameSupply } = useERC20TotalSupply(fameContractAddress)
  const { fame: fameSupplyIntoLords, percentage: fameSupplyIntoLordsPercentage } = useFameIntoLords(fameSupply)

  // Bank balances
  const { contractAddress } = useDojoSystem('bank')
  const { balance: bankLordsBalance } = useLordsBalance(contractAddress)
  const { balance: bankFameBalance } = useFameBalance(contractAddress)
  const { fame: balanceFameIntoLords, percentage: balanceFameIntoLordsPercentage } = useFameIntoLords(bankFameBalance)

  // Duelists
  const fameLivingDuelists = useMemo(() => ((fameSupply ?? 0n) - (bankFameBalance ?? 0n)), [fameSupply, bankFameBalance])
  const { fame: fameLivingIntoLords, percentage: fameLivingIntoLordsPercentage } = useFameIntoLords(fameLivingDuelists)

  const poolClaimable = usePool(constants.PoolType.Claimable)
  const poolPurchases = usePool(constants.PoolType.Purchases)
  const poolFamePeg = usePool(constants.PoolType.FamePeg)
  const poolSacrifice = usePool(constants.PoolType.Sacrifice)

  const { currentSeasonId } = useConfig()
  const poolSeason = useSeasonPool(currentSeasonId)

  const poolTotalLords = useMemo(() => (
    poolClaimable.balanceLords + poolPurchases.balanceLords + poolFamePeg.balanceLords + poolSacrifice.balanceLords + poolSeason.balanceLords
  ), [poolClaimable, poolPurchases, poolFamePeg, poolSacrifice, poolSeason])
  const poolTotalFame = useMemo(() => (
    poolClaimable.balanceFame + poolPurchases.balanceFame + poolFamePeg.balanceFame + poolSacrifice.balanceFame + poolSeason.balanceFame
  ), [poolClaimable, poolPurchases, poolFamePeg, poolSacrifice, poolSeason])
  const { fame: totalFameIntoLords, percentage: totalFameIntoLordsPercentage } = useFameIntoLords(poolTotalFame)

  const diffLords = useMemo(() => (bankLordsBalance - poolTotalLords), [bankLordsBalance, poolTotalLords])
  const diffFame = useMemo(() => (bankFameBalance - poolTotalFame), [bankFameBalance, poolTotalFame])

  console.log("bank: diffLords", _formatWei(diffLords))
  console.log("bank: diffFame", _formatWei(diffFame))

  return (
    <Table celled striped size='small' color='green'>
      <Header>
        <Row>
          <HeaderCell width={4}><h3>Balances</h3></HeaderCell>
          <HeaderCell><h3>$LORDS</h3></HeaderCell>
          <HeaderCell><h3>$FAME</h3></HeaderCell>
          <HeaderCell><h3>%</h3></HeaderCell>
          <HeaderCell><h3>➡ $LORDS</h3></HeaderCell>
          <HeaderCell><h3>Description</h3></HeaderCell>
        </Row>
      </Header>
      <Body className='H5'>

        <Row className=''>
          <Cell className='ModalText'>$FAME Supply</Cell>
          <Cell></Cell>
          <Cell className='Code' textAlign='left'>
            <Balance fame wei={fameSupply} size='big' />
          </Cell>
          <Cell className='' textAlign='left'>
            {fameSupplyIntoLordsPercentage.toFixed(2)}%
          </Cell>
          <Cell className='Code' textAlign='left'>
            ~<Balance lords wei={fameSupplyIntoLords} size='big' />
          </Cell>
          <Cell className='' textAlign='left'>
            Living Duelists + Pools, equals <b>FamePeg</b>
          </Cell>
        </Row>

        <Row className=''>
          <Cell className='ModalText'>Living Duelists</Cell>
          <Cell></Cell>
          <Cell className='Code' textAlign='left'>
            <Balance fame wei={fameLivingDuelists} size='big' />
          </Cell>
          <Cell className='' textAlign='left'>
            {fameLivingIntoLordsPercentage.toFixed(2)}%
          </Cell>
          <Cell className='Code' textAlign='left'>
            ~<Balance lords wei={fameLivingIntoLords} size='big' />
          </Cell>
          <Cell className='' textAlign='left'>
            Owned by Living Duelists
          </Cell>
        </Row>

        <Row className=''>
          <Cell className='ModalText'>🏦 Bank</Cell>
          <Cell className='Code' textAlign='left'>
            <LordsBalance address={contractAddress} size='big' />
          </Cell>
          <Cell className='Code' textAlign='left'>
            <FameBalance address={contractAddress} size='big' />
          </Cell>
          <Cell className='' textAlign='left'>
            {balanceFameIntoLordsPercentage.toFixed(2)}%
          </Cell>
          <Cell className='Code' textAlign='left'>
            ~<Balance lords wei={balanceFameIntoLords} size='big' />
          </Cell>
          <Cell className='' textAlign='left'>
            Total amount deposited, split into pools
          </Cell>
        </Row>

        <PoolRow pool={poolClaimable} description='Sponsored free duelists' />
        <PoolRow pool={poolPurchases} description='Unopened purchased packs' />
        <PoolRow pool={poolFamePeg} description='Pegged to full FAME supply' />
        <PoolRow pool={poolSeason} description='Season prizes (dead duelists)' />
        <PoolRow pool={poolSacrifice} description='Reserved for Sacrifice (dead duelists)' />

        <Row className=''>
          <Cell className='ModalText'>Pools Total</Cell>
          <Cell className='Code' textAlign='left'>
            <Balance lords wei={poolTotalLords} size='big' />
          </Cell>
          <Cell className='Code' textAlign='left'>
            <Balance fame wei={poolTotalFame} size='big' />
          </Cell>
          <Cell className='' textAlign='left'>
            {totalFameIntoLordsPercentage.toFixed(2)}%
          </Cell>
          <Cell className='Code' textAlign='left'>
            ~<Balance lords wei={totalFameIntoLords} size='big' />
          </Cell>
          <Cell className='' textAlign='left'>
            Should equals <b>Bank</b>
          </Cell>
        </Row>

        <Row className=''>
          <Cell className='ModalText'>Surplus</Cell>
          <Cell className='Code' textAlign='left'>
            {diffLords == 0n ? <>✅</> : diffLords > 0n ? <>‼️</> : <>❌</>}
            &nbsp;
            <Balance lords wei={diffLords} size='big' />
          </Cell>
          <Cell className='Code' textAlign='left'>
            {diffFame == 0n ? <>✅</> : diffFame > 0n ? <>‼️</> : <>❌</>}
            &nbsp;
            <Balance fame wei={diffFame} size='big' />
          </Cell>
          <Cell></Cell>
          <Cell></Cell>
          <Cell className='' textAlign='left'>
            Should always be zero
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
  description = '',
}: {
  pool: UsePoolResult
  displayLords?: boolean
  displayFame?: boolean
  description?: string
}) {
  const { poolType, seasonId, tournamentId, balanceLords, balanceFame } = pool
  const { fame: fameIntoLords, percentage: fameIntoLordsPercentage } = useFameIntoLords(balanceFame)

  return (
    <Row className=''>
      <Cell className='ModalText'>
        🏷️ Pool::{poolType}{seasonId ? `(${seasonId})` : ''}
      </Cell>
      <Cell className='Code' textAlign='left'>
        {displayLords && <Balance lords wei={balanceLords} size='big' />}
      </Cell>
      <Cell className='Code' textAlign='left'>
        {displayFame && <Balance fame wei={balanceFame} size='big' />}
      </Cell>
      <Cell className='' textAlign='left'>
        {fameIntoLordsPercentage > 0 ? `${fameIntoLordsPercentage.toFixed(2)}%` : ''}
      </Cell>
      <Cell className='Code' textAlign='left'>
        ~{displayFame && <Balance lords wei={fameIntoLords} size='big' />}
      </Cell>
      <Cell className='' textAlign='left'>
        {description}
      </Cell>
    </Row>
  )
}

const useFameIntoLords = (balanceFame: bigint) => {
  const { fameContractAddress } = useTokenContracts();
  const { totalSupply: fameSupply } = useERC20TotalSupply(fameContractAddress);
  const { balanceLords: peggedLords } = usePool(constants.PoolType.FamePeg);
  const precision = 100000000;
  const percentage = useMemo(() => (
    (isBigint(balanceFame) && isBigint(fameSupply)) ? Math.floor((Number(weiToEth(balanceFame)) / Number(weiToEth(fameSupply))) * precision) : 0
  ), [balanceFame, fameSupply]);
  const result = useMemo(() => (BigInt(percentage) * peggedLords) / BigInt(precision), [percentage, peggedLords]);
  console.log('useFameIntoLords', weiToEth(balanceFame), weiToEth(fameSupply), weiToEth(peggedLords), percentage, '>', weiToEth(result));
  return {
    fame: result,
    percentage: (percentage / precision) * 100,
  };
}

const _formatWei = (wei: bigint) => {
  let dec = bigintToDecimal(wei);
  if (dec.length < 19) dec = `00000000000000000000${dec}`.slice(-19);
  return `${dec.slice(0, -18)}.${dec.slice(-18)}`;
}
