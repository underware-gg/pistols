use pistols::utils::byte_arrays::{
    U8IntoByteArray,
    U16IntoByteArray,
    U32IntoByteArray,
    U64IntoByteArray,
    U128IntoByteArray,
    U256IntoByteArray,
};
use pistols::utils::bitwise::{
    BitwiseU128,
    BitwiseU256,
};

pub trait MathTrait<T,TI> {
    // absolute value
    fn abs(v: TI) -> T;
    // fn min(a: T, b: T) -> T; // use core::cmp::min
    // fn max(a: T, b: T) -> T; // use core::cmp::max
    // returns a value clamped between min and max
    fn clamp(v: T, min: T, max: T) -> T;
    fn clampi(ref self: T, min: T, max: T); // in-place clamp()
    // safe substraction
    fn sub(a: T, b: T) -> T;
    fn add(a: T, b: TI) -> T;
    fn subi(ref self: T, v: T);  // in-place sub()
    fn addi(ref self: T, v: TI); // in-place add()
    // map a value form one range to another
    fn map(v: T, in_min: T, in_max: T, out_min: T, out_max: T) -> T;
    fn scale(v: T, in_max: T, out_max: T) -> T;
    fn percentage(v: T, percent: u8) -> T;
    // returns GDC of two numbers
    fn gdc(a: T, b: T) -> T;
    // power
    fn pow(base: T, exp: T) -> T;
    // quared distance in 2D space
    fn squaredDistance(x1: T, y1: T, x2: T, y2: T) -> T;
    // converters
    fn to_felt(self: T) -> felt252;
    fn to_string(self: T) -> ByteArray;
    fn to_short_string(self: T) -> felt252;
}

const MAX_SHORT_STRING_NUMBER: u128 = 9999999999999999999999999999999; // 31 algarisms

pub impl MathU8 of MathTrait<u8,i8> {
    fn abs(v: i8) -> u8 {
        if (v < 0) { (-v).try_into().unwrap() } else { (v).try_into().unwrap() }
    }
    fn clamp(v: u8, min: u8, max: u8) -> u8 {
        if (v < min) { (min) } else if (v > max) { (max) } else { (v) }
    }
    fn clampi(ref self: u8, min: u8, max: u8) {
        self = Self::clamp(self, min, max);
    }

    fn sub(a: u8, b: u8) -> u8 {
        if (b >= a) { (0) } else { (a - b) }
    }
    fn add(a: u8, b: i8) -> u8 {
        if (b < 0) { Self::sub(a, (-b).try_into().unwrap()) }
        else if (b > 0) { (a + b.try_into().unwrap()) }
        else { (a) }
    }
    fn subi(ref self: u8, v: u8) {
        self = Self::sub(self, v);
    }
    fn addi(ref self: u8, v: i8) {
        self = Self::add(self, v);
    }

    fn percentage(v: u8, percent: u8) -> u8 {
        let result: u128 = MathU128::percentage(v.into(), percent);
        (result.try_into().unwrap())
    }

    fn map(v: u8, in_min: u8, in_max: u8, out_min: u8, out_max: u8) -> u8 {
        let result: u128 = MathU128::map(v.into(), in_min.into(), in_max.into(), out_min.into(), out_max.into());
        (result.try_into().unwrap())
    }
    fn scale(v: u8, in_max: u8, out_max: u8) -> u8 {
        let result: u128 = MathU128::scale(v.into(), in_max.into(), out_max.into());
        (result.try_into().unwrap())
    }
    // fn map(v: u8, in_min: u8, in_max: u8, out_min: u8, out_max: u8) -> u8 {
    //     if (out_min > out_max) { 
    //         (out_min - Self::map(v, in_min, in_max, 0, out_min - out_max))
    //     } else {
    //         (out_min + (((out_max - out_min) / (in_max - in_min)) * (v - in_min)))
    //     }
    // }
    // fn map(v: u8, in_min: u8, in_max: u8, out_min: u8, out_max: u8) -> u8 {
    //     if (out_min > out_max) { 
    //         (out_min - Self::map(v, in_min, in_max, 0, out_min - out_max))
    //     } else {
    //         let mut d = (in_max - in_min);
    //         let mut c = (v - in_min);
    //         let gdc = Self::gdc(d, c);
    //         if (gdc > 1) {
    //             d /= gdc;
    //             c /= gdc;
    //         }
    //         let x = ((out_max - out_min) / d) * c;
    //         (out_min + x)
    //         // (out_min + (((out_max - out_min) / (in_max - in_min)) * (v - in_min)))
    //     }
    // }

    fn gdc(mut a: u8, mut b: u8) -> u8 {
        // recursive (not fastest)
        // if (b == 0) { (a) } else { (Self::gdc(b, a % b)) }
        // iterative: https://stackoverflow.com/a/17445322/360930
        if (b > a) { return Self::gdc(b, a); }
        let mut result: u8 = 0;
        loop {
            if (b == 0) { result = a; break; }
            a = a % b;
            if (a == 0) { result = b; break; }
            b = b % a;
        };
        (result)
    }

