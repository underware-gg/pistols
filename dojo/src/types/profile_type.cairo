use starknet::ContractAddress;

#[derive(Copy, Drop, Serde, PartialEq, Introspect)]
enum DuelistProfile {
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
enum BotProfile {
    Unknown,
    Scarecrow,
    TinMan,
}

#[derive(Copy, Drop, Serde, Introspect)]
pub enum ProfileType {
    Undefined,
    Duelist: DuelistProfile,    // Duelist(profile)
    Bot: BotProfile,            // Bot(profile)
    // Eternum: u16,   // Eternum(realm id)
}


//--------------------
// constants
//

#[derive(Copy, Drop, Serde, Default)]
pub struct ProfileDescription {
    profile_id: u8,
    name: felt252, // @generateContants_type: shortstring
}

// to be exported to typescript by generateConstants
// IMPORTANT: names must be in sync with enum DuelistProfile
mod DUELIST_PROFILES {
    use super::{ProfileDescription};
    const Unknown: ProfileDescription = ProfileDescription {
        profile_id: 0,
        name: 'Unknown',
    };
    const Duke: ProfileDescription = ProfileDescription {
        profile_id: 1,
        name: 'Duke',
    };
    const Duella: ProfileDescription = ProfileDescription {
        profile_id: 2,
        name: 'Duella',
    };
    const Jameson: ProfileDescription = ProfileDescription {
        profile_id: 3,
        name: 'Jameson',
    };
    const Pilgrim: ProfileDescription = ProfileDescription {
        profile_id: 4,
        name: 'Pilgrim',
    };
    const Jack: ProfileDescription = ProfileDescription {
        profile_id: 5,
        name: 'Jack',
    };
    const Pops: ProfileDescription = ProfileDescription {
        profile_id: 6,
        name: 'Pops',
    };
    const SerWalker: ProfileDescription = ProfileDescription {
        profile_id: 7,
        name: 'Ser Walker',
    };
    const Bloberto: ProfileDescription = ProfileDescription {
        profile_id: 8,
        name: 'Bloberto',
    };
    const Squiddo: ProfileDescription = ProfileDescription {
        profile_id: 9,
        name: 'Squiddo',
    };
    const SlenderDuck: ProfileDescription = ProfileDescription {
        profile_id: 10,
        name: 'Slender Duck',
    };
    const LadyVengeance: ProfileDescription = ProfileDescription {
        profile_id: 11,
        name: 'Lady Vengeance',
    };
    const Breadman: ProfileDescription = ProfileDescription {
        profile_id: 12,
        name: 'Breadman',
    };
    const Brutus: ProfileDescription = ProfileDescription {
        profile_id: 13,
        name: 'Brutus',
    };
    const Pistolopher: ProfileDescription = ProfileDescription {
        profile_id: 14,
        name: 'Pistolopher',
    };
    const Secreto: ProfileDescription = ProfileDescription {
        profile_id: 15,
        name: 'Secreto',
    };
    const ShadowMare: ProfileDescription = ProfileDescription {
        profile_id: 16,
        name: 'Shadow Mare',
    };
    const Karaku: ProfileDescription = ProfileDescription {
        profile_id: 17,
        name: 'Karaku',
    };
    const Misty: ProfileDescription = ProfileDescription {
        profile_id: 18,
        name: 'Misty',
    };
    const Kenzu: ProfileDescription = ProfileDescription {
        profile_id: 19,
        name: 'Kenzu',
    };
    const NynJah: ProfileDescription = ProfileDescription {
        profile_id: 20,
        name: 'Nyn Jah',
    };
    const Thrak: ProfileDescription = ProfileDescription {
        profile_id: 21,
        name: 'Thrak',
    };
}

// to be exported to typescript by generateConstants
// IMPORTANT: names must be in sync with enum BotProfile
mod BOT_PROFILES {
    use super::{ProfileDescription};
    const Unknown: ProfileDescription = ProfileDescription {
        profile_id: 0,
        name: 'Unknown',
    };
    const Scarecrow: ProfileDescription = ProfileDescription {
        profile_id: 1,
        name: 'Scarecrow',
    };
    const TinMan: ProfileDescription = ProfileDescription {
        profile_id: 2,
        name: 'Tin Man',
    };
}



//----------------------------------
// Traits
//
use pistols::utils::short_string::{ShortStringTrait};
use pistols::utils::misc::{felt_to_u8};
use pistols::types::constants::{CONST};

#[generate_trait]
impl ProfileTypeImpl of ProfileTypeTrait {
    fn randomize_duelist(seed: felt252) -> ProfileType {
        let profile_id: u8 = (felt_to_u8(seed) % CONST::DUELIST_PROFILE_COUNT) + 1;
        (ProfileType::Duelist(profile_id.into()))
    }
    fn randomize_bot(seed: felt252) -> ProfileType {
        let profile_id: u8 = (felt_to_u8(seed) % CONST::BOT_PROFILE_COUNT) + 1;
        (ProfileType::Bot(profile_id.into()))
    }
    fn name(self: ProfileType) -> ByteArray {
        match self {
            ProfileType::Undefined => 'Unknown',
            ProfileType::Duelist(profile) => {
                let desc: ProfileDescription = profile.into();
                (desc.name)
            },
            ProfileType::Bot(profile) => {
                let desc: ProfileDescription = profile.into();
                (desc.name)
            },
        }.to_string()
    }
    fn get_uri(self: ProfileType,
        base_uri: ByteArray,
        variant: ByteArray,    
    ) -> ByteArray {
        match self {
            ProfileType::Duelist(profile) => {
                let desc: ProfileDescription = profile.into();
                let number = if (desc.profile_id < 10) {format!("0{}", desc.profile_id)} else {format!("{}", desc.profile_id)};
                (format!("{}/profiles/duelists/{}/{}.jpg", base_uri, variant, number))
            },
            ProfileType::Bot(profile) => {
                let desc: ProfileDescription = profile.into();
                let number = if (desc.profile_id < 10) {format!("0{}", desc.profile_id)} else {format!("{}", desc.profile_id)};
                (format!("{}/profiles/bots/{}/{}.jpg", base_uri, variant, number))
            },
            _ => Self::get_uri(ProfileType::Duelist(DuelistProfile::Unknown), base_uri, variant)
        }
    }
}

impl DuelistProfileIntoDescription of Into<DuelistProfile, ProfileDescription> {
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
impl BotProfileIntoDescription of Into<BotProfile, ProfileDescription> {
    fn into(self: BotProfile) -> ProfileDescription {
        match self {
            BotProfile::Unknown =>      BOT_PROFILES::Unknown,
            BotProfile::Scarecrow =>    BOT_PROFILES::Scarecrow,
            BotProfile::TinMan =>       BOT_PROFILES::TinMan,
        }
    }
}

impl U8IntoDuelistProfile of Into<u8, DuelistProfile> {
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
impl U8IntoBotProfile of Into<u8, BotProfile> {
    fn into(self: u8) -> BotProfile {
        if self == 1        { BotProfile::Scarecrow }
        else if self == 2   { BotProfile::TinMan }
        else                { BotProfile::Unknown }
    }
}


//----------------------------------------
// Unit  tests
//
#[cfg(test)]
mod tests {
    use debug::PrintTrait;
    use core::traits::Into;

