import React, { useEffect, useMemo, useState } from 'react'
import { Divider, Grid, Modal, Pagination } from 'semantic-ui-react'
import { useDojoAccount, useDojoSystemCalls } from '@/dojo/DojoContext'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { useMakeCommitMove } from '@/pistols/hooks/useCommitReveal'
import { pedersen } from '../utils/utils'

const Row = Grid.Row
const Col = Grid.Column

export default function CommitModal({
  isOpen,
  setIsOpen,
  duelId,
  roundNumber,
}) {
  const { commit_move } = useDojoSystemCalls()
  const { account } = useDojoAccount()

  const [selectedMove, setSelectedMove] = useState<number|string>(0)
  const { hash, salt, move } = useMakeCommitMove(duelId, roundNumber, selectedMove)

  useEffect(() => {
    setSelectedMove(null)
  }, [isOpen])

  const _submit = () => {
    if (hash && salt && move) {
      // console.log(`COMMIT`, duelId, roundNumber, hash, salt, move, pedersen(salt, move).toString(16))
      commit_move(account, duelId, roundNumber, hash)
      setIsOpen(false)
    }
  }

  const _title = roundNumber == 1 ? 'How many steps will you take?' : 'Choose your Blades'

  return (
    <Modal
      size='small'
      dimmer='inverted'
      onClose={() => setIsOpen(false)}
      open={isOpen}
    >
      <Modal.Header className='AlignCenter'><h2>{_title}</h2></Modal.Header>
      <Modal.Content>
        <Modal.Description className='AlignCenter'>
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
              BLADES
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
              <ActionButton fill attention label='Commit!' disabled={!selectedMove} onClick={() => _submit()} />
            </Col>
          </Row>
        </Grid>
      </Modal.Actions>
    </Modal>
  )
}
