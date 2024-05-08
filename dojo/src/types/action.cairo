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
    // Paces
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
    // Blades
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
    // Blades
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
    fn is_melee(self: Action) -> bool;
    fn is_runner(self: Action) -> bool;
    fn as_paces(self: Action) -> u8;
    fn crit_chance(self: Action) -> u8;
    fn hit_chance(self: Action) -> u8;
    fn glance_chance(self: Action) -> u8;
    fn honour(self: Action) -> i8;
    fn roll_priority(self: Action, other: Action) -> i8;
    fn execute_crit(self: Action, ref self_shot: Shot, ref other_shot: Shot) -> bool;
    fn execute_hit(self: Action, ref self_shot: Shot, ref other_shot: Shot);
}

impl ActionTraitImpl of ActionTrait {
    fn is_paces(self: Action) -> bool {
        match self {
            Action::Idle =>         false,
            Action::Paces1 =>       true,
            Action::Paces2 =>       true,
            Action::Paces3 =>       true,
            Action::Paces4 =>       true,
            Action::Paces5 =>       true,
            Action::Paces6 =>       true,
            Action::Paces7 =>       true,
            Action::Paces8 =>       true,
            Action::Paces9 =>       true,
            Action::Paces10 =>      true,
            Action::FastBlade =>    false,
            Action::SlowBlade =>    false,
            Action::Block =>        false,
            Action::Flee =>         false,
            Action::Steal =>        false,
            Action::Seppuku =>      false,
        }
    }
    fn as_paces(self: Action) -> u8 {
        if (self.is_paces()) { self.into() } else { (ACTION::IDLE) }
    }
    fn is_melee(self: Action) -> bool {
        match self {
            Action::Idle =>         false,
            Action::Paces1 =>       false,
            Action::Paces2 =>       false,
            Action::Paces3 =>       false,
            Action::Paces4 =>       false,
            Action::Paces5 =>       false,
            Action::Paces6 =>       false,
            Action::Paces7 =>       false,
            Action::Paces8 =>       false,
            Action::Paces9 =>       false,
            Action::Paces10 =>      false,
            Action::FastBlade =>    true,
            Action::SlowBlade =>    true,
            Action::Block =>        true,
            Action::Flee =>         false,
            Action::Steal =>        false,
            Action::Seppuku =>      false,
        }
    }
    fn is_runner(self: Action) -> bool {
        match self {
            Action::Idle =>         false,
            Action::Paces1 =>       false,
            Action::Paces2 =>       false,
            Action::Paces3 =>       false,
            Action::Paces4 =>       false,
            Action::Paces5 =>       false,
            Action::Paces6 =>       false,
            Action::Paces7 =>       false,
            Action::Paces8 =>       false,
            Action::Paces9 =>       false,
            Action::Paces10 =>      false,
            Action::FastBlade =>    false,
            Action::SlowBlade =>    false,
            Action::Block =>        false,
            Action::Flee =>         true,
            Action::Steal =>        true,
            Action::Seppuku =>      true,
        }
    }

    //-----------------
    // Flat chances
    //
    fn crit_chance(self: Action) -> u8 {
        let paces: u8 = self.as_paces();
        if (paces > 0) {
            (MathU8::map(paces, 1, 10, chances::PISTOLS_KILL_AT_STEP_1, chances::PISTOLS_KILL_AT_STEP_10))
        } else if (self.is_melee()) {
            (chances::BLADES_KILL)
        } else if (self.is_runner()) {
            (chances::ALWAYS) // always set win/wager
        } else {
            (chances::NEVER)
        }
    }
    fn hit_chance(self: Action) -> u8 {
        let paces: u8 = self.as_paces();
        if (paces > 0) {
            (MathU8::map(paces, 1, 10, chances::PISTOLS_HIT_AT_STEP_1, chances::PISTOLS_HIT_AT_STEP_10))
        } else if (self.is_melee()) {
            (chances::BLADES_HIT)
        } else {
            (chances::NEVER)
        }
    }
    fn glance_chance(self: Action) -> u8 {
        let paces: u8 = self.as_paces();
        if (paces > 0) {
            (MathU8::map(paces, 1, 10, chances::PISTOLS_GLANCE_AT_STEP_1, chances::PISTOLS_GLANCE_AT_STEP_10))
        } else if (self.is_melee()) {
            (chances::BLADES_GLANCE)
        } else {
            (chances::NEVER)
        }
    }

