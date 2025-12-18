import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { usePistolsScene } from '/src/hooks/PistolsContext'
import { useFetchAllQuiz, useQuizPartyByName } from '/src/stores/quizStore'
import { formatTimestampDeltaCountdown } from '@underware/pistols-sdk/utils'
import { useClientTimestamp } from '@underware/pistols-sdk/utils/hooks'
import { SceneName } from '/src/data/assetsTypes'
import { _currentScene } from '/src/three/game'
import { InteractibleScene } from '/src/three/InteractibleScene'
import { TextureName } from '/src/data/assetsTypes'
import TavernQuizInviteModal from '../modals/TavernQuizInviteModal'
import { useOpener } from '/src/hooks/useOpener'

const QUIZ_NAME = 'Merry Quizmas'
const MAX_SHOW_COUNT = 10
const THIRTY_MINUTES_IN_SECONDS = 30 * 60
const MINIMUM_TIME_BETWEEN_SHOWS_IN_SECONDS = 60

// localStorage keys (persist across browser sessions)
const LOCAL_STORAGE_KEY_QUIZ_NAME = 'tavern_quiz_invite_quiz_name'
const LOCAL_STORAGE_KEY_EXIT_COUNT = 'tavern_quiz_invite_exit_count'
const LOCAL_STORAGE_KEY_SHOW_COUNT = 'tavern_quiz_invite_show_count'
const LOCAL_STORAGE_KEY_HAS_PRESSED_GO_TO_QUIZ = 'tavern_quiz_invite_has_pressed_go_to_quiz'

// sessionStorage keys (reset on new tab)
const SESSION_STORAGE_KEY_LAST_SHOW_TIMESTAMP= 'tavern_quiz_invite_last_show_timestamp'
const SESSION_STORAGE_KEY_HAS_SHOWN = 'tavern_quiz_invite_has_shown'

const slugifyQuizName = (name: string) => name.replaceAll(' ', '')

const formatTimeRemaining = (now: number, target: number): string => {
  if (!target || target <= now) return 'now'
  
  const delta = formatTimestampDeltaCountdown(now, target)
  const parts: string[] = []
  
  if (delta.days > 0) {
    parts.push(`${delta.days} ${delta.days === 1 ? 'day' : 'days'}`)
    if (delta.hours > 0) {
      parts.push(`${delta.hours} ${delta.hours === 1 ? 'hour' : 'hours'}`)
    }
  } else if (delta.hours > 0) {
    parts.push(`${delta.hours} ${delta.hours === 1 ? 'hour' : 'hours'}`)
    if (delta.minutes > 0) {
      parts.push(`${delta.minutes} ${delta.minutes === 1 ? 'minute' : 'minutes'}`)
    }
  } else if (delta.minutes > 0) {
    parts.push(`${delta.minutes} ${delta.minutes === 1 ? 'minute' : 'minutes'}`)
  } else {
    return 'NOW'
  }
  
  return `in ${parts.join(' ')}`
}

