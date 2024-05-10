use traits::{Into, PartialOrd};
use debug::PrintTrait;

use pistols::models::models::{Shot};
use pistols::types::constants::{constants, chances};
use pistols::utils::math::{MathU8};

//------------------------
// constants
//
// Actions
mod ACTION {
    // paces and blades each use half byte
    // makes it easier to distinguish but not in use, can be removed if we need more than 16 blades
    const PACES_MASK: u8  = 0x0f;
    const BLADES_MASK: u8 = 0xf0;
    //
    // Inaction / Invalid (skip round)
    const IDLE: u8 = 0x00;
    //
    // Paces (round 1)
    const PACES_1: u8 = 0x01;
    const PACES_2: u8 = 0x02;
    const PACES_3: u8 = 0x03;
    const PACES_4: u8 = 0x04;
    const PACES_5: u8 = 0x05;
    const PACES_6: u8 = 0x06;
    const PACES_7: u8 = 0x07;
    const PACES_8: u8 = 0x08;
    const PACES_9: u8 = 0x09;
    const PACES_10: u8 = 0x0a;
    //
    // Blades (round 2+)
    const FAST_BLADE: u8 = 0x10;
    const SLOW_BLADE: u8 = 0x20;
    const BLOCK: u8 = 0x30;
    const FLEE: u8 = 0x40;
    const STEAL: u8 = 0x50;
    const SEPPUKU: u8 = 0x60;
}




//--------------------------------
// Action types
//
#[derive(Copy, Drop, Serde, PartialEq, Introspect)]
enum Action {
    Idle,
    // Paces
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
    // Melee
    FastBlade,
    SlowBlade,
    Block,
    // Runners
    Flee,
    Steal,
    Seppuku,
}


//--------------------------------------
// Traits
//

trait ActionTrait {
    fn is_paces(self: Action) -> bool;
    fn as_paces(self: Action) -> u8;
    fn is_melee(self: Action) -> bool;
    fn is_runner(self: Action) -> bool;
    fn roll_priority(self: Action, other: Action) -> i8;
    fn honour(self: Action) -> i8;
    fn crit_chance(self: Action) -> u8;
    fn hit_chance(self: Action) -> u8;
    fn lethal_chance(self: Action) -> u8;
    fn crit_penalty(self: Action) -> u8;
    fn hit_penalty(self: Action) -> u8;
    fn execute_crit(self: Action, ref self_shot: Shot, ref other_shot: Shot) -> bool;
    fn execute_hit(self: Action, ref self_shot: Shot, ref other_shot: Shot, lethal_chance: u8);
}

impl ActionTraitImpl of ActionTrait {
    fn is_paces(self: Action) -> bool {
        match self {
            Action::Paces1 |
            Action::Paces2 |
            Action::Paces3 |
            Action::Paces4 |
            Action::Paces5 |
            Action::Paces6 |
            Action::Paces7 |
            Action::Paces8 |
            Action::Paces9 |
            Action::Paces10 =>  true,
            _ =>                false,
        }
    }
    fn as_paces(self: Action) -> u8 {
        if (self.is_paces()) { self.into() } else { (ACTION::IDLE) }
    }
    fn is_melee(self: Action) -> bool {
        match self {
            Action::FastBlade |
            Action::SlowBlade |
            Action::Block =>    true,
            _ =>                false,
        }
    }
    fn is_runner(self: Action) -> bool {
        match self {
            Action::Flee |
            Action::Steal |
            Action::Seppuku =>  true,
            _ =>                false,
        }
    }

    //----------------------------
    // Roll priority
    //
    // returns
    // < 0: self rolls first
    //   0: roll simultaneously
    // > 0: other rolls first
    //
    fn roll_priority(self: Action, other: Action) -> i8 {
        // Lowest paces shoot first
        let is_paces_a: bool = self.is_paces();
        let is_paces_b: bool = other.is_paces();
        if (is_paces_a && is_paces_b) {
            //
            // Paces vs Paces
            //
            // Lowest pace shoots first
            let paces_a: i8 = self.into();
            let paces_b: i8 = other.into();
            (paces_a - paces_b)
        } else {
            //
            // Blades vs Blades
            //
            // Slow crits first for a chance of Execution
            if (self == Action::SlowBlade && other != Action::SlowBlade) {
                return (-1);
            }
            if (other == Action::SlowBlade && self != Action::SlowBlade) {
                return (1);
            }
            // Flee/Steal rolls after paces
            if (self.is_runner() && is_paces_b) {
                return (1);
            }
            if (is_paces_a && other.is_runner()) {
                return (-1);
            }
            (0) // default in sync
        }
    }

    //------------------
    // Honour per Action
    //
    fn honour(self: Action) -> i8 {
        match self {
            Action::Paces1 |
            Action::Paces2 |
            Action::Paces3 |
            Action::Paces4 |
            Action::Paces5 |
            Action::Paces6 |
            Action::Paces7 |
            Action::Paces8 |
            Action::Paces9 |
            Action::Paces10 =>  self.into(),
            Action::Flee =>     0,  // drops honour to zero
            Action::Steal =>    0,  // drops honour to zero
            Action::Seppuku =>  10, // very honourable
            _ =>                -1, // do not affect honour
        }
    }

