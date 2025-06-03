import React, { useCallback, useEffect, useState, useMemo, useRef, memo } from 'react'
import { Image, Input, ButtonGroup, Divider } from 'semantic-ui-react'
import { useQueryParams, SortDirection, ChallengeColumn, PlayerColumn } from '/src/stores/queryParamsStore'
import { usePistolsContext, usePistolsScene } from '/src/hooks/PistolsContext'
import { useGameAspect } from '/src/hooks/useGameAspect'
import { ChallengeStateNames, LiveChallengeStates, PastChallengeStates } from '/src/utils/pistols'
import { BackButton, FilterButton, SettingsGearButton, HomeButton } from '/src/components/ui/Buttons'
import { SCENE_CHANGE_ANIMATION_DURATION } from '/src/three/game'
import { arrayRemoveValue } from '@underware/pistols-sdk/utils'
import WalletHeader from '/src/components/account/WalletHeader'
import AccountHeader from '/src/components/account/AccountHeader'
import * as TWEEN from '@tweenjs/tween.js'
import { usePlayerDuelistsOrganized } from '/src/stores/duelistStore'
import DuelistData, { DuelistDataValues } from '/src/components/ui/DuelistData'

const VisibilityWrapper = memo(function VisibilityWrapper({ 
  visible, 
  children,
  style = {}
}: { 
  visible: boolean, 
  children: React.ReactNode,
  style?: React.CSSProperties 
}) {
  return (
    <div style={{
      ...style,
      display: visible ? 'block' : 'none',
      position: 'absolute',
      width: '100%',
      height: '100%',
      top: 0,
      left: 0
    }}>
      {children}
    </div>
  );
});

const DuelistStats = memo(function DuelistStats() {
  const { activeDuelists: duelistIds, deadDuelists } = usePlayerDuelistsOrganized();

  const duelistDataRef = useRef<Record<string, DuelistDataValues>>({});
  const [dataLoaded, setDataLoaded] = useState(false);
  
  const [stats, setStats] = useState({
    total: 0,
    alive: 0,
    dead: 0,
    totalWins: 0,
    totalLosses: 0,
    totalDraws: 0,
    totalDuels: 0,
    totalHonour: 0,
    duelistsWithHonour: 0
  });
  
  const checkAllLoaded = useCallback(() => {
    const loadedCount = Object.keys(duelistDataRef.current).length;
    if (loadedCount === duelistIds.length && loadedCount > 0) {
      const aggregated = Object.values(duelistDataRef.current).reduce((acc, duelist) => {
        return {
          total: acc.total + 1,
          alive: acc.alive + (duelist.isDead ? 0 : 1),
          dead: acc.dead + (duelist.isDead ? 1 : 0),
          totalWins: acc.totalWins + duelist.totalWins,
          totalLosses: acc.totalLosses + duelist.totalLosses,
          totalDraws: acc.totalDraws + duelist.totalDraws,
          totalDuels: acc.totalDuels + duelist.totalDuels,
          totalHonour: acc.totalHonour + (duelist.honour * 10),
          duelistsWithHonour: acc.duelistsWithHonour + (duelist.honour > 0 ? 1 : 0)
        };
      }, {
        total: 0,
        alive: 0,
        dead: 0,
        totalWins: 0,
        totalLosses: 0,
        totalDraws: 0,
        totalDuels: 0,
        totalHonour: 0,
        duelistsWithHonour: 0
      });

      aggregated.dead = deadDuelists.length;
      
      setStats(aggregated);
      setDataLoaded(true);
    }
  }, [duelistIds.length, deadDuelists.length]);
  
  const handleDuelistDataLoad = useCallback((data: DuelistDataValues) => {
    const idStr = data.id.toString();
    if (!duelistDataRef.current[idStr] || 
        JSON.stringify(duelistDataRef.current[idStr]) !== JSON.stringify(data)) {
      duelistDataRef.current[idStr] = data;
      checkAllLoaded();
    }
  }, [checkAllLoaded]);
  
  const winRate = useMemo(() => {
    if (stats.totalDuels === 0) return "0%";
    const rate = (stats.totalWins / stats.totalDuels) * 100;
    return `${rate.toFixed(0)}%`;
  }, [stats.totalWins, stats.totalDuels]);
  
  const avgHonour = useMemo(() => {
    if (stats.duelistsWithHonour === 0) return "0";
    const avg = stats.totalHonour / (stats.duelistsWithHonour * 10);
    return avg.toFixed(1);
  }, [stats.totalHonour, stats.duelistsWithHonour]);

  return (
    <>
      {duelistIds.map(duelistId => (
        <DuelistData 
          key={duelistId.toString()} 
          duelistId={duelistId} 
          onDataLoad={handleDuelistDataLoad} 
        />
      ))}
      
      {!dataLoaded && duelistIds.length > 0 ? (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          width: '100%', 
          padding: '20px',
          color: '#f1d242'
        }}>
          <div style={{ 
            position: 'relative',
            width: '30px',
            height: '30px'
          }}>
            <div style={{ 
              position: 'absolute',
              top: '0',
              left: '0',
              width: '100%',
              height: '100%',
              border: '3px solid rgba(241, 210, 66, 0.2)',
              borderTopColor: '#f1d242',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
          <span style={{ marginLeft: '10px' }}>Loading duelist data...</span>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          width: '100%',
          gap: '10px'
        }}>
          <div className="header-duelist-stat-item">
            <span className="header-duelist-stat-value">{stats.total + stats.dead}</span>
            <span className="header-duelist-stat-label">TOTAL DUELISTS</span>
            <div className="header-duelist-stat-divider"></div>
          </div>
          
          <div className="header-duelist-stat-item">
            <span className="header-duelist-stat-value">{stats.alive}</span>
            <span className="header-duelist-stat-label">ALIVE & ACTIVE</span>
            <div className="header-duelist-stat-divider"></div>
          </div>
          
          <div className="header-duelist-stat-item">
            <span className="header-duelist-stat-value">{stats.dead}</span>
            <span className="header-duelist-stat-label">FALLEN</span>
            <div className="header-duelist-stat-divider"></div>
          </div>
          
          <div className="header-duelist-stat-item">
            <span className="header-duelist-stat-value">{winRate}</span>
            <span className="header-duelist-stat-label">WIN RATE</span>
            <div className="header-duelist-stat-divider"></div>
          </div>
          
          <div className="header-duelist-stat-item">
            <span className="header-duelist-stat-value">{avgHonour}</span>
            <span className="header-duelist-stat-label">AVG HONOUR</span>
          </div>
        </div>
      )}
    </>
  );
})