export default function TavernQuizInviteChecker() {
  const { dispatchSetScene } = usePistolsScene()
  const quizInviteOpener = useOpener()
  const { clientSeconds } = useClientTimestamp({ autoUpdate: true, updateSeconds: 10 })
  const { partyId, timestamp_start, timestamp_end, isPartyClosed } = useQuizPartyByName(QUIZ_NAME)
  
  useFetchAllQuiz()
  
  const [hasShownInThisSession, setHasShownInThisSession] = useState(false)
  const [exitCount, setExitCount] = useState(0)
  const [showCount, setShowCount] = useState(0)
  const [hasPressedGoToQuiz, setHasPressedGoToQuiz] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [lastShowTimestamp, setLastShowTimestamp] = useState(0)

  // Check if we're within 30 minutes before quiz start OR quiz is active/ongoing
  const isWithin30Min = useMemo(() => {
    if (!timestamp_start || timestamp_start === 0) return false
    
    const timeUntilQuiz = timestamp_start - clientSeconds
    const isWithin30MinBefore = timeUntilQuiz > 0 && timeUntilQuiz <= THIRTY_MINUTES_IN_SECONDS
    
    const isQuizActive = clientSeconds >= timestamp_start && !isPartyClosed
    
    return isWithin30MinBefore || isQuizActive
  }, [timestamp_start, timestamp_end, isPartyClosed, clientSeconds])

  useEffect(() => {
    if (typeof window === 'undefined' || isInitialized) return
    
    const storedName = localStorage.getItem(LOCAL_STORAGE_KEY_QUIZ_NAME)
    const storedExitCount = localStorage.getItem(LOCAL_STORAGE_KEY_EXIT_COUNT)
    const storedShowCount = localStorage.getItem(LOCAL_STORAGE_KEY_SHOW_COUNT)
    const storedHasPressedGoToQuiz = localStorage.getItem(LOCAL_STORAGE_KEY_HAS_PRESSED_GO_TO_QUIZ) === 'true'
    
    const hasShownThisSession = sessionStorage.getItem(SESSION_STORAGE_KEY_HAS_SHOWN) === 'true'
    const storedLastShowTimestamp = sessionStorage.getItem(SESSION_STORAGE_KEY_LAST_SHOW_TIMESTAMP)
    
    if (!storedName) {
      localStorage.setItem(LOCAL_STORAGE_KEY_QUIZ_NAME, QUIZ_NAME)
      localStorage.setItem(LOCAL_STORAGE_KEY_EXIT_COUNT, '0')
      localStorage.setItem(LOCAL_STORAGE_KEY_SHOW_COUNT, '0')
      
      sessionStorage.setItem(SESSION_STORAGE_KEY_LAST_SHOW_TIMESTAMP, '0')
      
      setLastShowTimestamp(0)
      setExitCount(0)
      setShowCount(0)
    } else {
      
      if (storedExitCount) {
        setExitCount(parseInt(storedExitCount, 10))
      } else {
        setExitCount(0)
      }
      
      if (storedShowCount) {
        setShowCount(parseInt(storedShowCount, 10))
      } else {
        setShowCount(0)
      }
      
      if (storedHasPressedGoToQuiz) {
        setHasPressedGoToQuiz(true)
      }
      
      if (storedLastShowTimestamp) {
        setLastShowTimestamp(parseInt(storedLastShowTimestamp, 10))
      } else {
        setLastShowTimestamp(0)
      }
      
      if (storedName !== QUIZ_NAME) {
        localStorage.setItem(LOCAL_STORAGE_KEY_QUIZ_NAME, QUIZ_NAME)
        localStorage.setItem(LOCAL_STORAGE_KEY_EXIT_COUNT, '0')
        localStorage.setItem(LOCAL_STORAGE_KEY_SHOW_COUNT, '0')
        localStorage.removeItem(LOCAL_STORAGE_KEY_HAS_PRESSED_GO_TO_QUIZ)
        
        sessionStorage.setItem(SESSION_STORAGE_KEY_LAST_SHOW_TIMESTAMP, '0')
        
        setExitCount(0)
        setShowCount(0)
        setHasPressedGoToQuiz(false)
        setLastShowTimestamp(0)
      }
    }

    if (hasShownThisSession) {
      setHasShownInThisSession(true)
    }
    
    setIsInitialized(true)
  }, [isInitialized])

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>

    // Wait for initialization to complete
    if (!isInitialized) {
      return
    }

    if (isPartyClosed || !partyId) {
      return
    }

    if (!isWithin30Min && (showCount >= MAX_SHOW_COUNT || hasShownInThisSession)) {
      return
    }

    if (clientSeconds - lastShowTimestamp < MINIMUM_TIME_BETWEEN_SHOWS_IN_SECONDS) {
      return
    }

    timeoutId = setTimeout(() => {
      setHasShownInThisSession(true)
      
      setLastShowTimestamp(clientSeconds)
      
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem(SESSION_STORAGE_KEY_HAS_SHOWN, 'true')
        window.sessionStorage.setItem(SESSION_STORAGE_KEY_LAST_SHOW_TIMESTAMP, clientSeconds.toString())
      }
      
      (_currentScene as InteractibleScene)?.excludeItem(TextureName.bg_tavern_bartender_mask);
      (_currentScene as InteractibleScene)?.toggleBlur(true);
      (_currentScene as InteractibleScene)?.setClickable(false);
      
      quizInviteOpener.open()
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [
    isInitialized,
    hasShownInThisSession, 
    isPartyClosed, 
    partyId, 
    showCount,
    quizInviteOpener,
    isWithin30Min
  ])

  const handleGoToQuiz = useCallback(() => {
    const newExitCount = 0
    setExitCount(newExitCount)
    localStorage.setItem(LOCAL_STORAGE_KEY_EXIT_COUNT, newExitCount.toString())
    
    const newShowCount = showCount + 1
    setShowCount(newShowCount)
    localStorage.setItem(LOCAL_STORAGE_KEY_SHOW_COUNT, newShowCount.toString())
    
    setHasPressedGoToQuiz(true)
    localStorage.setItem(LOCAL_STORAGE_KEY_HAS_PRESSED_GO_TO_QUIZ, 'true')
    
    const quizSlug = slugifyQuizName(QUIZ_NAME)
    dispatchSetScene(SceneName.QuizRoom, { quizId: quizSlug })
  }, [dispatchSetScene, showCount])

  const handleClose = useCallback(() => {
    const newExitCount = exitCount + 1
    setExitCount(newExitCount)
    localStorage.setItem(LOCAL_STORAGE_KEY_EXIT_COUNT, newExitCount.toString())
    
    const newShowCount = showCount + 1
    setShowCount(newShowCount)
    localStorage.setItem(LOCAL_STORAGE_KEY_SHOW_COUNT, newShowCount.toString())

    setHasPressedGoToQuiz(false);
    localStorage.setItem(LOCAL_STORAGE_KEY_HAS_PRESSED_GO_TO_QUIZ, "false");
  }, [exitCount, showCount])

  const quizTime = useMemo(() => {
    if (!timestamp_start || timestamp_start === 0) return ''
    if (clientSeconds >= timestamp_start && !isPartyClosed) {
      return 'NOW';
    }
    return formatTimeRemaining(clientSeconds, timestamp_start)
  }, [timestamp_start, clientSeconds, isPartyClosed])

  useEffect(() => {
    if (!quizInviteOpener.isOpen && _currentScene && _currentScene instanceof InteractibleScene) {
      (_currentScene as InteractibleScene)?.toggleBlur?.(false);
      (_currentScene as InteractibleScene)?.setClickable?.(true);
      setTimeout(() => {
        (_currentScene as InteractibleScene)?.excludeItem?.(null);
      }, 400)
    }
  }, [quizInviteOpener.isOpen])

  return (
    <>
      <TavernQuizInviteModal 
        opener={quizInviteOpener}
        quizTime={quizTime}
        quizName={QUIZ_NAME}
        exitCount={exitCount}
        hasPressedGoToQuiz={hasPressedGoToQuiz}
        isWithin30Min={isWithin30Min}
        onGoToQuiz={handleGoToQuiz}
        onClose={handleClose}
      />
    </>
  )
}

