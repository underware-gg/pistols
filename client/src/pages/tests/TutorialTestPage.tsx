import React from 'react'
import { Container, Table } from 'semantic-ui-react'
import { useTutorialLevel, useTutorialPlayerId, useTutorialProgress } from '/src/hooks/useTutorial'
import { useDojoStatus } from '@underware_gg/pistols-sdk/dojo'
import { bigintToHex } from '@underware_gg/pistols-sdk/utils'
import { Connect } from '/src/pages/tests/ConnectTestPage'
import App from '/src/components/App'

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
            <TutorialProgress />
            <TutorialLevel tutorial_id={1} />
            <TutorialLevel tutorial_id={2} />
          </>
        }
      </Container>
    </App>
  );
}

function TutorialProgress() {
  const { tutorialProgress } = useTutorialProgress()
  const { playerId } = useTutorialPlayerId()
  return (
    <>
      <Table celled striped size='small'>
        <Body className='ModalText'>
          <Row>
            <Cell>Progress</Cell>
            <Cell className='Code'>
              {tutorialProgress}
            </Cell>
          </Row>
          <Row>
            <Cell>Player ID</Cell>
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
  const isCurrent = (currentTutorialId == tutorial_id)
  const isCompleted = false
  return (
    <>
      <Table celled striped color={isCompleted ? 'green' : isCurrent ? 'yellow' : 'red'} size='small'>
        <Body className='H5'>
          <Row>
            <Cell>Tutorial Level</Cell>
            <Cell className='Code'>
              {tutorial_id}
            </Cell>
          </Row>
          <Row>
            <Cell>Duel ID</Cell>
            <Cell className='Code'>
              {bigintToHex(duelId)}
            </Cell>
          </Row>
        </Body>
      </Table>
    </>
  )
}
