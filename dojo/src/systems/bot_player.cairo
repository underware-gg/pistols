// use starknet::{ContractAddress};

// Exposed to clients
#[starknet::interface]
pub trait IBotPlayer<TState> {
    fn reply_duel(ref self: TState, duel_id: u128);
}

#[dojo::contract]
pub mod bot_player {
    use core::num::traits::Zero;
    use starknet::{ContractAddress};
    use dojo::world::{WorldStorage}; //, IWorldDispatcherTrait};

    use pistols::interfaces::dns::{
        DnsTrait,
        IDuelTokenDispatcherTrait,
        IPackTokenProtectedDispatcherTrait,
        // SELECTORS,
    };
    use pistols::models::{
        player::{PlayerDuelistStack, PlayerDuelistStackTrait},
    };
    use pistols::types::{
        duelist_profile::{DuelistProfile, BotKey, ProfileManagerTrait},
    };
    use pistols::libs::store::{Store, StoreTrait};
    use pistols::libs::seeder::{make_seed};

    pub mod Errors {
        pub const INVALID_CALLER: felt252           = 'BOT_PLAYER: Invalid caller';
    }

    #[generate_trait]
    impl WorldDefaultImpl of WorldDefaultTrait {
        #[inline(always)]
        fn world_default(self: @ContractState) -> WorldStorage {
            (self.world(@"pistols"))
        }
    }

    #[abi(embed_v0)]
    impl BotPlayerImpl of super::IBotPlayer<ContractState> {
        fn reply_duel(ref self: ContractState, duel_id: u128) {
            let mut store: Store = StoreTrait::new(self.world_default());
            // only duel contract can request a reply
            assert(store.world.caller_is_duel_contract(), Errors::INVALID_CALLER);

            // randomize a bot profile
            let bot_address: ContractAddress = store.world.bot_player_address();
            let seed: felt252 = make_seed(bot_address, duel_id.into());
            let duelist_profile: DuelistProfile = ProfileManagerTrait::randomize_profile(DuelistProfile::Bot(BotKey::Unknown), seed);
            let stack: PlayerDuelistStack = store.get_player_duelist_stack(bot_address, duelist_profile);
            let mut duelist_id: u128 = stack.get_first_available_duelist_id(@store);
            if (duelist_id.is_zero()) {
                // mint new duelist
                duelist_id = store.world.pack_token_protected_dispatcher().mint_bot_duelist(duelist_profile);
            };

            // reply to the duel
            store.world.duel_token_dispatcher().reply_duel(duel_id, duelist_id, true);
        }
    }

    //------------------------------------
    // Internal calls
    //
    #[generate_trait]
    impl InternalImpl of InternalTrait {
        // fn _assert_caller_is_owner(self: @ContractState) {
        //     let mut world = self.world_default();
        //     assert(world.dispatcher.is_owner(SELECTORS::BOT_PLAYER, starknet::get_caller_address()) == true, Errors::CALLER_NOT_OWNER);
        // }
        // fn _assert_caller_is_admin(self: @ContractState) {
        //     let mut world = self.world_default();
        //     assert(world.admin_dispatcher().am_i_admin(starknet::get_caller_address()) == true, Errors::CALLER_NOT_ADMIN);
        // }
    }
}

