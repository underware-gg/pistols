
//--------------------------
// DuelistProfile
//
#[derive(Copy, Drop, Serde, PartialEq, Introspect)]
pub enum DuelistProfile {
    Undefined,
    Character: CharacterKey,    // Character(id)
    Bot: BotKey,                // Bot(id)
    Genesis: GenesisKey,        // Genesis(id)
    // Eternum: u16,   // Eternum(realm id)
}

//--------------------------
// Profiles
//
#[derive(Copy, Drop, Serde, PartialEq, Introspect)]
pub enum CharacterKey {
    Unknown,
    Bartender,
    Drunkard,
    Devil,
    Player,
}

#[derive(Copy, Drop, Serde, PartialEq, Introspect)]
pub enum BotKey {
    Unknown,
    TinMan,
    Scarecrow,
    Leon,
}

#[derive(Copy, Drop, Serde, PartialEq, Introspect)]
pub enum GenesisKey {
    Unknown,
    Duke,
    Duella,
    Jameson,
    Pilgrim,
    Jack,
    Pops,
    SerWalker,
    Bloberto,
    Squiddo,
    SlenderDuck,
    LadyVengeance,
    Breadman,
    Brutus,
    Pistolopher,
    Secreto,
    ShadowMare,
    Karaku,
    Misty,
    Kenzu,
    NynJah,
    Thrak,
}



//--------------------------
// Collection Descriptions
//
#[derive(Copy, Drop, Serde, Default)]
pub struct CollectionDescription {
    pub name: felt252,          // @generateContants:shortstring
    pub folder_name: felt252,   // @generateContants:shortstring
    pub profile_count: u8,      // number of profiles in the collection
    pub is_playable: bool,      // playes can use
    pub duelist_id_base: u128,  // for characters (tutorials) and practice bots
}

// to be exported to typescript by generateConstants
// IMPORTANT: names must be in sync with enum DuelistProfile
mod COLLECTIONS {
    use super::{CollectionDescription};
    pub const Undefined: CollectionDescription = CollectionDescription {
        name: 'Undefined',
        folder_name: 'undefined',
        profile_count: 0,
        is_playable: false,
        duelist_id_base: 0,
    };
    pub const Character: CollectionDescription = CollectionDescription {
        name: 'Tavern Characters',
        folder_name: 'characters',
        profile_count: 4,
        is_playable: false,
        duelist_id_base: 0x100000000,
    };
    pub const Bot: CollectionDescription = CollectionDescription {
        name: 'Practice bots',
        folder_name: 'bots',
        profile_count: 3,
        is_playable: false,
        duelist_id_base: 0x200000000,
    };
    pub const Genesis: CollectionDescription = CollectionDescription {
        name: 'Genesis Collection',
        folder_name: 'genesis',
        profile_count: 21,
        is_playable: true,
        duelist_id_base: 0,
    };
}



//--------------------------
// Profile Descriptions
//
#[derive(Copy, Drop, Serde, Default)]
pub struct ProfileDescription {
    pub name: felt252, // @generateContants:shortstring
}

// IMPORTANT: names must be in sync with enum CharacterKey
mod CHARACTER_PROFILES {
    use super::{ProfileDescription};
    pub const Unknown: ProfileDescription = ProfileDescription {
        name: 'Unknown',
    };
    pub const Bartender: ProfileDescription = ProfileDescription {
        name: 'Bartender',
    };
    pub const Drunkard: ProfileDescription = ProfileDescription {
        name: 'Drunkard',
    };
    pub const Devil: ProfileDescription = ProfileDescription {
        name: 'Devil',
    };
    pub const Player: ProfileDescription = ProfileDescription {
        name: 'Stranger',
    };
}

// IMPORTANT: names must be in sync with enum BotKey
mod BOT_PROFILES {
    use super::{ProfileDescription};
    pub const Unknown: ProfileDescription = ProfileDescription {
        name: 'Unknown',
    };
    pub const TinMan: ProfileDescription = ProfileDescription {
        name: 'Tin Man',
    };
    pub const Scarecrow: ProfileDescription = ProfileDescription {
        name: 'Scarecrow',
    };
    pub const Leon: ProfileDescription = ProfileDescription {
        name: 'Leon',
    };
}

