use starknet::ContractAddress;

#[derive(Serde, Copy, Drop, PartialEq, Introspect)]
pub enum ProfileType {
    Undefined,
    Duelist: u8,    // Duelist(value)
    Bot: u8,        // Bot(value)
    // Eternum: u16,   // Eternum(realm id)
}
impl ProfileTypeDefault of Default<ProfileType> {
    fn default() -> ProfileType {(ProfileType::Undefined)}
}

mod DUELIST_NAMES {
    const DuelistName00: felt252 = 'Unknown';
    const DuelistName01: felt252 = 'Duke';
    const DuelistName02: felt252 = 'Duella';
    const DuelistName03: felt252 = 'Jameson';
    const DuelistName04: felt252 = 'Pilgrim';
    const DuelistName05: felt252 = 'Jack';
    const DuelistName06: felt252 = 'Pops';
    const DuelistName07: felt252 = 'Ser Walker';
    const DuelistName08: felt252 = 'Bloberto';
    const DuelistName09: felt252 = 'Squiddo';
    const DuelistName10: felt252 = 'Slender Duck';
    const DuelistName11: felt252 = 'Lady Vengeance';
    const DuelistName12: felt252 = 'Breadman';
    const DuelistName13: felt252 = 'Brutus';
    const DuelistName14: felt252 = 'Pistolopher';
    const DuelistName15: felt252 = 'Secreto';
    const DuelistName16: felt252 = 'Shadow Mare';
    const DuelistName17: felt252 = 'Karaku';
    const DuelistName18: felt252 = 'Misty';
    const DuelistName19: felt252 = 'Kenzu';
    const DuelistName20: felt252 = 'Nyn Jah';
    const DuelistName21: felt252 = 'Thrak';
}

mod BOT_NAMES {
    const BotName00: felt252 = 'Unknown';
    const BotName01: felt252 = 'Scarecrow';
    const BotName02: felt252 = 'Tin Man';
}


//----------------------------------
// Traits
//
use pistols::types::constants::{CONST};
use pistols::utils::misc::{felt_to_u8};

#[generate_trait]
impl ProfileTypeImpl of ProfileTypeTrait {
    fn profile_count(self: ProfileType) -> u32 {
        match self {
            ProfileType::Undefined => 0,
            ProfileType::Duelist => CONST::DUELIST_PROFILE_COUNT.into(),
            ProfileType::Bot => CONST::BOT_PROFILE_COUNT.into(),
        }
    }
    fn randomize(self: ProfileType, seed: felt252) -> ProfileType {
        match self {
            ProfileType::Undefined => ProfileType::Undefined,
            ProfileType::Duelist => {
                let value: u8 = (felt_to_u8(seed) % CONST::DUELIST_PROFILE_COUNT) + 1;
                (ProfileType::Duelist(value))
            },
            ProfileType::Bot => {
                let value: u8 = (felt_to_u8(seed) % CONST::BOT_PROFILE_COUNT) + 1;
                (ProfileType::Bot(value))
            },
        }
    }
    fn name(self: ProfileType) -> felt252 {
        match self {
            ProfileType::Undefined => 'Unknown',
            ProfileType::Duelist(value) => {
                match value {
                    0 => DUELIST_NAMES::DuelistName00,
                    1 => DUELIST_NAMES::DuelistName01,
                    2 => DUELIST_NAMES::DuelistName02,
                    3 => DUELIST_NAMES::DuelistName03,
                    4 => DUELIST_NAMES::DuelistName04,
                    5 => DUELIST_NAMES::DuelistName05,
                    6 => DUELIST_NAMES::DuelistName06,
                    7 => DUELIST_NAMES::DuelistName07,
                    8 => DUELIST_NAMES::DuelistName08,
                    9 => DUELIST_NAMES::DuelistName09,
                    10 => DUELIST_NAMES::DuelistName10,
                    11 => DUELIST_NAMES::DuelistName11,
                    12 => DUELIST_NAMES::DuelistName12,
                    13 => DUELIST_NAMES::DuelistName13,
                    14 => DUELIST_NAMES::DuelistName14,
                    15 => DUELIST_NAMES::DuelistName15,
                    16 => DUELIST_NAMES::DuelistName16,
                    17 => DUELIST_NAMES::DuelistName17,
                    18 => DUELIST_NAMES::DuelistName18,
                    19 => DUELIST_NAMES::DuelistName19,
                    20 => DUELIST_NAMES::DuelistName20,
                    21 => DUELIST_NAMES::DuelistName21,
                    _ => 'Missing',
                }
            },
            ProfileType::Bot(value) => {
                match value {
                    0 => BOT_NAMES::BotName00,
                    1 => BOT_NAMES::BotName01,
                    2 => BOT_NAMES::BotName02,
                    _ => 'Missing',
                }
            },
        }
    }
    fn get_uri(self: ProfileType,
        base_uri: ByteArray,
        variant: ByteArray,    
    ) -> ByteArray {
        match self {
            ProfileType::Duelist(value) => {
                let number = if (value < 10) {format!("0{}", value)} else {format!("{}", value)};
                (format!("{}/profiles/duelists/{}/{}.jpg", base_uri, variant, number))
            },
            ProfileType::Bot(value) => {
                let number = if (value < 10) {format!("0{}", value)} else {format!("{}", value)};
                (format!("{}/profiles/bots/{}/{}.jpg", base_uri, variant, number))
            },
            _ => Self::get_uri(ProfileType::Duelist(0), base_uri, variant)
        }
    }
}



//----------------------------------------
// Unit  tests
//
#[cfg(test)]
mod tests {
    use debug::PrintTrait;
    use core::traits::Into;

    use super::{ProfileType, ProfileTypeTrait};
    use pistols::types::constants::{CONST};

    #[test]
    fn test_profile_names() {
        let mut i: u8 = 0;
        while (i <= CONST::DUELIST_PROFILE_COUNT) {
            let profile_type = ProfileType::Duelist(i);
            let name = profile_type.name();
            if (i == 0) {
                assert(name == 'Unknown', 'Duelist(0)');
            } else {
                assert!(name != 'Unknown', "Duelist({}) is Unknown", i);
                assert!(name != 'Missing', "Duelist({}) is Missing", i);
                assert!(name != ProfileType::Duelist(i-1).name(), "Duelist({}) == Duelist({}): {}", i, i-1, name);
            }
            i += 1;
        };
        let mut i: u8 = 0;
        while (i <= CONST::BOT_PROFILE_COUNT) {
            let profile_type = ProfileType::Bot(i);
            let name = profile_type.name();
            if (i == 0) {
                assert(name == 'Unknown', 'Bot(0)');
            } else {
                assert!(name != 'Unknown', "Bot({}) is Unknown", i);
                assert!(name != 'Missing', "Bot({}) is Missing", i);
                assert!(name != ProfileType::Bot(i-1).name(), "Bot({}) == Bot({}): {}", i, i-1, name);
            }
            i += 1;
        };
    }
}
