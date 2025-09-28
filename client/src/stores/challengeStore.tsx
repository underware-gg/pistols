import { useMemo } from 'react'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { BigNumberish } from 'starknet'
import { useAccount } from '@starknet-react/core'
import { createDojoStore } from '@dojoengine/sdk/react'
import { useStoreModelsByKeys, useSdkEntitiesGet, useAllStoreModels } from '@underware/pistols-sdk/dojo'
import { PistolsSchemaType, PistolsQueryBuilder, PistolsClauseBuilder, PistolsEntity } from '@underware/pistols-sdk/pistols/sdk'
import { parseCustomEnum, parseEnumVariant } from '@underware/pistols-sdk/starknet'
import { bigintEquals, bigintToAddress, bigintToHex, bigintToHex128, isPositiveBigint } from '@underware/pistols-sdk/utils'
import { useClientTimestamp } from '@underware/pistols-sdk/utils/hooks'
import { movesToHand } from '@underware/pistols-sdk/pistols'
import { constants, models } from '@underware/pistols-sdk/pistols/gen'
import { ChallengeColumn, SortDirection } from '/src/stores/queryParamsStore'
import { useCallToChallenges } from '/src/stores/eventsModelStore'
import { useChallengeFetchStore } from '/src/stores/fetchStore'
import { debug } from '@underware/pistols-sdk/pistols'

export const useChallengeStore = createDojoStore<PistolsSchemaType>();

// keep track of all challenge ids in the store
interface ChallengeIdsState {
  duelIds: bigint[],
  updateEntities: (entities: PistolsEntity[]) => void;
}
const createStore = () => {
  return create<ChallengeIdsState>()(immer((set, get) => ({
    duelIds: [],
    updateEntities: (entities: PistolsEntity[]) => {
      set((state: ChallengeIdsState) => {
        state.duelIds = entities.map(e => BigInt(e.models.pistols.Challenge?.duel_id ?? 0)).filter(Boolean)
      })
    },
  })))
}
export const useChallengeIdsStore = createStore();


//--------------------------------
// consumer hooks
//

export const useAllChallengesIds = () => {
  const duelIds = useChallengeIdsStore((state) => state.duelIds)
  // useEffect(() => console.log(`useAllChallengesIds() =>`, duelIds.length), [duelIds])
  return {
    duelIds,
  }
}

