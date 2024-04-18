// use debug::PrintTrait;

trait MathTrait<T> {
    // returns minimum value
    fn min(a: T, b: T) -> T;
    // returns maximum value
    fn max(a: T, b: T) -> T;
    // returns a value clamped between min and max
    fn clamp(v: T, min: T, max: T) -> T;
    // safe subtraction
    fn sub(a: T, b: T) -> T;
    // returns GDC of two numbers
    fn gdc(a: T, b: T) -> T;
    // map a value form one range to another
    fn map(v: T, in_min: T, in_max: T, out_min: T, out_max: T) -> T;
    // power
    fn pow(base: T, exp: T) -> T;
    // quared distance in 2D space
    fn squaredDistance(x1: T, y1: T, x2: T, y2: T) -> T;
}

impl MathU8 of MathTrait<u8> {
    fn min(a: u8, b: u8) -> u8 {
        if (a < b) { (a) } else { (b) }
    }
    fn max(a: u8, b: u8) -> u8 {
        if (a > b) { (a) } else { (b) }
    }
    fn clamp(v: u8, min: u8, max: u8) -> u8 {
        if (v < min) { (min) } else if (v > max) { (max) } else { (v) }
    }

    fn sub(a: u8, b: u8) -> u8 {
        if (b >= a) { (0) } else { (a - b) }
    }

    fn gdc(mut a: u8, mut b: u8) -> u8 {
        // recursive (not fastest)
        // if (b == 0) { (a) } else { (MathU8::gdc(b, a % b)) }
        // iterative: https://stackoverflow.com/a/17445322/360930
        if (b > a) { return MathU8::gdc(b, a); }
        let mut result: u8 = 0;
        loop {
            if (b == 0) { result = a; break; }
            a = a % b;
            if (a == 0) { result = b; break; }
            b = b % a;
        };
        (result)
    }

    fn map(v: u8, in_min: u8, in_max: u8, out_min: u8, out_max: u8) -> u8 {
        let result: u128 = MathU128::map(v.into(), in_min.into(), in_max.into(), out_min.into(), out_max.into());
        (result.try_into().unwrap())
    }
    // fn map(v: u8, in_min: u8, in_max: u8, out_min: u8, out_max: u8) -> u8 {
    //     if (out_min > out_max) { 
    //         (out_min - MathU8::map(v, in_min, in_max, 0, out_min - out_max))
    //     } else {
    //         (out_min + (((out_max - out_min) / (in_max - in_min)) * (v - in_min)))
    //     }
    // }
    // fn map(v: u8, in_min: u8, in_max: u8, out_min: u8, out_max: u8) -> u8 {
    //     if (out_min > out_max) { 
    //         (out_min - MathU8::map(v, in_min, in_max, 0, out_min - out_max))
    //     } else {
    //         let mut d = (in_max - in_min);
    //         let mut c = (v - in_min);
    //         let gdc = MathU8::gdc(d, c);
    //         if (gdc > 1) {
    //             d /= gdc;
    //             c /= gdc;
    //         }
    //         let x = ((out_max - out_min) / d) * c;
    //         (out_min + x)
    //         // (out_min + (((out_max - out_min) / (in_max - in_min)) * (v - in_min)))
    //     }
    // }

    fn pow(base: u8, exp: u8) -> u8 {
        if exp == 0 { 1 }
        else if exp == 1 { base }
        else if exp % 2 == 0 { MathU8::pow(base * base, exp / 2) }
        else { base * MathU8::pow(base * base, (exp - 1) / 2) }
    }

    fn squaredDistance(x1: u8, y1: u8, x2: u8, y2: u8) -> u8 {
        let dx = if (x1 > x2) { (x1 - x2) } else { (x2 - x1) };
        let dy = if (y1 > y2) { (y1 - y2) } else { (y2 - y1) };
        (dx * dx + dy * dy)
    }
}

impl MathU16 of MathTrait<u16> {
    fn min(a: u16, b: u16) -> u16 {
        if (a < b) { (a) } else { (b) }
    }
    fn max(a: u16, b: u16) -> u16 {
        if (a > b) { (a) } else { (b) }
    }
    fn clamp(v: u16, min: u16, max: u16) -> u16 {
        if (v < min) { (min) } else if (v > max) { (max) } else { (v) }
    }

