import React, { useMemo, useState } from 'react'
import { ButtonGroup, Grid, SemanticCOLORS, Table } from 'semantic-ui-react'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { useQueryParams } from '@/pistols/stores/queryParamsStore'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { useDuelist } from '@/pistols/stores/duelistStore'
import { useDuel } from '@/pistols/hooks/useDuel'
import { useQueryChallengeIds } from '@/pistols/stores/challengeQueryStore'
import { ProfilePicSquare } from '@/pistols/components/account/ProfilePic'
import { ProfileName } from '@/pistols/components/account/ProfileDescription'
import { ChallengeTime } from '@/pistols/components/ChallengeTime'
import { DuelIconsAsRow } from '@/pistols/components/DuelIcons'
import { FilterButton } from '@/pistols/components/ui/Buttons'
// import { FilterDuelistName } from '@/pistols/components/DuelistTable'
import { Balance } from '@/pistols/components/account/Balance'
import { arrayRemoveValue, bigintEquals } from '@underware_gg/pistols-sdk/utils'
import { ChallengeState } from '@/games/pistols/generated/constants'
import { AllChallengeStates, ChallengeStateClasses, ChallengeStateNames } from '@/pistols/utils/pistols'

const Row = Grid.Row
const Col = Grid.Column
const Cell = Table.Cell
const HeaderCell = Table.HeaderCell


export function ChallengeTableSelectedDuelist({
  compact = false,
}: {
  compact: boolean
}) {
  const [statesFilter, setStatesFilter] = useState(AllChallengeStates)

  const { selectedDuelistId } = usePistolsContext()
  const { filterChallengeSortColumn, filterDuelistName, filterChallengeSortDirection } = useQueryParams()
  const { challengeIds, states } = useQueryChallengeIds(statesFilter, filterDuelistName, false, selectedDuelistId, filterChallengeSortColumn, filterChallengeSortDirection)

  return <ChallengeTableByIds challengeIds={challengeIds} compact={compact} existingStates={states} states={statesFilter} setStates={setStatesFilter} />
}


function ChallengeTableByIds({
  challengeIds,
  color = 'orange',
  compact = false,
  existingStates,
  states,
  setStates,
}: {
  challengeIds: bigint[]
  color?: SemanticCOLORS
  compact?: boolean
  existingStates: ChallengeState[]
  states: ChallengeState[]
  setStates: (states: ChallengeState[]) => void
}) {
  const { filterDuelistName } = useQueryParams()

  const rows = useMemo(() => {
    let result = []
    challengeIds.forEach((duelId, index) => {
      result.push(<DuelItem key={duelId} duelId={duelId} compact={compact} nameFilter={filterDuelistName} />)
    })
    return result
  }, [challengeIds, compact, filterDuelistName])

  const { filters, canAdd, canClear } = useMemo(() => {
    let canAdd = false
    let canClear = false
    let filters = []
    AllChallengeStates.forEach(state => {
      if (!existingStates.includes(state)) return
      const _switch = () => {
        if (!states.includes(state)) {
          setStates([...states, state])
        } else {
          setStates(arrayRemoveValue(states, state))
        }
      }
      let enabled = states.includes(state)
      if (!enabled) canAdd = true
      if (enabled) canClear = true
      filters.push(
        <FilterButton key={state}
          // grouped={result.length > 0}
          grouped
          label={ChallengeStateNames[state]}
          state={enabled}
          onClick={() => _switch()}
        />)
    })
    return { filters, canAdd, canClear }
  }, [existingStates, states])

  return (
    <>
      {filters.length > 0 &&
        <div>
          <ButtonGroup>
            <FilterButton icon='add' state={false} disabled={!canAdd} onClick={() => setStates(AllChallengeStates)} />
            {filters}
            <FilterButton grouped icon='close' state={false} disabled={!canClear} onClick={() => setStates([])} />
          </ButtonGroup>
          {/* <FilterDuelistName /> */}
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
  nameFilter = '',
  compact = false,
}: {
  duelId: bigint
  nameFilter?: string
  compact?: boolean
}) {
  const { duelistId } = useSettings()
  const {
    challenge: { duelistIdA, duelistIdB, tableId, state, isLive, isCanceled, isExpired, isDraw, winner, timestamp_start },
    turnA, turnB,
  } = useDuel(duelId)
  const { name: nameA, profilePic: profilePicA } = useDuelist(duelistIdA)
  const { name: nameB, profilePic: profilePicB } = useDuelist(duelistIdB)

  const winnerIsA = useMemo(() => (winner == 1), [winner])
  const winnerIsB = useMemo(() => (winner == 2), [winner])

  const classNameA = useMemo(() => ((turnA && bigintEquals(duelistId, duelistIdA)) ? 'BgImportant' : null), [duelistId, duelistIdA, turnA])
  const classNameB = useMemo(() => ((turnB && bigintEquals(duelistId, duelistIdB)) ? 'BgImportant' : null), [duelistId, duelistIdB, turnB])

  const { dispatchSelectDuel } = usePistolsContext()

  const _gotoChallenge = () => {
    dispatchSelectDuel(duelId)
  }

  const fameBalance = null;

  if (nameFilter) {
    const isA = nameA ? nameA.toLowerCase().includes(nameFilter) : false
    const isB = nameB ? nameB.toLowerCase().includes(nameFilter) : false
    if (!isA && !isB) {
      return <></>
    }
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
            {fameBalance && <><br /><Balance fame small wei={fameBalance} /></>}
          </>
          :
          <>
            <span className={ChallengeStateClasses[state]}>
              {ChallengeStateNames[state]}
            </span>
            {fameBalance && <><br /><Balance fame small wei={fameBalance} crossed={!isLive} /></>}
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
