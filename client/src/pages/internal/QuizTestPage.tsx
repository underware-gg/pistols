import React, { useEffect, useMemo, useState } from 'react'
import { Button, Container, Dropdown, Input, Tab, Table, TabPane } from 'semantic-ui-react'
import { useAccount } from '@starknet-react/core'
import { useCookies } from 'react-cookie'
import { useDojoSystemCalls } from '@underware/pistols-sdk/dojo'
import { useQuizConfig } from '/src/stores/configStore'
import {
  useQuizParty,
  useQuizAllParties,
  useQuizAnswers,
  useQuizPlayerAnswer,
  useQuizQuestion,
  useQuizQuestionsByParty,
  useQuizQuestionWinners,
} from '/src/stores/quizStore'
import { InternalPageMenu, InternalPageWrapper } from '/src/pages/internal/InternalPageIndex'
import { EntityStoreSync } from '/src/stores/sync/EntityStoreSync'
import { PlayerNameSync } from '/src/stores/sync/PlayerNameSync'
import { Address } from '/src/components/ui/Address'
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
        <PlayerNameSync />
      </Container>
    </AppDojo>
  );
}

function Quiz() {
  return (
    <Tab panes={[
      { menuItem: 'Players: Live', render: () => <TabPane className='NoBorder'><QuizPlayerPanel full /></TabPane> },
      { menuItem: 'Admin: Party', render: () => <TabPane className='NoBorder'><QuizPlayerPanel /><QuizAdminPartyPanel /></TabPane> },
      { menuItem: 'Admin: Questions', render: () => <TabPane className='NoBorder'><QuizPlayerPanel /><QuizAdminQuestionsPanel /></TabPane> },
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
  const { currentPartyId, currentQuestionId } = useQuizConfig()
  const { partyName } = useQuizParty(currentPartyId)
  const { question, description, options, answerNumber, isOpen, isClosed } = useQuizQuestion(currentPartyId, currentQuestionId)
  const { playerAnswerNumber } = useQuizPlayerAnswer(currentPartyId, currentQuestionId, address)
  const { playersByAnswer, answerCounts } = useQuizAnswers(currentPartyId, currentQuestionId)
  const { winners } = useQuizQuestionWinners(currentPartyId, currentQuestionId)

  const _asnwer = async (selectedAnswerNumber: number) => {
    await community.answer_quiz(account, currentPartyId, currentQuestionId, selectedAnswerNumber)
  }

  return (
    <Table celled striped size='small' color='green'>
      <Body className='ModalText'>
        <Row>
          <Cell width={3}>Active Party:</Cell>
          <Cell className='Important'>
            {currentPartyId}: {partyName == '' ? <span>None</span> : <span>{partyName}</span>}
          </Cell>
          <Cell></Cell>
        </Row>
        <Row>
          <Cell>Active Question:</Cell>
          <Cell className='Important'>
            {currentQuestionId == 0 ? <span>None</span> : <span>{currentQuestionId}: ({isOpen ? 'Open' : 'Closed'})</span>}
          </Cell>
          <Cell></Cell>
        </Row>
        {(full && currentQuestionId > 0) && (
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
                <Row key={i} className={isTheAnswer ? 'BgDark' : ''}>
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
            <Row>
              <Cell className='Important'>Winners:</Cell>
              <Cell className='Code Smallest'>
                {winners.map((winner) => <React.Fragment key={winner.address}><Address address={winner.address} />({winner.name})<br /></React.Fragment>)}
              </Cell>
            </Row>
          </>
        )}
      </Body>
    </Table>
  )
}







//--------------------------------
// Admin Panel (Party)
//

const COOKIE_PARTY_ID = 'quiz_party_id'
const COOKIE_QUESTION_ID = 'quiz_question_id'
function useSelectedQuiz() {
  const [cookies, setCookie] = useCookies([COOKIE_PARTY_ID, COOKIE_QUESTION_ID]);
  const selectedPartyId = useMemo(() => cookies[COOKIE_PARTY_ID], [cookies[COOKIE_PARTY_ID]])
  const selectedQuestionId = useMemo(() => cookies[COOKIE_QUESTION_ID], [cookies[COOKIE_QUESTION_ID]])
  const setSelectedPartyId = (selectedPartyId: number) => {
    setCookie(COOKIE_PARTY_ID, selectedPartyId)
  }
  const setSelectedQuestionId = (selectedQuestionId: number) => {
    setCookie(COOKIE_QUESTION_ID, selectedQuestionId)
  }
  return {
    selectedPartyId,
    selectedQuestionId,
    setSelectedPartyId,
    setSelectedQuestionId,
  }
}

type PartyFields = {
  name: string,
  description: string,
  timestamp_start: number,
  timestamp_end: number,
}
const EMPTY_PARTY: PartyFields = {
  name: '',
  description: '',
  timestamp_start: 0,
  timestamp_end: 0,
}

function QuizAdminPartyPanel() {
  const { selectedPartyId, setSelectedPartyId } = useSelectedQuiz()
  const [fields, setFields] = useState<PartyFields>(EMPTY_PARTY)
  const [isNewParty, setIsNewParty] = useState<boolean>(false)

  // update from on-chain data
  const { partyName, description, timestamp_start, timestamp_end } = useQuizParty(selectedPartyId)
  useEffect(() => {
    if (selectedPartyId == 0) {
      setIsNewParty(true)
      setFields(EMPTY_PARTY)
    } else {
      setIsNewParty(false)
      setFields({
        name: partyName,
        description: description,
        timestamp_start: timestamp_start,
        timestamp_end: timestamp_end,
      })
    }
  }, [selectedPartyId, partyName, description, timestamp_start, timestamp_end])
  const isValid = useMemo(() => (
    fields.name.length > 0 && fields.description.length > 0
  ), [fields])

  const _setName = (name: string) => {
    setFields({ ...fields, name })
  }
  const _setDescription = (description: string) => {
    console.log(`PARTY description <<< set:`, description, typeof description)
    setFields({ ...fields, description })
  }

  // create
  const { partyCount } = useQuizConfig()
  const [isBusy, setIsBusy] = useState<boolean>(false)
  const { account } = useAccount()
  const { community } = useDojoSystemCalls()
  const _createParty = async () => {
    setIsBusy(true);
    await community.create_quiz_party(account, fields.name, fields.description, fields.timestamp_start, fields.timestamp_end)
    setIsBusy(false);
    setSelectedPartyId(partyCount + 1)
  }
  const _editParty = async () => {
    setIsBusy(true);
    console.log(`PARTY description <<< edit:`, fields.description, typeof fields.description)
    await community.edit_quiz_party(account, selectedPartyId, fields.name, fields.description, fields.timestamp_start, fields.timestamp_end)
    setIsBusy(false);
  }

  return (
    <>
      <Table celled striped size='small' color='green'>
        <Body className='ModalText'>
          <QuizPartySelectorRows editable />
          <Row>
            <Cell width={3}>Name:</Cell>
            <Cell className='Code'>
              <Input value={fields.name} onChange={(e) => _setName(e.target.value.toString())} maxLength={100} style={{ width: '500px' }} />
            </Cell>
          </Row>
          <Row>
            <Cell width={3}>Description:</Cell>
            <Cell className='Code'>
              <Input value={fields.description} onChange={(e) => _setDescription(e.target.value.toString())} maxLength={100} style={{ width: '500px' }} />
            </Cell>
          </Row>
          <Row>
            <Cell width={3}>Start Time:</Cell>
            <Cell className='Code'>
            </Cell>
          </Row>
          <Row>
            <Cell width={3}></Cell>
            <Cell className='Code'>
              {isNewParty && <Button disabled={!isValid || isBusy} onClick={_createParty}>Create New Party</Button>}
              {!isNewParty && <Button disabled={!isValid || isBusy} onClick={_editParty}>Update Party</Button>}
            </Cell>
          </Row>
        </Body>
      </Table>
    </>
  )
}


function QuizPartySelectorRows({
  editable
}: {
  editable?: boolean,
}) {
  const { selectedPartyId, setSelectedPartyId, setSelectedQuestionId } = useSelectedQuiz()
  const { partyNamesById } = useQuizAllParties()
  const _selectParty = (partyId: number) => {
    setSelectedPartyId(partyId)
    setSelectedQuestionId(0)
  }
  return (
    <>
      <Row>
        <Cell width={3}>Party:</Cell>
        <Cell className='Code'>
          <Dropdown
            value={selectedPartyId}
            options={Object.entries(partyNamesById).map(([id, name]) => ({
              key: id,
              value: Number(id),
              text: `${id}: ${name}`,
            }))}
            onChange={(e, { value }) => _selectParty(value as number)}
            placeholder='Select Party'
          />
          {editable && (
            <>
              {' | '}
              <Button onClick={() => _selectParty(0)} disabled={selectedPartyId == 0}>New Party</Button>
            </>
          )}
        </Cell>
      </Row>
    </>
  )
}



//--------------------------------
// Admin Panel (Questions)
//
function QuizAdminQuestionsPanel() {
  // admin params
  const { selectedPartyId, selectedQuestionId, setSelectedQuestionId } = useSelectedQuiz()
  const { questionIds } = useQuizQuestionsByParty(selectedPartyId)
  useEffect(() => {
    if (selectedQuestionId == 0 && questionIds.length > 0) {
      setSelectedQuestionId(questionIds[0])
    }
  }, [questionIds])

  // create
  const { account } = useAccount()
  const { community } = useDojoSystemCalls()
  const [isCreating, setIsCreating] = useState(false)
  const _createQuiz = async () => {
    setIsCreating(true)
    await community.create_quiz_question(account, selectedPartyId)
  }
  useEffect(() => {
    if (isCreating && questionIds.length > 0) {
      setIsCreating(false)
      // setQuestionId(questionIds[questionIds.length - 1])
    }
  }, [isCreating, questionIds])

  return (
    <>
      <Table celled striped size='small' color='orange'>
        <Body className='ModalText'>
          <QuizPartySelectorRows />
          <Row>
            <Cell>Questions:</Cell>
            <Cell className='Important'>
              {questionIds.map((q) =>
                <Button key={q} onClick={() => setSelectedQuestionId(q)} active={q == selectedQuestionId}>{q}</Button>
              )}
              {' | '}
              <Button onClick={_createQuiz} disabled={isCreating || selectedPartyId == 0}>New Question</Button>
            </Cell>
          </Row>
        </Body>
      </Table>
      <QuizAdminQuestion partyId={selectedPartyId} questionId={selectedQuestionId} />
    </>
  )
}

function QuizAdminQuestion({
  partyId,
  questionId,
}: {
  partyId: number,
  questionId: number,
}) {
  const { isOffChain, isOpen, isClosed } = useQuizQuestion(partyId, questionId)
  const COOKIE_NAME = useMemo(() => _questionCookieName(partyId, questionId), [partyId, questionId]);
  const COOKIE_NAME_ANSWER = useMemo(() => _answerCookieName(partyId, questionId), [partyId, questionId]);
  const [cookies, setCookie] = useCookies([COOKIE_NAME, COOKIE_NAME_ANSWER]);
  const fields = useMemo<QuestionFields>(() => (cookies[COOKIE_NAME] ?? EMPTY_QUESTION), [cookies[COOKIE_NAME]]);
  const answerNumber = useMemo(() => (cookies[COOKIE_NAME_ANSWER] ?? 0), [cookies[COOKIE_NAME_ANSWER]])
  const validated = useMemo(() => (
    fields.question.length > 0 && fields.options.length >= 2 && fields.options.every((option) => option.length > 0)
  ), [fields]);

  const { account } = useAccount()
  const { community } = useDojoSystemCalls()
  const _start = () => {
    community.open_quiz(account, partyId, questionId, fields.question, fields.description, fields.options)
  }
  const _stop = () => {
    community.close_quiz(account, partyId, questionId, answerNumber)
  }

  const canStart = useMemo(() => (isOffChain && validated), [isOffChain, validated])
  const canStop = useMemo(() => (isOpen && answerNumber > 0), [isOpen, answerNumber])

  if (questionId == 0) return <></>;
  return (
    <Table celled striped size='small' color={isOffChain ? 'red' : isOpen ? 'green' : 'orange'}>
      <Body className='ModalText'>
        <Row>
          <Cell width={3} className='Important'>Question ID: {questionId}</Cell>
          <Cell>
            {isOffChain ? 'off-chain' : isOpen ? 'Open' : 'Closed'}
            {' | '}
            <Button disabled={!canStart} active={canStart} onClick={_start}>DEPLOY / START</Button>
            {' | '}
            <Button disabled={!canStop} active={canStop} onClick={_stop}>STOP / FINISH</Button>
          </Cell>
        </Row>
        {isOffChain && <QuizAdminQuestionOffChain partyId={partyId} questionId={questionId} />}
        {!isOffChain && <QuizAdminQuestionOnChain partyId={partyId} questionId={questionId} />}
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
const _questionCookieName = (partyId: number, questionId: number) => `quiz_${partyId}_${questionId}`;
const _answerCookieName = (partyId: number, questionId: number) => `quiz_${partyId}_${questionId}_answer`;

//
// Question form when form data is on-chain
function QuizAdminQuestionOnChain({
  partyId,
  questionId,
}: {
  partyId: number,
  questionId: number,
}) {
  const { playersByAnswer, answerCounts } = useQuizAnswers(partyId, questionId)
  const { question, description, options, answerNumber, isOpen, isClosed } = useQuizQuestion(partyId, questionId)
  const { winners } = useQuizQuestionWinners(partyId, questionId)

  const fields = useMemo<QuestionFields>(() => ({
    question: question,
    description: description,
    options: options,
    answerNumber,
  }), [question, description, options, answerNumber]);

  return (
    <>
      <QuizAdminQuestionForm partyId={partyId} questionId={questionId} fields={fields} answerNumber={answerNumber} answerCounts={answerCounts} isOpen={isOpen} isClosed={isClosed} />
      <Row>
        <Cell className='Important'>Winners:</Cell>
        <Cell className='Code Smallest'>
          {winners.map((winner) => <React.Fragment key={winner.address}><Address address={winner.address} />({winner.name})<br /></React.Fragment>)}
        </Cell>
      </Row>
    </>
  )
}

//
// Question form when form data is on-chain
function QuizAdminQuestionOffChain({
  partyId,
  questionId,
}: {
  partyId: number,
  questionId: number,
}) {
  const COOKIE_NAME = useMemo(() => _questionCookieName(partyId, questionId), [partyId, questionId]);
  const [cookies, setCookie] = useCookies([COOKIE_NAME]);
  const [fields, setFields] = useState<QuestionFields>({ ...EMPTY_QUESTION })
  useEffect(() => {
    if (cookies[COOKIE_NAME]) {
      console.log(`QUIZ[${partyId}][${questionId}] cookie[${COOKIE_NAME}] >>> read:`, cookies[COOKIE_NAME])
      setFields(cookies[COOKIE_NAME])
    } else {
      setFields({ ...EMPTY_QUESTION })
    }
  }, [cookies[COOKIE_NAME]])
  const _setFields = (fields: QuestionFields) => {
    // console.log(`QUIZ[${partyId}][${questionId}] cookie[${COOKIE_NAME}] <<< set:`, fields)
    setCookie(COOKIE_NAME, fields)
    // setFields(fields)
  }

  return <QuizAdminQuestionForm partyId={partyId} questionId={questionId} fields={fields} setFields={_setFields} />
}


//
// Question form for both and off-chain and on-chain
function QuizAdminQuestionForm({
  partyId,
  questionId,
  fields,
  answerNumber = 0,
  answerCounts = {},
  isOpen,
  isClosed,
  setFields,
}: {
  partyId: number,
  questionId: number,
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
  const COOKIE_NAME_ANSWER = useMemo(() => _answerCookieName(partyId, questionId), [partyId, questionId]);
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
          <Input disabled={!editable} value={fields.question} onChange={(e) => _setQuestion(e.target.value.toString())} maxLength={100} style={{ width: '500px' }} />
        </Cell>
      </Row>
      <Row>
        <Cell>Description:</Cell>
        <Cell className='Code'>
          <Input disabled={!editable} value={fields.description} onChange={(e) => _setDescription(e.target.value.toString())} maxLength={100} style={{ width: '500px' }} />
        </Cell>
      </Row>
      {fields.options.map((option, index) => (
        <Row key={index} className={index == _answerIndex ? 'BgDark' : ''}>
          <Cell className='Important'>Option {index + 1}: {answerCounts[index + 1]}</Cell>
          <Cell className='Code'>
            <Input disabled={!editable} value={option} onChange={(e) => _setOption(index, e.target.value.toString())} maxLength={100} style={{ width: '500px' }} />
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
              {index == _answerIndex ? 'THE ANSWER' : 'Answer'}
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
