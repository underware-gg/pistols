import React, { useState, useEffect, useCallback } from 'react'
import AnimatedText from '/src/components/ui/AnimatedText'
import { Opener } from '/src/hooks/useOpener'

const DELAY_PER_CHARACTER = 30

// Main mild message (first time)
const getMainMildMessage = (quizTime: string, quizName: string): string => {
  return `Listen up, ye scum. Lord Cumberlord wants ya at the ${quizName} happening ${quizTime}. Don't make me regret telling ya this.`
}

// Reminder messages
const getReminderMessages = (quizTime: string, quizName: string): string[] => {
  return [
    `Oi, wretch! Reminding ya about that ${quizName} ${quizTime}. Lord Cumberlord's orders, not mine.`,
    `Ye still here? The ${quizName} is ${quizTime}. Don't make me repeat myself, ye dog.`,
    `Right, ye useless scum. That ${quizName} I told ya about? It's ${quizTime}. Be there or don't, I don't care.`,
    `Another reminder, ye weakling. ${quizName} starts ${quizTime}. Lord Cumberlord wants ya there.`,
    `Ye still hanging around? The ${quizName} is happening ${quizTime}. Don't waste my time, ye wretch.`
  ]
}

// Rush messages for 30 minutes before quiz
const getRushMessages = (quizTime: string, quizName: string): string[] => {
  return [
    `Oi, ye scum! The ${quizName} is starting ${quizTime}! Hurry, Lord Cumberlord wants ya there! Don't make me come after ya!`,
    `Ye useless wretch! The ${quizName} is happening ${quizTime}! Get moving before I throw ya out myself!`,
    `Listen here, ye dog! The ${quizName} starts ${quizTime}! Lord Cumberlord's orders! Move yer worthless hide!`,
    `Ye're wasting time, ye bastard! The ${quizName} is ${quizTime}! Lord Cumberlord wants ya there NOW!`,
    `Get moving, ye scum! The ${quizName} is starting ${quizTime}! Don't make me regret telling ya this, ye wretch!`
  ]
}

// Progressive angry messages
const getAngryMessage = (exitCount: number, quizTime: string, quizName: string): string => {
  switch (exitCount) {
    case 1:
      return `Oi—quit gawpin'. The ${quizName} is ${quizTime}. Lord Cumberlord wants ye there. Now off my bar, ye draught of bad air.`
    case 2:
      return `Still standin' there like a dropped chamberpot? The ${quizName} is ${quizTime}. Lord Cumberlord's order. Move, or I'll move ye—with my boot.`
    case 3:
      return `Ye're testin' me, ye witless rat. The ${quizName} starts ${quizTime}. I've told ye enough—leave before I decide yer teeth don't match yer grin.`
    case 4:
      return `I'm done playin' host to a clingin' little leech. The ${quizName} is ${quizTime}. Out. Now. Before I drag ye by the collar.`
    case 5:
      return `Enough. ${quizName}. ${quizTime}. Get lost.`
    default:
      return `Listen up, ye scum. Lord Cumberlord wants ya at the ${quizName} happening ${quizTime}. Don't make me regret telling ya this.`
  }
}


// Main message selector
const getQuizInviteMessage = (
  exitCount: number, 
  hasPressedGoToQuiz: boolean,
  isWithin30Min: boolean,
  quizTime: string, 
  quizName: string
): string => {
  // Special rush messages for 30 minutes before OR during active quiz
  if (isWithin30Min) {
    const rushMessages = getRushMessages(quizTime, quizName)
    return rushMessages[Math.floor(Math.random() * rushMessages.length)]
  }
  
  // If they've pressed "Go to Quiz" and anger is reset (exitCount === 0), show reminder messages
  if (hasPressedGoToQuiz) {
    const reminderMessages = getReminderMessages(quizTime, quizName)
    return reminderMessages[Math.floor(Math.random() * reminderMessages.length)]
  }
  
  // First time
  if (exitCount === 0) {
    return getMainMildMessage(quizTime, quizName)
  }
  
  // Progressive anger based on exit count
  return getAngryMessage(exitCount, quizTime, quizName)
}

interface TavernQuizInviteModalProps {
  opener: Opener
  quizTime: string
  quizName: string
  exitCount: number
  hasPressedGoToQuiz: boolean
  isWithin30Min: boolean
  onGoToQuiz: () => void
  onClose: () => void
}

export default function TavernQuizInviteModal({ 
  opener, 
  quizTime, 
  quizName, 
  exitCount, 
  hasPressedGoToQuiz,
  isWithin30Min,
  onGoToQuiz, 
  onClose 
}: TavernQuizInviteModalProps) {
  const [displayText, setDisplayText] = useState('')
  const [textAnimationComplete, setTextAnimationComplete] = useState(false)

  useEffect(() => {
    if (opener.isOpen) {
      const message = getQuizInviteMessage(exitCount, hasPressedGoToQuiz, isWithin30Min, quizTime, quizName)
      setTextAnimationComplete(false)
      setDisplayText(message)
    }
  }, [opener.isOpen, exitCount, hasPressedGoToQuiz, isWithin30Min, quizTime, quizName])

  const handleGoToQuiz = useCallback(() => {
    onGoToQuiz()
    opener.close()
  }, [onGoToQuiz, opener])

  const handleClose = useCallback(() => {
    onClose()
    opener.close()
  }, [onClose, opener])

  useEffect(() => {
    if (!opener.isOpen) {
      setTextAnimationComplete(false)
      setDisplayText("")
    }
  }, [opener.isOpen])

  if (!opener.isOpen) return null

  return (
    <div className='TempBarkeepOverlay NoMouse NoDrag'>
      <div className='TavernRingsTalkBalloon Relative'>
        <div className='BarkeepModalContainer'>
          <AnimatedText 
            text={displayText} 
            delayPerCharacter={DELAY_PER_CHARACTER} 
            onAnimationComplete={() => setTextAnimationComplete(true)} 
          />
          
          <div 
            className="BarkeepButtonContainer"
            style={{
              opacity: textAnimationComplete ? 1 : 0,
              pointerEvents: textAnimationComplete ? 'auto' : 'none',
              transition: 'opacity 0.3s ease-in-out'
            }}
          >
            <button
              onClick={handleGoToQuiz}
              className="BarkeepDialogButton"
            >
              Go to Quiz
            </button>
            <button
              onClick={handleClose}
              className="BarkeepDialogButton"
            >
              Exit
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

