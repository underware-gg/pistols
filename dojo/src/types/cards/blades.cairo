
#[derive(Copy, Drop, Serde, PartialEq, Introspect)]
pub enum BladesCard {
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
    // IMPORTANT: must be in sync with BladesCard
    const None: u8 = 0;
    const Seppuku: u8 = 1;
    const RunAway: u8 = 2;
    const Behead: u8 = 3;
    const Grapple: u8 = 4;
}

mod BLADES_POINTS {
    use pistols::types::cards::cards::{CardPoints};
    const Seppuku: CardPoints = CardPoints {
        name: 'Seppuku',
        self_chances: 20,
        self_damage: 1,
        other_chances: 0,
        other_damage: 0,
        special: 'Suicide if survives',
    };
    const RunAway: CardPoints = CardPoints {
        name: 'Run Away',
        self_chances: 0,
        self_damage: 0,
        other_chances: -10,
        other_damage: 0,
        special: 'Beats Behead',
    };
    const Behead: CardPoints = CardPoints {
        name: 'Behead',
        self_chances: 0,
        self_damage: 1,
        other_chances: 0,
        other_damage: 0,
        special: 'Beats Grapple',
    };
    const Grapple: CardPoints = CardPoints {
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
use pistols::types::cards::hand::{DeckType};
use pistols::models::challenge::{PlayerState};

#[generate_trait]
impl BladesCardImpl of BladesCardTrait {
    fn get_points(self: BladesCard) -> CardPoints {
        match self {
            BladesCard::Seppuku =>  BLADES_POINTS::Seppuku,
            BladesCard::RunAway =>  BLADES_POINTS::RunAway,
            BladesCard::Behead =>   BLADES_POINTS::Behead,
            BladesCard::Grapple =>  BLADES_POINTS::Grapple,
            BladesCard::None =>     Default::default(),
        }
    }
    #[inline(always)]
    fn apply_points(self: BladesCard, ref state_self: PlayerState, ref state_other: PlayerState) {
        if (self != BladesCard::None) {
            self.get_points().apply(ref state_self, ref state_other);
        }
    }
    //
    // Rock-Paper-Scissors mechanic
    // RunAway > beats > Behead
    // Behead  > beats > Grapple
    // Grapple > beats > RunAway
    //
    // returns 1: self wins, 2: other wins, 0: draw
    fn clash(self: BladesCard, other: BladesCard) -> u8 {
        match self {
            BladesCard::RunAway => {
                match other {
                    BladesCard::None => 1, // wins against invalid blades
                    BladesCard::Behead => 1,
                    BladesCard::Grapple => 2,
                    _ => 0,
                }
            },
            BladesCard::Behead => {
                match other {
                    BladesCard::None => 1, // wins against invalid blades
                    BladesCard::RunAway => 2,
                    BladesCard::Grapple => 1,
                    _ => 0,
                }
            },
            BladesCard::Grapple => {
                match other {
                    BladesCard::None => 1, // wins against invalid blades
                    BladesCard::RunAway => 1,
                    BladesCard::Behead => 2,
                    _ => 0,
                }
            },
            BladesCard::None => {
                match other {
                    BladesCard::RunAway => 2, // loses to any blade
                    BladesCard::Behead => 2,  // loses to any blade
                    BladesCard::Grapple => 2, // loses to any blade
                    _ => 0,
                }
            },
            _ => 0,
        }
    }
    fn get_deck(_deck_type: DeckType) -> Span<u8> {
        (array![
            BladesCard::Seppuku.into(),
            BladesCard::RunAway.into(),
            BladesCard::Behead.into(),
            BladesCard::Grapple.into(),
        ].span())
    }
}


//--------------------
// converters
//
use debug::PrintTrait;
use core::fmt::{Display, Formatter, Error};
use pistols::utils::short_string::{ShortStringTrait};

impl BladesCardDefault of Default<BladesCard> {
    fn default() -> BladesCard {(BladesCard::None)}
}

impl BladesCardIntoU8 of Into<BladesCard, u8> {
    fn into(self: BladesCard) -> u8 {
        match self {
            BladesCard::Seppuku =>  BLADES_CARDS::Seppuku,
            BladesCard::RunAway =>  BLADES_CARDS::RunAway,
            BladesCard::Behead =>   BLADES_CARDS::Behead,
            BladesCard::Grapple =>  BLADES_CARDS::Grapple,
            _ =>                    BLADES_CARDS::None,
        }
    }
}
impl U8IntoBladesCard of Into<u8, BladesCard> {
    fn into(self: u8) -> BladesCard {
        if self == BLADES_CARDS::Seppuku        { BladesCard::Seppuku }
        else if self == BLADES_CARDS::RunAway  { BladesCard::RunAway }
        else if self == BLADES_CARDS::Behead    { BladesCard::Behead }
        else if self == BLADES_CARDS::Grapple   { BladesCard::Grapple }
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
