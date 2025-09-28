import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react'
import TWEEN from '@tweenjs/tween.js'
import { Modal } from 'semantic-ui-react'
import { Button } from 'semantic-ui-react'
import { BigNumberish } from 'starknet'
import { usePistolsContext, usePistolsScene } from '/src/hooks/PistolsContext'
import { DuelistCard, DuelistCardHandle } from '/src/components/cards/DuelistCard'
import { useDuellingDuelists, usePlayerDuelistsOrganized, useDuelist } from '/src/stores/duelistStore'
import { useCurrentSeason } from '/src/stores/seasonStore'
import { NoDuelistsSlip, NoDuelistsSlipHandle } from '/src/components/NoDuelistsSlip'
import { useGameAspect } from '/src/hooks/useGameAspect'
import { isPositiveBigint } from '@underware/pistols-sdk/utils'
import { CARD_ASPECT_RATIO } from '/src/data/cardConstants'
import { SceneName } from '/src/data/assets'
import { emitter } from '/src/three/game'
import { Opener } from '/src/hooks/useOpener'
import { useDuelistsInMatchMaking, useMatchQueue } from '/src/stores/matchStore'
import { FoolsBalance } from '/src/components/account/LordsBalance'
import { Balance } from '/src/components/account/Balance'
import { ActionButton, BalanceRequiredButton } from '/src/components/ui/Buttons'
import { constants } from '@underware/pistols-sdk/pistols/gen'
import { COLORS } from '@underware/pistols-sdk/pistols/constants'
import { useAccount } from '@starknet-react/core'

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
  const { challengingAddress } = usePistolsContext()
  const isOpen = useMemo(() => (challengingAddress > 0n), [challengingAddress])

  useEffect(() => {
    if (!isOpen) {
      opener.close()
    }
  }, [isOpen])
  return <>{opener.isOpen && <_SelectDuelistModal opener={opener} />}</>
}

