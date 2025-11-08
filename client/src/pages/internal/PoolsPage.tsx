import React, { useMemo, useState } from 'react'
import { Container, Table } from 'semantic-ui-react'
import { useAccount } from '@starknet-react/core'
import { useDojoSystem, useDojoSystemCalls } from '@underware/pistols-sdk/dojo'
import { usePool, useSeasonPool, UsePoolResult, usePurchasedUnopenedDuelistPackCount, useFundedPackCount } from '/src/stores/bankStore'
import { useFameBalance, useFetchAccountsBalances, useLordsBalance } from '/src/stores/coinStore'
import { useERC20TotalSupply } from '@underware/pistols-sdk/utils/hooks'
import { useTokenContracts } from '/src/hooks/useTokenContracts'
import { useConfig } from '/src/stores/configStore'
import { ethToWei, weiToEth } from '@underware/pistols-sdk/starknet'
import { bigintToDecimal, isBigint } from '@underware/pistols-sdk/utils'
import { FameBalance, LordsBalance } from '/src/components/account/LordsBalance'
import { FormInputNumber } from '/src/components/ui/Form'
import { BalanceRequiredButton } from '/src/components/ui/Buttons'
import { Balance } from '/src/components/account/Balance'
import { Connect } from '/src/pages/tests/ConnectTestPage'
import { constants } from '@underware/pistols-sdk/pistols/gen'
import { InternalPageMenu, InternalPageWrapper } from './InternalPageIndex'
import CurrentChainHint from '/src/components/CurrentChainHint'
import StoreSync from '/src/stores/sync/StoreSync'
import AppDojo from '/src/components/AppDojo'

const Row = Table.Row
const Cell = Table.Cell
const Body = Table.Body
const Header = Table.Header
const HeaderCell = Table.HeaderCell

