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
use pistols::systems::tokens::duel_token::duel_token::{Errors as DuelErrors};
use pistols::models::challenge::{Challenge};
use pistols::utils::misc::{ContractAddressIntoU256};
use pistols::libs::store::{Store, StoreTrait};

#[generate_trait]
pub impl PactImpl of PactTrait {
    //
    // misc
    //
    fn make_pair(a: u256, b: u256) -> u128 {
        (a.low ^ b.low)
    }

    //
    // Challenge trait
    //
    fn _challenge_pair(self: @Challenge) -> (u256, u256) {
        if (*self.duel_type == DuelType::Tournament) {
            ((*self.duelist_id_a).into(), (*self.duelist_id_b).into())
        } else {
            ((*self.address_a).into(), (*self.address_b).into())
        }
    }
    fn set_pact(self: @Challenge, ref store: Store) {
        let (a, b): (u256, u256) = self._challenge_pair();
        assert(a.is_non_zero(), DuelErrors::INVALID_DUELIST_A_NULL);
        assert(b.is_non_zero(), DuelErrors::INVALID_DUELIST_B_NULL);
        let mut current_pact: Pact = store.get_pact(*self.duel_type, a, b);
        // new pact: must not exist!
        assert(current_pact.duel_id == 0, DuelErrors::PACT_EXISTS);
        current_pact.duel_id = *self.duel_id;
        store.set_pact(@current_pact);
    }
    fn unset_pact(self: @Challenge, ref store: Store) {
        let (a, b): (u256, u256) = self._challenge_pair();
        if (a.is_non_zero() && b.is_non_zero()) {
            let current_pact: Pact = store.get_pact(*self.duel_type, a, b);
            store.delete_pact(@current_pact);
        }
    }
}


//------------------------------------------------------
// libs::utils tests
//
#[cfg(test)]
mod unit {
    use starknet::{ContractAddress};

    use super::{PactTrait};
    use pistols::models::duelist::{DuelistStatus, DuelistStatusTrait};
    use pistols::utils::short_string::{ShortString};
    use pistols::utils::misc::{ContractAddressIntoU256};

    #[test]
    fn test_pact_pair() {
        let a: ContractAddress = starknet::contract_address_const::<0x127fd5f1fe78a71f8bcd1fec63e3fe2f0486b6ecd5c86a0466c3a21fa5cfcec>();
        let b: ContractAddress = starknet::contract_address_const::<0x13d9ee239f33fea4f8785b9e3870ade909e20a9599ae7cd62c1c292b73af1b7>();
        let p_a = PactTrait::make_pair(a.into(), b.into());
        let p_b = PactTrait::make_pair(b.into(), a.into());
        assert_eq!(p_a, p_b, "test_pact_pair");
    }

    #[test]
    fn test_update_honour() {
        let mut status: DuelistStatus = Default::default();
        status.total_duels = 1;
        status.update_honour(100);
        assert!(status.is_lord(), "is_lord()");
    }

    #[test]
    fn test_honour_log() {
        let mut status: DuelistStatus = Default::default();
        let mut sum: u8 = 0;
        let mut n: u8 = 1;
        loop {
            if (n > 8) { break; }
            status.total_duels += 1;
            status.update_honour(n);
            sum += n;
            assert_eq!(status.honour, (sum / n), "sum_8__{}", n);
            n += 1;
        };
        assert_eq!(status.honour_log, 0x0807060504030201, "0x0807060504030201");
        // loop status
        loop {
            if (n > 16) { break; }
            status.total_duels += 1;
            status.update_honour(n);
            sum -= n - 8;
            sum += n;
            assert_eq!(status.honour, (sum / 8), "sum_16__{}", n);
            n += 1;
        };
        assert_eq!(status.honour_log, 0x100f0e0d0c0b0a09, "0x100f0e0d0c0b0a09");
        // new loop
        status.total_duels += 1;
        status.update_honour(n);
        assert_eq!(status.honour_log, 0x100f0e0d0c0b0a11, "0x100f0e0d0c0b0a11");
    }

}
