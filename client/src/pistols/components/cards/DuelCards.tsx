import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import useGameAspect from '@/pistols/hooks/useGameApect'
import { useChallenge } from '../../hooks/useChallenge'
import { useDuelist } from '../../hooks/useDuelist'
import { useIsYou } from '../../hooks/useIsYou'
import * as TWEEN from '@tweenjs/tween.js'
import { ProfilePic } from '../account/ProfilePic'
import { BladesCard, PacesCard, TacticsCard } from '@/games/pistols/generated/constants'
import { BladesCardsTextures, CardData, DodgeCardsTextures, FireCardsTextures, TacticsCardsTextures } from '../../data/assets'
import { DuelistCardType, CardHandle, Card } from './Cards'

interface DuelistCardsProps {
  isLeft: boolean
  duelistId: bigint
  onClick?: (isLeft?: boolean, shouldClose?: boolean) => void
}

interface DuelistCardsHandle {
  resetCards: () => void
  spawnCards: (cards: DuelistHand) => void
  revealCard: (cardType: DuelistCardType, speedFactor: number) => void
  expandHand: () => void
  collapseHand: () => void
  showHandDetails: () => void
  hideHandDetails: () => void
  isReadyToShow: () => boolean
  isReadyToCollapse: () => boolean
  returnActiveCard: () => boolean
}

interface EnvironmentDeckProps {
  onClick?: (isLeft?: boolean, shouldClose?: boolean) => void
}

interface EnvironmentDeckHandle {
  expand: () => void
  collapse: () => void
  shuffle: () => void
  drawCard: (speedFactor: number) => void
  isReadyToShow: () => boolean
  isReadyToCollapse: () => boolean
  returnActiveCard: () => boolean
  setCardsData: (cardsData: CardData[]) => void
}
import * as Constants from '../../data/cardConstants'

