use starknet::{ContractAddress};

//--------------------------------
// ContractAddress
//
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

pub impl ContractAddressIntoU256 of core::traits::Into<ContractAddress, u256> {
    #[inline(always)]
    fn into(self: ContractAddress) -> u256 {
        let as_felt: felt252 = self.into();
        (as_felt.into())
    }
}
