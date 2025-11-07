import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react'
import { useAccount } from '@starknet-react/core'
import { useGameAspect } from '/src/hooks/useGameAspect'
import { DuelistCard, DuelistCardHandle } from '/src/components/cards/DuelistCard'
import { ActionButton } from '/src/components/ui/Buttons'
import { constants } from '@underware/pistols-sdk/pistols/gen'
import { useMatchPlayer, useDuelistsInMatchMaking } from '/src/stores/matchStore'
import { usePistolsContext } from '/src/hooks/PistolsContext'
import { useChallenge } from '/src/stores/challengeStore'
import { useIsMyAccount } from '/src/hooks/useIsYou'
import { useDuelCallToAction } from '/src/stores/eventsModelStore'
import { CardColor } from '@underware/pistols-sdk/pistols/constants'
import { emitter } from '/src/three/game'
import { useDuel } from '/src/hooks/useDuel'
import { useDojoSystemCalls } from '@underware/pistols-sdk/dojo'
import { useTransactionHandler } from '/src/hooks/useTransaction'
import { useCanCollectDuel } from '/src/hooks/usePistolsContractCalls'

interface DuelistMatchmakingSlotProps {
  width?: number
  height?: number
  className?: string
  mouseDisabled?: boolean
  disabled?: boolean
  matchmakingType: constants.QueueId
  queueMode: constants.QueueMode
  duelistId?: bigint
  duelId?: bigint
  isCommitting?: boolean
  isEnlisting?: boolean
  isEnlistedButNotCommitted?: boolean
  isError?: boolean
  errorMessage?: string | null
  onDuelistPromoted?: (duelistId: bigint) => void
  onRequeueDuelist?: (duelistId: bigint) => void
  onError?: () => void
  handleRemove?: () => void
  onQueueClick?: () => void
}

export interface DuelistMatchmakingSlotHandle {
  duelistId: bigint | null
}

