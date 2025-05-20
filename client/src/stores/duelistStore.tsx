import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { createDojoStore } from '@dojoengine/sdk/react'
import { useEntityIds, getEntityModel, useDojoSystem, keysToEntityId, getCustomEnumCalldata, useStoreModelsByKeys, useStoreModelsById, useEntitiesModel } from '@underware/pistols-sdk/dojo'
import { useClientTimestamp, useMemoGate } from '@underware/pistols-sdk/utils/hooks'
import { isPositiveBigint, bigintToDecimal, bigintToHex } from '@underware/pistols-sdk/utils'
import { makeAbiCustomEnum, parseCustomEnum, parseEnumVariant } from '@underware/pistols-sdk/starknet'
import { getCollectionDescription, getProfileDescription, getProfileGender, getProfileId, DuelistProfileKey, DuelistGender, getProfileQuote } from '@underware/pistols-sdk/pistols'
import { PistolsSchemaType } from '@underware/pistols-sdk/pistols/sdk'
import { constants, models } from '@underware/pistols-sdk/pistols/gen'
import { CharacterType } from '/src/data/assets'
import { ArchetypeNames } from '/src/utils/pistols'
import { EMOJIS } from '@underware/pistols-sdk/pistols/constants'
import { useAccount } from '@starknet-react/core'
import { useDuelistsOfPlayer, useOwnerOfDuelist } from '../hooks/useTokenDuelists'
import { useSdkEntitiesGetState, filterEntitiesByModels } from '@underware/pistols-sdk/dojo'
import { PistolsQueryBuilder, PistolsClauseBuilder } from '@underware/pistols-sdk/pistols/sdk'

export const useDuelistStore = createDojoStore<PistolsSchemaType>();
export const useDuelistStackStore = createDojoStore<PistolsSchemaType>();

// export const useAllDuelistsEntityIds = () => {
//   const entities = useStore((state) => state.entities)
//   const entityIds = useMemo(() => Object.keys(entities), [entities])
//   return {
//     entityIds,
//   }
// }

export const useAllDuelistsIds = () => {
  const entities = useDuelistStore((state) => state.entities)
  const duelistIds = useMemo(() => Object.values(entities).map(e => BigInt(e.models.pistols.Duelist.duelist_id)), [entities])
  return {
    duelistIds,
  }
}

const useDuelistProfile = (duelist: models.Duelist) => {
  const { variant, value } = useMemo(() => parseCustomEnum<constants.DuelistProfile, DuelistProfileKey>(duelist?.duelist_profile), [duelist])
  const profileType: constants.DuelistProfile = variant;  // ex: GenesisKey
  const profileKey: DuelistProfileKey = value;            // ex: GenesisKey::Duke

  const profileCollection: constants.CollectionDescription = useMemo(() => getCollectionDescription(profileType), [profileType])
  const profileDescription: constants.ProfileDescription = useMemo(() => getProfileDescription(profileType, profileKey), [profileType, profileKey])
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

  const timestampRegistered = useMemo(() => Number(duelist?.timestamps.registered ?? 0), [duelist])
  const timestampActive = useMemo(() => Number(duelist?.timestamps.active ?? 0), [duelist])
  const exists = useMemo(() => Boolean(timestampRegistered), [timestampRegistered])

  // inactivity
  const { clientTimestamp } = useClientTimestamp()
  // sync with duelist_token.inactive_timestamp()
  const inactiveTimestamp = useMemo(() => (clientTimestamp - timestampActive), [timestampActive, clientTimestamp])
  // sync with duelist_token.is_inactive()
  const isInactive = useMemo(() => (timestampActive > 0 && (inactiveTimestamp > constants.FAME.MAX_INACTIVE_TIMESTAMP)), [timestampActive, inactiveTimestamp])
  // sync with duelist_token.inactive_fame_dripped()
  const inactiveFameDripped = useMemo(() => (
    !isInactive ? 0 : ((BigInt(inactiveTimestamp) - constants.FAME.MAX_INACTIVE_TIMESTAMP) / constants.FAME.TIMESTAMP_TO_DRIP_ONE_FAME) * constants.CONST.ETH_TO_WEI
  ), [isInactive, inactiveTimestamp])

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
  } = useDuelistProfile(duelist)

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
    inactiveFameDripped,
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

  const { notDuelingIds, duellingIds, duelPerDuelists } = useMemo(() => {
    const notDuelingIds: BigNumberish[] = []
    const duellingIds: BigNumberish[] = []
    const duelPerDuelists: Record<string, BigNumberish> = {}
    alive_entities.forEach(entityId => {
      const challenge = getEntityModel(entities[entityId], 'DuelistAssignment')
      const duelist_id = bigintToHex(challenge?.duelist_id ?? getEntityModel(entities[entityId], 'Duelist').duelist_id)
      if (isPositiveBigint(challenge?.duel_id)) {
        duellingIds.push(duelist_id)
        duelPerDuelists[duelist_id] = bigintToHex(challenge.duel_id)
      } else {
        notDuelingIds.push(duelist_id)
      }
    })
    return {
      notDuelingIds: notDuelingIds.sort((a, b) => Number(BigInt(a) - BigInt(b))),
      duellingIds: duellingIds.sort((a, b) => Number(BigInt(a) - BigInt(b))),
      duelPerDuelists,
    }
  }, [alive_entities])

  return {
    notDuelingIds,    // duelist_ids who are not duelling
    duellingIds,      // duelist_ids who are duelling
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
  const calldata = useMemoGate(() => getCustomEnumCalldata(_enum), [_enum])
  const entityId = useMemoGate(() => (keysToEntityId([address, ...calldata])), [address, calldata])
  return entityId
}

export const useDuelistStack = (duelist_id: BigNumberish) => {
  // get duelist profile
  const duelistEntities = useDuelistStore((state) => state.entities)
  const duelist = useStoreModelsByKeys<models.Duelist>(duelistEntities, 'Duelist', [duelist_id])
  const {
    profileType,
    profileId,
  } = useDuelistProfile(duelist)

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
  const query = useMemo(() => {
    if (!player_address) return null;
    const builder = new PistolsQueryBuilder();
    builder
      .withEntityModels(['pistols-PlayerDuelistStack'])
      .withClause(
        new PistolsClauseBuilder()
          .where('pistols-PlayerDuelistStack', 'player_address', 'Eq', player_address)
          .build()
      )
      .withLimit(100) //TODO adjust later or remove?
      .includeHashedKeys();
    return builder;
  }, [player_address]);

  const { entities, isLoading } = useSdkEntitiesGetState({
    query,
    enabled: Boolean(query),
  });

  const playerStacks = useEntitiesModel<models.PlayerDuelistStack>(entities, 'PlayerDuelistStack')

  const stacks = useMemo(() => {
    if (!playerStacks || !player_address) return [];
    return playerStacks.map(stack => {
      if (!stack.active_duelist_id) return null;
      return {
        activeDuelistId: stack.active_duelist_id,
        stackedIds: stack.stacked_ids,
        level: Number(stack.level ?? 0),
      };
    }).filter(Boolean);
  }, [playerStacks, player_address]);

  return {
    stacks,
    isLoading,
  };
}

export const usePlayerDuelistsOrganized = () => {
  const { address } = useAccount();
  const { stacks, isLoading } = useDuelistStacks(address)
  const { duelistIds } = useDuelistsOfPlayer()
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
  }, [stacks, entities, duelistIds])

  return {
    ...organizedDuelists,
    isLoading
  }
}