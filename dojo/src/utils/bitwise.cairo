pub mod BITWISE {
    pub const MAX_U8: u8 = 0xff; // 255
    pub const MAX_U16: u16 = 0xffff; // 65535
    pub const MAX_U32: u32 = 0xffffffff; // 4294967295
    pub const MAX_U64: u64 = 0xffffffffffffffff; // 18446744073709551615
    pub const MAX_U128: u128 = 0xffffffffffffffffffffffffffffffff; // 340282366920938463463374607431768211455
    pub const MAX_U256: u256 = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff; // 115792089237316195423570985008687907853269984665640564039457584007913129639935

    // most significant bit (e.g u8: 0b10000000, or 0x80)
    pub const MSB_U8: u8     = 0x80; // 128
    pub const MSB_U16: u16   = 0x8000; // 32768
    pub const MSB_U32: u32   = 0x80000000; // 2147483648
    pub const MSB_U64: u64   = 0x8000000000000000; // 9223372036854775808
    pub const MSB_U128: u128 = 0x80000000000000000000000000000000; // 170141183460469231731687303715884105728
    pub const MSB_U256: u256 = 0x8000000000000000000000000000000000000000000000000000000000000000; // 57896044618658097711785492504343953926634992332820282019728792003956564819968
}


pub trait BitwiseTrait<T> {
    fn bit_count() -> usize;
    fn byte_count() -> usize;
    fn max() -> T;
    fn msb() -> T;
    fn bit(n: usize) -> T;
    fn set(x: T, n: usize) -> T;
    fn unset(x: T, n: usize) -> T;
    fn shl(x: T, n: usize) -> T;
    fn shr(x: T, n: usize) -> T;
    fn is_set(x: T, n: usize) -> bool;
    fn count_bits(x: T) -> usize;
    fn sum_bytes(x: T) -> T;
}

pub impl BitwiseU8 of BitwiseTrait<u8> {
    #[inline(always)]
    fn bit_count() -> usize {(8)}
    #[inline(always)]
    fn byte_count() -> usize {(1)}
    #[inline(always)]
    fn max() -> u8 {(BITWISE::MAX_U8)}
    #[inline(always)]
    fn msb() -> u8 {(BITWISE::MSB_U8)}
    fn bit(n: usize) -> u8 {
        if n == 0 { (0b00000001) }
        else if (n == 1) { (0b00000010) }
        else if (n == 2) { (0b00000100) }
        else if (n == 3) { (0b00001000) }
        else if (n == 4) { (0b00010000) }
        else if (n == 5) { (0b00100000) }
        else if (n == 6) { (0b01000000) }
        else if (n == 7) { (0b10000000) }
        else { (0) }
    }
    #[inline(always)]
    fn set(x: u8, n: usize) -> u8 {
        x | Self::bit(n)
    }
    #[inline(always)]
    fn unset(x: u8, n: usize) -> u8 {
        x & ~Self::bit(n)
    }
    #[inline(always)]
    fn shl(x: u8, n: usize) -> u8 {
        x * Self::bit(n)
    }
    #[inline(always)]
    fn shr(x: u8, n: usize) -> u8 {
        if (n < 8) { (x / Self::bit(n)) }
        else { (0) }
    }
    #[inline(always)]
    fn is_set(x: u8, n: usize) -> bool {
        ((Self::shr(x, n) & 1) != 0)
    }
    fn count_bits(x: u8) -> usize {
        let mut result: usize = 0;
        let mut bit: u8 = BITWISE::MSB_U8;
        while (bit != 0) {
            if (x & bit != 0) { result += 1; };
            bit /= 2;
        };
        result
    }
    fn sum_bytes(x: u8) -> u8 {(x)}
}

