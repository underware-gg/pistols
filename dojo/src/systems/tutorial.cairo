use pistols::types::duel_progress::{DuelProgress};

// define the interface
#[starknet::interface]
pub trait ITutorial<TState> {
    fn create_tutorial(
        ref self: TState,
        player_id: u128,
        tutorial_id: u128,
    ) -> u128;
    // same as game.cairo
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

    //
    // view calls
    fn calc_duel_id(self: @TState, player_id: u128, tutorial_id: u128) -> u128;
    fn get_duel_progress(self: @TState, duel_id: u128) -> DuelProgress;
}

#[dojo::contract]
pub mod tutorial {
    use core::num::traits::Zero;
    use dojo::world::{WorldStorage};

    //-------------------------------------
    // pistols
    //
    use pistols::interfaces::systems::{SystemsTrait};
    use pistols::systems::rng::{RngWrapTrait, MockedValue};
    use pistols::models::{
        challenge::{
            Challenge, ChallengeTrait,
            Round,
            MovesTrait,
        },
        table::{TABLES},
    };
    use pistols::types::{
        premise::{Premise},
        profile_type::{ProfileType, ProfileTypeTrait, CharacterProfile, BotProfile, ProfileManagerTrait},
        challenge_state::{ChallengeState, ChallengeStateTrait},
        duel_progress::{DuelProgress},
        round_state::{RoundState},
        cards::deck::{Deck},
    };
    use pistols::libs::store::{Store, StoreTrait};
    use pistols::libs::game_loop::{game_loop};
    use pistols::libs::tut::{TutorialLevel, TutorialLevelTrait};

    mod Errors {
        pub const INVALID_TUTORIAL_LEVEL: felt252       = 'TUTORIAL: Invalid level';
        pub const INVALID_PLAYER: felt252               = 'TUTORIAL: Invalid player';
        // const NOT_YOUR_DUEL: felt252                = 'TUTORIAL: Not your duel';
        pub const CHALLENGE_NOT_IN_PROGRESS: felt252    = 'TUTORIAL: Challenge not active';
        pub const ROUND_NOT_IN_COMMIT: felt252          = 'TUTORIAL: Round not in commit';
        pub const ROUND_NOT_IN_REVEAL: felt252          = 'TUTORIAL: Round not in reveal';
        pub const INVALID_MOVES_COUNT: felt252          = 'TUTORIAL: Invalid moves count';
    }

    fn dojo_init(ref self: ContractState) {
        let mut store: Store = StoreTrait::new(self.world_default());
        // create agent profiles
        ProfileManagerTrait::initialize(ref store, ProfileType::Character(CharacterProfile::Unknown));
        ProfileManagerTrait::initialize(ref store, ProfileType::Bot(BotProfile::Unknown));
    }

    #[generate_trait]
    impl WorldDefaultImpl of WorldDefaultTrait {
        #[inline(always)]
        fn world_default(self: @ContractState) -> WorldStorage {
            (self.world(@"pistols"))
        }
    }

    #[abi(embed_v0)]
    impl ActionsImpl of super::ITutorial<ContractState> {

        fn calc_duel_id(self: @ContractState,
            player_id: u128,
            tutorial_id: u128,
        ) -> u128 {
            let level: TutorialLevel = tutorial_id.into();
            assert(level != TutorialLevel::Undefined, Errors::INVALID_TUTORIAL_LEVEL);
            let duel_id: u128 = level.make_duel_id(player_id);
            (duel_id)
        }

