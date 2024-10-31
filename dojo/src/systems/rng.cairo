use starknet::{ContractAddress};
use pistols::types::shuffler::{Shuffler, ShufflerTrait};

#[starknet::interface]
pub trait IRng<TState> {
    fn reseed(self: @TState, seed: felt252, salt: felt252) -> felt252;
    fn new_shuffler(self: @TState, shuffle_size: usize) -> Shuffler;
}

#[dojo::contract]
pub mod rng {
    use super::IRng;
    use starknet::{ContractAddress};
    use dojo::world::{WorldStorage};
    use dojo::model::{ModelStorage, ModelValueStorage};

    use pistols::utils::hash::{hash_values};
    use pistols::types::shuffler::{Shuffler, ShufflerTrait};

    #[abi(embed_v0)]
    impl RngImpl of IRng<ContractState> {
        fn reseed(self: @ContractState, seed: felt252, salt: felt252) -> felt252 {
            let new_seed: felt252 = hash_values([seed.into(), salt].span());
            (new_seed)
        }
        fn new_shuffler(self: @ContractState, shuffle_size: usize) -> Shuffler {
            (ShufflerTrait::new(shuffle_size))
        }
    }
}



//--------------------------------
// General use trait
//
use dojo::world::{WorldStorage};
use pistols::interfaces::systems::{SystemsTrait};

#[derive(Copy, Drop)]
pub struct Dice {
    rng: IRngDispatcher,
    seed: felt252,
    last_dice: u8,
    shuffler: Shuffler,
}

#[generate_trait]
impl DiceImpl of DiceTrait {
    fn new(world: @WorldStorage, initial_seed: felt252, shuffle_size: usize) -> Dice {
        let rng: IRngDispatcher = world.rng_dispatcher();
        (Dice {
            rng,
            seed: initial_seed,
            last_dice: 0,
            shuffler: rng.new_shuffler(shuffle_size),
        })
    }

    // returns a random number between 1 and <faces>
    fn reseed(ref self: Dice, salt: felt252) {
        self.seed = self.rng.reseed(self.seed, salt);
    }

    // returns a random number between 1 and <faces>
    fn throw(ref self: Dice, salt: felt252, faces: u8) -> u8 {
        assert(faces <= 255, 'RNG_DICE: too many faces');
        self.reseed(salt);
        let as_u256: u256 = self.seed.into();
        self.last_dice = ((as_u256.low & 0xff).try_into().unwrap() % faces) + 1;
// println!("new_seed {} dice {}", self.seed, result);
        (self.last_dice)
    }
    fn throw_decide(ref self: Dice, salt: felt252, faces: u8, chances: u8) -> (u8, bool) {
        let dice: u8 = self.throw(salt, faces);
        let result: bool = (dice <= chances);
        (dice, result)
    }

    // returns a random number between 1 and shuffler.size
    fn shuffle_draw(ref self: Dice, salt: felt252) -> u8 {
        self.reseed(salt);
        self.last_dice = self.shuffler.get_next(self.seed);
        (self.last_dice)
    }
}
