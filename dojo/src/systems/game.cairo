use starknet::{ContractAddress};
use pistols::models::challenge::{Challenge};
use pistols::models::duelist::{Duelist};
use pistols::types::duel_progress::{DuelProgress};

// define the interface
#[starknet::interface]
pub trait IGame<TState> {
    //
    // Game actions
    fn commit_moves(
        ref self: TState,
        duelist_id: u128,
        duel_id: u128,
        hashed: u128,
    );
    fn reveal_moves(
        ref self: TState,
        duelist_id: u128,
        duel_id: u128,
        salt: felt252,
        moves: Span<u8>,
    );
    // end season and start next
    fn collect(ref self: TState) -> felt252;

    //
    // view calls
    fn get_duel_deck(self: @TState, duel_id: u128) -> Span<Span<u8>>;
    fn get_duel_progress(self: @TState, duel_id: u128) -> DuelProgress;
    fn can_collect(self: @TState) -> bool;
    
    // test calls
    fn test_validate_commit_message(self: @TState, account: ContractAddress, signature: Array<felt252>, duelId: felt252, duelistId: felt252) -> bool;
}

#[dojo::contract]
pub mod game {
    // use debug::PrintTrait;
    use traits::{Into, TryInto};
    use starknet::{ContractAddress, get_block_timestamp, get_block_info};
    use dojo::world::{WorldStorage};
    use dojo::model::{ModelStorage, ModelValueStorage};

    //-------------------------------------
    // components
    //
    use achievement::components::achievable::AchievableComponent;
    use achievement::types::task::{Task, TaskTrait};
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
    use pistols::interfaces::systems::{
        SystemsTrait,
        IDuelistTokenDispatcher, IDuelistTokenDispatcherTrait,
        IDuelTokenDispatcher, IDuelTokenDispatcherTrait,
    };
    use pistols::systems::rng::{RngWrap, RngWrapTrait};
    use pistols::models::{
        player::{Player, PlayerTrait, Activity, ActivityTrait},
        challenge::{
            Challenge, ChallengeTrait,
            ChallengeFameBalance,
            Round, RoundTrait, RoundValue,
            MovesTrait,
        },
        duelist::{
            Duelist, DuelistTrait,
            Scoreboard, ScoreboardTable,
            Score, ScoreTrait,
        },
        pact::{
            Pact, PactTrait,
        },
        table::{
            TableConfig, TableConfigTrait, TableConfigValue,
        },
        season::{
            SeasonConfig, SeasonConfigTrait,
        },
        config::{
            ConfigManagerTrait,
        },
    };
    use pistols::types::{
        challenge_state::{ChallengeState, ChallengeStateTrait},
        duel_progress::{DuelProgress, DuelistDrawnCard},
        round_state::{RoundState, RoundStateTrait},
        cards::deck::{ Deck, DeckTrait},
        typed_data::{CommitMoveMessage, CommitMoveMessageTrait},
    };
    use pistols::types::trophies::{Trophy, TrophyTrait, TROPHY};
    use pistols::types::constants::{CONST};
    use pistols::utils::short_string::{ShortStringTrait};
    use pistols::utils::misc::{ZERO};
    use pistols::libs::store::{Store, StoreTrait};
    use pistols::libs::game_loop::{game_loop, make_moves_hash};

    mod Errors {
        const CHALLENGE_EXISTS: felt252          = 'PISTOLS: Challenge exists';
        const CHALLENGE_NOT_IN_PROGRESS: felt252 = 'PISTOLS: Challenge not active';
        const NOT_ACCEPTED: felt252              = 'PISTOLS: Accept challenge first';
        const NOT_YOUR_DUEL: felt252             = 'PISTOLS: Not your duel';
        const NOT_YOUR_DUELIST: felt252          = 'PISTOLS: Not your duelist';
        const ROUND_NOT_IN_COMMIT: felt252       = 'PISTOLS: Round not in commit';
        const ROUND_NOT_IN_REVEAL: felt252       = 'PISTOLS: Round not in reveal';
        const ALREADY_COMMITTED: felt252         = 'PISTOLS: Already committed';
        const ALREADY_REVEALED: felt252          = 'PISTOLS: Already revealed';
        const INVALID_SALT: felt252              = 'PISTOLS: Invalid salt';
        const INVALID_MOVES_COUNT: felt252       = 'PISTOLS: Invalid moves count';
        const MOVES_HASH_MISMATCH: felt252       = 'PISTOLS: Moves hash mismatch';
        const IMPOSSIBLE_ERROR: felt252          = 'PISTOLS: Impossible error';
        const SEASON_ENDED: felt252              = 'PISTOLS: Season ended';
        const SEASON_IS_ACTIVE: felt252          = 'PISTOLS: Season is active';
        const SEASON_NOT_ENDGAME: felt252        = 'PISTOLS: Not endgame';
    }

