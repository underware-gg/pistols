use traits::Into;

// https://github.com/starkware-libs/cairo/blob/main/corelib/src/integer.cairo
// https://github.com/smartcontractkit/chainlink-starknet/blob/develop/contracts/src/utils.cairo
use integer::{u128s_from_felt252, U128sFromFelt252Result};

// https://github.com/starkware-libs/cairo/blob/main/corelib/src/pedersen.cairo
// externals usage:
// https://github.com/shramee/starklings-cairo1/blob/main/corelib/src/hash.cairo
extern fn pedersen(a: felt252, b: felt252) -> felt252 implicits(Pedersen) nopanic;

//
// initially hash based on: 
// https://github.com/shramee/cairo-random/blob/main/src/hash.cairo

fn hash_felt(seed: felt252, offset: felt252) -> felt252 {
    pedersen(seed, offset)
}

fn hash_u128(seed: u128, offset: u128) -> u128 {
    let hash = hash_felt(seed.into(), offset.into());
    felt_to_u128(hash)
}

fn felt_to_u128(value: felt252) -> u128 {
    match u128s_from_felt252(value) {
        U128sFromFelt252Result::Narrow(x) => x,
        U128sFromFelt252Result::Wide((_, x)) => x,
    }
}

// upgrade a u128 hash to u256
fn hash_u128_to_u256(value: u128) -> u256 {
    u256 {
        low: value,
        high: hash_u128(value, value)
    }
}


//----------------------------------------
// Unit  tests
//
#[cfg(test)]
mod tests {
    use debug::PrintTrait;
    use pistols::utils::hash::{felt_to_u128, hash_felt, hash_u128};

    #[test]
    // #[available_gas(20000)]
    fn test_felt_to_u128() {
        assert(0xab9d03074bff6ee2d4dbc374dbf3f846 == felt_to_u128(0x7f25249bc3b57d4a9cb82bd75d25579ab9d03074bff6ee2d4dbc374dbf3f846), 'bump');
    }

    #[test]
    // #[available_gas(20000)]
    fn test_hash_felt() {
        let rnd0  = hash_felt(25, 1);
        let rnd00 = hash_felt(rnd0, rnd0);
        let rnd1  = hash_felt(25, 1);
        let rnd12 = hash_felt(25, 2);
        let rnd2  = hash_felt(26, 1);
        let rnd22 = hash_felt(26, 2);
        assert(rnd0 == 0x7f25249bc3b57d4a9cb82bd75d25579ab9d03074bff6ee2d4dbc374dbf3f846, 'bump');
        assert(rnd0 != rnd00, 'bump');
        assert(rnd0 == rnd1, 'bump');
        assert(rnd1 != rnd12, 'bump');
        assert(rnd1 != rnd2, 'bump');
        assert(rnd2 != rnd22, 'bump');
    }

    #[test]
    // #[available_gas(20000)]
    fn test_hash_u128() {
        let rnd0  = hash_u128(25, 1);
        let rnd00 = hash_u128(rnd0, rnd0);
        let rnd1  = hash_u128(25, 1);
        let rnd12 = hash_u128(25, 2);
        let rnd2  = hash_u128(26, 1);
        let rnd22 = hash_u128(26, 2);
        // rnd.print();
        assert(rnd0 == 0xab9d03074bff6ee2d4dbc374dbf3f846, 'bump');
        assert(rnd0 != rnd00, 'bump');
        assert(rnd0 == rnd1, 'bump');
        assert(rnd1 != rnd12, 'bump');
        assert(rnd1 != rnd2, 'bump');
        assert(rnd2 != rnd22, 'bump');
    }
}
