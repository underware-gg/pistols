use traits::Into;

const U8_ONE_LEFT: u8     = 0x80;
const U16_ONE_LEFT: u16   = 0x8000;
const U32_ONE_LEFT: u32   = 0x80000000;
const U64_ONE_LEFT: u64   = 0x8000000000000000;
const U128_ONE_LEFT: u128 = 0x80000000000000000000000000000000;
const U256_ONE_LEFT: u256 = 0x8000000000000000000000000000000000000000000000000000000000000000;

trait Bitwise<T> {
    fn bit(n: usize) -> T;
    fn set(x: T, n: usize) -> T;
    fn unset(x: T, n: usize) -> T;
    fn shl(x: T, n: usize) -> T;
    fn shr(x: T, n: usize) -> T;
    fn is_set(x: T, n: usize) -> bool;
    fn count_bits(x: T) -> usize;
}

impl U8Bitwise of Bitwise<u8> {
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
        let mut bit: u8 = U8_ONE_LEFT;
        loop {
            if(x & bit > 0) { result += 1; };
            if(bit == 0x1) { break; }
            bit /= 2;
        };
        result
    }
}

impl U16Bitwise of Bitwise<u16> {
    fn bit(n: usize) -> u16 {
        if n < 8 { (U8Bitwise::bit(n).into()) }
        else if n < 16 { (U8Bitwise::bit(n-8).into() * 0x100) }
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
        let mut bit: u16 = U16_ONE_LEFT;
        loop {
            if(x & bit > 0) { result += 1; };
            if(bit == 0x1) { break; }
            bit /= 2;
        };
        result
    }
}

impl U32Bitwise of Bitwise<u32> {
    fn bit(n: usize) -> u32 {
        if n < 16 { (U16Bitwise::bit(n).into()) }
        else if n < 32 { (U16Bitwise::bit(n-16).into() * 0x10000) }
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
        let mut bit: u32 = U32_ONE_LEFT;
        loop {
            if(x & bit > 0) { result += 1; };
            if(bit == 0x1) { break; }
            bit /= 2;
        };
        result
    }
}

impl U64Bitwise of Bitwise<u64> {
    fn bit(n: usize) -> u64 {
        if n < 32 { (U32Bitwise::bit(n).into()) }
        else if n < 64 { (U32Bitwise::bit(n-32).into() * 0x100000000) }
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
        let mut bit: u64 = U64_ONE_LEFT;
        loop {
            if(x & bit > 0) { result += 1; };
            if(bit == 0x1) { break; }
            bit /= 2;
        };
        result
    }
}

impl U128Bitwise of Bitwise<u128> {
    fn bit(n: usize) -> u128 {
        if n < 64 { (U64Bitwise::bit(n).into()) }
        else if n < 128 { (U64Bitwise::bit(n-64).into() * 0x10000000000000000) }
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
        let mut bit: u128 = U128_ONE_LEFT;
        loop {
            if(x & bit > 0) { result += 1; };
            if(bit == 0x1) { break; }
            bit /= 2;
        };
        result
    }
}

impl U256Bitwise of Bitwise<u256> {
    fn bit(n: usize) -> u256 {
        if n < 128 { (u256 { low: U128Bitwise::bit(n), high: 0x0 }) }
        else if n < 256 { (u256 { low: 0x0, high: U128Bitwise::bit(n-128) }) }
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
        let mut bit: u256 = U256_ONE_LEFT;
        loop {
            if(x & bit > 0) { result += 1; };
            if(bit == 0x1) { break; }
            bit /= 2;
        };
        result
    }
}


//----------------------------------------
// Unit  tests
//
#[cfg(test)]
mod tests {
    use debug::PrintTrait;
    use pistols::utils::bitwise::{
        U8Bitwise, U16Bitwise, U32Bitwise, U64Bitwise, U128Bitwise, U256Bitwise,
        U8_ONE_LEFT, U16_ONE_LEFT, U32_ONE_LEFT, U64_ONE_LEFT, U128_ONE_LEFT, U256_ONE_LEFT,
    };