function _SelectDuelistModal({
  opener,
}: {
  opener: Opener
}) {
  const { aspectWidth } = useGameAspect()
  const { dispatchChallengingPlayerAddress, dispatchChallengingDuelistId, challengingAddress, challengingDuelistId } = usePistolsContext()
  const { dispatchSetScene } = usePistolsScene()
  const { address } = useAccount()
  
  // const { duelistIds } = useDuelistsOwnedByPlayer()
  const { activeDuelists: duelistIds } = usePlayerDuelistsOrganized()

  const { notDuelingIds } = useDuellingDuelists(duelistIds);
  
  const { entryTokenAmount, requiresEnlistment } = opener.props?.matchmakingType ? useMatchQueue(opener.props?.matchmakingType) : { entryTokenAmount: 0n, requiresEnlistment: false }  
  const { rankedCanEnlistIds, canMatchMakeIds } = opener.props?.matchmakingType ? useDuelistsInMatchMaking(opener.props?.matchmakingType) : { rankedCanEnlistIds: [], canMatchMakeIds: [] }

  const [isEnlistMode, setIsEnlistMode] = useState(opener.props?.enlistMode ?? false)

  const availableDuelists = useMemo(() => {
    if (isEnlistMode) {
      return rankedCanEnlistIds.filter((id) => notDuelingIds?.map((id) => BigInt(id)).includes(BigInt(id)));
    } else if (opener.props?.unavailableDuelistIds) {
      return canMatchMakeIds.filter((id) => !opener.props?.unavailableDuelistIds.has(BigInt(id)) && notDuelingIds?.map(id => BigInt(id)).includes(BigInt(id)));
    }

    return duelistIds;
  }, [
    isEnlistMode,
    rankedCanEnlistIds,
    notDuelingIds,
    opener.props?.unavailableDuelistIds,
    canMatchMakeIds,
    duelistIds,
  ]);

  const bottomCardRef = useRef<HTMLImageElement>(null)
  const topCardRef = useRef<HTMLImageElement>(null)
  const modalContentRef = useRef<HTMLDivElement>(null)
  const duelistCardRefs = useRef<(DuelistCardHandle | null)[]>([])
  const noDuelistsCardRef = useRef<NoDuelistsSlipHandle | null>(null)

  const [pendingSelectedDuelistId, setPendingSelectedDuelistId] = useState<BigNumberish>(0n)
  const [selectedDuelistId, setSelectedDuelistId] = useState<BigNumberish>(0n)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [showEnlistHeader, setShowEnlistHeader] = useState(false)
  
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
      // Show header for ranked mode (both select and enlist modes)
      if (opener.props?.matchmakingType === constants.QueueId.Ranked) {
        setShowEnlistHeader(true);
      }
      isAnimatingRef.current = true
      animate(1000, 0, 0.5, 1, TWEEN.Easing.Circular.Out, () => {
        setIsAnimating(false)
        isAnimatingRef.current = false
      })
    } else {
      setShowEnlistHeader(false)
    }
  }, [opener.isOpen, animate, opener.props?.matchmakingType])

  useEffect(() => {
    if (isPositiveBigint(selectedDuelistId)) {
      _close()
    }
  }, [selectedDuelistId])

  // Reset page when switching between modes
  useEffect(() => {
    setCurrentPage(0)
    setPendingSelectedDuelistId(0n)
  }, [isEnlistMode])

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
        if (opener.props?.onDuelistSelected) {
          opener.props?.onDuelistSelected(selectedDuelistId, pendingSelectedDuelistId === selectedDuelistId)
        } else {
          dispatchChallengingDuelistId(selectedDuelistId)
        }
      } else {
        if (challengingDuelistId == 0n && challengingAddress > 0n) {
          dispatchChallengingPlayerAddress(0n)
        }
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
    console.log('handleNoDuelistsClick', isEnlistMode, canMatchMakeIds.length, rankedCanEnlistIds.length)
    if (!isEnlistMode && canMatchMakeIds.length === 0 && rankedCanEnlistIds.length > 0) {
      setIsEnlistMode(true)
      return
    }
    
    // All other cases lead to card packs as before
    dispatchSetScene(SceneName.CardPacks)
    opener?.close()
    emitter.emit('hover_description', '')
  }, [dispatchSetScene, opener, isEnlistMode, canMatchMakeIds.length, rankedCanEnlistIds.length])

  // Handle duelist click - either enlist or select based on mode
  const handleDuelistClick = useCallback((duelistId: BigNumberish) => {
    if (isEnlistMode) {
      setPendingSelectedDuelistId(duelistId)
      setShowConfirmation(true)
    } else {
      setSelectedDuelistId(duelistId)
    }
  }, [isEnlistMode])

  // Handle confirmation dialog actions
  const handleConfirmEnlist = useCallback(() => {
    if (pendingSelectedDuelistId) {
      setSelectedDuelistId(pendingSelectedDuelistId)
    }
  }, [pendingSelectedDuelistId, opener])

  const handleCancelEnlist = useCallback(() => {
    setPendingSelectedDuelistId(0n)
    setShowConfirmation(false)
  }, [])

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
      const hoverDistance = aspectWidth(5)
      const hoverXOffset = Math.sin(angleRad) * hoverDistance
      const hoverYOffset = -Math.abs(Math.cos(angleRad)) * hoverDistance - aspectWidth(1)
      
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
    const hoverDistance = aspectWidth(2.4)
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
      // Show appropriate message based on the action that will be taken
      if (!isEnlistMode && canMatchMakeIds.length === 0 && rankedCanEnlistIds.length > 0) {
        emitter.emit('hover_description', 'Click to switch to enlist mode and enlist your duelists')
      } else {
        emitter.emit('hover_description', 'Click to go to your card packs to recruit more of your own duelists')
      }
    } else {
      emitter.emit('hover_description', '')
    }
  }, [getCardPositioning, isAnimating, isEnlistMode, canMatchMakeIds.length, rankedCanEnlistIds.length])

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
            handleDuelistClick(duelist)
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
      <CustomEmptyStateSlip
        key={0}
        ref={noDuelistsCardRef}
        isLeft={true}
        isVisible={true}
        isHighlightable={true}
        instantVisible={true}
        width={25 * CARD_ASPECT_RATIO}
        height={25}
        startRotation={angle}
        startPosition={{ x: xOffset, y: yOffset }}
        onClick={handleNoDuelistsClick}
        onHover={handleNoDuelistsHover}
        isEnlistMode={isEnlistMode}
        rankedCanEnlistIds={rankedCanEnlistIds}
        canMatchMakeIds={canMatchMakeIds.filter((id) => notDuelingIds.includes(id))}
        matchmakingType={opener.props?.matchmakingType}
      />
    )
  }, [
    availableDuelists.length, 
    getCardPositioning, 
    handleNoDuelistsClick, 
    handleNoDuelistsHover,
    isEnlistMode,
    rankedCanEnlistIds,
    canMatchMakeIds,
    opener.props?.matchmakingType,
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
          <EnlistmentHeader 
            opener={opener} 
            address={address} 
            showEnlistHeader={showEnlistHeader} 
            requiresEnlistment={requiresEnlistment} 
            entryTokenAmount={entryTokenAmount} 
            isEnlistMode={isEnlistMode}
            rankedCanEnlistIds={rankedCanEnlistIds}
          />
          <EnlistmentConfirmationDialog 
            showConfirmation={showConfirmation} 
            handleCancelEnlist={handleCancelEnlist} 
            handleConfirmEnlist={handleConfirmEnlist} 
            requiresEnlistment={requiresEnlistment} 
            entryTokenAmount={entryTokenAmount}
            pendingSelectedDuelistId={pendingSelectedDuelistId}
          />
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

          {/* Big center-bottom toggle button for ranked mode */}
          {opener.props?.matchmakingType === constants.QueueId.Ranked && (
            <div
            className='YesMouse NoDrag'
              style={{
                position: 'absolute',
                bottom: aspectWidth(8),
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1000,
              }}
            >
              <ActionButton
                label={isEnlistMode ? "SELECT DUELIST" : "ENLIST MORE DUELISTS"}
                onClick={() => setIsEnlistMode(!isEnlistMode)}
                important
                large
              />
            </div>
          )}

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

          <Button 
            className='YesMouse NoDrag'
            icon='chevron left'
            style={{position: 'absolute', left: aspectWidth(25), top: '50%', opacity: isAnimating || currentPage <= 0 ? 0.5 : 1}}
            onClick={handlePrevPage}
          />
          
          <Button 
            className='YesMouse NoDrag'
            icon='chevron right'
            style={{position: 'absolute', right: aspectWidth(25), top: '50%', opacity: isAnimating || currentPage >= totalPages - 1 ? 0.5 : 1}}
            onClick={handleNextPage}
          />
        </div>
      </div>
    </Modal>
  )
}


