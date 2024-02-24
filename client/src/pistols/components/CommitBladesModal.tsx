import React, { useEffect, useMemo, useState } from 'react'
import { Grid, Modal } from 'semantic-ui-react'
import { useDojoAccount, useDojoSystemCalls } from '@/dojo/DojoContext'
import { useGetValidPackedActions } from '@/pistols/hooks/useContractCalls'
import { Blades, BladesNames } from '@/pistols/utils/pistols'
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
}: {
  isOpen: boolean
  setIsOpen: Function
  duelId: bigint
  roundNumber?: number
}) {
  const { commit_action } = useDojoSystemCalls()
  const { account } = useDojoAccount()

  const [slot1, setSlot1] = useState(0)
  const [slot2, setSlot2] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { validPackedActions } = useGetValidPackedActions(2)
  const packed = useMemo(() => pack_action_slots(slot1, slot2), [slot1, slot2])
  const isValid = useMemo(() => validPackedActions.includes(packed), [validPackedActions, packed])

  useEffect(() => {
    setSlot1(null)
    setSlot2(null)
  }, [isOpen])

  const _setSlots = (s1, s2) => {
    if (s1 !== null) {
      setSlot1(s1)
      if (slot2 == Blades.Strong) {
        setSlot2(null)
      }
    }
    if (s2 !== null) {
      if (slot2 == Blades.Strong) setSlot1(null)
      setSlot2(s2)
    }
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
        <Modal.Description className='AlignCenter ModalText'>
          <p>
            You survived the pistols! Now choose your blades!
            <br />
            Choose wisely. 👑
          </p>
        </Modal.Description>

        <Grid className='FillParent Padded' textAlign='center'>
          <Row stretched>
            <Col width={2} textAlign='right'>
              <SlotNumber slotNumber={1} value={slot1} />
              <SlotNumber slotNumber={2} value={slot2} />
            </Col>
            <Col width={4}>
              <SlotButton blade={Blades.Strong} value={slot2} onClick={() => _setSlots(0, Blades.Strong)} />
            </Col>
            <Col width={4}>
              <SlotButton blade={Blades.Fast} value={slot1} onClick={() => _setSlots(Blades.Fast, null)} />
              <SlotButton blade={Blades.Fast} value={slot2} onClick={() => _setSlots(null, Blades.Fast)} />
            </Col>
            <Col width={4}>
              <SlotButton blade={Blades.Block} value={slot1} onClick={() => _setSlots(Blades.Block, null)} />
              <SlotButton blade={Blades.Block} value={slot2} onClick={() => _setSlots(null, Blades.Block)} />
            </Col>
            <Col width={2}>
            </Col>
          </Row>
        </Grid>

        <ActionChances duelId={duelId} roundNumber={roundNumber} action={!slot1 ? slot2 : slot1} />

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