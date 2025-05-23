
//----------------------------------------
// DibitmapTrait
//
// dibit map operations
// 1 dibit = 2 bits
//
pub trait DibitmapTrait<T> {
    fn dibit_count() -> usize;
    fn get_dibit(self: T, i: usize) -> T;
    fn set_dibit(self: T, i: usize, v: T) -> T;
    fn dibit_mask(i: usize) -> T;
    fn dibit_shift(i: usize) -> T;
}

pub impl DibitmapU8 of DibitmapTrait<u8> {
    #[inline(always)]
    fn dibit_count() -> usize {(4)}
    fn get_dibit(self: u8, i: usize) -> u8 {
        if (i < Self::dibit_count()) {((self / Self::dibit_shift(i)) & 0x3)}
        else {(0)}
    }
    fn set_dibit(self: u8, i: usize, v: u8) -> u8 {
        (self & ~Self::dibit_mask(i)) | (v * Self::dibit_shift(i))
    }
    fn dibit_mask(i: usize) -> u8 {
        (match i {
            0 => {0x3},
            1 => {0xc},
            2 => {0x30},
            3 => {0xc0},
            _ => {0x0},
        })
    }
    fn dibit_shift(i: usize) -> u8 {
        (match i {
            0 => {0x1},
            1 => {0x4},
            2 => {0x10},
            3 => {0x40},
            _ => {0x1},
        })
    }
}

pub impl DibitmapU16 of DibitmapTrait<u16> {
    #[inline(always)]
    fn dibit_count() -> usize {(8)}
    fn get_dibit(self: u16, i: usize) -> u16 {
        if (i < Self::dibit_count()) {((self / Self::dibit_shift(i)) & 0x3)}
        else {(0)}
    }
    fn set_dibit(self: u16, i: usize, v: u16) -> u16 {
        (self & ~Self::dibit_mask(i)) | (v * Self::dibit_shift(i))
    }
    fn dibit_mask(i: usize) -> u16 {
        (match i {
            0 => {0x3},
            1 => {0xc},
            2 => {0x30},
            3 => {0xc0},
            4 => {0x300},
            5 => {0xc00},
            6 => {0x3000},
            7 => {0xc000},
            _ => {0x0},
        })
    }
    fn dibit_shift(i: usize) -> u16 {
        (match i {
            0 => {0x1},
            1 => {0x4},
            2 => {0x10},
            3 => {0x40},
            4 => {0x100},
            5 => {0x400},
            6 => {0x1000},
            7 => {0x4000},
            _ => {0x1},
        })
    }
}

pub impl DibitmapU32 of DibitmapTrait<u32> {
    #[inline(always)]
    fn dibit_count() -> usize {(16)}
    fn get_dibit(self: u32, i: usize) -> u32 {
        if (i < Self::dibit_count()) {((self / Self::dibit_shift(i)) & 0x3)}
        else {(0)}
    }
    fn set_dibit(self: u32, i: usize, v: u32) -> u32 {
        (self & ~Self::dibit_mask(i)) | (v * Self::dibit_shift(i))
    }
    fn dibit_mask(i: usize) -> u32 {
        (match i {
            0  => {0x3},
            1  => {0xc},
            2  => {0x30},
            3  => {0xc0},
            4  => {0x300},
            5  => {0xc00},
            6  => {0x3000},
            7  => {0xc000},
            8  => {0x30000},
            9  => {0xc0000},
            10 => {0x300000},
            11 => {0xc00000},
            12 => {0x3000000},
            13 => {0xc000000},
            14 => {0x30000000},
            15 => {0xc0000000},
            _ =>  {0x0},
        })
    }
    fn dibit_shift(i: usize) -> u32 {
        (match i {
            0  => {0x1},
            1  => {0x4},
            2  => {0x10},
            3  => {0x40},
            4  => {0x100},
            5  => {0x400},
            6  => {0x1000},
            7  => {0x4000},
            8  => {0x10000},
            9  => {0x40000},
            10 => {0x100000},
            11 => {0x400000},
            12 => {0x1000000},
            13 => {0x4000000},
            14 => {0x10000000},
            15 => {0x40000000},
            _ =>  {0x1},
        })
    }
}

