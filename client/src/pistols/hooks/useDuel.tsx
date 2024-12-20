import { useEffect, useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { useThreeJsContext } from "./ThreeJsContext"
import { useGameplayContext } from "@/pistols/hooks/GameplayContext"
import { useChallenge, useRound } from '@/pistols/stores/challengeStore'
import { constants } from '@underware_gg/pistols-sdk/pistols'
import { AnimationState } from "@/pistols/three/game"
import { Action } from "@/pistols/utils/pistols"

export enum DuelStage {
  Null,             // 0
  //
  Round1Commit,     // 1
  Round1Reveal,     // 2
  Round1Animation,  // 3
  //
  Finished,         // 4
}

export const useDuel = (duelId: BigNumberish) => {
  const challenge = useChallenge(duelId)
  const round1 = useRound(duelId)
  // useEffect(() => { console.log(`+++ round:`, duelId, round1, challenge) }, [round1])

  //
  // The actual stage of this duel
  const duelStage = useMemo(() => (round1 ? constants.getRoundStateValue(round1.state) : DuelStage.Null), [round1])

  //
  // Actions completed by Duelist A
  const { completedStagesA, completedStagesB } = useMemo(() => {
    return {
      completedStagesA: {
        [DuelStage.Round1Commit]: Boolean(round1?.moves_a?.hashed),
        [DuelStage.Round1Reveal]: Boolean(round1?.moves_a?.card_1),
      },
      completedStagesB: {
        [DuelStage.Round1Commit]: Boolean(round1?.moves_b?.hashed),
        [DuelStage.Round1Reveal]: Boolean(round1?.moves_b?.card_1),
      },
    }
    }, [round1])

  //
  // Players turns, need action
  const turnA = useMemo(() => (completedStagesA[duelStage] === false), [duelStage, completedStagesA, challenge.isAwaiting])
  const turnB = useMemo(() => (completedStagesB[duelStage] === false || challenge.isAwaiting), [duelStage, completedStagesB, challenge.isAwaiting])

  return {
    challenge,
    round1,
    duelStage,
    completedStagesA,
    completedStagesB,
    turnA,
    turnB
  }
}


//----------------------------------------------
// extends useDuel(), adding animations Stages
// Use only ONCE inside <Duel>!!
//
export const useAnimatedDuel = (duelId: BigNumberish, enabled: boolean) => {
  const result = useDuel(duelId)
  const { round1, duelStage } = result

  const { gameImpl, audioLoaded } = useThreeJsContext()
  const { animated, animatedHealthA, animatedHealthB, dispatchAnimated } = useGameplayContext()

  //-------------------------------------
  // Add intermediate animation DuelStage
  //
  const currentStage = useMemo(() => {
    if (duelStage > DuelStage.Round1Animation && animated < AnimationState.Round1) return DuelStage.Round1Animation
    return duelStage
  }, [duelStage, animated])

  const { healthA, healthB } = useMemo(() => {
    return {
      healthA: ((currentStage <= DuelStage.Round1Animation && !animatedHealthA) ? constants.CONST.FULL_HEALTH : round1?.state_a?.health) ?? null,
      healthB: ((currentStage <= DuelStage.Round1Animation && !animatedHealthB) ? constants.CONST.FULL_HEALTH : round1?.state_b?.health) ?? null,
    }
  }, [currentStage, round1, animatedHealthA, animatedHealthB])

  //------------------------
  // Trigger next animations
  //
  const isAnimatingRound1 = useMemo(() => (currentStage == DuelStage.Round1Animation), [currentStage])
  useEffect(() => {
    if (enabled && currentStage == DuelStage.Finished) {
      dispatchAnimated(AnimationState.Finished)
    }
  }, [enabled, currentStage])

  useEffect(() => {
    if (enabled && gameImpl && isAnimatingRound1 && audioLoaded && round1) {
      console.log(`TRIGGER animateDuel(1)`)
      const actionA = constants.getPacesCardFromValue(round1.moves_a.card_1) as unknown as Action
      const actionB = constants.getPacesCardFromValue(round1.moves_b.card_1) as unknown as Action
      gameImpl.animateDuel(AnimationState.Round1, actionA, actionB, round1.state_a.health, round1.state_b.health, round1.state_a.damage, round1.state_b.damage)
    }
  }, [enabled, gameImpl, isAnimatingRound1, audioLoaded, round1])

  const { canAutoRevealA, canAutoRevealB } = useMemo(() => ({
    canAutoRevealA: (result.turnA && (currentStage == DuelStage.Round1Reveal)),
    canAutoRevealB: (result.turnB && (currentStage == DuelStage.Round1Reveal)),
  }), [result.turnA, result.turnB, currentStage])

  return {
    ...result,
    duelStage: currentStage,
    healthA, healthB,
    canAutoRevealA, canAutoRevealB,
    endedInBlades: round1?.endedInBlades ?? false,
  }
}
