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
import TableModal from '@/pistols/components/modals/TableModal'
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
  const { value: newScene, timestamp } = useGameEvent('change_scene', null)

  useEffect(() => {
    if (newScene) {
      dispatchSetScene(newScene)
    }
  }, [newScene, timestamp])

  const [pageNumber, setPageNumber] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const duelistsPerPage = 7
  const pageCount = useMemo(() => Math.ceil(queryDuelists.length / duelistsPerPage), [queryDuelists])
  const cardRefs = useRef<{[key: number]: DuelistCardHandle}>({})

  const cardOffsets = useMemo(() => {
    return {
      horizontal: ((aspectWidth(60) / 4) - aspectWidth(DUELIST_CARD_WIDTH)) / 2,
      vertical: ((aspectHeight(70) / 2) - aspectWidth(DUELIST_CARD_HEIGHT)) / 2
    }
  }, [aspectWidth, aspectHeight])

  const paginatedDuelists = useMemo(() => (
    queryDuelists.slice(
      pageNumber * duelistsPerPage,
      (pageNumber + 1) * duelistsPerPage
    ).map((duelist, index) => {
        const horizontalOffset = Math.random() * 2 - 1
        const verticalOffset = Math.random() * 2 - 1
      
        const centerX = window.innerWidth / 2 - aspectWidth(DUELIST_CARD_WIDTH) / 2
        const centerY = window.innerHeight / 2 - aspectWidth(DUELIST_CARD_HEIGHT) / 2

        const gridX = aspectWidth(20) + ((index <= 3) ? (index % 4) * (aspectWidth(60) / 4) : ((index % 4) * (aspectWidth(60) / 4)) + (aspectWidth(60) / 8)) + (aspectWidth(60) / 8)
        const gridY = aspectHeight(20) + (Math.floor(index / 4) * (aspectHeight(70) / 2))
        
        const currentX = gridX + cardOffsets.horizontal * horizontalOffset
        const currentY = gridY + cardOffsets.vertical * verticalOffset
        
        const moveX = centerX - currentX 
        const moveY = centerY - currentY + aspectHeight(50) + aspectWidth(DUELIST_CARD_HEIGHT / 2)

        const exitPositionX = centerX - currentX - aspectWidth(60) - aspectWidth(DUELIST_CARD_WIDTH / 2)
        const exitPositionY = centerY - currentY

        const angle = Math.atan2(moveY, moveX) * (180 / Math.PI)
        const rotation = angle - 90

      return {
        duelist_id: duelist.duelist_id,
        horizontalOffset: horizontalOffset,
        verticalOffset: verticalOffset,
        rotation: rotation,
        startPositionX: moveX,
        startPositionY: moveY,
        exitPositionX: exitPositionX,
        exitPositionY: exitPositionY
      }
    })
  ), [queryDuelists, pageNumber])

  const playEnterCardsAnimation = () => {
    paginatedDuelists.forEach((duelist, index) => {
      const cardDuelistId = Number(duelist.duelist_id)
      if (cardRefs.current[cardDuelistId]) {
        
        setTimeout(() => {
          cardRefs.current[cardDuelistId].toggleVisibility(true)
          cardRefs.current[cardDuelistId].setPosition(0, 0, 1200, TWEEN.Easing.Quartic.Out)
          cardRefs.current[cardDuelistId].setCardRotation(duelist.rotation, 1200, TWEEN.Easing.Quartic.Out)
        }, 100)
      }
    })

    setIsAnimating(false)
  }

  const playExitCardsAnimation = (pageNumber: number) => {    
    paginatedDuelists.forEach((duelist, index) => {
      const cardDuelistId = Number(duelist.duelist_id)
      if (cardRefs.current[cardDuelistId]) {
        setTimeout(() => {
          cardRefs.current[cardDuelistId].setPosition(duelist.exitPositionX, duelist.exitPositionY, 1200, TWEEN.Easing.Sinusoidal.Out)
          cardRefs.current[cardDuelistId].setCardRotation(0, 1200, TWEEN.Easing.Sinusoidal.Out)
        }, index === 3 || index === 6 ? 100 : 
           index === 2 ? 200 :
           index === 5 ? 300 :
           index === 1 ? 400 :
           index === 0 || index === 4 ? 500 : 100)
      }
    })

    setTimeout(() => {
      setPageNumber(pageNumber)
    }, 1700)
  }

  useEffect(() => {
    playEnterCardsAnimation()
  }, [])

  useEffect(() => {
    paginatedDuelists.forEach((duelist, index) => {
      const cardDuelistId = Number(duelist.duelist_id)
      if (cardRefs.current[cardDuelistId]) {
        cardRefs.current[cardDuelistId].toggleVisibility(false)
        cardRefs.current[cardDuelistId].setPosition(duelist.startPositionX, duelist.startPositionY, 0)
        cardRefs.current[cardDuelistId].setCardRotation(0, 0)
      }
    })

    if (isAnimating) {
      playEnterCardsAnimation()
    }
  }, [paginatedDuelists])

  const handlePageChange = (newPage: number) => {
    if (isAnimating) return
    setIsAnimating(true)
    
    playExitCardsAnimation(newPage)
  }

  const _selectCallback = (duelistId: bigint) => {
    if (duelistId) {
      dispatchSelectDuelistId(duelistId)
    } else {
      anonOpener.open();
    }
  }

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
          <div style={{
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
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '20px', 
        position: 'absolute',
        bottom: aspectHeight(5),
        left: '50%',
        transform: 'translateX(-50%)',
        width: '50%' 
      }}>
        <ActionButton
          fill
          disabled={pageNumber === 0 || isAnimating}
          onClick={() => handlePageChange(pageNumber - 1)}
          label='Previous Page'
        />
        <ActionButton
          fill
          disabled={pageNumber >= pageCount - 1 || isAnimating}
          onClick={() => handlePageChange(pageNumber + 1)}
          label='Next Page'
        />
      </div>

      <DuelistModal />
    </div>
  )
}
