import React, { useEffect, useMemo, useState } from 'react'
import { Button, Container, Input, Tab, Table, TabPane } from 'semantic-ui-react'
import { useAccount } from '@starknet-react/core'
import { useCookies } from 'react-cookie'
import { useDojoSystemCalls } from '@underware/pistols-sdk/dojo'
import { useQuizConfig } from '/src/stores/configStore'
import { useQuizAnswersByEventName, useQuizPlayerAnswer, useQuizQuestion, useQuizQuestionsByEventName } from '/src/stores/quizStore'
import { InternalPageMenu, InternalPageWrapper } from '/src/pages/internal/InternalPageIndex'
import { EntityStoreSync } from '/src/stores/sync/EntityStoreSync'
import { Connect } from '/src/pages/tests/ConnectTestPage'
import CurrentChainHint from '/src/components/CurrentChainHint'
import AppDojo from '/src/components/AppDojo'

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
      </Container>
    </AppDojo>
  );
}

function Quiz() {
  return (
    <Tab panes={[
      { menuItem: 'Live', render: () => <TabPane className='NoBorder'><QuizPlayerPanel full /></TabPane> },
      { menuItem: 'Admin', render: () => <TabPane className='NoBorder'><QuizPlayerPanel /><QuizAdminPanel /></TabPane> },
    ]} />
  );
}


//--------------------------------
// Player's sample panel
//