interface SortButtonProps {
  label: string
  column: PlayerColumn | ChallengeColumn
  currentColumn: PlayerColumn | ChallengeColumn
  currentDirection: SortDirection
  onSort: (column: PlayerColumn | ChallengeColumn) => void
  grouped?: boolean
}

const SortButton = memo(function SortButton({ label, column, currentColumn, currentDirection, onSort, grouped = false }: SortButtonProps) {
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
})

interface FilterStateButtonGroupProps {
  states: any[]
  currentStates: any[]
  setStates: (states: any[]) => void
  getLabel: (state: any) => string
}

const FilterStateButtonGroup = memo(function FilterStateButtonGroup({ states, currentStates, setStates, getLabel }: FilterStateButtonGroupProps) {
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
})

export const Header = memo(function Header() {

  const { atDuel, atGate, atDoor, atProfile, atTavern, atTutorial, atDuelistBook, atCardPacks } = usePistolsScene()
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


  if (atDuel) {
    return <></>
  }

  return (
    <div className='NoMouse NoDrag NoSelection' style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 982 }}>
      <VisibilityWrapper visible={show}>
        <>
          <div className='UIHeader NoMouse NoDrag NoSelection' style={{ display: 'flex', justifyContent: 'space-between' }}>
            <CurtainUI visible={!atTavern && !atTutorial && !atCardPacks} short={true} />
            <BannerButton button={<SettingsGearButton size='big'/>} visible={atTavern || atProfile} right={true} />
          </div>
          <Image className='NoMouse NoDrag NoSelection ' src='/images/ui/tavern/wooden_corners.png' style={{ position: 'absolute' }} />
          <div className='UIHeaderCorner' style={{ padding: `${aspectWidth(1)}px ${aspectWidth(2)}px` }}>
            {!atTavern && 
              <>
                <BackButton />
                <HomeButton />
              </>
            }
          </div>

          <div className='UIHeaderCorner right'>
            {!atProfile &&
              <AccountHeader />
            }
          </div>
        </>
      </VisibilityWrapper>

      {/* door and gate UI */}
      <VisibilityWrapper visible={atDoor}>
        <>
          <BannerButton button={<BackButton icon='left-arrow' size='big'/>} visible={true} short={true} />
          <BannerButton button={<SettingsGearButton size='big'/>} right={true} visible={true} short={true} />
        </>
      </VisibilityWrapper>
    </div>
  )
})

