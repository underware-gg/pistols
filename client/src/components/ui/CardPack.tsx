import { useEffect, useRef, useState } from 'react'
import TWEEN from '@tweenjs/tween.js'
import { DuelistCard, DuelistCardHandle } from '../cards/DuelistCard';
import { FireCardsTextures } from '/src/data/cardAssets';
import { useGameAspect } from '/src/hooks/useGameApect';
import { CARD_PACK_CARD_SIZE_WIDTH, CARD_PACK_CARD_SIZE_HEIGHT } from '/src/data/cardConstants';
import { ActionButton } from './Buttons';
import { 
  PACK_ANIMATION_BAG_SLIDE_START_Y, 
  PACK_ANIMATION_BAG_SLIDE_END_Y, 
  PACK_ANIMATION_BAG_SLIDE_DURATION, 
  PACK_ANIMATION_CARD_SPAWN_DURATION,
  PACK_ANIMATION_CARD_SPAWN_SCALE_DURATION,
  PACK_ANIMATION_CARD_SPAWN_DELAY_BETWEEN,
  PACK_ANIMATION_CARD_SPAWN_START_Y,
  PACK_ANIMATION_REVEAL_BUTTON_DELAY,
  CARD_PACK_OPACITY_DURATION,
  CARD_PACK_SEAL_FALL_Y,
  CARD_PACK_SEAL_FALL_X,
  CARD_PACK_SEAL_FALL_DURATION,
  CARD_PACK_FLIP_DURATION,
  CARD_PACK_CARD_SCALE_DURATION,
  CARD_PACK_REVEAL_DELAY,
  CARD_PACK_SIZE,
  MAX_TILT
} from '/src/data/cardConstants';

interface CardPack {
  onComplete?: () => void
  style?: React.CSSProperties
  isOpen?: boolean
}

