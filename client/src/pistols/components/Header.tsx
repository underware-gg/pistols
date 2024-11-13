import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Grid, Dropdown, Image, Input, ButtonGroup, Divider } from 'semantic-ui-react'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { SceneName, usePistolsContext, usePistolsScene } from '@/pistols/hooks/PistolsContext'
import { useTable } from '@/pistols/hooks/useTable'
import { BackButton, MusicToggle, FilterButton } from '@/pistols/components/ui/Buttons'
import AccountHeader from '@/pistols/components/account/AccountHeader'
import useGameAspect from '../hooks/useGameApect'
import * as TWEEN from '@tweenjs/tween.js'
import { SCENE_CHANGE_ANIMATION_DURATION } from '../three/game'
import WalletHeader from './account/WalletHeader'
import { useAccount, useDisconnect } from '@starknet-react/core'
import { useQueryContext, DuelistColumn, SortDirection, ChallengeColumn } from '@/pistols/hooks/QueryContext'
import { AllChallengeStates, ChallengeStateNames, LiveChallengeStates, PastChallengeStates } from '../utils/pistols'
import { arrayRemoveValue } from '@/lib/utils/types'

function useExit() {
  const { isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { dispatchSetScene } = usePistolsScene()
  const exit = useCallback(() => {
    if (isConnected) {
      disconnect()
    }
    dispatchSetScene(SceneName.Gate)
  }, [isConnected, disconnect, dispatchSetScene])
  return {
    exit,
  }
}

export function Header() {

  const { tableId } = useSettings()
  const { tableOpener } = usePistolsContext()
  const { description } = useTable(tableId)

  const { atDuel, atGate, atDoor, atProfile, atTavern } = usePistolsScene()
  const { aspectWidth } = useGameAspect()

  const _changeTable = () => {
    tableOpener.open()
  }

  if (atDuel) {
    return <></>
  }

  return (
    <div className='NoMouse NoDrag NoSelection' style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10 }}>
      {!atGate && !atDoor &&
        <>
          <div className='UIHeader NoMouse NoDrag NoSelection' style={{ display: 'flex', justifyContent: 'space-between' }}>
            <CurtainUI visible={!atTavern} short={true} />
            <BannerButton button={<MusicToggle size='big' />} visible={atTavern} />
          </div>
          <Image className='NoMouse NoDrag NoSelection' src='/images/ui/tavern/wooden_corners.png' style={{ position: 'absolute' }} />
          <div className='NoMouse NoDrag UIHeader NoSelection' style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div className='Padded' style={{ flex: '1' }}>
              {!atTavern && 
                <div className='YesMouse' style={{ padding: aspectWidth(1.4) }}>
                  <BackButton />
                </div>
              }
            </div>
            <div className='TitleCase NoBreak Relative' style={{ flex: '1', textAlign: 'center', height: '1px' }}>
              {/* {showTable && <>
                <h1>Pistols at 10 Blocks</h1>
                <p className='AlignTop'>
                  <IconClick name='ticket' size={'big'} onClick={() => _changeTable()} style={{ marginBottom: '0.4em' }} />
                  {' '}<b className='Important H3 Anchor' onClick={() => _changeTable()}>{description}</b>
                </p>
              </>} */}
              {/* //TODO add table name when needed */}
            </div>
            <div className='YesMouse' style={{ flex: '1', textAlign: 'right' }}>
              {!atProfile &&
                <AccountHeader />
              }
            </div>
          </div>
        </>
      }

      {/* door and gate UI */}
      <>
        <BannerButton button={<BackButton />} visible={atDoor} short={true} />
        <BannerButton button={<MusicToggle size='big'/>} right={true} visible={atGate || atDoor} short={true} />
      </>
    </div>
  )
}

