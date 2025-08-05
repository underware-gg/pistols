// use starknet::{ContractAddress};

// Exposed to clients
#[starknet::interface]
pub trait IMatchMaker<TState> {
    fn match_make_me(ref self: TState, duelist_id: u128) -> u128;
}

#[dojo::contract]
pub mod matchmaker {
    // use core::num::traits::Zero;
    // use starknet::{ContractAddress};
    use dojo::world::{WorldStorage, IWorldDispatcherTrait};

    //-------------------------------------
    // pistols
    //
    use pistols::interfaces::dns::{
        // DnsTrait,
        SELECTORS,
    };
    // use pistols::models::{
    //     duelist::{DuelistTrait, Totals, TotalsTrait},
    // };
    // use pistols::utils::misc::{ZERO};
    // use pistols::libs::{
    //     store::{Store, StoreTrait},
    // };

    pub mod Errors {
        pub const CALLER_NOT_OWNER: felt252          = 'MATCHMAKE: Caller not owner';
    }

    fn dojo_init(ref self: ContractState) {
    }

    #[generate_trait]
    impl WorldDefaultImpl of WorldDefaultTrait {
        #[inline(always)]
        fn world_default(self: @ContractState) -> WorldStorage {
            (self.world(@"pistols"))
        }
    }

    #[abi(embed_v0)]
    impl MatchMakerImpl of super::IMatchMaker<ContractState> {

        //------------------------
        // Matchmaker actions
        //

        fn match_make_me(ref self: ContractState,
            duelist_id: u128,
        ) -> u128 {
            (0)
        }

    }


    //------------------------------------
    // Internal calls
    //
    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn _assert_caller_is_owner(self: @ContractState) {
            let mut world = self.world_default();
            assert(world.dispatcher.is_owner(SELECTORS::MATCHMAKER, starknet::get_caller_address()) == true, Errors::CALLER_NOT_OWNER);
        }
    }
}

