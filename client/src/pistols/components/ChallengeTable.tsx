import React, { useEffect, useMemo, useState } from 'react'
import { Grid, SemanticCOLORS, Table } from 'semantic-ui-react'
import { useDojoAccount } from '@/dojo/DojoContext'
import { useAllChallengeIds, useChallenge, useChallengeIdsByDuelist, useLiveChallengeIds, usePastChallengeIds } from '@/pistols/hooks/useChallenge'
import { useDuelist } from '@/pistols/hooks/useDuelist'
import { ProfilePicSquare } from '@/pistols/components/account/ProfilePic'
import { MenuKey, usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { ChallengeState, ChallengeStateNames } from '@/pistols/utils/pistols'
import { ChallengeTime } from '@/pistols/components/ChallengeTime'
import { DuelIcons } from '@/pistols/components/DuelIcons'

const Row = Grid.Row
const Col = Grid.Column
const Cell = Table.Cell
const HeaderCell = Table.HeaderCell

export function ChallengeTableAll() {
  const { challengeIds } = useAllChallengeIds()
  return <ChallengeTableByIds challengeIds={challengeIds} />
}

export function ChallengeTableLive() {
  const { challengeIds } = useLiveChallengeIds()
  return <ChallengeTableByIds challengeIds={challengeIds} color='green' />
}

export function ChallengeTablePast() {
  const { challengeIds } = usePastChallengeIds()
  return <ChallengeTableByIds challengeIds={challengeIds} color='red' />
}

export function ChallengeTableByDuelist({
  address = null,
  compact = false,
}) {
  const { challengeIds } = useChallengeIdsByDuelist(address)
  return <ChallengeTableByIds challengeIds={challengeIds} compact={compact} />
}

export function ChallengeTableYour() {
  const { account } = useDojoAccount()
  return <ChallengeTableByDuelist address={account.address} />
}



function ChallengeTableByIds({
  challengeIds,
  color = 'orange',
  compact = false,
}) {
  const [order, setOrder] = useState({})
  const _sortCallback = (id, state, timestamp) => {
    // this pattern can handle simultaneous state set
    setOrder(o => ({ ...o, [id]: { state, timestamp } }))
  }

  const rows = useMemo(() => {
    let result = []
    challengeIds.forEach((duelId, index) => {
      result.push(<DuelItem key={duelId} duelId={duelId} sortCallback={_sortCallback} compact={compact}/>)
    })
    return result
  }, [challengeIds])

  const sortedRows = useMemo(() => rows.sort((a, b) => {
    if (order[a.key]?.state != order[b.key]?.state) {
      if (order[a.key]?.state == ChallengeState.InProgress) return -1
      if (order[b.key]?.state == ChallengeState.InProgress) return 1
      if (order[a.key]?.state == ChallengeState.Awaiting) return -1
      if (order[b.key]?.state == ChallengeState.Awaiting) return 1
    }
    return (order[b.key]?.timestamp ?? 0) - (order[a.key]?.timestamp ?? 0)
  }), [rows, order])

  return (
    <Table sortable selectable className='Faded' color={color as SemanticCOLORS}>
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
  sortCallback,
  compact = false,
}) {
  const { account } = useDojoAccount()
  const { dispatchSetDuel } = usePistolsContext()
  const {
    duelistA, duelistB, state, isLive, isCanceled, isInProgress, isFinished, isDraw, winner, timestamp, timestamp_expire, timestamp_start, timestamp_end,
  }= useChallenge(duelId)
  const { name: nameA, profilePic: profilePicA } = useDuelist(duelistA)
  const { name: nameB, profilePic: profilePicB } = useDuelist(duelistB)

  useEffect(() => {
    sortCallback(duelId, state, timestamp)
  }, [state, timestamp])

  const isYours = useMemo(() => (BigInt(account.address) == duelistA || BigInt(account.address) == duelistB), [account, duelistA, duelistB])
  const winnerIsA = useMemo(() => (duelistA == winner), [duelistA, winner])
  const winnerIsB = useMemo(() => (duelistB == winner), [duelistB, winner])

  const _gotoChallenge = () => {
    dispatchSetDuel(duelId, isYours ? MenuKey.YourDuels : isLive ? MenuKey.LiveDuels : MenuKey.PastDuels)
  }

  return (
    <Table.Row warning={isDraw || isCanceled} negative={false} positive={isInProgress || isFinished} textAlign='left' verticalAlign='middle' onClick={() => _gotoChallenge()}>
      <Cell positive={winnerIsA} negative={winnerIsB}>
        <ProfilePicSquare profilePic={profilePicA} small />
      </Cell>

      <Cell positive={winnerIsA} negative={winnerIsB}>
        {nameA}
        {compact ? <br /> : ' '}
        <DuelIcons duelId={duelId} account={duelistA} size={compact ? null : 'large'} />
      </Cell>

      <Cell positive={winnerIsB} negative={winnerIsA}>
        <ProfilePicSquare profilePic={profilePicB} small />
      </Cell>

      <Cell positive={winnerIsB} negative={winnerIsA}>
        {nameB}
        {compact ? <br /> : ' '}
        <DuelIcons duelId={duelId} account={duelistB} size={compact ? null : 'large'} />
      </Cell>

      <Cell textAlign='center'>
        {ChallengeStateNames[state]}
      </Cell>

      <Cell textAlign='center'>
        <ChallengeTime duelId={duelId} />
      </Cell>
    </Table.Row>
  )
}

