// use debug::PrintTrait;
use traits::Into;

#[derive(Copy, Drop, Serde, PartialEq, Introspect)]
pub enum RoundState {
    Null,       // 0
    Commit,     // 1
    Reveal,     // 2
    Finished,   // 3
}

trait RoundStateTrait {
    fn is_finished(self: RoundState) -> bool;
}

impl RoundStateTraitImpl of RoundStateTrait {
    fn is_finished(self: RoundState) -> bool {
        match self {
            RoundState::Null        => true,
            RoundState::Commit      => false,
            RoundState::Reveal      => false,
            RoundState::Finished    => true,
        }
    }
}