// Clean minimal enlistment panel - exactly as requested! Tentacles obey! 🐙
function EnlistmentHeader({ 
  opener, 
  address,
  showEnlistHeader, 
  requiresEnlistment, 
  entryTokenAmount, 
  isEnlistMode,
  rankedCanEnlistIds,
}: { 
  opener: Opener, 
  address: string,
  showEnlistHeader: boolean, 
  requiresEnlistment: boolean, 
  entryTokenAmount: bigint, 
  isEnlistMode: boolean,
  rankedCanEnlistIds: bigint[],
}) {
  const { aspectWidth, aspectHeight } = useGameAspect()

  return (
    opener.props?.matchmakingType === constants.QueueId.Ranked && (
      <div className='EnlistmentHeader' style={{
        position: 'absolute',
        top: aspectHeight(5),
        left: aspectWidth(3),
        zIndex: 1000,
        background: 'transparent',
        opacity: showEnlistHeader ? 1 : 0,
        transition: 'opacity 0.4s ease-in-out',
        width: aspectWidth(35)
      }}>
        <div className="Important" style={{ 
          fontSize: aspectWidth(2.5),
          marginBottom: aspectWidth(1.5),
          textAlign: 'left',
          color: '#ef9758' // $color-medium
        }}>
          {isEnlistMode ? 'DUELIST ENLISTING' : 'DUELIST SELECTION'}
        </div>
        
        <div style={{ 
          fontSize: aspectWidth(1.3),
          textAlign: 'left',
          color: '#c8b6a8', // $color-bright
          display: 'flex',
          alignItems: 'center',
          gap: aspectWidth(3),
          marginBottom: aspectWidth(1),
        }}>
          <div>
            Your Total: <FoolsBalance address={address} size='big' />
          </div>
          {isEnlistMode && (
            <div>
              Cost Per Duelist: {requiresEnlistment ? <Balance fools size='large' wei={entryTokenAmount} /> : <span style={{color: '#77d64d', fontWeight: 'bold'}}>FREE</span>}
            </div>
          )}
        </div>

        {isEnlistMode && (
          <div style={{
            fontSize: aspectWidth(1.1),
            color: '#c8b6a8',
            textAlign: 'left',
          }}>
            Available to enlist: {rankedCanEnlistIds.length} duelists
          </div>
        )}
      </div>
    )
  )
}

