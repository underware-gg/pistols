pub use pistols::systems::rng_mock::{MockedValue, RngWrap, RngWrapTrait};

//--------------------------------
// rng contract
//
#[starknet::interface]
pub trait IRng<TState> {
    fn reseed(self: @TState, seed: felt252, salt: felt252, mocked: Span<MockedValue>) -> felt252;
    fn is_mocked(self: @TState, salt: felt252) -> bool;
}

#[dojo::contract]
pub mod rng {
    use super::IRng;

    use pistols::utils::hash::{hash_values};
    use pistols::systems::rng_mock::{MockedValue};

    #[abi(embed_v0)]
    impl RngImpl of IRng<ContractState> {
        fn reseed(self: @ContractState, seed: felt252, salt: felt252, mocked: Span<MockedValue>) -> felt252 {
            let new_seed: felt252 = hash_values([seed.into(), salt].span());
            (new_seed)
        }
        fn is_mocked(self: @ContractState, salt: felt252) -> bool {
            (false)
        }
    }
}


//--------------------------------
// Public dice trait
//
use core::num::traits::Zero;
use pistols::utils::arrays::{SpanUtilsTrait};

#[derive(Copy, Drop)]
pub struct Dice {
    pub rng: IRngDispatcher,
    pub seed: felt252,
    pub last_dice: u8,
    pub mocked: Span<MockedValue>,
}

#[generate_trait]
pub impl DiceImpl of DiceTrait {
    fn new(wrapped: @RngWrap, initial_seed: felt252) -> Dice {
        (Dice {
            rng: IRngDispatcher{ contract_address: *wrapped.rng_address },
            seed: initial_seed,
            last_dice: 0,
            mocked: (*wrapped.mocked).unwrap_or([].span()),
        })
    }

    // returns a random number between 1 and <faces>
    fn reseed(ref self: Dice, salt: felt252) {
        self.seed = self.rng.reseed(self.seed, salt, self.mocked);
    }

    // returns a random number between 1 and <faces>
    fn throw(ref self: Dice, salt: felt252, faces: u8) -> u8 {
        assert(faces <= 255, 'RNG_DICE: too many faces');
        self.reseed(salt);
        let as_u256: u256 = self.seed.into();
        self.last_dice = ((as_u256.low & 0xff).try_into().unwrap() % faces) + 1;
        (self.last_dice)
    }
    fn throw_decide(ref self: Dice, salt: felt252, faces: u8, chances: u8) -> (u8, bool) {
        let dice: u8 = self.throw(salt, faces);
        let result: bool = (dice <= chances);
        (dice, result)
    }

    // weighted values
    fn throw_weighted_dice(ref self: Dice, salt: felt252, values: Span<u8>, weights: Span<u8>) -> u8 {
        let mut result: u8 = 0;
        let length: usize = core::cmp::min(values.len(), weights.len());
        if (length.is_non_zero()) {
            let mut sum: u8 = weights.sum_range(0, length);
            if (sum.is_non_zero()) {
                let mut dice_value: u8 = self.throw(salt, sum);
                result = Self::_get_weighted_value(values, weights, dice_value);
            }
        }
        (result)
    }
    fn _get_weighted_value(values: Span<u8>, weights: Span<u8>, mut dice_value: u8) -> u8 {
        let mut result: u8 = 0;
        let mut i: usize = 0;
        while (i < weights.len()) {
            let weight: u8 = *weights[i];
            if (dice_value <= weight) {
                result = *values[i];
                break;
            }
            dice_value -= weight;
            i += 1;
        };
        (result)
    }
}


//--------------------------------
// Public deck shuffler trait
//
use pistols::utils::bitwise::{BitwiseU256};
use pistols::types::shuffler::{Shuffler, ShufflerTrait};

#[derive(Copy, Drop)]
pub struct Shuffle {
    pub seed: felt252,
    pub last_card: u8,
    pub shuffler: Shuffler,
}