pub impl BitwiseU16 of BitwiseTrait<u16> {
    #[inline(always)]
    fn bit_count() -> usize {(16)}
    #[inline(always)]
    fn byte_count() -> usize {(2)}
    #[inline(always)]
    fn max() -> u16 {(BITWISE::MAX_U16)}
    #[inline(always)]
    fn msb() -> u16 {(BITWISE::MSB_U16)}
    fn bit(n: usize) -> u16 {
        if n < 8 { (BitwiseU8::bit(n).into()) }
        else if n < 16 { (BitwiseU8::bit(n-8).into() * 0x100) }
        else { (0) }
    }
    #[inline(always)]
    fn set(x: u16, n: usize) -> u16 {
        x | Self::bit(n)
    }
    #[inline(always)]
    fn unset(x: u16, n: usize) -> u16 {
        x & ~Self::bit(n)
    }
    #[inline(always)]
    fn shl(x: u16, n: usize) -> u16 {
        x * Self::bit(n)
    }
    #[inline(always)]
    fn shr(x: u16, n: usize) -> u16 {
        if (n < 16) { (x / Self::bit(n)) }
        else { (0) }
    }
    #[inline(always)]
    fn is_set(x: u16, n: usize) -> bool {
        ((Self::shr(x, n) & 1) != 0)
    }
    fn count_bits(x: u16) -> usize {
        let mut result: usize = 0;
        let mut bit: u16 = BITWISE::MSB_U16;
        while (bit != 0) {
            if (x & bit != 0) { result += 1; };
            bit /= 2;
        };
        result
    }
    fn sum_bytes(mut x: u16) -> u16 {
        let mut result: u16 = 0;
        loop {
            if (x == 0) { break; }
            result += (x & 0xff);
            x /= 0x100;
        };
        (result)
    }
}

pub impl BitwiseU32 of BitwiseTrait<u32> {
    #[inline(always)]
    fn bit_count() -> usize {(32)}
    #[inline(always)]
    fn byte_count() -> usize {(4)}
    #[inline(always)]
    fn max() -> u32 {(BITWISE::MAX_U32)}
    #[inline(always)]
    fn msb() -> u32 {(BITWISE::MSB_U32)}
    fn bit(n: usize) -> u32 {
        if n < 16 { (BitwiseU16::bit(n).into()) }
        else if n < 32 { (BitwiseU16::bit(n-16).into() * 0x10000) }
        else { (0) }
    }
    #[inline(always)]
    fn set(x: u32, n: usize) -> u32 {
        x | Self::bit(n)
    }
    #[inline(always)]
    fn unset(x: u32, n: usize) -> u32 {
        x & ~Self::bit(n)
    }
    #[inline(always)]
    fn shl(x: u32, n: usize) -> u32 {
        x * Self::bit(n)
    }
    #[inline(always)]
    fn shr(x: u32, n: usize) -> u32 {
        if (n < 32) { (x / Self::bit(n)) }
        else { (0) }
    }
    #[inline(always)]
    fn is_set(x: u32, n: usize) -> bool {
        ((Self::shr(x, n) & 1) != 0)
    }
    fn count_bits(x: u32) -> usize {
        let mut result: usize = 0;
        let mut bit: u32 = BITWISE::MSB_U32;
        while (bit != 0) {
            if (x & bit != 0) { result += 1; };
            bit /= 2;
        };
        result
    }
    fn sum_bytes(mut x: u32) -> u32 {
        let mut result: u32 = 0;
        loop {
            if (x == 0) { break; }
            result += (x & 0xff);
            x /= 0x100;
        };
        (result)
    }
}

pub impl BitwiseU64 of BitwiseTrait<u64> {
    #[inline(always)]
    fn bit_count() -> usize {(64)}
    #[inline(always)]
    fn byte_count() -> usize {(8)}
    #[inline(always)]
    fn max() -> u64 {(BITWISE::MAX_U64)}
    #[inline(always)]
    fn msb() -> u64 {(BITWISE::MSB_U64)}
    fn bit(n: usize) -> u64 {
        if n < 32 { (BitwiseU32::bit(n).into()) }
        else if n < 64 { (BitwiseU32::bit(n-32).into() * 0x100000000) }
        else { (0) }
    }
    #[inline(always)]
    fn set(x: u64, n: usize) -> u64 {
        x | Self::bit(n)
    }
    #[inline(always)]
    fn unset(x: u64, n: usize) -> u64 {
        x &  ~Self::bit(n)
    }
    #[inline(always)]
    fn shl(x: u64, n: usize) -> u64 {
        x * Self::bit(n)
    }
    #[inline(always)]
    fn shr(x: u64, n: usize) -> u64 {
        if (n < 64) { (x / Self::bit(n)) }
        else { (0) }
    }
    #[inline(always)]
    fn is_set(x: u64, n: usize) -> bool {
        ((Self::shr(x, n) & 1) != 0)
    }
    fn count_bits(x: u64) -> usize {
        let mut result: usize = 0;
        let mut bit: u64 = BITWISE::MSB_U64;
        while (bit != 0) {
            if (x & bit != 0) { result += 1; };
            bit /= 2;
        };
        result
    }
    fn sum_bytes(mut x: u64) -> u64 {
        let mut result: u64 = 0;
        loop {
            if (x == 0) { break; }
            result += (x & 0xff);
            x /= 0x100;
        };
        (result)
    }
}

