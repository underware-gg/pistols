#[cfg(test)]
mod prefabs {
    use debug::PrintTrait;
    use core::traits::{TryInto, Into};
    use starknet::{ContractAddress};

    use dojo::world::{WorldStorage};

    use pistols::models::challenge::{Challenge, ChallengeValue, Round, RoundValue};
    use pistols::models::table::{TableConfig, TABLES};
    use pistols::types::challenge_state::{ChallengeState, ChallengeStateTrait};
    use pistols::types::duel_progress::{DuelProgress, DuelStep};
    use pistols::types::round_state::{RoundState, RoundStateTrait};
    use pistols::types::constants::{CONST, HONOUR};
    use pistols::libs::game_loop::{make_moves_hash};
    use pistols::utils::timestamp::{TimestampTrait};
    use pistols::utils::math::{MathTrait};
    use pistols::tests::tester::{tester,
        tester::{
            TestSystems,
            FLAGS, ID, ZERO,
        }
    };
    use pistols::systems::rng_mock::{IRngMockDispatcher, IRngMockDispatcherTrait, ShufflerTrait};
    use pistols::types::cards::env::{ENV_DICES};

    const NAME_A: felt252 = 'Sensei';
    const NAME_B: felt252 = 'Senpai';
    const MESSAGE: felt252 = 'For honour!!!';
    const TABLE_ID: felt252 = TABLES::PRACTICE;
    const PRIZE_VALUE: u128 = 0;
    // const PRIZE_VALUE: u128 = 20_000_000_000_000_000_000;

    const SALT_A: felt252 = 0xa6f099b756a87e62;
    const SALT_B: felt252 = 0xf9a978e92309da78;

    // sync from EnvCard::get_full_deck()
    const ENV_CARD_NEUTRAL: felt252 = ENV_DICES::DOUBLE_TACTICS;
    const ENV_CARD_MISS: felt252 = ENV_DICES::DAMAGE_DOWN;
    const ENV_CARD_CRIT: felt252 = ENV_DICES::DOUBLE_DAMAGE_UP;


    #[derive(Copy, Drop)]
    pub struct SaltsValues {
        salts: Span<felt252>,
        values: Span<felt252>,
    }

    #[derive(Copy, Drop)]
    pub struct PlayerMoves {
        salt: felt252,
        moves: Span<u8>,
        hashed: u128,
    }

    #[generate_trait]
    impl SaltsValuesImpl of SaltsValuesTrait {
        fn new(salts: Span<felt252>, values: Span<felt252>) -> SaltsValues {
            (SaltsValues{salts, values})
        }
        fn empty() -> SaltsValues {
            (SaltsValues{salts: [].span(), values: [].span()})
        }
    }

    #[generate_trait]
    impl PlayerMovesImpl of PlayerMovesTrait {
        fn new(salt: felt252, moves: Span<u8>) -> PlayerMoves {
            (PlayerMoves{salt, moves, hashed: make_moves_hash(salt, moves)})
        }
    }


    fn start_new_challenge(sys: TestSystems, duelist_a: ContractAddress, duelist_b: ContractAddress, table_id: felt252) -> u128 {
        let duel_id: u128 = tester::execute_create_duel(@sys.duels, duelist_a, duelist_b, MESSAGE, table_id, 48);
        tester::elapse_timestamp(TimestampTrait::from_days(1));
        tester::execute_reply_duel(@sys.duels, duelist_b, ID(duelist_b), duel_id, true);
        (duel_id)
    }

    fn start_get_new_challenge(sys: TestSystems, duelist_a: ContractAddress, duelist_b: ContractAddress, table_id: felt252) -> (ChallengeValue, RoundValue, u128) {
        let duel_id: u128 = start_new_challenge(sys, duelist_a, duelist_b, table_id);
        let challenge: ChallengeValue = tester::get_ChallengeValue(sys.world, duel_id);
        let round: RoundValue = tester::get_RoundValue(sys.world, duel_id);
        assert(challenge.state == ChallengeState::InProgress, 'challenge.state');
        assert(round.state == RoundState::Commit, 'round.state');
        (challenge, round, duel_id)
    }

