import React, { useEffect, useMemo, useState } from 'react'
import { Container, Table } from 'semantic-ui-react'
import { formatTimestampLocal, formatTimestampDeltaTime, formatTimestampDeltaElapsed, formatTimestampDeltaCountdown } from '@/lib/utils/timestamp'
import { useClientTimestamp } from '@/lib/utils/hooks/useTimestamp'
import AppPistols from '@/pistols/components/AppPistols'

const Row = Table.Row
const Cell = Table.Cell
const Body = Table.Body
const Header = Table.Header
const HeaderCell = Table.HeaderCell

export default function IndexPage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const { clientSeconds } = useClientTimestamp(true)
  const start = useMemo(() => (mounted ? clientSeconds : 0), [mounted, clientSeconds])

  return (
    <AppPistols>
      <Container>
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
            <Timestamp start={start} end={start} />
            <Timestamp start={start} end={start + 30} />
            <Timestamp start={start} end={start + 60} />
            <Timestamp start={start} end={start + 30 * 60} />
            <Timestamp start={start} end={start + 60 * 60} />
            <Timestamp start={start} end={start + 90 * 60} />
            <Timestamp start={start} end={start + 120 * 60} />
            <Timestamp start={start} end={start + 23 * 60 * 60} />
            <Timestamp start={start} end={start + 24 * 60 * 60 + 60} />
            <Timestamp start={start} end={start + 5 *24 * 60 * 60 + 60} />
          </Body>
        </Table>

      </Container>
    </AppPistols>
  )
}

function Timestamp({
  start,
  end,
}: {
  start: number
  end: number
}) {
  const elapsed = (end - start)
  return (
    <Row className='Code' columns={'equal'} verticalAlign='top'>
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
