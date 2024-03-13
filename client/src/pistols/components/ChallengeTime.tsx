import React, { useMemo } from 'react'
import { useChallenge } from '@/pistols/hooks/useChallenge'
import { formatTimestamp, formatTimestampDelta } from '@/pistols/utils/utils'
import { useClientTimestamp } from '../hooks/useTimestamp'
import { EMOJI } from '../data/messages'

export function ChallengeTime({
  duelId,
  prefixed = false,
}) {
  const {
    isAwaiting, isLive, isFinished, isCanceled,
    timestamp_start, timestamp_end,
  } = useChallenge(duelId)

  const { clientTimestamp } = useClientTimestamp(isAwaiting || isLive)

  const date = useMemo(() => {
    if (isAwaiting) return EMOJI.AWAITING + ' ' + formatTimestampDelta(clientTimestamp, timestamp_end)
    if (isLive) return EMOJI.IN_PROGRESS + ' ' + formatTimestampDelta(timestamp_start, clientTimestamp)
    if (isCanceled || isFinished) return (prefixed ? 'Finished at ' : '') + formatTimestamp(timestamp_end)
    return formatTimestamp(timestamp_start)
  }, [isAwaiting, isCanceled, isLive, isFinished, timestamp_start, timestamp_end, clientTimestamp])

  return <span className='TitleCase'>{date}</span>
}

