import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import * as TWEEN from '@tweenjs/tween.js'
import { useQueryParams } from '@/pistols/stores/queryParamsStore'
import { usePistolsContext, usePistolsScene } from '@/pistols/hooks/PistolsContext'
import { useGameEvent } from '@/pistols/hooks/useGameEvent'
import { useQueryChallengeIds } from '@/pistols/stores/challengeQueryStore'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import useGameAspect from '@/pistols/hooks/useGameApect'
import { PosterGrid, PosterGridHandle } from '@/pistols/components/PosterGrid'
import { DuelPoster, DuelPosterHandle } from '@/pistols/components/DuelPoster'
import { _currentScene } from '@/pistols/three/game'
import NewChallengeModal from '@/pistols/components/modals/NewChallengeModal'
import ChallengeModal from '@/pistols/components/modals/ChallengeModal'
import DuelistModal from '@/pistols/components/modals/DuelistModal'

export default function ScDuels() {
  const { duelistId } = useSettings()
  const { filterStatesLiveDuels, filterDuelistName, filterShowAllDuels, filterChallengeSortColumn, filterChallengeSortDirection } = useQueryParams()
  const { challengeIds } = useQueryChallengeIds(filterStatesLiveDuels, filterDuelistName, filterShowAllDuels ? 0n : duelistId, filterChallengeSortColumn, filterChallengeSortDirection)

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

  const [pageNumber, setPageNumber] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const duelsPerPage = 5
  const pageCount = useMemo(() => Math.ceil(challengeIds.length / duelsPerPage), [challengeIds])
  const posterRefs = useRef<{[key: number]: DuelPosterHandle}>({})

  const getDuelsForPage = (page: number) => {
    if (page >= pageCount || page < 0) return []
    const slicedIds = challengeIds.slice(
      page * duelsPerPage,
      (page + 1) * duelsPerPage
    )
    return slicedIds.map(id => allDuelPosters.get(id))
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
      posterRefs.current[Number(duelId)].setPosterScale(isHovering ? 1.1 : 1)
    }
  }

  const allDuelPosters = useMemo(() => {
    const posters = new Map<bigint, JSX.Element>()

    Object.values(posterRefs.current).forEach(posterRef => {
      posterRef?.toggleVisibility(false)
    })
    
    const getStartPosition = (index: number) => {
      // const yOffset = index === 0 || index === 4 ? 
      //   Math.random() * aspectWidth(-3) + aspectWidth(3) :
      //   Math.random() * aspectWidth(10) - aspectWidth(5)

      const yOffset = Math.random() * aspectWidth(-2) - aspectWidth(3);
      
      return {
        x: Math.random() * aspectWidth(3) - aspectWidth(1.5),
        y: yOffset,
      }
    }

    const createPoster = (duel: bigint) => {
      const index = challengeIds.indexOf(duel) % duelsPerPage
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
            isVisible={false}
            isHighlightable={true}
            startPosition={getStartPosition(index)}
            startRotation={Math.random() * 20 - 10 + ((index) - 2) * 5}
            onHover={(hover) => handlePosterHover(hover, duel)}
            onClick={() => handlePosterClick(duel)}
          />
        </div>
      )
    }

    // A Set is unnecessary here since we're just iterating through challengeIds
    // and checking if each duel exists in the posters Map
    challengeIds.forEach(duel => {
      if (!posters.has(duel)) {
        posters.set(duel, createPoster(duel))
      }
    })

    return posters
  }, [challengeIds, aspectWidth, aspectHeight])

  useEffect(() => {
    gridRefs.current.forEach(({ref}, index) => {
      if (ref.current) {
        setPageNumber(0)
        const renderOrder = gridRefs.current[index].renderOrder
        const translateX = (renderOrder - 1) * 74
        ref.current.setTransformX(translateX)
        ref.current.setPostersData(getDuelsForPage((renderOrder == 0 ? -1 : (renderOrder == 2 ? 1 : 0))))
      }
    })
  }, [allDuelPosters])

  const initialLoad = useRef(true)
  useEffect(() => {
    if (posterRefs.current) {
      setTimeout(() => {
        Object.entries(posterRefs.current).forEach(([key, ref]) => {
          posterRefs.current[Number(key)].toggleVisibility(true)
        })

        initialLoad.current = false
      }, initialLoad.current ? 10 : 300)
    }
  }, [allDuelPosters])

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
          
          const shiftedRef = gridRefs.current.find(g => g.renderOrder === 2)
          if (shiftedRef?.ref.current) {
            shiftedRef.ref.current.setTransformX(74)
            shiftedRef.ref.current.setPostersData(getDuelsForPage(newPage + 1))
          }
        } else {
          gridRefs.current.forEach(grid => {
            grid.renderOrder = (grid.renderOrder + 1) % 3
          })
          
          const shiftedRef = gridRefs.current.find(g => g.renderOrder === 0)
          if (shiftedRef?.ref.current) {
            shiftedRef.ref.current.setTransformX(-74)
            shiftedRef.ref.current.setPostersData(getDuelsForPage(newPage - 1))
          }
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

  return (
    <>
      <div className='NoMouse NoDrag' style={{
        width: aspectWidth(74),
        height: aspectHeight(56),
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        marginTop: aspectHeight(10),
        overflow: 'hidden',
      }}>
        {posterGrids}
      </div>
      <img src='/images/bg_duels_lighting.png' className='NoMouse NoDrag' style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        mixBlendMode: 'hard-light',
        pointerEvents: 'none'
      }} />
      <DuelistModal />
      <ChallengeModal />
      <NewChallengeModal />
    </>
  )
}