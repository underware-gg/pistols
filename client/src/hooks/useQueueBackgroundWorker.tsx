import { useEffect, useRef } from 'react'
import { useAccount } from '@starknet-react/core'
import { constants } from '@underware/pistols-sdk/pistols/gen'
import { useDojoSystemCalls } from '@underware/pistols-sdk/dojo'
import { useMatchPlayer } from '/src/stores/matchStore'

// Background queue management system with automatic match_make_me calls

const QUEUE_TIMING = {
  fastIntervalMs: 5 * 60 * 1000, // 5 minutes
  slowIntervalMs: 24 * 60 * 60 * 1000, // 24 hours
}

export const useQueueBackgroundWorker = () => {
  const { account, address } = useAccount()
  const { matchmaker } = useDojoSystemCalls()
  const timeoutRefs = useRef<Record<string, NodeJS.Timeout>>({})

  // Get match player data for both ranked and unranked queues
  const rankedPlayer = useMatchPlayer(address, constants.QueueId.Ranked)
  const unrankedPlayer = useMatchPlayer(address, constants.QueueId.Unranked)

  const callMatchMakeMe = async (queueId: constants.QueueId, queueMode: constants.QueueMode, duelistId: bigint) => {
    if (!account || !address) {
      console.log(`[MATCHMAKING] Account not ready - skipping ${queueId} ${queueMode} queue call`)
      return
    }
    
    try {
      console.log(`[MATCHMAKING] Calling match_make_me for ${queueId} ${queueMode} queue - duelist ${duelistId}`)
      await matchmaker.match_make_me(account, duelistId, queueId, queueMode)
      console.log(`[MATCHMAKING] Successfully pinged ${queueId} ${queueMode} queue - duelist ${duelistId}`)
    } catch (error) {
      console.error(`[MATCHMAKING] Error pinging ${queueId} ${queueMode} queue:`, error)
    }
  }

  const setupQueueTimeout = (queueId: constants.QueueId, queueMode: constants.QueueMode, duelistId: bigint, timestampEnter: number) => {
    const queueKey = `${queueId}_${queueMode}_${duelistId}`
    
    // Clear existing timeout for this queue
    if (timeoutRefs.current[queueKey]) {
      clearTimeout(timeoutRefs.current[queueKey])
      delete timeoutRefs.current[queueKey]
    }

    const now = Date.now()
    const timeEntered = timestampEnter * 1000 // Convert to milliseconds
    const intervalMs = queueMode === constants.QueueMode.Fast 
      ? QUEUE_TIMING.fastIntervalMs 
      : QUEUE_TIMING.slowIntervalMs
    
    const timeRemaining = Math.max(0, intervalMs - (now - timeEntered))
    
    if (timeRemaining > 0) {
      console.log(`[MATCHMAKING] Setting timeout for ${queueId} ${queueMode} queue - ${Math.round(timeRemaining / 1000)}s remaining`)
      
      timeoutRefs.current[queueKey] = setTimeout(() => {
        callMatchMakeMe(queueId, queueMode, duelistId)
        delete timeoutRefs.current[queueKey]
      }, timeRemaining)
    } else {
      // Time already expired, call immediately
      console.log(`[MATCHMAKING] Time expired for ${queueId} ${queueMode} queue - calling immediately`)
      callMatchMakeMe(queueId, queueMode, duelistId)
    }
  }

  // Setup timeouts for all active queues
  useEffect(() => {
    if (!address || !account) {
      console.log('[MATCHMAKING] Account not ready - skipping queue timeout setup')
      return
    }

    // Clear all existing timeouts
    Object.values(timeoutRefs.current).forEach(timeout => clearTimeout(timeout))
    timeoutRefs.current = {}

    // Setup timeout for ranked queue (Fast or Slow)
    if (rankedPlayer.queueMode && rankedPlayer.duelistId && rankedPlayer.timestampEnter > 0) {
      setupQueueTimeout(
        constants.QueueId.Ranked, 
        rankedPlayer.queueMode, 
        rankedPlayer.duelistId, 
        rankedPlayer.timestampEnter
      )
    }

    // Setup timeout for unranked queue (Fast or Slow)
    if (unrankedPlayer.queueMode && unrankedPlayer.duelistId && unrankedPlayer.timestampEnter > 0) {
      setupQueueTimeout(
        constants.QueueId.Unranked, 
        unrankedPlayer.queueMode, 
        unrankedPlayer.duelistId, 
        unrankedPlayer.timestampEnter
      )
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      Object.values(timeoutRefs.current).forEach(timeout => clearTimeout(timeout))
      timeoutRefs.current = {}
    }
  }, [
    address,
    account,
    rankedPlayer.queueMode,
    rankedPlayer.duelistId, 
    rankedPlayer.timestampEnter,
    unrankedPlayer.queueMode,
    unrankedPlayer.duelistId,
    unrankedPlayer.timestampEnter
  ])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(timeoutRefs.current).forEach(timeout => clearTimeout(timeout))
      timeoutRefs.current = {}
    }
  }, [])

  return {
    isActive: Object.keys(timeoutRefs.current).length > 0,
    rankedInQueue: rankedPlayer.inQueueIds.length > 0,
    unrankedInQueue: unrankedPlayer.inQueueIds.length > 0,
  }
}