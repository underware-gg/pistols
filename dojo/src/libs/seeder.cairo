use starknet::{ContractAddress};

use pistols::utils::hash::{hash_values, make_block_hash};

pub fn make_seed(caller: ContractAddress, uuid: felt252) -> felt252 {
    let hash: felt252 = hash_values([
        make_block_hash(),
        caller.into(),
        uuid,
    ].span());
    (hash)
}


//----------------------------------------
// Unit  tests
//
#[cfg(test)]
mod unit {
    use super::{make_seed};

    #[test]
    fn test_make_seed() {
        let s0: felt252 = make_seed(0x0.try_into().unwrap(), 1);
        let s1: felt252 = make_seed(0x1.try_into().unwrap(), 1);
        let s1_2: felt252 = make_seed(0x1.try_into().unwrap(), 2);
        let s2: felt252 = make_seed(0x2.try_into().unwrap(), 1);
        let s3: felt252 = make_seed(0x54f650fb5e1fb61d7b429ae728a365b69e5aff9a559a05de70f606aaea1a243.try_into().unwrap(), 1);
        let s4: felt252 = make_seed(0x19b55e33610cdb4b3ceda054f8870b741733f129992894ebce56f38a4150dfb.try_into().unwrap(), 1);
        let s0_1: felt252 = make_seed(0x0.try_into().unwrap(), 1);
        // never zero
        assert_ne!(s0, 0, "s0");
        assert_ne!(s1, 0, "s1");
        assert_ne!(s1_2, 0, "s1_2");
        assert_ne!(s2, 0, "s2");
        assert_ne!(s3, 0, "s3");
        assert_ne!(s4, 0, "s4");
        // all different from each other
        assert_ne!(s0, s1, "s0 != s1");
        assert_ne!(s1, s1_2, "s1 != s2");
        assert_ne!(s1, s2, "s1 != s2");
        assert_ne!(s2, s3, "s2 != s3");
        assert_ne!(s3, s4, "s3 != s4");
        // same seed, same value
        assert_eq!(s0, s0_1, "s0 == s0_1");
    }
}
