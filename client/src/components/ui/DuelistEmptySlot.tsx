import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import { useAccount } from '@starknet-react/core'
import { useGameAspect } from '/src/hooks/useGameAspect'
import { useDojoSystemCalls } from '@underware/pistols-sdk/dojo'
import { useTransactionHandler } from '/src/hooks/useTransaction'
import { constants } from '@underware/pistols-sdk/pistols/gen'
import { useDuelistsInMatchMaking } from '/src/stores/matchStore'
import { usePistolsContext } from '/src/hooks/PistolsContext'
import { DuelistMatchmakingSlot } from './DuelistMatchmakingSlot'

interface EnlistmentState {
  isEnlisting: boolean
  isWaitingForEnlistment: boolean
  enlistError: string | null
  enlistedDuelistId: bigint | null
}

interface CommitmentState {
  isCommitting: boolean
  isWaitingForCommit: boolean
  commitError: string | null
  committedDuelistId: bigint | null
}

interface DuelistEmptySlotProps {
  width?: number
  height?: number
  className?: string
  mouseDisabled?: boolean
  disabled?: boolean
  matchmakingType: constants.QueueId
  queueMode: constants.QueueMode
  onDuelistRemoved?: (duelistId: bigint) => void
  onActionStart?: (duelistId: bigint, action: 'commit' | 'enlist') => void
  onActionComplete?: (status: boolean, duelistId: bigint, error: string | null) => void
}

export interface DuelistEmptySlotHandle {
  duelistId: bigint | null
  commitmentState: CommitmentState
  enlistmentState: EnlistmentState
  commitToQueue: (duelistId: bigint) => void
  openDuelistSelect: () => void
}

