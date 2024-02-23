import React, { useEffect, useState } from 'react'
import { Divider, Grid, Modal, Pagination } from 'semantic-ui-react'
import { useDojoAccount, useDojoSystemCalls } from '@/dojo/DojoContext'
import { useReadActionHonour, useReadCritChance, useReadHitBonus, useReadHitChance } from '@/pistols/hooks/useReadOnly'
import { signAndGenerateActionHash } from '@/pistols/utils/salt'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { ActionChances } from '@/pistols/components/ActionChances'
import constants from '@/pistols/utils/constants'

const Row = Grid.Row
const Col = Grid.Column

export default function CommitStepsModal({
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

  const [steps, setSteps] = useState(0)

  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setSteps(0)
  }, [isOpen])

  const _submit = async () => {
    if (steps) {
      setIsSubmitting(true)
      const hash = await signAndGenerateActionHash(account, duelId, roundNumber, steps)
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
      <Modal.Header className='AlignCenter'><h4>How many steps will you take?</h4></Modal.Header>
      <Modal.Content>
        <Modal.Description className='AlignCenter'>
          <div className='ModalText'>
            <p>
              An honourable Lord will take all the <b>10 steps</b> before shooting.
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
              onPageChange={(e, { activePage }) => setSteps(typeof activePage == 'number' ? activePage : parseInt(activePage))}
            />
          </div>

          <Divider hidden />
          
          <ActionChances action={steps} />

        </Modal.Description>
      </Modal.Content>
      <Modal.Actions>
        <Grid className='FillParent Padded' textAlign='center'>
          <Row columns='equal'>
            <Col>
              <ActionButton fill label='Close' onClick={() => setIsOpen(false)} />
            </Col>
            <Col>
              <ActionButton fill attention label='Commit...' disabled={!steps || isSubmitting} onClick={() => _submit()} />
            </Col>
          </Row>
        </Grid>
      </Modal.Actions>
    </Modal>
  )
}
