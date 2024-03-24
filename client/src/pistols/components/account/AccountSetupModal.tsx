import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Grid, Modal } from 'semantic-ui-react'
import { useDojoAccount } from '@/dojo/DojoContext'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { Opener } from '@/lib/ui/useOpener'

const Row = Grid.Row
const Col = Grid.Column

export default function AccountSetupModal({
  opener,
}: {
  opener: Opener
}) {
  const { account, isMasterAccount } = useDojoAccount()
  const router = useRouter()

  useEffect(() => {
  }, [opener.isOpen])


  return (
    <Modal
      // size='small'
      // dimmer='inverted'
      onClose={() => opener.close()}
      // onOpen={() => setIsChallenging(false)}
      open={opener.isOpen}
    >
      <Modal.Header>
        CREATE
      </Modal.Header>
      <Modal.Content image>
        CONTENT
      </Modal.Content>
      <Modal.Actions>
        <Grid columns={4} className='FillParent Padded' textAlign='center'>
          <Row columns='equal'>
            <Col>
              <ActionButton fill label='New Duelist' onClick={() => { }} />
            </Col>
            <Col>
            </Col>
            <Col>
            </Col>
            <Col>
            </Col>

          </Row>
        </Grid>
      </Modal.Actions>
    </Modal>
  )
}

