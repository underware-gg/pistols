import React from 'react'
import { Container, Grid, SemanticCOLORS, Table } from 'semantic-ui-react'
import { useConfig } from '/src/stores/configStore'
import { useAllSeasonTableIds, useLeaderboard, useSeason, useTable } from '/src/stores/tableStore'
import { EntityStoreSync } from '/src/stores/sync/EntityStoreSync'
import { TestPageMenu } from '/src/pages/tests/TestPageIndex'
import { Connect } from './ConnectTestPage'
import CurrentChainHint from '/src/components/CurrentChainHint'
import AppDojo from '/src/components/AppDojo'
import { bigintToDecimal, formatTimestampDeltaCountdown, formatTimestampDeltaTime, formatTimestampLocal } from '@underware/pistols-sdk/utils'
import { useClientTimestamp } from '@underware/pistols-sdk/utils/hooks'
import { useCanCollectSeason } from '/src/hooks/usePistolsContractCalls'
import { ActionButton } from '/src/components/ui/Buttons'
import { useDojoContractCalls } from '@underware/pistols-sdk/dojo'
import { useAccount } from '@starknet-react/core'

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
        <TestPageMenu />
        <CurrentChainHint />
        <Connect />

        <EntityStoreSync />

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
      <Season tableId={seasonTableId} name='Current' color='green' />
      <br />
      {seasonTableIds.map((tableId, i) => (
        <Season key={tableId} tableId={tableId} name={`Season [${i}]`} />
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

  return (
    <Table attached={!Boolean(color)} color={color}>
      <Header fullWidth>
        <Row>
          <HeaderCell><h3 className='Important'>{name}</h3></HeaderCell>
          <HeaderCell><h3 className='Important'>Number</h3></HeaderCell>
          <HeaderCell><h3 className='Important'>Name</h3></HeaderCell>
          <HeaderCell><h3 className='Important'>Phase</h3></HeaderCell>
          <HeaderCell><h3 className='Important'>Start</h3></HeaderCell>
          <HeaderCell><h3 className='Important'>End</h3></HeaderCell>
          <HeaderCell><h3 className='Important'>Collect</h3></HeaderCell>
          <HeaderCell><h3 className='Important'>Leaderboards</h3></HeaderCell>
        </Row>
      </Header>

      <Body>
        <Row>
          <Cell>{tableId}</Cell>
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
          <Cell>
            <Leaderboards tableId={tableId} />
          </Cell>
        </Row>
      </Body>
    </Table>
  )
}


function Leaderboards({
  tableId,
}: {
  tableId: string,
}) {
  const { positions, scorePerDuelistId } = useLeaderboard(tableId)
  console.log(`Leaderboards() =>`, tableId, positions, scorePerDuelistId)

  return (
    <Grid style={{ width: '150px' }}>
      {Object.entries(scorePerDuelistId).map(([duelistId, score]) => (
        <Grid.Row columns={'equal'}>
          <Grid.Column>
            <span className='Important'>
              {`Duelist #${duelistId}`}
            </span>
          </Grid.Column>
          <Grid.Column>
            {score}
          </Grid.Column>
        </Grid.Row>
      ))}
    </Grid>
  )
}

