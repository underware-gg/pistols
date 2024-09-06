
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
    fn is_cool(self: BladesCard) -> bool;
}

impl BladesCardImpl of BladesCardTrait {
    fn is_cool(self: BladesCard) -> bool {
        match self {
            _ => true,
        }
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

