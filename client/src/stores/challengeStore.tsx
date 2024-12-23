import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { createDojoStore } from '@dojoengine/sdk'
import { useEntityId, useClientTimestamp } from '@underware_gg/pistols-sdk/hooks'
import { useEntityModel } from '@underware_gg/pistols-sdk/dojo'
import { constants, models, PistolsSchemaType } from '@underware_gg/pistols-sdk/pistols'
import { movesToHand } from '@/utils/pistols'
import { feltToString } from '@underware_gg/pistols-sdk/utils'

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
  // useEffect(() => console.log(`useChallenge(${Number(duelId)}) => [${Object.keys(entities).length}]`, challenge), [challenge])

  const tableId = useMemo(() => feltToString(challenge?.table_id ?? 0n), [challenge])
  const duelistAddressA = useMemo(() => BigInt(challenge?.address_a ?? 0), [challenge])
  const duelistAddressB = useMemo(() => BigInt(challenge?.address_b ?? 0), [challenge])
  const duelistIdA = useMemo(() => BigInt(challenge?.duelist_id_a ?? 0), [challenge])
  const duelistIdB = useMemo(() => BigInt(challenge?.duelist_id_b ?? 0), [challenge])
  const winner = useMemo(() => (challenge?.winner ?? 0), [challenge])
  const premise = useMemo(() => (challenge?.premise as unknown as constants.Premise ?? constants.Premise.Null), [challenge])
  const quote = useMemo(() => feltToString(challenge?.quote ?? 0n), [challenge])
  const timestamp_start = useMemo(() => Number(challenge?.timestamp_start ?? 0), [challenge])
  const timestamp_end = useMemo(() => Number(challenge?.timestamp_end ?? 0), [challenge])

  const { clientSeconds } = useClientTimestamp(false)
  let _state = useMemo(() => (challenge?.state as unknown as constants.ChallengeState), [challenge])
  let state = useMemo(() => {
    if (_state == constants.ChallengeState.Awaiting && (timestamp_end < clientSeconds)) {
      return constants.ChallengeState.Expired
    }
    return _state
  }, [_state])

  return {
    challengeExists: (challenge != null),
    duelId,
    tableId,
    state,
    duelistAddressA,
    duelistAddressB,
    duelistIdA,
    duelistIdB,
    premise,
    quote,
    // progress and results
    winner,
    winnerDuelistId: (winner == 1 ? duelistIdA : winner == 2 ? duelistIdB : 0n),
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
    timestamp_start,
    timestamp_end,
  }
}

export const useRound = (duelId: BigNumberish) => {
  const entityId = useEntityId([duelId])
  const entities = useChallengeStore((state) => state.entities);
  const entity = useMemo(() => entities[entityId], [entities[entityId]])

  const round = useEntityModel<models.Round>(entity, 'Round')

  const state = useMemo(() => (round?.state as unknown as constants.RoundState ?? null), [round])
  const final_blow = useMemo(() => feltToString(round?.final_blow ?? 0n), [round])
  const endedInBlades = useMemo(() => (round ? (constants.getBladesCardValue(final_blow as unknown as constants.BladesCard) > 0) : false), [final_blow])

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
      seed: BigInt(moves.seed),
      salt: BigInt(moves.salt),
      hashed: BigInt(moves.hashed),
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
    final_blow,
    endedInBlades,
    hand_a,
    hand_b,
    moves_a,
    moves_b,
    state_a,
    state_b,
  }
}
