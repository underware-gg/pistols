
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

mod TACTICS_CARDS {
    // IMPORTANT: must be in sync with TacticsCard
    const None: u8 = 0;
    const Insult: u8 = 1;
    const CoinToss: u8 = 2;
    const Vengeful: u8 = 3;
    const ThickCoat: u8 = 4;
    const Reversal: u8 = 5;
    const Bananas: u8 = 6;
}

mod TACTICS_POINTS {
    use pistols::types::cards::cards::{CardPoints};
    const Insult: CardPoints = CardPoints {
        name: 'Insult',
        self_chances: 0,
        self_damage: 0,
        other_chances: -10,
        other_damage: 1,
        special: '',
    };
    const CoinToss: CardPoints = CardPoints {
        name: 'Coin Toss',
        self_chances: 0,
        self_damage: 0,
        other_chances: 0,
        other_damage: 0,
        special: 'First special doesnt affect you',
    };
    const Vengeful: CardPoints = CardPoints {
        name: 'Vengeful',
        self_chances: 0,
        self_damage: 1,
        other_chances: 0,
        other_damage: 0,
        special: '',
    };
    const ThickCoat: CardPoints = CardPoints {
        name: 'Thick Coat',
        self_chances: 0,
        self_damage: 0,
        other_chances: 0,
        other_damage: -1,
        special: '',
    };
    const Reversal: CardPoints = CardPoints {
        name: 'Reversal',
        self_chances: 0,
        self_damage: 0,
        other_chances: 0,
        other_damage: 0,
        special: 'Next decrease increases both',
    };
    const Bananas: CardPoints = CardPoints {
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
use pistols::types::cards::cards::{CardPoints, CardPointsTrait};
use pistols::types::cards::hand::{DeckType};
use pistols::models::challenge::{DuelistState};

#[generate_trait]
impl TacticsCardImpl of TacticsCardTrait {
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
    fn apply_points(self: TacticsCard, ref state_self: DuelistState, ref state_other: DuelistState, multiplier: i8) {
        if (self != TacticsCard::None) {
            self.get_points().apply(ref state_self, ref state_other, multiplier);
        }
    }
    fn get_deck(_deck_type: DeckType) -> Span<u8> {
        (array![
            TacticsCard::Insult.into(),
            TacticsCard::CoinToss.into(),
            TacticsCard::Vengeful.into(),
            TacticsCard::ThickCoat.into(),
            TacticsCard::Reversal.into(),
            TacticsCard::Bananas.into(),
        ].span())
    }
}


//--------------------
// converters
//
use debug::PrintTrait;
use core::fmt::{Display, Formatter, Error};
use pistols::utils::short_string::{ShortStringTrait};

impl TacticsCardDefault of Default<TacticsCard> {
    fn default() -> TacticsCard {(TacticsCard::None)}
}


impl TacticsCardIntoU8 of Into<TacticsCard, u8> {
    fn into(self: TacticsCard) -> u8 {
        match self {
            TacticsCard::Insult =>      TACTICS_CARDS::Insult,
            TacticsCard::CoinToss =>    TACTICS_CARDS::CoinToss,
            TacticsCard::Vengeful =>    TACTICS_CARDS::Vengeful,
            TacticsCard::ThickCoat =>   TACTICS_CARDS::ThickCoat,
            TacticsCard::Reversal =>    TACTICS_CARDS::Reversal,
            TacticsCard::Bananas =>     TACTICS_CARDS::Bananas,
            _ =>                        TACTICS_CARDS::None,
        }
    }
}
impl U8IntoTacticsCard of Into<u8, TacticsCard> {
    fn into(self: u8) -> TacticsCard {
        if self == TACTICS_CARDS::Insult            { TacticsCard::Insult }
        else if self == TACTICS_CARDS::CoinToss     { TacticsCard::CoinToss }
        else if self == TACTICS_CARDS::Vengeful     { TacticsCard::Vengeful }
        else if self == TACTICS_CARDS::ThickCoat    { TacticsCard::ThickCoat }
        else if self == TACTICS_CARDS::Reversal     { TacticsCard::Reversal }
        else if self == TACTICS_CARDS::Bananas      { TacticsCard::Bananas }
        else                                        { TacticsCard::None }
    }
}

impl TacticsCardIntoFelt252 of Into<TacticsCard, felt252> {
    fn into(self: TacticsCard) -> felt252 {
        let v: u8 = self.into();
        (v.into())
    }
}

impl TacticsCardPrintImpl of PrintTrait<TacticsCard> {
    fn print(self: TacticsCard) {
        self.get_points().name.print();
    }
}

// for println! and format!
impl TacticsCardDisplay of Display<TacticsCard> {
    fn fmt(self: @TacticsCard, ref f: Formatter) -> Result<(), Error> {
        let name: ByteArray = (*self).get_points().name.string();
        let value: felt252 = (*self).into();
        let str: ByteArray = format!("({}:{})", value, name);
        f.buffer.append(@str);
        Result::Ok(())
    }
}
