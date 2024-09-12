
#[derive(Copy, Drop, Serde, PartialEq, Introspect)]
enum TacticsCard {
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
    const NONE: u8 = 0;
    const INSULT: u8 = 1;
    const COIN_TOSS: u8 = 2;
    const VENGEFUL: u8 = 3;
    const THICK_COAT: u8 = 4;
    const REVERSAL: u8 = 5;
    const BANANAS: u8 = 6;
}

mod TACTICS_POINTS {
    use pistols::types::cards::cards::{CardPoints};
    const INSULT: CardPoints = CardPoints {
        name: 'Insult',
        self_chances: 0,
        self_damage: 0,
        other_chances: -10,
        other_damage: 1,
        special: '',
    };
    const COIN_TOSS: CardPoints = CardPoints {
        name: 'Coin Toss',
        self_chances: 0,
        self_damage: 0,
        other_chances: 0,
        other_damage: 0,
        special: 'First special doesnt affect you',
    };
    const VENGEFUL: CardPoints = CardPoints {
        name: 'Vengeful',
        self_chances: 0,
        self_damage: 1,
        other_chances: 0,
        other_damage: 0,
        special: '',
    };
    const THICK_COAT: CardPoints = CardPoints {
        name: 'Thick Coat',
        self_chances: 0,
        self_damage: 0,
        other_chances: 0,
        other_damage: -1,
        special: '',
    };
    const REVERSAL: CardPoints = CardPoints {
        name: 'Reversal',
        self_chances: 0,
        self_damage: 0,
        other_chances: 0,
        other_damage: 0,
        special: 'Next decrease increases both',
    };
    const BANANAS: CardPoints = CardPoints {
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
use pistols::models::challenge::{PlayerState};

#[generate_trait]
impl TacticsCardImpl of TacticsCardTrait {
    fn get_points(self: TacticsCard) -> CardPoints {
        match self {
            TacticsCard::Insult =>      TACTICS_POINTS::INSULT,
            TacticsCard::CoinToss =>    TACTICS_POINTS::COIN_TOSS,
            TacticsCard::Vengeful =>    TACTICS_POINTS::VENGEFUL,
            TacticsCard::ThickCoat =>   TACTICS_POINTS::THICK_COAT,
            TacticsCard::Reversal =>    TACTICS_POINTS::REVERSAL,
            TacticsCard::Bananas =>     TACTICS_POINTS::BANANAS,
            TacticsCard::None =>        Default::default(),
        }
    }
    #[inline(always)]
    fn apply_points(self: TacticsCard, ref state_self: PlayerState, ref state_other: PlayerState) {
        if (self != TacticsCard::None) {
            self.get_points().apply(ref state_self, ref state_other);
        }
    }
    fn get_deck() -> Span<u8> {
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

impl TacticsCardIntoU8 of Into<TacticsCard, u8> {
    fn into(self: TacticsCard) -> u8 {
        match self {
            TacticsCard::Insult =>      TACTICS_CARDS::INSULT,
            TacticsCard::CoinToss =>    TACTICS_CARDS::COIN_TOSS,
            TacticsCard::Vengeful =>    TACTICS_CARDS::VENGEFUL,
            TacticsCard::ThickCoat =>   TACTICS_CARDS::THICK_COAT,
            TacticsCard::Reversal =>    TACTICS_CARDS::REVERSAL,
            TacticsCard::Bananas =>     TACTICS_CARDS::BANANAS,
            _ =>                        TACTICS_CARDS::NONE,
        }
    }
}
impl U8IntoTacticsCard of Into<u8, TacticsCard> {
    fn into(self: u8) -> TacticsCard {
        if self == TACTICS_CARDS::INSULT            { TacticsCard::Insult }
        else if self == TACTICS_CARDS::COIN_TOSS    { TacticsCard::CoinToss }
        else if self == TACTICS_CARDS::VENGEFUL     { TacticsCard::Vengeful }
        else if self == TACTICS_CARDS::THICK_COAT   { TacticsCard::ThickCoat }
        else if self == TACTICS_CARDS::REVERSAL     { TacticsCard::Reversal }
        else if self == TACTICS_CARDS::BANANAS      { TacticsCard::Bananas }
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
