import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as TWEEN from '@tweenjs/tween.js';
import { useGameAspect } from '/src/hooks/useGameAspect';
import { DuelistCard } from '/src/components/cards/DuelistCard';
import { useDuelistsOfPlayer } from '/src/hooks/useTokenDuelists';
import { DUELIST_CARD_HEIGHT, DUELIST_CARD_WIDTH } from '/src/data/cardConstants';
import { Opener } from '/src/hooks/useOpener';
import { CardColor } from '@underware/pistols-sdk/pistols/constants';
import { usePistolsContext } from '/src/hooks/PistolsContext';

const ANIMATION_DURATION = 500;

interface DuelistsBookProps {
  width: number;
  height: number;
  layerGap?: number;
  layerNumber?: number;
  bookTranslateXOpen?: number;
  bookTranslateYOpen?: number;
  bookRotateXOpen?: number;
  bookRotateYOpen?: number;
  bookRotateZOpen?: number;
  bookTranslateXClosed?: number;
  bookTranslateYClosed?: number;
  bookRotateXClosed?: number;
  bookRotateYClosed?: number;
  bookRotateZClosed?: number;
  opener: Opener;
}

export const DuelistsBook: React.FC<DuelistsBookProps> = ({
  width,
  height,
  layerGap = 0.1,
  bookTranslateXOpen = width / 2 + width / 10,
  bookTranslateYOpen = 2,
  bookRotateXOpen = 0,
  bookRotateYOpen = 0,
  bookRotateZOpen = 0,
  bookTranslateXClosed = 0,
  bookTranslateYClosed = 0,
  bookRotateXClosed = 80,
  bookRotateYClosed = 0,
  bookRotateZClosed = 0,
  opener
}) => {
  const { aspectWidth } = useGameAspect();
  
  const [coverGap, setCoverGap] = useState(width / 5);
  const [isBookVisible, setIsBookVisible] = useState(false);
  const [isBookOpen, setIsBookOpen] = useState(false);
  
  const bookRef = useRef<HTMLDivElement>(null);
  const bookBackfillRef = useRef<HTMLDivElement>(null);
  const bookTranslationContainerRef = useRef<HTMLDivElement>(null);
  const bookScaleContainerRef = useRef<HTMLDivElement>(null);
  const bookTransformRef = useRef({
    translateX: bookTranslateXClosed,
    translateY: bookTranslateYClosed,
    rotateX: bookRotateXClosed,
    rotateY: bookRotateYClosed,
    rotateZ: bookRotateZClosed,
    scale: 0.3,
    opacity: 0
  });
  const bookTweenRef = useRef<TWEEN.Tween<any>>();

  useEffect(() => {
    if (bookBackfillRef.current) {
      bookBackfillRef.current.style.setProperty('--book-opacity', `${bookTransformRef.current.opacity}`);
    }
    if (bookTranslationContainerRef.current) {
      bookTranslationContainerRef.current.style.setProperty('--book-translate-x', `${aspectWidth(bookTransformRef.current.translateX)}px`);
      bookTranslationContainerRef.current.style.setProperty('--book-translate-y', `${aspectWidth(bookTransformRef.current.translateY)}px`);
    }
    if (bookScaleContainerRef.current) {
      bookScaleContainerRef.current.style.setProperty('--book-scale', `${bookTransformRef.current.scale}`);
    }
    if (bookRef.current) {
      bookRef.current.style.setProperty('--book-width', `${aspectWidth(width)}px`);
      bookRef.current.style.setProperty('--book-height', `${aspectWidth(height)}px`);
      bookRef.current.style.setProperty('--book-rotate-x', `${bookTransformRef.current.rotateX}deg`);
      bookRef.current.style.setProperty('--book-rotate-y', `${bookTransformRef.current.rotateY}deg`);
      bookRef.current.style.setProperty('--book-rotate-z', `${bookTransformRef.current.rotateZ}deg`);
      bookRef.current.style.setProperty('--book-opacity', `${bookTransformRef.current.opacity}`);
    }
  }, [width, height, aspectWidth]);

  useEffect(() => {
    if (bookRef.current) {
      bookRef.current.style.cursor = opener.isOpen ? 'default' : 'pointer';

      const startValues = {
        translateX: bookTransformRef.current.translateX,
        translateY: bookTransformRef.current.translateY,
        rotateX: bookTransformRef.current.rotateX,
        rotateY: bookTransformRef.current.rotateY,
        rotateZ: bookTransformRef.current.rotateZ,
        scale: bookTransformRef.current.scale,
        opacity: bookTransformRef.current.opacity
      };

      const targetValues = {
        translateX: opener.isOpen ? bookTranslateXOpen : bookTranslateXClosed,
        translateY: opener.isOpen ? bookTranslateYOpen : bookTranslateYClosed,
        rotateX: opener.isOpen ? bookRotateXOpen : bookRotateXClosed,
        rotateY: opener.isOpen ? bookRotateYOpen : bookRotateYClosed,
        rotateZ: opener.isOpen ? bookRotateZOpen : bookRotateZClosed,
        scale: opener.isOpen ? 1.2 : 0.3,
        opacity: opener.isOpen ? 1 : 0
      };

      if (bookTweenRef.current) {
        bookTweenRef.current.stop();
      }

      if (!opener.isOpen && isBookOpen) {
        // First close the book
        setIsBookOpen(false);
        setTimeout(() => {
          // Then hide the book
          setIsBookVisible(false);
        }, ANIMATION_DURATION);
      } else if (opener.isOpen && !isBookVisible) {
        // First show the book
        setIsBookVisible(true);
        // Then open it
        setTimeout(() => {
          setIsBookOpen(true);
        }, ANIMATION_DURATION);
      }

      bookTweenRef.current = new TWEEN.Tween(startValues)
        .to(targetValues, ANIMATION_DURATION)
        .easing(TWEEN.Easing.Cubic.InOut)
        .onUpdate(() => {
          bookTranslationContainerRef.current.style.setProperty('--book-translate-x', `${aspectWidth(startValues.translateX)}px`);
          bookTranslationContainerRef.current.style.setProperty('--book-translate-y', `${aspectWidth(startValues.translateY)}px`);
          bookScaleContainerRef.current.style.setProperty('--book-scale', `${startValues.scale}`);
          bookRef.current.style.setProperty('--book-rotate-x', `${startValues.rotateX}deg`);
          bookRef.current.style.setProperty('--book-rotate-y', `${startValues.rotateY}deg`);
          bookRef.current.style.setProperty('--book-rotate-z', `${startValues.rotateZ}deg`);
          bookRef.current.style.setProperty('--book-opacity', `${startValues.opacity}`);
          bookBackfillRef.current.style.setProperty('--book-opacity', `${startValues.opacity}`);
          setCoverGap(width / 5);
          bookTransformRef.current = startValues;
        })
        .start();
    }
  }, [opener.isOpen]);
  
  return (
    <div className={`book-container ${opener.isOpen ? 'YesMouse' : 'NoMouse'} NoDrag`}>
      <div ref={bookBackfillRef} className="book-backfill" />
      <div ref={bookTranslationContainerRef} className="book-container-translate">
        <div ref={bookScaleContainerRef} className="book-container-scale">
          <div ref={bookRef} className="book NoDrag NoMouse">
            {isBookOpen && <>
              <BookCoverLayer layer={0} layerColor="#a0522d" isOpen={isBookOpen} coverGap={coverGap} layerGap={layerGap} />
              <BookCoverLayer layer={1} layerColor="#000000" isOpen={isBookOpen} coverGap={coverGap} layerGap={layerGap} />
              <BookCoverLayer layer={2} layerColor="#000000" isOpen={isBookOpen} coverGap={coverGap} layerGap={layerGap} />
              <BookCoverLayer layer={3} layerColor="#a0522d" isOpen={isBookOpen} coverGap={coverGap} layerGap={layerGap} />
              <BookSheets isOpen={isBookOpen} width={width} height={height} />
              <div
                className={opener.isOpen ? 'YesMouse NoDrag book-close-button' : 'NoMouse NoDrag book-close-button'}
                onClick={opener.close}
              />
            </>}
          </div>
        </div>
      </div>
    </div>
  );
};

