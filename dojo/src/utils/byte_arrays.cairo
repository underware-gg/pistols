use starknet::{ContractAddress};

//-------------------
// Converters
//
pub impl U8IntoByteArray of core::traits::Into<u8, ByteArray> {
    #[inline(always)]
    fn into(self: u8) -> ByteArray { format!("{}", self) }
}
pub impl U16IntoByteArray of core::traits::Into<u16, ByteArray> {
    #[inline(always)]
    fn into(self: u16) -> ByteArray { format!("{}", self) }
}
pub impl U32IntoByteArray of core::traits::Into<u32, ByteArray> {
    #[inline(always)]
    fn into(self: u32) -> ByteArray { format!("{}", self) }
}
pub impl U64IntoByteArray of core::traits::Into<u64, ByteArray> {
    #[inline(always)]
    fn into(self: u64) -> ByteArray { format!("{}", self) }
}
pub impl U128IntoByteArray of core::traits::Into<u128, ByteArray> {
    #[inline(always)]
    fn into(self: u128) -> ByteArray { format!("{}", self) }
}
pub impl U256IntoByteArray of core::traits::Into<u256, ByteArray> {
    #[inline(always)]
    fn into(self: u256) -> ByteArray { format!("{}", self) }
}
pub impl ContractAddressIntoByteArray of core::traits::Into<ContractAddress, ByteArray> {
    fn into(self: ContractAddress) -> ByteArray {
        let as_felt: felt252 = self.into();
        format!("{}", as_felt)
    }
}
pub impl ByteArraySpanIntoByteArray of core::traits::Into<@ByteArray, ByteArray> {
    #[inline(always)]
    fn into(self: @ByteArray) -> ByteArray { format!("{}", self) }
}


//-------------------
// Traits
//
#[generate_trait]
pub impl BoolToString of BoolToStringTrait {
    #[inline(always)]
    fn to_string(self: bool) -> ByteArray { if (self) { "True" } else { "False" } }
}


//----------------------------------------
// Unit  tests
//
#[cfg(test)]
mod tests {
    use super::{
        U8IntoByteArray,
        U16IntoByteArray,
        U32IntoByteArray,
        U64IntoByteArray,
        U128IntoByteArray,
        U256IntoByteArray,
        ContractAddressIntoByteArray,
        ByteArraySpanIntoByteArray,
    };

    #[test]
    fn test_into() {
        let as_u8: ByteArray = 255_u8.into();
        let as_u16: ByteArray = 65535_u16.into();
        let as_u32: ByteArray = 4294967295_u32.into();
        let as_u64: ByteArray = 18446744073709551615_u64.into();
        let as_u128: ByteArray = 340282366920938463463374607431768211455_u128.into();
        let as_u256: ByteArray = 115792089237316195423570985008687907853269984665640564039457584007913129639935_u256.into();
        let as_addr: ByteArray = starknet::contract_address_const::<0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffff>().into();
        assert_eq!(as_u8, "255", "u8");
        assert_eq!(as_u16, "65535", "u16");
        assert_eq!(as_u32, "4294967295", "u32");
        assert_eq!(as_u64, "18446744073709551615", "u64");
        assert_eq!(as_u128, "340282366920938463463374607431768211455", "u128");
        assert_eq!(as_u256, "115792089237316195423570985008687907853269984665640564039457584007913129639935", "u256");
        assert_eq!(as_addr, "110427941548649020598956093796432407239217743554726184882600387580788735", "ContractAddress");
    }
}