    fn pow(base: u8, exp: u8) -> u8 {
        if exp == 0 { 1 }
        else if exp == 1 { base }
        else if exp % 2 == 0 { Self::pow(base * base, exp / 2) }
        else { base * Self::pow(base * base, (exp - 1) / 2) }
    }

    fn squaredDistance(x1: u8, y1: u8, x2: u8, y2: u8) -> u8 {
        let dx = if (x1 > x2) { (x1 - x2) } else { (x2 - x1) };
        let dy = if (y1 > y2) { (y1 - y2) } else { (y2 - y1) };
        (dx * dx + dy * dy)
    }

    fn to_felt(self: u8) -> felt252 {
        let result: felt252 = self.into();
        (result)
    }
    
    #[inline(always)]
    fn to_string(self: u8) -> ByteArray {
        (self.into())
    }

    fn to_short_string(self: u8) -> felt252 {
        (MathU128::to_short_string(self.into()))
    }
}

pub impl MathU16 of MathTrait<u16, i16> {
    fn abs(v: i16) -> u16 {
        if (v < 0) { (-v).try_into().unwrap() } else { (v).try_into().unwrap() }
    }
    fn clamp(v: u16, min: u16, max: u16) -> u16 {
        if (v < min) { (min) } else if (v > max) { (max) } else { (v) }
    }
    fn clampi(ref self: u16, min: u16, max: u16) {
        self = Self::clamp(self, min, max);
    }

    fn sub(a: u16, b: u16) -> u16 {
        if (b >= a) { (0) } else { (a - b) }
    }
    fn add(a: u16, b: i16) -> u16 {
        if (b < 0) { Self::sub(a, (-b).try_into().unwrap()) }
        else if (b > 0) { (a + b.try_into().unwrap()) }
        else { (a) }
    }
    fn subi(ref self: u16, v: u16) {
        self = Self::sub(self, v);
    }
    fn addi(ref self: u16, v: i16) {
        self = Self::add(self, v);
    }

    fn percentage(v: u16, percent: u8) -> u16 {
        let result: u128 = MathU128::percentage(v.into(), percent);
        (result.try_into().unwrap())
    }

    fn map(v: u16, in_min: u16, in_max: u16, out_min: u16, out_max: u16) -> u16 {
        let result: u128 = MathU128::map(v.into(), in_min.into(), in_max.into(), out_min.into(), out_max.into());
        (result.try_into().unwrap())
    }
    fn scale(v: u16, in_max: u16, out_max: u16) -> u16 {
        let result: u128 = MathU128::scale(v.into(), in_max.into(), out_max.into());
        (result.try_into().unwrap())
    }

    fn gdc(a: u16, b: u16) -> u16 {
        // recursive (not fastest)
        if (b == 0) { (a) } else { (Self::gdc(b, a % b)) }
    }

    fn pow(base: u16, exp: u16) -> u16 {
        if exp == 0 { 1 }
        else if exp == 1 { base }
        else if exp % 2 == 0 { Self::pow(base * base, exp / 2) }
        else { base * Self::pow(base * base, (exp - 1) / 2) }
    }

    fn squaredDistance(x1: u16, y1: u16, x2: u16, y2: u16) -> u16 {
        let dx = if (x1 > x2) { (x1 - x2) } else { (x2 - x1) };
        let dy = if (y1 > y2) { (y1 - y2) } else { (y2 - y1) };
        (dx * dx + dy * dy)
    }

    fn to_felt(self: u16) -> felt252 {
        let result: felt252 = self.into();
        (result)
    }
    
    #[inline(always)]
    fn to_string(self: u16) -> ByteArray {
        (self.into())
    }

    fn to_short_string(self: u16) -> felt252 {
        (MathU128::to_short_string(self.into()))
    }
}

pub impl MathU32 of MathTrait<u32, i32> {
    fn abs(v: i32) -> u32 {
        if (v < 0) { (-v).try_into().unwrap() } else { (v).try_into().unwrap() }
    }
    fn clamp(v: u32, min: u32, max: u32) -> u32 {
        if (v < min) { (min) } else if (v > max) { (max) } else { (v) }
    }
    fn clampi(ref self: u32, min: u32, max: u32) {
        self = Self::clamp(self, min, max);
    }

    fn sub(a: u32, b: u32) -> u32 {
        if (b >= a) { (0) } else { (a - b) }
    }
    fn add(a: u32, b: i32) -> u32 {
        if (b < 0) { Self::sub(a, (-b).try_into().unwrap()) }
        else if (b > 0) { (a + b.try_into().unwrap()) }
        else { (a) }
    }
    fn subi(ref self: u32, v: u32) {
        self = Self::sub(self, v);
    }
    fn addi(ref self: u32, v: i32) {
        self = Self::add(self, v);
    }

