import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as TWEEN from '@tweenjs/tween.js'
import { useAccount } from '@starknet-react/core'
import { useQueryParams } from '/src/stores/queryParamsStore'
import { usePistolsContext, usePistolsScene } from '/src/hooks/PistolsContext'
import { useGameEvent } from '/src/hooks/useGameEvent'
import { useQueryChallengeIds } from '/src/stores/challengeQueryStore'
import { useGameAspect } from '/src/hooks/useGameAspect'
import { DuelPoster, DuelPosterHandle } from '/src/components/DuelPoster'
import { PosterGrid, PosterGridHandle } from '/src/components/PosterGrid'
import { InteractibleScene } from '/src/three/InteractibleScene'
import { _currentScene } from '/src/three/game'
import { ActionButton } from '/src/components/ui/Buttons'
import { SceneName  } from '/src/data/assetsTypes'


export default function ScGraveyard() {
  const [pageNumber, setPageNumber] = useState(0)
  const [showNoDuelsMessage, setShowNoDuelsMessage] = useState(false)
  const duelsPerPage = 8

  const { address } = useAccount()
  const {
    filterStatesPastDuels,
    filterPlayerName,
    filterShowAllDuels,
    filterShowBookmarkedDuels,
    filterChallengeSortColumn,
    filterChallengeSortDirection,
    filterSeason,
  } = useQueryParams()
  const {
    challengeIds,
    pageCount,
    totalCount,
    queryHash,
    isLoading,
  } = useQueryChallengeIds(
    filterStatesPastDuels,
    filterPlayerName,
    filterShowBookmarkedDuels,
    filterShowAllDuels ? 0n : address,
    filterChallengeSortColumn,
    filterChallengeSortDirection,
    filterSeason,
    "all",
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

  const createPoster = (duel: bigint, isVisible: boolean = false) => (
    <div 
      key={duel.toString()} 
      id={`poster-${Number(duel)}`} 
      className='YesMouse'
      style={{
        width: aspectWidth(86 / 4 - 6),
        height: aspectHeight(74 / 2),
        transition: 'transform 0.3s ease',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center'
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
        onHover={(hover) => handlePosterHover(hover, duel)}
        onClick={() => handlePosterClick(duel)}
      />
    </div>
  )

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

  useEffect(() => {
    if (isAnimating) return

    gridRefs.current.forEach(({ref, renderOrder}) => {
      if (ref.current && pageNumber == 0) {
        const translateX = (renderOrder - 1) * 100
        ref.current.setTransformX(translateX)
        ref.current.setPostersData(getDuelsForGrid(renderOrder - 1))
      } else if (ref.current && pageNumber > 0 && renderOrder !== 1) {
        const translateX = (renderOrder - 1) * 100
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
    
    const targetX = direction === 'left' ? -100 : 100;
    const startX = direction === 'left' ? 100 : -100;
    const duration = 1000

    // First ensure all posters are visible before animation
    Object.values(posterRefs.current).forEach(ref => {
      if (ref) ref.toggleVisibility(true)
    })

    mainTween.current = new TWEEN.Tween({ x: 0 })
      .to({ x: targetX }, duration)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .onUpdate(({x}) => {
        if (gridRefs.current[centerGridIndex].ref.current) {
          gridRefs.current[centerGridIndex].ref.current.setTransformX(x)
        }
      })
      .start()

    secondTween.current = new TWEEN.Tween({ x: startX })
      .to({ x: 0 }, duration)
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

    (_currentScene as InteractibleScene)?.shiftImage(direction === 'left', duration)
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
          key={i}
          ref={grid.ref}
        />
      ))}
    </>
  ), [])

  return (
    <>
      {isLoading ? null : challengeIds.length > 0 ? posterGrids : showNoDuelsMessage ? (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#D4AF37',
          fontSize: aspectWidth(3),
          fontWeight: 'bold',
          textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
          fontFamily: 'serif',
        }}>
          No duels available yet
        </div>
      ) : null}
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
          label="Go and check out active duels!" 
          onClick={() => dispatchSetScene(SceneName.DuelsBoard)}
        />
      </div>
    </>
  )
}