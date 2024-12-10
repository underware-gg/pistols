import React, { useEffect, useMemo, useState } from 'react'
import { AccountInterface, typedData } from 'starknet'
import { Container, Table } from 'semantic-ui-react'
import { useAccount, useNetwork } from '@starknet-react/core'
import { useTypedMessage } from '@/lib/utils/hooks/useTypedMessage'
import { Messages, createTypedMessage } from '@/lib/utils/starknet_sign'
import { bigintToHex, shortAddress } from '@/lib/utils/types'
import AppPistols from '@/pistols/components/AppPistols'
import { formatTimestampLocal, formatTimestampDeltaTime, formatTimestampDelta } from '@/lib/utils/timestamp'
import { useClientTimestamp } from '@/lib/utils/hooks/useTimestamp'

const Row = Table.Row
const Cell = Table.Cell
const Body = Table.Body
const Header = Table.Header
const HeaderCell = Table.HeaderCell

const starknetDomain = {
  name: 'Underware',
  version: '1.0',
  chainId: 'UNDERWARE_GG',
  revision: '1',
}

export default function IndexPage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const { clientTimestamp } = useClientTimestamp(true)
  const start = useMemo(() => (mounted ? clientTimestamp : 0), [mounted])

  return (
    <AppPistols>
      <Container>
        <Table celled striped size='small' color='orange'>
          <Header>
            <Row>
              <HeaderCell><h5>Start</h5></HeaderCell>
              <HeaderCell><h5>End</h5></HeaderCell>
              <HeaderCell><h5>Delta</h5></HeaderCell>
              <HeaderCell><h5>Ago</h5></HeaderCell>
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

  return (
    <Row className='Code' columns={'equal'} verticalAlign='top'>
      <Cell>
        <span className='Inactive'>{start}</span>
        <br />
        {formatTimestampLocal(start)}
      </Cell>
      <Cell>
        <span className='Inactive'>{end}</span>
        <br />
        {formatTimestampLocal(end)}
      </Cell>
      <Cell>
        <span className='Inactive'>{end - start}</span>
        <br />
        {formatTimestampDeltaTime(start, end)}
      </Cell>
      <Cell>
        <span className='Inactive'>{end - start}</span>
        <br />
        {formatTimestampDelta(start, end)}
      </Cell>
    </Row>
  )
}