    fn percentage(v: u32, percent: u8) -> u32 {
        let result: u128 = MathU128::percentage(v.into(), percent);
        (result.try_into().unwrap())
    }

    fn map(v: u32, in_min: u32, in_max: u32, out_min: u32, out_max: u32) -> u32 {
        let result: u128 = MathU128::map(v.into(), in_min.into(), in_max.into(), out_min.into(), out_max.into());
        (result.try_into().unwrap())
    }
    fn scale(v: u32, in_max: u32, out_max: u32) -> u32 {
        let result: u128 = MathU128::scale(v.into(), in_max.into(), out_max.into());
        (result.try_into().unwrap())
    }

    fn gdc(a: u32, b: u32) -> u32 {
        if (b == 0) { (a) } else { (Self::gdc(b, a % b)) }
    }

    fn pow(base: u32, exp: u32) -> u32 {
        if exp == 0 { 1 }
        else if exp == 1 { base }
        else if exp % 2 == 0 { Self::pow(base * base, exp / 2) }
        else { base * Self::pow(base * base, (exp - 1) / 2) }
    }

    fn squaredDistance(x1: u32, y1: u32, x2: u32, y2: u32) -> u32 {
        let dx = if (x1 > x2) { (x1 - x2) } else { (x2 - x1) };
        let dy = if (y1 > y2) { (y1 - y2) } else { (y2 - y1) };
        (dx * dx + dy * dy)
    }

    fn to_felt(self: u32) -> felt252 {
        let result: felt252 = self.into();
        (result)
    }

    #[inline(always)]
    fn to_string(self: u32) -> ByteArray {
        (self.into())
    }

    fn to_short_string(self: u32) -> felt252 {
        if (self == 0) {
            ('0')
        } else {
            let mut result: u128 = 0;
            let mut n: u128 = self.into();
            let mut i: usize = 0;
            while (n != 0) {
                let c: u128 = 48 + (n % 10);    // '0' + n
                result = result | BitwiseU128::shl(c, i * 8);  // (c << 8) | result
                n /= 10;
                i += 1;
            };
            (result.to_felt())
        }
    }
}

pub impl MathU64 of MathTrait<u64, i64> {
    fn abs(v: i64) -> u64 {
        if (v < 0) { (-v).try_into().unwrap() } else { (v).try_into().unwrap() }
    }
    fn clamp(v: u64, min: u64, max: u64) -> u64 {
        if (v < min) { (min) } else if (v > max) { (max) } else { (v) }
    }
    fn clampi(ref self: u64, min: u64, max: u64) {
        self = Self::clamp(self, min, max);
    }

    fn sub(a: u64, b: u64) -> u64 {
        if (b >= a) { (0) } else { (a - b) }
    }
    fn add(a: u64, b: i64) -> u64 {
        if (b < 0) { Self::sub(a, (-b).try_into().unwrap()) }
        else if (b > 0) { (a + b.try_into().unwrap()) }
        else { (a) }
    }
    fn subi(ref self: u64, v: u64) {
        self = Self::sub(self, v);
    }
    fn addi(ref self: u64, v: i64) {
        self = Self::add(self, v);
    }

    fn percentage(v: u64, percent: u8) -> u64 {
        let result: u128 = MathU128::percentage(v.into(), percent);
        (result.try_into().unwrap())
    }

    fn map(v: u64, in_min: u64, in_max: u64, out_min: u64, out_max: u64) -> u64 {
        let result: u128 = MathU128::map(v.into(), in_min.into(), in_max.into(), out_min.into(), out_max.into());
        (result.try_into().unwrap())
    }
    fn scale(v: u64, in_max: u64, out_max: u64) -> u64 {
        let result: u128 = MathU128::scale(v.into(), in_max.into(), out_max.into());
        (result.try_into().unwrap())
    }

    fn gdc(a: u64, b: u64) -> u64 {
        if (b == 0) { (a) } else { (Self::gdc(b, a % b)) }
    }

    fn pow(base: u64, exp: u64) -> u64 {
        if exp == 0 { 1 }
        else if exp == 1 { base }
        else if exp % 2 == 0 { Self::pow(base * base, exp / 2) }
        else { base * Self::pow(base * base, (exp - 1) / 2) }
    }

    fn squaredDistance(x1: u64, y1: u64, x2: u64, y2: u64) -> u64 {
        let dx = if (x1 > x2) { (x1 - x2) } else { (x2 - x1) };
        let dy = if (y1 > y2) { (y1 - y2) } else { (y2 - y1) };
        (dx * dx + dy * dy)
    }

    fn to_felt(self: u64) -> felt252 {
        let result: felt252 = self.into();
        (result)
    }

