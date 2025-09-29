import React, { useEffect, useMemo, useRef, useState } from 'react'
import * as TWEEN from '@tweenjs/tween.js'
import { useAccount } from '@starknet-react/core'
import { useQueryParams } from '/src/stores/queryParamsStore'
import { usePistolsContext, usePistolsScene } from '/src/hooks/PistolsContext'
import { useGameEvent } from '/src/hooks/useGameEvent'
import { useQueryChallengeIds } from '/src/stores/challengeQueryStore'
import { useGameAspect } from '/src/hooks/useGameAspect'
import { PosterGrid, PosterGridHandle } from '/src/components/PosterGrid'
import { DuelPoster, DuelPosterHandle } from '/src/components/DuelPoster'
import { _currentScene } from '/src/three/game'
import { SceneName } from '/src/data/assets'
import { ActionButton } from '/src/components/ui/Buttons'
import { useSettings } from '/src/hooks/SettingsContext'
import { useCurrentSeason } from '/src/stores/seasonStore'

export default function ScDuelsBoard() {
  const [pageNumber, setPageNumber] = useState(0)
  const [showNoDuelsMessage, setShowNoDuelsMessage] = useState(false)
  const duelsPerPage = 5

  const { address } = useAccount()
  const {
    filterStatesLiveDuels,
    filterPlayerName,
    filterShowAllDuels,
    filterShowBookmarkedDuels,
    filterChallengeSortColumn,
    filterChallengeSortDirection,
    filterSeason,
    filterDuelType,
  } = useQueryParams()
  const {
    challengeIds,
    pageCount,
    totalCount,
    queryHash,
    isLoading,
  } = useQueryChallengeIds(
    filterStatesLiveDuels,
    filterPlayerName,
    filterShowBookmarkedDuels,
    filterShowAllDuels ? 0n : address,
    filterChallengeSortColumn,
    filterChallengeSortDirection,
    filterSeason,
    filterDuelType,
    duelsPerPage,
    Math.max(0, pageNumber - 1),
    3
  )

  useEffect(() => {
    setPageNumber(0)
  }, [queryHash])

  useEffect(() => {
    if (!isLoading && challengeIds.length === 0) {
      const timer = setTimeout(() => {
        setShowNoDuelsMessage(true)
      }, 500)
      return () => clearTimeout(timer)
    } else {
      setShowNoDuelsMessage(false)
    }
  }, [isLoading, challengeIds.length])

  const { aspectWidth, aspectHeight } = useGameAspect()
  const { dispatchSetScene } = usePistolsScene()
  const { dispatchSelectDuel } = usePistolsContext()
  const { selectedMode } = useSettings()
  const { seasonName } = useCurrentSeason()

  const { value: itemClicked, timestamp } = useGameEvent('scene_click', null)

  const gridRefs = useRef<Array<{
    ref: React.RefObject<PosterGridHandle>,
    renderOrder: number
  }>>([
    { ref: useRef<PosterGridHandle>(null), renderOrder: 0 },
    { ref: useRef<PosterGridHandle>(null), renderOrder: 1 },
    { ref: useRef<PosterGridHandle>(null), renderOrder: 2 },
  ])
  
  const mainTween = useRef<TWEEN.Tween<{ x: number }> | null>(null)
  const secondTween = useRef<TWEEN.Tween<{ x: number }> | null>(null)

  const [isAnimating, setIsAnimating] = useState(false)
  const [allPosters, setAllPosters] = useState<Map<bigint, JSX.Element>>(new Map())
  const posterRefs = useRef<{[key: number]: DuelPosterHandle}>({})

  const getDuelsForGrid = (gridIndex: number) => {
    if (gridIndex > 2 || gridIndex < 0) return []
    const slicedIds = challengeIds.slice(
      gridIndex * duelsPerPage,
      (gridIndex + 1) * duelsPerPage
    )
    return slicedIds.map(id => allPosters.get(id))
  }

  useEffect(() => {
    if (itemClicked) {
      switch (itemClicked) {
        case 'left arrow':
          if (pageNumber > 0) {
            handlePageChange(pageNumber - 1)
          }
          break
        case 'right arrow':
          if (pageNumber < pageCount - 1) {
            handlePageChange(pageNumber + 1)
          }
          break
      }
    }
  }, [itemClicked, timestamp])

  const handlePosterClick = (duelId: bigint) => {
    if (duelId && !isAnimating) {
      dispatchSelectDuel(duelId)
    }
  }

  const handlePosterHover = (isHovering: boolean, duelId: bigint) => {
    if (!isAnimating) {
      posterRefs.current[Number(duelId)].setScale(isHovering ? 1.1 : 1)
    }
  }

  const getStartPosition = (index: number) => {
    const yOffset = Math.random() * aspectWidth(-2) - aspectWidth(3);
    
    return {
      x: index === 0 ? Math.random() * aspectWidth(1.5) :
          index === 4 ? Math.random() * aspectWidth(1.5) - aspectWidth(1.5) :
          Math.random() * aspectWidth(3) - aspectWidth(1.5),
      y: yOffset,
    }
  }

  const createPoster = (duel: bigint, isVisible: boolean = false) => {
    const index = challengeIds.indexOf(duel) % duelsPerPage

    const rotation = Math.random() * 10 - 5 + (index - 2) * 5
    const position = getStartPosition(index)

    return (
      <div 
        key={duel} 
        id={`poster-${Number(duel)}`} 
        style={{
          width: aspectWidth(70 / 5),
          height: aspectHeight(56),
          transition: 'transform 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: aspectHeight(10),
        }}
      >
        <DuelPoster
          ref={(ref: DuelPosterHandle | null) => {
            if (ref) posterRefs.current[Number(duel)] = ref
          }}
          duelId={duel}
          isSmall={true}
          isVisible={isVisible}
          isFlipped={true}
          isHighlightable={true}
          startPosition={position}
          startRotation={rotation}
          onHover={(hover) => handlePosterHover(hover, duel)}
          onClick={() => handlePosterClick(duel)}
        />
      </div>
    )
  }

  useEffect(() => {
    createPosters(true)
  }, [aspectHeight, aspectWidth])

  useEffect(() => {
    createPosters()
  }, [challengeIds])

  const createPosters = (overrideCreation: boolean = false) => {
    const posters = new Map<bigint, JSX.Element>()

    challengeIds.forEach(duel => {
      if (allPosters.has(duel) && !overrideCreation) {
        posters.set(duel, allPosters.get(duel)!)
      } else {
        posters.set(duel, createPoster(duel, overrideCreation))
      }
    })

    setAllPosters(posters)
  }

  const initialLoad = useRef(true)
  useEffect(() => {
    if (isAnimating) return

    gridRefs.current.forEach(({ref, renderOrder}) => {
      if (ref.current && pageNumber == 0) {
        const translateX = (renderOrder - 1) * 74
        ref.current.setTransformX(translateX)
        ref.current.setPostersData(getDuelsForGrid(renderOrder - 1))
      } else if (ref.current && pageNumber > 0 && renderOrder !== 1) {
        const translateX = (renderOrder - 1) * 74
        ref.current.setTransformX(translateX)
        ref.current.setPostersData(getDuelsForGrid(renderOrder))
      }
    })

    const visibilityTimeout = setTimeout(() => {
      Object.entries(posterRefs.current).forEach(([key, ref]) => {
        if (ref) {
          ref.toggleVisibility(true)
          ref.setScale(1)
        }
      })
    }, 100)

    return () => {
      clearTimeout(visibilityTimeout)
    }
  }, [allPosters, isAnimating])

  const playPageAnimation = (direction: 'left' | 'right', newPage: number) => {
    const movingGridIndex = direction === 'left' ? gridRefs.current.findIndex(grid => grid.renderOrder === 2) : gridRefs.current.findIndex(grid => grid.renderOrder === 0)
    const centerGridIndex = gridRefs.current.findIndex(grid => grid.renderOrder === 1)
    
    const targetX = direction === 'left' ? -74 : 74;
    const startX = direction === 'left' ? 74 : -74;

    mainTween.current = new TWEEN.Tween({ x: 0 })
      .to({ x: targetX }, 1200)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .onUpdate(({x}) => {
        if (gridRefs.current[centerGridIndex].ref.current) {
          gridRefs.current[centerGridIndex].ref.current.setTransformX(x)
        }
      })
      .start()

    secondTween.current = new TWEEN.Tween({ x: startX })
      .to({ x: 0 }, 1200)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .onUpdate(({x}) => {
        if (gridRefs.current[movingGridIndex].ref.current) {
          gridRefs.current[movingGridIndex].ref.current.setTransformX(x)
        }
      })
      .onComplete(() => {
        if (direction === 'left') {
          gridRefs.current.forEach(grid => {
            grid.renderOrder = (grid.renderOrder + 2) % 3
          })
        } else {
          gridRefs.current.forEach(grid => {
            grid.renderOrder = (grid.renderOrder + 1) % 3
          })
        }
        setPageNumber(newPage)
        setIsAnimating(false)
      })
      .start();
  }

  const handlePageChange = (newPage: number) => {
    if (isAnimating) return
    setIsAnimating(true)
    const direction = newPage > pageNumber ? 'left' : 'right'
    playPageAnimation(direction, newPage)
  }

  const posterGrids = useMemo(() => (
    <>
      {gridRefs.current.map((grid, i) => (
        <PosterGrid
          small={true}
          key={i}
          ref={grid.ref}
        />
      ))}
    </>
  ), [])

  // Get mode display text based on duel type filter
  const getModeText = () => {
    switch (filterDuelType) {
      case 'ranked':
        return 'RANKED'
      case 'casual':
        return 'CASUAL'
      case 'practice':
        return 'PRACTICE'
      case 'all':
      default:
        return 'ALL'
    }
  }

  return (
    <>
      {/* Board Image - Top Middle */}
      <div className='NoMouse NoDrag' style={{
        position: 'absolute',
        top: aspectHeight(14),
        left: '50%',
        transform: 'translateX(-50%) rotate(1.5deg)',
      }}>
        <img 
          src='/images/ui/tavern/board.png' 
          alt="Game Board"
          style={{
            width: aspectWidth(20),
            height: aspectHeight(15),
            objectFit: 'cover',
            filter: 'contrast(1.06) brightness(1.2) saturate(1.1) drop-shadow(-8px 6px 1px rgba(101, 67, 33, 0.6))',
          }}
        />
        
        {/* Mode Text */}
        <div style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          color: '#D4AF37',
          fontSize: aspectWidth(3),
          fontWeight: 'bold',
          textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 8px rgba(255,255,255,0.1)',
          fontFamily: 'serif',
        }}>
          {getModeText()}
        </div>
        
        {/* Season Text */}
        {/* <div style={{
          position: 'absolute',
          top: '55%',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          color: '#F4E4BC',
          fontSize: aspectWidth(1.8),
          fontWeight: 'bold',
          textShadow: '1px 1px 2px rgba(0,0,0,0.8), 0 0 6px rgba(255,255,255,0.2)',
          fontFamily: 'serif',
        }}>
          {seasonName}
        </div> */}
      </div>

      <div className='NoMouse NoDrag' style={{
        width: aspectWidth(74),
        height: aspectHeight(56),
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        marginTop: aspectHeight(10),
        overflow: 'hidden',
      }}>
        {isLoading ? null : challengeIds.length > 0 ? posterGrids : showNoDuelsMessage ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#8B4513',
            fontSize: aspectWidth(3),
            fontWeight: 'bold',
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
            fontFamily: 'serif',
          }}>
            No duels available yet
          </div>
        ) : null}
      </div>
      <img src='/images/scenes/duels_board/bg_duels_lighting.png' className='NoMouse NoDrag' style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        mixBlendMode: 'soft-light',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: aspectHeight(2),
        left: '50%',
        transform: 'translateX(-50%)',
        width: aspectWidth(40),
        zIndex: 10,
        display: 'flex',
        justifyContent: 'center'
      }}>
        <ActionButton 
          large 
          fill 
          important 
          label="View your past duels in the graveyard" 
          onClick={() => dispatchSetScene(SceneName.Graveyard)}
        />
      </div>
    </>
  )
}