    fn commit_reveal_get(sys: TestSystems, duel_id: u128, duelist_a: ContractAddress, duelist_b: ContractAddress, salts: SaltsValues, moves_a: PlayerMoves, moves_b: PlayerMoves) -> (ChallengeValue, RoundValue) {
        @sys.rng.set_mocked_values(salts.salts, salts.values);
        tester::execute_commit_moves(@sys.game, duelist_a, duel_id, moves_a.hashed);
        tester::execute_commit_moves(@sys.game, duelist_b, duel_id, moves_b.hashed);
        tester::execute_reveal_moves(@sys.game, duelist_a, duel_id, moves_a.salt, moves_a.moves);
        tester::execute_reveal_moves(@sys.game, duelist_b, duel_id, moves_b.salt, moves_b.moves);
        let (challenge, round) = tester::get_Challenge_Round_Entity(sys.world, duel_id);
        (challenge, round)
    }


    fn get_moves_custom(moves_a: Span<u8>, moves_b: Span<u8>) -> (SaltsValues, PlayerMoves, PlayerMoves) {
        (
            SaltsValues{
                salts: ['shoot_a', 'shoot_b', 'env'].span(),
                values: [1, 1, ShufflerTrait::mocked_seed(
                    [ENV_CARD_NEUTRAL, ENV_CARD_NEUTRAL, ENV_CARD_NEUTRAL, ENV_CARD_NEUTRAL, ENV_CARD_NEUTRAL,
                    ENV_CARD_NEUTRAL, ENV_CARD_NEUTRAL, ENV_CARD_NEUTRAL, ENV_CARD_NEUTRAL, ENV_CARD_NEUTRAL].span()
                )].span(),
            },
            PlayerMovesTrait::new(SALT_A, moves_a),
            PlayerMovesTrait::new(SALT_B, moves_b),
        )
    }

    fn get_moves_dual_miss() -> (SaltsValues, PlayerMoves, PlayerMoves) {
        let moves_a: Span<u8> = [1, 2].span();
        let moves_b: Span<u8> = [1, 2].span();
        (
            SaltsValues{
                salts: ['shoot_a', 'shoot_b', 'env'].span(),
                values: [100, 100, ShufflerTrait::mocked_seed(
                    [ENV_CARD_MISS,ENV_CARD_MISS,ENV_CARD_MISS,ENV_CARD_MISS,ENV_CARD_MISS,
                    ENV_CARD_MISS,ENV_CARD_MISS,ENV_CARD_MISS,ENV_CARD_MISS,ENV_CARD_MISS,].span()
                )].span(),
            },
            PlayerMovesTrait::new(SALT_A, moves_a),
            PlayerMovesTrait::new(SALT_B, moves_b),
        )
    }

    fn get_moves_dual_crit() -> (SaltsValues, PlayerMoves, PlayerMoves) {
        let moves_a: Span<u8> = [1, 2].span();
        let moves_b: Span<u8> = [1, 2].span();
        (
            SaltsValues{
                salts: ['shoot_a', 'shoot_b', 'env'].span(),
                values: [1, 1, ShufflerTrait::mocked_seed([ENV_CARD_CRIT].span())].span(),
            },
            PlayerMovesTrait::new(SALT_A, moves_a),
            PlayerMovesTrait::new(SALT_B, moves_b),
        )
    }

    fn get_moves_crit_a() -> (SaltsValues, PlayerMoves, PlayerMoves) {
        let moves_a: Span<u8> = [1, 2].span();
        let moves_b: Span<u8> = [2, 3].span();
        (
            SaltsValues{
                salts: ['shoot_a', 'shoot_b', 'env'].span(),
                values: [1, 1, ShufflerTrait::mocked_seed([ENV_CARD_CRIT].span())].span(),
            },
            PlayerMovesTrait::new(SALT_A, moves_a),
            PlayerMovesTrait::new(SALT_B, moves_b),
        )
    }

    fn get_moves_crit_b() -> (SaltsValues, PlayerMoves, PlayerMoves) {
        let moves_a: Span<u8> = [2, 3].span();
        let moves_b: Span<u8> = [1, 2].span();
        (
            SaltsValues{
                salts: ['shoot_a', 'shoot_b', 'env'].span(),
                values: [100, 1, ShufflerTrait::mocked_seed([ENV_CARD_CRIT].span())].span(),
            },
            PlayerMovesTrait::new(SALT_A, moves_a),
            PlayerMovesTrait::new(SALT_B, moves_b),
        )
    }

}
