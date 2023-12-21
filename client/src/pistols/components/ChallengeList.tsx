import React, { useMemo } from 'react'
import { Grid, Table } from 'semantic-ui-react'
import { useDojoAccount } from '@/dojo/DojoContext'
import { useDuelist } from '@/pistols/hooks/useDuelist'
import { useAllChallengeIds, useChallenge, useChallengeIdsByDuelist } from '@/pistols/hooks/useChallenge'
import { ProfilePicSquare } from '@/pistols/components/account/ProfilePic'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { ChallengeState, ChallengeStateNames } from '@/pistols/utils/pistols'

const Row = Grid.Row
const Col = Grid.Column
const Cell = Table.Cell
const HeaderCell = Table.HeaderCell

export function ChallengeList({
}) {
  const { challengeIds } = useAllChallengeIds()
  return <ChallengeListByIds challengeIds={challengeIds} />
}

export function ChallengeListByDuelist({
  address = null,
}) {
  const { challengeIds } = useChallengeIdsByDuelist(address)
  return <ChallengeListByIds challengeIds={challengeIds} />
}

export function ChallengeListByIds({
  challengeIds,
}) {
  const rows = useMemo(() => {
    let result = []
    challengeIds.forEach((duelId, index) => {
      result.push(<DuelItem key={duelId} duelId={duelId} index={index} />)
    })
    return result
  }, [challengeIds])

  return (
    <Table selectable className='Faded' color='red'>
      <Table.Header>
        <Table.Row textAlign='left' verticalAlign='middle'>
          <HeaderCell width={1}></HeaderCell>
          <HeaderCell>Challenger</HeaderCell>
          <HeaderCell width={1}></HeaderCell>
          <HeaderCell>Challenged</HeaderCell>
          <HeaderCell textAlign='center'>State</HeaderCell>
          <HeaderCell textAlign='center'>Date</HeaderCell>
        </Table.Row>
      </Table.Header>

      {rows.length > 0 ?
        <Table.Body>
          {rows}
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
  index,
}) {
  const { dispatchSetDuel } = usePistolsContext()
  const { duelistA, duelistB, state, winner, timestamp, timestamp_expire, timestamp_start, timestamp_end } = useChallenge(duelId)
  const { name: nameA, profilePic: profilePicA } = useDuelist(duelistA)
  const { name: nameB, profilePic: profilePicB } = useDuelist(duelistB)

  const winnerIsA = useMemo(() => (duelistA == winner), [duelistA, winner])
  const winnerIsB = useMemo(() => (duelistB == winner), [duelistB, winner])
  const isDraw = useMemo(() => (state == ChallengeState.Draw), [state])
  const date = useMemo(() => {
    return 'TODO'
  }, [state, timestamp, timestamp_expire, timestamp_start, timestamp_end])

  return (
    <Table.Row textAlign='left' verticalAlign='middle' onClick={() => dispatchSetDuel(duelId)}>
      <Cell warning={isDraw} positive={winnerIsA} negative={winnerIsB}>
        <ProfilePicSquare profilePic={profilePicA} />
      </Cell>

      <Cell warning={isDraw} positive={winnerIsA} negative={winnerIsB}>
        {nameA}
      </Cell>

      <Cell warning={isDraw} positive={winnerIsB} negative={winnerIsA}>
        <ProfilePicSquare profilePic={profilePicB} />
      </Cell>

      <Cell warning={isDraw} positive={winnerIsB} negative={winnerIsA}>
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