function EnlistmentConfirmationDialog({ 
  showConfirmation, 
  handleCancelEnlist, 
  handleConfirmEnlist, 
  requiresEnlistment, 
  entryTokenAmount,
  pendingSelectedDuelistId
}: { 
  showConfirmation: boolean, 
  handleCancelEnlist: () => void, 
  handleConfirmEnlist: () => void, 
  requiresEnlistment: boolean, 
  entryTokenAmount: bigint,
  pendingSelectedDuelistId: BigNumberish
 }) {
  const { aspectWidth } = useGameAspect()
  const { seasonId } = useCurrentSeason()
  const { nameAndId } = useDuelist(pendingSelectedDuelistId)
  
  return (
    <Modal
      size="small"
      open={showConfirmation}
      onClose={handleCancelEnlist}
      className="ModalText"
    >
      <Modal.Header>
        <h2
          className="Important"
          style={{ textAlign: "center", margin: `${aspectWidth(0.3)}px 0` }}
        >
          Enlist Duelist In Ranked
        </h2>
      </Modal.Header>

      <Modal.Content style={{ padding: aspectWidth(2) }}>
        {/* Introduction */}
        <div
          style={{
            textAlign: "center",
            lineHeight: "1.4",
            fontSize: aspectWidth(1.2),
            marginBottom: aspectWidth(1.8),
            color: "#c8b6a8",
            fontWeight: "bold",
          }}
        >
          To participate in ranked play, each duelist must enlist.
        </div>

        {/* Details section */}
        <div
          style={{
            background: "rgba(0, 0, 0, 0.3)",
            border: "1px solid rgba(239, 151, 88, 0.3)",
            borderRadius: aspectWidth(0.5),
            padding: aspectWidth(1.5),
            marginBottom: aspectWidth(2),
          }}
        >
          <div
            style={{
              textAlign: "left",
              lineHeight: "1.5",
              fontSize: aspectWidth(1.1),
              marginBottom: aspectWidth(1),
              color: "#c8b6a8",
            }}
          >
            <strong style={{ color: "#ef9758" }}>Enlistment Fee:</strong> 🎩5
            per duelist, per season
          </div>

          <div
            style={{
              textAlign: "left",
              lineHeight: "1.5",
              fontSize: aspectWidth(1.1),
              marginBottom: aspectWidth(1),
              color: "#c8b6a8",
            }}
          >
            <strong style={{ color: "#ef9758" }}>Duration:</strong> Once
            enlisted, a duelist may participate in ranked duels until they meet
            their untimely demise or the season ends, whichever comes first.
          </div>

          <div
            style={{
              textAlign: "left",
              lineHeight: "1.5",
              fontSize: aspectWidth(1.1),
              color: "#c8b6a8",
            }}
          >
            <strong style={{ color: "#ef9758" }}>Benefits:</strong> Only
            enlisted duelists are eligible for the ranked season leaderboard and
            prizes.
          </div>
        </div>

        {/* Confirmation question */}
        <div
          style={{
            textAlign: "center",
            lineHeight: "1.4",
            fontSize: aspectWidth(1.4),
            marginBottom: aspectWidth(2),
            color: "#ef9758",
            fontWeight: "bold",
            padding: aspectWidth(1),
            background: "rgba(239, 151, 88, 0.1)",
            borderRadius: aspectWidth(0.5),
            border: "1px solid rgba(239, 151, 88, 0.2)",
          }}
        >
          <span style={{ color: "#c8b6a8" }}>Enlist</span> {nameAndId}{" "}
          <span style={{ color: "#c8b6a8" }}>for</span> Season {seasonId}?
          <br />
          <div
            style={{
              textAlign: "center",
              fontSize: aspectWidth(1.4),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: COLORS.ACTIVE,
              fontWeight: "bold",
            }}
          >
            <span style={{ color: "#c8b6a8" }}>Cost:</span>
            {requiresEnlistment ? (
              <Balance fools size="huge" wei={entryTokenAmount} />
            ) : (
              <span style={{ color: "#90EE90" }}>FREE</span>
            )}
          </div>
        </div>
      </Modal.Content>

      <Modal.Actions style={{ display: "flex" }}>
        <ActionButton
          large
          fill
          dimmed
          onClick={handleCancelEnlist}
          label="Cancel"
        />
        <BalanceRequiredButton
          fools
          large
          fee={entryTokenAmount}
          // disabled={!canSubmit}
          label="Enlist Duelist"
          onClick={handleConfirmEnlist}
        />
      </Modal.Actions>
    </Modal>
  );
}

