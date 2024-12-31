import React, { useMemo } from 'react'
import { useChallenge } from '/src/stores/challengeStore'
import {
  formatTimestampLocal, formatTimestampDeltaElapsed, formatTimestampDeltaCountdown,
  useClientTimestamp,
 } from '@underware_gg/pistols-sdk/utils'
import { EMOJI } from '/src/data/messages'

export function ChallengeTime({
  duelId,
  prefixed = false,
}) {
  const {
    isAwaiting, isLive, isFinished, isCanceled,
    timestamp_start, timestamp_end,
  } = useChallenge(duelId)

  const { clientSeconds } = useClientTimestamp(isAwaiting || isLive)

  const emoji = useMemo(() => {
    if (isAwaiting) return EMOJI.AWAITING
    if (isLive) return EMOJI.IN_PROGRESS
    return null
  }, [isAwaiting, isLive])

  const date = useMemo(() => {
    if (isAwaiting) return formatTimestampDeltaCountdown(clientSeconds, timestamp_end).result
    if (isLive) return formatTimestampDeltaElapsed(timestamp_start, clientSeconds).result
    if (isCanceled || isFinished) return (prefixed ? 'Finished at ' : '') + formatTimestampLocal(timestamp_end)
    return formatTimestampLocal(timestamp_start)
  }, [isAwaiting, isCanceled, isLive, isFinished, timestamp_start, timestamp_end, clientSeconds])

  return (
    <>
      {emoji} <span className='Number Smaller'>{date}</span>
    </>
  )
}
