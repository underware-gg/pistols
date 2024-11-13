import { useEffect, useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { useDojoComponents } from '@/lib/dojo/DojoContext'
import { useComponentValue } from '@dojoengine/react'
import { useThreeJsContext } from "./ThreeJsContext"
import { useGameplayContext } from "@/pistols/hooks/GameplayContext"
import { useChallenge } from "@/pistols/hooks/useChallenge"
import { keysToEntity } from '@/lib/utils/types'
import { BladesCard, BladesCardNameToValue, CONST, getBladesCardFromValue, getBladesCardValue, getPacesCardFromValue, getRoundStateValue, getTacticsCardFromValue, PacesCard, RoundState, TacticsCard } from '@/games/pistols/generated/constants'
import { AnimationState } from "@/pistols/three/game"
import { Action } from "@/pistols/utils/pistols"
import { feltToString } from '@/lib/utils/starknet'

export enum DuelStage {
  Null,             // 0
  //
  Round1Commit,     // 1
  Round1Reveal,     // 2
  Round1Animation,  // 3
  //
  Finished,         // 4
}

export type Hand = {
  card_fire: PacesCard,
  card_dodge: PacesCard,
  card_tactics: TacticsCard,
  card_blades: BladesCard,
}

export const movesToHand = (moves: number[]): Hand => {
  return {
    card_fire: getPacesCardFromValue(moves[0]),
    card_dodge: getPacesCardFromValue(moves[1]),
    card_tactics: getTacticsCardFromValue(moves[2]),
    card_blades: getBladesCardFromValue(moves[3]),
  }
}

export const useRound = (duelId: BigNumberish) => {
  const { Round } = useDojoComponents()
  const entityId = useMemo(() => keysToEntity([duelId]), [duelId])
  const round = useComponentValue(Round, entityId)
  const state = useMemo(() => (round?.state as unknown as RoundState ?? null), [round])
  const final_blow = useMemo(() => feltToString(round?.final_blow ?? 0n), [round])
  const endedInBlades = useMemo(() => (round ? (getBladesCardValue(final_blow as unknown as BladesCard) > 0) : false), [final_blow])
  
  const hand_a = useMemo(() => round ? movesToHand(
    [round.moves_a.card_1,round.moves_a.card_2, round.moves_a.card_3, round.moves_a.card_4]
  ) : null, [round])
  const hand_b = useMemo(() => round ? movesToHand(
    [round.moves_b.card_1, round.moves_b.card_2, round.moves_b.card_3, round.moves_b.card_4]
  ) : null, [round])

  if (!round) console.log(`!!!!! NULL ROUND:`, duelId, entityId, round, Round)
  if (!round) return null
  return {
    ...round,
    final_blow,
    state,
    hand_a,
    hand_b,
    endedInBlades,
  }
}

export const useDuel = (duelId: BigNumberish) => {
  const challenge = useChallenge(duelId)
  const round1 = useRound(duelId)
  // useEffect(() => { console.log(`+++ round:`, duelId, round1, challenge) }, [round1])

  //
  // The actual stage of this duel
  const duelStage = useMemo(() => (round1 ? getRoundStateValue(round1.state) : DuelStage.Null), [round1])

  //
  // Actions completed by Duelist A
  const { completedStagesA, completedStagesB } = useMemo(() => {
    return {
      completedStagesA: {
        [DuelStage.Round1Commit]: Boolean(round1?.moves_a.hashed),
        [DuelStage.Round1Reveal]: Boolean(round1?.moves_a.card_1),
      },
      completedStagesB: {
        [DuelStage.Round1Commit]: Boolean(round1?.moves_b.hashed),
        [DuelStage.Round1Reveal]: Boolean(round1?.moves_b.card_1),
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
      healthA: ((currentStage <= DuelStage.Round1Animation && !animatedHealthA) ? CONST.FULL_HEALTH : round1?.state_a.health) ?? null,
      healthB: ((currentStage <= DuelStage.Round1Animation && !animatedHealthB) ? CONST.FULL_HEALTH : round1?.state_b.health) ?? null,
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
      const actionA = getPacesCardFromValue(round1.moves_a.card_1) as unknown as Action
      const actionB = getPacesCardFromValue(round1.moves_b.card_1) as unknown as Action
      gameImpl.animateDuel(AnimationState.Round1, actionA, actionB, round1.state_a.health, round1.state_b.health, round1.state_a.damage, round1.state_b.damage)
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
    endedInBlades: round1?.endedInBlades ?? false,
  }
}
