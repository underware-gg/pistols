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
    fn bit_fill(n: usize) -> T;
    fn set(self: T, n: usize) -> T;
    fn unset(self: T, n: usize) -> T;
    fn shl(self: T, n: usize) -> T;
    fn shr(self: T, n: usize) -> T;
    fn is_set(self: T, n: usize) -> bool;
    fn count_bits(self: T) -> usize;
    // single byte manipulation
    fn sum_bytes(self: T) -> T;
    fn get_byte(self: T, i: usize) -> T;
    fn set_byte(self: T, i: usize, v: T) -> T;
    fn byte_mask(i: usize) -> T;
    fn byte_shift(i: usize) -> T;
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
    fn bit_fill(n: usize) -> u8 {
        if (n == 0) { (0) }
        else if (n >= Self::bit_count()) { (Self::max()) }
        else { (Self::shr(Self::max(), Self::bit_count() - n)) }
    }
    #[inline(always)]
    fn set(self: u8, n: usize) -> u8 {
        self | Self::bit(n)
    }
    #[inline(always)]
    fn unset(self: u8, n: usize) -> u8 {
        self & ~Self::bit(n)
    }
    #[inline(always)]
    fn shl(self: u8, n: usize) -> u8 {
        self * Self::bit(n)
    }
    #[inline(always)]
    fn shr(self: u8, n: usize) -> u8 {
        if (n < 8) { (self / Self::bit(n)) }
        else { (0) }
    }
    #[inline(always)]
    fn is_set(self: u8, n: usize) -> bool {
        ((Self::shr(self, n) & 1) != 0)
    }
    fn count_bits(self: u8) -> usize {
        let mut result: usize = 0;
        let mut bit: u8 = BITWISE::MSB_U8;
        while (bit != 0) {
            if (self & bit != 0) { result += 1; };
            bit /= 2;
        };
        result
    }
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
    fn bit_fill(n: usize) -> u16 {
        if (n == 0) { (0) }
        else if (n >= Self::bit_count()) { (Self::max()) }
        else { (Self::shr(Self::max(), Self::bit_count() - n)) }
    }
    #[inline(always)]
    fn set(self: u16, n: usize) -> u16 {
        self | Self::bit(n)
    }
    #[inline(always)]
    fn unset(self: u16, n: usize) -> u16 {
        self & ~Self::bit(n)
    }
    #[inline(always)]
    fn shl(self: u16, n: usize) -> u16 {
        self * Self::bit(n)
    }
    #[inline(always)]
    fn shr(self: u16, n: usize) -> u16 {
        if (n < 16) { (self / Self::bit(n)) }
        else { (0) }
    }
    #[inline(always)]
    fn is_set(self: u16, n: usize) -> bool {
        ((Self::shr(self, n) & 1) != 0)
    }
    fn count_bits(self: u16) -> usize {
        let mut result: usize = 0;
        let mut bit: u16 = BITWISE::MSB_U16;
        while (bit != 0) {
            if (self & bit != 0) { result += 1; };
            bit /= 2;
        };
        result
    }
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
    fn bit_fill(n: usize) -> u32 {
        if (n == 0) { (0) }
        else if (n >= Self::bit_count()) { (Self::max()) }
        else { (Self::shr(Self::max(), Self::bit_count() - n)) }
    }
    #[inline(always)]
    fn set(self: u32, n: usize) -> u32 {
        self | Self::bit(n)
    }
    #[inline(always)]
    fn unset(self: u32, n: usize) -> u32 {
        self & ~Self::bit(n)
    }
    #[inline(always)]
    fn shl(self: u32, n: usize) -> u32 {
        self * Self::bit(n)
    }
    #[inline(always)]
    fn shr(self: u32, n: usize) -> u32 {
        if (n < 32) { (self / Self::bit(n)) }
        else { (0) }
    }
    #[inline(always)]
    fn is_set(self: u32, n: usize) -> bool {
        ((Self::shr(self, n) & 1) != 0)
    }
    fn count_bits(self: u32) -> usize {
        let mut result: usize = 0;
        let mut bit: u32 = BITWISE::MSB_U32;
        while (bit != 0) {
            if (self & bit != 0) { result += 1; };
            bit /= 2;
        };
        result
    }
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
    fn bit_fill(n: usize) -> u64 {
        if (n == 0) { (0) }
        else if (n >= Self::bit_count()) { (Self::max()) }
        else { (Self::shr(Self::max(), Self::bit_count() - n)) }
    }
    #[inline(always)]
    fn set(self: u64, n: usize) -> u64 {
        self | Self::bit(n)
    }
    #[inline(always)]
    fn unset(self: u64, n: usize) -> u64 {
        self &  ~Self::bit(n)
    }
    #[inline(always)]
    fn shl(self: u64, n: usize) -> u64 {
        self * Self::bit(n)
    }
    #[inline(always)]
    fn shr(self: u64, n: usize) -> u64 {
        if (n < 64) { (self / Self::bit(n)) }
        else { (0) }
    }
    #[inline(always)]
    fn is_set(self: u64, n: usize) -> bool {
        ((Self::shr(self, n) & 1) != 0)
    }
    fn count_bits(self: u64) -> usize {
        let mut result: usize = 0;
        let mut bit: u64 = BITWISE::MSB_U64;
        while (bit != 0) {
            if (self & bit != 0) { result += 1; };
            bit /= 2;
        };
        result
    }
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
    fn bit_fill(n: usize) -> u128 {
        if (n == 0) { (0) }
        else if (n >= Self::bit_count()) { (Self::max()) }
        else { (Self::shr(Self::max(), Self::bit_count() - n)) }
    }
    #[inline(always)]
    fn set(self: u128, n: usize) -> u128 {
        self | Self::bit(n)
    }
    #[inline(always)]
    fn unset(self: u128, n: usize) -> u128 {
        self & ~Self::bit(n)
    }
    #[inline(always)]
    fn shl(self: u128, n: usize) -> u128 {
        self * Self::bit(n)
    }
    #[inline(always)]
    fn shr(self: u128, n: usize) -> u128 {
        if (n < 128) { (self / Self::bit(n)) }
        else { (0) }
    }
    #[inline(always)]
    fn is_set(self: u128, n: usize) -> bool {
        ((Self::shr(self, n) & 1) != 0)
    }
    fn count_bits(self: u128) -> usize {
        let mut result: usize = 0;
        let mut bit: u128 = BITWISE::MSB_U128;
        while (bit != 0) {
            if (self & bit != 0) { result += 1; };
            bit /= 2;
        };
        result
    }
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
            _ => {0x0},
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
            _ => {0x1},
        })
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
    fn bit_fill(n: usize) -> u256 {
        if (n == 0) { (0) }
        else if (n >= Self::bit_count()) { (Self::max()) }
        else { (Self::shr(Self::max(), Self::bit_count() - n)) }
    }
    #[inline(always)]
    fn set(self: u256, n: usize) -> u256 {
        self | Self::bit(n)
    }
    #[inline(always)]
    fn unset(self: u256, n: usize) -> u256 {
        self & ~Self::bit(n)
    }
    #[inline(always)]
    fn shl(self: u256, n: usize) -> u256 {
        self * Self::bit(n)
    }
    #[inline(always)]
    fn shr(self: u256, n: usize) -> u256 {
        if (n < 256) { (self / Self::bit(n)) }
        else { (0) }
    }
    #[inline(always)]
    fn is_set(self: u256, n: usize) -> bool {
        ((Self::shr(self, n) & 1) != 0)
    }
    fn count_bits(self: u256) -> usize {
        let mut result: usize = 0;
        let mut bit: u256 = BITWISE::MSB_U256;
        while (bit != 0) {
            if (self & bit != 0) { result += 1; };
            bit /= 2;
        };
        result
    }
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
            _ => {0x0},
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
            _ => {0x1},
        })
    }
}