    fn sub(a: u16, b: u16) -> u16 {
        if (b >= a) { (0) } else { (a - b) }
    }

    fn gdc(a: u16, b: u16) -> u16 {
        // recursive (not fastest)
        if (b == 0) { (a) } else { (MathU16::gdc(b, a % b)) }
    }

    fn map(v: u16, in_min: u16, in_max: u16, out_min: u16, out_max: u16) -> u16 {
        let result: u128 = MathU128::map(v.into(), in_min.into(), in_max.into(), out_min.into(), out_max.into());
        (result.try_into().unwrap())
    }

    fn pow(base: u16, exp: u16) -> u16 {
        if exp == 0 { 1 }
        else if exp == 1 { base }
        else if exp % 2 == 0 { MathU16::pow(base * base, exp / 2) }
        else { base * MathU16::pow(base * base, (exp - 1) / 2) }
    }

    fn squaredDistance(x1: u16, y1: u16, x2: u16, y2: u16) -> u16 {
        let dx = if (x1 > x2) { (x1 - x2) } else { (x2 - x1) };
        let dy = if (y1 > y2) { (y1 - y2) } else { (y2 - y1) };
        (dx * dx + dy * dy)
    }
}

impl MathU32 of MathTrait<u32> {
    fn min(a: u32, b: u32) -> u32 {
        if (a < b) { (a) } else { (b) }
    }
    fn max(a: u32, b: u32) -> u32 {
        if (a > b) { (a) } else { (b) }
    }
    fn clamp(v: u32, min: u32, max: u32) -> u32 {
        if (v < min) { (min) } else if (v > max) { (max) } else { (v) }
    }

    fn sub(a: u32, b: u32) -> u32 {
        if (b >= a) { (0) } else { (a - b) }
    }

    fn gdc(a: u32, b: u32) -> u32 {
        if (b == 0) { (a) } else { (MathU32::gdc(b, a % b)) }
    }

    fn map(v: u32, in_min: u32, in_max: u32, out_min: u32, out_max: u32) -> u32 {
        let result: u128 = MathU128::map(v.into(), in_min.into(), in_max.into(), out_min.into(), out_max.into());
        (result.try_into().unwrap())
    }

    fn pow(base: u32, exp: u32) -> u32 {
        if exp == 0 { 1 }
        else if exp == 1 { base }
        else if exp % 2 == 0 { MathU32::pow(base * base, exp / 2) }
        else { base * MathU32::pow(base * base, (exp - 1) / 2) }
    }

    fn squaredDistance(x1: u32, y1: u32, x2: u32, y2: u32) -> u32 {
        let dx = if (x1 > x2) { (x1 - x2) } else { (x2 - x1) };
        let dy = if (y1 > y2) { (y1 - y2) } else { (y2 - y1) };
        (dx * dx + dy * dy)
    }
}

impl MathU64 of MathTrait<u64> {
    fn min(a: u64, b: u64) -> u64 {
        if (a < b) { (a) } else { (b) }
    }
    fn max(a: u64, b: u64) -> u64 {
        if (a > b) { (a) } else { (b) }
    }
    fn clamp(v: u64, min: u64, max: u64) -> u64 {
        if (v < min) { (min) } else if (v > max) { (max) } else { (v) }
    }

    fn sub(a: u64, b: u64) -> u64 {
        if (b >= a) { (0) } else { (a - b) }
    }

    fn gdc(a: u64, b: u64) -> u64 {
        if (b == 0) { (a) } else { (MathU64::gdc(b, a % b)) }
    }

    fn map(v: u64, in_min: u64, in_max: u64, out_min: u64, out_max: u64) -> u64 {
        let result: u128 = MathU128::map(v.into(), in_min.into(), in_max.into(), out_min.into(), out_max.into());
        (result.try_into().unwrap())
    }

    fn pow(base: u64, exp: u64) -> u64 {
        if exp == 0 { 1 }
        else if exp == 1 { base }
        else if exp % 2 == 0 { MathU64::pow(base * base, exp / 2) }
        else { base * MathU64::pow(base * base, (exp - 1) / 2) }
    }

