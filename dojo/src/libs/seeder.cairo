// use debug::PrintTrait;
use starknet::{ContractAddress};

use pistols::utils::hash::{hash_values, make_block_hash};
use pistols::utils::misc::{felt_to_u128};

fn make_seed(caller: ContractAddress, uuid: usize) -> u128 {
    let hash: felt252 = hash_values([
        make_block_hash(),
        caller.into(),
        uuid.into(),
    ].span());
    (felt_to_u128(hash))
}


//----------------------------------------
// Unit  tests
//
#[cfg(test)]
mod tests {
    use debug::PrintTrait;
    use super::{make_seed};

    #[test]
    fn test_make_seed() {
        let s0 = make_seed(starknet::contract_address_const::<0x0>(), 1);
        let s1 = make_seed(starknet::contract_address_const::<0x1>(), 1);
        let s1_2 = make_seed(starknet::contract_address_const::<0x1>(), 2);
        let s2 = make_seed(starknet::contract_address_const::<0x2>(), 1);
        let s3 = make_seed(starknet::contract_address_const::<0x54f650fb5e1fb61d7b429ae728a365b69e5aff9a559a05de70f606aaea1a243>(), 1);
        let s4 = make_seed(starknet::contract_address_const::<0x19b55e33610cdb4b3ceda054f8870b741733f129992894ebce56f38a4150dfb>(), 1);
        let s0_1 = make_seed(starknet::contract_address_const::<0x0>(), 1);
        // never zero
        assert(s0 != 0,   's0');
        assert(s1 != 0,   's1');
        assert(s1_2 != 0, 's1_2');
        assert(s2 != 0,   's2');
        assert(s3 != 0,   's3');
        assert(s4 != 0,   's4');
        // all different from each other
        assert(s0 != s1,   's0 != s1');
        assert(s1 != s1_2, 's1 != s2');
        assert(s1 != s2,   's1 != s2');
        assert(s2 != s3,   's2 != s3');
        assert(s3 != s4,   's3 != s4');
        // same seed, same value
        assert(s0 == s0_1, 's0 == s0_1');
    }
}
