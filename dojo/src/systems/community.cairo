use starknet::{ContractAddress};
use pistols::models::{
    leaderboard::{LeaderboardPosition},
    events::{SocialPlatform, PlayerSetting, PlayerSettingValue},
    quiz::{QuizParty, QuizQuestion, QuizAnswer},
};

// Exposed to clients
#[starknet::interface]
pub trait ICommunity<TState> {
    // player actions
    fn delegate_game_actions(ref self: TState, delegatee_address: ContractAddress, enabled: bool); // @description: Delegate game actions to another account
    // view calls
    fn get_duelist_leaderboard_position(self: @TState, season_id: u32, duelist_id: u128) -> LeaderboardPosition;
    fn get_leaderboard(self: @TState, season_id: u32) -> Span<LeaderboardPosition>;
    // event emitters
    fn clear_call_to_challenge(ref self: TState, duel_id: u128); // @description: Clear call to action for a player
    fn clear_player_social_link(ref self: TState, social_platform: SocialPlatform); //@description: Unlink player from social platform
    fn emit_player_social_link(ref self: TState, social_platform: SocialPlatform, player_address: ContractAddress, user_name: ByteArray, user_id: ByteArray, avatar: ByteArray); //@description: Link player to social platform
    fn emit_player_setting(ref self: TState, setting: PlayerSetting, value: PlayerSettingValue); //@description: Store player settings
    fn emit_player_bookmark(ref self: TState, target_address: ContractAddress, target_id: u128, enabled: bool); //@description: Bookmarks an address or token
    fn do_that_thing(ref self: TState); //@description: Do that thing
    // quiz
    fn set_current_quiz(ref self: TState, party_id: u32, question_id: u32); //@description: Set current quiz id (admin)
    fn create_quiz_party(ref self: TState, name: ByteArray, description: ByteArray, start: u64, end: u64) -> QuizParty; //@description: Create a quiz event (admin)
    fn edit_quiz_party(ref self: TState, party_id: u32, name: ByteArray, description: ByteArray, start: u64, end: u64) -> QuizParty; //@description: Create a quiz event (admin)
    fn create_quiz_question(ref self: TState, party_id: u32) -> QuizQuestion; //@description: Create a quiz question (admin)
    fn open_quiz(ref self: TState, party_id: u32, question_id: u32, question: ByteArray, description: ByteArray, options: Array<ByteArray>) -> QuizQuestion; //@description: Open a quiz question (admin)
    fn close_quiz(ref self: TState, party_id: u32, question_id: u32, answer_number: u8) -> QuizQuestion; //@description: Close a quiz question (admin)
    fn answer_quiz(ref self: TState, party_id: u32, question_id: u32, answer_number: u8) -> QuizAnswer; //@description: Answer a quiz question (players)
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
        DnsTrait, SELECTORS,
        IAdminDispatcherTrait,
        IVrfProviderDispatcherTrait, Source,
    };
    use pistols::models::{
        player::{PlayerDelegation},
        leaderboard::{LeaderboardTrait, LeaderboardPosition},
        events::{ChallengeAction, SocialPlatform, PlayerSetting, PlayerSettingValue},
        quiz::{QuizConfigTrait, QuizParty, QuizPartyTrait, QuizQuestion, QuizQuestionTrait, QuizAnswer},
    };
    use pistols::types::trophies::{TrophyProgressTrait};
    use pistols::libs::{
        store::{Store, StoreTrait},
    };

    pub mod Errors {
        pub const CALLER_NOT_OWNER: felt252     = 'COMMUNITY: Caller not owner';
        pub const CALLER_NOT_ADMIN: felt252     = 'COMMUNITY: Caller not admin';
        pub const QUESTION_IS_CLOSED: felt252   = 'COMMUNITY: Quiz is closed';
        pub const QUESTION_IS_OPEN: felt252     = 'COMMUNITY: Question is open';
        pub const QUESTION_IS_NOT_OPEN: felt252 = 'COMMUNITY: Question is not open';
        pub const INVALID_OPTIONS: felt252      = 'COMMUNITY: Invalid options';
        pub const INVALID_QUIZ: felt252         = 'COMMUNITY: Invalid quiz';
        pub const INVALID_ANSWER: felt252       = 'COMMUNITY: Invalid answer';
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
        // quiz
        //
        fn set_current_quiz(ref self: ContractState, party_id: u32, question_id: u32) {
            let mut store: Store = StoreTrait::new(self.world_default());
            self._assert_caller_is_admin();
            QuizConfigTrait::set_current_quiz(ref store, party_id, question_id);
        }
        fn create_quiz_party(ref self: ContractState, name: ByteArray, description: ByteArray, start: u64, end: u64) -> QuizParty {
            let mut store: Store = StoreTrait::new(self.world_default());
            self._assert_caller_is_admin();
            (QuizPartyTrait::create_quiz_party(ref store, name, description, start, end))
        }
        fn edit_quiz_party(ref self: ContractState, party_id: u32, name: ByteArray, description: ByteArray, start: u64, end: u64) -> QuizParty {
            let mut store: Store = StoreTrait::new(self.world_default());
            self._assert_caller_is_admin();
            (QuizPartyTrait::edit_quiz_party(ref store, party_id, name, description, start, end))
        }
        fn create_quiz_question(ref self: ContractState, party_id: u32) -> QuizQuestion {
            let mut store: Store = StoreTrait::new(self.world_default());
            self._assert_caller_is_admin();
            (QuizQuestionTrait::create_quiz_question(ref store, party_id))
        }
        fn open_quiz(ref self: ContractState, party_id: u32, question_id: u32, question: ByteArray, description: ByteArray, options: Array<ByteArray>) -> QuizQuestion {
            let mut store: Store = StoreTrait::new(self.world_default());
            self._assert_caller_is_admin();
            (QuizQuestionTrait::open_quiz(ref store, party_id, question_id, question, description, options))
        }
        fn close_quiz(ref self: ContractState, party_id: u32, question_id: u32, answer_number: u8) -> QuizQuestion {
            let mut store: Store = StoreTrait::new(self.world_default());
            self._assert_caller_is_admin();
            let vrf: felt252 = store.vrf_dispatcher().consume_random(Source::Nonce(starknet::get_caller_address()));
            (QuizQuestionTrait::close_quiz(ref store, party_id, question_id, answer_number, vrf))
        }
        fn answer_quiz(ref self: ContractState, party_id: u32, question_id: u32, answer_number: u8) -> QuizAnswer {
            let mut store: Store = StoreTrait::new(self.world_default());
            (QuizQuestionTrait::answer_quiz(ref store, party_id, question_id, answer_number))
        }

    }


    //------------------------------------
    // Internal calls
    //
    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn _assert_caller_is_owner(self: @ContractState) {
            assert(self.world_default().dispatcher.is_owner(SELECTORS::GAME, starknet::get_caller_address()), Errors::CALLER_NOT_OWNER);
        }
        fn _assert_caller_is_admin(self: @ContractState) {
            assert(self.world_default().admin_dispatcher().am_i_admin(starknet::get_caller_address()), Errors::CALLER_NOT_ADMIN);
        }
    }
}