function BannerButton({
  button,
  right = false,
  short = false,
  visible = false,
}: {
  button: any
  right?: boolean
  short?: boolean
  visible?: boolean
}) {

  const { aspectWidth } = useGameAspect()
  
  const [ offset, setOffset ] = useState(-16)
  
  useEffect(() => {
    if (visible) {
      new TWEEN.Tween({ offset })
        .to({ offset: short ? -4.5 : 0 }, SCENE_CHANGE_ANIMATION_DURATION * 2)
        .easing(TWEEN.Easing.Quadratic.Out)
        .delay(100)
        .onUpdate(({offset}) => setOffset(offset))
        .start()
    } else {
      new TWEEN.Tween({ offset })
        .to({ offset: -16 }, SCENE_CHANGE_ANIMATION_DURATION * 2)
        .easing(TWEEN.Easing.Quadratic.In)
        .onUpdate(({offset}) => setOffset(offset))
        .start()
    }
  }, [visible, short])

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'absolute', width: aspectWidth(10), height: 'auto', top: aspectWidth(offset), [right ? 'right' : 'left']: aspectWidth(2) }}>
      <Image className='NoMouse NoDrag' src='/images/ui/tavern/banner.png' />
      <div style={{ 
        width: aspectWidth(4), 
        height: aspectWidth(4), 
        position: 'absolute', 
        marginTop: aspectWidth(2), 
        alignContent: 'center', 
        textAlign: 'center',
        border: 'solid', 
        borderColor: '#f1d242', 
        borderWidth: `${aspectWidth(0.2)}px`,
        borderRadius: '500px', 
        backgroundColor: '#5f1011' 
      }}>
        {button}
      </div>
    </div>
  )
}