function BookCoverLayer({
  layer,
  layerColor,
  isOpen,
  coverGap,
  layerGap
}: {
  layer: number;
  layerColor: string;
  isOpen: boolean;
  coverGap: number;
  layerGap: number;
}) {
  const { aspectWidth } = useGameAspect();

  const coverLayerRef = useRef<HTMLDivElement>(null);
  const topCoverRef = useRef<HTMLDivElement>(null);
  const bottomCoverRef = useRef<HTMLDivElement>(null);
  const spineRef = useRef<HTMLDivElement>(null);
  const topCoverRotateYRef = useRef<number>(0);
  const topCoverRotationRef = useRef<number>(90);
  const topCoverShiftRef = useRef<number>(layerGap * layer * 2);
  const topTweenRef = useRef<any>(null);

  const pieceCount = 6;
  const alpha = 0.2;
  const startingAngle = ((pieceCount - 1) * alpha) / 2;

  useEffect(() => {
    if (coverLayerRef.current) {
      coverLayerRef.current.style.setProperty('--layer-color', layerColor);
      coverLayerRef.current.style.setProperty('--cover-translate-z', `${aspectWidth(-layerGap * layer)}px`);
    }
  }, [layerColor, layer, aspectWidth, layerGap]);

  useEffect(() => {
    const startValues = {
      coverRotation: topCoverRotationRef.current,
      shift: topCoverShiftRef.current,
      rotateY: topCoverRotateYRef.current,
    };

    const targetValues = {
      rotateY: isOpen ? -180 : 0,
      coverRotation: isOpen ? 180 : 90,
      shift: isOpen ? 0 : layerGap * layer * 2
    };

    topTweenRef.current = new TWEEN.Tween(startValues)
      .to(targetValues, ANIMATION_DURATION)
      .easing(TWEEN.Easing.Quadratic.Out)
      .onUpdate(() => {
        topCoverRotateYRef.current = startValues.rotateY;
        topCoverRotationRef.current = startValues.coverRotation;
        topCoverShiftRef.current = startValues.shift;

        updateCover();
      })
      .start();

    return () => {
      if (topTweenRef.current) {
        topTweenRef.current.stop();
      }
    };
  }, [isOpen, layer, layerGap, aspectWidth, coverGap]);

  function updateCover() {
    if (topCoverRef.current && spineRef.current) {
      const angleRadians = topCoverRotationRef.current * Math.PI / 180;
      const x = (coverGap + topCoverShiftRef.current) * Math.cos(angleRadians);
      const z = (coverGap + topCoverShiftRef.current) * Math.sin(angleRadians);
      const distance = Math.sqrt(x*x + z*z);
      const rotation = 180 - topCoverRotationRef.current;

      topCoverRef.current.style.setProperty('--top-translate-x', `${aspectWidth(x)}px`);
      topCoverRef.current.style.setProperty('--top-translate-z', `${aspectWidth(z)}px`);
      topCoverRef.current.style.setProperty('--top-rotate-y', `${topCoverRotateYRef.current}deg`);

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
  }
  
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

function BookSheets({ isOpen, width, height }: { isOpen: boolean; width?: number; height?: number }) {
  const { aspectWidth } = useGameAspect();
  const { duelistIds } = useDuelistsOfPlayer();
  const { selectedDuelistId, dispatchSelectDuelistId } = usePistolsContext()

  const sheetsRef = useRef<HTMLDivElement>(null);
  const sheetRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lastUpdateValuesRef = useRef<{
    isOpen: boolean;
    currentPage: number;
  }>({
    isOpen: false,
    currentPage: 0,
  });
  
  const sheetCount = 20;
  const duelistsPerPage = 4;
  const [currentPage, setCurrentPage] = useState(0);
  const [sheetGap, setSheetGap] = useState(width ? width / 5 / (sheetCount - 1) : 0.1);
  const [sheetOrder, setSheetOrder] = useState<number[]>(Array.from({length: sheetCount}, (_, i) => i));
  const [isAnimatingOpen, setIsAnimatingOpen] = useState(false);
  
  const curveRadiusRef = useRef(-width * 0.025);
  const sheetsRotateYRef = useRef(0);
  const sheetsTweenRef = useRef<any>(null);

  const maxPages = useMemo(() => Math.ceil(duelistIds.length / duelistsPerPage), [duelistIds]);

  const PageContentMemo = useMemo(() => {
    // Force memo to run immediately by not depending on isOpen
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
              <div id={`corner-tl-${duelistId}`} style={{
                position: 'absolute',
                top: aspectWidth(-DUELIST_CARD_WIDTH * 0.05),
                left: aspectWidth(-DUELIST_CARD_WIDTH * 0.05), 
                width: 0,
                height: 0,
                borderLeft: `${aspectWidth(DUELIST_CARD_WIDTH * 0.4)}px solid #f0e6d9`,
                borderBottom: `${aspectWidth(DUELIST_CARD_WIDTH * 0.4)}px solid transparent`,
                filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.8))',
                zIndex: 1,
                pointerEvents: 'none',
              }} />

              <div id={`corner-tl-fill-${duelistId}`} style={{
                position: 'absolute',
                top: aspectWidth(-DUELIST_CARD_WIDTH * 0.15),
                left: aspectWidth(-DUELIST_CARD_WIDTH * 0.15),
                width: aspectWidth(DUELIST_CARD_WIDTH * 0.6) + 'px',
                height: aspectWidth(DUELIST_CARD_WIDTH * 0.6) + 'px',
                background: '#e0d1bd',
                clipPath: 'polygon(0 0, 100% 0, 0 100%)',
                boxShadow: 'inset 18px 18px 10px #f0e6d9, inset 8px 8px 20px #f0e6d9',
                zIndex: 2,
                pointerEvents: 'none'
              }} />

              <div id={`corner-br-${duelistId}`} style={{
                position: 'absolute',
                bottom: aspectWidth(-DUELIST_CARD_WIDTH * 0.05),
                right: aspectWidth(-DUELIST_CARD_WIDTH * 0.05),
                width: 0,
                height: 0,
                borderRight: `${aspectWidth(DUELIST_CARD_WIDTH * 0.4)}px solid #f0e6d9`,
                borderTop: `${aspectWidth(DUELIST_CARD_WIDTH * 0.4)}px solid transparent`,
                filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.8))',
                zIndex: 1,
                pointerEvents: 'none'
              }} />

              <div id={`corner-br-fill-${duelistId}`} style={{
                position: 'absolute',
                bottom: aspectWidth(-DUELIST_CARD_WIDTH * 0.15),
                right: aspectWidth(-DUELIST_CARD_WIDTH * 0.15),
                width: aspectWidth(DUELIST_CARD_WIDTH * 0.6) + 'px', 
                height: aspectWidth(DUELIST_CARD_WIDTH * 0.6) + 'px',
                background: '#e0d1bd',
                clipPath: 'polygon(100% 100%, 100% 0, 0 100%)',
                boxShadow: 'inset -18px -18px 10px #f0e6d9, inset -8px -8px 20px #f0e6d9',
                zIndex: 2,
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
  }, [duelistIds, aspectWidth, width, height, maxPages, isAnimatingOpen]); // Removed isOpen dependency

  const handleNextPage = () => {
    if (currentPage < maxPages - 1) {
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
    if (sheetsTweenRef.current) {
      sheetsTweenRef.current.stop();
    }

    setIsAnimatingOpen(true);

    const startValues = {
      rotateY: sheetsRotateYRef.current,
      curveRadius: curveRadiusRef.current
    };

    const targetValues = {
      rotateY: isOpen ? -90 : 0,
      curveRadius: isOpen ? width * 0.025 : -width * 0.025
    };

    sheetsTweenRef.current = new TWEEN.Tween(startValues)
      .to(targetValues, ANIMATION_DURATION)
      .easing(TWEEN.Easing.Quadratic.Out)
      .onUpdate(({rotateY, curveRadius}) => {
        if (sheetsRef.current) {
          sheetsRotateYRef.current = rotateY;
          curveRadiusRef.current = curveRadius;
          sheetsRef.current.style.setProperty('--book-sheets-rotate-y', `${rotateY}deg`);

          updateSheets(rotateY, curveRadius, true);
        }
      })
      .onComplete(() => {
        setIsAnimatingOpen(false);
      })
      .start();

    lastUpdateValuesRef.current = {
      isOpen,
      currentPage: currentPage,
    };

    return () => {
      if (sheetsTweenRef.current) {
        sheetsTweenRef.current.stop();
      }
    };
  }, [isOpen]);

  useEffect(() => {
    updateSheets(sheetsRotateYRef.current, curveRadiusRef.current, false);
  }, [sheetOrder]);

  function updateSheets(rotateY: number, curveRadius: number, fromOpening: boolean) {
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
        const rotationDelay = (progress > 0.5 ? 200 - Math.pow((progress - 0.5) * 2, 2) * 200 : 0) * (isOpen ? 1 : 0);
        const sheetRotate = progress > 0.5 ? rotateY : -rotateY;

        if (orderIndex > sheetCount / 2 - 1) {
          sheet.style.setProperty('--left-page', 'all');
          sheet.style.setProperty('--right-page', 'none');
        } else {
          sheet.style.setProperty('--left-page', 'none');
          sheet.style.setProperty('--right-page', 'all');
        }

        if (orderIndex === sheetCount / 2 - 2) {
          sheet.style.setProperty('--left-page-translate-z', `1px`);
          sheet.style.setProperty('--right-page-translate-z', `-1px`);
        } else if (orderIndex === sheetCount / 2) {
          sheet.style.setProperty('--left-page-translate-z', `1px`);
          sheet.style.setProperty('--right-page-translate-z', `1px`);
        } else if (orderIndex === sheetCount / 2 - 1) {
          sheet.style.setProperty('--left-page-translate-z', `1px`);
          sheet.style.setProperty('--right-page-translate-z', `1px`);
        } else if (orderIndex === sheetCount / 2 + 1) {
          sheet.style.setProperty('--left-page-translate-z', `-1px`);
          sheet.style.setProperty('--right-page-translate-z', `1px`);
        }

        sheet.style.setProperty('--sheet-translate-x', `${aspectWidth(xOffset)}px`);
        sheet.style.setProperty('--sheet-translate-z', `${aspectWidth(zOffset)}px`);
        sheet.style.transition = `transform ${isOpen && !shifted ? (fromOpening ? rotationDelay : 600) : 0}ms`;
        sheet.style.setProperty('--sheet-rotate-y', `${sheetRotate}deg`);
      }
    });
  }

  useEffect(() => {
    setSheetGap(width ? width / 5 / (sheetCount - 1) : 0.1);
    curveRadiusRef.current = -width * 0.025;
  }, [width]);

  useEffect(() => {
    sheetOrder.forEach((sheetId, orderIndex) => {
      const sheet = sheetRefs.current[sheetId];
      if (sheet) {
        const progress = orderIndex / (sheetCount - 1);
        const xOffset = Math.sin(progress * Math.PI) * curveRadiusRef.current;
        const zOffset = orderIndex * sheetGap;

        sheet.style.setProperty('--sheet-translate-x', `${aspectWidth(xOffset)}px`);
        sheet.style.setProperty('--sheet-translate-z', `${aspectWidth(zOffset)}px`);
      }
    });
  }, [sheetGap, aspectWidth]);

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

    if (isOpen && isAnimatingOpen && pageShift !== 0 && pageShift !== 1) return null;
    if (pageShift === 4 || pageShift === -3) return null;
    
    const pageIndex = currentPage + pageShift;
    if (pageIndex < 0 || pageIndex >= PageContentMemo.length) return null;
    
    return PageContentMemo[pageIndex];
  };

  const isPageVisible = (sheetId: number) => {
    const orderIndex = sheetOrder.indexOf(sheetId);
    return orderIndex >= sheetCount / 2 - 2 && orderIndex <= sheetCount / 2 + 1;
  };

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
              <div className="page-content left-page" >
                {renderDuelistsForPage(i, true)}
                {currentPage > 0 && <button onClick={handlePrevPage} className="prev-button YesMouse NoDrag">Previous</button>}
              </div>
              <div className="page-content right-page">
                {renderDuelistsForPage(i, false)}
                {currentPage < maxPages - 1 && <button onClick={handleNextPage} className="next-button YesMouse NoDrag">Next</button>}
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

//TODO missing filters - by fame, name, date got?
//TODO button show hide dead duelists