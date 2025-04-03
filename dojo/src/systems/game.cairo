use starknet::{ContractAddress};
use pistols::types::duel_progress::{DuelProgress};
use pistols::models::leaderboard::{LeaderboardPosition};
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
    fn clear_call_to_action(ref self: TState, duelist_id: u128); // @description: Clear the required action call for a duelist
    fn collect_duel(ref self: TState, duel_id: u128); // @description: Close expired duels
    fn collect_season(ref self: TState) -> u32; // @description: Close the current season and start the next one

    // view calls
    fn get_duel_deck(self: @TState, duel_id: u128) -> Span<Span<u8>>;
    fn get_duel_progress(self: @TState, duel_id: u128) -> DuelProgress;
    fn get_duelist_leaderboard_position(self: @TState, season_id: u32, duelist_id: u128) -> LeaderboardPosition;
    fn get_leaderboard(self: @TState, season_id: u32) -> Span<LeaderboardPosition>;
    fn can_collect_duel(self: @TState, duel_id: u128) -> bool;
    fn can_collect_season(self: @TState) -> bool;
    fn calc_season_reward(self: @TState, season_id: u32, duelist_id: u128, lives_staked: u8) -> RewardValues;
    fn get_timestamp(self: @TState) -> u64;
    
    // test calls
    fn test_validate_commit_message(self: @TState, account: ContractAddress, signature: Array<felt252>, duelId: felt252, duelistId: felt252) -> bool;
}

// Exposed to world
#[starknet::interface]
pub trait IGameProtected<TState> {
    fn create_trophies(ref self: TState);
}

