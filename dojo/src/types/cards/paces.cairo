
#[derive(Copy, Drop, Serde, PartialEq, Introspect)]
pub enum PacesCard {
    None,       // 0
    //
    Paces1,     // 1
    Paces2,     // 2
    Paces3,     // 3
    Paces4,     // 4
    Paces5,     // 5
    Paces6,     // 6
    Paces7,     // 7
    Paces8,     // 8
    Paces9,     // 9
    Paces10,    // 10
}


//--------------------
// traits
//
use pistols::types::cards::deck::{DeckType};

#[generate_trait]
pub impl PacesCardImpl of PacesCardTrait {
    #[inline(always)]
    fn to_felt(self: PacesCard) -> felt252 {
        let result: u8 = self.into();
        (result.into())
    }
    #[inline(always)]
    fn is_before(self: PacesCard, other: PacesCard) -> bool {
        let pace: u8 = self.into();
        (pace < other.into())
    }
    #[inline]
    fn is_after(self: PacesCard, other: PacesCard) -> bool {
        let pace: u8 = self.into();
        (pace > other.into())
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
    #[inline(always)]
    fn build_deck(deck_type: DeckType) -> Span<u8> {
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
}


//--------------------
// converters
//
use pistols::utils::short_string::{ShortString};
impl PacesCardDefault of Default<PacesCard> {
    fn default() -> PacesCard {(PacesCard::None)}
}
impl PacesCardIntoU8 of core::traits::Into<PacesCard, u8> {
    fn into(self: PacesCard) -> u8 {
        match self {
            PacesCard::None =>      0,
            PacesCard::Paces1 =>    1,
            PacesCard::Paces2 =>    2,
            PacesCard::Paces3 =>    3,
            PacesCard::Paces4 =>    4,
            PacesCard::Paces5 =>    5,
            PacesCard::Paces6 =>    6,
            PacesCard::Paces7 =>    7,
            PacesCard::Paces8 =>    8,
            PacesCard::Paces9 =>    9,
            PacesCard::Paces10 =>   10,
        }
    }
}
impl U8IntoPacesCard of core::traits::Into<u8, PacesCard> {
    fn into(self: u8) -> PacesCard {
        if self == 1        { PacesCard::Paces1 }
        else if self == 2   { PacesCard::Paces2 }
        else if self == 3   { PacesCard::Paces3 }
        else if self == 4   { PacesCard::Paces4 }
        else if self == 5   { PacesCard::Paces5 }
        else if self == 6   { PacesCard::Paces6 }
        else if self == 7   { PacesCard::Paces7 }
        else if self == 8   { PacesCard::Paces8 }
        else if self == 9   { PacesCard::Paces9 }
        else if self == 10  { PacesCard::Paces10 }
        else                { PacesCard::None }
    }
}
// for println! format! (core::fmt::Display<>) assert! (core::fmt::Debug<>)
impl PacesCardDebug of core::fmt::Debug<PacesCard> {
    fn fmt(self: @PacesCard, ref f: core::fmt::Formatter) -> Result<(), core::fmt::Error> {
        let p: u8 = (*self).into();
        let result: ByteArray = format!("Paces::{}", p);
        f.buffer.append(@result);
        Result::Ok(())
    }
}


//----------------------------------------
// Unit  tests
//
#[cfg(test)]
mod tests {
    use super::{PacesCard};

    #[test]
    fn test_into_u8() {
        let mut i: u8 = 0;
        loop {
            let card: PacesCard = i.into();
            if (i > 0 && card == PacesCard::None) {
                break;
            }
            let as_u8: u8 = card.into();
            assert!(i == as_u8, "{} != {}", i, as_u8);
            // println!("PacesCard {} == {}", i, as_u8);
            i += 1;
        };
    }
}