pub impl BitwiseU128 of BitwiseTrait<u128> {
    #[inline(always)]
    fn bit_count() -> usize {(128)}
    #[inline(always)]
    fn byte_count() -> usize {(16)}
    #[inline(always)]
    fn max() -> u128 {(BITWISE::MAX_U128)}
    #[inline(always)]
    fn msb() -> u128 {(BITWISE::MSB_U128)}
    fn bit(n: usize) -> u128 {
        if n < 64 { (BitwiseU64::bit(n).into()) }
        else if n < 128 { (BitwiseU64::bit(n-64).into() * 0x10000000000000000) }
        else { (0) }
    }
    #[inline(always)]
    fn set(x: u128, n: usize) -> u128 {
        x | Self::bit(n)
    }
    #[inline(always)]
    fn unset(x: u128, n: usize) -> u128 {
        x & ~Self::bit(n)
    }
    #[inline(always)]
    fn shl(x: u128, n: usize) -> u128 {
        x * Self::bit(n)
    }
    #[inline(always)]
    fn shr(x: u128, n: usize) -> u128 {
        if (n < 128) { (x / Self::bit(n)) }
        else { (0) }
    }
    #[inline(always)]
    fn is_set(x: u128, n: usize) -> bool {
        ((Self::shr(x, n) & 1) != 0)
    }
    fn count_bits(x: u128) -> usize {
        let mut result: usize = 0;
        let mut bit: u128 = BITWISE::MSB_U128;
        while (bit != 0) {
            if (x & bit != 0) { result += 1; };
            bit /= 2;
        };
        result
    }
    fn sum_bytes(mut x: u128) -> u128 {
        let mut result: u128 = 0;
        loop {
            if (x == 0) { break; }
            result += (x & 0xff);
            x /= 0x100;
        };
        (result)
    }
}

pub impl BitwiseU256 of BitwiseTrait<u256> {
    #[inline(always)]
    fn bit_count() -> usize {(256)}
    #[inline(always)]
    fn byte_count() -> usize {(32)}
    #[inline(always)]
    fn max() -> u256 {(BITWISE::MAX_U256)}
    #[inline(always)]
    fn msb() -> u256 {(BITWISE::MSB_U256)}
    fn bit(n: usize) -> u256 {
        if n < 128 { (u256 { low: BitwiseU128::bit(n), high: 0x0 }) }
        else if n < 256 { (u256 { low: 0x0, high: BitwiseU128::bit(n-128) }) }
        else { (0) }
    }
    #[inline(always)]
    fn set(x: u256, n: usize) -> u256 {
        x | Self::bit(n)
    }
    #[inline(always)]
    fn unset(x: u256, n: usize) -> u256 {
        x & ~Self::bit(n)
    }
    #[inline(always)]
    fn shl(x: u256, n: usize) -> u256 {
        x * Self::bit(n)
    }
    #[inline(always)]
    fn shr(x: u256, n: usize) -> u256 {
        if (n < 256) { (x / Self::bit(n)) }
        else { (0) }
    }
    #[inline(always)]
    fn is_set(x: u256, n: usize) -> bool {
        ((Self::shr(x, n) & 1) != 0)
    }
    fn count_bits(x: u256) -> usize {
        let mut result: usize = 0;
        let mut bit: u256 = BITWISE::MSB_U256;
        while (bit != 0) {
            if (x & bit != 0) { result += 1; };
            bit /= 2;
        };
        result
    }
    fn sum_bytes(mut x: u256) -> u256 {
        let mut result: u256 = 0;
        loop {
            if (x == 0) { break; }
            result += (x & 0xff);
            x /= 0x100;
        };
        (result)
    }
}


//----------------------------------------
// Unit  tests
//
#[cfg(test)]
mod tests {
    use super::{
        BitwiseU8, BitwiseU16, BitwiseU32, BitwiseU64, BitwiseU128, BitwiseU256,
    };