export const useChallenge = (duelId: BigNumberish) => {
  const entities = useChallengeStore((state) => state.entities);
  const challenge = useStoreModelsByKeys<models.Challenge>(entities, 'Challenge', [duelId])
  const challengeMessage = useStoreModelsByKeys<models.ChallengeMessage>(entities, 'ChallengeMessage', [duelId])
  // const fameBalance = useStoreModelsByKeys<models.ChallengeFameBalance>(entities, 'ChallengeFameBalance', [duelId])
  // console.log(`useChallenge(${Number(duelId)}) =>`, 
  //   fameBalance, 
  //   BigInt(fameBalance?.balance_a ?? 0) / ETH_TO_WEI,
  //   BigInt(fameBalance?.balance_b ?? 0) / ETH_TO_WEI,
  //   BigInt(-1),
  //   (BigInt(-1).toString()),
  //   (BigInt(-1).toString(16)),
  // )
  // useEffect(() => console.log(`useChallenge(${Number(duelId)}) => [${Object.keys(entities).length}]`, challenge), [challenge])

  const seasonId = useMemo(() => Number(challenge?.season_id ?? 0n), [challenge])
  const seasonName = useMemo(() => (seasonId ? `Season ${seasonId}` : undefined), [seasonId])
  const duelType = useMemo(() => (parseEnumVariant<constants.DuelType>(challenge?.duel_type) ?? constants.DuelType.Undefined), [challenge])
  const isTutorial = useMemo(() => (duelType === constants.DuelType.Tutorial), [duelType])
  const tutorialLevel = useMemo(() => (isTutorial ? Number(BigInt(duelId) & 0xffn) : null), [isTutorial, duelId])

  const duelistAddressA = useMemo(() => BigInt(challenge?.address_a ?? 0), [challenge])
  const duelistAddressB = useMemo(() => BigInt(challenge?.address_b ?? 0), [challenge])
  const duelistIdA = useMemo(() => BigInt(challenge?.duelist_id_a ?? 0), [challenge])
  const duelistIdB = useMemo(() => BigInt(challenge?.duelist_id_b ?? 0), [challenge])
  const winner = useMemo(() => Number(challenge?.winner ?? 0), [challenge])
  const winnerAddress = useMemo(() => (winner == 1 ? duelistAddressA : winner == 2 ? duelistAddressB : 0n), [winner, duelistAddressA, duelistAddressB])
  const winnerDuelistId = useMemo(() => (winner == 1 ? duelistIdA : winner == 2 ? duelistIdB : 0n), [winner, duelistIdA, duelistIdB])
  const premise = useMemo(() => (parseEnumVariant<constants.Premise>(challenge?.premise) ?? constants.Premise.Undefined), [challenge])
  const message = useMemo(() => (challengeMessage?.message ?? ''), [challengeMessage])
  const livesStaked = useMemo(() => Number(challenge?.lives_staked ?? 0), [challenge])
  const timestampStart = useMemo(() => Number(challenge?.timestamps.start ?? 0), [challenge])
  const timestampEnd = useMemo(() => Number(challenge?.timestamps.end ?? 0), [challenge])

  const { clientSeconds } = useClientTimestamp()
  let state = useMemo(() => parseEnumVariant<constants.ChallengeState>(challenge?.state), [challenge])
  let needToSyncExpired = useMemo(() => (
    state == constants.ChallengeState.Awaiting && timestampEnd > 0 && (timestampEnd < clientSeconds)
  ), [state, clientSeconds, timestampEnd])

  return {
    challengeExists: (challenge != null),
    duelId,
    duelType,
    seasonId,
    seasonName,
    isTutorial,
    tutorialLevel,
    state,
    duelistAddressA,
    duelistAddressB,
    duelistIdA,
    duelistIdB,
    premise,
    message,
    livesStaked,
    // progress and results
    winner,
    winnerAddress,
    winnerDuelistId,
    isLive: (state == constants.ChallengeState.Awaiting || state == constants.ChallengeState.InProgress),
    isAwaiting: (state == constants.ChallengeState.Awaiting),
    isInProgress: (state == constants.ChallengeState.InProgress),
    isFinished: (state == constants.ChallengeState.Resolved || state == constants.ChallengeState.Draw),
    isResolved: (state == constants.ChallengeState.Resolved),
    isDraw: (state == constants.ChallengeState.Draw),
    isCanceled: (state == constants.ChallengeState.Withdrawn || state == constants.ChallengeState.Refused),
    isExpired: (state == constants.ChallengeState.Expired),
    needToSyncExpired,
    // times
    timestampStart,
    timestampEnd,
  }
}

export const useRound = (duelId: BigNumberish) => {
  const entities = useChallengeStore((state) => state.entities);
  const round = useStoreModelsByKeys<models.Round>(entities, 'Round', [duelId])

  const state = useMemo(() => (parseEnumVariant<constants.RoundState>(round?.state) ?? null), [round])

  const {
    variant: finalBlowType,
    value: finalBlowValue,    // pace or blades card
  } = useMemo(() => parseCustomEnum<constants.FinalBlow, number>(round?.final_blow), [round])
  const endedInBlades = useMemo(() => (finalBlowType === constants.FinalBlow.Blades), [finalBlowType])
  const endedInPaces = useMemo(() => (finalBlowType === constants.FinalBlow.Paces), [finalBlowType])
  const endedInAbandon = useMemo(() => (finalBlowType === constants.FinalBlow.Forsaken), [finalBlowType])
  const unpairedWin = useMemo(() => (finalBlowType === constants.FinalBlow.Unpaired), [finalBlowType])

  const hand_a = useMemo(() => round ? movesToHand(
    //@ts-ignore
    [round.moves_a.card_1, round.moves_a.card_2, round.moves_a.card_3, round.moves_a.card_4]
  ) : null, [round])
  const hand_b = useMemo(() => round ? movesToHand(
    //@ts-ignore
    [round.moves_b.card_1, round.moves_b.card_2, round.moves_b.card_3, round.moves_b.card_4]
  ) : null, [round])

  const _moves = (moves: models.Moves) => {
    return moves ? {
      card_1: Number(moves.card_1),
      card_2: Number(moves.card_2),
      card_3: Number(moves.card_3),
      card_4: Number(moves.card_4),
      salt: BigInt(moves.salt),
      hashed: BigInt(moves.hashed),
      timeout: Number(moves.timeout),
    } : null
  }
  const _state = (state: models.DuelistState) => {
    return state ? {
      chances: Number(state.chances),
      damage: Number(state.damage),
      health: Number(state.health),
      dice_fire: Number(state.dice_fire),
      honour: Number(state.honour),
    } : null
  }

  const moves_a = useMemo(() => _moves(round?.moves_a), [round])
  const moves_b = useMemo(() => _moves(round?.moves_b), [round])
  const state_a = useMemo(() => _state(round?.state_a), [round])
  const state_b = useMemo(() => _state(round?.state_b), [round])

  return {
    state,
    hand_a,
    hand_b,
    moves_a,
    moves_b,
    state_a,
    state_b,
    // final blow
    finalBlow: finalBlowType,
    finalBlowValue,
    endedInBlades,
    endedInPaces,
    endedInAbandon,
    unpairedWin,
  }
}

