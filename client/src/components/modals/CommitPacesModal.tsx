import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Divider, Grid, Modal } from 'semantic-ui-react'
import { useAccount } from '@starknet-react/core'
import { usePistolsContext } from '/src/hooks/PistolsContext'
import { useDojoSetup, useDojoSystemCalls } from '@underware/pistols-sdk/dojo'
import { useGameAspect } from '/src/hooks/useGameAspect'
import { CommitMoveMessage, signAndGenerateMovesHash } from '/src/utils/salt'
import { ActionButton } from '/src/components/ui/Buttons'
import { Card, CardHandle } from '/src/components/cards/Cards'
import { BladesCardsTextures, CardData, DodgeCardsTextures, FireCardsTextures, TacticsCardsTextures } from '/src/data/cardAssets'
import { constants } from '@underware/pistols-sdk/pistols/gen'
import { emitter } from '/src/three/game'
import { DuelTutorialLevel } from '/src/data/tutorialConstants'

const Row = Grid.Row
const Col = Grid.Column

export default function CommitPacesModal({
  duelId,
  duelistId,
  isOpen,
  setIsOpen,
}: {
  duelId: bigint
  duelistId: bigint
  isOpen: boolean
  setIsOpen: Function
}) {
  const { account } = useAccount()
  const { game } = useDojoSystemCalls()
  const { dispatchSetMoves, tutorialLevel } = usePistolsContext()
  const { starknetDomain } = useDojoSetup()

  const [firePaces, setFirePaces] = useState(0)
  const [dodgePaces, setDodgePaces] = useState(0)
  const [tactics, setTactics] = useState(0)
  const [blades, setBlades] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { aspectWidth, boxW, boxH, aspect } = useGameAspect()

  const isSimpleTutorial = tutorialLevel === DuelTutorialLevel.SIMPLE
  // const isSimpleTutorial = true

  useEffect(() => {
    setFirePaces(0)
    setDodgePaces(0)
    setTactics(0)
    setBlades(0)
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

  const _submit = useCallback(async () => {
    if (canSubmit) {
      setIsSubmitting(true)
      const moves = isSimpleTutorial ? [firePaces, dodgePaces, 0, 0] : [firePaces, dodgePaces, tactics, blades]
      const { hash, salt } = await signAndGenerateMovesHash(account, starknetDomain, messageToSign, moves)
      if (hash && salt) {
        await game.commit_moves(account, duelistId, duelId, hash)
        dispatchSetMoves(messageToSign, moves, salt)
        setIsOpen(false)
      }
      setIsSubmitting(false)
    }
  }, [canSubmit, firePaces, dodgePaces, tactics, blades, isSimpleTutorial])

  const totalHeight = isSimpleTutorial ? 50 : 90
  const modalHeight = useMemo(() => totalHeight / aspect, [aspect])

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


  return (
    <Modal
      className='NoMargin NoPadding'
      style={{
        width: aspectWidth(80),
        height: aspectWidth(modalHeight),
        position: 'absolute',
        top: aspectWidth(((100 - totalHeight) / 2) / aspect) + boxH,
        left: aspectWidth(10) + boxW,
        display: 'flex',
        flexDirection: 'column',
        alignContent: 'space'
      }}
      onClose={() => {
        setIsOpen(false)
        setTimeout(() => {
          emitter.emit('hover_description', null)
        }, 100)
      }}
      open={isOpen}
    >
      <Modal.Header className='AlignCenter NoPadding' style={{ height: aspectWidth(modalHeight * (isSimpleTutorial ? 0.16 : 0.06)), lineHeight: `${aspectWidth(modalHeight * (isSimpleTutorial ? 0.16 : 0.06))}px` }}>Choose your cards...</Modal.Header>

      <Modal.Content className='NoPadding' style={{ height: aspectWidth(modalHeight * 0.76) }}>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', height: aspectWidth(modalHeight * (isSimpleTutorial ? 0.378 : 0.189)) }}>
          <h5 className='ModalTextSteps'>Fire:</h5>
          <CardSelector cards={FireCardsTextures} currentCard={firePaces} disabledCard={dodgePaces} onSelect={(value: number) => setFirePaces(value)} />
        </div>

        <Divider className='NoPadding' style={{ marginTop: 0, marginBottom: 0, marginLeft: aspectWidth(1), marginRight: aspectWidth(1) }}/>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', height: aspectWidth(modalHeight * (isSimpleTutorial ? 0.378 : 0.189)) }}>
          <h5 className='ModalTextSteps'>Dodge:</h5>
          <CardSelector cards={DodgeCardsTextures} currentCard={dodgePaces} disabledCard={firePaces} onSelect={(value: number) => setDodgePaces(value)} />
        </div>

        {!isSimpleTutorial && (
          <>
            <Divider className='NoPadding' style={{ marginTop: 0, marginBottom: 0, marginLeft: aspectWidth(1), marginRight: aspectWidth(1) }}/>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', height: aspectWidth(modalHeight * 0.189) }}>
              <h5 className='ModalTextSteps'>Tactics:</h5>
              <CardSelector cards={TacticsCardsTextures} currentCard={tactics} onSelect={(value: number) => setTactics(value)} />
            </div>

            <Divider className='NoPadding' style={{ marginTop: 0, marginBottom: 0, marginLeft: aspectWidth(1), marginRight: aspectWidth(1) }}/>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', height: aspectWidth(modalHeight * 0.189) }}>
              <h5 className='ModalTextSteps'>Blades:</h5>
              <CardSelector cards={BladesCardsTextures} currentCard={blades} onSelect={(value: number) => setBlades(value)} />
            </div>
          </>
        )}
      </Modal.Content>

      {!isSimpleTutorial && (
        <Modal.Content className='NoMargin NoPadding' style={{ height: aspectWidth(modalHeight * 0.10) }}>
          <Divider className='NoPadding' style={{ marginTop: 0, marginBottom: 0, marginLeft: aspectWidth(1), marginRight: aspectWidth(1) }}/>
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

      <Modal.Actions className='NoPadding' style={{ backgroundColor: '' }}>
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


function CardSelector({
  cards,
  currentCard,
  onSelect,
  disabledCard
}: {
  cards: Record<any, CardData>
  currentCard: number
  onSelect: (value: number) => void
  disabledCard?: number
}) {

  const { aspectWidth } = useGameAspect()

  const cardRefs = Object.values(cards).slice(1).map(() => React.createRef<CardHandle>())

  useEffect(() => {
    cardRefs.forEach((card, index) => {
      card.current.setCardData(Object.values(cards)[index + 1])

      card.current.setRotation(Math.random() * 6 - 3)
    })
  }, [])

  useEffect(() => {

  }, [disabledCard])

  useEffect(() => {
    if (currentCard == 0) return
    const selectedCard = cardRefs[currentCard - 1].current

    selectedCard.toggleHighlight(true)
    selectedCard.toggleIdle(true)
  }, [currentCard])

  const unSelectCard = () => {
    if (currentCard == 0) return
    const selectedCard = cardRefs[currentCard - 1].current

    selectedCard.setScale(1.0, 200)
    selectedCard.toggleHighlight(false)
    selectedCard.toggleIdle(false)
  }

  const cardClick = (cardIndex) => {
    const selectedCard = cardRefs[cardIndex].current

    selectedCard.setScale(1.05, 100)
    setTimeout(() => {
      selectedCard.setScale(1.1, 100)
    }, 100)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'centert', justifyContent: 'left', width: '100%', gap: aspectWidth(1.2) }}>
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
                cardClick(index)
                unSelectCard()
                onSelect(currentCard == index + 1 ? 0 : index + 1)
                // cardRefs[index].current.toggleHighlight(true)
              }
            }}
          />
        </div>
      ))
      }
    </div>
  )
}
