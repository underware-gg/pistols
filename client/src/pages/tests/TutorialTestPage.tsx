import React from 'react'
import { Container, Table } from 'semantic-ui-react'
import { useTutorialLevel, useTutorialPlayerId, useTutorialProgress } from '/src/hooks/useTutorial'
import { useDojoStatus } from '@underware_gg/pistols-sdk/dojo'
import { bigintToHex } from '@underware_gg/pistols-sdk/utils'
import { CreateTutorialChallengeButton, OpenTutorialChallengeButton } from '/src/components/TutorialButtons'
import { Connect } from '/src/pages/tests/ConnectTestPage'
import ChallengeModal from '/src/components/modals/ChallengeModal'
import StoreSync from '/src/stores/sync/StoreSync'
import App from '/src/components/App'
import { useChallenge } from '/src/stores/challengeStore'

// const Row = Grid.Row
// const Col = Grid.Column
const Row = Table.Row
const Cell = Table.Cell
const Body = Table.Body
const Header = Table.Header
const HeaderCell = Table.HeaderCell

export default function TutorialTestPage() {
  const { isInitialized } = useDojoStatus()
  return (
    <App>
      <Container>
        <Connect />
        {isInitialized &&
          <>
            <br />
            <TutorialProgress />
            <br />
            <TutorialLevel tutorial_id={1} />
            <br />
            <TutorialLevel tutorial_id={2} />
            <br />
          </>
        }
        <StoreSync />
        <ChallengeModal />
      </Container>
    </App>
  );
}

function TutorialProgress() {
  const { completedTutorialLevel, hasFinishedTutorial } = useTutorialProgress()
  const { playerId } = useTutorialPlayerId()
  return (
    <>
      <Table celled striped size='small'>
        <Body className='H5'>
          <Row className='ModalText'>
            <Cell>Completed Level:</Cell>
            <Cell className='Code'>
              {completedTutorialLevel}
            </Cell>
          </Row>
          <Row className='ModalText'>
            <Cell>Finished:</Cell>
            <Cell className='Code'>
              {hasFinishedTutorial ? 'Yes' : 'No'}
            </Cell>
          </Row>
          <Row>
            <Cell>Player ID:</Cell>
            <Cell className='Code'>
              {bigintToHex(playerId)}
            </Cell>
          </Row>
        </Body>
      </Table>
    </>
  )
}

function TutorialLevel({
  tutorial_id,
}: {
  tutorial_id: number,
}) {
  const { currentTutorialId } = useTutorialProgress()
  const { duelId } = useTutorialLevel(tutorial_id)
  const { state } = useChallenge(duelId)
  const isCurrent = (currentTutorialId == tutorial_id)
  const isCompleted = false
  return (
    <>
      <Table celled striped color={isCompleted ? 'green' : isCurrent ? 'yellow' : null} size='small'>
        <Body className='H5'>
          <Row className='ModalText'>
            <Cell>Tutorial Level:</Cell>
            <Cell className='Code'>
              {tutorial_id}
            </Cell>
          </Row>
          <Row>
            <Cell>Duel ID:</Cell>
            <Cell className='Code'>
              {bigintToHex(duelId)}
            </Cell>
          </Row>
          <Row>
            <Cell>Duel State:</Cell>
            <Cell className='Code'>
              {state}
            </Cell>
          </Row>
          <Row>
            <Cell></Cell>
            <Cell>
              <CreateTutorialChallengeButton tutorial_id={tutorial_id} />
              <OpenTutorialChallengeButton tutorial_id={tutorial_id} />
            </Cell>
          </Row>
        </Body>
      </Table>
    </>
  )
}