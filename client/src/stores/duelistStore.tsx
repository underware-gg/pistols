import { useEffect, useMemo } from 'react'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { BigNumberish, CairoCustomEnum } from 'starknet'
import { useAccount } from '@starknet-react/core'
import { createDojoStore } from '@dojoengine/sdk/react'
import { useClientTimestamp, useMemoGate } from '@underware/pistols-sdk/utils/hooks'
import { useEntityIds, useDojoSystem, keysToEntityId, useStoreModelsByKeys, useStoreModelsById, useAllStoreModels, useSdkEntitiesGet } from '@underware/pistols-sdk/dojo'
import { getCollectionDescriptor, getProfileDescriptor, getProfileGender, getProfileId, DuelistProfileKey, DuelistGender, getProfileQuote } from '@underware/pistols-sdk/pistols'
import { isPositiveBigint, bigintToDecimal, bigintToHex, bigintEquals, bigintToAddress, bigintToHex128 } from '@underware/pistols-sdk/utils'
import { PistolsEntity, PistolsSchemaType, getEntityModel, PistolsQueryBuilder, PistolsClauseBuilder } from '@underware/pistols-sdk/pistols/sdk'
import { makeAbiCustomEnum, parseCustomEnum, parseEnumVariant } from '@underware/pistols-sdk/starknet'
import { useDuelistIdsOwnedByAccounts, useDuelistsOwnedByPlayer, useOwnerOfDuelist } from '/src/hooks/useTokenDuelists'
import { useDuelistFetchStore, useDuelistStackFetchStore } from '/src/stores/fetchStore'
import { useFetchChallengeRewardsByDuelistIds } from '/src/stores/challengeRewardsStore'
import { constants, models } from '@underware/pistols-sdk/pistols/gen'
import { CharacterType } from '/src/data/assets'
import { ArchetypeNames } from '/src/utils/pistols'
import { EMOJIS } from '@underware/pistols-sdk/pistols/constants'
import { debug } from '@underware/pistols-sdk/pistols'
import { useFetchTokenboundAccountsBalances } from './coinStore'
import { useTokenContracts } from '../hooks/useTokenContracts'

export const useDuelistStore = createDojoStore<PistolsSchemaType>();
export const useDuelistStackStore = createDojoStore<PistolsSchemaType>();

// keep track of all challenge ids in the store
interface DuelistIdsState {
  duelistIds: bigint[],
  updateEntities: (entities: PistolsEntity[]) => void;
}
const createStore = () => {
  return create<DuelistIdsState>()(immer((set, get) => ({
    duelistIds: [],
    updateEntities: (entities: PistolsEntity[]) => {
      set((state: DuelistIdsState) => {
        state.duelistIds = entities.map(e => BigInt(e.models.pistols.Duelist?.duelist_id ?? 0)).filter(Boolean)
      })
    },
  })))
}
export const useDuelistIdsStore = createStore();



//--------------------------------
// consumer hooks
//

export const useAllDuelistIds = () => {
  const entities = useDuelistStore((state) => state.entities)
  const duelistIds = useMemo(() => Object.values(entities).map(e => BigInt(e.models.pistols.Duelist.duelist_id)), [entities])
  return {
    duelistIds,
  }
}

