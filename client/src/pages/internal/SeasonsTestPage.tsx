import React, { useMemo, useState } from 'react'
import { Container, SemanticCOLORS, Table } from 'semantic-ui-react'
import { BigNumberish } from 'starknet'
import { useAllSeasonTableIds, useLeaderboard, useSeason, useTable } from '/src/stores/tableStore'
import { bigintToHex, formatTimestampDeltaCountdown, formatTimestampDeltaTime, formatTimestampLocal } from '@underware/pistols-sdk/utils'
import { formatQueryValue, useControllerUsername, useDojoContractCalls, useSdkStateEntitiesGet } from '@underware/pistols-sdk/dojo'
import { parseCustomEnum, parseEnumVariant, stringToFelt } from '@underware/pistols-sdk/utils/starknet'
import { useClientTimestamp, useMounted } from '@underware/pistols-sdk/utils/hooks'
import { useCanCollectSeason } from '/src/hooks/usePistolsContractCalls'
import { useAccount } from '@starknet-react/core'
import { useConfig } from '/src/stores/configStore'
import { usePlayer } from '/src/stores/playerStore'
import { useOwnerOfDuelist } from '/src/hooks/useTokenDuelists'
import { PistolsClauseBuilder } from '@underware/pistols-sdk/pistols'
import { PistolsQueryBuilder } from '@underware/pistols-sdk/pistols'
import { EntityStoreSync } from '/src/stores/sync/EntityStoreSync'
import { PlayerNameSync } from '/src/stores/sync/PlayerNameSync'
import { ActionButton } from '/src/components/ui/Buttons'
import { InternalPageMenu } from '/src/pages/internal/InternalPageIndex'
import { Connect } from '/src/pages/tests/ConnectTestPage'
import { constants } from '@underware/pistols-sdk/pistols/gen'
import CurrentChainHint from '/src/components/CurrentChainHint'
import AppDojo from '/src/components/AppDojo'

// const Row = Grid.Row
// const Col = Grid.Column
const Row = Table.Row
const Cell = Table.Cell
const Body = Table.Body
const Header = Table.Header
const HeaderCell = Table.HeaderCell

export default function SeasonsTestPage() {
  return (
    <AppDojo>
      <Container>
        <InternalPageMenu />
        <CurrentChainHint />
        <Connect />

        <EntityStoreSync />
        <PlayerNameSync />

        <Seasons />
      </Container>
    </AppDojo>
  );
}

function Seasons() {
  const { seasonTableId } = useConfig()
  const { seasonTableIds } = useAllSeasonTableIds()
  return (
    <>
      <br />
      <Season tableId={seasonTableId} name='Current' color='green' />
      {seasonTableIds.map((tableId, i) => (
        <Season key={tableId} tableId={tableId} name={`Season [${i}]`} color='orange' />
      ))}
    </>
  );
}

function Season({
  tableId,
  name,
  color,
}: {
  tableId: string,
  name: string,
  color?: SemanticCOLORS,
}) {
  const { account } = useAccount()
  const { description } = useTable(tableId)
  const { seasonId, phase, timestamp_start, timestamp_end } = useSeason(tableId)
  const { clientTimestamp } = useClientTimestamp()
  const { canCollectSeason } = useCanCollectSeason()
  const { game: { collectSeason } } = useDojoContractCalls()
  const [displayReports, setDisplayReports] = useState(false)

  return (
    <>
      <Table celled attached color={color}>
        <Header fullWidth>
          <Row>
            <HeaderCell><h3 className='Important'>{name}</h3></HeaderCell>
            <HeaderCell><h3 className='Important'>Number</h3></HeaderCell>
            <HeaderCell><h3 className='Important'>Name</h3></HeaderCell>
            <HeaderCell><h3 className='Important'>Phase</h3></HeaderCell>
            <HeaderCell><h3 className='Important'>Start</h3></HeaderCell>
            <HeaderCell><h3 className='Important'>End</h3></HeaderCell>
            <HeaderCell><h3 className='Important'>Collect</h3></HeaderCell>
          </Row>
        </Header>

        <Body>
          <Row>
            <Cell>
              <span className='Important H3'>{tableId}</span>
              <br />
              <br />
              <ActionButton
                label={'Reports'}
                onClick={() => setDisplayReports(!displayReports)}
              />
            </Cell>
            <Cell>{seasonId}</Cell>
            <Cell>{description}</Cell>
            <Cell>{phase}</Cell>
            <Cell>{formatTimestampLocal(timestamp_start)}</Cell>
            <Cell>
              {formatTimestampLocal(timestamp_end)}
              <br />
              {formatTimestampDeltaTime(clientTimestamp, timestamp_end).result}
              <br />
              {formatTimestampDeltaCountdown(clientTimestamp, timestamp_end).result}
            </Cell>
            <Cell>
              <ActionButton
                disabled={!canCollectSeason}
                label={'Collect'}
                onClick={() => collectSeason(account)}
              />
            </Cell>
          </Row>
        </Body>
      </Table>
      {displayReports && <>
        <Leaderboards tableId={tableId} />
        <PacksReport tableId={tableId} />
        <DuelistsReport tableId={tableId} />
        <DuelsReport tableId={tableId} />
      </>
      }
      <br />
    </>
  )
}

