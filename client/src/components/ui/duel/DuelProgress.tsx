import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Image } from 'semantic-ui-react'
import { useAccount } from '@starknet-react/core'
import { BigNumberish } from 'starknet'
import { isPositiveBigint } from '@underware/pistols-sdk/utils'
import { useThreeJsContext } from '/src/hooks/ThreeJsContext'
import { useDojoSetup, useDojoSystemCalls } from '@underware/pistols-sdk/dojo'
import { useApiAutoReveal } from '@underware/pistols-sdk/api'
import { useRevealAction, useSignAndRestoreMovesFromHash } from '/src/hooks/useRevealAction'
import { useIsMyDuelist } from '/src/hooks/useIsYou'
import { DuelStage, useDuel } from '/src/hooks/useDuel'
import CommitPacesModal from '/src/components/modals/CommitPacesModal'
import { useTransactionHandler, useTransactionObserver } from '/src/hooks/useTransaction'
import { useDuelContext } from '/src/components/ui/duel/DuelContext'
import { usePistolsContext } from '/src/hooks/PistolsContext'
import { useChallenge } from '/src/stores/challengeStore'
import { useDuelist } from '/src/stores/duelistStore'
import { useDuelistFameBalance } from '/src/stores/coinStore'
import { constants } from '@underware/pistols-sdk/pistols/gen'

