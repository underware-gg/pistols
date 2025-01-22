use starknet::{ContractAddress};
use dojo::world::IWorldDispatcher;
pub use pistols::systems::rng::{IRngDispatcher, IRngDispatcherTrait};
pub use pistols::types::shuffler::{Shuffler, ShufflerTrait};

//
// mocked version of rng.cairo
// it has two use cases:
//
// 1. game testing:
//    - deploy test world with this contract instead of rng.cairo
//    - store MockedValues on-chain by calling set_mocked_values()
//    - game_loop() will use these values instead of seeded rng
//
// 2. tutorial scripting:
//    - wrap MockedValues for game_loop()
//


//--------------------------------
// mocked values
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
#[generate_trait]
impl MockedValueImpl of MockedValueTrait {
    #[inline(always)]
    fn new(salt: felt252, value: felt252) -> MockedValue {
        (MockedValue {
            salt,
            value,
            exists: true,
        })
    }
    fn shuffled(salt: felt252, values: Span<felt252>) -> MockedValue {
        (Self::new(salt, ShufflerTrait::mock_to_seed(values)))
    }
}

//--------------------------------
// rng wrapper
//
#[derive(Copy, Drop, Serde)]
pub struct RngWrap {
    pub rng_address: ContractAddress,
    pub mocked: Span<MockedValue>,
}
#[generate_trait]
impl RngWrapImpl of RngWrapTrait {
    #[inline(always)]
    fn new(rng_address: ContractAddress) -> @RngWrap {
        (Self::wrap(rng_address, [].span()))
    }
    #[inline(always)]
    fn wrap(rng_address: ContractAddress, mocked: Span<MockedValue>) -> @RngWrap {
        (@RngWrap {
            rng_address,
            mocked,
        })
    }
}

//--------------------------------
// rng_mock contract
//
#[starknet::interface]
pub trait IRngMock<TState> {
    // IRng
    fn reseed(self: @TState, seed: felt252, salt: felt252, mocked: Span<MockedValue>) -> felt252;
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

    use super::{IRngMock, IMocker, MockedValue, MockedValueTrait};
    use pistols::systems::rng::{IRng};
    use pistols::utils::hash::{hash_values};
    use pistols::types::shuffler::{Shuffler, ShufflerTrait};

    #[abi(embed_v0)]
    impl RngImpl of IRng<ContractState> {
        fn reseed(self: @ContractState, seed: felt252, salt: felt252, mocked: Span<MockedValue>) -> felt252 {
            //
            // look for value in mocked map
            // (used on tutorials)
            let mut found: MockedValue = Default::default();
            let mut i: usize = 0;
            while (i < mocked.len()) {
                let v: MockedValue = *mocked.at(i);
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
            let value: MockedValue = world.read_model(salt);
            if (value.exists) {
                // println!("-- get_salt {} {} {}", salt, value.exists, value.value);
                return value.value - 1; // throw_dice() adds 1
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
                    @MockedValueTrait::new(
                        *salts[index],
                        *values[index],
                    )
                );
                index += 1;
            }
        }
    }
}