    const HALF_U8: u8 = 0x55;
    const HALF_U16: u16 = 0x5555;
    const HALF_U32: u32 = 0x55555555;
    const HALF_U64: u64 = 0x5555555555555555;
    const HALF_U128: u128 = 0x55555555555555555555555555555555;
    const HALF_U256: u256 = 0x5555555555555555555555555555555555555555555555555555555555555555;


    #[test]
    fn test_bit() {
        let mut bit: u256 = 0x1;
        let mut n: usize = 0;
        loop {
            if n < 8 {
                assert_eq!(BitwiseU8::bit(n), bit.try_into().unwrap(), "test_bit_8_8");
                assert_eq!(BitwiseU16::bit(n), bit.try_into().unwrap(), "test_bit_8_16");
                assert_eq!(BitwiseU32::bit(n), bit.try_into().unwrap(), "test_bit_8_32");
                assert_eq!(BitwiseU64::bit(n), bit.try_into().unwrap(), "test_bit_8_64");
                assert_eq!(BitwiseU128::bit(n), bit.try_into().unwrap(), "test_bit_8_128");
                assert_eq!(BitwiseU256::bit(n), bit, "test_bit_8_256");
            } else if n < 16 {
                assert_eq!(BitwiseU8::bit(n), 0x0, "test_bit_16_8");
                assert_eq!(BitwiseU16::bit(n), bit.try_into().unwrap(), "test_bit_16_16");
                assert_eq!(BitwiseU32::bit(n), bit.try_into().unwrap(), "test_bit_16_32");
                assert_eq!(BitwiseU64::bit(n), bit.try_into().unwrap(), "test_bit_16_64");
                assert_eq!(BitwiseU128::bit(n), bit.try_into().unwrap(), "test_bit_16_128");
                assert_eq!(BitwiseU256::bit(n), bit, "test_bit_16_256");
            } else if n < 32 {
                assert_eq!(BitwiseU16::bit(n), 0x0, "test_bit_32_16");
                assert_eq!(BitwiseU32::bit(n), bit.try_into().unwrap(), "test_bit_16_32");
                assert_eq!(BitwiseU64::bit(n), bit.try_into().unwrap(), "test_bit_16_64");
                assert_eq!(BitwiseU128::bit(n), bit.try_into().unwrap(), "test_bit_16_128");
                assert_eq!(BitwiseU256::bit(n), bit, "test_bit_16_256");
            } else if n < 64 {
                assert_eq!(BitwiseU32::bit(n), 0x0, "test_bit_64_32");
                assert_eq!(BitwiseU64::bit(n), bit.try_into().unwrap(), "test_bit_64_64");
                assert_eq!(BitwiseU128::bit(n), bit.try_into().unwrap(), "test_bit_64_128");
                assert_eq!(BitwiseU256::bit(n), bit, "test_bit_64_256");
            } else if n < 128 {
                assert_eq!(BitwiseU64::bit(n), 0x0, "test_bit_128_64");
                assert_eq!(BitwiseU128::bit(n), bit.try_into().unwrap(), "test_bit_128_128");
                assert_eq!(BitwiseU256::bit(n), bit, "test_bit_128_256");
            } else {
                assert_eq!(BitwiseU128::bit(n), 0x0, "test_bit_256_128");
                assert_eq!(BitwiseU256::bit(n), bit, "test_bit_256_256");
            }
            n += 1;
            if n == 256 { break; }
            bit *= 2;
        };
    }

    #[test]
    fn test_shift_u8() {
        let mut n: usize = 0;
        loop {
            if n == 8 { break; }
            let bit = BitwiseU8::bit(n);
            assert_eq!(bit, BitwiseU8::shl(1, n), "test_shl_u8");
            assert_eq!(bit, BitwiseU8::shr(BitwiseU8::msb(), 7-n), "test_shr_u8");
            n += 1;
        };
    }

    #[test]
    fn test_shift_u16() {
        let mut n: usize = 0;
        loop {
            if n == 16 { break; }
            let bit = BitwiseU16::bit(n);
            assert_eq!(bit, BitwiseU16::shl(1, n), "test_shl_u16");
            assert_eq!(bit, BitwiseU16::shr(BitwiseU16::msb(), 15-n), "test_shr_u16");
            n += 1;
        };
    }