export const useRoundTimeout = (duelId: BigNumberish, autoUpdate = false) => {
  const entities = useChallengeStore((state) => state.entities);
  const round = useStoreModelsByKeys<models.Round>(entities, 'Round', [duelId])

  const { clientSeconds } = useClientTimestamp({ autoUpdate })
  const timeoutTimestamp = useMemo(() => (
    Math.max(Number(round?.moves_a.timeout ?? 0), Number(round?.moves_b.timeout ?? 0))
  ), [round])
  const hasTimedOut = useMemo(() => (
    timeoutTimestamp > 0 && clientSeconds > timeoutTimestamp
  ), [clientSeconds, timeoutTimestamp])

  return {
    timeoutTimestamp,
    hasTimedOut,
  }
}



/**
 * Returns all active duels for the current user's address, including both required duels
 * and duels that have notifications
 * @param notificationDuelIds Array of duel IDs from notifications to track
 * @returns Array of duel IDs with their states
 */
export function useMyActiveDuels(notificationDuelIds: bigint[] = []) {
  const { address } = useAccount()
  const { requiredDuelIds } = useCallToChallenges()

  const entities = useChallengeStore((state) => state.entities)
  const challenges = useAllStoreModels<models.Challenge>(entities, 'Challenge')

  const result = useMemo(() => {
    if (!address) return []

    // Get all duel IDs we need to track (both required and from notifications)
    const allRelevantDuelIds = new Set([...requiredDuelIds, ...notificationDuelIds])

    return challenges
      .filter(ch => allRelevantDuelIds.has(BigInt(ch.duel_id)) && (ch.address_a === address || ch.address_b === address))
      .map(ch => ({
        duel_id: BigInt(ch.duel_id),
        timestamp: Number(ch.timestamps.start),
        state: parseEnumVariant<constants.ChallengeState>(ch.state),
        callToAction: requiredDuelIds.includes(BigInt(ch.duel_id))
      })
      )
  }, [challenges, address, requiredDuelIds, notificationDuelIds])

  return result
}

export function useMyChallenges() {
  const { address } = useAccount()
  const entities = useChallengeStore((state) => state.entities)
  const challenges = useAllStoreModels<models.Challenge>(entities, 'Challenge')
  const myChallenges = useMemo(() => (
    !address ? [] : challenges.filter(ch => (bigintEquals(ch.address_a, address) || bigintEquals(ch.address_b, address)))
  ), [challenges, address])
  const duelIds = useMemo(() => (myChallenges).map(ch => BigInt(ch.duel_id)), [myChallenges])
  return {
    myChallenges,
    duelIds,
  }
}





//------------------------------------------
// Fetch new challenge and add to the store
// (if not already in the store)
//

export const useGetChallenge = (duel_id: BigNumberish) => {
  // fetch if not already in the store
  useFetchChallenge(duel_id, 500)
  // return challenge from the store
  const result = useChallenge(duel_id)
  return result
}




//------------------------------------------------
// Fetch multiple challenges per player or duelist
// after fetching once, it won't fetch again the same duelists/players
// new and fetched challenges will be updated automatically with the entity subscription
//

//
// Fetch NEW Challenges by duelist ID
//
export const useFetchChallenge = (duelId: BigNumberish, retryInterval?: number) => {
  const duelIds = useMemo(() => [duelId], [duelId])
  return useFetchChallengeIds(duelIds, retryInterval)
}

