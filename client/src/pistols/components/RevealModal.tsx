import React, { useState } from 'react'
import { Grid, Modal } from 'semantic-ui-react'
import { useDojoAccount, useDojoSystemCalls } from '@/dojo/DojoContext'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { Blades } from '@/pistols/utils/pistols'
import { signAndRestoreMoveFromHash } from '../utils/salt'

const Row = Grid.Row
const Col = Grid.Column

export default function RevealModal({
  isOpen,
  setIsOpen,
  duelId,
  roundNumber,
  hash,
}: {
  isOpen: boolean
  setIsOpen: Function
  duelId: bigint
  roundNumber: number
  hash: bigint
}) {
  const { reveal_move } = useDojoSystemCalls()
  const { account } = useDojoAccount()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const _reveal = async () => {
    const possibleMoves = roundNumber == 1 ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] : roundNumber == 2 ? [Blades.Light, Blades.Heavy, Blades.Block] : []
    setIsSubmitting(true)
    const { salt, move } = await signAndRestoreMoveFromHash(account, duelId, roundNumber, hash, possibleMoves)
    if (move) {
      await reveal_move(account, duelId, roundNumber, salt, move)
      setIsOpen(false)
    }
    setIsSubmitting(false)
  }

  const canReveal = (duelId && roundNumber && hash && !isSubmitting)

  return (
    <Modal
      size='tiny'
      // dimmer='inverted'
      onClose={() => setIsOpen(false)}
      open={isOpen}
    >
      {/* <Modal.Header className='AlignCenter'></Modal.Header> */}
      <Modal.Content>
        <Modal.Description className='AlignCenter ModalText'>
          <p>
            Reveal your move...
          </p>
        </Modal.Description>
      </Modal.Content>
      <Modal.Actions>
        <Grid className='FillParent Padded' textAlign='center'>
          <Row columns='equal'>
            <Col>
              <ActionButton fill label='Close' onClick={() => setIsOpen(false)} />
            </Col>
            <Col>
              <ActionButton fill attention label='Reveal...' disabled={!canReveal} onClick={() => _reveal()} />
            </Col>
          </Row>
        </Grid>
      </Modal.Actions>
    </Modal>
  )
}
