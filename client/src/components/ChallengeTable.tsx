import React, { useEffect, useMemo, useState, useRef } from 'react'
import { ButtonGroup, Grid, SemanticCOLORS, Table } from 'semantic-ui-react'
import { ChallengeColumn, useQueryParams } from '/src/stores/queryParamsStore'
import { usePistolsContext } from '/src/hooks/PistolsContext'
import { useDuel } from '/src/hooks/useDuel'
import { useFetchChallengeIdsByDuelist, useQueryChallengeIdsByDuelist } from '/src/stores/challengeStore'
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
import { emitter } from '../three/game'
import { useClientTimestamp } from '@underware/pistols-sdk/utils/hooks'

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

  // fetch duelist challenges onto the store
  const { selectedDuelistId } = usePistolsContext()
  useFetchChallengeIdsByDuelist(selectedDuelistId)

  // filter challenges
  const { filterChallengeSortDirection } = useQueryParams()
  const { challengeIds, states, challengesPerSeason } = useQueryChallengeIdsByDuelist(selectedDuelistId, statesFilter, ChallengeColumn.Time, filterChallengeSortDirection)

  useEffect(() => {
    console.log('ChallengeTableSelectedDuelist', selectedDuelistId)
  }, [selectedDuelistId])

  return (
    <div style={{width: '100%', height: '100%',}}>
      <ChallengeTableByIds challengeIds={challengesPerSeason} compact={compact} existingStates={states} states={statesFilter} setStates={setStatesFilter} />
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
  challengeIds: { [seasonId: number]: bigint[] }
  color?: SemanticCOLORS
  compact?: boolean
  existingStates: constants.ChallengeState[]
  states: constants.ChallengeState[]
  setStates: (states: constants.ChallengeState[]) => void
}) {
  const { aspectWidth } = useGameAspect()
  const [collapsedSeasons, setCollapsedSeasons] = useState<Set<string>>(new Set())

  const toggleSeason = (seasonId: string) => {
    const newCollapsed = new Set(collapsedSeasons)
    if (newCollapsed.has(seasonId)) {
      newCollapsed.delete(seasonId)
    } else {
      newCollapsed.add(seasonId)
    }
    setCollapsedSeasons(newCollapsed)
  }

  const rows = useMemo(() => {
    let result = []
    Object.keys(challengeIds)
          .sort((a, b) => Number(b) - Number(a))
          .forEach((seasonId) => {
            const isCollapsed = collapsedSeasons.has(seasonId)
            
            result.push(
              <Table.Row 
                key={`season-${seasonId}`} 
                className="" 
                onClick={() => {
                  toggleSeason(seasonId)
                  emitter.emit('hover_description', null)
                }} 
                onMouseEnter={() => {
                  emitter.emit('hover_description', collapsedSeasons.has(seasonId) ? "Click to expand season duels" : "Click to collapse season duels")
                }}
                onMouseLeave={() => {
                  emitter.emit('hover_description', null)
                }}
                style={{ cursor: 'pointer' }}
              >
                <Cell colSpan="3" textAlign="center" style={{ 
                  fontSize: aspectWidth(1.4), 
                  fontWeight: 'bold',
                  backgroundColor: 'rgba(0,0,0,0.05)',
                  padding: aspectWidth(0.8),
                  position: 'relative',
                  borderTop: '1px solid rgba(0,0,0,0.1)',
                  borderBottom: '1px solid rgba(0,0,0,0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: aspectWidth(1)
                  }}>
                    <div style={{
                      flex: 1,
                      height: aspectWidth(0.05),
                      backgroundColor: 'white',
                      maxWidth: aspectWidth(8)
                    }}></div>
                    
                    {/* Left arrow */}
                    <div style={{
                      fontSize: aspectWidth(0.8),
                      color: 'orange',
                      fontWeight: 'bold',
                      transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease'
                    }}>
                      ▼
                    </div>
                    
                    <span style={{ 
                      whiteSpace: 'nowrap', 
                      fontSize: aspectWidth(1.6), 
                      fontWeight: 'bold',
                      margin: `0 ${aspectWidth(0.5)}px`
                    }}>
                      Season {seasonId}
                    </span>
                    
                    {/* Right arrow */}
                    <div style={{
                      fontSize: aspectWidth(0.8),
                      color: 'orange',
                      fontWeight: 'bold',
                      transform: isCollapsed ? 'rotate(-180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease'
                    }}>
                      ▼
                    </div>
                    
                    <div style={{
                      flex: 1,
                      height: aspectWidth(0.05),
                      backgroundColor: 'white',
                      maxWidth: aspectWidth(8)
                    }}></div>
                  </div>
                </Cell>
              </Table.Row>
            )
            
            // Add collapsible container for duel items
            if (challengeIds[Number(seasonId)].length > 0) {
              if (!isCollapsed) {
                challengeIds[Number(seasonId)].map((duelId) => {
                  result.push(<DuelItem key={duelId} duelId={duelId} compact={compact} />)
                })
              }
            }
          })
    return result
  }, [challengeIds, compact, collapsedSeasons])

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
            <FilterButton grouped icon='asterisk' state={false} disabled={!canAdd} onClick={() => setStates(AllChallengeStates)} />
            {filters}
            <FilterButton grouped icon='close' state={false} disabled={!canClear} onClick={() => setStates([])} />
          </ButtonGroup>
        </div>
      }

      <Table sortable selectable className='Faded' color={color as SemanticCOLORS} style={{ tableLayout: 'fixed' }}>
        <Table.Header className='TableHeader'>
          <Table.Row textAlign='left' verticalAlign='middle'>
            <HeaderCell style={{ width: '38%', maxWidth: '38%' }} textAlign='center'>Challenger</HeaderCell>
            <HeaderCell style={{ width: '24%', maxWidth: '24%' }} textAlign='center'></HeaderCell>
            <HeaderCell style={{ width: '38%', maxWidth: '38%' }} textAlign='center'>Challenged</HeaderCell>
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

