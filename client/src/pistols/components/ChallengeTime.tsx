import React, { useMemo } from 'react'
import { useChallenge } from '@/pistols/stores/challengeStore'
import { useClientTimestamp } from '@/lib/utils/hooks/useTimestamp'
import { formatTimestampLocal, formatTimestampDelta } from '@/lib/utils/timestamp'
import { EMOJI } from '@/pistols/data/messages'

export function ChallengeTime({
  duelId,
  prefixed = false,
}) {
  const {
    isAwaiting, isLive, isFinished, isCanceled,
    timestamp_start, timestamp_end,
  } = useChallenge(duelId)

  const { clientTimestamp } = useClientTimestamp(isAwaiting || isLive)

  const emoji = useMemo(() => {
    if (isAwaiting) return EMOJI.AWAITING
    if (isLive) return EMOJI.IN_PROGRESS
    return null
  }, [isAwaiting, isLive])

  const date = useMemo(() => {
    if (isAwaiting) return formatTimestampDelta(clientTimestamp, timestamp_end)
    if (isLive) return formatTimestampDelta(timestamp_start, clientTimestamp)
    if (isCanceled || isFinished) return (prefixed ? 'Finished at ' : '') + formatTimestampLocal(timestamp_end)
    return formatTimestampLocal(timestamp_start)
  }, [isAwaiting, isCanceled, isLive, isFinished, timestamp_start, timestamp_end, clientTimestamp])

  return (
    <>
      {emoji} <span className='Number Smaller'>{date}</span>
    </>
  )
}
