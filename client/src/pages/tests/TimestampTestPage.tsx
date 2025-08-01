import React, { useEffect, useMemo, useState } from 'react'
import { Container, Table } from 'semantic-ui-react'
import { useClientTimestamp } from '@underware/pistols-sdk/utils/hooks'
import { useGameTimestamp } from '/src/hooks/usePistolsContractCalls'
import { formatTimestampLocal, formatTimestampDeltaTime, formatTimestampDeltaElapsed, formatTimestampDeltaCountdown } from '@underware/pistols-sdk/utils'
import { TestPageMenu } from '/src/pages/tests/TestPageIndex'
import { Connect } from '/src/pages/tests/ConnectTestPage'
import CurrentChainHint from '/src/components/CurrentChainHint'
import AppDojo from '/src/components/AppDojo'

const Row = Table.Row
const Cell = Table.Cell
const Body = Table.Body
const Header = Table.Header
const HeaderCell = Table.HeaderCell

export default function TimestampTestPage() {
  return (
    <AppDojo>
      <Container>
        <TestPageMenu />
        <CurrentChainHint />
        <Connect />

        <TimestampSync />
        <TimestampFormatTable />
        
      </Container>
    </AppDojo>
  )
}


function TimestampSync() {
  const { timestamp } = useGameTimestamp()
  const { clientTimestamp } = useClientTimestamp({ autoUpdate: true })

  return (
    <Table celled striped size='small' color='green'>
      <Body>
        <Row className='Code' columns={'equal'} verticalAlign='top'>
          <Cell>Game Timestamp</Cell>
          <Cell>{formatTimestampLocal(Number(timestamp))}</Cell>
        </Row>
        <Row className='Code' columns={'equal'} verticalAlign='top'>
          <Cell>Client Seconds</Cell>
          <Cell>{formatTimestampLocal(clientTimestamp)}</Cell>
        </Row>
      </Body>
    </Table>
  )
}


function TimestampFormatTable() {
  const { clientTimestamp } = useClientTimestamp({ autoUpdate: true })
  const start = useMemo(() => (clientTimestamp), [clientTimestamp])
  return (
    <>
      <h3>Formatting</h3>
      <Table celled striped size='small' color='orange'>
        <Header>
          <Row>
            <HeaderCell><h5>Start</h5></HeaderCell>
            <HeaderCell><h5>End</h5></HeaderCell>
            <HeaderCell><h5>Delta</h5></HeaderCell>
            <HeaderCell><h5>Elapsed</h5></HeaderCell>
            <HeaderCell><h5>Countdown</h5></HeaderCell>
          </Row>
        </Header>
        <Body>
          <TimestampFormatRow start={start} end={start} />
          <TimestampFormatRow start={start} end={start + 30} />
          <TimestampFormatRow start={start} end={start + 60} />
          <TimestampFormatRow start={start} end={start + 30 * 60} />
          <TimestampFormatRow start={start} end={start + 60 * 60} />
          <TimestampFormatRow start={start} end={start + 90 * 60} />
          <TimestampFormatRow start={start} end={start + 120 * 60} />
          <TimestampFormatRow start={start} end={start + 23 * 60 * 60} />
          <TimestampFormatRow start={start} end={start + 24 * 60 * 60 + 60} />
          <TimestampFormatRow start={start} end={start + 5 * 24 * 60 * 60 + 60} />
        </Body>
      </Table>
    </>
  )
}
function TimestampFormatRow({
  start,
  end,
}: {
  start: number
  end: number
}) {
  const elapsed = (end - start)
  return (
    <Row className='Code Smaller' columns={'equal'} verticalAlign='top'>
      <Cell>
        <span className='Inactive'>{start}s</span>
        {/* <br /><span className='Inactive'>{new Date(start * 1000).toISOString()}</span> */}
        <br />{formatTimestampLocal(start)}
      </Cell>
      <Cell>
        <span className='Inactive'>{end}s</span>
        {/* <br /><span className='Inactive'>{new Date(end * 1000).toISOString()}</span> */}
        <br />{formatTimestampLocal(end)}
      </Cell>
      <Cell>
        <span className='Inactive'>{elapsed}s</span>
        {/* <br /><span className='Inactive'>{new Date(elapsed * 1000).toISOString()}</span> */}
        <br />{formatTimestampDeltaTime(start, end).result}
      </Cell>
      <Cell>
        <span className='Inactive'>{elapsed}s</span>
        <br />{formatTimestampDeltaElapsed(start, end).result}
      </Cell>
      <Cell>
        <span className='Inactive'>{elapsed}s</span>
        <br />{formatTimestampDeltaCountdown(start, end).result}
      </Cell>
    </Row>
  )
}