function QuizPlayerPanel({
  full,
}: {
  full?: boolean,
}) {
  const { account, address, isConnected } = useAccount()
  const { community } = useDojoSystemCalls()
  const { currentQuizId } = useQuizConfig()
  const { eventName, question, description, options, answerNumber, isOpen, isClosed } = useQuizQuestion(currentQuizId)
  const { playerAnswerNumber } = useQuizPlayerAnswer(currentQuizId, address)
  const { playersByAnswer, answerCounts } = useQuizAnswersByEventName(eventName)

  const _asnwer = async (selectedAnswerNumber: number) => {
    await community.answer_quiz(account, currentQuizId, selectedAnswerNumber)
  }

  return (
    <Table celled striped size='small' color='green'>
      <Body className='ModalText'>
        <Row>
          <Cell width={3}>Active Event:</Cell>
          <Cell className='Important'>
            {eventName == '' ? <span>None</span> : <span>{eventName}</span>}
          </Cell>
          <Cell></Cell>
        </Row>
        <Row>
          <Cell>Active Quiz:</Cell>
          <Cell className='Important'>
            {currentQuizId == 0 ? <span>None</span> : <span>{currentQuizId} ({isOpen ? 'Open' : 'Closed'})</span>}
          </Cell>
          <Cell></Cell>
        </Row>
        {(full && currentQuizId > 0) && (
          <>
            <Row>
              <Cell>Question:</Cell>
              <Cell className='Important'>{question}</Cell>
              <Cell></Cell>
            </Row>
            <Row>
              <Cell>Description:</Cell>
              <Cell className='Important'>{description}</Cell>
              <Cell></Cell>
            </Row>
            {options.map((q, i) => {
              const isTheAnswer = (answerNumber == (i + 1));
              const isYourAnswer = (playerAnswerNumber == (i + 1));
              return (
                <Row key={i} className={isTheAnswer ? 'BgWarning' : ''}>
                  <Cell className='Important'>Option {i + 1}: {answerCounts[i + 1]}</Cell>
                  <Cell className={isYourAnswer ? 'Important' : ''}>
                    {q}
                  </Cell>
                  <Cell className={isYourAnswer ? 'Important' : ''}>
                    {!isConnected ?
                      <Button fluid>
                        Connect to answer
                      </Button>
                      : isOpen ?
                        <Button fluid active={isYourAnswer} onClick={() => _asnwer(i + 1)}>
                          {isYourAnswer ? 'Your Answer' : 'Select'}
                        </Button>
                        : isClosed ?
                          <Button fluid disabled={true}>
                            {isYourAnswer ? 'Your Answer' : 'Select'}
                          </Button>
                          : <></>
                    }
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
  // admin params
  const [eventName, setEventName] = useState('')
  const [quizId, setQuizId] = useState(0)
  const { quizIds } = useQuizQuestionsByEventName(eventName)
  useEffect(() => {
    setQuizId(quizIds[0] ?? 0)
  }, [quizIds])

  // create
  const { account } = useAccount()
  const { community } = useDojoSystemCalls()
  const [isCreating, setIsCreating] = useState(false)
  const _createQuiz = async () => {
    setIsCreating(true)
    await community.create_quiz(account, eventName)
  }
  useEffect(() => {
    if (isCreating && quizIds.length > 0) {
      setIsCreating(false)
      // setQuizId(quizIds[quizIds.length - 1])
    }
  }, [isCreating, quizIds])

  return (
    <>
      <Table celled striped size='small' color='green'>
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
        </Body>
      </Table>
      <QuizAdminQuestion quizId={quizId} />
    </>
  )
}

function QuizAdminQuestion({
  quizId,
}: {
  quizId: number,
}) {
  const { isOffChain, isOpen, isClosed } = useQuizQuestion(quizId)
  const COOKIE_NAME = useMemo(() => _questionCookieName(quizId), [quizId]);
  const COOKIE_NAME_ANSWER = useMemo(() => _answerCookieName(quizId), [quizId]);
  const [cookies, setCookie] = useCookies([COOKIE_NAME, COOKIE_NAME_ANSWER]);
  const fields = useMemo<QuestionFields>(() => (cookies[COOKIE_NAME] ?? EMPTY_QUESTION), [cookies[COOKIE_NAME]]);
  const answerNumber = useMemo(() => (cookies[COOKIE_NAME_ANSWER] ?? 0), [cookies[COOKIE_NAME_ANSWER]])
  const validated = useMemo(() => (
    fields.question.length > 0 && fields.options.length >= 2 && fields.options.every((option) => option.length > 0)
  ), [fields]);

  const { account } = useAccount()
  const { community } = useDojoSystemCalls()
  const _start = () => {
    community.open_quiz(account, quizId, fields.question, fields.description, fields.options)
  }
  const _stop = () => {
    community.close_quiz(account, quizId, answerNumber)
  }

  const canStart = useMemo(() => (isOffChain && validated), [isOffChain, validated])
  const canStop = useMemo(() => (isOpen && answerNumber > 0), [isOpen, answerNumber])

  if (quizId == 0) return <></>;
  return (
    <Table celled striped size='small' color={isOffChain ? 'blue' : isOpen ? 'green' : 'red'}>
      <Body className='ModalText'>
        <Row>
          <Cell width={3} className='Important'>Quiz ID: {quizId}</Cell>
          <Cell>
            {isOffChain ? 'off-chain' : isOpen ? 'Open' : 'Closed'}
            {' | '}
            <Button disabled={!canStart} onClick={_start}>OPEN</Button>
            {' | '}
            <Button disabled={!canStop} onClick={_stop}>CLOSE</Button>
          </Cell>
        </Row>
        {isOffChain && <QuizAdminQuestionOffChain quizId={quizId} />}
        {!isOffChain && <QuizAdminQuestionOnChain quizId={quizId} />}
      </Body>
    </Table>
  )
}



type QuestionFields = {
  question: string,
  description: string,
  options: string[],
}
const EMPTY_QUESTION: QuestionFields = {
  question: '',
  description: '',
  options: [],
}
const _questionCookieName = (quizId: number) => `quiz_${quizId}`;
const _answerCookieName = (quizId: number) => `quiz_${quizId}_answer`;

//
// Question form when form data is on-chain
function QuizAdminQuestionOnChain({
  quizId,
}: {
  quizId: number,
}) {
  // off-chain data
  const COOKIE_NAME_ANSWER = useMemo(() => _answerCookieName(quizId), [quizId]);
  const [cookies, setCookie] = useCookies([COOKIE_NAME_ANSWER]);

  // on-chain data
  const { eventName } = useQuizQuestion(quizId)
  const { playersByAnswer, answerCounts } = useQuizAnswersByEventName(eventName)
  const { question, description, options, answerNumber, isOpen, isClosed } = useQuizQuestion(quizId)
  const fields = useMemo<QuestionFields>(() => ({
    question: question,
    description: description,
    options: options,
    answerNumber,
  }), [question, description, options, answerNumber]);

  return (
    <>
      <QuizAdminQuestionForm quizId={quizId} fields={fields} answerNumber={answerNumber} answerCounts={answerCounts} isOpen={isOpen} isClosed={isClosed} />
    </>
  )
}

//
// Question form when form data is on-chain
function QuizAdminQuestionOffChain({
  quizId,
}: {
  quizId: number,
}) {
  const COOKIE_NAME = useMemo(() => _questionCookieName(quizId), [quizId]);
  const [cookies, setCookie] = useCookies([COOKIE_NAME]);
  const [fields, setFields] = useState<QuestionFields>({ ...EMPTY_QUESTION })
  useEffect(() => {
    if (cookies[COOKIE_NAME]) {
      console.log(`QUIZ[${quizId}] cookie[${COOKIE_NAME}] >>> read:`, cookies[COOKIE_NAME])
      setFields(cookies[COOKIE_NAME])
    } else {
      setFields({ ...EMPTY_QUESTION })
    }
  }, [cookies[COOKIE_NAME]])
  const _setFields = (fields: QuestionFields) => {
    // console.log(`QUIZ[${quizId}] cookie[${COOKIE_NAME}] <<< set:`, fields)
    setCookie(COOKIE_NAME, fields)
    // setFields(fields)
  }

  return <QuizAdminQuestionForm quizId={quizId} fields={fields} setFields={_setFields} />
}


//
// Question form for both and off-chain and on-chain
function QuizAdminQuestionForm({
  quizId,
  fields,
  answerNumber = 0,
  answerCounts = {},
  isOpen,
  isClosed,
  setFields,
}: {
  quizId: number,
  fields: QuestionFields,
  answerNumber?: number,
  answerCounts?: Record<number, number>,
  isOpen?: boolean,
  isClosed?: boolean,
  setFields?: (fields: QuestionFields) => void,
}) {
  const _setQuestion = (question: string) => {
    setFields({ ...fields, question })
  }
  const _setDescription = (description: string) => {
    setFields({ ...fields, description })
  }
  const _setOption = (index: number, option: string) => {
    const options = [...fields.options]
    options[index] = option
    setFields({ ...fields, options })
  }
  const _addOption = () => {
    const options = [...fields.options]
    options.push('')
    setFields({ ...fields, options })
  }
  const _deleteOption = (index: number) => {
    const options = [...fields.options]
    options.splice(index, 1)
    setFields({ ...fields, options })
  }

  // available to all
  const COOKIE_NAME_ANSWER = useMemo(() => _answerCookieName(quizId), [quizId]);
  const [cookies, setCookie] = useCookies([COOKIE_NAME_ANSWER]);
  const _setAnswerNumber = (answerNumber: number) => {
    setCookie(COOKIE_NAME_ANSWER, answerNumber)
  }

  const editable = useMemo(() => (!isOpen && !isClosed), [isOpen, isClosed])
  const isFinished = useMemo(() => (answerNumber > 0), [answerNumber])
  const _answerNumber = useMemo(() => (answerNumber || cookies[COOKIE_NAME_ANSWER] || 0), [answerNumber, cookies[COOKIE_NAME_ANSWER]])
  const _answerIndex = useMemo(() => (_answerNumber - 1), [_answerNumber])

  return (
    <>
      <Row>
        <Cell>Question:</Cell>
        <Cell className='Code'>
          <Input disabled={!editable} value={fields.question} onChange={(e) => _setQuestion(e.target.value)} maxLength={100} style={{ width: '600px' }} />
        </Cell>
      </Row>
      <Row>
        <Cell>Description:</Cell>
        <Cell className='Code'>
          <Input disabled={!editable} value={fields.description} onChange={(e) => _setDescription(e.target.value)} maxLength={100} style={{ width: '600px' }} />
        </Cell>
      </Row>
      {fields.options.map((option, index) => (
        <Row key={index}>
          <Cell className='Important'>Option {index + 1}: {answerCounts[index + 1]}</Cell>
          <Cell className='Code'>
            <Input disabled={!editable} value={option} onChange={(e) => _setOption(index, e.target.value)} maxLength={100} style={{ width: '600px' }} />
            {editable && (
              <>
                {' | '}
                <Button icon='trash' size='small' onClick={() => _deleteOption(index)} />
              </>
            )}
            {' | '}
            <Button key={index}
              active={index == _answerIndex}
              disabled={isFinished}
              onClick={() => _setAnswerNumber(index + 1)}
            >
              {index == _answerIndex ? 'CORRECT' : 'Select'}
            </Button>
          </Cell>
        </Row>
      ))}
      {editable && (
        <Row>
          <Cell></Cell>
          <Cell>
            <Button onClick={_addOption}>Add Answer</Button>
          </Cell>
        </Row>
      )}
    </>
  )
}