    #[inline(always)]
    fn to_string(self: u64) -> ByteArray {
        (self.into())
    }

    fn to_short_string(self: u64) -> felt252 {
        (MathU128::to_short_string(self.into()))
    }
}

pub impl MathU128 of MathTrait<u128, i128> {
    fn abs(v: i128) -> u128 {
        if (v < 0) { (-v).try_into().unwrap() } else { (v).try_into().unwrap() }
    }
    fn clamp(v: u128, min: u128, max: u128) -> u128 {
        if (v < min) { (min) } else if (v > max) { (max) } else { (v) }
    }
    fn clampi(ref self: u128, min: u128, max: u128) {
        self = Self::clamp(self, min, max);
    }

    fn sub(a: u128, b: u128) -> u128 {
        if (b >= a) { (0) } else { (a - b) }
    }
    fn add(a: u128, b: i128) -> u128 {
        if (b < 0) { Self::sub(a, (-b).try_into().unwrap()) }
        else if (b > 0) { (a + b.try_into().unwrap()) }
        else { (a) }
    }
    fn subi(ref self: u128, v: u128) {
        self = Self::sub(self, v);
    }
    fn addi(ref self: u128, v: i128) {
        self = Self::add(self, v);
    }

    fn percentage(v: u128, percent: u8) -> u128 {
        assert(percent <= 100, 'percentage(u128) percent > 100');
        if (v == 0 || percent == 0) { (0) }
        else { ((((v * 1_000_000) / 100) * percent.into()) / 1_000_000) } // possible overflow on high values
    }

    fn map(v: u128, in_min: u128, in_max: u128, out_min: u128, out_max: u128) -> u128 {
        if (v <= in_min) {
            (out_min)
        } else if (v >= in_max) {
            (out_max)
        } else if (out_min > out_max) { 
            (out_min - Self::map(v, in_min, in_max, 0, out_min - out_max))
        } else {
            (out_min + ((((v * 1_000_000 - in_min * 1_000_000) / (in_max - in_min)) * (out_max - out_min)) / 1_000_000))
        }
    }
    fn scale(v: u128, in_max: u128, out_max: u128) -> u128 {
        if (v == 0) {
            (0)
        } else if (v >= in_max) {
            (out_max)
        } else {
            ((((v * 1_000_000) / in_max) * out_max) / 1_000_000)
        }
    }


    fn gdc(a: u128, b: u128) -> u128 {
        if (b == 0) { (a) } else { (Self::gdc(b, a % b)) }
    }

    /// Raise a number to a power.
    /// O(log n) time complexity.
    /// * `base` - The number to raise.
    /// * `exp` - The exponent.
    /// # Returns
    /// * `u128` - The result of base raised to the power of exp.
    fn pow(base: u128, exp: u128) -> u128 {
        if exp == 0 { 1 }
        else if exp == 1 { base }
        else if exp % 2 == 0 { Self::pow(base * base, exp / 2) }
        else { base * Self::pow(base * base, (exp - 1) / 2) }
    }

    fn squaredDistance(x1: u128, y1: u128, x2: u128, y2: u128) -> u128 {
        let dx = if (x1 > x2) { (x1 - x2) } else { (x2 - x1) };
        let dy = if (y1 > y2) { (y1 - y2) } else { (y2 - y1) };
        (dx * dx + dy * dy)
    }

    fn to_felt(self: u128) -> felt252 {
        let result: felt252 = self.into();
        (result)
    }

    #[inline(always)]
    fn to_string(self: u128) -> ByteArray {
        (self.into())
    }
    
    fn to_short_string(self: u128) -> felt252 {
        if (self == 0) {
            ('0')
        } else {
            // no more than 31 algarisms
            assert(self <= MAX_SHORT_STRING_NUMBER, 'to_short_string(u128) Overflow');
            let mut result: u256 = 0;
            let mut n: u256 = self.into();
            let mut i: usize = 0;
            while (n != 0) {
                let c: u256 = 48 + (n % 10);    // '0' + n
                result = result | BitwiseU256::shl(c, i * 8);  // (c << 8) | result
                n /= 10;
                i += 1;
            };
            (result.to_felt())
        }
    }
}

pub impl MathU256 of MathTrait<u256, u256> {
    // there si no i256!
    fn abs(v: u256) -> u256 {
        (v)
    }
    fn clamp(v: u256, min: u256, max: u256) -> u256 {
        if (v < min) { (min) } else if (v > max) { (max) } else { (v) }
    }
    fn clampi(ref self: u256, min: u256, max: u256) {
        self = Self::clamp(self, min, max);
    }

    fn sub(a: u256, b: u256) -> u256 {
        if (b >= a) { (0) } else { (a - b) }
    }
    fn add(a: u256, b: u256) -> u256 {
        (a + b)
    }
    fn subi(ref self: u256, v: u256) {
        self = Self::sub(self, v);
    }
    fn addi(ref self: u256, v: u256) {
        self += v;
    }

