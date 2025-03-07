
//--------------------------
// ProfileType
//
#[derive(Copy, Drop, Serde, PartialEq, Introspect)]
pub enum ProfileType {
    Undefined,
    Duelist: DuelistProfile,        // Duelist(profile)
    Character: CharacterProfile,    // Character(profile)
    Bot: BotProfile,                // Bot(profile)
    // Eternum: u16,   // Eternum(realm id)
}

//--------------------------
// Profiles
//
#[derive(Copy, Drop, Serde, PartialEq, Introspect)]
pub enum DuelistProfile {
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



//--------------------------
// Profile Descriptions
//
#[derive(Copy, Drop, Serde, Default)]
pub struct ProfileDescription {
    pub profile_id: u8,
    pub gender: Gender,
    pub name: felt252, // @generateContants:shortstring
}

#[derive(Copy, Drop, Serde, PartialEq, Introspect)]
pub enum Gender {
    Undefined,
    Male,
    Female,
}
impl GenderDefault of Default<Gender> {
    fn default() -> Gender {(Gender::Undefined)}
}

// to be exported to typescript by generateConstants
// IMPORTANT: names must be in sync with enum DuelistProfile
mod DUELIST_PROFILES {
    use super::{ProfileDescription, Gender};
    pub const Unknown: ProfileDescription = ProfileDescription {
        profile_id: 0,
        gender: Gender::Undefined,
        name: 'Unknown',
    };
    pub const Duke: ProfileDescription = ProfileDescription {
        profile_id: 1,
        gender: Gender::Male,
        name: 'Duke',
    };
    pub const Duella: ProfileDescription = ProfileDescription {
        profile_id: 2,
        gender: Gender::Female,
        name: 'Duella',
    };
    pub const Jameson: ProfileDescription = ProfileDescription {
        profile_id: 3,
        gender: Gender::Male,
        name: 'Jameson',
    };
    pub const Pilgrim: ProfileDescription = ProfileDescription {
        profile_id: 4,
        gender: Gender::Male,
        name: 'Pilgrim',
    };
    pub const Jack: ProfileDescription = ProfileDescription {
        profile_id: 5,
        gender: Gender::Male,
        name: 'Jack',
    };
    pub const Pops: ProfileDescription = ProfileDescription {
        profile_id: 6,
        gender: Gender::Male,
        name: 'Pops',
    };
    pub const SerWalker: ProfileDescription = ProfileDescription {
        profile_id: 7,
        gender: Gender::Male,
        name: 'Ser Walker',
    };
    pub const Bloberto: ProfileDescription = ProfileDescription {
        profile_id: 8,
        gender: Gender::Male,
        name: 'Bloberto',
    };
    pub const Squiddo: ProfileDescription = ProfileDescription {
        profile_id: 9,
        gender: Gender::Male,
        name: 'Squiddo',
    };
    pub const SlenderDuck: ProfileDescription = ProfileDescription {
        profile_id: 10,
        gender: Gender::Male,
        name: 'Slender Duck',
    };
    pub const LadyVengeance: ProfileDescription = ProfileDescription {
        profile_id: 11,
        gender: Gender::Female,
        name: 'Lady Vengeance',
    };
    pub const Breadman: ProfileDescription = ProfileDescription {
        profile_id: 12,
        gender: Gender::Male,
        name: 'Breadman',
    };
    pub const Brutus: ProfileDescription = ProfileDescription {
        profile_id: 13,
        gender: Gender::Male,
        name: 'Brutus',
    };
    pub const Pistolopher: ProfileDescription = ProfileDescription {
        profile_id: 14,
        gender: Gender::Male,
        name: 'Pistolopher',
    };
    pub const Secreto: ProfileDescription = ProfileDescription {
        profile_id: 15,
        gender: Gender::Male,
        name: 'Secreto',
    };
    pub const ShadowMare: ProfileDescription = ProfileDescription {
        profile_id: 16,
        gender: Gender::Female,
        name: 'Shadow Mare',
    };
    pub const Karaku: ProfileDescription = ProfileDescription {
        profile_id: 17,
        gender: Gender::Male,
        name: 'Karaku',
    };
    pub const Misty: ProfileDescription = ProfileDescription {
        profile_id: 18,
        gender: Gender::Female,
        name: 'Misty',
    };
    pub const Kenzu: ProfileDescription = ProfileDescription {
        profile_id: 19,
        gender: Gender::Female,
        name: 'Kenzu',
    };
    pub const NynJah: ProfileDescription = ProfileDescription {
        profile_id: 20,
        gender: Gender::Male,
        name: 'Nyn Jah',
    };
    pub const Thrak: ProfileDescription = ProfileDescription {
        profile_id: 21,
        gender: Gender::Male,
        name: 'Thrak',
    };
}

// IMPORTANT: names must be in sync with enum CharacterProfile
mod CHARACTER_PROFILES {
    use super::{ProfileDescription, Gender};
    pub const Unknown: ProfileDescription = ProfileDescription {
        profile_id: 0,
        gender: Gender::Undefined,
        name: 'Unknown',
    };
    pub const Bartender: ProfileDescription = ProfileDescription {
        profile_id: 1,
        gender: Gender::Male,
        name: 'Bartender',
    };
    pub const Drunkard: ProfileDescription = ProfileDescription {
        profile_id: 2,
        gender: Gender::Male,
        name: 'Drunkard',
    };
    pub const Devil: ProfileDescription = ProfileDescription {
        profile_id: 3,
        gender: Gender::Male,
        name: 'Devil',
    };
    pub const Player: ProfileDescription = ProfileDescription {
        profile_id: 4,
        gender: Gender::Male,
        name: 'Stranger',
    };
}

// IMPORTANT: names must be in sync with enum BotProfile
mod BOT_PROFILES {
    use super::{ProfileDescription, Gender};
    pub const Unknown: ProfileDescription = ProfileDescription {
        profile_id: 0,
        gender: Gender::Undefined,
        name: 'Unknown',
    };
    pub const TinMan: ProfileDescription = ProfileDescription {
        profile_id: 1,
        gender: Gender::Male,
        name: 'Tin Man',
    };
    pub const Scarecrow: ProfileDescription = ProfileDescription {
        profile_id: 2,
        gender: Gender::Male,
        name: 'Scarecrow',
    };
    pub const Leon: ProfileDescription = ProfileDescription {
        profile_id: 3,
        gender: Gender::Male,
        name: 'Leon',
    };
}


//--------------------
// constants
//

mod PROFILES {
    // profile counts
    pub const DUELIST_PROFILE_COUNT: u8 = 21;
    pub const CHARACTER_PROFILE_COUNT: u8 = 4;
    pub const BOT_PROFILE_COUNT: u8 = 3;

