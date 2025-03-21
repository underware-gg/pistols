import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react'
import { Modal } from 'semantic-ui-react'
import { usePistolsContext } from '/src/hooks/PistolsContext'
import { DuelistCard, DuelistCardHandle } from '/src/components/cards/DuelistCard'
import { CARD_ASPECT_RATIO, CARD_FLIP_ROTATION } from '/src/data/cardConstants'
import TWEEN from '@tweenjs/tween.js'
import { useGameAspect } from '/src/hooks/useGameAspect'
import { BigNumberish } from 'starknet'
import { Button } from 'semantic-ui-react'
import { useDuelist, useDuellingDuelists } from '/src/stores/duelistStore'
import { isPositiveBigint } from '@underware/pistols-sdk/utils'
import { useFameBalanceDuelist } from '/src/hooks/useFame'
import { useDuelistsOfPlayer } from '/src/hooks/useTokenDuelists'
import { Opener } from '/src/hooks/useOpener'

const HAND_CARD_WIDTH = 110
const HAND_CARD_HEIGHT = HAND_CARD_WIDTH * (1080/1920)
const CARDS_PER_PAGE = 5
const MAX_FAN_ANGLE = 80
const CARD_SPACING = 10
const SPREAD_ANGLE_INCREASE = 15 // Additional angle when spreading
const SPREAD_SPACING_INCREASE = 15 // Additional spacing when spreading

export default function SelectDuelistModal({
  opener,
}: {
  opener: Opener
}) {
  return <>{opener.isOpen && <_SelectDuelistModal opener={opener} />}</>
}

