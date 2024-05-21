import React, { useEffect, useMemo, useState } from 'react'
import { Grid, SemanticCOLORS, Table } from 'semantic-ui-react'
import { useDojoAccount } from '@/lib/dojo/DojoContext'
import { useAllChallengeIds, useChallengeIdsByDuelist, useLiveChallengeIds, usePastChallengeIds } from '@/pistols/hooks/useChallenge'
import { useDuelist } from '@/pistols/hooks/useDuelist'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { useDuel } from '@/pistols/hooks/useDuel'
import { useWager } from '@/pistols/hooks/useWager'
import { AllChallengeStates, ChallengeState, ChallengeStateClasses, ChallengeStateNames } from '@/pistols/utils/pistols'
import { ProfilePicSquare } from '@/pistols/components/account/ProfilePic'
import { ProfileName } from '@/pistols/components/account/ProfileDescription'
import { ChallengeTime } from '@/pistols/components/ChallengeTime'
import { DuelIconsAsRow } from '@/pistols/components/DuelIcons'
import { FilterButton } from '@/pistols/components/ui/Buttons'
import { Balance } from '@/pistols/components/account/Balance'
import { BigNumberish } from 'starknet'

const Row = Grid.Row
const Col = Grid.Column
const Cell = Table.Cell
const HeaderCell = Table.HeaderCell

export function ChallengeTableAll() {
  const { challengeIds } = useAllChallengeIds()
  return <ChallengeTableByIds challengeIds={challengeIds} compact />
}

export function ChallengeTableLive() {
  const { challengeIds, states } = useLiveChallengeIds()
  return <ChallengeTableByIds challengeIds={challengeIds} color='green' compact states={[...states, ChallengeState.Expired]} />
}

export function ChallengeTablePast() {
  const { challengeIds, states} = usePastChallengeIds()
  return <ChallengeTableByIds challengeIds={challengeIds} color='red' compact states={states} />
}

export function ChallengeTableByDuelist({
  address = null,
  compact = false,
}) {
  const { challengeIds } = useChallengeIdsByDuelist(address)
  return <ChallengeTableByIds challengeIds={challengeIds} compact={compact} states={AllChallengeStates} />
}

export function ChallengeTableYour() {
  const { accountAddress } = useDojoAccount()
  return <ChallengeTableByDuelist address={accountAddress} compact />
}



function ChallengeTableByIds({
  challengeIds,
  color = 'orange',
  compact = false,
  states = [],
}) {
  const { accountAddress } = useDojoAccount()
  const [order, setOrder] = useState({})
  const _sortCallback = (id, state, timestamp) => {
    // this pattern can handle simultaneous state set
    setOrder(o => ({ ...o, [id]: { state, timestamp } }))
  }

  const _statesToToggles = (t) => (states.reduce((a, v) => ({ ...a, [v]: t }), {}))

  const [stateToggles, setStateToggles] = useState(_statesToToggles(true))
  const selectedStated = useMemo(() => (
    states.length == 0 ? AllChallengeStates
      : states.reduce((a, v) => ([...a, (stateToggles[v] ? v : null)]), [])
  ), [states, stateToggles])

  const rows = useMemo(() => {
    let result = []
    challengeIds.forEach((duelId, index) => {
      result.push(<DuelItem key={duelId} duelId={duelId} sortCallback={_sortCallback} compact={compact} address={accountAddress} states={selectedStated}/>)
    })
    return result
  }, [challengeIds, selectedStated])

  const sortedRows = useMemo(() => rows.sort((a, b) => {
    if (order[a.key]?.state != order[b.key]?.state) {
      if (order[a.key]?.state == ChallengeState.InProgress) return -1
      if (order[b.key]?.state == ChallengeState.InProgress) return 1
      if (order[a.key]?.state == ChallengeState.Awaiting) return -1
      if (order[b.key]?.state == ChallengeState.Awaiting) return 1
    }
    return (order[b.key]?.timestamp ?? 0) - (order[a.key]?.timestamp ?? 0)
  }), [rows, order])

  const filters = useMemo(() => {
    let result = []
    if (states.length > 0) {
      result.push(<FilterButton key={'none'} label='All' state={false} switchState={() => setStateToggles(_statesToToggles(true))} />)
      states.forEach(state => {
        const _switch = () => {
          setStateToggles({
            ...stateToggles,
            [state]: !stateToggles[state],
          })
        }
        result.push(<FilterButton key={state} label={ChallengeStateNames[state]} state={stateToggles[state]} switchState={() => _switch()} />)
      })
      result.push(<FilterButton key={'clear'} label='Clear' state={false} switchState={() => setStateToggles(_statesToToggles(false))} />)
    }
    return result
  }, [states, stateToggles])

  return (
    <>
      {filters.length > 0 && <div>{filters}</div>}

      <Table sortable selectable className='Faded' color={color as SemanticCOLORS}>
        <Table.Header className='TableHeader'>
          <Table.Row textAlign='left' verticalAlign='middle'>
            <HeaderCell width={1}></HeaderCell>
            <HeaderCell>Challenger</HeaderCell>
            <HeaderCell width={1}></HeaderCell>
            <HeaderCell>Challenged</HeaderCell>
            <HeaderCell width={3} textAlign='center'>Winner</HeaderCell>
            <HeaderCell width={3} textAlign='center'>Time</HeaderCell>
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
    </>
  )
}