    use super::{
        ProfileType, ProfileTypeTrait,
        DuelistProfile, BotProfile,
        ProfileDescription,
        // U8IntoDuelistProfile, U8IntoBotProfile,
    };
    use pistols::types::constants::{CONST};

    #[test]
    fn test_duelist_profiles() {
        // validate count
        let profile: DuelistProfile = (CONST::DUELIST_PROFILE_COUNT+1).into();
        assert!(profile == DuelistProfile::Unknown, "DUELIST_PROFILE_COUNT({}) is wrong", CONST::DUELIST_PROFILE_COUNT);
        // validate profiles
        let mut i: u8 = 0;
        let mut last_desc: ProfileDescription = Default::default();
        while (i <= CONST::DUELIST_PROFILE_COUNT) {
            let profile: DuelistProfile = i.into();
            let desc: ProfileDescription = profile.into();
            if (i == 0) {
                assert!(profile == DuelistProfile::Unknown, "Duelist(0)");
            } else {
                assert!(profile != DuelistProfile::Unknown, "Duelist({}) is Unknown", i);
                assert!(desc.name != last_desc.name, "Duelist({}) == Duelist({}): {}", i, i-1, desc.name);
                assert!(desc.profile_id == i, "Duelist({}) bad profile_id: {}", i, desc.profile_id);
            };
            last_desc = desc;
            i += 1;
        };
    }
    #[test]
    fn test_bot_profiles() {
        // validate count
        let profile: BotProfile = (CONST::BOT_PROFILE_COUNT+1).into();
        assert!(profile == BotProfile::Unknown, "BOT_PROFILE_COUNT({}) is wrong", CONST::BOT_PROFILE_COUNT);
        // validate profiles
        let mut i: u8 = 0;
        let mut last_desc: ProfileDescription = Default::default();
        while (i <= CONST::BOT_PROFILE_COUNT) {
            let profile: BotProfile = i.into();
            let desc: ProfileDescription = profile.into();
            if (i == 0) {
                assert!(profile == BotProfile::Unknown, "Bot(0)");
            } else {
                assert!(profile != BotProfile::Unknown, "Bot({}) is Unknown", i);
                assert!(desc.name != last_desc.name, "Bot({}) == Bot({}): {}", i, i-1, desc.name);
                assert!(desc.profile_id == i, "Bot({}) bad profile_id: {}", i, desc.profile_id);
            };
            last_desc = desc;
            i += 1;
        };
    }
}
