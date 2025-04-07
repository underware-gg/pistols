import { useEffect, useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { createDojoStore } from '@dojoengine/sdk/react'
import { useEntityId, useClientTimestamp } from '@underware/pistols-sdk/utils/hooks'
import { formatQueryValue, useEntityModel, useSdkEntitiesGet } from '@underware/pistols-sdk/dojo'
import { feltToString, parseCustomEnum, parseEnumVariant } from '@underware/pistols-sdk/utils/starknet'
import { bigintEquals, isPositiveBigint } from '@underware/pistols-sdk/utils'
import { PistolsSchemaType, PistolsQueryBuilder, PistolsClauseBuilder, PistolsEntity, movesToHand } from '@underware/pistols-sdk/pistols'
import { constants, models } from '@underware/pistols-sdk/pistols/gen'

export const useChallengeStore = createDojoStore<PistolsSchemaType>();

export const useAllChallengesEntityIds = () => {
  const entities = useChallengeStore((state) => state.entities)
  const entityIds = useMemo(() => Object.keys(entities), [entities])
  return {
    entityIds,
  }
}

export const useAllChallengesIds = () => {
  const entities = useChallengeStore((state) => state.entities)
  const duelIds = useMemo(() => Object.values(entities).map(e => BigInt(e.models.pistols.Challenge.duel_id)), [entities])
  // useEffect(() => console.log(`useAllChallengesIds() =>`, duelIds.length), [duelIds])
  return {
    duelIds,
  }
}

export const useChallenge = (duelId: BigNumberish) => {
  const entityId = useEntityId([duelId])
  const entities = useChallengeStore((state) => state.entities);
  const entity = useMemo(() => entities[entityId], [entities[entityId]])

  const challenge = useEntityModel<models.Challenge>(entity, 'Challenge')
  // const fameBalance = useEntityModel<models.ChallengeFameBalance>(entity, 'ChallengeFameBalance')
  // console.log(`useChallenge(${Number(duelId)}) =>`, 
  //   fameBalance, 
  //   BigInt(fameBalance?.balance_a ?? 0) / ETH_TO_WEI,
  //   BigInt(fameBalance?.balance_b ?? 0) / ETH_TO_WEI,
  //   BigInt(-1),
  //   (BigInt(-1).toString()),
  //   (BigInt(-1).toString(16)),
  // )
  // useEffect(() => console.log(`useChallenge(${Number(duelId)}) => [${Object.keys(entities).length}]`, challenge), [challenge])

  const tableId = useMemo(() => feltToString(challenge?.table_id ?? 0n), [challenge])
  const isTutorial = useMemo(() => (tableId === constants.TABLES.TUTORIAL), [tableId])
  const tutorialLevel = useMemo(() => (isTutorial ? Number(BigInt(duelId) & 0xffn) : null), [isTutorial, duelId])

  const duelistAddressA = useMemo(() => BigInt(challenge?.address_a ?? 0), [challenge])
  const duelistAddressB = useMemo(() => BigInt(challenge?.address_b ?? 0), [challenge])
  const duelistIdA = useMemo(() => BigInt(challenge?.duelist_id_a ?? 0), [challenge])
  const duelistIdB = useMemo(() => BigInt(challenge?.duelist_id_b ?? 0), [challenge])
  const winner = useMemo(() => Number(challenge?.winner ?? 0), [challenge])
  const winnerAddress = useMemo(() => (winner == 1 ? duelistAddressA : winner == 2 ? duelistAddressB : 0n), [winner, duelistAddressA, duelistAddressB])
  const winnerDuelistId = useMemo(() => (winner == 1 ? duelistIdA : winner == 2 ? duelistIdB : 0n), [winner, duelistIdA, duelistIdB])
  const premise = useMemo(() => (parseEnumVariant<constants.Premise>(challenge?.premise) ?? constants.Premise.Undefined), [challenge])
  const quote = useMemo(() => feltToString(challenge?.quote ?? 0n), [challenge])
  const livesStaked = useMemo(() => Number(challenge?.lives_staked ?? 0), [challenge])
  const timestampStart = useMemo(() => Number(challenge?.timestamps.start ?? 0), [challenge])
  const timestampEnd = useMemo(() => Number(challenge?.timestamps.end ?? 0), [challenge])

  const { clientSeconds } = useClientTimestamp(false)
  let _state = useMemo(() => parseEnumVariant<constants.ChallengeState>(challenge?.state), [challenge])
  let state = useMemo(() => {
    if (_state == constants.ChallengeState.Awaiting && (timestampEnd < clientSeconds)) {
      return constants.ChallengeState.Expired
    }
    return _state
  }, [_state])

  return {
    challengeExists: (challenge != null),
    duelId,
    tableId,
    isTutorial,
    tutorialLevel,
    state,
    duelistAddressA,
    duelistAddressB,
    duelistIdA,
    duelistIdB,
    premise,
    quote,
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
    needToSyncExpired: (state == constants.ChallengeState.Expired && state != _state),
    // times
    timestampStart,
    timestampEnd,
  }
}

export const useRound = (duelId: BigNumberish) => {
  const entityId = useEntityId([duelId])
  const entities = useChallengeStore((state) => state.entities);
  const entity = useMemo(() => entities[entityId], [entities[entityId]])

  const round = useEntityModel<models.Round>(entity, 'Round')

  const state = useMemo(() => (parseEnumVariant<constants.RoundState>(round?.state) ?? null), [round])

  const {
    variant: finalBlowType,
    value: finalBlow
  } = useMemo(() => parseCustomEnum<constants.FinalBlow>(round?.final_blow), [round])
  const endedInBlades = useMemo(() => (finalBlowType === constants.FinalBlow.Blades), [finalBlowType])
  const endedInTimeout = useMemo(() => (finalBlowType === constants.FinalBlow.Forsaken), [finalBlowType])

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
    finalBlow,
    endedInBlades,
    endedInTimeout,
    hand_a,
    hand_b,
    moves_a,
    moves_b,
    state_a,
    state_b,
  }
}