    #[test]
    fn test_shift_u32() {
        let mut n: usize = 0;
        loop {
            if n == 32 { break; }
            let bit = BitwiseU32::bit(n);
            assert_eq!(bit, BitwiseU32::shl(1, n), "test_shl_u32");
            assert_eq!(bit, BitwiseU32::shr(BitwiseU32::msb(), (31-n)), "test_shr_u32");
            n += 1;
        };
    }

    #[test]
    fn test_shift_u64() {
        let mut n: usize = 0;
        loop {
            if n == 64 { break; }
            let bit = BitwiseU64::bit(n);
            assert_eq!(bit, BitwiseU64::shl(1, n), "test_shl_u64");
            assert_eq!(bit, BitwiseU64::shr(BitwiseU64::msb(), (63-n)), "test_shr_u64");
            n += 1;
        };
    }

    #[test]
    fn test_shift_u128() {
        let mut n: usize = 0;
        loop {
            if n == 128 { break; }
            let bit = BitwiseU128::bit(n);
            assert_eq!(bit, BitwiseU128::shl(1, n), "test_shl_u128");
            assert_eq!(bit, BitwiseU128::shr(BitwiseU128::msb(), (127-n)), "test_shr_u128");
            n += 1;
        };
    }

    #[test]
    fn test_shift_u256() {
        let mut n: usize = 0;
        loop {
            if n == 256 { break; }
            let bit = BitwiseU256::bit(n);
            assert_eq!(bit, BitwiseU256::shl(1, n), "test_shl_u256");
            assert_eq!(bit, BitwiseU256::shr(BitwiseU256::msb(), (255-n)), "test_shr_u256");
            n += 1;
        };
    }


    #[test]
    fn test_set_u8() {
        let ok: u8 = HALF_U8;
        let mut bitmap: u8 = ok;
        let mut n: usize = 0;
        loop {
            if n == 8 { break; }
            let shouldBeSet: bool = (n % 2) == 0;
            assert_eq!(BitwiseU8::is_set(bitmap, n), shouldBeSet, "u8_shouldBeSet_1");
            if(shouldBeSet) { bitmap = BitwiseU8::unset(bitmap, n); }
            else { bitmap = BitwiseU8::set(bitmap, n); }
            assert_eq!(BitwiseU8::is_set(bitmap, n), !shouldBeSet, "u8_!shouldBeSet_1");
            n += 1;
        };
        assert_eq!(bitmap, ~ok, "~ok");
        n = 0;
        loop {
            if n == 8 { break; }
            let shouldBeSet: bool = (n % 2) == 1;
            assert_eq!(BitwiseU8::is_set(bitmap, n), shouldBeSet, "u8_shouldBeSet_2");
            if(shouldBeSet) { bitmap = BitwiseU8::unset(bitmap, n); }
            else { bitmap = BitwiseU8::set(bitmap, n); }
            assert_eq!(BitwiseU8::is_set(bitmap, n), !shouldBeSet, "u8_!shouldBeSet_2");
            n += 1;
        };
        assert_eq!(bitmap, ok, "ok");
    }

    #[test]
    fn test_set_u16() {
        let ok: u16 = HALF_U16;
        let mut bitmap: u16 = ok;
        let mut n: usize = 0;
        loop {
            if n == 16 { break; }
            let shouldBeSet: bool = (n % 2) == 0;
            assert_eq!(BitwiseU16::is_set(bitmap, n), shouldBeSet, "u16_shouldBeSet_1");
            if(shouldBeSet) { bitmap = BitwiseU16::unset(bitmap, n); }
            else { bitmap = BitwiseU16::set(bitmap, n); }
            assert_eq!(BitwiseU16::is_set(bitmap, n), !shouldBeSet, "u16_!shouldBeSet_1");
            n += 1;
        };
        assert_eq!(bitmap, ~ok, "~ok");
        n = 0;
        loop {
            if n == 16 { break; }
            let shouldBeSet: bool = (n % 2) == 1;
            assert_eq!(BitwiseU16::is_set(bitmap, n), shouldBeSet, "u16_shouldBeSet_2");
            if(shouldBeSet) { bitmap = BitwiseU16::unset(bitmap, n); }
            else { bitmap = BitwiseU16::set(bitmap, n); }
            assert_eq!(BitwiseU16::is_set(bitmap, n), !shouldBeSet, "u16_!shouldBeSet_2");
            n += 1;
        };
        assert_eq!(bitmap, ok, "ok");
    }

