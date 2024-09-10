
#[derive(Copy, Drop, Serde, PartialEq, Introspect)]
enum EnvCard {
    None,
    // Common
    CommonDamageUp,
    CommonDamageDown,
    CommonChancesUp,
    CommonChancesDown,
    // Uncommon
    UncommonDamageUp,
    UncommonChancesUp,
    // Special
    SpecialAllShotsHit,
    SpecialAllShotsMiss,
    SpecialDoubleTactics,
    SpecialNoTactics,
}

//--------------------
// constants
//

mod ENV_CARDS {
    const NONE: u8 = 0;
    const COMMON_DAMAGE_UP: u8 = 1;
    const COMMON_DAMAGE_DOWN: u8 = 2;
    const COMMON_CHANCES_UP: u8 = 3;
    const COMMON_CHANCES_DOWN: u8 = 4;
    const UNCOMMON_DAMAGE_UP: u8 = 5;
    const UNCOMMON_CHANCES_UP: u8 = 7;
    const SPECIAL_ALL_SHOTS_HIT: u8 = 9;
    const SPECIAL_ALL_SHOTS_MISS: u8 = 10;
    const SPECIAL_DOUBLE_TACTICS: u8 = 11;
    const SPECIAL_NO_TACTICS: u8 = 12;
}

mod ENV_POINTS {
    use pistols::types::cards::cards::{EnvCardPoints, Rarity};
    const COMMON_DAMAGE_UP: EnvCardPoints = EnvCardPoints {
        name: 'Damage Up',
        rarity: Rarity::Common,
        chances: 0,
        damage: 1,
        one_shot: false,
        tactics_multiplier: 1,
    };
    const COMMON_DAMAGE_DOWN: EnvCardPoints = EnvCardPoints {
        name: 'Damage Down',
        rarity: Rarity::Common,
        chances: 0,
        damage: -1,
        one_shot: false,
        tactics_multiplier: 1,
    };
    const COMMON_CHANCES_UP: EnvCardPoints = EnvCardPoints {
        name: 'Chances Up',
        rarity: Rarity::Common,
        chances: 10,
        damage: 0,
        one_shot: false,
        tactics_multiplier: 1,
    };
    const COMMON_CHANCES_DOWN: EnvCardPoints = EnvCardPoints {
        name: 'Chances Down',
        rarity: Rarity::Common,
        chances: -10, 
        damage: 0,
        one_shot: false,
        tactics_multiplier: 1,
    };
    const UNCOMMON_DAMAGE_UP: EnvCardPoints = EnvCardPoints {
        name: 'Damage Up',
        rarity: Rarity::Uncommon,
        chances: 0,
        damage: 2,
        one_shot: false,
        tactics_multiplier: 1,
    };
    const UNCOMMON_CHANCES_UP: EnvCardPoints = EnvCardPoints {
        name: 'Chances Up',
        rarity: Rarity::Uncommon,
        chances: 20,
        damage: 0,
        one_shot: false,
        tactics_multiplier: 1,
    };
    const SPECIAL_ALL_SHOTS_HIT: EnvCardPoints = EnvCardPoints {
        name: 'All Shots Hit',
        rarity: Rarity::Special,
        chances: 100,
        damage: 100,
        one_shot: true,
        tactics_multiplier: 1,
    };
    const SPECIAL_ALL_SHOTS_MISS: EnvCardPoints = EnvCardPoints {
        name: 'All Shots Miss',
        rarity: Rarity::Special,
        chances: -100,
        damage: -100,
        one_shot: true,
        tactics_multiplier: 1,
    };
    const SPECIAL_DOUBLE_TACTICS: EnvCardPoints = EnvCardPoints {
        name: 'Double Tactics',
        rarity: Rarity::Special,
        chances: 0,
        damage: 0,
        one_shot: true,
        tactics_multiplier: 2,
    };
    const SPECIAL_NO_TACTICS: EnvCardPoints = EnvCardPoints {
        name: 'No Tactics',
        rarity: Rarity::Special,
        chances: 0,
        damage: 0,
        one_shot: true,
        tactics_multiplier: 0,
    };
}

//--------------------
// traits
//
use pistols::types::cards::cards::{EnvCardPoints, EnvCardPointsTrait};
use pistols::models::challenge::{PlayerState};

