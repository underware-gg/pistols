
pub trait BytemapTrait<T> {
    fn byte_count() -> usize;
    fn sum_bytes(self: T) -> T;
    fn get_byte(self: T, i: usize) -> T;
    fn set_byte(self: T, i: usize, v: T) -> T;
    fn byte_mask(i: usize) -> T;
    fn byte_shift(i: usize) -> T;
}

pub impl BytemapU8 of BytemapTrait<u8> {
    #[inline(always)]
    fn byte_count() -> usize {(1)}
    fn sum_bytes(self: u8) -> u8 {(self)}
    fn get_byte(self: u8, i: usize) -> u8 {
        if (i == 0) {(self)}
        else {(0)}
    }
    fn set_byte(self: u8, i: usize, v: u8) -> u8 {
        if (i == 0) {(v)}
       else {(self)}
    }
    fn byte_mask(i: usize) -> u8 {
        (match i {
            0 => {0xff},
            _ => {0x0},
        })
    }
    fn byte_shift(i: usize) -> u8 {
        (match i {
            0 => {0x1},
            _ => {0x1},
        })
    }
}

pub impl BytemapU16 of BytemapTrait<u16> {
    #[inline(always)]
    fn byte_count() -> usize {(2)}
    fn sum_bytes(mut self: u16) -> u16 {
        let mut result: u16 = 0;
        loop {
            if (self == 0) { break; }
            result += (self & 0xff);
            self /= 0x100;
        };
        (result)
    }
    fn get_byte(self: u16, i: usize) -> u16 {
        if (i < Self::byte_count()) {((self / Self::byte_shift(i)) & 0xff)}
        else {(0)}
    }
    fn set_byte(self: u16, i: usize, v: u16) -> u16 {
        (self & ~Self::byte_mask(i)) | (v * Self::byte_shift(i))
    }
    fn byte_mask(i: usize) -> u16 {
        (match i {
            0 => {0xff},
            1 => {0xff00},
            _ => {0x0},
        })
    }
    fn byte_shift(i: usize) -> u16 {
        (match i {
            0 => {0x1},
            1 => {0x100},
            _ => {0x1},
        })
    }
}

pub impl BytemapU32 of BytemapTrait<u32> {
    #[inline(always)]
    fn byte_count() -> usize {(4)}
    fn sum_bytes(mut self: u32) -> u32 {
        let mut result: u32 = 0;
        loop {
            if (self == 0) { break; }
            result += (self & 0xff);
            self /= 0x100;
        };
        (result)
    }
    fn get_byte(self: u32, i: usize) -> u32 {
        if (i < Self::byte_count()) {((self / Self::byte_shift(i)) & 0xff)}
        else {(0)}
    }
    fn set_byte(self: u32, i: usize, v: u32) -> u32 {
        (self & ~Self::byte_mask(i)) | (v * Self::byte_shift(i))
    }
    fn byte_mask(i: usize) -> u32 {
        (match i {
            0 => {0xff},
            1 => {0xff00},
            2 => {0xff0000},
            3 => {0xff000000},
            _ => {0x0},
        })
    }
    fn byte_shift(i: usize) -> u32 {
        (match i {
            0 => {0x1},
            1 => {0x100},
            2 => {0x10000},
            3 => {0x1000000},
            _ => {0x1},
        })
    }
}

pub impl BytemapU64 of BytemapTrait<u64> {
    #[inline(always)]
    fn byte_count() -> usize {(8)}
    fn sum_bytes(mut self: u64) -> u64 {
        let mut result: u64 = 0;
        loop {
            if (self == 0) { break; }
            result += (self & 0xff);
            self /= 0x100;
        };
        (result)
    }
    fn get_byte(self: u64, i: usize) -> u64 {
        if (i < Self::byte_count()) {((self / Self::byte_shift(i)) & 0xff)}
        else {(0)}
    }
    fn set_byte(self: u64, i: usize, v: u64) -> u64 {
        (self & ~Self::byte_mask(i)) | (v * Self::byte_shift(i))
    }
    fn byte_mask(i: usize) -> u64 {
        (match i {
            0 => {0xff},
            1 => {0xff00},
            2 => {0xff0000},
            3 => {0xff000000},
            4 => {0xff00000000},
            5 => {0xff0000000000},
            6 => {0xff000000000000},
            7 => {0xff00000000000000},
            _ => {0x0},
        })
    }
    fn byte_shift(i: usize) -> u64 {
        (match i {
            0 => {0x1},
            1 => {0x100},
            2 => {0x10000},
            3 => {0x1000000},
            4 => {0x100000000},
            5 => {0x10000000000},
            6 => {0x1000000000000},
            7 => {0x100000000000000},
            _ => {0x1},
        })
    }
}