    fn dojo_init(ref self: ContractState) {
        let mut world = self.world(@"pistols");

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

    #[generate_trait]
    impl WorldDefaultImpl of WorldDefaultTrait {
        fn world_default(self: @ContractState) -> WorldStorage {
            self.world(@"pistols")
        }
    }

    // impl: implement functions specified in trait
    #[abi(embed_v0)]
    impl ActionsImpl of super::IGame<ContractState> {

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

            // validate duelist
            let owner: ContractAddress = self.validate_ownership(duelist_id);
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
                    store.emit_required_action(challenge.duelist_id_a, 0);
                } else {
                    // other duelist committed: call for action (keep self flag for reveal)
                    store.emit_required_action(challenge.duelist_id_b, duel_id);
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
                    store.emit_required_action(challenge.duelist_id_b, 0);
                } else {
                    // other duelist committed: call for action (keep self flag for reveal)
                    store.emit_required_action(challenge.duelist_id_a, duel_id);
                }
            }

            // move to reveal phase?
            if (round.moves_a.hashed != 0 && round.moves_b.hashed != 0) {
                round.state = RoundState::Reveal;
            }

            // events
            PlayerTrait::check_in(ref store, Activity::CommittedMoves, starknet::get_caller_address(), duel_id.into());

            store.set_round(@round);
        }

        fn reveal_moves(ref self: ContractState,
            duelist_id: u128,
            duel_id: u128,
            salt: felt252,
            moves: Span<u8>,
        ) {
            let mut store: Store = StoreTrait::new(self.world_default());

            // validate challenge
            let mut challenge: Challenge = store.get_challenge(duel_id);
            assert(challenge.state == ChallengeState::InProgress, Errors::CHALLENGE_NOT_IN_PROGRESS);
            
            // validate Round
            let mut round: Round = store.get_round( duel_id);
            assert(round.state == RoundState::Reveal, Errors::ROUND_NOT_IN_REVEAL);

            // validate duelist
            self.validate_ownership(duelist_id);
            let duelist_number: u8 = challenge.duelist_number(duelist_id);
            assert(duelist_number != 0, Errors::NOT_YOUR_DUEL);

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
                round.moves_a.initialize(salt, moves);
                store.emit_required_action(challenge.duelist_id_a, 0);
            } else if (duelist_number == 2) {
                assert(round.moves_b.salt == 0, Errors::ALREADY_REVEALED);
                assert(round.moves_b.hashed == hashed, Errors::MOVES_HASH_MISMATCH);
                round.moves_b.initialize(salt, moves);
                store.emit_required_action(challenge.duelist_id_b, 0);
            } else {
                assert(false, Errors::IMPOSSIBLE_ERROR);
            }

            // events
            Activity::RevealedMoves.emit(ref store.world, starknet::get_caller_address(), duel_id.into());

            //
            // missing reveal, update only and wait for final reveal
            if (round.moves_a.salt == 0 || round.moves_b.salt == 0) {
                store.set_round(@round);
                return;
            }

            // execute game loop...
            let wrapped: @RngWrap = RngWrapTrait::new(store.world.rng_address());
            let progress: DuelProgress = game_loop(wrapped, @challenge.get_deck(), ref round);
            store.set_round(@round);

            // end challenge
            challenge.winner = progress.winner;
            challenge.state = if (progress.winner == 0) {ChallengeState::Draw} else {ChallengeState::Resolved};
            challenge.timestamp_end = get_block_timestamp();
            self.finish_challenge(ref store, challenge, round);

            // transfer FAME reward
            let (balance_a, balance_b): (i128, i128) = store.world.duelist_token_dispatcher().transfer_fame_reward(duel_id);
            store.set_challenge_fame_bill(
                @ChallengeFameBalance {
                    duel_id,
                    balance_a,
                    balance_b,
                }
            );

            if (challenge.winner != 0) {
                // send duel token to winner
                store.world.duel_token_dispatcher().transfer_to_winner(duel_id);
                // winning event
                Activity::DuelResolved.emit(ref store.world, challenge.winner_address(), duel_id.into());
            } else {
                // draw event
                Activity::DuelDraw.emit(ref store.world, starknet::get_caller_address(), duel_id.into());
            }

            // undo pacts
            store.exit_challenge(challenge.duelist_id_a);
            store.exit_challenge(challenge.duelist_id_b);
            challenge.unset_pact(ref store);
        }

        fn collect(ref self: ContractState) -> felt252 {
            let mut store: Store = StoreTrait::new(self.world_default());
            // collect season if permitted
            let mut season: SeasonConfig = store.get_current_season();
            let new_season_table_id: felt252 = season.collect(ref store);
            ConfigManagerTrait::set_season(ref store, new_season_table_id);
            // all hail the collector
            Trophy::Collector.progress(store.world, starknet::get_caller_address(), 1);
            // TODO: transfer fees
            // TODO: transfer prizes
            // TODO: transfer FAME
            // TODO: transfer DUEL
            (new_season_table_id)
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
            if (challenge.state.is_finished()) {
                let mut round: Round = store.get_round(duel_id);
                let wrapped: @RngWrap = RngWrapTrait::new(store.world.rng_address());
                (game_loop(wrapped, @challenge.get_deck(), ref round))
            } else {
                {Default::default()}
            }
        }

        fn can_collect(self: @ContractState) -> bool {
            let mut store: Store = StoreTrait::new(self.world_default());
            let season: SeasonConfig = store.get_current_season();
            (season.can_collect())
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


    //------------------------------------
    // Internal calls
    //
    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn validate_ownership(self: @ContractState, duelist_id: u128) -> ContractAddress {
            let mut world = self.world_default();
            let duelist_dispatcher: IDuelistTokenDispatcher = world.duelist_token_dispatcher();
            let owner: ContractAddress = duelist_dispatcher.owner_of(duelist_id.into());
            assert(owner == starknet::get_caller_address(), Errors::NOT_YOUR_DUELIST);
            (owner)
        }

        fn finish_challenge(self: @ContractState, ref store: Store, challenge: Challenge, round: Round) {
            store.set_challenge(@challenge);

            // player score (per table)
            let mut score_player_a: ScoreboardTable = store.get_scoreboard_table(challenge.address_a.into(), challenge.table_id);
            let mut score_player_b: ScoreboardTable = store.get_scoreboard_table(challenge.address_b.into(), challenge.table_id);
            // duelist score (global)
            let mut score_duelist_a: Scoreboard = store.get_scoreboard(challenge.duelist_id_a.into());
            let mut score_duelist_b: Scoreboard = store.get_scoreboard(challenge.duelist_id_b.into());
            
            // update totals
            ScoreTrait::update_totals(ref score_player_a.score, ref score_player_b.score, challenge.winner);
            ScoreTrait::update_totals(ref score_duelist_a.score, ref score_duelist_b.score, challenge.winner);

            // compute honour from final round
            let round: RoundValue = store.get_round_value(challenge.duel_id);
            score_player_a.score.update_honour(round.state_a.honour);
            score_player_b.score.update_honour(round.state_b.honour);
            score_duelist_a.score.update_honour(round.state_a.honour);
            score_duelist_b.score.update_honour(round.state_b.honour);
            
            // save
            store.set_scoreboard_table(@score_player_a);
            store.set_scoreboard_table(@score_player_b);
            store.set_scoreboard(@score_duelist_a);
            store.set_scoreboard(@score_duelist_b);

            // unlock achievements
            if (challenge.winner != 0) {
                let winner_address: ContractAddress = challenge.winner_address();

                // TODO: check win count first!
                Trophy::FirstBlood.progress(store.world, winner_address, 1);
            }
        }
    }
}

