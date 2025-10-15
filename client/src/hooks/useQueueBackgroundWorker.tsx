import { useEffect, useRef, useCallback, useState } from 'react'
import { useAccount } from '@starknet-react/core'
import { constants } from '@underware/pistols-sdk/pistols/gen'
import { useDojoSystemCalls } from '@underware/pistols-sdk/dojo'
import { useMatchPlayer } from '/src/stores/matchStore'
import { useTransactionHandler } from '/src/hooks/useTransaction'

// Background queue management system with automatic match_make_me calls
// 🐙 Tentacle tip: When duelists are ready to matchmake, they join the queue like tentacles reaching for snacks!

interface QueueItem {
  queueId: constants.QueueId
  queueMode: constants.QueueMode
  duelistId: bigint
}

export const useQueueBackgroundWorker = () => {
  const { account, address } = useAccount()
  const { matchmaker } = useDojoSystemCalls()
  const transactionQueueRef = useRef<QueueItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  // Get match player data for both ranked and unranked queues
  const rankedPlayer = useMatchPlayer(address, constants.QueueId.Ranked)
  const unrankedPlayer = useMatchPlayer(address, constants.QueueId.Unranked)

  // Handler for transaction completion
  const handleTransactionComplete = useCallback(() => {
    setIsProcessing(false)
  }, [])

  // Single transaction handler for all match_make_me calls
  const { call: executeMatchMakeMe, isLoading } = useTransactionHandler<boolean, [bigint, constants.QueueId, constants.QueueMode]>({
    key: `backgroundMatchmakeMe`,
    transactionCall: (duelistId, queueId, queueMode, key) => matchmaker.match_make_me(account!, duelistId, queueId, queueMode, key),
    onComplete: handleTransactionComplete,
  })

  // Process the next item in the queue
  const processNextInQueue = useCallback(() => {
    if (transactionQueueRef.current.length === 0 || isProcessing || isLoading) return

    const nextItem = transactionQueueRef.current.shift()
    if (!nextItem || !account) return

    const { queueId, queueMode, duelistId } = nextItem

    setIsProcessing(true)
    
    executeMatchMakeMe(duelistId, queueId, queueMode)
  }, [isProcessing, isLoading, account, executeMatchMakeMe])

  // Add item to transaction queue
  const addToQueue = useCallback((queueId: constants.QueueId, queueMode: constants.QueueMode, duelistId: bigint) => {    
    const alreadyQueued = transactionQueueRef.current.some(item => item.duelistId === duelistId)
    if (alreadyQueued) return

    transactionQueueRef.current.push({ queueId, queueMode, duelistId })

    if (!isProcessing && !isLoading) {
      processNextInQueue()
    }
  }, [isProcessing, isLoading, processNextInQueue])

  // Watch for ranked player ready to matchmake
  useEffect(() => {
    if (!account || !address) return

    if (rankedPlayer.canTryToMatch && rankedPlayer.queueMode && rankedPlayer.duelistId) {
      console.log(`[MATCHMAKING] Ranked player can try to match - adding to queue`)
      addToQueue(constants.QueueId.Ranked, rankedPlayer.queueMode, rankedPlayer.duelistId)
    }
  }, [account, address, rankedPlayer.canTryToMatch, rankedPlayer.queueMode, rankedPlayer.duelistId, addToQueue])

  // Watch for unranked player ready to matchmake
  useEffect(() => {
    if (!account || !address) return

    if (unrankedPlayer.canTryToMatch && unrankedPlayer.queueMode && unrankedPlayer.duelistId) {
      console.log(`[MATCHMAKING] Unranked player can try to match - adding to queue`)
      addToQueue(constants.QueueId.Unranked, unrankedPlayer.queueMode, unrankedPlayer.duelistId)
    }
  }, [account, address, unrankedPlayer.canTryToMatch, unrankedPlayer.queueMode, unrankedPlayer.duelistId, addToQueue])

  // Effect to process queue when state changes
  useEffect(() => {
    if (!isProcessing && !isLoading && transactionQueueRef.current.length > 0) {
      processNextInQueue()
    }
  }, [isProcessing, isLoading, processNextInQueue])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      transactionQueueRef.current = []
    }
  }, [])

  return {
    isActive: transactionQueueRef.current.length > 0 || isProcessing,
    rankedInQueue: rankedPlayer.inQueueIds.length > 0,
    unrankedInQueue: unrankedPlayer.inQueueIds.length > 0,
  }
}