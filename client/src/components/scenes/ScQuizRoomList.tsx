import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { useAllStoreModels } from '@underware/pistols-sdk/dojo'
import { formatTimestampDeltaCountdown, formatTimestampLocal } from '@underware/pistols-sdk/utils'
import { useClientTimestamp } from '@underware/pistols-sdk/utils/hooks'
import { models } from '@underware/pistols-sdk/pistols/gen'
import { usePistolsScene } from '/src/hooks/PistolsContext'
import { SceneName } from '/src/data/assetsTypes'
import {
  useActiveQuizQuestionsByParty,
  useFetchAllQuiz,
  useQuizPartyLeaderboards,
  useQuizPartyUniquePlayers,
  useQuizQuestion,
  useQuizQuestionsByParty,
  useQuizStore,
} from '/src/stores/quizStore'
import { _currentScene } from '/src/three/game'
import { InteractibleScene } from '/src/three/InteractibleScene'
import { useThreeJsContext } from '/src/hooks/ThreeJsContext'
import { AudioName, AUDIO_ASSETS } from '/src/data/audioAssets'
import { usePlayer } from '/src/stores/playerStore'
import { useAccount } from '@starknet-react/core'

type QuizPartyListItem = {
  id: number
  name: string
  description: string
  timestampStart: number
  timestampEnd: number
  questionCount: number
}

const FILTERED_QUIZ_IDS = [1]

const slugifyQuizName = (name: string) => name.toLowerCase().replaceAll(' ', '')

const formatCountdown = (now: number, target: number) => {
  if (!now || !target || target <= now) return ''
  const timer = formatTimestampDeltaCountdown(now, target)
  const parts = [] as string[]
  if (timer.days > 0) parts.push(`${timer.days}d`)
  if (timer.hours > 0) parts.push(`${timer.hours}h`)
  if (timer.minutes > 0) parts.push(`${timer.minutes}m`)
  if (parts.length === 0) parts.push(`${timer.seconds}s`)
  return parts.join(' ')
}