    fn percentage(v: u256, percent: u8) -> u256 {
        assert(percent <= 100, 'percentage(u256) percent > 100');
        if (percent == 0) { (0) }
        else { ((((v * 1_000_000) / 100) * percent.into()) / 1_000_000) } // possible overflow on high values
    }

    fn map(v: u256, in_min: u256, in_max: u256, out_min: u256, out_max: u256) -> u256 {
        if (v <= in_min) {
            (out_min)
        } else if (v >= in_max) {
            (out_max)
        } else if (out_min > out_max) { 
            (out_min - Self::map(v, in_min, in_max, 0, out_min - out_max))
        } else {
            (out_min + ((((v * 1_000_000 - in_min * 1_000_000) / (in_max - in_min)) * (out_max - out_min)) / 1_000_000))
        }
    }
    fn scale(v: u256, in_max: u256, out_max: u256) -> u256 {
        if (v == 0) {
            (0)
        } else if (v >= in_max) {
            (out_max)
        } else {
            ((((v * 1_000_000) / in_max) * out_max) / 1_000_000)
        }
    }

    fn gdc(a: u256, b: u256) -> u256 {
        if (b == 0) { (a) } else { (Self::gdc(b, a % b)) }
    }

    fn pow(base: u256, exp: u256) -> u256 {
        if exp == 0 { 1 }
        else if exp == 1 { base }
        else if exp % 2 == 0 { Self::pow(base * base, exp / 2) }
        else { base * Self::pow(base * base, (exp - 1) / 2) }
    }

    fn squaredDistance(x1: u256, y1: u256, x2: u256, y2: u256) -> u256 {
        let dx = if (x1 > x2) { (x1 - x2) } else { (x2 - x1) };
        let dy = if (y1 > y2) { (y1 - y2) } else { (y2 - y1) };
        (dx * dx + dy * dy)
    }

    fn to_felt(self: u256) -> felt252 {
        let result: felt252 = self.try_into().unwrap();
        (result)
    }

    #[inline(always)]
    fn to_string(self: u256) -> ByteArray {
        (self.into())
    }

    fn to_short_string(self: u256) -> felt252 {
        assert(self <= MAX_SHORT_STRING_NUMBER.into(), 'to_short_string(u256) Overflow');
        (self.low.to_short_string())
    }
}


//----------------------------------------
// Unit  tests
//
#[cfg(test)]
mod unit {
    use super::{
        MathU8,MathU16,MathU32,MathU128,MathU256,
        MAX_SHORT_STRING_NUMBER,
    };
    use pistols::utils::bitwise::{BITWISE};
    use pistols::types::constants::{CONST};

    #[test]
    fn test_abs() {
        assert_eq!(MathU128::abs(0), 0, "abs_0");
        assert_eq!(MathU128::abs(1), 1, "abs_1");
        assert_eq!(MathU128::abs(-1), 1, "abs_-_1");
        assert_eq!(MathU128::abs(111), 111, "abs_111");
        assert_eq!(MathU128::abs(-111), 111, "abs_-_111");
        assert_eq!(MathU128::abs(0x8756876876f57f6576f), 0x8756876876f57f6576f, "abs_0x");
        assert_eq!(MathU128::abs(-0x8756876876f57f6576f), 0x8756876876f57f6576f, "abs_-_0x");
    }

    #[test]
    fn test_clamp() {
        assert_eq!(MathU128::clamp(0, 10, 100), 10, "clamp_0");
        assert_eq!(MathU128::clamp(10, 10, 100), 10, "clamp_10");
        assert_eq!(MathU128::clamp(50, 10, 100), 50, "clamp_50");
        assert_eq!(MathU128::clamp(100, 10, 100), 100, "clamp_100");
        assert_eq!(MathU128::clamp(101, 10, 100), 100, "clamp_101");
    }

    #[test]
    fn test_sub() {
        assert_eq!(MathU8::sub(10, 0), 10, "sub_10_0");
        assert_eq!(MathU8::sub(10, 2), 8, "sub_10_2");
        assert_eq!(MathU8::sub(10, 9), 1, "sub_10_9");
        assert_eq!(MathU8::sub(10, 10), 0, "sub_10_10");
        assert_eq!(MathU8::sub(10, 11), 0, "sub_10_11");
        assert_eq!(MathU8::sub(10, 255), 0, "sub_10_155");
        let mut v: u8 = 10; v.subi(0);
        assert_eq!(v, 10, "subi_10_0");
        let mut v: u8 = 10; v.subi(2);
        assert_eq!(v, 8, "subi_10_2");
        let mut v: u8 = 10; v.subi(9);
        assert_eq!(v, 1, "subi_10_9");
        let mut v: u8 = 10; v.subi(10);
        assert_eq!(v, 0, "subi_10_10");
        let mut v: u8 = 10; v.subi(11);
        assert_eq!(v, 0, "subi_10_11");
        let mut v: u8 = 10; v.subi(255);
        assert_eq!(v, 0, "subi_10_155");
    }

