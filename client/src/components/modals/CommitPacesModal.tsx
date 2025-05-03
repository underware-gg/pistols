import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { Divider, Grid, Modal } from 'semantic-ui-react'
import { useAccount } from '@starknet-react/core'
import { usePistolsContext } from '/src/hooks/PistolsContext'
import { useDojoSetup, useDojoSystemCalls } from '@underware/pistols-sdk/dojo'
import { useGameAspect } from '/src/hooks/useGameAspect'
import { CommitMoveMessage, signAndGenerateMovesHash } from '@underware/pistols-sdk/pistols'
import { ActionButton } from '/src/components/ui/Buttons'
import { Card, CardHandle } from '/src/components/cards/Cards'
import { BladesCardsTextures, CardData, DodgeCardsTextures, FireCardsTextures, TacticsCardsTextures } from '@underware/pistols-sdk/pistols/constants'
import { constants } from '@underware/pistols-sdk/pistols/gen'
import { emitter } from '/src/three/game'
import { DuelTutorialLevel } from '/src/data/tutorialConstants'
import { SALT_SERVER_URL } from '/src/utils/env'

const Row = Grid.Row
const Col = Grid.Column

const STRATEGY_DESCRIPTIONS = {
  villainous: "Aggressive and ruthless. Favors quick fire paces and high risk tactics.",
  trickster: "Unpredictable and cunning. Uses unexpected moves to confuse opponents.",
  honourable: "Balanced and traditional. Prefers fair dueling with classic techniques."
};

const STRATEGY_WEIGHTS = {
  villainous: {
    fire: [10, 8, 6, 4, 2, 0, 0, 0, 0, 0],
    dodge: [10, 8, 5, 2, 0, 0, 0, 0, 0, 0],
    tactics: [0, 4, 10, 0, 4, 0],
    blades: [10, 0, 10, 0]
  },
  trickster: {
    fire: [0, 0, 2, 6, 10, 10, 6, 2, 0, 0],
    dodge: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
    tactics: [10, 10, 1, 1, 10, 10],
    blades: [0, 10, 2, 10]
  },
  honourable: {
    fire: [0, 0, 0, 0, 0, 2, 4, 6, 8, 10],
    dodge: [5, 5, 5, 5, 5, 10, 10, 10, 10, 10],
    tactics: [0, 6, 0, 10, 6, 2],
    blades: [0, 10, 10, 10]
  }
};

type CardSelectorHandles = {
  selectCard: (index: number) => void;
  unselectAll: () => void;
};

interface CommitPacesModalProps {
  duelId: bigint
  duelistId: bigint
  isOpen: boolean
  setIsOpen: Function
}

export default function CommitPacesModal(props: CommitPacesModalProps) {
  return <>{props.isOpen && <_CommitPacesModal {...props} />}</>
}