// to be exported to typescript by generateConstants
// IMPORTANT: names must be in sync with enum GenesisKey
mod GENESIS_PROFILES {
    use super::{ProfileDescription};
    pub const Unknown: ProfileDescription = ProfileDescription {
        name: 'Unknown',
    };
    pub const Duke: ProfileDescription = ProfileDescription {
        name: 'Duke',
    };
    pub const Duella: ProfileDescription = ProfileDescription {
        name: 'Duella',
    };
    pub const Jameson: ProfileDescription = ProfileDescription {
        name: 'Jameson',
    };
    pub const Pilgrim: ProfileDescription = ProfileDescription {
        name: 'Pilgrim',
    };
    pub const Jack: ProfileDescription = ProfileDescription {
        name: 'Jack',
    };
    pub const Pops: ProfileDescription = ProfileDescription {
        name: 'Pops',
    };
    pub const SerWalker: ProfileDescription = ProfileDescription {
        name: 'Ser Walker',
    };
    pub const Bloberto: ProfileDescription = ProfileDescription {
        name: 'Bloberto',
    };
    pub const Squiddo: ProfileDescription = ProfileDescription {
        name: 'Squiddo',
    };
    pub const SlenderDuck: ProfileDescription = ProfileDescription {
        name: 'Slender Duck',
    };
    pub const LadyVengeance: ProfileDescription = ProfileDescription {
        name: 'Lady Vengeance',
    };
    pub const Breadman: ProfileDescription = ProfileDescription {
        name: 'Breadman',
    };
    pub const Brutus: ProfileDescription = ProfileDescription {
        name: 'Brutus',
    };
    pub const Pistolopher: ProfileDescription = ProfileDescription {
        name: 'Pistolopher',
    };
    pub const Secreto: ProfileDescription = ProfileDescription {
        name: 'Secreto',
    };
    pub const ShadowMare: ProfileDescription = ProfileDescription {
        name: 'Shadow Mare',
    };
    pub const Karaku: ProfileDescription = ProfileDescription {
        name: 'Karaku',
    };
    pub const Misty: ProfileDescription = ProfileDescription {
        name: 'Misty',
    };
    pub const Kenzu: ProfileDescription = ProfileDescription {
        name: 'Kenzu',
    };
    pub const NynJah: ProfileDescription = ProfileDescription {
        name: 'Nyn Jah',
    };
    pub const Thrak: ProfileDescription = ProfileDescription {
        name: 'Thrak',
    };
}




//----------------------------------
// Traits
//
use core::num::traits::Zero;
use pistols::models::duelist::{Duelist, DuelistTimestamps};
use pistols::libs::store::{Store, StoreTrait};
use pistols::utils::short_string::{ShortStringTrait};
use pistols::utils::misc::{FeltToLossy};

#[generate_trait]
pub impl ProfileManagerImpl of ProfileManagerTrait {
    fn initialize(ref store: Store, sample: DuelistProfile) {
        let profiles: Span<DuelistProfile> = Self::_get_all_profiles_by_type(sample);
        let mut i: u8 = 0;
        while (i.into() < profiles.len()) {
            let duelist_profile: DuelistProfile = *profiles.at((i).into());
            let timestamp: u64 = starknet::get_block_timestamp();
            store.set_duelist(@Duelist {
                duelist_id: duelist_profile.make_duelist_id(),
                duelist_profile,
                timestamps: DuelistTimestamps {
                    registered: timestamp,
                    active: 0,
                },
                status: Default::default(),
            });
            i += 1;
        };
    }
    fn randomize_profile(sample: DuelistProfile, seed: felt252) -> DuelistProfile {
        let collection: CollectionDescription = sample.collection();
        let profile_id: u8 = (seed.to_u8_lossy() % collection.profile_count) + 1;
        (match sample {
            DuelistProfile::Undefined =>        DuelistProfile::Undefined,
            DuelistProfile::Character(_) =>     DuelistProfile::Character(profile_id.into()),
            DuelistProfile::Bot(_) =>           DuelistProfile::Bot(profile_id.into()),
            DuelistProfile::Genesis(_) =>       DuelistProfile::Genesis(profile_id.into()),
        })
    }