export const useFetchChallengeIds = (duelIds: BigNumberish[], retryInterval?: number) => {
  const setEntities = useChallengeStore((state) => state.setEntities);

  // use only duels not in the store
  const existingDuelIds = useChallengeIdsStore((state) => state.duelIds)  
  const newDuelIds = useMemo(() => (
    duelIds
      .filter(isPositiveBigint)
      .map(BigInt)
      .filter((id) => !existingDuelIds.includes(id))
  ), [duelIds, existingDuelIds])

  const query = useMemo<PistolsQueryBuilder>(() => (
    newDuelIds.length > 0
      ? new PistolsQueryBuilder()
        .withClause(
          new PistolsClauseBuilder().where("pistols-Challenge", "duel_id", "In", newDuelIds.map(bigintToAddress)).build()
        )
        .withEntityModels([
          "pistols-Challenge",
          "pistols-ChallengeMessage",
          'pistols-Round',
        ])
        .withLimit(newDuelIds.length)
        .includeHashedKeys()
      : null
  ), [newDuelIds])

  useSdkEntitiesGet({
    query,
    retryInterval,
    setEntities: (entities: PistolsEntity[]) => {
      debug.log(`useFetchChallengeIds() GOT`, newDuelIds, entities);
      setEntities(entities);
    },
  })

  // useEffect(() => {
  //   console.log(`::useFetchChallengeIds...`, newDuelIds, query)
  // }, [newDuelIds, query])

  // const entities = useChallengeStore((state) => state.entities);
  // useEffect(() => {
  //   console.log(`::useFetchChallengeIds... entities:`, entities)
  // }, [entities])

  return {}
}



//------------------------------------------------
// Fetch multiple challenges per player or duelist
// after fetching once, it won't fetch again the same duelists/players
// new and fetched challenges will be updated automatically with the entity subscription
//

//
// Fetch NEW Challenges by duelist ID
//
export const useFetchChallengeIdsByDuelist = (duelistId: BigNumberish) => {
  const duelistIds = useMemo(() => [duelistId], [duelistId])
  return useFetchChallengeIdsByDuelistIds(duelistIds)
}

export const useFetchChallengeIdsByDuelistIds = (duelistIds: BigNumberish[]) => {
  const setEntities = useChallengeStore((state) => state.setEntities);
  const fetchState = useChallengeFetchStore((state) => state);

  const newDuelistIds = useMemo(() => (
    fetchState.getNewIds(duelistIds)
  ), [duelistIds, fetchState.ids])

  const query = useMemo<PistolsQueryBuilder>(() => (
    newDuelistIds.length > 0
      ? new PistolsQueryBuilder()
        .withClause(
          new PistolsClauseBuilder().compose().or([
            new PistolsClauseBuilder().where("pistols-Challenge", "duelist_id_a", "In", newDuelistIds.map(bigintToHex128)),
            new PistolsClauseBuilder().where("pistols-Challenge", "duelist_id_b", "In", newDuelistIds.map(bigintToHex128)),
          ]).build()
        )
        .withEntityModels([
          "pistols-Challenge",
          "pistols-ChallengeMessage",
          'pistols-Round',
        ])
        .withLimit(1000)
        .includeHashedKeys()
      : null
  ), [newDuelistIds])

  useSdkEntitiesGet({
    query,
    // enabled: !result.challengeExists,
    setEntities: (entities: PistolsEntity[]) => {
      debug.log(`useFetchChallengeIdsByDuelist() GOT`, newDuelistIds, entities);
      fetchState.setFetchedIds(newDuelistIds.map(BigInt));
      setEntities(entities);
    },
  })

  // useEffect(() => {
  //   console.log(`::useFetchChallengeIdsByDuelist...`, newDuelistIds, query)
  // }, [newDuelistIds, query])

  // const entities = useChallengeStore((state) => state.entities);
  // useEffect(() => {
  //   console.log(`::useFetchChallengeIdsByDuelist... entities:`, entities)
  // }, [entities])

  return {}
}

//
// Fetch NEW Challenges by player address
//
export const useFetchChallengeIdsOwnedByAccount = (address: BigNumberish) => {
  const addresses = useMemo(() => [address], [address])
  return useFetchChallengeIdsOwnedByAccounts(addresses)
}

