use pistols::models::challenge::{DuelType};

// Current challenge between two Duelists
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct Pact {
    #[key]
    pub duel_type: DuelType,
    #[key]
    pub pair: u128,     // xor'd duelists as u256(address).low
    //------------
    pub duel_id: u128,  // current Challenge, or 0x0
}


//----------------------------------
// Traits
//
use core::num::traits::Zero;
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

    //
    // Challenge trait
    //
    fn set_pact(self: @Challenge, ref store: Store) {
        assert((*self.address_a).is_non_zero(), DuelErrors::INVALID_DUELIST_A_NULL);
        assert((*self.address_b).is_non_zero(), DuelErrors::INVALID_DUELIST_B_NULL);
        let mut current_pact: Pact = store.get_pact(*self.duel_type, *self.address_a, *self.address_b);
        // new pact: must not exist!
        assert(current_pact.duel_id == 0, DuelErrors::PACT_EXISTS);
        current_pact.duel_id = *self.duel_id;
        store.set_pact(@current_pact);
    }
    fn unset_pact(self: @Challenge, ref store: Store) {
        if ((*self.address_a).is_non_zero() && (*self.address_b).is_non_zero()) {
            let current_pact: Pact = store.get_pact(*self.duel_type, *self.address_a, *self.address_b);
            store.delete_pact(@current_pact);
        }
    }
}
