import { useEffect, useMemo } from 'react'
import { addAddressPadding, BigNumberish } from 'starknet'
import { createDojoStore } from '@dojoengine/sdk'
import { useSdkSubscribeEntities, PistolsSubQuery, PistolsSchemaType, useEntityModel, models } from '@/lib/dojo/hooks/useSdkSub'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { useEntityId } from '@/lib/utils/hooks/useEntityId'
import { useClientTimestamp } from '@/lib/utils/hooks/useTimestamp'
import { feltToString, stringToFelt } from '@/lib/utils/starknet'
import { ChallengeState, Premise } from '@/games/pistols/generated/constants'

//
// Stores all challenges from current table
export const useChallengeStore = createDojoStore<PistolsSchemaType>();

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

  const state = useChallengeStore((state) => state)
  useSdkSubscribeEntities({
    query,
    set: state.setEntities,
    update: state.updateEntity,
  })

  const entities = useChallengeStore((state) => state.entities)
  useEffect(() => {
    console.log("ChallengeStoreSync() =>", entities);
  }, [entities])

  return (<></>)
}


export const useChallenge = (duelId: BigNumberish) => {
  const entityId = useEntityId([duelId])
  const entities = useChallengeStore((state) => state.entities);
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