function Player({ name, className }: { name: string, className?: string }) {
  const textRef = useRef<HTMLDivElement>(null)
  const [isTruncated, setIsTruncated] = useState(false)

  useEffect(() => {
    const checkTruncation = () => {
      if (textRef.current) {
        const isOverflowing = textRef.current.scrollWidth > textRef.current.clientWidth
        setIsTruncated(isOverflowing)
      }
    }

    checkTruncation()
    window.addEventListener('resize', checkTruncation)
    return () => window.removeEventListener('resize', checkTruncation)
  }, [name])

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
      }}
      onMouseEnter={() => isTruncated && emitter.emit('hover_description', name)}
      onMouseLeave={() => isTruncated && emitter.emit('hover_description', null)}
    >
      <ProfilePic profilePic={0} small />
      <div
        ref={textRef}
        style={{
          maxWidth: '100%',
          width: '100%',
          textAlign: 'center',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {name}
      </div>
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
  const { selectedDuelistId } = usePistolsContext()
  const { clientSeconds } = useClientTimestamp({ autoUpdate: true })

  const {
    challenge: { duelistIdA, duelistIdB, state, isLive, isCanceled, isExpired, isDraw, winner, duelistAddressA, duelistAddressB, timestampStart, timestampEnd },
    turnA, turnB,
  } = useDuel(duelId)
  const { name: playerNameA } = usePlayer(duelistAddressA)
  const { name: playerNameB } = usePlayer(duelistAddressB)
  const { isAlive: isAliveA } = useDuelistFameBalance(duelistIdA)
  const { isAlive: isAliveB } = useDuelistFameBalance(duelistIdB)
  const { isMyAccount: isYouA } = useIsMyAccount(duelistAddressA)
  const { isMyAccount: isYouB } = useIsMyAccount(duelistAddressB)

  const timeStamp = useMemo(() => {
    if (isLive) return clientSeconds
    if (isCanceled || isExpired ||isDraw || winner) return timestampEnd
    return timestampStart
  }, [isLive, isCanceled, isExpired, isDraw, winner, timestampStart, timestampEnd, clientSeconds])

  const timeAgo = useMemo(() => {
    const secondsAgo = clientSeconds - timeStamp
    if (secondsAgo < 60) return 'just now'
    if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)}m ago`
    if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)}h ago`
    if (secondsAgo < 2592000) return `${Math.floor(secondsAgo / 86400)}d ago`
    if (secondsAgo < 31536000) return `${Math.floor(secondsAgo / 2592000)}mo ago`
    return `${Math.floor(secondsAgo / 31536000)}y ago`
  }, [clientSeconds, timeStamp])

  const [leftDuelistId, leftDuelistAddress, leftPlayerName] = useMemo(() => {
    if (selectedDuelistId === duelistIdA) {
      return [duelistIdA, duelistAddressA, playerNameA]
    }
    if (selectedDuelistId === duelistIdB) {
      return [duelistIdB, duelistAddressB, playerNameB]
    }
    return [duelistIdA, duelistAddressA, playerNameA]
  }, [selectedDuelistId, duelistIdA, duelistIdB, duelistAddressA, duelistAddressB, playerNameA, playerNameB])
  
  const [rightDuelistId, rightDuelistAddress, rightPlayerName] = useMemo(() => {
    if (selectedDuelistId === duelistIdA) {
      return [duelistIdB, duelistAddressB, playerNameB]
    }
    if (selectedDuelistId === duelistIdB) {
      return [duelistIdA, duelistAddressA, playerNameA]
    }
    return [duelistIdB, duelistAddressB, playerNameB]
  }, [selectedDuelistId, duelistIdA, duelistIdB, duelistAddressA, duelistAddressB, playerNameA, playerNameB])

  const winnerIsLeft = useMemo(() => {
    if (selectedDuelistId === duelistIdA) {
      return winner == 1
    }
    if (selectedDuelistId === duelistIdB) {
      return winner == 2
    }
    return winner == 1
  }, [winner, selectedDuelistId, duelistIdA, duelistIdB])
  
  const winnerIsRight = useMemo(() => {
    if (selectedDuelistId === duelistIdA) {
      return winner == 2
    }
    if (selectedDuelistId === duelistIdB) {
      return winner == 1
    }
    return winner == 2
  }, [winner, selectedDuelistId, duelistIdA, duelistIdB])

  const isOpponentOnRight = useMemo(() => {
    if (selectedDuelistId === duelistIdA && isYouB) return true
    if (selectedDuelistId === duelistIdB && isYouA) return true
    return false
  }, [selectedDuelistId, duelistIdA, duelistIdB, isYouA, isYouB])

  const { dispatchSelectDuel } = usePistolsContext()
  const isCallToAction = useDuelCallToAction(duelId)

  const _gotoChallenge = () => {
    dispatchSelectDuel(duelId)
  }

  if (nameFilter) {
    const isA = playerNameA ? playerNameA.toLowerCase().includes(nameFilter) : false
    const isB = playerNameB ? playerNameB.toLowerCase().includes(nameFilter) : false
    if (!isA && !isB) {
      return <></>
    }
  }

  return (
    <Table.Row 
      textAlign='left' 
      verticalAlign='middle' 
      onClick={() => _gotoChallenge()} 
      style={{ 
        maxWidth: '100%',
        width: '100%',
        backgroundColor: isOpponentOnRight ? 'rgba(245, 180, 50, 0.15)' : undefined,
        minHeight: aspectWidth(6)
      }}
    >
      <Cell style={{ width: '38%', maxWidth: '38%', overflow: 'hidden', minHeight: aspectWidth(6) }}>
        <PositiveResult positive={winnerIsLeft && !isCallToAction} negative={winnerIsRight && !isCallToAction} warning={isDraw && !isCallToAction} canceled={isCanceled || isExpired}>
          <Player name={leftPlayerName} className='BreakWord' />
        </PositiveResult>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          width: '100%',
          maxWidth: '100%',
          marginTop: aspectWidth(0.4)
        }}>
          <DuelIconsAsRow duelId={duelId} duelistId={leftDuelistId} size={null} />
        </div>
      </Cell>

      <Cell textAlign='center' style={{ width: '24%', maxWidth: '24%', overflow: 'hidden', minHeight: aspectWidth(6) }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', marginTop: aspectWidth(0.4) }}>
          <span style={{ height: aspectWidth(2), fontSize: aspectWidth(1.4), fontWeight: 'bold' }}>VS</span>
          {state == constants.ChallengeState.Resolved ? (
            <PositiveResult positive={winnerIsLeft && !isCallToAction} negative={winnerIsRight && !isCallToAction} warning={isDraw && !isCallToAction} canceled={isCanceled || isExpired}>
              <span className={ChallengeStateClasses[state]}>
                {isCallToAction ? constants.ChallengeState.Awaiting : ChallengeStateNames[state]}
              </span>
            </PositiveResult>
          ) : (
            <span className={ChallengeStateClasses[state]} >
              {isCallToAction ? constants.ChallengeState.Awaiting : ChallengeStateNames[state]}
            </span>
          )}
        </div>
        <div className={ChallengeStateClasses[state]} style={{ marginTop: aspectWidth(0), height: aspectWidth(2) }}>
          {timeAgo}
        </div>
      </Cell>

      <Cell style={{ width: '38%', maxWidth: '38%', overflow: 'hidden', minHeight: aspectWidth(6) }}>
        <PositiveResult positive={winnerIsRight && !isCallToAction} negative={winnerIsLeft && !isCallToAction} warning={isDraw && !isCallToAction} canceled={isCanceled || isExpired}>
          <Player name={rightPlayerName} className='BreakWord' />
        </PositiveResult>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          width: '100%',
          maxWidth: '100%',
          marginTop: aspectWidth(0.4)
        }}>
          <DuelIconsAsRow duelId={duelId} duelistId={rightDuelistId} size={null} />
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
    <div className={_className} style={{ width: '100%', maxWidth: '100%' }}>{children}</div>
  )
}