function _SelectDuelistModal({
  opener,
}: {
  opener: Opener
}) {
  const { aspectWidth } = useGameAspect()
  const { dispatchChallengingPlayerAddress, challengingDuelistId, dispatchChallengingDuelistId } = usePistolsContext()
  
  const { duelistIds } = useDuelistsOfPlayer()

  const { notDuelingIds: availableDuelists } = useDuellingDuelists(duelistIds);

  const bottomCardRef = useRef<HTMLImageElement>(null)
  const topCardRef = useRef<HTMLImageElement>(null)
  const modalContentRef = useRef<HTMLDivElement>(null)
  const duelistCardRefs = useRef<(DuelistCardHandle | null)[]>([])

  const [selectedDuelistId, setSelectedDuelistId] = useState<BigNumberish>(0n)
  const [currentPage, setCurrentPage] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const { totalPages, currentDuelists } = useMemo(() => ({
    totalPages: Math.ceil(availableDuelists.length / CARDS_PER_PAGE),
    currentDuelists: availableDuelists.slice(
      currentPage * CARDS_PER_PAGE,
      (currentPage + 1) * CARDS_PER_PAGE
    )
  }), [availableDuelists, currentPage])

  useEffect(() => {
    if (opener?.isOpen) {
      setCurrentPage(0)
      setSelectedDuelistId(0n)
    }
  }, [opener?.isOpen])

  const getCardPositioning = useCallback((index: number, totalCards: number, hoveredIndex: number = -1) => {
    if (totalCards === 1) {
      return { angle: 0, xOffset: 0, yOffset: 0 }
    }

    // Calculate relative position from center
    const centerOffset = (totalCards - 1) / 2
    const relativeIndex = index - centerOffset

    // Scale fan angle based on number of cards
    let fanAngle = (totalCards / CARDS_PER_PAGE) * MAX_FAN_ANGLE
    let angle = relativeIndex * (fanAngle / (totalCards - 1))
    
    // Scale spacing based on number of cards
    const spacingMultiplier = totalCards / CARDS_PER_PAGE
    let xOffset = relativeIndex * (CARD_SPACING * spacingMultiplier)
    let yOffset = Math.abs(relativeIndex) * 10

    // Adjust fan when a card is hovered
    if (hoveredIndex !== -1 && index !== hoveredIndex) {
      const isLeft = index < hoveredIndex
      const isRight = index > hoveredIndex
      
      if (isLeft) {
        // Increase angle and spacing for left side cards
        angle -= SPREAD_ANGLE_INCREASE
        xOffset -= SPREAD_SPACING_INCREASE
        yOffset += 5
      } else if (isRight) {
        // Increase angle and spacing for right side cards
        angle += SPREAD_ANGLE_INCREASE
        xOffset += SPREAD_SPACING_INCREASE
        yOffset += 5
      }
    }

    return { angle, xOffset, yOffset }
  }, [])

  const animate = useCallback((start: number, end: number, startScale: number, endScale: number, easing: (k: number) => number, onComplete?: () => void) => {
    const position = { y: start, scale: startScale }
    new TWEEN.Tween(position)
      .to({ y: end, scale: endScale }, 500)
      .easing(easing)
      .onUpdate(() => {
        if (modalContentRef.current) {
          modalContentRef.current.style.transform = `translate(-50%, -50%) translateY(${position.y}px) scale(${position.scale})`
        }
      })
      .onComplete(() => onComplete?.())
      .start()

    const animate = () => {
      TWEEN.update()
      if (modalContentRef.current) {
        requestAnimationFrame(animate)
      }
    }
    animate()
  }, [])

  useEffect(() => {
    if (opener.isOpen) {
      setIsAnimating(true)
      animate(1000, 0, 0.5, 1, TWEEN.Easing.Circular.Out, () => {
        setIsAnimating(false)
      })
    }
  }, [opener.isOpen, animate])

  useEffect(() => {
    if (isPositiveBigint(selectedDuelistId)) {
      _close()
    }
  }, [selectedDuelistId])

  const _close = useCallback(() => {
    setIsAnimating(true)
    animate(0, 1000, 1, 0.5, TWEEN.Easing.Cubic.In, () => {
      if (isPositiveBigint(selectedDuelistId)) {
        dispatchChallengingDuelistId(selectedDuelistId)
      }
      setSelectedDuelistId(0n)
      opener?.close()
      setIsAnimating(false)
    })
  }, [selectedDuelistId, animate, dispatchChallengingPlayerAddress, dispatchChallengingDuelistId, opener])

  const handlePrevPage = useCallback(() => {
    if (currentPage > 0) setCurrentPage(prev => prev - 1)
  }, [currentPage])

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages - 1) setCurrentPage(prev => prev + 1)
  }, [currentPage, totalPages])

  const updateAllCardPositions = useCallback((hoveredIndex: number = -1) => {
    currentDuelists.forEach((_, index) => {
      if (index === hoveredIndex) return
      const card = duelistCardRefs.current[index]
      if (card) {
        const { angle, xOffset, yOffset } = getCardPositioning(index, currentDuelists.length, hoveredIndex)
        card.setPosition(xOffset, yOffset, 400, TWEEN.Easing.Quadratic.Out)
        card.setRotation(angle, 400, TWEEN.Easing.Quadratic.Out)
      }
    })
  }, [currentDuelists, getCardPositioning])

  return (
    <Modal
      basic
      size='fullscreen'
      onClose={() => _close()}
      open={opener.isOpen}
      className=''
    >
      <div className='DuelistModalContainer NoMouse NoDrag'>
        <div className="DuelistModal NoMouse NoDrag" ref={modalContentRef}>
          <img 
            ref={bottomCardRef}
            className='HandCard Multiple NoMouse NoDrag' 
            src='/images/ui/hand_card_multiple_bottom.png'
            style={{
              width: aspectWidth(HAND_CARD_WIDTH),
              height: aspectWidth(HAND_CARD_HEIGHT)
            }}
          />
          {currentDuelists.map((duelist, index) => {
            const { angle, xOffset, yOffset } = getCardPositioning(index, currentDuelists.length)
            
            // Calculate hover offsets based on card angle
            const angleRad = angle * Math.PI / 180
            const hoverDistance = 30
            const hoverXOffset = Math.sin(angleRad) * hoverDistance
            const hoverYOffset = -Math.abs(Math.cos(angleRad)) * hoverDistance - 20
            
            return (
              <DuelistCard
                key={duelist}
                ref={el => duelistCardRefs.current[index] = el}
                duelistId={Number(duelist)}
                isSmall={true}
                isLeft={true}
                isVisible={true}
                instantVisible={true}
                isFlipped={true}
                instantFlip={true}
                isHanging={false}
                isHighlightable={true}
                isAnimating={isAnimating}
                width={20 * CARD_ASPECT_RATIO}
                height={20}
                startRotation={angle}
                startPosition={{ x: xOffset, y: yOffset }}
                onClick={() => setSelectedDuelistId(duelist)}
                onHover={(isHovered) => {
                  const card = duelistCardRefs.current[index]
                  if (card) {
                    card.setScale(isHovered ? 1 : 1, 400, TWEEN.Easing.Quadratic.Out)
                    card.toggleHighlight(isHovered)
                    card.setZIndex(isHovered ? 10 : 0)
                    card.setPosition(
                      xOffset + (isHovered ? hoverXOffset : 0),
                      yOffset + (isHovered ? hoverYOffset : 0),
                      400,
                      TWEEN.Easing.Quadratic.Out
                    )
                    // Update positions of other cards
                    updateAllCardPositions(isHovered ? index : -1)
                  }
                }}
              />
            )
          })}

          <img 
            ref={topCardRef}
            className='HandCard Multiple NoMouse NoDrag' 
            src='/images/ui/hand_card_multiple_top.png'
            style={{
              width: aspectWidth(HAND_CARD_WIDTH),
              height: aspectWidth(HAND_CARD_HEIGHT),
              zIndex: 11
            }}
          />

          {currentPage > 0 && (
            <Button 
              className='YesMouse NoDrag'
              icon='chevron left'
              style={{position: 'absolute', left: aspectWidth(25), top: '50%'}}
              onClick={handlePrevPage}
            />
          )}
          
          {currentPage < totalPages - 1 && (
            <Button 
              className='YesMouse NoDrag'
              icon='chevron right'
              style={{position: 'absolute', right: aspectWidth(25), top: '50%'}}
              onClick={handleNextPage}
            />
          )}
        </div>
      </div>
    </Modal>
  )
}