export const useDuelistProfile = (duelist_profile: CairoCustomEnum | undefined) => {
  const { variant, value } = useMemo(() => parseCustomEnum<constants.DuelistProfile, DuelistProfileKey>(duelist_profile), [duelist_profile])
  const profileType: constants.DuelistProfile = variant;  // ex: GenesisKey
  const profileKey: DuelistProfileKey = value;            // ex: GenesisKey::Duke

  const profileCollection: constants.CollectionDescriptor = useMemo(() => getCollectionDescriptor(profileType), [profileType])
  const profileDescription: constants.ProfileDescriptor = useMemo(() => getProfileDescriptor(profileType, profileKey), [profileType, profileKey])
  const profileId: number = useMemo(() => getProfileId(profileType, profileKey), [profileType, profileKey])
  const profileGender: DuelistGender = useMemo(() => (getProfileGender(profileType, profileKey)), [profileType, profileKey])
  const duelistName: string = useMemo(() => (profileDescription.name), [profileDescription])
  const isNpc: boolean = useMemo(() => (profileCollection ? !profileCollection.is_playable : false), [profileCollection])
  const quote: string = useMemo(() => (getProfileQuote(profileType, profileKey)), [profileType, profileKey])

  return {
    profileType,
    profileKey,
    profileCollection,
    profileDescription,
    profileId,
    profileGender,
    duelistName,
    isNpc,
    quote,
  }
}

export const useDuelist = (duelist_id: BigNumberish) => {
  const isValidDuelistId = useMemo(() => (isPositiveBigint(duelist_id) && BigInt(duelist_id) <= BigInt(constants.CONST.MAX_DUELIST_ID)), [duelist_id])
  const duelistId = useMemo(() => BigInt(duelist_id), [duelist_id])

  const entities = useDuelistStore((state) => state.entities);
  const duelist = useStoreModelsByKeys<models.Duelist>(entities, 'Duelist', [duelist_id])
  const duelistChallenge = useStoreModelsByKeys<models.DuelistAssignment>(entities, 'DuelistAssignment', [duelist_id])
  const duelistMemorial = useStoreModelsByKeys<models.DuelistMemorial>(entities, 'DuelistMemorial', [duelist_id])
  // console.log(`useDuelist() =>`, duelist_id, duelist)
  // console.log(`DuelistMemorial =>`, duelist_id, duelistMemorial)

  const timestampRegistered = useMemo(() => Number(duelist?.timestamps?.registered ?? 0), [duelist])
  const timestampActive = useMemo(() => Number(duelist?.timestamps?.active ?? 0), [duelist])
  const exists = useMemo(() => Boolean(timestampRegistered), [timestampRegistered])

  // inactivity
  const { clientTimestamp } = useClientTimestamp()
  // sync with duelist_token.inactive_timestamp()
  const inactiveTimestamp = useMemo(() => (clientTimestamp - timestampActive), [timestampActive, clientTimestamp])
  // sync with duelist_token.is_inactive()
  const isInactive = useMemo(() => (timestampActive > 0 && (inactiveTimestamp > constants.FAME.MAX_INACTIVE_TIMESTAMP)), [timestampActive, inactiveTimestamp])

  // current duel a duelist is in
  const currentDuelId = useMemo(() => BigInt(duelistChallenge?.duel_id ?? 0), [duelistChallenge])
  const currentPassId = useMemo(() => BigInt(duelistChallenge?.pass_id ?? 0), [duelistChallenge])
  const isInAction = useMemo(() => (currentDuelId > 0n), [currentDuelId])

  // memorial (dead duelists)
  const isDead = useMemo(() => Boolean(duelistMemorial), [duelistMemorial])
  const causeOfDeath = useMemo(() => parseEnumVariant<constants.CauseOfDeath>(duelistMemorial?.cause_of_death), [duelistMemorial])

  const totals = useTotals(duelist?.totals)

  // profile
  const {
    profileType,
    profileKey,
    profileCollection,
    profileDescription,
    profileId,
    profileGender,
    duelistName,
    isNpc,
    quote,
  } = useDuelistProfile(duelist?.duelist_profile)

  // for animations
  const characterType = useMemo(() => (profileGender == 'Female' ? CharacterType.FEMALE : CharacterType.MALE), [profileGender])

  const nameAndId = useMemo(() => (
    isNpc ? (duelistName || 'NPC') : `${duelistName || 'Duelist'} #${isValidDuelistId ? bigintToDecimal(duelistId) : '?'}`
  ), [duelistName, duelistId, isValidDuelistId, isNpc])
  const duelistIdDisplay = useMemo(() => (
    isNpc ? 'NPC' : `Duelist #${isValidDuelistId ? bigintToDecimal(duelistId) : '?'}`
  ), [duelistId, isValidDuelistId, isNpc])

  return {
    isValidDuelistId,
    duelistId,
    exists,
    timestampRegistered,
    timestampActive,
    // duelist activity
    currentDuelId,
    currentPassId,
    isInAction,
    isInactive,
    totals,
    // profile
    name: duelistName,
    nameAndId,
    duelistIdDisplay,
    profileType,
    profileKey,
    profileCollection,
    profileDescription,
    profileId,
    profilePic: profileId,
    profileGender,
    characterType,
    isNpc,
    quote,
    // dead duelists
    isDead,
    isAlive: !isDead,
    causeOfDeath,
  }
}