    #[test]
    fn test_set_u32() {
        let ok: u32 = HALF_U32;
        let mut bitmap: u32 = ok;
        let mut n: usize = 0;
        loop {
            if n == 32 { break; }
            let shouldBeSet: bool = (n % 2) == 0;
            assert_eq!(BitwiseU32::is_set(bitmap, n), shouldBeSet, "u32_shouldBeSet_1");
            if(shouldBeSet) { bitmap = BitwiseU32::unset(bitmap, n); }
            else { bitmap = BitwiseU32::set(bitmap, n); }
            assert_eq!(BitwiseU32::is_set(bitmap, n), !shouldBeSet, "u32_!shouldBeSet_1");
            n += 1;
        };
        assert_eq!(bitmap, ~ok, "~ok");
        n = 0;
        loop {
            if n == 32 { break; }
            let shouldBeSet: bool = (n % 2) == 1;
            assert_eq!(BitwiseU32::is_set(bitmap, n), shouldBeSet, "u32_shouldBeSet_2");
            if(shouldBeSet) { bitmap = BitwiseU32::unset(bitmap, n); }
            else { bitmap = BitwiseU32::set(bitmap, n); }
            assert_eq!(BitwiseU32::is_set(bitmap, n), !shouldBeSet, "u32_!shouldBeSet_2");
            n += 1;
        };
        assert_eq!(bitmap, ok, "ok");
    }

    #[test]
    fn test_set_u64() {
        let ok: u64 = HALF_U64;
        let mut bitmap: u64 = ok;
        let mut n: usize = 0;
        loop {
            if n == 64 { break; }
            let shouldBeSet: bool = (n % 2) == 0;
            assert_eq!(BitwiseU64::is_set(bitmap, n), shouldBeSet, "u64_shouldBeSet_1");
            if(shouldBeSet) { bitmap = BitwiseU64::unset(bitmap, n); }
            else { bitmap = BitwiseU64::set(bitmap, n); }
            assert_eq!(BitwiseU64::is_set(bitmap, n), !shouldBeSet, "u64_!shouldBeSet_1");
            n += 1;
        };
        assert_eq!(bitmap, ~ok, "~ok");
        n = 0;
        loop {
            if n == 64 { break; }
            let shouldBeSet: bool = (n % 2) == 1;
            assert_eq!(BitwiseU64::is_set(bitmap, n), shouldBeSet, "u64_shouldBeSet_2");
            if(shouldBeSet) { bitmap = BitwiseU64::unset(bitmap, n); }
            else { bitmap = BitwiseU64::set(bitmap, n); }
            assert_eq!(BitwiseU64::is_set(bitmap, n), !shouldBeSet, "u64_!shouldBeSet_2");
            n += 1;
        };
        assert_eq!(bitmap, ok, "ok");
    }

    #[test]
    fn test_set_u128() {
        let ok: u128 = HALF_U128;
        let mut bitmap: u128 = ok;
        let mut n: usize = 0;
        loop {
            if n == 128 { break; }
            let shouldBeSet: bool = (n % 2) == 0;
            assert_eq!(BitwiseU128::is_set(bitmap, n), shouldBeSet, "u128_shouldBeSet_1");
            if(shouldBeSet) { bitmap = BitwiseU128::unset(bitmap, n); }
            else { bitmap = BitwiseU128::set(bitmap, n); }
            assert_eq!(BitwiseU128::is_set(bitmap, n), !shouldBeSet, "u128_!shouldBeSet_1");
            n += 1;
        };
        assert_eq!(bitmap, ~ok, "~ok");
        n = 0;
        loop {
            if n == 128 { break; }
            let shouldBeSet: bool = (n % 2) == 1;
            assert_eq!(BitwiseU128::is_set(bitmap, n), shouldBeSet, "u128_shouldBeSet_2");
            if(shouldBeSet) { bitmap = BitwiseU128::unset(bitmap, n); }
            else { bitmap = BitwiseU128::set(bitmap, n); }
            assert_eq!(BitwiseU128::is_set(bitmap, n), !shouldBeSet, "u128_!shouldBeSet_2");
            n += 1;
        };
        assert_eq!(bitmap, ok, "ok");
    }

