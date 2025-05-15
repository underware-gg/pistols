import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useGameAspect } from '/src/hooks/useGameAspect';
import { DuelistCard } from '../cards/DuelistCard';
import { usePlayerDuelistsOrganized } from '/src/stores/duelistStore';
import { DUELIST_CARD_HEIGHT, DUELIST_CARD_WIDTH } from '/src/data/cardConstants';
import { usePistolsContext } from '/src/hooks/PistolsContext';
import { CardColor } from '@underware/pistols-sdk/pistols/constants'
import { useDuelistsOfPlayer } from '/src/hooks/useTokenDuelists';

interface DuelistsBookAlwaysOpenProps {
  width: number;
  height: number;
  layerGap?: number;
  layerNumber?: number;
  bookTranslateX?: number;
  bookTranslateY?: number;
  bookRotateX?: number;
  bookRotateY?: number;
  bookRotateZ?: number;
  bookScale?: number;
  zIndex?: number;
  dropShadow?: string;
}

export const DuelistsBookAlwaysOpen: React.FC<DuelistsBookAlwaysOpenProps> = ({
  width,
  height,
  layerGap = 0.1,
  bookTranslateX = width / 2 + width / 10,
  bookTranslateY = 2,
  bookRotateX = 0,
  bookRotateY = 0,
  bookRotateZ = 0,
  bookScale = 1.2,
  zIndex = 10,
  dropShadow = '0 10px 10px rgba(0, 0, 0, 1)'
}) => {
  const { aspectWidth } = useGameAspect();
  
  const [coverGap, setCoverGap] = useState(width / 5);
  
  const bookRef = useRef<HTMLDivElement>(null);
  const bookTranslationContainerRef = useRef<HTMLDivElement>(null);
  const bookScaleContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bookTranslationContainerRef.current) {
      bookTranslationContainerRef.current.style.setProperty('--book-translate-x', `${aspectWidth(bookTranslateX)}px`);
      bookTranslationContainerRef.current.style.setProperty('--book-translate-y', `${aspectWidth(bookTranslateY)}px`);
    }
    if (bookScaleContainerRef.current) {
      bookScaleContainerRef.current.style.setProperty('--book-scale', `${bookScale}`);
    }
    if (bookRef.current) {
      bookRef.current.style.setProperty('--book-width', `${aspectWidth(width)}px`);
      bookRef.current.style.setProperty('--book-height', `${aspectWidth(height)}px`);
      bookRef.current.style.setProperty('--book-rotate-x', `${bookRotateX}deg`);
      bookRef.current.style.setProperty('--book-rotate-y', `${bookRotateY}deg`);
      bookRef.current.style.setProperty('--book-rotate-z', `${bookRotateZ}deg`);
      bookRef.current.style.setProperty('--book-opacity', '1');
      bookRef.current.style.setProperty('--book-z-index', `${zIndex}`);
      bookRef.current.style.filter = dropShadow ? `drop-shadow(${dropShadow})` : 'none';
    }
  }, [width, height, aspectWidth, bookTranslateX, bookTranslateY, bookRotateX, bookRotateY, bookRotateZ, bookScale, zIndex, dropShadow]);
  
  return (
    <div className="book-container NoMouse NoDrag" style={{ pointerEvents: 'none' }}>
      <div ref={bookTranslationContainerRef} className="book-container-translate">
        <div ref={bookScaleContainerRef} className="book-container-scale">
          <div ref={bookRef} className="book NoDrag" style={{ zIndex }}>
            <BookCoverLayer layer={0} layerColor="#a0522d" coverGap={coverGap} layerGap={layerGap} />
            <BookCoverLayer layer={1} layerColor="#000000" coverGap={coverGap} layerGap={layerGap} />
            <BookCoverLayer layer={2} layerColor="#000000" coverGap={coverGap} layerGap={layerGap} />
            <BookCoverLayer layer={3} layerColor="#a0522d" coverGap={coverGap} layerGap={layerGap} />
            <BookSheets width={width} height={height} />
          </div>
        </div>
      </div>
    </div>
  );
};

