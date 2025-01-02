
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

// to be exported to typescript by generateConstants
// IMPORTANT: names must be in sync with enum EnvCard
mod ENV_POINTS {
    use pistols::types::cards::cards::{EnvCardPoints, Rarity};
    const DamageUp: EnvCardPoints = EnvCardPoints {
        name: 'Damage Up',
        rarity: Rarity::Common,
        chances: 0,
        damage: 1,
    };
    const DamageDown: EnvCardPoints = EnvCardPoints {
        name: 'Damage Down',
        rarity: Rarity::Common,
        chances: 0,
        damage: -1,
    };
    const ChancesUp: EnvCardPoints = EnvCardPoints {
        name: 'Chances Up',
        rarity: Rarity::Common,
        chances: 10,
        damage: 0,
    };
    const ChancesDown: EnvCardPoints = EnvCardPoints {
        name: 'Chances Down',
        rarity: Rarity::Common,
        chances: -10, 
        damage: 0,
    };
    const DoubleDamageUp: EnvCardPoints = EnvCardPoints {
        name: 'Double Damage Up',
        rarity: Rarity::Uncommon,
        chances: 0,
        damage: 2,
    };
    const DoubleChancesUp: EnvCardPoints = EnvCardPoints {
        name: 'Double Chances Up',
        rarity: Rarity::Uncommon,
        chances: 20,
        damage: 0,
    };
    const SpecialAllShotsHit: EnvCardPoints = EnvCardPoints {
        name: 'All Shots Hit',
        rarity: Rarity::Special,
        chances: 100,
        damage: 0,
    };
    const SpecialAllShotsMiss: EnvCardPoints = EnvCardPoints {
        name: 'All Shots Miss',
        rarity: Rarity::Special,
        chances: -100,
        damage: 0,
    };
    const SpecialDoubleTactics: EnvCardPoints = EnvCardPoints {
        name: 'Double Tactics',
        rarity: Rarity::Special,
        chances: 0,
        damage: 0,
    };
    const SpecialNoTactics: EnvCardPoints = EnvCardPoints {
        name: 'No Tactics',
        rarity: Rarity::Special,
        chances: 0,
        damage: 0,
    };
}

//--------------------
// traits
//
use pistols::types::cards::{
    cards::{EnvCardPoints, EnvCardPointsTrait, Rarity},
    tactics::{TacticsCard, TacticsCardTrait},
};
use pistols::types::duel_progress::{SpecialsDrawn};
use pistols::models::challenge::{DuelistState, DuelistStateTrait};
use pistols::utils::math::{MathTrait};

impl EnvCardDefault of Default<EnvCard> {
    fn default() -> EnvCard {(EnvCard::None)}
}