    #[test]
    #[available_gas(50_000_000)]
    fn test_bitwise_bit() {
        let mut bit: u256 = 0x1;
        let mut n: usize = 0;
        loop {
            if n < 8 {
                assert(U8Bitwise::bit(n) == bit.try_into().unwrap(), 'test_bit_8_8');
                assert(U16Bitwise::bit(n) == bit.try_into().unwrap(), 'test_bit_8_16');
                assert(U32Bitwise::bit(n) == bit.try_into().unwrap(), 'test_bit_8_32');
                assert(U64Bitwise::bit(n) == bit.try_into().unwrap(), 'test_bit_8_64');
                assert(U128Bitwise::bit(n) == bit.try_into().unwrap(), 'test_bit_8_128');
                assert(U256Bitwise::bit(n) == bit, 'test_bit_8_256');
            } else if n < 16 {
                assert(U8Bitwise::bit(n) == 0x0, 'test_bit_16_8');
                assert(U16Bitwise::bit(n) == bit.try_into().unwrap(), 'test_bit_16_16');
                assert(U32Bitwise::bit(n) == bit.try_into().unwrap(), 'test_bit_16_32');
                assert(U64Bitwise::bit(n) == bit.try_into().unwrap(), 'test_bit_16_64');
                assert(U128Bitwise::bit(n) == bit.try_into().unwrap(), 'test_bit_16_128');
                assert(U256Bitwise::bit(n) == bit, 'test_bit_16_256');
            } else if n < 32 {
                assert(U16Bitwise::bit(n) == 0x0, 'test_bit_32_16');
                assert(U32Bitwise::bit(n) == bit.try_into().unwrap(), 'test_bit_16_32');
                assert(U64Bitwise::bit(n) == bit.try_into().unwrap(), 'test_bit_16_64');
                assert(U128Bitwise::bit(n) == bit.try_into().unwrap(), 'test_bit_16_128');
                assert(U256Bitwise::bit(n) == bit, 'test_bit_16_256');
            } else if n < 64 {
                assert(U32Bitwise::bit(n) == 0x0, 'test_bit_64_32');
                assert(U64Bitwise::bit(n) == bit.try_into().unwrap(), 'test_bit_64_64');
                assert(U128Bitwise::bit(n) == bit.try_into().unwrap(), 'test_bit_64_128');
                assert(U256Bitwise::bit(n) == bit, 'test_bit_64_256');
            } else if n < 128 {
                assert(U64Bitwise::bit(n) == 0x0, 'test_bit_128_64');
                assert(U128Bitwise::bit(n) == bit.try_into().unwrap(), 'test_bit_128_128');
                assert(U256Bitwise::bit(n) == bit, 'test_bit_128_256');
            } else {
                assert(U128Bitwise::bit(n) == 0x0, 'test_bit_256_128');
                assert(U256Bitwise::bit(n) == bit, 'test_bit_256_256');
            }
            n += 1;
            if n == 256 { break; }
            bit *= 2;
        };
    }

    #[test]
    #[available_gas(300_000)]
    fn test_bitwise_shift_u8() {
        let mut n: usize = 0;
        loop {
            if n == 8 { break; }
            let bit = U8Bitwise::bit(n);
            assert(bit == U8Bitwise::shl(1, n), 'test_shl_u8');
            assert(bit == U8Bitwise::shr(U8_ONE_LEFT, 7-n), 'test_shr_u8');
            n += 1;
        };
    }

    #[test]
    #[available_gas(1_000_000)]
    fn test_bitwise_shift_u16() {
        let mut n: usize = 0;
        loop {
            if n == 16 { break; }
            let bit = U16Bitwise::bit(n);
            assert(bit == U16Bitwise::shl(1, n), 'test_shl_u16');
            assert(bit == U16Bitwise::shr(U16_ONE_LEFT, 15-n), 'test_shr_u16');
            n += 1;
        };
    }

    #[test]
    #[available_gas(3_000_000)]
    fn test_bitwise_shift_u32() {
        let mut n: usize = 0;
        loop {
            if n == 32 { break; }
            let bit = U32Bitwise::bit(n);
            assert(bit == U32Bitwise::shl(1, n), 'test_shl_u32');
            assert(bit == U32Bitwise::shr(U32_ONE_LEFT, (31-n)), 'test_shr_u32');
            n += 1;
        };
    }

