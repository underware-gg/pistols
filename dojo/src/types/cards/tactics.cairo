
#[derive(Copy, Drop, Serde, PartialEq, Introspect)]
pub enum TacticsCard {
    None,
    //
    Insult,
    CoinToss,
    Vengeful,
    ThickCoat,
    Reversal,
    Bananas,
}


//--------------------
// constants
//

mod TACTICS_POINTS {
    use pistols::types::cards::cards::{CardPoints};
    pub const Insult: CardPoints = CardPoints {
        name: 'Insult',
        self_chances: 0,
        self_damage: 0,
        other_chances: -10,
        other_damage: 1,
        special: '',
    };
    pub const CoinToss: CardPoints = CardPoints {
        name: 'Coin Toss',
        self_chances: 0,
        self_damage: 0,
        other_chances: 0,
        other_damage: 0,
        special: 'First special doesnt affect you',
    };
    pub const Vengeful: CardPoints = CardPoints {
        name: 'Vengeful',
        self_chances: 0,
        self_damage: 1,
        other_chances: 0,
        other_damage: 0,
        special: '',
    };
    pub const ThickCoat: CardPoints = CardPoints {
        name: 'Thick Coat',
        self_chances: 0,
        self_damage: 0,
        other_chances: 0,
        other_damage: -1,
        special: '',
    };
    pub const Reversal: CardPoints = CardPoints {
        name: 'Reversal',
        self_chances: 0,
        self_damage: 0,
        other_chances: 0,
        other_damage: 0,
        special: 'Next decrease increases both',
    };
    pub const Bananas: CardPoints = CardPoints {
        name: 'Bananas',
        self_chances: -10,
        self_damage: 0,
        other_chances: -10,
        other_damage: 0,
        special: '',
    };
}


//--------------------
// traits
//
use pistols::types::cards::{
    deck::{DeckType},
    cards::{CardPoints, CardPointsTrait},
    env::{EnvCard},
};
use pistols::models::challenge::{DuelistState};

#[generate_trait]
pub impl TacticsCardImpl of TacticsCardTrait {
    fn get_points(self: TacticsCard) -> CardPoints {
        match self {
            TacticsCard::Insult =>      TACTICS_POINTS::Insult,
            TacticsCard::CoinToss =>    TACTICS_POINTS::CoinToss,
            TacticsCard::Vengeful =>    TACTICS_POINTS::Vengeful,
            TacticsCard::ThickCoat =>   TACTICS_POINTS::ThickCoat,
            TacticsCard::Reversal =>    TACTICS_POINTS::Reversal,
            TacticsCard::Bananas =>     TACTICS_POINTS::Bananas,
            TacticsCard::None =>        Default::default(),
        }
    }
    #[inline(always)]
    fn apply_points(self: TacticsCard, ref state_self: DuelistState, ref state_other: DuelistState, multiplier: i8, shots_modifier: EnvCard) {
        if (self != TacticsCard::None) {
            self.get_points().apply(ref state_self, ref state_other, multiplier, shots_modifier);
        }
    }
    fn build_deck(deck_type: DeckType) -> Span<u8> {
        (match deck_type {
            DeckType::None => array![],
            DeckType::Classic => array![
                TacticsCard::Insult.into(),
                TacticsCard::CoinToss.into(),
                TacticsCard::Vengeful.into(),
                TacticsCard::ThickCoat.into(),
                TacticsCard::Reversal.into(),
                TacticsCard::Bananas.into(),
            ],
            DeckType::PacesOnly => array![],
        }.span())
    }
}


//--------------------
// converters
//
use core::fmt::{Display, Formatter, Error};
use pistols::utils::short_string::{ShortStringTrait};

impl TacticsCardDefault of Default<TacticsCard> {
    fn default() -> TacticsCard {(TacticsCard::None)}
}


impl TacticsCardIntoU8 of core::traits::Into<TacticsCard, u8> {
    fn into(self: TacticsCard) -> u8 {
        match self {
            TacticsCard::None =>        0,
            TacticsCard::Insult =>      1,
            TacticsCard::CoinToss =>    2,
            TacticsCard::Vengeful =>    3,
            TacticsCard::ThickCoat =>   4,
            TacticsCard::Reversal =>    5,
            TacticsCard::Bananas =>     6,
        }
    }
}
impl U8IntoTacticsCard of core::traits::Into<u8, TacticsCard> {
    fn into(self: u8) -> TacticsCard {
        if self == 1        { TacticsCard::Insult }
        else if self == 2   { TacticsCard::CoinToss }
        else if self == 3   { TacticsCard::Vengeful }
        else if self == 4   { TacticsCard::ThickCoat }
        else if self == 5   { TacticsCard::Reversal }
        else if self == 6   { TacticsCard::Bananas }
        else                { TacticsCard::None }
    }
}

// impl TacticsCardPrintImpl of core::debug::PrintTrait<TacticsCard> {
//     fn print(self: TacticsCard) {
//         self.get_points().name.print();
//     }
// }

// for println! and format!
impl TacticsCardDisplay of Display<TacticsCard> {
    fn fmt(self: @TacticsCard, ref f: Formatter) -> Result<(), Error> {
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
    use super::{TacticsCard};

    #[test]
    fn test_into_u8() {
        let mut i: u8 = 0;
        loop {
            let card: TacticsCard = i.into();
            if (i > 0 && card == TacticsCard::None) {
                break;
            }
            let as_u8: u8 = card.into();
            assert!(i == as_u8, "{} != {}", i, as_u8);
            // println!("TacticsCard {} == {}", i, as_u8);
            i += 1;
        };
    }
}