pub impl DibitmapU64 of DibitmapTrait<u64> {
    #[inline(always)]
    fn dibit_count() -> usize {(32)}
    fn get_dibit(self: u64, i: usize) -> u64 {
        if (i < Self::dibit_count()) {((self / Self::dibit_shift(i)) & 0x3)}
        else {(0)}
    }
    fn set_dibit(self: u64, i: usize, v: u64) -> u64 {
        (self & ~Self::dibit_mask(i)) | (v * Self::dibit_shift(i))
    }
    fn dibit_mask(i: usize) -> u64 {
        (match i {
            0  => {0x3},
            1  => {0xc},
            2  => {0x30},
            3  => {0xc0},
            4  => {0x300},
            5  => {0xc00},
            6  => {0x3000},
            7  => {0xc000},
            8  => {0x30000},
            9  => {0xc0000},
            10 => {0x300000},
            11 => {0xc00000},
            12 => {0x3000000},
            13 => {0xc000000},
            14 => {0x30000000},
            15 => {0xc0000000},
            16 => {0x300000000},
            17 => {0xc00000000},
            18 => {0x3000000000},
            19 => {0xc000000000},
            20 => {0x30000000000},
            21 => {0xc0000000000},
            22 => {0x300000000000},
            23 => {0xc00000000000},
            24 => {0x3000000000000},
            25 => {0xc000000000000},
            26 => {0x30000000000000},
            27 => {0xc0000000000000},
            28 => {0x300000000000000},
            29 => {0xc00000000000000},
            30 => {0x3000000000000000},
            31 => {0xc000000000000000},
            _ =>  {0x0},
        })
    }
    fn dibit_shift(i: usize) -> u64 {
        (match i {
            0  => {0x1},
            1  => {0x4},
            2  => {0x10},
            3  => {0x40},
            4  => {0x100},
            5  => {0x400},
            6  => {0x1000},
            7  => {0x4000},
            8  => {0x10000},
            9  => {0x40000},
            10 => {0x100000},
            11 => {0x400000},
            12 => {0x1000000},
            13 => {0x4000000},
            14 => {0x10000000},
            15 => {0x40000000},
            16 => {0x100000000},
            17 => {0x400000000},
            18 => {0x1000000000},
            19 => {0x4000000000},
            20 => {0x10000000000},
            21 => {0x40000000000},
            22 => {0x100000000000},
            23 => {0x400000000000},
            24 => {0x1000000000000},
            25 => {0x4000000000000},
            26 => {0x10000000000000},
            27 => {0x40000000000000},
            28 => {0x100000000000000},
            29 => {0x400000000000000},
            30 => {0x1000000000000000},
            31 => {0x4000000000000000},
            _ =>  {0x1},
        })
    }
}




//----------------------------------------
// NibblemapTrait
//
// nibble map operations
// 1 nibble = 4 bits
//
pub trait NibblemapTrait<T> {
    fn nibble_count() -> usize;
    fn get_nibble(self: T, i: usize) -> T;
    fn set_nibble(self: T, i: usize, v: T) -> T;
    fn nibble_mask(i: usize) -> T;
    fn nibble_shift(i: usize) -> T;
}

pub impl NibblemapU8 of NibblemapTrait<u8> {
    #[inline(always)]
    fn nibble_count() -> usize {(2)}
    fn get_nibble(self: u8, i: usize) -> u8 {
        if (i < Self::nibble_count()) {((self / Self::nibble_shift(i)) & 0xf)}
        else {(0)}
    }
    fn set_nibble(self: u8, i: usize, v: u8) -> u8 {
        (self & ~Self::nibble_mask(i)) | (v * Self::nibble_shift(i))
    }
    fn nibble_mask(i: usize) -> u8 {
        (match i {
            0 => {0xf},
            1 => {0xf0},
            _ => {0x0},
        })
    }
    fn nibble_shift(i: usize) -> u8 {
        (match i {
            0 => {0x1},
            1 => {0x10},
            _ => {0x1},
        })
    }
}

pub impl NibblemapU16 of NibblemapTrait<u16> {
    #[inline(always)]
    fn nibble_count() -> usize {(4)}
    fn get_nibble(self: u16, i: usize) -> u16 {
        if (i < Self::nibble_count()) {((self / Self::nibble_shift(i)) & 0xf)}
        else {(0)}
    }
    fn set_nibble(self: u16, i: usize, v: u16) -> u16 {
        (self & ~Self::nibble_mask(i)) | (v * Self::nibble_shift(i))
    }
    fn nibble_mask(i: usize) -> u16 {
        (match i {
            0 => {0xf},
            1 => {0xf0},
            2 => {0xf00},
            3 => {0xf000},
            _ => {0x0},
        })
    }
    fn nibble_shift(i: usize) -> u16 {
        (match i {
            0 => {0x1},
            1 => {0x10},
            2 => {0x100},
            3 => {0x1000},
            _ => {0x1},
        })
    }
}