    fn squaredDistance(x1: u64, y1: u64, x2: u64, y2: u64) -> u64 {
        let dx = if (x1 > x2) { (x1 - x2) } else { (x2 - x1) };
        let dy = if (y1 > y2) { (y1 - y2) } else { (y2 - y1) };
        (dx * dx + dy * dy)
    }
}

impl MathU128 of MathTrait<u128> {
    fn min(a: u128, b: u128) -> u128 {
        if (a < b) { (a) } else { (b) }
    }
    fn max(a: u128, b: u128) -> u128 {
        if (a > b) { (a) } else { (b) }
    }
    fn clamp(v: u128, min: u128, max: u128) -> u128 {
        if (v < min) { (min) } else if (v > max) { (max) } else { (v) }
    }

    fn sub(a: u128, b: u128) -> u128 {
        if (b >= a) { (0) } else { (a - b) }
    }

    fn gdc(a: u128, b: u128) -> u128 {
        if (b == 0) { (a) } else { (MathU128::gdc(b, a % b)) }
    }

    fn map(v: u128, in_min: u128, in_max: u128, out_min: u128, out_max: u128) -> u128 {
        if (v <= in_min) {
            (out_min)
        } else if (v >= in_max) {
            (out_max)
        } else if (out_min > out_max) { 
            (out_min - MathU128::map(v, in_min, in_max, 0, out_min - out_max))
        } else {
            (out_min + ((((v * 1_000_000 - in_min * 1_000_000) / (in_max - in_min)) * (out_max - out_min)) / 1_000_000))
        }
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
        else if exp % 2 == 0 { MathU128::pow(base * base, exp / 2) }
        else { base * MathU128::pow(base * base, (exp - 1) / 2) }
    }

    fn squaredDistance(x1: u128, y1: u128, x2: u128, y2: u128) -> u128 {
        let dx = if (x1 > x2) { (x1 - x2) } else { (x2 - x1) };
        let dy = if (y1 > y2) { (y1 - y2) } else { (y2 - y1) };
        (dx * dx + dy * dy)
    }
}

impl MathU256 of MathTrait<u256> {
    fn min(a: u256, b: u256) -> u256 {
        if (a < b) { (a) } else { (b) }
    }
    fn max(a: u256, b: u256) -> u256 {
        if (a > b) { (a) } else { (b) }
    }
    fn clamp(v: u256, min: u256, max: u256) -> u256 {
        if (v < min) { (min) } else if (v > max) { (max) } else { (v) }
    }

    fn sub(a: u256, b: u256) -> u256 {
        if (b >= a) { (0) } else { (a - b) }
    }

    fn gdc(a: u256, b: u256) -> u256 {
        if (b == 0) { (a) } else { (MathU256::gdc(b, a % b)) }
    }

    fn map(v: u256, in_min: u256, in_max: u256, out_min: u256, out_max: u256) -> u256 {
        if (v <= in_min) {
            (out_min)
        } else if (v >= in_max) {
            (out_max)
        } else if (out_min > out_max) { 
            (out_min - MathU256::map(v, in_min, in_max, 0, out_min - out_max))
        } else {
            (out_min + ((((v * 1_000_000 - in_min * 1_000_000) / (in_max - in_min)) * (out_max - out_min)) / 1_000_000))
        }
    }

    fn pow(base: u256, exp: u256) -> u256 {
        if exp == 0 { 1 }
        else if exp == 1 { base }
        else if exp % 2 == 0 { MathU256::pow(base * base, exp / 2) }
        else { base * MathU256::pow(base * base, (exp - 1) / 2) }
    }

    fn squaredDistance(x1: u256, y1: u256, x2: u256, y2: u256) -> u256 {
        let dx = if (x1 > x2) { (x1 - x2) } else { (x2 - x1) };
        let dy = if (y1 > y2) { (y1 - y2) } else { (y2 - y1) };
        (dx * dx + dy * dy)
    }
}


//----------------------------------------
// Unit  tests
//
#[cfg(test)]
mod tests {
    use debug::PrintTrait;
    use pistols::utils::math::{MathU8,MathU16,MathU32,MathU128};

