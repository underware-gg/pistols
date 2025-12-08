import React, { useEffect, useState } from 'react'
import { Button, Container, Input, Tab, Table, TabPane } from 'semantic-ui-react'
import { _useDuelistsInMatchMakingByAddress } from '/src/stores/matchStore'
import { usePlayersAvailableForMatchmaking } from '/src/stores/playerStore'
import { Connect } from '/src/pages/tests/ConnectTestPage'
import { InternalPageMenu, InternalPageWrapper } from '/src/pages/internal/InternalPageIndex'
import { EventsModelStoreSync } from '/src/stores/sync/EventsModelStoreSync'
import { EntityStoreSync } from '/src/stores/sync/EntityStoreSync'
import CurrentChainHint from '/src/components/CurrentChainHint'
import AppDojo from '/src/components/AppDojo'
import { useQuizConfig, useQuizQuestion, useQuizQuestionsByEvent } from '/src/stores/quizStore'
import { useDojoSystemCalls } from '@underware/pistols-sdk/dojo'
import { useAccount } from '@starknet-react/core'

// const Row = Grid.Row
// const Col = Grid.Column
const Row = Table.Row
const Cell = Table.Cell
const Body = Table.Body
const Header = Table.Header
const HeaderCell = Table.HeaderCell

export default function QuizTestPage() {
  return (
    <AppDojo subtitle='Internal: Quiz' autoConnect>
      <Container>
        <InternalPageMenu />
        <CurrentChainHint />
        <Connect />

        <InternalPageWrapper>
          <Quiz />
        </InternalPageWrapper>

        <EntityStoreSync />
        <EventsModelStoreSync />
      </Container>
    </AppDojo>
  );
}

function Quiz() {
  return (
    <Tab panes={[
      { menuItem: 'Live', render: () => <TabPane className='NoBorder'><QuizLivePanel full /></TabPane> },
      { menuItem: 'Admin', render: () => <TabPane className='NoBorder'><QuizLivePanel /><QuizAdminPanel /></TabPane> },
    ]} />
  );
}

//--------------------------------
// Player's sample panel
//
function QuizLivePanel({
  full,
}: {
  full?: boolean,
}) {
  const { currentQuizId } = useQuizConfig()
  const { eventName, question, options, answerNumber, isOpen } = useQuizQuestion(currentQuizId)
  return (
    <Table celled striped size='small' color='green'>
      <Body className='ModalText'>
        <Row>
          <Cell width={3}>Active Event:</Cell>
          <Cell className='Important'>
            {eventName == '' ? <span>None</span> : <span>{eventName}</span>}
          </Cell>
        </Row>
        <Row>
          <Cell>Active Quiz:</Cell>
          <Cell className='Important'>
            {currentQuizId == 0 ? <span>None</span> : <span>{currentQuizId} ({isOpen ? 'Open' : 'Closed'})</span>}
          </Cell>
        </Row>
        {(full && currentQuizId > 0) && (
          <>
            <Row>
              <Cell>Question:</Cell>
              <Cell className='Important'>{question}</Cell>
            </Row>
            {options.map((q, i) => {
              const isTheAnswer = (answerNumber == i + 1);
              const isYourAnswer = (false);
              return (
                <Row key={i} className={isTheAnswer ? 'BgWarning' : ''}>
                  <Cell>Q: {i + 1}</Cell>
                  <Cell className={isYourAnswer ? 'Important' : ''}>
                    {q}
                  </Cell>
                  <Cell className={isYourAnswer ? 'Important' : ''}>
                    <Button icon='check' className='FloatRight' disabled={!isOpen || isYourAnswer}>
                      {isYourAnswer ? 'Your Answer' : 'Select'}
                    </Button>
                  </Cell>
                </Row>
              )
            })}
          </>
        )}
      </Body>
    </Table>
  )
}



//--------------------------------
// Admin Panel
//
function QuizAdminPanel() {
  // active quiz
  const { quizCount, currentQuizId } = useQuizConfig()

  // admin params
  const [eventName, setEventName] = useState('')
  const [quizId, setQuizId] = useState(0)
  const { quizIds } = useQuizQuestionsByEvent(eventName)
  useEffect(() => {
    if (quizId == 0) {
      setQuizId(quizIds[0] ?? 0)
    }
  }, [quizIds])

  // create
  const { account } = useAccount()
  const { community } = useDojoSystemCalls()
  const [isCreating, setIsCreating] = useState(false)
  const _createQuiz = async () => {
    setIsCreating(true)
    const result = await community.create_quiz(account, eventName)
  }
  useEffect(() => {
    if (isCreating && quizIds.length > 0) {
      setIsCreating(false)
      // setQuizId(quizIds[quizIds.length - 1])
    }
  }, [isCreating, quizIds])

  return (
    <Table celled striped size='small' color='orange'>
      <Body className='ModalText'>
        <Row>
          <Cell width={3}>Event:</Cell>
          <Cell className='Important Code'>
            <Input value={eventName} onChange={(e) => setEventName(e.target.value)} maxLength={31} style={{ width: '200px' }} />
          </Cell>
        </Row>
        <Row>
          <Cell>Event Questions:</Cell>
          <Cell className='Important'>
            {quizIds.map((q) =>
              <Button key={q} onClick={() => setQuizId(q)} active={q == quizId}>{q}</Button>
            )}
            {' | '}
            <Button onClick={_createQuiz} disabled={isCreating || eventName.length < 5}>New</Button>
          </Cell>
        </Row>

        <QuizQuestionAdminPanel quizId={quizId} />
      </Body>
    </Table>
  )
}

function QuizQuestionAdminPanel({
  quizId,
}: {
  quizId: number,
}) {
  const { eventName, question, options, answerNumber, isOpen } = useQuizQuestion(quizId)
  const [newQuestion, setNewQuestion] = useState('')

  if (quizId == 0) return <></>;
  return (
    <>
      <Row>
        <Cell>Quiz ID:</Cell>
        <Cell className='Important'>{quizId} ({isOpen ? 'Open' : 'Closed'})</Cell>
      </Row>
      <Row>
        <Cell>Question:</Cell>
        <Cell className='Code'>
          <Input value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} maxLength={100} style={{ width: '600px' }} />
        </Cell>
      </Row>
      <Row>
        <Cell></Cell>
        <Cell><Button>Add Answer</Button></Cell>
      </Row>
    </>
  )
}