#[generate_trait]
impl EnvCardImpl of EnvCardTrait {
    fn get_points(self: EnvCard) -> EnvCardPoints {
        match self {
            EnvCard::CommonDamageUp =>          ENV_POINTS::COMMON_DAMAGE_UP,
            EnvCard::CommonDamageDown =>        ENV_POINTS::COMMON_DAMAGE_DOWN,
            EnvCard::CommonChancesUp =>         ENV_POINTS::COMMON_CHANCES_UP,
            EnvCard::CommonChancesDown =>       ENV_POINTS::COMMON_CHANCES_DOWN,
            EnvCard::UncommonDamageUp =>        ENV_POINTS::UNCOMMON_DAMAGE_UP,
            EnvCard::UncommonChancesUp =>       ENV_POINTS::UNCOMMON_CHANCES_UP,
            EnvCard::SpecialAllShotsHit =>      ENV_POINTS::SPECIAL_ALL_SHOTS_HIT,
            EnvCard::SpecialAllShotsMiss =>     ENV_POINTS::SPECIAL_ALL_SHOTS_MISS,
            EnvCard::SpecialDoubleTactics =>    ENV_POINTS::SPECIAL_DOUBLE_TACTICS,
            EnvCard::SpecialNoTactics =>        ENV_POINTS::SPECIAL_NO_TACTICS,
            EnvCard::None =>                    Default::default(),
        }
    }
    #[inline(always)]
    fn apply_points(self: EnvCard, ref state_self: PlayerState, ref state_other: PlayerState) {
        self.get_points().apply(ref state_self, ref state_other);
    }
    fn get_full_deck() -> Array<EnvCard> {
        (array![
            // 7
            EnvCard::CommonDamageUp,
            EnvCard::CommonDamageUp,
            EnvCard::CommonDamageUp,
            EnvCard::CommonDamageUp,
            EnvCard::CommonDamageUp,
            EnvCard::CommonDamageUp,
            EnvCard::CommonDamageUp,
            // 5
            EnvCard::CommonDamageDown,
            EnvCard::CommonDamageDown,
            EnvCard::CommonDamageDown,
            EnvCard::CommonDamageDown,
            EnvCard::CommonDamageDown,
            // 7
            EnvCard::CommonChancesUp,
            EnvCard::CommonChancesUp,
            EnvCard::CommonChancesUp,
            EnvCard::CommonChancesUp,
            EnvCard::CommonChancesUp,
            EnvCard::CommonChancesUp,
            EnvCard::CommonChancesUp,
            // 5
            EnvCard::CommonChancesDown,
            EnvCard::CommonChancesDown,
            EnvCard::CommonChancesDown,
            EnvCard::CommonChancesDown,
            EnvCard::CommonChancesDown,
            // 3
            EnvCard::UncommonDamageUp,
            EnvCard::UncommonDamageUp,
            EnvCard::UncommonDamageUp,
            // 3
            EnvCard::UncommonChancesUp,
            EnvCard::UncommonChancesUp,
            EnvCard::UncommonChancesUp, 
            // 1
            EnvCard::SpecialAllShotsHit,
            EnvCard::SpecialAllShotsMiss,
            EnvCard::SpecialDoubleTactics,
            EnvCard::SpecialNoTactics,
        ])
    }
}


//--------------------
// converters
//

impl EnvCardIntoU8 of Into<EnvCard, u8> {
    fn into(self: EnvCard) -> u8 {
        match self {
            EnvCard::CommonDamageUp =>          ENV_CARDS::COMMON_DAMAGE_UP,
            EnvCard::CommonDamageDown =>        ENV_CARDS::COMMON_DAMAGE_DOWN,
            EnvCard::CommonChancesUp =>         ENV_CARDS::COMMON_CHANCES_UP,
            EnvCard::CommonChancesDown =>       ENV_CARDS::COMMON_CHANCES_DOWN,
            EnvCard::UncommonDamageUp =>        ENV_CARDS::UNCOMMON_DAMAGE_UP,
            EnvCard::UncommonChancesUp =>       ENV_CARDS::UNCOMMON_CHANCES_UP,
            EnvCard::SpecialAllShotsHit =>      ENV_CARDS::SPECIAL_ALL_SHOTS_HIT,
            EnvCard::SpecialAllShotsMiss =>     ENV_CARDS::SPECIAL_ALL_SHOTS_MISS,
            EnvCard::SpecialDoubleTactics =>    ENV_CARDS::SPECIAL_DOUBLE_TACTICS,
            EnvCard::SpecialNoTactics =>        ENV_CARDS::SPECIAL_NO_TACTICS,
            EnvCard::None =>                    ENV_CARDS::NONE,
        }
    }
}

impl U8IntoEnvCard of Into<u8, EnvCard> {
    fn into(self: u8) -> EnvCard {
        if self == ENV_CARDS::COMMON_DAMAGE_UP              { EnvCard::CommonDamageUp }
        else if self == ENV_CARDS::COMMON_DAMAGE_DOWN       { EnvCard::CommonDamageDown }
        else if self == ENV_CARDS::COMMON_CHANCES_UP        { EnvCard::CommonChancesUp }
        else if self == ENV_CARDS::COMMON_CHANCES_DOWN      { EnvCard::CommonChancesDown }
        else if self == ENV_CARDS::UNCOMMON_DAMAGE_UP       { EnvCard::UncommonDamageUp }
        else if self == ENV_CARDS::UNCOMMON_CHANCES_UP      { EnvCard::UncommonChancesUp }
        else if self == ENV_CARDS::SPECIAL_ALL_SHOTS_HIT    { EnvCard::SpecialAllShotsHit }
        else if self == ENV_CARDS::SPECIAL_ALL_SHOTS_MISS   { EnvCard::SpecialAllShotsMiss }
        else if self == ENV_CARDS::SPECIAL_DOUBLE_TACTICS   { EnvCard::SpecialDoubleTactics }
        else if self == ENV_CARDS::SPECIAL_NO_TACTICS       { EnvCard::SpecialNoTactics }
        else                                                { EnvCard::None }
    }
}
