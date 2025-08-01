import React, { useMemo, useState } from 'react'
import { Container, Table } from 'semantic-ui-react'
import { BigNumberish } from 'starknet'
import { useAllSeasonIds, useLeaderboard, useSeason } from '/src/stores/seasonStore'
import { PistolsClauseBuilder, PistolsQueryBuilder, getEntityModel } from '@underware/pistols-sdk/pistols/sdk'
import { bigintToDecimal, formatTimestampDeltaCountdown, formatTimestampDeltaTime, formatTimestampLocal } from '@underware/pistols-sdk/utils'
import { useDojoSystemCalls, useSdkEntitiesGetState } from '@underware/pistols-sdk/dojo'
import { parseCustomEnum, parseEnumVariant } from '@underware/pistols-sdk/starknet'
import { useClientTimestamp, useMemoGate, useMounted } from '@underware/pistols-sdk/utils/hooks'
import { useCanCollectSeason } from '/src/hooks/usePistolsContractCalls'
import { useLordsReleaseEvents, Bill } from '/src/queries/useLordsReleaseEvents'
import { useSeasonPool } from '/src/stores/bankStore'
import { useSeasonsTotals } from '/src/queries/useSeasonsTotals'
import { useAccount } from '@starknet-react/core'
import { useConfig } from '/src/stores/configStore'
import { usePlayer } from '/src/stores/playerStore'
import { useOwnerOfDuelist } from '/src/hooks/useTokenDuelists'
import { ActionButton } from '/src/components/ui/Buttons'
import { InternalPageMenu, InternalPageWrapper } from '/src/pages/internal/InternalPageIndex'
import { Address } from '/src/components/ui/Address'
import { Balance } from '/src/components/account/Balance'
import { Connect } from '/src/pages/tests/ConnectTestPage'
import { constants, models } from '@underware/pistols-sdk/pistols/gen'
import CurrentChainHint from '/src/components/CurrentChainHint'
import StoreSync from '/src/stores/sync/StoreSync'
import AppDojo from '/src/components/AppDojo'

// const Row = Grid.Row
// const Col = Grid.Column
const Row = Table.Row
const Cell = Table.Cell
const Body = Table.Body
const Header = Table.Header
const HeaderCell = Table.HeaderCell

export default function SeasonsPage() {
  return (
    <AppDojo>
      <Container>
        <InternalPageMenu />
        <CurrentChainHint />
        <Connect />

        <InternalPageWrapper>
          <Seasons />
        </InternalPageWrapper>

        <StoreSync />
      </Container>
    </AppDojo>
  );
}

function Seasons() {
  const { currentSeasonId } = useConfig()
  const { seasonIdsDescending: seasonIds } = useAllSeasonIds()
  const [reportSeasonId, setReportSeasonId] = useState<number>()
  const totalsPerSeason = useSeasonsTotals()
  const header = (
    <Header fullWidth>
      <Row>
        <HeaderCell><h3 className='Important'>Season</h3></HeaderCell>
        <HeaderCell><h3 className='Important'>#</h3></HeaderCell>
        <HeaderCell><h3 className='Important'>Name</h3></HeaderCell>
        <HeaderCell><h3 className='Important'>Phase</h3></HeaderCell>
        <HeaderCell><h3 className='Important'>Pool</h3></HeaderCell>
        <HeaderCell><h3 className='Important'>Players</h3></HeaderCell>
        <HeaderCell><h3 className='Important'>Start</h3></HeaderCell>
        <HeaderCell><h3 className='Important'>End</h3></HeaderCell>
        <HeaderCell><h3 className='Important'></h3></HeaderCell>
      </Row>
    </Header>
  )
  return (
    <>
      <Table celled color='orange'>
        {header}
        <Body>
          {seasonIds.map((seasonId, i) => (
            <SeasonRow key={seasonId}
              seasonId={seasonId}
              isCurrent={seasonId === currentSeasonId}
              reportSeasonId={reportSeasonId}
              setReport={setReportSeasonId}
              playerCount={totalsPerSeason[seasonId]?.playerCount}
            />
          ))}
        </Body>
      </Table>
      {reportSeasonId &&
        <>
          <br />
          <Table celled color='green'>
            {header}
            <Body>
            <SeasonRow key={reportSeasonId}
              seasonId={reportSeasonId}
              isCurrent={reportSeasonId === currentSeasonId}
              setReport={setReportSeasonId}
              actions={false}
              playerCount={totalsPerSeason[reportSeasonId]?.playerCount}
            />
            </Body>
          </Table>
          <PacksReport seasonId={reportSeasonId} />
          <DuelistsReport seasonId={reportSeasonId} />
          <DuelsReport seasonId={reportSeasonId} />
          <Leaderboards seasonId={reportSeasonId} />
          <LordsReleaseEvents seasonId={reportSeasonId} />
        </>
      }
      <br />
    </>
  );
}

