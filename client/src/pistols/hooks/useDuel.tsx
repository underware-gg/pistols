import { useEffect, useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { useDojoComponents } from '@/lib/dojo/DojoContext'
import { useComponentValue } from '@dojoengine/react'
import { useThreeJsContext } from "./ThreeJsContext"
import { useGameplayContext } from "@/pistols/hooks/GameplayContext"
import { useChallenge } from "@/pistols/hooks/useChallenge"
import { keysToEntity } from '@/lib/utils/types'
import { AnimationState } from "@/pistols/three/game"
import { CONST, RoundState } from '@/games/pistols/generated/constants'
import { ActionNames, ActionVerbs } from "@/pistols/utils/pistols"

export enum DuelStage {
  Null = RoundState.Null,
  //
  Round1Commit = RoundState.Commit,
  Round1Reveal = RoundState.Reveal,
  Round1Animation = 'Animation',
  //
  Finished = RoundState.Finished,
}

export const useRound = (duelId: BigNumberish, roundNumber: BigNumberish) => {
  const { Round } = useDojoComponents()
  const round = useComponentValue(Round, keysToEntity([duelId, roundNumber]))
  if (!round) return null
  return {
    ...round,
    state: (round.state as unknown as RoundState),
  }
}

export const useDuel = (duelId: BigNumberish) => {
  const challenge = useChallenge(duelId)
  const round1: any = useRound(duelId, 1n)

  //
  // The actual stage of this duel
  const duelStage = useMemo(() => ((round1?.state as DuelStage) ?? DuelStage.Null), [round1])

  //
  // Actions completed by Duelist A
  const { completedStagesA, completedStagesB } = useMemo(() => {
    return {
      completedStagesA: {
        [DuelStage.Round1Commit]: Boolean(round1?.shot_a.hash),
        [DuelStage.Round1Reveal]: Boolean(round1?.shot_a.card_1),
      },
      completedStagesB: {
        [DuelStage.Round1Commit]: Boolean(round1?.shot_b.hash),
        [DuelStage.Round1Reveal]: Boolean(round1?.shot_b.card_1),
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
      healthA: ((currentStage <= DuelStage.Round1Animation && !animatedHealthA) ? CONST.FULL_HEALTH : round1?.shot_a.health) ?? null,
      healthB: ((currentStage <= DuelStage.Round1Animation && !animatedHealthB) ? CONST.FULL_HEALTH : round1?.shot_b.health) ?? null,
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
      gameImpl.animateDuel(AnimationState.Round1, round1.shot_a.card_1, round1.shot_b.card_1, round1.shot_a.health, round1.shot_b.health, round1.shot_a.damage, round1.shot_b.damage)
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
