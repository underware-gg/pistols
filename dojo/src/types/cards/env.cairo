
#[derive(Copy, Drop, Serde, PartialEq, Introspect)]
pub enum EnvCard {
    None,
    // Common
    DamageUp,
    DamageDown,
    ChancesUp,
    ChancesDown,
    // Uncommon
    DoubleDamageUp,
    DoubleChancesUp,
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
    const DAMAGE_UP: u8 = 1;
    const DAMAGE_DOWN: u8 = 2;
    const CHANCES_UP: u8 = 3;
    const CHANCES_DOWN: u8 = 4;
    const DOUBLE_DAMAGE_UP: u8 = 5;
    const DOUBLE_CHANCES_UP: u8 = 7;
    const SPECIAL_ALL_SHOTS_HIT: u8 = 9;
    const SPECIAL_ALL_SHOTS_MISS: u8 = 10;
    const SPECIAL_DOUBLE_TACTICS: u8 = 11;
    const SPECIAL_NO_TACTICS: u8 = 12;
}

mod ENV_POINTS {
    use pistols::types::cards::cards::{EnvCardPoints, Rarity};
    const DAMAGE_UP: EnvCardPoints = EnvCardPoints {
        name: 'Damage Up',
        rarity: Rarity::Common,
        chances: 0,
        damage: 1,
        one_step: false,
        tactics_multiplier: 1,
    };
    const DAMAGE_DOWN: EnvCardPoints = EnvCardPoints {
        name: 'Damage Down',
        rarity: Rarity::Common,
        chances: 0,
        damage: -1,
        one_step: false,
        tactics_multiplier: 1,
    };
    const CHANCES_UP: EnvCardPoints = EnvCardPoints {
        name: 'Chances Up',
        rarity: Rarity::Common,
        chances: 10,
        damage: 0,
        one_step: false,
        tactics_multiplier: 1,
    };
    const CHANCES_DOWN: EnvCardPoints = EnvCardPoints {
        name: 'Chances Down',
        rarity: Rarity::Common,
        chances: -10, 
        damage: 0,
        one_step: false,
        tactics_multiplier: 1,
    };
    const DOUBLE_DAMAGE_UP: EnvCardPoints = EnvCardPoints {
        name: 'Double Damage Up',
        rarity: Rarity::Uncommon,
        chances: 0,
        damage: 2,
        one_step: false,
        tactics_multiplier: 1,
    };
    const DOUBLE_CHANCES_UP: EnvCardPoints = EnvCardPoints {
        name: 'Double Chances Up',
        rarity: Rarity::Uncommon,
        chances: 20,
        damage: 0,
        one_step: false,
        tactics_multiplier: 1,
    };
    const SPECIAL_ALL_SHOTS_HIT: EnvCardPoints = EnvCardPoints {
        name: 'All Shots Hit',
        rarity: Rarity::Special,
        chances: 100,
        damage: 100,
        one_step: true,
        tactics_multiplier: 1,
    };
    const SPECIAL_ALL_SHOTS_MISS: EnvCardPoints = EnvCardPoints {
        name: 'All Shots Miss',
        rarity: Rarity::Special,
        chances: -100,
        damage: -100,
        one_step: true,
        tactics_multiplier: 1,
    };
    const SPECIAL_DOUBLE_TACTICS: EnvCardPoints = EnvCardPoints {
        name: 'Double Tactics',
        rarity: Rarity::Special,
        chances: 0,
        damage: 0,
        one_step: true,
        tactics_multiplier: 2,
    };
    const SPECIAL_NO_TACTICS: EnvCardPoints = EnvCardPoints {
        name: 'No Tactics',
        rarity: Rarity::Special,
        chances: 0,
        damage: 0,
        one_step: true,
        tactics_multiplier: 0,
    };
}

//--------------------
// traits
//
use pistols::types::cards::cards::{EnvCardPoints, EnvCardPointsTrait};
use pistols::models::challenge::{PlayerState};

impl EnvCardDefault of Default<EnvCard> {
    fn default() -> EnvCard {(EnvCard::None)}
}

