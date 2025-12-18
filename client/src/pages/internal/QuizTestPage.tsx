import React, { useEffect, useMemo, useState } from 'react'
import { Button, Container, Dropdown, Input, Tab, Table, TabPane } from 'semantic-ui-react'
import { useAccount } from '@starknet-react/core'
import { useCookies } from 'react-cookie'
import { useDojoSystemCalls } from '@underware/pistols-sdk/dojo'
import { useQuizConfig } from '/src/stores/configStore'
import {
  useFetchAllQuiz,
  useQuizParty,
  useQuizAllParties,
  useQuizAnswers,
  useQuizPlayerAnswer,
  useQuizQuestion,
  useQuizQuestionsByParty,
  useQuizQuestionWinners,
  useQuizPartyLeaderboards,
} from '/src/stores/quizStore'
import { InternalPageMenu, InternalPageWrapper } from '/src/pages/internal/InternalPageIndex'
import { EntityStoreSync } from '/src/stores/sync/EntityStoreSync'
import { PlayerNameSync } from '/src/stores/sync/PlayerNameSync'
import { Address } from '/src/components/ui/Address'
import { Connect } from '/src/pages/tests/ConnectTestPage'
import CurrentChainHint from '/src/components/CurrentChainHint'
import AppDojo from '/src/components/AppDojo'
import { FormInputTimestampUTC } from '/src/components/ui/Form'
import { formatTimestampLocal } from '@underware/pistols-sdk/utils'
import { ActionButton } from '/src/components/ui/Buttons'

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
  const { partyName, timestamp_start, isPartyClosed } = useQuizParty(currentPartyId)
  const { question, description, hint, options, answerNumber, isOpen, isClosed } = useQuizQuestion(currentPartyId, currentQuestionId)
  const { playerAnswerNumber } = useQuizPlayerAnswer(currentPartyId, currentQuestionId, address)
  const { answerCounts } = useQuizAnswers(currentPartyId, currentQuestionId)

  useFetchAllQuiz();

  const _asnwer = async (selectedAnswerNumber: number) => {
    await community.answer_quiz_question(account, currentPartyId, currentQuestionId, selectedAnswerNumber)
  }

  return (
    <>
      <Table celled striped size='small' color='green'>
        <Body className='ModalText'>
          <Row>
            <Cell width={3}>Active Party:</Cell>
            <Cell>
              <span className='Important'>
                {currentPartyId}: {partyName == '' ? <span>None</span> : <span>{partyName}</span>}
              </span>
              {isPartyClosed && ' (Closed)'}

              {' | '}
              <a href={`/quizroom/${partyName.replaceAll(' ', '')}`} target='_blank'>LINK</a>
            </Cell>
          </Row>
          <Row>
            <Cell>Active Question:</Cell>
            <Cell className='Important'>
              {currentQuestionId == 0 ? <span>None</span> : <span>{currentQuestionId}: ({isOpen ? 'Open' : 'Closed'})</span>}
            </Cell>
          </Row>
          {(full && currentPartyId > 0) && (
            <>
              <Row>
                <Cell>Start Time (local):</Cell>
                <Cell className='Code'>{formatTimestampLocal(timestamp_start)}</Cell>
              </Row>
            </>
          )}
        </Body>
      </Table>
      {(full && currentQuestionId > 0) && (
        <Table celled striped size='small' color='green'>
          <Body className='ModalText'>
            <Row>
              <Cell width={3}>Question:</Cell>
              <Cell className='Important'>{question}</Cell>
              <Cell width={3}></Cell>
            </Row>
            <Row>
              <Cell>Description:</Cell>
              <Cell className='Important'>{description}</Cell>
              <Cell></Cell>
            </Row>
            <Row>
              <Cell>Hint:</Cell>
              <Cell className='Important'>{hint}</Cell>
              <Cell></Cell>
            </Row>
            {options.map((q, i) => {
              const isTheAnswer = (answerNumber == (i + 1));
              const isYourAnswer = (playerAnswerNumber == (i + 1));
              return (
                <Row key={i} className={isTheAnswer ? 'BgDark' : ''}>
                  <Cell className='Important'>Option {i + 1} ({answerCounts[i + 1]})</Cell>
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
            <QuizResults partyId={currentPartyId} questionId={currentQuestionId} />
          </Body>
        </Table>
      )}
    </>
  )
}

function QuizResults({
  partyId,
  questionId,
}: {
  partyId: number,
  questionId: number,
}) {
  const { winners } = useQuizQuestionWinners(partyId, questionId)
  const { leaderboards } = useQuizPartyLeaderboards(partyId)
  return (
    <>
      <Row>
        <Cell className='Important'>Winners:</Cell>
        <Cell className='Code Smallest'>
          {winners.map((winner) =>
            <React.Fragment key={winner.address}>
              <Address address={winner.address} />
              ({winner.name}) / score: {winner.score}<br />
            </React.Fragment>
          )}
        </Cell>
        <Cell></Cell>
      </Row>
      <Row>
        <Cell className='Important'>Leaderboards:</Cell>
        <Cell className='Code Smallest'>
          {leaderboards.map((leaderboard) =>
            <React.Fragment key={leaderboard.address}>
              <Address address={leaderboard.address} />
              ({leaderboard.name}) / score: {leaderboard.score} / {leaderboard.wins} wins<br />
            </React.Fragment>
          )}
        </Cell>
        <Cell></Cell>
      </Row>
    </>
  )
}







//--------------------------------
// Admin Panel (Party)
//

// const _cookieOptions = { path: '/' }
const COOKIE_PARTY_ID = 'quiz_party_id'
const COOKIE_QUESTION_ID = 'quiz_question_id'

function useSelectedQuiz() {
  const [cookies, setCookie] = useCookies([COOKIE_PARTY_ID, COOKIE_QUESTION_ID]);
  const selectedPartyId = useMemo(() => cookies[COOKIE_PARTY_ID], [cookies[COOKIE_PARTY_ID]])
  const selectedQuestionId = useMemo(() => cookies[COOKIE_QUESTION_ID], [cookies[COOKIE_QUESTION_ID]])
  const setSelectedPartyId = (selectedPartyId: number) => {
    setCookie(COOKIE_PARTY_ID, selectedPartyId)
    setCookie(COOKIE_QUESTION_ID, 0)
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
  const { partyName, description, timestamp_start, timestamp_end, isPartyClosed } = useQuizParty(selectedPartyId)
  useEffect(() => {
    if (selectedPartyId == 0) {
      setIsNewParty(true);
      setFields(EMPTY_PARTY);
    } else {
      setIsNewParty(false);
      setFields({
        name: partyName,
        description: description,
        timestamp_start: timestamp_start,
        timestamp_end: timestamp_end,
      });
    }
  }, [selectedPartyId, partyName, description, timestamp_start, timestamp_end])
  const isValid = useMemo(() => (
    fields.name.length > 0 && fields.description.length > 0
  ), [fields])

  const _setName = (name: string) => {
    setFields({ ...fields, name });
  }
  const _setDescription = (description: string) => {
    setFields({ ...fields, description });
  }
  const _setStartTime = (timestamp: number) => {
    console.log('_setStartTime >>>', timestamp, typeof timestamp);
    setFields({ ...fields, timestamp_start: timestamp })
  }

  // create
  const { partyCount } = useQuizConfig()
  const [isBusy, setIsBusy] = useState<boolean>(false)
  const { account } = useAccount()
  const { community } = useDojoSystemCalls()
  const _createParty = async () => {
    setIsBusy(true);
    await community.create_quiz_party(account, fields.name, fields.description, fields.timestamp_start)
    setIsBusy(false);
    setSelectedPartyId(partyCount + 1)
  }
  const _editParty = async () => {
    setIsBusy(true);
    await community.edit_quiz_party(account, selectedPartyId, fields.name, fields.description, fields.timestamp_start)
    setIsBusy(false);
  }
  const _closeParty = async () => {
    setIsBusy(true);
    await community.close_quiz_party(account, selectedPartyId)
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
              <Input value={fields.name} disabled={isPartyClosed} onChange={(e) => _setName(e.target.value.toString())} maxLength={100} style={{ width: '500px' }} />
            </Cell>
          </Row>
          <Row>
            <Cell width={3}>Description:</Cell>
            <Cell className='Code'>
              <Input value={fields.description} disabled={isPartyClosed} onChange={(e) => _setDescription(e.target.value.toString())} maxLength={100} style={{ width: '500px' }} />
            </Cell>
          </Row>
          <Row>
            <Cell width={3}>Start Time (UTC):</Cell>
            <Cell className='Code'>
              <FormInputTimestampUTC timestamp={fields.timestamp_start} disabled={isPartyClosed} setTimestamp={_setStartTime} style={{ width: '250px' }} />
            </Cell>
          </Row>
          {!isPartyClosed && (
            <Row>
              <Cell width={3}></Cell>
              <Cell className='Code'>
                {isNewParty && <Button disabled={!isValid || isBusy} onClick={_createParty}>Create New Party</Button>}
                {!isNewParty && (
                  <>
                    <Button disabled={!isValid || isBusy} onClick={_editParty}>Update Party</Button>
                    {' | '}
                    <ActionButton negative label='Close Party' disabled={isPartyClosed} loading={isBusy} onClick={_closeParty} confirm confirmMessage='Closing a party is irreversible!' />
                  </>
                )}
              </Cell>
            </Row>
          )}
          {isPartyClosed && (
            <Row>
              <Cell width={3}>End Time (UTC):</Cell>
              <Cell className='Code'>
                <FormInputTimestampUTC timestamp={fields.timestamp_end} disabled={isPartyClosed} setTimestamp={undefined} style={{ width: '250px' }} />
              </Cell>
            </Row>
          )}
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
  const { currentPartyId } = useQuizConfig()
  const { selectedPartyId, setSelectedPartyId, setSelectedQuestionId } = useSelectedQuiz()
  const { partyNamesById } = useQuizAllParties()
  const _selectParty = (partyId: number) => {
    setSelectedPartyId(partyId)
    setSelectedQuestionId(0)
  }
  const { account } = useAccount()
  const { community } = useDojoSystemCalls()
  const _setCurrent = () => {
    community.set_current_quiz(account, selectedPartyId, 0)
  }
  const isCurrentParty = useMemo(() => (selectedPartyId == currentPartyId), [selectedPartyId, currentPartyId])
  return (
    <>
      <Row>
        <Cell width={3}>Party: {selectedPartyId}</Cell>
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
              <Button active={true} onClick={() => _setCurrent()} disabled={isCurrentParty}>{isCurrentParty ? 'Active' : 'Set Active'}</Button>
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

type QuestionFields = {
  question: string,
  description: string,
  hint: string,
  options: string[],
  answerNumber: number,
}
const EMPTY_QUESTION: QuestionFields = {
  question: '',
  description: '',
  hint: '',
  options: [],
  answerNumber: 0,
}
const _questionCookieName = (partyId: number, questionId: number) => `quiz_${partyId}_${questionId}`;

function QuizAdminQuestionsPanel() {
  // admin params
  const { currentPartyId, currentQuestionId } = useQuizConfig()
  const { selectedPartyId, selectedQuestionId, setSelectedQuestionId } = useSelectedQuiz()
  const { isPartyClosed } = useQuizParty(selectedPartyId)
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
              {questionIds.map((q) => {
                const isCurrentParty = (selectedPartyId == currentPartyId);
                const isPast = isCurrentParty && (q < currentQuestionId);
                const isCurrent = isCurrentParty && (q == currentQuestionId);
                return (<Button key={q}
                  className={isCurrent ? 'Important' : isPast ? 'Negative' : ''}
                  onClick={() => setSelectedQuestionId(q)}
                  active={q == selectedQuestionId}
                >
                  {q}
                </Button>)
              })}
              {!isPartyClosed && (
                <>
                  {' | '}
                  <Button onClick={_createQuiz} disabled={isCreating || selectedPartyId == 0}>New Question</Button>
                </>
              )}
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
  const { isPartyClosed } = useQuizParty(partyId)
  const { isOffChain, isOpen } = useQuizQuestion(partyId, questionId)
  const COOKIE_NAME = useMemo(() => _questionCookieName(partyId, questionId), [partyId, questionId]);
  const [cookies, setCookie] = useCookies([COOKIE_NAME]);
  const fields = useMemo<QuestionFields>(() => (cookies[COOKIE_NAME] ?? EMPTY_QUESTION), [cookies[COOKIE_NAME]]);
  const validated = useMemo(() => (
    fields.question.length > 0 && fields.options.length >= 2 && fields.options.every((option) => option.length > 0)
  ), [fields]);

  const { account } = useAccount()
  const { community } = useDojoSystemCalls()
  const _start = () => {
    const quotedOptions = fields.options.map(option => `"${option}"`) //TODO test and replace later
    community.open_quiz_question(account, partyId, questionId, fields.question, fields.description, fields.hint, quotedOptions)
  }
  const _stop = () => {
    community.close_quiz_question(account, partyId, questionId, fields.answerNumber)
  }

  const canStart = useMemo(() => (isOffChain && validated), [isOffChain, validated])
  const canStop = useMemo(() => (isOpen && fields.answerNumber > 0), [isOpen, fields.answerNumber])

  console.log('QuizAdminQuestion >>>', questionId, isOffChain, validated, canStart, fields, fields.options)

  if (questionId == 0) return <></>;
  return (
    <Table celled striped size='small' color={isOffChain ? 'red' : isOpen ? 'green' : 'orange'}>
      <Body className='ModalText'>
        <Row>
          <Cell width={3} className='Important'>Question ID: {questionId}</Cell>
          <Cell>
            {isOffChain ? 'off-chain' : isOpen ? 'Open' : 'Closed'}
            {' | '}
            <ActionButton disabled={!canStart || isPartyClosed} active={canStart} onClick={_start} label='DEPLOY / START' confirm confirmMessage='Deploying a question is irreversible!' />
            {' | '}
            <ActionButton disabled={!canStop} active={canStop} onClick={_stop} label='STOP / FINISH' confirm confirmMessage='Stopping a question is irreversible!' />
          </Cell>
        </Row>
        {isOffChain && <QuizAdminQuestionOffChain partyId={partyId} questionId={questionId} />}
        {!isOffChain && <QuizAdminQuestionOnChain partyId={partyId} questionId={questionId} />}
      </Body>
    </Table>
  )
}



//
// Question form when form data is on-chain
function QuizAdminQuestionOnChain({
  partyId,
  questionId,
}: {
  partyId: number,
  questionId: number,
}) {
  const { answerCounts } = useQuizAnswers(partyId, questionId)
  const { question, description, hint, options, answerNumber, isOpen, isClosed } = useQuizQuestion(partyId, questionId)

  // cookies used for the answerNumber only
  const COOKIE_NAME = useMemo(() => _questionCookieName(partyId, questionId), [partyId, questionId]);
  const [cookies, setCookie] = useCookies([COOKIE_NAME]);
  const _setFields = (fields: QuestionFields) => {
    setCookie(COOKIE_NAME, fields)
  }

  const fields = useMemo<QuestionFields>(() => ({
    question: question,
    description: description,
    hint: hint,
    options: options,
    answerNumber: answerNumber || cookies[COOKIE_NAME]?.answerNumber || 0,
  }), [question, description, options, answerNumber, cookies[COOKIE_NAME]]);

  return (
    <>
      <QuizAdminQuestionForm
        partyId={partyId}
        questionId={questionId}
        fields={fields}
        answerCounts={answerCounts}
        isOpen={isOpen}
        isClosed={isClosed}
        setFields={_setFields}
      />
      <QuizResults partyId={partyId} questionId={questionId} />
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
      // console.log(`QUIZ[${partyId}][${questionId}] cookie[${COOKIE_NAME}] >>> read:`, cookies[COOKIE_NAME])
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

  return (
    <QuizAdminQuestionForm
      partyId={partyId}
      questionId={questionId}
      fields={fields}
      setFields={_setFields}
    />
  )
}


//
// Question form for both and off-chain and on-chain
function QuizAdminQuestionForm({
  partyId,
  questionId,
  fields,
  answerCounts = {},
  isOpen,
  isClosed,
  setFields,
}: {
  partyId: number,
  questionId: number,
  fields: QuestionFields,
  answerCounts?: Record<number, number>,
  isOpen?: boolean,
  isClosed?: boolean,
  setFields?: (fields: QuestionFields) => void,
}) {
  const { isPartyClosed } = useQuizParty(partyId)

  const _setQuestion = (question: string) => {
    setFields({ ...fields, question })
  }
  const _setDescription = (description: string) => {
    setFields({ ...fields, description })
  }
  const _setHint = (hint: string) => {
    setFields({ ...fields, hint })
  }
  const _setOption = (index: number, option: string) => {
    const options = [...fields.options]
    options[index] = option
    setFields({ ...fields, options })
  }
  const _setAnswerNumber = (value: number) => {
    setFields({ ...fields, answerNumber: value })
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

  const editable = useMemo(() => (!isOpen && !isClosed && !isPartyClosed), [isOpen, isClosed, isPartyClosed])
  const answerIndex = useMemo(() => (fields.answerNumber - 1), [fields.answerNumber])
  // console.log(`quiz answer(${partyId},${questionId}) [${COOKIE_NAME_ANSWER}]`, answerNumber, _answerNumber, _answerIndex, 'cookies:', cookies[COOKIE_NAME_ANSWER], cookies, Object.keys(cookies))

  return (
    <>
      <Row>
        <Cell>Question:</Cell>
        <Cell className='Code'>
          <Input disabled={!editable} value={fields.question} onChange={(e) => _setQuestion(e.target.value.toString())} maxLength={360} style={{ width: '500px' }} />
        </Cell>
      </Row>
      <Row>
        <Cell>Description:</Cell>
        <Cell className='Code'>
          <Input disabled={!editable} value={fields.description} onChange={(e) => _setDescription(e.target.value.toString())} maxLength={100} style={{ width: '500px' }} />
        </Cell>
      </Row>
      <Row>
        <Cell>Hint (optional):</Cell>
        <Cell className='Code'>
          <Input disabled={!editable} value={fields.hint} onChange={(e) => _setHint(e.target.value.toString())} maxLength={100} style={{ width: '500px' }} />
        </Cell>
      </Row>
      {fields.options.map((option, index) => (
        <Row key={index} className={index == answerIndex ? 'BgDark' : ''}>
          <Cell className='Important'>Option {index + 1} ({answerCounts[index + 1]})</Cell>
          <Cell className='Code'>
            <Input disabled={!editable} value={option} onChange={(e) => _setOption(index, e.target.value.toString())} maxLength={120} style={{ width: '500px' }} />
            {editable && (
              <>
                {' | '}
                <Button icon='trash' size='small' onClick={() => _deleteOption(index)} />
              </>
            )}
            {' | '}
            <Button key={index}
              active={index == answerIndex}
              disabled={isClosed || isPartyClosed}
              onClick={() => _setAnswerNumber(index + 1)}
            >
              {index == answerIndex ? 'THE ANSWER' : 'Answer'}
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
