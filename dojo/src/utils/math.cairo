
trait MathTrait<T> {
    fn min(v1: T, v2: T) -> T;
    fn max(v1: T, v2: T) -> T;
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
    use pistols::utils::string::{String};
    use pistols::utils::math::{MathU128};

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
}