pub impl BytemapU128 of BytemapTrait<u128> {
    #[inline(always)]
    fn byte_count() -> usize {(16)}
    fn sum_bytes(mut self: u128) -> u128 {
        let mut result: u128 = 0;
        loop {
            if (self == 0) { break; }
            result += (self & 0xff);
            self /= 0x100;
        };
        (result)
    }
    fn get_byte(self: u128, i: usize) -> u128 {
        if (i < Self::byte_count()) {((self / Self::byte_shift(i)) & 0xff)}
        else {(0)}
    }
    fn set_byte(self: u128, i: usize, v: u128) -> u128 {
        (self & ~Self::byte_mask(i)) | (v * Self::byte_shift(i))
    }
    fn byte_mask(i: usize) -> u128 {
        (match i {
            0  => {0xff},
            1  => {0xff00},
            2  => {0xff0000},
            3  => {0xff000000},
            4  => {0xff00000000},
            5  => {0xff0000000000},
            6  => {0xff000000000000},
            7  => {0xff00000000000000},
            8  => {0xff0000000000000000},
            9  => {0xff000000000000000000},
            10 => {0xff00000000000000000000},
            11 => {0xff0000000000000000000000},
            12 => {0xff000000000000000000000000},
            13 => {0xff00000000000000000000000000},
            14 => {0xff0000000000000000000000000000},
            15 => {0xff000000000000000000000000000000},
            _ =>  {0x0},
        })
    }
    fn byte_shift(i: usize) -> u128 {
        (match i {
            0  => {0x1},
            1  => {0x100},
            2  => {0x10000},
            3  => {0x1000000},
            4  => {0x100000000},
            5  => {0x10000000000},
            6  => {0x1000000000000},
            7  => {0x100000000000000},
            8  => {0x10000000000000000},
            9  => {0x1000000000000000000},
            10 => {0x100000000000000000000},
            11 => {0x10000000000000000000000},
            12 => {0x1000000000000000000000000},
            13 => {0x100000000000000000000000000},
            14 => {0x10000000000000000000000000000},
            15 => {0x1000000000000000000000000000000},
            _ =>  {0x1},
        })
    }
}