#[generate_trait]
pub impl ShuffleImpl of ShuffleTrait {
    fn new(wrapped: @RngWrap, initial_seed: felt252, shuffle_size: u8, salt: felt252) -> Shuffle {
        let rng = IRngDispatcher{ contract_address: *wrapped.rng_address };
        let (is_mocked, mocked): (bool, Span<MockedValue>) = match *wrapped.mocked {
            // mocked values are used in rng_mock contract (tutorials and tests)
            Option::Some(mocked) => (true, mocked),
            Option::None => (rng.is_mocked(salt), [].span()),
        };
        let seed: felt252 = rng.reseed(initial_seed, salt, mocked);
        let shuffler = ShufflerTrait::new(shuffle_size, is_mocked);
        (Shuffle {
            seed,
            last_card: 0,
            shuffler,
        })
    }

    // returns a random number between 1 and shuffler.size
    fn draw_next(ref self: Shuffle) -> u8 {
        if (self.shuffler.pos > 0) {
            self.seed = BitwiseU256::shr(self.seed.into(), ShufflerTrait::BITS).try_into().unwrap();
        }
        self.last_card = self.shuffler.get_next(self.seed);
// println!("draw_next(): {} of {} = {}", self.shuffler.pos, self.shuffler.size, self.last_card);
        (self.last_card)
    }
}



//----------------------------------------
// Unit  tests
//
#[cfg(test)]
mod unit {
    use super::{DiceTrait};

    #[test]
    fn test_weighted_value() {
        let values:  Span<u8> = ([1,  2, 3, 4,  5].span());
        let weights: Span<u8> = ([10, 1, 4, 5, 10].span());
        assert_eq!(DiceTrait::_get_weighted_value(values, weights, 0), 1, "_get_weighted_value()");
        assert_eq!(DiceTrait::_get_weighted_value(values, weights, 1), 1, "_get_weighted_value()");
        assert_eq!(DiceTrait::_get_weighted_value(values, weights, 10), 1, "_get_weighted_value()");
        assert_eq!(DiceTrait::_get_weighted_value(values, weights, 11), 2, "_get_weighted_value()");
        assert_eq!(DiceTrait::_get_weighted_value(values, weights, 12), 3, "_get_weighted_value()");
        assert_eq!(DiceTrait::_get_weighted_value(values, weights, 13), 3, "_get_weighted_value()");
        assert_eq!(DiceTrait::_get_weighted_value(values, weights, 14), 3, "_get_weighted_value()");
        assert_eq!(DiceTrait::_get_weighted_value(values, weights, 15), 3, "_get_weighted_value()");
        assert_eq!(DiceTrait::_get_weighted_value(values, weights, 16), 4, "_get_weighted_value()");
        assert_eq!(DiceTrait::_get_weighted_value(values, weights, 20), 4, "_get_weighted_value()");
        assert_eq!(DiceTrait::_get_weighted_value(values, weights, 21), 5, "_get_weighted_value()");
        assert_eq!(DiceTrait::_get_weighted_value(values, weights, 30), 5, "_get_weighted_value()");
        assert_eq!(DiceTrait::_get_weighted_value(values, weights, 31), 0, "_get_weighted_value()");
        // empties
        assert_eq!(DiceTrait::_get_weighted_value([].span(), [].span(), 10), 0, "_get_weighted_value()");
        // assert_eq!(DiceTrait::_get_weighted_value([].span(), weights, 1), 0, "_get_weighted_value()");
        // assert_eq!(DiceTrait::_get_weighted_value([1].span(), weights, 10), 1, "_get_weighted_value()");
        // assert_eq!(DiceTrait::_get_weighted_value([1].span(), weights, 11), 0, "_get_weighted_value()");
        // assert_eq!(DiceTrait::_get_weighted_value(values, [].span(), 1), 0, "_get_weighted_value()");
        // assert_eq!(DiceTrait::_get_weighted_value(values, [10].span(), 1), 0, "_get_weighted_value()");
        // assert_eq!(DiceTrait::_get_weighted_value(values, [10].span(), 10), 1, "_get_weighted_value()");
        // assert_eq!(DiceTrait::_get_weighted_value(values, [10].span(), 11), 0, "_get_weighted_value()");
    }
}
