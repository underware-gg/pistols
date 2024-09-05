use starknet::{ContractAddress};
use dojo::world::IWorldDispatcher;

#[dojo::interface]
trait IRng {
    fn reseed(world: @IWorldDispatcher, seed: felt252, salt: felt252) -> felt252;
}

#[dojo::contract]
mod rng {
    use super::IRng;
    use starknet::{ContractAddress};

    use pistols::utils::hash::{hash_values};
    use pistols::utils::misc::{WORLD};

    #[abi(embed_v0)]
    impl RngImpl of IRng<ContractState> {
        fn reseed(world: @IWorldDispatcher, seed: felt252, salt: felt252) -> felt252 {
            WORLD(world);
            let new_seed: felt252 = hash_values([seed.into(), salt].span());
            (new_seed)
        }
    }
}



//--------------------------------
// General use trait
//

use pistols::interfaces::systems::{WorldSystemsTrait};

#[derive(Copy, Drop)]
struct Dice {
    rng: IRngDispatcher,
    seed: felt252,
}

#[generate_trait]
impl DiceImpl of DiceTrait {
    fn new(world: @IWorldDispatcher, initial_seed: felt252) -> Dice {
        (Dice {
            rng: world.rng_dispatcher(),
            seed: initial_seed,
        })
    }

    fn throw(ref self: Dice, salt: felt252, faces: u8) -> u8 {
        assert(faces <= 255, 'RNG_DICE: too many faces');
        self.seed = self.rng.reseed(self.seed, salt);
        let as_u256: u256 = self.seed.into();
        let result: u8 = ((as_u256.low & 0xff).try_into().unwrap() % faces) + 1;
// println!("new_seed {} dice {}", self.seed, result);
        (result)
    }

    fn decide(ref self: Dice, salt: felt252, faces: u8, chances: u8) -> (u8, bool) {
        let dice: u8 = self.throw(salt, faces);
        let result: bool = (dice <= chances);
        (dice, result)
    }
}
