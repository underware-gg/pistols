import React, { useEffect, useState } from 'react'
import { usePistolsContext } from '/src/hooks/PistolsContext'
import { DuelTutorialLevel } from '/src/data/tutorialConstants'
import Duel from './Duel'

export default function ScDuel() {
  const { currentDuel, tutorialLevel } = usePistolsContext()

  // const [duelists, setDuelists] = useState(null)
  // const [cards, setCards] = useState(null) 
  // const [stepData, setStepData] = useState(null)

  return (
    <>
     <Duel duelId={currentDuel} tutorial={tutorialLevel} />
    </>
  )
}

