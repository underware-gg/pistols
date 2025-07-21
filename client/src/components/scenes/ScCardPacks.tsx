import React, { useEffect, useState, useRef, useMemo, createRef } from 'react'
import { usePistolsScene } from '/src/hooks/PistolsContext'
import { useGameAspect } from '/src/hooks/useGameAspect'
import { useCalcFeePack, useCanClaimStarterPack } from '/src/hooks/usePistolsContractCalls'
import { useAccount } from '@starknet-react/core'
import { useDojoSystemCalls } from '@underware/pistols-sdk/dojo'
import { usePacksOfPlayer } from '/src/hooks/useTokenPacks'
import { constants } from '@underware/pistols-sdk/pistols/gen'
import { CardPackAnimationWrapper, CardPackAnimationWrapperHandle } from '/src/components/ui/CardPackAnimationWrapper'
import { ActionButton, BalanceRequiredButton } from '/src/components/ui/Buttons'
import { PackTypeListItem } from '/src/components/ui/PackTypeListItem'
import { SceneName } from '/src/data/assets'
import { Divider } from '/src/components/ui/Divider'
import * as TWEEN from '@tweenjs/tween.js'

// Card pack positioning constants
const PACK_BASE_X = 12
const PACK_BASE_X_SECOND_ROW = 26
const PACK_BASE_Y = 9
const PACK_X_OFFSET = 0.8
const PACK_Y_OFFSET = 4
const PACK_HOVER_LIFT = 3
const PACK_SIZE = 18
const PACK_HOVER_SCALE = 1.2
const PACK_BASE_Z_INDEX = 10

// Double the number of visible packs with two rows
const PACKS_PER_ROW = 10
const MAX_VISIBLE_PACKS = PACKS_PER_ROW * 2

const availablePackTypes = Object.keys(constants.PACK_TYPES).filter(key => constants.PACK_TYPES[key].can_purchase).map(key => constants.PACK_TYPES[key].id as constants.PackType)