pub impl NibblemapU32 of NibblemapTrait<u32> {
    #[inline(always)]
    fn nibble_count() -> usize {(8)}
    fn get_nibble(self: u32, i: usize) -> u32 {
        if (i < Self::nibble_count()) {((self / Self::nibble_shift(i)) & 0xf)}
        else {(0)}
    }
    fn set_nibble(self: u32, i: usize, v: u32) -> u32 {
        (self & ~Self::nibble_mask(i)) | (v * Self::nibble_shift(i))
    }
    fn nibble_mask(i: usize) -> u32 {
        (match i {
            0 => {0xf},
            1 => {0xf0},
            2 => {0xf00},
            3 => {0xf000},
            4 => {0xf0000},
            5 => {0xf00000},
            6 => {0xf000000},
            7 => {0xf0000000},
            _ => {0x0},
        })
    }
    fn nibble_shift(i: usize) -> u32 {
        (match i {
            0 => {0x1},
            1 => {0x10},
            2 => {0x100},
            3 => {0x1000},
            4 => {0x10000},
            5 => {0x100000},
            6 => {0x1000000},
            7 => {0x10000000},
            _ => {0x1},
        })
    }
}

pub impl NibblemapU64 of NibblemapTrait<u64> {
    #[inline(always)]
    fn nibble_count() -> usize {(16)}
    fn get_nibble(self: u64, i: usize) -> u64 {
        if (i < Self::nibble_count()) {((self / Self::nibble_shift(i)) & 0xf)}
        else {(0)}
    }
    fn set_nibble(self: u64, i: usize, v: u64) -> u64 {
        (self & ~Self::nibble_mask(i)) | (v * Self::nibble_shift(i))
    }
    fn nibble_mask(i: usize) -> u64 {
        (match i {
            0  => {0xf},
            1  => {0xf0},
            2  => {0xf00},
            3  => {0xf000},
            4  => {0xf0000},
            5  => {0xf00000},
            6  => {0xf000000},
            7  => {0xf0000000},
            8  => {0xf00000000},
            9  => {0xf000000000},
            10 => {0xf0000000000},
            11 => {0xf00000000000},
            12 => {0xf000000000000},
            13 => {0xf0000000000000},
            14 => {0xf00000000000000},
            15 => {0xf000000000000000},
            _ =>  {0x0},
        })
    }
    fn nibble_shift(i: usize) -> u64 {
        (match i {
            0  => {0x1},
            1  => {0x10},
            2  => {0x100},
            3  => {0x1000},
            4  => {0x10000},
            5  => {0x100000},
            6  => {0x1000000},
            7  => {0x10000000},
            8  => {0x100000000},
            9  => {0x1000000000},
            10 => {0x10000000000},
            11 => {0x100000000000},
            12 => {0x1000000000000},
            13 => {0x10000000000000},
            14 => {0x100000000000000},
            15 => {0x1000000000000000},
            _ =>  {0x1},
        })
    }
}