function CurtainUI({
  short = false,
  visible = false,
}: {
  short?: boolean
  visible?: boolean
}) {

  const { atProfile, atDuelists, atDuels, atGraveyard } = usePistolsScene()
  const { aspectWidth } = useGameAspect()
  const {
    duelistsAnon,
    dispatchDuelistsAnon,
  } = usePistolsContext()
  const {
    filterShowAllDuels,
    filterChallengeSortColumn,
    filterChallengeSortDirection,
    dispatchFilterShowAllDuels,
    dispatchFilterChallengeSortColumn,
    dispatchFilterChallengeSortDirection,
    dispatchFilterChallengeSortSwitch,

    filterStatesLiveDuels,
    filterStatesPastDuels,
    dispatchFilterStatesLiveDuels,
    dispatchFilterStatesPastDuels,

    filterDuelistName,
    filterDuelistActive,
    filterDuelistSortColumn,
    filterDuelistSortDirection,
    dispatchFilterDuelistActive,
    dispatchFilterDuelistName,
    dispatchFilterDuelistSortColumn,
    dispatchFilterDuelistSortDirection,
    dispatchFilterDuelistSortSwitch,
  } = useQueryContext()
  
  const [ offset, setOffset ] = useState(-18)
  
  useEffect(() => {
    if (visible) {
      new TWEEN.Tween({ offset })
        .to({ offset: short ? -8 : 0 }, SCENE_CHANGE_ANIMATION_DURATION * 2)
        .easing(TWEEN.Easing.Quadratic.Out)
        .delay(100)
        .onUpdate(({offset}) => setOffset(offset))
        .start()
    } else {
      new TWEEN.Tween({ offset })
        .to({ offset: -18 }, SCENE_CHANGE_ANIMATION_DURATION * 2)
        .easing(TWEEN.Easing.Quadratic.In)
        .onUpdate(({offset}) => setOffset(offset))
        .start()
    }
  }, [visible, short])

  const { filtersLive, canAddLive, canClearLive } = useMemo(() => {
    let canAdd = false
    let canClear = false
    let filters = []
    LiveChallengeStates.forEach(state => {
      const _switch = () => {
        if (!filterStatesLiveDuels.includes(state)) {
          dispatchFilterStatesLiveDuels([...filterStatesLiveDuels, state])
        } else {
          dispatchFilterStatesLiveDuels(arrayRemoveValue(filterStatesLiveDuels, state))
        }
      }
      let enabled = filterStatesLiveDuels.includes(state)
      if (!enabled) canAdd = true
      if (enabled) canClear = true
      filters.push(
        <FilterButton key={state}
          grouped
          label={ChallengeStateNames[state]} 
          state={enabled}
          onClick={() => _switch()}
        />)
    })
    return { filtersLive: filters, canAddLive: canAdd, canClearLive: canClear }
  }, [filterStatesLiveDuels])

  const { filtersPast, canAddPast, canClearPast } = useMemo(() => {
    let canAdd = false
    let canClear = false
    let filters = []
    PastChallengeStates.forEach(state => {
      const _switch = () => {
        if (!filterStatesPastDuels.includes(state)) {
          dispatchFilterStatesPastDuels([...filterStatesPastDuels, state])
        } else {
          dispatchFilterStatesPastDuels(arrayRemoveValue(filterStatesPastDuels, state))
        }
      }
      let enabled = filterStatesPastDuels.includes(state)
      if (!enabled) canAdd = true
      if (enabled) canClear = true
      filters.push(
        <FilterButton key={state}
          grouped
          label={ChallengeStateNames[state]}
          state={enabled}
          onClick={() => _switch()}
        />)
    })
    return { filtersPast: filters, canAddPast: canAdd, canClearPast: canClear }
  }, [filterStatesPastDuels])

  return (
    <div style={{ position: 'absolute', top: aspectWidth(offset), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Image className='NoMouse NoDrag NoSelection' src='/images/ui/tavern/curtain.png' />
      <div className='YesMouse' style={{ position: 'absolute', bottom: '10%', width: '60%', height: aspectWidth(8), display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: aspectWidth(1) }}>
        {atProfile && <div className=''>
          <WalletHeader />
        </div>}
        {atDuelists && <div style={{width: '90%' }}>
          <div style={{display: 'flex', justifyContent: 'space-evenly'}}>
            <FilterDuelistName  />
            <div>
              <label style={{marginRight: '10px'}}>Filters:</label>
              <FilterButton label='Active Only' state={filterDuelistActive} onClick={() => dispatchFilterDuelistActive(!filterDuelistActive)} />
              <FilterButton label='Wallets' state={duelistsAnon} onClick={() => dispatchDuelistsAnon(!duelistsAnon)} />
            </div>
          </div>
          <Divider />
          <div style={{display: 'flex', justifyContent: 'center'}}>
            <div>              
              
              <label style={{marginRight: '10px'}}>Sort By:</label>
              <ButtonGroup style={{ overflow: 'visible' }}>
                <FilterButton 
                  label='Name' 
                  state={filterDuelistSortColumn === DuelistColumn.Name}
                  icon={filterDuelistSortColumn === DuelistColumn.Name ? 
                    (filterDuelistSortDirection === SortDirection.Ascending ? 'arrow up' : 'arrow down') : undefined}
                  onClick={() => {
                    if (filterDuelistSortColumn === DuelistColumn.Name) {
                      dispatchFilterDuelistSortSwitch()
                    } else {
                      dispatchFilterDuelistSortColumn(DuelistColumn.Name)
                      dispatchFilterDuelistSortDirection(SortDirection.Ascending)
                    }
                  }} />
                <FilterButton 
                  grouped
                  label='Honour'
                  state={filterDuelistSortColumn === DuelistColumn.Honour}
                  icon={filterDuelistSortColumn === DuelistColumn.Honour ?
                    (filterDuelistSortDirection === SortDirection.Ascending ? 'arrow up' : 'arrow down') : undefined}
                  onClick={() => {
                    if (filterDuelistSortColumn === DuelistColumn.Honour) {
                      dispatchFilterDuelistSortSwitch()
                    } else {
                      dispatchFilterDuelistSortColumn(DuelistColumn.Honour)
                      dispatchFilterDuelistSortDirection(SortDirection.Descending)
                    }
                  }} />
                <FilterButton 
                  grouped
                  label='Total Duels'
                  state={filterDuelistSortColumn === DuelistColumn.Total}
                  icon={filterDuelistSortColumn === DuelistColumn.Total ?
                    (filterDuelistSortDirection === SortDirection.Ascending ? 'arrow up' : 'arrow down') : undefined}
                  onClick={() => {
                    if (filterDuelistSortColumn === DuelistColumn.Total) {
                      dispatchFilterDuelistSortSwitch()
                    } else {
                      dispatchFilterDuelistSortColumn(DuelistColumn.Total)
                      dispatchFilterDuelistSortDirection(SortDirection.Descending)
                    }
                  }} />
                <FilterButton 
                  grouped
                  label='Wins'
                  state={filterDuelistSortColumn === DuelistColumn.Wins}
                  icon={filterDuelistSortColumn === DuelistColumn.Wins ?
                    (filterDuelistSortDirection === SortDirection.Ascending ? 'arrow up' : 'arrow down') : undefined}
                  onClick={() => {
                    if (filterDuelistSortColumn === DuelistColumn.Wins) {
                      dispatchFilterDuelistSortSwitch()
                    } else {
                      dispatchFilterDuelistSortColumn(DuelistColumn.Wins)
                      dispatchFilterDuelistSortDirection(SortDirection.Descending)
                    }
                  }} />
                <FilterButton 
                  grouped
                  label='Losses'
                  state={filterDuelistSortColumn === DuelistColumn.Losses}
                  icon={filterDuelistSortColumn === DuelistColumn.Losses ?
                    (filterDuelistSortDirection === SortDirection.Ascending ? 'arrow up' : 'arrow down') : undefined}
                  onClick={() => {
                    if (filterDuelistSortColumn === DuelistColumn.Losses) {
                      dispatchFilterDuelistSortSwitch()
                    } else {
                      dispatchFilterDuelistSortColumn(DuelistColumn.Losses)
                      dispatchFilterDuelistSortDirection(SortDirection.Descending)
                    }
                  }} />
                <FilterButton 
                  grouped
                  label='Draws'
                  state={filterDuelistSortColumn === DuelistColumn.Draws}
                  icon={filterDuelistSortColumn === DuelistColumn.Draws ?
                    (filterDuelistSortDirection === SortDirection.Ascending ? 'arrow up' : 'arrow down') : undefined}
                  onClick={() => {
                    if (filterDuelistSortColumn === DuelistColumn.Draws) {
                      dispatchFilterDuelistSortSwitch()
                    } else {
                      dispatchFilterDuelistSortColumn(DuelistColumn.Draws)
                      dispatchFilterDuelistSortDirection(SortDirection.Descending)
                    }
                  }} />
                <FilterButton 
                  grouped
                  label='Win Ratio'
                  state={filterDuelistSortColumn === DuelistColumn.WinRatio}
                  icon={filterDuelistSortColumn === DuelistColumn.WinRatio ?
                    (filterDuelistSortDirection === SortDirection.Ascending ? 'arrow up' : 'arrow down') : undefined}
                  onClick={() => {
                    if (filterDuelistSortColumn === DuelistColumn.WinRatio) {
                      dispatchFilterDuelistSortSwitch()
                    } else {
                      dispatchFilterDuelistSortColumn(DuelistColumn.WinRatio)
                      dispatchFilterDuelistSortDirection(SortDirection.Descending)
                    }
                  }} />
              </ButtonGroup>
            </div>
          </div>
        </div>}
        {atDuels && <div style={{width: '90%'}}>
          <div style={{display: 'flex', justifyContent: 'space-evenly'}}>
            <FilterDuelistName  />
            <FilterButton label='Show All Live Duels' state={filterShowAllDuels} onClick={() => dispatchFilterShowAllDuels(!filterShowAllDuels)} />
          </div>
          <Divider />
          <div style={{display: 'flex', justifyContent: 'space-evenly'}}>
            <div>
              <label style={{marginRight: '10px'}}>Filters:</label>
              <ButtonGroup>
                <FilterButton 
                  icon='add' 
                  state={false} 
                  disabled={!canAddLive}
                  onClick={() => {
                    dispatchFilterStatesLiveDuels([...filterStatesLiveDuels, ...AllChallengeStates.filter(state => !filterStatesLiveDuels.includes(state))])
                  }} 
                />
                {filtersLive}
                <FilterButton 
                  grouped 
                  icon='close' 
                  state={false} 
                  disabled={!canClearLive}
                  onClick={() => {
                    dispatchFilterStatesLiveDuels([])
                  }} 
                />
              </ButtonGroup>
            </div>
            <div>
              <label style={{marginRight: '10px'}}>Sort By:</label>
              <ButtonGroup style={{ overflow: 'visible' }}>
                <FilterButton 
                  label='Time'
                  grouped
                  state={filterChallengeSortColumn === ChallengeColumn.Time}
                  icon={filterChallengeSortColumn === ChallengeColumn.Time ?
                    (filterChallengeSortDirection === SortDirection.Ascending ? 'arrow up' : 'arrow down') : undefined}
                  onClick={() => {
                    if (filterChallengeSortColumn === ChallengeColumn.Time) {
                      dispatchFilterChallengeSortSwitch()
                    } else {
                      dispatchFilterChallengeSortColumn(ChallengeColumn.Time)
                      dispatchFilterChallengeSortDirection(SortDirection.Descending)
                    }
                  }} />
                <FilterButton 
                  label='Status'
                  grouped
                  state={filterChallengeSortColumn === ChallengeColumn.Status}
                  icon={filterChallengeSortColumn === ChallengeColumn.Status ?
                    (filterChallengeSortDirection === SortDirection.Ascending ? 'arrow up' : 'arrow down') : undefined}
                  onClick={() => {
                    if (filterChallengeSortColumn === ChallengeColumn.Status) {
                      dispatchFilterChallengeSortSwitch()
                    } else {
                      dispatchFilterChallengeSortColumn(ChallengeColumn.Status)
                      dispatchFilterChallengeSortDirection(SortDirection.Descending)
                    }
                  }} />
              </ButtonGroup>
            </div>
          </div>
        </div>}
        {atGraveyard && <div style={{width: '90%'}}>
          <div style={{display: 'flex', justifyContent: 'space-evenly'}}>
            <FilterDuelistName  />
            <FilterButton label='Show All Past Duels' state={filterShowAllDuels} onClick={() => dispatchFilterShowAllDuels(!filterShowAllDuels)} />
          </div>
          <Divider />
          <div style={{display: 'flex', justifyContent: 'space-evenly'}}>
            <div>
              <label style={{marginRight: '10px'}}>Filters:</label>
              <ButtonGroup>
                <FilterButton 
                  icon='add' 
                  grouped 
                  state={false} 
                  disabled={!canAddPast}
                  onClick={() => {
                    dispatchFilterStatesPastDuels([...filterStatesPastDuels, ...AllChallengeStates.filter(state => !filterStatesPastDuels.includes(state))])
                  }} 
                />
                {filtersPast}
                <FilterButton 
                  grouped 
                  icon='close' 
                  state={false} 
                  disabled={!canClearPast}
                  onClick={() => {
                    dispatchFilterStatesPastDuels([])
                  }} 
                />
              </ButtonGroup>
            </div>
            <div>
              <label style={{marginRight: '10px'}}>Sort By:</label>
              <ButtonGroup style={{ overflow: 'visible' }}>
                <FilterButton 
                  label='Time'
                  grouped
                  state={filterChallengeSortColumn === ChallengeColumn.Time}
                  icon={filterChallengeSortColumn === ChallengeColumn.Time ?
                    (filterChallengeSortDirection === SortDirection.Ascending ? 'arrow up' : 'arrow down') : undefined}
                  onClick={() => {
                    if (filterChallengeSortColumn === ChallengeColumn.Time) {
                      dispatchFilterChallengeSortSwitch()
                    } else {
                      dispatchFilterChallengeSortColumn(ChallengeColumn.Time)
                      dispatchFilterChallengeSortDirection(SortDirection.Descending)
                    }
                  }} />
                <FilterButton 
                  label='Status'
                  grouped
                  state={filterChallengeSortColumn === ChallengeColumn.Status}
                  icon={filterChallengeSortColumn === ChallengeColumn.Status ?
                    (filterChallengeSortDirection === SortDirection.Ascending ? 'arrow up' : 'arrow down') : undefined}
                  onClick={() => {
                    if (filterChallengeSortColumn === ChallengeColumn.Status) {
                      dispatchFilterChallengeSortSwitch()
                    } else {
                      dispatchFilterChallengeSortColumn(ChallengeColumn.Status)
                      dispatchFilterChallengeSortDirection(SortDirection.Descending)
                    }
                  }} />
              </ButtonGroup>
            </div>
          </div>
        </div>}
      </div>
    </div>
  )
}

export function FilterDuelistName() {
  const {
    filterDuelistName,
    dispatchFilterDuelistName,
  } = useQueryContext()
  return (
    <div style={{display: 'flex', justifyContent: 'space-evenly'}}>
      <Input id='FilterByName' placeholder='Filter by Name' size='mini'
        value={filterDuelistName.toUpperCase()}
        onChange={(e) => dispatchFilterDuelistName(e.target.value)}
        action={{
          icon: 'close', size: 'mini',
          className: 'FilterButton',
          onClick: () => dispatchFilterDuelistName('')
        }}
      />
    </div>
  )
}