export const useFetchChallengeIdsOwnedByAccounts = (addresses: BigNumberish[]) => {
  const setEntities = useChallengeStore((state) => state.setEntities);
  const fetchState = useChallengeFetchStore((state) => state);

  const newAddresses = useMemo(() => (
    fetchState.getNewAddresses(addresses)
  ), [addresses, fetchState.addresses])

  const query = useMemo<PistolsQueryBuilder>(() => (
    newAddresses.length > 0
      ? new PistolsQueryBuilder()
        .withClause(
          new PistolsClauseBuilder().compose().or([
            new PistolsClauseBuilder().where("pistols-Challenge", "address_a", "In", newAddresses.map(bigintToAddress)),
            new PistolsClauseBuilder().where("pistols-Challenge", "address_b", "In", newAddresses.map(bigintToAddress)),
          ]).build()
        )
        .withEntityModels([
          "pistols-Challenge",
          "pistols-ChallengeMessage",
          'pistols-Round',
        ])
        .withLimit(1000)
        .includeHashedKeys()
      : null
  ), [newAddresses])

  const { isLoading, isFinished } = useSdkEntitiesGet({
    query,
    // enabled: !result.challengeExists,
    setEntities: (entities: PistolsEntity[]) => {
      debug.log(`useFetchChallengeIdsOwnedByAccounts() GOT`, newAddresses.map(bigintToHex), entities);
      fetchState.setFetchedAddresses(newAddresses.map(BigInt));
      setEntities(entities);
    },
  })

  // useEffect(() => {
  //   console.log(`::useFetchChallengeIdsOwnedByAccounts...`, newAddresses, query)
  // }, [newAddresses, query])

  return {
    isLoading,
    isFinished,
  }
}







//--------------------------------
// Queries on cached challenges
// (need to be fetched first)
//

const _getChallengeStateSet = (challenges: models.Challenge[]): constants.ChallengeState[] => (
  [...new Set(challenges.map((ch) => (parseEnumVariant<constants.ChallengeState>(ch.state))))]
);
const _filterChallengesByState = (challenges: models.Challenge[], states: constants.ChallengeState[]): models.Challenge[] => (
  challenges.filter((ch) => (
    states.includes(parseEnumVariant<constants.ChallengeState>(ch.state))
  ))
);
const _sortChallenges = (challenges: models.Challenge[], sortColumn: ChallengeColumn, sortDirection: SortDirection): models.Challenge[] => (
  (sortColumn === ChallengeColumn.Time) ?
    challenges.sort((a, b) => {
      const timestamp_a = Math.max(Number(a.timestamps.start), Number(a.timestamps.end))
      const timestamp_b = Math.max(Number(b.timestamps.start), Number(b.timestamps.end))
      return (sortDirection === SortDirection.Ascending ? timestamp_a - timestamp_b : timestamp_b - timestamp_a);
    }) : (sortColumn === ChallengeColumn.Status) ?
      challenges.sort((a, b) => {
        const state_a = constants.getChallengeStateValue(parseEnumVariant<constants.ChallengeState>(a.state))
        const state_b = constants.getChallengeStateValue(parseEnumVariant<constants.ChallengeState>(b.state))
        return (sortDirection === SortDirection.Ascending ? state_a - state_b : state_b - state_a);
      }) : challenges
);

export const useQueryChallengesOwnedByAccount = (
  address: BigNumberish,
  filterStates?: constants.ChallengeState[],
) => {
  const entities = useChallengeStore((state) => state.entities);
  const challenges = useAllStoreModels<models.Challenge>(entities, 'Challenge')

  const { result, challengeIds } = useMemo(() => {
    let _address = BigInt(address ?? 0)
    let result = _address > 0n ? challenges.filter((ch) => (
      bigintEquals(ch.address_a, _address) ||
      bigintEquals(ch.address_b, _address)
    )) : []

    // filter by states, with special handling for required action duels
    if (filterStates) {
      result = _filterChallengesByState(result, filterStates)
    }

    // sort...
    result = _sortChallenges(result, ChallengeColumn.Time, SortDirection.Descending)

    // return ids only
    const challengeIds = result.map((ch) => BigInt(ch.duel_id))

    return {
      result,
      challengeIds,
    }
  }, [challenges, filterStates, address])

  return {
    challenges: result,
    challengeIds,
  }
}

