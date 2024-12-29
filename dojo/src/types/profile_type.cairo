use starknet::ContractAddress;

#[derive(Serde, Copy, Drop, PartialEq, Introspect)]
pub enum ProfileType {
    Undefined,
    Duelist: u8,    // Duelist(index)
    Bot: u8,        // Bot(index)
    // Eternum: u16,   // Eternum(realm id)
}
impl ProfileTypeDefault of Default<ProfileType> {
    fn default() -> ProfileType {(ProfileType::Undefined)}
}

mod DUELIST_NAMES {
    const Duelist00: felt252 = 'Unknown';
    const Duelist01: felt252 = 'Duke';
    const Duelist02: felt252 = 'Duella';
    const Duelist03: felt252 = 'Jameson';
    const Duelist04: felt252 = 'Pilgrim';
    const Duelist05: felt252 = 'Jack';
    const Duelist06: felt252 = 'Pops';
    const Duelist07: felt252 = 'Ser Walker';
    const Duelist08: felt252 = 'Bloberto';
    const Duelist09: felt252 = 'Squiddo';
    const Duelist10: felt252 = 'Slender Duck';
    const Duelist11: felt252 = 'Lady Vengeance';
    const Duelist12: felt252 = 'Breadman';
    const Duelist13: felt252 = 'Brutus';
    const Duelist14: felt252 = 'Pistolopher';
    const Duelist15: felt252 = 'Secreto';
    const Duelist16: felt252 = 'Shadow Mare';
    const Duelist17: felt252 = 'Karaku';
    const Duelist18: felt252 = 'Misty';
    const Duelist19: felt252 = 'Kenzu';
    const Duelist20: felt252 = 'Nyn Jah';
    const Duelist21: felt252 = 'Thrak';
}

mod BOT_NAMES {
    const Bot00: felt252 = 'Unknown';
    const Bot01: felt252 = 'Scarecrow';
    const Bot02: felt252 = 'Tin Man';
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
                let index: u8 = (felt_to_u8(seed) % CONST::DUELIST_PROFILE_COUNT) + 1;
                (ProfileType::Duelist(index))
            },
            ProfileType::Bot => {
                let index: u8 = (felt_to_u8(seed) % CONST::BOT_PROFILE_COUNT) + 1;
                (ProfileType::Bot(index))
            },
        }
    }
    fn name(self: ProfileType) -> felt252 {
        match self {
            ProfileType::Undefined => 'Unknown',
            ProfileType::Duelist(index) => {
                match index {
                    0 => DUELIST_NAMES::Duelist00,
                    1 => DUELIST_NAMES::Duelist01,
                    2 => DUELIST_NAMES::Duelist02,
                    3 => DUELIST_NAMES::Duelist03,
                    4 => DUELIST_NAMES::Duelist04,
                    5 => DUELIST_NAMES::Duelist05,
                    6 => DUELIST_NAMES::Duelist06,
                    7 => DUELIST_NAMES::Duelist07,
                    8 => DUELIST_NAMES::Duelist08,
                    9 => DUELIST_NAMES::Duelist09,
                    10 => DUELIST_NAMES::Duelist10,
                    11 => DUELIST_NAMES::Duelist11,
                    12 => DUELIST_NAMES::Duelist12,
                    13 => DUELIST_NAMES::Duelist13,
                    14 => DUELIST_NAMES::Duelist14,
                    15 => DUELIST_NAMES::Duelist15,
                    16 => DUELIST_NAMES::Duelist16,
                    17 => DUELIST_NAMES::Duelist17,
                    18 => DUELIST_NAMES::Duelist18,
                    19 => DUELIST_NAMES::Duelist19,
                    20 => DUELIST_NAMES::Duelist20,
                    21 => DUELIST_NAMES::Duelist21,
                    _ => 'Missing',
                }
            },
            ProfileType::Bot(index) => {
                match index {
                    0 => BOT_NAMES::Bot00,
                    1 => BOT_NAMES::Bot01,
                    2 => BOT_NAMES::Bot02,
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
            ProfileType::Duelist(index) => {
                let number = if (index < 10) {format!("0{}", index)} else {format!("{}", index)};
                (format!("{}/profiles/duelists/{}/{}.jpg", base_uri, variant, number))
            },
            ProfileType::Bot(index) => {
                let number = if (index < 10) {format!("0{}", index)} else {format!("{}", index)};
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
