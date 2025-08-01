import React, { useMemo } from 'react'
import { useChallenge, useRoundTimeout } from '/src/stores/challengeStore'
import { formatTimestampLocal, formatTimestampDeltaElapsed, formatTimestampDeltaCountdown } from '@underware/pistols-sdk/utils'
import { useClientTimestamp } from '@underware/pistols-sdk/utils/hooks'
import { EMOJIS } from '@underware/pistols-sdk/pistols/constants'

const SIX_HOURS = 6 * 60 * 60
const TWELVE_HOURS = 12 * 60 * 60

export function ChallengeTime({
  duelId,
  prefixed = false,
}) {
  const {
    isAwaiting, isLive, isFinished, isCanceled,
    timestampStart, timestampEnd,
  } = useChallenge(duelId)
  const { timeoutTimestamp } = useRoundTimeout(duelId)

  const { clientSeconds } = useClientTimestamp({ autoUpdate: isAwaiting || isLive })

  const elapsed = useMemo(() => {
    return (timestampStart && isLive) ? formatTimestampDeltaElapsed(timestampStart, clientSeconds).result : null
  }, [isLive, clientSeconds, timestampStart])

  const countdown = useMemo(() => {
    const timestamp = Math.max(timestampEnd, timeoutTimestamp)
    return (timestamp && (isAwaiting || isLive)) ? formatTimestampDeltaCountdown(clientSeconds, timestamp).result : null
  }, [isAwaiting, isLive, clientSeconds, timestampEnd, timeoutTimestamp])

  const date = useMemo(() => {
    return (timestampEnd && (isCanceled || isFinished)) ?
      (prefixed ? 'Finished at ' : '') + formatTimestampLocal(timestampEnd)
      : formatTimestampLocal(timestampStart)
  }, [isCanceled, isFinished, clientSeconds, timestampStart, timestampEnd])

  // Get timer state based on time remaining
  const getTimerState = (timeLeft: number) => {
    // For both 7-day and 24h countdowns, use the same thresholds
    if (timeLeft <= SIX_HOURS) return 'Critical'
    if (timeLeft <= TWELVE_HOURS) return 'Warning'
    return 'Normal'
  }

  // Calculate time remaining for the countdown timer
  const countdownTimeLeft = useMemo(() => {
    if (!isAwaiting && !isLive) return null
    const timestamp = Math.max(timestampEnd, timeoutTimestamp)
    return timestamp ? timestamp - clientSeconds : null
  }, [isAwaiting, isLive, timestampEnd, timeoutTimestamp, clientSeconds])

  return (
    <>
      {elapsed && <>
        {` ${EMOJIS.IN_PROGRESS} `} <span className='Number Small'>{elapsed}</span>
      </>}
      {countdown && <>
        {` ${EMOJIS.AWAITING} `} 
        <span className={`Number Small TimerCountdown ${getTimerState(countdownTimeLeft || 0)}`}>
          {countdown}
        </span>
      </>}
      {(!elapsed && !countdown) && <>
        <span className='Number Small'>{date}</span>
      </>}
    </>
  )
}