function DuelItem({
  duelId,
  sortCallback,
  address,
  compact = false,
  states = [],
}) {
  const {
    challenge: { duelistA, duelistB, tableId, state, isLive, isCanceled, isExpired, isDraw, winner, timestamp_start },
    turnA, turnB,
  } = useDuel(duelId)
  const { value } = useWager(duelId)
  const { profilePic: profilePicA } = useDuelist(duelistA)
  const { profilePic: profilePicB } = useDuelist(duelistB)

  useEffect(() => {
    sortCallback(duelId, state, timestamp_start)
  }, [state, timestamp_start])

  const winnerIsA = useMemo(() => (winner == 1), [winner])
  const winnerIsB = useMemo(() => (winner == 2), [winner])

  const classNameA = useMemo(() => ((turnA && address == duelistA) ? 'BgImportant' : null), [address, duelistA, turnA])
  const classNameB = useMemo(() => ((turnB && address == duelistB) ? 'BgImportant' : null), [address, duelistB, turnB])

  const { dispatchSelectDuel } = usePistolsContext()

  const _gotoChallenge = () => {
    dispatchSelectDuel(duelId)
  }

  if (!states.includes(state)) {
    return <></>
  }

  return (
    // <Table.Row warning={isDraw || isCanceled} negative={false} positive={isInProgress || isFinished} textAlign='left' verticalAlign='middle' onClick={() => _gotoChallenge()}>
    <Table.Row textAlign='left' verticalAlign='middle' onClick={() => _gotoChallenge()}>
      <Cell className={classNameA}>
        <ProfilePicSquare profilePic={profilePicA} small />
      </Cell>

      <Cell className={classNameA}>
        <PositiveResult positive={winnerIsA} negative={winnerIsB && false} warning={isDraw} canceled={isCanceled || isExpired}>
          <ProfileName address={duelistA} />
        </PositiveResult>
        <br />
        <DuelIconsAsRow duelId={duelId} account={duelistA} size={compact ? null : 'large'} />
      </Cell>

      <Cell className={classNameB}>
        <ProfilePicSquare profilePic={profilePicB} small />
      </Cell>

      <Cell className={classNameB}>
        <PositiveResult positive={winnerIsB} negative={winnerIsA && false} warning={isDraw} canceled={isCanceled || isExpired}>
          <ProfileName address={duelistB} />
        </PositiveResult>
        <br />
        <DuelIconsAsRow duelId={duelId} account={duelistB} size={compact ? null : 'large'} />
      </Cell>

      <Cell textAlign='center' className='Result'>
        {state == ChallengeState.Resolved ?
          <>
            <PositiveResult positive={true}>
              <ProfileName address={winnerIsA ? duelistA : duelistB} badges={false} />
            </PositiveResult>
            {value && <><br /><Balance small tableId={tableId} wei={value} /></>}
          </>
          :
          <>
            <span className={ChallengeStateClasses[state]}>
              {ChallengeStateNames[state]}
            </span>
            {value && <><br /><Balance small tableId={tableId} wei={value} crossed={!isLive} /></>}
          </>
        }
      </Cell>

      <Cell textAlign='center' style={{ minWidth: '90px' }}>
        <PositiveResult warning={isDraw} canceled={isCanceled || isExpired}>
          <ChallengeTime duelId={duelId} />
        </PositiveResult>
      </Cell>
    </Table.Row>
  )
}

function PositiveResult({
  positive = false,
  negative = false,
  warning = false,
  canceled = false,
  children,
}) {
  const _className =
    positive ? 'Positive'
      : negative ? 'Negative'
        : warning ? 'Warning'
          : canceled ? 'Canceled'
            : ''
  return (
    <span className={_className}>{children}</span>
  )
}
