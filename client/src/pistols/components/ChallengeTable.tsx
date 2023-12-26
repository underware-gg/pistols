import React, { useEffect, useMemo, useState } from 'react'
import { Grid, Table } from 'semantic-ui-react'
import { useDuelist } from '@/pistols/hooks/useDuelist'
import { useAllChallengeIds, useChallenge, useChallengeIdsByDuelist } from '@/pistols/hooks/useChallenge'
import { ProfilePicSquare } from '@/pistols/components/account/ProfilePic'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { ChallengeState, ChallengeStateNames } from '@/pistols/utils/pistols'
import { formatTimestamp, formatTimestampDelta } from '@/pistols/utils/utils'
import { useTimestampCountdown } from '../hooks/useTimestamp'

const Row = Grid.Row
const Col = Grid.Column
const Cell = Table.Cell
const HeaderCell = Table.HeaderCell

export function ChallengeTableMain({
}) {
  const { challengeIds } = useAllChallengeIds()
  return (
    <div className='TableMain'>
      <ChallengeTableByIds challengeIds={challengeIds} />
    </div>
  )
}

export function ChallengeTableByDuelist({
  address = null,
}) {
  const { challengeIds } = useChallengeIdsByDuelist(address)
  return <ChallengeTableByIds challengeIds={challengeIds} />
}


export function ChallengeTableByIds({
  challengeIds,
}) {
  const [order, setOrder] = useState({})
  const _timestampCallback = (id, t) => {
    setOrder(o => ({ ...o, [id]: t }))
  }

  const rows = useMemo(() => {
    let result = []
    challengeIds.forEach((duelId, index) => {
      result.push(<DuelItem key={duelId} duelId={duelId} timestampCallback={_timestampCallback} />)
    })
    return result
  }, [challengeIds])

  const sortedRows = useMemo(() => rows.sort((a, b) => (order[b.key] ?? 0) - (order[a.key] ?? 0)), [rows, order])

  return (
    <Table sortable selectable className='Faded' color='red'>
      <Table.Header className='TableHeader'>
        <Table.Row textAlign='left' verticalAlign='middle'>
          <HeaderCell width={1}></HeaderCell>
          <HeaderCell>Challenger</HeaderCell>
          <HeaderCell width={1}></HeaderCell>
          <HeaderCell>Challenged</HeaderCell>
          <HeaderCell width={2} textAlign='center'>State</HeaderCell>
          <HeaderCell width={4} textAlign='center'>Time</HeaderCell>
        </Table.Row>
      </Table.Header>

      {sortedRows.length > 0 ?
        <Table.Body className='TableBody'>
          {sortedRows}
        </Table.Body>
        :
        <Table.Footer fullWidth>
          <Table.Row>
            <Cell colSpan='100%' textAlign='center'>
              no duels here
            </Cell>
          </Table.Row>
        </Table.Footer>
      }
    </Table>
  )
}


function DuelItem({
  duelId,
  timestampCallback,
}) {
  const { dispatchSetDuel } = usePistolsContext()
  const { duelistA, duelistB, state, winner, timestamp, timestamp_expire, timestamp_start, timestamp_end } = useChallenge(duelId)
  const { name: nameA, profilePic: profilePicA } = useDuelist(duelistA)
  const { name: nameB, profilePic: profilePicB } = useDuelist(duelistB)
  const timestamp_system = useTimestampCountdown()
  // console.log(timestamp, timestamp_expire, `>`, timestamp_system)
  
  useEffect(() => {
    if (timestamp) timestampCallback(duelId, timestamp)
  }, [timestamp])

  const winnerIsA = useMemo(() => (duelistA == winner), [duelistA, winner])
  const winnerIsB = useMemo(() => (duelistB == winner), [duelistB, winner])
  const isAwaiting = useMemo(() => [ChallengeState.Awaiting].includes(state), [state])
  const isInProgress = useMemo(() => [ChallengeState.InProgress].includes(state), [state])
  const isCanceled = useMemo(() => [ChallengeState.Withdrawn, ChallengeState.Refused].includes(state), [state])
  const isDraw = useMemo(() => [ChallengeState.Draw].includes(state), [state])

  const date = useMemo(() => {
    if (isAwaiting) return '⏱️ ' + formatTimestampDelta(timestamp_system, timestamp_expire)
    if (isInProgress || winnerIsA || winnerIsB) return /*'⚔️ ' +*/ formatTimestamp(timestamp_start)
    if (isCanceled) return /*'🚫 ' +*/ formatTimestamp(timestamp_end)
    if (isDraw) return /*'🤝 ' +*/ formatTimestamp(timestamp_end)
    return formatTimestamp(timestamp)
  }, [state, timestamp, timestamp_expire, timestamp_start, timestamp_end])

  return (
    <Table.Row warning={isDraw || isCanceled} positive={isInProgress || winnerIsA || winnerIsB} textAlign='left' verticalAlign='middle' onClick={() => dispatchSetDuel(duelId)}>
      <Cell positive={winnerIsA} negative={winnerIsB}>
        <ProfilePicSquare profilePic={profilePicA} />
      </Cell>

      <Cell positive={winnerIsA} negative={winnerIsB}>
        {nameA}
      </Cell>

      <Cell positive={winnerIsB} negative={winnerIsA}>
        <ProfilePicSquare profilePic={profilePicB} />
      </Cell>

      <Cell positive={winnerIsB} negative={winnerIsA}>
        {nameB}
      </Cell>

      <Cell textAlign='center'>
        {ChallengeStateNames[state]}
      </Cell>

      <Cell textAlign='center'>
        {date}
      </Cell>
    </Table.Row>
  )
}

