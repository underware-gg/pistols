
//--------------------------
// DuelistProfile
//
#[derive(Copy, Drop, Serde, PartialEq, Introspect)]
pub enum DuelistProfile {
    Undefined,
    Character: CharacterProfile,    // Character(id)
    Bot: BotProfile,                // Bot(id)
    Genesis: GenesisProfile,        // Genesis(id)
    // Eternum: u16,   // Eternum(realm id)
}

//--------------------------
// Profiles
//
#[derive(Copy, Drop, Serde, PartialEq, Introspect)]
pub enum CharacterProfile {
    Unknown,
    Bartender,
    Drunkard,
    Devil,
    Player,
}

#[derive(Copy, Drop, Serde, PartialEq, Introspect)]
pub enum BotProfile {
    Unknown,
    TinMan,
    Scarecrow,
    Leon,
}

#[derive(Copy, Drop, Serde, PartialEq, Introspect)]
pub enum GenesisProfile {
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
    pub quote: felt252, // @generateContants:shortstring
}

// IMPORTANT: names must be in sync with enum CharacterProfile
mod CHARACTER_PROFILES {
    use super::{ProfileDescription};
    pub const Unknown: ProfileDescription = ProfileDescription {
        name: 'Unknown',
        quote: '',
    };
    pub const Bartender: ProfileDescription = ProfileDescription {
        name: 'Bartender',
        quote: 'Quote',
    };
    pub const Drunkard: ProfileDescription = ProfileDescription {
        name: 'Drunkard',
        quote: 'Quote',
    };
    pub const Devil: ProfileDescription = ProfileDescription {
        name: 'Devil',
        quote: 'Quote',
    };
    pub const Player: ProfileDescription = ProfileDescription {
        name: 'Stranger',
        quote: 'Quote',
    };
}

// IMPORTANT: names must be in sync with enum BotProfile
mod BOT_PROFILES {
    use super::{ProfileDescription};
    pub const Unknown: ProfileDescription = ProfileDescription {
        name: 'Unknown',
        quote: '',
    };
    pub const TinMan: ProfileDescription = ProfileDescription {
        name: 'Tin Man',
        quote: 'Quote',
    };
    pub const Scarecrow: ProfileDescription = ProfileDescription {
        name: 'Scarecrow',
        quote: 'Quote',
    };
    pub const Leon: ProfileDescription = ProfileDescription {
        name: 'Leon',
        quote: 'Quote',
    };
}