function SeasonRow({
  seasonId,
  isCurrent,
  actions = true,
  setReport,
  reportSeasonId,
  playerCount,
}: {
  seasonId: number,
  isCurrent: boolean,
  actions?: boolean,
  setReport: (seasonId: number) => void,
  reportSeasonId?: number,
  playerCount: number,
}) {
  const { account } = useAccount()
  const { seasonName } = useSeason(seasonId)
  const { phase, timestamp_start, timestamp_end, isActive } = useSeason(seasonId)
  const { clientTimestamp } = useClientTimestamp({ autoUpdate: isActive })
  const { canCollectSeason } = useCanCollectSeason()
  const { bank } = useDojoSystemCalls()
  const poolSeason = useSeasonPool(seasonId)
  return (
    <Row>
      <Cell>
        <span className='Important H3'>
          {isCurrent ? <b>{seasonId} (Current)</b> : seasonId}
        </span>
      </Cell>
      <Cell>{seasonId}</Cell>
      <Cell>{seasonName}</Cell>
      <Cell>{phase}</Cell>
      <Cell><Balance lords wei={poolSeason.balanceLords} /></Cell>
      <Cell>{playerCount ?? '...'}</Cell>
      <Cell>{formatTimestampLocal(timestamp_start)}</Cell>
      <Cell>
        {formatTimestampLocal(timestamp_end)}
        <br />
        {formatTimestampDeltaTime(clientTimestamp, timestamp_end).result}
        {` / `}
        {formatTimestampDeltaCountdown(clientTimestamp, timestamp_end).result}
      </Cell>
      {actions &&
        <Cell>
          <ActionButton
            label={'Reports'}
            important={reportSeasonId == seasonId}
            onClick={() => setReport(reportSeasonId != seasonId ? seasonId : null)}
          />
          &nbsp;
          {isCurrent &&
            <ActionButton
              disabled={!canCollectSeason}
              label={'Collect'}
            onClick={() => bank.collect_season(account)}
            />
          }
        </Cell>
      }
    </Row>
  )
}

