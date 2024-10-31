// use debug::PrintTrait;
use traits::Into;

#[derive(Copy, Drop, Serde, PartialEq, Introspect)]
pub enum ChallengeState {
    Null,       // 0  
    Awaiting,   // 1
    Withdrawn,  // 2
    Refused,    // 3
    Expired,    // 4
    InProgress, // 5
    Resolved,   // 6
    Draw,       // 7
}

mod CHALLENGE_STATE {
    const NULL: u8 = 0;
    const AWAITING: u8 = 1;
    const WITHDRAWN: u8 = 2;
    const REFUSED: u8 = 3;
    const EXPIRED: u8 = 4;
    const IN_PROGRESS: u8 = 5;
    const RESOLVED: u8 = 6;
    const DRAW: u8 = 7;
}

trait ChallengeStateTrait {
    fn exists(self: ChallengeState) -> bool;
    fn is_canceled(self: ChallengeState) -> bool;
    fn is_live(self: ChallengeState) -> bool;
    fn is_finished(self: ChallengeState) -> bool;
}

impl ChallengeStateTraitImpl of ChallengeStateTrait {
    fn exists(self: ChallengeState) -> bool {
        match self {
            ChallengeState::Null        => false,
            ChallengeState::Awaiting    => true,
            ChallengeState::Withdrawn   => true,
            ChallengeState::Refused     => true,
            ChallengeState::Expired     => true,
            ChallengeState::InProgress  => true,
            ChallengeState::Resolved    => true,
            ChallengeState::Draw        => true,
        }
    }
    fn is_canceled(self: ChallengeState) -> bool {
        match self {
            ChallengeState::Null        => false,
            ChallengeState::Awaiting    => false,
            ChallengeState::Withdrawn   => true,
            ChallengeState::Refused     => true,
            ChallengeState::Expired     => true,
            ChallengeState::InProgress  => false,
            ChallengeState::Resolved    => false,
            ChallengeState::Draw        => false,
        }
    }
    fn is_live(self: ChallengeState) -> bool {
        match self {
            ChallengeState::Null        => false,
            ChallengeState::Awaiting    => true,
            ChallengeState::Withdrawn   => false,
            ChallengeState::Refused     => false,
            ChallengeState::Expired     => false,
            ChallengeState::InProgress  => true,
            ChallengeState::Resolved    => false,
            ChallengeState::Draw        => false,
        }
    }
    fn is_finished(self: ChallengeState) -> bool {
        match self {
            ChallengeState::Null        => false,
            ChallengeState::Awaiting    => false,
            ChallengeState::Withdrawn   => false,
            ChallengeState::Refused     => false,
            ChallengeState::Expired     => false,
            ChallengeState::InProgress  => false,
            ChallengeState::Resolved    => true,
            ChallengeState::Draw        => true,
        }
    }
}

impl ChallengeStateIntoU8 of Into<ChallengeState, u8> {
    fn into(self: ChallengeState) -> u8 {
        match self {
            ChallengeState::Null =>       CHALLENGE_STATE::NULL,
            ChallengeState::Awaiting =>   CHALLENGE_STATE::AWAITING,
            ChallengeState::Withdrawn =>  CHALLENGE_STATE::WITHDRAWN,
            ChallengeState::Refused =>    CHALLENGE_STATE::REFUSED,
            ChallengeState::Expired =>    CHALLENGE_STATE::EXPIRED,
            ChallengeState::InProgress => CHALLENGE_STATE::IN_PROGRESS,
            ChallengeState::Resolved =>   CHALLENGE_STATE::RESOLVED,
            ChallengeState::Draw =>       CHALLENGE_STATE::DRAW,
        }
    }
}

impl TryU8IntoChallengeState of TryInto<u8, ChallengeState> {
    fn try_into(self: u8) -> Option<ChallengeState> {
        if self == CHALLENGE_STATE::NULL             { Option::Some(ChallengeState::Null) }
        else if self == CHALLENGE_STATE::AWAITING    { Option::Some(ChallengeState::Awaiting) }
        else if self == CHALLENGE_STATE::WITHDRAWN   { Option::Some(ChallengeState::Withdrawn) }
        else if self == CHALLENGE_STATE::REFUSED     { Option::Some(ChallengeState::Refused) }
        else if self == CHALLENGE_STATE::EXPIRED     { Option::Some(ChallengeState::Expired) }
        else if self == CHALLENGE_STATE::IN_PROGRESS { Option::Some(ChallengeState::InProgress) }
        else if self == CHALLENGE_STATE::RESOLVED    { Option::Some(ChallengeState::Resolved) }
        else if self == CHALLENGE_STATE::DRAW        { Option::Some(ChallengeState::Draw) }
        else { Option::None }
    }
}

impl ChallengeStateIntoFelt252 of Into<ChallengeState, felt252> {
    fn into(self: ChallengeState) -> felt252 {
        match self {
            ChallengeState::Null =>       0,
            ChallengeState::Awaiting =>   'Awaiting',
            ChallengeState::Withdrawn =>  'Withdrawn',
            ChallengeState::Refused =>    'Refused',
            ChallengeState::Expired =>    'Expired',
            ChallengeState::InProgress => 'InProgress',
            ChallengeState::Resolved =>   'Resolved',
            ChallengeState::Draw =>       'Draw',
        }
    }
}

impl TryFelt252IntoChallengeState of TryInto<felt252, ChallengeState> {
    fn try_into(self: felt252) -> Option<ChallengeState> {
        if self == 0                 { Option::Some(ChallengeState::Null) }
        else if self == 'Awaiting'   { Option::Some(ChallengeState::Awaiting) }
        else if self == 'Withdrawn'  { Option::Some(ChallengeState::Withdrawn) }
        else if self == 'Refused'    { Option::Some(ChallengeState::Refused) }
        else if self == 'Expired'    { Option::Some(ChallengeState::Expired) }
        else if self == 'InProgress' { Option::Some(ChallengeState::InProgress) }
        else if self == 'Resolved'   { Option::Some(ChallengeState::Resolved) }
        else if self == 'Draw'       { Option::Some(ChallengeState::Draw) }
        else { Option::None }
    }
}



//----------------------------------------
// Unit  tests
//
#[cfg(test)]
mod tests {
    use core::traits::Into;

    use pistols::models::challenge::{ChallengeValue};
    use pistols::types::challenge_state::{ChallengeState, ChallengeStateTrait};
    use pistols::tests::tester::{tester, tester::{FLAGS}};

    #[test]
    fn test_challenge_exists() {
        let sys = tester::setup_world(FLAGS::APPROVE);
        // get some random inexisting challenge
        let ch: ChallengeValue = tester::get_ChallengeValue(sys.world, 0x682137812638127638127);
        let state: ChallengeState = ch.state.try_into().unwrap();
        assert(state == ChallengeState::Null, 'ChallengeState::Null');
        assert(state.exists() == false, 'exists()');
    }
}