    #[test]
    #[available_gas(7_000_000)]
    fn test_bitwise_shift_u64() {
        let mut n: usize = 0;
        loop {
            if n == 64 { break; }
            let bit = U64Bitwise::bit(n);
            assert(bit == U64Bitwise::shl(1, n), 'test_shl_u64');
            assert(bit == U64Bitwise::shr(U64_ONE_LEFT, (63-n)), 'test_shr_u64');
            n += 1;
        };
    }

    #[test]
    #[available_gas(20_000_000)]
    fn test_bitwise_shift_u128() {
        let mut n: usize = 0;
        loop {
            if n == 128 { break; }
            let bit = U128Bitwise::bit(n);
            assert(bit == U128Bitwise::shl(1, n), 'test_shl_u128');
            assert(bit == U128Bitwise::shr(U128_ONE_LEFT, (127-n)), 'test_shr_u128');
            n += 1;
        };
    }

    #[test]
    #[available_gas(50_000_000)]
    fn test_bitwise_shift_u256() {
        let mut n: usize = 0;
        loop {
            if n == 256 { break; }
            let bit = U256Bitwise::bit(n);
            assert(bit == U256Bitwise::shl(1, n), 'test_shl_u256');
            assert(bit == U256Bitwise::shr(U256_ONE_LEFT, (255-n)), 'test_shr_u256');
            n += 1;
        };
    }


    #[test]
    #[available_gas(1_000_000)]
    fn test_bitwise_set_u8() {
        let ok: u8 = 0x55;
        let mut bitmap: u8 = ok;
        let mut n: usize = 0;
        loop {
            if n == 8 { break; }
            //-----
            let shouldBeSet: bool = (n % 2) == 0;
            assert(U8Bitwise::is_set(bitmap, n) == shouldBeSet, 'u8_shouldBeSet_1');
            if(shouldBeSet) { bitmap = U8Bitwise::unset(bitmap, n); }
            else { bitmap = U8Bitwise::set(bitmap, n); }
            assert(U8Bitwise::is_set(bitmap, n) == !shouldBeSet, 'u8_!shouldBeSet_1');
            //-----
            n += 1;
        };
        assert(bitmap == ~ok, '~ok');
        n = 0;
        loop {
            if n == 8 { break; }
            //-----
            let shouldBeSet: bool = (n % 2) == 1;
            assert(U8Bitwise::is_set(bitmap, n) == shouldBeSet, 'u8_shouldBeSet_2');
            if(shouldBeSet) { bitmap = U8Bitwise::unset(bitmap, n); }
            else { bitmap = U8Bitwise::set(bitmap, n); }
            assert(U8Bitwise::is_set(bitmap, n) == !shouldBeSet, 'u8_!shouldBeSet_2');
            //-----
            n += 1;
        };
        assert(bitmap == ok, 'ok');
    }

    #[test]
    #[available_gas(10_000_000)]
    fn test_bitwise_set_u16() {
        let ok: u16 = 0x5555;
        let mut bitmap: u16 = ok;
        let mut n: usize = 0;
        loop {
            if n == 16 { break; }
            //-----
            let shouldBeSet: bool = (n % 2) == 0;
            assert(U16Bitwise::is_set(bitmap, n) == shouldBeSet, 'u16_shouldBeSet_1');
            if(shouldBeSet) { bitmap = U16Bitwise::unset(bitmap, n); }
            else { bitmap = U16Bitwise::set(bitmap, n); }
            assert(U16Bitwise::is_set(bitmap, n) == !shouldBeSet, 'u16_!shouldBeSet_1');
            //-----
            n += 1;
        };
        assert(bitmap == ~ok, '~ok');
        n = 0;
        loop {
            if n == 16 { break; }
            //-----
            let shouldBeSet: bool = (n % 2) == 1;
            assert(U16Bitwise::is_set(bitmap, n) == shouldBeSet, 'u16_shouldBeSet_2');
            if(shouldBeSet) { bitmap = U16Bitwise::unset(bitmap, n); }
            else { bitmap = U16Bitwise::set(bitmap, n); }
            assert(U16Bitwise::is_set(bitmap, n) == !shouldBeSet, 'u16_!shouldBeSet_2');
            //-----
            n += 1;
        };
        assert(bitmap == ok, 'ok');
    }

