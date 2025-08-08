use starknet::{ContractAddress};
use pistols::types::duel_progress::{DuelProgress};
use pistols::models::leaderboard::{LeaderboardPosition};
use pistols::models::events::{SocialPlatform, PlayerSetting, PlayerSettingValue};
use pistols::types::rules::{RewardValues};

// Exposed to clients
#[starknet::interface]
pub trait IGame<TState> {
    // Game actions
    fn commit_moves( //@description: Commit moves of a Duelist in a Duel
        ref self: TState,
        duelist_id: u128,
        duel_id: u128,
        hashed: u128,
    );
    fn reveal_moves( //@description: Reveal moves of a Duelist in a Duel
        ref self: TState,
        duelist_id: u128,
        duel_id: u128,
        salt: felt252,
        moves: Span<u8>,
    );
    fn collect_duel(ref self: TState, duel_id: u128) -> u8; //@description: Close expired duels
    fn delegate_game_actions(ref self: TState, delegatee_address: ContractAddress, enabled: bool); // @description: Delegate game actions to another account
    // event emitters
    fn clear_call_to_challenge(ref self: TState, duel_id: u128); // @description: Clear call to action for a player
    fn emit_player_bookmark(ref self: TState, target_address: ContractAddress, target_id: u128, enabled: bool); //@description: Bookmarks an address or token
    fn emit_player_social_link(ref self: TState, social_platform: SocialPlatform, player_address: ContractAddress, user_name: ByteArray, user_id: ByteArray, avatar: ByteArray); //@description: Link player to social platform
    fn clear_player_social_link(ref self: TState, social_platform: SocialPlatform); //@description: Unlink player from social platform
    fn emit_player_setting(ref self: TState, setting: PlayerSetting, value: PlayerSettingValue); //@description: Store player settings

    // view calls
    fn get_duel_deck(self: @TState, duel_id: u128) -> Span<Span<u8>>;
    fn get_duel_progress(self: @TState, duel_id: u128) -> DuelProgress;
    fn get_duelist_leaderboard_position(self: @TState, season_id: u32, duelist_id: u128) -> LeaderboardPosition;
    fn get_leaderboard(self: @TState, season_id: u32) -> Span<LeaderboardPosition>;
    fn can_collect_duel(self: @TState, duel_id: u128) -> bool;
    fn calc_season_reward(self: @TState, season_id: u32, duelist_id: u128, lives_staked: u8) -> RewardValues;
    fn get_timestamp(self: @TState) -> u64;
}

// Exposed to world
#[starknet::interface]
pub trait IGameProtected<TState> {
    fn create_trophies(ref self: TState);
    fn do_that_thing(ref self: TState);
}