export const useDuellingDuelists = (duelistIds: BigNumberish[]) => {
  const entities = useDuelistStore((state) => state.entities)

  const entityIds = useEntityIds(duelistIds.map(id => [id]))

  // filter alive duelists from duelistIds
  const alive_entities = useMemo(() => (
    Object.keys(entities).filter(e => (
      entityIds.includes(e) && !Boolean(getEntityModel(entities[e], 'DuelistMemorial'))
    ))
  ), [entities, entityIds])

  const { notDuelingIds, duellingIds, queuedIds, duelPerDuelists } = useMemo(() => {
    const notDuelingIds: BigNumberish[] = []
    const duellingIds: BigNumberish[] = []
    const queuedIds: BigNumberish[] = []
    const duelPerDuelists: Record<string, BigNumberish> = {}
    alive_entities.forEach(entityId => {
      const assignment = getEntityModel(entities[entityId], 'DuelistAssignment')
      const duelist_id = bigintToHex(assignment?.duelist_id ?? getEntityModel(entities[entityId], 'Duelist').duelist_id)
      const queue_id = assignment ? parseEnumVariant<constants.QueueId>(assignment.queue_id) : constants.QueueId.Undefined
      if (isPositiveBigint(assignment?.duel_id)) {
        duellingIds.push(duelist_id)
        duelPerDuelists[duelist_id] = bigintToHex(assignment.duel_id)
      } else if (queue_id !== constants.QueueId.Undefined) {
        queuedIds.push(duelist_id)
      } else {
        notDuelingIds.push(duelist_id)
      }
    })
    return {
      notDuelingIds: notDuelingIds.sort((a, b) => Number(BigInt(a) - BigInt(b))),
      duellingIds: duellingIds.sort((a, b) => Number(BigInt(a) - BigInt(b))),
      queuedIds: queuedIds.sort((a, b) => Number(BigInt(a) - BigInt(b))),
      duelPerDuelists,
    }
  }, [alive_entities])

  return {
    notDuelingIds,    // duelist_ids who are not duelling
    duellingIds,      // duelist_ids who are duelling
    queuedIds,        // duelist_ids who are queued (in any queue)
    duelPerDuelists,  // duel_ids per (duelling) duelist_id
  }
}


//----------------------
// Totals
//
export const calcWinRatio = (total_duels: number, total_wins: number) => (total_duels > 0 ? (total_wins / total_duels) : null)