const QuizRoomCard = ({
  party,
  clientTimestamp,
  onEnter,
}: {
  party: QuizPartyListItem
  clientTimestamp: number
  onEnter: (slug: string) => void
}) => {
  const { activeQuestionIds } = useActiveQuizQuestionsByParty(party.id)
  const { questionIds } = useQuizQuestionsByParty(party.id)
  const { leaderboards } = useQuizPartyLeaderboards(party.id)
  const { uniquePlayers } = useQuizPartyUniquePlayers(party.id)

  const currentQuestionId = activeQuestionIds[activeQuestionIds.length - 1] ?? 0
  const { isOpen: isQuestionOpen, isClosed: isQuestionClosed } = useQuizQuestion(party.id, currentQuestionId)

  const totalQuestions = party.questionCount || questionIds.length
  const startedQuestions = activeQuestionIds.length
  const hasStartTimePassed = party.timestampStart > 0 && clientTimestamp >= party.timestampStart
  const hasStarted = hasStartTimePassed || startedQuestions > 0
  const isFinished = party.timestampEnd > 0
  const isAwaiting = !isFinished && hasStartTimePassed && startedQuestions === 0
  const isUpcoming = !isFinished && !hasStarted

  const statusLabel = isFinished ? 'Finished' : isAwaiting ? 'Awaiting' : isUpcoming ? 'Upcoming' : 'Ongoing'
  const statusClass = isFinished ? 'finished' : isAwaiting ? 'awaiting' : isUpcoming ? 'upcoming' : 'ongoing'

  const leader = leaderboards[0]
  const leaderLabel = isFinished ? 'Champion' : 'Leader'
  const leaderName = leader ? leader.name : '-'
  const leaderPoints = isFinished && leader ? `${leader.score} pts` : ''

  const questionProgress = totalQuestions > 0
    ? `${startedQuestions}/${totalQuestions}`
    : startedQuestions > 0
      ? `${startedQuestions}`
      : '-'

  const currentQuestionLabel = currentQuestionId > 0
    ? `Q${currentQuestionId} ${isQuestionOpen ? 'open' : isQuestionClosed ? 'closed' : 'pending'}`
    : (isUpcoming ? 'Not started' : 'Waiting on host')

  const startLabel = party.timestampStart > 0 ? formatTimestampLocal(party.timestampStart) : 'TBD'
  const endLabel = party.timestampEnd > 0 ? formatTimestampLocal(party.timestampEnd) : '-'
  const countdownLabel = isUpcoming ? formatCountdown(clientTimestamp, party.timestampStart) : ''

  const slug = useMemo(() => slugifyQuizName(party.name), [party.name])

  const handleEnter = useCallback(() => {
    onEnter(slug)
  }, [onEnter, slug])

  return (
    <div
      className={`quiz-room-card quiz-room-card-${statusClass}`}
      role="button"
      tabIndex={0}
      onClick={handleEnter}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleEnter();
        }
      }}
    >
      <div className="quiz-room-card-inner">
        <div className="quiz-room-card-header">
          <div className="quiz-room-card-title">{party.name}</div>
          <div
            className={`quiz-room-card-status quiz-room-card-status-${statusClass}`}
          >
            {statusLabel}
          </div>
        </div>
        <div className="quiz-room-card-meta">
          <div className="quiz-room-card-meta-item">
            <span className="quiz-room-card-meta-label">Questions</span>
            <span className="quiz-room-card-meta-value">
              {questionProgress}
            </span>
          </div>
          {!isFinished && (
            <div className="quiz-room-card-meta-item">
              <span className="quiz-room-card-meta-label">Current Q</span>
              <span className="quiz-room-card-meta-value">
                {currentQuestionLabel}
              </span>
            </div>
          )}
          <div className="quiz-room-card-meta-item">
            <span className="quiz-room-card-meta-label">Participants</span>
            <span className="quiz-room-card-meta-value">{uniquePlayers}</span>
          </div>
          {isFinished && (
            <div className="quiz-room-card-meta-item">
              <span className="quiz-room-card-meta-label">Winning score:</span>
              <span className="quiz-room-card-meta-value">{leaderPoints}</span>
            </div>
          )}
          <div className="quiz-room-card-meta-item">
            <span className="quiz-room-card-meta-label">{leaderLabel}</span>
            <span
              className={`quiz-room-card-meta-value ${
                isFinished ? "quiz-room-card-meta-value-champion" : ""
              }`}
            >
              {leaderName}
            </span>
          </div>
          {countdownLabel && (
            <div className="quiz-room-card-meta-item">
              <span className="quiz-room-card-meta-label">Starts In</span>
              <span className="quiz-room-card-meta-value">
                {countdownLabel}
              </span>
            </div>
          )}
          <div className="quiz-room-card-meta-item">
            <span className="quiz-room-card-meta-label">Starts</span>
            <span className="quiz-room-card-meta-value">{startLabel}</span>
          </div>
          <div className="quiz-room-card-meta-item">
            <span className="quiz-room-card-meta-label">Ended</span>
            <span className="quiz-room-card-meta-value">{endLabel}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ScQuizRoomList() {
  useFetchAllQuiz()

  const entities = useQuizStore((state) => state.entities)
  const parties = useAllStoreModels<models.QuizParty>(entities, 'QuizParty')
  const { dispatchSetScene } = usePistolsScene()
  const { clientTimestamp } = useClientTimestamp({ autoUpdate: true, updateSeconds: 10 })
  const { gameImpl } = useThreeJsContext()
  const { address } = useAccount()
  const { name, isAdmin, isTeamMember } = usePlayer(address);

  useEffect(() => {
    const scene = _currentScene as Partial<InteractibleScene> | null
    if (scene && typeof scene.setShowHoverDescription === 'function') {
      scene.setShowHoverDescription(false)
    }
    if (scene && typeof scene.setClickable === 'function') {
      scene.setClickable(false)
    }

    return () => {
      if (scene && typeof scene.setShowHoverDescription === 'function') {
        scene.setShowHoverDescription(true)
      }
      if (scene && typeof scene.setClickable === 'function') {
        scene.setClickable(true)
      }
    }
  }, [])

  const musicStateRef = useRef<{ menus: boolean; ingame: boolean } | null>(null)

  useEffect(() => {
    if (gameImpl) {
      const menusWasPlaying = AUDIO_ASSETS[AudioName.MUSIC_MENUS]?.object?.isPlaying ?? false
      const ingameWasPlaying = AUDIO_ASSETS[AudioName.MUSIC_INGAME]?.object?.isPlaying ?? false

      musicStateRef.current = { menus: menusWasPlaying, ingame: ingameWasPlaying }

      gameImpl.pauseAudio(AudioName.MUSIC_MENUS)
      gameImpl.pauseAudio(AudioName.MUSIC_INGAME)
    }

    return () => {
      if (gameImpl && musicStateRef.current) {
        const { menus, ingame } = musicStateRef.current
        if (menus) {
          gameImpl.playAudio(AudioName.MUSIC_MENUS, true)
        }
        if (ingame) {
          gameImpl.playAudio(AudioName.MUSIC_INGAME, true)
        }
      }
    }
  }, [gameImpl])

  const normalizedParties = useMemo(() => (
    parties
      .map((party) => ({
        id: Number(party.party_id ?? 0),
        name: party.name ?? 'Unnamed Quiz',
        description: party.description ?? '',
        timestampStart: Number(party.timestamps.start ?? 0),
        timestampEnd: Number(party.timestamps.end ?? 0),
        questionCount: Number(party.quiz_question_count ?? 0),
      }))
      .filter((party) => {
        if (party.id <= 0) return false
        if (isAdmin || isTeamMember) return true
        return !FILTERED_QUIZ_IDS.includes(party.id)
      })
  ), [parties])

  // Get all question models to check active questions
  const questionModels = useAllStoreModels<models.QuizQuestion>(entities, 'QuizQuestion')
  
  // Helper function to get active question IDs for a party
  const getActiveQuestionIds = useCallback((partyId: number) => {
    return questionModels
      .filter((model) => Number(model.party_id ?? 0) === partyId && Number(model.timestamps.start ?? 0) > 0)
      .map((model) => Number(model.question_id))
  }, [questionModels])

  const ongoing = useMemo(() => {
    return normalizedParties
      .filter((party) => {
        const isFinished = party.timestampEnd > 0
        if (isFinished) return false
        
        const hasStartTimePassed = party.timestampStart > 0 && clientTimestamp >= party.timestampStart
        const activeQuestionIds = getActiveQuestionIds(party.id)
        const startedQuestions = activeQuestionIds.length
        const hasStarted = hasStartTimePassed || startedQuestions > 0
        const isAwaiting = hasStartTimePassed && startedQuestions === 0
        
        return hasStarted && !isAwaiting // Ongoing: started and has questions
      })
      .sort((a, b) => {
        const aStart = a.timestampStart || 0
        const bStart = b.timestampStart || 0
        return bStart - aStart // Descending: newest first
      })
  }, [normalizedParties, clientTimestamp, getActiveQuestionIds])

  const awaiting = useMemo(() => {
    return normalizedParties
      .filter((party) => {
        const isFinished = party.timestampEnd > 0
        if (isFinished) return false
        
        const hasStartTimePassed = party.timestampStart > 0 && clientTimestamp >= party.timestampStart
        const activeQuestionIds = getActiveQuestionIds(party.id)
        const startedQuestions = activeQuestionIds.length
        
        return hasStartTimePassed && startedQuestions === 0 // Awaiting: start time passed but no questions
      })
      .sort((a, b) => {
        const aStart = a.timestampStart || 0
        const bStart = b.timestampStart || 0
        return bStart - aStart // Descending: newest first
      })
  }, [normalizedParties, clientTimestamp, getActiveQuestionIds])

  const upcoming = useMemo(() => {
    return normalizedParties
      .filter((party) => {
        const isFinished = party.timestampEnd > 0
        if (isFinished) return false
        
        const hasStartTimePassed = party.timestampStart > 0 && clientTimestamp >= party.timestampStart
        const activeQuestionIds = getActiveQuestionIds(party.id)
        const startedQuestions = activeQuestionIds.length
        const hasStarted = hasStartTimePassed || startedQuestions > 0
        
        return !hasStarted // Upcoming: hasn't started yet
      })
      .sort((a, b) => {
        const aStart = a.timestampStart || 0
        const bStart = b.timestampStart || 0
        return bStart - aStart // Descending: newest first
      })
  }, [normalizedParties, clientTimestamp, getActiveQuestionIds])

  const finished = useMemo(() => (
    normalizedParties
      .filter((party) => party.timestampEnd > 0)
      .sort((a, b) => {
        const aStart = a.timestampStart || 0
        const bStart = b.timestampStart || 0
        return bStart - aStart // Descending: newest first (by start time)
      })
  ), [normalizedParties])

  const handleEnter = useCallback((slug: string) => {
    dispatchSetScene(SceneName.QuizRoom, { quizId: slug })
  }, [dispatchSetScene])

  return (
    <div className='quiz-room-list'>
      <div className='quiz-room-list-scroll'>
        <div className='quiz-room-list-section'>
          <div className='quiz-room-list-section-title'>Ongoing</div>
          <div className='quiz-room-list-grid'>
            {ongoing.length === 0 ? (
              <div className='quiz-room-list-empty'>No ongoing quizzes.</div>
            ) : (
              ongoing.map((party) => (
                <QuizRoomCard
                  key={party.id}
                  party={party}
                  clientTimestamp={clientTimestamp}
                  onEnter={handleEnter}
                />
              ))
            )}
          </div>
        </div>
        <div className='quiz-room-list-section'>
          <div className='quiz-room-list-section-title'>Awaiting</div>
          <div className='quiz-room-list-grid'>
            {awaiting.length === 0 ? (
              <div className='quiz-room-list-empty'>No quizzes awaiting start.</div>
            ) : (
              awaiting.map((party) => (
                <QuizRoomCard
                  key={party.id}
                  party={party}
                  clientTimestamp={clientTimestamp}
                  onEnter={handleEnter}
                />
              ))
            )}
          </div>
        </div>
        <div className='quiz-room-list-section'>
          <div className='quiz-room-list-section-title'>Upcoming</div>
          <div className='quiz-room-list-grid'>
            {upcoming.length === 0 ? (
              <div className='quiz-room-list-empty'>No upcoming quizzes.</div>
            ) : (
              upcoming.map((party) => (
                <QuizRoomCard
                  key={party.id}
                  party={party}
                  clientTimestamp={clientTimestamp}
                  onEnter={handleEnter}
                />
              ))
            )}
          </div>
        </div>
        <div className='quiz-room-list-section'>
          <div className='quiz-room-list-section-title'>Finished</div>
          <div className='quiz-room-list-grid'>
            {finished.length === 0 ? (
              <div className='quiz-room-list-empty'>No finished quizzes yet.</div>
            ) : (
              finished.map((party) => (
                <QuizRoomCard
                  key={party.id}
                  party={party}
                  clientTimestamp={clientTimestamp}
                  onEnter={handleEnter}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
