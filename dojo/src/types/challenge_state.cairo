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

trait ChallengeStateTrait {
    fn exists(self: ChallengeState) -> bool;
    fn is_canceled(self: ChallengeState) -> bool;
    fn is_live(self: ChallengeState) -> bool;
    fn is_finished(self: ChallengeState) -> bool;
}

impl ChallengeStateImpl of ChallengeStateTrait {
    fn exists(self: ChallengeState) -> bool {
        match self {
            ChallengeState::Null        => false,
            _                           => true,
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

impl ChallengeStateIntoByteArray of Into<ChallengeState, ByteArray> {
    fn into(self: ChallengeState) -> ByteArray {
        match self {
            ChallengeState::Null =>       "Undefined",
            ChallengeState::Awaiting =>   "Awaiting",
            ChallengeState::Withdrawn =>  "Withdrawn",
            ChallengeState::Refused =>    "Refused",
            ChallengeState::Expired =>    "Expired",
            ChallengeState::InProgress => "In Progress",
            ChallengeState::Resolved =>   "Resolved",
            ChallengeState::Draw =>       "Draw",
        }
    }
}
