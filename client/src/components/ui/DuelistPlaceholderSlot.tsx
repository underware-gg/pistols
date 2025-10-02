import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useAccount } from '@starknet-react/core'
import { useGameAspect } from '/src/hooks/useGameAspect'
import { DuelistCard } from '/src/components/cards/DuelistCard'
import { ActionButton } from '/src/components/ui/Buttons'
import { useDojoSystemCalls } from '@underware/pistols-sdk/dojo'
import { useTransactionHandler } from '/src/hooks/useTransaction'
import { constants } from '@underware/pistols-sdk/pistols/gen'
import { useMatchPlayer, useDuelistsInMatchMaking } from '/src/stores/matchStore'
import { usePistolsContext, usePistolsScene } from '/src/hooks/PistolsContext'
import { emitter } from '/src/three/game'
import { SceneName } from '/src/data/assets'
import { useChallenge } from '/src/stores/challengeStore'

interface EnlistmentState {
  isEnlisting: boolean
  isWaitingForEnlistment: boolean
  enlistError: string | null
  enlistedDuelistId: bigint | null
}

interface DuelistPlaceholderSlotProps {
  width?: number
  height?: number
  className?: string
  mouseDisabled?: boolean
  disabled?: boolean
  matchmakingType: constants.QueueId
  queueMode: constants.QueueMode
  queuedDuelistId?: bigint
  selectedDuelistId?: bigint
  duellingDuelistId?: bigint
  duelId?: bigint
  unavailableDuelistIds?: Set<bigint>
  showRemoveButton?: boolean
  showPromoteButton?: boolean
  showGoToDuelButton?: boolean
  onDuelistSelected?: (duelistId: bigint) => void
  onDuelistRemoved?: (duelistId: bigint) => void
  onDuelistPromoted?: (duelistId: bigint) => void
  onCommitFailure?: (duelistId: bigint) => void
}

export interface DuelistPlaceholderSlotHandle {
  commitToQueue: () => void
  isReady: boolean
  selectedDuelistId: bigint | null
  queuedDuelistId: bigint | null
  clearSelection: () => void
  enlistmentState: EnlistmentState
  clearEnlistmentError: () => void
}