#[generate_trait]
impl EnvCardImpl of EnvCardTrait {
    fn get_points(self: EnvCard) -> EnvCardPoints {
        match self {
            EnvCard::DamageUp =>                ENV_POINTS::DAMAGE_UP,
            EnvCard::DamageDown =>              ENV_POINTS::DAMAGE_DOWN,
            EnvCard::ChancesUp =>               ENV_POINTS::CHANCES_UP,
            EnvCard::ChancesDown =>             ENV_POINTS::CHANCES_DOWN,
            EnvCard::DoubleDamageUp =>          ENV_POINTS::DOUBLE_DAMAGE_UP,
            EnvCard::DoubleChancesUp =>         ENV_POINTS::DOUBLE_CHANCES_UP,
            EnvCard::SpecialAllShotsHit =>      ENV_POINTS::SPECIAL_ALL_SHOTS_HIT,
            EnvCard::SpecialAllShotsMiss =>     ENV_POINTS::SPECIAL_ALL_SHOTS_MISS,
            EnvCard::SpecialDoubleTactics =>    ENV_POINTS::SPECIAL_DOUBLE_TACTICS,
            EnvCard::SpecialNoTactics =>        ENV_POINTS::SPECIAL_NO_TACTICS,
            EnvCard::None =>                    Default::default(),
        }
    }
    #[inline(always)]
    fn apply_points(self: EnvCard, ref state_self: PlayerState, ref state_other: PlayerState, global_state: bool) {
        if (self != EnvCard::None) {
            self.get_points().apply(ref state_self, ref state_other, global_state);
        }
    }
    fn get_full_deck() -> Array<EnvCard> {
        (array![
            // 7
            EnvCard::DamageUp, // dice: 1
            EnvCard::DamageUp, // dice: 2
            EnvCard::DamageUp, // dice: 3
            EnvCard::DamageUp, // dice: 4
            EnvCard::DamageUp, // dice: 5
            EnvCard::DamageUp, // dice: 6
            EnvCard::DamageUp, // dice: 7
            // 5
            EnvCard::DamageDown, // dice: 8
            EnvCard::DamageDown, // dice: 9
            EnvCard::DamageDown, // dice: 10
            EnvCard::DamageDown, // dice: 11
            EnvCard::DamageDown, // dice: 12
            // 7
            EnvCard::ChancesUp, // dice: 13
            EnvCard::ChancesUp, // dice: 14
            EnvCard::ChancesUp, // dice: 15
            EnvCard::ChancesUp, // dice: 16
            EnvCard::ChancesUp, // dice: 17
            EnvCard::ChancesUp, // dice: 18
            EnvCard::ChancesUp, // dice: 19
            // 5
            EnvCard::ChancesDown, // dice: 20
            EnvCard::ChancesDown, // dice: 21
            EnvCard::ChancesDown, // dice: 22
            EnvCard::ChancesDown, // dice: 23
            EnvCard::ChancesDown, // dice: 24
            // 3
            EnvCard::DoubleDamageUp, // dice: 25
            EnvCard::DoubleDamageUp, // dice: 26
            EnvCard::DoubleDamageUp, // dice: 27
            // 3
            EnvCard::DoubleChancesUp, // dice: 28
            EnvCard::DoubleChancesUp, // dice: 29
            EnvCard::DoubleChancesUp, // dice: 30
            // 1
            EnvCard::SpecialAllShotsHit,   // dice: 31
            EnvCard::SpecialAllShotsMiss,  // dice: 32
            EnvCard::SpecialDoubleTactics, // dice: 33
            EnvCard::SpecialNoTactics,     // dice: 34
            // used for testing
            // EnvCard::None, // 34
        ])
    }
}


//--------------------
// converters
//
use debug::PrintTrait;
use core::fmt::{Display, Formatter, Error};
use pistols::utils::short_string::{ShortStringTrait};

impl EnvCardIntoU8 of Into<EnvCard, u8> {
    fn into(self: EnvCard) -> u8 {
        match self {
            EnvCard::DamageUp =>                ENV_CARDS::DAMAGE_UP,
            EnvCard::DamageDown =>              ENV_CARDS::DAMAGE_DOWN,
            EnvCard::ChancesUp =>               ENV_CARDS::CHANCES_UP,
            EnvCard::ChancesDown =>             ENV_CARDS::CHANCES_DOWN,
            EnvCard::DoubleDamageUp =>          ENV_CARDS::DOUBLE_DAMAGE_UP,
            EnvCard::DoubleChancesUp =>         ENV_CARDS::DOUBLE_CHANCES_UP,
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
        if self == ENV_CARDS::DAMAGE_UP                     { EnvCard::DamageUp }
        else if self == ENV_CARDS::DAMAGE_DOWN              { EnvCard::DamageDown }
        else if self == ENV_CARDS::CHANCES_UP               { EnvCard::ChancesUp }
        else if self == ENV_CARDS::CHANCES_DOWN             { EnvCard::ChancesDown }
        else if self == ENV_CARDS::DOUBLE_DAMAGE_UP         { EnvCard::DoubleDamageUp }
        else if self == ENV_CARDS::DOUBLE_CHANCES_UP        { EnvCard::DoubleChancesUp }
        else if self == ENV_CARDS::SPECIAL_ALL_SHOTS_HIT    { EnvCard::SpecialAllShotsHit }
        else if self == ENV_CARDS::SPECIAL_ALL_SHOTS_MISS   { EnvCard::SpecialAllShotsMiss }
        else if self == ENV_CARDS::SPECIAL_DOUBLE_TACTICS   { EnvCard::SpecialDoubleTactics }
        else if self == ENV_CARDS::SPECIAL_NO_TACTICS       { EnvCard::SpecialNoTactics }
        else                                                { EnvCard::None }
    }
}

impl EnvCardIntoFelt252 of Into<EnvCard, felt252> {
    fn into(self: EnvCard) -> felt252 {
        let v: u8 = self.into();
        (v.into())
    }
}

impl EnvCardPrintImpl of PrintTrait<EnvCard> {
    fn print(self: EnvCard) {
        self.get_points().name.print();
    }
}

// for println! and format!
impl EnvCardDisplay of Display<EnvCard> {
    fn fmt(self: @EnvCard, ref f: Formatter) -> Result<(), Error> {
        let name: ByteArray = (*self).get_points().name.string();
        let value: felt252 = (*self).into();
        let str: ByteArray = format!("({}:{})", value, name);
        f.buffer.append(@str);
        Result::Ok(())
    }
}
