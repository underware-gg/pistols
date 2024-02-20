use traits::Into;
use debug::PrintTrait;

// constants
mod ACTION {
    const IDLE: u16 = 0;
    const PACES_MASK: u16 = 0x000f;
    const BLADES_MASK: u16 = 0x00f0;
    // Paces
    const PACES_1: u16 = 1;
    const PACES_2: u16 = 2;
    const PACES_3: u16 = 3;
    const PACES_4: u16 = 4;
    const PACES_5: u16 = 5;
    const PACES_6: u16 = 6;
    const PACES_7: u16 = 7;
    const PACES_8: u16 = 8;
    const PACES_9: u16 = 9;
    const PACES_10: u16 = 10;
    // Blades
    const FAST_BLADE: u16 = 0x10;
    const SLOW_BLADE: u16 = 0x20;
    const BLOCK: u16 = 0x30;
    // const FLEE: u16 = 0x40;
    // const STEAL: u16 = 0x50;
    // const SEPPUKU: u16 = 0x60;
}

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
}


//--------------------------------------
// Traits
//

trait ActionTrait {
    fn is_paces(self: Action) -> bool;
    fn is_blades(self: Action) -> bool;
    fn as_paces(self: Action) -> u16;
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
        }
    }
    fn is_blades(self: Action) -> bool {
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
        }
    }
    fn as_paces(self: Action) -> u16 {
        if (self.is_paces()) { self.into() } else { 0 }
    }
}


//--------------------------------------
// Into / TryInto
//

impl ActionIntoU8 of Into<Action, u16> {
    fn into(self: Action) -> u16 {
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
        }
    }
}

impl TryU8IntoAction of TryInto<u16, Action> {
    fn try_into(self: u16) -> Option<Action> {
        if self == ACTION::IDLE             { Option::Some(Action::Idle) }
        // Paces
        else if self == ACTION::PACES_1     { Option::Some(Action::Paces1) }
        else if self == ACTION::PACES_2     { Option::Some(Action::Paces2) }
        else if self == ACTION::PACES_3     { Option::Some(Action::Paces3) }
        else if self == ACTION::PACES_4     { Option::Some(Action::Paces4) }
        else if self == ACTION::PACES_5     { Option::Some(Action::Paces5) }
        else if self == ACTION::PACES_6     { Option::Some(Action::Paces6) }
        else if self == ACTION::PACES_7     { Option::Some(Action::Paces7) }
        else if self == ACTION::PACES_8     { Option::Some(Action::Paces8) }
        else if self == ACTION::PACES_9     { Option::Some(Action::Paces9) }
        else if self == ACTION::PACES_10    { Option::Some(Action::Paces10) }
        // Blades
        else if self == ACTION::FAST_BLADE  { Option::Some(Action::FastBlade) }
        else if self == ACTION::SLOW_BLADE  { Option::Some(Action::SlowBlade) }
        else if self == ACTION::BLOCK       { Option::Some(Action::Block) }
        else { Option::None }
    }
}


//--------------------------------------
// PrintTrait
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
        }
    }
}

impl PrintAction of PrintTrait<Action> {
    fn print(self: Action) {
        let num: felt252 = self.into();
        num.print();
    }
}




//----------------------------------------
// Unit  tests
//
#[cfg(test)]
mod tests {
    use debug::PrintTrait;
    use core::traits::Into;
    use core::traits::TryInto;

    use pistols::types::action::{Action, ActionTrait, ACTION};

    #[test]
    #[available_gas(1_000_000)]
    fn test_paces() {
        assert(0_u16 == Action::Idle.into(), 'Action > 0');
        assert(1_u16 == Action::Paces1.into(), 'Action > 1');
        assert(2_u16 == Action::Paces2.into(), 'Action > 2');
        assert(3_u16 == Action::Paces3.into(), 'Action > 3');
        assert(4_u16 == Action::Paces4.into(), 'Action > 4');
        assert(5_u16 == Action::Paces5.into(), 'Action > 5');
        assert(6_u16 == Action::Paces6.into(), 'Action > 6');
        assert(7_u16 == Action::Paces7.into(), 'Action > 7');
        assert(8_u16 == Action::Paces8.into(), 'Action > 8');
        assert(9_u16 == Action::Paces9.into(), 'Action > 9');
        assert(10_u16 == Action::Paces10.into(), 'Action > 10');

        assert(Action::Idle == 0_u16.try_into().unwrap(), '0 > Action');
        assert(Action::Paces1 == 1_u16.try_into().unwrap(), '1 > Action');
        assert(Action::Paces2 == 2_u16.try_into().unwrap(), '2 > Action');
        assert(Action::Paces3 == 3_u16.try_into().unwrap(), '3 > Action');
        assert(Action::Paces4 == 4_u16.try_into().unwrap(), '4 > Action');
        assert(Action::Paces5 == 5_u16.try_into().unwrap(), '5 > Action');
        assert(Action::Paces6 == 6_u16.try_into().unwrap(), '6 > Action');
        assert(Action::Paces7 == 7_u16.try_into().unwrap(), '7 > Action');
        assert(Action::Paces8 == 8_u16.try_into().unwrap(), '8 > Action');
        assert(Action::Paces9 == 9_u16.try_into().unwrap(), '9 > Action');
        assert(Action::Paces10 == 10_u16.try_into().unwrap(), '10 > Steps');
    }

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_is_paces() {
        let mut n: u16 = 0;
        loop {
            if (n > 0xf0) {
                break;
            }
            let option_action: Option<Action> = n.try_into();
            if (option_action != Option::None) {
                let action: Action = option_action.unwrap();
                // let paces: u16 = action.into();
                // assert(paces == n, 'Action value is pace');
                let is_pace = action.is_paces();
                assert(is_pace == (n >= 1 && n <= 10), 'action.is_paces()');
                if (is_pace) {
                    let paces: u16 = action.as_paces();
                    assert(paces == n, 'action.as_paces()');
                }
            }
            n += 1;
        }
    }

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_mask() {
        let mut n: u16 = 0;
        loop {
            if (n > 0xf0) {
                break;
            }
            let option_action: Option<Action> = n.try_into();
            if (option_action != Option::None) {
                let action: Action = option_action.unwrap();
                let is_pace = action.is_paces();
                if (is_pace) {
                    assert(n & ACTION::PACES_MASK == n, 'pace & ACTION::PACES_MASK');
                    assert(n & ACTION::BLADES_MASK == 0, 'pace & ACTION::BLADES_MASK');
                } else {
                    assert(n & ACTION::PACES_MASK == 0, 'blade & ACTION::PACES_MASK');
                    assert(n & ACTION::BLADES_MASK == n, 'blade & ACTION::BLADES_MASK');
                }
            }
            n += 1;
        }
    }
}