export const BannerButton = memo(function BannerButton({
  button,
  right = false,
  short = false,
  long = false,
  visible = false,
}: {
  button: any
  right?: boolean
  short?: boolean
  long?: boolean
  visible?: boolean
}) {

  const { aspectWidth } = useGameAspect()
  
  const [ offset, setOffset ] = useState(-16)
  
  useEffect(() => {
    if (visible) {
      let targetOffset = 0
      if (short) targetOffset = -4.5
      else if (long) targetOffset = 3
      
      new TWEEN.Tween({ offset })
        .to({ offset: targetOffset }, SCENE_CHANGE_ANIMATION_DURATION * 2)
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
  }, [visible, short, long])

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
})

const CurtainUI = memo(function CurtainUI({
  short = false,
  visible = false,
}: {
  short?: boolean
  visible?: boolean
}) {

  const { atProfile, atDuelists, atDuelsBoard, atGraveyard, atDuelistBook } = usePistolsScene()
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
        <VisibilityWrapper visible={atProfile}>
          <WalletHeader />
        </VisibilityWrapper>
        
        <VisibilityWrapper visible={atDuelists}>
          <div style={{width: '90%' }}>
            <div style={{display: 'flex', justifyContent: 'space-evenly', alignItems: 'center'}}>
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
          </div>
        </VisibilityWrapper>

        <VisibilityWrapper visible={atDuelsBoard}>
          <div style={{width: '90%'}}>
            <div style={{display: 'flex', justifyContent: 'space-evenly', alignItems: 'center'}}>
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
          </div>
        </VisibilityWrapper>

        <VisibilityWrapper visible={atGraveyard}>
          <div style={{width: '90%'}}>
            <div style={{display: 'flex', justifyContent: 'space-evenly', alignItems: 'center'}}>
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
          </div>
        </VisibilityWrapper>

        <VisibilityWrapper visible={atDuelistBook}>
          <div style={{width: '90%'}}>
            <div style={{display: 'flex', justifyContent: 'space-evenly', alignItems: 'center'}}>
              <div style={{
                textAlign: 'center',
                margin: '0 auto',
                background: 'linear-gradient(180deg, #f1d242 0%, #e6aa0e 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                textShadow: '0 0 10px rgba(241, 210, 66, 0.5)',
                fontSize: aspectWidth(2),
                fontWeight: 'bold',
                letterSpacing: aspectWidth(0.3),
                transform: 'scale(1.2)',
                padding: `${aspectWidth(1)} 0`,
                position: 'relative',
              }}>
                GENESIS COLLECTION
                <div style={{
                  position: 'absolute',
                  height: aspectWidth(0.2),
                  background: 'linear-gradient(90deg, transparent 0%, #f1d242 30%, #f1d242 70%, transparent 100%)',
                  width: '100%',
                  left: '0',
                  marginTop: aspectWidth(0.2),
                }}></div>
              </div>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: aspectWidth(1.3),
              gap: aspectWidth(2.5),
              color: '#f1d242',
              fontSize: aspectWidth(1.1)
            }}>
              <DuelistStats />
            </div>
          </div>
        </VisibilityWrapper>
      </div>
    </div>
  )
})

// Memoize FilterPlayerName component
const FilterPlayerName = memo(function FilterPlayerName() {
  const {
    filterPlayerName,
    setFilterPlayerName,
  } = useQueryParams()
  const { aspectWidth } = useGameAspect()
  
  return (
    <div style={{
      position: 'relative',
      minWidth: aspectWidth(12)
    }}>
      <Input 
        id='FilterByName' 
        placeholder='FILTER BY NAME' 
        size='mini'
        className='YesMouse'
        value={filterPlayerName.toUpperCase()}
        onChange={(e) => setFilterPlayerName(e.target.value)}
        style={{
          width: '100%',
          height: aspectWidth(2.8),
          padding: aspectWidth(0.5),
          color: '#f1d242',
          fontSize: aspectWidth(1),
          fontWeight: 'bold',
        }}
        action={{
          icon: filterPlayerName ? 'close' : 'search', 
          size: 'mini',
          className: 'FilterButton',
          onClick: () => setFilterPlayerName(''),
          style: {
            padding: aspectWidth(0.8),
            cursor: 'pointer',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#f1d242',
            backgroundColor: 'rgba(95, 16, 17, 0.8)',
            borderRadius: `0 ${aspectWidth(0.4)}px ${aspectWidth(0.4)}px 0`,
            border: 'none',
            boxShadow: `inset 0 0 ${aspectWidth(0.2)}px rgba(241, 210, 66, 0.3)`,
            fontSize: aspectWidth(1.1)
          }
        }}
      />
    </div>
  )
})

//TODO remove content on the curtain ui only when the curtain is raised (when switching screen, best example is ScProfile)