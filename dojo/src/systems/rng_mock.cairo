use starknet::{ContractAddress};
pub use pistols::systems::rng::{IRngDispatcher, IRngDispatcherTrait};
pub use pistols::types::shuffler::{Shuffler, ShufflerTrait};

//
// mocked version of rng.cairo
// it has two use cases:
//
// 1. game testing:
//    - deploy test world with this contract instead of rng.cairo
//    - store MockedValues on-chain by calling mock_values()
//    - game_loop() will use these values instead of seeded rng
//
// 2. tutorial scripting:
//    - wrap MockedValues for GameLoopTrait::execute()
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
pub impl MockedValueImpl of MockedValueTrait {
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
    pub mocked: Option<Span<MockedValue>>,
}
#[generate_trait]
pub impl RngWrapImpl of RngWrapTrait {
    #[inline(always)]
    fn new(rng_address: ContractAddress) -> @RngWrap {
        (Self::wrap(rng_address, Option::None))
    }
    #[inline(always)]
    fn wrap(rng_address: ContractAddress, mocked: Option<Span<MockedValue>>) -> @RngWrap {
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
    fn is_mocked(self: @TState, salt: felt252) -> bool;
    // IMocker
    fn mock_values(ref self: TState, mocked: Span<MockedValue>);
}

// used for testing only
#[starknet::interface]
pub trait IMocker<TState> {
    fn mock_values(ref self: TState, mocked: Span<MockedValue>);
}

#[dojo::contract]
// #[dojo::contract(namespace:"mock", nomapping: true)]
pub mod rng_mock {
    use dojo::world::{WorldStorage};
    use dojo::model::{ModelStorage};

    use super::{IMocker, MockedValue};
    use pistols::systems::rng::{IRng};
    use pistols::utils::hash::{hash_values};

    #[generate_trait]
    impl WorldDefaultImpl of WorldDefaultTrait {
        #[inline(always)]
        fn world_default(self: @ContractState) -> WorldStorage {
            (self.world(@"pistols"))
        }
    }

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
            if (found.exists && found.value != 0) {
                return (found.value - 1); // throw_dice() adds 1
            };

            //
            // look for value in stored models
            // (used on tests)
            let mut world = self.world_default();
            let found: MockedValue = world.read_model(salt);
            if (found.exists && found.value != 0) {
                // println!("-- get_salt {} {} {}", salt, value.exists, value.value);
                return (found.value - 1); // throw_dice() adds 1
            }

            //
            // hash a new random value
            // (same as rng.cairo)
            let new_seed: felt252 = hash_values([seed.into(), salt].span());
            (new_seed)
        }
        fn is_mocked(self: @ContractState, salt: felt252) -> bool {
            let mut world = self.world_default();
            let found: MockedValue = world.read_model(salt);
            (found.exists)
        }
    }

    #[abi(embed_v0)]
    impl MockerImpl of IMocker<ContractState> {
        fn mock_values(ref self: ContractState, mocked: Span<MockedValue>) {
            let mut world = self.world_default();
            let mut i: usize = 0;
            while (i < mocked.len()) {
                world.write_model(mocked.at(i));
                i += 1;
            };
        }
    }
}