export const DuelistMatchmakingSlot = forwardRef<DuelistMatchmakingSlotHandle, DuelistMatchmakingSlotProps>((props, ref) => {
  const { aspectWidth } = useGameAspect();
  const { address, account } = useAccount();
  const { dispatchSelectDuel } = usePistolsContext();

  const rankedPlayer = useMatchPlayer(address, constants.QueueId.Ranked);
  const unrankedPlayer = useMatchPlayer(address, constants.QueueId.Unranked);
  const { canMatchMakeIds, inQueueIds } = useDuelistsInMatchMaking(props.matchmakingType);

  const challenge = useChallenge(props.duelId || 0n);
  const { isMyAccount: isYouA } = useIsMyAccount(challenge.duelistAddressA);
  const { isMyAccount: isYouB } = useIsMyAccount(challenge.duelistAddressB);

  const requiresAction = useDuelCallToAction(props.duelId || 0n);
  const { canCollectDuel } = useCanCollectDuel(props.duelId || 0n);
  const animatedDuel = useDuel(props.duelId || 0n);
  const { game, duel_token } = useDojoSystemCalls();
  
  const buttonsRowRef = useRef(null);

  const isMyTurn = useMemo(() => {
    if (!props.duelId || !challenge.duelistAddressA || !challenge.duelistAddressB) return false;
    return (animatedDuel.turnA && isYouA) || (animatedDuel.turnB && isYouB);
  }, [props.duelId, animatedDuel.turnA, animatedDuel.turnB, isYouA, isYouB, challenge.duelistAddressA, challenge.duelistAddressB]);

  const showCollectButton = useMemo(() => {
    if (!props.duelId) return false;
    if (isMyTurn && !challenge.isSeasonExpired) return false;
    return canCollectDuel || challenge.needToSyncExpired;
  }, [props.duelId, canCollectDuel, challenge.needToSyncExpired, isMyTurn, challenge.isSeasonExpired]);

  const { call: collectExpiredDuel, isLoading: isCollectingExpired } = useTransactionHandler<boolean, [bigint]>({
    key: `collect_expired_duel${props.duelId}`,
    transactionCall: (duelId, key) => {
      if (!account) throw new Error('Account not available');
      return duel_token.reply_duel(account, 0n, duelId, false, key);
    },
    indexerCheck: !challenge.needToSyncExpired,
    messageTargetRef: buttonsRowRef,
    waitingMessage: "Transaction successful! Waiting for indexer...",
    messageDelay: 1000,
  });

  const { call: collectTimedOutDuel, isLoading: isCollectingTimedOut } = useTransactionHandler<boolean, [bigint]>({
    key: `collect_timed_out_duel${props.duelId}`,
    transactionCall: (duelId, key) => {
      if (!account) throw new Error('Account not available');
      return game.collect_duel(account, duelId, key);
    },
    indexerCheck: !canCollectDuel,
    messageTargetRef: buttonsRowRef,
    waitingMessage: "Transaction successful! Waiting for indexer...",
    messageDelay: 1000,
  });

  const isCollecting = isCollectingExpired || isCollectingTimedOut;

  const myDuelistIdFromDuel = useMemo(() => {
    if (!props.duelId) return null;
    return isYouA ? challenge.duelistIdA : isYouB ? challenge.duelistIdB : null;
  }, [props.duelId, challenge.duelistIdA, challenge.duelistIdB, isYouA, isYouB]);

  const isPlayerTurn = useMemo(() => {
    if (!props.duelId || !requiresAction || !challenge.duelistAddressA || !challenge.duelistAddressB) return false;
    return true;
  }, [props.duelId, requiresAction, challenge.duelistAddressA, challenge.duelistAddressB]);

  const isAvailableForRequeue = useMemo(() => {
    if (!challenge.isFinished || !myDuelistIdFromDuel) return false;

    return canMatchMakeIds.includes(myDuelistIdFromDuel);
  }, [challenge.isFinished, myDuelistIdFromDuel, canMatchMakeIds]);

  const duelistCardRef = useRef<DuelistCardHandle | null>(null);

  const currentDuelistId = useMemo(() => {
    return props.duelistId || myDuelistIdFromDuel;
  }, [props.duelistId, myDuelistIdFromDuel]);

  const duelStateInfo = useMemo(() => {
    if (props.isEnlisting) {
      return { message: "Enlisting...", buttonText: null, color: "#f97316", showTimer: false };
    }

    if (props.isEnlistedButNotCommitted) {
      return { message: "Enlisted!", buttonText: null, color: "#22c55e", showTimer: false };
    }

    if (props.isCommitting) {
      return { message: "Commiting...", buttonText: null, color: "#f97316", showTimer: false };
    }

    if (props.isError) {
      return { message: "Error", buttonText: null, color: "#ef4444", showTimer: false };
    }

    if (canCollectDuel) {
      return { message: "Duel Timed Out", buttonText: !challenge.isSeasonExpired ? "GO TO DUEL" : null, color: "#ef4444", showTimer: !challenge.isSeasonExpired ? true : false };
    }
    
    if (challenge.needToSyncExpired) {
      return { message: "Duel Expired", buttonText: !challenge.isSeasonExpired ? "GO TO DUEL" : null, color: "#ef4444", showTimer: !challenge.isSeasonExpired ? true : false };
    }

    if (currentDuelistId && (rankedPlayer.duelistId === BigInt(currentDuelistId) || unrankedPlayer.duelistId === BigInt(currentDuelistId)) && challenge.isAwaiting) {
      return { message: "Searching for Match...", buttonText: props.duelId ? "GO TO DUEL" : null, color: "#fbbf24", showTimer: true };
    }

    const isInQueue = currentDuelistId && inQueueIds.includes(currentDuelistId) && challenge.isAwaiting;
    if (isInQueue) {
      return { message: "Waiting in Line...", buttonText: null, color: "#f59e0b", showTimer: true };
    }

    if (props.duelId) {
      if (challenge.isFinished) {
        return { message: "Duel Finished", buttonText: "SEE RESULTS", color: "#d1d5db", showTimer: false };
      }

      if (((animatedDuel.turnA && isYouA) || (animatedDuel.turnB && isYouB)) && !!challenge.duelistAddressA && !!challenge.duelistAddressB) {
        return { message: "Its Your move!", buttonText: "GO TO DUEL", color: "#22c55e", showTimer: true };
      }

      if (challenge.isInProgress && !!challenge.duelistAddressA && !!challenge.duelistAddressB) {
        return { message: "Waiting on Opponent", buttonText: "GO TO DUEL", color: "#84cc16", showTimer: true };
      }

      return { message: "Waiting For Opponent", buttonText: "GO TO DUEL", color: "#84cc16", showTimer: true };
    }

    // Default waiting state
    return { message: "Waiting in Line...", buttonText: null, color: "#f59e0b", showTimer: false };
  }, [
    props.isCommitting,
    props.isEnlisting,
    props.isEnlistedButNotCommitted,
    props.isError,
    currentDuelistId,
    inQueueIds,
    rankedPlayer.duelistId,
    rankedPlayer.timestampEnter,
    unrankedPlayer.duelistId,
    unrankedPlayer.timestampEnter,
    props.duelId,
    challenge.isFinished,
    challenge.isInProgress,
    challenge.needToSyncExpired,
    challenge.isSeasonExpired,
    canCollectDuel,
    requiresAction,
  ]);

  const handlePromote = useCallback(() => {
    // if (!currentSelectedId) return
    // props.onDuelistPromoted?.(currentSelectedId)
  }, [props.onDuelistPromoted]);

  const handleGoToDuel = useCallback(() => {
    if (!props.duelId) return;
    dispatchSelectDuel(props.duelId);
  }, [props.duelId]);

  const handleRequeue = useCallback(() => {
    if (!myDuelistIdFromDuel) return;
    props.onRequeueDuelist?.(myDuelistIdFromDuel);
  }, [myDuelistIdFromDuel, props.onRequeueDuelist]);

  const handleCollect = useCallback(() => {
    if (!props.duelId) return;
    if (challenge.needToSyncExpired) {
      collectExpiredDuel(props.duelId);
    } else if (canCollectDuel === true) {
      collectTimedOutDuel(props.duelId);
    }
  }, [props.duelId, challenge.needToSyncExpired, collectExpiredDuel, collectTimedOutDuel, canCollectDuel]);

  useImperativeHandle(
    ref,
    () => ({
      duelistId: currentDuelistId || null,
    }),
    [currentDuelistId]
  );

  useEffect(() => {
    if (currentDuelistId && (isPlayerTurn || props.isError)) {
      duelistCardRef?.current?.toggleBlink(true);
    } else {
      duelistCardRef?.current?.toggleBlink(false);
    }
  }, [currentDuelistId, duelistCardRef, isPlayerTurn, props.isError]);
  
  const disableButtons = props.isCommitting || props.isEnlisting || isCollecting;

  return (
    <div
      style={{
        width: aspectWidth(props.width || 100),
        height: aspectWidth(props.height || 140),
        borderRadius: aspectWidth(1),
        boxShadow: "0 2px 10px 6px rgba(0, 0, 0, 0.5)",
        position: "relative",
      }}
    >
      <DuelistCard
        ref={duelistCardRef}
        duelistId={Number(currentDuelistId)}
        isSmall
        isLeft
        isVisible
        instantVisible
        isFlipped
        instantFlip
        isHanging={false}
        isHighlightable
        defaultHighlightColor={
          props.isError ? CardColor.RED : isPlayerTurn ? CardColor.PURPLE : CardColor.WHITE
        }
        width={props.width || 100}
        height={props.height || 140}
        mouseDisabled={props.mouseDisabled}
        hideSouls
        showQueueInformation={true}
        showSeasonRank={props.matchmakingType === constants.QueueId.Ranked}
        queueMessage={duelStateInfo.message}
        queueColor={duelStateInfo.color}
        queueTime={
          !currentDuelistId ? null :
          rankedPlayer.duelistId === BigInt(currentDuelistId)
            ? rankedPlayer.timestampEnter
            : unrankedPlayer.duelistId === BigInt(currentDuelistId)
            ? unrankedPlayer.timestampEnter
            : challenge?.timestampStart || null
        }
        showTimer={duelStateInfo.showTimer}
        onHover={(isHovered) => {
          if (isHovered) {
            emitter.emit('hover_description', props.errorMessage);
          } else {
            emitter.emit('hover_description', null);
          }
        }}
      />

      {/* TODO */}
      {props.isError && (
        <>
          <div
            style={{
              position: "absolute",
              top: aspectWidth(1),
              right: aspectWidth(1),
              width: aspectWidth(2),
              height: aspectWidth(2),
              background: "#ff4444",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: aspectWidth(1.2),
              fontWeight: "bold",
              color: "white",
              zIndex: 10,
            }}
          >
            !
          </div>
        </>
      )}

      {!disableButtons && (
        <div
          className="NoMouse NoDrag"
          ref={buttonsRowRef}
          style={{
            position: "absolute",
            bottom: aspectWidth(-4.8),
            zIndex: 100,
            width: "100%",
            height: aspectWidth(4.8),
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            paddingLeft: aspectWidth(0.4),
            paddingRight: aspectWidth(0.4),
          }}
        >
          {props.isError && (
            <ActionButton
              className="YesMouse"
              label="RETRY"
              onClick={props.onError}
              fill
              negative
              disabled={disableButtons}
            />
          )}
          {props.isError && (
            <ActionButton
              className="YesMouse"
              label="REMOVE"
              onClick={props.handleRemove}
              fill
              negative
              disabled={disableButtons}
            />
          )}
          {false && (
            <ActionButton
              className="YesMouse"
              label="PROMOTE"
              onClick={handlePromote}
              important
              fill
              disabled={disableButtons}
            />
          )}
          {challenge && duelStateInfo.buttonText && (
            <ActionButton
              className="YesMouse"
              label={duelStateInfo.buttonText}
              onClick={handleGoToDuel}
              important={isPlayerTurn}
              fill
              disabled={disableButtons}
            />
          )}
          {isAvailableForRequeue && (
            <ActionButton
              className="YesMouse"
              label="REQUEUE"
              onClick={handleRequeue}
              important
              fill
              disabled={disableButtons}
            />
          )}
          {showCollectButton && (
            <ActionButton
              className="YesMouse"
              label="COLLECT"
              onClick={handleCollect}
              important
              fill
              disabled={disableButtons}
              loading={isCollecting}
            />
          )}
          {props.isEnlistedButNotCommitted && props.onQueueClick && (
            <ActionButton
              className="YesMouse"
              label="Queue!"
              onClick={props.onQueueClick}
              important
              fill
              disabled={disableButtons}
            />
          )}
        </div>
      )}
    </div>
  );
})
