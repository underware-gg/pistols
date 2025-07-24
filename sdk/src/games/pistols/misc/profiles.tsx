import { BigNumberish } from 'starknet'
import { bigintToHex } from 'src/utils/misc/types'
import {
  CollectionDescriptor,
  ProfileDescriptor,
  DuelistProfile,
  CharacterKey,
  BotKey,
  GenesisKey,
  LegendsKey,
  getCharacterKeyValue,
  getCharacterKeyFromValue,
  getBotKeyValue,
  getBotKeyFromValue,
  getGenesisKeyValue,
  getGenesisKeyFromValue,
  getLegendsKeyValue,
  getLegendsKeyFromValue,
  COLLECTIONS,
  GENESIS_PROFILES,
  CHARACTER_PROFILES,
  BOT_PROFILES,
  LEGENDS_PROFILES,
} from '../generated/constants'


//------------------------------------------
// (duelist_profile.cairo)
//

export type DuelistProfileKey = GenesisKey | CharacterKey | BotKey | LegendsKey;

// get numeric ID from profile key (string)
export const getProfileId = (profileType: DuelistProfile, profileKey: DuelistProfileKey): number => {
  switch (profileType) {
    case DuelistProfile.Genesis: return getGenesisKeyValue(profileKey as GenesisKey);
    case DuelistProfile.Character: return getCharacterKeyValue(profileKey as CharacterKey);
    case DuelistProfile.Bot: return getBotKeyValue(profileKey as BotKey);
    case DuelistProfile.Legends: return getLegendsKeyValue(profileKey as LegendsKey);
    default: return 0;
  };
}

// get profile key (string) from numeric ID
export const getProfileKey = (profileType: DuelistProfile, profileId: number): DuelistProfileKey => {
  switch (profileType) {
    case DuelistProfile.Genesis: return getGenesisKeyFromValue(profileId)
    case DuelistProfile.Character: return getCharacterKeyFromValue(profileId);
    case DuelistProfile.Bot: return getBotKeyFromValue(profileId);
    case DuelistProfile.Legends: return getLegendsKeyFromValue(profileId);
    default: return CharacterKey.Unknown;
  };
}


//------------------------------------------
// profile infos
//

export const makeProfilePicUrl = (profileId: number | null, profileType = DuelistProfile.Genesis) => {
  const collection = getCollectionDescriptor(profileType);
  return `/profiles/${collection.folder_name}/${('00' + profileId.toString()).slice(-2)}.jpg`;
}

export const getCollectionDescriptor = (profile: DuelistProfile): CollectionDescriptor => {
  return COLLECTIONS[profile];
}

export const getProfileDescriptor = (profileType: DuelistProfile, profileKey: DuelistProfileKey): ProfileDescriptor => {
  switch (profileType) {
    case DuelistProfile.Genesis: return GENESIS_PROFILES[profileKey as GenesisKey];
    case DuelistProfile.Character: return CHARACTER_PROFILES[profileKey as CharacterKey];
    case DuelistProfile.Bot: return BOT_PROFILES[profileKey as BotKey];
    case DuelistProfile.Legends: return LEGENDS_PROFILES[profileKey as LegendsKey];
    default: return CHARACTER_PROFILES[CharacterKey.Unknown];
  };
}

