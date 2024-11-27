import React, { useEffect, useMemo, useRef, useState } from 'react'
import * as TWEEN from '@tweenjs/tween.js'
import { useQueryContext } from '@/pistols/hooks/QueryContext'
import { usePistolsContext, usePistolsScene } from '@/pistols/hooks/PistolsContext'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { useGameEvent } from '@/pistols/hooks/useGameEvent'
import { useQueryChallengeIds } from '@/pistols/stores/challengeQueryStore'
import useGameAspect from '@/pistols/hooks/useGameApect'
import { DuelPoster, DuelPosterHandle } from '@/pistols/components/DuelPoster'
import { PosterGrid, PosterGridHandle } from '@/pistols/components/PosterGrid'
import { InteractibleScene } from '@/pistols/three/InteractibleScene'
import { _currentScene } from '@/pistols/three/game'
import NewChallengeModal from '@/pistols/components/modals/NewChallengeModal'
import ChallengeModal from '@/pistols/components/modals/ChallengeModal'
import DuelistModal from '@/pistols/components/modals/DuelistModal'


export default function ScGraveyard() {
  const { duelistId } = useSettings()
  const { filterStatesPastDuels, filterShowAllDuels, filterChallengeSortColumn, filterChallengeSortDirection } = useQueryContext()
  const { challengeIds } = useQueryChallengeIds(filterStatesPastDuels, filterShowAllDuels ? 0n : duelistId, filterChallengeSortColumn, filterChallengeSortDirection)

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
  const duelsPerPage = 8
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
    
    const createPoster = (duel: bigint) => (
      <div 
        key={duel} 
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
          isVisible={false}
          isHighlightable={true}
          onHover={(hover) => handlePosterHover(hover, duel)}
          onClick={() => handlePosterClick(duel)}
        />
      </div>
    )

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
        const translateX = (renderOrder - 1) * 100
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
    
    const targetX = direction === 'left' ? -100 : 100;
    const startX = direction === 'left' ? 100 : -100;

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
            shiftedRef.ref.current.setTransformX(100)
            shiftedRef.ref.current.setPostersData(getDuelsForPage(newPage + 1))
          }
        } else {
          gridRefs.current.forEach(grid => {
            grid.renderOrder = (grid.renderOrder + 1) % 3
          })
          
          const shiftedRef = gridRefs.current.find(g => g.renderOrder === 0)
          if (shiftedRef?.ref.current) {
            shiftedRef.ref.current.setTransformX(-100)
            shiftedRef.ref.current.setPostersData(getDuelsForPage(newPage - 1))
          }
        }
        setPageNumber(newPage)
        setIsAnimating(false)
      })
      .start();

    (_currentScene as InteractibleScene).shiftImage(direction === 'left')
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
      {posterGrids}
      <DuelistModal />
      <ChallengeModal />
      <NewChallengeModal />
    </>
  )
}