    //------------------
    // Honour per Action
    //
    fn honour(self: Action) -> i8 {
        match self {
            Action::Idle =>         -1, // do not affect honour
            Action::Paces1 =>       self.into(),
            Action::Paces2 =>       self.into(),
            Action::Paces3 =>       self.into(),
            Action::Paces4 =>       self.into(),
            Action::Paces5 =>       self.into(),
            Action::Paces6 =>       self.into(),
            Action::Paces7 =>       self.into(),
            Action::Paces8 =>       self.into(),
            Action::Paces9 =>       self.into(),
            Action::Paces10 =>      self.into(),
            Action::FastBlade =>    -1, // do not affect honour
            Action::SlowBlade =>    -1, // do not affect honour
            Action::Block =>        -1, // do not affect honour
            Action::Flee =>         0,
            Action::Steal =>        0,
            Action::Seppuku =>      10,
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
    // TODO: Dojo 0.6.0: Use match???
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
            return (paces_a - paces_b);
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
            if (self.is_runner() && other.is_paces()) {
                return (1);
            }
            if (self.is_paces() && other.is_runner()) {
                return (-1);
            }
        }

        (0) // default in sync
    }

    // dices decided for a crit, just execute it
    // returns true if ended in execution
    // TODO: Dojo 0.6.0: Use match
    fn execute_crit(self: Action, ref self_shot: Shot, ref other_shot: Shot) -> bool {
        // Lowest paces shoot first
        let paces: u8 = self.as_paces();
        if (paces != 0) {
            // pistols crit is execution
            other_shot.damage = constants::FULL_HEALTH;
            return (true);
        } else if (self == Action::SlowBlade) {
            other_shot.damage = constants::FULL_HEALTH;
            return (true);
        } else if (self == Action::FastBlade) {
            other_shot.damage = constants::DOUBLE_DAMAGE;
        } else if (self == Action::Block) {
            self_shot.block = constants::DOUBLE_DAMAGE;
        } else if (self == Action::Flee) {
            self_shot.wager += 1;  // split wager
            other_shot.wager += 1; // split wager
            other_shot.win = 1;   // opponent wins
        } else if (self == Action::Steal) {
            self_shot.wager += 1; // steal the wager
            if (other_shot.action != Action::Steal.into()) {
                other_shot.win = 1;  // opponent wins, unless double steal (into face-off)
            }
        } else if (self == Action::Seppuku) {
            self_shot.damage = constants::FULL_HEALTH;
            other_shot.wager += 1; // resign wager
        }
        (false)
    }

    // dices decided for a hit, just execute it
    // TODO: Dojo 0.6.0: Use match
    fn execute_hit(self: Action, ref self_shot: Shot, ref other_shot: Shot) {
        // Lowest paces shoot first
        let paces: u8 = self.as_paces();
        if (paces != 0) {
            let glance_chance: u8 = self.glance_chance();
            if (self_shot.dice_hit <= glance_chance) {
                other_shot.damage = constants::SINGLE_DAMAGE;
            } else {
                other_shot.damage = constants::DOUBLE_DAMAGE;
            }
        } else if (self == Action::SlowBlade) {
            other_shot.damage = constants::DOUBLE_DAMAGE;
        } else if (self == Action::FastBlade) {
            other_shot.damage = constants::SINGLE_DAMAGE;
        } else if (self == Action::Block) {
            self_shot.block = constants::SINGLE_DAMAGE;
        } else if (self.is_runner()) {
            // no hit for you
        }
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