export default function PoolsPage() {
  return (
    <AppDojo subtitle='Internal: Pools' autoConnect>
      <Container>
        <InternalPageMenu />
        <CurrentChainHint />
        <Connect />

        <InternalPageWrapper>
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


function Bank() {
  const { account } = useAccount()
  const [sponsorDuelistCount, setSponsorDuelistCount] = useState(1)
  const [sponsorLords, setSponsorLords] = useState(1000)

  const { fundedCount, priceLords, poolBalanceLords } = useFundedPackCount(constants.PackType.FreeDuelist)
  const fundAmount = useMemo(() => (priceLords * BigInt(sponsorDuelistCount)), [priceLords, sponsorDuelistCount])

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
          <HeaderCell width={4}><h3></h3></HeaderCell>
          <HeaderCell><h5>Quantity</h5></HeaderCell>
          <HeaderCell><h5>Cost per Pack</h5></HeaderCell>
          <HeaderCell><h5>Balance</h5></HeaderCell>
          <HeaderCell><h5></h5></HeaderCell>
        </Row>
      </Header>
      <Body>
        <Row className='H3'>
          <Cell>Funded Duelists:</Cell>
          <Cell className='Code' textAlign='left'>
            {fundedCount}
          </Cell>
          <Cell className='Code' textAlign='left'>
            <Balance lords wei={priceLords} size='big' />
          </Cell>
          <Cell className='Code' textAlign='left'>
            <Balance lords wei={poolBalanceLords} size='big' />
          </Cell>
        </Row>
        <Row className='H3'>
          <Cell>Unopened Purchased Packs:</Cell>
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
        <Row className='H3'>
          <Cell>Sponsor Duelists:</Cell>
          <Cell textAlign='left'>
            <FormInputNumber
              value={sponsorDuelistCount}
              setValue={setSponsorDuelistCount}
              minValue={1}
              maxValue={1000}
              fluid={false}
            />
            &nbsp;
            <Balance lords wei={fundAmount} pre='Cost:' size='big' />
          </Cell>
          <Cell className='Smaller'>
            <BalanceRequiredButton
              label={`Fund ${sponsorDuelistCount} More Duelists`}
              disabled={sponsorDuelistCount === 0}
              fee={fundAmount}
              onClick={_fund_packs}
              large={false}
            />
          </Cell>
          <Cell></Cell>
        </Row>
        <Row className='H3'>
          <Cell>Sponsor Season:</Cell>
          <Cell textAlign='left'>
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
              onClick={_sponsor_season}
              large={false}
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

  // Bank balances
  const { contractAddress: bankContractAddress } = useDojoSystem('bank')
  useFetchAccountsBalances(fameContractAddress, [bankContractAddress], true)
  const { balance: bankLordsBalance } = useLordsBalance(bankContractAddress)
  const { balance: bankFameBalance } = useFameBalance(bankContractAddress)

  const poolClaimable = usePool(constants.PoolType.Claimable)
  const poolPurchases = usePool(constants.PoolType.Purchases)
  const poolFamePeg = usePool(constants.PoolType.FamePeg)
  const poolSacrifice = usePool(constants.PoolType.Sacrifice)

  // Duelists
  const fameMemorizedDuelists = useMemo(() => ((fameSupply ?? 0n) - (poolFamePeg?.balanceFame ?? 0n)), [fameSupply, poolFamePeg])
  const { famePercentage: fameMemorizedPercentage } = useFameSupplyPercentage(fameMemorizedDuelists);

  const { currentSeasonId } = useConfig()
  const poolSeason = useSeasonPool(currentSeasonId)

  const poolTotalLords = useMemo(() => (
    poolClaimable.balanceLords + poolPurchases.balanceLords + poolFamePeg.balanceLords + poolSacrifice.balanceLords + poolSeason.balanceLords
  ), [poolClaimable, poolPurchases, poolFamePeg, poolSacrifice, poolSeason])
  // const poolTotalFame = useMemo(() => (
  //   poolClaimable.balanceFame + poolPurchases.balanceFame + poolFamePeg.balanceFame + poolSacrifice.balanceFame + poolSeason.balanceFame
  // ), [poolClaimable, poolPurchases, poolFamePeg, poolSacrifice, poolSeason])
  const poolTotalFame = 0n; // no pools contain fame

  const diffLords = useMemo(() => (bankLordsBalance - poolTotalLords), [bankLordsBalance, poolTotalLords])
  const diffFame = useMemo(() => (bankFameBalance - poolTotalFame), [bankFameBalance, poolTotalFame])

  console.log("bank: diffLords", _formatWei(diffLords))
  console.log("bank: diffFame", _formatWei(diffFame))

  return (
    <Table celled striped size='small' color='green'>
      <Header>
        <Row>
          <HeaderCell width={3}><h3>Pools</h3></HeaderCell>
          <HeaderCell width={2}><h3>$LORDS</h3></HeaderCell>
          <HeaderCell width={3}><h3>$FAME</h3></HeaderCell>
          <HeaderCell width={1}><h3>FAME%</h3></HeaderCell>
          <HeaderCell><h3>FAME/LORDS</h3></HeaderCell>
          <HeaderCell><h3>Description</h3></HeaderCell>
        </Row>
      </Header>
      <Body>

        <Row className='H3'>
          <Cell>🏦 Bank</Cell>
          <Cell className='Code' textAlign='left'>
            <LordsBalance address={bankContractAddress} size='big' />
          </Cell>
          <Cell className='Code' textAlign='left'>
            <FameBalance address={bankContractAddress} size='big' />
          </Cell>
          <Cell className='' textAlign='left'>
          </Cell>
          <Cell className='Code' textAlign='left'>
          </Cell>
          <Cell className='' textAlign='left'>
            Total amount deposited, split into pools
          </Cell>
        </Row>

        <Row className='BgDarkest'>
          <Cell><h3 className='Important TitleCase'>$LORDS Pools</h3></Cell>
          <Cell></Cell>
          <Cell></Cell>
          <Cell></Cell>
          <Cell></Cell>
          <Cell></Cell>
        </Row>

        <PoolRow pool={poolPurchases} description='Unopened purchased packs' />
        <PoolRow pool={poolClaimable} description='Sponsored free duelists' />
        <PoolRow pool={poolSeason} description='Season prizes (dead duelists + sponsored)' />

        <Row className='BgDarkest'>
          <Cell><h3 className='Important TitleCase'>$FAME Peg</h3></Cell>
          <Cell></Cell>
          <Cell></Cell>
          <Cell></Cell>
          <Cell></Cell>
          <Cell></Cell>
        </Row>

        <Row className='H3'>
          <Cell>$FAME Supply</Cell>
          <Cell></Cell>
          <Cell className='Code' textAlign='left'>
            <Balance fame wei={fameSupply} size='big' />
          </Cell>
          <Cell className='Code Smaller' textAlign='left'>
            100%
          </Cell>
          <Cell className='Code' textAlign='left'>
          </Cell>
          <Cell className='' textAlign='left'>
            Living Duelists + Pools, equals <b>FamePeg</b>
          </Cell>
        </Row>

        <PoolRow pool={poolFamePeg} description='Opened packs, pegged to full FAME supply' />
        {/* <PoolRow pool={poolSacrifice} description='Reserved for Sacrifice (dead duelists)' /> */}

        <Row className='H3'>
          <Cell>Released FAME</Cell>
          <Cell></Cell>
          <Cell className='Code' textAlign='left'>
            <Balance fame wei={fameMemorizedDuelists} size='big' />
          </Cell>
          <Cell className='Code Smaller' textAlign='left'>
            {fameMemorizedPercentage.toFixed(2)}%
          </Cell>
          <Cell className='Code' textAlign='left'>
          </Cell>
          <Cell className='' textAlign='left'>
            Enlisted, memorialized, sacrificed
          </Cell>
        </Row>

        <Row className='BgDarkest'>
          <Cell><h3 className='Important TitleCase'>Totals</h3></Cell>
          <Cell></Cell>
          <Cell></Cell>
          <Cell></Cell>
          <Cell></Cell>
          <Cell></Cell>
        </Row>

        <Row className='H3'>
          <Cell>Pools Total</Cell>
          <Cell className='Code' textAlign='left'>
            <Balance lords wei={poolTotalLords} size='big' />
          </Cell>
          <Cell className='Code' textAlign='left'>
            <Balance fame wei={poolTotalFame} size='big' />
          </Cell>
          <Cell className='' textAlign='left'>
          </Cell>
          <Cell className='Code' textAlign='left'>
          </Cell>
          <Cell className='' textAlign='left'>
            Should equals <b>Bank</b>
          </Cell>
        </Row>

        <Row className='H3'>
          <Cell>Surplus</Cell>
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
            Should always be zero (or near zero)
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
  const { famePercentage } = useFameSupplyPercentage(balanceFame);
  const fameToLords = useMemo(() => (balanceFame && balanceLords) ? (balanceFame / balanceLords) : 0n, [balanceLords, balanceFame])

  return (
    <Row className='H3'>
      <Cell>
        🏷️ Pool::{poolType}{seasonId ? `(${seasonId})` : ''}
      </Cell>
      <Cell className='Code' textAlign='left'>
        <Balance lords wei={displayLords ? balanceLords : 0n} size='big' />
      </Cell>
      <Cell className='Code' textAlign='left'>
        <Balance fame wei={displayFame ? balanceFame : 0n} size='big' />
      </Cell>
      <Cell className='Code Smaller' textAlign='left'>
        {displayFame && famePercentage > 0 ? `${famePercentage.toFixed(2)}%` : ''}
      </Cell>
      <Cell className='Code' textAlign='left'>
        <Balance fame eth={displayFame ? fameToLords : 0n} decimals={2} size='big' />
      </Cell>
      <Cell className='' textAlign='left'>
        {description}
      </Cell>
    </Row>
  )
}

const useFameSupplyPercentage = (balanceFame: bigint) => {
  const { fameContractAddress } = useTokenContracts();
  const { totalSupply: fameSupply } = useERC20TotalSupply(fameContractAddress);
  const precision = 100000000;
  const percentage = useMemo(() => (
    (isBigint(balanceFame) && isBigint(fameSupply)) ? Math.floor((Number(weiToEth(balanceFame)) / Number(weiToEth(fameSupply))) * precision) : 0
  ), [balanceFame, fameSupply]);
  return {
    famePercentage: (percentage / precision) * 100,
  };
}

const _formatWei = (wei: bigint) => {
  let dec = bigintToDecimal(wei);
  if (dec.length < 19) dec = `00000000000000000000${dec}`.slice(-19);
  return `${dec.slice(0, -18)}.${dec.slice(-18)}`;
}