function Leaderboards({
  tableId,
}: {
  tableId: string,
}) {
  const { maxPositions, scores } = useLeaderboard(tableId)

  // console.log(`Leaderboards() =>`, tableId, maxPositions, scorePerDuelistId)
  return (
    <Table celled attached>
      <Header fullWidth>
        <Row>
          <HeaderCell><h3 className='Important'>Leaderboards</h3></HeaderCell>
          <HeaderCell><h3 className='Important'>Points</h3></HeaderCell>
          <HeaderCell><h3 className='Important'>Wallet</h3></HeaderCell>
          <HeaderCell><h3 className='Important'>Username</h3></HeaderCell>
        </Row>
      </Header>
      <Body>
        {scores.map(({ duelistId, score }, index) => (
          <LeaderboardRow key={duelistId} duelistId={duelistId} score={score} index={index} />
        ))}
      </Body>
    </Table>
  )
}
function LeaderboardRow({
  duelistId,
  score,
  index,
}: {
  duelistId: BigNumberish,
  score: number,
  index: number,
}) {
  const { owner, isLoading: isLoadingOwner } = useOwnerOfDuelist(duelistId)
  // const { username, isLoading: isLoadingUsername } = useControllerUsername(isLoadingOwner ? undefined : owner)
  const { username } = usePlayer(owner)
  return (
    <Row key={duelistId}>
      <Cell>
        <span className='Important'>
          {`Duelist #${duelistId}`}
        </span>
      </Cell>
      <Cell className='Code'>{score}</Cell>
      <Cell className='Code'>{isLoadingOwner ? '...' : bigintToHex(owner)}</Cell>
      {/* <Cell className='Code'>{isLoadingUsername ? '...' : username}</Cell> */}
      <Cell className='Code'>{username || '...'}</Cell>
    </Row>
  )
}


function DuelsReport({ tableId }: { tableId: string }) {
  const mounted = useMounted()
  const query = useMemo<PistolsQueryBuilder>(() => (
    new PistolsQueryBuilder()
      .withClause(
        new PistolsClauseBuilder().where(
          "pistols-Challenge", "table_id", "Eq", formatQueryValue(stringToFelt(tableId)),
        ).build()
      )
      .withEntityModels(['pistols-Challenge', 'pistols-Round'])
      .withLimit(10000)
      .includeHashedKeys()
  ), [tableId])
  const { entities, isLoading } = useSdkStateEntitiesGet({
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
        let challenge = entity.Challenge
        let round = entity.Round
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
          const { variant, value } = parseCustomEnum<constants.FinalBlow>(round.final_blow)
          if (variant !== constants.FinalBlow.Undefined) {
            const { variant: paces } = parseCustomEnum<constants.FinalBlow>(value)
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


function PacksReport({ tableId }: { tableId: string }) {
  const mounted = useMounted()
  const query = useMemo<PistolsQueryBuilder>(() => (
    new PistolsQueryBuilder()
      .withEntityModels(['pistols-Pack'])
      .withLimit(10000)
      .includeHashedKeys()
  ), [tableId])
  const { entities, isLoading } = useSdkStateEntitiesGet({
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
        let pack = entity.Pack
        if (pack) {
          const pack_type = parseEnumVariant<constants.PackType>(pack.pack_type)
          packsCount++;
          if (pack_type == constants.PackType.StarterPack) {
            starterCount++;
          } else if (pack_type == constants.PackType.Duelists5x) {
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



function DuelistsReport({ tableId }: { tableId: string }) {
  const mounted = useMounted()
  const query = useMemo<PistolsQueryBuilder>(() => (
    new PistolsQueryBuilder()
      .withEntityModels(['pistols-Duelist', 'pistols-DuelistMemorial'])
      .withLimit(10000)
      .includeHashedKeys()
  ), [tableId])
  const { entities, isLoading } = useSdkStateEntitiesGet({
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
        let duelist = entity.Duelist
        let memorial = entity.DuelistMemorial
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