    #[test]
    fn test_set_u256() {
        let ok: u256 = HALF_U256;
        let mut bitmap: u256 = ok;
        let mut n: usize = 0;
        loop {
            if n == 256 { break; }
            let shouldBeSet: bool = (n % 2) == 0;
            assert_eq!(BitwiseU256::is_set(bitmap, n), shouldBeSet, "u256_shouldBeSet_1");
            if(shouldBeSet) { bitmap = BitwiseU256::unset(bitmap, n); }
            else { bitmap = BitwiseU256::set(bitmap, n); }
            assert_eq!(BitwiseU256::is_set(bitmap, n), !shouldBeSet, "u256_!shouldBeSet_1");
            n += 1;
        };
        assert_eq!(bitmap, ~ok, "~ok");
        n = 0;
        loop {
            if n == 256 { break; }
            let shouldBeSet: bool = (n % 2) == 1;
            assert_eq!(BitwiseU256::is_set(bitmap, n), shouldBeSet, "u256_shouldBeSet_2");
            if(shouldBeSet) { bitmap = BitwiseU256::unset(bitmap, n); }
            else { bitmap = BitwiseU256::set(bitmap, n); }
            assert_eq!(BitwiseU256::is_set(bitmap, n), !shouldBeSet, "u256_!shouldBeSet_2");
            n += 1;
        };
        assert_eq!(bitmap, ok, "ok");
    }


    #[test]
    fn test_count_u8() {
        let full: u8 = BitwiseU8::max();
        let half: u8 = HALF_U8;
        assert_eq!(BitwiseU8::count_bits(0x0), 0, "u8_count_0x0");
        assert_eq!(BitwiseU8::count_bits(full), 8, "u8_count_full");
        assert_eq!(BitwiseU8::count_bits(half), (8 / 2), "u8_count_half");
    }

    #[test]
    fn test_count_u16() {
        let full: u16 = BitwiseU16::max();
        let half: u16 = HALF_U16;
        assert_eq!(BitwiseU16::count_bits(0x0), 0, "u16_count_0x0");
        assert_eq!(BitwiseU16::count_bits(full), 16, "u16_count_full");
        assert_eq!(BitwiseU16::count_bits(half), (16 / 2), "u16_count_half");
    }

    #[test]
    fn test_count_u32() {
        let full: u32 = BitwiseU32::max();
        let half: u32 = HALF_U32;
        assert_eq!(BitwiseU32::count_bits(0x0), 0, "u32_count_0x0");
        assert_eq!(BitwiseU32::count_bits(full), 32, "u32_count_full");
        assert_eq!(BitwiseU32::count_bits(half), (32 / 2), "u32_count_half");
    }

    #[test]
    fn test_count_u64() {
        let full: u64 = BitwiseU64::max();
        let half: u64 = HALF_U64;
        assert_eq!(BitwiseU64::count_bits(0x0), 0, "u64_count_0x0");
        assert_eq!(BitwiseU64::count_bits(full), 64, "u64_count_full");
        assert_eq!(BitwiseU64::count_bits(half), (64 / 2), "u64_count_half");
    }

    #[test]
    fn test_count_u128() {
        let full: u128 = BitwiseU128::max();
        let half: u128 = HALF_U128;
        assert_eq!(BitwiseU128::count_bits(0x0), 0, "u128_count_0x0");
        assert_eq!(BitwiseU128::count_bits(full), 128, "u128_count_full");
        assert_eq!(BitwiseU128::count_bits(half), (128 / 2), "u128_count_half");
    }

    #[test]
    fn test_count_u256() {
        let full: u256 = BitwiseU256::max();
        let half: u256 = HALF_U256;
        assert_eq!(BitwiseU256::count_bits(0x0), 0, "u256_count_0x0");
        assert_eq!(BitwiseU256::count_bits(full), 256, "u256_count_full");
        assert_eq!(BitwiseU256::count_bits(half), (256 / 2), "u256_count_half");
    }

    #[test]
    fn test_sum_bytes() {
        let full: u256 = BitwiseU256::max();
        assert_eq!(BitwiseU256::sum_bytes(full), 0xff * 32, "u256_full");
        assert_eq!(BitwiseU64::sum_bytes(0x0101010101010101), 8, "u64_8");
        assert_eq!(BitwiseU64::sum_bytes(0x1010101010101010), 16 * 8, "u64_16");
        assert_eq!(BitwiseU64::sum_bytes(0x0000000000000001), 1, "u64_1_a");
        assert_eq!(BitwiseU64::sum_bytes(0x0100000000000000), 1, "u64_1_b");
    }
}
