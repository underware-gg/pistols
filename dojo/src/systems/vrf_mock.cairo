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

    #[abi(embed_v0)]
    impl VRFMockImpl of IVrfProvider<ContractState> {
        fn consume_random(ref self: ContractState, source: Source) -> felt252 {
            let mut world = self.world(@"pistols");
            (make_seed(get_caller_address(), world.dispatcher.uuid()).into())
        }
    }
}
