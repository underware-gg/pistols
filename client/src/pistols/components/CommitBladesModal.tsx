import React, { useEffect, useMemo, useState } from 'react'
import { Grid, Modal } from 'semantic-ui-react'
import { useDojoAccount, useDojoSystemCalls } from '@/dojo/DojoContext'
import { useGetValidPackedActions } from '@/pistols/hooks/useContractCalls'
import { Blades, BladesEmojis, BladesNames } from '@/pistols/utils/pistols'
import { pack_action_slots, signAndGenerateActionHash } from '@/pistols/utils/salt'
import { ActionChances } from '@/pistols/components/ActionChances'
import { ActionButton } from '@/pistols/components/ui/Buttons'

const Row = Grid.Row
const Col = Grid.Column

export default function CommitBladesModal({
  isOpen,
  setIsOpen,
  duelId,
  roundNumber = 2,
  isA = false,
  isB = false,
}: {
  isOpen: boolean
  setIsOpen: Function
  duelId: bigint
  roundNumber?: number
  isA?: boolean,
  isB?: boolean,
}) {
  const { commit_action } = useDojoSystemCalls()
  const { account } = useDojoAccount()

  const [slot1, setSlot1] = useState(0)
  const [slot2, setSlot2] = useState(0)
  const [isDual, setIsDual] = useState(false)
  const [latestAction, setLatestAction] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { validPackedActions } = useGetValidPackedActions(2)
  const packed = useMemo(() => pack_action_slots(slot1, slot2), [slot1, slot2])
  const isValid = useMemo(() => validPackedActions.includes(packed), [validPackedActions, packed])

  useEffect(() => {
    setSlot1(null)
    setSlot2(null)
    setLatestAction(null)
  }, [isOpen])

  const _setSlots = (s1, s2) => {
    if (isDual) {
      setSlot1(null)
      setSlot2(null)
    }
    if (s1 !== null) setSlot1(s1)
    if (s2 !== null) setSlot2(s2)
    setIsDual(s1 !== null && s2 !== null)
    setLatestAction(s1 ? s1 : s2 ? s2 : 0)
  }

  const _submit = async () => {
    if (isValid) {
      setIsSubmitting(true)
      const hash = await signAndGenerateActionHash(account, duelId, roundNumber, packed)
      if (hash) {
        await commit_action(account, duelId, roundNumber, hash)
        setIsOpen(false)
      }
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      size='small'
      // dimmer='inverted'
      onClose={() => setIsOpen(false)}
      open={isOpen}
    >
      <Modal.Header className='AlignCenter'><h4>Choose your Blades</h4></Modal.Header>
      <Modal.Content>
        <Modal.Description className='AlignCenter ModalText ModalBladesDescription'>
          <ActionDescription action={latestAction} />
        </Modal.Description>

        <Grid className='FillParent Padded' textAlign='center'>
          <Row stretched>
            <Col width={2} textAlign='right'>
              <SlotNumber slotNumber={1} value={slot1} />
              <SlotNumber slotNumber={2} value={slot2} />
            </Col>
            <Col width={2}>
              <SlotButton blade={Blades.Strong} value={slot2} onClick={() => _setSlots(0, Blades.Strong)} />
            </Col>
            <Col width={2}>
              <SlotButton blade={Blades.Fast} value={slot1} onClick={() => _setSlots(Blades.Fast, null)} />
              <SlotButton blade={Blades.Fast} value={slot2} onClick={() => _setSlots(null, Blades.Fast)} />
            </Col>
            <Col width={2}>
              <SlotButton blade={Blades.Block} value={slot1} onClick={() => _setSlots(Blades.Block, null)} />
              <SlotButton blade={Blades.Block} value={slot2} onClick={() => _setSlots(null, Blades.Block)} />
            </Col>
            <Col width={2}>
              <SlotButton blade={Blades.Flee} value={slot1} onClick={() => _setSlots(Blades.Flee, 0)} />
            </Col>
            <Col width={2}>
              <SlotButton blade={Blades.Steal} value={slot1} onClick={() => _setSlots(Blades.Steal, 0)} />
            </Col>
            <Col width={2}>
              <SlotButton blade={Blades.Seppuku} value={slot1} onClick={() => _setSlots(Blades.Seppuku, 0)} />
            </Col>
            <Col width={2}>
            </Col>
          </Row>
        </Grid>

        <ActionChances duelId={duelId} roundNumber={roundNumber} action={!slot1 ? slot2 : slot1} isA={isA} isB={isB} />

      </Modal.Content>
      <Modal.Actions>
        <Grid className='FillParent Padded' textAlign='center'>
          <Row columns='equal'>
            <Col>
              <ActionButton fill label='Close' onClick={() => setIsOpen(false)} />
            </Col>
            <Col>
              <ActionButton fill attention label='Commit...' disabled={!isValid || isSubmitting} onClick={() => _submit()} />
            </Col>
          </Row>
        </Grid>
      </Modal.Actions>
    </Modal>
  )
}

export const SlotNumber = ({
  slotNumber,
  value,
}) => {
  return (
    <div className='FillHalfHeight TitleCase'>
      <div className={`SlotNumber ${value == null ? 'Inactive' : ''}`}>Strike {slotNumber} :</div>
    </div>
  )
}

export const SlotButton = ({
  blade,
  onClick,
  value,
}) => {
  return (
    <ActionButton fill toggle active={value == blade} label={BladesNames[blade]} onClick={() => onClick()} />
  )
}


export const ActionDescription = ({
  action,
}) => {
  if (action == Blades.Strong) {
    return (
      <div>
        The <b>{BladesNames[action]}</b> is powerful but slow, charging at Strike 2
        <br />
        <b>Crit</b>: Execute your opponent!
        <br />
        <b>Hit</b>: Takes 2 health points
      </div>
    )
  }
  if (action == Blades.Fast) {
    return (
      <p>
        The <b>{BladesNames[action]}</b> is fast and efficient, can strike once or twice
        <br />
        <b>Crit</b>: Takes 2 health points
        <br />
        <b>Hit</b>: Takes 1 health point
      </p>
    )
  }
  if (action == Blades.Block) {
    return (
      <p>
        Use <b>{BladesNames[action]}</b> to protect agains other blades, once or twice
        <br />
        <b>Crit</b>: Blocks 2 damage points
        <br />
        <b>Hit</b>: Blocks 1 damage point
      </p>
    )
  }
  if (action == Blades.Flee) {
    return (
      <p>
        <b>{BladesNames[action]}</b> to avoid a shameful defeat!
        <br />
        <b>Honour</b>: You lost the Duel without Honour, and you keep your wager
        <br />
        <b>Counter</b>: Your opponent wins and is granted a 10 paces pistol shot to stop you!
      </p>
    )
  }
  if (action == Blades.Steal) {
    return (
      <p>
        <b>{BladesNames[action]}</b> the wager and run away!
        <br />
        <b>Honour</b>: You lost the Duel without Honour, but you keep the whole wager
        <br />
        <b>Counter</b>: Your opponent wins and is granted a 10 paces pistol shot to stop you!
        <br />
        <b>Face-off</b>: If your opponent also Steals, it's a 1 pace pistol face-off!
      </p>
    )
  }
  if (action == Blades.Seppuku) {
    return (
      <p>
        Commit a <b>{BladesNames[action]}</b> to restore your Honour!
        <br />
        <b>Honour</b>: A ritualistic suicide to restore your full Honour
        <br />
        <b>Counter</b>: Your opponent wins and takes the wager
      </p>
    )
  }
  return (
    <p>
      You have one or two strikes, depending on your choice
      <br />
      Choose wisely. 👑
    </p>
  )
}

