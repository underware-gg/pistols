import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Image } from 'semantic-ui-react'
import { useAccount } from '@starknet-react/core'
import { bigintToHex } from '@underware/pistols-sdk/utils'
import { useThreeJsContext } from '/src/hooks/ThreeJsContext'
import { useRevealAction, useSignAndRestoreMovesFromHash } from '/src/hooks/useRevealAction'
import { useIsMyDuelist } from '/src/hooks/useIsYou'
import { DuelStage, useDuel } from '/src/hooks/useDuel'
import CommitPacesModal from '/src/components/modals/CommitPacesModal'

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
  const { round1 } = useDuel(duelId)
  const round1Moves = useMemo(() => {
    if (swapSides) {
      return isA ? round1?.moves_b : round1?.moves_a;
    } else {
      return isA ? round1?.moves_a : round1?.moves_b;
    }
  }, [isA, round1, swapSides])

  const duelProgressRef = useRef(null)

  // Duelist interaction
  const { isConnected } = useAccount()
  const isMyDuelist = useIsMyDuelist(duelistId)

  // Commit modal control
  const [didReveal, setDidReveal] = useState(false)
  const [commitModalIsOpen, setCommitModalIsOpen] = useState(false)
  const { reveal, canReveal } = useRevealAction(duelId, isYou ? duelistId : 0n, round1Moves?.hashed, duelStage == DuelStage.Round1Reveal)

  const onClick = useCallback(() => {
    if (isMyDuelist && isConnected && completedStages[duelStage] === false) {
      if (duelStage == DuelStage.Round1Commit) {
        setCommitModalIsOpen(true)
      } else if (duelStage == DuelStage.Round1Reveal) {
        if (canReveal && !didReveal) {
          setDidReveal(true)
          reveal()
        }
      }
    }
  }, [isMyDuelist, isConnected, duelStage, completedStages, canReveal])

  // Auto-reveal when conditions are met
  useEffect(() => {
    if (canAutoReveal && canReveal && isYou) {
      onClick?.()
    }
  }, [onClick, canAutoReveal, canReveal, isYou])

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
            <button className='dialog-button'></button>
            <div className='dialog-quote'></div>
            <div className='dialog-spinner'></div>
          </div>
        </div>
      </div>
    </>
  )
}