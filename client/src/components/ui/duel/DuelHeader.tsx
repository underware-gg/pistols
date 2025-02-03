import React from 'react'
import { useAddChallenge, useChallenge } from '/src/stores/challengeStore'
import { useTable } from '/src/stores/tableStore'
import { DuelTutorialLevel } from '/src/data/tutorialConstants'

export default function DuelHeader({
  duelId,
  tutorialLevel
} : {
  duelId: bigint,
  tutorialLevel: DuelTutorialLevel
}) {

  const { tableId, quote } = tutorialLevel === DuelTutorialLevel.NONE ? useChallenge(duelId) : useAddChallenge(duelId)
  const { description } = useTable(tableId)


  return (
    <>
      <div className='TavernBoard NoMouse NoDrag' style={{ backgroundImage: 'url(/images/ui/duel/wager_main.png)', backgroundSize: '100% 100%' }}>
        <div className='TavernTitle' data-contentlength={1}>Settling the matter of:</div>
        <div className='TavernQuote' data-contentlength={Math.floor(quote.length / 10)}>{`"${quote}"`}</div>
        <div className='TavernTable' data-contentlength={Math.floor(description.length / 10)}>{description}</div>
      </div>
    </>
  )
}