export const DuelistEmptySlot = forwardRef<DuelistEmptySlotHandle, DuelistEmptySlotProps>((props, ref) => {
  const { aspectWidth } = useGameAspect();
  const { account } = useAccount();
  const { matchmaker } = useDojoSystemCalls();
  const { duelistSelectOpener } = usePistolsContext();

  const { rankedEnlistedIds, canMatchMakeIds, inQueueIds } = useDuelistsInMatchMaking(props.matchmakingType);

  const [commitmentState, setCommitmentState] = useState<CommitmentState>({
    isCommitting: false,
    isWaitingForCommit: false,
    commitError: null,
    committedDuelistId: null,
  });
  const [enlistmentState, setEnlistmentState] = useState<EnlistmentState>({
    isEnlisting: false,
    isWaitingForEnlistment: false,
    enlistError: null,
    enlistedDuelistId: null,
  });

  const selectionDisabled = useMemo(() => {
    return props.disabled || 
      props.mouseDisabled || 
      (commitmentState.isCommitting || commitmentState.isWaitingForCommit) || 
      (enlistmentState.isEnlisting || enlistmentState.isWaitingForEnlistment);
  }, [props.disabled, props.mouseDisabled, commitmentState, enlistmentState]);

  const hasIndexed = useMemo(() => {
    if (!commitmentState.committedDuelistId) return true;
    return inQueueIds.includes(commitmentState.committedDuelistId);
  }, [inQueueIds, commitmentState.committedDuelistId]);

  const enlistmentHasIndexed = useMemo(() => {
    if (!enlistmentState.enlistedDuelistId) return true;
    return rankedEnlistedIds.includes(enlistmentState.enlistedDuelistId);
  }, [enlistmentState.enlistedDuelistId, rankedEnlistedIds]);

  const currentDuelistId = useMemo(() => {
    return commitmentState.committedDuelistId || enlistmentState.enlistedDuelistId;
  }, [commitmentState, enlistmentState]);

  const onCompleteCommitToQueue = useCallback((result: boolean | Error, args: [bigint, constants.QueueId, constants.QueueMode]) => {
    console.log("commitToQueue complete", result, args);
    const [duelistIdArg] = args;
    if (result instanceof Error || result === false) {
      console.error("match_make_me failed", duelistIdArg?.toString() ?? "unknown");
      setCommitmentState((prev) => ({
        ...prev,
        isCommitting: false,
        isWaitingForCommit: false,
        commitError: "Failed to commit duelist. Please try again.",
      }));
      // Notify parent that commit failed
      if (duelistIdArg) {
        props.onActionComplete?.(false, duelistIdArg, "Failed to commit duelist. Please try again.");
      }
      return;
    }
    
    setCommitmentState({
      isCommitting: false,
      isWaitingForCommit: false,
      commitError: null,
      committedDuelistId: null,
    });

    // Notify parent that commit succeeded
    if (duelistIdArg) {
      props.onActionComplete?.(true, duelistIdArg, null);
    }
  }, [props.onActionComplete, setCommitmentState]);

  const {
    call: commitToQueue,
    isLoading: isCommitting,
    isWaitingForIndexer: isWaitingForCommit,
  } = useTransactionHandler<boolean, [bigint, constants.QueueId, constants.QueueMode]>({
    key: `commit_slot`,
    transactionCall: (duelistId, queueId, queueMode, key) => matchmaker.match_make_me(account, duelistId, queueId, queueMode, key),
    indexerCheck: hasIndexed,
    onComplete: onCompleteCommitToQueue,
  });
  
  const onCompleteEnlistDuelist = useCallback((result: boolean | Error, args: [bigint, constants.QueueId]) => {
    const [duelistIdArg] = args;
    if (result instanceof Error || result === false) {
      console.error("enlist_duelist failed", duelistIdArg?.toString() ?? "unknown");
      setEnlistmentState((prev) => ({
        ...prev,
        isEnlisting: false,
        isWaitingForEnlistment: false,
        enlistError: "Failed to enlist duelist. Please try again.",
      }));
      
      // Notify parent that enlist failed
      if (duelistIdArg) {
        props.onActionComplete?.(false, duelistIdArg, "Failed to enlist duelist. Please try again.");
      }
      return;
    }

    setEnlistmentState({
      isEnlisting: false,
      isWaitingForEnlistment: false,
      enlistError: null,
      enlistedDuelistId: null,
    });

    handleCommitDuelist(duelistIdArg);
  }, [setEnlistmentState, props.onActionComplete]);

  const {
    call: enlistDuelist,
    isLoading: isEnlisting,
    isWaitingForIndexer: isWaitingForEnlistment,
  } = useTransactionHandler<boolean, [bigint, constants.QueueId]>({
    key: `enlist_slot`,
    transactionCall: (duelistId, queueId, key) => matchmaker.enlist_duelist(account, duelistId, queueId, key),
    indexerCheck: enlistmentHasIndexed,
    onComplete: onCompleteEnlistDuelist,
  });

  const handleEnlistDuelist = useCallback(
    (duelistId: bigint) => {
      if (!account || !props.matchmakingType) return;

      // Notify parent that action started
      props.onActionStart?.(duelistId, 'enlist');

      setEnlistmentState((prev) => ({
        ...prev,
        isEnlisting: true,
        isWaitingForEnlistment: false,
        enlistError: null,
        enlistedDuelistId: duelistId,
      }));

      enlistDuelist(duelistId, props.matchmakingType);
    },
    [account, enlistDuelist, props.matchmakingType, props.onActionStart]
  );

  const handleCommitDuelist = useCallback((duelistId: bigint) => {
    if (!duelistId || !props.matchmakingType) return;
    if (!account) {
      console.error("Account required for match_make_me");
      return;
    }
    
    // Notify parent that action started
    props.onActionStart?.(duelistId, 'commit');
    
    setCommitmentState((prev) => ({
      ...prev,
      isCommitting: true,
      isWaitingForCommit: false,
      commitError: null,
      committedDuelistId: duelistId,
    }));
    
    commitToQueue(duelistId, props.matchmakingType, props.queueMode);
  }, [account, commitToQueue, props.matchmakingType, props.queueMode, props.onActionStart]);

  const handleDuelistSelected = useCallback((rawId: bigint, enlistMode: boolean) => {
    if (enlistMode) {
      handleEnlistDuelist(rawId);
    }
    handleCommitDuelist(rawId);
  }, [handleCommitDuelist, handleEnlistDuelist]);

  const handleOpenDuelistSelect = useCallback(() => {
    if (selectionDisabled || !props.matchmakingType) return;

    if (commitmentState.isWaitingForCommit || enlistmentState.isWaitingForEnlistment) return;

    if (commitmentState.isCommitting || enlistmentState.isEnlisting) return;

    if (commitmentState.commitError) {
      handleCommitDuelist(commitmentState.committedDuelistId);
      return;
    } else if (enlistmentState.enlistError) {
      handleEnlistDuelist(enlistmentState.enlistedDuelistId);
      return;
    }

    duelistSelectOpener.open({
      enlistMode:
        props.matchmakingType === constants.QueueId.Ranked &&
        canMatchMakeIds.length === 0,
      mode: props.queueMode,
      matchmakingType: props.matchmakingType,
      onDuelistSelected: (id: any, enlistMode: boolean) => {
        try {
          handleDuelistSelected(BigInt(id), enlistMode);
        } catch (error) {
          console.error("Invalid duelistId selected", id, error);
        }
      },
    });
  }, [
    selectionDisabled,
    props.matchmakingType,
    props.queueMode,
    duelistSelectOpener,
    handleDuelistSelected,
    canMatchMakeIds,
  ]);

  const handleRemove = useCallback(() => {
    if (commitmentState.committedDuelistId) {
      props.onDuelistRemoved?.(commitmentState.committedDuelistId);
      setCommitmentState((prev) => ({
        ...prev,
        isCommitting: false,
        isWaitingForCommit: false,
        commitError: null,
        committedDuelistId: null,
      }));
    } else if (enlistmentState.enlistedDuelistId) {
      props.onDuelistRemoved?.(enlistmentState.enlistedDuelistId);
      setEnlistmentState((prev) => ({
        ...prev,
        isEnlisting: false,
        isWaitingForEnlistment: false,
        enlistError: null,
        enlistedDuelistId: null,
      }));
    }
  }, [
    commitmentState.committedDuelistId,
    enlistmentState.enlistedDuelistId,
    props.onDuelistRemoved,
  ]);

  useImperativeHandle(
    ref,
    () => ({
      commitToQueue: (duelistId: bigint) => handleDuelistSelected(duelistId, false),
      duelistId: currentDuelistId || null,
      commitmentState,
      enlistmentState,
      openDuelistSelect: handleOpenDuelistSelect,
    }),
    [handleDuelistSelected, commitmentState, enlistmentState, handleOpenDuelistSelect, currentDuelistId]
  );

  useEffect(() => {
    console.log("commitmentState", commitmentState, "enlistmentState", enlistmentState, "currentDuelistId", currentDuelistId);
  }, [commitmentState, enlistmentState, currentDuelistId]);

  //full slot
  if (currentDuelistId) {

    return (
      <DuelistMatchmakingSlot
        width={props.width}
        height={props.height}
        className={props.className}
        mouseDisabled={props.mouseDisabled}
        disabled={props.disabled}
        matchmakingType={props.matchmakingType}
        queueMode={props.queueMode}
        duelistId={currentDuelistId}
        isCommitting={isCommitting || isWaitingForCommit}
        isEnlisting={isEnlisting || isWaitingForEnlistment}
        isError={!!commitmentState.commitError || !!enlistmentState.enlistError}
        onError={commitmentState.commitError ? () => handleCommitDuelist(commitmentState.committedDuelistId) : () => handleEnlistDuelist(enlistmentState.enlistedDuelistId)}
        handleRemove={handleRemove}
      />
    );
  }

  //empty slot
  return (
    <div
      className={`YesMouse ${props.className ?? ""}`}
      onClick={handleOpenDuelistSelect}
      style={{
        width: aspectWidth(props.width || 100),
        height: aspectWidth(props.height || 140),
        borderRadius: aspectWidth(1),
        backgroundImage:
          "url(/images/ui/duel/card_details/environment_card_placeholder.png)",
        backgroundSize: "100% 100%",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: selectionDisabled ? "not-allowed" : "pointer",
        position: "relative",
        transition: "all 0.2s ease",
        border: "2px solid transparent",
        opacity: selectionDisabled ? 0.6 : 1,
      }}
      onMouseEnter={(event) => {
        if (selectionDisabled) return;
        event.currentTarget.style.border = "2px solid #ce6f2c";
        event.currentTarget.style.transform = "scale(1.05)";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.border = "2px solid transparent";
        event.currentTarget.style.transform = "scale(1)";
      }}
    >
      <div
        style={{
          width: aspectWidth(3),
          height: aspectWidth(3),
          borderRadius: "50%",
          background: "rgba(206, 111, 44, 0.9)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "bold",
          color: "#efe1d7",
          textShadow: "0.1rem 0.1rem 2px rgba(0, 0, 0, 0.9)",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.5)",
        }}
      >
        <span
          style={{
            fontSize: aspectWidth(2),
            lineHeight: 1,
            display: "inline-block",
            position: "relative",
            top: aspectWidth(-0.2),
          }}
        >
          +
        </span>
      </div>
    </div>
  );
})