pub impl BytemapU256 of BytemapTrait<u256> {
    #[inline(always)]
    fn byte_count() -> usize {(32)}
    fn sum_bytes(mut self: u256) -> u256 {
        let mut result: u256 = 0;
        loop {
            if (self == 0) { break; }
            result += (self & 0xff);
            self /= 0x100;
        };
        (result)
    }
    fn get_byte(self: u256, i: usize) -> u256 {
        if (i < Self::byte_count()) {((self / Self::byte_shift(i)) & 0xff)}
        else {(0)}
    }
    fn set_byte(self: u256, i: usize, v: u256) -> u256 {
        (self & ~Self::byte_mask(i)) | (v * Self::byte_shift(i))
    }
    fn byte_mask(i: usize) -> u256 {
        (match i {
            0  => {0xff},
            1  => {0xff00},
            2  => {0xff0000},
            3  => {0xff000000},
            4  => {0xff00000000},
            5  => {0xff0000000000},
            6  => {0xff000000000000},
            7  => {0xff00000000000000},
            8  => {0xff0000000000000000},
            9  => {0xff000000000000000000},
            10 => {0xff00000000000000000000},
            11 => {0xff0000000000000000000000},
            12 => {0xff000000000000000000000000},
            13 => {0xff00000000000000000000000000},
            14 => {0xff0000000000000000000000000000},
            15 => {0xff000000000000000000000000000000},
            16 => {0xff00000000000000000000000000000000},
            17 => {0xff0000000000000000000000000000000000},
            18 => {0xff000000000000000000000000000000000000},
            19 => {0xff00000000000000000000000000000000000000},
            20 => {0xff0000000000000000000000000000000000000000},
            21 => {0xff000000000000000000000000000000000000000000},
            22 => {0xff00000000000000000000000000000000000000000000},
            23 => {0xff0000000000000000000000000000000000000000000000},
            24 => {0xff000000000000000000000000000000000000000000000000},
            25 => {0xff00000000000000000000000000000000000000000000000000},
            26 => {0xff0000000000000000000000000000000000000000000000000000},
            27 => {0xff000000000000000000000000000000000000000000000000000000},
            28 => {0xff00000000000000000000000000000000000000000000000000000000},
            29 => {0xff0000000000000000000000000000000000000000000000000000000000},
            30 => {0xff000000000000000000000000000000000000000000000000000000000000},
            31 => {0xff00000000000000000000000000000000000000000000000000000000000000},
            _ =>  {0x0},
        })
    }
    fn byte_shift(i: usize) -> u256 {
        (match i {
            0  => {0x1},
            1  => {0x100},
            2  => {0x10000},
            3  => {0x1000000},
            4  => {0x100000000},
            5  => {0x10000000000},
            6  => {0x1000000000000},
            7  => {0x100000000000000},
            8  => {0x10000000000000000},
            9  => {0x1000000000000000000},
            10 => {0x100000000000000000000},
            11 => {0x10000000000000000000000},
            12 => {0x1000000000000000000000000},
            13 => {0x100000000000000000000000000},
            14 => {0x10000000000000000000000000000},
            15 => {0x1000000000000000000000000000000},
            16 => {0x100000000000000000000000000000000},
            17 => {0x10000000000000000000000000000000000},
            18 => {0x1000000000000000000000000000000000000},
            19 => {0x100000000000000000000000000000000000000},
            20 => {0x10000000000000000000000000000000000000000},
            21 => {0x1000000000000000000000000000000000000000000},
            22 => {0x100000000000000000000000000000000000000000000},
            23 => {0x10000000000000000000000000000000000000000000000},
            24 => {0x1000000000000000000000000000000000000000000000000},
            25 => {0x100000000000000000000000000000000000000000000000000},
            26 => {0x10000000000000000000000000000000000000000000000000000},
            27 => {0x1000000000000000000000000000000000000000000000000000000},
            28 => {0x100000000000000000000000000000000000000000000000000000000},
            29 => {0x10000000000000000000000000000000000000000000000000000000000},
            30 => {0x1000000000000000000000000000000000000000000000000000000000000},
            31 => {0x100000000000000000000000000000000000000000000000000000000000000},
            _ =>  {0x1},
        })
    }
}


//----------------------------------------
// Unit  tests
//
#[cfg(test)]
mod unit {
    use super::{
        BytemapU8, BytemapU16, BytemapU32, BytemapU64, BytemapU128, BytemapU256,
    };
    use pistols::utils::bitwise::{
        BitwiseU64, BitwiseU256,
        BITWISE,
    };

    #[test]
    fn test_sum_bytes() {
        let full: u256 = BitwiseU256::max();
        assert_eq!(BytemapU256::sum_bytes(full), 0xff * 32, "u256_full");
        assert_eq!(BytemapU64::sum_bytes(0x0101010101010101), 8, "u64_8");
        assert_eq!(BytemapU64::sum_bytes(0x1010101010101010), 16 * 8, "u64_16");
        assert_eq!(BytemapU64::sum_bytes(0x0000000000000001), 1, "u64_1_a");
        assert_eq!(BytemapU64::sum_bytes(0x0100000000000000), 1, "u64_1_b");
    }