const DuelistCards = forwardRef<DuelistCardsHandle, DuelistCardsProps>((props: DuelistCardsProps, ref: React.Ref<DuelistCardsHandle>) => {
  const { isYou } = useIsYou(props.duelistId)

  const { aspectW, aspectH } = useGameAspect()

  const [ expanded, setExpanded ] = useState(false)
  const [ handDetailsShown, setHandDetailsShown ] = useState(false)

  const isAnimatingCardsRef = useRef(false);
  const currentActiveCardRef = useRef<DuelistCardType>(null);
  
  const isLeft = useMemo(() => {return props.isLeft}, [props.isLeft])

  const cardRefs = useRef<Array<{ type: DuelistCardType, ref: React.RefObject<CardHandle>, isSpawned: boolean, isFlipped: boolean, renderOrder: number }>>([
    { type: DuelistCardType.BLADE, ref: useRef<CardHandle>(null), isSpawned: false, isFlipped: false, renderOrder: 3 },
    { type: DuelistCardType.DODGE, ref: useRef<CardHandle>(null), isSpawned: false, isFlipped: false, renderOrder: 2 },
    { type: DuelistCardType.FIRE, ref: useRef<CardHandle>(null), isSpawned: false, isFlipped: false, renderOrder: 1 },
    { type: DuelistCardType.TACTICS, ref: useRef<CardHandle>(null), isSpawned: false, isFlipped: false, renderOrder: 0 },
  ])

  const gridPositions = useMemo(() => {
    return {
        [DuelistCardType.TACTICS]: { x: (isLeft ? 1 : -1) * (-aspectW * Constants.GRID_POSITION_LEFT_OFFSET), y: -aspectH * Constants.GRID_POSITION_TOP_OFFSET },
        [DuelistCardType.FIRE]: { x: (isLeft ? 1 : -1) * (-aspectW * Constants.GRID_POSITION_RIGHT_OFFSET), y: -aspectH * Constants.GRID_POSITION_TOP_OFFSET },
        [DuelistCardType.BLADE]: { x: (isLeft ? 1 : -1) * (-aspectW * Constants.GRID_POSITION_LEFT_OFFSET), y: aspectH * Constants.GRID_POSITION_BOTTOM_OFFSET },
        [DuelistCardType.DODGE]: { x: (isLeft ? 1 : -1) * (-aspectW * Constants.GRID_POSITION_RIGHT_OFFSET), y: aspectH * Constants.GRID_POSITION_BOTTOM_OFFSET },

    }
  }, [aspectW])

  const originalCardStylesRef = useRef<Record<DuelistCardType, { translateX: number; translateY: number; rotation: number }>>({
    [DuelistCardType.TACTICS]: { translateX: 0, translateY: 0, rotation: 0 },
    [DuelistCardType.FIRE]: { translateX: 0, translateY: 0, rotation: 0 },
    [DuelistCardType.BLADE]: { translateX: 0, translateY: 0, rotation: 0 },
    [DuelistCardType.DODGE]: { translateX: 0, translateY: 0, rotation: 0 },
  })
  const prevAspectRef = useRef({ aspectW: 0, aspectH: 0 })

  useImperativeHandle(ref, () => ({
    resetCards,
    spawnCards,
    revealCard,
    expandHand,
    collapseHand,
    showHandDetails,
    hideHandDetails,
    isReadyToShow,
    isReadyToCollapse,
    returnActiveCard
  }))

  useEffect(() => {
    if (prevAspectRef.current.aspectW != 0 && prevAspectRef.current.aspectH != 0) {
      const widthRatio = aspectW / prevAspectRef.current.aspectW
      const heightRatio = aspectH / prevAspectRef.current.aspectH

      Object.keys(originalCardStylesRef.current).forEach((key) => {
        const style = originalCardStylesRef.current[key as unknown as DuelistCardType];
        style.translateX *= widthRatio;
        style.translateY *= heightRatio;
      });

      if (!handDetailsShown) {
        cardRefs.current.forEach(({ type, ref, isSpawned }, index) => {
          const card = ref.current
          if (card) {
            if (isSpawned) {
              const { translateX, translateY, rotation } = originalCardStylesRef.current[type]
              card.setPosition(translateX, translateY, 0)
            } else {
              card.setPosition(0, 0, 0)
            }
          }
        })
      } else if (handDetailsShown) {
        cardRefs.current.forEach(({ type, ref }, index) => {
          const card = ref.current
          if (card) {
            card.setPosition(gridPositions[type].x, gridPositions[type].y, 0)
          }
        })
      }
    }

    prevAspectRef.current = { aspectW, aspectH }
  }, [aspectW, aspectH])

  const resetCards = () => {
    const centerX = (isLeft ? -1 : 1) * (aspectW * Constants.CARD_SPAWN_POSITION_X_OFFSET)
    const centerY = 0

    cardRefs.current.forEach((card, index) => {
      if (!card.ref.current) return

      card.isFlipped = false
      card.isSpawned = false

      switch (card.type) {
        case DuelistCardType.BLADE:
          card.renderOrder = 3;
          break;
        case DuelistCardType.DODGE:
          card.renderOrder = 2;
          break;
        case DuelistCardType.FIRE:
          card.renderOrder = 1;
          break;
        case DuelistCardType.TACTICS:
          card.renderOrder = 0;
          break;
        default:
          break;
      }

      card.ref.current.toggleVisibility(false)
      setTimeout(() => {
        card.ref.current.setPosition(centerX, centerY, 0)
        card.ref.current.setCardRotation(0, 0)
        card.ref.current.setCardZIndex(card.renderOrder + 10, 1)
        card.ref.current.flipCard(false, 0, 0)
      }, 200);
    })
  }

  const spawnCards = (cards: DuelistHand) => {
    const centerX = (isLeft ? -1 : 1) * (aspectW * Constants.CARD_SPAWN_POSITION_X_OFFSET)
    const centerY = 0
    const targetX = (isLeft ? -aspectW : aspectW) * Constants.SPAWN_CARDS_POSITION_X_OFFSET
    const targetY = aspectH * Constants.SPAWN_CARDS_POSITION_Y_OFFSET

    isAnimatingCardsRef.current = true

    cardRefs.current.forEach(({ type, ref, renderOrder }, index) => {
      const card = ref.current
      if (!card) return

      const cardRef = cardRefs.current.find(cardRef => cardRef.type === type);
      
      switch (type) {
        case DuelistCardType.TACTICS:
          card.setCardData(TacticsCardsTextures[cards.tactics])
          break;
        case DuelistCardType.FIRE:
          card.setCardData(FireCardsTextures[cards.fire])
          break;
        case DuelistCardType.DODGE:
          card.setCardData(DodgeCardsTextures[cards.dodge])
          break;
        case DuelistCardType.BLADE:
          card.setCardData(BladesCardsTextures[cards.blade])
          break;
        default:
          break;
      }

      if (!cardRef.isSpawned) {
        card.setPosition(centerX, centerY, 0)
        card.setCardRotation(0, 0)
        card.setCardZIndex(renderOrder + 10, 1)

        const angle = (isLeft ? 1 : -1) * ((renderOrder - 0.2) * (Constants.CARDS_FAN_SPREAD / 3)) * (180 / Math.PI)

        originalCardStylesRef.current[type] = { translateX: targetX, translateY: targetY, rotation: angle }

        setTimeout(() => {
          card.setPosition(targetX, targetY, Constants.SPAWN_CARDS_POSITION_DURATION)
          card.setCardRotation(angle, Constants.SPAWN_CARDS_ROTATION_DURATION)
          card.toggleVisibility(true)
          if (isYou) {
            card.flipCard(
              true, 
              isLeft ? Constants.CARD_FLIP_ROTATION : -Constants.CARD_FLIP_ROTATION,
              Constants.SPAWN_CARDS_FLIP_DURATION
            )
            if (cardRef) {
              cardRef.isFlipped = true;
            }
          }
          cardRef.isSpawned = true;
        }, renderOrder * Constants.SPAWN_CARD_DELAY) 
      }
    })

    setTimeout(() => {
      isAnimatingCardsRef.current = false
    }, Constants.BASE_SPAWN_CARD_DURATION)
  }

  const revealCard = (cardType: DuelistCardType, speedFactor: number) => {
    const cardIndex = cardRefs.current.findIndex(card => card.type === cardType)
    let cardCurrent;
    if (cardIndex !== -1) {
      const removedCard = cardRefs.current[cardIndex]
      removedCard.isFlipped = true;
      removedCard.renderOrder = 3;

      cardRefs.current.forEach((card, index) => {
        if (cardIndex !== index) {
          card.renderOrder = Math.max(card.renderOrder - 1, 0);
        }
      });

      cardCurrent = removedCard.ref.current
    } else {
      return
    }

    isAnimatingCardsRef.current = true

    const target = { 
      x: (isLeft ? 1 : -1) * (-aspectW * Constants.TARGET_END_POSITION_X_OFFSET), 
      y: aspectH * Constants.TARGET_END_POSITION_Y_OFFSET
    }
    cardCurrent.setPosition(target.x, target.y, Constants.CARD_REVEAL_TRANSOFRMS_DURATION / speedFactor, TWEEN.Easing.Back.Out)
    cardCurrent.setCardRotation(0, Constants.CARD_REVEAL_TRANSOFRMS_DURATION / speedFactor, TWEEN.Easing.Back.Out)
    cardCurrent.setCardScale(1.2, Constants.CARD_REVEAL_TRANSOFRMS_DURATION / speedFactor, TWEEN.Easing.Back.Out)

    const targetX = (isLeft ? -aspectW : aspectW) * Constants.SPAWN_CARDS_POSITION_X_OFFSET
    const targetY = aspectH * Constants.SPAWN_CARDS_POSITION_Y_OFFSET

    cardRefs.current.forEach(({ type, ref, renderOrder }, index) => {
      const card = ref.current
      if (!card) return

      const angle = (isLeft ? 1 : -1) * ((renderOrder - 0.4) * (Constants.CARDS_FAN_SPREAD / 3)) * (180 / Math.PI)

      originalCardStylesRef.current[type] = { translateX: targetX, translateY: targetY, rotation: angle }

      if (type == cardType) {
        setTimeout(() => {
          card.flipCard(
            true, 
            isLeft ? Constants.CARD_FLIP_ROTATION : -Constants.CARD_FLIP_ROTATION, 
            Constants.CARD_REVEAL_FLIP_DURATION / speedFactor, 
            TWEEN.Easing.Back.Out
          )
          card.setCardZIndex(renderOrder + 5, 1)
        }, Constants.CARD_REVEAL_FLIP_DELAY / speedFactor)
        setTimeout(() => {
          card.setPosition(targetX, targetY, Constants.CARD_REVEAL_TRANSOFRMS_DURATION / speedFactor)
          card.setCardRotation(angle, Constants.CARD_REVEAL_TRANSOFRMS_DURATION / speedFactor)
          cardCurrent.setCardScale(1, Constants.CARD_REVEAL_TRANSOFRMS_DURATION / speedFactor)
        }, Constants.CARD_REVEAL_TRANSORMS_DELAY / speedFactor)
      } else {
        setTimeout(() => {
          card.setPosition(targetX, targetY, Constants.CARD_REVEAL_POSITION_DURATION / speedFactor)
          card.setCardRotation(angle, Constants.CARD_REVEAL_ROTATION_DURATION / speedFactor)
          card.setCardZIndex(renderOrder + 5, 1)
        }, renderOrder * Constants.CARD_REVEAL_SLIDE_TRANSFORMS_DELAY / speedFactor)
      }
    })

    setTimeout(() => {
      isAnimatingCardsRef.current = false
    }, Constants.BASE_CARD_REVEAL_DURATION / speedFactor)
  }

  const expandHand = () => {
    if (isAnimatingCardsRef.current || expanded) return
    isAnimatingCardsRef.current = true
    setExpanded(true)

    cardRefs.current.forEach(({ type, ref }, index) => {
      const card = ref.current
      if (!card) return
      
      card.toggleHighlight(true)
      card.toggleIdle(true)

      card.setCardScale(Constants.EXPAND_HAND_CARD_SCALE, Constants.EXPAND_HAND_CARD_SCALE_DURATION)
    })

    setTimeout(()=> {
      isAnimatingCardsRef.current = false
    }, Constants.EXPAND_HAND_BASE_DURATION)
  }

  let collapseTimeout
  const collapseHand = () => {
    if (!expanded) return

    clearTimeout(collapseTimeout)
    clearTimeout(collapseDelay)

    if (isAnimatingCardsRef.current) {
      collapseTimeout = setTimeout(collapseHand, 200)
      return
    }
    
    isAnimatingCardsRef.current = true
    setExpanded(false)
    
    cardRefs.current.forEach(({ type, ref }, index) => {
      const card = ref.current
      if (!card) return

      card.toggleHighlight(false)
      card.toggleIdle(false)

      card.setCardScale(1)
    })

    setTimeout(()=> {
      isAnimatingCardsRef.current = false
    }, Constants.EXPAND_HAND_BASE_DURATION)
  }

  const showHandDetails = () => {
    if (isAnimatingCardsRef.current || handDetailsShown) return
    isAnimatingCardsRef.current = true
    setHandDetailsShown(true)

    cardRefs.current.forEach(({ type, ref, renderOrder }, index) => {
      const card = ref.current
      if (!card) return

      card.toggleHighlight(false)
      card.toggleIdle(true)
      
      setTimeout(() => {
        card.setPosition(gridPositions[type].x, gridPositions[type].y, Constants.HAND_DETAILS_POSITION_DURATION)
        card.setCardRotation(0, Constants.HAND_DETAILS_ROTATION_DURATION)
        card.setCardScale(Constants.HAND_DETAILS_SCALE, Constants.HAND_DETAILS_SCALE_DURATION)
        setTimeout(() => {
          card.setCardZIndex(1001 + renderOrder)
        }, Constants.HAND_DETAILS_Z_INDEX_MAX_DELAY - (renderOrder * Constants.HAND_DETAILS_DELAY))
      }, renderOrder * Constants.HAND_DETAILS_DELAY)
    })

    setTimeout(()=> {
      isAnimatingCardsRef.current = false
    }, Constants.HAND_DETAILS_BASE_DURATION)
  }

  const hideHandDetails = () => {
    if (isAnimatingCardsRef.current || !handDetailsShown) return
    
    isAnimatingCardsRef.current = true
    setHandDetailsShown(false)
    setExpanded(false)

    cardRefs.current.forEach(({ type, ref, renderOrder }, index) => {
      const card = ref.current
      if (!card) return

      setTimeout(() => {
        const { translateX, translateY, rotation } = originalCardStylesRef.current[type]
        card.setPosition(translateX, translateY, Constants.HAND_DETAILS_POSITION_DURATION)
        card.setCardRotation(rotation, Constants.HAND_DETAILS_ROTATION_DURATION)
        card.setCardScale(1, Constants.HAND_DETAILS_SCALE_DURATION)
        card.toggleIdle(false)
        setTimeout(() => {
          card.setCardZIndex(renderOrder + 5, 1)
        }, Constants.HAND_DETAILS_Z_INDEX_DELAY)
      }, renderOrder * Constants.HAND_DETAILS_DELAY)
    })

    setTimeout(()=> {
      isAnimatingCardsRef.current = false
    }, Constants.HAND_DETAILS_BASE_DURATION)
  }

  const isReadyToCollapse = () => {
    return !isAnimatingCardsRef.current && handDetailsShown
  }

  const isReadyToShow = () => {
    return !isAnimatingCardsRef.current && !handDetailsShown
  }

  let collapseDelay
  const handleCardHover = (isHovered: boolean, cardType: number) => {
    if (handDetailsShown) return

    if (collapseDelay) clearTimeout(collapseDelay)

    if (isHovered) {
      expandHand()
    } else {
      collapseDelay = setTimeout(() => {
        collapseHand()
      }, 50)
    }
  }

  const handleCardClick = (cardType: number, e: React.MouseEvent) => {
    if (!handDetailsShown) {
      props.onClick()
    } else {
      const cardRef = cardRefs.current.find(card => card.type == cardType)

      if (!cardRef.isFlipped || isAnimatingCardsRef.current) return

      props.onClick(isLeft, true)

      const card = cardRef.ref.current
      isAnimatingCardsRef.current = true

      returnActiveCard(false)

      if (currentActiveCardRef.current != cardType) {
        currentActiveCardRef.current = cardType

        card.toggleHighlight(false)
        card.flipCard(true, isLeft ? Constants.CARD_DETAIL_FLIP_ROTATION : -Constants.CARD_DETAIL_FLIP_ROTATION, Constants.CARD_DETAILS_FLIP_DURATION, TWEEN.Easing.Quartic.InOut)
        card.setPosition(0, 0, Constants.CARD_DETAILS_POSITION_DURATION, TWEEN.Easing.Quartic.InOut)
        card.setCardScale(Constants.CARD_DETAIL_SCALE, Constants.CARD_DETAILS_SCALE_DURATION, TWEEN.Easing.Quartic.InOut)
        card.setCardZIndex(1100)
      } else {
        currentActiveCardRef.current = null
      }

      setTimeout(() => {
        isAnimatingCardsRef.current = false
      }, Constants.CARD_DETAILS_BASE_DURATION)
      
    }
  }

  const returnActiveCard = (reset: boolean = true) => {
    if (currentActiveCardRef.current != null) {
      if (reset) isAnimatingCardsRef.current = true

      const oldCardIndex = cardRefs.current.findIndex(card => card.type == currentActiveCardRef.current)
      const oldCard = cardRefs.current[oldCardIndex].ref.current

      oldCard.flipCard(true, isLeft ? Constants.CARD_FLIP_ROTATION : -Constants.CARD_FLIP_ROTATION, 0)
      oldCard.setPosition(gridPositions[currentActiveCardRef.current].x, gridPositions[currentActiveCardRef.current].y, Constants.RETURN_CARD_POSITION_DURATION, TWEEN.Easing.Quadratic.Out, TWEEN.Interpolation.Linear)
      oldCard.setCardScale(Constants.EXPAND_HAND_CARD_SCALE, Constants.RETURN_CARD_SCALE_DURATION, TWEEN.Easing.Quadratic.InOut, TWEEN.Interpolation.Linear)
      setTimeout(() => {
        oldCard.setCardZIndex(1001 + oldCardIndex)
      }, Constants.RETURN_CARD_Z_INDEX_DELAY);

      if (reset) {
        currentActiveCardRef.current = null
        setTimeout(() => {
          isAnimatingCardsRef.current = false
        }, Constants.RETURN_CARD_BASE_DURATION)
      }

      return true
    } else {
      return false
    }
  }

  return (
    <>
      {cardRefs.current.map(({ type, ref }, index) => (
          <Card
            key={index}
            ref={ref}
            isLeft={isLeft}
            isFlipped={false}
            isDraggable={true}
            isHighlightable={handDetailsShown}
            width={Constants.CARD_WIDTH}
            height={Constants.CARD_HEIGHT}
            onHover={(isHovered) => handleCardHover(isHovered, type)}
            onClick={(e) => handleCardClick(type, e)}
          />
      ))}
    </>
  )
})

