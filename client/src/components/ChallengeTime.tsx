import React, { useMemo } from 'react'
import { useChallenge, useRoundTimeout } from '/src/stores/challengeStore'
import { formatTimestampLocal, formatTimestampDeltaElapsed, formatTimestampDeltaCountdown } from '@underware/pistols-sdk/utils'
import { useClientTimestamp } from '@underware/pistols-sdk/utils/hooks'
import { EMOJI } from '/src/data/messages'

export function ChallengeTime({
  duelId,
  prefixed = false,
}) {
  const {
    isAwaiting, isLive, isFinished, isCanceled,
    timestampStart, timestampEnd,
  } = useChallenge(duelId)
  const { timeoutTimestamp } = useRoundTimeout(duelId)

  const { clientSeconds } = useClientTimestamp(isAwaiting || isLive)

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

  return (
    <>
      {elapsed && <>
        {` ${EMOJI.IN_PROGRESS} `} <span className='Number Smaller'>{elapsed}</span>
      </>}
      {countdown && <>
        {` ${EMOJI.AWAITING} `} <span className='Number Smaller'>{countdown}</span>
      </>}
      {(!elapsed && !countdown) && <>
        <span className='Number Smaller'>{date}</span>
      </>}
    </>
  )
}