    #[test]
    fn test_add() {
        assert_eq!(MathU8::add(10, 0), 10, "add_10_0");
        assert_eq!(MathU8::add(10, 2), 12, "add_10_2");
        assert_eq!(MathU8::add(10, -2), 8, "add_10_-2");
        assert_eq!(MathU8::add(10, -10), 0, "add_10_-10");
        assert_eq!(MathU8::add(10, 15), 25, "add_10_15");
        assert_eq!(MathU8::add(10, -15), 0, "add_10_-15");
        let mut v: u8 = 10; v.addi(0);
        assert_eq!(v, 10, "addi_10_0");
        let mut v: u8 = 10; v.addi(2);
        assert_eq!(v, 12, "addi_10_2");
        let mut v: u8 = 10; v.addi(-2);
        assert_eq!(v, 8, "addi_10_-2");
        let mut v: u8 = 10; v.addi(-10);
        assert_eq!(v, 0, "addi_10_-10");
        let mut v: u8 = 10; v.addi(15);
        assert_eq!(v, 25, "addi_10_15");
        let mut v: u8 = 10; v.addi(-15);
        assert_eq!(v, 0, "addi_10_-15");
    }

    #[test]
    fn test_percentage() {
        assert_eq!(MathU8::percentage(0, 0), 0, "percent_0_0");
        assert_eq!(MathU8::percentage(1, 0), 0, "percent_1_0");
        assert_eq!(MathU8::percentage(100, 0), 0, "percent_100_0");
        assert_eq!(MathU8::percentage(255, 0), 0, "percent_255_0");
        assert_eq!(MathU8::percentage(0, 100), 0, "percent_0_100");
        assert_eq!(MathU8::percentage(1, 100), 1, "percent_1_100");
        assert_eq!(MathU8::percentage(100, 100), 100, "percent_100_100");
        assert_eq!(MathU8::percentage(255, 100), 255, "percent_255_100");
        assert_eq!(MathU8::percentage(200, 10), 20, "percent_200_10");
        assert_eq!(MathU8::percentage(200, 50), 100, "percent_200_50");
        assert_eq!(MathU8::percentage(50, 50), 25, "percent_50_50");
    }

    #[test]
    fn test_map_u8() {
        assert_eq!(MathU8::map(0, 1, 5, 20, 40), 20, "map_0_clamped");
        assert_eq!(MathU8::map(1, 1, 5, 20, 40), 20, "map_1");
        assert_eq!(MathU8::map(2, 1, 5, 20, 40), 25, "map_2");
        assert_eq!(MathU8::map(3, 1, 5, 20, 40), 30, "map_3");
        assert_eq!(MathU8::map(4, 1, 5, 20, 40), 35, "map_4");
        assert_eq!(MathU8::map(5, 1, 5, 20, 40), 40, "map_5");
        assert_eq!(MathU8::map(6, 1, 5, 20, 40), 40, "map_6_clamped");
        // output values can be inverted
        assert_eq!(MathU8::map(1, 1, 5, 40, 20), 40, "map_i_1");
        assert_eq!(MathU8::map(2, 1, 5, 40, 20), 35, "map_i_2");
        assert_eq!(MathU8::map(3, 1, 5, 40, 20), 30, "map_i_3");
        assert_eq!(MathU8::map(4, 1, 5, 40, 20), 25, "map_i_4");
        assert_eq!(MathU8::map(5, 1, 5, 40, 20), 20, "map_i_5");
        // compressed output
        assert_eq!(MathU8::map(10, 10, 50, 1, 5), 1, "map___1");
        assert_eq!(MathU8::map(20, 10, 50, 1, 5), 2, "map___2");
        assert_eq!(MathU8::map(30, 10, 50, 1, 5), 3, "map___3");
        assert_eq!(MathU8::map(40, 10, 50, 1, 5), 4, "map___4");
        assert_eq!(MathU8::map(50, 10, 50, 1, 5), 5, "map___5");
        // bad cases
        assert_eq!(MathU8::map(1, 1, 100, 1, 50), 1, "map_bad_1");
        assert_eq!(MathU8::map(20, 1, 100, 1, 50), 10, "map_bad_20");
        assert_eq!(MathU8::map(40, 1, 100, 1, 50), 20, "map_bad_40");
        assert_eq!(MathU8::map(60, 1, 100, 1, 50), 30, "map_bad_60");
        assert_eq!(MathU8::map(80, 1, 100, 1, 50), 40, "map_bad_80");
        assert_eq!(MathU8::map(100, 1, 100, 1, 50), 50, "map_bad_100");
        // precision
        assert_eq!(MathU8::map(0, 0, 6, 10, 30), 10, "prec_0");
        assert_eq!(MathU8::map(1, 0, 6, 10, 30), 13, "prec_1");
        assert_eq!(MathU8::map(2, 0, 6, 10, 30), 16, "prec_2");
        assert_eq!(MathU8::map(3, 0, 6, 10, 30), 20, "prec_3");
        assert_eq!(MathU8::map(4, 0, 6, 10, 30), 23, "prec_4");
        assert_eq!(MathU8::map(5, 0, 6, 10, 30), 26, "prec_5");
        assert_eq!(MathU8::map(6, 0, 6, 10, 30), 30, "prec_6");
        // precision inv
        assert_eq!(MathU8::map(10, 10, 30, 0, 6), 0, "prec_i_0");
        assert_eq!(MathU8::map(14, 10, 30, 0, 6), 1, "prec_i_1");
        assert_eq!(MathU8::map(17, 10, 30, 0, 6), 2, "prec_i_2");
        assert_eq!(MathU8::map(20, 10, 30, 0, 6), 3, "prec_i_3");
        assert_eq!(MathU8::map(24, 10, 30, 0, 6), 4, "prec_i_4");
        assert_eq!(MathU8::map(27, 10, 30, 0, 6), 5, "prec_i_5");
        assert_eq!(MathU8::map(30, 10, 30, 0, 6), 6, "prec_i_6");
        // no gaps
        assert_eq!(MathU8::map(1, 5, 5, 1, 50), 1, "edge_in_1");      // under is in
        assert_eq!(MathU8::map(5, 5, 5, 1, 50), 1, "edge_in_5");      // any is in
        assert_eq!(MathU8::map(10, 5, 5, 1, 50), 50, "edge_in_10");   // over is max
        assert_eq!(MathU8::map(1, 3, 8, 20, 20), 20, "edge_out_1");
        assert_eq!(MathU8::map(3, 3, 8, 20, 20), 20, "edge_out_3");
        assert_eq!(MathU8::map(5, 3, 8, 20, 20), 20, "edge_out_5");
        assert_eq!(MathU8::map(8, 3, 8, 20, 20), 20, "edge_out_8");
        assert_eq!(MathU8::map(10, 3, 8, 20, 20), 20, "edge_out_10");
    }

