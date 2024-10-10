
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
    // IMPORTANT: must be in sync with EnvCard
    const None: u8 = 0;
    const DamageUp: u8 = 1;
    const DamageDown: u8 = 2;
    const ChancesUp: u8 = 3;
    const ChancesDown: u8 = 4;
    const DoubleDamageUp: u8 = 5;
    const DoubleChancesUp: u8 = 7;
    const SpecialAllShotsHit: u8 = 9;
    const SpecialAllShotsMiss: u8 = 10;
    const SpecialDoubleTactics: u8 = 11;
    const SpecialNoTactics: u8 = 12;
}

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
use pistols::utils::math::{MathU8};

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
                    specials.tactics.apply_points(ref state_self, ref state_other, multiplier);
                    specials.tactics_modifier = self;
                }            
            } else {
                // check reversal
                let multiplier: i8 = if (specials.reversal && points.is_decrease()) {
                    specials.reversal = false;
                    (-1)
                } else {(1)};
                // apply points
                let using_shots_modifier: bool = specials.shots_modifier.is_shots_modifier();
                points.apply(ref state_self, using_shots_modifier, multiplier);
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
            EnvCard::DamageUp =>                ENV_CARDS::DamageUp,
            EnvCard::DamageDown =>              ENV_CARDS::DamageDown,
            EnvCard::ChancesUp =>               ENV_CARDS::ChancesUp,
            EnvCard::ChancesDown =>             ENV_CARDS::ChancesDown,
            EnvCard::DoubleDamageUp =>          ENV_CARDS::DoubleDamageUp,
            EnvCard::DoubleChancesUp =>         ENV_CARDS::DoubleChancesUp,
            EnvCard::SpecialAllShotsHit =>      ENV_CARDS::SpecialAllShotsHit,
            EnvCard::SpecialAllShotsMiss =>     ENV_CARDS::SpecialAllShotsMiss,
            EnvCard::SpecialDoubleTactics =>    ENV_CARDS::SpecialDoubleTactics,
            EnvCard::SpecialNoTactics =>        ENV_CARDS::SpecialNoTactics,
            EnvCard::None =>                    ENV_CARDS::None,
        }
    }
}

impl U8IntoEnvCard of Into<u8, EnvCard> {
    fn into(self: u8) -> EnvCard {
        if self == ENV_CARDS::DamageUp                     { EnvCard::DamageUp }
        else if self == ENV_CARDS::DamageDown              { EnvCard::DamageDown }
        else if self == ENV_CARDS::ChancesUp               { EnvCard::ChancesUp }
        else if self == ENV_CARDS::ChancesDown             { EnvCard::ChancesDown }
        else if self == ENV_CARDS::DoubleDamageUp         { EnvCard::DoubleDamageUp }
        else if self == ENV_CARDS::DoubleChancesUp        { EnvCard::DoubleChancesUp }
        else if self == ENV_CARDS::SpecialAllShotsHit    { EnvCard::SpecialAllShotsHit }
        else if self == ENV_CARDS::SpecialAllShotsMiss   { EnvCard::SpecialAllShotsMiss }
        else if self == ENV_CARDS::SpecialDoubleTactics   { EnvCard::SpecialDoubleTactics }
        else if self == ENV_CARDS::SpecialNoTactics       { EnvCard::SpecialNoTactics }
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
