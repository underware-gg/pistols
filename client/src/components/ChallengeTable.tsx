import React, { useEffect, useMemo, useState } from 'react'
import { ButtonGroup, Grid, SemanticCOLORS, Table } from 'semantic-ui-react'
import { useQueryParams } from '/src/stores/queryParamsStore'
import { usePistolsContext } from '/src/hooks/PistolsContext'
import { useDuel } from '/src/hooks/useDuel'
import { useQueryChallengeIds } from '/src/stores/challengeQueryStore'
import { useDuelistFameBalance } from '/src/stores/coinStore'
import { useDuelCallToAction } from '/src/stores/eventsModelStore'
import { usePlayer } from '/src/stores/playerStore'
import { useGameAspect } from '/src/hooks/useGameAspect'
import { useIsMyAccount } from '/src/hooks/useIsYou'
import { AllChallengeStates, ChallengeStateClasses, ChallengeStateNames } from '/src/utils/pistols'
import { ProfilePic } from '/src/components/account/ProfilePic'
import { DuelIconsAsRow } from '/src/components/DuelIcons'
import { FilterButton } from '/src/components/ui/Buttons'
import { arrayRemoveValue } from '@underware/pistols-sdk/utils'
import { constants } from '@underware/pistols-sdk/pistols/gen'

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
  const { filterChallengeSortColumn, filterChallengeSortDirection } = useQueryParams()
  const { challengeIds, states } = useQueryChallengeIds(statesFilter, null, false, selectedDuelistId, filterChallengeSortColumn, filterChallengeSortDirection)

  useEffect(() => {
    console.log('ChallengeTableSelectedDuelist', selectedDuelistId)
  }, [selectedDuelistId])

  return (
    <div style={{width: '100%', height: '100%',}}>
      <ChallengeTableByIds challengeIds={challengeIds} compact={compact} existingStates={states} states={statesFilter} setStates={setStatesFilter} />
    </div>
  )
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
  existingStates: constants.ChallengeState[]
  states: constants.ChallengeState[]
  setStates: (states: constants.ChallengeState[]) => void
}) {
  const { aspectWidth } = useGameAspect()

  const rows = useMemo(() => {
    let result = []
    challengeIds.forEach((duelId) => {
      result.push(<DuelItem key={duelId} duelId={duelId} compact={compact} />)
    })
    return result
  }, [challengeIds, compact])

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
        <FilterButton key={state} grouped label={ChallengeStateNames[state]} state={enabled} onClick={() => _switch()} />
      )
    })
    return { filters, canAdd, canClear }
  }, [existingStates, states])

  return (
    <div>
      {filters.length > 0 &&
        <div style={{ maxWidth: '100%', overflowX: 'auto', padding: aspectWidth(0.6) }}>
          <ButtonGroup style={{ 
            display: 'flex',
            flexWrap: 'wrap', 
            gap: `${aspectWidth(0.6)}px 0`,
            width: '100%'
          }}>
            <FilterButton grouped icon='add' state={false} disabled={!canAdd} onClick={() => setStates(AllChallengeStates)} />
            {filters}
            <FilterButton grouped icon='close' state={false} disabled={!canClear} onClick={() => setStates([])} />
          </ButtonGroup>
        </div>
      }

      <Table sortable selectable className='Faded' color={color as SemanticCOLORS}>
        <Table.Header className='TableHeader'>
          <Table.Row textAlign='left' verticalAlign='middle'>
            <HeaderCell width={3} textAlign='center'>Challenger</HeaderCell>
            <HeaderCell width={3} textAlign='center'></HeaderCell>
            <HeaderCell width={3} textAlign='center'>Challenged</HeaderCell>
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
    </div>
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
  const { aspectWidth } = useGameAspect()

  const {
    challenge: { duelistIdA, duelistIdB, state, isLive, isCanceled, isExpired, isDraw, winner, duelistAddressA, duelistAddressB },
    turnA, turnB,
  } = useDuel(duelId)
  const { name: playerNameA } = usePlayer(duelistAddressA)
  const { name: playerNameB } = usePlayer(duelistAddressB)
  const { isAlive: isAliveA } = useDuelistFameBalance(duelistIdA)
  const { isAlive: isAliveB } = useDuelistFameBalance(duelistIdB)
  const { isMyAccount: isYouA } = useIsMyAccount(duelistAddressA)
  const { isMyAccount: isYouB } = useIsMyAccount(duelistAddressB)

  const [leftDuelistId, leftDuelistAddress, leftPlayerName] = useMemo(() => {
    if (isYouB) {
      return [duelistIdB, duelistAddressB, playerNameB]
    }
    return [duelistIdA, duelistAddressA, playerNameA]
  }, [isYouB, duelistIdA, duelistIdB, duelistAddressA, duelistAddressB, playerNameA, playerNameB])
  
  const [rightDuelistId, rightDuelistAddress, rightPlayerName] = useMemo(() => {
    if (isYouB) {
      return [duelistIdA, duelistAddressA, playerNameA]
    }
    return [duelistIdB, duelistAddressB, playerNameB]
  }, [isYouB, duelistIdA, duelistIdB, duelistAddressA, duelistAddressB, playerNameA, playerNameB])

  const winnerIsLeft = useMemo(() => {
    if (isYouB) {
      return winner == 2
    }
    return winner == 1
  }, [winner, isYouB])
  
  const winnerIsRight = useMemo(() => {
    if (isYouB) {
      return winner == 1
    }
    return winner == 2
  }, [winner, isYouB])

  const { dispatchSelectDuel } = usePistolsContext()
  const isCallToAction = useDuelCallToAction(duelId)

  const _gotoChallenge = () => {
    dispatchSelectDuel(duelId)
  }

  const fameBalance = null;

  if (nameFilter) {
    const isA = playerNameA ? playerNameA.toLowerCase().includes(nameFilter) : false
    const isB = playerNameB ? playerNameB.toLowerCase().includes(nameFilter) : false
    if (!isA && !isB) {
      return <></>
    }
  }

  return (
    <Table.Row textAlign='left' verticalAlign='middle' onClick={() => _gotoChallenge()} style={{ maxWidth: '100%' }}>
      <Cell style={{ width: '40%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: aspectWidth(0.8) }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <ProfilePic profilePic={0} small />
            <PositiveResult positive={winnerIsLeft} negative={winnerIsRight} warning={isDraw} canceled={isCanceled || isExpired}>
              <span className='BreakWord'>{leftPlayerName}</span>
            </PositiveResult>
          </div>
          <div style={{ alignItems: 'center' }}>
            <DuelIconsAsRow duelId={duelId} duelistId={leftDuelistId} size={null} />
          </div>
        </div>
      </Cell>

      <Cell textAlign='center' style={{ width: '20%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: aspectWidth(1.4), fontWeight: 'bold' }}>VS</span>
          {state == constants.ChallengeState.Resolved ?
            <>
              <PositiveResult positive={true}>
                <span className='BreakWord'>{winnerIsLeft ? leftPlayerName : rightPlayerName}</span>
              </PositiveResult>
            </>
            :
            <>
              <span className={ChallengeStateClasses[state]}>
                {isCallToAction ? constants.ChallengeState.Awaiting : ChallengeStateNames[state]}
              </span>
            </>
          }
        </div>
      </Cell>

      <Cell style={{ width: '40%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: aspectWidth(0.8), flexDirection: 'row-reverse' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <ProfilePic profilePic={0} small />
            <PositiveResult positive={winnerIsRight} negative={winnerIsLeft} warning={isDraw} canceled={isCanceled || isExpired}>
              <span className='BreakWord'>{rightPlayerName}</span>
            </PositiveResult>
          </div>
          <div style={{ alignItems: 'center' }}>
            <DuelIconsAsRow duelId={duelId} duelistId={rightDuelistId} size={null} />
          </div>
        </div>
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
