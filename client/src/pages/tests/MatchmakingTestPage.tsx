import React from 'react'
import { Container, Table } from 'semantic-ui-react'
import { useTutorialLevel, useTutorialPlayerId, useTutorialProgress } from '/src/hooks/useTutorial'
import { useChallenge } from '/src/stores/challengeStore'
import { CreateTutorialChallengeButton, OpenTutorialChallengeButton } from '/src/components/TutorialButtons'
import { Connect } from '/src/pages/tests/ConnectTestPage'
import { bigintToDecimal, bigintToHex } from '@underware/pistols-sdk/utils'
import { TestPageMenu } from '/src/pages/tests/TestPageIndex'
import CurrentChainHint from '/src/components/CurrentChainHint'
import ChallengeModal from '/src/components/modals/ChallengeModal'
import StoreSync from '/src/stores/sync/StoreSync'
import AppDojo from '/src/components/AppDojo'
import { PlayerOnlineSync, PublishOnlineStatusButton } from '/src/stores/sync/PlayerOnlineSync'
import ActivityOnline from '/src/components/ActivityOnline'
import { getPlayernameFromAddress, usePlayersAvailableForMatchmaking } from '/src/stores/playerStore'
// import * as ENV from '/src/utils/env'

// const Row = Grid.Row
// const Col = Grid.Column
const Row = Table.Row
const Cell = Table.Cell
const Body = Table.Body

export default function MatchmakingTestPage() {
  return (
    <AppDojo autoConnect>
      <Container>
        <TestPageMenu />
        <CurrentChainHint />

        <Connect />
        <br />
        <TutorialProgress />

        <StoreSync />
        <ChallengeModal />
      </Container>
    </AppDojo>
  );
}

function TutorialProgress() {
  const { playerIds } = usePlayersAvailableForMatchmaking()
  return (
    <Table celled striped size='small'>
      <Body className='H5'>
        <Row>
          <Cell className='ModalText'>Publish</Cell>
          <Cell>
            <PublishOnlineStatusButton absolute={false} available={false} />
            &nbsp;&nbsp;
            <PublishOnlineStatusButton absolute={false} available={true} />
          </Cell>
        </Row>

        <Row>
          <Cell className='ModalText'>Online panel</Cell>
          <Cell>
            <ActivityOnline />
          </Cell>
        </Row>

        <Row>
          <Cell className='ModalText'>Players available</Cell>
          <Cell>
            {playerIds.map((playerId) => (
              <div key={playerId}>{getPlayernameFromAddress(playerId)} : {playerId}</div>
            ))}
          </Cell>
        </Row>
      </Body>
    </Table>
  )
}