export const makeCharacterDuelistId = (profileType: DuelistProfile, profileKey: DuelistProfileKey): BigNumberish => {
  const _getId = (): number => {
    switch (profileType) {
      case DuelistProfile.Genesis: return getGenesisKeyValue(profileKey as GenesisKey);
      case DuelistProfile.Character: return getCharacterKeyValue(profileKey as CharacterKey);
      case DuelistProfile.Bot: return getBotKeyValue(profileKey as BotKey);
      case DuelistProfile.Legends: return getLegendsKeyValue(profileKey as LegendsKey);
      default: return 0;
    };
  };
  const collection = getCollectionDescriptor(profileType);
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

const profileKeys: Record<DuelistProfile, DuelistProfileKey[]> = {
  [DuelistProfile.Undefined]: [],
  [DuelistProfile.Character]: Object.keys(CHARACTER_PROFILES).map((k) => k) as CharacterKey[],
  [DuelistProfile.Bot]: Object.keys(BOT_PROFILES).map((k) => k) as BotKey[],
  [DuelistProfile.Genesis]: Object.keys(GENESIS_PROFILES).map((k) => k) as GenesisKey[],
  [DuelistProfile.Legends]: Object.keys(LEGENDS_PROFILES).map((k) => k) as LegendsKey[],
};

export const getCollectionProfileKeys = (profileType: DuelistProfile): DuelistProfileKey[] => {
  return profileKeys[profileType] ?? [];
}



//------------------------------------------
// quotes per profile (for animations)
//
const characterQuotes: Record<CharacterKey, string> = {
  [CharacterKey.Unknown]: "...",
  [CharacterKey.Bartender]: "...",
  [CharacterKey.Drunkard]: "...",
  [CharacterKey.Devil]: "...",
  [CharacterKey.Player]: "...",
};
const botQuotes: Record<BotKey, string> = {
  [BotKey.Unknown]: "...",
  [BotKey.TinMan]: "I don't wanna hurt you, I just wanna know what you sound like when you scream!",
  [BotKey.Scarecrow]: "If you make 'em laugh it's a joke, else, deceit.",
  [BotKey.Leon]: "Being kind ain't never hurt anyone, milord.",
};
const genesisQuotes: Record<GenesisKey, string> = {
  [GenesisKey.Unknown]: "...",
  [GenesisKey.SerWalker]: "Mayst thou find in death the honour thou didst spurn in life, wretch.",
  [GenesisKey.LadyVengeance]: "The dawn doth witness thy foul deceit, and I, her vengeful hand, deliver thee to thy doom.",
  [GenesisKey.Duke]: "Speak once, then shoot once.",
  [GenesisKey.Duella]: "A bitter tongue demands sweet aim.",
  [GenesisKey.Jameson]: "Early couldst thou turn, yet heavy thou shalt fall.",
  [GenesisKey.Misty]: "Thy coin or thy breath, or mayhap both and spare thyself the choosing.",
  [GenesisKey.Karaku]: "Speak not thy challenge, shoot it. For in the stillness between steps, my pistol hath already answered.",
  [GenesisKey.Kenzu]: "If I meant you harm, friend, then why would my pistol be pointed at the ground?",
  [GenesisKey.Pilgrim]: "A jest of a hat, aye, yet with the gift of speech, ‘twould spin a tale to shame the bards.",
  [GenesisKey.Jack]: "Wait, is this LOADED?!",
  [GenesisKey.Pops]: "You are on my naughty list.",
  [GenesisKey.NynJah]: "Do not step into my Dojo unprepared, wanderer.",
  [GenesisKey.Thrak]: "Gird thyself, softling, for by sacred rite of claw and fire, thy life and thine honour are forfeit unto me.",
  [GenesisKey.Bloberto]: "Fine, I'll shoot you in the foot. It's less tedious than watching you do it to yourself.",
  [GenesisKey.Squiddo]: "Blub-blub-blub, splorp-splorp. blub-splorp!!",
  [GenesisKey.SlenderDuck]: "Scoheth shobro blubble quackir!",
  [GenesisKey.Breadman]: "I find your lack of conviction disturbing.",
  [GenesisKey.Groggus]: "Testa vuota.",
  [GenesisKey.Pistolopher]: "I AM CARROT...",
  [GenesisKey.Secreto]: "If you quack a damn word of this, I'll peel you slowly, like a soft fruit.",
  [GenesisKey.ShadowMare]: "No bridle, no whip, no word - only the wind at his side and the will of the wise.",
  [GenesisKey.Fjolnir]: "Þorir þú at reyna örlög þín við mik, fífl? þá muntu finna, at ek em ekki sá sem ek sýnist.",
  [GenesisKey.ChimpDylan]: "I reckon the maker made chimps before men, friend, for we shoot straighter and sin sweeter.",
  [GenesisKey.Hinata]: "With each perfect shot, a soul set free.",
  [GenesisKey.HelixVex]: "Golden eyes see through deceit.",
  [GenesisKey.BuccaneerJames]: "When you're in this deep, there is no way back.",
  [GenesisKey.TheSensei]: "The burned eyes of those who strove remember the light yet.",
  [GenesisKey.SenseiTarrence]: "The bright eyes of the dreamers light the way.",
  [GenesisKey.ThePainter]: "Now lower your pistol. That's perfect, hold that pose.",
  [GenesisKey.Ashe]: "A sharp blade means little without a steady hand.",
  [GenesisKey.SerGogi]: "I just couldn't bear it, if we didn't have a shot together.",
  [GenesisKey.TheSurvivor]: "I duel to die, how about you?",
  [GenesisKey.TheFrenchman]: "Freedom tastes like gunpowder.",
  [GenesisKey.SerFocger]: "I may have come here on my bike, but don't piss me off!",
  [GenesisKey.SillySosij]: "Locked, loaded, well-seasoned.",
  [GenesisKey.BloodBeard]: "Iron speaks when silence won't.",
  [GenesisKey.Fredison]: "Scribbles for schemes, wood for beams, coal for seams, diamonds for dreams... and lead for screams, ahahaha.",
  [GenesisKey.TheBard]: "Giving voice to what the soul cannot speak.",
  [GenesisKey.Ponzimancer]: "Lets flip a coin!",
  [GenesisKey.DealerTani]: "Good sir, for a mere trifle, thou couldst dance with angels 'fore thou fallest.",
  [GenesisKey.SerRichard]: "The old ways taught me honour, the new ways, victory.",
  [GenesisKey.Recipromancer]: "Comfort is the death of joy, so my pistol sings a joyful tune indeed.",
  [GenesisKey.Mataleone]: "My shots speak for me.",
  [GenesisKey.FortunaRegem]: "Fate has a tell. I've watched it long enough to know when it blinks — and when to draw.",
  [GenesisKey.Amaro]: "War scars the soul; art traces the wound.",
  [GenesisKey.Mononoke]: "Careful, I WILL haunt you.",
  [GenesisKey.Parsa]: "Learn which scars to keep and which to let fade.",
  [GenesisKey.Jubilee]: "No man has ever crossed me and lived to morning.",
  [GenesisKey.LadyOfCrows]: "Beauty is but the bait, sweet fool. My crows feast well upon eyes that linger too long.",
  [GenesisKey.BananaDuke]: "Loaded with potassium and wrath.",
  [GenesisKey.LordGladstone]: "Before we water the sweet soil with our blood, first bury me in it.",
  [GenesisKey.LadyStrokes]: "A mirror may lie, but my pistol always sings true.",
  [GenesisKey.Bliss]: "Kiss me and steal my breath, ‘fore I steal thine.",
  [GenesisKey.StormMirror]: "Name thy fear, and I shall wear it as a cloak.",
  [GenesisKey.Aldreda]: "The world carved it's lies into my skin, so I learned to answer with smoke and lead.",
  [GenesisKey.Petronella]: "If the world insists on being serious, I shall simply outshine it in color and chaos.",
  [GenesisKey.SeraphinaRose]: "“Elegance is not the absence of strength, but the artful concealment of it.”",
  [GenesisKey.LucienDeSombrel]: "I do not thirst for blood. I savor vengeance, warm and slow, with every shattered vow.",
  [GenesisKey.FyernVirelock]: "The moon does not command me. It is I that welcomes the beast.",
  [GenesisKey.Noir]: "Deceit casts a shadow.",
  [GenesisKey.QueenAce]: "A maiden's aim never draws afar.",
  [GenesisKey.JoshPeel]: "Don't slip on my peel, nerd!",
  [GenesisKey.IronHandRogan]: "I take ten paces not for coin, nor pride, but for the honour they thought a man like me could never hold.",
  [GenesisKey.GoodPupStarky]: "Woof woof! Come back, I want to play with you!",
  [GenesisKey.ImyaSuspect]: "I tire of killing, but I'll not hesitate to kill one more, if you step any closer.",
  [GenesisKey.TheAlchemist]: "I mastered the secret of turning lead to gold, and now gold to ash. Let it all burn.",
  [GenesisKey.PonziusPilate]: "I became a king by letting fools crown themselves, and a mirror when their fortune crumbled.",
  [GenesisKey.MistressNoodle]: "I am bound by sauce and prophecy.",
  [GenesisKey.MasterOfSecrets]: "The web that I spin is not of secrets, but of integrity.",
};
const legendsQuotes: Record<LegendsKey, string> = {
  [LegendsKey.Unknown]: "...",
  [LegendsKey.TGC1]: "Gold buys lead, lead buys death, death buys gold, so give me your gold, or die.",
  // [LegendsKey.TGC2]: "Whether by grape or grapeshot, the soil will drink its fill of red this angry morn.",
};

export const getProfileQuote = (profileType: DuelistProfile, profileKey: DuelistProfileKey): string => {
  switch (profileType) {
    case DuelistProfile.Character: return characterQuotes[profileKey as CharacterKey];
    case DuelistProfile.Bot: return botQuotes[profileKey as BotKey];
    case DuelistProfile.Genesis: return genesisQuotes[profileKey as GenesisKey];
    case DuelistProfile.Legends: return legendsQuotes[profileKey as LegendsKey];
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
  [BotKey.Scarecrow]: 'Female',
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
const legendsGenders: Record<LegendsKey, DuelistGender> = {
  [LegendsKey.Unknown]: 'Male',
  [LegendsKey.TGC1]: 'Male',
  // [LegendsKey.TGC2]: 'Male',
};

export const getProfileGender = (profileType: DuelistProfile, profileKey: DuelistProfileKey): DuelistGender => {
  switch (profileType) {
    case DuelistProfile.Character: return characterGenders[profileKey as CharacterKey];
    case DuelistProfile.Bot: return botGenders[profileKey as BotKey];
    case DuelistProfile.Genesis: return genesisGenders[profileKey as GenesisKey];
    case DuelistProfile.Legends: return legendsGenders[profileKey as LegendsKey];
    default: return 'Male';
  };
}

