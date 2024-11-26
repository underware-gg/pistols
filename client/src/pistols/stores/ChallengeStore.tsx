import { useEffect, useMemo } from 'react'
import { addAddressPadding, BigNumberish } from 'starknet'
import { createDojoStore } from '@dojoengine/sdk'
import { useSdkSubscribeEntities, PistolsSubQuery, PistolsSchemaType, useEntityModel, models } from '@/lib/dojo/hooks/useSdkSub'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { useEntityId } from '@/lib/utils/hooks/useEntityId'
import { useClientTimestamp } from '@/lib/utils/hooks/useTimestamp'
import { feltToString, stringToFelt } from '@/lib/utils/starknet'
import { BladesCard, ChallengeState, getBladesCardValue, Premise, RoundState } from '@/games/pistols/generated/constants'
import { movesToHand } from '@/pistols/utils/pistols'

//
// Stores all challenges from current table
export const useChallengeEntityStore = createDojoStore<PistolsSchemaType>();

//
// Sync all challenges from current table
export function ChallengeStoreSync() {
  const { tableId } = useSettings()
  const query = useMemo<PistolsSubQuery>(() => ({
    pistols: {
      Challenge: {
        $: {
          where: {
            table_id: {
              //@ts-ignore
              $eq: addAddressPadding(stringToFelt(tableId)),
            },
          },
        },
      },
    },
  }), [tableId])

  const state = useChallengeEntityStore((state) => state)
  useSdkSubscribeEntities({
    query,
    set: state.setEntities,
    update: state.updateEntity,
  })

  const entities = useChallengeEntityStore((state) => state.entities)
  useEffect(() => {
    console.log("ChallengeStoreSync() =>", entities);
  }, [entities])

  return (<></>)
}


export const useChallenge = (duelId: BigNumberish) => {
  const entityId = useEntityId([duelId])
  const entities = useChallengeEntityStore((state) => state.entities);
  const entity = useMemo(() => entities[entityId], [entities[entityId]])

  const challenge = useEntityModel<models.Challenge>(entity, 'Challenge')

  const tableId = useMemo(() => feltToString(challenge?.table_id ?? 0n), [challenge])
  const duelistAddressA = useMemo(() => BigInt(challenge?.address_a ?? 0), [challenge])
  const duelistAddressB = useMemo(() => BigInt(challenge?.address_b ?? 0), [challenge])
  const duelistIdA = useMemo(() => BigInt(challenge?.duelist_id_a ?? 0), [challenge])
  const duelistIdB = useMemo(() => BigInt(challenge?.duelist_id_b ?? 0), [challenge])
  const winner = useMemo(() => (challenge?.winner ?? 0), [challenge])
  const premise = useMemo(() => (challenge?.premise as unknown as Premise ?? Premise.Null), [challenge])
  const quote = useMemo(() => feltToString(challenge?.quote ?? 0n), [challenge])
  const timestamp_start = useMemo(() => Number(challenge?.timestamp_start ?? 0), [challenge])
  const timestamp_end = useMemo(() => Number(challenge?.timestamp_end ?? 0), [challenge])

  const { clientTimestamp } = useClientTimestamp(false)
  let _state = useMemo(() => (challenge?.state as unknown as ChallengeState), [challenge])
  let state = useMemo(() => {
    if (_state == ChallengeState.Awaiting && (timestamp_end < clientTimestamp)) {
      return ChallengeState.Expired
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
    isLive: (state == ChallengeState.Awaiting || state == ChallengeState.InProgress),
    isAwaiting: (state == ChallengeState.Awaiting),
    isInProgress: (state == ChallengeState.InProgress),
    isFinished: (state == ChallengeState.Resolved || state == ChallengeState.Draw),
    isResolved: (state == ChallengeState.Resolved),
    isDraw: (state == ChallengeState.Draw),
    isCanceled: (state == ChallengeState.Withdrawn || state == ChallengeState.Refused),
    isExpired: (state == ChallengeState.Expired),
    needToSyncExpired: (state == ChallengeState.Expired && state != _state),
    // times
    timestamp_start,
    timestamp_end,
  }
}

export const useRound = (duelId: BigNumberish) => {
  const entityId = useEntityId([duelId])
  const entities = useChallengeEntityStore((state) => state.entities);
  const entity = useMemo(() => entities[entityId], [entities[entityId]])

  const round = useEntityModel<models.Round>(entity, 'Round')

  const state = useMemo(() => (round?.state as unknown as RoundState ?? null), [round])
  const final_blow = useMemo(() => feltToString(round?.final_blow ?? 0n), [round])
  const endedInBlades = useMemo(() => (round ? (getBladesCardValue(final_blow as unknown as BladesCard) > 0) : false), [final_blow])

  const hand_a = useMemo(() => round ? movesToHand(
    [round.moves_a.card_1, round.moves_a.card_2, round.moves_a.card_3, round.moves_a.card_4]
  ) : null, [round])
  const hand_b = useMemo(() => round ? movesToHand(
    [round.moves_b.card_1, round.moves_b.card_2, round.moves_b.card_3, round.moves_b.card_4]
  ) : null, [round])

  const _moves = (moves: models.Moves) => {
    return moves ? {
      ...moves,
      seed: BigInt(moves.seed),
      salt: BigInt(moves.salt),
      hashed: BigInt(moves.hashed),
    } : null
  }

  const moves_a = useMemo(() => _moves(round?.moves_a), [round])
  const moves_b = useMemo(() => _moves(round?.moves_b), [round])
  const state_a = useMemo(() => (round?.state_a), [round])
  const state_b = useMemo(() => (round?.state_b), [round])

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
