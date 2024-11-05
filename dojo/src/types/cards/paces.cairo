use pistols::utils::math::{MathTrait};

#[derive(Copy, Drop, Serde, PartialEq, Introspect)]
pub enum PacesCard {
    None,
    //
    Paces1,
    Paces2,
    Paces3,
    Paces4,
    Paces5,
    Paces6,
    Paces7,
    Paces8,
    Paces9,
    Paces10,
}


//--------------------
// constants
//

mod PACES_CARDS {
    // IMPORTANT: must be in sync with PacesCard
    const None: u8 = 0;
    const Paces1: u8 = 1;
    const Paces2: u8 = 2;
    const Paces3: u8 = 3;
    const Paces4: u8 = 4;
    const Paces5: u8 = 5;
    const Paces6: u8 = 6;
    const Paces7: u8 = 7;
    const Paces8: u8 = 8;
    const Paces9: u8 = 9;
    const Paces10: u8 = 10;
}


//--------------------
// traits
//
use pistols::types::cards::hand::{DeckType};

#[generate_trait]
impl PacesCardImpl of PacesCardTrait {
    fn as_felt(self: PacesCard) -> felt252 {
        let result: u8 = self.into();
        (result.into())
    }
    fn honour(self: PacesCard) -> u8 {
        match self {
            PacesCard::Paces1 |
            PacesCard::Paces2 |
            PacesCard::Paces3 |
            PacesCard::Paces4 |
            PacesCard::Paces5 |
            PacesCard::Paces6 |
            PacesCard::Paces7 |
            PacesCard::Paces8 |
            PacesCard::Paces9 |
            PacesCard::Paces10 =>  self.into() * 10,
            PacesCard::None => 0,
        }
    }
    fn env_salt(self: PacesCard) -> felt252 {
        match self {
            PacesCard::Paces1 =>    'env_1',
            PacesCard::Paces2 =>    'env_2',
            PacesCard::Paces3 =>    'env_3',
            PacesCard::Paces4 =>    'env_4',
            PacesCard::Paces5 =>    'env_5',
            PacesCard::Paces6 =>    'env_6',
            PacesCard::Paces7 =>    'env_7',
            PacesCard::Paces8 =>    'env_8',
            PacesCard::Paces9 =>    'env_9',
            PacesCard::Paces10 =>   'env_10',
            PacesCard::None => 0,
        }
    }
    fn get_deck(_deck_type: DeckType) -> Span<u8> {
        (array![
            PacesCard::Paces1.into(),
            PacesCard::Paces2.into(),
            PacesCard::Paces3.into(),
            PacesCard::Paces4.into(),
            PacesCard::Paces5.into(),
            PacesCard::Paces6.into(),
            PacesCard::Paces7.into(),
            PacesCard::Paces8.into(),
            PacesCard::Paces9.into(),
            PacesCard::Paces10.into(),
        ].span())
    }
    fn variant_name(self: PacesCard) -> felt252 {
        match self {
            PacesCard::Paces1 =>    'Paces1',
            PacesCard::Paces2 =>    'Paces2',
            PacesCard::Paces3 =>    'Paces3',
            PacesCard::Paces4 =>    'Paces4',
            PacesCard::Paces5 =>    'Paces5',
            PacesCard::Paces6 =>    'Paces6',
            PacesCard::Paces7 =>    'Paces7',
            PacesCard::Paces8 =>    'Paces8',
            PacesCard::Paces9 =>    'Paces9',
            PacesCard::Paces10 =>   'Paces10',
            PacesCard::None => 0,
        }
    }
}


//--------------------
// converters
//
use debug::PrintTrait;
use core::fmt::{Display, Formatter, Error};
use pistols::utils::short_string::{ShortString};

impl PacesCardDefault of Default<PacesCard> {
    fn default() -> PacesCard {(PacesCard::None)}
}

impl PacesCardIntoU8 of Into<PacesCard, u8> {
    fn into(self: PacesCard) -> u8 {
        match self {
            PacesCard::Paces1 =>    PACES_CARDS::Paces1,
            PacesCard::Paces2 =>    PACES_CARDS::Paces2,
            PacesCard::Paces3 =>    PACES_CARDS::Paces3,
            PacesCard::Paces4 =>    PACES_CARDS::Paces4,
            PacesCard::Paces5 =>    PACES_CARDS::Paces5,
            PacesCard::Paces6 =>    PACES_CARDS::Paces6,
            PacesCard::Paces7 =>    PACES_CARDS::Paces7,
            PacesCard::Paces8 =>    PACES_CARDS::Paces8,
            PacesCard::Paces9 =>    PACES_CARDS::Paces9,
            PacesCard::Paces10 =>   PACES_CARDS::Paces10,
            PacesCard::None =>      PACES_CARDS::None,
        }
    }
}
impl U8IntoPacesCard of Into<u8, PacesCard> {
    fn into(self: u8) -> PacesCard {
        if self == PACES_CARDS::Paces1         { PacesCard::Paces1 }
        else if self == PACES_CARDS::Paces2    { PacesCard::Paces2 }
        else if self == PACES_CARDS::Paces3    { PacesCard::Paces3 }
        else if self == PACES_CARDS::Paces4    { PacesCard::Paces4 }
        else if self == PACES_CARDS::Paces5    { PacesCard::Paces5 }
        else if self == PACES_CARDS::Paces6    { PacesCard::Paces6 }
        else if self == PACES_CARDS::Paces7    { PacesCard::Paces7 }
        else if self == PACES_CARDS::Paces8    { PacesCard::Paces8 }
        else if self == PACES_CARDS::Paces9    { PacesCard::Paces9 }
        else if self == PACES_CARDS::Paces10   { PacesCard::Paces10 }
        else                                    { PacesCard::None }
    }
}

impl PacesCardIntoFelt252 of Into<PacesCard, felt252> {
    fn into(self: PacesCard) -> felt252 {
        let v: u8 = self.into();
        (v.into())
    }
}

impl PacesCardPrintImpl of PrintTrait<PacesCard> {
    fn print(self: PacesCard) {
        let p: felt252 = self.into();
        ShortString::concat('Paces::', ('0' + p)).print();
    }
}

// for println! and format!
impl PacesCardDisplay of Display<PacesCard> {
    fn fmt(self: @PacesCard, ref f: Formatter) -> Result<(), Error> {
        let p: felt252 = (*self).into();
        let str: ByteArray = format!("Paces::{}", p);
        f.buffer.append(@str);
        Result::Ok(())
    }
}
