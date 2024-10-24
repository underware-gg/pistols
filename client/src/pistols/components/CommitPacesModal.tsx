import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button, ButtonGroup, Divider, Grid, Modal, Pagination } from 'semantic-ui-react'
import { useAccount, useNetwork } from '@starknet-react/core'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { useDojoSystemCalls } from '@/lib/dojo/DojoContext'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { CommitMoveMessage, signAndGenerateMovesHash } from '@/pistols/utils/salt'
import { feltToString } from '@/lib/utils/starknet'
import { BLADES_POINTS, BladesCard, getBladesCardFromValue, getBladesCardValue, getTacticsCardFromValue, getTacticsCardValue, PACES_CARDS, TACTICS_POINTS, TacticsCard } from '@/games/pistols/generated/constants'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { Card, CardHandle } from './cards/Cards'
import { BladesCardsTextures, CardData, DodgeCardsTextures, FireCardsTextures, TacticsCardsTextures } from '../data/assets'
import { num } from 'starknet'
import useGameAspect from '../hooks/useGameApect'
import { emitter } from '../three/game'

const Row = Grid.Row
const Col = Grid.Column

export default function CommitPacesModal({
  isOpen,
  setIsOpen,
  duelId,
  roundNumber = 1,
}: {
  isOpen: boolean
  setIsOpen: Function
  duelId: bigint
  roundNumber?: number
}) {
  const { account } = useAccount()
  const { chain } = useNetwork()
  const { duelistId } = useSettings()
  const { commit_moves } = useDojoSystemCalls()
  const { dispatchSetMoves } = usePistolsContext()

  const [firePaces, setFirePaces] = useState(0)
  const [dodgePaces, setDodgePaces] = useState(0)
  const [tactics, setTactics] = useState(0)
  const [blades, setBlades] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { aspectWidth, aspectHeight, boxW, boxH, aspect } = useGameAspect()

  useEffect(() => {
    setFirePaces(0)
    setDodgePaces(0)
    setTactics(0)
    setBlades(0)
  }, [isOpen])

  const messageToSign = useMemo<CommitMoveMessage>(() => ((duelId && roundNumber && duelistId) ? {
    duelId: BigInt(duelId),
    roundNumber: BigInt(roundNumber),
    duelistId: BigInt(duelistId),
  } : null), [duelId, roundNumber, duelistId])

  const canSubmit = useMemo(() =>
    (account && messageToSign && firePaces && dodgePaces && firePaces != dodgePaces && tactics && blades && !isSubmitting),
    [account, messageToSign, firePaces, dodgePaces, tactics, blades, isSubmitting])

  const _submit = useCallback(async () => {
    if (canSubmit) {
      setIsSubmitting(true)
      const moves = [firePaces, dodgePaces, tactics, blades]
      const { hash, salt } = await signAndGenerateMovesHash(account, feltToString(chain.id), messageToSign, moves)
      if (hash && salt) {
        await commit_moves(account, duelistId, duelId, roundNumber, hash)
        dispatchSetMoves(messageToSign, moves, salt)
        setIsOpen(false)
      }
      setIsSubmitting(false)
    }
  }, [canSubmit, firePaces, dodgePaces, tactics, blades])

  const modalHeight = useMemo(() => 90 / aspect, [aspect])

  const points = useMemo(() => {
    const tacticsName = getTacticsCardFromValue(tactics);
    const tacticsPoints = _points_list(TACTICS_POINTS[tacticsName]);

    const bladesName = getBladesCardFromValue(blades);
    const bladesPoints = _points_list(BLADES_POINTS[bladesName]);

    // Combine the two objects by summing values for each key
    const combinedPoints = {
        self_chances: tacticsPoints.self_chances + bladesPoints.self_chances,
        self_damage: tacticsPoints.self_damage + bladesPoints.self_damage,
        other_chances: tacticsPoints.other_chances + bladesPoints.other_chances,
        other_damage: tacticsPoints.other_damage + bladesPoints.other_damage,
        special: [
          tacticsPoints.special ? `Tactic: ${tacticsPoints.special}` : '',
          bladesPoints.special ? `Blades: ${bladesPoints.special}` : ''
        ]
          .filter(Boolean) // Only keep non-empty specials
          .join('<br />') || '-' // If empty, return '-'
    };

    // Format the numbers as strings with + or - signs and % for chances
    const formattedPoints = {
        self_chances: `${combinedPoints.self_chances >= 0 ? '+' : ''}${combinedPoints.self_chances}%`,
        self_damage: `${combinedPoints.self_damage >= 0 ? '+' : ''}${combinedPoints.self_damage}`,
        other_chances: `${combinedPoints.other_chances >= 0 ? '+' : ''}${combinedPoints.other_chances}%`,
        other_damage: `${combinedPoints.other_damage >= 0 ? '+' : ''}${combinedPoints.other_damage}`,
        special: combinedPoints.special
    };

    // Check if either object has all zero values, and return appropriately
    const isTacticsEmpty = Object.values(tacticsPoints).slice(0, 4).every(value => value === 0);
    const isBladesEmpty = Object.values(bladesPoints).slice(0, 4).every(value => value === 0);

    if (isTacticsEmpty) return formattedPoints;
    if (isBladesEmpty) return formattedPoints;

    return formattedPoints;
  }, [tactics, blades]);



  return (
    <Modal
      className='NoMargin NoPadding'
      style={{
        width: aspectWidth(80),
        height: aspectWidth(modalHeight),
        position: 'absolute',
        top: aspectWidth(5 / aspect) + boxH,
        left: aspectWidth(10) + boxW,
        display: 'flex',
        flexDirection: 'column',
        alignContent: 'space'
      }}
      onClose={() => setIsOpen(false)}
      open={isOpen}
    >
      <Modal.Header className='AlignCenter NoPadding' style={{ height: aspectWidth(modalHeight * 0.06), lineHeight: `${aspectWidth(modalHeight * 0.06)}px` }}>Choose your cards...</Modal.Header>

      <Modal.Content className='NoPadding' style={{ height: aspectWidth(modalHeight * 0.76) }}>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', height: aspectWidth(modalHeight * 0.189) }}>
          <h5 className='ModalTextSteps'>Fire:</h5>
          <CardSelector cards={FireCardsTextures} currentCard={firePaces} disabledCard={dodgePaces} onSelect={(value: number) => setFirePaces(value)} />
        </div>

        <Divider className='NoPadding' style={{ marginTop: 0, marginBottom: 0, marginLeft: aspectWidth(1), marginRight: aspectWidth(1) }}/>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', height: aspectWidth(modalHeight * 0.189) }}>
          <h5 className='ModalTextSteps'>Dodge:</h5>
          <CardSelector cards={DodgeCardsTextures} currentCard={dodgePaces} disabledCard={firePaces} onSelect={(value: number) => setDodgePaces(value)} />
        </div>

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
      </Modal.Content>

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

      card.current.setCardRotation(Math.random() * 6 - 3)
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

    selectedCard.setCardScale(1.0, 200)
    selectedCard.toggleHighlight(false)
    selectedCard.toggleIdle(false)
  }

  const cardClick = (cardIndex) => {
    const selectedCard = cardRefs[cardIndex].current

    selectedCard.setCardScale(1.05, 100)
    setTimeout(() => {
      selectedCard.setCardScale(1.1, 100)
    }, 100)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'centert', justifyContent: 'left', width: '100%', gap: aspectWidth(1.2) }}>
      {Object.values(cards).slice(1).map((card, index) => (
        <div style={{ width: aspectWidth(8.5 * 0.66), height: aspectWidth(12 * 0.66), overflow: 'visible' }}>
          <Card
            key={index}
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
                cardRefs[index].current.setCardScale(1.1, 200)
                emitter.emit('hover_scene', Object.values(cards)[index + 1].descriptionDark ?? Object.values(cards)[index + 1].description)
              } else {
                if (currentCard - 1 != index) {
                  cardRefs[index].current.setCardScale(1.0, 200)
                }
                emitter.emit('hover_scene', null)
              }
            }}
            onClick={(e) => {
              if (disabledCard - 1 != index) {
                cardClick(index)
                unSelectCard()
                onSelect(currentCard == index + 1 ? 0 : index + 1)
              }
            }}
          />
        </div>
      ))
      }
    </div>
  )
}