export function useTotals(totals: models.Totals | undefined) {
  const result = useMemo(() => {
    const total_duels = Number(totals?.total_duels ?? 0);
    const total_wins = Number(totals?.total_wins ?? 0);
    const total_losses = Number(totals?.total_losses ?? 0);
    const total_draws = Number(totals?.total_draws ?? 0);
    const winRatio = calcWinRatio(total_duels, total_wins)

    const honour = Number(totals?.honour ?? 0) / 10.0;
    const honourDisplay = (total_duels > 0 && honour > 0 ? honour.toFixed(1) : EMOJIS.ZERO)
    const honourAndTotal = total_duels > 0 && honour > 0 ? <>{honour.toFixed(1)}<span className='Smaller'>/{total_duels}</span></> : EMOJIS.ZERO

    const isVillainous = total_duels > 0 && (honour * 10) < constants.HONOUR.TRICKSTER_START;
    const isTrickster = (honour * 10) >= constants.HONOUR.TRICKSTER_START && (honour * 10) < constants.HONOUR.LORD_START;
    const isHonourable = (honour * 10) >= constants.HONOUR.LORD_START;
    const archetype = (
      isHonourable ? constants.Archetype.Honourable
        : isTrickster ? constants.Archetype.Trickster
          : isVillainous ? constants.Archetype.Villainous
            : constants.Archetype.Undefined);
    const archetypeName = ArchetypeNames[archetype]

    return {
      total_duels,
      total_wins,
      total_losses,
      total_draws,
      winRatio,
      honour,
      honourDisplay,
      honourAndTotal,
      archetype,
      archetypeName,
      isVillainous,
      isTrickster,
      isHonourable,
    }
  }, [totals])

  return result
}



//-------------------------------
// Duelist Stack
//

const _useDuelistStackEntityId = (address: BigNumberish, profileType: constants.DuelistProfile, profileId: number): string | undefined => {
  const { abi } = useDojoSystem('duelist_token')
  const _enum = makeAbiCustomEnum(abi, 'DuelistProfile', profileType, profileId)
  const entityId = useMemoGate(() => (keysToEntityId([address, _enum])), [address, _enum])
  return entityId
}

export const useDuelistStack = (duelist_id: BigNumberish) => {
  // get duelist profile
  const duelistEntities = useDuelistStore((state) => state.entities)
  const duelist = useStoreModelsByKeys<models.Duelist>(duelistEntities, 'Duelist', [duelist_id])
  const {
    profileType,
    profileId,
  } = useDuelistProfile(duelist?.duelist_profile)

  // get stack
  const { owner } = useOwnerOfDuelist(duelist_id)
  const stackEntities = useDuelistStackStore((state) => state.entities)
  const stackEntityId = _useDuelistStackEntityId(owner, profileType, profileId)
  const stack = useStoreModelsById<models.PlayerDuelistStack>(stackEntities, 'PlayerDuelistStack', stackEntityId)

  const activeDuelistId = useMemo(() => (stack?.active_duelist_id ?? undefined), [stack])
  const stackedDuelistIds = useMemo(() => (stack?.stacked_ids ?? []).map(id => Number(id)), [stack])
  const level = useMemo(() => Number(stack?.level ?? 0), [stack])

  return {
    activeDuelistId,
    stackedDuelistIds,
    level,
  }
}

export function useDuelistStacks(player_address: BigNumberish) {
  const entities = useDuelistStackStore((state) => state.entities)
  const models = useAllStoreModels<models.PlayerDuelistStack>(entities, 'PlayerDuelistStack')
  const playerStacks = useMemo(() => models.filter(s => bigintEquals(s.player_address, player_address)), [models, player_address])

  const stacks = useMemo(() => {
    return playerStacks.map(stack => {
      if (!stack.active_duelist_id) return null;
      return {
        activeDuelistId: stack.active_duelist_id,
        stackedIds: stack.stacked_ids,
        level: Number(stack.level ?? 0),
      };
    }).filter(Boolean);
  }, [playerStacks]);

  // console.log('>>>>>>duelist stacks...', entities, models, playerStacks, stacks);

  return {
    stacks,
  };
}

