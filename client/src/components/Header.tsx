import React, { useCallback, useEffect, useState } from 'react'
import { Image, Input, ButtonGroup, Divider } from 'semantic-ui-react'
import { useAccount, useDisconnect } from '@starknet-react/core'
import { useQueryParams, SortDirection, ChallengeColumn, PlayerColumn } from '/src/stores/queryParamsStore'
import { useTableId } from '/src/stores/configStore'
import { useTable } from '/src/stores/tableStore'
import { usePistolsContext, usePistolsScene } from '/src/hooks/PistolsContext'
import { useGameAspect } from '/src/hooks/useGameAspect'
import { ChallengeStateNames, LiveChallengeStates, PastChallengeStates } from '/src/utils/pistols'
import { BackButton, MusicToggle, FilterButton } from '/src/components/ui/Buttons'
import { SCENE_CHANGE_ANIMATION_DURATION } from '/src/three/game'
import { arrayRemoveValue } from '@underware/pistols-sdk/utils'
import { SceneName } from '/src/data/assets'
import WalletHeader from '/src/components/account/WalletHeader'
import AccountHeader from '/src/components/account/AccountHeader'
import * as TWEEN from '@tweenjs/tween.js'

interface SortButtonProps {
  label: string
  column: PlayerColumn | ChallengeColumn
  currentColumn: PlayerColumn | ChallengeColumn
  currentDirection: SortDirection
  onSort: (column: PlayerColumn | ChallengeColumn) => void
  grouped?: boolean
}

function SortButton({ label, column, currentColumn, currentDirection, onSort, grouped = false }: SortButtonProps) {
  const isActive = currentColumn === column
  const icon = isActive ? (currentDirection === SortDirection.Ascending ? 'arrow up' : 'arrow down') : undefined

  return (
    <FilterButton
      label={label}
      grouped={grouped}
      state={isActive}
      icon={icon}
      onClick={() => onSort(column)}
    />
  )
}

interface FilterStateButtonGroupProps {
  states: any[]
  currentStates: any[]
  setStates: (states: any[]) => void
  getLabel: (state: any) => string
}

