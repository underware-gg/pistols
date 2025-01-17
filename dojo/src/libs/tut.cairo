use starknet::{ContractAddress};

#[derive(Copy, Drop, Serde, PartialEq, Introspect)]
pub enum TutorialLevel {
    Undefined,  // 0
    Level1,     // 1
    Level2,     // 2
}


//--------------------------------
// Traits
//
use pistols::types::profile_type::{ProfileType,CharacterProfile};
use pistols::utils::misc::{FeltToLossy};
use pistols::utils::hash::{hash_values};

#[generate_trait]
impl TutorialImpl of TutorialTrait {
    #[inline(always)]
    fn make_duel_id(player_address: ContractAddress, tutorial_id: u128) -> u128 {
        (hash_values([
            player_address.into(),
            tutorial_id.into(),
        ].span()).to_u32_lossy().into())
    }
}

#[generate_trait]
impl TutorialLevelImpl of TutorialLevelTrait {
    #[inline(always)]
    fn opponent_profile(self: TutorialLevel) -> ProfileType {
        match self {
            TutorialLevel::Level1 => ProfileType::Character(CharacterProfile::Drunken),
            TutorialLevel::Level2 => ProfileType::Character(CharacterProfile::Bartender),
            _ => ProfileType::Undefined,
        }
    }
}

impl U128IntoTutorialLevel of Into<u128, TutorialLevel> {
    fn into(self: u128) -> TutorialLevel {
        if self == 1        { TutorialLevel::Level1 }
        else if self == 2   { TutorialLevel::Level2 }
        else                { TutorialLevel::Undefined }
    }
}
