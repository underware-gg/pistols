use pistols::models::challenge::{Shot};
use pistols::utils::math::{MathU8};

#[derive(Copy, Drop, Serde, PartialEq, Introspect)]
enum PacesCard {
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
    const None: u8 = 0;
    const PACES_1: u8 = 1;
    const PACES_2: u8 = 2;
    const PACES_3: u8 = 3;
    const PACES_4: u8 = 4;
    const PACES_5: u8 = 5;
    const PACES_6: u8 = 6;
    const PACES_7: u8 = 7;
    const PACES_8: u8 = 8;
    const PACES_9: u8 = 9;
    const PACES_10: u8 = 10;
}


//--------------------
// traits
//

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
            _ => 0,
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
            _ =>                    0,
        }
    }
}


//--------------------
// converters
//
use debug::PrintTrait;
use core::fmt::{Display, Formatter, Error};
use pistols::utils::short_string::{ShortString};

impl PacesCardIntoU8 of Into<PacesCard, u8> {
    fn into(self: PacesCard) -> u8 {
        match self {
            PacesCard::Paces1 =>    PACES_CARDS::PACES_1,
            PacesCard::Paces2 =>    PACES_CARDS::PACES_2,
            PacesCard::Paces3 =>    PACES_CARDS::PACES_3,
            PacesCard::Paces4 =>    PACES_CARDS::PACES_4,
            PacesCard::Paces5 =>    PACES_CARDS::PACES_5,
            PacesCard::Paces6 =>    PACES_CARDS::PACES_6,
            PacesCard::Paces7 =>    PACES_CARDS::PACES_7,
            PacesCard::Paces8 =>    PACES_CARDS::PACES_8,
            PacesCard::Paces9 =>    PACES_CARDS::PACES_9,
            PacesCard::Paces10 =>   PACES_CARDS::PACES_10,
            _ =>                    PACES_CARDS::None,
        }
    }
}
impl U8IntoPacesCard of Into<u8, PacesCard> {
    fn into(self: u8) -> PacesCard {
        if self == PACES_CARDS::PACES_1         { PacesCard::Paces1 }
        else if self == PACES_CARDS::PACES_2    { PacesCard::Paces2 }
        else if self == PACES_CARDS::PACES_3    { PacesCard::Paces3 }
        else if self == PACES_CARDS::PACES_4    { PacesCard::Paces4 }
        else if self == PACES_CARDS::PACES_5    { PacesCard::Paces5 }
        else if self == PACES_CARDS::PACES_6    { PacesCard::Paces6 }
        else if self == PACES_CARDS::PACES_7    { PacesCard::Paces7 }
        else if self == PACES_CARDS::PACES_8    { PacesCard::Paces8 }
        else if self == PACES_CARDS::PACES_9    { PacesCard::Paces9 }
        else if self == PACES_CARDS::PACES_10   { PacesCard::Paces10 }
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
