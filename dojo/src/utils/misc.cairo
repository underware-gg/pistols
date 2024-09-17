// use debug::PrintTrait;
use starknet::{ContractAddress};
use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};
use pistols::utils::bitwise::{BITWISE};

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
    // match u128s_from_felt252(value) {
    //     U128sFromFelt252Result::Narrow(x) => x,
    //     U128sFromFelt252Result::Wide((_, x)) => x,
    // }
    let as_u256: u256 = value.into();
    (as_u256.low)
}

fn felt_to_usize(value: felt252) -> usize {
    let as_u256: u256 = value.into();
    ((as_u256.low & BITWISE::MAX_U32.into()).try_into().unwrap())
}