export default function DuelProgress({
  isA = false,
  isB = false,
  swapSides = false,
  name,
  duelId,
  duelStage,
  duelistId,
  completedStages,
  revealCards,
  isYou,
  canAutoReveal
}) {
  const { gameImpl } = useThreeJsContext()
  const { completedStagesLeft } = useDuelContext()
  const { round1, challenge: { isTutorial } } = useDuel(duelId)
  const { duelistSelectOpener } = usePistolsContext()
  const { livesStaked, state } = useChallenge(duelId)
  const { duel_token } = useDojoSystemCalls()
  const { account } = useAccount()
  
  const [selectedDuelistIdForCheck, setSelectedDuelistIdForCheck] = useState<BigNumberish>(0n)
  
  const { isInAction } = useDuelist(selectedDuelistIdForCheck)
  const { lives } = useDuelistFameBalance(selectedDuelistIdForCheck)

  const round1Moves = useMemo(() => {
    if (swapSides) {
      return isA ? round1?.moves_b : round1?.moves_a;
    } else {
      return isA ? round1?.moves_a : round1?.moves_b;
    }
  }, [isA, round1, swapSides])

  const duelProgressRef = useRef(null)
  const isRevealingRef = useRef(false)

  // Duelist interaction
  const { isConnected } = useAccount()
  const isMyDuelist = useIsMyDuelist(duelistId)

  // Commit modal control
  const [commitModalIsOpen, setCommitModalIsOpen] = useState(false)
  const { reveal, canReveal } = useRevealAction(duelId, isYou ? duelistId : 0n, round1Moves?.hashed, duelStage == DuelStage.Round1Reveal, `reveal_moves${duelId}`)

  const { call: revealMoves, isLoading: isLoadingReveal } = useTransactionHandler<boolean, []>({
    transactionCall: () => reveal(),
    indexerCheck: completedStagesLeft[DuelStage.Round1Reveal] && !canReveal,
    key: `reveal_moves${duelId}`,
  })

  const { isLoading: isLoadingCommit } = useTransactionObserver({ key: `commit_paces${duelId}`, indexerCheck: completedStagesLeft[DuelStage.Round1Commit] })

  const { call: acceptChallenge, isLoading: isLoadingAccept } = useTransactionHandler<boolean, [bigint, BigNumberish?, boolean?]>({
    transactionCall: (duelId, duelistId, accepted, key) => duel_token.reply_duel(account, duelId, duelistId, accepted, key),
    indexerCheck: state != constants.ChallengeState.Awaiting,
    key: `accept_challenge_${duelId}`,
  })
  
  useEffect(() => {
    if (isLoadingAccept || selectedDuelistIdForCheck === 0n) return
    
    if (lives === undefined) return
    
    const isViable = !isInAction && lives >= livesStaked
    
    if (!isViable) {
      setTimeout(() => {
        duelistSelectOpener?.open({ onDuelistSelected: handleDuelistSelectedCallback })
      }, 100)
      setSelectedDuelistIdForCheck(0n)
      return
    }
    
    acceptChallenge(duelId, selectedDuelistIdForCheck, true)
    setSelectedDuelistIdForCheck(0n)
  }, [selectedDuelistIdForCheck, isInAction, lives, livesStaked])
  
  const handleDuelistSelectedCallback = useCallback((selectedDuelistId: BigNumberish) => {
    if (!isPositiveBigint(selectedDuelistId)) return
    setSelectedDuelistIdForCheck(selectedDuelistId)
  }, [])

  const { selectedNetworkConfig } = useDojoSetup()
  const revealFromServer = useMemo(() => (selectedNetworkConfig.useRevealServer && !isTutorial), [selectedNetworkConfig, isTutorial])
  const { isRevealing: isLoadingAutoReveal, isRevealed } = useApiAutoReveal(
    selectedNetworkConfig.assetsServerUrl,
    duelId,
    (canAutoReveal && canReveal && isYou && !isLoadingCommit && revealFromServer)
  )

  const onClick = useCallback(() => {
    if (isYou && !isPositiveBigint(duelistId) && isConnected) {
      duelistSelectOpener?.open({ onDuelistSelected: handleDuelistSelectedCallback })
      return
    } else if (isMyDuelist && isConnected && completedStages[duelStage] === false) {
      if (duelStage == DuelStage.Round1Commit) {
        setCommitModalIsOpen(true)
      }
      else if (duelStage == DuelStage.Round1Reveal) {
        // ONLY FOR TUTORIALS
        if (canReveal && !isLoadingReveal && !isLoadingCommit && !isRevealingRef.current && !revealFromServer) {
          isRevealingRef.current = true
          revealMoves()
        }
      }
    }
  }, [isYou, duelistId, isMyDuelist, isConnected, duelStage, completedStages, canReveal, revealFromServer, isLoadingReveal, isLoadingCommit, duelistSelectOpener, handleDuelistSelectedCallback])

  useEffect(() => {
    gameImpl.setIsLoading(isA, isLoadingAutoReveal || isLoadingCommit || isLoadingReveal)
  }, [isLoadingAutoReveal, isLoadingCommit, isLoadingReveal, isA])

  // Auto-reveal when conditions are met
  // ONLY FOR TUTORIALS
  useEffect(() => {
    if (canAutoReveal && canReveal && isYou && !revealFromServer) {
      onClick?.()
    }
  }, [onClick, canAutoReveal, canReveal, isYou, revealFromServer])

  // Update player progress in the game
  useEffect(() => {
    gameImpl.updatePlayerProgress(isA, completedStages, onClick)
  }, [gameImpl, isA, completedStages, onClick])
  
  // Set duelist element in the game
  useEffect(() => {
    if (duelProgressRef.current) {
      gameImpl?.setDuelistElement(isA, duelProgressRef.current)
    }
  }, [gameImpl, duelProgressRef, isA, name]);

  const id = isA ? 'player-bubble-left' : 'player-bubble-right'

  const { canSign, sign_and_restore, hand } = useSignAndRestoreMovesFromHash(duelId, duelistId, round1Moves?.hashed)

  // Sign and restore moves when possible
  useEffect(() =>{
    if (isMyDuelist && canSign) {
      sign_and_restore()
    }
  }, [canSign, isMyDuelist])

  // Reveal cards when hand is available
  useEffect(() =>{
    if (isYou && hand && hand.card_fire && hand.card_dodge && hand.card_tactics && hand.card_blades) {
      setTimeout(() => {
        revealCards({
          fire: hand.card_fire,
          dodge: hand.card_dodge,
          tactics: hand.card_tactics,
          blade: hand.card_blades,
        })
      }, 1000);
    }
  }, [hand, isYou, revealCards])

  return (
    <>
      <CommitPacesModal duelId={duelId} duelistId={duelistId} isOpen={commitModalIsOpen} setIsOpen={setCommitModalIsOpen} />
      <div id={id} className='dialog-container NoMouse NoDrag' ref={duelProgressRef}>
        <Image className='dialog-background' />
        <div className='dialog-data'>
          <div className='dialog-title'></div>
          <div className='dialog-duelist'></div>
          <div className='dialog-content'>
            <div className='moves-button-container'>
              <button className='dialog-button'></button>
              <div className='button-loading-overlay duel'>
                <div className='duel-button-spinner-container'>
                  <div id='dialog-spinner-button' className='dialog-spinner'></div>
                </div>
              </div>
            </div>
            <div className='dialog-quote'></div>
            <div className='duel-dialog-spinner-container'>
              <div id='dialog-spinner' className='dialog-spinner'></div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}