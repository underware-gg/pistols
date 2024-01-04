import { useMemo } from "react"
import { Entity, HasValue, Has, getComponentValue } from '@dojoengine/recs'
import { useComponentValue, useEntityQuery } from "@dojoengine/react"
import { useDojoComponents } from '@/dojo/DojoContext'
import { useChallenge } from "@/pistols/hooks/useChallenge"
import { keysToEntity } from "@/pistols/utils/utils"
import { RoundState } from "@/pistols/utils/pistols"

export enum DuelStage {
  Null,             // 0
  StepsCommit,      // 1
  StepsReveal,      // 2
  PistolsShootout,  // 3
  BladesCommit,     // 4
  BladesReveal,     // 5
  BladesClash,      // 6
  Finished,         // 7
}

export const useDuel = (duelId: bigint | string) => {
  const { Round } = useDojoComponents()
  const challenge = useChallenge(duelId)
  const round1: any = useComponentValue(Round, keysToEntity([duelId, 1n]))
  const round2: any = useComponentValue(Round, keysToEntity([duelId, 2n]))

  const duelStage = useMemo(() => {
    if (!round1 || round1.state == RoundState.Null) return DuelStage.Null
    if (round1.state == RoundState.Commit) return DuelStage.StepsCommit
    if (round1.state == RoundState.Reveal) return DuelStage.StepsReveal
    // if (animated < AnimationState.Pistols) return DuelStage.PistolsShootout
    if (!round2) return DuelStage.Finished // finished on pistols
    if (round2.state == RoundState.Commit) return DuelStage.BladesCommit
    if (round2.state == RoundState.Reveal) return DuelStage.BladesReveal
    // if (animated < AnimationState.Blades) return DuelStage.BladesClash
    return DuelStage.Finished
  }, [round1, round2])

  return {
    challenge,
    roundNumber: challenge.roundNumber,
    round1,
    round2,
    duelStage,
  }
}

