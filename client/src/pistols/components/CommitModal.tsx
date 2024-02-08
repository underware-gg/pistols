import React, { useEffect, useState } from 'react'
import { Button, Divider, Grid, Modal, Pagination } from 'semantic-ui-react'
import { useDojoAccount, useDojoSystemCalls } from '@/dojo/DojoContext'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { Blades, BladesNames } from '@/pistols/utils/pistols'
import { signAndGenerateMoveHash } from '../utils/salt'

const Row = Grid.Row
const Col = Grid.Column

export default function CommitModal({
  isOpen,
  setIsOpen,
  duelId,
  roundNumber,
}: {
  isOpen: boolean
  setIsOpen: Function
  duelId: bigint
  roundNumber: number
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

  const _title = roundNumber == 1 ? 'How many steps will you take?' : 'Choose your Blades'

  return (
    <Modal
      size='small'
      // dimmer='inverted'
      onClose={() => setIsOpen(false)}
      open={isOpen}
    >
      <Modal.Header className='AlignCenter'><h2>{_title}</h2></Modal.Header>
      <Modal.Content>
        <Modal.Description className='AlignCenter ModalText'>
          {roundNumber == 1 &&
            <div>
              <p>
                An honorable Lord will take all the 10 steps before shooting.
              </p>
              <p>
                Less steps, <b>more chance to hit</b>,
                <br />but <b>less chance to kill</b>.
                <br /><b>Without honour</b>.
              </p>
              <p>
                More steps, <b>less chance to hit</b>,
                <br />but <b>more chance to kill</b>.
                <br /><b>With honour</b>.
              </p>
              <p>
                Choose wisely. 👑
              </p>
              <Divider hidden />
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
                onPageChange={(e, { activePage }) => setSelectedMove(activePage)}
              />
            </div>
          }
          {roundNumber == 2 &&
            <div>
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
            </div>
          }
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
