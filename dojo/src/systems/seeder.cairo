// use debug::PrintTrait;
use starknet::{ContractAddress};
use pistols::utils::hash::{hash_u128, hash_u128_to_u256, felt_to_u128};

// https://github.com/starkware-libs/cairo/blob/main/corelib/src/starknet/info.cairo
use starknet::get_block_info;

fn make_seed(caller: ContractAddress) -> u128 {
    hash_u128(felt_to_u128(caller.into()), _make_block_hash())
}

fn _make_block_hash() -> u128 {
    // let block_number = get_block_number();
    // let block_timestamp = get_block_timestamp();
    let block_info = get_block_info().unbox();
    hash_u128(block_info.block_number.into(), block_info.block_timestamp.into())
}



//----------------------------------------
// Unit  tests
//
#[cfg(test)]
mod tests {
    use debug::PrintTrait;
    use pistols::utils::bitwise::{U256Bitwise};
    use pistols::systems::seeder::{
        _make_block_hash,
        make_seed,
    };

    #[test]
    #[available_gas(100_000)]
    fn test__make_block_hash() {
        let h = _make_block_hash();
        assert(h != 0, 'block hash');
    }

    #[test]
    #[available_gas(100_000_000)]
    fn test_make_seed() {
        let s0 = make_seed(starknet::contract_address_const::<0x0>());
        let s1 = make_seed(starknet::contract_address_const::<0x1>());
        let s2 = make_seed(starknet::contract_address_const::<0x2>());
        let s3 = make_seed(starknet::contract_address_const::<0x54f650fb5e1fb61d7b429ae728a365b69e5aff9a559a05de70f606aaea1a243>());
        let s4 = make_seed(starknet::contract_address_const::<0x19b55e33610cdb4b3ceda054f8870b741733f129992894ebce56f38a4150dfb>());
        assert(s0!=0, 's0');
        assert(s1!=0, 's1');
        assert(s2!=0, 's2');
        assert(s3!=0, 's3');
        assert(s4!=0, 's4');
        assert(s0!=s1, 's0!=s1');
        assert(s1!=s2, 's1!=s2');
        assert(s2!=s3, 's2!=s3');
        assert(s3!=s4, 's3!=s4');
    }
}
