
#[derive(Copy, Drop, Serde, PartialEq, Introspect)]
pub enum Premise {
    Undefined,  // 0
    //-----
    Matter,     // 1
    Debt,       // 2
    Dispute,    // 3
    Honour,     // 4
    Hatred,     // 5
    Blood,      // 6
    Nothing,    // 7
    Tournament, // 8
    Treaty,     // 9
    Lesson,     // 10
}


//--------------------
// constants
//

#[derive(Copy, Drop, Serde, Default)]
pub struct PremiseDescription {
    pub name: felt252, // @generateContants:shortstring
    pub prefix: felt252, // @generateContants:shortstring
}

// to be exported to typescript by generateConstants
// IMPORTANT: names must be in sync with enum Premise
mod PREMISES {
    use super::{PremiseDescription};
    pub const Undefined: PremiseDescription = PremiseDescription {
        name: 'Undefined',
        prefix: 'over...?',
    };
    pub const Matter: PremiseDescription = PremiseDescription {
        name: 'Matter',
        prefix: 'over the matter of',
    };
    pub const Debt: PremiseDescription = PremiseDescription {
        name: 'Debt',
        prefix: 'to discharge a debt',
    };
    pub const Dispute: PremiseDescription = PremiseDescription {
        name: 'Dispute',
        prefix: 'to satisfy a dispute',
    };
    pub const Honour: PremiseDescription = PremiseDescription {
        name: 'Honour',
        prefix: 'to defend their honour',
    };
    pub const Hatred: PremiseDescription = PremiseDescription {
        name: 'Hatred',
        prefix: 'to satisfy a burning hatred',
    };
    pub const Blood: PremiseDescription = PremiseDescription {
        name: 'Blood',
        prefix: 'for the love of death and blood',
    };
    pub const Nothing: PremiseDescription = PremiseDescription {
        name: 'Nothing',
        prefix: 'for no reason other than',
    };
    pub const Tournament: PremiseDescription = PremiseDescription {
        name: 'Tournament',
        prefix: 'to be the winner of',
    };
    pub const Treaty: PremiseDescription = PremiseDescription {
        name: 'Treaty',
        prefix: 'to settle the terms of',
    };
    pub const Lesson: PremiseDescription = PremiseDescription {
        name: 'Lesson',
        prefix: 'to learn about',
    };
}


//--------------------
// Traits
//
use pistols::utils::short_string::{ShortStringTrait};

#[generate_trait]
pub impl PremiseImpl of PremiseTrait {
    fn description(self: @Premise) -> PremiseDescription {
        match self {
            Premise::Undefined   => PREMISES::Undefined,
            Premise::Matter      => PREMISES::Matter,
            Premise::Debt        => PREMISES::Debt,
            Premise::Dispute     => PREMISES::Dispute,
            Premise::Honour      => PREMISES::Honour,
            Premise::Hatred      => PREMISES::Hatred,
            Premise::Blood       => PREMISES::Blood,
            Premise::Nothing     => PREMISES::Nothing,
            Premise::Tournament  => PREMISES::Tournament,
            Premise::Treaty      => PREMISES::Treaty,
            Premise::Lesson      => PREMISES::Lesson,
        }
    }
    fn name(self: @Premise) -> ByteArray {
        (self.description().name.to_string())
    }
    fn prefix(self: @Premise) -> ByteArray {
        (self.description().prefix.to_string())
    }
}




//---------------------------
// Converters
//
// for println! format! (core::fmt::Display<>) assert! (core::fmt::Debug<>)
pub impl PremiseDebug of core::fmt::Debug<Premise> {
    fn fmt(self: @Premise, ref f: core::fmt::Formatter) -> Result<(), core::fmt::Error> {
        f.buffer.append(@(*self).name());
        Result::Ok(())
    }
}
