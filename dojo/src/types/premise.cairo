// use debug::PrintTrait;
use traits::Into;

#[derive(Copy, Drop, Serde, PartialEq, Introspect)]
pub enum Premise {
    Null,       // 0
    //-----
    Matter,     // 1
    Debt,       // 2
    Dispute,    // 3
    Honour,     // 4
    Hatred,     // 5
    Blood,      // 6
    Nothing,    // 7
}

#[generate_trait]
impl PremiseTraitImpl of PremiseTrait {
    fn name(self: Premise) -> felt252 {
        match self {
            Premise::Null        => 'Null',
            Premise::Matter      => 'Matter',
            Premise::Debt        => 'Debt',
            Premise::Dispute     => 'Dispute',
            Premise::Honour      => 'Honour',
            Premise::Hatred      => 'Hatred',
            Premise::Blood       => 'Blood',
            Premise::Nothing     => 'Nothing',
        }
    }
    fn prefix(self: Premise) -> felt252 {
        match self {
            Premise::Null        => 'over...?',
            Premise::Matter      => 'over the matter of',
            Premise::Debt        => 'to discharge a debt',
            Premise::Dispute     => 'to satisfy a dispute',
            Premise::Honour      => 'to defend their honour',
            Premise::Hatred      => 'to satisfy a burning hatred',
            Premise::Blood       => 'for the love of death and blood',
            Premise::Nothing     => 'for no reason other than',
        }
    }
}
