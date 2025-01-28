use starknet::{ContractAddress};
use dojo::world::IWorldDispatcher;
pub use pistols::interfaces::vrf::{IVrfProvider, Source};

#[dojo::contract]
pub mod vrf_mock {
    // use debug::PrintTrait;
    use core::byte_array::ByteArrayTrait;
    use starknet::{ContractAddress, get_caller_address};
    use dojo::world::{WorldStorage, WorldStorageTrait, IWorldDispatcherTrait};
    use pistols::interfaces::vrf::{IVrfProvider, Source};
    use pistols::libs::seeder::{make_seed};

    #[generate_trait]
    impl WorldDefaultImpl of WorldDefaultTrait {
        #[inline(always)]
        fn world_default(self: @ContractState) -> WorldStorage {
            (self.world(@"pistols"))
        }
    }

    #[abi(embed_v0)]
    impl VRFMockImpl of IVrfProvider<ContractState> {
        fn consume_random(ref self: ContractState, source: Source) -> felt252 {
            let mut world = self.world_default();
            (make_seed(get_caller_address(), world.dispatcher.uuid()).into())
        }
        fn request_random(self: @ContractState, caller: ContractAddress, source: Source) {}
    }
}