// to be exported to typescript by generateConstants
// IMPORTANT: names must be in sync with enum GenesisProfile
mod GENESIS_PROFILES {
    use super::{ProfileDescription};
    pub const Unknown: ProfileDescription = ProfileDescription {
        name: 'Unknown',
        quote: '',
    };
    pub const Duke: ProfileDescription = ProfileDescription {
        name: 'Duke',
        quote: 'Prepare to be Duked!',
    };
    pub const Duella: ProfileDescription = ProfileDescription {
        name: 'Duella',
        quote: 'Quote',
    };
    pub const Jameson: ProfileDescription = ProfileDescription {
        name: 'Jameson',
        quote: 'Quote',
    };
    pub const Pilgrim: ProfileDescription = ProfileDescription {
        name: 'Pilgrim',
        quote: 'Quote',
    };
    pub const Jack: ProfileDescription = ProfileDescription {
        name: 'Jack',
        quote: 'Quote',
    };
    pub const Pops: ProfileDescription = ProfileDescription {
        name: 'Pops',
        quote: 'Quote',
    };
    pub const SerWalker: ProfileDescription = ProfileDescription {
        name: 'Ser Walker',
        quote: 'Quote',
    };
    pub const Bloberto: ProfileDescription = ProfileDescription {
        name: 'Bloberto',
        quote: 'Quote',
    };
    pub const Squiddo: ProfileDescription = ProfileDescription {
        name: 'Squiddo',
        quote: 'Quote',
    };
    pub const SlenderDuck: ProfileDescription = ProfileDescription {
        name: 'Slender Duck',
        quote: 'Quote',
    };
    pub const LadyVengeance: ProfileDescription = ProfileDescription {
        name: 'Lady Vengeance',
        quote: 'Quote',
    };
    pub const Breadman: ProfileDescription = ProfileDescription {
        name: 'Breadman',
        quote: 'Quote',
    };
    pub const Brutus: ProfileDescription = ProfileDescription {
        name: 'Brutus',
        quote: 'Quote',
    };
    pub const Pistolopher: ProfileDescription = ProfileDescription {
        name: 'Pistolopher',
        quote: 'Quote',
    };
    pub const Secreto: ProfileDescription = ProfileDescription {
        name: 'Secreto',
        quote: 'Quote',
    };
    pub const ShadowMare: ProfileDescription = ProfileDescription {
        name: 'Shadow Mare',
        quote: 'Quote',
    };
    pub const Karaku: ProfileDescription = ProfileDescription {
        name: 'Karaku',
        quote: 'Quote',
    };
    pub const Misty: ProfileDescription = ProfileDescription {
        name: 'Misty',
        quote: 'Quote',
    };
    pub const Kenzu: ProfileDescription = ProfileDescription {
        name: 'Kenzu',
        quote: 'Quote',
    };
    pub const NynJah: ProfileDescription = ProfileDescription {
        name: 'Nyn Jah',
        quote: 'Quote',
    };
    pub const Thrak: ProfileDescription = ProfileDescription {
        name: 'Thrak',
        quote: 'Quote',
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
            DuelistProfile::Undefined =>            CHARACTER_PROFILES::Unknown,
            DuelistProfile::Character(profile) =>   profile.into(),
            DuelistProfile::Bot(profile) =>         profile.into(),
            DuelistProfile::Genesis(profile) =>     profile.into(),
        })
    }
    fn profile_id(self: @DuelistProfile) -> u8 {
        (match *self {
            DuelistProfile::Undefined =>            0,
            DuelistProfile::Character(profile) =>   profile.into(),
            DuelistProfile::Bot(profile) =>         profile.into(),
            DuelistProfile::Genesis(profile) =>     profile.into(),
        })
    }
    fn exists(self: @DuelistProfile) -> bool {
        (self.profile_id() != 0)
    }
    fn make_duelist_id(self: @DuelistProfile) -> u128 {
        (match *self {
            DuelistProfile::Character(profile) =>   profile.into(),
            DuelistProfile::Bot(profile) =>         profile.into(),
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
impl GenesisProfileIntoDescription of core::traits::Into<GenesisProfile, ProfileDescription> {
    fn into(self: GenesisProfile) -> ProfileDescription {
        match self {
            GenesisProfile::Unknown =>          GENESIS_PROFILES::Unknown,
            GenesisProfile::Duke =>             GENESIS_PROFILES::Duke,
            GenesisProfile::Duella =>           GENESIS_PROFILES::Duella,
            GenesisProfile::Jameson =>          GENESIS_PROFILES::Jameson,
            GenesisProfile::Pilgrim =>          GENESIS_PROFILES::Pilgrim,
            GenesisProfile::Jack =>             GENESIS_PROFILES::Jack,
            GenesisProfile::Pops =>             GENESIS_PROFILES::Pops,
            GenesisProfile::SerWalker =>        GENESIS_PROFILES::SerWalker,
            GenesisProfile::Bloberto =>         GENESIS_PROFILES::Bloberto,
            GenesisProfile::Squiddo =>          GENESIS_PROFILES::Squiddo,
            GenesisProfile::SlenderDuck =>      GENESIS_PROFILES::SlenderDuck,
            GenesisProfile::LadyVengeance =>    GENESIS_PROFILES::LadyVengeance,
            GenesisProfile::Breadman =>         GENESIS_PROFILES::Breadman,
            GenesisProfile::Brutus =>           GENESIS_PROFILES::Brutus,
            GenesisProfile::Pistolopher =>      GENESIS_PROFILES::Pistolopher,
            GenesisProfile::Secreto =>          GENESIS_PROFILES::Secreto,
            GenesisProfile::ShadowMare =>       GENESIS_PROFILES::ShadowMare,
            GenesisProfile::Karaku =>           GENESIS_PROFILES::Karaku,
            GenesisProfile::Misty =>            GENESIS_PROFILES::Misty,
            GenesisProfile::Kenzu =>            GENESIS_PROFILES::Kenzu,
            GenesisProfile::NynJah =>           GENESIS_PROFILES::NynJah,
            GenesisProfile::Thrak =>            GENESIS_PROFILES::Thrak,
        }
    }
}
impl CharacterProfileIntoDescription of core::traits::Into<CharacterProfile, ProfileDescription> {
    fn into(self: CharacterProfile) -> ProfileDescription {
        match self {
            CharacterProfile::Unknown =>        CHARACTER_PROFILES::Unknown,
            CharacterProfile::Bartender =>      CHARACTER_PROFILES::Bartender,
            CharacterProfile::Drunkard =>       CHARACTER_PROFILES::Drunkard,
            CharacterProfile::Devil =>          CHARACTER_PROFILES::Devil,
            CharacterProfile::Player =>         CHARACTER_PROFILES::Player,
        }
    }
}
impl BotProfileIntoDescription of core::traits::Into<BotProfile, ProfileDescription> {
    fn into(self: BotProfile) -> ProfileDescription {
        match self {
            BotProfile::Unknown =>      BOT_PROFILES::Unknown,
            BotProfile::TinMan =>       BOT_PROFILES::TinMan,
            BotProfile::Scarecrow =>    BOT_PROFILES::Scarecrow,
            BotProfile::Leon =>         BOT_PROFILES::Leon,
        }
    }
}



//----------------------------------------
// profile_id converters
//
impl U8IntoGenesisProfile of core::traits::Into<u8, GenesisProfile> {
    fn into(self: u8) -> GenesisProfile {
        if self == 1        { GenesisProfile::Duke }
        else if self == 2   { GenesisProfile::Duella }
        else if self == 3   { GenesisProfile::Jameson }
        else if self == 4   { GenesisProfile::Pilgrim }
        else if self == 5   { GenesisProfile::Jack }
        else if self == 6   { GenesisProfile::Pops }
        else if self == 7   { GenesisProfile::SerWalker }
        else if self == 8   { GenesisProfile::Bloberto }
        else if self == 9   { GenesisProfile::Squiddo }
        else if self == 10  { GenesisProfile::SlenderDuck }
        else if self == 11  { GenesisProfile::LadyVengeance }
        else if self == 12  { GenesisProfile::Breadman }
        else if self == 13  { GenesisProfile::Brutus }
        else if self == 14  { GenesisProfile::Pistolopher }
        else if self == 15  { GenesisProfile::Secreto }
        else if self == 16  { GenesisProfile::ShadowMare }
        else if self == 17  { GenesisProfile::Karaku }
        else if self == 18  { GenesisProfile::Misty }
        else if self == 19  { GenesisProfile::Kenzu }
        else if self == 20  { GenesisProfile::NynJah }
        else if self == 21  { GenesisProfile::Thrak }
        else                { GenesisProfile::Unknown }
    }
}
impl GenesisProfileIntoU8 of core::traits::Into<GenesisProfile, u8> {
    fn into(self: GenesisProfile) -> u8 {
        match self {
            GenesisProfile::Unknown =>          0,
            GenesisProfile::Duke =>             1,
            GenesisProfile::Duella =>           2,
            GenesisProfile::Jameson =>          3,
            GenesisProfile::Pilgrim =>          4,
            GenesisProfile::Jack =>             5,
            GenesisProfile::Pops =>             6,
            GenesisProfile::SerWalker =>        7,
            GenesisProfile::Bloberto =>         8,
            GenesisProfile::Squiddo =>          9,
            GenesisProfile::SlenderDuck =>      10,
            GenesisProfile::LadyVengeance =>    11,
            GenesisProfile::Breadman =>         12,
            GenesisProfile::Brutus =>           13,
            GenesisProfile::Pistolopher =>      14,
            GenesisProfile::Secreto =>          15,
            GenesisProfile::ShadowMare =>       16,
            GenesisProfile::Karaku =>           17,
            GenesisProfile::Misty =>            18,
            GenesisProfile::Kenzu =>            19,
            GenesisProfile::NynJah =>           20,
            GenesisProfile::Thrak =>            21,
        }
    }
}

impl U8IntoCharacterProfile of core::traits::Into<u8, CharacterProfile> {
    fn into(self: u8) -> CharacterProfile {
        if self == 1        { CharacterProfile::Bartender }
        else if self == 2   { CharacterProfile::Drunkard }
        else if self == 3   { CharacterProfile::Devil }
        else if self == 4   { CharacterProfile::Player }
        else                { CharacterProfile::Unknown }
    }
}
impl CharacterProfileIntoU8 of core::traits::Into<CharacterProfile, u8> {
    fn into(self: CharacterProfile) -> u8 {
        match self {
            CharacterProfile::Unknown =>    0,
            CharacterProfile::Bartender =>  1,
            CharacterProfile::Drunkard =>   2,
            CharacterProfile::Devil =>      3,
            CharacterProfile::Player =>     4,
        }
    }
}

impl U8IntoBotProfile of core::traits::Into<u8, BotProfile> {
    fn into(self: u8) -> BotProfile {
        if self == 1        { BotProfile::TinMan }
        else if self == 2   { BotProfile::Scarecrow }
        else if self == 3   { BotProfile::Leon }
        else                { BotProfile::Unknown }
    }
}
impl BotProfileIntoU8 of core::traits::Into<BotProfile, u8> {
    fn into(self: BotProfile) -> u8 {
        match self {
            BotProfile::Unknown =>      0,
            BotProfile::TinMan =>       1,
            BotProfile::Scarecrow =>    2,
            BotProfile::Leon =>         3,
        }
    }
}




//----------------------------------------
// Duelist id converters
//
impl CharacterProfileIntoDuelistId of core::traits::Into<CharacterProfile, u128> {
    fn into(self: CharacterProfile) -> u128 {
        let profile_id: u8 = self.into();
        (if (profile_id.is_non_zero())
            {COLLECTIONS::Character.duelist_id_base + profile_id.into()}
            else {0}
        )
    }
}
impl BotProfileIntoDuelistId of core::traits::Into<BotProfile, u128> {
    fn into(self: BotProfile) -> u128 {
        let profile_id: u8 = self.into();
        (if (profile_id.is_non_zero())
            {COLLECTIONS::Bot.duelist_id_base + profile_id.into()}
            else {0}
        )
    }
}

impl DuelistIdIntoCharacterProfile of core::traits::Into<u128, CharacterProfile> {
    fn into(self: u128) -> CharacterProfile {
        let id: u128 = self ^ COLLECTIONS::Character.duelist_id_base;
        let id: u8 = if (id < 0xff) { (self & 0xff).try_into().unwrap() } else { 0 };
        (id.into())
    }
}
impl DuelistIdIntoBotProfile of core::traits::Into<u128, BotProfile> {
    fn into(self: u128) -> BotProfile {
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
            DuelistProfile::Character(p) =>     { let id: u8 = (*p).into(); format!("Character::{}({})", self.name(), id) },
            DuelistProfile::Bot(p) =>           { let id: u8 = (*p).into(); format!("Bot::{}({})", self.name(), id) },
            DuelistProfile::Genesis(p) =>       { let id: u8 = (*p).into(); format!("Genesis::{}({})", self.name(), id) },
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
pub impl CharacterProfileDebug of core::fmt::Debug<CharacterProfile> {
    fn fmt(self: @CharacterProfile, ref f: core::fmt::Formatter) -> Result<(), core::fmt::Error> {
        let result: ByteArray = DuelistProfile::Character(*self).name();
        f.buffer.append(@result);
        Result::Ok(())
    }
}
pub impl BotProfileDebug of core::fmt::Debug<BotProfile> {
    fn fmt(self: @BotProfile, ref f: core::fmt::Formatter) -> Result<(), core::fmt::Error> {
        let result: ByteArray = DuelistProfile::Bot(*self).name();
        f.buffer.append(@result);
        Result::Ok(())
    }
}
pub impl GenesisProfileDebug of core::fmt::Debug<GenesisProfile> {
    fn fmt(self: @GenesisProfile, ref f: core::fmt::Formatter) -> Result<(), core::fmt::Error> {
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
        GenesisProfile, CharacterProfile, BotProfile,
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
            assert_ne!(profile, DuelistProfile::Genesis(GenesisProfile::Unknown), "Duelist({}) is Unknown", p);
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
            assert_ne!(profile, DuelistProfile::Character(CharacterProfile::Unknown), "({}) is Unknown", p);
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
            assert_ne!(profile, DuelistProfile::Bot(BotProfile::Unknown), "({}) is Unknown", p);
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
            let profile: GenesisProfile = p.into();
            assert_eq!(DuelistProfile::Genesis(profile).make_duelist_id(), 0, "({}) bad type_id", p);
            p += 1;
        };
    }

    #[test]
    fn test_profile_duelist_ids_character() {
        assert_gt!(COLLECTIONS::Character.duelist_id_base, 0, "bad base id");
        let mut p: u8 = 1;
        while (p <= COLLECTIONS::Character.profile_count.into()) {
            let profile: CharacterProfile = p.into();
            let expected_id: u128 = (COLLECTIONS::Character.duelist_id_base | p.into());
            assert_gt!(expected_id, COLLECTIONS::Character.duelist_id_base, "({}) low id", p);
            assert_eq!(expected_id, DuelistProfile::Character(profile).make_duelist_id(), "({}) bad type_id", p);
            assert_eq!(expected_id.into(), profile, "({}) bad profile", p);
            p += 1;
        };
    }

    #[test]
    fn test_profile_duelist_ids_bot() {
        assert_gt!(COLLECTIONS::Bot.duelist_id_base, 0, "bad base id");
        let mut p: u8 = 1;
        while (p <= COLLECTIONS::Bot.profile_count.into()) {
            let profile: BotProfile = p.into();
            let expected_id: u128 = (COLLECTIONS::Bot.duelist_id_base | p.into());
            assert_gt!(expected_id, COLLECTIONS::Bot.duelist_id_base, "({}) low id", p);
            assert_eq!(expected_id, DuelistProfile::Bot(profile).make_duelist_id(), "({}) bad type_id", p);
            assert_eq!(expected_id.into(), profile, "({}) bad profile", p);
            p += 1;
        };
    }

    #[test]
    fn test_profile_duelist_ids_misc() {
        // duelist
        assert_eq!(0_u128.into(), CharacterProfile::Unknown, "Character 0");
        assert_eq!(1_u128.into(), CharacterProfile::Unknown, "Character 1");
        assert_eq!(1000_u128.into(), CharacterProfile::Unknown, "Character 1000");
        assert_eq!(0x121212121231231231241212_u128.into(), CharacterProfile::Unknown, "Character 1000");
        assert_eq!(COLLECTIONS::Character.duelist_id_base.into(), CharacterProfile::Unknown, "Character CHAR_ID");
        assert_eq!(COLLECTIONS::Bot.duelist_id_base.into(), CharacterProfile::Unknown, "Character BOT_ID");
        assert_eq!((COLLECTIONS::Bot.duelist_id_base + 1).into(), CharacterProfile::Unknown, "Character BOT_ID+1");
        assert_ne!((COLLECTIONS::Character.duelist_id_base + 1).into(), CharacterProfile::Unknown, "Character CHAR_ID+1");
        assert_ne!((COLLECTIONS::Character.duelist_id_base + COLLECTIONS::Character.profile_count.into()).into(), CharacterProfile::Unknown, "Character CHAR_ID+COUNT");
        assert_eq!((COLLECTIONS::Character.duelist_id_base + COLLECTIONS::Character.profile_count.into() + 1).into(), CharacterProfile::Unknown, "Character CHAR_ID+COUNT+1");
        // bot
        assert_eq!(0_u128.into(), BotProfile::Unknown, "Bot 0");
        assert_eq!(1_u128.into(), BotProfile::Unknown, "Bot 1");
        assert_eq!(1000_u128.into(), BotProfile::Unknown, "Bot 1000");
        assert_eq!(0x121212121231231231241212_u128.into(), BotProfile::Unknown, "Bot 1000");
        assert_eq!(COLLECTIONS::Bot.duelist_id_base.into(), BotProfile::Unknown, "Bot BOT_ID");
        assert_eq!(COLLECTIONS::Character.duelist_id_base.into(), BotProfile::Unknown, "Bot CHAR_ID");
        assert_eq!((COLLECTIONS::Character.duelist_id_base + 1).into(), BotProfile::Unknown, "Bot CHAR_ID+1");
        assert_ne!((COLLECTIONS::Bot.duelist_id_base + 1).into(), BotProfile::Unknown, "Bot BOT_ID+1");
        assert_ne!((COLLECTIONS::Bot.duelist_id_base + COLLECTIONS::Bot.profile_count.into()).into(), BotProfile::Unknown, "Bot BOT_ID+COUNT");
        assert_eq!((COLLECTIONS::Bot.duelist_id_base + COLLECTIONS::Bot.profile_count.into() + 1).into(), BotProfile::Unknown, "Bot BOT_ID+COUNT+1");
    }
}
