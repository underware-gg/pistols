import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Divider, Grid, Modal, Pagination } from 'semantic-ui-react'
import { useAccount } from '@starknet-react/core'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { useDojoSystemCalls } from '@/lib/dojo/DojoContext'
import { signAndGenerateMovesHash } from '@/pistols/utils/salt'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { feltToString } from '@/lib/utils/starknet'

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
  const { account, chainId } = useAccount()
  const { duelistId } = useSettings()
  const { commit_moves } = useDojoSystemCalls()

  const [firePaces, setFirePaces] = useState(0)
  const [dodgePaces, setDodgePaces] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setFirePaces(0)
  }, [isOpen])

  const canSubmit = useMemo(() =>
    (account && duelId && roundNumber && firePaces && dodgePaces && firePaces != dodgePaces && !isSubmitting),
    [account, duelId, roundNumber, firePaces, dodgePaces, isSubmitting])

  const _submit = useCallback(async () => {
    if (canSubmit) {
      setIsSubmitting(true)
      const moves = [firePaces, dodgePaces]
      const hash = await signAndGenerateMovesHash(account, feltToString(chainId), duelistId, duelId, roundNumber, moves)
      if (hash) {
        await commit_moves(account, duelistId, duelId, roundNumber, hash)
        setIsOpen(false)
      }
      setIsSubmitting(false)
    }
  }, [canSubmit])

  return (
    <Modal
      size='small'
      // dimmer='inverted'
      onClose={() => setIsOpen(false)}
      open={isOpen}
    >
      <Modal.Header className='AlignCenter'>Choose your cards...</Modal.Header>
      <Modal.Content>
        <Modal.Description className='AlignCenter'>
          <div className='ModalText'>
            <h5>Fire</h5>
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
              onPageChange={(e, { activePage }) => setFirePaces(typeof activePage == 'number' ? activePage : parseInt(activePage))}
            />

            <Divider />

            <h5>Dodge</h5>
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
              onPageChange={(e, { activePage }) => setDodgePaces(typeof activePage == 'number' ? activePage : parseInt(activePage))}
            />
          </div>

          <Divider hidden />

        </Modal.Description>
      </Modal.Content>
      <Modal.Actions className='NoPadding'>
        <Grid className='FillParent Padded' textAlign='center'>
          <Row columns='equal'>
            <Col>
              <ActionButton fill label='Close' onClick={() => setIsOpen(false)} />
            </Col>
            <Col>
              <ActionButton fill important label='Commit...' disabled={!canSubmit} onClick={() => _submit()} />
            </Col>
          </Row>
        </Grid>
      </Modal.Actions>
    </Modal>
  )
}