function _CommitPacesModal({
  duelId,
  duelistId,
  isOpen,
  setIsOpen,
}: CommitPacesModalProps) {
  const { account } = useAccount()
  const { game } = useDojoSystemCalls()
  const { tutorialLevel } = usePistolsContext()
  const { starknetDomain } = useDojoSetup()

  const [firePaces, setFirePaces] = useState(0)
  const [dodgePaces, setDodgePaces] = useState(0)
  const [tactics, setTactics] = useState(0)
  const [blades, setBlades] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedStrategy, setSelectedStrategy] = useState<'villainous' | 'trickster' | 'honourable' | null>(null)

  // Card selector refs
  const fireSelectorRef = useRef<CardSelectorHandles>(null);
  const dodgeSelectorRef = useRef<CardSelectorHandles>(null);
  const tacticsSelectorRef = useRef<CardSelectorHandles>(null);
  const bladesSelectorRef = useRef<CardSelectorHandles>(null);

  const { aspectWidth, aspectHeight, boxW, boxH, pixelsToAspectHeight } = useGameAspect()

  const isSimpleTutorial = tutorialLevel === DuelTutorialLevel.SIMPLE

  useEffect(() => {
    clearCardSelections();
    setSelectedStrategy(null)
  }, [isOpen])

  const messageToSign = useMemo<CommitMoveMessage>(() => ((duelId && duelistId) ? {
    duelId: BigInt(duelId),
    duelistId: BigInt(duelistId),
  } : null), [duelId, duelistId])

  const canSubmit = useMemo(() => {
    if (isSimpleTutorial) {
      return account && messageToSign && firePaces && dodgePaces && firePaces != dodgePaces && !isSubmitting
    }
    return account && messageToSign && firePaces && dodgePaces && firePaces != dodgePaces && tactics && blades && !isSubmitting
  }, [account, messageToSign, firePaces, dodgePaces, tactics, blades, isSubmitting, isSimpleTutorial])

  const _closeModal = useCallback(() => {
    setIsOpen(false)
    setTimeout(() => {
      emitter.emit('hover_description', null)
    }, 300)
  }, [setIsOpen])

  const _submit = useCallback(async () => {
    if (canSubmit) {
      setIsSubmitting(true)
      const moves = isSimpleTutorial ? [firePaces, dodgePaces, 0, 0] : [firePaces, dodgePaces, tactics, blades]
      const { hash, salt } = await signAndGenerateMovesHash(SALT_SERVER_URL, account, starknetDomain, messageToSign, moves)
      if (hash && salt) {
        await game.commit_moves(account, duelistId, duelId, hash)
        _closeModal()
      }
      setIsSubmitting(false)
    }
  }, [canSubmit, firePaces, dodgePaces, tactics, blades, isSimpleTutorial])

  const points = useMemo(() => {
    if (isSimpleTutorial) {
      return {
        self_chances: '-',
        self_damage: '-',
        other_chances: '-',
        other_damage: '-',
        special: '-'
      }
    }

    const tacticsName = constants.getTacticsCardFromValue(tactics);
    const tacticsPoints = _points_list(constants.TACTICS_POINTS[tacticsName]);

    const bladesName = constants.getBladesCardFromValue(blades);
    const bladesPoints = _points_list(constants.BLADES_POINTS[bladesName]);

    const combinedPoints = {
      self_chances: tacticsPoints.self_chances + bladesPoints.self_chances,
      self_damage: tacticsPoints.self_damage + bladesPoints.self_damage,
      other_chances: tacticsPoints.other_chances + bladesPoints.other_chances,
      other_damage: tacticsPoints.other_damage + bladesPoints.other_damage,
      special: [
        tacticsPoints.special ? `Tactic: ${tacticsPoints.special}` : '',
        bladesPoints.special ? `Blades: ${bladesPoints.special}` : ''
      ]
        .filter(Boolean)
        .join('<br />') || '-'
    };

    const formattedPoints = {
      self_chances: `${combinedPoints.self_chances > 0 ? '+' : ''}${combinedPoints.self_chances}%`,
      self_damage: `${combinedPoints.self_damage > 0 ? '+' : ''}${combinedPoints.self_damage}`,
      other_chances: `${combinedPoints.other_chances > 0 ? '+' : ''}${combinedPoints.other_chances}%`,
      other_damage: `${combinedPoints.other_damage > 0 ? '+' : ''}${combinedPoints.other_damage}`,
      special: combinedPoints.special
    };

    const isTacticsEmpty = Object.values(tacticsPoints).slice(0, 4).every(value => value === 0);
    const isBladesEmpty = Object.values(bladesPoints).slice(0, 4).every(value => value === 0);

    if (isTacticsEmpty) return formattedPoints;
    if (isBladesEmpty) return formattedPoints;

    return formattedPoints;
  }, [tactics, blades, isSimpleTutorial]);
  
  // Clear all card selections
  const clearCardSelections = useCallback(() => {
    setFirePaces(0);
    setDodgePaces(0);
    setTactics(0);
    setBlades(0);
    
    // Clear selections in the card selectors
    fireSelectorRef.current?.unselectAll();
    dodgeSelectorRef.current?.unselectAll();
    if (!isSimpleTutorial) {
      tacticsSelectorRef.current?.unselectAll();
      bladesSelectorRef.current?.unselectAll();
    }
  }, [isSimpleTutorial]);
  
  // Helper function to generate random cards based on strategy
  const generateRandomCards = useCallback((strategy: 'villainous' | 'trickster' | 'honourable') => {
    const fireCards = Array.from({length: 10}, (_, i) => i + 1);
    const dodgeCards = Array.from({length: 10}, (_, i) => i + 1);
    const tacticsCards = Array.from({length: 6}, (_, i) => i + 1);
    const bladesCards = Array.from({length: 4}, (_, i) => i + 1);
    
    // Select random fire card with weights
    const randomFire = getWeightedRandomFromArray(
      fireCards, 
      fireCards.map(card => STRATEGY_WEIGHTS[strategy].fire[card - 1])
    );
    
    // Select random dodge card that isn't the same as fire, with weights
    let randomDodge;
    do {
      randomDodge = getWeightedRandomFromArray(
        dodgeCards, 
        dodgeCards.map(card => STRATEGY_WEIGHTS[strategy].dodge[card - 1])
      );
    } while (randomDodge === randomFire);
    
    // Select random tactics and blades if not in simple tutorial
    let randomTactics = 0;
    let randomBlades = 0;
    
    if (!isSimpleTutorial) {
      randomTactics = getWeightedRandomFromArray(
        tacticsCards, 
        tacticsCards.map(card => STRATEGY_WEIGHTS[strategy].tactics[card - 1])
      );
      
      randomBlades = getWeightedRandomFromArray(
        bladesCards, 
        bladesCards.map(card => STRATEGY_WEIGHTS[strategy].blades[card - 1])
      );
    }
    
    console.log(randomFire, randomDodge, randomTactics, randomBlades);
    
    // Directly select the cards in the card selectors
    fireSelectorRef.current?.selectCard(randomFire);
    dodgeSelectorRef.current?.selectCard(randomDodge);
    
    if (!isSimpleTutorial) {
      tacticsSelectorRef.current?.selectCard(randomTactics);
      bladesSelectorRef.current?.selectCard(randomBlades);
    }
    
    // Set the selected cards in state
    setFirePaces(randomFire);
    setDodgePaces(randomDodge);
    setTactics(randomTactics);
    setBlades(randomBlades);
  }, [isSimpleTutorial]);
  
  const selectRandomStrategy = useCallback((strategy: 'villainous' | 'trickster' | 'honourable') => {
    // If clicking the same strategy again, clear all cards and deselect the strategy
    if (selectedStrategy === strategy) {
      clearCardSelections();
      setSelectedStrategy(null);
    } else {
      // Update selected strategy, clear previous cards, and generate new cards
      setSelectedStrategy(strategy);
      clearCardSelections();
      
      // Wait for state to update before generating new selections
      setTimeout(() => {
        generateRandomCards(strategy);
      }, 50);
    }
  }, [selectedStrategy, clearCardSelections, generateRandomCards]);

  // Layout measurements
  const headerHeight = useMemo(() => isSimpleTutorial ? 7 : 5, [isSimpleTutorial]);
  const strategyButtonsHeight = 7;
  const cardSectionHeight = 16;
  const statsSectionHeight = useMemo(() => isSimpleTutorial ? 0 : 10, [isSimpleTutorial]);
  const actionButtonsHeight = 8;
  const totalModalHeight = useMemo(() => {
    return headerHeight + strategyButtonsHeight + 
    (cardSectionHeight * (isSimpleTutorial ? 2 : 4)) + 
    statsSectionHeight + actionButtonsHeight +
    pixelsToAspectHeight(2 * 5) //5 times 2 pixels for each divider
  }, [headerHeight, strategyButtonsHeight, cardSectionHeight, statsSectionHeight, actionButtonsHeight, isSimpleTutorial]);

  return (
    <Modal
      className='NoMargin NoPadding'
      style={{
        width: aspectWidth(80),
        height: aspectHeight(totalModalHeight),
        position: 'absolute',
        top: aspectHeight((100 - totalModalHeight) / 2) + boxH,
        left: aspectWidth(10) + boxW,
        display: 'flex',
      }}
      onClose={_closeModal}
      open={isOpen}
    >
      {/* Header */}
      <Modal.Header 
        className='AlignCenter NoPadding' 
        style={{ 
          height: aspectHeight(headerHeight), 
          lineHeight: `${aspectHeight(headerHeight)}px` 
        }}
      >
        Choose your cards...
      </Modal.Header>
      
      {/* Strategy Buttons */}
      <div 
        style={{ 
          display: 'flex', 
          flexDirection: 'row', 
          alignItems: 'center',
          justifyContent: 'center',
          padding: `0 ${aspectWidth(1)}px`,
          height: aspectHeight(strategyButtonsHeight)
        }}
      >
        <div 
          style={{ flex: 1, marginRight: aspectWidth(0.5) }}
          onMouseEnter={() => emitter.emit('hover_description', STRATEGY_DESCRIPTIONS.villainous)}
          onMouseLeave={() => emitter.emit('hover_description', null)}
        >
          <ActionButton 
            large 
            fill 
            active={selectedStrategy === 'villainous'}
            important={selectedStrategy === 'villainous'}
            label='Villainous' 
            onClick={() => selectRandomStrategy('villainous')} 
          />
        </div>
        <div 
          style={{ flex: 1, marginLeft: aspectWidth(0.5), marginRight: aspectWidth(0.5) }}
          onMouseEnter={() => emitter.emit('hover_description', STRATEGY_DESCRIPTIONS.trickster)}
          onMouseLeave={() => emitter.emit('hover_description', null)}
        >
          <ActionButton 
            large 
            fill 
            active={selectedStrategy === 'trickster'}
            important={selectedStrategy === 'trickster'}
            label='Trickster' 
            onClick={() => selectRandomStrategy('trickster')} 
          />
        </div>
        <div 
          style={{ flex: 1, marginLeft: aspectWidth(0.5) }}
          onMouseEnter={() => emitter.emit('hover_description', STRATEGY_DESCRIPTIONS.honourable)}
          onMouseLeave={() => emitter.emit('hover_description', null)}
        >
          <ActionButton 
            large 
            fill 
            active={selectedStrategy === 'honourable'}
            important={selectedStrategy === 'honourable'}
            label='Honourable' 
            onClick={() => selectRandomStrategy('honourable')} 
          />
        </div>
      </div>

      <Divider className='NoPadding NoMargin' />

      <Modal.Content className='NoPadding' style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Fire Cards Section */}
        <div 
          style={{ 
            display: 'flex', 
            flexDirection: 'row', 
            alignItems: 'center',
            justifyContent: 'center',
            padding: `0 ${aspectWidth(1)}px`,
            height: aspectHeight(cardSectionHeight),
          }}
        >
          <h5 className='ModalTextSteps'>Fire:</h5>
          <CardSelector
            ref={fireSelectorRef}
            cards={FireCardsTextures}
            currentCard={firePaces}
            disabledCard={dodgePaces}
            onSelect={(value: number) => setFirePaces(value)}
          />
        </div>

        <Divider className='NoPadding' style={{ margin: `0 ${aspectWidth(1)}px` }}/>
        
        {/* Dodge Cards Section */}
        <div 
          style={{ 
            display: 'flex', 
            flexDirection: 'row', 
            alignItems: 'center',
            justifyContent: 'center',
            padding: `0 ${aspectWidth(1)}px`,
            height: aspectHeight(cardSectionHeight),
          }}
        >
          <h5 className='ModalTextSteps'>Dodge:</h5>
          <CardSelector
            ref={dodgeSelectorRef}
            cards={DodgeCardsTextures}
            currentCard={dodgePaces}
            disabledCard={firePaces}
            onSelect={(value: number) => setDodgePaces(value)}
          />
        </div>

        {!isSimpleTutorial && (
          <>
            <Divider className='NoPadding' style={{ margin: `0 ${aspectWidth(1)}px` }}/>
            
            {/* Tactics Cards Section */}
            <div 
              style={{ 
                display: 'flex', 
                flexDirection: 'row', 
                alignItems: 'center',
                justifyContent: 'center',
                padding: `0 ${aspectWidth(1)}px`,
                height: aspectHeight(cardSectionHeight),
              }}
            >
              <h5 className='ModalTextSteps'>Tactics:</h5>
              <CardSelector
                ref={tacticsSelectorRef}
                cards={TacticsCardsTextures}
                currentCard={tactics}
                onSelect={(value: number) => setTactics(value)}
              />
            </div>

            <Divider className='NoPadding' style={{ margin: `0 ${aspectWidth(1)}px` }}/>
            
            {/* Blades Cards Section */}
            <div 
              style={{ 
                display: 'flex', 
                flexDirection: 'row', 
                alignItems: 'center',
                justifyContent: 'center',
                padding: `0 ${aspectWidth(1)}px`,
                height: aspectHeight(cardSectionHeight),
              }}
            >
              <h5 className='ModalTextSteps'>Blades:</h5>
              <CardSelector
                ref={bladesSelectorRef}
                cards={BladesCardsTextures}
                currentCard={blades}
                onSelect={(value: number) => setBlades(value)}
              />
            </div>
          </>
        )}
      </Modal.Content>

      {!isSimpleTutorial && (
        <Modal.Content 
          className='NoMargin NoPadding' 
          style={{ height: aspectHeight(statsSectionHeight) }}
        >
          <Divider className='NoPadding' style={{ margin: `0 ${aspectWidth(1)}px` }}/>
          <div style={{ display: 'flex', flexDirection: 'row', width: '100%', height: '100%' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div className='ModalTextBuffs You'>Self Chances:</div>
              <div className='ModalTextBuffsNumber You'>{points.self_chances}</div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div className='ModalTextBuffs You'>Self Damage:</div>
              <div className='ModalTextBuffsNumber You'>{points.self_damage}</div>
            </div>
            <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div className='ModalTextBuffs'>Specials:</div>
              <div className='ModalTextBuffsNumber' dangerouslySetInnerHTML={{ __html: points.special }}></div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div className='ModalTextBuffs Opponent'>Other Chances:</div>
              <div className='ModalTextBuffsNumber Opponent'>{points.other_chances}</div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div className='ModalTextBuffs Opponent'>Other Damage:</div>
              <div className='ModalTextBuffsNumber Opponent'>{points.other_damage}</div>
            </div>
          </div>
        </Modal.Content>
      )}

      <Modal.Actions className='NoPadding' style={{ height: aspectHeight(actionButtonsHeight) }}>
        <Grid className='FillParent Padded' textAlign='center'>
          <Row columns='equal'>
            <Col>
              <ActionButton large fill label='Close' onClick={() => setIsOpen(false)} />
            </Col>
            <Col>
              <ActionButton large fill important label='Commit...' disabled={!canSubmit} onClick={() => _submit()} />
            </Col>
          </Row>
        </Grid>
      </Modal.Actions>
    </Modal>
  )
}

