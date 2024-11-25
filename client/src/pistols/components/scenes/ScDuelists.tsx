import React, { useEffect, useMemo, useRef, useState } from 'react'
import * as TWEEN from '@tweenjs/tween.js'
import { useQueryContext } from '@/pistols/hooks/QueryContext'
import { usePistolsContext, usePistolsScene } from '@/pistols/hooks/PistolsContext'
import { useGameEvent } from '@/pistols/hooks/useGameEvent'
import { TavernAudios } from '@/pistols/components/GameContainer'
import { DojoSetupErrorDetector } from '@/pistols/components/account/ConnectionDetector'
import NewChallengeModal from '@/pistols/components/modals/NewChallengeModal'
import ChallengeModal from '@/pistols/components/modals/ChallengeModal'
import DuelistModal from '@/pistols/components/modals/DuelistModal'
import { DuelistCard, DuelistCardHandle } from '../cards/DuelistCard'
import useGameAspect from '@/pistols/hooks/useGameApect'
import { DUELIST_CARD_HEIGHT, DUELIST_CARD_WIDTH } from '@/pistols/data/cardConstants'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { useOpener } from '@/lib/ui/useOpener'

export default function ScDuelists() {
  const { queryDuelists } = useQueryContext()
  const { aspectWidth, aspectHeight } = useGameAspect()
  const { dispatchSelectDuelistId } = usePistolsContext()
  const anonOpener = useOpener()

  const { dispatchSetScene } = usePistolsScene()
  const { value: itemClicked, timestamp } = useGameEvent('scene_click', null)

  const [open, setOpen] = useState(false)
  
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

  const [pageNumber, setPageNumber] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [duelistsChanged, setDuelistsChanged] = useState(false)
  const duelistsPerPage = 7
  const pageCount = useMemo(() => Math.ceil(queryDuelists.length / duelistsPerPage), [queryDuelists])
  const cardRefs = useRef<{[key: number]: DuelistCardHandle}>({})
  const timeoutRef = useRef<NodeJS.Timeout>()
  const initialLoadRef = useRef(true)

  const cardOffsets = useMemo(() => {
    return {
      horizontal: ((aspectWidth(60) / 4) - aspectWidth(DUELIST_CARD_WIDTH)) / 2,
      vertical: ((aspectHeight(70) / 2) - aspectWidth(DUELIST_CARD_HEIGHT)) / 2
    }
  }, [aspectWidth, aspectHeight])

  const setDuelistData = (duelist: any, index: number) => {
    const horizontalOffset = duelist.horizontalOffset != 0 ? duelist.horizontalOffset : Math.random() * 2 - 1
    const verticalOffset = duelist.verticalOffset != 0 ? duelist.verticalOffset : Math.random() * 2 - 1
  
    const centerX = aspectWidth(100) / 2 - aspectWidth(DUELIST_CARD_WIDTH) / 2
    const centerY = aspectHeight(100) / 2 - aspectWidth(DUELIST_CARD_HEIGHT) / 2

    const gridX = aspectWidth(20) + ((index <= 3) ? (index % 4) * (aspectWidth(60) / 4) : ((index % 4) * (aspectWidth(60) / 4)) + (aspectWidth(60) / 8)) + (aspectWidth(60) / 8)
    const gridY = aspectHeight(20) + (Math.floor(index / 4) * (aspectHeight(70) / 2))
    
    const currentX = gridX + cardOffsets.horizontal * horizontalOffset
    const currentY = gridY + cardOffsets.vertical * verticalOffset
    
    const moveX = centerX - currentX 
    const moveY = centerY - currentY + aspectHeight(50) + aspectWidth(DUELIST_CARD_HEIGHT / 2)

    const exitPositionX = centerX - currentX - aspectWidth(60) - aspectWidth(DUELIST_CARD_WIDTH / 2)
    const exitPositionY = centerY - currentY

    const angle = Math.atan2(moveY, moveX) * (180 / Math.PI)
    const rotation = duelist.rotation != 0 ? duelist.rotation : angle - 90

    duelist.horizontalOffset = horizontalOffset
    duelist.verticalOffset = verticalOffset
    duelist.rotation = rotation
    duelist.startPositionX = moveX
    duelist.startPositionY = moveY
    duelist.exitPositionX = exitPositionX
    duelist.exitPositionY = exitPositionY
  }

  const paginatedDuelists = useMemo(() => (
    queryDuelists.slice(
      pageNumber * duelistsPerPage,
      (pageNumber + 1) * duelistsPerPage
    ).map((duelist, index) => {
      const newDuelist = {
        duelist_id: duelist.duelist_id,
        horizontalOffset: 0,
        verticalOffset: 0,
        rotation: 0,
        startPositionX: 0,
        startPositionY: 0,
        exitPositionX: 0,
        exitPositionY: 0
      }
      setDuelistData(newDuelist, index)
      return newDuelist
    })
  ), [duelistsChanged])

  useEffect(() => {
    paginatedDuelists.forEach((duelist, index) => {
      setDuelistData(duelist, index)
    })
  }, [aspectWidth, aspectHeight])

  const ANIMATION_DURATION = 1000
  const ANIMATION_DURATION_HAND = 1750
  const DELAY = 75
  const STATIC_DELAY = 575
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

    paginatedDuelists.forEach((duelist, index) => {
      const cardDuelistId = Number(duelist.duelist_id)
      if (cardRefs.current[cardDuelistId]) {
        setTimeout(() => {
          cardRefs.current[cardDuelistId].toggleVisibility(true)
          cardRefs.current[cardDuelistId].setPosition(0, 0, ANIMATION_DURATION, TWEEN.Easing.Quartic.Out)
          cardRefs.current[cardDuelistId].setCardRotation(duelist.rotation, ANIMATION_DURATION, TWEEN.Easing.Quartic.Out)
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

      
      paginatedDuelists.forEach((duelist, index) => {
        const cardDuelistId = Number(duelist.duelist_id)
        if (cardRefs.current[cardDuelistId]) {
          setTimeout(() => {
            cardRefs.current[cardDuelistId].setPosition(duelist.exitPositionX, duelist.exitPositionY, ANIMATION_DURATION, TWEEN.Easing.Sinusoidal.Out)
            cardRefs.current[cardDuelistId].setCardRotation(0, ANIMATION_DURATION, TWEEN.Easing.Sinusoidal.Out)
          }, STATIC_DELAY + (index === 3 || index === 6 ? DELAY : 
            index === 2 ? DELAY * 2 :
            index === 5 ? DELAY * 2 :
            index === 1 ? DELAY * 3 :
            index === 0 || index === 4 ? DELAY * 4 : DELAY))
        }
      })

      setTimeout(() => {
        setDuelistsChanged(!duelistsChanged)
      }, EXIT_COMPLETE_DELAY)
    }
  }

  useEffect(() => {
    if (initialLoadRef.current) {
      return
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      setIsAnimating(true)
      setPageNumber(0)
      playExitCardsAnimation()
    }, 400)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [queryDuelists])

  useEffect(() => {
    paginatedDuelists.forEach((duelist, index) => {
      const cardDuelistId = Number(duelist.duelist_id)
      if (cardRefs.current[cardDuelistId]) {
        cardRefs.current[cardDuelistId].toggleVisibility(false)
        cardRefs.current[cardDuelistId].setPosition(duelist.startPositionX, duelist.startPositionY, 0)
        cardRefs.current[cardDuelistId].setCardRotation(0, 0)
      }
    })

    if (isAnimating || initialLoadRef.current) {
      setTimeout(() => {
        initialLoadRef.current = false
      }, 450)
      playEnterCardsAnimation()
    }
  }, [paginatedDuelists])

  const handlePageChange = (newPage: number) => {
    if (isAnimating) return
    setIsAnimating(true)
    setPageNumber(newPage)
    
    playExitCardsAnimation()
  }

  const _selectCallback = (duelistId: bigint) => {
    if (duelistId) {
      dispatchSelectDuelistId(duelistId)
    } else {
      anonOpener.open();
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
    <div>
      <div style={{
        display: 'grid',
        gridTemplateRows: 'repeat(2, 1fr)',
        gridTemplateColumns: 'repeat(4, 1fr)',
        width: aspectWidth(60),
        height: aspectHeight(70),
        position: 'absolute',
        bottom: aspectHeight(10),
        left: '50%',
        transform: 'translateX(-50%)'
      }}>
        {paginatedDuelists.map((duelist, index) => (
          <div key={`duelist-${duelist.duelist_id}`} style={{
            transform: index > 3 && 'translateX(50%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              width: aspectWidth(DUELIST_CARD_WIDTH),
              height: aspectWidth(DUELIST_CARD_HEIGHT),
              transform: `translate(${cardOffsets.horizontal * duelist.horizontalOffset}px, ${cardOffsets.vertical * duelist.verticalOffset}px)`,
            }}>
              <DuelistCard
                ref={(ref: DuelistCardHandle | null) => {
                  if (ref) cardRefs.current[Number(duelist.duelist_id)] = ref
                }}
                key={duelist.duelist_id}
                duelistId={Number(duelist.duelist_id)}
                isLeft={true}
                isHighlightable={true}
                isHanging={false}
                isFlipped={true}
                isVisible={true}
                instantFlip={true}
                width={DUELIST_CARD_WIDTH}
                height={DUELIST_CARD_HEIGHT}
                onClick={() => {
                  if (!isAnimating) {
                    _selectCallback(duelist.duelist_id)
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

      <DuelistModal />
      <ChallengeModal />
      <NewChallengeModal />
      <TavernAudios />

      <DojoSetupErrorDetector />
    </div>
  )
}