    //----------------------------------
    // Internal / testing
    //
    fn _get_all_profiles_by_type(sample: DuelistProfile) -> Span<DuelistProfile> {
        let mut result: Array<DuelistProfile> = array![];
        let mut i: u8 =     1;
        loop {
            let profile: DuelistProfile = match sample {
                DuelistProfile::Undefined =>        DuelistProfile::Undefined,
                DuelistProfile::Character(_) =>     DuelistProfile::Character(i.into()),
                DuelistProfile::Bot(_) =>           DuelistProfile::Bot(i.into()),
                DuelistProfile::Genesis(_) =>       DuelistProfile::Genesis(i.into()),
            };
            if (!profile.exists()) {
                break;
            };
            result.append(profile);
            i += 1;
        };
        (result.span())
    }
    fn _get_all_descriptions_by_type(sample: DuelistProfile) -> Span<ProfileDescription> {
        let mut result: Array<ProfileDescription> = array![];
        let mut i: u8 = 1;
        loop {
            let profile: DuelistProfile = match sample {
                DuelistProfile::Undefined =>        DuelistProfile::Undefined,
                DuelistProfile::Character(_) =>     DuelistProfile::Character(i.into()),
                DuelistProfile::Bot(_) =>           DuelistProfile::Bot(i.into()),
                DuelistProfile::Genesis(_) =>       DuelistProfile::Genesis(i.into()),
            };
            if (!profile.exists()) {
                break;
            };
            result.append(profile.description());
            i += 1;
        };
        (result.span())
    }
}

#[generate_trait]
pub impl DuelistProfileImpl of DuelistProfileTrait {
    fn collection(self: @DuelistProfile) -> CollectionDescription {
        (*self).into()
    }
    fn description(self: @DuelistProfile) -> ProfileDescription {
        (match *self {
            DuelistProfile::Undefined =>        CHARACTER_PROFILES::Unknown,
            DuelistProfile::Character(key) =>   key.into(),
            DuelistProfile::Bot(key) =>         key.into(),
            DuelistProfile::Genesis(key) =>     key.into(),
        })
    }
    fn profile_id(self: @DuelistProfile) -> u8 {
        (match *self {
            DuelistProfile::Undefined =>        0,
            DuelistProfile::Character(key) =>   key.into(),
            DuelistProfile::Bot(key) =>         key.into(),
            DuelistProfile::Genesis(key) =>     key.into(),
        })
    }
    fn exists(self: @DuelistProfile) -> bool {
        (self.profile_id() != 0)
    }
    fn make_duelist_id(self: @DuelistProfile) -> u128 {
        (match *self {
            DuelistProfile::Character(key) =>   key.into(),
            DuelistProfile::Bot(key) =>         key.into(),
            _ => 0,
        })
    }
    fn name(self: @DuelistProfile) -> ByteArray {
        let desc: ProfileDescription = self.description();
        (desc.name.to_string())
    }
    fn get_uri(self: @DuelistProfile,
        base_uri: ByteArray,
    ) -> ByteArray {
        let folder_name: ByteArray = self.collection().folder_name.to_string();
        let profile_id: u8 = self.profile_id();
        let number = if (profile_id < 10) {format!("0{}", profile_id)} else {format!("{}", profile_id)};
        (format!("{}/profiles/{}/{}.jpg", base_uri, folder_name, number))
    }
}


