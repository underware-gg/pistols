use traits::Into;
use debug::PrintTrait;

#[derive(Copy, Drop, Serde, PartialEq, Introspect)]
enum ChallengeState {
    Null,
    Awaiting,
    Canceled,
    Refused,
    Expired,
    InProgress,
    Resolved,
    Draw,
}

mod CHALLENGE_STATE {
    const NULL: u8 = 0;
    const AWAITING: u8 = 1;
    const CANCELED: u8 = 2;
    const REFUSED: u8 = 3;
    const EXPIRED: u8 = 4;
    const IN_PROGRESS: u8 = 5;
    const RESOLVED: u8 = 6;
    const DRAW: u8 = 7;
}

trait ChallengeStateTrait {
    fn exists(self: ChallengeState) -> bool;
    fn finished(self: ChallengeState) -> bool;
}

impl ChallengeStateTraitImpl of ChallengeStateTrait {
    fn exists(self: ChallengeState) -> bool {
        match self {
            ChallengeState::Null => false,
            ChallengeState::Awaiting => true,
            ChallengeState::Canceled => true,
            ChallengeState::Refused => true,
            ChallengeState::Expired => true,
            ChallengeState::InProgress => true,
            ChallengeState::Resolved => true,
            ChallengeState::Draw => true,
        }
    }
    fn finished(self: ChallengeState) -> bool {
        match self {
            ChallengeState::Null => true,
            ChallengeState::Awaiting => false,
            ChallengeState::Canceled => true,
            ChallengeState::Refused => true,
            ChallengeState::Expired => true,
            ChallengeState::InProgress => false,
            ChallengeState::Resolved => true,
            ChallengeState::Draw => true,
        }
    }
}

impl ChallengeStateIntoU8 of Into<ChallengeState, u8> {
    fn into(self: ChallengeState) -> u8 {
        match self {
            ChallengeState::Null =>       CHALLENGE_STATE::NULL,
            ChallengeState::Awaiting =>   CHALLENGE_STATE::AWAITING,
            ChallengeState::Canceled =>   CHALLENGE_STATE::CANCELED,
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
        else if self == CHALLENGE_STATE::CANCELED    { Option::Some(ChallengeState::Canceled) }
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
            ChallengeState::Canceled =>   'Canceled',
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
        if self == 'Null'            { Option::Some(ChallengeState::Null) }
        else if self == 'Awaiting'   { Option::Some(ChallengeState::Awaiting) }
        else if self == 'Canceled'   { Option::Some(ChallengeState::Canceled) }
        else if self == 'Refused'    { Option::Some(ChallengeState::Refused) }
        else if self == 'Expired'    { Option::Some(ChallengeState::Expired) }
        else if self == 'InProgress' { Option::Some(ChallengeState::InProgress) }
        else if self == 'Resolved'   { Option::Some(ChallengeState::Resolved) }
        else if self == 'Draw'       { Option::Some(ChallengeState::Draw) }
        else { Option::None }
    }
}

impl PrintChallengeState of PrintTrait<ChallengeState> {
    fn print(self: ChallengeState) {
        let num: felt252 = self.into();
        num.print();
        // let num: u8 = self.into();
        // num.print();
    }
}



//----------------------------------------
// Unit  tests
//
#[cfg(test)]
mod tests {
    use debug::PrintTrait;
    use core::traits::Into;

    use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

    use pistols::models::models::{Challenge};
    use pistols::types::challenge::{ChallengeState, ChallengeStateTrait};
    use pistols::tests::utils::{utils};

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_challenge_exists() {
        let (world, system, owner, other) = utils::setup_world();
        // get some random inexisting challenge
        let ch: Challenge = utils::get_Challenge(world, 0x682137812638127638127);
        assert(ch.state == ChallengeState::Null, 'ChallengeState::Null');
        assert(ch.state.exists() == false, 'exists()');
    }
}
