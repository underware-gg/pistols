import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { BigNumberish } from 'starknet'
import { useChallenge } from '/src/stores/challengeStore'
import { useDuelist } from '/src/stores/duelistStore'
import { useIsMyDuelist } from '/src/hooks/useIsYou'
import { useGameAspect } from '/src/hooks/useGameAspect'
import { ProfilePic } from '/src/components/account/ProfilePic'
import { constants } from '@underware/pistols-sdk/pistols/gen'
import { BladesCardsTextures, CardData, DodgeCardsTextures, EnvironmentCardsTextures, FireCardsTextures, TacticsCardsTextures } from '/src/data/cardAssets'
import { DuelistCardType, CardHandle, Card } from '/src/components/cards/Cards'
import * as TWEEN from '@tweenjs/tween.js'
import * as Constants from '/src/data/cardConstants'
import { usePistolsContext } from '/src/hooks/PistolsContext'
import { shakeCamera } from '/src/three/game'
import { DuelTutorialLevel } from '/src/data/tutorialConstants'

interface DuelistCardsProps {
  isLeft: boolean
  duelistId: BigNumberish
  onClick?: (isLeft?: boolean, shouldClose?: boolean) => void
}

interface DuelistCardsHandle {
  resetCards: () => void
  spawnCards: (cards: DuelistHand) => void
  revealCard: (cardType: DuelistCardType, speedFactor: number, alive?: boolean) => void
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

const DuelistCards = forwardRef<DuelistCardsHandle, DuelistCardsProps>((props: DuelistCardsProps, ref: React.Ref<DuelistCardsHandle>) => {
  const isMyDuelist = useIsMyDuelist(props.duelistId)

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
        card.ref.current.setRotation(0, 0)
        card.ref.current.setZIndex(card.renderOrder + 10, 1)
        card.ref.current.flip(false, isLeft, 0)
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
        card.setRotation(0, 0)
        card.setZIndex(renderOrder + 10, 1)

        const angle = (isLeft ? 1 : -1) * ((renderOrder - 0.2) * (Constants.CARDS_FAN_SPREAD / 3)) * (180 / Math.PI)

        originalCardStylesRef.current[type] = { translateX: targetX, translateY: targetY, rotation: angle }

        setTimeout(() => {
          card.setPosition(targetX, targetY, Constants.SPAWN_CARDS_POSITION_DURATION)
          card.setRotation(angle, Constants.SPAWN_CARDS_ROTATION_DURATION)
          card.toggleVisibility(true)
          if (isMyDuelist) {
            card.flip(
              true, 
              isLeft,
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

  const revealCard = (cardType: DuelistCardType, speedFactor: number, alive?: boolean) => {
    const cardIndex = cardRefs.current.findIndex(card => card.type === cardType)
    let cardCurrent: CardHandle;
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
      x: (isLeft ? 1 : -1) * (-aspectW * (cardType == DuelistCardType.BLADE ? Constants.TARGET_END_POSITION_BLADE_X_OFFSET : Constants.TARGET_END_POSITION_X_OFFSET)), 
      y: aspectH * (cardType == DuelistCardType.BLADE ? Constants.TARGET_END_POSITION_BLADE_Y_OFFSET : Constants.TARGET_END_POSITION_Y_OFFSET)
    }
    if (cardType == DuelistCardType.BLADE) {
      const midPoint = { 
        x: (isLeft ? 1 : -1) * (-aspectW * Constants.MIDDLE_POSITION_BLADE_X_OFFSET), 
        y: aspectH * Constants.MIDDLE_POSITION_BLADE_Y_OFFSET
      }
      cardCurrent.setPosition([midPoint.x, target.x], [midPoint.y, target.y], Constants.BLADE_CARD_REVEAL_TRANSOFRMS_DURATION / speedFactor, TWEEN.Easing.Circular.Out, TWEEN.Interpolation.CatmullRom)
      cardCurrent.setRotation([0, 0], Constants.BLADE_CARD_REVEAL_TRANSOFRMS_DURATION / speedFactor, TWEEN.Easing.Back.Out)
      cardCurrent.setScale(2.2, Constants.BLADE_CARD_REVEAL_TRANSOFRMS_DURATION / speedFactor, TWEEN.Easing.Back.Out)
    } else {
      cardCurrent.setPosition(target.x, target.y, Constants.CARD_REVEAL_TRANSOFRMS_DURATION / speedFactor, TWEEN.Easing.Back.Out)
      cardCurrent.setRotation(0, Constants.CARD_REVEAL_TRANSOFRMS_DURATION / speedFactor, TWEEN.Easing.Back.Out)
      cardCurrent.setScale(1.6, Constants.CARD_REVEAL_TRANSOFRMS_DURATION / speedFactor, TWEEN.Easing.Back.Out)
    }

    const targetX = (isLeft ? -aspectW : aspectW) * Constants.SPAWN_CARDS_POSITION_X_OFFSET
    const targetY = aspectH * Constants.SPAWN_CARDS_POSITION_Y_OFFSET

    cardRefs.current.forEach(({ type, ref, renderOrder }, index) => {
      const card = ref.current
      if (!card) return

      const angle = (isLeft ? 1 : -1) * ((renderOrder - 0.4) * (Constants.CARDS_FAN_SPREAD / 3)) * (180 / Math.PI)

      originalCardStylesRef.current[type] = { translateX: targetX, translateY: targetY, rotation: angle }

      if (type == cardType) {
        if (cardType == DuelistCardType.BLADE) {
          setTimeout(() => {
            card.flip(
              true, 
              isLeft,
              Constants.BLADE_CARD_REVEAL_FLIP_DURATION / speedFactor, 
              Constants.CARD_FLIP_ROTATION,
              TWEEN.Easing.Back.Out
            )
            card.setZIndex(renderOrder + 5, 1)
          }, Constants.BLADE_CARD_REVEAL_FLIP_DELAY / speedFactor)
          setTimeout(() => {
            card.setPosition(
              [
                target.x + (target.x * -0.10), // Move towards other card
                target.x, // Back to original
              ],
              [
                target.y,
                target.y,
              ],
              Constants.BLADE_CARD_REVEAL_BATTLE_ATTACK_SHAKE / speedFactor,
              TWEEN.Easing.Back.Out,
              TWEEN.Interpolation.CatmullRom
            )
            const originalRotation = card.getStyle().rotation
            card.setRotation(
              [
                originalRotation + (isLeft ? (10 + Math.random() * 10) : -(10 + Math.random() * 10)),
                originalRotation,
              ],
              Constants.BLADE_CARD_REVEAL_BATTLE_ATTACK_SHAKE / speedFactor,
              TWEEN.Easing.Back.Out
            )
          }, Constants.BLADE_CARD_REVEAL_BATTLE_DELAY / speedFactor)
          if (!alive) {
            setTimeout(() => {
              card.setPosition(
                [
                  target.x + (target.x * 0.06),
                  target.x + (target.x * -0.04),
                  target.x + (target.x * 0.02),
                  target.x
                ],
                [
                  target.y + (target.y * 0.02),
                  target.y - (target.y * 0.02),
                  target.y + (target.y * 0.01),
                  target.y
                ],
                Constants.BLADE_CARD_REVEAL_BATTLE_OUTCOME / speedFactor,
                TWEEN.Easing.Bounce.Out,
                TWEEN.Interpolation.CatmullRom
              )
            }, Constants.BLADE_CARD_REVEAL_BATTLE_OUTCOME_DELAY / speedFactor)
            setTimeout(() => {
              shakeCamera(150, 0.01)
            }, Constants.BLADE_CARD_REVEAL_BATTLE_OUTCOME_DELAY / speedFactor + (Constants.BLADE_CARD_REVEAL_BATTLE_OUTCOME / speedFactor) * 0.2)
            setTimeout(() => {
              card.toggleHighlight(true, false, "red")
              card.toggleDefeated(true)
            }, Constants.BLADE_CARD_REVEAL_BATTLE_OUTCOME_DELAY / speedFactor)
            setTimeout(() => {
              card.toggleHighlight(false)
              card.toggleDefeated(false)
            }, Constants.BLADE_CARD_REVEAL_BATTLE_OUTCOME_DELAY / speedFactor + Constants.BLADE_CARD_REVEAL_BATTLE_OUTCOME / speedFactor)
          } else {
            setTimeout(() => {
              card.toggleHighlight(true, false, "green")
            }, Constants.BLADE_CARD_REVEAL_BATTLE_OUTCOME_DELAY / speedFactor)
            setTimeout(() => {
              card.toggleHighlight(false)
            }, Constants.BLADE_CARD_REVEAL_BATTLE_OUTCOME_DELAY / speedFactor + Constants.BLADE_CARD_REVEAL_BATTLE_OUTCOME / speedFactor)
          }
          setTimeout(() => {
            card.setPosition(targetX, targetY, Constants.BLADE_CARD_REVEAL_TRANSOFRMS_DURATION / speedFactor)
            card.setRotation(angle, Constants.BLADE_CARD_REVEAL_TRANSOFRMS_DURATION / speedFactor)
            cardCurrent.setScale(1, Constants.BLADE_CARD_REVEAL_TRANSOFRMS_DURATION / speedFactor)
          }, Constants.BLADE_CARD_REVEAL_TRANSORMS_DELAY / speedFactor)
        } else {
          setTimeout(() => {
            card.flip(
              true, 
              isLeft,
              Constants.CARD_REVEAL_FLIP_DURATION / speedFactor, 
              Constants.CARD_FLIP_ROTATION,
              TWEEN.Easing.Back.Out
            )
            card.setZIndex(renderOrder + 5, 1)
          }, Constants.CARD_REVEAL_FLIP_DELAY / speedFactor)
          setTimeout(() => {
            card.setPosition(targetX, targetY, Constants.CARD_REVEAL_TRANSOFRMS_DURATION / speedFactor)
            card.setRotation(angle, Constants.CARD_REVEAL_TRANSOFRMS_DURATION / speedFactor)
            cardCurrent.setScale(1, Constants.CARD_REVEAL_TRANSOFRMS_DURATION / speedFactor)
          }, Constants.CARD_REVEAL_TRANSORMS_DELAY / speedFactor)
        }
      } else {
        setTimeout(() => {
          card.setPosition(targetX, targetY, Constants.CARD_REVEAL_POSITION_DURATION / speedFactor)
          card.setRotation(angle, Constants.CARD_REVEAL_ROTATION_DURATION / speedFactor)
          card.setZIndex(renderOrder + 5, 1)
        }, renderOrder * Constants.CARD_REVEAL_SLIDE_TRANSFORMS_DELAY / speedFactor)
      }
    })

    setTimeout(() => {
      isAnimatingCardsRef.current = false
    }, (cardType == DuelistCardType.BLADE ? Constants.BASE_BLADE_CARD_REVEAL_DURATION : Constants.BASE_CARD_REVEAL_DURATION) / speedFactor)
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

      card.setScale(Constants.EXPAND_HAND_CARD_SCALE, Constants.EXPAND_HAND_CARD_SCALE_DURATION)
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

      card.setScale(1)
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
        card.setRotation(0, Constants.HAND_DETAILS_ROTATION_DURATION)
        card.setScale(Constants.HAND_DETAILS_SCALE, Constants.HAND_DETAILS_SCALE_DURATION)
        setTimeout(() => {
          card.setZIndex(901 + renderOrder)
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
        card.setRotation(rotation, Constants.HAND_DETAILS_ROTATION_DURATION)
        card.setScale(1, Constants.HAND_DETAILS_SCALE_DURATION)
        card.toggleIdle(false)
        setTimeout(() => {
          card.setZIndex(renderOrder + 5, 1)
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
        card.flip(true, isLeft, Constants.CARD_DETAILS_FLIP_DURATION, Constants.CARD_DETAIL_FLIP_ROTATION, TWEEN.Easing.Quartic.InOut)
        card.setPosition(0, 0, Constants.CARD_DETAILS_POSITION_DURATION, TWEEN.Easing.Quartic.InOut)
        card.setScale(Constants.CARD_DETAIL_SCALE, Constants.CARD_DETAILS_SCALE_DURATION, TWEEN.Easing.Quartic.InOut)
        card.setZIndex(950)
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

      oldCard.flip(true, isLeft, 0)
      oldCard.setPosition(gridPositions[currentActiveCardRef.current].x, gridPositions[currentActiveCardRef.current].y, Constants.RETURN_CARD_POSITION_DURATION, TWEEN.Easing.Quadratic.Out, TWEEN.Interpolation.Linear)
      oldCard.setScale(Constants.EXPAND_HAND_CARD_SCALE, Constants.RETURN_CARD_SCALE_DURATION, TWEEN.Easing.Quadratic.InOut, TWEEN.Interpolation.Linear)
      setTimeout(() => {
        oldCard.setZIndex(901 + oldCardIndex)
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
  const [showDeckInfo, setShowDeckInfo] = useState(false);

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
          cardComponent.setRotation(0);
          cardComponent.setScale(1);
          cardComponent.setZIndex(100 + i, i);
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
            cardComponent.setRotation(0);
            cardComponent.setScale(1);
          }, i * 100)
          setTimeout(() => {
            cardComponent.flip(false)
          }, i * 100 + 100);
          setTimeout(() => {
            cardComponent.setZIndex(100 + card.id, card.id);
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
              cardComponent.setScale(Constants.DRAW_CARD_TOP_CARD_SCALE, Constants.DRAW_CARD_SCALE_DURATION / speedFactor)
            }, Constants.DRAW_CARD_SCALE_DELAY / speedFactor)
            setTimeout(() => {
              cardComponent.setScale(1, Constants.DRAW_CARD_RESET_SCALE_DURATION / speedFactor)
            }, Constants.DRAW_CARD_RESET_SCALE_DELAY / speedFactor)
            setTimeout(() => {
              cardComponent.toggleHighlight(true)
            }, Constants.DRAW_CARD_HIGHLIGHT_DELAY / speedFactor)
            setTimeout(() => {
              cardComponent.toggleHighlight(false)
            }, Constants.DRAW_CARD_RESET_HIGHLIGHT_DELAY / speedFactor)
            setTimeout(() => {
              cardComponent.flip(true, false, Constants.DRAW_CARD_FLIP_DURATION / speedFactor, Constants.CARD_FLIP_ROTATION, TWEEN.Easing.Quartic.InOut);
            }, Constants.DRAW_CARD_FLIP_DELAY / speedFactor)
            cardComponent.setZIndex(100 + firstCard.id + (drawnCardsCount * 2), firstCard.id + (drawnCardsCount * 2))

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
        card.setRotation(0, Constants.EXPAND_DECK_ROTATION_DURATION)
        card.setScale(Constants.EXPANDED_DECK_CARD_SCALE, Constants.EXPAND_DECK_SCALE_DURATION)
        card.setZIndex(980 - cardData[1].id, 950 - cardData[1].id)
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
        card.setRotation(0, Constants.EXPAND_DECK_ROTATION_DURATION)
        card.setScale(1, Constants.EXPAND_DECK_SCALE_DURATION)
      }, index * Constants.EXPAND_DECK_TRANSOFORM_DELAY)

      setTimeout(() => {
        card.setZIndex(100 + cardData[1].id + index * 2, cardData[1].id + index * 2)
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

  const handleDeckHover = (isHovered: boolean) => {
    if (!isHovered || expanded || isAnimatingCardsRef.current) {
      setShowDeckInfo(false)
      return
    }

    const undrawnCards = cards.filter(card => !card.isDrawn)
    if (undrawnCards.length > 0) {
      setShowDeckInfo(true)
    }
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
        card.flip(true, false, Constants.CARD_DETAILS_FLIP_DURATION, Constants.CARD_FLIP_ROTATION, TWEEN.Easing.Quartic.InOut)
        card.setPosition(0, 0, Constants.CARD_DETAILS_POSITION_DURATION, TWEEN.Easing.Quartic.InOut)
        card.setScale(Constants.CARD_DETAIL_SCALE, Constants.CARD_DETAILS_SCALE_DURATION, TWEEN.Easing.Quartic.InOut)
        card.setZIndex(950)
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

      oldCard.flip(true, false, 0)
      oldCard.setPosition(gridPositions[gridIndex].x, gridPositions[gridIndex].y, Constants.RETURN_CARD_POSITION_DURATION, TWEEN.Easing.Quadratic.Out, TWEEN.Interpolation.Linear)
      oldCard.setScale(Constants.EXPANDED_DECK_CARD_SCALE, Constants.RETURN_CARD_SCALE_DURATION, TWEEN.Easing.Quadratic.InOut, TWEEN.Interpolation.Linear)
      setTimeout(() => {
        oldCard.setZIndex(901 + oldCardIndex)
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
          onHover={(isHovered) => {
            if (card.isDrawn) {
              handleCardHover(isHovered, card.id)
            } else {
              handleDeckHover(isHovered)
            }
          }}
          onClick={(e) => handleCardClick(card.id, e)}
        />
      ))}

      {emptyCards.map((card, index) => (
        <div id='dashed-outline' className={expanded && drawnCardsCount < (index + 1) ? 'visible' : ''} ref={card} key={`empty-card-${index}`} />
      ))}

      <div 
        className={`DeckInfoBubble ${showDeckInfo ? 'visible' : ''}`}
      >
        {Object.entries(EnvironmentCardsTextures).reduce((acc, [_, cardData]) => acc + cardData.cardAmount, 0)} cards total
        <br/>
        Types: 
        <div className="deck-info-grid">
          {Object.entries(EnvironmentCardsTextures)
            .filter((_, index) => index > 0)
            .map(([cardName, cardData], index) => (
              <div key={`row-${index}`} className="deck-info-row">
                <div className="deck-info-cell deck-card-title">
                  {cardData.title}
                </div>
                <div className={`deck-info-cell deck-card-rarity ${cardData.rarity.toLowerCase()}`}>
                  {cardData.rarity}
                </div>
                <div className="deck-info-cell deck-card-count">
                  x{cardData.cardAmount}
                </div>
              </div>
            ))}
        </div>
      </div>
    </>
  );
});

const PlayerStats = ({ duelistId, isLeft, damage, hitChance, visible }) => {

  const { nameAndId: name, profilePic, profileType } = useDuelist(duelistId)
  const { dispatchSelectDuelistId } = usePistolsContext()

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
        <div className={`Relative ${visible ? 'YesMouse NoDrag' : 'NoMouse NoDrag'}`} onClick={() => dispatchSelectDuelistId(duelistId)} >
          <ProfilePic className='NoMouse NoDrag' width={10} circle profilePic={profilePic} profileType={profileType} />
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

const Cards = forwardRef<CardsHandle, { duelistIdA: BigNumberish, duelistIdB: BigNumberish, tutorialLevel: DuelTutorialLevel, speedFactor: number }>(({ duelistIdA, duelistIdB, tutorialLevel, speedFactor }, ref) => {

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
    environmentDeck.current?.shuffle()
    duelistAHand.current?.resetCards()
    duelistBHand.current?.resetCards()
  }

  const spawnCards = (duelist: string, cards: DuelistHand) => {
    if (duelist == 'A') {
      duelistAHand.current?.spawnCards(cards)
    } else {
      duelistBHand.current?.spawnCards(cards)
    }
  }

  const drawNextCard = () => {
    environmentDeck.current?.drawCard(speedFactor)
  }

  const revealCard = (duelist: string, type: DuelistCardType, alive?: boolean) => {
    if (duelist == 'A') {
      duelistAHand.current?.revealCard(type, speedFactor, alive)
    } else {
      duelistBHand.current?.revealCard(type, speedFactor, alive)
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
    environmentDeck.current?.setCardsData(cardsData)
  }

  const handleClick = (isLeft?: boolean, shouldClose?: boolean) => {
    if (shouldClose) {
      if (isLeft == true) {
        duelistBHand.current?.returnActiveCard()
        environmentDeck.current?.returnActiveCard()
      } else if (isLeft == false) {
        duelistAHand.current?.returnActiveCard()
        environmentDeck.current?.returnActiveCard()
      } else {
        duelistBHand.current?.returnActiveCard()
        duelistAHand.current?.returnActiveCard()
      }
    } else {
      if (!duelistAHand.current?.isReadyToShow() || !duelistBHand.current?.isReadyToShow() || !environmentDeck.current?.isReadyToShow()) return
      duelistBHand.current?.showHandDetails()
      duelistAHand.current?.showHandDetails()
      environmentDeck.current?.expand()
      
      setTimeout(() => {
        setIsOverlayVisible(true)
      }, 600)

      setTimeout(() => {
        overlayRef.current?.addEventListener('click', handleGlobalClick)
      }, 100)
    }
  }

  const handleGlobalClick = useCallback((event: MouseEvent) => {
    duelistAHand.current?.returnActiveCard()
    duelistBHand.current?.returnActiveCard()
    environmentDeck.current?.returnActiveCard()

  }, [duelistAHand, duelistBHand, overlayRef, environmentDeck])

  const collapse = () => {
    if (!duelistAHand.current?.isReadyToCollapse() || !duelistBHand.current?.isReadyToCollapse() || !environmentDeck.current?.isReadyToCollapse()) return
    duelistAHand.current?.hideHandDetails()
    duelistBHand.current?.hideHandDetails()

    environmentDeck.current?.collapse()

    setIsOverlayVisible(false)

    overlayRef.current?.removeEventListener('click', handleGlobalClick)
  }

  if (tutorialLevel === DuelTutorialLevel.SIMPLE) return null

  return (
    <>
      <div id="overlay" className={isOverlayVisible ? 'visible' : ''} ref={overlayRef}>
        <div className='background'/>
        <PlayerStats duelistId={duelistIdA} isLeft={true} damage={statsA.damage} hitChance={statsA.hitChance} visible={isOverlayVisible} />
        <PlayerStats duelistId={duelistIdB} isLeft={false} damage={statsB.damage} hitChance={statsB.hitChance} visible={isOverlayVisible} />
        <div className='env-divider' />
        <div 
          className={isOverlayVisible ? 'YesMouse NoDrag close-button' : 'NoMouse NoDrag close-button'} 
          onClick={collapse}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.25)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        />
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
  drawNextCard: () => void
  revealCard: (duelist: string, type: DuelistCardType, alive?: boolean) => void
  updateDuelistData(damageA: number, damageB: number, hitChanceA: number, hitChanceB: number)
  setAllEnvCards: (cardsData: CardData[]) => void
}

export interface DuelistHand {
  fire: constants.PacesCard, 
  dodge: constants.PacesCard, 
  tactics: constants.TacticsCard, 
  blade: constants.BladesCard
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
//TODO handle details better, should stop tween update probably? and halt the duel show details and then resume? needs better handling or access only when duel finishes or paused and animations finished
//TODO better animation tracking!!!
//TODO add empty cards to details screen if a player hasnt chosen their cards yet