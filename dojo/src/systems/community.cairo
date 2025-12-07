use starknet::{ContractAddress};
use pistols::models::events::{SocialPlatform, PlayerSetting, PlayerSettingValue};
use pistols::models::leaderboard::{LeaderboardPosition};

// Exposed to clients
#[starknet::interface]
pub trait ICommunity<TState> {
    // player actions
    fn delegate_game_actions(ref self: TState, delegatee_address: ContractAddress, enabled: bool); // @description: Delegate game actions to another account
    // event emitters
    fn clear_call_to_challenge(ref self: TState, duel_id: u128); // @description: Clear call to action for a player
    fn clear_player_social_link(ref self: TState, social_platform: SocialPlatform); //@description: Unlink player from social platform
    fn emit_player_social_link(ref self: TState, social_platform: SocialPlatform, player_address: ContractAddress, user_name: ByteArray, user_id: ByteArray, avatar: ByteArray); //@description: Link player to social platform
    fn emit_player_setting(ref self: TState, setting: PlayerSetting, value: PlayerSettingValue); //@description: Store player settings
    fn emit_player_bookmark(ref self: TState, target_address: ContractAddress, target_id: u128, enabled: bool); //@description: Bookmarks an address or token
    fn do_that_thing(ref self: TState); //@description: Do that thing
    // view calls
    fn get_duelist_leaderboard_position(self: @TState, season_id: u32, duelist_id: u128) -> LeaderboardPosition;
    fn get_leaderboard(self: @TState, season_id: u32) -> Span<LeaderboardPosition>;
}

#[dojo::contract]
pub mod community {
    // use core::num::traits::Zero;
    use starknet::{ContractAddress};
    use dojo::world::{WorldStorage, IWorldDispatcherTrait};

    //-------------------------------------
    // components
    //
    use achievement::components::achievable::AchievableComponent;
    component!(path: AchievableComponent, storage: achievable, event: AchievableEvent);
    impl AchievableInternalImpl = AchievableComponent::InternalImpl<ContractState>;
    #[storage]
    struct Storage {
        #[substorage(v0)]
        achievable: AchievableComponent::Storage,
    }
    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        AchievableEvent: AchievableComponent::Event,
    }

    //-------------------------------------
    // pistols
    //
    use pistols::interfaces::dns::{
        DnsTrait,
        IAdminDispatcherTrait,
        SELECTORS,
    };
    use pistols::models::{
        player::{PlayerDelegation},
        events::{ChallengeAction, SocialPlatform, PlayerSetting, PlayerSettingValue},
        leaderboard::{LeaderboardTrait, LeaderboardPosition},
    };
    use pistols::types::trophies::{TrophyProgressTrait};
    use pistols::libs::{
        store::{Store, StoreTrait},
    };

    pub mod Errors {
        pub const CALLER_NOT_OWNER: felt252          = 'COMMUNITY: Caller not owner';
        pub const CALLER_NOT_ADMIN: felt252          = 'COMMUNITY: Caller not admin';
    }

    #[generate_trait]
    impl WorldDefaultImpl of WorldDefaultTrait {
        #[inline(always)]
        fn world_default(self: @ContractState) -> WorldStorage {
            (self.world(@"pistols"))
        }
    }

    #[abi(embed_v0)]
    impl CommunityImpl of super::ICommunity<ContractState> {

        fn delegate_game_actions(ref self: ContractState, delegatee_address: ContractAddress, enabled: bool) {
            let mut store: Store = StoreTrait::new(self.world_default());
            let mut delegation: PlayerDelegation = store.get_player_delegation(starknet::get_caller_address(), delegatee_address);
            delegation.can_play_game = enabled;
            store.set_player_delegation(@delegation);
        }

        //------------------------------------
        // event emitters
        //
        fn clear_call_to_challenge(ref self: ContractState, duel_id: u128) {
            let mut store: Store = StoreTrait::new(self.world_default());
            store.emit_call_to_challenge(starknet::get_caller_address(), duel_id, ChallengeAction::Finished);
        }
        fn clear_player_social_link(ref self: ContractState, social_platform: SocialPlatform) {
            let mut store: Store = StoreTrait::new(self.world_default());
            store.emit_player_social_link(starknet::get_caller_address(), social_platform, "", "", "");
        }
        fn emit_player_social_link(ref self: ContractState, social_platform: SocialPlatform, player_address: ContractAddress, user_name: ByteArray, user_id: ByteArray, avatar: ByteArray) {
            self._assert_caller_is_admin();
            let mut store: Store = StoreTrait::new(self.world_default());
            store.emit_player_social_link(player_address, social_platform, user_name, user_id, avatar);
        }
        fn emit_player_setting(ref self: ContractState, setting: PlayerSetting, value: PlayerSettingValue) {
            let mut store: Store = StoreTrait::new(self.world_default());
            store.emit_player_setting(starknet::get_caller_address(), setting, value);
        }
        fn emit_player_bookmark(ref self: ContractState, target_address: ContractAddress, target_id: u128, enabled: bool) {
            let mut store: Store = StoreTrait::new(self.world_default());
            store.emit_player_bookmark(starknet::get_caller_address(), target_address, target_id, enabled);
        }
        fn do_that_thing(ref self: ContractState) {
            TrophyProgressTrait::the_thing(@self.world_default(), @starknet::get_caller_address());
        }

        //------------------------------------
        // view calls
        //

        fn get_duelist_leaderboard_position(self: @ContractState, season_id: u32, duelist_id: u128) -> LeaderboardPosition {
            let mut store: Store = StoreTrait::new(self.world_default());
            (store.get_leaderboard(season_id).get_duelist_position(duelist_id))
        }
        
        fn get_leaderboard(self: @ContractState, season_id: u32) -> Span<LeaderboardPosition> {
            let mut store: Store = StoreTrait::new(self.world_default());
            (store.get_leaderboard(season_id).get_all_positions())
        }
    }


    //------------------------------------
    // Internal calls
    //
    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn _assert_caller_is_owner(self: @ContractState) {
            let mut world: WorldStorage = self.world_default();
            assert(world.dispatcher.is_owner(SELECTORS::GAME, starknet::get_caller_address()), Errors::CALLER_NOT_OWNER);
        }
        fn _assert_caller_is_admin(self: @ContractState) {
            let mut world: WorldStorage = self.world_default();
            assert(world.admin_dispatcher().am_i_admin(starknet::get_caller_address()), Errors::CALLER_NOT_ADMIN);
        }
    }
}