function FilterStateButtonGroup({ states, currentStates, setStates, getLabel }: FilterStateButtonGroupProps) {
  const canAdd = states.some(state => !currentStates.includes(state))
  const canClear = currentStates.length > 0

  const buttons = states.map(state => (
    <FilterButton
      key={state}
      grouped
      label={getLabel(state)}
      state={currentStates.includes(state)}
      onClick={() => {
        if (!currentStates.includes(state)) {
          setStates([...currentStates, state])
        } else {
          setStates(arrayRemoveValue(currentStates, state))
        }
      }}
    />
  ))

  return (
    <ButtonGroup>
      <FilterButton
        icon='add'
        grouped
        state={false}
        disabled={!canAdd}
        onClick={() => setStates([...currentStates, ...states.filter(state => !currentStates.includes(state))])}
      />
      {buttons}
      <FilterButton
        grouped
        icon='close'
        state={false}
        disabled={!canClear}
        onClick={() => setStates([])}
      />
    </ButtonGroup>
  )
}

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

  const { tableId, isSeason, isTutorial } = useTableId()
  const { tableOpener } = usePistolsContext()
  const { description } = useTable(tableId)

  const { atDuel, atGate, atDoor, atProfile, atTavern, atTutorial } = usePistolsScene()
  const { aspectWidth } = useGameAspect()

  const [show, setShow] = useState(false);
  
  useEffect(() => {
    const shouldShow = !atGate && !atDoor && !atTutorial;
    if (!shouldShow) {
      setShow(false);
    } else {
      const timer = setTimeout(() => {
        setShow(true);
      }, SCENE_CHANGE_ANIMATION_DURATION);
      return () => clearTimeout(timer);
    }
  }, [atGate, atDoor, atTutorial]);

  const _changeTable = () => {
    tableOpener.open()
  }

  if (atDuel) {
    return <></>
  }

  return (
    <div className='NoMouse NoDrag NoSelection' style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 982 }}>
      {show &&
        <>
          <div className='UIHeader NoMouse NoDrag NoSelection' style={{ display: 'flex', justifyContent: 'space-between' }}>
            <CurtainUI visible={!atTavern && !atTutorial} short={true} />
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
                <h1>Pistols at Dawn</h1>
                <p className='AlignTop'>
                  <IconClick name='ticket' size={'big'} onClick={() => _changeTable()} style={{ marginBottom: '0.4em' }} />
                  {' '}<b className='Important H3 Anchor' onClick={() => _changeTable()}>{description}</b>
                </p>
              </>} */}
              {/* //TODO add table name when needed */}
            </div>
            <div style={{ flex: '1', textAlign: 'right' }}>
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

  const { atProfile, atDuelists, atDuelsBoard, atGraveyard } = usePistolsScene()
  const { aspectWidth } = useGameAspect()
  const {
    walletFinderOpener,
  } = usePistolsContext()
  const {
    filterShowAllDuels,
    filterShowBookmarkedDuels,
    filterChallengeSortColumn,
    filterChallengeSortDirection,
    setFilterShowAllDuels,
    setFilterShowBookmarkedDuels,
    setFilterChallengeSortColumn,
    setFilterChallengeSortDirection,
    setFilterChallengeSortSwitch,

    filterStatesLiveDuels,
    filterStatesPastDuels,
    setFilterStatesLiveDuels,
    setFilterStatesPastDuels,

    filterPlayerOnline,
    filterPlayerBookmarked,
    filterPlayerSortColumn,
    filterPlayerSortDirection,
    setFilterPlayerOnline,
    setFilterPlayerBookmarked,
    setFilterPlayerSortColumn,
    setFilterPlayerSortDirection,
    setFilterPlayerSortSwitch,
  } = useQueryParams()
  
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

  const handlePlayerSort = (column: PlayerColumn) => {
    if (filterPlayerSortColumn === column) {
      setFilterPlayerSortSwitch()
    } else {
      setFilterPlayerSortColumn(column)
      setFilterPlayerSortDirection(column === PlayerColumn.Timestamp ? SortDirection.Descending : SortDirection.Ascending)
    }
  }

  const handleChallengeSort = (column: ChallengeColumn) => {
    if (filterChallengeSortColumn === column) {
      setFilterChallengeSortSwitch()
    } else {
      setFilterChallengeSortColumn(column)
      setFilterChallengeSortDirection(SortDirection.Descending)
    }
  }

  return (
    <div style={{ position: 'absolute', top: aspectWidth(offset), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Image className='NoMouse NoDrag NoSelection' src='/images/ui/tavern/curtain.png' />
      <div className='YesMouse' style={{ position: 'absolute', bottom: '10%', width: '60%', height: aspectWidth(8), display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: aspectWidth(1) }}>
        {atProfile && <div className=''>
          <WalletHeader />
        </div>}
        
        {atDuelists && <div style={{width: '90%' }}>
          <div style={{display: 'flex', justifyContent: 'space-evenly'}}>
            <FilterPlayerName  />
            <div>
              <label style={{marginRight: '10px'}}>Filters:</label>
              <FilterButton label='Active Only' state={filterPlayerOnline} onClick={() => setFilterPlayerOnline(!filterPlayerOnline)} />
              <FilterButton label='Bookmarked' state={filterPlayerBookmarked} onClick={() => setFilterPlayerBookmarked(!filterPlayerBookmarked)} />
              <FilterButton label='Player Finder' state={walletFinderOpener.isOpen} onClick={() => walletFinderOpener.open()} />
            </div>
          </div>
          <Divider />
          <div style={{display: 'flex', justifyContent: 'center'}}>
            <div>              
              <label style={{marginRight: '10px'}}>Sort By:</label>
              <ButtonGroup style={{ overflow: 'visible' }}>
                <SortButton
                  label="Name"
                  column={PlayerColumn.Name}
                  currentColumn={filterPlayerSortColumn}
                  currentDirection={filterPlayerSortDirection}
                  onSort={handlePlayerSort}
                />
                <SortButton
                  label="Date Joined"
                  column={PlayerColumn.Timestamp}
                  currentColumn={filterPlayerSortColumn}
                  currentDirection={filterPlayerSortDirection}
                  onSort={handlePlayerSort}
                  grouped
                />
              </ButtonGroup>
            </div>
          </div>
        </div>}

        {atDuelsBoard && <div style={{width: '90%'}}>
          <div style={{display: 'flex', justifyContent: 'space-evenly'}}>
            <FilterPlayerName  />
            <FilterButton label='Show All Live Duels' state={filterShowAllDuels} onClick={() => setFilterShowAllDuels(!filterShowAllDuels)} />
            <FilterButton label='Bookmarked' state={filterShowBookmarkedDuels} onClick={() => setFilterShowBookmarkedDuels(!filterShowBookmarkedDuels)} />
          </div>
          <Divider />
          <div style={{display: 'flex', justifyContent: 'space-evenly'}}>
            <div>
              <label style={{marginRight: '10px'}}>Filters:</label>
              <FilterStateButtonGroup
                states={LiveChallengeStates}
                currentStates={filterStatesLiveDuels}
                setStates={setFilterStatesLiveDuels}
                getLabel={(state) => ChallengeStateNames[state]}
              />
            </div>
            <div>
              <label style={{marginRight: '10px'}}>Sort By:</label>
              <ButtonGroup style={{ overflow: 'visible' }}>
                <SortButton
                  label="Time"
                  column={ChallengeColumn.Time}
                  currentColumn={filterChallengeSortColumn}
                  currentDirection={filterChallengeSortDirection}
                  onSort={handleChallengeSort}
                  grouped
                />
                <SortButton
                  label="Status"
                  column={ChallengeColumn.Status}
                  currentColumn={filterChallengeSortColumn}
                  currentDirection={filterChallengeSortDirection}
                  onSort={handleChallengeSort}
                  grouped
                />
              </ButtonGroup>
            </div>
          </div>
        </div>}
        {atGraveyard && <div style={{width: '90%'}}>
          <div style={{display: 'flex', justifyContent: 'space-evenly'}}>
            <FilterPlayerName  />
            <FilterButton label='Show All Past Duels' state={filterShowAllDuels} onClick={() => setFilterShowAllDuels(!filterShowAllDuels)} />
            <FilterButton label='Bookmarked' state={filterShowBookmarkedDuels} onClick={() => setFilterShowBookmarkedDuels(!filterShowBookmarkedDuels)} />
          </div>
          <Divider />
          <div style={{display: 'flex', justifyContent: 'space-evenly'}}>
            <div>
              <label style={{marginRight: '10px'}}>Filters:</label>
              <FilterStateButtonGroup
                states={PastChallengeStates}
                currentStates={filterStatesPastDuels}
                setStates={setFilterStatesPastDuels}
                getLabel={(state) => ChallengeStateNames[state]}
              />
            </div>
            <div>
              <label style={{marginRight: '10px'}}>Sort By:</label>
              <ButtonGroup style={{ overflow: 'visible' }}>
                <SortButton
                  label="Time"
                  column={ChallengeColumn.Time}
                  currentColumn={filterChallengeSortColumn}
                  currentDirection={filterChallengeSortDirection}
                  onSort={handleChallengeSort}
                  grouped
                />
                <SortButton
                  label="Status"
                  column={ChallengeColumn.Status}
                  currentColumn={filterChallengeSortColumn}
                  currentDirection={filterChallengeSortDirection}
                  onSort={handleChallengeSort}
                  grouped
                />
              </ButtonGroup>
            </div>
          </div>
        </div>}
      </div>
    </div>
  )
}

export function FilterPlayerName() {
  const {
    filterPlayerName,
    setFilterPlayerName,
  } = useQueryParams()
  return (
    <div style={{display: 'flex', justifyContent: 'space-evenly'}}>
      <Input id='FilterByName' placeholder='Filter by Name' size='mini'
        value={filterPlayerName.toUpperCase()}
        onChange={(e) => setFilterPlayerName(e.target.value)}
        action={{
          icon: 'close', size: 'mini',
          className: 'FilterButton',
          onClick: () => setFilterPlayerName('')
        }}
      />
    </div>
  )
}

//TODO remove content on the curtain ui only when the curtain is raised (when switching screen, best example is ScProfile)