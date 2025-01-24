import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Image } from 'semantic-ui-react'
import { useAccount } from '@starknet-react/core'
import { bigintToHex } from '@underware_gg/pistols-sdk/utils'
import { useThreeJsContext } from '/src/hooks/ThreeJsContext'
import { useRevealAction, useSignAndRestoreMovesFromHash } from '/src/hooks/useRevealAction'
import { useIsMyDuelist } from '/src/hooks/useIsYou'
import { DuelStage, useDuel } from '/src/hooks/useDuel'
import CommitPacesModal from '/src/components/modals/CommitPacesModal'


export default function DuelProgress({
  isA = false,
  isB = false,
  name,
  duelId,
  duelStage,
  duelistId,
  completedStages,
  revealCards,
  canAutoReveal = false
}) {
  const { gameImpl } = useThreeJsContext()
  const { round1, challenge: { tableId } } = useDuel(duelId)
  const round1Moves = useMemo(() => (isA ? round1?.moves_a : round1?.moves_b), [isA, round1])

  const duelProgressRef = useRef(null)


  //------------------------------
  // Duelist interaction
  //
  const { isConnected } = useAccount()
  const isMyDuelist = useIsMyDuelist(duelistId)

  // Commit modal control
  const [didReveal, setDidReveal] = useState(false)
  const [commitModalIsOpen, setCommitModalIsOpen] = useState(false)
  const { reveal, canReveal } = useRevealAction(duelId, tableId, round1Moves?.hashed, duelStage == DuelStage.Round1Reveal)

  const onClick = useCallback(() => {
    if (!isConnected) console.warn(`onClickReveal: not connected!`)
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

  // auto-reveal
  useEffect(() => {
    if (canAutoReveal && canReveal) {
      onClick?.()
    }
  }, [onClick, canAutoReveal, canReveal])


  //-------------------------
  // Duel progression
  //
  useEffect(() => {
    gameImpl.updatePlayerProgress(isA, completedStages, onClick)
  }, [gameImpl, isA, completedStages, onClick])
  
  useEffect(() => {
    if (duelProgressRef.current) {
      gameImpl?.setDuelistElement(isA, duelProgressRef.current)
    }
  }, [gameImpl, duelProgressRef, isA, name]);

  const id = isA ? 'player-bubble-left' : 'player-bubble-right'

  const { canSign, sign_and_restore, hand } = useSignAndRestoreMovesFromHash(duelId, tableId, round1Moves?.hashed)

  useEffect(() =>{
    if (isMyDuelist && canSign) {
      sign_and_restore()
    }
  }, [canSign, isMyDuelist])

  useEffect(() =>{
    if (isMyDuelist && hand && hand.card_fire && hand.card_dodge && hand.card_tactics && hand.card_blades) {
      setTimeout(() => {
        revealCards({
          fire: hand.card_fire,
          dodge: hand.card_dodge,
          tactics: hand.card_tactics,
          blade: hand.card_blades,
        })
      }, 1000);
    }
  }, [hand, isMyDuelist])

  //------------------------------
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