import { useMemo } from "react"
import { Entity, HasValue, Has, getComponentValue } from '@dojoengine/recs'
import { useComponentValue, useEntityQuery } from "@dojoengine/react"
import { useDojoComponents } from '@/dojo/DojoContext'
import { bigintToEntity, bigintToHex, feltToString } from "../utils/utils"
import { ChallengeState } from "../utils/pistols"

//-----------------------------
// All Challenges
//

export const useAllChallengeIds = () => {
  const { Challenge } = useDojoComponents()
  const entityIds: Entity[] = useEntityQuery([Has(Challenge)])
  const challengeIds: bigint[] = useMemo(() => (entityIds ?? []).map((entityId) => BigInt(entityId)), [entityIds])
  return {
    challengeIds,
  }
}


//-----------------------------
// Single Challenge
//

export const useChallenge = (duelId: bigint | string) => {
  const { Challenge } = useDojoComponents()
  const challenge: any = useComponentValue(Challenge, bigintToEntity(duelId))
  console.log(bigintToHex(duelId), challenge)

  const state = useMemo(() => (challenge?.state ?? null), [challenge])
  const duelistA = useMemo(() => BigInt(challenge?.duelist_a ?? 0), [challenge])
  const duelistB = useMemo(() => BigInt(challenge?.duelist_b ?? 0), [challenge])
  const winner = useMemo(() => BigInt(challenge?.winner ?? 0), [challenge])
  const message = useMemo(() => feltToString(challenge?.message ?? 0n), [challenge])
  const passCode = useMemo(() => feltToString(challenge?.pass_code ?? 0n), [challenge])
  const round = useMemo(() => (challenge?.round ?? 0), [challenge])
  const timestamp = useMemo(() => (challenge?.timestamp ?? 0), [challenge])
  const timestamp_expire = useMemo(() => (challenge?.timestamp_expire ?? 0), [challenge])
  const timestamp_start = useMemo(() => (challenge?.timestamp_start ?? 0), [challenge])
  const timestamp_end = useMemo(() => (challenge?.timestamp_end ?? 0), [challenge])

  return {
    challengeExists: (challenge != null),
    state,
    duelistA,
    duelistB,
    challenger: duelistA,
    challenged: duelistB,
    message,
    passCode,
    // progress and results
    round,
    winner,
    // times
    timestamp,
    timestamp_expire,
    timestamp_start,
    timestamp_end,
  }
}


//-----------------------------
// Challenges by Duelist
//

export const useChallengesByDuelist = (address: bigint) => {
  const { Challenge } = useDojoComponents()

  const challengerIds: Entity[] = useEntityQuery([HasValue(Challenge, { duelist_a: address })])
  const challengedIds: Entity[] = useEntityQuery([HasValue(Challenge, { duelist_b: address })])

  const challenger: any[] = useMemo(() => (challengerIds ?? []).map((challengeId) => getComponentValue(Challenge, challengeId)), [challengerIds])
  const challenged: any[] = useMemo(() => (challengedIds ?? []).map((challengeId) => getComponentValue(Challenge, challengeId)), [challengedIds])

  const challenges: any[] = useMemo(() => {
    let result = [...challenger, ...challenged]
    result.sort((a, b) => (a.timestamp - b.timestamp))
    return result
  }, [challenger, challenged])

  const stats: any = useMemo(() => {
    let result = {
      challengeCount: challenges.length,
      drawCount: challenges.reduce((acc, ch) => {
        if(ch.state == ChallengeState.Draw) acc++;
        return acc;
      }, 0),
      winCount: challenges.reduce((acc, ch) => {
        if (ch.state == ChallengeState.Resolved && ch.winner == address) acc++;
        return acc;
      }, 0),
      loseCount: challenges.reduce((acc, ch) => {
        if (ch.state == ChallengeState.Resolved && ch.winner != address) acc++;
        return acc;
      }, 0),
    }
    return result
  }, [challenges])

  return {
    challenges,
    ...stats
  }
}


