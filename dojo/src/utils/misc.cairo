// use debug::PrintTrait;
use starknet::{ContractAddress};
use pistols::utils::bitwise::{BITWISE};

// https://github.com/starkware-libs/cairo/blob/main/corelib/src/integer.cairo
// https://github.com/smartcontractkit/chainlink-starknet/blob/develop/contracts/src/utils.cairo
use integer::{u128s_from_felt252, U128sFromFelt252Result};

// consumes unused arguments to avoid warnings
#[inline(always)]
fn CONSUME_ADDRESS(_value: ContractAddress) {}
#[inline(always)]
fn CONSUME_BYTE_ARRAY(_value: @ByteArray) {}
#[inline(always)]
fn CONSUME_U256(_value: u256) {}

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

fn felt_to_u64(value: felt252) -> u64 {
    let as_u256: u256 = value.into();
    ((as_u256.low & BITWISE::MAX_U64.into()).try_into().unwrap())
}

#[inline(always)]
fn felt_to_usize(value: felt252) -> usize {
    (felt_to_u32(value))
}

fn felt_to_u32(value: felt252) -> u32 {
    let as_u256: u256 = value.into();
    ((as_u256.low & BITWISE::MAX_U32.into()).try_into().unwrap())
}

fn felt_to_u16(value: felt252) -> u16 {
    let as_u256: u256 = value.into();
    ((as_u256.low & BITWISE::MAX_U16.into()).try_into().unwrap())
}

fn felt_to_u8(value: felt252) -> u8 {
    let as_u256: u256 = value.into();
    ((as_u256.low & BITWISE::MAX_U8.into()).try_into().unwrap())
}