function BookCoverLayer({
  layer,
  layerColor,
  coverGap,
  layerGap
}: {
  layer: number;
  layerColor: string;
  coverGap: number;
  layerGap: number;
}) {
  const { aspectWidth } = useGameAspect();

  const coverLayerRef = useRef<HTMLDivElement>(null);
  const topCoverRef = useRef<HTMLDivElement>(null);
  const bottomCoverRef = useRef<HTMLDivElement>(null);
  const spineRef = useRef<HTMLDivElement>(null);

  const pieceCount = 6;
  const alpha = 0.2;
  const startingAngle = ((pieceCount - 1) * alpha) / 2;

  useEffect(() => {
    if (coverLayerRef.current) {
      coverLayerRef.current.style.setProperty('--layer-color', layerColor);
      coverLayerRef.current.style.setProperty('--cover-translate-z', `${aspectWidth(-layerGap * layer)}px`);
    }
    
    // Set cover layers to fully open position
    if (topCoverRef.current && spineRef.current) {
      const targetRotateY = -180;
      const targetCoverRotation = 180;
      
      // Position calculations - same as in updateCover but with fixed values
      const angleRadians = targetCoverRotation * Math.PI / 180;
      const x = coverGap * Math.cos(angleRadians);
      const z = coverGap * Math.sin(angleRadians);
      const distance = Math.sqrt(x*x + z*z);
      const rotation = 180 - targetCoverRotation;

      topCoverRef.current.style.setProperty('--top-translate-x', `${aspectWidth(x)}px`);
      topCoverRef.current.style.setProperty('--top-translate-z', `${aspectWidth(z)}px`);
      topCoverRef.current.style.setProperty('--top-rotate-y', `${targetRotateY}deg`);

      spineRef.current.style.setProperty('--spine-width', `${aspectWidth(distance)}px`);
      spineRef.current.style.setProperty('--spine-rotate-y', `${rotation}deg`);

      const pieceLength = distance * Math.sin(alpha / 2) / Math.sin((pieceCount * alpha) / 2);
      let totalAngle = startingAngle;
      let targetX = 0;
      let targetZ = 0;

      for (let i = 0; i < pieceCount; i++) {
        const piece = spineRef.current.children[i] as HTMLElement;
        if (piece) {
          piece.style.setProperty('--piece-width', `${aspectWidth(pieceLength) + 0.2}px`);
          piece.style.setProperty('--piece-translate-x', `${aspectWidth(targetX)}px`);
          piece.style.setProperty('--piece-translate-z', `${aspectWidth(targetZ)}px`);
          piece.style.setProperty('--piece-rotate-y', `${-totalAngle}rad`);
        }
        targetX -= Math.cos(totalAngle) * pieceLength;
        targetZ -= Math.sin(totalAngle) * pieceLength;
        totalAngle -= alpha;
      }
    }
  }, [layerColor, layer, aspectWidth, layerGap, coverGap]);
  
  return (
    <div ref={coverLayerRef} className="cover-layer">
      <div ref={topCoverRef} className="top-cover" />
      <div ref={spineRef} className="spine">
        {Array.from({length: pieceCount}, (_, i) => (
          <div key={i} className="spine-piece" />
        ))}
      </div>
      <div ref={bottomCoverRef} className="bottom-cover" /> 
    </div>
  );
}