const CustomEmptyStateSlip = React.forwardRef<NoDuelistsSlipHandle, {
  isEnlistMode: boolean
  rankedCanEnlistIds: bigint[]
  canMatchMakeIds: bigint[]
  matchmakingType?: constants.QueueId
} & Omit<React.ComponentProps<typeof NoDuelistsSlip>, 'childrenInFront'>>(({
  isEnlistMode,
  rankedCanEnlistIds,
  canMatchMakeIds,
  matchmakingType,
  ...props
}, ref) => {
  const { aspectWidth } = useGameAspect()
  
  const getEmptyStateMessage = () => {
    if (matchmakingType === constants.QueueId.Ranked) {
      if (isEnlistMode) {
        if (rankedCanEnlistIds.length === 0) {
          return {
            title: "No duelists to enlist",
            message: "All eligible duelists are already enlised in ranked.",
            subtext: "Try switching to selection mode to use enlisted duelists."
          }
        }
      } else {
        if (canMatchMakeIds.length === 0) {
          return {
            title: "No enlisted duelists",
            message: "Enlist duelists before entering ranked matches.",
            subtext: "Switch to enlist mode to enlist your duelists."
          }
        }
      }
    } else {
      // Unranked mode
      if (canMatchMakeIds.length === 0) {
        return {
          title: "No available duelists",
          message: "All your duelists are currently in duels or queues.",
          subtext: "Wait for them to finish or get more duelists."
        }
      }
    }
    
    // Default message
    return {
      title: "Note to self:",
      message: "Should probably get a new duelist... or two.",
      subtext: "...preferably one who can aim this time."
    }
  }

  const emptyState = getEmptyStateMessage()

  return (
    <NoDuelistsSlip
      ref={ref}
      {...props}
      title={emptyState.title}
      message={emptyState.message}
      subtext={emptyState.subtext}
    />
  )
})