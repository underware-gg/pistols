// use debug::PrintTrait;
use traits::Into;

#[derive(Copy, Drop, Serde, Introspect)]
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
}


//--------------------
// constants
//

#[derive(Copy, Drop, Serde, Default)]
pub struct PremiseDescription {
    name: felt252, // @generateContants_type: shortstring
    prefix: felt252, // @generateContants_type: shortstring
}

// to be exported to typescript by generateConstants
// IMPORTANT: names must be in sync with enum Premise
mod PREMISES {
    use super::{PremiseDescription};
    const Undefined: PremiseDescription = PremiseDescription {
        name: 'Undefined',
        prefix: 'over...?',
    };
    const Matter: PremiseDescription = PremiseDescription {
        name: 'Matter',
        prefix: 'over the matter of',
    };
    const Debt: PremiseDescription = PremiseDescription {
        name: 'Debt',
        prefix: 'to discharge a debt',
    };
    const Dispute: PremiseDescription = PremiseDescription {
        name: 'Dispute',
        prefix: 'to satisfy a dispute',
    };
    const Honour: PremiseDescription = PremiseDescription {
        name: 'Honour',
        prefix: 'to defend their honour',
    };
    const Hatred: PremiseDescription = PremiseDescription {
        name: 'Hatred',
        prefix: 'to satisfy a burning hatred',
    };
    const Blood: PremiseDescription = PremiseDescription {
        name: 'Blood',
        prefix: 'for the love of death and blood',
    };
    const Nothing: PremiseDescription = PremiseDescription {
        name: 'Nothing',
        prefix: 'for no reason other than',
    };
    const Tournament: PremiseDescription = PremiseDescription {
        name: 'Tournament',
        prefix: 'to be the winner of',
    };
}


//--------------------
// Traits
//

#[generate_trait]
impl PremiseTraitImpl of PremiseTrait {
    fn name(self: Premise) -> felt252 {
        match self {
            Premise::Undefined   => PREMISES::Undefined.name,
            Premise::Matter      => PREMISES::Matter.name,
            Premise::Debt        => PREMISES::Debt.name,
            Premise::Dispute     => PREMISES::Dispute.name,
            Premise::Honour      => PREMISES::Honour.name,
            Premise::Hatred      => PREMISES::Hatred.name,
            Premise::Blood       => PREMISES::Blood.name,
            Premise::Nothing     => PREMISES::Nothing.name,
            Premise::Tournament  => PREMISES::Tournament.name,
        }
    }
    fn prefix(self: Premise) -> felt252 {
        match self {
            Premise::Undefined   => PREMISES::Undefined.prefix,
            Premise::Matter      => PREMISES::Matter.prefix,
            Premise::Debt        => PREMISES::Debt.prefix,
            Premise::Dispute     => PREMISES::Dispute.prefix,
            Premise::Honour      => PREMISES::Honour.prefix,
            Premise::Hatred      => PREMISES::Hatred.prefix,
            Premise::Blood       => PREMISES::Blood.prefix,
            Premise::Nothing     => PREMISES::Nothing.prefix,
            Premise::Tournament  => PREMISES::Tournament.prefix,
        }
    }
}
