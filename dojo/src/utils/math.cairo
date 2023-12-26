
trait MathTrait<T> {
    fn min(v1: T, v2: T) -> T;
    fn max(v1: T, v2: T) -> T;
    fn map(v: T, in_min: T, in_max: T, out_min: T, out_max: T) -> T;
    fn pow(base: T, exp: T) -> T;
    fn squaredDistance(x1: T, y1: T, x2: T, y2: T) -> T;
}

impl MathU8 of MathTrait<u8> {
    fn min(v1: u8, v2: u8) -> u8 {
        if (v1 < v2) { (v1) } else { (v2) }
    }
    fn max(v1: u8, v2: u8) -> u8 {
        if (v1 > v2) { (v1) } else { (v2) }
    }

    fn map(v: u8, in_min: u8, in_max: u8, out_min: u8, out_max: u8) -> u8 {
        if (out_min > out_max) { 
            (out_min - MathU8::map(v, in_min, in_max, 0, out_min - out_max))
        } else {
            (out_min + (((out_max - out_min) / (in_max - in_min)) * (v - in_min)))
        }
    }

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
    fn min(v1: u16, v2: u16) -> u16 {
        if (v1 < v2) { (v1) } else { (v2) }
    }
    fn max(v1: u16, v2: u16) -> u16 {
        if (v1 > v2) { (v1) } else { (v2) }
    }

