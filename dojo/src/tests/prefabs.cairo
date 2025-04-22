#[cfg(test)]
pub mod prefabs {
    use starknet::{ContractAddress};

    // use dojo::world::{WorldStorage};

    use pistols::models::challenge::{ChallengeValue, RoundValue, DuelType};
    use pistols::types::challenge_state::{ChallengeState};
    use pistols::types::round_state::{RoundState};
    use pistols::libs::game_loop::{make_moves_hash};
    use pistols::types::timestamp::{TimestampTrait};
    use pistols::tests::tester::{tester,
        tester::{
            // StoreTrait,
            TestSystems,
            ID, MESSAGE,
        }
    };
    use pistols::systems::rng_mock::{IRngMockDispatcherTrait, MockedValue, MockedValueTrait};
    use pistols::types::cards::env::{ENV_DICES};

    pub const NAME_A: felt252 = 'Sensei';
    pub const NAME_B: felt252 = 'Senpai';
    pub const DUEL_TYPE: DuelType = DuelType::Practice;
    pub const PRIZE_VALUE: u128 = 0;
    // pub const PRIZE_VALUE: u128 = 20_000_000_000_000_000_000;

    pub const SALT_A: felt252 = 0xa6f099b756a87e62;
    pub const SALT_B: felt252 = 0xf9a978e92309da78;

    // sync from EnvCard::get_full_deck()
    pub const ENV_CARD_NEUTRAL: felt252 = ENV_DICES::DOUBLE_TACTICS;
    pub const ENV_CARD_MISS: felt252 = ENV_DICES::DAMAGE_DOWN;
    pub const ENV_CARD_CRIT: felt252 = ENV_DICES::DOUBLE_DAMAGE_UP;


    #[derive(Copy, Drop)]
    pub struct PlayerMoves {
        pub salt: felt252,
        pub moves: Span<u8>,
        pub hashed: u128,
    }

    #[generate_trait]
    pub impl PlayerMovesImpl of PlayerMovesTrait {
        fn new(salt: felt252, moves: Span<u8>) -> PlayerMoves {
            (PlayerMoves{salt, moves, hashed: make_moves_hash(salt, moves)})
        }
    }

    pub fn start_new_challenge(sys: @TestSystems, duelist_a: ContractAddress, duelist_b: ContractAddress, duel_type: DuelType, lives_staked: u8) -> u128 {
        let duel_id: u128 = tester::execute_create_duel(sys.duels, duelist_a, duelist_b, MESSAGE(), duel_type, 48, lives_staked);
        tester::elapse_block_timestamp(TimestampTrait::from_minutes(2));
        tester::execute_reply_duel(sys.duels, duelist_b, ID(duelist_b), duel_id, true);
        (duel_id)
    }

    pub fn start_get_new_challenge(sys: @TestSystems, duelist_a: ContractAddress, duelist_b: ContractAddress, duel_type: DuelType, lives_staked: u8) -> (ChallengeValue, RoundValue, u128) {
        let duel_id: u128 = start_new_challenge(sys, duelist_a, duelist_b, duel_type, lives_staked);
        let (challenge, round) = tester::get_Challenge_Round(sys, duel_id);
        assert_eq!(challenge.state, ChallengeState::InProgress, "challenge.state");
        assert_eq!(round.state, RoundState::Commit, "round.state");
        (challenge, round, duel_id)
    }

    pub fn commit_reveal_get(sys: @TestSystems, duel_id: u128, duelist_a: ContractAddress, duelist_b: ContractAddress, mocked: Span<MockedValue>, moves_a: PlayerMoves, moves_b: PlayerMoves) -> (ChallengeValue, RoundValue) {
        (*sys.rng).mock_values(mocked);
        tester::execute_commit_moves(sys.game, duelist_a, duel_id, moves_a.hashed);
        tester::execute_commit_moves(sys.game, duelist_b, duel_id, moves_b.hashed);
        tester::execute_reveal_moves(sys.game, duelist_a, duel_id, moves_a.salt, moves_a.moves);
        tester::execute_reveal_moves(sys.game, duelist_b, duel_id, moves_b.salt, moves_b.moves);
        let (challenge, round) = tester::get_Challenge_Round(sys, duel_id);
        (challenge, round)
    }


