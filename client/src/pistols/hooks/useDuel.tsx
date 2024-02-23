import { useEffect, useMemo } from 'react'
import { useComponentValue } from '@dojoengine/react'
import { useDojoComponents } from '@/dojo/DojoContext'
import { useThreeJsContext } from "./ThreeJsContext"
import { useGameplayContext } from "@/pistols/hooks/GameplayContext"
import { useChallenge } from "@/pistols/hooks/useChallenge"
import { keysToEntity } from '@/pistols/utils/utils'
import { RoundState } from "@/pistols/utils/pistols"
import { AnimationState } from "@/pistols/three/game"
import constants from '../utils/constants'

export enum DuelStage {
  Null,             // 0
  PacesCommit,      // 1
  PacesReveal,      // 2
  PistolsShootout,  // 3 (animating)
  BladesCommit,     // 4
  BladesReveal,     // 5
  BladesClash,      // 6 (animating)
  Finished,         // 7
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
    if (round1.state == RoundState.Commit) return DuelStage.PacesCommit
    if (round1.state == RoundState.Reveal) return DuelStage.PacesReveal
    // if (animated < AnimationState.Pistols) return DuelStage.PistolsShootout
    if (!round2) return DuelStage.Finished // finished on pistols
    if (round2.state == RoundState.Commit) return DuelStage.BladesCommit
    if (round2.state == RoundState.Reveal) return DuelStage.BladesReveal
    // if (animated < AnimationState.Blades) return DuelStage.BladesClash
    return DuelStage.Finished
  }, [round1, round2])

  //
  // Actions completed by Duelist A
  const { completedStagesA, completedStagesB } = useMemo(() => {
    return {
      completedStagesA: {
        [DuelStage.PacesCommit]: Boolean(round1?.shot_a.hash),
        [DuelStage.PacesReveal]: Boolean(round1?.shot_a.action),
        [DuelStage.BladesCommit]: Boolean(round2?.shot_a.hash),
        [DuelStage.BladesReveal]: Boolean(round2?.shot_a.action),
      },
      completedStagesB: {
        [DuelStage.PacesCommit]: Boolean(round1?.shot_b.hash),
        [DuelStage.PacesReveal]: Boolean(round1?.shot_b.action),
        [DuelStage.BladesCommit]: Boolean(round2?.shot_b.hash),
        [DuelStage.BladesReveal]: Boolean(round2?.shot_b.action),
      },
    }
  }, [round1, round2])

  //
  // Players turns, need action
  const turnA = useMemo(() => (completedStagesA[duelStage] === false), [duelStage, completedStagesA])
  const turnB = useMemo(() => (completedStagesB[duelStage] === false), [duelStage, completedStagesB])

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
    if (duelStage > DuelStage.PistolsShootout && animated < AnimationState.Pistols) return DuelStage.PistolsShootout
    if (round2 && duelStage > DuelStage.BladesClash && animated < AnimationState.Blades) return DuelStage.BladesClash
    return duelStage
  }, [duelStage, animated])

  const { healthA, healthB } = useMemo(() => {
    return {
      healthA: (
        currentStage <= DuelStage.PistolsShootout ? constants.FULL_HEALTH
          : currentStage <= DuelStage.BladesClash ? round1.shot_a.health
            : (round3?.shot_a.health ?? round2?.shot_a.health ?? round1?.shot_a.health)
      ) ?? 0,
      healthB: (
        currentStage <= DuelStage.PistolsShootout ? constants.FULL_HEALTH
          : currentStage <= DuelStage.BladesClash ? round1.shot_b.health
            : (round3?.shot_b.health ?? round2?.shot_b.health ?? round1?.shot_b.health)
      ) ?? 0,
    }
  }, [currentStage])


  //------------------------
  // Trigger next animations
  //
  const isAnimatingPistols = useMemo(() => (currentStage == DuelStage.PistolsShootout), [currentStage])
  const isAnimatingBlades = useMemo(() => (currentStage == DuelStage.BladesClash), [currentStage])
  useEffect(() => {
    if (currentStage == DuelStage.Finished) {
      dispatchAnimated(AnimationState.Finished)
    }
  }, [currentStage])

  useEffect(() => {
    if (gameImpl && isAnimatingPistols && audioLoaded) {
      console.log(`TRIGGER animateShootout()`)
      gameImpl.animateShootout(round1.shot_a.action, round1.shot_b.action, round1.shot_a.health, round1.shot_b.health)
    }
  }, [gameImpl, isAnimatingPistols, audioLoaded])

  useEffect(() => {
    if (gameImpl && isAnimatingBlades && audioLoaded) {
      console.log(`TRIGGER animateBlades()`)
      gameImpl.animateBlades(round2.shot_a.action, round2.shot_b.action, round2.shot_a.health, round2.shot_b.health)
    }
  }, [gameImpl, isAnimatingBlades, audioLoaded])

  const { canAutoRevealA, canAutoRevealB } = useMemo(() => ({
    canAutoRevealA: (result.turnA && (currentStage == DuelStage.PacesReveal || currentStage == DuelStage.BladesReveal)),
    canAutoRevealB: (result.turnB && (currentStage == DuelStage.PacesReveal || currentStage == DuelStage.BladesReveal)),
  }), [result.turnA, result.turnB, currentStage])

  return {
    ...result,
    duelStage: currentStage,
    healthA, healthB,
    canAutoRevealA, canAutoRevealB,
  }
}