export const useQueryChallengeIdsByDuelist = (
  duelistId: BigNumberish,
  filterStates: constants.ChallengeState[],
  sortColumn: ChallengeColumn,
  sortDirection: SortDirection,
) => {
  const entities = useChallengeStore((state) => state.entities);
  const challenges = useAllStoreModels<models.Challenge>(entities, 'Challenge')

  const { challengeIds, states, challengesPerSeason } = useMemo(() => {
    let _duelistId = BigInt(duelistId ?? 0)
    let result = _duelistId > 0n ? challenges.filter((ch) => (
      bigintEquals(ch.duelist_id_a, _duelistId) ||
      bigintEquals(ch.duelist_id_b, _duelistId)
    )) : []

    // get all current states for fitlering
    const states = _getChallengeStateSet(result)

    // filter by states, with special handling for required action duels
    result = _filterChallengesByState(result, filterStates)

    // sort...
    result = _sortChallenges(result, sortColumn, sortDirection)

    // return ids only
    const challengeIds = result.map((ch) => BigInt(ch.duel_id))

    //get results per season...
    const challengesPerSeason = result.reduce((acc, ch) => {
      acc[Number(ch.season_id)] = acc[Number(ch.season_id)] || []
      acc[Number(ch.season_id)].push(BigInt(ch.duel_id))
      return acc
    }, {})

    // Combine season 0 with max season
    const maxSeasonId = Math.max(...Object.keys(challengesPerSeason).map(Number))
    if (challengesPerSeason[0] && maxSeasonId > 0) {
      challengesPerSeason[maxSeasonId] = [ ...challengesPerSeason[0], ...(challengesPerSeason[maxSeasonId] || [])]
      delete challengesPerSeason[0]
    }

    return {
      challengeIds,
      states,
      challengesPerSeason,
    }
  }, [challenges, filterStates, duelistId, sortColumn, sortDirection])

  return {
    challengeIds,
    states,
    challengesPerSeason,
  }
}

// export const useQueryChallengeIds = (
//   filterStates: constants.ChallengeState[],
//   filterName: string,
//   filterBookmarked: boolean,
//   playerAddressOrDuelistId: BigNumberish,
//   sortColumn: ChallengeColumn,
//   sortDirection: SortDirection,
// ) => {
//   const { address } = useAccount()
//   const { bookmarkedDuels } = usePlayer(address)
//   const { requiredDuelIds } = useCallToChallenges()

//   const entities = useChallengeStore((state) => state.entities);
//   const challenges = useAllStoreModels<models.Challenge>(entities, 'Challenge')

//   // useEffect(() => console.log(`::useQueryChallengeIds... entities:`, entities), [entities])
//   // useEffect(() => console.log(`::useQueryChallengeIds... challenges:`, challenges), [challenges])

//   const targetId = useMemo(() => BigInt(playerAddressOrDuelistId ?? 0), [playerAddressOrDuelistId])

//   const { result, challengeIds, states } = useMemo(() => {
//     let result = [...challenges]

//     // filter challenges by duelist or player address
//     if (targetId > 0n) {
//       result = result.filter((ch) => (
//         bigintEquals(ch.duelist_id_a, targetId) ||
//         bigintEquals(ch.duelist_id_b, targetId) ||
//         bigintEquals(ch.address_a, targetId) ||
//         bigintEquals(ch.address_b, targetId)
//       ))
//     }

//     // filter by bookmarked duels
//     if (filterBookmarked) {
//       result = result.filter((ch) => (bookmarkedDuels.find(p => bigintEquals(p, ch.duel_id)) !== undefined))
//     }

//     // filter by name
//     if (filterName) {
//       const filterNameLower = filterName.toLowerCase();
//       result = result.filter((ch) => (
//         getPlayernameFromAddress(ch.address_a)?.toLowerCase().includes(filterNameLower) ||
//         getPlayernameFromAddress(ch.address_b)?.toLowerCase().includes(filterNameLower)
//       ))
//     }

//     // get all current states for fitlering
//     const states = _getChallengeStateSet(result)

//     // filter by states, with special handling for required action duels
//     result = _filterChallengesByState(result, filterStates)

//     // sort...
//     result = _sortChallenges(result, sortColumn, sortDirection)

//     // return ids only
//     const challengeIds = result.map((ch) => BigInt(ch.duel_id))

//     return {
//       result,
//       challengeIds,
//       states,
//     }
//   }, [challenges, filterStates, filterName, filterBookmarked, targetId, sortColumn, sortDirection, bookmarkedDuels, requiredDuelIds])

//   return {
//     challenges: result,
//     challengeIds,
//     states,
//   }
// }