//----------------------------------------
// Descriptions
//
impl DuelistProfileIntoCollectionDescription of core::traits::Into<DuelistProfile, CollectionDescription> {
    fn into(self: DuelistProfile) -> CollectionDescription {
        match self {
            DuelistProfile::Undefined =>        COLLECTIONS::Undefined,
            DuelistProfile::Character(_) =>     COLLECTIONS::Character,
            DuelistProfile::Bot(_) =>           COLLECTIONS::Bot,
            DuelistProfile::Genesis(_) =>       COLLECTIONS::Genesis,
        }
    }
}
impl GenesisKeyIntoDescription of core::traits::Into<GenesisKey, ProfileDescription> {
    fn into(self: GenesisKey) -> ProfileDescription {
        match self {
            GenesisKey::Unknown =>          GENESIS_PROFILES::Unknown,
            GenesisKey::Duke =>             GENESIS_PROFILES::Duke,
            GenesisKey::Duella =>           GENESIS_PROFILES::Duella,
            GenesisKey::Jameson =>          GENESIS_PROFILES::Jameson,
            GenesisKey::Pilgrim =>          GENESIS_PROFILES::Pilgrim,
            GenesisKey::Jack =>             GENESIS_PROFILES::Jack,
            GenesisKey::Pops =>             GENESIS_PROFILES::Pops,
            GenesisKey::SerWalker =>        GENESIS_PROFILES::SerWalker,
            GenesisKey::Bloberto =>         GENESIS_PROFILES::Bloberto,
            GenesisKey::Squiddo =>          GENESIS_PROFILES::Squiddo,
            GenesisKey::SlenderDuck =>      GENESIS_PROFILES::SlenderDuck,
            GenesisKey::LadyVengeance =>    GENESIS_PROFILES::LadyVengeance,
            GenesisKey::Breadman =>         GENESIS_PROFILES::Breadman,
            GenesisKey::Brutus =>           GENESIS_PROFILES::Brutus,
            GenesisKey::Pistolopher =>      GENESIS_PROFILES::Pistolopher,
            GenesisKey::Secreto =>          GENESIS_PROFILES::Secreto,
            GenesisKey::ShadowMare =>       GENESIS_PROFILES::ShadowMare,
            GenesisKey::Karaku =>           GENESIS_PROFILES::Karaku,
            GenesisKey::Misty =>            GENESIS_PROFILES::Misty,
            GenesisKey::Kenzu =>            GENESIS_PROFILES::Kenzu,
            GenesisKey::NynJah =>           GENESIS_PROFILES::NynJah,
            GenesisKey::Thrak =>            GENESIS_PROFILES::Thrak,
        }
    }
}
impl CharacterKeyIntoDescription of core::traits::Into<CharacterKey, ProfileDescription> {
    fn into(self: CharacterKey) -> ProfileDescription {
        match self {
            CharacterKey::Unknown =>        CHARACTER_PROFILES::Unknown,
            CharacterKey::Bartender =>      CHARACTER_PROFILES::Bartender,
            CharacterKey::Drunkard =>       CHARACTER_PROFILES::Drunkard,
            CharacterKey::Devil =>          CHARACTER_PROFILES::Devil,
            CharacterKey::Player =>         CHARACTER_PROFILES::Player,
        }
    }
}
impl BotKeyIntoDescription of core::traits::Into<BotKey, ProfileDescription> {
    fn into(self: BotKey) -> ProfileDescription {
        match self {
            BotKey::Unknown =>      BOT_PROFILES::Unknown,
            BotKey::TinMan =>       BOT_PROFILES::TinMan,
            BotKey::Scarecrow =>    BOT_PROFILES::Scarecrow,
            BotKey::Leon =>         BOT_PROFILES::Leon,
        }
    }
}



//----------------------------------------
// profile_id converters
//
impl U8IntoGenesisKey of core::traits::Into<u8, GenesisKey> {
    fn into(self: u8) -> GenesisKey {
        if self == 1        { GenesisKey::Duke }
        else if self == 2   { GenesisKey::Duella }
        else if self == 3   { GenesisKey::Jameson }
        else if self == 4   { GenesisKey::Pilgrim }
        else if self == 5   { GenesisKey::Jack }
        else if self == 6   { GenesisKey::Pops }
        else if self == 7   { GenesisKey::SerWalker }
        else if self == 8   { GenesisKey::Bloberto }
        else if self == 9   { GenesisKey::Squiddo }
        else if self == 10  { GenesisKey::SlenderDuck }
        else if self == 11  { GenesisKey::LadyVengeance }
        else if self == 12  { GenesisKey::Breadman }
        else if self == 13  { GenesisKey::Brutus }
        else if self == 14  { GenesisKey::Pistolopher }
        else if self == 15  { GenesisKey::Secreto }
        else if self == 16  { GenesisKey::ShadowMare }
        else if self == 17  { GenesisKey::Karaku }
        else if self == 18  { GenesisKey::Misty }
        else if self == 19  { GenesisKey::Kenzu }
        else if self == 20  { GenesisKey::NynJah }
        else if self == 21  { GenesisKey::Thrak }
        else                { GenesisKey::Unknown }
    }
}
impl GenesisKeyIntoU8 of core::traits::Into<GenesisKey, u8> {
    fn into(self: GenesisKey) -> u8 {
        match self {
            GenesisKey::Unknown =>          0,
            GenesisKey::Duke =>             1,
            GenesisKey::Duella =>           2,
            GenesisKey::Jameson =>          3,
            GenesisKey::Pilgrim =>          4,
            GenesisKey::Jack =>             5,
            GenesisKey::Pops =>             6,
            GenesisKey::SerWalker =>        7,
            GenesisKey::Bloberto =>         8,
            GenesisKey::Squiddo =>          9,
            GenesisKey::SlenderDuck =>      10,
            GenesisKey::LadyVengeance =>    11,
            GenesisKey::Breadman =>         12,
            GenesisKey::Brutus =>           13,
            GenesisKey::Pistolopher =>      14,
            GenesisKey::Secreto =>          15,
            GenesisKey::ShadowMare =>       16,
            GenesisKey::Karaku =>           17,
            GenesisKey::Misty =>            18,
            GenesisKey::Kenzu =>            19,
            GenesisKey::NynJah =>           20,
            GenesisKey::Thrak =>            21,
        }
    }
}