        fn create_tutorial(ref self: ContractState,
            player_id: u128,
            tutorial_id: u128,
        ) -> u128 {
            let mut store: Store = StoreTrait::new(self.world_default());

            let level: TutorialLevel = tutorial_id.into();
            assert(level != TutorialLevel::Undefined, Errors::INVALID_TUTORIAL_LEVEL);
            assert(player_id.is_non_zero(), Errors::INVALID_PLAYER);

            let player_profile: ProfileType = ProfileType::Character(CharacterProfile::Player);
            let opponent_profile: ProfileType = level.opponent_profile();

            let duel_id: u128 = level.make_duel_id(player_id);

            // create Challenge
            let challenge = Challenge {
                duel_id,
                table_id: TABLES::TUTORIAL,
                premise: Premise::Tutorial,
                quote: level.quote(),
                // duelists
                address_a: starknet::get_caller_address(),
                address_b: starknet::get_caller_address(),
                duelist_id_a: opponent_profile.duelist_id(),
                duelist_id_b: player_profile.duelist_id(),
                // progress
                state: ChallengeState::InProgress,
                winner: 0,
                // times
                timestamp_start: starknet::get_block_timestamp(),
                timestamp_end: 0,
            };

            // create Round
            let mut round = Round {
                duel_id: challenge.duel_id,
                state: RoundState::Commit,
                moves_a: Default::default(),
                moves_b: Default::default(),
                state_a: Default::default(),
                state_b: Default::default(),
                final_blow: Default::default(),
            };

            store.set_challenge(@challenge);
            store.set_round(@round);

            (challenge.duel_id)
        }

        fn commit_moves(ref self: ContractState,
            duelist_id: u128,
            duel_id: u128,
            hashed: u128,
        ) {
            let mut store: Store = StoreTrait::new(self.world_default());
            let challenge: Challenge = store.get_challenge(duel_id);

            // find level
            let level: TutorialLevel = challenge.into();
            assert(level != TutorialLevel::Undefined, Errors::INVALID_TUTORIAL_LEVEL);

            // validate challenge
            let mut round: Round = store.get_round(duel_id);
            assert(challenge.duelist_id_b == duelist_id, Errors::INVALID_PLAYER);
            assert(challenge.state == ChallengeState::InProgress, Errors::CHALLENGE_NOT_IN_PROGRESS);
            assert(round.state == RoundState::Commit, Errors::ROUND_NOT_IN_COMMIT);

            // just move to reveal phase
            round.state = RoundState::Reveal;
            round.moves_a.hashed = 0xffff; // NPC
            round.moves_b.hashed = hashed; // Player
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

            // find level
            let level: TutorialLevel = challenge.into();
            assert(level != TutorialLevel::Undefined, Errors::INVALID_TUTORIAL_LEVEL);

            // validate challenge
            let mut round: Round = store.get_round(duel_id);
            assert(challenge.duelist_id_b == duelist_id, Errors::INVALID_PLAYER);
            assert(challenge.state == ChallengeState::InProgress, Errors::CHALLENGE_NOT_IN_PROGRESS);
            assert(round.state == RoundState::Reveal, Errors::ROUND_NOT_IN_REVEAL);

            // store player moves
            assert(moves.len() >= 2 && moves.len() <= 4, Errors::INVALID_MOVES_COUNT);
            round.moves_b.initialize(0xffff, moves);

            // store NPC moves
            let (npc_moves, mocked): (Span<u8>, Span<MockedValue>) = level.make_moves(round.moves_b.as_hand());
            round.moves_a.initialize(0xffff, npc_moves);

            // execute game loop...
            let deck: Deck = challenge.get_deck();
            let wrapped = RngWrapTrait::wrap(store.world.rng_mock_address(), mocked);
            let progress: DuelProgress = game_loop(wrapped, @deck, ref round);

            // end challenge
            challenge.winner = progress.winner;
            challenge.state = if (progress.winner == 0) {ChallengeState::Draw} else {ChallengeState::Resolved};
            challenge.timestamp_end = starknet::get_block_timestamp();
            store.set_challenge(@challenge);
            store.set_round(@round);
        }

        fn get_duel_progress(self: @ContractState, duel_id: u128) -> DuelProgress {
            let mut store: Store = StoreTrait::new(self.world_default());
            let challenge: Challenge = store.get_challenge(duel_id);
            if (challenge.state.is_finished()) {
                let level: TutorialLevel = challenge.into();
                let mut round: Round = store.get_round(duel_id);
                let (_, mocked): (Span<u8>, Span<MockedValue>) = level.make_moves(round.moves_b.as_hand());
                let wrapped = RngWrapTrait::wrap(store.world.rng_mock_address(), mocked);
                (game_loop(wrapped, @challenge.get_deck(), ref round))
            } else {
                {Default::default()}
            }
        }

    }
}

