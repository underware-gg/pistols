use pistols::models::challenge::{DuelType};

// Current challenge between two Duelists
#[derive(Copy, Drop, Serde)]
#[derive(DojoLegacyStore)]
#[dojo::model]
pub struct Pact {
    #[key]
    pub duel_type: DuelType,
    #[key]
    pub pair: u128,         // xor'd players as u256(address).low
    //------------
    pub duel_id: u128,      // current Challenge, or 0x0
    pub duel_count: u32,    // number of (finished) duels this pair has fought
}


//----------------------------------
// Traits
//
use core::num::traits::Zero;
use pistols::systems::tokens::duel_token::duel_token::{Errors as DuelErrors};
use pistols::models::challenge::{Challenge};
use pistols::utils::address::{ContractAddressIntoU256};
use pistols::libs::store::{Store, StoreTrait};

#[generate_trait]
pub impl PactImpl of PactTrait {
    //
    // misc
    //
    // because: (a^b) == (b^a)
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
    fn assert_set_pact(self: @Challenge, ref store: Store) {
        let (a, b): (u256, u256) = self._challenge_pair();
        assert(a.is_non_zero(), DuelErrors::INVALID_DUELIST_A_NULL);
        assert(b.is_non_zero(), DuelErrors::INVALID_DUELIST_B_NULL);
        let mut current_pact: Pact = store.get_pact(*self.duel_type, a, b);
        // new pact: must not exist!
        assert(current_pact.duel_id == 0, DuelErrors::PACT_EXISTS);
        current_pact.duel_id = *self.duel_id;
        store.set_pact(@current_pact);
    }
    fn unset_pact(self: @Challenge, ref store: Store, is_concluded: bool) {
        let (a, b): (u256, u256) = self._challenge_pair();
        if (a.is_non_zero() && b.is_non_zero()) {
            let mut current_pact: Pact = store.get_pact(*self.duel_type, a, b);
            current_pact.duel_id = 0;
            if (is_concluded) {
                current_pact.duel_count += 1;
            }
            store.set_pact(@current_pact);
        }
    }
}


//------------------------------------------------------
// libs::utils tests
//
#[cfg(test)]
mod unit {
    use starknet::{ContractAddress};
    use super::{Pact, PactTrait};
    use pistols::models::challenge::{DuelType};
    use pistols::utils::address::{ContractAddressIntoU256};
    use pistols::tests::tester::{tester,
        tester::{
            TestSystems, StoreTrait,
            FLAGS,
        }
    };

    fn A() -> ContractAddress {(starknet::contract_address_const::<0x127fd5f1fe78a71f8bcd1fec63e3fe2f0486b6ecd5c86a0466c3a21fa5cfcec>())}
    fn B() -> ContractAddress {(starknet::contract_address_const::<0x13d9ee239f33fea4f8785b9e3870ade909e20a9599ae7cd62c1c292b73af1b7>())}
    fn C() -> ContractAddress {(starknet::contract_address_const::<0x457643654334345634563456345634563456345634563456345634563456345>())}

    #[test]
    fn test_pact_pair() {
        let p_a = PactTrait::make_pair(A().into(), B().into());
        let p_b = PactTrait::make_pair(B().into(), A().into());
        assert_eq!(p_a, p_b, "test_pact_pair");
    }

    #[test]
    fn test_get_pacts_duel_counts_batch() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::OWNER);
        // create players
        let pair_a_b: u128 = PactTrait::make_pair(A().into(), B().into());
        let pair_a_c: u128 = PactTrait::make_pair(A().into(), C().into());
        let pact_a_b = Pact {
            duel_type: DuelType::Seasonal,
            pair: pair_a_b,
            duel_id: 0,
            duel_count: 11,
        };
        let pact_a_c = Pact {
            duel_type: DuelType::Seasonal,
            pair: pair_a_c,
            duel_id: 0,
            duel_count: 22,
        };
        tester::set_Pact(ref sys.world, @pact_a_b);
        tester::set_Pact(ref sys.world, @pact_a_c);
        // get pact batch
        let keys: Span<(DuelType, u128)> = [
            (DuelType::Seasonal, pair_a_c),
            (DuelType::Seasonal, pair_a_b),
        ].span();
        let duels: Span<u32> = sys.store.get_pacts_duel_counts_batch(keys).span();
        assert_eq!(*duels[0], pact_a_c.duel_count, "pact_a_c.duel_count");
        assert_eq!(*duels[1], pact_a_b.duel_count, "pact_a_b.duel_count");
    }
}
