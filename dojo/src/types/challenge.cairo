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

trait ChallengeStateTrait {
    fn exists(self: ChallengeState) -> bool;
}

impl ChallengeStateTraitImpl of ChallengeStateTrait {
    fn exists(self: ChallengeState) -> bool {
        // let as_felt: felt252 = self.into();
        // (as_felt != 0)
        (self != ChallengeState::Null)
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
        let felt: felt252 = self.into();
        felt.print();
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
    use pistols::tests::utils::utils::{
        setup_world,
        get_world_Challenge,
    };

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_challenge_exists() {
        let (world, system) = setup_world();
        let caller = starknet::get_caller_address();
        // get some random inexisting challenge
        let ch: Challenge = get_world_Challenge(world, 0x682137812638127638127);
        assert(ch.state == ChallengeState::Null, 'ChallengeState::Null');
        assert(ch.state.exists() == false, 'exists()');
    }
}