function DuelsReport({ seasonId }: { seasonId: number }) {
  const mounted = useMounted()
  const query = useMemoGate<PistolsQueryBuilder>(() => (
    new PistolsQueryBuilder()
      .withClause(
        new PistolsClauseBuilder().where(
          "pistols-Challenge", "season_id", "Eq", seasonId,
        ).build()
      )
      .withEntityModels(['pistols-Challenge', 'pistols-Round'])
      .withLimit(10000)
      .includeHashedKeys()
  ), [seasonId])
  const { entities, isLoading } = useSdkEntitiesGetState({
    query,
    enabled: mounted,
  })
  // useEffect(() => console.log(`DuelsReport() [${Object.keys(entities ?? {}).length}] =>`, entities), [entities])

  const {
    duelsCount,
    withdrawnCount,
    refusedCount,
    expiredCount,
    inProgressCount,
    resolvedCount,
    drawCount,
    duelistsSet,
    finalBlowSet,
  } = useMemo(() => {
    let duelsCount = 0
    let withdrawnCount = 0
    let refusedCount = 0
    let expiredCount = 0
    let inProgressCount = 0
    let resolvedCount = 0
    let drawCount = 0
    let duelistsSet = new Set<bigint>()
    let finalBlowSet: { [key: string]: number } = {}
    if (entities) {
      Object.values(entities).forEach((entity) => {
        let challenge = getEntityModel<models.Challenge>(entity, 'Challenge')
        let round = getEntityModel<models.Round>(entity, 'Round')
        if (challenge) {
          const state = parseEnumVariant<constants.ChallengeState>(challenge.state)
          duelsCount++;
          if (state === constants.ChallengeState.Withdrawn) withdrawnCount++;
          if (state === constants.ChallengeState.Refused) refusedCount++;
          if (state === constants.ChallengeState.Expired) expiredCount++;
          if (state === constants.ChallengeState.InProgress) inProgressCount++;
          if (state === constants.ChallengeState.Resolved) resolvedCount++;
          if (state === constants.ChallengeState.Draw) drawCount++;
          duelistsSet.add(BigInt(challenge.duelist_id_a))
          duelistsSet.add(BigInt(challenge.duelist_id_b))
        }
        if (round) {
          const { variant, value } = parseCustomEnum<constants.FinalBlow, string>(round.final_blow)
          if (variant !== constants.FinalBlow.Undefined) {
            const paces = constants.getPacesCardValue(value as constants.PacesCard)
            const key = `${variant}:${paces}`;
            if (!finalBlowSet[key]) finalBlowSet[key] = 0;
            finalBlowSet[key]++;
          }
        }
      })
    }
    return {
      duelsCount,
      withdrawnCount,
      refusedCount,
      expiredCount,
      inProgressCount,
      resolvedCount,
      drawCount,
      duelistsSet,
      finalBlowSet,
    }
  }, [entities])

  return (
    <Table celled attached>
      <Header fullWidth>
        <Row>
          <HeaderCell><h3 className='Important'>Duels</h3></HeaderCell>
          <HeaderCell><h3 className='Important'>Withdrawn</h3></HeaderCell>
          <HeaderCell><h3 className='Important'>Refused</h3></HeaderCell>
          <HeaderCell><h3 className='Important'>Expired</h3></HeaderCell>
          <HeaderCell><h3 className='Important'>InProgress</h3></HeaderCell>
          <HeaderCell><h3 className='Important'>Resolved</h3></HeaderCell>
          <HeaderCell><h3 className='Important'>Draw</h3></HeaderCell>
          <HeaderCell><h3 className='Important'>Duelists</h3></HeaderCell>
          <HeaderCell><h3 className='Important'>Results</h3></HeaderCell>
        </Row>
      </Header>
      <Body>
        <Row className='Code' verticalAlign='top'>
          <Cell>{isLoading ? '...' : duelsCount}</Cell>
          <Cell>{isLoading ? '...' : withdrawnCount}</Cell>
          <Cell>{isLoading ? '...' : refusedCount}</Cell>
          <Cell>{isLoading ? '...' : expiredCount}</Cell>
          <Cell>{isLoading ? '...' : inProgressCount}</Cell>
          <Cell>{isLoading ? '...' : resolvedCount}</Cell>
          <Cell>{isLoading ? '...' : drawCount}</Cell>
          <Cell>{isLoading ? '...' : duelistsSet.size}</Cell>
          <Cell className='Smaller'>{isLoading ? '...' : Object.entries(finalBlowSet).map(([key, value]) => (
            <div key={key}>({value}) {key}</div>
          ))}</Cell>
        </Row>
      </Body>
    </Table>
  )
}


function PacksReport({ seasonId }: { seasonId: number }) {
  const mounted = useMounted()
  const query = useMemo<PistolsQueryBuilder>(() => (
    new PistolsQueryBuilder()
      .withEntityModels(['pistols-Pack'])
      .withLimit(10000)
      .includeHashedKeys()
  ), [seasonId])
  const { entities, isLoading } = useSdkEntitiesGetState({
    query,
    enabled: mounted,
  })

  const {
    packsCount,
    starterCount,
    duelistPackCount,
    duelistPackOpenedCount,
    duelistPackClosedCount,
  } = useMemo(() => {
    let packsCount = 0
    let starterCount = 0
    let duelistPackCount = 0
    let duelistPackOpenedCount = 0
    let duelistPackClosedCount = 0
    if (entities) {
      Object.values(entities).forEach((entity) => {
        let pack = getEntityModel<models.Pack>(entity, 'Pack')
        if (pack) {
          const pack_type = parseEnumVariant<constants.PackType>(pack.pack_type)
          packsCount++;
          if (pack_type == constants.PackType.StarterPack) {
            starterCount++;
          } else if (pack_type == constants.PackType.GenesisDuelists5x) {
            duelistPackCount++;
            if (pack.is_open) duelistPackOpenedCount++;
            if (!pack.is_open) duelistPackClosedCount++;
          }
        }
      })
    }
    return {
      packsCount,
      starterCount,
      duelistPackCount,
      duelistPackOpenedCount,
      duelistPackClosedCount,
    }
  }, [entities])

  return (
    <Table celled attached>
      <Header fullWidth>
        <Row>
          <HeaderCell width={2}><h3 className='Important'>Packs</h3></HeaderCell>
          <HeaderCell width={2}><h3 className='Important'>Starter</h3></HeaderCell>
          <HeaderCell width={2}><h3 className='Important'>5X Duelists</h3></HeaderCell>
          <HeaderCell width={2}><h3 className='Important'>(closed)</h3></HeaderCell>
          <HeaderCell width={2}><h3 className='Important'>(opened)</h3></HeaderCell>
          <HeaderCell></HeaderCell>
        </Row>
      </Header>
      <Body>
        <Row className='Code'>
          <Cell>{isLoading ? '...' : packsCount}</Cell>
          <Cell>{isLoading ? '...' : starterCount}</Cell>
          <Cell>{isLoading ? '...' : duelistPackCount}</Cell>
          <Cell>{isLoading ? '...' : duelistPackClosedCount}</Cell>
          <Cell>{isLoading ? '...' : duelistPackOpenedCount}</Cell>
        </Row>
      </Body>
    </Table>
  )
}

