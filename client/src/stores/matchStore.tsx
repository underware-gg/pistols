import { useEffect, useMemo } from 'react'
import { createDojoStore } from '@dojoengine/sdk/react'
import { keysToEntityId, makeCustomEnumEntityId, useDojoSystem, useStoreModelsById, useStoreModelsByKeys } from '@underware/pistols-sdk/dojo'
import { PistolsSchemaType, getEntityModel } from '@underware/pistols-sdk/pistols/sdk'
import { constants, models } from '@underware/pistols-sdk/pistols/gen'
import { makeAbiCustomEnum, parseCustomEnum, parseEnumVariant } from '@underware/pistols-sdk/starknet'
import { BigNumberish } from 'starknet'
import { useDuelistStore } from './duelistStore'
import { DuelistProfileKey } from '@underware/pistols-sdk/pistols'

export const useMatchStore = createDojoStore<PistolsSchemaType>();


//--------------------------------
// 'consumer' hooks
//
const _useQueueIdEntityId = (queueId: constants.QueueId): string | undefined => {
  const { abi } = useDojoSystem('matchmaker')
  const _enum = makeAbiCustomEnum(abi, 'QueueId', queueId)
  const _entityId = makeCustomEnumEntityId(_enum)
  return _entityId
}
export const useMatchQueue = (queueId: constants.QueueId) => {
  const entities = useMatchStore((state) => state.entities);
  const entityId = _useQueueIdEntityId(queueId)
  const queue = useStoreModelsById<models.MatchQueue>(entities, 'MatchQueue', entityId)
  // useEffect(() => console.log(`useMatchQueue() =>`, queue), [queue])

  const slotSize = useMemo(() => Number(queue?.slot_size ?? 0), [queue])
  const players = useMemo(() => (queue?.players ?? []), [queue])

  const entryTokenAddress = useMemo(() => BigInt(queue?.entry_token_address ?? 0), [queue])
  const entryTokenAmount = useMemo(() => BigInt(queue?.entry_token_amount ?? 0), [queue])
  const requiresEnlistment = useMemo(() => (entryTokenAddress > 0n && entryTokenAmount > 0n), [queue])
  
  return {
    slotSize,
    players,
    entryTokenAddress,
    entryTokenAmount,
    requiresEnlistment,
  }
}

export const useMatchPlayer = (playerAddress: BigNumberish) => {
  const entities = useMatchStore((state) => state.entities);
  const player = useStoreModelsByKeys<models.MatchPlayer>(entities, 'MatchPlayer', [playerAddress])
  // useEffect(() => console.log(`useMatchQueue() =>`, queue), [queue])

  const queueId = useMemo(() => player ? parseEnumVariant<constants.QueueId>(player.queue_id) : undefined, [player])
  const queueMode = useMemo(() => player ? parseEnumVariant<constants.QueueMode>(player.queue_info.queue_mode) : undefined, [player])

  const duelistId = useMemo(() => BigInt(player?.duelist_id ?? 0), [player])
  const duelId = useMemo(() => BigInt(player?.duel_id ?? 0), [player])

  const slot = useMemo(() => Number(player?.queue_info.slot ?? 0), [player])
  const timestampEnter = useMemo(() => Number(player?.queue_info.timestamp_enter ?? 0), [player])
  const timestampPing = useMemo(() => Number(player?.queue_info.timestamp_ping ?? 0), [player])
  const expired = useMemo(() => Boolean(player?.queue_info.expired ?? false), [player])

  return {
    queueId,
    slot,
    duelistId,
    duelId,
    queueMode,
    timestampEnter,
    timestampPing,
    expired,
  }
}



//----------------------
// Duelist filters
//
export const useDuelistsInMatchMaking = (duelistIds: BigNumberish[], queueId: constants.QueueId) => {
  const entities = useDuelistStore((state) => state.entities);

  const result = useMemo(() => {
    const canEnlist: bigint[] = [];
    const canMatchMake: bigint[] = [];
    const inQueue: bigint[] = [];
    const inDuel: bigint[] = [];
    const duels: Record<string, bigint> = {};

    duelistIds.map(BigInt).forEach(duelistId => {
      const entityId = keysToEntityId([duelistId]);

      // check profile (exclude starters)
      if (queueId == constants.QueueId.Ranked) {
        const duelist = getEntityModel<models.Duelist>(entities[entityId], 'Duelist');
        const { variant: profileType, value: profileKey } = parseCustomEnum<constants.DuelistProfile, DuelistProfileKey>(duelist.duelist_profile);
        if (
          profileType == constants.DuelistProfile.Genesis && 
          (profileKey == constants.GenesisKey.SerWalker || profileKey == constants.GenesisKey.LadyVengeance)
        ) {
          return;
        }
      }

      // get assignemnt
      const assignment = getEntityModel<models.DuelistAssignment>(entities[entityId], 'DuelistAssignment');
      const assigned_queue_id = assignment ? parseEnumVariant<constants.QueueId>(assignment.queue_id) : constants.QueueId.Undefined;
      const assigned_duel_id = BigInt(assignment?.duel_id ?? 0);
      //
      // Ranked: no enlistment, any duelist can enter
      if (queueId == constants.QueueId.Unranked) {
        if (assigned_queue_id === constants.QueueId.Undefined && assigned_duel_id === 0n) {
          canMatchMake.push(duelistId);
        }
        if (assigned_queue_id === constants.QueueId.Unranked) {
          if (assigned_duel_id === 0n) {
            inQueue.push(duelistId);
          } else {
            inDuel.push(duelistId);
            duels[duelistId.toString()] = assigned_duel_id;
          }
        }
      }
      //
      // Ranked: enlistment required
      else if (queueId == constants.QueueId.Ranked) {
        if (assigned_queue_id === constants.QueueId.Undefined && assigned_duel_id === 0n) {
          canEnlist.push(duelistId);
        }
        if (assigned_queue_id === constants.QueueId.Ranked) {
          if (assigned_duel_id === 0n) {
            // TODO: theres no way to make a distinction now...
            inQueue.push(duelistId);
            canMatchMake.push(duelistId);
          } else {
            inDuel.push(duelistId);
            duels[duelistId.toString()] = assigned_duel_id;
          }
        }
      }
    });

    return {
      canEnlist,
      canMatchMake,
      inQueue,
      inDuel,
      duels,
    };
  }, [duelistIds, queueId, entities]);

  useEffect(() => {
    console.log(`useDuelistsInMatchMaking() =>`, queueId, result)
  }, [queueId, result])

  return {
    ...result,
  }
}


