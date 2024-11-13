use starknet::ContractAddress;

#[derive(Copy, Drop, Serde, Default)]
#[dojo::model]
pub struct Payment {
    #[key]
    pub key: felt252,           // table id or contract address
    //------
    pub amount: u256,           // amount to be paid in $LORDS
    pub client_percent: u8,     // client provider
    pub ranking_percent: u8,    // highest ranking player
    pub owner_percent: u8,      // table owner
    pub pool_percent: u8,       // prize pool
    pub treasury_percent: u8,   // game treasury
}

// #[derive(Clone, Drop, Serde)]
// #[dojo::model]
// pub struct PrizePool {
//     #[key]
//     pub key: felt252,           // table id or contract address
//     //------
//     pub amount: u256,           // amount per player in $LORDS
//     pub balance: u256,          // total balance in $LORDS
//     pub accounts: Array<ContractAddress>,
// }


//---------------------------
// Traits
//
use pistols::systems::bank::bank::{Errors as BankErrors};

#[generate_trait]
impl PaymentImpl of PaymentTrait {
    fn is_valid(self: Payment) -> bool {
        (self.amount == 0 || (
            self.client_percent +
            self.ranking_percent +
            self.owner_percent +
            self.pool_percent +
            self.treasury_percent
        ) == 100)
    }
    fn assert_is_valid(self: Payment) {
        assert(self.is_valid(), BankErrors::INVALID_SHARES);
    }
}
