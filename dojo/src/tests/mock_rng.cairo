use starknet::{ContractAddress};
use dojo::world::IWorldDispatcher;
use pistols::types::shuffler::{Shuffler, ShufflerTrait};

#[derive(Copy, Drop, Serde)]
#[dojo::model]
// #[dojo::model(namespace:"mock", nomapping: true)]
pub struct SaltValue {
    #[key]
    pub salt: felt252,
    //---------------
    pub value: felt252,
    pub exists: bool,
}

#[starknet::interface]
pub trait IRng<TState> {
    fn reseed(self: @TState, seed: felt252, salt: felt252) -> felt252;
    fn new_shuffler(self: @TState, shuffle_size: usize) -> Shuffler;
    // mocker
    fn mock_values(ref self: TState, salts: Span<felt252>, values: Span<felt252>);
}

#[dojo::contract]
// #[dojo::contract(namespace:"mock", nomapping: true)]
pub mod rng {
    use debug::PrintTrait;
    use starknet::{ContractAddress};
    use dojo::world::{WorldStorage};
    use dojo::model::{ModelStorage, ModelValueStorage};

    use super::{IRng, SaltValue};
    use pistols::utils::hash::{hash_values};
    use pistols::types::shuffler::{Shuffler, ShufflerTrait};

    #[abi(embed_v0)]
    impl RngImpl of IRng<ContractState> {
        fn reseed(self: @ContractState, seed: felt252, salt: felt252) -> felt252 {
            let mut world = self.world(@"pistols");
            let salt_value: SaltValue = world.read_model(salt);
            if (salt_value.exists) {
// println!("-- get_salt {} {} {}", salt, salt_value.exists, salt_value.value);
                (salt_value.value)
            } else {
                let new_seed: felt252 = hash_values([seed.into(), salt].span());
                (new_seed)
            }
        }
        fn new_shuffler(self: @ContractState, shuffle_size: usize) -> Shuffler {
            (ShufflerTrait::new_mocked(shuffle_size))
        }
        fn mock_values(ref self: ContractState, salts: Span<felt252>, values: Span<felt252>) {
            let mut world = self.world(@"pistols");
            let mut index: usize = 0;
            while (index < salts.len() && index < values.len()) {
// println!("mock_values {} {} {}", index, salts[index], values[index]);
                let v: u256 = (*values[index]).try_into().unwrap();
                assert(v > 0, 'salt value > 0');
                // assert(v < 256, 'salt value < 256');
                world.write_model(
                    @SaltValue{
                        salt: *salts[index],
                        value: (*values[index] - 1), // throw_dice() will add 1
                        exists: true,
                    }
                );
                index += 1;
            }
        }
    }
}


//--------------------------------
// Traits
//
use debug::PrintTrait;
use pistols::utils::bitwise::{BitwiseU256};

fn mock_shuffle_values(values: Span<felt252>) -> felt252 {
    let mut result: u256 = 0;
    let mut index: usize = 0;
    while (index < values.len()) {
        let v: u256 = (*values[index]).into();
        result = result | BitwiseU256::shl(v, ShufflerTrait::BITS * index);
        index += 1;
    };
    result += 1; // mock_values() will remove 1
    (result.try_into().unwrap())
}
