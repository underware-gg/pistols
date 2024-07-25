import React, { useEffect, useMemo, useState } from 'react'
import { ButtonGroup, Grid, SemanticCOLORS, Table } from 'semantic-ui-react'
import { BigNumberish } from 'starknet'
import { useSettings } from '@/pistols/hooks/SettingsContext'
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
import { bigintEquals } from '@/lib/utils/types'
import { useQueryContext } from '../hooks/QueryContext'

const Row = Grid.Row
const Col = Grid.Column
const Cell = Table.Cell
const HeaderCell = Table.HeaderCell

export function ChallengeTableLive() {
  const { queryLiveDuels: { challengeIds, states } } = useQueryContext()
  return <ChallengeTableByIds challengeIds={challengeIds} color='green' compact states={[...states, ChallengeState.Expired]} />
}

export function ChallengeTablePast() {
  const { queryPastDuels: { challengeIds, states } } = useQueryContext()
  return <ChallengeTableByIds challengeIds={challengeIds} color='red' compact states={states} />
}

export function ChallengeTableYour() {
  const { queryYourDuels: { challengeIds, states } } = useQueryContext()
  return <ChallengeTableByIds challengeIds={challengeIds} compact states={states} />
}

export function ChallengeTableByDuelist({
  duelistId = null,
  address = null,
  compact = false,
  tableId
}: {
  duelistId: BigNumberish
  address?: BigNumberish
  compact: boolean
  tableId?: string
}) {
  const { queryYourDuels: { challengeIds, states } } = useQueryContext()
  return <ChallengeTableByIds challengeIds={challengeIds} compact={compact} states={states} />
}


function ChallengeTableByIds({
  challengeIds,
  color = 'orange',
  compact = false,
  states = [],
}) {
  const _statesToToggles = (t) => (states.reduce((a, v) => ({ ...a, [v]: t }), {}))

  const [stateToggles, setStateToggles] = useState(_statesToToggles(true))
  const selectedStates = useMemo(() => (
    states.length == 0 ? AllChallengeStates
      : states.reduce((a, v) => ([...a, (stateToggles[v] ? v : null)]), [])
  ), [states, stateToggles])

  const rows = useMemo(() => {
    let result = []
    challengeIds.forEach((duelId, index) => {
      result.push(<DuelItem key={duelId} duelId={duelId} compact={compact} states={selectedStates} />)
    })
    return result
  }, [challengeIds, selectedStates])

  const filters = useMemo(() => {
    let result = []
    if (states.length > 0) {
      states.forEach(state => {
        const _switch = () => {
          setStateToggles({
            ...stateToggles,
            [state]: !stateToggles[state],
          })
        }
        result.push(<FilterButton key={state} grouped={result.length > 0} label={ChallengeStateNames[state]} state={stateToggles[state]} switchState={() => _switch()} />)
      })
    }
    return result
  }, [states, stateToggles])

  return (
    <>
      {filters.length > 0 &&
        <div>
          <FilterButton label='All' state={false} switchState={() => setStateToggles(_statesToToggles(true))} />
          <ButtonGroup>
            {filters}
          </ButtonGroup>
          <FilterButton label='Clear' state={false} switchState={() => setStateToggles(_statesToToggles(false))} />
        </div>
      }

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

        {rows.length > 0 ?
          <Table.Body className='TableBody'>
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
    </>
  )
}


function DuelItem({
  duelId,
  compact = false,
  states = [],
}) {
  const { duelistId } = useSettings()
  const {
    challenge: { duelistIdA, duelistIdB, tableId, state, isLive, isCanceled, isExpired, isDraw, winner, timestamp_start },
    turnA, turnB,
  } = useDuel(duelId)
  const { value } = useWager(duelId)
  const { profilePic: profilePicA } = useDuelist(duelistIdA)
  const { profilePic: profilePicB } = useDuelist(duelistIdB)

  const winnerIsA = useMemo(() => (winner == 1), [winner])
  const winnerIsB = useMemo(() => (winner == 2), [winner])

  const classNameA = useMemo(() => ((turnA && bigintEquals(duelistId, duelistIdA)) ? 'BgImportant' : null), [duelistId, duelistIdA, turnA])
  const classNameB = useMemo(() => ((turnB && bigintEquals(duelistId, duelistIdB)) ? 'BgImportant' : null), [duelistId, duelistIdB, turnB])

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
          <ProfileName duelistId={duelistIdA} />
        </PositiveResult>
        <br />
        <DuelIconsAsRow duelId={duelId} duelistId={duelistIdA} size={compact ? null : 'large'} />
      </Cell>

      <Cell className={classNameB}>
        <ProfilePicSquare profilePic={profilePicB} small />
      </Cell>

      <Cell className={classNameB}>
        <PositiveResult positive={winnerIsB} negative={winnerIsA && false} warning={isDraw} canceled={isCanceled || isExpired}>
          <ProfileName duelistId={duelistIdB} />
        </PositiveResult>
        <br />
        <DuelIconsAsRow duelId={duelId} duelistId={duelistIdB} size={compact ? null : 'large'} />
      </Cell>

      <Cell textAlign='center' className='Result'>
        {state == ChallengeState.Resolved ?
          <>
            <PositiveResult positive={true}>
              <ProfileName duelistId={winnerIsA ? duelistIdA : duelistIdB} badges={false} />
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

      <Cell textAlign='center' style={{ minWidth: '90px' }} className='Number'>
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
