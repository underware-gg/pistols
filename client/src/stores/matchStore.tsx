import { useEffect, useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { createDojoStore } from '@dojoengine/sdk/react'
import { keysToEntityId, useStoreModelsByKeys } from '@underware/pistols-sdk/dojo'
import { PistolsSchemaType, getEntityModel } from '@underware/pistols-sdk/pistols/sdk'
import { parseCustomEnum, parseEnumVariant } from '@underware/pistols-sdk/starknet'
import { useDuelistsOrganizedByAddress, useDuelistStore, useFetchDuelistIdsOwnedByAccount } from '/src/stores/duelistStore'
import { DuelistProfileKey } from '@underware/pistols-sdk/pistols'
import { constants, models } from '@underware/pistols-sdk/pistols/gen'
import { useAccount } from '@starknet-react/core'
import { arrayUnique } from '@underware/pistols-sdk/utils'
import { isPositiveBigint } from '@underware/pistols-sdk/utils'

export const useMatchStore = createDojoStore<PistolsSchemaType>();


//--------------------------------
// 'consumer' hooks
//
export const useMatchQueue = (queueId: constants.QueueId) => {
  const entities = useMatchStore((state) => state.entities);
  const queue = useStoreModelsByKeys<models.MatchQueue>(entities, 'MatchQueue', [constants.getQueueIdValue(queueId)])
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

export const useMatchPlayer = (playerAddress: BigNumberish, queueId: constants.QueueId) => {
  const entities = useMatchStore((state) => state.entities);
  const player = useStoreModelsByKeys<models.MatchPlayer>(entities, 'MatchPlayer', [playerAddress, constants.getQueueIdValue(queueId)])
  // useEffect(() => console.log(`useMatchPlayer() =>`, queueId, player), [queueId, player])

  const queueMode = useMemo(() => player ? parseEnumVariant<constants.QueueMode>(player.queue_info.queue_mode) : undefined, [player])
  const duelistId = useMemo(() => BigInt(player?.duelist_id ?? 0), [player])
  const duelId = useMemo(() => BigInt(player?.duel_id ?? 0), [player])
  const nextDuelists = useMemo(() => Object.values(player?.next_duelists ?? {}).map(v => BigInt(v.duelist_id)), [player])
  const inQueueIds = useMemo(() => arrayUnique(duelistId ? [duelistId, ...nextDuelists] : []), [duelistId, nextDuelists])

  const slot = useMemo(() => Number(player?.queue_info.slot ?? 0), [player])
  const timestampEnter = useMemo(() => Number(player?.queue_info.timestamp_enter ?? 0), [player])
  const timestampPing = useMemo(() => Number(player?.queue_info.timestamp_ping ?? 0), [player])
  const expired = useMemo(() => Boolean(player?.queue_info.expired ?? false), [player])

  // de-stacked duelist have no timestamp_ping, can call match_make_me()
  const canTryToMatch = useMemo(() => (duelistId > 0n && timestampPing == 0), [duelistId, timestampPing])

  return {
    queueId,
    // Current queue
    slot,
    duelId,
    duelistId,
    nextDuelists,
    queueMode,
    timestampEnter,
    timestampPing,
    expired,
    canTryToMatch,
    // all duelists in queue
    inQueueIds,
  }
}



//------------------------------------
// Gather all duelists in match making (current player)
//
// DuelistAssignment:
// - Ranked Elisted (QueueId / no duel)
// - Dueling (QueueId + duel)
//
// MatchPlayer:
// - Current duelist in queue
// - next duelists in queue

export const useDuelistsInMatchMaking = (queueId: constants.QueueId) => {
  const { address } = useAccount();
  return _useDuelistsInMatchMakingByAddress(queueId, address);
}

export const _useDuelistsInMatchMakingByAddress = (queueId: constants.QueueId, address: BigNumberish) => {
  useFetchDuelistIdsOwnedByAccount(address) // fetch duelists in the store, if not already fetched

  const { activeDuelists: allDuelistIds } = useDuelistsOrganizedByAddress(address);
  const duelistEntities = useDuelistStore((state) => state.entities);

  // filter alive duelists only
  const duelistIds = useMemo(() => {
    return allDuelistIds.map(id => BigInt(id)).filter(id => (
      !Boolean(getEntityModel<models.DuelistMemorial>(duelistEntities[keysToEntityId([id])], 'DuelistMemorial'))
    ));
  }, [allDuelistIds, duelistEntities]);

  // get queue
  const { inQueueIds, duelistId: currentDuelistId, duelId: currentDuelId } = useMatchPlayer(address, queueId);

  // filter duelists
  const result = useMemo(() => {
    const rankedCanEnlistIds: bigint[] = [];
    const rankedEnlistedIds: bigint[] = [];
    const canMatchMakeIds: bigint[] = [];
    const duellingIds: bigint[] = [];
    const duelsByDuelistId: Record<string, bigint> = {};

    duelistIds.forEach((duelistId, index) => {
      // get duelist
      const duelistEntityId = keysToEntityId([duelistId]);
      const duelist = getEntityModel<models.Duelist>(duelistEntities[duelistEntityId], 'Duelist');
      if (!duelist) {
        // console.warn(`useDuelistsInMatchMaking() => duelist not found:`, duelistId)
        return;
      }
      
      // get duelist assignment
      const assignment = getEntityModel<models.DuelistAssignment>(duelistEntities[duelistEntityId], 'DuelistAssignment');
      const assigned_queue_id = assignment ? parseEnumVariant<constants.QueueId>(assignment.queue_id) : constants.QueueId.Undefined;
      const assigned_duel_id = BigInt(assignment?.duel_id ?? 0);
      const isUnassigned = (assigned_queue_id == constants.QueueId.Undefined && assigned_duel_id === 0n);
      // console.log(`ASSIGNMENT:`, duelistId, isUnassigned, assigned_queue_id, assigned_duel_id, assignment)

      // Ranked
      if (queueId == constants.QueueId.Ranked) {
        // exclude starters...
        const { variant: profileType, value: profileKey } = parseCustomEnum<constants.DuelistProfile, DuelistProfileKey>(duelist.duelist_profile);
        if (
          profileType == constants.DuelistProfile.Genesis &&
          (profileKey == constants.GenesisKey.SerWalker || profileKey == constants.GenesisKey.LadyVengeance)
        ) {
          return;
        }
        // Free to enlist
        if (isUnassigned) {
          rankedCanEnlistIds.push(duelistId);
        }
        // All Enlisted (paid)
        else if (assigned_queue_id == constants.QueueId.Ranked) {
          rankedEnlistedIds.push(duelistId);
          // Free to match_make_me() -- only enlisted and not dueling!
          if (!inQueueIds.includes(duelistId) && !isPositiveBigint(assignment?.duel_id)) {
            canMatchMakeIds.push(duelistId);
          }
        }
      }

      // Unranked
      if (queueId == constants.QueueId.Unranked) {
        // Free to match_make_me() -- any free duelist and not dueling
        if (assigned_queue_id == constants.QueueId.Undefined && !isPositiveBigint(assignment?.duel_id)) {
          canMatchMakeIds.push(duelistId);
        }
      }

      // Current Duels 
      if (
        assigned_queue_id != constants.QueueId.Undefined &&
        assigned_queue_id == queueId &&
        assigned_duel_id > 0n
      ) {
        duellingIds.push(duelistId);
        duelsByDuelistId[duelistId.toString()] = assigned_duel_id;
      }
    });

    return {
      // Ranked only
      rankedCanEnlistIds,
      rankedEnlistedIds,
      // all queues
      canMatchMakeIds,
      duellingIds,
      duelsByDuelistId,
    };
  }, [queueId, duelistIds, duelistEntities, inQueueIds]);

  // useEffect(() => {
  //   console.log(`useDuelistsInMatchMaking() =>`, queueId, inQueueIds, result)
  // }, [queueId, inQueueIds, result])

  return {
    ...result,
    // current queue
    currentDuelistId,
    currentDuelId,
    inQueueIds,
    // forward all duelist ids
    duelistIds,
  }
}