    #[test]
    fn test_get_set_byte() {
        let value_u256: u256 = 0x201f1e1d1c1b1a191817161514131211_100f0e0d0c0b0a090807060504030201;
        let value_u128: u128 = (value_u256 & BITWISE::MAX_U128.into()).try_into().unwrap();
        let value_u64: u64 = (value_u256 & BITWISE::MAX_U64.into()).try_into().unwrap();
        let value_u32: u32 = (value_u256 & BITWISE::MAX_U32.into()).try_into().unwrap();
        let value_u16: u16 = (value_u256 & BITWISE::MAX_U16.into()).try_into().unwrap();
        let value_u8: u8 = (value_u256 & BITWISE::MAX_U8.into()).try_into().unwrap();
        let mut set_u256: u256 = 0;
        let mut set_u128: u128 = 0;
        let mut set_u64: u64 = 0;
        let mut set_u32: u32 = 0;
        let mut set_u16: u16 = 0;
        let mut set_u8: u8 = 0;
        let mut i: u8 = 0;
        while (i < 32) {
            let v: u8 = (i + 1);
            let byte_u256: u256 = BytemapU256::get_byte(value_u256, i.into());
            let byte_u128: u128 = BytemapU128::get_byte(value_u128, i.into());
            let byte_u64: u64 = BytemapU64::get_byte(value_u64, i.into());
            let byte_u32: u32 = BytemapU32::get_byte(value_u32, i.into());
            let byte_u16: u16 = BytemapU16::get_byte(value_u16, i.into());
            let byte_u8: u8 = BytemapU8::get_byte(value_u8, i.into());
            // println!("U256.get_byte({}) = {}", i, byte_u256);
            assert_eq!(byte_u256, v.into(), "U256.get_byte({})", i);
            set_u256 = BytemapU256::set_byte(set_u256, i.into(), byte_u256);
            if (i.into() < BytemapU128::byte_count()) {
                // println!("U128.get_byte({}) = {}", i, byte_u128);
                assert_eq!(byte_u128, v.into(), "U128.get_byte({})", i);
                set_u128 = BytemapU128::set_byte(set_u128, i.into(), byte_u128);
            } else {
                assert_eq!(byte_u128, 0, "U128.get_byte({})", i);
            };
            if (i.into() < BytemapU64::byte_count()) {
                // println!("U64.get_byte({}) = {}", i, byte_u64);
                assert_eq!(byte_u64, v.into(), "U64.get_byte({})", i);
                set_u64 = BytemapU64::set_byte(set_u64, i.into(), byte_u64);
            } else {
                assert_eq!(byte_u64, 0, "U64.get_byte({})", i);
            };
            if (i.into() < BytemapU32::byte_count()) {
                // println!("U32.get_byte({}) = {}", i, byte_u32);
                assert_eq!(byte_u32, v.into(), "U32.get_byte({})", i);
                set_u32 = BytemapU32::set_byte(set_u32, i.into(), byte_u32);
            } else {
                assert_eq!(byte_u32, 0, "U32.get_byte({})", i);
            };
            if (i.into() < BytemapU16::byte_count()) {
                // println!("U16.get_byte({}) = {}", i, byte_u16);
                assert_eq!(byte_u16, v.into(), "U16.get_byte({})", i);
                set_u16 = BytemapU16::set_byte(set_u16, i.into(), byte_u16);
            } else {
                assert_eq!(byte_u16, 0, "U16.get_byte({})", i);
            };
            if (i.into() < BytemapU8::byte_count()) {
                // println!("U8.get_byte({}) = {}", i, byte_u8);
                assert_eq!(byte_u8, v.into(), "U8.get_byte({})", i);
                set_u8 = BytemapU8::set_byte(set_u8, i.into(), byte_u8);
            } else {
                assert_eq!(byte_u8, 0, "U8.get_byte({})", i);
            };
            i += 1;
        };
        assert_eq!(set_u256, value_u256, "U256.set_byte");
        assert_eq!(set_u128, value_u128, "U128.set_byte");
        assert_eq!(set_u64, value_u64, "U64.set_byte");
        assert_eq!(set_u32, value_u32, "U32.set_byte");
        assert_eq!(set_u16, value_u16, "U16.set_byte");
        assert_eq!(set_u8, value_u8, "U8.set_byte");
    }
}
