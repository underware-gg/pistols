import { useEffect, useRef, useState } from 'react'
import TWEEN from '@tweenjs/tween.js'
import { DuelistCard, DuelistCardHandle } from '../cards/DuelistCard';
import { FireCardsTextures } from '/src/data/cardAssets';
import { useGameAspect } from '/src/hooks/useGameAspect';
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
} from '/src/data/cardConstants';
import { useAccount } from '@starknet-react/core';
import { useDuelistsOfPlayer } from '/src/hooks/useTokenDuelists';
import { useDojoSystemCalls } from '@underware/pistols-sdk/dojo';
import { usePackType } from '/src/stores/packStore';
import { constants } from '@underware/pistols-sdk/pistols/gen'
import { useFundedStarterPackCount } from '/src/stores/bankStore';
import { Button } from 'semantic-ui-react';
import { Modal } from 'semantic-ui-react';

interface CardPack {
  onComplete?: (selectedDuelistId?: number) => void
  packType: constants.PackType,
  packId?: number
  isOpen?: boolean
  clickable?: boolean,
  cardPackSize: number,
  maxTilt: number,
  optionalTitle?: string,
  customButtonLabel?: string,
  atTutorialEnding?: boolean
}

export const CardPack = ({ packType, packId, onComplete, isOpen = false, clickable = true, cardPackSize, maxTilt, optionalTitle, customButtonLabel, atTutorialEnding = false }: CardPack) => {
  const { account } = useAccount()
  const { pack_token } = useDojoSystemCalls()
  const { duelistIds } = useDuelistsOfPlayer()
  const { quantity } = usePackType(packType)
  const { fundedCount } = useFundedStarterPackCount()
  
  const [isNoFundsModalOpen, setIsNoFundsModalOpen] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const [isOpening, setIsOpening] = useState(false)
  const [sealClicked, setSealClicked] = useState(false)
  const [cardsSpawned, setCardsSpawned] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [showRevealButton, setShowRevealButton] = useState(false)
  const [hasRevealed, setHasRevealed] = useState(false)
  const [selectedDuelistId, setSelectedDuelistId] = useState<number | undefined>()
  const [newDuelistIds, setNewDuelistIds] = useState<number[]>([])
  const [revealedDuelists, setRevealedDuelists] = useState<Set<number>>(new Set())
  const previousDuelistIdsRef = useRef<bigint[]>([])

  const _claim = async () => {
    if (packType === constants.PackType.StarterPack) {
      if (fundedCount > 0) {
        setIsClaiming(true)
        await pack_token.claim_starter_pack(account)
      } else {
        setIsNoFundsModalOpen(true)
      }
    } else if (packType === constants.PackType.GenesisDuelists5x && packId) {
      setIsClaiming(true)
      await pack_token.open(account, packId)
    }
  }

  useEffect(() => {
    if (cardPackRef.current) {
      cardPackRef.current.style.setProperty('--card-pack-opacity', '0')
    }
  }, [])

  useEffect(() => {
    if (!isClaiming) {
      previousDuelistIdsRef.current = [...duelistIds]
      return
    }

    const expectedNewIds = quantity
    const newIds = duelistIds.filter(id => !previousDuelistIdsRef.current.includes(id))

    if (newIds.length === expectedNewIds) {
      setIsClaiming(false)
      setNewDuelistIds(newIds.map(id => Number(id)))
    }
  }, [isClaiming, duelistIds, quantity])

  useEffect(() => {
    if (newDuelistIds.length > 0) {
      handleSealClick()
    }
  }, [newDuelistIds])

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

  const _close = () => {
    new TWEEN.Tween({ opacity: 1 })
      .to({ opacity: 0 }, CARD_PACK_OPACITY_DURATION)
      .easing(TWEEN.Easing.Quadratic.Out)
      .onUpdate(({ opacity }) => {
        cardPackRef.current?.style.setProperty('--card-pack-opacity', opacity.toString())
      })
      .start()
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!cardPackRef.current || sealClicked || !clickable) {
      cardPackRef.current?.style.setProperty('--card-pack-rotate-x', '0deg')
      cardPackRef.current?.style.setProperty('--card-pack-rotate-y', '0deg')
      return;
    }

    const rect = cardPackRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const relativeX = (e.clientX - centerX) / (window.innerWidth / 2);
    const relativeY = (e.clientY - centerY) / (window.innerHeight / 2);

    const rotateY = relativeX * maxTilt;
    const rotateX = -relativeY * maxTilt;

    cardPackRef.current.style.setProperty('--card-pack-rotate-x', `${rotateX}deg`)
    cardPackRef.current.style.setProperty('--card-pack-rotate-y', `${rotateY}deg`)
  }

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [sealClicked, clickable]);

  const getLinePosition = (index: number, numCards: number) => {
    const totalWidth = aspectWidth(16 * numCards);
    const sectionWidth = totalWidth / numCards;
    
    let adjustedIndex;
    if (index % 2 == 0) {
      adjustedIndex = Math.ceil(index / 2);
    } else {
      adjustedIndex = numCards - Math.ceil(index / 2);
    }
    
    const x = aspectWidth((-16 * numCards) / 2) +
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
      cardRef.setScale(0.8, 0)
      cardRef.toggleVisibility(false)
      cardRef.setZIndex(50)
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

    for (let i = 0; i < newDuelistIds.length; i++) {
      const cardRef = cardRefs.current[i]
      if (!cardRef) continue

      const pentaPos = getLinePosition(i, newDuelistIds.length)
      const spawnDelay = i * PACK_ANIMATION_CARD_SPAWN_DELAY_BETWEEN + PACK_ANIMATION_BAG_SLIDE_DURATION * 0.4

      setTimeout(() => {
        cardRef.setPosition(
          [0, 0, pentaPos.x], 
          [aspectWidth(PACK_ANIMATION_CARD_SPAWN_START_Y), pentaPos.y], 
          PACK_ANIMATION_CARD_SPAWN_DURATION,
          TWEEN.Easing.Sinusoidal.Out,
          TWEEN.Interpolation.Bezier
        )
        cardRef.setScale(
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

    cardPackRef.current.style.setProperty('--card-pack-size', `${cardPackSize}`);

    return () => {
      const pack = cardPackRef.current;
      if (!pack) return;
      pack.style.removeProperty('--card-pack-size');
    };
  }, []);

  const handleRevealAll = () => {
    if (!clickable) return
    setHasRevealed(true)

    const numCards = cardRefs.current.length;
    const orderedCards = cardRefs.current.map((cardRef, index) => {
      let adjustedIndex;
      if (index % 2 == 0) {
        adjustedIndex = Math.ceil(index / 2);
      } else {
        adjustedIndex = numCards - Math.ceil(index / 2);
      }
      return {cardRef, adjustedIndex, duelistId: newDuelistIds[index]};
    })
    .sort((a, b) => a.adjustedIndex - b.adjustedIndex)
    .filter(({duelistId}) => !revealedDuelists.has(duelistId));

    orderedCards.forEach(({cardRef, duelistId}, index) => {
      setTimeout(() => {
        cardRef?.flip(true, true, CARD_PACK_FLIP_DURATION);
        setRevealedDuelists(prev => new Set([...prev, duelistId]));
      }, index * CARD_PACK_REVEAL_DELAY);
    });
  }

  const handleButtonClick = () => {
    if (!hasRevealed) {
      handleRevealAll()
    } else {
      onComplete?.()
      setShowRevealButton(false)
      _close()
    }
  }

  const getButtonLabel = () => {
    if (!hasRevealed) return 'Reveal All'
    if (customButtonLabel) return customButtonLabel
    if (packType === constants.PackType.StarterPack && atTutorialEnding) return 'Go to Tavern!'
    return 'Close'
  }

  const isButtonDisabled = () => {
    if (!hasRevealed) return false
    if (packType === constants.PackType.StarterPack && atTutorialEnding && selectedDuelistId === undefined) return true
    return false
  }

  const handleCardClick = (id: number, cardRef: DuelistCardHandle | null) => {
    if (!revealedDuelists.has(id)) {
      cardRef?.flip(true, true, CARD_PACK_FLIP_DURATION);
      setRevealedDuelists(prev => {
        const newSet = new Set([...prev, id]);
        if (newSet.size === newDuelistIds.length) {
          setHasRevealed(true);
        }
        return newSet;
      });
    } else if (revealedDuelists.size === newDuelistIds.length) {
      if (packType === constants.PackType.StarterPack) {
        if (selectedDuelistId === id) {
          setSelectedDuelistId(undefined);
          cardRef?.setScale(1, CARD_PACK_CARD_SCALE_DURATION);
          cardRef?.toggleHighlight(false);
        } else {
          const previousCardRef = cardRefs.current.find(ref => ref?.duelistId === selectedDuelistId);
          if (previousCardRef) {
            previousCardRef.setScale(1, CARD_PACK_CARD_SCALE_DURATION);
            previousCardRef.toggleHighlight(false);
          }
          setSelectedDuelistId(id);
          cardRef?.setScale(1.1, CARD_PACK_CARD_SCALE_DURATION);
          cardRef?.toggleHighlight(true);
        }
      }
    }
  }

  return (
    <>
      <div className={`card-pack ${clickable ? 'YesMouse' : 'NoMouse'}`} ref={cardPackRef}>
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
          className={`seal ${isHovering || isClaiming  || sealClicked ? 'hover' : ''} ${isClaiming || sealClicked ? 'claiming' : ''}`}
          onClick={_claim}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          ref={sealRef}
        />

        <div className="card-pack-cards" ref={cardPackCardsRef}>
          { sealClicked && newDuelistIds.map((id, i) => (
            <DuelistCard
              duelistId={id}
              key={i}
              ref={el => { cardRefs.current[i] = el; }}
              isSmall={true}
              width={CARD_PACK_CARD_SIZE_WIDTH}
              height={CARD_PACK_CARD_SIZE_HEIGHT}
              isLeft={false}
              isVisible={false}
              isSelected={selectedDuelistId === id}
              isHighlightable={true}
              onHover={(isHovered) => {
                if (cardRefs.current[i] && id !== selectedDuelistId) {
                  cardRefs.current[i].setScale(isHovered ? 1.1 : 1, CARD_PACK_CARD_SCALE_DURATION);
                }
              }}
              onClick={() => handleCardClick(id, cardRefs.current[i])}
            />
          ))}
        </div>

      </div>

      {hasRevealed && optionalTitle && (
        <div className="card-pack-title">
          {optionalTitle}
        </div>
      )}
      <div className={`reveal-button-container NoDrag ${showRevealButton ? 'visible' : 'hidden NoMouse'}`}>
        <ActionButton 
          large 
          fill 
          label={getButtonLabel()} 
          onClick={handleButtonClick}
          disabled={isButtonDisabled()}
          dimmed
        />
      </div>

    <Modal
      size="tiny"
      open={isNoFundsModalOpen}
      className="ModalText"
    >
      <Modal.Header>
        <h3 className="Important">We're Sorry</h3>
      </Modal.Header>
      <Modal.Content>
        <p>Currently there are no starter packs available. Please contact us for assistance.</p>
      </Modal.Content>
      <Modal.Actions>
        <Button
          primary
          onClick={() => {
            window.open('https://x.com/underware_gg', '_blank') //TODO change for support page on website
            setIsNoFundsModalOpen(false)
          }}
        >
          Contact Us
        </Button>
      </Modal.Actions>
    </Modal>
    </>
  )
}

//TODO add card pack entry animation fade in and like a spin with it inceasing size
//TODO polissh card reveal animations
//TODO connect data
//TODo adjust toscreen resizing
//TODO on click of duelist card, go to next duelist card
//TODO after reveal all, add a button to collapse the duelist, zsoom them out fade out and go back to the scene (call on complete?)