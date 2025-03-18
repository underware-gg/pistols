import React, { useEffect, useMemo, useRef, useState } from 'react'
import * as TWEEN from '@tweenjs/tween.js'
import { SortDirection, PlayerColumn, useQueryParams, ChallengeColumn } from '/src/stores/queryParamsStore'
import { usePistolsContext, usePistolsScene } from '/src/hooks/PistolsContext'
import { useGameEvent } from '/src/hooks/useGameEvent'
import { useQueryPlayerIds } from '/src/stores/playerStore'
import { useGameAspect } from '/src/hooks/useGameAspect'
import { DojoSetupErrorDetector } from '/src/components/account/DojoSetupErrorDetector'
import { TavernAudios } from '/src/components/GameContainer'
import { POSTER_HEIGHT_SMALL, POSTER_WIDTH_SMALL, ProfilePoster, ProfilePosterHandle } from '../ui/ProfilePoster'
import { SceneName } from '/src/data/assets'
import { useQueryChallengeIds } from '/src/stores/challengeQueryStore'
import { useAccount } from '@starknet-react/core'
import { LiveChallengeStates } from '/src/utils/pistols'
import DuelTutorialOverlay from '../ui/duel/DuelTutorialOverlay'
import { DuelTutorialLevel } from '/src/data/tutorialConstants'

