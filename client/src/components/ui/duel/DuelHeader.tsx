import React, { useMemo } from 'react'
import { useGetChallenge } from '/src/stores/challengeStore'
import { useCurrentSeason } from '/src/stores/seasonStore'
import { DuelTutorialLevel } from '/src/data/tutorialConstants'

export default function DuelHeader({
  duelId,
  tutorialLevel
} : {
  duelId: bigint,
  tutorialLevel: DuelTutorialLevel
}) {

  const { seasonName, quote } = useGetChallenge(duelId)
  const { seasonName: currentSeasonName } = useCurrentSeason()
  const seasonDescription = useMemo(() => (seasonName ?? currentSeasonName), [seasonName, currentSeasonName])

  return (
    <>
      <div className='TavernBoard NoMouse NoDrag' style={{ backgroundImage: 'url(/images/ui/duel/wager_main.png)', backgroundSize: '100% 100%' }}>
        <div className='TavernTitle' data-contentlength={1}>Settling the matter of:</div>
        <div className='TavernQuote' data-contentlength={Math.floor(quote.length / 10)}>{`"${quote}"`}</div>
        <div className='TavernTable' data-contentlength={Math.floor(seasonDescription.length / 10)}>{seasonDescription}</div>
      </div>
    </>
  )
}
