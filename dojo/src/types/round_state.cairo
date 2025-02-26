
#[derive(Copy, Drop, Serde, PartialEq, Introspect)]
pub enum RoundState {
    Null,       // 0
    Commit,     // 1
    Reveal,     // 2
    Finished,   // 3
}

pub trait RoundStateTrait {
    fn is_finished(self: @RoundState) -> bool;
}

impl RoundStateImpl of RoundStateTrait {
    fn is_finished(self: @RoundState) -> bool {
        match self {
            RoundState::Null        => true,
            RoundState::Commit      => false,
            RoundState::Reveal      => false,
            RoundState::Finished    => true,
        }
    }
}



//---------------------------
// Converters
//
impl RoundStateIntoByteArray of core::traits::Into<RoundState, ByteArray> {
    fn into(self: RoundState) -> ByteArray {
        match self {
            RoundState::Null =>       "Undefined",
            RoundState::Commit =>   "Commit",
            RoundState::Reveal =>  "Reveal",
            RoundState::Finished => "Finished",
        }
    }
}
// for println! format! (core::fmt::Display<>) assert! (core::fmt::Debug<>)
// pub impl RoundStateDisplay of core::fmt::Display<RoundState> {
//     fn fmt(self: @RoundState, ref f: core::fmt::Formatter) -> Result<(), core::fmt::Error> {
//         let result: ByteArray = (*self).into();
//         f.buffer.append(@result);
//         Result::Ok(())
//     }
// }
pub impl RoundStateDebug of core::fmt::Debug<RoundState> {
    fn fmt(self: @RoundState, ref f: core::fmt::Formatter) -> Result<(), core::fmt::Error> {
        let result: ByteArray = (*self).into();
        f.buffer.append(@result);
        Result::Ok(())
    }
}
