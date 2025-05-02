import { BigNumberish } from 'starknet'
import { bigintToHex } from 'src/utils/misc/types'
import {
  DuelistProfile,
  ProfileDescription,
  CharacterProfile,
  BotProfile,
  GenesisProfile,
  COLLECTIONS,
  GENESIS_PROFILES,
  CHARACTER_PROFILES,
  BOT_PROFILES,
  CollectionDescription,
  getGenesisProfileValue,
  getCharacterProfileValue,
  getBotProfileValue,
  getGenesisProfileFromValue,
  getCharacterProfileFromValue,
  getBotProfileFromValue,
} from '../generated/constants'


//------------------------------------------
// (duelist_profile.cairo)
//

export type DuelistProfileKey = GenesisProfile | CharacterProfile | BotProfile;

export const makeProfilePicUrl = (profileId: number | null, profileType = DuelistProfile.Genesis) => {
  const collection = getCollectionDescription(profileType);
  return `/profiles/${collection.folder_name}/${('00' + profileId.toString()).slice(-2)}.jpg`;
}

export const getCollectionDescription = (profile: DuelistProfile): CollectionDescription => {
  return COLLECTIONS[profile];
}

export const getProfileId = (profileType: DuelistProfile, profileValue: DuelistProfileKey): number => {
  switch (profileType) {
    case DuelistProfile.Genesis: return getGenesisProfileValue(profileValue as GenesisProfile);
    case DuelistProfile.Character: return getCharacterProfileValue(profileValue as CharacterProfile);
    case DuelistProfile.Bot: return getBotProfileValue(profileValue as BotProfile);
    default: return 0;
  };
}

export const getProfileDescription = (profileType: DuelistProfile, profileValue: DuelistProfileKey | number): ProfileDescription => {
  switch (profileType) {
    case DuelistProfile.Genesis: return GENESIS_PROFILES[typeof profileValue === 'number' ? getGenesisProfileFromValue(profileValue as number) : profileValue as GenesisProfile];
    case DuelistProfile.Character: return CHARACTER_PROFILES[typeof profileValue === 'number' ? getCharacterProfileFromValue(profileValue as number) : profileValue as CharacterProfile];
    case DuelistProfile.Bot: return BOT_PROFILES[typeof profileValue === 'number' ? getBotProfileFromValue(profileValue as number) : profileValue as BotProfile];
    default: return CHARACTER_PROFILES[CharacterProfile.Unknown];
  };
}

export const makeCharacterDuelistId = (profileType: DuelistProfile, profileValue: DuelistProfileKey): BigNumberish => {
  const _getId = (): number => {
    switch (profileType) {
      case DuelistProfile.Genesis: return getGenesisProfileValue(profileValue as GenesisProfile);
      case DuelistProfile.Character: return getCharacterProfileValue(profileValue as CharacterProfile);
      case DuelistProfile.Bot: return getBotProfileValue(profileValue as BotProfile);
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
const characterGenders: Record<CharacterProfile, DuelistGender> = {
  [CharacterProfile.Unknown]: 'Male',
  [CharacterProfile.Bartender]: 'Male',
  [CharacterProfile.Drunkard]: 'Male',
  [CharacterProfile.Devil]: 'Male',
  [CharacterProfile.Player]: 'Male',
};
const botGenders: Record<BotProfile, DuelistGender> = {
  [BotProfile.Unknown]: 'Male',
  [BotProfile.TinMan]: 'Male',
  [BotProfile.Scarecrow]: 'Male',
  [BotProfile.Leon]: 'Male',
};
const genesisGenders: Record<GenesisProfile, DuelistGender> = {
  [GenesisProfile.Unknown]: 'Male',
  [GenesisProfile.Duke]: 'Male',
  [GenesisProfile.Duella]: 'Female',
  [GenesisProfile.Jameson]: 'Male',
  [GenesisProfile.Pilgrim]: 'Male',
  [GenesisProfile.Jack]: 'Male',
  [GenesisProfile.Pops]: 'Male',
  [GenesisProfile.SerWalker]: 'Male',
  [GenesisProfile.Bloberto]: 'Male',
  [GenesisProfile.Squiddo]: 'Male',
  [GenesisProfile.SlenderDuck]: 'Male',
  [GenesisProfile.LadyVengeance]: 'Female',
  [GenesisProfile.Breadman]: 'Male',
  [GenesisProfile.Brutus]: 'Male',
  [GenesisProfile.Pistolopher]: 'Male',
  [GenesisProfile.Secreto]: 'Male',
  [GenesisProfile.ShadowMare]: 'Female',
  [GenesisProfile.Karaku]: 'Male',
  [GenesisProfile.Misty]: 'Female',
  [GenesisProfile.Kenzu]: 'Female',
  [GenesisProfile.NynJah]: 'Male',
  [GenesisProfile.Thrak]: 'Male',
};

export const getProfileGender = (profileType: DuelistProfile, profileValue: DuelistProfileKey): DuelistGender => {
  switch (profileType) {
    case DuelistProfile.Character: return characterGenders[profileValue as CharacterProfile];
    case DuelistProfile.Bot: return botGenders[profileValue as BotProfile];
    case DuelistProfile.Genesis: return genesisGenders[profileValue as GenesisProfile];
    default: return 'Male';
  };
}

