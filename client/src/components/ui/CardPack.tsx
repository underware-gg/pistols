import { useEffect, useRef, useState } from 'react'
import TWEEN from '@tweenjs/tween.js'
import { DuelistCard, DuelistCardHandle } from '../cards/DuelistCard';
import { FireCardsTextures } from '/src/data/cardAssets';
import { useGameAspect } from '/src/hooks/useGameApect';
import { CARD_PACK_CARD_SIZE_WIDTH, CARD_PACK_CARD_SIZE_HEIGHT } from '/src/data/cardConstants';

const CARD_PACK_SIZE = 26;
const MAX_TILT = 30;

interface CardPack {
  onComplete?: () => void
  style?: React.CSSProperties
}

export const CardPack = ({ onComplete, style }: CardPack) => {
  const [isOpening, setIsOpening] = useState(false)
  const [sealClicked, setSealClicked] = useState(false)
  const [flipComplete, setFlipComplete] = useState(false)
  const [cardsSpawned, setCardsSpawned] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [rotation, setRotation] = useState({ x: 0, y: 0 })
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

  const packPositionRef = useRef({ x: 0, y: 0, rotation: 0, scale: 1 })

  const handleMouseMove = (e: MouseEvent) => {
    if (!cardPackRef.current || sealClicked) {
      setRotation({ x: 0, y: 0 });
      return;
    }

    const rect = cardPackRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const relativeX = (e.clientX - centerX) / (window.innerWidth / 2);
    const relativeY = (e.clientY - centerY) / (window.innerHeight / 2);

    const rotateY = relativeX * MAX_TILT;
    const rotateX = -relativeY * MAX_TILT;

    setRotation({ x: rotateX, y: rotateY });
  }

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [sealClicked]);

  const getLinePosition = (index: number, numCards: number) => {
    const totalWidth = aspectWidth(80);
    const sectionWidth = totalWidth / numCards;
    
    // Calculate alternating indices from start and end
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
      y: aspectWidth(-10)
    }
  }

  useEffect(() => {
    for (let i = 0; i < 5; i++) {
      const cardRef = cardRefs.current[i]
      if (!cardRef) continue

      // Start at pack center
      cardRef.setPosition(0, aspectWidth(5), 0)
      cardRef.setCardScale(0.8, 0)
      cardRef.toggleVisibility(false)
      cardRef.setCardZIndex(50)
    }
  }, [cardRefs.current])
  const PACK_ANIMATION = {
    BAG_SLIDE: {
      START_Y: -2,
      END_Y: 60,
      DURATION: 800,
      EASING: TWEEN.Easing.Quintic.In
    },
    CARD_SPAWN: {
      DURATION: 1200,
      SCALE_DURATION: 600,
      DELAY_BETWEEN: 50,
      START_Y: -25,
      EASING: TWEEN.Easing.Sinusoidal.Out
    },
    REVEAL_BUTTON_DELAY: 2000
  }

  const spawnCards = () => {
    if (cardsSpawned) return
    setCardsSpawned(true)

    // Animate bag sliding down
    new TWEEN.Tween({ y: PACK_ANIMATION.BAG_SLIDE.START_Y })
      .to({ 
        y: PACK_ANIMATION.BAG_SLIDE.END_Y,
      }, PACK_ANIMATION.BAG_SLIDE.DURATION)
      .easing(PACK_ANIMATION.BAG_SLIDE.EASING)
      .onUpdate(({ y }) => {
        if (cardPackRef.current && innerBagRef.current && frontBagRef.current && flipContainerRef.current) {
          const translateY = aspectWidth(y)
          innerBagRef.current.style.transform = `translate(0, ${translateY}px) translateZ(${aspectWidth(-1)}px)`
          frontBagRef.current.style.transform = `translate(0, ${translateY}px)`
          flipContainerRef.current.style.transform = `translate(0, ${translateY}px)`
        }
      })
      .start()

    if (cardPackCardsRef.current) {
      cardPackCardsRef.current.style.setProperty('--card-width', `${aspectWidth(CARD_PACK_CARD_SIZE_WIDTH)}px`)
      cardPackCardsRef.current.style.setProperty('--card-height', `${aspectWidth(CARD_PACK_CARD_SIZE_HEIGHT)}px`)
    }

    
    // Spawn cards in pentagram formation
    for (let i = 0; i < 5; i++) {
      const cardRef = cardRefs.current[i]
      if (!cardRef) continue

      const pentaPos = getLinePosition(i, 5)
      const spawnDelay = i * PACK_ANIMATION.CARD_SPAWN.DELAY_BETWEEN + PACK_ANIMATION.BAG_SLIDE.DURATION * 0.4

      setTimeout(() => {
        cardRef.setPosition(
          [0, 0, pentaPos.x], 
          [aspectWidth(PACK_ANIMATION.CARD_SPAWN.START_Y), pentaPos.y], 
          PACK_ANIMATION.CARD_SPAWN.DURATION,
          PACK_ANIMATION.CARD_SPAWN.EASING,
          TWEEN.Interpolation.Bezier
        )
        cardRef.setCardScale(
          1, 
          PACK_ANIMATION.CARD_SPAWN.SCALE_DURATION, 
          PACK_ANIMATION.CARD_SPAWN.EASING
        )
        cardRef.toggleVisibility(true)
        cardRef.toggleIdle(true)
      }, spawnDelay)
    }

    // Show reveal button after all animations complete
    setTimeout(() => {
      setShowRevealButton(true)
    }, PACK_ANIMATION.REVEAL_BUTTON_DELAY)
  }
  
  const handleSealClick = () => {
    if (sealClicked) return
    setSealClicked(true)
    
    if (!sealRef.current) return

    const fallDirection = Math.random() > 0.5 ? 1 : -1
    const rotation = fallDirection * (20 + Math.random() * 20)
    
    const sealPosition = { y: -10, x: 0, rotation: 0 }
    new TWEEN.Tween(sealPosition)
      .to({ 
        y: 60,
        x: fallDirection * 5,
        rotation: rotation
      }, 700)
      .easing(TWEEN.Easing.Quadratic.In)
      .onUpdate(() => {
        if (sealRef.current) {
          const translateX = aspectWidth(sealPosition.x)
          const translateY = aspectWidth(sealPosition.y)
          const translateZ = aspectWidth(0.5)
          sealRef.current.style.transform = `translate(${translateX}px, ${translateY}px) rotate(${sealPosition.rotation}deg) translateZ(${translateZ}px)`
        }
      })
      .onComplete(() => {
        setIsOpening(true)
        
        const flipRotation = { rotation: 0 }
        new TWEEN.Tween(flipRotation)
          .to({ rotation: 180 }, 600)
          .easing(TWEEN.Easing.Back.Out)
          .onUpdate(() => {
            if (flipperRef.current) {
              flipperRef.current.style.transform = `rotateX(${flipRotation.rotation}deg)`
            }
          })
          .onComplete(() => {
            setFlipComplete(true)
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

  const packStyle = {
    ...style,
    transform: `translate(-50%, -50%) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`
  };

  return (
    <>
      <div className="card-pack" ref={cardPackRef} style={packStyle}>
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
                  cardRefs.current[i].setCardScale(isHovered ? 1.1 : 1, 200);
                  cardRefs.current[i].toggleHighlight(isHovered);
                }
              }}
              onClick={() => {
                if (cardRefs.current[i]) {
                  cardRefs.current[i].flipCard(true, 180, 500);
                }
              }}
            />
          ))}
        </div>

      </div>

      {showRevealButton && (
        <button 
          className="reveal-button"
          onClick={() => {
            // Handle reveal all cards
          }}
        >
          Reveal All
        </button>
      )}
    </>
  )
}
