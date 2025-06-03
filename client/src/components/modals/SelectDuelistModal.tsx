import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react'
import TWEEN from '@tweenjs/tween.js'
import { Modal } from 'semantic-ui-react'
import { Button } from 'semantic-ui-react'
import { BigNumberish } from 'starknet'
import { usePistolsContext, usePistolsScene } from '/src/hooks/PistolsContext'
import { DuelistCard, DuelistCardHandle } from '/src/components/cards/DuelistCard'
import { useDuellingDuelists, usePlayerDuelistsOrganized } from '/src/stores/duelistStore'
import { NoDuelistsSlip, NoDuelistsSlipHandle } from '/src/components/NoDuelistsSlip'
import { useGameAspect } from '/src/hooks/useGameAspect'
import { isPositiveBigint } from '@underware/pistols-sdk/utils'
import { CARD_ASPECT_RATIO } from '/src/data/cardConstants'
import { SceneName } from '/src/data/assets'
import { emitter } from '/src/three/game'
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
  const { dispatchChallengingPlayerAddress, dispatchChallengingDuelistId } = usePistolsContext()
  const { dispatchSetScene } = usePistolsScene()
  
  // const { duelistIds } = useDuelistsOfPlayer()
  const { activeDuelists: duelistIds } = usePlayerDuelistsOrganized()

  const { notDuelingIds: availableDuelists } = useDuellingDuelists(duelistIds);

  const bottomCardRef = useRef<HTMLImageElement>(null)
  const topCardRef = useRef<HTMLImageElement>(null)
  const modalContentRef = useRef<HTMLDivElement>(null)
  const duelistCardRefs = useRef<(DuelistCardHandle | null)[]>([])
  const noDuelistsCardRef = useRef<NoDuelistsSlipHandle | null>(null)

  const [selectedDuelistId, setSelectedDuelistId] = useState<BigNumberish>(0n)
  const [currentPage, setCurrentPage] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const isAnimatingRef = useRef(false)

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
      isAnimatingRef.current = true
      animate(1000, 0, 0.5, 1, TWEEN.Easing.Circular.Out, () => {
        setIsAnimating(false)
        isAnimatingRef.current = false
      })
    }
  }, [opener.isOpen, animate])

  useEffect(() => {
    if (isPositiveBigint(selectedDuelistId)) {
      _close()
    }
  }, [selectedDuelistId])

  useEffect(() => {
    if (availableDuelists.length !== 0) {
      emitter.emit('hover_description', '')
    }
  }, [availableDuelists, selectedDuelistId])

  const _close = useCallback(() => {
    setIsAnimating(true)
    isAnimatingRef.current = true
    animate(0, 1000, 1, 0.5, TWEEN.Easing.Cubic.In, () => {
      if (isPositiveBigint(selectedDuelistId)) {
        dispatchChallengingDuelistId(selectedDuelistId)
      }
      setSelectedDuelistId(0n)
      opener?.close()
      setIsAnimating(false)
      isAnimatingRef.current = false
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

  const handleNoDuelistsClick = useCallback(() => {    
    dispatchSetScene(SceneName.Profile)
    opener?.close()
    emitter.emit('hover_description', '')
  }, [dispatchSetScene, opener])

  const hoverTimeout = useRef<NodeJS.Timeout>()

  const handleCardHover = useCallback((isHovered: boolean, index: number) => {
    if (isAnimatingRef.current) {
      clearTimeout(hoverTimeout.current)
      if (isHovered) {
        hoverTimeout.current = setTimeout(() => {
          handleCardHover(isHovered, index)
        }, 100)
      }
      return
    }
    
    const card = duelistCardRefs.current[index]
    if (card) {
      const { angle, xOffset, yOffset } = getCardPositioning(index, currentDuelists.length)
      
      // Calculate hover offsets based on card angle
      const angleRad = angle * Math.PI / 180
      const hoverDistance = 30
      const hoverXOffset = Math.sin(angleRad) * hoverDistance
      const hoverYOffset = -Math.abs(Math.cos(angleRad)) * hoverDistance - 20
      
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
  }, [getCardPositioning, updateAllCardPositions, currentDuelists, isAnimating])

  const handleNoDuelistsHover = useCallback((isHovered: boolean) => {
    if (isAnimatingRef.current || !noDuelistsCardRef.current) {
      clearTimeout(hoverTimeout.current)
      if (isHovered) {
        hoverTimeout.current = setTimeout(() => {
          handleNoDuelistsHover(isHovered)
        }, 100)
      }
      return
    }
    const { angle, xOffset, yOffset } = getCardPositioning(0, 1)
    
    // Calculate hover offsets based on card angle
    const angleRad = angle * Math.PI / 180
    const hoverDistance = 30
    const hoverXOffset = Math.sin(angleRad) * hoverDistance
    const hoverYOffset = -Math.abs(Math.cos(angleRad)) * hoverDistance - 20
    
    noDuelistsCardRef.current.setScale(isHovered ? 1 : 1, 400, TWEEN.Easing.Quadratic.Out)
    noDuelistsCardRef.current.toggleHighlight(isHovered)
    noDuelistsCardRef.current.setZIndex(isHovered ? 10 : 0)
    noDuelistsCardRef.current.setPosition(
      xOffset + (isHovered ? hoverXOffset : 0),
      yOffset + (isHovered ? hoverYOffset : 0),
      400,
      TWEEN.Easing.Quadratic.Out
    )
    
    if (isHovered) {
      emitter.emit('hover_description', 'Go to profile screen')
    } else {
      emitter.emit('hover_description', '')
    }
  }, [getCardPositioning, isAnimating])

  // Memoize the duelist cards to prevent unnecessary re-renders
  const duelistCardsMemo = useMemo(() => {
    if (availableDuelists.length === 0) return null
    
    return currentDuelists.map((duelist, index) => {
      const { angle, xOffset, yOffset } = getCardPositioning(index, currentDuelists.length)
      
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
          isHighlightable={false}
          isAnimating={isAnimating}
          width={20 * CARD_ASPECT_RATIO}
          height={20}
          startRotation={angle}
          startPosition={{ x: xOffset, y: yOffset }}
          onClick={() => {
            setSelectedDuelistId(duelist)
          }}
          onHover={(isHovered) => handleCardHover(isHovered, index)}
        />
      )
    })
  }, [
    currentDuelists, 
    getCardPositioning, 
    isAnimating, 
    handleCardHover, 
    availableDuelists.length
  ])

  // Memoize the no duelists slip to prevent unnecessary re-renders
  const noDuelistsSlipMemo = useMemo(() => {
    if (availableDuelists.length > 0) return null
    
    const { angle, xOffset, yOffset } = getCardPositioning(0, 1)
    
    return (
      <NoDuelistsSlip
        key={0}
        ref={noDuelistsCardRef}
        isLeft={true}
        isVisible={true}
        isHighlightable={false}
        instantVisible={true}
        width={25 * CARD_ASPECT_RATIO}
        height={25}
        startRotation={angle}
        startPosition={{ x: xOffset, y: yOffset }}
        onClick={handleNoDuelistsClick}
        onHover={handleNoDuelistsHover}
      />
    )
  }, [
    availableDuelists.length, 
    getCardPositioning, 
    handleNoDuelistsClick, 
    handleNoDuelistsHover
  ])

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
          
          {duelistCardsMemo}
          {noDuelistsSlipMemo}

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
              disabled={isAnimating}
            />
          )}
          
          {currentPage < totalPages - 1 && (
            <Button 
              className='YesMouse NoDrag'
              icon='chevron right'
              style={{position: 'absolute', right: aspectWidth(25), top: '50%'}}
              onClick={handleNextPage}
              disabled={isAnimating}
            />
          )}
        </div>
      </div>
    </Modal>
  )
}
