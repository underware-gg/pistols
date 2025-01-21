use starknet::{ContractAddress};
use dojo::world::IWorldDispatcher;
pub use pistols::systems::rng::{IRngDispatcher, IRngDispatcherTrait};
pub use pistols::types::shuffler::{Shuffler, ShufflerTrait};

//
// Alternative version of the rng.cairo
// it has two use cases:
//
// 1. for game testing:
//    - deploy test world with this contract instead of rng.cairo
//    - store MockedValues on-chain by calling set_mocked_values()
//    - game_loop() will use these values instead of the real rng
//
// 2. for tutorial scripting:
//    - wrap MockedValues for game_loop()
//


#[derive(Copy, Drop, Serde, Default)]
#[dojo::model]
// #[dojo::model(namespace:"mock", nomapping: true)]
pub struct MockedValue {
    #[key]
    pub salt: felt252,
    //---------------
    pub value: felt252,
    pub exists: bool,
}

#[derive(Copy, Drop, Serde)]
pub struct RngWrap {
    pub rng_address: ContractAddress,
    pub map: Span<MockedValue>,
}

#[generate_trait]
impl RngWrapImpl of RngWrapTrait {
    #[inline(always)]
    fn new(rng_address: ContractAddress) -> @RngWrap {
        (Self::wrap(rng_address, [].span()))
    }
    #[inline(always)]
    fn wrap(rng_address: ContractAddress, map: Span<MockedValue>) -> @RngWrap {
        (@RngWrap {
            rng_address,
            map,
        })
    }
}

#[starknet::interface]
pub trait IRngMock<TState> {
    // IRng
    fn reseed(self: @TState, seed: felt252, salt: felt252, map: Span<MockedValue>) -> felt252;
    fn is_mocked(self: @TState) -> bool;
    // IMocker
    fn set_mocked_values(ref self: TState, salts: Span<felt252>, values: Span<felt252>);
}

// used for testing only
#[starknet::interface]
pub trait IMocker<TState> {
    fn set_mocked_values(ref self: TState, salts: Span<felt252>, values: Span<felt252>);
}

#[dojo::contract]
// #[dojo::contract(namespace:"mock", nomapping: true)]
pub mod rng_mock {
    // use debug::PrintTrait;
    use starknet::{ContractAddress};
    use dojo::world::{WorldStorage};
    use dojo::model::{ModelStorage, ModelValueStorage};

    use super::{IRngMock, IMocker, MockedValue};
    use pistols::systems::rng::{IRng};
    use pistols::utils::hash::{hash_values};
    use pistols::types::shuffler::{Shuffler, ShufflerTrait};

    #[abi(embed_v0)]
    impl RngImpl of IRng<ContractState> {
        fn reseed(self: @ContractState, seed: felt252, salt: felt252, map: Span<MockedValue>) -> felt252 {
            //
            // look for value in map
            // (used on tutorials)
            let mut found: MockedValue = Default::default();
            let mut i: usize = 0;
            while (i < map.len()) {
                let v: MockedValue = *map.at(i);
                if (v.salt == salt) {
                    found = v;
                    found.exists = true;
                    break;
                };
                i += 1;
            };
            if (found.exists) {
                return found.value - 1; // throw_dice() adds 1
            };

            //
            // look for value in stored models
            // (used on tests)
            let mut world = self.world(@"pistols");
            let salt_value: MockedValue = world.read_model(salt);
            if (salt_value.exists) {
                // println!("-- get_salt {} {} {}", salt, salt_value.exists, salt_value.value);
                return salt_value.value - 1; // throw_dice() adds 1
            }

            //
            // hash a new random value
            // (same as rng.cairo)
            let new_seed: felt252 = hash_values([seed.into(), salt].span());
            (new_seed)
        }
        fn is_mocked(self: @ContractState) -> bool {
            (true)
        }
    }

    #[abi(embed_v0)]
    impl MockerImpl of IMocker<ContractState> {
        fn set_mocked_values(ref self: ContractState, salts: Span<felt252>, values: Span<felt252>) {
            let mut world = self.world(@"pistols");
            let mut index: usize = 0;
            while (index < salts.len() && index < values.len()) {
                // println!("set_mocked_values {} {} {}", index, salts[index], values[index]);
                let v: u256 = (*values[index]).try_into().unwrap();
                assert(v > 0, 'salt value > 0');
                // assert(v < 256, 'salt value < 256');
                world.write_model(
                    @MockedValue{
                        salt: *salts[index],
                        value: *values[index],
                        exists: true,
                    }
                );
                index += 1;
            }
        }
    }
}