    #[test]
    #[available_gas(100_000_000)]
    fn test_bitwise_set_u32() {
        let ok: u32 = 0x55555555;
        let mut bitmap: u32 = ok;
        let mut n: usize = 0;
        loop {
            if n == 32 { break; }
            //-----
            let shouldBeSet: bool = (n % 2) == 0;
            assert(U32Bitwise::is_set(bitmap, n) == shouldBeSet, 'u32_shouldBeSet_1');
            if(shouldBeSet) { bitmap = U32Bitwise::unset(bitmap, n); }
            else { bitmap = U32Bitwise::set(bitmap, n); }
            assert(U32Bitwise::is_set(bitmap, n) == !shouldBeSet, 'u32_!shouldBeSet_1');
            //-----
            n += 1;
        };
        assert(bitmap == ~ok, '~ok');
        n = 0;
        loop {
            if n == 32 { break; }
            //-----
            let shouldBeSet: bool = (n % 2) == 1;
            assert(U32Bitwise::is_set(bitmap, n) == shouldBeSet, 'u32_shouldBeSet_2');
            if(shouldBeSet) { bitmap = U32Bitwise::unset(bitmap, n); }
            else { bitmap = U32Bitwise::set(bitmap, n); }
            assert(U32Bitwise::is_set(bitmap, n) == !shouldBeSet, 'u32_!shouldBeSet_2');
            //-----
            n += 1;
        };
        assert(bitmap == ok, 'ok');
    }

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_bitwise_set_u64() {
        let ok: u64 = 0x5555555555555555;
        let mut bitmap: u64 = ok;
        let mut n: usize = 0;
        loop {
            if n == 64 { break; }
            //-----
            let shouldBeSet: bool = (n % 2) == 0;
            assert(U64Bitwise::is_set(bitmap, n) == shouldBeSet, 'u64_shouldBeSet_1');
            if(shouldBeSet) { bitmap = U64Bitwise::unset(bitmap, n); }
            else { bitmap = U64Bitwise::set(bitmap, n); }
            assert(U64Bitwise::is_set(bitmap, n) == !shouldBeSet, 'u64_!shouldBeSet_1');
            //-----
            n += 1;
        };
        assert(bitmap == ~ok, '~ok');
        n = 0;
        loop {
            if n == 64 { break; }
            //-----
            let shouldBeSet: bool = (n % 2) == 1;
            assert(U64Bitwise::is_set(bitmap, n) == shouldBeSet, 'u64_shouldBeSet_2');
            if(shouldBeSet) { bitmap = U64Bitwise::unset(bitmap, n); }
            else { bitmap = U64Bitwise::set(bitmap, n); }
            assert(U64Bitwise::is_set(bitmap, n) == !shouldBeSet, 'u64_!shouldBeSet_2');
            //-----
            n += 1;
        };
        assert(bitmap == ok, 'ok');
    }

    #[test]
    #[available_gas(10_000_000_000)]
    fn test_bitwise_set_u128() {
        let ok: u128 = 0x55555555555555555555555555555555;
        let mut bitmap: u128 = ok;
        let mut n: usize = 0;
        loop {
            if n == 128 { break; }
            //-----
            let shouldBeSet: bool = (n % 2) == 0;
            assert(U128Bitwise::is_set(bitmap, n) == shouldBeSet, 'u128_shouldBeSet_1');
            if(shouldBeSet) { bitmap = U128Bitwise::unset(bitmap, n); }
            else { bitmap = U128Bitwise::set(bitmap, n); }
            assert(U128Bitwise::is_set(bitmap, n) == !shouldBeSet, 'u128_!shouldBeSet_1');
            //-----
            n += 1;
        };
        assert(bitmap == ~ok, '~ok');
        n = 0;
        loop {
            if n == 128 { break; }
            //-----
            let shouldBeSet: bool = (n % 2) == 1;
            assert(U128Bitwise::is_set(bitmap, n) == shouldBeSet, 'u128_shouldBeSet_2');
            if(shouldBeSet) { bitmap = U128Bitwise::unset(bitmap, n); }
            else { bitmap = U128Bitwise::set(bitmap, n); }
            assert(U128Bitwise::is_set(bitmap, n) == !shouldBeSet, 'u128_!shouldBeSet_2');
            //-----
            n += 1;
        };
        assert(bitmap == ok, 'ok');
    }

