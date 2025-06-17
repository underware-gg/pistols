import React, { useRef, useState, useEffect } from 'react'
import { Grid, Icon } from 'semantic-ui-react'
import { DuelistCard, DuelistCardHandle } from './DuelistCard'
import { CARD_ASPECT_RATIO } from '/src/data/cardConstants'
import { useGameAspect } from '/src/hooks/useGameAspect'
import { emitter } from '/src/three/game'
import TWEEN from '@tweenjs/tween.js'
import { COLORS } from '@underware/pistols-sdk/pistols/constants'

const CARDS_PER_ROW = 5
const CARDS_PER_PAGE = CARDS_PER_ROW * 2
const STACKED_CARD_SCALE = 0.6

interface SoulsStackGridProps {
  duelistId: number
  stackedDuelistIds: number[]
  level: number
  onClose: () => void
}

const SoulsStackGrid: React.FC<SoulsStackGridProps> = ({ 
  duelistId, 
  stackedDuelistIds,
  level,
  onClose
}) => {
  const { aspectWidth, aspectHeight } = useGameAspect()
  const [currentPage, setCurrentPage] = useState(0)
  const stackedCardRefs = useRef<(DuelistCardHandle | null)[]>([])
  const gridRef = useRef<HTMLDivElement>(null)
  
  const cardWidth = 24 * CARD_ASPECT_RATIO * STACKED_CARD_SCALE
  const cardHeight = 24 * STACKED_CARD_SCALE
  
  const totalPages = Math.ceil(stackedDuelistIds.length / CARDS_PER_PAGE)
  
  const currentStackedDuelists = stackedDuelistIds.slice(
    currentPage * CARDS_PER_PAGE, 
    (currentPage + 1) * CARDS_PER_PAGE
  )
  
  const firstRow = currentStackedDuelists.slice(0, CARDS_PER_ROW)
  const secondRow = currentStackedDuelists.slice(CARDS_PER_ROW, CARDS_PER_PAGE)
  
  const handlePreviousPage = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
      if (currentPage - 1 === 0) {
        emitter.emit('hover_description', null)
      }
    }
  }
  
  const handleNextPage = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (currentPage < totalPages - 1) {
      if (currentPage + 1 === totalPages - 1) {
        emitter.emit('hover_description', null)
      }
      setCurrentPage(currentPage + 1)
    }
  }
  
  const handleGridClick = (e: React.MouseEvent) => {
    if (!stopClickRef.current) {
      onClose()
    } else {
      stopClickRef.current = false
    }
  }
  
  useEffect(() => {
    stackedCardRefs.current = stackedCardRefs.current.slice(0, currentStackedDuelists.length)
  }, [currentStackedDuelists])

  const stopClickRef = useRef(false)
  
  const renderCardRow = (cards: number[], startIndex: number, rowIndex: number) => {
    const slots = Array(CARDS_PER_ROW).fill(null).map((_, idx) => {
      const cardIndex = idx;
      const duelistId = cards[cardIndex];
      
      const hasCard = idx < cards.length;
      
      return (
        <div 
          key={hasCard ? `stacked-duelist-${duelistId}` : `empty-slot-${rowIndex}-${idx}`}
          className={`SoulsCardColumn NoMouse ${hasCard ? '' : 'empty-slot'}`}
        >
          {hasCard ? (
            <DuelistCard
              ref={el => stackedCardRefs.current[startIndex + idx] = el}
              duelistId={duelistId}
              isSmall={true}
              isLeft={true}
              isVisible={true}
              instantVisible={true}
              isFlipped={true}
              instantFlip={true}
              isHanging={false}
              isHighlightable={true}
              width={cardWidth}
              height={cardHeight}
              showQuote={false}
              hideSouls={true}
              onClick={(e) => {
                stopClickRef.current = true
              }}
            />
          ) : (
            <div 
              className="EmptyCardSlot"
              style={{
                width: `${aspectWidth(cardWidth)}px`,
                height: `${aspectWidth(cardHeight)}px`,
                opacity: 0.2,
                border: `2px dashed ${COLORS.BRIGHT}`,
                borderRadius: '10px'
              }}
            />
          )}
        </div>
      );
    });
    
    return (
      <div className="SoulsCardRow">
        {slots}
      </div>
    );
  };
  
  return (
    <div 
      className="SoulsStackGrid"
      ref={gridRef}
      onClick={handleGridClick}
    >
      <div className="SoulsStackHeader">
        <h2>
          <span className="SoulsTitle">Bound Souls</span>
          <span className="SoulsLevel">• Level {level || 0}</span>
        </h2>
        
        <div 
          className="YesMouse NoDrag StackCloseButton" 
          onClick={onClose}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.25)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        />
      </div>
      
      <div className="SoulsGridContainer">
        {totalPages > 1 && currentPage > 0 && (
          <div 
            className="PageNavButton PrevButton YesMouse"
            onClick={handlePreviousPage}
            onMouseEnter={() => emitter.emit('hover_description', 'Previous souls')}
            onMouseLeave={() => emitter.emit('hover_description', null)}
          >
            <Icon name="chevron left" size="large" />
          </div>
        )}
        
        <div className="SoulsCardsGrid">
          {renderCardRow(firstRow, 0, 0)}
          {renderCardRow(secondRow, CARDS_PER_ROW, 1)}
        </div>
        
        {totalPages > 1 && currentPage < totalPages - 1 && (
          <div 
            className="PageNavButton NextButton YesMouse"
            onClick={handleNextPage}
            onMouseEnter={() => emitter.emit('hover_description', 'Next souls')}
            onMouseLeave={() => emitter.emit('hover_description', null)}
          >
            <Icon name="chevron right" size="large" />
          </div>
        )}
      </div>
      
      {totalPages > 1 && (
        <div className="PageIndicator">
          {currentPage + 1} / {totalPages}
        </div>
      )}
      
      {stackedDuelistIds.length === 0 && (
        <div className="NoSoulsMessage">
          No souls are bound to this duelist yet
          {/* Like tentacles in the night, the souls wait to be captured... */}
        </div>
      )}
    </div>
  )
}

export default SoulsStackGrid 