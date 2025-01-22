use starknet::{ContractAddress};
use pistols::models::challenge::{Challenge};
use pistols::models::duelist::{Duelist};
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
        player_id: u128,
        tutorial_id: u128,
        hashed: u128,
    );
    fn reveal_moves(
        ref self: TState,
        player_id: u128,
        tutorial_id: u128,
        salt: felt252,
        moves: Span<u8>,
    );

    //
    // view calls
    fn calc_duel_id(self: @TState, tutorial_id: u128) -> u128;
}

#[dojo::contract]
pub mod tutorial {
    // use debug::PrintTrait;
    use traits::{Into, TryInto};
    use starknet::{ContractAddress, get_block_timestamp, get_block_info};
    use dojo::world::{WorldStorage};
    use dojo::model::{ModelStorage, ModelValueStorage};

    //-------------------------------------
    // pistols
    //
    use pistols::interfaces::systems::{
        SystemsTrait,
        IRngMockDispatcher, IRngMockDispatcherTrait,
    };
    use pistols::systems::rng::{RngWrap, RngWrapTrait, MockedValue};
    use pistols::models::{
        challenge::{
            Challenge, ChallengeTrait,
            Round, RoundTrait, RoundValue,
            MovesTrait,
        },
        duelist::{
            Duelist, DuelistTrait,
        },
        table::{
            TableConfigValue, TABLES,
        },
    };
    use pistols::types::{
        premise::{Premise, PremiseTrait},
        profile_type::{ProfileType, ProfileTypeTrait, CharacterProfile, BotProfile, ProfileManagerTrait},
        challenge_state::{ChallengeState, ChallengeStateTrait},
        duel_progress::{DuelProgress, DuelistDrawnCard},
        round_state::{RoundState, RoundStateTrait},
        constants::{CONST},
    };
    use pistols::types::cards::{
        deck::{Deck, DeckTrait},
    };
    use pistols::utils::misc::{ZERO};
    use pistols::libs::store::{Store, StoreTrait};
    use pistols::libs::game_loop::{game_loop, make_moves_hash};
    use pistols::libs::tut::{TutorialLevel, TutorialLevelTrait};

    mod Errors {
        const INVALID_TUTORIAL_LEVEL: felt252       = 'TUTORIAL: Invalid level';
        const INVALID_PLAYER: felt252               = 'TUTORIAL: Invalid player';
        const NOT_YOUR_DUEL: felt252                = 'TUTORIAL: Not your duel';
        const CHALLENGE_NOT_IN_PROGRESS: felt252    = 'TUTORIAL: Challenge not active';
        const ROUND_NOT_IN_COMMIT: felt252          = 'TUTORIAL: Round not in commit';
        const ROUND_NOT_IN_REVEAL: felt252          = 'TUTORIAL: Round not in reveal';
        const INVALID_MOVES_COUNT: felt252          = 'TUTORIAL: Invalid moves count';
    }

    fn dojo_init(ref self: ContractState) {
        let mut store: Store = StoreTrait::new(self.world(@"pistols"));
        // create agent profiles
        ProfileManagerTrait::initialize(ref store, ProfileType::Character(CharacterProfile::Unknown));
        ProfileManagerTrait::initialize(ref store, ProfileType::Bot(BotProfile::Unknown));
    }

    #[generate_trait]
    impl WorldDefaultImpl of WorldDefaultTrait {
        fn world_default(self: @ContractState) -> WorldStorage {
            self.world(@"pistols")
        }
    }

    #[abi(embed_v0)]
    impl ActionsImpl of super::ITutorial<ContractState> {

        fn calc_duel_id(self: @ContractState,
            tutorial_id: u128,
        ) -> u128 {
            let level: TutorialLevel = tutorial_id.into();
            assert(level != TutorialLevel::Undefined, Errors::INVALID_TUTORIAL_LEVEL);
            let duel_id: u128 = level.make_duel_id(starknet::get_caller_address());
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

            let duel_id: u128 = level.make_duel_id(starknet::get_caller_address());

            // create Challenge
            let opponent: ProfileType = level.opponent_profile();
            let challenge = Challenge {
                duel_id,
                table_id: TABLES::TUTORIAL,
                premise: Premise::Tutorial,
                quote: 0,
                // duelists
                address_a: starknet::get_caller_address(),
                address_b: starknet::get_caller_address(),
                duelist_id_a: opponent.duelist_id(), // NPC
                duelist_id_b: player_id,             // Player  
                // progress
                state: ChallengeState::InProgress,
                winner: 0,
                // times
                timestamp_start: get_block_timestamp(),
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
            player_id: u128,
            tutorial_id: u128,
            hashed: u128,
        ) {
            let mut store: Store = StoreTrait::new(self.world_default());

            let level: TutorialLevel = tutorial_id.into();
            assert(level != TutorialLevel::Undefined, Errors::INVALID_TUTORIAL_LEVEL);
            assert(player_id.is_non_zero(), Errors::INVALID_PLAYER);

            let duel_id: u128 = level.make_duel_id(starknet::get_caller_address());
            let challenge: Challenge = store.get_challenge(duel_id);
            let mut round: Round = store.get_round(duel_id);

            assert(challenge.duelist_id_b == player_id, Errors::NOT_YOUR_DUEL);
            assert(challenge.state == ChallengeState::InProgress, Errors::CHALLENGE_NOT_IN_PROGRESS);
            assert(round.state == RoundState::Commit, Errors::ROUND_NOT_IN_COMMIT);

            // just move to reveal phase
            round.state = RoundState::Reveal;
            round.moves_a.hashed = 0xffff; // NPC
            round.moves_b.hashed = hashed; // Player
            store.set_round(@round);
        }

        fn reveal_moves(ref self: ContractState,
            player_id: u128,
            tutorial_id: u128,
            salt: felt252,
            moves: Span<u8>,
        ) {
            let mut store: Store = StoreTrait::new(self.world_default());

            let level: TutorialLevel = tutorial_id.into();
            assert(level != TutorialLevel::Undefined, Errors::INVALID_TUTORIAL_LEVEL);
            assert(player_id.is_non_zero(), Errors::INVALID_PLAYER);

            let duel_id: u128 = level.make_duel_id(starknet::get_caller_address());
            let mut challenge: Challenge = store.get_challenge(duel_id);
            let mut round: Round = store.get_round(duel_id);

            assert(challenge.duelist_id_b == player_id, Errors::NOT_YOUR_DUEL);
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
            challenge.timestamp_end = get_block_timestamp();
            store.set_challenge(@challenge);
            store.set_round(@round);
        }
    }
}