export const usePlayerDuelistsOrganized = () => {
  const { address } = useAccount();
  return useDuelistsOrganizedByAddress(address);
}
export const useDuelistsOrganizedByAddress = (address: BigNumberish) => {
  const { stacks } = useDuelistStacks(address)
  const { duelistIds } = useDuelistsOwnedByPlayer()
  const entities = useDuelistStore((state) => state.entities)

  const organizedDuelists = useMemo(() => {
    if (!stacks || stacks.length === 0) {
      return { activeDuelists: [], deadDuelists: [] }
    }

    const activeDuelists: BigNumberish[] = []
    const stackedDuelists: BigNumberish[] = []
    const deadDuelists: BigNumberish[] = []

    stacks.forEach(({ activeDuelistId, stackedIds }) => {
      activeDuelists.push(activeDuelistId)
      stackedDuelists.push(...stackedIds)
    })

    duelistIds.forEach(id => {
      if (!activeDuelists.includes(id) && !stackedDuelists.includes(id)) {
        const entityId = keysToEntityId([id])
        const memorial = getEntityModel(entities[entityId], 'DuelistMemorial')
        if (memorial) {
          deadDuelists.push(id)
        } 
      }
    })
    
    // Sort arrays by id
    const sortById = (a: BigNumberish, b: BigNumberish) => 
      BigInt(a) > BigInt(b) ? 1 : BigInt(a) < BigInt(b) ? -1 : 0;
    
    return {
      activeDuelists: activeDuelists.sort(sortById),
      deadDuelists: deadDuelists.sort(sortById)
    }
    
    //To get all duelists minted in the duelist book
    // const allDuelistIds = Object.entries(entities).map(([entityId, entity]) => {
    //   const duelist = entity?.models?.pistols?.Duelist;
    //   return duelist?.duelist_id;
    // }).filter(Boolean);
    
    // const sortedDuelistIds = allDuelistIds.sort(sortById);
    
    // return {
    //   activeDuelists: sortedDuelistIds,
    //   deadDuelists: []
    // }
  }, [stacks, entities, duelistIds])

  return {
    ...organizedDuelists,
  }
}



//------------------------------------------------
// Fetch multiple duelists per player or challenge
// after fetching once, it won't fetch again the same duelists/players
// new and fetched duelists will be updated automatically with the entity subscription
//

//
// Fetch NEW duelists by IDs
//
export const useFetchDuelist = (duelist_id: BigNumberish, retryInterval?: number) => {
  const duelistIds = useMemo(() => [duelist_id], [duelist_id])
  return useFetchDuelistsByIds(duelistIds, retryInterval)
}

export const useFetchDuelistsByIds = (duelistIds: BigNumberish[], retryInterval?: number) => {
  // always fetch duelists fame
  const { duelistContractAddress, fameContractAddress } = useTokenContracts()
  useFetchTokenboundAccountsBalances(fameContractAddress, duelistContractAddress, duelistIds, true);

  const setEntities = useDuelistStore((state) => state.setEntities);

  const existingDuelistIds = useDuelistIdsStore((state) => state.duelistIds)
  const newDuelistIds = useMemo(() => (
    duelistIds
      .filter(isPositiveBigint)
      .map(BigInt)
      .filter((id) => !existingDuelistIds.includes(id))
  ), [duelistIds, existingDuelistIds])

  const query = useMemo<PistolsQueryBuilder>(() => (
    newDuelistIds.length > 0
      ? new PistolsQueryBuilder()
        .withClause(
          new PistolsClauseBuilder().compose().or([
            new PistolsClauseBuilder().where("pistols-Duelist", "duelist_id", "In", newDuelistIds.map(bigintToHex128)),
            new PistolsClauseBuilder().where("pistols-DuelistAssignment", "duelist_id", "In", newDuelistIds.map(bigintToHex128)),
            new PistolsClauseBuilder().where("pistols-DuelistMemorial", "duelist_id", "In", newDuelistIds.map(bigintToHex128)),
          ]).build()
        )
        .withEntityModels([
          "pistols-Duelist",
          "pistols-DuelistAssignment",
          "pistols-DuelistMemorial",
        ])
        .withLimit(newDuelistIds.length)
        .includeHashedKeys()
      : null
  ), [newDuelistIds])

  const { isLoading, isFinished } = useSdkEntitiesGet({
    query,
    retryInterval,
    setEntities: (entities: PistolsEntity[]) => {
      debug.log(`useFetchDuelistsByIds() GOT`, newDuelistIds, entities);
      setEntities(entities);
    },
  })

  // useEffect(() => console.warn(`::useFetchDuelistsByIds... duelistIds:`, duelistIds), [duelistIds])
  // useEffect(() => console.warn(`::useFetchDuelistsByIds... existingDuelistIds:`, existingDuelistIds), [existingDuelistIds])
  // useEffect(() => console.warn(`::useFetchDuelistsByIds... newDuelistIds:`, newDuelistIds), [newDuelistIds])
  // useEffect(() => console.warn(`::useFetchDuelistsByIds... query:`, query), [query])

  // const entities = useDuelistStore((state) => state.entities);
  // useEffect(() => {
  //   console.log(`::useFetchDuelistsByIds... entities:`, entities)
  // }, [entities])

  return {
    isLoading,
    isFinished: (isFinished || newDuelistIds.length === 0),
  }
}