function DuelistsReport({ seasonId }: { seasonId: number }) {
  const mounted = useMounted()
  const query = useMemo<PistolsQueryBuilder>(() => (
    new PistolsQueryBuilder()
      .withEntityModels(['pistols-Duelist', 'pistols-DuelistMemorial'])
      .withLimit(10000)
      .includeHashedKeys()
  ), [seasonId])
  const { entities, isLoading } = useSdkEntitiesGetState({
    query,
    enabled: mounted,
  })
  // useEffect(() => console.log(`DuelsReport() [${Object.keys(entities ?? {}).length}] =>`, entities), [entities])

  const {
    duelistsCount,
    duelistsDeadCount,
    duelistsAliveCount,
  } = useMemo(() => {
    let duelistsCount = 0
    let duelistsDeadCount = 0
    let duelistsAliveCount = 0
    if (entities) {
      Object.values(entities).forEach((entity) => {
        let duelist = getEntityModel<models.Duelist>(entity, 'Duelist')
        let memorial = getEntityModel<models.DuelistMemorial>(entity, 'DuelistMemorial')
        if (duelist) {
          duelistsCount++;
          if (memorial) duelistsDeadCount++;
          if (!memorial) duelistsAliveCount++;
        }
      })
    }
    return {
      duelistsCount,
      duelistsDeadCount,
      duelistsAliveCount,
    }
  }, [entities])

  return (
    <Table celled attached>
      <Header fullWidth>
        <Row>
          <HeaderCell width={2}><h3 className='Important'>Duelists</h3></HeaderCell>
          <HeaderCell width={2}><h3 className='Important'>(Dead)</h3></HeaderCell>
          <HeaderCell width={2}><h3 className='Important'>(Alive)</h3></HeaderCell>
          <HeaderCell></HeaderCell>
        </Row>
      </Header>
      <Body>
        <Row className='Code'>
          <Cell>{isLoading ? '...' : duelistsCount}</Cell>
          <Cell>{isLoading ? '...' : duelistsDeadCount}</Cell>
          <Cell>{isLoading ? '...' : duelistsAliveCount}</Cell>
        </Row>
      </Body>
    </Table>
  )
}



//--------------------------------
// Leaderboards
//
export function Leaderboards({
  seasonId,
}: {
  seasonId: number,
}) {
  const { maxPositions, scores } = useLeaderboard(seasonId)

  // console.log(`Leaderboards() =>`, seasonId, maxPositions, scorePerDuelistId)
  return (
    <Table celled color='green'>
      <Header fullWidth>
        <Row>
          <HeaderCell><h3 className='Important'>Position</h3></HeaderCell>
          <HeaderCell><h3 className='Important'>Leaderboards</h3></HeaderCell>
          <HeaderCell><h3 className='Important'>Points</h3></HeaderCell>
          <HeaderCell><h3 className='Important'>Wallet</h3></HeaderCell>
          <HeaderCell><h3 className='Important'>Username</h3></HeaderCell>
        </Row>
      </Header>
      <Body>
        {scores.map(({ duelistId, points }, index) => (
          <LeaderboardRow key={duelistId} duelistId={duelistId} points={points} index={index} />
        ))}
      </Body>
    </Table>
  )
}
function LeaderboardRow({
  duelistId,
  points,
  index,
}: {
  duelistId: BigNumberish,
  points: number,
  index: number,
}) {
  const { owner, isLoading: isLoadingOwner } = useOwnerOfDuelist(duelistId)
  const { username } = usePlayer(owner)
  return (
    <Row key={duelistId}>
      <Cell>
        {index + 1}
      </Cell>
      <Cell>
        <span className='Important'>
          {`Duelist #${duelistId}`}
        </span>
      </Cell>
      <Cell className='Code'>{points}</Cell>
      <Cell className='Code'><Address address={owner} full /></Cell>
      {/* <Cell className='Code'>{isLoadingUsername ? '...' : username}</Cell> */}
      <Cell className='Code'>{username || '...'}</Cell>
    </Row>
  )
}