    #[test]
    fn test_map_u128() {
        let wei: u256 = CONST::ETH_TO_WEI;
        let map_up_u256: u256 = MathU256::map(1 * wei, 0, 100 * wei, 0, 500_000 * wei);
        let map_up_u128: u128 = MathU128::map(1 * wei.low, 0, 100 * wei.low, 0, 500_000 * wei.low);
        let map_down_u256: u256 = MathU256::map(5_000 * wei, 0, 500_000 * wei, 0, 100 * wei);
        let map_down_u128: u128 = MathU128::map(5_000 * wei.low, 0, 500_000 * wei.low, 0, 100 * wei.low);
        assert_eq!(map_up_u256, 5_000 * wei, "u256: 1 > 5_000");
        assert_eq!(map_up_u128, 5_000 * wei.low, "u128: 1 > 5_000");
        assert_eq!(map_down_u256, 1 * wei, "u256: 5_000 > 1");
        assert_eq!(map_down_u128, 1 * wei.low, "u128: 5_000 > 1");
        let scale_up_u256: u256 = MathU256::scale(1 * wei, 100 * wei, 500_000 * wei);
        let scale_up_u128: u128 = MathU128::scale(1 * wei.low, 100 * wei.low, 500_000 * wei.low);
        let scale_down_u256: u256 = MathU256::scale(5_000 * wei, 500_000 * wei, 100 * wei);
        let scale_down_u128: u128 = MathU128::scale(5_000 * wei.low, 500_000 * wei.low, 100 * wei.low);
        assert_eq!(map_up_u256, scale_up_u256, "scale_up_u256");
        assert_eq!(map_up_u128, scale_up_u128, "scale_up_u128");
        assert_eq!(map_down_u256, scale_down_u256, "scale_down_u256");
        assert_eq!(map_down_u128, scale_down_u128, "scale_down_u128");
    }

    #[test]
    fn test_gdc() {
        assert_eq!(MathU8::gdc(4, 4), 4, "gdc_4_4");
        assert_eq!(MathU8::gdc(4, 2), 2, "gdc_4_2");
        assert_eq!(MathU8::gdc(2, 4), 2, "gdc_2_4");
        assert_eq!(MathU8::gdc(4, 1), 1, "gdc_4_1");
        assert_eq!(MathU8::gdc(1, 4), 1, "gdc_1_4");
        assert_eq!(MathU8::gdc(6, 3), 3, "gdc_6_3");
        assert_eq!(MathU8::gdc(40, 2), 2, "gdc_40_2");
        assert_eq!(MathU8::gdc(40, 16), 8, "gdc_40_16");
        assert_eq!(MathU8::gdc(24, 36), 12, "gdc_24_36");
    }