#[dojo::contract]
pub mod game {
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
        IDuelistTokenDispatcherTrait,
        IDuelTokenDispatcherTrait,
        ITutorialDispatcherTrait,
        IBankDispatcherTrait,
        SELECTORS,
    };
    use pistols::systems::rng::{RngWrap, RngWrapTrait};
    use pistols::models::{
        player::{PlayerTrait},
        challenge::{Challenge, ChallengeTrait, Round, RoundTrait, MovesTrait},
        duelist::{Duelist, DuelistTrait, DuelistStatusTrait},
        leaderboard::{Leaderboard, LeaderboardTrait, LeaderboardPosition},
        pact::{PactTrait},
        season::{SeasonConfig, SeasonConfigTrait, SeasonScoreboard, SeasonScoreboardTrait},
        events::{Activity, ActivityTrait},
    };
    use pistols::types::{
        challenge_state::{ChallengeState, ChallengeStateTrait},
        duel_progress::{DuelProgress},
        round_state::{RoundState},
        typed_data::{CommitMoveMessage, CommitMoveMessageTrait},
        rules::{Rules, RulesTrait ,RewardValues},
        timestamp::{PeriodTrait, TimestampTrait},
        cards::deck::{DeckTrait},
        cards::hand::{FinalBlow},
        constants::{FAME},
    };
    use pistols::types::trophies::{Trophy, TrophyTrait, TROPHY};
    use pistols::libs::store::{Store, StoreTrait};
    use pistols::libs::game_loop::{game_loop, make_moves_hash};

    pub mod Errors {
        pub const CALLER_NOT_OWNER: felt252          = 'PISTOLS: Caller not owner';
        pub const CHALLENGE_EXISTS: felt252          = 'PISTOLS: Challenge exists';
        pub const CHALLENGE_NOT_IN_PROGRESS: felt252 = 'PISTOLS: Challenge not active';
        pub const CHALLENGE_IN_PROGRESS: felt252     = 'PISTOLS: Challenge is active';
        pub const NOT_ACCEPTED: felt252              = 'PISTOLS: Accept challenge first';
        pub const NOT_YOUR_DUEL: felt252             = 'PISTOLS: Not your duel';
        pub const NOT_YOUR_DUELIST: felt252          = 'PISTOLS: Not your duelist';
        pub const ROUND_NOT_IN_COMMIT: felt252       = 'PISTOLS: Round not in commit';
        pub const ROUND_NOT_IN_REVEAL: felt252       = 'PISTOLS: Round not in reveal';
        pub const ALREADY_COMMITTED: felt252         = 'PISTOLS: Already committed';
        pub const ALREADY_REVEALED: felt252          = 'PISTOLS: Already revealed';
        pub const INVALID_SALT: felt252              = 'PISTOLS: Invalid salt';
        pub const INVALID_MOVES_COUNT: felt252       = 'PISTOLS: Invalid moves count';
        pub const MOVES_HASH_MISMATCH: felt252       = 'PISTOLS: Moves hash mismatch';
        pub const IMPOSSIBLE_ERROR: felt252          = 'PISTOLS: Impossible error';
        pub const SEASON_IS_NOT_ACTIVE: felt252      = 'PISTOLS: Season is not active';
        pub const SEASON_IS_ACTIVE: felt252          = 'PISTOLS: Season is active';
        pub const SEASON_NOT_ENDGAME: felt252        = 'PISTOLS: Not endgame';
        pub const BAD_SHUFFLE_SEED: felt252          = 'PISTOLS: Bad shuffle seed';
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

            // validate challenge
            let owner: ContractAddress = self._validate_ownership(@store.world, duelist_id);
            let duelist_number: u8 = challenge.duelist_number(duelist_id);
            if (duelist_number == 1) {
                // validate challenge: challenger can commit while waiting for challenged
                assert(challenge.state.is_live(), Errors::CHALLENGE_NOT_IN_PROGRESS);
            } else if (duelist_number == 2) {
                // validate challenge: challenged needs to accept first
                assert(challenge.state == ChallengeState::InProgress, Errors::CHALLENGE_NOT_IN_PROGRESS);
            } else {
                assert(false, if (starknet::get_caller_address() == challenge.address_b) {Errors::NOT_ACCEPTED} else {Errors::NOT_YOUR_DUEL});
            }

            // validate Round
            let mut round: Round = store.get_round(duel_id);
            assert(round.state == RoundState::Commit, Errors::ROUND_NOT_IN_COMMIT);

            // check timeouts
            if (self._finish_challenge_if_timed_out(ref store, ref challenge, ref round)) {
                return;
            }

            if (duelist_number == 1) {
                // validate and store hash
                assert(round.moves_a.hashed == 0, Errors::ALREADY_COMMITTED);
                round.moves_a.hashed = hashed;
                // was duelist transferred?
                if (challenge.address_a != owner) {
                    challenge.address_a = owner;
                    store.set_challenge(@challenge);
                }
                if (round.moves_b.hashed == 0) {
                    // other duelist did not commit: clear self action flag
                    store.emit_challenge_action(@challenge, 1, false);
                } else {
                    // other duelist committed: call for action (keep self flag for reveal)
                    store.emit_challenge_action(@challenge, 2, true);
                }
            } else if (duelist_number == 2) {
                // validate and store hash
                assert(round.moves_b.hashed == 0, Errors::ALREADY_COMMITTED);
                round.moves_b.hashed = hashed;
                // was duelist transferred?
                if (challenge.address_b != owner) {
                    challenge.address_b = owner;
                    store.set_challenge(@challenge);
                }
                if (round.moves_a.hashed == 0) {
                    // other duelist did not commit: clear self action flag
                    store.emit_challenge_action(@challenge, 2, false);
                } else {
                    // other duelist committed: call for action (keep self flag for reveal)
                    store.emit_challenge_action(@challenge, 1, true);
                }
            }

            // move to reveal phase?
            let timestamp: u64 = starknet::get_block_timestamp();
            let rules: Rules = store.get_current_season_rules();
            if (round.moves_a.hashed != 0 && round.moves_b.hashed != 0) {
                round.state = RoundState::Reveal;
                round.set_reveal_timeout(rules, timestamp);
            } else if (challenge.state == ChallengeState::InProgress) {
                // reset timeout for other player
                // (not if Awaiting, under Challenge timeouts)
                round.set_commit_timeout(rules, timestamp);
            }

            // update duelist timestamp
            store.set_duelist_timestamp_active(duelist_id, timestamp);

            // events
            PlayerTrait::check_in(ref store, Activity::MovesCommitted, starknet::get_caller_address(), duel_id.into());

            store.set_round(@round);
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

            // validate duelist
            self._validate_ownership(@store.world, duelist_id);
            let duelist_number: u8 = challenge.duelist_number(duelist_id);
            assert(duelist_number != 0, Errors::NOT_YOUR_DUEL);

            // check timeouts
            if (self._finish_challenge_if_timed_out(ref store, ref challenge, ref round)) {
                return;
            }

            // validate salt
            // TODO: verify salt with signature
            assert(salt != 0, Errors::INVALID_SALT);

            // validate moves
            // since the hash was validated
            // we should not validate the actual moves
            // all we can do is skip if they are invalid
            assert(moves.len() >= 2 && moves.len() <= 4, Errors::INVALID_MOVES_COUNT);

            // validate hash
            let hashed: u128 = make_moves_hash(salt, moves);
            if (duelist_number == 1) {
                assert(round.moves_a.salt == 0, Errors::ALREADY_REVEALED);
                assert(round.moves_a.hashed == hashed, Errors::MOVES_HASH_MISMATCH);
                round.moves_a.set_salt_and_moves(salt, moves);
            } else {
                assert(round.moves_b.salt == 0, Errors::ALREADY_REVEALED);
                assert(round.moves_b.hashed == hashed, Errors::MOVES_HASH_MISMATCH);
                round.moves_b.set_salt_and_moves(salt, moves);
            }

            // reset timeouts
            let timestamp: u64 = starknet::get_block_timestamp();
            let rules: Rules = store.get_current_season_rules();
            round.set_reveal_timeout(rules, timestamp);
            
            // update duelist timestamps
            store.set_duelist_timestamp_active(duelist_id, timestamp);

            // events
            Activity::MovesRevealed.emit(ref store.world, starknet::get_caller_address(), duel_id.into());

            // missing reveal, update only and wait for final reveal
            if (round.moves_a.salt == 0 || round.moves_b.salt == 0) {
                store.set_round(@round);
                // clear self flag
                store.emit_challenge_action(@challenge, duelist_number, false);
                return;
            }

            //
            // RESOLVED!!!
            //

            // clear self duel
            store.emit_clear_challenge_action(@challenge, duelist_number);
            // call other duelist to see the results
            store.emit_challenge_action(@challenge,
                if (duelist_number == 1) {2} else {1},
                true,
            );

            // execute game loop...
            let wrapped: @RngWrap = RngWrapTrait::new(store.world.rng_address());
            let progress: DuelProgress = game_loop(wrapped, @challenge.get_deck(), ref round);

            // update challenge
            self._finish_challenge(ref store, ref challenge, ref round, Option::Some(progress.winner));
            // store.set_challenge(@challenge); // _finish_challenge() does it
            // store.set_round(@round); // _finish_challenge() does it
        }

        fn clear_call_to_action(ref self: ContractState, duelist_id: u128) {
            let mut store: Store = StoreTrait::new(self.world_default());
            self._validate_ownership(@store.world, duelist_id);
            store.emit_call_to_action(starknet::get_caller_address(), duelist_id, 0, false);
        }

        fn collect_duel(ref self: ContractState, duel_id: u128) {
            let mut store: Store = StoreTrait::new(self.world_default());
            let mut challenge: Challenge = store.get_challenge(duel_id);
            assert(self.can_collect_duel(duel_id), Errors::CHALLENGE_IN_PROGRESS);
            // collect!
            let mut round: Round = store.get_round(duel_id);
            if (challenge.state == ChallengeState::Awaiting) {
                // if pending, set to expired...
                challenge.state = ChallengeState::Expired;
                self._finish_challenge(ref store, ref challenge, ref round, Option::None);
            } else {
                // some player timed out...
                assert(self._finish_challenge_if_timed_out(ref store, ref challenge, ref round), Errors::IMPOSSIBLE_ERROR);
            }
        }

        fn collect_season(ref self: ContractState) -> u32 {
            let mut store: Store = StoreTrait::new(self.world_default());
            // collect season if permitted
            let mut season: SeasonConfig = store.get_current_season();
            let new_season_id: u32 = season.collect(ref store);
            store.set_config_season_id(new_season_id);
            // release...
            store.world.bank_dispatcher().release_season_pool(season.season_id);
            // all hail the collector
            Trophy::Collector.progress(store.world, starknet::get_caller_address(), 1);
            (new_season_id)
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
            } else if (challenge.state.is_concluded()) {
                let mut round: Round = store.get_round(duel_id);
                let wrapped: @RngWrap = RngWrapTrait::new(store.world.rng_address());
                (game_loop(wrapped, @challenge.get_deck(), ref round))
            } else {
                {Default::default()}
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
                (round.moves_a.timeout.has_timed_out() || round.moves_b.timeout.has_timed_out())
            ) {
                (true)
            } else {
                (false)
            }
        }

        fn can_collect_season(self: @ContractState) -> bool {
            let mut store: Store = StoreTrait::new(self.world_default());
            let season: SeasonConfig = store.get_current_season();
            (season.can_collect())
        }

        fn calc_season_reward(self: @ContractState,
            season_id: u32,
            duelist_id: u128,
            lives_staked: u8,
        ) -> RewardValues {
            let mut store: Store = StoreTrait::new(self.world_default());
            let rules: Rules = store.get_current_season_rules();
            let fame_balance: u128 = store.world.duelist_token_dispatcher().fame_balance(duelist_id);
            let rewards_loss: RewardValues = rules.calc_rewards(fame_balance, lives_staked, false);
            let rewards_win: RewardValues = rules.calc_rewards(fame_balance, lives_staked, true);
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
                survived: (fame_balance - rewards_loss.fame_lost) >= FAME::ONE_LIFE.low,
            })
        }




        fn get_timestamp(self: @ContractState) -> u64 {
            (starknet::get_block_timestamp())
        }

        fn test_validate_commit_message(self: @ContractState,
            account: ContractAddress,
            signature: Array<felt252>,
            duelId: felt252,
            duelistId: felt252,
        ) -> bool {
            let msg = CommitMoveMessage {
                duelId,
                duelistId,
            };
            (msg.validate(account, signature))
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

        fn _create_trophies(ref self: ContractState) {
            let mut world = self.world_default();
            let mut trophy_id: u8 = 1;
            while trophy_id <= TROPHY::COUNT {
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

        fn _validate_ownership(self: @ContractState, world: @WorldStorage, duelist_id: u128) -> ContractAddress {
            let owner: ContractAddress = world.duelist_token_dispatcher().owner_of(duelist_id.into());
            assert(owner == starknet::get_caller_address(), Errors::NOT_YOUR_DUELIST);
            (owner)
        }

        fn _finish_challenge_if_timed_out(ref self: ContractState, ref store: Store, ref challenge: Challenge, ref round: Round) -> bool {
            let timed_out_a: bool = round.moves_a.timeout.has_timed_out();
            let timed_out_b: bool = round.moves_b.timeout.has_timed_out();
            if (timed_out_a || timed_out_b) {
                // finish challenge + round
                let winner: u8 =
                    if (!timed_out_a) {1}
                    else if (!timed_out_b) {2}
                    else {0};
                round.final_blow = FinalBlow::Forsaken;
                self._finish_challenge(ref store, ref challenge, ref round, Option::Some(winner));
                
                // timeout events
                if (timed_out_a) {
                    Activity::PlayerTimedOut.emit(ref store.world, challenge.address_a, challenge.duel_id.into());
                }
                if (timed_out_b) {
                    Activity::PlayerTimedOut.emit(ref store.world, challenge.address_b, challenge.duel_id.into());
                }
                // clear both duelists actions
                store.emit_clear_challenge_action(@challenge, 1);
                store.emit_clear_challenge_action(@challenge, 2);
                (true)
            } else {
                (false)
            }
        }

        fn _finish_challenge(ref self: ContractState, ref store: Store, ref challenge: Challenge, ref round: Round, winner: Option<u8>) {
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
            if (challenge.duelist_id_b != 0) {
                store.exit_challenge(challenge.duelist_id_b);
            }
            // distributions
            if (challenge.state.is_concluded()) {
                // transfer rewards
                let tournament_id: u64 = 0;
                let (mut rewards_a, mut rewards_b): (RewardValues, RewardValues) = store.world.duelist_token_dispatcher().transfer_rewards(challenge, tournament_id);

                // update leaderboards
                self._update_scoreboards(ref store, @challenge, @round, ref rewards_a, ref rewards_b);

                // send duel token to winner
                if (challenge.winner != 0) {
                    store.world.duel_token_dispatcher().transfer_to_winner(challenge.duel_id);
                }

                // events
                if (challenge.winner != 0) {
                    Activity::ChallengeResolved.emit(ref store.world, challenge.winner_address(), challenge.duel_id.into());
                } else {
                    Activity::ChallengeDraw.emit(ref store.world, starknet::get_caller_address(), challenge.duel_id.into());
                }
                store.emit_challenge_rewards(challenge.duel_id, challenge.duelist_id_a, rewards_a);
                store.emit_challenge_rewards(challenge.duel_id, challenge.duelist_id_b, rewards_b);
            }
        }

        fn _update_scoreboards(self: @ContractState, ref store: Store, challenge: @Challenge, round: @Round, ref rewards_a: RewardValues, ref rewards_b: RewardValues) {
            // update duelists status
            let mut duelist_a: Duelist = store.get_duelist(*challenge.duelist_id_a);
            let mut duelist_b: Duelist = store.get_duelist(*challenge.duelist_id_b);
            DuelistStatusTrait::apply_challenge_results(ref duelist_a.status, ref duelist_b.status, @rewards_a, @rewards_b, *challenge.winner);
            duelist_a.status.update_honour(*round.state_a.honour);
            duelist_b.status.update_honour(*round.state_b.honour);
            // save
            store.set_duelist(@duelist_a);
            store.set_duelist(@duelist_b);

            // per season score
            let mut scoreboard_a: SeasonScoreboard = store.get_scoreboard(*challenge.season_id, (*challenge).duelist_id_a.into());
            let mut scoreboard_b: SeasonScoreboard = store.get_scoreboard(*challenge.season_id, (*challenge).duelist_id_b.into());
            scoreboard_a.apply_rewards(@rewards_a);
            scoreboard_b.apply_rewards(@rewards_b);
            // save
            store.set_scoreboard(@scoreboard_a);
            store.set_scoreboard(@scoreboard_b);

            // update leaderboards
            let mut leaderboard: Leaderboard = store.get_leaderboard(*challenge.season_id);
            rewards_a.position = leaderboard.insert_score(*challenge.duelist_id_a, scoreboard_a.points);
            rewards_b.position = leaderboard.insert_score(*challenge.duelist_id_b, scoreboard_b.points);
            if (rewards_a.position != 0 || rewards_b.position != 0) {
                // adjust [a] if [b] moved up
                if (rewards_b.position <= rewards_a.position) {
                    rewards_a.position = if (rewards_a.position < leaderboard.positions) {rewards_a.position+1} else {0};
                }
                store.set_leaderboard(@leaderboard);
            }

            // unlock achievements
            if (*challenge.winner != 0) {
                let winner_address: ContractAddress = (*challenge).winner_address();

                // TODO: check win count first!
                Trophy::FirstBlood.progress(store.world, winner_address, 1);
            }
        }
    }
}