//--------------------------------
// Lords Releases
//
function LordsReleaseEvents({
  seasonId,
}: {
  seasonId: number,
}) {
  const { bills } = useLordsReleaseEvents(seasonId)
  const {
    otherBills,
    developerBills,
    consolidatedDeveloperBill,
  } = useMemo(() => {
    const otherBills = bills.filter((bill) => bill.reason !== constants.ReleaseReason.FameLostToDeveloper);
    const developerBills = bills.filter((bill) => bill.reason === constants.ReleaseReason.FameLostToDeveloper);
    const consolidatedDeveloperBill = developerBills.reduce((acc, bill) => {
      acc.peggedFame += bill.peggedFame;
      acc.peggedLords += bill.peggedLords;
      acc.sponsoredLords += bill.sponsoredLords;
      acc.recipient = bill.recipient;
      return acc;
    }, {
      seasonId,
      duelistId: 0n,
      duelId: 0n,
      timestamp: 0,
      recipient: 0n,
      reason: constants.ReleaseReason.FameLostToDeveloper,
      position: 0,
      peggedFame: 0n,
      peggedLords: 0n,
      sponsoredLords: 0n,
    } as Bill);
    return {
      otherBills,
      developerBills,
      consolidatedDeveloperBill
    };
  }, [bills])
  return (
    <Table celled color='green'>
      <Header fullWidth>
        <Row>
          <HeaderCell><h3 className='Important'>Account</h3></HeaderCell>
          <HeaderCell><h3 className='Important'>Username</h3></HeaderCell>
          <HeaderCell><h3 className='Important'>Duelist</h3></HeaderCell>
          <HeaderCell><h3 className='Important'>Duel</h3></HeaderCell>
          <HeaderCell><h3 className='Important'>Reason</h3></HeaderCell>
          <HeaderCell><h3 className='Important'>Pegged Lords</h3></HeaderCell>
          <HeaderCell><h3 className='Important'>Sponsored Lords</h3></HeaderCell>
          <HeaderCell><h3 className='Important'>Recipient</h3></HeaderCell>
          <HeaderCell><h3 className='Important'>Timestamp</h3></HeaderCell>
        </Row>
      </Header>
      <Body>
        {/* {bills.map((bill, index) => <BillRow key={`${index}`} bill={bill} />)} */}
        {/* {developerBills.map((bill, index) => <BillRow key={`${index}`} bill={bill} />)} */}
        <BillRow bill={consolidatedDeveloperBill} />
        {otherBills.map((bill, index) => <BillRow key={`${index}`} bill={bill} />)}
      </Body>
    </Table>
  )
}

function BillRow({
  bill,
}: {
  bill: Bill,
}) {
  const { owner, isLoading: isLoadingOwner } = useOwnerOfDuelist(bill.duelistId)
  const { username } = usePlayer(owner)
  return (
    <Row>
      <Cell>{isLoadingOwner ? '...' : <Address address={owner} />}</Cell>
      <Cell className='Code'>{username || '...'}</Cell>
      <Cell>Duelist #{bigintToDecimal(bill.duelistId)}</Cell>
      <Cell>Duel #{bigintToDecimal(bill.duelId)}</Cell>
      <Cell>{bill.reason}{bill.position ? ` (${bill.position})` : ''}</Cell>
      <Cell>
        <Balance fame wei={bill.peggedFame} />
        {` = `}
        <Balance lords wei={bill.peggedLords} decimals={6} />
      </Cell>
      <Cell><Balance lords wei={bill.sponsoredLords} decimals={6} /></Cell>
      <Cell><Address address={bill.recipient} /></Cell>
      <Cell>{formatTimestampLocal(bill.timestamp)}</Cell>
    </Row>
  )
}

