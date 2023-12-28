import { useMemo } from "react"
import { Entity, HasValue, Has, getComponentValue, Component } from '@dojoengine/recs'
import { useComponentValue, useEntityQuery } from "@dojoengine/react"
import { useDojoComponents } from '@/dojo/DojoContext'
import { bigintToEntity, bigintToHex, feltToString } from "../utils/utils"
import { ChallengeState } from "@/pistols/utils/pistols"
import { useEntityKeys, useEntityKeysQuery } from '@/pistols/hooks/useEntityKeysQuery'


//-----------------------------
// All Challenges
//

export const useAllChallengeIds = () => {
  const { Challenge } = useDojoComponents()
  const challengeIds: bigint[] = useEntityKeys(Challenge, 'duel_id')
  return {
    challengeIds,
  }
}

export const useChallengeIdsByState = (state: ChallengeState) => {
  const { Challenge } = useDojoComponents()
  const challengeIds: bigint[] = useEntityKeysQuery(Challenge, [HasValue(Challenge, { state: state })], 'duel_id')
  return {
    challengeIds,
  }
}

const _filterComponentsByValue = (component: Component, entityIds: bigint[], keyName: string, values: any[], include: boolean): bigint[] => (
  entityIds.reduce((acc: bigint[], id: bigint) => {
    const componentValue = getComponentValue(component, bigintToEntity(id))
    if (values.includes(componentValue[keyName]) == include) {
      acc.push(id)
    }
    return acc
  }, [] as bigint[])
)

export const useLiveChallengeIds = () => {
  const { Challenge } = useDojoComponents()
  const { challengeIds: allChallengeIds } = useAllChallengeIds()
  const challengeIds = useMemo(() => (
    _filterComponentsByValue(Challenge, allChallengeIds, 'state', [ChallengeState.Awaiting, ChallengeState.InProgress], true)
  ), [allChallengeIds])
  return {
    challengeIds,
  }
}

export const usePastChallengeIds = () => {
  const { Challenge } = useDojoComponents()
  const { challengeIds: allChallengeIds } = useAllChallengeIds()
  const challengeIds = useMemo(() => (
    _filterComponentsByValue(Challenge, allChallengeIds, 'state', [ChallengeState.Awaiting, ChallengeState.InProgress], false)
  ), [allChallengeIds])
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
  // console.log(bigintToHex(duelId), challenge)

  const state = useMemo(() => (challenge?.state ?? null), [challenge])
  const duelistA = useMemo(() => BigInt(challenge?.duelist_a ?? 0), [challenge])
  const duelistB = useMemo(() => BigInt(challenge?.duelist_b ?? 0), [challenge])
  const winner = useMemo(() => BigInt(challenge?.winner ?? 0), [challenge])
  const message = useMemo(() => feltToString(challenge?.message ?? 0n), [challenge])
  const passCode = useMemo(() => feltToString(challenge?.pass_code ?? 0n), [challenge])
  const lords = useMemo(() => (challenge?.lords ?? 0), [challenge])
  const round = useMemo(() => (challenge?.round_number ?? 0), [challenge])
  const timestamp = useMemo(() => (challenge?.timestamp ?? 0), [challenge])
  const timestamp_expire = useMemo(() => (challenge?.timestamp_expire ?? 0), [challenge])
  const timestamp_start = useMemo(() => (challenge?.timestamp_start ?? 0), [challenge])
  const timestamp_end = useMemo(() => (challenge?.timestamp_end ?? 0), [challenge])

  return {
    challengeExists: (challenge != null),
    state,
    isLive: (state == ChallengeState.Awaiting || state == ChallengeState.InProgress),
    duelistA,
    duelistB,
    challenger: duelistA,
    challenged: duelistB,
    message,
    passCode,
    lords,
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

export const useChallengeIdsByDuelist = (address: bigint) => {
  const { Challenge } = useDojoComponents()
  const challengerIds: bigint[] = useEntityKeysQuery(Challenge, [HasValue(Challenge, { duelist_a: BigInt(address) })], 'duel_id')
  const challengedIds: bigint[] = useEntityKeysQuery(Challenge, [HasValue(Challenge, { duelist_b: BigInt(address) })], 'duel_id')
  const challengeIds: bigint[] = useMemo(() => (
    [...challengerIds, ...challengedIds]
  ), [challengerIds, challengedIds])
  // console.log(address, challengeIds)
  return {
    challengeIds,
  }
}

export const useChallengesByDuelist = (address: bigint) => {
  const { Challenge } = useDojoComponents()
  const { challengeIds } = useChallengeIdsByDuelist(address)

  const challenges: any[] = useMemo(() => challengeIds.map((challengeId) => getComponentValue(Challenge, bigintToEntity(challengeId))).sort((a, b) => (a.timestamp - b.timestamp)), [challengeIds])
  // console.log(challenges)
  const stats: any = useMemo(() => {
    let result = {
      challengeCount: challenges.length,
      awaitingCount: challenges.reduce((acc, ch) => {
        if (ch.state == ChallengeState.Awaiting) acc++;
        return acc;
      }, 0),
      inProgressCount: challenges.reduce((acc, ch) => {
        if (ch.state == ChallengeState.InProgress) acc++;
        return acc;
      }, 0),
      drawCount: challenges.reduce((acc, ch) => {
        if (ch.state == ChallengeState.Draw) acc++;
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
    challengeIds,
    challenges,
    ...stats
  }
}

