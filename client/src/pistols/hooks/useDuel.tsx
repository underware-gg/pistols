import { useEffect, useMemo } from 'react'
import { useComponentValue } from '@dojoengine/react'
import { useDojoComponents } from '@/dojo/DojoContext'
import { useThreeJsContext } from "./ThreeJsContext"
import { useGameplayContext } from "@/pistols/hooks/GameplayContext"
import { useChallenge } from "@/pistols/hooks/useChallenge"
import { keysToEntity } from '@/pistols/utils/utils'
import { BladesNames, BladesVerbs, RoundState } from "@/pistols/utils/pistols"
import { AnimationState } from "@/pistols/three/game"
import constants from '../utils/constants'

export enum DuelStage {
  Null,             // 0
  // Paces
  Round1Commit,     // 1
  Round1Reveal,     // 2
  Round1Animation,  // 3
  // Blades Slot 1
  Round2Commit,     // 4
  Round2Reveal,     // 5
  Round2Animation,  // 6
  // Blades Slot 2
  Round3Animation,  // 7
  //
  Finished,         // 8
}

export const useDuel = (duelId: bigint | string) => {
  const { Round } = useDojoComponents()
  const challenge = useChallenge(duelId)
  const round1: any = useComponentValue(Round, keysToEntity([duelId, 1n]))
  const round2: any = useComponentValue(Round, keysToEntity([duelId, 2n]))
  const round3: any = useComponentValue(Round, keysToEntity([duelId, 3n]))

  //
  // The actual stage of this duel
  const duelStage = useMemo(() => {
    if (!round1 || round1.state == RoundState.Null) return DuelStage.Null
    if (round1.state == RoundState.Commit) return DuelStage.Round1Commit
    if (round1.state == RoundState.Reveal) return DuelStage.Round1Reveal
    if (!round2) return DuelStage.Finished // finished on pistols
    if (round2.state == RoundState.Commit) return DuelStage.Round2Commit
    if (round2.state == RoundState.Reveal) return DuelStage.Round2Reveal
    return DuelStage.Finished
  }, [round1, round2, round3])

  //
  // Actions completed by Duelist A
  const { completedStagesA, completedStagesB } = useMemo(() => {
    return {
      completedStagesA: {
        [DuelStage.Round1Commit]: Boolean(round1?.shot_a.hash),
        [DuelStage.Round1Reveal]: Boolean(round1?.shot_a.action),
        [DuelStage.Round2Commit]: Boolean(round2?.shot_a.hash),
        [DuelStage.Round2Reveal]: Boolean(round2?.shot_a.action),
      },
      completedStagesB: {
        [DuelStage.Round1Commit]: Boolean(round1?.shot_b.hash),
        [DuelStage.Round1Reveal]: Boolean(round1?.shot_b.action),
        [DuelStage.Round2Commit]: Boolean(round2?.shot_b.hash),
        [DuelStage.Round2Reveal]: Boolean(round2?.shot_b.action),
      },
    }
  }, [round1, round2, round3])

  //
  // Players turns, need action
  const turnA = useMemo(() => (completedStagesA[duelStage] === false), [duelStage, completedStagesA, challenge.isAwaiting])
  const turnB = useMemo(() => (completedStagesB[duelStage] === false || challenge.isAwaiting), [duelStage, completedStagesB, challenge.isAwaiting])

  return {
    challenge,
    roundNumber: challenge.roundNumber,
    round1,
    round2,
    round3,
    duelStage,
    completedStagesA,
    completedStagesB,
    turnA,
    turnB,
  }
}