    #[test]
    #[available_gas(100_000_000)]
    fn test_min_max() {
        assert(MathU128::min(0,0) == 0, 'min_0,0');
        assert(MathU128::min(0,1) == 0, 'min_0,1');
        assert(MathU128::min(1,0) == 0, 'min_1,0');
        assert(MathU128::min(1,2) == 1, 'min_1,2');
        assert(MathU128::min(2,1) == 1, 'min_2,1');

        assert(MathU128::max(0,0) == 0, 'max_0,0');
        assert(MathU128::max(0,1) == 1, 'max_0,1');
        assert(MathU128::max(1,0) == 1, 'max_1,0');
        assert(MathU128::max(1,2) == 2, 'max_1,2');
        assert(MathU128::max(2,1) == 2, 'max_2,1');
    }

    #[test]
    #[available_gas(100_000_000)]
    fn test_clamp() {
        assert(MathU128::clamp(0, 10, 100) == 10, 'clamp_0');
        assert(MathU128::clamp(10, 10, 100) == 10, 'clamp_10');
        assert(MathU128::clamp(50, 10, 100) == 50, 'clamp_50');
        assert(MathU128::clamp(100, 10, 100) == 100, 'clamp_100');
        assert(MathU128::clamp(101, 10, 100) == 100, 'clamp_101');
    }

    #[test]
    #[available_gas(100_000_000)]
    fn test_sub() {
        assert(MathU8::sub(10, 0) == 10, 'sub_10_0');
        assert(MathU8::sub(10, 2) == 8, 'sub_10_2');
        assert(MathU8::sub(10, 9) == 1, 'sub_10_9');
        assert(MathU8::sub(10, 10) == 0, 'sub_10_10');
        assert(MathU8::sub(10, 11) == 0, 'sub_10_11');
        assert(MathU8::sub(10, 255) == 0, 'sub_10_155');
    }

    #[test]
    #[available_gas(100_000_000)]
    fn test_gdc() {
        assert(MathU8::gdc(4, 4) == 4, 'gdc_4_4');
        assert(MathU8::gdc(4, 2) == 2, 'gdc_4_2');
        assert(MathU8::gdc(2, 4) == 2, 'gdc_2_4');
        assert(MathU8::gdc(4, 1) == 1, 'gdc_4_1');
        assert(MathU8::gdc(1, 4) == 1, 'gdc_1_4');
        assert(MathU8::gdc(6, 3) == 3, 'gdc_6_3');
        assert(MathU8::gdc(40, 2) == 2, 'gdc_40_2');
        assert(MathU8::gdc(40, 16) == 8, 'gdc_40_16');
        assert(MathU8::gdc(24, 36) == 12, 'gdc_24_36');
    }

    #[test]
    #[available_gas(100_000_000)]
    fn test_pow() {
        assert(MathU128::pow(0,0) == 1, 'test_math_pow_0,0');
        assert(MathU128::pow(0,1) == 0, 'test_math_pow_0,1');
        assert(MathU128::pow(0,2) == 0, 'test_math_pow_0,2');
        assert(MathU128::pow(0,8) == 0, 'test_math_pow_0,8');
        assert(MathU128::pow(1,0) == 1, 'test_math_pow_1,0');
        assert(MathU128::pow(1,1) == 1, 'test_math_pow_1,1');
        assert(MathU128::pow(1,2) == 1, 'test_math_pow_1,2');
        assert(MathU128::pow(1,8) == 1, 'test_math_pow_1,8');
        assert(MathU128::pow(2,0) == 1, 'test_math_pow_2,0');
        assert(MathU128::pow(2,1) == 2, 'test_math_pow_2,1`');
        assert(MathU128::pow(2,2) == 4, 'test_math_pow_2,2');
        assert(MathU128::pow(2,8) == 256, 'test_math_pow_2,8');
        assert(MathU128::pow(10,0) == 1, 'test_math_pow_10,0');
        assert(MathU128::pow(10,1) == 10, 'test_math_pow_10,1`');
        assert(MathU128::pow(10,2) == 100, 'test_math_pow_10,2');
        assert(MathU128::pow(10,8) == 100_000_000, 'test_math_pow_10,8');
    }