impl U8IntoCharacterKey of core::traits::Into<u8, CharacterKey> {
    fn into(self: u8) -> CharacterKey {
        if self == 1        { CharacterKey::Bartender }
        else if self == 2   { CharacterKey::Drunkard }
        else if self == 3   { CharacterKey::Devil }
        else if self == 4   { CharacterKey::Player }
        else                { CharacterKey::Unknown }
    }
}
impl CharacterKeyIntoU8 of core::traits::Into<CharacterKey, u8> {
    fn into(self: CharacterKey) -> u8 {
        match self {
            CharacterKey::Unknown =>    0,
            CharacterKey::Bartender =>  1,
            CharacterKey::Drunkard =>   2,
            CharacterKey::Devil =>      3,
            CharacterKey::Player =>     4,
        }
    }
}

impl U8IntoBotKey of core::traits::Into<u8, BotKey> {
    fn into(self: u8) -> BotKey {
        if self == 1        { BotKey::TinMan }
        else if self == 2   { BotKey::Scarecrow }
        else if self == 3   { BotKey::Leon }
        else                { BotKey::Unknown }
    }
}
impl BotKeyIntoU8 of core::traits::Into<BotKey, u8> {
    fn into(self: BotKey) -> u8 {
        match self {
            BotKey::Unknown =>      0,
            BotKey::TinMan =>       1,
            BotKey::Scarecrow =>    2,
            BotKey::Leon =>         3,
        }
    }
}




//----------------------------------------
// Duelist id converters
//
impl CharacterKeyIntoDuelistId of core::traits::Into<CharacterKey, u128> {
    fn into(self: CharacterKey) -> u128 {
        let profile_id: u8 = self.into();
        (if (profile_id.is_non_zero())
            {COLLECTIONS::Character.duelist_id_base + profile_id.into()}
            else {0}
        )
    }
}
impl BotKeyIntoDuelistId of core::traits::Into<BotKey, u128> {
    fn into(self: BotKey) -> u128 {
        let profile_id: u8 = self.into();
        (if (profile_id.is_non_zero())
            {COLLECTIONS::Bot.duelist_id_base + profile_id.into()}
            else {0}
        )
    }
}

impl DuelistIdIntoCharacterKey of core::traits::Into<u128, CharacterKey> {
    fn into(self: u128) -> CharacterKey {
        let id: u128 = self ^ COLLECTIONS::Character.duelist_id_base;
        let id: u8 = if (id < 0xff) { (self & 0xff).try_into().unwrap() } else { 0 };
        (id.into())
    }
}
impl DuelistIdIntoBotKey of core::traits::Into<u128, BotKey> {
    fn into(self: u128) -> BotKey {
        let zero: u128 = self ^ COLLECTIONS::Bot.duelist_id_base;
        let id: u8 = if (zero < 0xff) { (self & 0xff).try_into().unwrap() } else { 0 };
        (id.into())
    }
}