const EnvironmentDeck = forwardRef<EnvironmentDeckHandle, EnvironmentDeckProps>((props: EnvironmentDeckProps, ref: React.Ref<EnvironmentDeckHandle>) => {
  const [cards,  setCards] = useState<{ ref: React.RefObject<CardHandle>, id: number, isDrawn: boolean }[]>([]);
  const [drawnCardsCount, setDrawnCardsCount] = useState(0);

  const [ expanded, setExpanded ] = useState(false)
  
  const currentActiveCardRef = useRef<DuelistCardType>(null);
  const isAnimatingCardsRef = useRef(false);
  
  const { aspectWidth, aspectW, aspectH } = useGameAspect();

  const emptyCards: React.RefObject<HTMLDivElement>[] = Array.from({ length: Constants.DRAW_CARDS_NUMBER }, () => React.createRef<HTMLDivElement>())

  const gridPositions = useMemo(() => {
    return Array.from({ length: Constants.DRAW_CARDS_NUMBER }, (_, index) => ({
      x:  (- aspectW * Constants.CARD_GRID_POSITION_X_OFFSET) + ((aspectW / Constants.DRAW_CARDS_NUMBER) / 2) + ((aspectW / Constants.DRAW_CARDS_NUMBER) * (drawnCardsCount - 1 - index)),
      y: aspectH * Constants.CARD_GRID_POSITION_Y_OFFSET,
    }));
  }, [aspectW, drawnCardsCount])

  useImperativeHandle(ref, () => ({
    expand,
    collapse,
    shuffle,
    drawCard,
    isReadyToShow,
    isReadyToCollapse,
    returnActiveCard,
    setCardsData
  }))

  useEffect(() => {
    const newCards = Array(Constants.DECK_SIZE).fill(null).map((_, index) => ({
      ref: React.createRef<CardHandle>(),
      background: React.createRef<HTMLDivElement>(),
      id: index,
      isDrawn: false,
    }));
    setCards(newCards);
    setDrawnCardsCount(0);
  }, []);

  useEffect(() => {
    if (cards.length > 0) {
      cards.forEach((card, i) => {
        if (card.ref.current) {
          const cardComponent = card.ref.current;
          const targetX = i * Constants.CARD_DECK_CARD_X_OFFSET + (aspectW * Constants.CARD_DECK_POSITION_X_OFFSET)
            const targetY = -i * Constants.CARD_DECK_CARD_Y_OFFSET + (aspectH * Constants.CARD_GRID_POSITION_Y_OFFSET)
          //Positioning the deck when spawned
          setTimeout(() => {
            cardComponent.setPosition(targetX, targetY, 400);
          }, 200 * Math.random())
          cardComponent.setCardRotation(0);
          cardComponent.setCardScale(1);
          cardComponent.setCardZIndex(100 + i, i);
          setTimeout(() => {
            cardComponent.toggleVisibility(true);
          }, 1000)
        }
      });
    }
  }, [cards]);

  useEffect(() => {
    const gridPositions = Array.from({ length: Constants.DRAW_CARDS_NUMBER }, (_, index) => ({
      x:  (- aspectW * Constants.CARD_GRID_POSITION_X_OFFSET) + ((aspectW / Constants.DRAW_CARDS_NUMBER) / 2) + ((aspectW / Constants.DRAW_CARDS_NUMBER) * (index)),
      y: aspectH * Constants.CARD_GRID_POSITION_Y_OFFSET,
    }));
    emptyCards.forEach((card, i) => {
      if (card.current) {
        card.current.style.setProperty('--card-width', `${aspectWidth(Constants.CARD_WIDTH)}px`)
        card.current.style.setProperty('--card-height', `${aspectWidth(Constants.CARD_HEIGHT)}px`)
        card.current.style.setProperty('--card-translate-x', `${gridPositions[i].x}px`)
        card.current.style.setProperty('--card-translate-y', `${gridPositions[i].y}px`)
      }
    });
  }, [emptyCards]);

  useEffect(() => {
    if (cards.length > 0) {
      let drawCount = 0

      cards.forEach((card, i) => {
        if (card.ref.current) {
          const cardComponent = card.ref.current;
          if (!card.isDrawn && !expanded) {
            const targetX = i * Constants.CARD_DECK_CARD_X_OFFSET + (aspectW * Constants.CARD_DECK_POSITION_X_OFFSET)
            const targetY = -i * Constants.CARD_DECK_CARD_Y_OFFSET + (aspectH * Constants.CARD_GRID_POSITION_Y_OFFSET)
            cardComponent.setPosition(targetX, targetY, 0);
          } else if (card.isDrawn && expanded) {

            const targetX = gridPositions[drawCount].x
            const targetY = gridPositions[drawCount].y
            cardComponent.setPosition(targetX, targetY, 0);

            drawCount++
          } else if (card.isDrawn) {
            const spacing = aspectWidth(Constants.CARD_WIDTH) * Constants.CARD_SPACING
            const targetX = (-aspectW * Constants.CARD_DECK_POSITION_X_OFFSET) + (spacing * ((drawnCardsCount - 1) - drawCount));
            const targetY = (aspectH * Constants.CARD_GRID_POSITION_Y_OFFSET)
            cardComponent.setPosition(targetX, targetY, 0);

            drawCount++
          } else {
            const targetX = i * Constants.CARD_DECK_CARD_X_OFFSET + (aspectW * Constants.CARD_DECK_POSITION_X_OFFSET)
            const targetY = -i * Constants.CARD_DECK_CARD_Y_OFFSET + (aspectH * Constants.CARD_GRID_POSITION_Y_OFFSET)
            cardComponent.setPosition(targetX, targetY, 0);
          }
        }
      });
    }
  }, [aspectW]);

  const dealCards = () => {
    const left = [];
    const right = [];

    const deckWidth = aspectWidth(Constants.CARD_WIDTH);

    let shouldWait = false
    if (drawnCardsCount > 0) {
      const drawnCards = cards.filter((card) => card.isDrawn)
      drawnCards.forEach((card, i) => {
        if (card.ref.current) {
          const cardComponent = card.ref.current;
          const targetX = card.id * Constants.CARD_DECK_CARD_X_OFFSET + (aspectW * Constants.CARD_DECK_POSITION_X_OFFSET)
          const targetY = -card.id * Constants.CARD_DECK_CARD_Y_OFFSET + (aspectH * Constants.CARD_GRID_POSITION_Y_OFFSET)
          setTimeout(() => {
            cardComponent.setPosition(targetX, targetY, 800);
            cardComponent.setCardRotation(0);
            cardComponent.setCardScale(1);
          }, i * 100)
          setTimeout(() => {
            cardComponent.flipCard(false, 0)
          }, i * 100 + 100);
          setTimeout(() => {
            cardComponent.setCardZIndex(100 + card.id, card.id);
          }, i * 100 + 400);

          card.isDrawn = false
        }
      });

      shouldWait = true
    }

    setTimeout(() => {
      cards.forEach((card, i) => {
        if (card.ref.current) {
          const cardComponent = card.ref.current;
          const direction = Math.random() < 0.5 ? -1 : 1;
          const targetArray = direction < 0 ? left : right;
          
          targetArray.push(card);

          setTimeout(() => {
            const offsetX = direction * deckWidth * 0.55;
            const targetX = i * Constants.CARD_DECK_CARD_X_OFFSET + (aspectW * Constants.CARD_DECK_POSITION_X_OFFSET)
            const targetY = -i * Constants.CARD_DECK_CARD_Y_OFFSET + (aspectH * Constants.CARD_GRID_POSITION_Y_OFFSET)
            cardComponent.setPosition(targetX + offsetX, targetY, 250, TWEEN.Easing.Quadratic.Out);
          }, i * 5);
        }
      });

      setTimeout(() => {
        const newDeck = [];
        while (left.length || right.length) {
          if (Math.random() < 0.5) {
            const card = left.length ? left.shift() : right.shift()
            card.id = newDeck.length
            newDeck.push(card);
          } else {
            const card = right.length ? right.shift() : left.shift()
            card.id = newDeck.length
            newDeck.push(card);
          }
        }

        setCards(newDeck);
      }, cards.length * 5 + 220);
    }, shouldWait ? 850 + drawnCardsCount * 100 : 0);

    setDrawnCardsCount(0)
  };

  const shuffle = () => {
    dealCards()
    setTimeout(() => { dealCards() }, cards.length * 5 + 1220)
  }

  const drawCard = (speedFactor: number) => {
    if (drawnCardsCount > 9) return
    if (cards.length === 0) return

    const firstCard = cards[cards.length - 1 - drawnCardsCount]

    if (firstCard && firstCard.ref) {
        const cardComponent = firstCard.ref.current;

        if (cardComponent) {

            isAnimatingCardsRef.current = true

            const middlePointX1 = (aspectW * 0.1)
            const middlePointX2 = 0
            const middlePointX3 = (-aspectW * 0.1)
            const middlePointY1 = (aspectH * 0.1)
            
            const targetX = (-aspectW * Constants.CARD_DECK_POSITION_X_OFFSET) + (aspectWidth(Constants.CARD_WIDTH) * Constants.CARD_SPACING * drawnCardsCount);
            const targetY = (aspectH * Constants.CARD_GRID_POSITION_Y_OFFSET)

            const xPositions = [
              middlePointX1, 
              ...Array(Constants.DRAW_CARD_PATH_POINTS_COUNT - 3).fill(middlePointX2),
              middlePointX3, 
              targetX
            ];

            const yPositions = [
              ...Array(Constants.DRAW_CARD_PATH_POINTS_COUNT - 1).fill(middlePointY1),
              targetY
            ];
            
            cardComponent.setPosition(
              xPositions, 
              yPositions, 
              Constants.DRAW_CARD_POSITION_DURATION / speedFactor, 
              TWEEN.Easing.Sinusoidal.InOut, 
              TWEEN.Interpolation.Bezier
            );

            setTimeout(() => {
              cardComponent.setCardScale(Constants.DRAW_CARD_TOP_CARD_SCALE, Constants.DRAW_CARD_SCALE_DURATION / speedFactor)
            }, Constants.DRAW_CARD_SCALE_DELAY / speedFactor)
            setTimeout(() => {
              cardComponent.setCardScale(1, Constants.DRAW_CARD_RESET_SCALE_DURATION / speedFactor)
            }, Constants.DRAW_CARD_RESET_SCALE_DELAY / speedFactor)
            setTimeout(() => {
              cardComponent.toggleHighlight(true)
            }, Constants.DRAW_CARD_HIGHLIGHT_DELAY / speedFactor)
            setTimeout(() => {
              cardComponent.toggleHighlight(false)
            }, Constants.DRAW_CARD_RESET_HIGHLIGHT_DELAY / speedFactor)
            setTimeout(() => {
              cardComponent.flipCard(true, -Constants.CARD_FLIP_ROTATION, Constants.DRAW_CARD_FLIP_DURATION / speedFactor, TWEEN.Easing.Quartic.InOut);
            }, Constants.DRAW_CARD_FLIP_DELAY / speedFactor)
            cardComponent.setCardZIndex(100 + firstCard.id + (drawnCardsCount * 2), firstCard.id + (drawnCardsCount * 2))

            firstCard.isDrawn = true
            setDrawnCardsCount(prevValue => prevValue + 1)

            setTimeout(() => {
              isAnimatingCardsRef.current = false
            }, Constants.DRAW_CARD_BASE_DURATION / speedFactor)
        }
    }
  }

  const setCardsData = (cardsData: CardData[]) => {
    if (cards.length === 0) return

    for (let i = 0; i < cardsData.length; i++) {
      const card = cards[cards.length - 1 - i]
      card.ref.current.setCardData(cardsData[i])
    }
  }

  const expand = () => {
    if (isAnimatingCardsRef.current || expanded) return
    isAnimatingCardsRef.current = true
    setExpanded(true)

    Object.entries(cards.filter((card) => card.isDrawn )).forEach((cardData, index) => {
      const card = cardData[1].ref.current
      if (!card) return

      card.toggleHighlight(false)
      card.toggleIdle(true)

      setTimeout(() => {
        card.setPosition(gridPositions[index].x, gridPositions[index].y, Constants.EXPAND_DECK_POSITION_DURATION)
        card.setCardRotation(0, Constants.EXPAND_DECK_ROTATION_DURATION)
        card.setCardScale(Constants.EXPANDED_DECK_CARD_SCALE, Constants.EXPAND_DECK_SCALE_DURATION)
        card.setCardZIndex(1201 - cardData[1].id, 1101 - cardData[1].id)
      }, index * Constants.EXPAND_DECK_TRANSOFORM_DELAY)
    })

    setTimeout(()=> {
      isAnimatingCardsRef.current = false
    }, Constants.EXPAND_DECK_BASE_DURATION)
  }

  const collapse = () => {
    if (isAnimatingCardsRef.current || !expanded) return
    isAnimatingCardsRef.current = true
    setExpanded(false)

    const gridPositionsCollapse = Array.from({ length: Constants.DRAW_CARDS_NUMBER }, (_, index) => ({
      x:  (-aspectW * Constants.CARD_DECK_POSITION_X_OFFSET) + (aspectWidth(Constants.CARD_WIDTH) * Constants.CARD_SPACING * index),
      y: aspectH * Constants.CARD_GRID_POSITION_Y_OFFSET,
    }));

    Object.entries(cards.filter((card) => card.isDrawn ).reverse()).forEach((cardData, index) => {
      const card = cardData[1].ref.current
      if (!card) return

      card.toggleHighlight(false)
      card.toggleIdle(false)

      setTimeout(() => {
        card.setPosition(gridPositionsCollapse[index].x, gridPositionsCollapse[index].y, Constants.EXPAND_DECK_POSITION_DURATION)
        card.setCardRotation(0, Constants.EXPAND_DECK_ROTATION_DURATION)
        card.setCardScale(1, Constants.EXPAND_DECK_SCALE_DURATION)
      }, index * Constants.EXPAND_DECK_TRANSOFORM_DELAY)

      setTimeout(() => {
        card.setCardZIndex(100 + cardData[1].id + index * 2, cardData[1].id + index * 2)
      }, Constants.EXPAND_DECK_Z_INDEX_DELAY);
    })

    setTimeout(()=> {
      isAnimatingCardsRef.current = false
    }, Constants.EXPAND_DECK_BASE_DURATION)
  }

  const handleCardHover = (isHovered: boolean, cardId: number) => {
    if (expanded || isAnimatingCardsRef.current) return
    if (!cards.find((card) => card.id == cardId).isDrawn) return

    const drawnCards = cards.filter((card) => card.isDrawn)
    drawnCards.forEach((card) => {
      card.ref.current.toggleHighlight(isHovered, true)
      card.ref.current.toggleIdle(isHovered)
    })
  }

  const handleCardClick = (cardId: number, e: React.MouseEvent) => {
    const cardRef = cards.find((card) => card.id == cardId)
    if (!cardRef.isDrawn) return
    props.onClick()

    if (!expanded) {
      props.onClick()
    } else {
      if (isAnimatingCardsRef.current) return

      props.onClick(null, true)

      const card = cardRef.ref.current
      isAnimatingCardsRef.current = true

      returnActiveCard(false)

      if (currentActiveCardRef.current != cardId) {
        currentActiveCardRef.current = cardId

        card.toggleHighlight(false)
        card.flipCard(true, -Constants.CARD_DETAIL_FLIP_ROTATION, Constants.CARD_DETAILS_FLIP_DURATION, TWEEN.Easing.Quartic.InOut)
        card.setPosition(0, 0, Constants.CARD_DETAILS_POSITION_DURATION, TWEEN.Easing.Quartic.InOut)
        card.setCardScale(Constants.CARD_DETAIL_SCALE, Constants.CARD_DETAILS_SCALE_DURATION, TWEEN.Easing.Quartic.InOut)
        card.setCardZIndex(1100)
      } else {
        currentActiveCardRef.current = null
      }

      setTimeout(() => {
        isAnimatingCardsRef.current = false
      }, Constants.CARD_DETAILS_BASE_DURATION)
      
    }
  }

  const returnActiveCard = (reset: boolean = true) => {
    if (currentActiveCardRef.current != null) {
      if (reset) isAnimatingCardsRef.current = true

      const oldCardIndex = cards.findIndex(card => card.id == currentActiveCardRef.current)
      const gridIndex = cards.filter((card) => card.isDrawn ).findIndex(card => card.id == currentActiveCardRef.current)
      const oldCard = cards[oldCardIndex].ref.current

      oldCard.flipCard(true, -Constants.CARD_FLIP_ROTATION, 0)
      oldCard.setPosition(gridPositions[gridIndex].x, gridPositions[gridIndex].y, Constants.RETURN_CARD_POSITION_DURATION, TWEEN.Easing.Quadratic.Out, TWEEN.Interpolation.Linear)
      oldCard.setCardScale(Constants.EXPANDED_DECK_CARD_SCALE, Constants.RETURN_CARD_SCALE_DURATION, TWEEN.Easing.Quadratic.InOut, TWEEN.Interpolation.Linear)
      setTimeout(() => {
        oldCard.setCardZIndex(1001 + oldCardIndex)
      }, Constants.RETURN_CARD_Z_INDEX_DELAY);

      if (reset) {
        currentActiveCardRef.current = null
        setTimeout(() => {
          isAnimatingCardsRef.current = false
        }, Constants.RETURN_CARD_BASE_DURATION)
      }

      return true
    } else {
      return false
    }
  }

  const isReadyToShow = () => {
    return !isAnimatingCardsRef.current && !expanded
  }

  const isReadyToCollapse = () => {
    return !isAnimatingCardsRef.current && expanded
  }

  return (
    <>
      {cards.map((card) => (
        <Card
          key={card.id}
          ref={card.ref}
          isLeft={false}
          isHighlightable={card.isDrawn && expanded}
          width={Constants.CARD_WIDTH}
          height={Constants.CARD_HEIGHT}
          isVisible={false}
          onHover={(isHovered) => handleCardHover(isHovered, card.id)}
          onClick={(e) => handleCardClick(card.id, e)}
        />
      ))}

      {emptyCards.map((card, index) => (
        <div id='dashed-outline' className={expanded && drawnCardsCount < (index + 1) ? 'visible' : ''} ref={card} key={`empty-card-${index}`} />
      ))}
    </>
  );
});

