
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

// to be exported to typescript by generateConstants
// IMPORTANT: names must be in sync with enum BladesCard
mod BLADES_POINTS {
    use pistols::types::cards::cards::{CardPoints};
    pub const Seppuku: CardPoints = CardPoints {
        name: 'Seppuku',
        self_chances: 20,
        self_damage: 1,
        other_chances: 0,
        other_damage: 0,
        special: 'Suicide if survives',
    };
    pub const PocketPistol: CardPoints = CardPoints {
        name: 'Pocket Pistol',
        self_chances: 0,
        self_damage: 0,
        other_chances: -10,
        other_damage: 0,
        special: 'Beats Behead',
    };
    pub const Behead: CardPoints = CardPoints {
        name: 'Behead',
        self_chances: 0,
        self_damage: 1,
        other_chances: 0,
        other_damage: 0,
        special: 'Beats Grapple',
    };
    pub const Grapple: CardPoints = CardPoints {
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
use pistols::types::cards::{
    deck::{DeckType},
    cards::{CardPoints, CardPointsTrait},
    env::{EnvCard},
};
use pistols::models::challenge::{DuelistState};

#[generate_trait]
pub impl BladesCardImpl of BladesCardTrait {
    fn get_points(self: @BladesCard) -> CardPoints {
        match self {
            BladesCard::Seppuku =>      BLADES_POINTS::Seppuku,
            BladesCard::PocketPistol => BLADES_POINTS::PocketPistol,
            BladesCard::Behead =>       BLADES_POINTS::Behead,
            BladesCard::Grapple =>      BLADES_POINTS::Grapple,
            BladesCard::None =>         Default::default(),
        }
    }
    #[inline(always)]
    fn apply_points(self: @BladesCard, ref state_self: DuelistState, ref state_other: DuelistState) {
        if (*self != BladesCard::None) {
            (*self).get_points().apply(ref state_self, ref state_other, 1, EnvCard::None);
        }
    }
    fn apply_honour(self: @BladesCard, ref state: DuelistState) {
        match self {
            BladesCard::Seppuku => {
                state.honour = 100;
            },
            _ => {}
        }
    }
    //
    // Rock-Paper-Scissors mechanic
    // PocketPistol beats Behead
    // Behead  beats Grapple
    // Grapple beats PocketPistol
    //
    // returns (is_dead, is_dead)
    fn clash(self: @BladesCard, other: @BladesCard) -> (bool, bool) {
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
    fn build_deck(deck_type: @DeckType) -> Span<u8> {
        (match deck_type {
            DeckType::None => array![],
            DeckType::Classic => array![
                BladesCard::Seppuku.into(),
                BladesCard::PocketPistol.into(),
                BladesCard::Behead.into(),
                BladesCard::Grapple.into(),
            ],
            DeckType::PacesOnly => array![],
        }.span())
    }
}


//--------------------
// converters
//
use pistols::utils::short_string::{ShortStringTrait};
impl BladesCardDefault of Default<BladesCard> {
    fn default() -> BladesCard {(BladesCard::None)}
}
impl BladesCardIntoU8 of core::traits::Into<BladesCard, u8> {
    fn into(self: BladesCard) -> u8 {
        match self {
            BladesCard::None =>         0,
            BladesCard::Seppuku =>      1,
            BladesCard::PocketPistol => 2,
            BladesCard::Behead =>       3,
            BladesCard::Grapple =>      4,
        }
    }
}
impl U8IntoBladesCard of core::traits::Into<u8, BladesCard> {
    fn into(self: u8) -> BladesCard {
        if self == 1        { BladesCard::Seppuku }
        else if self == 2   { BladesCard::PocketPistol }
        else if self == 3   { BladesCard::Behead }
        else if self == 4   { BladesCard::Grapple }
        else                { BladesCard::None }
    }
}
// for println! format! (core::fmt::Display<>) assert! (core::fmt::Debug<>)
impl BladesCardDebug of core::fmt::Debug<BladesCard> {
    fn fmt(self: @BladesCard, ref f: core::fmt::Formatter) -> Result<(), core::fmt::Error> {
        let name: ByteArray = (*self).get_points().name.to_string();
        let value: u8 = (*self).into();
        let result: ByteArray = format!("({}:{})", value, name);
        f.buffer.append(@result);
        Result::Ok(())
    }
}


//----------------------------------------
// Unit  tests
//
#[cfg(test)]
mod unit {
    use super::{BladesCard};

    #[test]
    fn test_into_u8() {
        let mut i: u8 = 0;
        loop {
            let card: BladesCard = i.into();
            if (i > 0 && card == BladesCard::None) {
                break;
            }
            let as_u8: u8 = card.into();
            assert!(i == as_u8, "{} != {}", i, as_u8);
            // println!("BladesCard {} == {}", i, as_u8);
            i += 1;
        };
    }
}