//----------------------------------------
// Unit  tests
//
#[cfg(test)]
mod unit {
    use super::{
        BITWISE,
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
            if (n < 8) {
                assert_eq!(BitwiseU8::bit(n), bit.try_into().unwrap(), "test_bit_8_8");
                assert_eq!(BitwiseU16::bit(n), bit.try_into().unwrap(), "test_bit_8_16");
                assert_eq!(BitwiseU32::bit(n), bit.try_into().unwrap(), "test_bit_8_32");
                assert_eq!(BitwiseU64::bit(n), bit.try_into().unwrap(), "test_bit_8_64");
                assert_eq!(BitwiseU128::bit(n), bit.try_into().unwrap(), "test_bit_8_128");
                assert_eq!(BitwiseU256::bit(n), bit, "test_bit_8_256");
            } else if (n < 16) {
                assert_eq!(BitwiseU8::bit(n), 0x0, "test_bit_16_8");
                assert_eq!(BitwiseU16::bit(n), bit.try_into().unwrap(), "test_bit_16_16");
                assert_eq!(BitwiseU32::bit(n), bit.try_into().unwrap(), "test_bit_16_32");
                assert_eq!(BitwiseU64::bit(n), bit.try_into().unwrap(), "test_bit_16_64");
                assert_eq!(BitwiseU128::bit(n), bit.try_into().unwrap(), "test_bit_16_128");
                assert_eq!(BitwiseU256::bit(n), bit, "test_bit_16_256");
            } else if (n < 32) {
                assert_eq!(BitwiseU16::bit(n), 0x0, "test_bit_32_16");
                assert_eq!(BitwiseU32::bit(n), bit.try_into().unwrap(), "test_bit_16_32");
                assert_eq!(BitwiseU64::bit(n), bit.try_into().unwrap(), "test_bit_16_64");
                assert_eq!(BitwiseU128::bit(n), bit.try_into().unwrap(), "test_bit_16_128");
                assert_eq!(BitwiseU256::bit(n), bit, "test_bit_16_256");
            } else if (n < 64) {
                assert_eq!(BitwiseU32::bit(n), 0x0, "test_bit_64_32");
                assert_eq!(BitwiseU64::bit(n), bit.try_into().unwrap(), "test_bit_64_64");
                assert_eq!(BitwiseU128::bit(n), bit.try_into().unwrap(), "test_bit_64_128");
                assert_eq!(BitwiseU256::bit(n), bit, "test_bit_64_256");
            } else if (n < 128) {
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
        while (n < 8) {
            let bit = BitwiseU8::bit(n);
            assert_eq!(bit, BitwiseU8::shl(1, n), "test_shl_u8");
            assert_eq!(bit, BitwiseU8::shr(BitwiseU8::msb(), 7-n), "test_shr_u8");
            n += 1;
        };
    }

    #[test]
    fn test_shift_u16() {
        let mut n: usize = 0;
        while (n < 16) {
            let bit = BitwiseU16::bit(n);
            assert_eq!(bit, BitwiseU16::shl(1, n), "test_shl_u16");
            assert_eq!(bit, BitwiseU16::shr(BitwiseU16::msb(), 15-n), "test_shr_u16");
            n += 1;
        };
    }

    #[test]
    fn test_shift_u32() {
        let mut n: usize = 0;
        while (n < 32) {
            let bit = BitwiseU32::bit(n);
            assert_eq!(bit, BitwiseU32::shl(1, n), "test_shl_u32");
            assert_eq!(bit, BitwiseU32::shr(BitwiseU32::msb(), (31-n)), "test_shr_u32");
            n += 1;
        };
    }

    #[test]
    fn test_shift_u64() {
        let mut n: usize = 0;
        while (n < 64) {
            let bit = BitwiseU64::bit(n);
            assert_eq!(bit, BitwiseU64::shl(1, n), "test_shl_u64");
            assert_eq!(bit, BitwiseU64::shr(BitwiseU64::msb(), (63-n)), "test_shr_u64");
            n += 1;
        };
    }

    #[test]
    fn test_shift_u128() {
        let mut n: usize = 0;
        while (n < 128) {
            let bit = BitwiseU128::bit(n);
            assert_eq!(bit, BitwiseU128::shl(1, n), "test_shl_u128");
            assert_eq!(bit, BitwiseU128::shr(BitwiseU128::msb(), (127-n)), "test_shr_u128");
            n += 1;
        };
    }

    #[test]
    fn test_shift_u256() {
        let mut n: usize = 0;
        while (n < 256) {
            let bit = BitwiseU256::bit(n);
            assert_eq!(bit, BitwiseU256::shl(1, n), "test_shl_u256");
            assert_eq!(bit, BitwiseU256::shr(BitwiseU256::msb(), (255-n)), "test_shr_u256");
            n += 1;
        };
    }

    #[test]
    fn test_bit_fill() {
        assert_eq!(BitwiseU8::bit_fill(0), 0b0, "fill_u8_0");
        assert_eq!(BitwiseU8::bit_fill(1), 0b1, "fill_u8_1");
        assert_eq!(BitwiseU8::bit_fill(2), 0b11, "fill_u8_2");
        assert_eq!(BitwiseU8::bit_fill(3), 0b111, "fill_u8_3");
        assert_eq!(BitwiseU8::bit_fill(4), 0b1111, "fill_u8_4");
        assert_eq!(BitwiseU8::bit_fill(5), 0b11111, "fill_u8_5");
        assert_eq!(BitwiseU8::bit_fill(6), 0b111111, "fill_u8_6");
        assert_eq!(BitwiseU8::bit_fill(7), 0b1111111, "fill_u8_7");
        assert_eq!(BitwiseU8::bit_fill(8), 0b11111111, "fill_u8_8");
        assert_eq!(BitwiseU8::bit_fill(99), 0b11111111, "fill_u8_99");
        assert_eq!(BitwiseU128::bit_fill(8), BITWISE::MAX_U8.into(), "fill_u128_8");
        assert_eq!(BitwiseU128::bit_fill(64), BITWISE::MAX_U64.into(), "fill_u128_64");
        assert_eq!(BitwiseU256::bit_fill(128), BITWISE::MAX_U128.into(), "fill_u256_128");
    }

    #[test]
    fn test_set_u8() {
        let ok: u8 = HALF_U8;
        let mut bitmap: u8 = ok;
        let mut n: usize = 0;
        while (n < 8) {
            let shouldBeSet: bool = (n % 2) == 0;
            assert_eq!(BitwiseU8::is_set(bitmap, n), shouldBeSet, "u8_shouldBeSet_1");
            if(shouldBeSet) { bitmap = BitwiseU8::unset(bitmap, n); }
            else { bitmap = BitwiseU8::set(bitmap, n); }
            assert_eq!(BitwiseU8::is_set(bitmap, n), !shouldBeSet, "u8_!shouldBeSet_1");
            n += 1;
        };
        assert_eq!(bitmap, ~ok, "~ok");
        n = 0;
        while (n < 8) {
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
        while (n < 16) {
            let shouldBeSet: bool = (n % 2) == 0;
            assert_eq!(BitwiseU16::is_set(bitmap, n), shouldBeSet, "u16_shouldBeSet_1");
            if(shouldBeSet) { bitmap = BitwiseU16::unset(bitmap, n); }
            else { bitmap = BitwiseU16::set(bitmap, n); }
            assert_eq!(BitwiseU16::is_set(bitmap, n), !shouldBeSet, "u16_!shouldBeSet_1");
            n += 1;
        };
        assert_eq!(bitmap, ~ok, "~ok");
        n = 0;
        while (n < 16) {
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
        while (n < 32) {
            let shouldBeSet: bool = (n % 2) == 0;
            assert_eq!(BitwiseU32::is_set(bitmap, n), shouldBeSet, "u32_shouldBeSet_1");
            if(shouldBeSet) { bitmap = BitwiseU32::unset(bitmap, n); }
            else { bitmap = BitwiseU32::set(bitmap, n); }
            assert_eq!(BitwiseU32::is_set(bitmap, n), !shouldBeSet, "u32_!shouldBeSet_1");
            n += 1;
        };
        assert_eq!(bitmap, ~ok, "~ok");
        n = 0;
        while (n < 32) {
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
        while (n < 64) {
            let shouldBeSet: bool = (n % 2) == 0;
            assert_eq!(BitwiseU64::is_set(bitmap, n), shouldBeSet, "u64_shouldBeSet_1");
            if(shouldBeSet) { bitmap = BitwiseU64::unset(bitmap, n); }
            else { bitmap = BitwiseU64::set(bitmap, n); }
            assert_eq!(BitwiseU64::is_set(bitmap, n), !shouldBeSet, "u64_!shouldBeSet_1");
            n += 1;
        };
        assert_eq!(bitmap, ~ok, "~ok");
        n = 0;
        while (n < 64) {
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
        while (n < 128) {
            let shouldBeSet: bool = (n % 2) == 0;
            assert_eq!(BitwiseU128::is_set(bitmap, n), shouldBeSet, "u128_shouldBeSet_1");
            if(shouldBeSet) { bitmap = BitwiseU128::unset(bitmap, n); }
            else { bitmap = BitwiseU128::set(bitmap, n); }
            assert_eq!(BitwiseU128::is_set(bitmap, n), !shouldBeSet, "u128_!shouldBeSet_1");
            n += 1;
        };
        assert_eq!(bitmap, ~ok, "~ok");
        n = 0;
        while (n < 128) {
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
        while (n < 256) {
            let shouldBeSet: bool = (n % 2) == 0;
            assert_eq!(BitwiseU256::is_set(bitmap, n), shouldBeSet, "u256_shouldBeSet_1");
            if(shouldBeSet) { bitmap = BitwiseU256::unset(bitmap, n); }
            else { bitmap = BitwiseU256::set(bitmap, n); }
            assert_eq!(BitwiseU256::is_set(bitmap, n), !shouldBeSet, "u256_!shouldBeSet_1");
            n += 1;
        };
        assert_eq!(bitmap, ~ok, "~ok");
        n = 0;
        while (n < 256) {
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
            let byte_u256: u256 = BitwiseU256::get_byte(value_u256, i.into());
            let byte_u128: u128 = BitwiseU128::get_byte(value_u128, i.into());
            let byte_u64: u64 = BitwiseU64::get_byte(value_u64, i.into());
            let byte_u32: u32 = BitwiseU32::get_byte(value_u32, i.into());
            let byte_u16: u16 = BitwiseU16::get_byte(value_u16, i.into());
            let byte_u8: u8 = BitwiseU8::get_byte(value_u8, i.into());
            // println!("U256.get_byte({}) = {}", i, byte);
            assert_eq!(byte_u256, v.into(), "U256.get_byte({})", i);
            set_u256 = BitwiseU256::set_byte(set_u256, i.into(), byte_u256);
            if (i.into() < BitwiseU128::byte_count()) {
                // println!("U128.get_byte({}) = {}", i, byte);
                assert_eq!(byte_u128, v.into(), "U128.get_byte({})", i);
                set_u128 = BitwiseU128::set_byte(set_u128, i.into(), byte_u128);
            } else {
                assert_eq!(byte_u128, 0, "U128.get_byte({})", i);
            };
            if (i.into() < BitwiseU64::byte_count()) {
                // println!("U64.get_byte({}) = {}", i, byte);
                assert_eq!(byte_u64, v.into(), "U64.get_byte({})", i);
                set_u64 = BitwiseU64::set_byte(set_u64, i.into(), byte_u64);
            } else {
                assert_eq!(byte_u64, 0, "U64.get_byte({})", i);
            };
            if (i.into() < BitwiseU32::byte_count()) {
                // println!("U32.get_byte({}) = {}", i, byte);
                assert_eq!(byte_u32, v.into(), "U32.get_byte({})", i);
                set_u32 = BitwiseU32::set_byte(set_u32, i.into(), byte_u32);
            } else {
                assert_eq!(byte_u32, 0, "U32.get_byte({})", i);
            };
            if (i.into() < BitwiseU16::byte_count()) {
                // println!("U16.get_byte({}) = {}", i, byte);
                assert_eq!(byte_u16, v.into(), "U16.get_byte({})", i);
                set_u16 = BitwiseU16::set_byte(set_u16, i.into(), byte_u16);
            } else {
                assert_eq!(byte_u16, 0, "U16.get_byte({})", i);
            };
            if (i.into() < BitwiseU8::byte_count()) {
                // println!("U8.get_byte({}) = {}", i, byte);
                assert_eq!(byte_u8, v.into(), "U8.get_byte({})", i);
                set_u8 = BitwiseU8::set_byte(set_u8, i.into(), byte_u8);
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