const _points_list = (points: any) => {
  return {
    self_chances: points?.self_chances ?? 0,
    self_damage: points?.self_damage ?? 0,
    other_chances: points?.other_chances ?? 0,
    other_damage: points?.other_damage ?? 0,
    special: points?.special ?? '',
  };
};

const CardSelector = React.forwardRef<CardSelectorHandles, {
  cards: Record<any, CardData>
  currentCard: number
  onSelect: (value: number) => void
  disabledCard?: number
}>(({ cards, currentCard, onSelect, disabledCard }, ref) => {
  const { aspectWidth } = useGameAspect()
  
  const cardRefs = Object.values(cards).slice(1).map(() => React.createRef<CardHandle>())
  
  useEffect(() => {
    // Initialize all cards
    cardRefs.forEach((card, index) => {
      card.current.setCardData(Object.values(cards)[index + 1])
      card.current.setRotation(Math.random() * 6 - 3)
    })
  }, [])
  
  useEffect(() => {
    // Highlight current card if selected
    if (currentCard > 0) {
      const selectedCard = cardRefs[currentCard - 1].current
      selectedCard.toggleHighlight(true)
      selectedCard.toggleIdle(true)
    }
  }, [currentCard])
  
  // Function to unselect the current card
  const unselectCurrentCard = () => {
    if (currentCard === 0) return
    const selectedCard = cardRefs[currentCard - 1].current
    selectedCard.setScale(1.0, 200)
    selectedCard.toggleHighlight(false)
    selectedCard.toggleIdle(false)
  }
  
  // Function to select a card and trigger animation
  const selectCard = (cardIndex: number) => {
    if (cardIndex <= 0 || cardIndex > cardRefs.length) return
    
    // Unselect current card first
    unselectCurrentCard()
    
    // Select new card
    const selectedCard = cardRefs[cardIndex - 1].current
    selectedCard.setScale(1.05, 100)
    setTimeout(() => {
      selectedCard.setScale(1.1, 100)
    }, 100)
    
    // Call the parent callback
    onSelect(cardIndex)
  }
  
  // Function to unselect all cards
  const unselectAll = () => {
    unselectCurrentCard()
    onSelect(0)
  }
  
  // Expose functions via ref
  React.useImperativeHandle(ref, () => ({
    selectCard,
    unselectAll
  }))
  
  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'left', width: '100%', gap: aspectWidth(1.2) }}>
      {Object.values(cards).slice(1).map((card, index) => (
        <div key={index} style={{ width: aspectWidth(8.5 * 0.66), height: aspectWidth(12 * 0.66), overflow: 'visible' }}>
          <Card
            ref={cardRefs[index]}
            isLeft={true}
            isFlipped={true}
            isDraggable={false}
            isHighlightable={disabledCard - 1 != index}
            isVisible={true}
            isMiniature={true}
            isSelected={currentCard - 1 == index}
            isDisabled={disabledCard - 1 == index}
            width={8.5 * 0.66}
            height={12 * 0.66}
            onHover={(isHovered) => {
              if (isHovered) {
                cardRefs[index].current.setScale(1.1, 200)
                emitter.emit('hover_description', Object.values(cards)[index + 1].descriptionDark ?? Object.values(cards)[index + 1].description)
              } else {
                if (currentCard - 1 != index) {
                  cardRefs[index].current.setScale(1.0, 200)
                }
                emitter.emit('hover_description', null)
              }
            }}
            onClick={(e) => {
              if (disabledCard - 1 != index) {
                if (currentCard == index + 1) {
                  // If clicking the same card, unselect it
                  unselectAll()
                } else {
                  // Select the new card
                  selectCard(index + 1)
                }
              }
            }}
          />
        </div>
      ))}
    </div>
  )
})

// Helper function to get a weighted random item from an array
function getWeightedRandomFromArray(array: number[], weights: number[]): number {
  if (!array.length) return 0;
  
  // Calculate total weight
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  
  // Generate a random number between 0 and totalWeight
  let random = Math.random() * totalWeight;
  
  // Find the item based on the random number
  for (let i = 0; i < array.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return array[i];
    }
  }
  
  // Fallback to first item if something goes wrong
  return array[0];
}
