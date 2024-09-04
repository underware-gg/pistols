import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Divider, Grid, Modal, Pagination } from 'semantic-ui-react'
import { useAccount } from '@starknet-react/core'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { useDojoSystemCalls } from '@/lib/dojo/DojoContext'
import { signAndGenerateActionHash } from '@/pistols/utils/salt'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { ActionChances } from '@/pistols/components/ActionChances'
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

  const [paces, setPaces] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setPaces(0)
  }, [isOpen])

  const canSubmit = useMemo(() =>
    (account && duelId && roundNumber && paces && !isSubmitting),
  [account, duelId, roundNumber, paces, isSubmitting])

  const _submit = useCallback(async () => {
    if (canSubmit) {
      setIsSubmitting(true)
      const hash = await signAndGenerateActionHash(account, feltToString(chainId), duelistId, duelId, roundNumber, paces)
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
              <ActionButton fill important label='Commit...' disabled={!canSubmit} onClick={() => _submit()} />
            </Col>
          </Row>
        </Grid>
      </Modal.Actions>
    </Modal>
  )
}