export const CardPack = ({ onComplete, style, isOpen = false }: CardPack) => {
  const [isOpening, setIsOpening] = useState(false)
  const [sealClicked, setSealClicked] = useState(false)
  const [cardsSpawned, setCardsSpawned] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [showRevealButton, setShowRevealButton] = useState(false)

  const cardPackRef = useRef<HTMLDivElement>(null)
  const innerBagRef = useRef<HTMLDivElement>(null)
  const frontBagRef = useRef<HTMLDivElement>(null)
  const flipContainerRef = useRef<HTMLDivElement>(null)
  const sealRef = useRef<HTMLDivElement>(null)
  const flipperRef = useRef<HTMLDivElement>(null)
  const cardPackCardsRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Array<DuelistCardHandle | null>>([]);
  const { aspectWidth } = useGameAspect()

  useEffect(() => {
    if (isOpen) {
      new TWEEN.Tween({ opacity: 0 })
        .to({ opacity: 1 }, CARD_PACK_OPACITY_DURATION)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(({ opacity }) => {
          cardPackRef.current?.style.setProperty('--card-pack-opacity', opacity.toString())
        })
        .start()
    } else {
      cardPackRef.current?.style.setProperty('--card-pack-opacity', '0')
    }
  }, [isOpen])

  const handleMouseMove = (e: MouseEvent) => {
    if (!cardPackRef.current || sealClicked) {
      cardPackRef.current?.style.setProperty('--card-pack-rotate-x', '0deg')
      cardPackRef.current?.style.setProperty('--card-pack-rotate-y', '0deg')
      return;
    }

    const rect = cardPackRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const relativeX = (e.clientX - centerX) / (window.innerWidth / 2);
    const relativeY = (e.clientY - centerY) / (window.innerHeight / 2);

    const rotateY = relativeX * MAX_TILT;
    const rotateX = -relativeY * MAX_TILT;

    cardPackRef.current.style.setProperty('--card-pack-rotate-x', `${rotateX}deg`)
    cardPackRef.current.style.setProperty('--card-pack-rotate-y', `${rotateY}deg`)
  }

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [sealClicked]);

  const getLinePosition = (index: number, numCards: number) => {
    const totalWidth = aspectWidth(80);
    const sectionWidth = totalWidth / numCards;
    
    let adjustedIndex;
    if (index % 2 == 0) {
      adjustedIndex = Math.ceil(index / 2);
    } else {
      adjustedIndex = numCards - Math.ceil(index / 2);
    }
    
    const x = aspectWidth(-40) +
             (sectionWidth * adjustedIndex) +
             (sectionWidth / 2)
    
    return {
      x,
      y: aspectWidth(-5)
    }
  }

  useEffect(() => {
    for (let i = 0; i < 5; i++) {
      const cardRef = cardRefs.current[i]
      if (!cardRef) continue

      cardRef.setPosition(0, aspectWidth(5), 0)
      cardRef.setCardScale(0.8, 0)
      cardRef.toggleVisibility(false)
      cardRef.setCardZIndex(50)
    }
  }, [cardRefs.current])

  const spawnCards = () => {
    if (cardsSpawned) return
    setCardsSpawned(true)

    new TWEEN.Tween({ y: PACK_ANIMATION_BAG_SLIDE_START_Y })
      .to({ 
        y: PACK_ANIMATION_BAG_SLIDE_END_Y,
      }, PACK_ANIMATION_BAG_SLIDE_DURATION)
      .easing(TWEEN.Easing.Quintic.In)
      .onUpdate(({ y }) => {
        if (cardPackRef.current && innerBagRef.current && frontBagRef.current && flipContainerRef.current) {
          const translateY = aspectWidth(y)
          cardPackRef.current.style.setProperty('--inner-bag-translate-y', `${translateY}px`)
          cardPackRef.current.style.setProperty('--front-bag-translate-y', `${translateY}px`)
          cardPackRef.current.style.setProperty('--flip-container-translate-y', `${translateY}px`)
        }
      })
      .start()

    if (cardPackCardsRef.current) {
      cardPackCardsRef.current.style.setProperty('--card-width', `${aspectWidth(CARD_PACK_CARD_SIZE_WIDTH)}px`)
      cardPackCardsRef.current.style.setProperty('--card-height', `${aspectWidth(CARD_PACK_CARD_SIZE_HEIGHT)}px`)
    }

    for (let i = 0; i < 5; i++) {
      const cardRef = cardRefs.current[i]
      if (!cardRef) continue

      const pentaPos = getLinePosition(i, 5)
      const spawnDelay = i * PACK_ANIMATION_CARD_SPAWN_DELAY_BETWEEN + PACK_ANIMATION_BAG_SLIDE_DURATION * 0.4

      setTimeout(() => {
        cardRef.setPosition(
          [0, 0, pentaPos.x], 
          [aspectWidth(PACK_ANIMATION_CARD_SPAWN_START_Y), pentaPos.y], 
          PACK_ANIMATION_CARD_SPAWN_DURATION,
          TWEEN.Easing.Sinusoidal.Out,
          TWEEN.Interpolation.Bezier
        )
        cardRef.setCardScale(
          1, 
          PACK_ANIMATION_CARD_SPAWN_SCALE_DURATION, 
          TWEEN.Easing.Sinusoidal.Out
        )
        cardRef.toggleVisibility(true)
        cardRef.toggleIdle(true)
      }, spawnDelay)
    }

    setTimeout(() => {
      setShowRevealButton(true)
    }, PACK_ANIMATION_REVEAL_BUTTON_DELAY)
  }
  
  const handleSealClick = () => {
    if (sealClicked) return
    setSealClicked(true)
    
    if (!sealRef.current || !cardPackRef.current) return

    const fallDirection = Math.random() > 0.5 ? 1 : -1
    const rotation = fallDirection * (20 + Math.random() * 20)
    
    new TWEEN.Tween({ y: -10, x: 0, rotation: 0 })
      .to({ 
        y: CARD_PACK_SEAL_FALL_Y,
        x: fallDirection * CARD_PACK_SEAL_FALL_X,
        rotation: rotation
      }, CARD_PACK_SEAL_FALL_DURATION)
      .easing(TWEEN.Easing.Quadratic.In)
      .onUpdate(({ x, y, rotation }) => {
        cardPackRef.current?.style.setProperty('--seal-translate-x', `${aspectWidth(x)}px`)
        cardPackRef.current?.style.setProperty('--seal-translate-y', `${aspectWidth(y)}px`) 
        cardPackRef.current?.style.setProperty('--seal-rotation', `${rotation}deg`)
      })
      .onComplete(() => {
        setIsOpening(true)
        
        new TWEEN.Tween({ rotation: 0 })
          .to({ rotation: 180 }, CARD_PACK_FLIP_DURATION)
          .easing(TWEEN.Easing.Back.Out)
          .onUpdate(({ rotation }) => {
            cardPackRef.current?.style.setProperty('--flipper-rotation', `${rotation}deg`)
          })
          .onComplete(() => {
            spawnCards()
            onComplete?.()
          })
          .start()
      })
      .start()
  }

  useEffect(() => {
    let animationFrameId: number
    
    const animate = () => {
      TWEEN.update()
      animationFrameId = requestAnimationFrame(animate)
    }
    
    animate()
    return () => cancelAnimationFrame(animationFrameId)
  }, [])

  useEffect(() => {
    if (!cardPackRef.current) return;

    cardPackRef.current.style.setProperty('--card-pack-size', `${CARD_PACK_SIZE}`);

    return () => {
      const pack = cardPackRef.current;
      if (!pack) return;
      pack.style.removeProperty('--card-pack-size');
    };
  }, []);

  const handleRevealAll = () => {
    setShowRevealButton(false)

    const numCards = cardRefs.current.length;
    const orderedCards = cardRefs.current.map((cardRef, index) => {
      let adjustedIndex;
      if (index % 2 == 0) {
        adjustedIndex = Math.ceil(index / 2);
      } else {
        adjustedIndex = numCards - Math.ceil(index / 2);
      }
      return {cardRef, adjustedIndex};
    })
    .sort((a, b) => a.adjustedIndex - b.adjustedIndex)
    .map(({cardRef}) => cardRef);

    orderedCards.forEach((cardRef, index) => {
      setTimeout(() => {
        cardRef?.flipCard(true, 180, CARD_PACK_FLIP_DURATION);
      }, index * CARD_PACK_REVEAL_DELAY);
    });
  }

  return (
    <>
      <div className="card-pack" ref={cardPackRef}>
        {/* Inner bag */}
        <div className="inner-bag" ref={innerBagRef} />

        {/* Front bag */}
        <div className="front-bag" ref={frontBagRef}>
          <div className="front-bag-layer-1" />
          <div className="front-bag-layer-2" />
          <div className="front-bag-layer-3" />
          <div className="front-bag-layer-4" />
        </div>

        {/* Flip container */}
        <div className={`flip-container ${isOpening ? 'opening' : ''}`} ref={flipContainerRef}>
          <div className="flipper" ref={flipperRef}>
            {/* Front cover */}
            <div className="front-cover" >
              <div className="front-cover-layer-1" />
              <div className="front-cover-layer-2" />
              <div className="front-cover-layer-3" />
              <div className="front-cover-layer-4" />
            </div>
            {/* Back cover */}
            <div className="back-cover" />
          </div>
        </div>

        {/* Seal */}
        <div 
          className={`seal ${isHovering && !sealClicked ? 'hover' : ''}`}
          onClick={handleSealClick}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          ref={sealRef}
        />

        <div className="card-pack-cards" ref={cardPackCardsRef}>
          {[...Array(5)].map((_, i) => (
            <DuelistCard
              duelistId={0}
              key={i}
              ref={el => { cardRefs.current[i] = el; }}
              width={CARD_PACK_CARD_SIZE_WIDTH}
              height={CARD_PACK_CARD_SIZE_HEIGHT}
              isLeft={false}
              isVisible={true}
              cardData={FireCardsTextures.None}
              onHover={(isHovered) => {
                if (cardRefs.current[i]) {
                  cardRefs.current[i].setCardScale(isHovered ? 1.1 : 1, CARD_PACK_CARD_SCALE_DURATION);
                  cardRefs.current[i].toggleHighlight(isHovered);
                }
              }}
              onClick={() => {
                if (cardRefs.current[i]) {
                  cardRefs.current[i].flipCard(true, 180, CARD_PACK_FLIP_DURATION);
                }
              }}
            />
          ))}
        </div>

      </div>

      <div className={`reveal-button-container NoDrag ${showRevealButton ? 'visible' : 'hidden NoMouse'}`}>
        <ActionButton large fill label='Reveal All' onClick={() => handleRevealAll()} />
      </div>
    </>
  )
}

//TODO add card pack entry animation fade in and like a spin with it inceasing size
//TODO polissh card reveal animations
//TODO connect data
//TODo adjust toscreen resizing
//TODO on click of duelist card, go to next duelist card