    #[test]
    fn test_pow() {
        assert_eq!(MathU128::pow(0,0), 1, "test_math_pow_0,0");
        assert_eq!(MathU128::pow(0,1), 0, "test_math_pow_0,1");
        assert_eq!(MathU128::pow(0,2), 0, "test_math_pow_0,2");
        assert_eq!(MathU128::pow(0,8), 0, "test_math_pow_0,8");
        assert_eq!(MathU128::pow(1,0), 1, "test_math_pow_1,0");
        assert_eq!(MathU128::pow(1,1), 1, "test_math_pow_1,1");
        assert_eq!(MathU128::pow(1,2), 1, "test_math_pow_1,2");
        assert_eq!(MathU128::pow(1,8), 1, "test_math_pow_1,8");
        assert_eq!(MathU128::pow(2,0), 1, "test_math_pow_2,0");
        assert_eq!(MathU128::pow(2,1), 2, "test_math_pow_2,1");
        assert_eq!(MathU128::pow(2,2), 4, "test_math_pow_2,2");
        assert_eq!(MathU128::pow(2,8), 256, "test_math_pow_2,8");
        assert_eq!(MathU128::pow(10,0), 1, "test_math_pow_10,0");
        assert_eq!(MathU128::pow(10,1), 10, "test_math_pow_10,1");
        assert_eq!(MathU128::pow(10,2), 100, "test_math_pow_10,2");
        assert_eq!(MathU128::pow(10,8), 100_000_000, "test_math_pow_10,8");
    }

    #[test]
    fn test_to_short_string_u32() {
        assert_eq!(0_u32.to_short_string(), '0', "not 0");
        assert_eq!(1_u32.to_short_string(), '1', "not 1");
        assert_eq!(01_u32.to_short_string(), '1', "not 01");
        assert_eq!(12_u32.to_short_string(), '12', "not 12");
        assert_eq!(123_u32.to_short_string(), '123', "not 123");
        assert_eq!(10_u32.to_short_string(), '10', "not 10");
        assert_eq!(100_u32.to_short_string(), '100', "not 100");
        assert_eq!(1001_u32.to_short_string(), '1001', "not 1001");
        assert_eq!(1234567890_u32.to_short_string(), '1234567890', "not 1234567890");
        assert_eq!(01234567890_u32.to_short_string(), '1234567890', "not 01234567890");
        assert_ne!(BITWISE::MAX_U32.to_short_string(), 0, "any u32 should be safe");
        assert_ne!(BITWISE::MAX_U16.to_short_string(), 0, "any u16 should be safe");
        assert_ne!(BITWISE::MAX_U8.to_short_string(), 0, "any u8 should be safe");
    }

    #[test]
    fn test_to_short_string_u64() {
        assert_eq!(0_u64.to_short_string(), '0', "not 0");
        assert_eq!(1_u64.to_short_string(), '1', "not 1");
        assert_eq!(01_u64.to_short_string(), '1', "not 01");
        assert_eq!(12_u64.to_short_string(), '12', "not 12");
        assert_eq!(123_u64.to_short_string(), '123', "not 123");
        assert_eq!(10_u64.to_short_string(), '10', "not 10");
        assert_eq!(100_u64.to_short_string(), '100', "not 100");
        assert_eq!(1001_u64.to_short_string(), '1001', "not 1001");
        assert_eq!(1234567890_u64.to_short_string(), '1234567890', "not 1234567890");
        assert_eq!(01234567890_u64.to_short_string(), '1234567890', "not 01234567890");
        assert_eq!(18446744073709551615_u64.to_short_string(), '18446744073709551615', "not 18446744073709551615");
        assert_ne!(BITWISE::MAX_U64.to_short_string(), 0, "any u64 should be safe");
    }

    #[test]
    fn test_to_short_string_u128() {
        assert_eq!(1234567890_u128.to_short_string(), '1234567890', "not 1234567890");
        assert_eq!(1234567890123456789012345678901_u128.to_short_string(), '1234567890123456789012345678901', "1234567890123456789012345678901");
        assert_eq!(MAX_SHORT_STRING_NUMBER.to_short_string(), '9999999999999999999999999999999', "9999999999999999999999999999999");
    }

    #[test]
    #[should_panic(expected:('to_short_string(u128) Overflow',))]
    fn test_to_short_string_overflow_u128() {
        let v: u128 = (MAX_SHORT_STRING_NUMBER + 1).into();
        v.to_short_string(); // panic!
    }
    #[test]
    #[should_panic(expected:('to_short_string(u256) Overflow',))]
    fn test_to_short_string_overflow_u256() {
        let v: u256 = (MAX_SHORT_STRING_NUMBER + 1).into();
        v.to_short_string(); // panic!
    }
}
