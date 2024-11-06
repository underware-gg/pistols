use starknet::{ContractAddress};
use dojo::world::IWorldDispatcher;

// TODO: import Cartridge interfaces
// TODO: add Source to consume_random()

#[starknet::interface]
pub trait IVRFMock<TState> {
    fn consume_random(self: @TState) -> felt252;
}

#[dojo::contract]
pub mod vrf_mock {
    // use debug::PrintTrait;
    use core::byte_array::ByteArrayTrait;
    use starknet::{ContractAddress, get_caller_address};
    use dojo::world::{WorldStorage, WorldStorageTrait, IWorldDispatcherTrait};
    use pistols::libs::seeder::{make_seed};

    #[abi(embed_v0)]
    impl VRFMockImpl of super::IVRFMock<ContractState> {
        fn consume_random(self: @ContractState) ->felt252 {
            let mut world = self.world(@"pistols");
            (make_seed(get_caller_address(), world.dispatcher.uuid()).into())
        }
    }
}
