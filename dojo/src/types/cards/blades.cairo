
#[derive(Copy, Drop, Serde, PartialEq, Introspect)]
pub enum BladesCard {
    None,
    //
    Seppuku,
    PocketPistol,
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
    const PocketPistol: u8 = 2;
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
    const PocketPistol: CardPoints = CardPoints {
        name: 'Pocket Pistol',
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
        special: 'Beats Pocket Pistol',
    };
}


//--------------------
// traits
//
use pistols::types::cards::cards::{CardPoints, CardPointsTrait};
use pistols::types::cards::hand::{DeckType};
use pistols::models::challenge::{DuelistState};

#[generate_trait]
impl BladesCardImpl of BladesCardTrait {
    fn get_points(self: BladesCard) -> CardPoints {
        match self {
            BladesCard::Seppuku =>      BLADES_POINTS::Seppuku,
            BladesCard::PocketPistol => BLADES_POINTS::PocketPistol,
            BladesCard::Behead =>       BLADES_POINTS::Behead,
            BladesCard::Grapple =>      BLADES_POINTS::Grapple,
            BladesCard::None =>         Default::default(),
        }
    }
    #[inline(always)]
    fn apply_points(self: BladesCard, ref state_self: DuelistState, ref state_other: DuelistState) {
        if (self != BladesCard::None) {
            self.get_points().apply(ref state_self, ref state_other);
        }
    }
    //
    // Rock-Paper-Scissors mechanic
    // PocketPistol beats Behead
    // Behead  beats Grapple
    // Grapple beats PocketPistol
    //
    // returns (is_dead, is_dead)
    fn clash(self: BladesCard, other: BladesCard) -> (bool, bool) {
        match self {
            BladesCard::None => {
                match other {
                    BladesCard::None =>         (false, false),
                    BladesCard::Seppuku =>      (false, true), // Seppuku always die
                    BladesCard::PocketPistol => (true, false), // loses to any blade
                    BladesCard::Behead  =>      (true, false), // loses to any blade
                    BladesCard::Grapple =>      (true, false), // loses to any blade
                    // _ => (false, false),
                }
            },
            BladesCard::Seppuku => {
                match other {
                    BladesCard::None =>         (true, false), // Seppuku always die
                    BladesCard::Seppuku =>      (true, true) , // bloodbath!
                    BladesCard::PocketPistol => (true, false), // Seppuku always die
                    BladesCard::Behead  =>      (true, false), // Seppuku always die
                    BladesCard::Grapple =>      (true, false), // Seppuku always die
                    // _ => (false, false),
                }
            },
            BladesCard::PocketPistol => {
                match other {
                    BladesCard::None =>         (false, true), // wins against invalid blades
                    BladesCard::Seppuku =>      (false, true), // Seppuku always die
                    BladesCard::PocketPistol => (true, true),  // bloodbath!
                    BladesCard::Behead =>       (false, true), // PocketPistol beats Behead
                    BladesCard::Grapple =>      (true, false), // Grapple beats PocketPistol
                    // _ => (false, false),
                }
            },
            BladesCard::Behead => {
                match other {
                    BladesCard::None =>         (false, true), // wins against invalid blades
                    BladesCard::Seppuku =>      (false, true), // Seppuku always die
                    BladesCard::PocketPistol => (true, false), // PocketPistol beats Behead
                    BladesCard::Behead =>       (true, true),  // bloodbath!
                    BladesCard::Grapple =>      (false, true), // Behead  beats Grapple
                    // _ => (false, false),
                }
            },
            BladesCard::Grapple => {
                match other {
                    BladesCard::None =>         (false, true), // wins against invalid blades
                    BladesCard::Seppuku =>      (false, true), // Seppuku always die
                    BladesCard::PocketPistol => (false, true), // Grapple beats PocketPistol
                    BladesCard::Behead =>       (true, false), // Behead  beats Grapple
                    BladesCard::Grapple =>      (true, true),  // bloodbath!
                    // _ => (false, false),
                }
            },
        }
    }
    fn get_deck(_deck_type: DeckType) -> Span<u8> {
        (array![
            BladesCard::Seppuku.into(),
            BladesCard::PocketPistol.into(),
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
            BladesCard::PocketPistol =>  BLADES_CARDS::PocketPistol,
            BladesCard::Behead =>   BLADES_CARDS::Behead,
            BladesCard::Grapple =>  BLADES_CARDS::Grapple,
            _ =>                    BLADES_CARDS::None,
        }
    }
}
impl U8IntoBladesCard of Into<u8, BladesCard> {
    fn into(self: u8) -> BladesCard {
        if self == BLADES_CARDS::Seppuku        { BladesCard::Seppuku }
        else if self == BLADES_CARDS::PocketPistol  { BladesCard::PocketPistol }
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
