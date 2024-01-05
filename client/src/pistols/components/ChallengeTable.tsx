import React, { useEffect, useMemo, useState } from 'react'
import { Grid, Icon, SemanticCOLORS, Table } from 'semantic-ui-react'
import { useDojoAccount } from '@/dojo/DojoContext'
import { useAllChallengeIds, useChallengeIdsByDuelist, useLiveChallengeIds, usePastChallengeIds } from '@/pistols/hooks/useChallenge'
import { useDuelist } from '@/pistols/hooks/useDuelist'
import { DuelStage, useDuel } from '@/pistols/hooks/useDuel'
import { useTimestampCountdown } from '@/pistols/hooks/useTimestamp'
import { ProfilePicSquare } from '@/pistols/components/account/ProfilePic'
import { MenuKey, usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { Blades, ChallengeState, ChallengeStateNames } from '@/pistols/utils/pistols'
import { formatTimestamp, formatTimestampDelta } from '@/pistols/utils/utils'
import { BladesIcon, CompletedIcon, EmojiIcon, StepsIcon } from '@/pistols/components/ui/Icons'

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
    setOrder(o => ({ ...o, [id]: { state, timestamp } }))
  }

  const rows = useMemo(() => {
    let result = []
    challengeIds.forEach((duelId, index) => {
      result.push(<DuelItem key={duelId} duelId={duelId} sortCallback={_sortCallback} compact={compact} />)
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
    challenge: { duelistA, duelistB, state, isLive, isFinished, winner, timestamp, timestamp_expire, timestamp_start, timestamp_end },
    round1, round2, duelStage, completedStagesA, completedStagesB,
  } = useDuel(duelId)
  const { name: nameA, profilePic: profilePicA } = useDuelist(duelistA)
  const { name: nameB, profilePic: profilePicB } = useDuelist(duelistB)
  const timestamp_system = useTimestampCountdown()
  // console.log(timestamp, timestamp_expire, `>`, timestamp_system)

  useEffect(() => {
    sortCallback(duelId, state, timestamp)
  }, [state, timestamp])

  const isYours = useMemo(() => (BigInt(account.address) == duelistA || BigInt(account.address) == duelistB), [account, duelistA, duelistB])
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

  const _gotoChallenge = () => {
    dispatchSetDuel(duelId, isYours ? MenuKey.YourDuels : isLive ? MenuKey.LiveDuels : MenuKey.PastDuels)
  }

  const _duelistIcons = (movesRound1, movesRound2, completedStages) => {
    if (isInProgress) {
      return (<>
        {movesRound1 && duelStage >= DuelStage.StepsCommit &&
          <CompletedIcon completed={completedStages[DuelStage.StepsCommit]}>
            <EmojiIcon emoji='🥾' size='large' />
          </CompletedIcon>
        }
        {movesRound1 && duelStage == DuelStage.StepsReveal &&
          <CompletedIcon completed={completedStages[DuelStage.StepsReveal]}>
            <Icon name='eye' size='large' />
          </CompletedIcon>
        }
        {movesRound2 && duelStage >= DuelStage.BladesCommit &&
          <CompletedIcon completed={completedStages[DuelStage.BladesCommit]}>
            <EmojiIcon emoji='🗡️' size='large' />
          </CompletedIcon>
        }
        {movesRound2 && duelStage == DuelStage.BladesReveal &&
          <CompletedIcon completed={completedStages[DuelStage.BladesReveal]}>
            <Icon name='eye' size='large' />
          </CompletedIcon>
        }
      </>)
    }
    if (isFinished) {
      return (<>
        {movesRound1 && <StepsIcon stepCount={parseInt(movesRound1.move)} />}
        {movesRound2 && <BladesIcon blades={parseInt(movesRound2.move) as Blades} />}
      </>)
    }
    return <></>
  }
  const iconsA = useMemo(() => _duelistIcons(round1?.duelist_a, round2?.duelist_a, completedStagesA), [isInProgress, isFinished, round1, round2, completedStagesA])
  const iconsB = useMemo(() => _duelistIcons(round1?.duelist_b, round2?.duelist_b, completedStagesB), [isInProgress, isFinished, round1, round2, completedStagesB])

  return (
    <Table.Row warning={isDraw || isCanceled} negative={false} positive={isInProgress || winnerIsA || winnerIsB} textAlign='left' verticalAlign='middle' onClick={() => _gotoChallenge()}>
      <Cell positive={winnerIsA} negative={winnerIsB}>
        <ProfilePicSquare profilePic={profilePicA} />
      </Cell>

      <Cell positive={winnerIsA} negative={winnerIsB}>
        {nameA}
        {compact ? <br /> : ' '}
        {iconsA}
      </Cell>

      <Cell positive={winnerIsB} negative={winnerIsA}>
        <ProfilePicSquare profilePic={profilePicB} />
      </Cell>

      <Cell positive={winnerIsB} negative={winnerIsA}>
        {nameB}
        {compact ? <br /> : ' '}
        {iconsB}
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