    #[test]
    #[available_gas(100_000_000)]
    fn test_map() {
        assert(MathU8::map(0, 1, 5, 20, 40) == 20, 'map_0_clamped');
        assert(MathU8::map(1, 1, 5, 20, 40) == 20, 'map_1');
        assert(MathU8::map(2, 1, 5, 20, 40) == 25, 'map_2');
        assert(MathU8::map(3, 1, 5, 20, 40) == 30, 'map_3');
        assert(MathU8::map(4, 1, 5, 20, 40) == 35, 'map_4');
        assert(MathU8::map(5, 1, 5, 20, 40) == 40, 'map_5');
        assert(MathU8::map(6, 1, 5, 20, 40) == 40, 'map_6_clamped');
        // output values can be inverted
        assert(MathU8::map(1, 1, 5, 40, 20) == 40, 'map_i_1');
        assert(MathU8::map(2, 1, 5, 40, 20) == 35, 'map_i_2');
        assert(MathU8::map(3, 1, 5, 40, 20) == 30, 'map_i_3');
        assert(MathU8::map(4, 1, 5, 40, 20) == 25, 'map_i_4');
        assert(MathU8::map(5, 1, 5, 40, 20) == 20, 'map_i_5');
        // compressed output
        assert(MathU8::map(10, 10, 50, 1, 5) == 1, 'map___1');
        assert(MathU8::map(20, 10, 50, 1, 5) == 2, 'map___2');
        assert(MathU8::map(30, 10, 50, 1, 5) == 3, 'map___3');
        assert(MathU8::map(40, 10, 50, 1, 5) == 4, 'map___4');
        assert(MathU8::map(50, 10, 50, 1, 5) == 5, 'map___5');
        // bad cases
        assert(MathU8::map(1, 1, 100, 1, 50) == 1, 'map_bad_1');
        assert(MathU8::map(20, 1, 100, 1, 50) == 10, 'map_bad_20');
        assert(MathU8::map(40, 1, 100, 1, 50) == 20, 'map_bad_40');
        assert(MathU8::map(60, 1, 100, 1, 50) == 30, 'map_bad_60');
        assert(MathU8::map(80, 1, 100, 1, 50) == 40, 'map_bad_80');
        assert(MathU8::map(100, 1, 100, 1, 50) == 50, 'map_bad_100');
        // precision
        assert(MathU8::map(0, 0, 6, 10, 30) == 10, 'prec_0');
        assert(MathU8::map(1, 0, 6, 10, 30) == 13, 'prec_1');
        assert(MathU8::map(2, 0, 6, 10, 30) == 16, 'prec_2');
        assert(MathU8::map(3, 0, 6, 10, 30) == 20, 'prec_3');
        assert(MathU8::map(4, 0, 6, 10, 30) == 23, 'prec_4');
        assert(MathU8::map(5, 0, 6, 10, 30) == 26, 'prec_5');
        assert(MathU8::map(6, 0, 6, 10, 30) == 30, 'prec_6');
        // precision inv
        assert(MathU8::map(10, 10, 30, 0, 6) == 0, 'prec_i_0');
        assert(MathU8::map(14, 10, 30, 0, 6) == 1, 'prec_i_1');
        assert(MathU8::map(17, 10, 30, 0, 6) == 2, 'prec_i_2');
        assert(MathU8::map(20, 10, 30, 0, 6) == 3, 'prec_i_3');
        assert(MathU8::map(24, 10, 30, 0, 6) == 4, 'prec_i_4');
        assert(MathU8::map(27, 10, 30, 0, 6) == 5, 'prec_i_5');
        assert(MathU8::map(30, 10, 30, 0, 6) == 6, 'prec_i_6');
        // no gaps
        assert(MathU8::map(1, 5, 5, 1, 50) == 1, 'edge_in_1');      // under is in
        assert(MathU8::map(5, 5, 5, 1, 50) == 1, 'edge_in_5');      // any is in
        assert(MathU8::map(10, 5, 5, 1, 50) == 50, 'edge_in_10');   // over is max
        assert(MathU8::map(1, 3, 8, 20, 20) == 20, 'edge_out_1');
        assert(MathU8::map(3, 3, 8, 20, 20) == 20, 'edge_out_3');
        assert(MathU8::map(5, 3, 8, 20, 20) == 20, 'edge_out_5');
        assert(MathU8::map(8, 3, 8, 20, 20) == 20, 'edge_out_8');
        assert(MathU8::map(10, 3, 8, 20, 20) == 20, 'edge_out_10');
    }
}