//------------------------------------------------
// Fetch multiple duelists per player
// after fetching once, it won't fetch again the same duelists/players
// new and fetched duelists will be updated automatically with the entity subscription
//

export const useFetchDuelistIdsOwnedByAccount = (address: BigNumberish) => {
  const addresses = useMemo(() => [address], [address])
  return useFetchDuelistIdsOwnedByAccounts(addresses)
}

export const useFetchDuelistIdsOwnedByAccounts = (addresses: BigNumberish[]) => {
  // dont even try for players already fetched...
  const fetchState = useDuelistFetchStore((state) => state);
  const newAddresses = useMemo(() => (
    fetchState.getNewAddresses(addresses)
  ), [addresses, fetchState.addresses])

  // fetch duelists...
  const { duelistIds } = useDuelistIdsOwnedByAccounts(newAddresses)
  const { isLoading, isFinished } = useFetchDuelistsByIds(duelistIds)
  // fetch player stacks...
  useFetchPlayerDuelistStacks(addresses)
  
  // mark players as fetched...
  useEffect(() => {
    if (isFinished) {
      debug.log(`useFetchDuelistIdsOwnedByAccounts() FETCHED`, newAddresses.map(bigintToHex));
      fetchState.setFetchedAddresses(newAddresses.map(BigInt));
    }
  }, [isFinished])

  return {
    isLoading,
    isFinished,
  }
}


const useFetchPlayerDuelistStacks = (addresses: BigNumberish[]) => {
  const setEntities = useDuelistStackStore((state) => state.setEntities);

  // dont even try for players already fetched...
  const fetchState = useDuelistStackFetchStore((state) => state);
  const newAddresses = useMemo(() => (
    fetchState.getNewAddresses(addresses)
  ), [addresses, fetchState.addresses])

  const query = useMemo<PistolsQueryBuilder>(() => (
    newAddresses.length > 0
      ? new PistolsQueryBuilder()
        .withClause(
          new PistolsClauseBuilder()
            .where('pistols-PlayerDuelistStack', 'player_address', 'In', newAddresses.map(bigintToAddress))
            .build()
        )
        .withEntityModels(['pistols-PlayerDuelistStack'])
        .withLimit(2000)
        .includeHashedKeys()
      : null
  ), [newAddresses])

  const { isLoading, isFinished } = useSdkEntitiesGet({
    query,
    setEntities: (entities: PistolsEntity[]) => {
      debug.log(`useFetchPlayerDuelistStacks() GOT`, newAddresses, entities);
      setEntities(entities);
      fetchState.setFetchedAddresses(newAddresses.map(BigInt));
    },
  })

  return {
    isLoading,
    isFinished: (isFinished || newAddresses.length === 0),
  }
}
