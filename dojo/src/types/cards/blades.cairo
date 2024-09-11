
#[derive(Copy, Drop, Serde, PartialEq, Introspect)]
enum BladesCard {
    None,
    //
    Seppuku,
    RunAway,
    Behead,
    Grapple,
}



//--------------------
// constants
//

mod BLADES_CARDS {
    const NONE: u8 = 0;
    const SEPPUKU: u8 = 1;
    const RUN_AWAY: u8 = 2;
    const BEHEAD: u8 = 3;
    const GRAPPLE: u8 = 4;
}

mod BLADES_POINTS {
    use pistols::types::cards::cards::{CardPoints};
    const SEPPUKU: CardPoints = CardPoints {
        name: 'Seppuku',
        self_chances: 20,
        self_damage: 1,
        other_chances: 0,
        other_damage: 0,
        special: 'Suicide if survives',
    };
    const RUN_AWAY: CardPoints = CardPoints {
        name: 'Run Away',
        self_chances: 0,
        self_damage: 0,
        other_chances: -10,
        other_damage: 0,
        special: 'Beats Behead',
    };
    const BEHEAD: CardPoints = CardPoints {
        name: 'Behead',
        self_chances: 0,
        self_damage: 1,
        other_chances: 0,
        other_damage: 0,
        special: 'Beats Grapple',
    };
    const GRAPPLE: CardPoints = CardPoints {
        name: 'Grapple',
        self_chances: 0,
        self_damage: 0,
        other_chances: 0,
        other_damage: -1,
        special: 'Beats Run Away',
    };
}


//--------------------
// traits
//
use pistols::types::cards::cards::{CardPoints, CardPointsTrait};
use pistols::models::challenge::{PlayerState};

#[generate_trait]
impl BladesCardImpl of BladesCardTrait {
    fn get_points(self: BladesCard) -> CardPoints {
        match self {
            BladesCard::Seppuku =>  BLADES_POINTS::SEPPUKU,
            BladesCard::RunAway =>  BLADES_POINTS::RUN_AWAY,
            BladesCard::Behead =>   BLADES_POINTS::BEHEAD,
            BladesCard::Grapple =>  BLADES_POINTS::GRAPPLE,
            BladesCard::None =>     Default::default(),
        }
    }
    #[inline(always)]
    fn apply_points(self: BladesCard, ref state_self: PlayerState, ref state_other: PlayerState) {
        self.get_points().apply(ref state_self, ref state_other);
    }
}


//--------------------
// converters
//
use debug::PrintTrait;
use core::fmt::{Display, Formatter, Error};
use pistols::utils::short_string::{ShortStringTrait};

impl BladesCardIntoU8 of Into<BladesCard, u8> {
    fn into(self: BladesCard) -> u8 {
        match self {
            BladesCard::Seppuku =>  BLADES_CARDS::SEPPUKU,
            BladesCard::RunAway =>  BLADES_CARDS::RUN_AWAY,
            BladesCard::Behead =>   BLADES_CARDS::BEHEAD,
            BladesCard::Grapple =>  BLADES_CARDS::GRAPPLE,
            _ =>                    BLADES_CARDS::NONE,
        }
    }
}
impl U8IntoBladesCard of Into<u8, BladesCard> {
    fn into(self: u8) -> BladesCard {
        if self == BLADES_CARDS::SEPPUKU        { BladesCard::Seppuku }
        else if self == BLADES_CARDS::RUN_AWAY  { BladesCard::RunAway }
        else if self == BLADES_CARDS::BEHEAD    { BladesCard::Behead }
        else if self == BLADES_CARDS::GRAPPLE   { BladesCard::Grapple }
        else                                    { BladesCard::None }
    }
}

impl BladesCardIntoFelt252 of Into<BladesCard, felt252> {
    fn into(self: BladesCard) -> felt252 {
        let v: u8 = self.into();
        (v.into())
    }
}

impl BladesCardPrintImpl of PrintTrait<BladesCard> {
    fn print(self: BladesCard) {
        self.get_points().name.print();
    }
}

// for println! and format!
impl BladesCardDisplay of Display<BladesCard> {
    fn fmt(self: @BladesCard, ref f: Formatter) -> Result<(), Error> {
        let name: ByteArray = (*self).get_points().name.string();
        let value: felt252 = (*self).into();
        let str: ByteArray = format!("({}:{})", value, name);
        f.buffer.append(@str);
        Result::Ok(())
    }
}
