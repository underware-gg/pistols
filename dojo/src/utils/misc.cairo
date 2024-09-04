// use debug::PrintTrait;
use starknet::{ContractAddress};
use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

// https://github.com/starkware-libs/cairo/blob/main/corelib/src/integer.cairo
// https://github.com/smartcontractkit/chainlink-starknet/blob/develop/contracts/src/utils.cairo
use integer::{u128s_from_felt252, U128sFromFelt252Result};

// consumes an IWorldDispatcher to avoid unused variable warnings
#[inline(always)]
fn WORLD(_world: IWorldDispatcher) {}

// consumes a ByteArray to avoid unused variable warnings
#[inline(always)]
fn CONSUME_BYTE_ARRAY(_value: @ByteArray) {}

#[inline(always)]
fn ZERO() -> ContractAddress {
    (starknet::contract_address_const::<0x0>())
}

fn felt_to_u128(value: felt252) -> u128 {
    match u128s_from_felt252(value) {
        U128sFromFelt252Result::Narrow(x) => x,
        U128sFromFelt252Result::Wide((_, x)) => x,
    }
}
