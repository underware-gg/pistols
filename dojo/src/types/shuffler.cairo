use pistols::utils::bitwise::{BitwiseU256};
use pistols::utils::misc::{FeltToLossy};

//
// shuffle max 42 ids, from 1 to size
// by dividing a u256 into 42 6-bits slots
// based on EuclidShuffle.sol (Fisher–Yates shuffle)
// https://github.com/rsodre/cc-euclid/blob/main/contracts/EuclidShuffle.sol
//

// ...but why 6 bits? it fits more ids into a felt252
// 5 bits > range 0-31 = 160 bits : 50 felt252 slots / 51 u256 slots
// 6 bits > range 0-63 = 189 bits : 42 felt252 slots / 42 u256 slots
// 7 bits > range 0-127 = 889 bits : 36 felt252 slots / 36 u256 slots

#[derive(Copy, Drop, Serde)]
pub struct Shuffler {
    pub ids: u256,      // 1..MAX
    pub size : usize,
    pub pos : usize,
    pub mocked: bool,   // for testing
}

#[generate_trait]
pub impl ShufflerImpl of ShufflerTrait {
    const MAX: u8 = 42;
    const BITS: usize = 6;
    const MASK: u256 = 0b111111;

	// size is the total number of Ids to be suffled
	// allows get_next() to be called <size> times
    fn new(size: u8, mocked: bool) -> Shuffler {
        assert(size <= Self::MAX, 'SHUFFLE: too many elements');
        (Shuffler {
            ids: 0,
            size: size.into(),
            pos: 0,
            mocked,
        })
    }

	// Return next shuffled id
	// Ids keys and values range from 1..size
	// Returns 0 when all ids have been used
    fn get_next(ref self: Shuffler, seed: felt252) -> u8 {
        // no more ids available
		if (self.pos == self.size) { return 0; }
        // get next pos
		self.pos += 1;
        // seed contains mocked values
        if (self.mocked) { return (seed.into() & Self::MASK).try_into().unwrap(); }
        // only 1 id was shuffled
		if (self.size == 1) { return 1; }
        // it is the last id
		if (self.pos == self.size) { return self.get_id(self.pos).try_into().unwrap(); }
        // get random pos
        let rnd: usize = self.pos + (seed.to_usize_lossy() % (self.size - self.pos)).try_into().unwrap();
		// swap for current position
		let swap_pos: usize = rnd + 1;
        let swap_id: u256 = self.get_id(swap_pos);
        let pos_id: u256 = self.get_id(self.pos);
		let new_id: u256 = if (swap_id > 0) {swap_id} else {swap_pos.into()};
		self.set_id(swap_pos, if (pos_id > 0) {pos_id} else {self.pos.into()});
		self.set_id(self.pos, new_id.into());
		(new_id.try_into().unwrap())
    }

    // #[inline(always)]
    fn get_id(ref self: Shuffler, pos: usize) -> u256 {
        let index = pos - 1;
        let mask: u256 = BitwiseU256::shl(Self::MASK, index * Self::BITS);
        (BitwiseU256::shr(self.ids & mask, index * Self::BITS))
    }

    fn set_id(ref self: Shuffler, pos: usize, mut value: u256) {
        let index = pos - 1;
        let mask: u256 = ~BitwiseU256::shl(Self::MASK, index * Self::BITS);
        value = BitwiseU256::shl(value, index * Self::BITS);
        self.ids = (self.ids & mask) | value;
    }

    // convert an array of values into a mocked seed
    fn mock_to_seed(values: Span<felt252>) -> felt252 {
        let mut result: u256 = 0;
        let mut index: usize = 0;
        while (index < values.len()) {
            let v: u256 = (*values[index]).into();
            result = result | BitwiseU256::shl(v, Self::BITS * index);
            index += 1;
        };
        result += 1; // rng_mock::reseed() will subtract 1
        (result.try_into().unwrap())
    }
}


//----------------------------------------
// Unit  tests
//
#[cfg(test)]
mod tests {
    use super::{Shuffler, ShufflerTrait};

    fn _fact(value: usize) -> usize {
        let mut result: usize = 0;
        let mut n = 1;
        while (n <= value) {
            result += n;
            n += 1;
        };
        (result)
    }

    #[test]
    fn test_factorial() {
        assert_eq!(_fact(0), 0, "fact_0");
        assert_eq!(_fact(1), 1, "fact_1");
        assert_eq!(_fact(2), 3, "fact_2");
        assert_eq!(_fact(3), 6, "fact_3");
        assert_eq!(_fact(4), 10, "fact_4");
        assert_eq!(_fact(5), 15, "fact_5");
    }
    
    fn _test_shuffler(size: u8) {
        let mut shuffler: Shuffler = ShufflerTrait::new(size.into(), false);
        let mut seed: u256 = size.into();
        let mut sum: usize = 0;
        let mut n: u8 = 1;
        while (n <= size) {
            seed = core::pedersen::pedersen(seed.low.into(), seed.high.into()).into();
            let id: u8 = shuffler.get_next((seed & 0xff).try_into().unwrap());
            assert_ge!(id, 1, "id >= 1");
            assert_le!(id, size, "id <= size");
            sum += id.into();
            n += 1;
        };
        let not_id: u8 = shuffler.get_next(99);
        assert_eq!(not_id, 0, "not_id");
        assert_eq!(sum, _fact(size.into()), "factorial");
    }

    #[test]
    fn test_shuffler_0() { _test_shuffler(0) }

    #[test]
    fn test_shuffler_1() { _test_shuffler(1) }

    #[test]
    fn test_shuffler_2() { _test_shuffler(2) }

    #[test]
    fn test_shuffler_3() { _test_shuffler(3) }

    #[test]
    fn test_shuffler_4() { _test_shuffler(4) }

    #[test]
    fn test_shuffler_5() { _test_shuffler(5) }

    #[test]
    fn test_shuffler_10() { _test_shuffler(10) }

    #[test]
    fn test_shuffler_42() { _test_shuffler(42) }

    #[test]
    #[should_panic(expected:('SHUFFLE: too many elements',))]
    fn test_shuffler_43() { _test_shuffler(43) }
}