    //-----------------
    // Flat chances
    //
    fn crit_chance(self: Action) -> u8 {
        match self {
            Action::Paces1 |
            Action::Paces2 |
            Action::Paces3 |
            Action::Paces4 |
            Action::Paces5 |
            Action::Paces6 |
            Action::Paces7 |
            Action::Paces8 |
            Action::Paces9 |
            Action::Paces10 =>  (MathU8::map(self.into(), 1, 10, chances::PISTOLS_KILL_AT_STEP_1, chances::PISTOLS_KILL_AT_STEP_10)),
            Action::FastBlade |
            Action::SlowBlade |
            Action::Block =>    (chances::BLADES_CRIT),
            Action::Flee |
            Action::Steal |
            Action::Seppuku =>  (chances::ALWAYS), // always succeeds
            _ =>                (chances::NEVER)
        }
    }
    fn hit_chance(self: Action) -> u8 {
        match self {
            Action::Paces1 |
            Action::Paces2 |
            Action::Paces3 |
            Action::Paces4 |
            Action::Paces5 |
            Action::Paces6 |
            Action::Paces7 |
            Action::Paces8 |
            Action::Paces9 |
            Action::Paces10 =>  (MathU8::map(self.into(), 1, 10, chances::PISTOLS_HIT_AT_STEP_1, chances::PISTOLS_HIT_AT_STEP_10)),
            Action::FastBlade |
            Action::SlowBlade |
            Action::Block =>    (chances::BLADES_HIT),
            _ =>                (chances::NEVER)
        }
    }
    fn lethal_chance(self: Action) -> u8 {
        match self {
            Action::Paces1 |
            Action::Paces2 |
            Action::Paces3 |
            Action::Paces4 |
            Action::Paces5 |
            Action::Paces6 |
            Action::Paces7 |
            Action::Paces8 |
            Action::Paces9 |
            Action::Paces10 =>  (MathU8::map(self.into(), 1, 10, chances::PISTOLS_LETHAL_AT_STEP_1, chances::PISTOLS_LETHAL_AT_STEP_10)),
            _ =>                (chances::NEVER)
        }
    }

    fn crit_penalty(self: Action) -> u8 {
        match self {
            Action::Paces1 |
            Action::Paces2 |
            Action::Paces3 |
            Action::Paces4 |
            Action::Paces5 |
            Action::Paces6 |
            Action::Paces7 |
            Action::Paces8 |
            Action::Paces9 |
            Action::Paces10 =>  (chances::CRIT_PENALTY_PER_DAMAGE),
            _ =>                (0)
        }
    }
    fn hit_penalty(self: Action) -> u8 {
        match self {
            Action::Paces1 |
            Action::Paces2 |
            Action::Paces3 |
            Action::Paces4 |
            Action::Paces5 |
            Action::Paces6 |
            Action::Paces7 |
            Action::Paces8 |
            Action::Paces9 |
            Action::Paces10 =>  (chances::HIT_PENALTY_PER_DAMAGE),
            _ =>                (0)
        }
    }

    //----------------------------
    // Execution
    //
    // dices decided for a crit, just execute it
    // returns true if ended in execution
    fn execute_crit(self: Action, ref self_shot: Shot, ref other_shot: Shot) -> bool {
        match self {
            Action::Paces1 |
            Action::Paces2 |
            Action::Paces3 |
            Action::Paces4 |
            Action::Paces5 |
            Action::Paces6 |
            Action::Paces7 |
            Action::Paces8 |
            Action::Paces9 |
            Action::Paces10 => {
                // pistols crit is execution
                other_shot.damage = constants::FULL_HEALTH;
                (true)
            },
            Action::FastBlade => {
                other_shot.damage = constants::DOUBLE_DAMAGE;
                (false)
            },
            Action::SlowBlade => {
                other_shot.damage = constants::FULL_HEALTH;
                (true)
            },
            Action::Block => {
                self_shot.block = constants::DOUBLE_DAMAGE;
                (false)
            },
            Action::Flee => {
                self_shot.wager += 1;  // split wager
                other_shot.wager += 1; // split wager
                other_shot.win = 1;   // opponent wins
                (false)
            },
            Action::Steal => {
                self_shot.wager += 1; // steal the wager
                if (other_shot.action != Action::Steal.into()) {
                    other_shot.win = 1;  // opponent wins, unless double steal (into face-off)
                }
                (false)
            },
            Action::Seppuku => {
                self_shot.damage = constants::FULL_HEALTH;
                other_shot.wager += 1; // resign wager
                (false)
            },
            _ => (false),
        }
    }

