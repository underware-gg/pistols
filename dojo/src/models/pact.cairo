
// Current challenge between two Duelists
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct Pact {
    #[key]
    pub table_id: felt252,
    #[key]
    pub pair: u128,     // xor'd duelists as u256(address).low
    //------------
    pub duel_id: u128,  // current Challenge, or 0x0
}


//----------------------------------
// Traits
//
use starknet::{ContractAddress};

use pistols::systems::tokens::duel_token::duel_token::{Errors as DuelErrors};
use pistols::models::challenge::{Challenge};
use pistols::utils::misc::{ContractAddressIntoU256};
use pistols::libs::store::{Store, StoreTrait};

#[generate_trait]
pub impl PactImpl of PactTrait {
    //
    // misc
    //
    fn make_pair(address_a: ContractAddress, address_b: ContractAddress) -> u128 {
        let aa: u256 = address_a.into();
        let bb: u256 = address_b.into();
        (aa.low ^ bb.low)
    }
    fn get_pact(store: @Store, table_id: felt252, address_a: ContractAddress, address_b: ContractAddress) -> u128 {
        let pair: u128 = Self::make_pair(address_a, address_b);
        (store.get_pact(table_id, pair).duel_id)
    }

    //
    // Challenge trait
    //
    fn set_pact(self: @Challenge, ref store: Store) {
        let pair: u128 = Self::make_pair(*self.address_a, *self.address_b);
        let mut current_pact: Pact = store.get_pact(*self.table_id, pair);
        // new pact: must not exist!
        assert(current_pact.duel_id == 0, DuelErrors::PACT_EXISTS);
        current_pact.duel_id = *self.duel_id;
        store.set_pact(@current_pact);
    }
    fn unset_pact(self: @Challenge, ref store: Store) {
        let pair: u128 = Self::make_pair(*self.address_a, *self.address_b);
        let current_pact: Pact = store.get_pact(*self.table_id, pair);
        store.delete_pact(@current_pact);
    }
}
