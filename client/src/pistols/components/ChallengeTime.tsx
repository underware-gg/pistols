import React, { useMemo } from 'react'
import { useChallenge } from '@/pistols/hooks/useChallenge'
import { ChallengeState } from '@/pistols/utils/pistols'
import { formatTimestamp, formatTimestampDelta } from '@/pistols/utils/utils'
import { useClientTimestamp } from '../hooks/useTimestamp'

export function ChallengeTime({
  duelId,
  prefixed = false,
}) {
  const {
    isAwaiting, isLive, isFinished, isCanceled,
    timestamp, timestamp_expire, timestamp_start, timestamp_end,
  } = useChallenge(duelId)

  const { clientTimestamp } = useClientTimestamp(isAwaiting)

  const date = useMemo(() => {
    if (isAwaiting) return '⏱️ ' + formatTimestampDelta(clientTimestamp, timestamp_expire)
    if (isLive) return (prefixed ? 'Started at ' : '') + formatTimestamp(timestamp_start)
    if (isCanceled || isFinished) return (prefixed ? 'Finished at ' : '') + formatTimestamp(timestamp_end)
    return formatTimestamp(timestamp)
  }, [isAwaiting, isCanceled, isLive, isFinished, timestamp, timestamp_expire, timestamp_start, timestamp_end, clientTimestamp])

  return <span>{date}</span>
}