    // dices decided for a hit, just execute it
    fn execute_hit(self: Action, ref self_shot: Shot, ref other_shot: Shot, lethal_chance: u8) {
        match self {
            Action::Paces1 |
            Action::Paces2 |
            Action::Paces3 |
            Action::Paces4 |
            Action::Paces5 |
            Action::Paces6 |
            Action::Paces7 |
            Action::Paces8 |
            Action::Paces9 |
            Action::Paces10 => {
                if (self_shot.dice_hit <= lethal_chance) {
                    other_shot.damage = constants::DOUBLE_DAMAGE;   // full damage
                } else {
                    other_shot.damage = constants::SINGLE_DAMAGE;   // glance
                }
            },
            Action::FastBlade => {
                other_shot.damage = constants::SINGLE_DAMAGE;
            },
            Action::SlowBlade => {
                other_shot.damage = constants::DOUBLE_DAMAGE;
            },
            Action::Block => {
                self_shot.block = constants::SINGLE_DAMAGE;
            },
            _ => {},
        };
    }

}



//--------------------------------------
// core Traits
//
impl ActionIntoU8 of Into<Action, u8> {
    fn into(self: Action) -> u8 {
        match self {
            Action::Idle =>         ACTION::IDLE,
            // Paces
            Action::Paces1 =>       ACTION::PACES_1,
            Action::Paces2 =>       ACTION::PACES_2,
            Action::Paces3 =>       ACTION::PACES_3,
            Action::Paces4 =>       ACTION::PACES_4,
            Action::Paces5 =>       ACTION::PACES_5,
            Action::Paces6 =>       ACTION::PACES_6,
            Action::Paces7 =>       ACTION::PACES_7,
            Action::Paces8 =>       ACTION::PACES_8,
            Action::Paces9 =>       ACTION::PACES_9,
            Action::Paces10 =>      ACTION::PACES_10,
            // Blades
            Action::FastBlade =>    ACTION::FAST_BLADE,
            Action::SlowBlade =>    ACTION::SLOW_BLADE,
            Action::Block =>        ACTION::BLOCK,
            Action::Flee =>         ACTION::FLEE,
            Action::Steal =>        ACTION::STEAL,
            Action::Seppuku =>      ACTION::SEPPUKU,
        }
    }
}
impl ActionIntoI16 of Into<Action, i8> {
    fn into(self: Action) -> i8 {
        let action: u8 = self.into();
        return action.try_into().unwrap();
    }
}
impl ActionIntoU16 of Into<Action, u16> {
    fn into(self: Action) -> u16 {
        let action: u8 = self.into();
        return action.into();
    }
}
impl U8IntoAction of Into<u8, Action> {
    fn into(self: u8) -> Action {
        if self == ACTION::IDLE             { Action::Idle }
        // Paces
        else if self == ACTION::PACES_1     { Action::Paces1 }
        else if self == ACTION::PACES_2     { Action::Paces2 }
        else if self == ACTION::PACES_3     { Action::Paces3 }
        else if self == ACTION::PACES_4     { Action::Paces4 }
        else if self == ACTION::PACES_5     { Action::Paces5 }
        else if self == ACTION::PACES_6     { Action::Paces6 }
        else if self == ACTION::PACES_7     { Action::Paces7 }
        else if self == ACTION::PACES_8     { Action::Paces8 }
        else if self == ACTION::PACES_9     { Action::Paces9 }
        else if self == ACTION::PACES_10    { Action::Paces10 }
        // Blades
        else if self == ACTION::FAST_BLADE  { Action::FastBlade }
        else if self == ACTION::SLOW_BLADE  { Action::SlowBlade }
        else if self == ACTION::BLOCK       { Action::Block }
        else if self == ACTION::FLEE        { Action::Flee }
        else if self == ACTION::STEAL       { Action::Steal }
        else if self == ACTION::SEPPUKU     { Action::Seppuku }
        // invalid is always Idle
        else { Action::Idle }
    }
}
impl U16IntoAction of Into<u16, Action> {
    fn into(self: u16) -> Action {
        let action: u8 = self.try_into().unwrap();
        return action.into();
    }
}
//
// Print Trait
//
impl ActionIntoFelt252 of Into<Action, felt252> {
    fn into(self: Action) -> felt252 {
        match self {
            Action::Idle =>         'Idle',
            // Paces
            Action::Paces1 =>       '1 Pace',
            Action::Paces2 =>       '2 Paces',
            Action::Paces3 =>       '3 Paces',
            Action::Paces4 =>       '4 Paces',
            Action::Paces5 =>       '5 Paces',
            Action::Paces6 =>       '6 Paces',
            Action::Paces7 =>       '7 Paces',
            Action::Paces8 =>       '8 Paces',
            Action::Paces9 =>       '9 Paces',
            Action::Paces10 =>      '10 Paces',
            // Blades
            Action::FastBlade =>    'Fast Blade',
            Action::SlowBlade =>    'Slow Blade',
            Action::Block =>        'Block',
            Action::Flee =>         'Flee',
            Action::Steal =>        'Steal',
            Action::Seppuku =>      'Seppuku',
        }
    }
}
impl PrintAction of PrintTrait<Action> {
    fn print(self: Action) {
        let num: felt252 = self.into();
        num.print();
    }
}