export default function ScDuelists() {
  const { address } = useAccount()
  const { filterPlayerName, filterPlayerOnline, filterPlayerBookmarked, filterPlayerSortColumn, filterPlayerSortDirection } = useQueryParams()
  const { playerIds } = useQueryPlayerIds(filterPlayerName, filterPlayerOnline, filterPlayerBookmarked, filterPlayerSortColumn, filterPlayerSortDirection)
  const { playerIds: matchmakingPlayerIds } = useQueryPlayerIds("", true, false, PlayerColumn.Timestamp, SortDirection.Descending)
  const { challengePlayerMap } = useQueryChallengeIds(LiveChallengeStates, "", false, address, ChallengeColumn.Time, SortDirection.Descending)
  const { aspectWidth, aspectHeight } = useGameAspect()
  const { dispatchSelectPlayerAddress, tutorialOpener } = usePistolsContext()
  const { dispatchSetScene} = usePistolsScene()

  const availableMatchmakingPlayers = useMemo(() => {
    return matchmakingPlayerIds.filter(id => !Array.from(challengePlayerMap.values()).some(player => player.addressA === id || player.addressB === id))
  }, [matchmakingPlayerIds, challengePlayerMap])

  useEffect(() => {
    console.log(matchmakingPlayerIds, challengePlayerMap, availableMatchmakingPlayers)
  }, [matchmakingPlayerIds, challengePlayerMap, availableMatchmakingPlayers])

  const { value: itemClicked, timestamp } = useGameEvent('scene_click', null)
  
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
        case 'pistol':
          dispatchSetScene(SceneName.DuelsBoard)
          break
        case 'matchmaking':
          if (availableMatchmakingPlayers.length > 0) {
            const randomIndex = Math.floor(Math.random() * availableMatchmakingPlayers.length)
            const randomPlayer = availableMatchmakingPlayers[randomIndex]
            dispatchSelectPlayerAddress(randomPlayer)
          } else {
            console.log("No players available for matchmaking")             
          }
          break
        case 'tutorial':
          tutorialOpener.open()
          break
      }
    }
  }, [itemClicked, timestamp])

  const [pageNumber, setPageNumber] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [postersChanged, setPostersChanged] = useState(false)
  const postersPerPage = 4
  const pageCount = useMemo(() => Math.ceil(playerIds.length / postersPerPage), [playerIds])
  const posterRefs = useRef<{[key: number]: ProfilePosterHandle}>({})
  const timeoutRef = useRef<NodeJS.Timeout>()
  const playerIdsRef = useRef<string[]>([])
  const initialLoadRef = useRef(true)

  const setPosterData = (poster: any, index: number) => {
    const horizontalOffset = (((aspectWidth(60) / 4) - aspectWidth(POSTER_WIDTH_SMALL)) / 2) * (poster.horizontalOffset != 0 ? poster.horizontalOffset : Math.random() * 2 - 1)
    const verticalOffset = (((aspectHeight(70) / 2) - aspectHeight(POSTER_HEIGHT_SMALL)) / 2) * (poster.verticalOffset != 0 ? poster.verticalOffset : Math.random() * 2 - 1)
  
    const centerX = aspectWidth(100) / 2 - aspectWidth(POSTER_WIDTH_SMALL) / 2
    const centerY = aspectHeight(100) / 2 - aspectHeight(POSTER_HEIGHT_SMALL) / 2

    const gridX = aspectWidth(20) + (index % 2) * (aspectWidth(60) / 4)
    const gridY = aspectHeight(20) + (Math.floor(index / 2) * (aspectHeight(70) / 2))
    
    const currentX = gridX + horizontalOffset
    const currentY = gridY + verticalOffset
    
    const moveX = centerX - currentX 
    const moveY = centerY - currentY + aspectHeight(50) + aspectHeight(POSTER_HEIGHT_SMALL / 2)

    const exitPositionX = centerX - currentX - aspectWidth(60) - aspectWidth(POSTER_WIDTH_SMALL / 2)
    const exitPositionY = centerY - currentY

    const angle = Math.atan2(moveY, moveX) * (180 / Math.PI)
    const rotation = poster.rotation != 0 ? poster.rotation : angle - 90

    poster.horizontalOffset = horizontalOffset
    poster.verticalOffset = verticalOffset
    poster.rotation = rotation
    poster.startPositionX = moveX
    poster.startPositionY = moveY
    poster.exitPositionX = exitPositionX
    poster.exitPositionY = exitPositionY
  }

  const getCurrentPagePosters = (ids: string[]) => {
    return ids.slice(
      pageNumber * postersPerPage, 
      (pageNumber + 1) * postersPerPage
    )
  }

  const hasPageContentChanged = (oldIds: string[], newIds: string[]) => {
    const oldPageContent = getCurrentPagePosters(oldIds)
    const newPageContent = getCurrentPagePosters(newIds)

    if (oldPageContent.length !== newPageContent.length) return true

    return oldPageContent.some((id, index) => id !== newPageContent[index])
  }

  const paginatedPosters = useMemo(() => (
    getCurrentPagePosters(playerIds).map((playerAddress, index) => {
      const newPoster = {
        playerAddress,
        horizontalOffset: 0,
        verticalOffset: 0,
        rotation: 0,
        startPositionX: 0,
        startPositionY: 0,
        exitPositionX: 0,
        exitPositionY: 0
      }
      setPosterData(newPoster, index)
      return newPoster
    })
  ), [postersChanged])

  useEffect(() => {
    paginatedPosters.forEach((poster, index) => {
      setPosterData(poster, index)
    })
  }, [aspectWidth, aspectHeight])


  //TODO adjust card animations to be more precise and realistic
  const ANIMATION_DURATION = 650
  const ANIMATION_DURATION_HAND = 1137.5
  const DELAY = 48.75
  const STATIC_DELAY = 373.75
  const EXIT_COMPLETE_DELAY = ANIMATION_DURATION + DELAY * 5 + STATIC_DELAY

  const playEnterCardsAnimation = () => {
    // Animate throw
    new TWEEN.Tween({ position: 90, rotation: 90 })
      .to({ position: 40, rotation: 20 }, ANIMATION_DURATION_HAND)
      .easing(TWEEN.Easing.Quadratic.Out)
      .onUpdate(({position, rotation}) => {
        setThrowPosition(position)
        setThrowRotation(rotation)
      })
      .chain(
        new TWEEN.Tween({ position: 40, rotation: 20 })
          .to({ position: 90, rotation: 90 }, ANIMATION_DURATION_HAND)
          .easing(TWEEN.Easing.Quadratic.In)
          .onUpdate(({position, rotation}) => {
            setThrowPosition(position)
            setThrowRotation(rotation)
          })
      )
      .start()

    paginatedPosters.forEach((poster, index) => {
      const posterPlayerAddress = poster.playerAddress
      if (posterRefs.current[posterPlayerAddress]) {
        setTimeout(() => {
          posterRefs.current[posterPlayerAddress].toggleVisibility(true)
          posterRefs.current[posterPlayerAddress].setPosition(0, 0, ANIMATION_DURATION, TWEEN.Easing.Quartic.Out)
          posterRefs.current[posterPlayerAddress].setRotation(poster.rotation, ANIMATION_DURATION, TWEEN.Easing.Quartic.Out)
        }, STATIC_DELAY + DELAY)
      }
    })

    setIsAnimating(false)
  }

  const playExitCardsAnimation = () => {
    if (initialLoadRef.current == false) {
      // Animate sweep
      // Rotation and X translation
      new TWEEN.Tween({ rotation: 60, translateX: 30 })
        .to({ rotation: -60, translateX: -40 }, ANIMATION_DURATION_HAND)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onUpdate(({rotation, translateX}) => {
          setSweepRotation(rotation)
          setSweepTranslateX(translateX)
        })
        .onComplete(() => {
          setTimeout(() => {
            setSweepRotation(60)
            setSweepTranslateX(20)
          }, 200)
        })
        .start()

      // Y translation
      new TWEEN.Tween({ translateY: 90 })
        .to({ translateY: 16 }, ANIMATION_DURATION_HAND / 3)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onUpdate(({translateY}) => {
          setSweepTranslateY(translateY)
        })
        .onComplete(() => {
          setTimeout(() => {
            setSweepTranslateY(90)
          }, 2 * (ANIMATION_DURATION_HAND / 3))
        })
        .start()

      
      paginatedPosters.forEach((poster, index) => {
        const posterPlayerAddress = poster.playerAddress
        if (posterRefs.current[posterPlayerAddress]) {
          setTimeout(() => {
            posterRefs.current[posterPlayerAddress].setPosition(poster.exitPositionX, poster.exitPositionY, ANIMATION_DURATION, TWEEN.Easing.Sinusoidal.Out)
            posterRefs.current[posterPlayerAddress].setRotation(0, ANIMATION_DURATION, TWEEN.Easing.Sinusoidal.Out)
          }, STATIC_DELAY + (index === 3 || index === 6 ? DELAY : 
            index === 2 ? DELAY * 2 :
            index === 5 ? DELAY * 2 :
            index === 1 ? DELAY * 3 :
            index === 0 || index === 4 ? DELAY * 4 : DELAY))
        }
      })

      setTimeout(() => {
        setPostersChanged(!postersChanged)
      }, EXIT_COMPLETE_DELAY)
    }
  }

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      const contentChanged = hasPageContentChanged(playerIdsRef.current, playerIds)
      
      if (contentChanged) {
        if (!initialLoadRef.current) {
          setIsAnimating(true)
          playExitCardsAnimation()
        } else {
          setPostersChanged(prev => !prev)
        }
      }

      playerIdsRef.current = playerIds
    }, 100)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [playerIds])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      paginatedPosters.forEach((poster, index) => {
        const posterPlayerAddress = poster.playerAddress
        if (posterRefs.current[posterPlayerAddress]) {
          posterRefs.current[posterPlayerAddress].toggleVisibility(false)
          posterRefs.current[posterPlayerAddress].setPosition(poster.startPositionX, poster.startPositionY, 0)
          posterRefs.current[posterPlayerAddress].setRotation(0, 0)
        }
      })

      if (isAnimating || initialLoadRef.current) {
        setTimeout(() => {
          initialLoadRef.current = false
        }, 450)
        playEnterCardsAnimation()
      }
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [paginatedPosters])

  const handlePageChange = (newPage: number) => {
    if (isAnimating) return
    setIsAnimating(true)
    setPageNumber(newPage)
    
    playExitCardsAnimation()
  }

  const _selectCallback = (playerAddress: bigint) => {
    if (playerAddress) {
      dispatchSelectPlayerAddress(playerAddress)
    } else {
      console.log("No player address selected")
    }
  }

  const [sweepRotation, setSweepRotation] = useState(60);
  const [sweepTranslateY, setSweepTranslateY] = useState(90);
  const [sweepTranslateX, setSweepTranslateX] = useState(20);
  const [throwRotation, setThrowRotation] = useState(90);
  const [throwPosition, setThrowPosition] = useState(90);
  const sweepRef = useRef<HTMLImageElement>(null);
  const throwRef = useRef<HTMLImageElement>(null);

  return (
    <div style={{
      // position: 'absolute',
      // top: 0,
      // left: 0,
      // width: '100%',
      // height: '100%',
      // perspective: '1000px',
      // perspectiveOrigin: 'bottom center',
      // transform: 'rotateX(-50deg)',
    }}>
      <div style={{
        display: 'grid',
        gridTemplateRows: 'repeat(2, 1fr)',
        gridTemplateColumns: 'repeat(2, 1fr)',
        width: aspectWidth(40),
        height: aspectHeight(75),
        position: 'absolute',
        bottom: aspectHeight(5),
        left: aspectWidth(8)
      }}>
        {paginatedPosters.map((poster, index) => (
          <div key={`poster-${poster.playerAddress}`} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              width: aspectWidth(POSTER_WIDTH_SMALL),
              height: aspectHeight(POSTER_HEIGHT_SMALL),
              transform: `translate(${poster.horizontalOffset}px, ${poster.verticalOffset}px)`,
            }}>
              <ProfilePoster
                ref={(ref: ProfilePosterHandle | null) => {
                  if (ref) posterRefs.current[poster.playerAddress] = ref
                }}
                key={poster.playerAddress}
                playerAddress={BigInt(poster.playerAddress)}
                isSmall={true}
                isHighlightable={true}
                isVisible={false}
                onClick={() => {
                  if (!isAnimating) {
                    _selectCallback(BigInt(poster.playerAddress))
                  }
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <img 
        ref={sweepRef}
        src="/images/hand_sweep.png"
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          top: 0,
          left: 0,
          objectFit: 'cover',
          transformOrigin: 'bottom center',
          transform: `translateY(${aspectHeight(sweepTranslateY)}px) translateX(${aspectWidth(sweepTranslateX)}px) rotateZ(${sweepRotation}deg)`,
          pointerEvents: 'none'
        }}
      />
      <img
        ref={throwRef}
        src="/images/hand_throw.png" 
        style={{
          position: 'absolute', 
          width: '100%',
          height: '100%',
          top: 0,
          left: 0,
          objectFit: 'cover',
          transformOrigin: 'bottom center',
          transform: `translateY(${aspectHeight(throwPosition)}px) translateX(${aspectWidth(-30)}px) rotateZ(${throwRotation}deg)`,
          pointerEvents: 'none'
        }}
      />

      <DuelTutorialOverlay opener={tutorialOpener} />

      <TavernAudios />

      <DojoSetupErrorDetector />
    </div>
  )
}
