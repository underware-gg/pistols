use traits::Into;
use debug::PrintTrait;

#[derive(Copy, Drop, Serde, PartialEq, Introspect)]
enum RoundState {
    Null,
    Commit,
    Reveal,
    Finished,
}

mod ROUND_STATE {
    const NULL: u8 = 0;
    const COMMIT: u8 = 1;
    const REVEAL: u8 = 2;
    const FINISHED: u8 = 6;
}

trait RoundStateTrait {
    fn exists(self: RoundState) -> bool;
    fn finished(self: RoundState) -> bool;
}

impl RoundStateTraitImpl of RoundStateTrait {
    fn exists(self: RoundState) -> bool {
        match self {
            RoundState::Null        => false,
            RoundState::Commit      => true,
            RoundState::Reveal      => true,
            RoundState::Finished    => true,
        }
    }
    fn finished(self: RoundState) -> bool {
        match self {
            RoundState::Null        => true,
            RoundState::Commit      => false,
            RoundState::Reveal      => false,
            RoundState::Finished    => true,
        }
    }
}

impl RoundStateIntoU8 of Into<RoundState, u8> {
    fn into(self: RoundState) -> u8 {
        match self {
            RoundState::Null =>      ROUND_STATE::NULL,
            RoundState::Commit =>    ROUND_STATE::COMMIT,
            RoundState::Reveal =>    ROUND_STATE::REVEAL,
            RoundState::Finished =>  ROUND_STATE::FINISHED,
        }
    }
}

impl TryU8IntoRoundState of TryInto<u8, RoundState> {
    fn try_into(self: u8) -> Option<RoundState> {
        if self == ROUND_STATE::NULL            { Option::Some(RoundState::Null) }
        else if self == ROUND_STATE::COMMIT     { Option::Some(RoundState::Commit) }
        else if self == ROUND_STATE::REVEAL     { Option::Some(RoundState::Reveal) }
        else if self == ROUND_STATE::FINISHED   { Option::Some(RoundState::Finished) }
        else { Option::None }
    }
}

impl RoundStateIntoFelt252 of Into<RoundState, felt252> {
    fn into(self: RoundState) -> felt252 {
        match self {
            RoundState::Null =>      0,
            RoundState::Commit =>    'Commit',
            RoundState::Reveal =>    'Reveal',
            RoundState::Finished =>  'Finished',
        }
    }
}

impl TryFelt252IntoRoundState of TryInto<felt252, RoundState> {
    fn try_into(self: felt252) -> Option<RoundState> {
        if self == 0                { Option::Some(RoundState::Null) }
        else if self == 'Commit'    { Option::Some(RoundState::Commit) }
        else if self == 'Reveal'    { Option::Some(RoundState::Reveal) }
        else if self == 'Finished'  { Option::Some(RoundState::Finished) }
        else { Option::None }
    }
}

impl PrintRoundState of PrintTrait<RoundState> {
    fn print(self: RoundState) {
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

    use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

    use pistols::models::models::{Round};
    use pistols::types::round::{RoundState, RoundStateTrait};
    use pistols::tests::utils::{utils};

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_round_exists() {
        let (world, system, owner, other) = utils::setup_world();
        // get some random inexisting round
        let ch: Round = utils::get_Round(world, 0x682137812638127638127, 1);
        let state: RoundState = ch.state.try_into().unwrap();
        assert(state == RoundState::Null, 'RoundState::Null');
        assert(state.exists() == false, 'exists()');
    }
}
