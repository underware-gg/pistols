import React, { useMemo } from 'react'
import { useGetChallenge } from '/src/stores/challengeStore'
import { useCurrentSeason } from '/src/stores/seasonStore'
import { DuelTutorialLevel } from '/src/data/tutorialConstants'
import { constants } from '@underware/pistols-sdk/pistols/gen'
import { emitter } from '/src/three/game'

const MIN_LINE_LENGTH = 24
const MAX_LINE_LENGTH = 80
const PUNCTUATION_MARKS = /[!?.,;:-]/g

function wrapText(text: string): string {
  if (!text) return ''
  
  if (text.length <= MIN_LINE_LENGTH) return text
  
  if (text.length <= MAX_LINE_LENGTH) return text
  
  const punctuationMatches = [...text.matchAll(new RegExp(PUNCTUATION_MARKS, 'g'))];
  const punctuationIndices = punctuationMatches.map(match => match.index!);
  
  let bestBreakIndex = -1;
  
  for (let i = 0; i < punctuationIndices.length; i++) {
    const currentIndex = punctuationIndices[i];
    
    if (currentIndex >= MAX_LINE_LENGTH && i > 0) {
      bestBreakIndex = punctuationIndices[i - 1];
      break;
    }
    
    if (i === punctuationIndices.length - 1 && currentIndex < MAX_LINE_LENGTH) {
      bestBreakIndex = currentIndex;
      break;
    }
    
    if (i < punctuationIndices.length - 1) {
      const nextIndex = punctuationIndices[i + 1];
      if (nextIndex > MAX_LINE_LENGTH) {
        bestBreakIndex = currentIndex;
        break;
      }
    }
  }
  
  if (bestBreakIndex !== -1) {
    return text.slice(0, bestBreakIndex + 1) + '<br>' + wrapText(text.slice(bestBreakIndex + 1).trim());
  }
  
  if (text.length > MAX_LINE_LENGTH) {
    const middlePoint = Math.floor(text.length / 2);
    const spacesBeforeMiddle = text.substring(MIN_LINE_LENGTH, middlePoint).lastIndexOf(' ') + MIN_LINE_LENGTH;
    const spacesAfterMiddle = text.substring(middlePoint).indexOf(' ') + middlePoint;
    
    if (spacesBeforeMiddle >= MIN_LINE_LENGTH && (spacesAfterMiddle < 0 || Math.abs(middlePoint - spacesBeforeMiddle) <= Math.abs(middlePoint - spacesAfterMiddle))) {
      bestBreakIndex = spacesBeforeMiddle;
    } else if (spacesAfterMiddle > 0) {
      bestBreakIndex = spacesAfterMiddle;
    } else {
      bestBreakIndex = middlePoint;
    }
    
    return text.slice(0, bestBreakIndex) + '<br>' + wrapText(text.slice(bestBreakIndex + (text[bestBreakIndex] === ' ' ? 1 : 0)));
  }
  
  return text;
}

export default function DuelHeader({
  duelId,
  tutorialLevel
} : {
  duelId: bigint,
  tutorialLevel: DuelTutorialLevel
}) {
  const { seasonName, message, premise } = useGetChallenge(duelId)
  const { seasonName: currentSeasonName } = useCurrentSeason()
  const seasonDescription = useMemo(() => (seasonName ?? currentSeasonName), [seasonName, currentSeasonName])

  const displayMessage = useMemo(() => {
    if (!message) {
      return constants.PREMISES[premise]?.prefix?.toUpperCase() || ''
    }
    return message.length > 30 ? `${message.substring(0, 30)}...` : message
  }, [message, premise])

  const isTruncated = !!message && message.length > 30
  const wrappedMessage = useMemo(() => wrapText(message || ''), [message])

  return (
    <>
      <div className='TavernBoard NoMouse NoDrag' style={{ backgroundImage: 'url(/images/ui/duel/wager_main.png)', backgroundSize: '100% 100%' }}>
        <div className='TavernTitle' data-contentlength={1}>Settling the matter of:</div>
        <div
          className='TavernQuote YesMouse NoDrag'
          data-contentlength={Math.floor(displayMessage.length / 10)}
          onMouseEnter={() => isTruncated && emitter.emit('hover_description', wrappedMessage)}
          onMouseLeave={() => isTruncated && emitter.emit('hover_description', null)}
        >
          {`"${displayMessage}"`}
        </div>
        <div className='TavernTable' data-contentlength={Math.floor(seasonDescription.length / 10)}>{seasonDescription}</div>
      </div>
    </>
  )
}