//---------------------------
// String converters
//
impl DuelistProfileIntoByteArray of core::traits::Into<DuelistProfile, ByteArray> {
    fn into(self: DuelistProfile) -> ByteArray {
        match self {
            DuelistProfile::Undefined =>        "Undefined",
            DuelistProfile::Character(_) =>     "Character",
            DuelistProfile::Bot(_) =>           "Bot",
            DuelistProfile::Genesis(_) =>       "Genesis",
        }
    }
}
// for println! format! (core::fmt::Display<>) assert! (core::fmt::Debug<>)
pub impl DuelistProfileDisplay of core::fmt::Display<DuelistProfile> {
    fn fmt(self: @DuelistProfile, ref f: core::fmt::Formatter) -> Result<(), core::fmt::Error> {
        let result = match self {
            DuelistProfile::Undefined =>        format!("Undefined"),
            DuelistProfile::Character(key) =>   { let id: u8 = (*key).into(); format!("Character::{}({})", self.name(), id) },
            DuelistProfile::Bot(key) =>         { let id: u8 = (*key).into(); format!("Bot::{}({})", self.name(), id) },
            DuelistProfile::Genesis(key) =>     { let id: u8 = (*key).into(); format!("Genesis::{}({})", self.name(), id) },
        };
        f.buffer.append(@result);
        Result::Ok(())
    }
}
pub impl DuelistProfileDebug of core::fmt::Debug<DuelistProfile> {
    fn fmt(self: @DuelistProfile, ref f: core::fmt::Formatter) -> Result<(), core::fmt::Error> {
        let result = format!("{}", self);
        f.buffer.append(@result);
        Result::Ok(())
    }
}
pub impl CharacterKeyDebug of core::fmt::Debug<CharacterKey> {
    fn fmt(self: @CharacterKey, ref f: core::fmt::Formatter) -> Result<(), core::fmt::Error> {
        let result: ByteArray = DuelistProfile::Character(*self).name();
        f.buffer.append(@result);
        Result::Ok(())
    }
}
pub impl BotKeyDebug of core::fmt::Debug<BotKey> {
    fn fmt(self: @BotKey, ref f: core::fmt::Formatter) -> Result<(), core::fmt::Error> {
        let result: ByteArray = DuelistProfile::Bot(*self).name();
        f.buffer.append(@result);
        Result::Ok(())
    }
}
pub impl GenesisKeyDebug of core::fmt::Debug<GenesisKey> {
    fn fmt(self: @GenesisKey, ref f: core::fmt::Formatter) -> Result<(), core::fmt::Error> {
        let result: ByteArray = DuelistProfile::Genesis(*self).name();
        f.buffer.append(@result);
        Result::Ok(())
    }
}




//----------------------------------------
// Unit  tests
//
#[cfg(test)]
mod unit {

    use super::{
        DuelistProfile, DuelistProfileTrait,
        GenesisKey, CharacterKey, BotKey,
        ProfileDescription,
        ProfileManagerTrait,
        COLLECTIONS,
    };

    #[test]
    fn test_get_all_profiles_by_type() {
        let profiles: Span<DuelistProfile> = ProfileManagerTrait::_get_all_profiles_by_type(DuelistProfile::Undefined);
        assert_eq!(profiles.len(), 0, "0");
        let profiles: Span<DuelistProfile> = ProfileManagerTrait::_get_all_profiles_by_type(DuelistProfile::Character(0_u8.into()));
        assert_eq!(profiles.len(), COLLECTIONS::Character.profile_count.into(), "racter.profile_");
        let profiles: Span<DuelistProfile> = ProfileManagerTrait::_get_all_profiles_by_type(DuelistProfile::Bot(0_u8.into()));
        assert_eq!(profiles.len(), COLLECTIONS::Bot.profile_count.into(), "Bot.profile_count");
        let profiles: Span<DuelistProfile> = ProfileManagerTrait::_get_all_profiles_by_type(DuelistProfile::Genesis(0_u8.into()));
        assert_eq!(profiles.len(), COLLECTIONS::Genesis.profile_count.into(), "Genesis.profile_count");
    }

    #[test]
    fn test_get_all_descriptions_by_type() {
        let descriptions: Span<ProfileDescription> = ProfileManagerTrait::_get_all_descriptions_by_type(DuelistProfile::Undefined);
        assert_eq!(descriptions.len(), 0, "0");
        let descriptions: Span<ProfileDescription> = ProfileManagerTrait::_get_all_descriptions_by_type(DuelistProfile::Character(0_u8.into()));
        assert_eq!(descriptions.len(), COLLECTIONS::Character.profile_count.into(), "Character.profile_count");
        let descriptions: Span<ProfileDescription> = ProfileManagerTrait::_get_all_descriptions_by_type(DuelistProfile::Bot(0_u8.into()));
        assert_eq!(descriptions.len(), COLLECTIONS::Bot.profile_count.into(), "Bot.profile_count");
        let descriptions: Span<ProfileDescription> = ProfileManagerTrait::_get_all_descriptions_by_type(DuelistProfile::Genesis(0_u8.into()));
        assert_eq!(descriptions.len(), COLLECTIONS::Genesis.profile_count.into(), "Genesis.profile_count");
    }

    //
    // test profiles
    //
    fn _test_invalid_profile(profile: DuelistProfile) {
        assert_eq!(profile.exists(), false, "(0) ! exists");
        let desc: ProfileDescription = profile.description();
        assert_eq!(desc.name, 'Unknown', "(0) bad name: {}", desc.name);
        assert_eq!(profile.make_duelist_id(), 0, "(0) bad duelist_id");
    }

