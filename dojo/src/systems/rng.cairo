use starknet::{ContractAddress};
use dojo::world::IWorldDispatcher;

#[dojo::interface]
trait IRng {
    fn reseed(world: @IWorldDispatcher, seed: u128, salt: felt252) -> u128;
}

#[dojo::contract]
mod rng {
    use super::IRng;
    use starknet::{ContractAddress};

    // https://github.com/starkware-libs/cairo/blob/main/corelib/src/pedersen.cairo
    extern fn pedersen(a: felt252, b: felt252) -> felt252 implicits(Pedersen) nopanic;

    use pistols::utils::misc::{WORLD, felt_to_u128};

    #[abi(embed_v0)]
    impl RngImpl of IRng<ContractState> {
        fn reseed(world: @IWorldDispatcher, seed: u128, salt: felt252) -> u128 {
            WORLD(world);
            let new_seed: felt252 = pedersen(seed.into(), salt);
            (felt_to_u128(new_seed))
        }
    }

    // #[generate_trait]
    // impl InternalImpl of InternalTrait {
    //     fn make_block_hash(self: @ContractState) -> u128 {
    //         let block_info = get_block_info().unbox();
    //         hash_u128(block_info.block_number.into(), block_info.block_timestamp.into())
    //     }
    // }
}



//--------------------------------
// General use trait
//

use pistols::interfaces::systems::{WorldSystemsTrait};

#[derive(Copy, Drop)]
struct Dice {
    rng: IRngDispatcher,
    seed: u128,
}

#[generate_trait]
impl DiceImpl of DiceTrait {
    fn new(world: IWorldDispatcher, initial_seed: u128) -> Dice {
        (Dice {
            rng: world.rng_dispatcher(),
            seed: initial_seed,
        })
    }

    fn throw_dice(ref self: Dice, salt: felt252, faces: u8) -> u8 {
        assert(faces <= 255, 'RNG_DICE: too many faces');
        self.seed = self.rng.reseed(self.seed, salt);
        let result: u8 = ((self.seed % faces.into()) + 1).try_into().unwrap();
// println!("new_seed {} dice {}", self.seed, result);
        (result)
    }

}