pub impl NibblemapU128 of NibblemapTrait<u128> {
    #[inline(always)]
    fn nibble_count() -> usize {(32)}
    fn get_nibble(self: u128, i: usize) -> u128 {
        if (i < Self::nibble_count()) {((self / Self::nibble_shift(i)) & 0xf)}
        else {(0)}
    }
    fn set_nibble(self: u128, i: usize, v: u128) -> u128 {
        (self & ~Self::nibble_mask(i)) | (v * Self::nibble_shift(i))
    }
    fn nibble_mask(i: usize) -> u128 {
        (match i {
            0  => {0xf},
            1  => {0xf0},
            2  => {0xf00},
            3  => {0xf000},
            4  => {0xf0000},
            5  => {0xf00000},
            6  => {0xf000000},
            7  => {0xf0000000},
            8  => {0xf00000000},
            9  => {0xf000000000},
            10 => {0xf0000000000},
            11 => {0xf00000000000},
            12 => {0xf000000000000},
            13 => {0xf0000000000000},
            14 => {0xf00000000000000},
            15 => {0xf000000000000000},
            16 => {0xf0000000000000000},
            17 => {0xf00000000000000000},
            18 => {0xf000000000000000000},
            19 => {0xf0000000000000000000},
            20 => {0xf00000000000000000000},
            21 => {0xf000000000000000000000},
            22 => {0xf0000000000000000000000},
            23 => {0xf00000000000000000000000},
            24 => {0xf000000000000000000000000},
            25 => {0xf0000000000000000000000000},
            26 => {0xf00000000000000000000000000},
            27 => {0xf000000000000000000000000000},
            28 => {0xf0000000000000000000000000000},
            29 => {0xf00000000000000000000000000000},
            30 => {0xf000000000000000000000000000000},
            31 => {0xf0000000000000000000000000000000},
            _ =>  {0x0},
        })
    }
    fn nibble_shift(i: usize) -> u128 {
        (match i {
            0  => {0x1},
            1  => {0x10},
            2  => {0x100},
            3  => {0x1000},
            4  => {0x10000},
            5  => {0x100000},
            6  => {0x1000000},
            7  => {0x10000000},
            8  => {0x100000000},
            9  => {0x1000000000},
            10 => {0x10000000000},
            11 => {0x100000000000},
            12 => {0x1000000000000},
            13 => {0x10000000000000},
            14 => {0x100000000000000},
            15 => {0x1000000000000000},
            16 => {0x10000000000000000},
            17 => {0x100000000000000000},
            18 => {0x1000000000000000000},
            19 => {0x10000000000000000000},
            20 => {0x100000000000000000000},
            21 => {0x1000000000000000000000},
            22 => {0x10000000000000000000000},
            23 => {0x100000000000000000000000},
            24 => {0x1000000000000000000000000},
            25 => {0x10000000000000000000000000},
            26 => {0x100000000000000000000000000},
            27 => {0x1000000000000000000000000000},
            28 => {0x10000000000000000000000000000},
            29 => {0x100000000000000000000000000000},
            30 => {0x1000000000000000000000000000000},
            31 => {0x10000000000000000000000000000000},
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
        DibitmapU8, DibitmapU16, DibitmapU32, DibitmapU64,
        NibblemapU8, NibblemapU16, NibblemapU32, NibblemapU64, NibblemapU128,
    };
    use pistols::utils::bitwise::{
        BitwiseU32, BitwiseU128,
        BITWISE,
    };

    #[test]
    fn test_get_set_dibit() {
        let value_u64: u64 = 0xedededededededed;
        let value_u32: u32 = (value_u64 & BITWISE::MAX_U32.into()).try_into().unwrap();
        let value_u16: u16 = (value_u64 & BITWISE::MAX_U16.into()).try_into().unwrap();
        let value_u8: u8 = (value_u64 & BITWISE::MAX_U8.into()).try_into().unwrap();
        let mut set_u64: u64 = 0;
        let mut set_u32: u32 = 0;
        let mut set_u16: u16 = 0;
        let mut set_u8: u8 = 0;
        let mut i: u8 = 0;
        while (i < 32) {
            let v: u8 = if (i % 2 == 0) {((i / 2) % 2) + 1} else {(3)};
            let dibit_u64: u64 = DibitmapU64::get_dibit(value_u64, i.into());
            let dibit_u32: u32 = DibitmapU32::get_dibit(value_u32, i.into());
            let dibit_u16: u16 = DibitmapU16::get_dibit(value_u16, i.into());
            let dibit_u8: u8 = DibitmapU8::get_dibit(value_u8, i.into());
            // println!("U64.get_dibit({}) = {} {}", i, v, dibit_u64);
            assert_eq!(dibit_u64, v.into(), "U64.get_dibit({})", i);
            set_u64 = DibitmapU64::set_dibit(set_u64, i.into(), dibit_u64);
            if (i.into() < DibitmapU32::dibit_count()) {
                // println!("U32.get_dibit({}) = {} {}", i, v, dibit_u32);
                assert_eq!(dibit_u32, v.into(), "U32.get_dibit({})", i);
                set_u32 = DibitmapU32::set_dibit(set_u32, i.into(), dibit_u32);
            } else {
                assert_eq!(dibit_u32, 0, "U32.get_dibit({})", i);
            };
            if (i.into() < DibitmapU16::dibit_count()) {
                // println!("U16.get_dibit({}) = {} {}", i, v, dibit_u16);
                assert_eq!(dibit_u16, v.into(), "U16.get_dibit({})", i);
                set_u16 = DibitmapU16::set_dibit(set_u16, i.into(), dibit_u16);
            } else {
                assert_eq!(dibit_u16, 0, "U16.get_dibit({})", i);
            };
            if (i.into() < DibitmapU8::dibit_count()) {
                // println!("U8.get_dibit({}) = {} {}", i, v, dibit_u8);
                assert_eq!(dibit_u8, v.into(), "U8.get_dibit({})", i);
                set_u8 = DibitmapU8::set_dibit(set_u8, i.into(), dibit_u8);
            } else {
                assert_eq!(dibit_u8, 0, "U8.get_dibit({})", i);
            };
            i += 1;
        };
        assert_eq!(set_u64, value_u64, "U64.set_dibit");
        assert_eq!(set_u32, value_u32, "U32.set_dibit");
        assert_eq!(set_u16, value_u16, "U16.set_dibit");
        assert_eq!(set_u8, value_u8, "U8.set_dibit");
        assert_eq!(set_u8, value_u8, "U8.set_dibit");
    }

    #[test]
    fn test_get_set_nibble() {
        let value_u128: u128 = 0xffedcba987654321ffedcba987654321;
        let value_u64: u64 = (value_u128 & BITWISE::MAX_U64.into()).try_into().unwrap();
        let value_u32: u32 = (value_u128 & BITWISE::MAX_U32.into()).try_into().unwrap();
        let value_u16: u16 = (value_u128 & BITWISE::MAX_U16.into()).try_into().unwrap();
        let value_u8: u8 = (value_u128 & BITWISE::MAX_U8.into()).try_into().unwrap();
        let mut set_u128: u128 = 0;
        let mut set_u64: u64 = 0;
        let mut set_u32: u32 = 0;
        let mut set_u16: u16 = 0;
        let mut set_u8: u8 = 0;
        let mut i: u8 = 0;
        while (i < 32) {
            let v: u8 = core::cmp::min(((i % 16) + 1), 0xf);
            let nibble_u128: u128 = NibblemapU128::get_nibble(value_u128, i.into());
            let nibble_u64: u64 = NibblemapU64::get_nibble(value_u64, i.into());
            let nibble_u32: u32 = NibblemapU32::get_nibble(value_u32, i.into());
            let nibble_u16: u16 = NibblemapU16::get_nibble(value_u16, i.into());
            let nibble_u8: u8 = NibblemapU8::get_nibble(value_u8, i.into());
            // println!("U128.get_nibble({}) = {} {}", i, v, nibble_u128);
            assert_eq!(nibble_u128, v.into(), "U128.get_nibble({})", i);
            set_u128 = NibblemapU128::set_nibble(set_u128, i.into(), nibble_u128);
            if (i.into() < NibblemapU64::nibble_count()) {
                // println!("U64.get_nibble({}) = {} {}", i, v, nibble_u64);
                assert_eq!(nibble_u64, v.into(), "U64.get_nibble({})", i);
                set_u64 = NibblemapU64::set_nibble(set_u64, i.into(), nibble_u64);
            } else {
                assert_eq!(nibble_u64, 0, "U64.get_nibble({})", i);
            };
            if (i.into() < NibblemapU32::nibble_count()) {
                // println!("U32.get_nibble({}) = {} {}", i, v, nibble_u32);
                assert_eq!(nibble_u32, v.into(), "U32.get_nibble({})", i);
                set_u32 = NibblemapU32::set_nibble(set_u32, i.into(), nibble_u32);
            } else {
                assert_eq!(nibble_u32, 0, "U32.get_nibble({})", i);
            };
            if (i.into() < NibblemapU16::nibble_count()) {
                // println!("U16.get_nibble({}) = {} {}", i, v, nibble_u16);
                assert_eq!(nibble_u16, v.into(), "U16.get_nibble({})", i);
                set_u16 = NibblemapU16::set_nibble(set_u16, i.into(), nibble_u16);
            } else {
                assert_eq!(nibble_u16, 0, "U16.get_nibble({})", i);
            };
            if (i.into() < NibblemapU8::nibble_count()) {
                // println!("U8.get_nibble({}) = {} {}", i, v, nibble_u8);
                assert_eq!(nibble_u8, v.into(), "U8.get_nibble({})", i);
                set_u8 = NibblemapU8::set_nibble(set_u8, i.into(), nibble_u8);
            } else {
                assert_eq!(nibble_u8, 0, "U8.get_nibble({})", i);
            };
            i += 1;
        };
        assert_eq!(set_u128, value_u128, "U128.set_nibble");
        assert_eq!(set_u64, value_u64, "U64.set_nibble");
        assert_eq!(set_u32, value_u32, "U32.set_nibble");
        assert_eq!(set_u16, value_u16, "U16.set_nibble");
        assert_eq!(set_u8, value_u8, "U8.set_nibble");
        assert_eq!(set_u8, value_u8, "U8.set_nibble");
    }
}
