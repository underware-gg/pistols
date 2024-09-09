use pistols::models::challenge::{PlayerState};
use pistols::utils::math::{MathU8};

#[derive(Copy, Drop, Serde, PartialEq, Introspect)]
enum BladesCard {
    None,
    //
    Seppuku,
    RunAway,
    Behead,
    Grapple,
}

mod BLADES {
    const NONE: u8 = 0;
    const SEPPUKU: u8 = 1;
    const RUN_AWAY: u8 = 2;
    const BEHEAD: u8 = 3;
    const GRAPPLE: u8 = 4;
}

trait BladesCardTrait {
    fn apply(self: BladesCard, ref state_self: PlayerState, ref state_other: PlayerState);
}

impl BladesCardImpl of BladesCardTrait {
    fn apply(self: BladesCard, ref state_self: PlayerState, ref state_other: PlayerState) {
        match self {
            BladesCard::Seppuku => {
                state_self.chances += 20;
                state_self.damage += 1;
            },
            BladesCard::RunAway => {
                state_other.chances.subi(10);
            },
            BladesCard::Behead => {
                state_self.damage += 1;
            },
            BladesCard::Grapple => {
                state_other.damage.subi(1);
            },
            BladesCard::None => {},
        };
    }
}


//--------------------
// converters
//

impl BladesCardIntoU8 of Into<BladesCard, u8> {
    fn into(self: BladesCard) -> u8 {
        match self {
            BladesCard::Seppuku =>  BLADES::SEPPUKU,
            BladesCard::RunAway =>  BLADES::RUN_AWAY,
            BladesCard::Behead =>   BLADES::BEHEAD,
            BladesCard::Grapple =>  BLADES::GRAPPLE,
            _ =>                    BLADES::NONE,
        }
    }
}
impl U8IntoBladesCard of Into<u8, BladesCard> {
    fn into(self: u8) -> BladesCard {
        if self == BLADES::SEPPUKU          { BladesCard::Seppuku }
        else if self == BLADES::RUN_AWAY    { BladesCard::RunAway }
        else if self == BLADES::BEHEAD      { BladesCard::Behead }
        else if self == BLADES::GRAPPLE     { BladesCard::Grapple }
        else                                { BladesCard::None }
    }
}