    pub fn get_moves_custom(moves_a: Span<u8>, moves_b: Span<u8>) -> (Span<MockedValue>, PlayerMoves, PlayerMoves) {
        (
            [
                MockedValueTrait::new('shoot_a', 1),
                MockedValueTrait::new('shoot_b', 1),
                MockedValueTrait::shuffled('env', 
                    [ENV_CARD_NEUTRAL, ENV_CARD_NEUTRAL, ENV_CARD_NEUTRAL, ENV_CARD_NEUTRAL, ENV_CARD_NEUTRAL,
                    ENV_CARD_NEUTRAL, ENV_CARD_NEUTRAL, ENV_CARD_NEUTRAL, ENV_CARD_NEUTRAL, ENV_CARD_NEUTRAL].span()
                ),
            ].span(),
            PlayerMovesTrait::new(SALT_A, moves_a),
            PlayerMovesTrait::new(SALT_B, moves_b),
        )
    }

    pub fn get_moves_dual_miss() -> (Span<MockedValue>, PlayerMoves, PlayerMoves) {
        let moves_a: Span<u8> = [1, 2].span();
        let moves_b: Span<u8> = [1, 2].span();
        (
            [
                MockedValueTrait::new('shoot_a', 100),
                MockedValueTrait::new('shoot_b', 100),
                MockedValueTrait::shuffled('env',
                    [ENV_CARD_MISS,ENV_CARD_MISS,ENV_CARD_MISS,ENV_CARD_MISS,ENV_CARD_MISS,
                    ENV_CARD_MISS,ENV_CARD_MISS,ENV_CARD_MISS,ENV_CARD_MISS,ENV_CARD_MISS,].span()
                ),
            ].span(),
            PlayerMovesTrait::new(SALT_A, moves_a),
            PlayerMovesTrait::new(SALT_B, moves_b),
        )
    }

    pub fn get_moves_dual_crit() -> (Span<MockedValue>, PlayerMoves, PlayerMoves) {
        let moves_a: Span<u8> = [1, 2].span();
        let moves_b: Span<u8> = [1, 2].span();
        (
            [
                MockedValueTrait::new('shoot_a', 1),
                MockedValueTrait::new('shoot_b', 1),
                MockedValueTrait::shuffled('env', [ENV_CARD_CRIT].span()),
            ].span(),
            PlayerMovesTrait::new(SALT_A, moves_a),
            PlayerMovesTrait::new(SALT_B, moves_b),
        )
    }

    pub fn get_moves_crit_a() -> (Span<MockedValue>, PlayerMoves, PlayerMoves) {
        let moves_a: Span<u8> = [1, 2].span();
        let moves_b: Span<u8> = [2, 3].span();
        (
            [
                MockedValueTrait::new('shoot_a', 1),
                MockedValueTrait::new('shoot_b', 1),
                MockedValueTrait::shuffled('env', [ENV_CARD_CRIT].span()),
            ].span(),
            PlayerMovesTrait::new(SALT_A, moves_a),
            PlayerMovesTrait::new(SALT_B, moves_b),
        )
    }

    pub fn get_moves_crit_b() -> (Span<MockedValue>, PlayerMoves, PlayerMoves) {
        let moves_a: Span<u8> = [2, 3].span();
        let moves_b: Span<u8> = [1, 2].span();
        (
            [
                MockedValueTrait::new('shoot_a', 100),
                MockedValueTrait::new('shoot_b', 1),
                MockedValueTrait::shuffled('env', [ENV_CARD_CRIT].span()),
            ].span(),
            PlayerMovesTrait::new(SALT_A, moves_a),
            PlayerMovesTrait::new(SALT_B, moves_b),
        )
    }

}