const PlayerStats = ({ duelistId, isLeft, damage, hitChance }) => {

  const { name, profilePic } = useDuelist(duelistId)
  const { isYou } = useIsYou(duelistId)

  const contentLength = useMemo(() => Math.floor(name.length/10), [name])

  return (
    <div id="player-stats" className={`${isLeft ? 'left' : 'right'} NoDrag NoMouse`}>
      <div className={ isLeft ? 'grid-data left' : 'grid-data right' }>
        {isLeft ? (
          <>
            <div className="label">Tactics</div>
            <div className="label">Fire</div>
            <div className="label">Blade</div>
            <div className="label">Dodge</div>
          </>
        ) : (
          <>
            <div className="label">Fire</div>
            <div className="label">Tactics</div>
            <div className="label">Dodge</div>
            <div className="label">Blade</div>
          </>
        )}
        
      </div>
      <div className={ isLeft ? 'data-window left' : 'data-window right' }>
        <div>
          <ProfilePic className='NoMouse NoDrag profile-picture' duel profilePic={profilePic} />
          <img className='NoMouse NoDrag profile-outline' src='/images/ui/duel/card_details/profile_border.png' />
        </div>
        <div className='value-name' data-contentlength={contentLength}>{name}</div>
        <div className='data'>
          <div className="text-container">
            <div className="label red">Damage:</div>
            <div className="value red">{damage}/3</div>
          </div>
          <div className="text-container">
            <div className="label yellow">Hit chace:</div>
            <div className="value yellow">{hitChance}%</div>
          </div>
        </div>

      </div>
    </div>
  )
}