    // profile base duelist ids (> u32)
    pub const DUELIST_ID_BASE: u128    = 0x100000000;
    pub const CHARACTER_ID_BASE: u128  = 0x200000000;
    pub const BOT_ID_BASE: u128        = 0x300000000;
    pub const UNDEFINED_ID_BASE: u128  = 0xf00000000;
}




//----------------------------------
// Traits
//
use pistols::models::duelist::{Duelist, DuelistTimestamps};
use pistols::libs::store::{Store, StoreTrait};
use pistols::utils::short_string::{ShortStringTrait};
use pistols::utils::misc::{FeltToLossy};

#[generate_trait]
pub impl ProfileManagerImpl of ProfileManagerTrait {
    fn initialize(ref store: Store, sample: ProfileType) {
        let profiles: Span<ProfileType> = Self::get_all_profiles_by_type(sample);
        let mut i: u8 = 0;
        while (i.into() < profiles.len()) {
            let profile_type: ProfileType = *profiles.at((i).into());
            let timestamp: u64 = starknet::get_block_timestamp();
            store.set_duelist(@Duelist {
                duelist_id: profile_type.duelist_id(),
                profile_type,
                timestamps: DuelistTimestamps {
                    registered: timestamp,
                    active: timestamp,
                },
            });
            i += 1;
        };
    }
    fn randomize_duelist(seed: felt252) -> ProfileType {
        let profile_id: u8 = (seed.to_u8_lossy() % PROFILES::DUELIST_PROFILE_COUNT) + 1;
        (ProfileType::Duelist(profile_id.into()))
    }
    fn randomize_bot(seed: felt252) -> ProfileType {
        let profile_id: u8 = (seed.to_u8_lossy() % PROFILES::BOT_PROFILE_COUNT) + 1;
        (ProfileType::Bot(profile_id.into()))
    }
    fn get_all_profiles_by_type(sample: ProfileType) -> Span<ProfileType> {
        let mut result: Array<ProfileType> = array![];
        let mut i: u8 =     1;
        loop {
            let profile: ProfileType = match sample {
                ProfileType::Undefined =>     ProfileType::Undefined,
                ProfileType::Duelist(_) =>    ProfileType::Duelist(i.into()),
                ProfileType::Character(_) =>  ProfileType::Character(i.into()),
                ProfileType::Bot(_) =>        ProfileType::Bot(i.into()),
            };
            if (!profile.exists()) {
                break;
            };
            result.append(profile);
            i += 1;
        };
        (result.span())
    }
    fn get_all_descriptions_by_type(sample: ProfileType) -> Span<ProfileDescription> {
        let mut result: Array<ProfileDescription> = array![];
        let mut i: u8 = 1;
        loop {
            let profile: ProfileType = match sample {
                ProfileType::Undefined =>     ProfileType::Undefined,
                ProfileType::Duelist(_) =>    ProfileType::Duelist(i.into()),
                ProfileType::Character(_) =>  ProfileType::Character(i.into()),
                ProfileType::Bot(_) =>        ProfileType::Bot(i.into()),
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
pub impl ProfileTypeImpl of ProfileTypeTrait {
    fn description(self: @ProfileType) -> ProfileDescription {
        (match *self {
            ProfileType::Undefined =>           DUELIST_PROFILES::Unknown,
            ProfileType::Duelist(profile) =>    profile.into(),
            ProfileType::Character(profile) =>  profile.into(),
            ProfileType::Bot(profile) =>        profile.into(),
        })
    }
    fn profile_id(self: @ProfileType) -> u8 {
        let desc: ProfileDescription = self.description();
        (desc.profile_id)
    }
    fn exists(self: @ProfileType) -> bool {
        (self.profile_id() != 0)
    }
    fn duelist_id(self: @ProfileType) -> u128 {
        (match *self {
            ProfileType::Undefined =>               0,
            ProfileType::Duelist(duelist) =>        duelist.into(),
            ProfileType::Character(character) =>    character.into(),
            ProfileType::Bot(bot) =>                bot.into(),
        })
    }
    fn name(self: @ProfileType) -> ByteArray {
        let desc: ProfileDescription = self.description();
        (desc.name.to_string())
    }
    fn get_uri(self: @ProfileType,
        base_uri: ByteArray,
        variant: ByteArray,    
    ) -> ByteArray {
        let desc: ProfileDescription = self.description();
        let number = if (desc.profile_id < 10) {format!("0{}", desc.profile_id)} else {format!("{}", desc.profile_id)};
        let folder: ByteArray = match self {
            ProfileType::Undefined =>       "duelists",
            ProfileType::Duelist(_) =>      "duelists",
            ProfileType::Character(_) =>    "characters",
            ProfileType::Bot(_) =>          "bots",
        };
        (format!("{}/profiles/{}/{}/{}.jpg", base_uri, folder, variant, number))
    }
}

impl DuelistProfileIntoDescription of core::traits::Into<DuelistProfile, ProfileDescription> {
    fn into(self: DuelistProfile) -> ProfileDescription {
        match self {
            DuelistProfile::Unknown =>          DUELIST_PROFILES::Unknown,
            DuelistProfile::Duke =>             DUELIST_PROFILES::Duke,
            DuelistProfile::Duella =>           DUELIST_PROFILES::Duella,
            DuelistProfile::Jameson =>          DUELIST_PROFILES::Jameson,
            DuelistProfile::Pilgrim =>          DUELIST_PROFILES::Pilgrim,
            DuelistProfile::Jack =>             DUELIST_PROFILES::Jack,
            DuelistProfile::Pops =>             DUELIST_PROFILES::Pops,
            DuelistProfile::SerWalker =>        DUELIST_PROFILES::SerWalker,
            DuelistProfile::Bloberto =>         DUELIST_PROFILES::Bloberto,
            DuelistProfile::Squiddo =>          DUELIST_PROFILES::Squiddo,
            DuelistProfile::SlenderDuck =>      DUELIST_PROFILES::SlenderDuck,
            DuelistProfile::LadyVengeance =>    DUELIST_PROFILES::LadyVengeance,
            DuelistProfile::Breadman =>         DUELIST_PROFILES::Breadman,
            DuelistProfile::Brutus =>           DUELIST_PROFILES::Brutus,
            DuelistProfile::Pistolopher =>      DUELIST_PROFILES::Pistolopher,
            DuelistProfile::Secreto =>          DUELIST_PROFILES::Secreto,
            DuelistProfile::ShadowMare =>       DUELIST_PROFILES::ShadowMare,
            DuelistProfile::Karaku =>           DUELIST_PROFILES::Karaku,
            DuelistProfile::Misty =>            DUELIST_PROFILES::Misty,
            DuelistProfile::Kenzu =>            DUELIST_PROFILES::Kenzu,
            DuelistProfile::NynJah =>           DUELIST_PROFILES::NynJah,
            DuelistProfile::Thrak =>            DUELIST_PROFILES::Thrak,
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



//---------------------------
// Converters
//
impl ProfileTypeIntoByteArray of core::traits::Into<ProfileType, ByteArray> {
    fn into(self: ProfileType) -> ByteArray {
        match self {
            ProfileType::Undefined =>       "Undefined",
            ProfileType::Duelist(_) =>      "Duelist",
            ProfileType::Character(_) =>    "Character",
            ProfileType::Bot(_) =>          "Bot",
        }
    }
}
// for println! format! (core::fmt::Display<>) assert! (core::fmt::Debug<>)
pub impl ProfileTypeDebug of core::fmt::Debug<ProfileType> {
    fn fmt(self: @ProfileType, ref f: core::fmt::Formatter) -> Result<(), core::fmt::Error> {
        let result: ByteArray = (*self).into();
        f.buffer.append(@result);
        Result::Ok(())
    }
}
pub impl DuelistProfileDebug of core::fmt::Debug<DuelistProfile> {
    fn fmt(self: @DuelistProfile, ref f: core::fmt::Formatter) -> Result<(), core::fmt::Error> {
        let result: ByteArray = ProfileType::Duelist(*self).name();
        f.buffer.append(@result);
        Result::Ok(())
    }
}
pub impl CharacterProfileDebug of core::fmt::Debug<CharacterProfile> {
    fn fmt(self: @CharacterProfile, ref f: core::fmt::Formatter) -> Result<(), core::fmt::Error> {
        let result: ByteArray = ProfileType::Character(*self).name();
        f.buffer.append(@result);
        Result::Ok(())
    }
}
pub impl BotProfileDebug of core::fmt::Debug<BotProfile> {
    fn fmt(self: @BotProfile, ref f: core::fmt::Formatter) -> Result<(), core::fmt::Error> {
        let result: ByteArray = ProfileType::Bot(*self).name();
        f.buffer.append(@result);
        Result::Ok(())
    }
}


//----------------------------------------
// Profile id converters
//
impl U8IntoDuelistProfile of core::traits::Into<u8, DuelistProfile> {
    fn into(self: u8) -> DuelistProfile {
        if self == 1        { DuelistProfile::Duke }
        else if self == 2   { DuelistProfile::Duella }
        else if self == 3   { DuelistProfile::Jameson }
        else if self == 4   { DuelistProfile::Pilgrim }
        else if self == 5   { DuelistProfile::Jack }
        else if self == 6   { DuelistProfile::Pops }
        else if self == 7   { DuelistProfile::SerWalker }
        else if self == 8   { DuelistProfile::Bloberto }
        else if self == 9   { DuelistProfile::Squiddo }
        else if self == 10  { DuelistProfile::SlenderDuck }
        else if self == 11  { DuelistProfile::LadyVengeance }
        else if self == 12  { DuelistProfile::Breadman }
        else if self == 13  { DuelistProfile::Brutus }
        else if self == 14  { DuelistProfile::Pistolopher }
        else if self == 15  { DuelistProfile::Secreto }
        else if self == 16  { DuelistProfile::ShadowMare }
        else if self == 17  { DuelistProfile::Karaku }
        else if self == 18  { DuelistProfile::Misty }
        else if self == 19  { DuelistProfile::Kenzu }
        else if self == 20  { DuelistProfile::NynJah }
        else if self == 21  { DuelistProfile::Thrak }
        else                { DuelistProfile::Unknown }
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
impl U8IntoBotProfile of core::traits::Into<u8, BotProfile> {
    fn into(self: u8) -> BotProfile {
        if self == 1        { BotProfile::TinMan }
        else if self == 2   { BotProfile::Scarecrow }
        else if self == 3   { BotProfile::Leon }
        else                { BotProfile::Unknown }
    }
}

//----------------------------------------
// Duelist id converters
//
impl DuelistProfileIntoDuelistId of core::traits::Into<DuelistProfile, u128> {
    fn into(self: DuelistProfile) -> u128 {
        (PROFILES::DUELIST_ID_BASE + ProfileType::Duelist(self).description().profile_id.into())
    }
}
impl CharacterProfileIntoDuelistId of core::traits::Into<CharacterProfile, u128> {
    fn into(self: CharacterProfile) -> u128 {
        (PROFILES::CHARACTER_ID_BASE + ProfileType::Character(self).description().profile_id.into())
    }
}
impl BotProfileIntoDuelistId of core::traits::Into<BotProfile, u128> {
    fn into(self: BotProfile) -> u128 {
        (PROFILES::BOT_ID_BASE + ProfileType::Bot(self).description().profile_id.into())
    }
}

impl DuelistIdIntoDuelistProfile of core::traits::Into<u128, DuelistProfile> {
    fn into(self: u128) -> DuelistProfile {
        let zero: u128 = self ^ PROFILES::DUELIST_ID_BASE;
        let id: u8 = if (zero < 0xff) { (self & 0xff).try_into().unwrap() } else { 0 };
        (id.into())
    }
}
impl DuelistIdIntoCharacterProfile of core::traits::Into<u128, CharacterProfile> {
    fn into(self: u128) -> CharacterProfile {
        let id: u128 = self ^ PROFILES::CHARACTER_ID_BASE;
        let id: u8 = if (id < 0xff) { (self & 0xff).try_into().unwrap() } else { 0 };
        (id.into())
    }
}
impl DuelistIdIntoBotProfile of core::traits::Into<u128, BotProfile> {
    fn into(self: u128) -> BotProfile {
        let zero: u128 = self ^ PROFILES::BOT_ID_BASE;
        let id: u8 = if (zero < 0xff) { (self & 0xff).try_into().unwrap() } else { 0 };
        (id.into())
    }
}


//----------------------------------------
// Unit  tests
//
#[cfg(test)]
mod unit {

    use super::{
        ProfileType, ProfileTypeTrait,
        DuelistProfile, CharacterProfile, BotProfile,
        ProfileDescription,
        ProfileManagerTrait,
        PROFILES,
    };


    #[test]
    fn test_get_all_profiles_by_type() {
        let profiles: Span<ProfileType> = ProfileManagerTrait::get_all_profiles_by_type(ProfileType::Undefined);
        assert_eq!(profiles.len(), 0, "0");
        let profiles: Span<ProfileType> = ProfileManagerTrait::get_all_profiles_by_type(ProfileType::Duelist(0_u8.into()));
        assert_eq!(profiles.len(), PROFILES::DUELIST_PROFILE_COUNT.into(), "DUELIST_PROFILE_COUNT");
        let profiles: Span<ProfileType> = ProfileManagerTrait::get_all_profiles_by_type(ProfileType::Character(0_u8.into()));
        assert_eq!(profiles.len(), PROFILES::CHARACTER_PROFILE_COUNT.into(), "CHARACTER_PROFILE_COUNT");
        let profiles: Span<ProfileType> = ProfileManagerTrait::get_all_profiles_by_type(ProfileType::Bot(0_u8.into()));
        assert_eq!(profiles.len(), PROFILES::BOT_PROFILE_COUNT.into(), "BOT_PROFILE_COUNT");
    }

    #[test]
    fn test_get_all_descriptions_by_type() {
        let descriptions: Span<ProfileDescription> = ProfileManagerTrait::get_all_descriptions_by_type(ProfileType::Undefined);
        assert_eq!(descriptions.len(), 0, "0");
        let descriptions: Span<ProfileDescription> = ProfileManagerTrait::get_all_descriptions_by_type(ProfileType::Duelist(0_u8.into()));
        assert_eq!(descriptions.len(), PROFILES::DUELIST_PROFILE_COUNT.into(), "DUELIST_PROFILE_COUNT");
        let descriptions: Span<ProfileDescription> = ProfileManagerTrait::get_all_descriptions_by_type(ProfileType::Character(0_u8.into()));
        assert_eq!(descriptions.len(), PROFILES::CHARACTER_PROFILE_COUNT.into(), "CHARACTER_PROFILE_COUNT");
        let descriptions: Span<ProfileDescription> = ProfileManagerTrait::get_all_descriptions_by_type(ProfileType::Bot(0_u8.into()));
        assert_eq!(descriptions.len(), PROFILES::BOT_PROFILE_COUNT.into(), "BOT_PROFILE_COUNT");
    }

    //
    // test profiles
    //
    fn _test_invalid_profile(profile: ProfileType) {
        assert_eq!(profile.exists(), false, "(0) ! exists");
        let desc: ProfileDescription = profile.description();
        assert_eq!(desc.profile_id, 0, "(0) bad profile_id: {}", desc.profile_id);
        assert_eq!(desc.name, 'Unknown', "(0) bad name: {}", desc.name);
    }

    #[test]
    fn test_descriptions_duelist() {
        // invalid
        let invalid_profile: ProfileType = ProfileType::Duelist(0_u8.into());
        _test_invalid_profile(invalid_profile);
        // validate profiles
        let descriptions: Span<ProfileDescription> = ProfileManagerTrait::get_all_descriptions_by_type(invalid_profile);
        let mut profile_id: u8 = 1;
        let mut last_desc: ProfileDescription = Default::default();
        while (profile_id.into() <= descriptions.len()) {
            let profile: ProfileType = ProfileType::Duelist(profile_id.into());
            assert!(profile.exists(), "({}) exists", profile_id);
            assert_gt!(profile.duelist_id(), 0x100000000, "({}) short duelist_id: {}", profile_id, profile.duelist_id());
            assert_ne!(profile, ProfileType::Duelist(DuelistProfile::Unknown), "Duelist({}) is Unknown", profile_id);
            let desc: ProfileDescription = *descriptions.at((profile_id-1).into());
            assert_eq!(desc.profile_id, profile_id, "({}) bad profile_id: {}", profile_id, desc.profile_id);
            assert_eq!(desc.profile_id, last_desc.profile_id + 1, "({}) == ({}): profile_id {}", profile_id, profile_id-1, desc.profile_id);
            assert_ne!(desc.name, last_desc.name, "({}) == ({}): name {}", profile_id, profile_id-1, desc.name);
            last_desc = desc;
            profile_id += 1;
        };
    }

    #[test]
    fn test_descriptions_character() {
        // invalid
        let invalid_profile: ProfileType = ProfileType::Character(0_u8.into());
        _test_invalid_profile(invalid_profile);
        // validate profiles
        let descriptions: Span<ProfileDescription> = ProfileManagerTrait::get_all_descriptions_by_type(invalid_profile);
        let mut profile_id: u8 = 1;
        let mut last_desc: ProfileDescription = Default::default();
        while (profile_id.into() <= descriptions.len()) {
            let profile: ProfileType = ProfileType::Character(profile_id.into());
            assert!(profile.exists(), "({}) exists", profile_id);
            assert_gt!(profile.duelist_id(), 0x100000000, "({}) short duelist_id: {}", profile_id, profile.duelist_id());
            assert_ne!(profile, ProfileType::Character(CharacterProfile::Unknown), "({}) is Unknown", profile_id);
            let desc: ProfileDescription = *descriptions.at((profile_id-1).into());
            assert_eq!(desc.profile_id, profile_id, "({}) bad profile_id: {}", profile_id, desc.profile_id);
            assert_eq!(desc.profile_id, last_desc.profile_id + 1, "({}) == ({}): profile_id {}", profile_id, profile_id-1, desc.profile_id);
            assert_ne!(desc.name, last_desc.name, "({}) == ({}): name {}", profile_id, profile_id-1, desc.name);
            last_desc = desc;
            profile_id += 1;
        };
    }

    #[test]
    fn test_descriptions_bot() {
        // invalid
        let invalid_profile: ProfileType = ProfileType::Bot(0_u8.into());
        _test_invalid_profile(invalid_profile);
        // validate profiles
        let descriptions: Span<ProfileDescription> = ProfileManagerTrait::get_all_descriptions_by_type(invalid_profile);
        let mut profile_id: u8 = 1;
        let mut last_desc: ProfileDescription = Default::default();
        while (profile_id.into() <= descriptions.len()) {
            let profile: ProfileType = ProfileType::Bot(profile_id.into());
            assert!(profile.exists(), "({}) exists", profile_id);
            assert_gt!(profile.duelist_id(), 0x100000000, "({}) short duelist_id: {}", profile_id, profile.duelist_id());
            assert_ne!(profile, ProfileType::Bot(BotProfile::Unknown), "({}) is Unknown", profile_id);
            let desc: ProfileDescription = *descriptions.at((profile_id-1).into());
            assert_eq!(desc.profile_id, profile_id, "({}) bad profile_id: {}", profile_id, desc.profile_id);
            assert_eq!(desc.profile_id, last_desc.profile_id + 1, "({}) == ({}): profile_id {}", profile_id, profile_id-1, desc.profile_id);
            assert_ne!(desc.name, last_desc.name, "({}) == ({}): name {}", profile_id, profile_id-1, desc.name);
            last_desc = desc;
            profile_id += 1;
        };
    }

    #[test]
    fn test_profile_duelist_ids_duelist() {
        let mut profile_id: u8 = 1;
        while (profile_id <= PROFILES::DUELIST_PROFILE_COUNT) {
            let profile: DuelistProfile = profile_id.into();
            let expected_id: u128 = (PROFILES::DUELIST_ID_BASE | profile_id.into());
            assert_gt!(expected_id, PROFILES::DUELIST_ID_BASE, "({}) low id: {}", profile_id, expected_id);
            assert_eq!(expected_id, profile.into(), "({}) bad id: {}", profile_id, expected_id);
            assert_eq!(expected_id, ProfileType::Duelist(profile).duelist_id(), "({}) bad type_id: {}", profile_id, expected_id);
            assert_eq!(expected_id.into(), profile, "({}) bad profile: {}", profile_id, expected_id);
            profile_id += 1;
        };
    }

    #[test]
    fn test_profile_duelist_ids_character() {
        let mut profile_id: u8 = 1;
        while (profile_id <= PROFILES::CHARACTER_PROFILE_COUNT) {
            let profile: CharacterProfile = profile_id.into();
            let expected_id: u128 = (PROFILES::CHARACTER_ID_BASE | profile_id.into());
            assert_gt!(expected_id, PROFILES::CHARACTER_ID_BASE, "({}) low id: {}", profile_id, expected_id);
            assert_eq!(expected_id, profile.into(), "({}) bad id: {}", profile_id, expected_id);
            assert_eq!(expected_id, ProfileType::Character(profile).duelist_id(), "({}) bad type_id: {}", profile_id, expected_id);
            assert_eq!(expected_id.into(), profile, "({}) bad profile: {}", profile_id, expected_id);
            profile_id += 1;
        };
    }

    #[test]
    fn test_profile_duelist_ids_bot() {
        let mut profile_id: u8 = 1;
        while (profile_id <= PROFILES::BOT_PROFILE_COUNT) {
            let profile: BotProfile = profile_id.into();
            let expected_id: u128 = (PROFILES::BOT_ID_BASE | profile_id.into());
            assert_gt!(expected_id, PROFILES::BOT_ID_BASE, "({}) low id: {}", profile_id, expected_id);
            assert_eq!(expected_id, profile.into(), "({}) bad id: {}", profile_id, expected_id);
            assert_eq!(expected_id, ProfileType::Bot(profile).duelist_id(), "({}) bad type_id: {}", profile_id, expected_id);
            assert_eq!(expected_id.into(), profile, "({}) bad profile: {}", profile_id, expected_id);
            profile_id += 1;
        };
    }

    #[test]
    fn test_profile_duelist_ids_misc() {
        // duelist
        assert_eq!(0_u128.into(), CharacterProfile::Unknown, "Character 0");
        assert_eq!(1_u128.into(), CharacterProfile::Unknown, "Character 1");
        assert_eq!(1000_u128.into(), CharacterProfile::Unknown, "Character 1000");
        assert_eq!(0x121212121231231231241212_u128.into(), CharacterProfile::Unknown, "Character 1000");
        assert_eq!(PROFILES::CHARACTER_ID_BASE.into(), CharacterProfile::Unknown, "Character CHAR_ID");
        assert_eq!(PROFILES::BOT_ID_BASE.into(), CharacterProfile::Unknown, "Character BOT_ID");
        assert_eq!((PROFILES::BOT_ID_BASE + 1).into(), CharacterProfile::Unknown, "Character BOT_ID+1");
        assert_ne!((PROFILES::CHARACTER_ID_BASE + 1).into(), CharacterProfile::Unknown, "Character CHAR_ID+1");
        assert_ne!((PROFILES::CHARACTER_ID_BASE + PROFILES::CHARACTER_PROFILE_COUNT.into()).into(), CharacterProfile::Unknown, "Character CHAR_ID+COUNT");
        assert_eq!((PROFILES::CHARACTER_ID_BASE + PROFILES::CHARACTER_PROFILE_COUNT.into() + 1).into(), CharacterProfile::Unknown, "Character CHAR_ID+COUNT+1");
        // bot
        assert_eq!(0_u128.into(), BotProfile::Unknown, "Bot 0");
        assert_eq!(1_u128.into(), BotProfile::Unknown, "Bot 1");
        assert_eq!(1000_u128.into(), BotProfile::Unknown, "Bot 1000");
        assert_eq!(0x121212121231231231241212_u128.into(), BotProfile::Unknown, "Bot 1000");
        assert_eq!(PROFILES::BOT_ID_BASE.into(), BotProfile::Unknown, "Bot BOT_ID");
        assert_eq!(PROFILES::CHARACTER_ID_BASE.into(), BotProfile::Unknown, "Bot CHAR_ID");
        assert_eq!((PROFILES::CHARACTER_ID_BASE + 1).into(), BotProfile::Unknown, "Bot CHAR_ID+1");
        assert_ne!((PROFILES::BOT_ID_BASE + 1).into(), BotProfile::Unknown, "Bot BOT_ID+1");
        assert_ne!((PROFILES::BOT_ID_BASE + PROFILES::BOT_PROFILE_COUNT.into()).into(), BotProfile::Unknown, "Bot BOT_ID+COUNT");
        assert_eq!((PROFILES::BOT_ID_BASE + PROFILES::BOT_PROFILE_COUNT.into() + 1).into(), BotProfile::Unknown, "Bot BOT_ID+COUNT+1");
    }
}
