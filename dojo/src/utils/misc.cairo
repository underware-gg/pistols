use starknet::{ContractAddress};
use pistols::utils::bitwise::{BITWISE};

// https://github.com/starkware-libs/cairo/blob/main/corelib/src/integer.cairo
// https://github.com/smartcontractkit/chainlink-starknet/blob/develop/contracts/src/utils.cairo
// use core::integer::{u128s_from_felt252, U128sFromFelt252Result};

// consumes unused arguments to avoid warnings
#[inline(always)]
pub fn CONSUME_ADDRESS(_value: ContractAddress) {}
#[inline(always)]
pub fn CONSUME_BYTE_ARRAY(_value: @ByteArray) {}
#[inline(always)]
pub fn CONSUME_U256(_value: u256) {}

#[inline(always)]
pub fn ZERO() -> ContractAddress {
    (starknet::contract_address_const::<0x0>())
}

pub impl ContractAddressDefault of Default<ContractAddress> {
    fn default() -> ContractAddress {(ZERO())}
}

// for println! format! (core::fmt::Display<>) assert! (core::fmt::Debug<>)
pub impl ContractAddressDisplay of core::fmt::Display<ContractAddress> {
    fn fmt(self: @ContractAddress, ref f: core::fmt::Formatter) -> Result<(), core::fmt::Error> {
        let result: felt252 = (*self).into();
        f.buffer.append(@format!("{:x}", result));
        Result::Ok(())
    }
}
pub impl ContractAddressDebug of core::fmt::Debug<ContractAddress> {
    fn fmt(self: @ContractAddress, ref f: core::fmt::Formatter) -> Result<(), core::fmt::Error> {
        let result: felt252 = (*self).into();
        f.buffer.append(@format!("{:x}", result));
        Result::Ok(())
    }
}


//--------------------------------
// Felt252
//

// lossy conversions
#[generate_trait]
pub impl FeltToLossy of FeltToLossyTrait {
    fn to_u128_lossy(self: felt252) -> u128 {
        // match u128s_from_felt252(self) {
        //     U128sFromFelt252Result::Narrow(x) => x,
        //     U128sFromFelt252Result::Wide((_, x)) => x,
        // }
        let as_u256: u256 = self.into();
        (as_u256.low)
    }
    fn to_u64_lossy(self: felt252) -> u64 {
        let as_u256: u256 = self.into();
        ((as_u256.low & BITWISE::MAX_U64.into()).try_into().unwrap())
    }
    #[inline(always)]
    fn to_usize_lossy(self: felt252) -> usize {
        (self.to_u32_lossy())
    }
    fn to_u32_lossy(self: felt252) -> u32 {
        let as_u256: u256 = self.into();
        ((as_u256.low & BITWISE::MAX_U32.into()).try_into().unwrap())
    }
    fn to_u16_lossy(self: felt252) -> u16 {
        let as_u256: u256 = self.into();
        ((as_u256.low & BITWISE::MAX_U16.into()).try_into().unwrap())
    }
    fn to_u8_lossy(self: felt252) -> u8 {
        let as_u256: u256 = self.into();
        ((as_u256.low & BITWISE::MAX_U8.into()).try_into().unwrap())
    }
}


//--------------------------------
// ContractAddress
//
pub impl ContractAddressIntoU256 of core::traits::Into<ContractAddress, u256> {
    #[inline(always)]
    fn into(self: ContractAddress) -> u256 {
        let as_felt: felt252 = self.into();
        (as_felt.into())
    }
}