export const useRoundTimeout = (duelId: BigNumberish, autoUpdate = false) => {
  const { clientSeconds } = useClientTimestamp(autoUpdate)

  const entityId = useEntityId([duelId])
  const entities = useChallengeStore((state) => state.entities);
  const entity = useMemo(() => entities[entityId], [entities[entityId]])
  const round = useEntityModel<models.Round>(entity, 'Round')
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

//--------------------------------
// Fetch new challenge and add to the store
// (for non default tables, like tutorials)
//

export const useGetChallenge = (duel_id: BigNumberish) => {
  const result = useChallenge(duel_id)

  // const query_get = useMemo<PistolsQueryBuilder>(() => ({
  //   pistols: {
  //     Challenge: {
  //       $: {
  //         where: {
  //           duel_id: { $eq: formatQueryValue(duel_id) },
  //         },
  //       },
  //     },
  //   },
  // }), [duel_id])
  const query = useMemo<PistolsQueryBuilder>(() => (
    isPositiveBigint(duel_id)
      ? new PistolsQueryBuilder()
        .withClause(
          new PistolsClauseBuilder().keys(
            ["pistols-Challenge"],
            [formatQueryValue(duel_id)]
          ).build()
        )
        .withEntityModels([
          "pistols-Challenge",
          "pistols-Round",
        ])
        .includeHashedKeys()
      : null
  ), [duel_id])

  const updateEntity = useChallengeStore((state) => state.updateEntity)

  useSdkEntitiesGet({
    query,
    retryInterval: 500,
    enabled: !result.challengeExists,
    setEntities: (entities: PistolsEntity[]) => {
      entities.forEach(e => {
        console.log(`useGetChallenge() SET =======> [entity]:`, e)
        updateEntity(e)
      })
    },
  })

  return result
}