    #[test]
    fn test_descriptions_genesis() {
        // invalid
        let invalid_profile: DuelistProfile = DuelistProfile::Genesis(0_u8.into());
        _test_invalid_profile(invalid_profile);
        // validate profiles
        let descriptions: Span<ProfileDescription> = ProfileManagerTrait::_get_all_descriptions_by_type(invalid_profile);
        let mut last_profile_id: u8 = 0;
        let mut last_desc: ProfileDescription = Default::default();
        let mut p: u8 = 1;
        while (p.into() <= descriptions.len()) {
            let profile: DuelistProfile = DuelistProfile::Genesis(p.into());
            assert!(profile.exists(), "({}) exists", p);
            assert_eq!(profile.make_duelist_id(), 0, "({}) bad duelist_id", p);
            assert_ne!(profile, DuelistProfile::Genesis(GenesisKey::Unknown), "Duelist({}) is Unknown", p);
            assert_eq!(p, profile.profile_id(), "({}) bad p", p);
            assert_eq!(p, last_profile_id + 1, "({}) == ({}): p", p, p-1);
            let desc: ProfileDescription = *descriptions.at((p-1).into());
            assert_ne!(desc.name, last_desc.name, "({}) == ({}): name {}", p, p-1, desc.name);
            last_profile_id = p;
            last_desc = desc;
            p += 1;
        };
    }

    #[test]
    fn test_descriptions_character() {
        // invalid
        let invalid_profile: DuelistProfile = DuelistProfile::Character(0_u8.into());
        _test_invalid_profile(invalid_profile);
        // validate profiles
        let descriptions: Span<ProfileDescription> = ProfileManagerTrait::_get_all_descriptions_by_type(invalid_profile);
        let mut last_profile_id: u8 = 0;
        let mut last_desc: ProfileDescription = Default::default();
        let mut p: u8 = 1;
        while (p.into() <= descriptions.len()) {
            let profile: DuelistProfile = DuelistProfile::Character(p.into());
            assert!(profile.exists(), "({}) exists", p);
            assert_ne!(profile, DuelistProfile::Character(CharacterKey::Unknown), "({}) is Unknown", p);
            assert_eq!(p, profile.profile_id(), "({}) bad p", p);
            assert_eq!(p, last_profile_id + 1, "({}) == ({}): p", p, p-1);
            let desc: ProfileDescription = *descriptions.at((p-1).into());
            assert_ne!(desc.name, last_desc.name, "({}) == ({}): name {}", p, p-1, desc.name);
            last_profile_id = p;
            last_desc = desc;
            p += 1;
        };
    }

    #[test]
    fn test_descriptions_bot() {
        // invalid
        let invalid_profile: DuelistProfile = DuelistProfile::Bot(0_u8.into());
        _test_invalid_profile(invalid_profile);
        // validate profiles
        let descriptions: Span<ProfileDescription> = ProfileManagerTrait::_get_all_descriptions_by_type(invalid_profile);
        let mut last_profile_id: u8 = 0;
        let mut last_desc: ProfileDescription = Default::default();
        let mut p: u8 = 1;
        while (p.into() <= descriptions.len()) {
            let profile: DuelistProfile = DuelistProfile::Bot(p.into());
            assert!(profile.exists(), "({}) exists", p);
            assert_ne!(profile, DuelistProfile::Bot(BotKey::Unknown), "({}) is Unknown", p);
            assert_eq!(p, profile.profile_id(), "({}) bad profile_id", p);
            assert_eq!(p, last_profile_id + 1, "({}) == ({}): profile_id", p, p-1);
            let desc: ProfileDescription = *descriptions.at((p-1).into());
            assert_ne!(desc.name, last_desc.name, "({}) == ({}): name {}", p, p-1, desc.name);
            last_profile_id = p;
            last_desc = desc;
            p += 1;
        };
    }

    #[test]
    fn test_profile_duelist_ids_genesis() {
        assert_eq!(COLLECTIONS::Genesis.duelist_id_base, 0, "bad base id");
        let mut p: u8 = 1;
        while (p <= COLLECTIONS::Genesis.profile_count.into()) {
            let key: GenesisKey = p.into();
            assert_eq!(DuelistProfile::Genesis(key).make_duelist_id(), 0, "({}) bad type_id", p);
            p += 1;
        };
    }

