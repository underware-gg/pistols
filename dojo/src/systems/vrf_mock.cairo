pub use pistols::interfaces::vrf::{IVrfProvider, Source};

#[dojo::contract]
pub mod vrf_mock {
    use starknet::{ContractAddress};
    use dojo::world::{WorldStorage, IWorldDispatcherTrait};
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
            let mut world: WorldStorage = self.world_default();
            let seed:felt252 = make_seed(starknet::get_caller_address(), world.dispatcher.uuid().into());
            // println!("vrf_mock::consume_random() > {}", seed);
            (seed)
        }
        fn request_random(self: @ContractState, caller: ContractAddress, source: Source) {}
    }
}
