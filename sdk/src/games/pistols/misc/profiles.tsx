import { BigNumberish } from 'starknet'
import { bigintToHex } from 'src/utils/misc/types'
import {
  DuelistProfile,
  ProfileDescription,
  CharacterKey,
  BotKey,
  GenesisKey,
  COLLECTIONS,
  GENESIS_PROFILES,
  CHARACTER_PROFILES,
  BOT_PROFILES,
  CollectionDescription,
  getGenesisKeyValue,
  getCharacterKeyValue,
  getBotKeyValue,
  getGenesisKeyFromValue,
  getCharacterKeyFromValue,
  getBotKeyFromValue,
} from '../generated/constants'


//------------------------------------------
// (duelist_profile.cairo)
//

export type DuelistProfileKey = GenesisKey | CharacterKey | BotKey;

// get numeric ID from profile key (string)
export const getProfileId = (profileType: DuelistProfile, profileKey: DuelistProfileKey): number => {
  switch (profileType) {
    case DuelistProfile.Genesis: return getGenesisKeyValue(profileKey as GenesisKey);
    case DuelistProfile.Character: return getCharacterKeyValue(profileKey as CharacterKey);
    case DuelistProfile.Bot: return getBotKeyValue(profileKey as BotKey);
    default: return 0;
  };
}

// get profile key (string) from numeric ID
export const getProfileKey = (profileType: DuelistProfile, profileId: number): DuelistProfileKey => {
  switch (profileType) {
    case DuelistProfile.Genesis: return getGenesisKeyFromValue(profileId)
    case DuelistProfile.Character: return getCharacterKeyFromValue(profileId);
    case DuelistProfile.Bot: return getBotKeyFromValue(profileId);
    default: return CharacterKey.Unknown;
  };
}


//------------------------------------------
// profile infos
//

export const makeProfilePicUrl = (profileId: number | null, profileType = DuelistProfile.Genesis) => {
  const collection = getCollectionDescription(profileType);
  return `/profiles/${collection.folder_name}/${('00' + profileId.toString()).slice(-2)}.jpg`;
}

export const getCollectionDescription = (profile: DuelistProfile): CollectionDescription => {
  return COLLECTIONS[profile];
}

export const getProfileDescription = (profileType: DuelistProfile, profileKey: DuelistProfileKey): ProfileDescription => {
  switch (profileType) {
    case DuelistProfile.Genesis: return GENESIS_PROFILES[profileKey as GenesisKey];
    case DuelistProfile.Character: return CHARACTER_PROFILES[profileKey as CharacterKey];
    case DuelistProfile.Bot: return BOT_PROFILES[profileKey as BotKey];
    default: return CHARACTER_PROFILES[CharacterKey.Unknown];
  };
}

export const makeCharacterDuelistId = (profileType: DuelistProfile, profileKey: DuelistProfileKey): BigNumberish => {
  const _getId = (): number => {
    switch (profileType) {
      case DuelistProfile.Genesis: return getGenesisKeyValue(profileKey as GenesisKey);
      case DuelistProfile.Character: return getCharacterKeyValue(profileKey as CharacterKey);
      case DuelistProfile.Bot: return getBotKeyValue(profileKey as BotKey);
      default: return 0;
    };
  };
  const collection = getCollectionDescription(profileType);
  return bigintToHex((collection.duelist_id_base | BigInt(_getId())));
}

export const isCharacterDuelistId = (duelistId: BigNumberish): boolean => {
  const base_id = BigInt(duelistId) & ~BigInt('0xffffffff');
  return (base_id == COLLECTIONS.Character.duelist_id_base);
}

export const isBotDuelistId = (duelistId: BigNumberish): boolean => {
  const base_id = BigInt(duelistId) & ~BigInt('0xffffffff');
  return (base_id == COLLECTIONS.Bot.duelist_id_base);
}



//------------------------------------------
// gender per profile (for animations)
//
export type DuelistGender = 'Male' | 'Female' | 'Other';
const characterGenders: Record<CharacterKey, DuelistGender> = {
  [CharacterKey.Unknown]: 'Male',
  [CharacterKey.Bartender]: 'Male',
  [CharacterKey.Drunkard]: 'Male',
  [CharacterKey.Devil]: 'Male',
  [CharacterKey.Player]: 'Male',
};
const botGenders: Record<BotKey, DuelistGender> = {
  [BotKey.Unknown]: 'Male',
  [BotKey.TinMan]: 'Male',
  [BotKey.Scarecrow]: 'Male',
  [BotKey.Leon]: 'Male',
};
const genesisGenders: Record<GenesisKey, DuelistGender> = {
  [GenesisKey.Unknown]: 'Male',
  [GenesisKey.Duke]: 'Male',
  [GenesisKey.Duella]: 'Female',
  [GenesisKey.Jameson]: 'Male',
  [GenesisKey.Pilgrim]: 'Male',
  [GenesisKey.Jack]: 'Male',
  [GenesisKey.Pops]: 'Male',
  [GenesisKey.SerWalker]: 'Male',
  [GenesisKey.Bloberto]: 'Male',
  [GenesisKey.Squiddo]: 'Male',
  [GenesisKey.SlenderDuck]: 'Male',
  [GenesisKey.LadyVengeance]: 'Female',
  [GenesisKey.Breadman]: 'Male',
  [GenesisKey.Brutus]: 'Male',
  [GenesisKey.Pistolopher]: 'Male',
  [GenesisKey.Secreto]: 'Male',
  [GenesisKey.ShadowMare]: 'Female',
  [GenesisKey.Karaku]: 'Male',
  [GenesisKey.Misty]: 'Female',
  [GenesisKey.Kenzu]: 'Female',
  [GenesisKey.NynJah]: 'Male',
  [GenesisKey.Thrak]: 'Male',
};

export const getProfileGender = (profileType: DuelistProfile, profileKey: DuelistProfileKey): DuelistGender => {
  switch (profileType) {
    case DuelistProfile.Character: return characterGenders[profileKey as CharacterKey];
    case DuelistProfile.Bot: return botGenders[profileKey as BotKey];
    case DuelistProfile.Genesis: return genesisGenders[profileKey as GenesisKey];
    default: return 'Male';
  };
}