//----------------------------------------------
// extends useDuel(), adding animations Stages
// Use only ONCE inside <Duel>!!
//
export const useAnimatedDuel = (duelId: bigint | string) => {
  const result = useDuel(duelId)
  const { round1, round2, round3, duelStage } = result

  const { gameImpl, audioLoaded } = useThreeJsContext()
  const { animated, dispatchAnimated } = useGameplayContext()

  //-------------------------------------
  // Add intermediate animation DuelStage
  //
  const currentStage = useMemo(() => {
    if (duelStage > DuelStage.Round1Animation && animated < AnimationState.Round1) return DuelStage.Round1Animation
    if (round2 && duelStage > DuelStage.Round2Animation && animated < AnimationState.Round2) return DuelStage.Round2Animation
    if (round3 && duelStage > DuelStage.Round3Animation && animated < AnimationState.Round3) return DuelStage.Round3Animation
    return duelStage
  }, [duelStage, animated])

  const { healthA, healthB } = useMemo(() => {
    return {
      healthA: (
        currentStage <= DuelStage.Round1Animation ? constants.FULL_HEALTH
          : currentStage <= DuelStage.Round2Animation ? round1.shot_a.health
            : currentStage <= DuelStage.Round3Animation ? round2.shot_a.health
              : (round3?.shot_a.health ?? round2?.shot_a.health ?? round1?.shot_a.health)
      ) ?? null,
      healthB: (
        currentStage <= DuelStage.Round1Animation ? constants.FULL_HEALTH
          : currentStage <= DuelStage.Round2Animation ? round1.shot_b.health
            : currentStage <= DuelStage.Round3Animation ? round2.shot_b.health
              : (round3?.shot_b.health ?? round2?.shot_b.health ?? round1?.shot_b.health)
      ) ?? null,
    }
  }, [currentStage, round1, round2, round3])

  //------------------------
  // Trigger next animations
  //
  const isAnimatingRound1 = useMemo(() => (currentStage == DuelStage.Round1Animation), [currentStage])
  const isAnimatingRound2 = useMemo(() => (currentStage == DuelStage.Round2Animation), [currentStage])
  const isAnimatingRound3 = useMemo(() => (currentStage == DuelStage.Round3Animation), [currentStage])
  useEffect(() => {
    if (currentStage == DuelStage.Finished) {
      dispatchAnimated(AnimationState.Finished)
    }
  }, [currentStage])

  useEffect(() => {
    if (gameImpl && isAnimatingRound1 && audioLoaded) {
      console.log(`TRIGGER animateDuel(1)`)
      gameImpl.animateDuel(AnimationState.Round1, round1.shot_a.action, round1.shot_b.action, round1.shot_a.health, round1.shot_b.health)
    }
  }, [gameImpl, isAnimatingRound1, audioLoaded])

  useEffect(() => {
    if (gameImpl && isAnimatingRound2 && audioLoaded) {
      console.log(`TRIGGER animateDuel(2)`)
      gameImpl.animateDuel(AnimationState.Round2, round2.shot_a.action, round2.shot_b.action, round2.shot_a.health, round2.shot_b.health)
    }
  }, [gameImpl, isAnimatingRound2, audioLoaded])

  useEffect(() => {
    if (gameImpl && isAnimatingRound3 && audioLoaded) {
      console.log(`TRIGGER animateDuel(3)`)
      gameImpl.animateDuel(AnimationState.Round3, round3.shot_a.action, round3.shot_b.action, round3.shot_a.health, round3.shot_b.health)
    }
  }, [gameImpl, isAnimatingRound3, audioLoaded])

  const { canAutoRevealA, canAutoRevealB } = useMemo(() => ({
    canAutoRevealA: (result.turnA && (currentStage == DuelStage.Round1Reveal || currentStage == DuelStage.Round2Reveal)),
    canAutoRevealB: (result.turnB && (currentStage == DuelStage.Round1Reveal || currentStage == DuelStage.Round2Reveal)),
  }), [result.turnA, result.turnB, currentStage])

  return {
    ...result,
    duelStage: currentStage,
    healthA, healthB,
    canAutoRevealA, canAutoRevealB,
  }
}



const _healthResult = (health: number, damage: number) => {
  return (health == 0 ? 'is DEAD!' : damage > 0 ? `takes ${damage} DAMAGE!` : 'is SAFE!')
}

export const useDuelResult = (round: any | null, shot: any | null, duelStage: DuelStage, animationStage: DuelStage) => {
  const result = useMemo(() => {
    if (!round || duelStage <= animationStage) {
      return null
    }
    const action = shot.action
    const health = _healthResult(shot.health, shot.damage)
    if (animationStage == DuelStage.Round1Animation) {
      return <span>Walks <span className='Bold'>{action} paces</span><br />and {health}</span>
    }
    return <span>{BladesVerbs[action]} <span className='Bold'>{BladesNames[action] ?? '?'}</span><br />and {health}</span>
  }, [duelStage, animationStage, round, shot])
  return result
}
