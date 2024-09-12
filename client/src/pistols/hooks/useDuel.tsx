import { useEffect, useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { useDojoComponents } from '@/lib/dojo/DojoContext'
import { useComponentValue } from '@dojoengine/react'
import { useThreeJsContext } from "./ThreeJsContext"
import { useGameplayContext } from "@/pistols/hooks/GameplayContext"
import { useChallenge } from "@/pistols/hooks/useChallenge"
import { keysToEntity } from '@/lib/utils/types'
import { AnimationState } from "@/pistols/three/game"
import { CONST, getPacesCardValue, getRoundStateValue, PacesCard, RoundState } from '@/games/pistols/generated/constants'
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

export const useRound = (duelId: BigNumberish, roundNumber: BigNumberish) => {
  const { Round } = useDojoComponents()
  const entityId = useMemo(() => keysToEntity([duelId, roundNumber]), [duelId, roundNumber])
  const round = useComponentValue(Round, entityId)
  const state = useMemo(() => (round?.state as unknown as RoundState ?? null), [round])
  if (!round) return null
  return {
    ...round,
    state,
  }
}

export const useDuel = (duelId: BigNumberish) => {
  const challenge = useChallenge(duelId)
  const round1 = useRound(duelId, 1n)

  //
  // The actual stage of this duel
  const duelStage = useMemo(() => (round1 ? getRoundStateValue(round1.state) : DuelStage.Null), [round1])

  //
  // Actions completed by Duelist A
  const { completedStagesA, completedStagesB } = useMemo(() => {
    return {
      completedStagesA: {
        [DuelStage.Round1Commit]: Boolean(round1?.shot_a.hash),
        [DuelStage.Round1Reveal]: Boolean(getPacesCardValue(round1?.shot_a.card_fire as unknown as PacesCard)),
      },
      completedStagesB: {
        [DuelStage.Round1Commit]: Boolean(round1?.shot_b.hash),
        [DuelStage.Round1Reveal]: Boolean(getPacesCardValue(round1?.shot_b.card_fire as unknown as PacesCard)),
      },
    }
  }, [round1])

  //
  // Players turns, need action
  const turnA = useMemo(() => (completedStagesA[duelStage] === false), [duelStage, completedStagesA, challenge.isAwaiting])
  const turnB = useMemo(() => (completedStagesB[duelStage] === false || challenge.isAwaiting), [duelStage, completedStagesB, challenge.isAwaiting])

  return {
    challenge,
    roundNumber: challenge.roundNumber,
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
      healthA: ((currentStage <= DuelStage.Round1Animation && !animatedHealthA) ? CONST.FULL_HEALTH : round1?.shot_a.state_final.health) ?? null,
      healthB: ((currentStage <= DuelStage.Round1Animation && !animatedHealthB) ? CONST.FULL_HEALTH : round1?.shot_b.state_final.health) ?? null,
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
    if (enabled && gameImpl && isAnimatingRound1 && audioLoaded) {
      console.log(`TRIGGER animateDuel(1)`)
      const actionA = (round1.shot_a.card_fire as unknown as Action)
      const actionB = (round1.shot_b.card_fire as unknown as Action)
      gameImpl.animateDuel(AnimationState.Round1, actionA, actionB, round1.shot_a.state_final.health, round1.shot_b.state_final.health, round1.shot_a.state_final.damage, round1.shot_b.state_final.damage)
    }
  }, [enabled, gameImpl, isAnimatingRound1, audioLoaded])

  const { canAutoRevealA, canAutoRevealB } = useMemo(() => ({
    canAutoRevealA: (result.turnA && (currentStage == DuelStage.Round1Reveal)),
    canAutoRevealB: (result.turnB && (currentStage == DuelStage.Round1Reveal)),
  }), [result.turnA, result.turnB, currentStage])

  return {
    ...result,
    duelStage: currentStage,
    healthA, healthB,
    canAutoRevealA, canAutoRevealB,
  }
}