#[dojo::contract]
pub mod game {
    use core::num::traits::Zero;
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
        IDuelistTokenDispatcher, IDuelistTokenDispatcherTrait,
        IDuelistTokenProtectedDispatcherTrait,
        IDuelTokenDispatcherTrait,
        IDuelTokenProtectedDispatcherTrait,
        ITutorialDispatcherTrait,
        IBotPlayerProtectedDispatcherTrait,
        IAdminDispatcherTrait,
        SELECTORS,
    };
    use pistols::systems::rng::{RngWrap, RngWrapTrait};
    use pistols::models::{
        player::{PlayerTrait, PlayerDelegation, PlayerDelegationTrait},
        challenge::{
            Challenge, ChallengeTrait,
            DuelType, DuelTypeTrait,
            Round, RoundTrait,
            MovesTrait,
        },
        duelist::{DuelistTrait, Totals, TotalsTrait},
        leaderboard::{Leaderboard, LeaderboardTrait, LeaderboardPosition},
        pact::{PactTrait},
        ring::{RingType},
        season::{SeasonScoreboard, SeasonScoreboardTrait},
        events::{Activity, ActivityTrait, ChallengeAction, SocialPlatform, PlayerSetting, PlayerSettingValue},
        // tournament::{TournamentRound, TournamentRoundTrait, TournamentDuelKeys},
    };
    use pistols::types::{
        challenge_state::{ChallengeState, ChallengeStateTrait},
        duel_progress::{DuelProgress},
        round_state::{RoundState},
        rules::{Rules, RulesTrait ,RewardValues, DuelBonus},
        timestamp::{PeriodTrait, TimestampTrait},
        cards::deck::{DeckTrait},
        cards::hand::{FinalBlow, FinalBlowTrait},
        constants::{FAME},
    };
    use pistols::types::trophies::{Trophy, TrophyTrait, TrophyProgressTrait, TROPHY_ID};
    use pistols::utils::misc::{ZERO};
    use pistols::libs::{
        store::{Store, StoreTrait},
        game_loop::{GameLoopContractTrait},
        moves_hash::{MovesHashTrait},
    };

    pub mod Errors {
        pub const CALLER_NOT_OWNER: felt252          = 'PISTOLS: Caller not owner';
        pub const CALLER_NOT_ADMIN: felt252          = 'PISTOLS: Caller not admin';
        pub const CHALLENGE_EXISTS: felt252          = 'PISTOLS: Challenge exists';
        pub const CHALLENGE_NOT_IN_PROGRESS: felt252 = 'PISTOLS: Challenge not active';
        pub const CHALLENGE_IN_PROGRESS: felt252     = 'PISTOLS: Challenge is active';
        pub const NOT_ACCEPTED: felt252              = 'PISTOLS: Accept challenge first';
        pub const NOT_YOUR_DUEL: felt252             = 'PISTOLS: Not your duel';
        pub const NOT_YOUR_DUELIST: felt252          = 'PISTOLS: Not your duelist';
        pub const CROSS_DELEGATION: felt252          = 'PISTOLS: Cross delegation';
        pub const ROUND_NOT_IN_COMMIT: felt252       = 'PISTOLS: Round not in commit';
        pub const ROUND_NOT_IN_REVEAL: felt252       = 'PISTOLS: Round not in reveal';
        pub const ALREADY_COMMITTED: felt252         = 'PISTOLS: Already committed';
        pub const ALREADY_REVEALED: felt252          = 'PISTOLS: Already revealed';
        pub const INVALID_MOVES_HASH: felt252        = 'PISTOLS: Invalid moves hash';
        pub const INVALID_SALT: felt252              = 'PISTOLS: Invalid salt';
        pub const INVALID_MOVES_COUNT: felt252       = 'PISTOLS: Invalid moves count';
        pub const MOVES_HASH_MISMATCH: felt252       = 'PISTOLS: Moves hash mismatch';
        pub const SEASON_IS_NOT_ACTIVE: felt252      = 'PISTOLS: Season is not active';
        pub const SEASON_IS_ACTIVE: felt252          = 'PISTOLS: Season is active';
        pub const BAD_SHUFFLE_SEED: felt252          = 'PISTOLS: Bad shuffle seed';
        pub const INVALID_DUEL_TYPE: felt252         = 'PISTOLS: Invalid duel type';
        pub const IMPOSSIBLE_ERROR: felt252          = 'PISTOLS: Impossible error';
        pub const DISABLED: felt252                  = 'PISTOLS: Please try later...';
    }

    fn dojo_init(ref self: ContractState) {
        self._create_trophies();
    }

    #[generate_trait]
    impl WorldDefaultImpl of WorldDefaultTrait {
        #[inline(always)]
        fn world_default(self: @ContractState) -> WorldStorage {
            (self.world(@"pistols"))
        }
    }

    #[abi(embed_v0)]
    impl GameImpl of super::IGame<ContractState> {

        //------------------------
        // Game actions
        //

        fn commit_moves(ref self: ContractState,
            duelist_id: u128,
            duel_id: u128,
            hashed: u128,
        ) {
            let mut store: Store = StoreTrait::new(self.world_default());
            let mut challenge: Challenge = store.get_challenge(duel_id);

            // route to tutorial
            if (challenge.is_tutorial()) {
                store.world.tutorial_dispatcher().commit_moves(duelist_id, duel_id, hashed);
                return;
            }

            // validate caller by duelist ownership
            // (only the duelist owner can commit)
            let caller: ContractAddress = starknet::get_caller_address();
            let owner: ContractAddress = store.world.duelist_token_dispatcher().owner_of(duelist_id.into());
            assert(PlayerDelegationTrait::can_play_game(@store, owner, caller), Errors::NOT_YOUR_DUELIST);

            // validate challenge state
            let duelist_number: u8 = challenge.duelist_number(duelist_id);
            if (duelist_number == 1) {
                // validate challenge: challenger can commit while waiting for challenged
                assert(challenge.state.player_a_can_commit(), Errors::CHALLENGE_NOT_IN_PROGRESS);
            } else if (duelist_number == 2) {
                // validate challenge: challenged needs to accept first
                assert(challenge.state.player_b_can_commit(), Errors::CHALLENGE_NOT_IN_PROGRESS);
            } else if (owner == challenge.address_b) {
                // need to accept first
                assert(false, Errors::NOT_ACCEPTED);
            } else {
                assert(false, Errors::NOT_YOUR_DUEL);
            }

            // validate Round state
            let mut round: Round = store.get_round(duel_id);
            assert(round.state == RoundState::Commit, Errors::ROUND_NOT_IN_COMMIT);

            if (duelist_number == 1) {
                assert(caller != challenge.address_b, Errors::CROSS_DELEGATION);
                // validate and store hash
                assert(!round.moves_a.has_comitted(), Errors::ALREADY_COMMITTED);
                assert(hashed > 0, Errors::INVALID_MOVES_HASH);
                round.moves_a.commit(hashed);
                // was duelist transferred?
                if (challenge.address_a != owner) {
                    challenge.address_a = owner;
                    store.set_challenge(@challenge);
                }
            } else if (duelist_number == 2) {
                assert(caller != challenge.address_a, Errors::CROSS_DELEGATION);
                // validate and store hash
                assert(!round.moves_b.has_comitted(), Errors::ALREADY_COMMITTED);
                assert(hashed > 0, Errors::INVALID_MOVES_HASH);
                round.moves_b.commit(hashed);
                // was duelist transferred?
                if (challenge.address_b != owner) {
                    challenge.address_b = owner;
                    store.set_challenge(@challenge);
                }
            }

            // move to reveal phase?
            let timestamp: u64 = starknet::get_block_timestamp();
            let rules: Rules = challenge.duel_type.get_rules(@store);
            if (round.moves_a.has_comitted() && round.moves_b.has_comitted()) {
                round.state = RoundState::Reveal;
                round.set_reveal_timeout(rules, timestamp);
                // call for reveal
                store.emit_challenge_action(@challenge, 1, ChallengeAction::Reveal);
                store.emit_challenge_action(@challenge, 2, ChallengeAction::Reveal);
            } else {
                // reset timeout for other player (not if Awaiting, under Challenge timeouts)
                if (challenge.state == ChallengeState::InProgress) {
                    round.set_commit_timeout(rules, timestamp);
                }
                // One duelist comitted, wait for the other...
                if (round.moves_a.has_comitted()) {
                    store.emit_challenge_action(@challenge, 1, ChallengeAction::Waiting);
                } else if (round.moves_b.has_comitted()) {
                    store.emit_challenge_action(@challenge, 2, ChallengeAction::Waiting);
                }
            }

            // // update tournanemnt (if applicable)
            // self._update_tournament(ref store, duel_id, @round);

            // update duelist timestamp
            store.set_duelist_timestamp_active(duelist_id, timestamp);

            // events
            PlayerTrait::check_in(ref store, Activity::MovesCommitted, owner, duel_id.into());

            store.set_round(@round);

            // bot player responds immediately
            if (challenge.is_against_bot_player(@store) && duelist_number == 1) {
                store.world.bot_player_protected_dispatcher().commit_moves(duel_id);
            }
        }

        fn reveal_moves(ref self: ContractState,
            duelist_id: u128,
            duel_id: u128,
            salt: felt252,
            moves: Span<u8>,
        ) {
            let mut store: Store = StoreTrait::new(self.world_default());
            let mut challenge: Challenge = store.get_challenge(duel_id);

            // route to tutorial
            if (challenge.is_tutorial()) {
                store.world.tutorial_dispatcher().reveal_moves(duelist_id, duel_id, salt, moves);
                return;
            }

            // validate challenge
            assert(challenge.state == ChallengeState::InProgress, Errors::CHALLENGE_NOT_IN_PROGRESS);

            // validate Round
            let mut round: Round = store.get_round( duel_id);
            assert(round.state == RoundState::Reveal, Errors::ROUND_NOT_IN_REVEAL);

            // reveal is permissionless, as only commiter knows the salt
            // no need to validate caller or ownership

            // validate salt and re-generate hash
            assert(salt != 0, Errors::INVALID_SALT);
            let hashed: u128 = MovesHashTrait::hash(salt, moves);

            // since the hash was validated
            // we should not validate the actual moves
            // all we can do is skip if they are invalid
            // assert(moves.len() >= 2 && moves.len() <= 4, Errors::INVALID_MOVES_COUNT);

            // reveal moves
            let duelist_number: u8 = challenge.duelist_number(duelist_id);
            let player_address: ContractAddress = if (duelist_number == 1) {
                assert(!round.moves_a.has_revealed(), Errors::ALREADY_REVEALED);
                assert(round.moves_a.hashed == hashed, Errors::MOVES_HASH_MISMATCH);
                round.moves_a.reveal_salt_and_moves(salt, moves);
                (challenge.address_a)
            } else if (duelist_number == 2) {
                assert(!round.moves_b.has_revealed(), Errors::ALREADY_REVEALED);
                assert(round.moves_b.hashed == hashed, Errors::MOVES_HASH_MISMATCH);
                round.moves_b.reveal_salt_and_moves(salt, moves);
                (challenge.address_b)
            } else {
                assert(false, Errors::NOT_YOUR_DUEL);
                (ZERO())
            };

            // reset timeouts
            let timestamp: u64 = starknet::get_block_timestamp();
            let rules: Rules = challenge.duel_type.get_rules(@store);
            round.set_reveal_timeout(rules, timestamp);
            
            // update duelist timestamps
            store.set_duelist_timestamp_active(duelist_id, timestamp);

            // events
            Activity::MovesRevealed.emit(ref store.world, player_address, duel_id.into());

            // missing reveal, just update and wait for final reveal
            if (!round.moves_a.has_revealed() || !round.moves_b.has_revealed()) {
                store.set_round(@round);
                // wait for other player...
                store.emit_challenge_action(@challenge, duelist_number, ChallengeAction::Waiting);
                // // update tournanemnt (if applicable)
                // self._update_tournament(ref store, duel_id, @round);
                return;
            }

            //
            // RESOLVED!!!
            //

            if (player_address == challenge.self_address(duelist_number)) {
                // self revealed, clear action
                store.emit_challenge_action(@challenge, duelist_number, ChallengeAction::Finished);
            } else {
                // auto revealed, call me to see the results
                store.emit_challenge_action(@challenge, duelist_number, ChallengeAction::Results);
            }
            // call other duelist to see the results
            store.emit_challenge_action(@challenge, if(duelist_number==1){2}else{1}, ChallengeAction::Results);

            // execute game loop...
            let wrapped: @RngWrap = RngWrapTrait::new(store.world.rng_address());
            let progress: DuelProgress = GameLoopContractTrait::execute(@store.world, wrapped, @challenge.get_deck(), ref round);

            // update models, handle rewards, leaderboards and tournaments
            self._finish_challenge(ref store, ref challenge, ref round, Option::Some(progress.winner), Option::Some(@progress));
            // store.set_challenge(@challenge); // _finish_challenge() does it
            // store.set_round(@round); // _finish_challenge() does it
        }

        fn collect_duel(ref self: ContractState, duel_id: u128) -> u8 {
            let mut store: Store = StoreTrait::new(self.world_default());
            let mut challenge: Challenge = store.get_challenge(duel_id);
            let mut round: Round = store.get_round(duel_id);

            if (store.world.caller_is_duel_contract()) {
                // tournament unpaired player > declared winner
                assert(challenge.duel_type == DuelType::Tournament, Errors::INVALID_DUEL_TYPE);
                let winner: u8 = if (challenge.address_b.is_zero()) {1} else if (challenge.address_a.is_zero()) {2} else {0};
                round.final_blow = FinalBlow::Unpaired;
                self._finish_challenge(ref store, ref challenge, ref round, Option::Some(winner), Option::None);
            // } else if (store.world.caller_is_tournament_contract()) {
            //     // tournament collect previous round duel
            //     assert(challenge.duel_type == DuelType::Tournament, Errors::INVALID_DUEL_TYPE);
            //     let winner: u8 =
            //         if (
            //             (round.moves_a.has_comitted() && !round.moves_b.has_comitted()) ||
            //             (round.moves_a.has_revealed() && !round.moves_b.has_revealed())
            //         ) {1}
            //         else if (
            //             (round.moves_b.has_comitted() && !round.moves_a.has_comitted()) ||
            //             (round.moves_b.has_revealed() && !round.moves_a.has_revealed())
            //         ) {2}
            //         else {0};
            //     round.final_blow = FinalBlow::Forsaken;
            //     self._finish_challenge(ref store, ref challenge, ref round, Option::Some(winner), Option::None);
            } else {
                // outside call
                assert(self.can_collect_duel(duel_id), Errors::CHALLENGE_IN_PROGRESS);
                // collect!
                if (challenge.state == ChallengeState::Awaiting) {
                    // if pending, set to expired...
                    challenge.state = ChallengeState::Expired;
                    self._finish_challenge(ref store, ref challenge, ref round, Option::None, Option::None);
                } else {
                    // some player timed out...
                    assert(self._finish_challenge_if_timed_out(ref store, ref challenge, ref round), Errors::IMPOSSIBLE_ERROR);
                }
                // arcade
                TrophyProgressTrait::collected_duel(@store.world, @starknet::get_caller_address());
            }
            (challenge.winner)
        }

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
        fn emit_player_bookmark(ref self: ContractState, target_address: ContractAddress, target_id: u128, enabled: bool) {
            let mut store: Store = StoreTrait::new(self.world_default());
            store.emit_player_bookmark(starknet::get_caller_address(), target_address, target_id, enabled);
        }
        fn emit_player_social_link(ref self: ContractState, social_platform: SocialPlatform, player_address: ContractAddress, user_name: ByteArray, user_id: ByteArray, avatar: ByteArray) {
            self._assert_caller_is_admin();
            let mut store: Store = StoreTrait::new(self.world_default());
            store.emit_player_social_link(player_address, social_platform, user_name, user_id, avatar);
        }
        fn clear_player_social_link(ref self: ContractState, social_platform: SocialPlatform) {
            let mut store: Store = StoreTrait::new(self.world_default());
            store.emit_player_social_link(starknet::get_caller_address(), social_platform, "", "", "");
        }
        fn emit_player_setting(ref self: ContractState, setting: PlayerSetting, value: PlayerSettingValue) {
            let mut store: Store = StoreTrait::new(self.world_default());
            store.emit_player_setting(starknet::get_caller_address(), setting, value);
        }



        //------------------------------------
        // view calls
        //

        fn get_duel_deck(self: @ContractState, duel_id: u128) -> Span<Span<u8>> {
            let mut store: Store = StoreTrait::new(self.world_default());
            let challenge: Challenge = store.get_challenge(duel_id);
            (challenge.get_deck().to_span())
        }

        fn get_duel_progress(self: @ContractState, duel_id: u128) -> DuelProgress {
            let mut store: Store = StoreTrait::new(self.world_default());
            let challenge: Challenge = store.get_challenge(duel_id);
            if (challenge.is_tutorial()) {
                (store.world.tutorial_dispatcher().get_duel_progress(duel_id))
            } else {
                let mut round: Round = store.get_round(duel_id);
                if (round.final_blow.spilt_blood()) {
                    let wrapped: @RngWrap = RngWrapTrait::new(store.world.rng_address());
                    (GameLoopContractTrait::execute(@store.world, wrapped, @challenge.get_deck(), ref round))
                } else {
                    {Default::default()}
                }
            }
        }

        fn get_duelist_leaderboard_position(self: @ContractState, season_id: u32, duelist_id: u128) -> LeaderboardPosition {
            let mut store: Store = StoreTrait::new(self.world_default());
            (store.get_leaderboard(season_id).get_duelist_position(duelist_id))
        }
        
        fn get_leaderboard(self: @ContractState, season_id: u32) -> Span<LeaderboardPosition> {
            let mut store: Store = StoreTrait::new(self.world_default());
            (store.get_leaderboard(season_id).get_all_positions())
        }

        fn can_collect_duel(self: @ContractState, duel_id: u128) -> bool {
            let mut store: Store = StoreTrait::new(self.world_default());
            let challenge: Challenge = store.get_challenge(duel_id);
            let round: Round = store.get_round(duel_id);
            if (
                challenge.state == ChallengeState::Awaiting &&
                challenge.timestamps.has_expired()
            ) {
                (true)
            } else if (
                challenge.state == ChallengeState::InProgress && 
                (round.moves_a.timeout.has_timed_out(@challenge) || round.moves_b.timeout.has_timed_out(@challenge))
            ) {
                (true)
            } else {
                (false)
            }
        }

        fn calc_season_reward(self: @ContractState,
            season_id: u32,
            duelist_id: u128,
            lives_staked: u8,
        ) -> RewardValues {
            let mut store: Store = StoreTrait::new(self.world_default());
            let rules: Rules = store.get_current_season_rules();
            let signet_ring: RingType = store.get_player_active_signet_ring(starknet::get_caller_address());
            let fame_balance: u128 = store.world.duelist_token_dispatcher().fame_balance(duelist_id);
            let rewards_loss: RewardValues = rules.calc_rewards(fame_balance, lives_staked, false, signet_ring, @Default::default());
            let rewards_win: RewardValues = rules.calc_rewards(fame_balance, lives_staked, true, signet_ring, @Default::default());
            let mut leaderboard: Leaderboard = store.get_leaderboard(season_id);
            let position: u8 = leaderboard.insert_score(duelist_id, rewards_win.points_scored);
            (RewardValues{
                // if you win...
                fame_gained: rewards_win.fame_gained,
                fools_gained: rewards_win.fools_gained,
                points_scored: rewards_win.points_scored,
                position,
                // if you lose...
                fame_lost: rewards_loss.fame_lost,
                lords_unlocked: 0,
                fame_burned: 0,
                survived: (fame_balance - rewards_loss.fame_lost) >= FAME::ONE_LIFE,
            })
        }

        fn get_timestamp(self: @ContractState) -> u64 {
            (starknet::get_block_timestamp())
        }
    }


    //-----------------------------------
    // Protected
    //
    #[abi(embed_v0)]
    impl GameProtectedImpl of super::IGameProtected<ContractState> {
        fn create_trophies(ref self: ContractState) {
            self._assert_caller_is_owner();
            self._create_trophies();
        }
        fn do_that_thing(ref self: ContractState) {
            TrophyProgressTrait::the_thing(@self.world_default(), @starknet::get_caller_address());
        }
    }


    //------------------------------------
    // Internal calls
    //
    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn _assert_caller_is_owner(self: @ContractState) {
            let mut world = self.world_default();
            assert(world.dispatcher.is_owner(SELECTORS::GAME, starknet::get_caller_address()) == true, Errors::CALLER_NOT_OWNER);
        }
        fn _assert_caller_is_admin(self: @ContractState) {
            let mut world = self.world_default();
            assert(world.admin_dispatcher().am_i_admin(starknet::get_caller_address()) == true, Errors::CALLER_NOT_ADMIN);
        }

        fn _create_trophies(ref self: ContractState) {
            let mut world = self.world_default();
            let mut trophy_id: u8 = 1;
            while (trophy_id <= TROPHY_ID::COUNT) {
                let trophy: Trophy = trophy_id.into();
                self.achievable.create(
                    world,
                    id: trophy.identifier(),
                    hidden: trophy.hidden(),
                    index: trophy.index(),
                    points: trophy.points(),
                    start: trophy.start(),
                    end: trophy.end(),
                    group: trophy.group(),
                    icon: trophy.icon(),
                    title: trophy.title(),
                    description: trophy.description(),
                    tasks: trophy.tasks(),
                    data: trophy.data(),
                );
                trophy_id += 1;
            }
        }

        // fn _get_tournament_round(ref self: ContractState, ref store: Store, duel_id: u128) -> Option<(TournamentDuelKeys, TournamentRound)> {
        //     let keys: TournamentDuelKeys = store.get_duel_tournament_keys(duel_id);
        //     if (keys.tournament_id.is_non_zero() && keys.round_number.is_non_zero()) {
        //         Option::Some((keys, store.get_tournament_round(keys.tournament_id, keys.round_number)))
        //     } else {
        //         (Option::None)
        //     }
        // }

        // fn _update_tournament(ref self: ContractState, ref store: Store, duel_id: u128, round: @Round) {
        //     let mut tournament_round: Option<(TournamentDuelKeys, TournamentRound)> = self._get_tournament_round(ref store, duel_id);
        //     match tournament_round {
        //         Option::Some((keys, mut tournament_round)) => {
        //             if (*round.state == RoundState::Commit) {
        //                 if (round.moves_a.has_comitted() && !round.moves_b.has_comitted()) {
        //                     tournament_round.moved_first(keys.entry_number_a, keys.entry_number_b);
        //                 } else if (round.moves_b.has_comitted() && !round.moves_a.has_comitted()) {
        //                     tournament_round.moved_first(keys.entry_number_b, keys.entry_number_a);
        //                 }
        //             } else if (*round.state == RoundState::Reveal) {
        //                 if (round.moves_a.has_revealed() && !round.moves_b.has_revealed()) {
        //                     tournament_round.moved_first(keys.entry_number_a, keys.entry_number_b);
        //                 } else if (round.moves_b.has_revealed() && !round.moves_a.has_revealed()) {
        //                     tournament_round.moved_first(keys.entry_number_b, keys.entry_number_a);
        //                 } else {
        //                     tournament_round.moved_second(keys.entry_number_a, keys.entry_number_b);
        //                 }
        //             }
        //             store.set_tournament_round(@tournament_round);
        //         },
        //         Option::None => {}
        //     };
        // }

        fn _finish_challenge_if_timed_out(ref self: ContractState, ref store: Store, ref challenge: Challenge, ref round: Round) -> bool {
            let timed_out_a: bool = round.moves_a.timeout.has_timed_out(@challenge);
            let timed_out_b: bool = round.moves_b.timeout.has_timed_out(@challenge);
            if (timed_out_a || timed_out_b) {
                // finish challenge + round
                let winner: u8 =
                    if (!timed_out_a) {1}
                    else if (!timed_out_b) {2}
                    else {0};
                round.final_blow = FinalBlow::Forsaken;
                self._finish_challenge(ref store, ref challenge, ref round, Option::Some(winner), Option::None);
                
                // timeout events
                if (timed_out_a) {
                    Activity::PlayerTimedOut.emit(ref store.world, challenge.address_a, challenge.duel_id.into());
                }
                if (timed_out_b) {
                    Activity::PlayerTimedOut.emit(ref store.world, challenge.address_b, challenge.duel_id.into());
                }
                // clear both duelists actions
                store.emit_challenge_action(@challenge, 1, ChallengeAction::Finished);
                store.emit_challenge_action(@challenge, 2, ChallengeAction::Finished);
                (true)
            } else {
                (false)
            }
        }

        fn _finish_challenge(ref self: ContractState, ref store: Store, ref challenge: Challenge, ref round: Round, winner: Option<u8>, progress: Option<@DuelProgress>) {
            match winner {
                Option::Some(winner) => {
                    challenge.winner = winner;
                    challenge.state =
                        if (winner == 0) {ChallengeState::Draw}
                        else {ChallengeState::Resolved};
                },
                Option::None => {}
            }
            challenge.season_id = store.get_current_season_id();
            challenge.timestamps.end = starknet::get_block_timestamp();
            store.set_challenge(@challenge);
            //end round
            round.state = RoundState::Finished;
            store.set_round(@round);
            // unset pact (if set)
            challenge.unset_pact(ref store);
            // exit challenge
            store.exit_challenge(challenge.duelist_id_a);
            store.exit_challenge(challenge.duelist_id_b);
            // distributions
            if (challenge.state.is_concluded()) {
                // deliver trophies
                let bonus: DuelBonus = match (progress) {
                    Option::Some(progress) => {
                        (if (challenge.winner != 0) {
                            (TrophyProgressTrait::duel_resolved(@store.world, @challenge, @round, progress))
                        } else {
                            (TrophyProgressTrait::duel_draw(@store.world, @challenge, @round, progress))
                        })
                    },
                    Option::None => {(Default::default())}
                };
                
                // transfer rewards
                let tournament_id: u64 = 0;
                let (mut rewards_a, mut rewards_b): (RewardValues, RewardValues) = store.world.duelist_token_protected_dispatcher().transfer_rewards(challenge, tournament_id, bonus);

                // update leaderboards
                self._update_scoreboards(ref store, @challenge, @round, ref rewards_a, ref rewards_b);

                if (challenge.winner.is_non_zero()) {
                    // send duel token to winner
                    store.world.duel_token_protected_dispatcher().transfer_to_winner(challenge.duel_id);
                    // send bot token to winner
                    if (challenge.is_against_bot_player(@store) && challenge.winner == 1) {
                        store.world.bot_player_protected_dispatcher().transfer_to_winner(challenge.duel_id, challenge.duelist_id_b, challenge.address_a);
                    }
                    // emit events
                    Activity::ChallengeResolved.emit(ref store.world, challenge.winner_address(), challenge.duel_id.into());
                } else {
                    Activity::ChallengeDraw.emit(ref store.world, starknet::get_caller_address(), challenge.duel_id.into());
                }
                store.emit_challenge_rewards(challenge.duel_id, challenge.duelist_id_a, rewards_a);
                store.emit_challenge_rewards(challenge.duel_id, challenge.duelist_id_b, rewards_b);

                // // settle tournament
                // let mut tournament_round: Option<(TournamentDuelKeys, TournamentRound)> = self._get_tournament_round(ref store, challenge.duel_id);
                // match tournament_round {
                //     Option::Some((keys, mut tournament_round)) => {
                //         tournament_round.finished_duel(
                //             keys.entry_number_a,
                //             keys.entry_number_b,
                //             rewards_a.survived,
                //             rewards_b.survived,
                //             challenge.winner,
                //         );
                //         store.set_tournament_round(@tournament_round);
                //     },
                //     Option::None => {}
                // }
            }
            // update token metadata
            store.world.duel_token_dispatcher().update_token_metadata(challenge.duel_id);
            let duelist_dispatcher: IDuelistTokenDispatcher = store.world.duelist_token_dispatcher();
            duelist_dispatcher.update_token_metadata(challenge.duelist_id_a);
            if (challenge.duelist_id_b.is_non_zero()) {
                duelist_dispatcher.update_token_metadata(challenge.duelist_id_b);
            }
        }

        fn _update_scoreboards(self: @ContractState, ref store: Store, challenge: @Challenge, round: @Round, ref rewards_a: RewardValues, ref rewards_b: RewardValues) {
            // update player totals
            let mut totals_player_a: Totals = store.get_player_totals(*challenge.address_a);
            let mut totals_player_b: Totals = store.get_player_totals(*challenge.address_b);
            TotalsTrait::apply_challenge_results(ref totals_player_a, ref totals_player_b, @rewards_a, @rewards_b, *challenge.winner);
            totals_player_a.update_honour(*round.state_a.honour);
            totals_player_b.update_honour(*round.state_b.honour);
            store.set_player_totals(*challenge.address_a, totals_player_a);
            store.set_player_totals(*challenge.address_b, totals_player_b);

            // update duelist totals
            let mut totals_duelist_a: Totals = store.get_duelist_totals(*challenge.duelist_id_a);
            let mut totals_duelist_b: Totals = store.get_duelist_totals(*challenge.duelist_id_b);
            TotalsTrait::apply_challenge_results(ref totals_duelist_a, ref totals_duelist_b, @rewards_a, @rewards_b, *challenge.winner);
            totals_duelist_a.update_honour(*round.state_a.honour);
            totals_duelist_b.update_honour(*round.state_b.honour);
            store.set_duelist_totals(*challenge.duelist_id_a, totals_duelist_a);
            store.set_duelist_totals(*challenge.duelist_id_b, totals_duelist_b);

            let mut leaderboard: Leaderboard = store.get_leaderboard(*challenge.season_id);

            if (rewards_a.points_scored.is_non_zero()) {
                // per season score
                let mut scoreboard_a: SeasonScoreboard = store.get_scoreboard(*challenge.season_id, (*challenge).duelist_id_a.into());
                scoreboard_a.apply_rewards(@rewards_a);
                store.set_scoreboard(@scoreboard_a);
                // update leaderboards
                if (leaderboard.is_qualified(@store, *challenge.address_a)) {
                    rewards_a.position = leaderboard.insert_score(*challenge.duelist_id_a, scoreboard_a.points);
                }
            }
            if (rewards_b.points_scored.is_non_zero()) {
                // per season score
                let mut scoreboard_b: SeasonScoreboard = store.get_scoreboard(*challenge.season_id, (*challenge).duelist_id_b.into());
                scoreboard_b.apply_rewards(@rewards_b);
                store.set_scoreboard(@scoreboard_b);
                // update leaderboards
                if (leaderboard.is_qualified(@store, *challenge.address_b)) {
                    rewards_b.position = leaderboard.insert_score(*challenge.duelist_id_b, scoreboard_b.points);
                }
            }

            if (rewards_a.position != 0 || rewards_b.position != 0) {
                // adjust [a] if [b] moved up
                if (rewards_b.position <= rewards_a.position) {
                    rewards_a.position = if (rewards_a.position < leaderboard.positions) {rewards_a.position+1} else {0};
                }
                store.set_leaderboard(@leaderboard);
            }

            TrophyProgressTrait::duelist_scored(@store.world, challenge.address_a, @totals_player_a, @totals_duelist_a, @rewards_a, *challenge.winner == 1);
            TrophyProgressTrait::duelist_scored(@store.world, challenge.address_b, @totals_player_b, @totals_duelist_b, @rewards_b, *challenge.winner == 2);
        }
    }
}