const Cards = forwardRef<CardsHandle, { duelId: string }>(({ duelId }, ref) => {
  const { duelistIdA, duelistIdB } = useChallenge(duelId)

  const [isOverlayVisible, setIsOverlayVisible] = useState(false)

  const duelistAHand = useRef<DuelistCardsHandle>(null)
  const duelistBHand = useRef<DuelistCardsHandle>(null)
  const environmentDeck = useRef<EnvironmentDeckHandle>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  const [statsA, setStatsA] = useState<{ damage: number, hitChance: number }>({ damage: 1, hitChance: 50 })
  const [statsB, setStatsB] = useState<{ damage: number, hitChance: number }>({ damage: 1, hitChance: 50 })

  useImperativeHandle(ref, () => ({
    resetCards,
    spawnCards,
    drawNextCard,
    revealCard,
    updateDuelistData,
    setAllEnvCards
  }));

  const resetCards = () => {
    environmentDeck.current.shuffle()
    duelistAHand.current.resetCards()
    duelistBHand.current.resetCards()
  }

  const spawnCards = (duelist: string, cards: DuelistHand) => {
    if (duelist == 'A') {
      duelistAHand.current.spawnCards(cards)
    } else {
      duelistBHand.current.spawnCards(cards)
    }
  }

  const drawNextCard = (speedFactor: number) => {
    environmentDeck.current.drawCard(speedFactor)
  }

  const revealCard = (duelist: string, type: DuelistCardType, speedFactor: number) => {
    if (duelist == 'A') {
      duelistAHand.current.revealCard(type, speedFactor)
    } else {
      duelistBHand.current.revealCard(type, speedFactor)
    }
  }

  const updateDuelistData = (damageA: number, damageB: number, hitChanceA: number, hitChanceB: number) => {
    setStatsA({ damage: damageA, hitChance: hitChanceA })
    setStatsB({ damage: damageB, hitChance: hitChanceB })
  }


  useEffect(() => {
    const handleKeyDown = (event) => {
      switch (event.key) {
        case 'Escape':
          collapse()
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const setAllEnvCards = (cardsData: CardData[]) => {
    environmentDeck.current.setCardsData(cardsData)
  }

  const handleClick = (isLeft?: boolean, shouldClose?: boolean) => {
    if (shouldClose) {
      if (isLeft == true) {
        duelistBHand.current.returnActiveCard()
        environmentDeck.current.returnActiveCard()
      } else if (isLeft == false) {
        duelistAHand.current.returnActiveCard()
        environmentDeck.current.returnActiveCard()
      } else {
        duelistBHand.current.returnActiveCard()
        duelistAHand.current.returnActiveCard()
      }
    } else {
      if (!duelistAHand.current.isReadyToShow() || !duelistBHand.current.isReadyToShow() || !environmentDeck.current.isReadyToShow()) return
      duelistBHand.current.showHandDetails()
      duelistAHand.current.showHandDetails()
      environmentDeck.current.expand()
      
      setTimeout(() => {
        setIsOverlayVisible(true)
      }, 600)

      setTimeout(() => {
        overlayRef.current.addEventListener('click', handleGlobalClick)
      }, 100)
    }
  }

  const handleGlobalClick = useCallback((event: MouseEvent) => {
    if (!duelistAHand.current.returnActiveCard() &&
        !duelistBHand.current.returnActiveCard() && 
        !environmentDeck.current.returnActiveCard()
    ) {
      collapse()
    }
  }, [duelistAHand, duelistBHand, overlayRef, environmentDeck])

  const collapse = () => {
    if (!duelistAHand.current.isReadyToCollapse() || !duelistBHand.current.isReadyToCollapse() || !environmentDeck.current.isReadyToCollapse()) return
    duelistAHand.current.hideHandDetails()
    duelistBHand.current.hideHandDetails()

    environmentDeck.current.collapse()

    setIsOverlayVisible(false)

    overlayRef.current.removeEventListener('click', handleGlobalClick)
  }

  return (
    <>
      <div id="overlay" className={isOverlayVisible ? 'visible' : ''} ref={overlayRef}>
        <div className='background'/>
        <PlayerStats duelistId={duelistIdA} isLeft={true} damage={statsA.damage} hitChance={statsA.hitChance} />
        <PlayerStats duelistId={duelistIdB} isLeft={false} damage={statsB.damage} hitChance={statsB.hitChance} />
        <div className='env-divider' />
        <div className='NoMouse NoDrag close-button'/>
      </div>

      <EnvironmentDeck onClick={handleClick} ref={environmentDeck}/>
      <DuelistCards duelistId={duelistIdA} isLeft={true} onClick={handleClick} ref={duelistAHand}/>
      <DuelistCards duelistId={duelistIdB} isLeft={false} onClick={handleClick} ref={duelistBHand}/>
    </>
  )
})

export interface CardsHandle {
  resetCards: () => void
  spawnCards: (duelist: string, cards: DuelistHand) => void
  drawNextCard: (speedFactor: number) => void
  revealCard: (duelist: string, type: DuelistCardType, speedFactor: number) => void
  updateDuelistData(damageA: number, damageB: number, hitChanceA: number, hitChanceB: number)
  setAllEnvCards: (cardsData: CardData[]) => void
}

export interface DuelistHand {
  fire: PacesCard, 
  dodge: PacesCard, 
  tactics: TacticsCard, 
  blade: BladesCard
}

export default Cards;


//TODO reveal card while details are shown or hand is expanded edge case - disable expand while play and animating and disable play while expanded 
//TODO after hand collapse theres a bug with hover on deckofcards?
//TODO popup for environments deck with details about cards
//TODO if a card is highlighted when i click esc to close hand details, highlight stays
//TODO resizing before cards are spawned messes with the spawned location
//TODO when card is clicked in details (is huge in the middle of screen) the resize function doesnt possition it properly
//TODO pressing on the env deck for details the zindex changes to quickly so theres a flash of the backgroun highlight thats seen
//TODO when duelist cards are invisible disable hover