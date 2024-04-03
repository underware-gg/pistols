import React, { useEffect, useState } from 'react'
import { Divider, Grid, Modal, Pagination } from 'semantic-ui-react'
import { useDojoAccount, useDojoSystemCalls } from '@/lib/dojo/DojoContext'
import { signAndGenerateActionHash } from '@/pistols/utils/salt'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { ActionChances } from '@/pistols/components/ActionChances'

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
  const { commit_action } = useDojoSystemCalls()
  const { account } = useDojoAccount()

  const [paces, setPaces] = useState(0)

  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setPaces(0)
  }, [isOpen])

  const _submit = async () => {
    if (paces) {
      setIsSubmitting(true)
      const hash = await signAndGenerateActionHash(account, duelId, roundNumber, paces)
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
      <Modal.Header className='AlignCenter'>How many paces will you take?</Modal.Header>
      <Modal.Content>
        <Modal.Description className='AlignCenter'>
          <div className='ModalText'>
            <p>
              An honourable Lord will take all the <b>10 paces</b> before shooting.
              <br />
              Choose wisely. 👑
            </p>
            <Pagination
              size='huge'
              boundaryRange={10}
              defaultActivePage={null}
              ellipsisItem={null}
              firstItem={null}
              lastItem={null}
              prevItem={null}
              nextItem={null}
              siblingRange={1}
              totalPages={10}
              onPageChange={(e, { activePage }) => setPaces(typeof activePage == 'number' ? activePage : parseInt(activePage))}
            />
          </div>

          <Divider hidden />

          <ActionChances duelId={duelId} roundNumber={roundNumber} action={paces} />

        </Modal.Description>
      </Modal.Content>
      <Modal.Actions className='NoPadding'>
        <Grid className='FillParent Padded' textAlign='center'>
          <Row columns='equal'>
            <Col>
              <ActionButton fill label='Close' onClick={() => setIsOpen(false)} />
            </Col>
            <Col>
              <ActionButton fill attention label='Commit...' disabled={!paces || isSubmitting} onClick={() => _submit()} />
            </Col>
          </Row>
        </Grid>
      </Modal.Actions>
    </Modal>
  )
}