    #[test]
    #[available_gas(100_000_000_000)]
    fn test_bitwise_set_u256() {
        let ok: u256 = 0x5555555555555555555555555555555555555555555555555555555555555555;
        let mut bitmap: u256 = ok;
        let mut n: usize = 0;
        loop {
            if n == 256 { break; }
            //-----
            let shouldBeSet: bool = (n % 2) == 0;
            assert(U256Bitwise::is_set(bitmap, n) == shouldBeSet, 'u256_shouldBeSet_1');
            if(shouldBeSet) { bitmap = U256Bitwise::unset(bitmap, n); }
            else { bitmap = U256Bitwise::set(bitmap, n); }
            assert(U256Bitwise::is_set(bitmap, n) == !shouldBeSet, 'u256_!shouldBeSet_1');
            //-----
            n += 1;
        };
        assert(bitmap == ~ok, '~ok');
        n = 0;
        loop {
            if n == 256 { break; }
            //-----
            let shouldBeSet: bool = (n % 2) == 1;
            assert(U256Bitwise::is_set(bitmap, n) == shouldBeSet, 'u256_shouldBeSet_2');
            if(shouldBeSet) { bitmap = U256Bitwise::unset(bitmap, n); }
            else { bitmap = U256Bitwise::set(bitmap, n); }
            assert(U256Bitwise::is_set(bitmap, n) == !shouldBeSet, 'u256_!shouldBeSet_2');
            //-----
            n += 1;
        };
        assert(bitmap == ok, 'ok');
    }


    #[test]
    #[available_gas(1_000_000)]
    fn test_bitwise_count_u8() {
        let full: u8 = 0xff;
        let half: u8 = 0x55;
        assert(U8Bitwise::count_bits(0x0) == 0, 'u8_count_0x0');
        assert(U8Bitwise::count_bits(full) == 8, 'u8_count_full');
        assert(U8Bitwise::count_bits(half) == (8 / 2), 'u8_count_half');
    }

    #[test]
    #[available_gas(10_000_000)]
    fn test_bitwise_count_u16() {
        let full: u16 = 0xffff;
        let half: u16 = 0x5555;
        assert(U16Bitwise::count_bits(0x0) == 0, 'u16_count_0x0');
        assert(U16Bitwise::count_bits(full) == 16, 'u16_count_full');
        assert(U16Bitwise::count_bits(half) == (16 / 2), 'u16_count_half');
    }

    #[test]
    #[available_gas(10_000_000)]
    fn test_bitwise_count_u32() {
        let full: u32 = 0xffffffff;
        let half: u32 = 0x55555555;
        assert(U32Bitwise::count_bits(0x0) == 0, 'u32_count_0x0');
        assert(U32Bitwise::count_bits(full) == 32, 'u32_count_full');
        assert(U32Bitwise::count_bits(half) == (32 / 2), 'u32_count_half');
    }

    #[test]
    #[available_gas(10_000_000)]
    fn test_bitwise_count_u64() {
        let full: u64 = 0xffffffffffffffff;
        let half: u64 = 0x5555555555555555;
        assert(U64Bitwise::count_bits(0x0) == 0, 'u64_count_0x0');
        assert(U64Bitwise::count_bits(full) == 64, 'u64_count_full');
        assert(U64Bitwise::count_bits(half) == (64 / 2), 'u64_count_half');
    }

    #[test]
    #[available_gas(100_000_000)]
    fn test_bitwise_count_u128() {
        let full: u128 = 0xffffffffffffffffffffffffffffffff;
        let half: u128 = 0x55555555555555555555555555555555;
        assert(U128Bitwise::count_bits(0x0) == 0, 'u128_count_0x0');
        assert(U128Bitwise::count_bits(full) == 128, 'u128_count_full');
        assert(U128Bitwise::count_bits(half) == (128 / 2), 'u128_count_half');
    }

    #[test]
    #[available_gas(100_000_000)]
    fn test_bitwise_count_u256() {
        let full: u256 = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;
        let half: u256 = 0x5555555555555555555555555555555555555555555555555555555555555555;
        assert(U256Bitwise::count_bits(0x0) == 0, 'u256_count_0x0');
        assert(U256Bitwise::count_bits(full) == 256, 'u256_count_full');
        assert(U256Bitwise::count_bits(half) == (256 / 2), 'u256_count_half');
    }
}