#[generate_trait]
impl EnvCardImpl of EnvCardTrait {
    fn is_shots_modifier(self: EnvCard) -> bool {
        (match self {
            EnvCard::SpecialAllShotsHit | EnvCard::SpecialAllShotsMiss => true,
            _ => false,
        })
    }
    fn is_tactics_modifier(self: EnvCard) -> bool {
        (match self {
            EnvCard::SpecialDoubleTactics | EnvCard::SpecialNoTactics => true,
            _ => false,
        })
    }
    fn get_points(self: EnvCard) -> EnvCardPoints {
        match self {
            EnvCard::DamageUp =>                ENV_POINTS::DamageUp,
            EnvCard::DamageDown =>              ENV_POINTS::DamageDown,
            EnvCard::ChancesUp =>               ENV_POINTS::ChancesUp,
            EnvCard::ChancesDown =>             ENV_POINTS::ChancesDown,
            EnvCard::DoubleDamageUp =>          ENV_POINTS::DoubleDamageUp,
            EnvCard::DoubleChancesUp =>         ENV_POINTS::DoubleChancesUp,
            EnvCard::SpecialAllShotsHit =>      ENV_POINTS::SpecialAllShotsHit,
            EnvCard::SpecialAllShotsMiss =>     ENV_POINTS::SpecialAllShotsMiss,
            EnvCard::SpecialDoubleTactics =>    ENV_POINTS::SpecialDoubleTactics,
            EnvCard::SpecialNoTactics =>        ENV_POINTS::SpecialNoTactics,
            EnvCard::None =>                    Default::default(),
        }
    }
    #[inline(always)]
    fn apply_points(self: EnvCard, ref specials: SpecialsDrawn, ref state_self: DuelistState, ref state_other: DuelistState) {
        if (self != EnvCard::None) {
            let points: EnvCardPoints = self.get_points();
            if (points.is_special()) {
                if (specials.coin_toss) {
                    // duelist blocked 1st special
                    specials.coin_toss = false;
                } else if (self.is_shots_modifier()) {
                    // All shots hit or miss
                    state_self.apply_chances(points.chances);
                    specials.shots_modifier = self;
                } else if (self.is_tactics_modifier()) {
                    // Double or No tactics
                    let multiplier: i8 =
                        if (self == EnvCard::SpecialDoubleTactics)
                            {if (specials.tactics_modifier == EnvCard::SpecialNoTactics) {(2)} else {(1)}}
                        else if (self == EnvCard::SpecialNoTactics)
                            {if (specials.tactics_modifier == EnvCard::SpecialDoubleTactics) {(-2)} else {(-1)}}
                        else {(0)}; // not happening!
                    specials.tactics.apply_points(ref state_self, ref state_other, multiplier, specials.shots_modifier);
                    specials.tactics_modifier = self;
                }            
            } else {
                // check reversal
                let multiplier: i8 = if (specials.reversal && points.is_decrease()) {
                    specials.reversal = false;
                    (-1)
                } else {(1)};
                // apply points
                points.apply(ref state_self, multiplier, specials.shots_modifier);
            }
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
            EnvCard::None =>                    0,
            EnvCard::DamageUp =>                1,
            EnvCard::DamageDown =>              2,
            EnvCard::ChancesUp =>               3,
            EnvCard::ChancesDown =>             4,
            EnvCard::DoubleDamageUp =>          5,
            EnvCard::DoubleChancesUp =>         6,
            EnvCard::SpecialAllShotsHit =>      7,
            EnvCard::SpecialAllShotsMiss =>     8,
            EnvCard::SpecialDoubleTactics =>    9,
            EnvCard::SpecialNoTactics =>        10,
        }
    }
}

impl U8IntoEnvCard of Into<u8, EnvCard> {
    fn into(self: u8) -> EnvCard {
        if self == 1        { EnvCard::DamageUp }
        else if self == 2   { EnvCard::DamageDown }
        else if self == 3   { EnvCard::ChancesUp }
        else if self == 4   { EnvCard::ChancesDown }
        else if self == 5   { EnvCard::DoubleDamageUp }
        else if self == 6   { EnvCard::DoubleChancesUp }
        else if self == 7   { EnvCard::SpecialAllShotsHit }
        else if self == 8   { EnvCard::SpecialAllShotsMiss }
        else if self == 9   { EnvCard::SpecialDoubleTactics }
        else if self == 10  { EnvCard::SpecialNoTactics }
        else                { EnvCard::None }
    }
}

// for println! and format!
impl EnvCardDisplay of Display<EnvCard> {
    fn fmt(self: @EnvCard, ref f: Formatter) -> Result<(), Error> {
        let name: ByteArray = (*self).get_points().name.to_string();
        let value: u8 = (*self).into();
        let str: ByteArray = format!("({}:{})", value, name);
        f.buffer.append(@str);
        Result::Ok(())
    }
}


//----------------------------------------
// Unit  tests
//
#[cfg(test)]
mod tests {
    use core::traits::Into;
    use super::{EnvCard};

    #[test]
    fn test_into_u8() {
        let mut i: u8 = 0;
        loop {
            let card: EnvCard = i.into();
            if (i > 0 && card == EnvCard::None) {
                break;
            }
            let as_u8: u8 = card.into();
            assert!(i == as_u8, "{} != {}", i, as_u8);
            // println!("EnvCard {} == {}", i, as_u8);
            i += 1;
        };
    }
}