    fn map(v: u16, in_min: u16, in_max: u16, out_min: u16, out_max: u16) -> u16 {
        if (out_min > out_max) { 
            (out_min - MathU16::map(v, in_min, in_max, 0, out_min - out_max))
        } else {
            (out_min + (((out_max - out_min) / (in_max - in_min)) * (v - in_min)))
        }
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
    fn min(v1: u32, v2: u32) -> u32 {
        if (v1 < v2) { (v1) } else { (v2) }
    }
    fn max(v1: u32, v2: u32) -> u32 {
        if (v1 > v2) { (v1) } else { (v2) }
    }

    fn map(v: u32, in_min: u32, in_max: u32, out_min: u32, out_max: u32) -> u32 {
        if (out_min > out_max) { 
            (out_min - MathU32::map(v, in_min, in_max, 0, out_min - out_max))
        } else {
            (out_min + (((out_max - out_min) / (in_max - in_min)) * (v - in_min)))
        }
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
    fn min(v1: u64, v2: u64) -> u64 {
        if (v1 < v2) { (v1) } else { (v2) }
    }
    fn max(v1: u64, v2: u64) -> u64 {
        if (v1 > v2) { (v1) } else { (v2) }
    }

    fn map(v: u64, in_min: u64, in_max: u64, out_min: u64, out_max: u64) -> u64 {
        if (out_min > out_max) { 
            (out_min - MathU64::map(v, in_min, in_max, 0, out_min - out_max))
        } else {
            (out_min + (((out_max - out_min) / (in_max - in_min)) * (v - in_min)))
        }
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
    fn min(v1: u128, v2: u128) -> u128 {
        if (v1 < v2) { (v1) } else { (v2) }
    }
    fn max(v1: u128, v2: u128) -> u128 {
        if (v1 > v2) { (v1) } else { (v2) }
    }

    fn map(v: u128, in_min: u128, in_max: u128, out_min: u128, out_max: u128) -> u128 {
        if (out_min > out_max) { 
            (out_min - MathU128::map(v, in_min, in_max, 0, out_min - out_max))
        } else {
            (out_min + (((out_max - out_min) / (in_max - in_min)) * (v - in_min)))
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
    fn min(v1: u256, v2: u256) -> u256 {
        if (v1 < v2) { (v1) } else { (v2) }
    }
    fn max(v1: u256, v2: u256) -> u256 {
        if (v1 > v2) { (v1) } else { (v2) }
    }

    fn map(v: u256, in_min: u256, in_max: u256, out_min: u256, out_max: u256) -> u256 {
        if (out_min > out_max) { 
            (out_min - MathU256::map(v, in_min, in_max, 0, out_min - out_max))
        } else {
            (out_min + (((out_max - out_min) / (in_max - in_min)) * (v - in_min)))
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
    use pistols::utils::string::{String};
    use pistols::utils::math::{MathU8,MathU128};

    #[test]
    #[available_gas(100_000_000)]
    fn test_math_min_max() {
        assert(MathU128::min(0,0) == 0, String::concat('min', '0,0'));
        assert(MathU128::min(0,1) == 0, String::concat('min', '0,1'));
        assert(MathU128::min(1,0) == 0, String::concat('min', '1,0'));
        assert(MathU128::min(1,2) == 1, String::concat('min', '1,2'));
        assert(MathU128::min(2,1) == 1, String::concat('min', '2,1'));

        assert(MathU128::max(0,0) == 0, String::concat('max', '0,0'));
        assert(MathU128::max(0,1) == 1, String::concat('max', '0,1'));
        assert(MathU128::max(1,0) == 1, String::concat('max', '1,0'));
        assert(MathU128::max(1,2) == 2, String::concat('max', '1,2'));
        assert(MathU128::max(2,1) == 2, String::concat('max', '2,1'));
    }

    #[test]
    #[available_gas(100_000_000)]
    fn test_math_pow() {
        assert(MathU128::pow(0,0) == 1, String::concat('test_math_pow', '0,0'));
        assert(MathU128::pow(0,1) == 0, String::concat('test_math_pow', '0,1'));
        assert(MathU128::pow(0,2) == 0, String::concat('test_math_pow', '0,2'));
        assert(MathU128::pow(0,8) == 0, String::concat('test_math_pow', '0,8'));
        assert(MathU128::pow(1,0) == 1, String::concat('test_math_pow', '1,0'));
        assert(MathU128::pow(1,1) == 1, String::concat('test_math_pow', '1,1'));
        assert(MathU128::pow(1,2) == 1, String::concat('test_math_pow', '1,2'));
        assert(MathU128::pow(1,8) == 1, String::concat('test_math_pow', '1,8'));
        assert(MathU128::pow(2,0) == 1, String::concat('test_math_pow', '2,0'));
        assert(MathU128::pow(2,1) == 2, String::concat('test_math_pow', '2,1`'));
        assert(MathU128::pow(2,2) == 4, String::concat('test_math_pow', '2,2'));
        assert(MathU128::pow(2,8) == 256, String::concat('test_math_pow', '2,8'));
        assert(MathU128::pow(10,0) == 1, String::concat('test_math_pow', '10,0'));
        assert(MathU128::pow(10,1) == 10, String::concat('test_math_pow', '10,1`'));
        assert(MathU128::pow(10,2) == 100, String::concat('test_math_pow', '10,2'));
        assert(MathU128::pow(10,8) == 100_000_000, String::concat('test_math_pow', '10,8'));
    }

    #[test]
    #[available_gas(100_000_000)]
    fn test_math_map() {
        assert(MathU8::map(1, 1, 5, 20, 40) == 20, String::concat('map', '1'));
        assert(MathU8::map(2, 1, 5, 20, 40) == 25, String::concat('map', '2'));
        assert(MathU8::map(3, 1, 5, 20, 40) == 30, String::concat('map', '3'));
        assert(MathU8::map(4, 1, 5, 20, 40) == 35, String::concat('map', '4'));
        assert(MathU8::map(5, 1, 5, 20, 40) == 40, String::concat('map', '5'));
        // output values can be inverted
        assert(MathU8::map(1, 1, 5, 40, 20) == 40, String::concat('map', 'i_1'));
        assert(MathU8::map(2, 1, 5, 40, 20) == 35, String::concat('map', 'i_2'));
        assert(MathU8::map(3, 1, 5, 40, 20) == 30, String::concat('map', 'i_3'));
        assert(MathU8::map(4, 1, 5, 40, 20) == 25, String::concat('map', 'i_4'));
        assert(MathU8::map(5, 1, 5, 40, 20) == 20, String::concat('map', 'i_5'));
    }
}