export const DuelistPlaceholderSlot = forwardRef<DuelistPlaceholderSlotHandle, DuelistPlaceholderSlotProps>((props, ref) => {
  const { aspectWidth } = useGameAspect()
  const { account, address } = useAccount()
  const { matchmaker } = useDojoSystemCalls()
  const { duelistSelectOpener, dispatchSelectDuel } = usePistolsContext()
  const { timestampStart: duelDurationTimestamp } = useChallenge(props.duelId || 0n)

  const rankedPlayer = useMatchPlayer(address, constants.QueueId.Ranked)
  const unrankedPlayer = useMatchPlayer(address, constants.QueueId.Unranked)
  const { rankedEnlistedIds, canMatchMakeIds } = useDuelistsInMatchMaking(constants.QueueId.Ranked)

  const [pendingCommitId, setPendingCommitId] = useState<bigint | null>(null)
  const [enlistmentState, setEnlistmentState] = useState<EnlistmentState>({
    isEnlisting: false,
    isWaitingForEnlistment: false,
    enlistError: null,
    enlistedDuelistId: null,
  })

  const currentSelectedId = props.selectedDuelistId ?? null
  const currentQueuedId = props.queuedDuelistId ?? null
  const currentDuellingId = props.duellingDuelistId ?? null
  const currentDuelistId = currentDuellingId ?? currentQueuedId ?? currentSelectedId
  const selectionDisabled = props.disabled || props.mouseDisabled || Boolean(currentQueuedId) || Boolean(currentDuellingId)

  const slotTransactionKey = useRef(`commit_slot_${Math.random().toString(36).slice(2)}`)
  const enlistTransactionKey = useRef(`enlist_slot_${Math.random().toString(36).slice(2)}`)

  const hasIndexed = useMemo(() => {
    if (!pendingCommitId) return true
    return currentQueuedId === pendingCommitId
  }, [currentQueuedId, pendingCommitId])

  const enlistmentHasIndexed = useMemo(() => {
    if (!enlistmentState.enlistedDuelistId) return true
    return rankedEnlistedIds.includes(enlistmentState.enlistedDuelistId)
  }, [enlistmentState.enlistedDuelistId, rankedEnlistedIds])

  const {
    call: commitToQueue,
    isLoading: isCommitting,
    isWaitingForIndexer: isWaitingForCommit,
  } = useTransactionHandler<boolean, [bigint, constants.QueueId, constants.QueueMode]>({
    key: slotTransactionKey.current,
    transactionCall: (duelistId, queueId, queueMode, key) =>
      matchmaker.match_make_me(account, duelistId, queueId, queueMode, key),
    indexerCheck: hasIndexed,
    onComplete: (result, args) => {
      const [duelistIdArg] = args
      if (result instanceof Error || result === false) {
        console.error('match_make_me failed', duelistIdArg?.toString() ?? 'unknown')
        setPendingCommitId(null)
        // Notify parent that commit failed
        if (duelistIdArg && props.onCommitFailure) {
          props.onCommitFailure(duelistIdArg)
        }
        return
      }
      setPendingCommitId(null)
    },
  })

  const {
    call: enlistDuelist,
    isLoading: isEnlisting,
    isWaitingForIndexer: isWaitingForEnlistment,
  } = useTransactionHandler<boolean, [bigint, constants.QueueId]>({
    key: enlistTransactionKey.current,
    transactionCall: (duelistId, queueId, key) =>
      matchmaker.enlist_duelist(account, duelistId, queueId, key),
    indexerCheck: enlistmentHasIndexed,
    onComplete: (result, args) => {
      const [duelistIdArg] = args
      if (result instanceof Error || result === false) {
        console.error('enlist_duelist failed', duelistIdArg?.toString() ?? 'unknown')
        setEnlistmentState(prev => ({
          ...prev,
          isEnlisting: false,
          isWaitingForEnlistment: false,
          enlistError: 'Failed to enlist duelist. Please try again.',
        }))
        return
      }

      setEnlistmentState(prev => ({
        ...prev,
        isEnlisting: false,
        isWaitingForEnlistment: false,
        enlistError: null,
      }))
      
      props.onDuelistSelected?.(duelistIdArg)
    },
  })
  
  const isReady = useMemo(() => {
    return !isCommitting && !isWaitingForCommit && !isEnlisting && !isWaitingForEnlistment && !enlistmentState.enlistError
  }, [isCommitting, isWaitingForCommit, isEnlisting, isWaitingForEnlistment, enlistmentState.enlistError])

  useEffect(() => {
    if (pendingCommitId && currentSelectedId === null) {
      setPendingCommitId(null)
    }
  }, [currentSelectedId, pendingCommitId])

  const handleDuelistSelected = useCallback((rawId: bigint, enlistMode: boolean) => {
    if (enlistMode) {
      handleEnlistDuelist(rawId)
    }
    props.onDuelistSelected?.(rawId)
  }, [props.onDuelistSelected])

  const handleEnlistDuelist = useCallback((duelistId: bigint) => {
    if (!account || !props.matchmakingType) return
    
    setEnlistmentState(prev => ({
      ...prev,
      isEnlisting: true,
      isWaitingForEnlistment: false,
      enlistError: null,
      enlistedDuelistId: duelistId,
    }))
    
    enlistDuelist(duelistId, props.matchmakingType)
  }, [account, enlistDuelist, props.matchmakingType])

  const handleClearEnlistmentError = useCallback(() => {
    setEnlistmentState(prev => ({
      ...prev,
      enlistError: null,
      enlistedDuelistId: null,
    }))
  }, [])

  const handleOpenDuelistSelect = useCallback(() => {
    if (selectionDisabled || !props.matchmakingType) return

    const unavailable = props.unavailableDuelistIds
      ? new Set(props.unavailableDuelistIds)
      : new Set<bigint>()
    if (props.selectedDuelistId) {
      unavailable.add(props.selectedDuelistId)
    }

    duelistSelectOpener.open({
      unavailableDuelistIds: unavailable,
      enlistMode: props.matchmakingType === constants.QueueId.Ranked && canMatchMakeIds.length === 0,
      mode: props.queueMode,
      matchmakingType: props.matchmakingType,
      onDuelistSelected: (id: any, enlistMode: boolean) => {
        try {
          handleDuelistSelected(BigInt(id), enlistMode)
        } catch (error) {
          console.error('Invalid duelistId selected', id, error)
        }
      },
    })
  }, [
    selectionDisabled,
    props.matchmakingType,
    props.unavailableDuelistIds,
    props.selectedDuelistId,
    props.queueMode,
    duelistSelectOpener,
    handleDuelistSelected,
    canMatchMakeIds,
  ])

  const handleCommit = useCallback(() => {
    if (!currentSelectedId || !props.matchmakingType) return
    if (!account) {
      console.error('Account required for match_make_me')
      return
    }
    setPendingCommitId(currentSelectedId)
    commitToQueue(currentSelectedId, props.matchmakingType, props.queueMode)
  }, [account, commitToQueue, currentSelectedId, props.matchmakingType, props.queueMode])

  const handleRemove = useCallback(() => {
    if (!currentSelectedId) return
    props.onDuelistRemoved?.(currentSelectedId)
    setPendingCommitId(null)
  }, [currentSelectedId, props.onDuelistRemoved])

  const handlePromote = useCallback(() => {
    if (!currentSelectedId) return
    props.onDuelistPromoted?.(currentSelectedId)
  }, [currentSelectedId, props.onDuelistPromoted])

  const handleGoToDuel = useCallback(() => {
    if (!props.duelId) return
    // dispatchSetScene(SceneName.Duel, { duelId: props.duelId });
    dispatchSelectDuel(props.duelId)
  }, [props.duelId])

  useImperativeHandle(
    ref,
    () => ({
      commitToQueue: handleCommit,
      isReady,
      selectedDuelistId: currentSelectedId,
      queuedDuelistId: currentQueuedId,
      clearSelection: () => {
        if (currentSelectedId) {
          props.onDuelistRemoved?.(currentSelectedId)
        }
      },
      enlistmentState,
      clearEnlistmentError: handleClearEnlistmentError,
    }),
    [
      handleCommit,
      isReady,
      currentSelectedId,
      currentQueuedId,
      props.onDuelistRemoved,
      handleEnlistDuelist,
      enlistmentState,
      handleClearEnlistmentError,
    ],
  )

  //full slot
  if (currentDuelistId) {
    const disableButtons = isCommitting || isWaitingForCommit || isEnlisting || isWaitingForEnlistment

    return (
      <div
        style={{
          width: aspectWidth(props.width || 100),
          height: aspectWidth(props.height || 140),
          borderRadius: aspectWidth(1),
          boxShadow: '0 2px 10px 10px rgba(0, 0, 0, 0.5)',
          position: 'relative',
        }}
      >
        <DuelistCard
          duelistId={Number(currentDuelistId)}
          isSmall
          isLeft
          isVisible
          instantVisible
          isFlipped
          instantFlip
          isHanging={false}
          isHighlightable
          width={props.width || 100}
          height={props.height || 140}
          mouseDisabled={props.mouseDisabled}
          hideSouls
          isInQueue={
            Boolean(currentQueuedId) ||
            rankedPlayer.duelistId === BigInt(currentDuelistId) ||
            unrankedPlayer.duelistId === BigInt(currentDuelistId)
          }
          isCommitting={isCommitting || isWaitingForCommit}
          isEnlisting={isEnlisting || isWaitingForEnlistment}
          showSeasonRank={props.matchmakingType === constants.QueueId.Ranked}
          isWaitingToJoinQueue={Boolean(currentSelectedId)}
          showDuelDurationTimer={props.showGoToDuelButton}
          duelDurationTimestamp={duelDurationTimestamp}
          queueTimestampStart={rankedPlayer.duelistId === BigInt(currentDuelistId) ? rankedPlayer.timestampEnter :  unrankedPlayer.duelistId === BigInt(currentDuelistId) ? unrankedPlayer.timestampEnter : undefined}
        />

        {enlistmentState.enlistError && (
          <>
            <div
              style={{
                position: 'absolute',
                top: aspectWidth(1),
                right: aspectWidth(1),
                width: aspectWidth(2),
                height: aspectWidth(2),
                background: '#ff4444',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: aspectWidth(1.2),
                fontWeight: 'bold',
                color: 'white',
                zIndex: 10,
              }}
            >
              !
            </div>
            
            <div
              className="YesMouse NoDrag"
              style={{
                position: 'absolute',
                bottom: aspectWidth(-3),
                zIndex: 100,
                width: '100%',
                height: aspectWidth(3),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ActionButton
                label="RETRY"
                onClick={() => {
                  if (enlistmentState.enlistedDuelistId) {
                    handleEnlistDuelist(enlistmentState.enlistedDuelistId)
                  }
                }}
                important
              />
            </div>
          </>
        )}

        {(props.showRemoveButton || props.showPromoteButton || props.showGoToDuelButton) && !disableButtons && !enlistmentState.enlistError && (
          <div
            className="YesMouse NoDrag"
            style={{
              position: 'absolute',
              bottom: aspectWidth(-3),
              zIndex: 100,
              width: '100%',
              height: aspectWidth(3),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: aspectWidth(1),
            }}
          >
            {props.showRemoveButton && (
              <ActionButton
                label="REMOVE"
                onClick={handleRemove}
                negative
                disabled={disableButtons}
              />
            )}
            {false && (
              <ActionButton
                label="PROMOTE"
                onClick={handlePromote}
                important
                disabled={disableButtons}
              />
            )}
            {props.showGoToDuelButton && (
              <ActionButton
                label="GO TO DUEL"
                onClick={handleGoToDuel}
                important
                disabled={disableButtons}
              />
            )}
          </div>
        )}
      </div>
    )
  }

  //empty slot
  return (
    <div
      className={`YesMouse ${props.className ?? ''}`}
      onClick={handleOpenDuelistSelect}
      style={{
        width: aspectWidth(props.width || 100),
        height: aspectWidth(props.height || 140),
        borderRadius: aspectWidth(1),
        backgroundImage:
          'url(/images/ui/duel/card_details/environment_card_placeholder.png)',
        backgroundSize: '100% 100%',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: selectionDisabled ? 'not-allowed' : 'pointer',
        position: 'relative',
        transition: 'all 0.2s ease',
        border: '2px solid transparent',
        opacity: selectionDisabled ? 0.6 : 1,
      }}
      onMouseEnter={(event) => {
        if (selectionDisabled) return
        event.currentTarget.style.border = '2px solid #ce6f2c'
        event.currentTarget.style.transform = 'scale(1.05)'
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.border = '2px solid transparent'
        event.currentTarget.style.transform = 'scale(1)'
      }}
    >
      <div
        style={{
          width: aspectWidth(3),
          height: aspectWidth(3),
          borderRadius: '50%',
          background: 'rgba(206, 111, 44, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          color: '#efe1d7',
          textShadow: '0.1rem 0.1rem 2px rgba(0, 0, 0, 0.9)',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.5)',
        }}
      >
        <span
          style={{
            fontSize: aspectWidth(2),
            lineHeight: 1,
            display: 'inline-block',
            position: 'relative',
            top: aspectWidth(-0.2),
          }}
        >
          +
        </span>
      </div>
    </div>
  )
})
