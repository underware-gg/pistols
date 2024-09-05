use pistols::models::challenge::{Shot};
use pistols::utils::math::{MathU8};

#[derive(Copy, Drop, Serde, PartialEq, Introspect)]
enum PacesCard {
    Null,
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

mod PACES {
    const NULL: u8 = 0;
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


trait PacesCardTrait {
    fn is_cool(self: PacesCard) -> bool;
    fn as_felt(self: PacesCard) -> felt252;
    fn honour(self: PacesCard) -> u8;
}

impl PacesCardImpl of PacesCardTrait {
    fn is_cool(self: PacesCard) -> bool {
        match self {
            _ => true,
        }
    }
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
}


//--------------------
// converters
//

impl PacesCardIntoU8 of Into<PacesCard, u8> {
    fn into(self: PacesCard) -> u8 {
        match self {
            PacesCard::Paces1 =>    PACES::PACES_1,
            PacesCard::Paces2 =>    PACES::PACES_2,
            PacesCard::Paces3 =>    PACES::PACES_3,
            PacesCard::Paces4 =>    PACES::PACES_4,
            PacesCard::Paces5 =>    PACES::PACES_5,
            PacesCard::Paces6 =>    PACES::PACES_6,
            PacesCard::Paces7 =>    PACES::PACES_7,
            PacesCard::Paces8 =>    PACES::PACES_8,
            PacesCard::Paces9 =>    PACES::PACES_9,
            PacesCard::Paces10 =>   PACES::PACES_10,
            _ =>                    PACES::NULL,
        }
    }
}
impl U8IntoPacesCard of Into<u8, PacesCard> {
    fn into(self: u8) -> PacesCard {
        if self == PACES::PACES_1       { PacesCard::Paces1 }
        else if self == PACES::PACES_2  { PacesCard::Paces2 }
        else if self == PACES::PACES_3  { PacesCard::Paces3 }
        else if self == PACES::PACES_4  { PacesCard::Paces4 }
        else if self == PACES::PACES_5  { PacesCard::Paces5 }
        else if self == PACES::PACES_6  { PacesCard::Paces6 }
        else if self == PACES::PACES_7  { PacesCard::Paces7 }
        else if self == PACES::PACES_8  { PacesCard::Paces8 }
        else if self == PACES::PACES_9  { PacesCard::Paces9 }
        else if self == PACES::PACES_10 { PacesCard::Paces10 }
        else                            { PacesCard::Null }
    }
}

