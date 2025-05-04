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
// quotes per profile (for animations)
//
const characterQuotes: Record<CharacterKey, string> = {
  [CharacterKey.Unknown]: '...',
  [CharacterKey.Bartender]: '...',
  [CharacterKey.Drunkard]: '...',
  [CharacterKey.Devil]: '...',
  [CharacterKey.Player]: '...',
};
const botQuotes: Record<BotKey, string> = {
  [BotKey.Unknown]: '...',
  [BotKey.TinMan]: '...',
  [BotKey.Scarecrow]: '...',
  [BotKey.Leon]: '...',
};
const genesisQuotes: Record<GenesisKey, string> = {
  [GenesisKey.Unknown]: '...',
  [GenesisKey.SerWalker]: '...',
  [GenesisKey.LadyVengeance]: '...',
  [GenesisKey.Duke]: 'Speak once, then shoot once.',
  [GenesisKey.Duella]: 'A bitter tongue demands sweet aim.',
  [GenesisKey.Jameson]: '...',
  [GenesisKey.Misty]: '...',
  [GenesisKey.Karaku]: '...',
  [GenesisKey.Kenzu]: '...',
  [GenesisKey.Pilgrim]: '...',
  [GenesisKey.Jack]: 'Wait, is this LOADED?!',
  [GenesisKey.Pops]: '...',
  [GenesisKey.NynJah]: '...',
  [GenesisKey.Thrak]: '...',
  [GenesisKey.Bloberto]: '...',
  [GenesisKey.Squiddo]: '...',
  [GenesisKey.SlenderDuck]: '...',
  [GenesisKey.Breadman]: 'I find your lack of conviction disturbing.',
  [GenesisKey.Groggus]: '...',
  [GenesisKey.Pistolopher]: '...',
  [GenesisKey.Secreto]: '...',
  [GenesisKey.ShadowMare]: '...',
  [GenesisKey.Fjolnir]: '...',
  [GenesisKey.ChimpDylan]: '...',
  [GenesisKey.Hinata]: 'With each perfect shot, a soul set free.',
  [GenesisKey.HelixVex]: 'Golden eyes see through deceit.',
  [GenesisKey.BuccaneerJames]: '...',
  [GenesisKey.TheSensei]: 'The burned eyes of those who strove remember the light yet.',
  [GenesisKey.SenseiTarrence]: 'The bright eyes of the dreamers light the way.',
  [GenesisKey.ThePainter]: 'Now lower your pistol. That\'s perfect, hold that pose.',
  [GenesisKey.Ashe]: '...',
  [GenesisKey.SerGogi]: '...',
  [GenesisKey.TheSurvivor]: 'I duel to die, about about you?',
  [GenesisKey.TheFrenchman]: 'Freedom tastes like gunpowder.',
  [GenesisKey.SerFocger]: '...',
  [GenesisKey.SillySosij]: 'Locked, loaded, well-seasoned.',
  [GenesisKey.BloodBeard]: 'Iron speaks when silence won’t.',
  [GenesisKey.Fredison]: '...',
  [GenesisKey.TheBard]: '...',
  [GenesisKey.Ponzimancer]: '...',
  [GenesisKey.DealerTani]: '...',
  [GenesisKey.SerRichard]: '...',
  [GenesisKey.Recipromancer]: '...',
  [GenesisKey.Mataleone]: '...',
  [GenesisKey.FortunaRegem]: '...',
  [GenesisKey.Amaro]: '...',
  [GenesisKey.Mononoke]: '...',
  [GenesisKey.Parsa]: '...',
  [GenesisKey.Jubilee]: '...',
  [GenesisKey.LadyOfCrows]: '...',
  [GenesisKey.BananaDuke]: 'Loaded with potassium and wrath.',
  [GenesisKey.LordGladstone]: 'Before we water the sweet soil with our blood, first bury me in it.',
  [GenesisKey.LadyStrokes]: 'A mirror may lie, but my pistol always sings true.',
  [GenesisKey.Bliss]: '...',
  [GenesisKey.StormMirror]: '...',
  [GenesisKey.Aldreda]: 'The world carved it\'s lies into my skin, so I learned to answer with smoke and lead.',
  [GenesisKey.Petronella]: 'If the world insists on being serious, I shall simply outshine it in color and chaos.',
  [GenesisKey.SeraphinaRose]: '“Elegance is not the absence of strength, but the artful concealment of it.”',
  [GenesisKey.LucienDeSombrel]: 'I do not thirst for blood. I savor vengeance, warm and slow, with every shattered vow.',
  [GenesisKey.FyernVirelock]: 'The moon does not command me. It is I that welcomes the beast.',
  [GenesisKey.Noir]: 'Deceit casts a shadow.',
  [GenesisKey.QueenAce]: 'A maiden\'s aim never draws afar.',
  [GenesisKey.JoshPeel]: 'Don\'t slip on my peel, nerd!',
  [GenesisKey.IronHandRogan]: '...',
  [GenesisKey.GoodPupStarky]: '...',
  [GenesisKey.ImyaSuspect]: '...',
  [GenesisKey.TheAlchemist]: '...',
  [GenesisKey.PonziusPilate]: '...',
  [GenesisKey.MistressNoodle]: '...',
  [GenesisKey.MasterOfSecrets]: '...',
};