function BookSheets({ width, height }: { width?: number; height?: number }) {
  const { aspectWidth, aspectHeight } = useGameAspect();
  const { activeDuelists, deadDuelists } = usePlayerDuelistsOrganized();
  
  const duelistIds = useMemo(() => [...activeDuelists, ...deadDuelists], [activeDuelists, deadDuelists]);
  
  const { selectedDuelistId, dispatchSelectDuelistId } = usePistolsContext()

  const sheetsRef = useRef<HTMLDivElement>(null);
  const sheetRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  const sheetCount = 20;
  const duelistsPerPage = 4;
  const [currentPage, setCurrentPage] = useState(0);
  const [sheetGap, setSheetGap] = useState(width ? width / 5 / (sheetCount - 1) : 0.1);
  const [sheetOrder, setSheetOrder] = useState<number[]>(Array.from({length: sheetCount}, (_, i) => i));
  
  const maxPages = useMemo(() => Math.ceil(duelistIds.length / duelistsPerPage), [duelistIds]);

  const PageContentMemo = useMemo(() => {
    if (!duelistIds || !width || !height) return [];

    const pages = [];
    for (let pageNum = 0; pageNum < maxPages; pageNum++) {
      const startIndex = pageNum * duelistsPerPage;
      const pageDuelists = duelistIds.slice(startIndex, startIndex + duelistsPerPage);
      
      const pageContent = (
        <div id={`page-${pageNum}`} style={{ 
          display: 'grid',
          gridTemplateColumns: `repeat(2, 1fr)`,
          gridTemplateRows: `repeat(2, 1fr)`,
          gap: `${aspectWidth((height * 0.8 - DUELIST_CARD_HEIGHT * 2) / 6)}px ${aspectWidth((width * 0.96 - DUELIST_CARD_WIDTH * 2) / 3)}px`,
          padding: `${0}px ${aspectWidth((width * 0.96 - DUELIST_CARD_WIDTH * 2) / 3)}px`,
          width: aspectWidth(width * 0.96),
          height: aspectWidth(height * 0.8)
        }}>
          {pageDuelists.map(duelistId => (
            <div 
              key={duelistId}
              id={`duelist-container-${duelistId}`}
              style={{
                width: aspectWidth(DUELIST_CARD_WIDTH),
                height: aspectWidth(DUELIST_CARD_HEIGHT),
                position: 'relative',
              }}
            >
              <div id={`corner-tr-${duelistId}`} style={{
                position: 'absolute',
                top: aspectWidth(-DUELIST_CARD_WIDTH * 0.05),
                right: aspectWidth(-DUELIST_CARD_WIDTH * 0.05), 
                width: 0,
                height: 0,
                borderRight: `${aspectWidth(DUELIST_CARD_WIDTH * 0.4)}px solid #f0e6d9`,
                borderBottom: `${aspectWidth(DUELIST_CARD_WIDTH * 0.4)}px solid transparent`,
                filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.8))',
                zIndex: 20,
                pointerEvents: 'none',
              }} />

                <div id={`corner-tr-fill-${duelistId}`} style={{
                  position: 'absolute',
                  top: aspectWidth(-DUELIST_CARD_WIDTH * 0.15),
                  right: aspectWidth(-DUELIST_CARD_WIDTH * 0.15),
                  width: aspectWidth(DUELIST_CARD_WIDTH * 0.6) + 'px',
                  height: aspectWidth(DUELIST_CARD_WIDTH * 0.6) + 'px',
                  background: '#e0d1bd',
                  clipPath: 'polygon(100% 0, 100% 100%, 0 0)',
                  boxShadow: `inset ${aspectWidth(-18)}px ${aspectWidth(18)}px ${aspectWidth(10)}px #f0e6d9, inset ${aspectWidth(-8)}px ${aspectWidth(8)}px ${aspectWidth(20)}px #f0e6d9`,
                  zIndex: 21,
                  pointerEvents: 'none'
                }} />

                <div id={`corner-bl-${duelistId}`} style={{
                  position: 'absolute',
                  bottom: aspectWidth(-DUELIST_CARD_WIDTH * 0.05),
                  left: aspectWidth(-DUELIST_CARD_WIDTH * 0.05),
                  width: 0,
                  height: 0,
                  borderLeft: `${aspectWidth(DUELIST_CARD_WIDTH * 0.4)}px solid #f0e6d9`,
                  borderTop: `${aspectWidth(DUELIST_CARD_WIDTH * 0.4)}px solid transparent`,
                  filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.8))',
                  zIndex: 20,
                  pointerEvents: 'none'
                }} />

                <div id={`corner-bl-fill-${duelistId}`} style={{
                  position: 'absolute',
                  bottom: aspectWidth(-DUELIST_CARD_WIDTH * 0.15),
                  left: aspectWidth(-DUELIST_CARD_WIDTH * 0.15),
                  width: aspectWidth(DUELIST_CARD_WIDTH * 0.6) + 'px', 
                  height: aspectWidth(DUELIST_CARD_WIDTH * 0.6) + 'px',
                  background: '#e0d1bd',
                  clipPath: 'polygon(0 100%, 100% 100%, 0 0)',
                  boxShadow: `inset ${aspectWidth(18)}px ${aspectWidth(-18)}px ${aspectWidth(10)}px #f0e6d9, inset ${aspectWidth(8)}px ${aspectWidth(-8)}px ${aspectWidth(20)}px #f0e6d9`,
                  zIndex: 21,
                  pointerEvents: 'none'
                }} />

              <DuelistCard 
                duelistId={Number(duelistId)}
                isSmall={true}
                isLeft={true}
                isVisible={true}
                instantVisible={true}
                isFlipped={true}
                instantFlip={true}
                isHanging={false}
                isHighlightable={true}
                width={DUELIST_CARD_WIDTH}
                height={DUELIST_CARD_HEIGHT}
                defaultHighlightColor={CardColor.BROWN}
                onClick={() => {
                  dispatchSelectDuelistId(duelistId)
                }}
              />
            </div>
          ))}
        </div>
      );
      pages.push(pageContent);
    }

    return pages;
  }, [duelistIds, aspectWidth, width, height, maxPages, deadDuelists]);

  const handleNextPage = () => {
    if (currentPage < maxPages - 2) {
      setCurrentPage(prev => prev + 2);
      animatePageTurn(true);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 2);
      animatePageTurn(false);
    }
  };

  const animatePageTurn = (forward: boolean) => {
    if (!sheetRefs.current.length) return;

    setSheetOrder(prevOrder => {
      const newOrder = [...prevOrder];
      if (forward) {
        const lastId = newOrder.pop();
        if (lastId !== undefined) {
          newOrder.unshift(lastId);
        }
      } else {
        const firstId = newOrder.shift();
        if (firstId !== undefined) {
          newOrder.push(firstId);
        }
      }
      return newOrder;
    });
  };

  useEffect(() => {
    // Set book sheets to fully open position
    if (sheetsRef.current) {
      const targetRotateY = -90;
      const targetCurveRadius = width * 0.025;
      
      sheetsRef.current.style.setProperty('--book-sheets-rotate-y', `${targetRotateY}deg`);
      
      updateSheets(targetRotateY, targetCurveRadius);
    }
  }, []);

  useEffect(() => {
    updateSheets(-90, width * 0.025);
  }, [sheetOrder]);

  useEffect(() => {
    setSheetGap(width ? width / 5 / (sheetCount - 1) : 0.1);
  }, [width]);

  function updateSheets(rotateY: number, curveRadius: number) {
    const currentSheetOrder = sheetOrder;
    currentSheetOrder.forEach((sheetId, orderIndex) => {
      const sheet = sheetRefs.current[sheetId];
      if (sheet) {
        let shifted = false;
    
        if (orderIndex === 0 || orderIndex === sheetCount - 1) {
          shifted = true;
        }
        const progress = orderIndex / (sheetCount - 1);
        const xOffset = Math.sin(progress * Math.PI) * curveRadius;
        const zOffset = orderIndex * sheetGap;
        const sheetRotate = progress > 0.5 ? rotateY : -rotateY;

        if (orderIndex > sheetCount / 2 - 1) {
          sheet.style.setProperty('--left-page', 'all');
          sheet.style.setProperty('--right-page', 'none');
        } else {
          sheet.style.setProperty('--left-page', 'none');
          sheet.style.setProperty('--right-page', 'all');
        }

        // Save the previous position before updating
        const prevPos = sheet.dataset.position || '';
        const newPos = orderIndex === sheetCount / 2 - 2 ? 'prev2' :
                      orderIndex === sheetCount / 2 - 1 ? 'prev1' :
                      orderIndex === sheetCount / 2 ? 'center' :
                      orderIndex === sheetCount / 2 + 1 ? 'next1' : '';
        
        // Store the new position
        sheet.dataset.position = newPos;
        
        // Only delay z-index settings when position changes (during page flip)
        const isFlipping = prevPos && prevPos !== newPos;
        
        if (orderIndex === sheetCount / 2 - 2) {
          if (!isFlipping) {
            sheet.style.setProperty('--left-page-translate-z', `${aspectWidth(0.01)}px`);
            sheet.style.setProperty('--right-page-translate-z', `${aspectWidth(-0.01)}px`);
          } else {
            // During flipping, temporarily remove z-index to prevent protrusion
            sheet.style.setProperty('--left-page-translate-z', `0px`);
            sheet.style.setProperty('--right-page-translate-z', `0px`);
            
            // Restore proper z-index after animation completes
            setTimeout(() => {
              sheet.style.setProperty('--left-page-translate-z', `${aspectWidth(0.01)}px`);
              sheet.style.setProperty('--right-page-translate-z', `${aspectWidth(-0.01)}px`);
            }, 600);
          }
        } else if (orderIndex === sheetCount / 2) {
          sheet.style.setProperty('--left-page-translate-z', `${aspectWidth(0.01)}px`);
          sheet.style.setProperty('--right-page-translate-z', `${aspectWidth(0.01)}px`);
        } else if (orderIndex === sheetCount / 2 - 1) {
          sheet.style.setProperty('--left-page-translate-z', `${aspectWidth(0.01)}px`);
          sheet.style.setProperty('--right-page-translate-z', `${aspectWidth(0.01)}px`);
        } else if (orderIndex === sheetCount / 2 + 1) {
          if (!isFlipping) {
            sheet.style.setProperty('--left-page-translate-z', `${aspectWidth(-0.01)}px`);
            sheet.style.setProperty('--right-page-translate-z', `${aspectWidth(0.01)}px`);
          } else {
            // During flipping, temporarily remove z-index to prevent protrusion
            sheet.style.setProperty('--left-page-translate-z', `0px`);
            sheet.style.setProperty('--right-page-translate-z', `0px`);
            
            // Restore proper z-index after animation completes
            setTimeout(() => {
              sheet.style.setProperty('--left-page-translate-z', `${aspectWidth(-0.01)}px`);
              sheet.style.setProperty('--right-page-translate-z', `${aspectWidth(0.01)}px`);
            }, 600);
          }
        }

        sheet.style.setProperty('--sheet-translate-x', `${aspectWidth(xOffset)}px`);
        sheet.style.setProperty('--sheet-translate-z', `${aspectWidth(zOffset)}px`);
        sheet.style.transition = `transform ${!shifted ? 600 : 0}ms`;
        sheet.style.setProperty('--sheet-rotate-y', `${sheetRotate}deg`);
      }
    });
  }

  const renderDuelistsForPage = (sheetId: number, isLeft: boolean) => {
    const orderIndex = sheetOrder.indexOf(sheetId);
    let pageShift = 0;
    if (orderIndex === sheetCount / 2 - 2) {
      pageShift = isLeft ? 4 : 3;
    } else if (orderIndex === sheetCount / 2 - 1) {
      pageShift = isLeft ? 2 : 1;
    } else if (orderIndex === sheetCount / 2) {
      pageShift = isLeft ? 0 : -1;
    } else if (orderIndex === sheetCount / 2 + 1) {
      pageShift = isLeft ? -2 : -3;
    }

    if (pageShift === 4 || pageShift === -3) return null;
    
    const pageIndex = currentPage + pageShift;
    if (pageIndex < 0 || pageIndex >= PageContentMemo.length) return null;
    
    return PageContentMemo[pageIndex];
  };

  const isPageVisible = (sheetId: number) => {
    const orderIndex = sheetOrder.indexOf(sheetId);
    return orderIndex >= sheetCount / 2 - 2 && orderIndex <= sheetCount / 2 + 1;
  };

  const buttonWidth = width ? width * 0.2 : 8;
  const buttonHeight = width ? width * 0.08 : 2;
  const buttonPadding = width ? width * 0.03 : 0.5;

  return (
    <div ref={sheetsRef} className="book-sheets">
      {Array.from({ length: sheetCount }, (_, i) => (
        <div
          id={`sheet-${i}`}
          key={i}
          ref={el => sheetRefs.current[i] = el}
          className="paper-sheet"
        >
          {isPageVisible(i) && (
            <>
              <div className="page-content left-page YesMouse">
                {renderDuelistsForPage(i, true)}
                {currentPage > 0 && 
                  <button 
                    onClick={handlePrevPage} 
                    className="prev-button YesMouse NoDrag"
                    style={{
                      position: 'absolute',
                      bottom: aspectWidth(buttonPadding),
                      left: aspectWidth(buttonPadding),
                      padding: `${aspectWidth(buttonPadding * 0.5)}px ${aspectWidth(buttonPadding)}px`,
                      height: aspectWidth(buttonHeight),
                      width: aspectWidth(buttonWidth),
                      fontSize: aspectWidth(buttonHeight * 0.5),
                      borderRadius: aspectWidth(buttonHeight * 0.2)
                    }}
                  >
                    Previous
                  </button>
                }
              </div>
              <div className="page-content right-page YesMouse">
                {renderDuelistsForPage(i, false)}
                {currentPage < maxPages - 2 && 
                  <button 
                    onClick={handleNextPage} 
                    className="next-button YesMouse NoDrag"
                    style={{
                      position: 'absolute',
                      bottom: aspectWidth(buttonPadding),
                      right: aspectWidth(buttonPadding),
                      padding: `${aspectWidth(buttonPadding * 0.5)}px ${aspectWidth(buttonPadding)}px`,
                      height: aspectWidth(buttonHeight),
                      width: aspectWidth(buttonWidth),
                      fontSize: aspectWidth(buttonHeight * 0.5),
                      borderRadius: aspectWidth(buttonHeight * 0.2)
                    }}
                  >
                    Next
                  </button>
                }
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
} 