export default function ScCardPacks() {
  const { dispatchSetScene } = usePistolsScene()
  const { aspectWidth } = useGameAspect()
  const { account, isConnected } = useAccount()
  const { pack_token } = useDojoSystemCalls()
  const { packIds } = usePacksOfPlayer()
  const { canClaimStarterPack } = useCanClaimStarterPack()
  
  const [visiblePacks, setVisiblePacks] = useState<number[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  
  const [selectedCardPack, setSelectedCardPack] = useState<number | null>(null)
  const [selectedPackType, setSelectedPackType] = useState(constants.PackType.GenesisDuelists5x)
  
  const { fee } = useCalcFeePack(selectedPackType)
  
  const packRefsMap = useMemo(() => {
    const refsMap = new Map<number, React.RefObject<CardPackAnimationWrapperHandle>>()
    
    visiblePacks.forEach(packId => {
      if (!refsMap.has(packId)) {
        refsMap.set(packId, createRef<CardPackAnimationWrapperHandle>())
      }
    })
    
    if (selectedCardPack !== null && !refsMap.has(selectedCardPack)) {
      refsMap.set(selectedCardPack, createRef<CardPackAnimationWrapperHandle>())
    }
    
    return refsMap
  }, [visiblePacks, selectedCardPack])
  
  const handlePurchasePack = () => {
    if (isConnected && account) {
      pack_token.purchase(account, selectedPackType)
    }
  }
  
  useEffect(() => {
    const calculatedTotalPages = Math.ceil((packIds.length + (canClaimStarterPack ? 1 : 0)) / MAX_VISIBLE_PACKS)
    setTotalPages(calculatedTotalPages)
    
    if (currentPage >= calculatedTotalPages) {
      setCurrentPage(Math.max(0, calculatedTotalPages - 1))
    }
  }, [packIds, canClaimStarterPack])
  
  const [allRenderedPacks, setAllRenderedPacks] = useState<number[]>([])
  
  useEffect(() => {
    const newStartIndex = currentPage * MAX_VISIBLE_PACKS - (canClaimStarterPack && currentPage !== 0 ? 1 : 0)
    const endIndex = Math.min(newStartIndex + (canClaimStarterPack && currentPage === 0 ? MAX_VISIBLE_PACKS - 1 : MAX_VISIBLE_PACKS), packIds.length)
    
    let visible = packIds.slice(newStartIndex, endIndex)
    if (canClaimStarterPack && currentPage === 0) {
      visible = [-1, ...visible]
    }
    
    if (visible.every(id => allRenderedPacks.includes(id)) && visible.length === allRenderedPacks.length) return
    setVisiblePacks(visible)
    
    const newRenderedPacks = [...visible]
    
    if (selectedCardPack !== null && !newRenderedPacks.includes(selectedCardPack)) {
      newRenderedPacks.push(selectedCardPack)
    }
    setAllRenderedPacks(newRenderedPacks)
  }, [packIds, currentPage, selectedCardPack, canClaimStarterPack])
  
  const navigateStack = (direction: 'up' | 'down') => {
    if (direction === 'up' && currentPage > 0) {
      setCurrentPage(prev => prev - 1)
    } else if (direction === 'down' && currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1)
    }
  }
  
  const packPositions = useMemo(() => {
    const positions = []
    for (let index = 0; index < MAX_VISIBLE_PACKS; index++) {
      const isSecondRow = index >= PACKS_PER_ROW
      
      if (isSecondRow) {
        const indexInRow = index - PACKS_PER_ROW
        positions.push({
          x: PACK_BASE_X_SECOND_ROW - (PACK_X_OFFSET * indexInRow),
          y: PACK_BASE_Y + (PACK_Y_OFFSET * indexInRow)
        })
      } else {
        positions.push({
          x: PACK_BASE_X - (PACK_X_OFFSET * index),
          y: PACK_BASE_Y + (PACK_Y_OFFSET * index)
        })
      }
    }
    return positions
  }, [])
  
  const getPackPosition = (index: number) => {
    return packPositions[index]
  }
  
  const handleHover = (packId: number, hovered: boolean) => {
    const packRef = packRefsMap.get(packId)?.current
    const packIndex = visiblePacks.indexOf(packId)
    
    if (packRef && packIndex !== -1 && !selectedCardPack) {
      const position = getPackPosition(packIndex)
      
      if (hovered) {
        packRef.setPosition(position.x, position.y - PACK_HOVER_LIFT, 500, TWEEN.Easing.Cubic.Out)
        packRef.setScale(PACK_HOVER_SCALE, 500, TWEEN.Easing.Cubic.Out)
      } else {
        packRef.setPosition(position.x, position.y, 500, TWEEN.Easing.Cubic.Out)
        packRef.setScale(1, 500, TWEEN.Easing.Cubic.Out)
      }
    }
  }
  
  const handlePackClick = (packId: number, fromPack?: boolean) => {
    if (selectedCardPack === null) {
      const packRef = packRefsMap.get(packId)?.current;
      if (packRef && !packRef.isFullscreen()) {
        packRef.toggleFullscreen(true, 500, TWEEN.Easing.Quadratic.Out);
        setSelectedCardPack(packId);
      }
    } 
    else if (selectedCardPack !== null) {
      if (!fromPack) {
        const packRef = packRefsMap.get(selectedCardPack)?.current;

        if (packRef) {
          if (!packRef.isInProcessOfClaiming()) {
            packRef.toggleFullscreen(false, 700, TWEEN.Easing.Quadratic.Out);
            setSelectedCardPack(null);
          }
        }
      }
    }
  }

  const handlePackComplete = (packId: number) => {
    const packRef = packRefsMap.get(packId)?.current
    if (packRef) {
      packRef.toggleFullscreen(false, 700, TWEEN.Easing.Quadratic.Out)
    }
    setTimeout(() => {
      setSelectedCardPack(null)
    }, packRef ? 700 : 0)
  }
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedCardPack !== null) {
        const packRef = packRefsMap.get(selectedCardPack)?.current
        
        if (packRef) {
          packRef.toggleFullscreen(false, 700, TWEEN.Easing.Quadratic.Out)
        }

        setSelectedCardPack(null)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedCardPack, visiblePacks, packRefsMap])
  
  const renderCardPack = (packId: number) => {
    const index = visiblePacks.indexOf(packId);
    const isVisible = index !== -1;
    const position = isVisible ? getPackPosition(index) : { x: 0, y: 0 };
    
    // Special handling for welcome pack
    if (packId === -1) {
      return (
        <CardPackAnimationWrapper
          key="welcome-pack"
          packType={constants.PackType.StarterPack}
          ref={packRefsMap.get(packId)}
          startPosition={position}
          startRotation={0}
          startScale={1}
          startZIndex={PACK_BASE_Z_INDEX + index}
          onHover={(hovered) => handleHover(packId, hovered)}
          onClick={(e, fromPack) => handlePackClick(packId, fromPack)}
          onComplete={() => handlePackComplete(packId)}
          packId={undefined}
          isOpen={true}
          cardPackSize={PACK_SIZE}
          maxTilt={20}
          atTutorialEnding={false}
          optionalTitle="Welcome Pack"
        />
      );
    }
    
    return (
      <CardPackAnimationWrapper
        key={packId}
        ref={packRefsMap.get(packId)}
        startPosition={position}
        startRotation={0}
        startScale={1}
        startZIndex={PACK_BASE_Z_INDEX + index}
        onHover={(hovered) => handleHover(packId, hovered)}
        onClick={(e, fromPack) => handlePackClick(packId, fromPack)}
        onComplete={() => handlePackComplete(packId)}
        packId={packId}
        isOpen={true}
        cardPackSize={PACK_SIZE}
        maxTilt={20}
        atTutorialEnding={false}
      />
    );
  }
  
  return (
    <div className="Absolute FillParent">
      <img className="boxFront NoMouse NoDrag" src="/images/scenes/profile/cardpacks/bg_cardpack_front_box.png" alt="Card Pack Box Front" />
      <div className="ScCardPacks">
        <div className="ScCardPackContainer Left">
          <div className="stackNavigation">
            <button 
              className="navArrow up" 
              disabled={currentPage <= 0}
              onClick={() => navigateStack('up')}
            >
              ↑
            </button>
            
            <div className="navPages">
              {totalPages > 0 ? (
                <span>{currentPage + 1} / {totalPages}</span>
              ) : (
                <span>-</span>
              )}
            </div>
            
            <button 
              className="navArrow down" 
              disabled={currentPage >= totalPages - 1}
              onClick={() => navigateStack('down')}
            >
              ↓
            </button>
          </div>
        </div>
        
        <div className="ScCardPackContainer Right">
          <h2 className="containerTitle">Available Card Packs</h2>
          <Divider />
          
          <div className="packTypeList">
            {availablePackTypes.map(packType => (
              <PackTypeListItem 
                key={packType}
                packType={packType}
                isSelected={selectedPackType === packType}
                onClick={() => setSelectedPackType(packType)}
              />
            ))}
          </div>
          
          <div className="buyPackButton">
            {isConnected ? (
              <BalanceRequiredButton
                fee={fee}
                label="Purchase Pack"
                onClick={handlePurchasePack}
                disabled={false}
              />
            ) : (
              <ActionButton 
                large 
                fill 
                disabled={true} 
                label="Connect Wallet to Buy" 
                onClick={() => {}} 
              />
            )}
          </div>
        </div>
      </div>
      <div className="navigationButton">
        <ActionButton 
          label="Your Duelists" 
          onClick={() => dispatchSetScene(SceneName.DuelistBook)}
          large
        />
      </div>
      {/* Render all packs in allRenderedPacks */}
      {allRenderedPacks.map(packId => renderCardPack(packId))}
    </div>
  )
}