export const getProfileQuote = (profileType: DuelistProfile, profileKey: DuelistProfileKey): string => {
  switch (profileType) {
    case DuelistProfile.Character: return characterQuotes[profileKey as CharacterKey];
    case DuelistProfile.Bot: return botQuotes[profileKey as BotKey];
    case DuelistProfile.Genesis: return genesisQuotes[profileKey as GenesisKey];
    default: return 'Male';
  };
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
  [GenesisKey.SerWalker]: 'Male',
  [GenesisKey.LadyVengeance]: 'Female',
  [GenesisKey.Duke]: 'Male',
  [GenesisKey.Duella]: 'Female',
  [GenesisKey.Jameson]: 'Male',
  [GenesisKey.Misty]: 'Female',
  [GenesisKey.Karaku]: 'Male',
  [GenesisKey.Kenzu]: 'Female',
  [GenesisKey.Pilgrim]: 'Male',
  [GenesisKey.Jack]: 'Male',
  [GenesisKey.Pops]: 'Male',
  [GenesisKey.NynJah]: 'Male',
  [GenesisKey.Thrak]: 'Male',
  [GenesisKey.Bloberto]: 'Male',
  [GenesisKey.Squiddo]: 'Male',
  [GenesisKey.SlenderDuck]: 'Male',
  [GenesisKey.Breadman]: 'Male',
  [GenesisKey.Groggus]: 'Male',
  [GenesisKey.Pistolopher]: 'Male',
  [GenesisKey.Secreto]: 'Male',
  [GenesisKey.ShadowMare]: 'Female',
  [GenesisKey.Fjolnir]: 'Male',
  [GenesisKey.ChimpDylan]: 'Male',
  [GenesisKey.Hinata]: 'Female',
  [GenesisKey.HelixVex]: 'Male',
  [GenesisKey.BuccaneerJames]: 'Male',
  [GenesisKey.TheSensei]: 'Male',
  [GenesisKey.SenseiTarrence]: 'Male',
  [GenesisKey.ThePainter]: 'Male',
  [GenesisKey.Ashe]: 'Male',
  [GenesisKey.SerGogi]: 'Male',
  [GenesisKey.TheSurvivor]: 'Male',
  [GenesisKey.TheFrenchman]: 'Male',
  [GenesisKey.SerFocger]: 'Male',
  [GenesisKey.SillySosij]: 'Male',
  [GenesisKey.BloodBeard]: 'Male',
  [GenesisKey.Fredison]: 'Male',
  [GenesisKey.TheBard]: 'Male',
  [GenesisKey.Ponzimancer]: 'Male',
  [GenesisKey.DealerTani]: 'Male',
  [GenesisKey.SerRichard]: 'Male',
  [GenesisKey.Recipromancer]: 'Male',
  [GenesisKey.Mataleone]: 'Male',
  [GenesisKey.FortunaRegem]: 'Male',
  [GenesisKey.Amaro]: 'Male',
  [GenesisKey.Mononoke]: 'Female',
  [GenesisKey.Parsa]: 'Male',
  [GenesisKey.Jubilee]: 'Male',
  [GenesisKey.LadyOfCrows]: 'Female',
  [GenesisKey.BananaDuke]: 'Male',
  [GenesisKey.LordGladstone]: 'Male',
  [GenesisKey.LadyStrokes]: 'Female',
  [GenesisKey.Bliss]: 'Female',
  [GenesisKey.StormMirror]: 'Male',
  [GenesisKey.Aldreda]: 'Female',
  [GenesisKey.Petronella]: 'Female',
  [GenesisKey.SeraphinaRose]: 'Female',
  [GenesisKey.LucienDeSombrel]: 'Male',
  [GenesisKey.FyernVirelock]: 'Male',
  [GenesisKey.Noir]: 'Male',
  [GenesisKey.QueenAce]: 'Female',
  [GenesisKey.JoshPeel]: 'Male',
  [GenesisKey.IronHandRogan]: 'Male',
  [GenesisKey.GoodPupStarky]: 'Male',
  [GenesisKey.ImyaSuspect]: 'Male',
  [GenesisKey.TheAlchemist]: 'Male',
  [GenesisKey.PonziusPilate]: 'Male',
  [GenesisKey.MistressNoodle]: 'Female',
  [GenesisKey.MasterOfSecrets]: 'Male',
};

export const getProfileGender = (profileType: DuelistProfile, profileKey: DuelistProfileKey): DuelistGender => {
  switch (profileType) {
    case DuelistProfile.Character: return characterGenders[profileKey as CharacterKey];
    case DuelistProfile.Bot: return botGenders[profileKey as BotKey];
    case DuelistProfile.Genesis: return genesisGenders[profileKey as GenesisKey];
    default: return 'Male';
  };
}

