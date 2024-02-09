import React, { useEffect, useState } from 'react'
import { Button, Divider, Grid, Modal } from 'semantic-ui-react'
import { useDojoAccount, useDojoSystemCalls } from '@/dojo/DojoContext'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { Blades, BladesNames } from '@/pistols/utils/pistols'
import { signAndGenerateMoveHash } from '../utils/salt'

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
  const { commit_move } = useDojoSystemCalls()
  const { account } = useDojoAccount()

  const [selectedMove, setSelectedMove] = useState<number | string>(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setSelectedMove(null)
  }, [isOpen])

  const _submit = async () => {
    if (selectedMove) {
      setIsSubmitting(true)
      const hash = await signAndGenerateMoveHash(account, duelId, roundNumber, selectedMove)
      if (hash) {
        await commit_move(account, duelId, roundNumber, hash)
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
          </p>
          <p>
            <b>Light</b> hits for half damage, but strikes first.
          </p>
          <p>
            <b>Heavy</b> hits for full damge, but strikes late.
          </p>
          <p>
            <b>Block</b> blocks light but not heavy, does no damage.
          </p>
          <p>
            Choose wisely. 👑
          </p>
          <Divider hidden />
          <Button.Group size='large'>
            <Button toggle active={selectedMove == Blades.Light} onClick={() => setSelectedMove(Blades.Light)}>{BladesNames[Blades.Light]}</Button>
            <Button toggle active={selectedMove == Blades.Heavy} onClick={() => setSelectedMove(Blades.Heavy)}>{BladesNames[Blades.Heavy]}</Button>
            <Button toggle active={selectedMove == Blades.Block} onClick={() => setSelectedMove(Blades.Block)}>{BladesNames[Blades.Block]}</Button>
          </Button.Group>
        </Modal.Description>
      </Modal.Content>
      <Modal.Actions>
        <Grid className='FillParent Padded' textAlign='center'>
          <Row columns='equal'>
            <Col>
              <ActionButton fill label='Close' onClick={() => setIsOpen(false)} />
            </Col>
            <Col>
              <ActionButton fill attention label='Commit...' disabled={!selectedMove || isSubmitting} onClick={() => _submit()} />
            </Col>
          </Row>
        </Grid>
      </Modal.Actions>
    </Modal>
  )
}
