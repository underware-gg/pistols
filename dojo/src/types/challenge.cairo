use traits::Into;
use debug::PrintTrait;

#[derive(Copy, Drop, Serde, PartialEq, Introspect)]
enum ChallengeState {
    Challenged,
    Accepted,
    Refused,
    TimedOut,
    InProgress,
    Resolved,
    Draw,
}

impl ChallengeStateIntoFelt252 of Into<ChallengeState, felt252> {
    fn into(self: ChallengeState) -> felt252 {
        match self {
            ChallengeState::Challenged => 'Challenged',
            ChallengeState::Accepted =>   'Accepted',
            ChallengeState::Refused =>    'Refused',
            ChallengeState::TimedOut =>   'TimedOut',
            ChallengeState::InProgress => 'InProgress',
            ChallengeState::Resolved =>   'Resolved',
            ChallengeState::Draw =>       'Draw',
        }
    }
}

impl TryFelt252IntoChallengeState of TryInto<felt252, ChallengeState> {
    fn try_into(self: felt252) -> Option<ChallengeState> {
        if self == 'Challenged'      { Option::Some(ChallengeState::Challenged) }
        else if self == 'Accepted'   { Option::Some(ChallengeState::Accepted) }
        else if self == 'Refused'    { Option::Some(ChallengeState::Refused) }
        else if self == 'TimedOut'   { Option::Some(ChallengeState::TimedOut) }
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
    use pistols::types::challenge::{ChallengeState};

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_duel_state() {
    }
}