    #[test]
    fn test_profile_duelist_ids_character() {
        assert_gt!(COLLECTIONS::Character.duelist_id_base, 0, "bad base id");
        let mut p: u8 = 1;
        while (p <= COLLECTIONS::Character.profile_count.into()) {
            let key: CharacterKey = p.into();
            let expected_id: u128 = (COLLECTIONS::Character.duelist_id_base | key.into());
            assert_gt!(expected_id, COLLECTIONS::Character.duelist_id_base, "({}) low id", p);
            assert_eq!(expected_id, DuelistProfile::Character(key).make_duelist_id(), "({}) bad type_id", p);
            assert_eq!(expected_id.into(), key, "({}) bad profile", p);
            p += 1;
        };
    }

    #[test]
    fn test_profile_duelist_ids_bot() {
        assert_gt!(COLLECTIONS::Bot.duelist_id_base, 0, "bad base id");
        let mut p: u8 = 1;
        while (p <= COLLECTIONS::Bot.profile_count.into()) {
            let key: BotKey = p.into();
            let expected_id: u128 = (COLLECTIONS::Bot.duelist_id_base | key.into());
            assert_gt!(expected_id, COLLECTIONS::Bot.duelist_id_base, "({}) low id", p);
            assert_eq!(expected_id, DuelistProfile::Bot(key).make_duelist_id(), "({}) bad type_id", p);
            assert_eq!(expected_id.into(), key, "({}) bad profile", p);
            p += 1;
        };
    }

    #[test]
    fn test_profile_duelist_ids_misc() {
        // duelist
        assert_eq!(0_u128.into(), CharacterKey::Unknown, "Character 0");
        assert_eq!(1_u128.into(), CharacterKey::Unknown, "Character 1");
        assert_eq!(1000_u128.into(), CharacterKey::Unknown, "Character 1000");
        assert_eq!(0x121212121231231231241212_u128.into(), CharacterKey::Unknown, "Character 1000");
        assert_eq!(COLLECTIONS::Character.duelist_id_base.into(), CharacterKey::Unknown, "Character CHAR_ID");
        assert_eq!(COLLECTIONS::Bot.duelist_id_base.into(), CharacterKey::Unknown, "Character BOT_ID");
        assert_eq!((COLLECTIONS::Bot.duelist_id_base + 1).into(), CharacterKey::Unknown, "Character BOT_ID+1");
        assert_ne!((COLLECTIONS::Character.duelist_id_base + 1).into(), CharacterKey::Unknown, "Character CHAR_ID+1");
        assert_ne!((COLLECTIONS::Character.duelist_id_base + COLLECTIONS::Character.profile_count.into()).into(), CharacterKey::Unknown, "Character CHAR_ID+COUNT");
        assert_eq!((COLLECTIONS::Character.duelist_id_base + COLLECTIONS::Character.profile_count.into() + 1).into(), CharacterKey::Unknown, "Character CHAR_ID+COUNT+1");
        // bot
        assert_eq!(0_u128.into(), BotKey::Unknown, "Bot 0");
        assert_eq!(1_u128.into(), BotKey::Unknown, "Bot 1");
        assert_eq!(1000_u128.into(), BotKey::Unknown, "Bot 1000");
        assert_eq!(0x121212121231231231241212_u128.into(), BotKey::Unknown, "Bot 1000");
        assert_eq!(COLLECTIONS::Bot.duelist_id_base.into(), BotKey::Unknown, "Bot BOT_ID");
        assert_eq!(COLLECTIONS::Character.duelist_id_base.into(), BotKey::Unknown, "Bot CHAR_ID");
        assert_eq!((COLLECTIONS::Character.duelist_id_base + 1).into(), BotKey::Unknown, "Bot CHAR_ID+1");
        assert_ne!((COLLECTIONS::Bot.duelist_id_base + 1).into(), BotKey::Unknown, "Bot BOT_ID+1");
        assert_ne!((COLLECTIONS::Bot.duelist_id_base + COLLECTIONS::Bot.profile_count.into()).into(), BotKey::Unknown, "Bot BOT_ID+COUNT");
        assert_eq!((COLLECTIONS::Bot.duelist_id_base + COLLECTIONS::Bot.profile_count.into() + 1).into(), BotKey::Unknown, "Bot BOT_ID+COUNT+1");
    }
}
