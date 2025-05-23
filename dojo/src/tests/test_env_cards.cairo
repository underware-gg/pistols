#[cfg(test)]
mod tests {
    use pistols::systems::rng::{RngWrap, RngWrapTrait};
    use pistols::models::challenge::{Round, MovesTrait, DuelistStateTrait};
    use pistols::types::duel_progress::{DuelProgress, DuelStep};
    use pistols::types::round_state::{RoundState};
    use pistols::types::constants::{CONST};
    use pistols::types::cards::hand::{
        DeckType, DeckTypeTrait,
        DuelistHand,
        TacticsCard,
    };
    use pistols::libs::game_loop::{GameLoopTrait};
    use pistols::utils::short_string::{ShortString};

    use pistols::systems::rng_mock::{IRngMockDispatcherTrait, MockedValueTrait};
    use pistols::tests::tester::{tester,
        tester::{
            TestSystems, FLAGS,
        }
    };
    use pistols::tests::prefabs::prefabs::{
        SALT_A, SALT_B
    };


    const ENV_DAMAGE_UP: felt252 = 1;
    const ENV_DAMAGE_DOWN: felt252 = 8;
    const ENV_CHANCES_UP: felt252 = 13;
    const ENV_CHANCES_DOWN: felt252 = 20;
    const ENV_DOUBLE_DAMAGE_UP: felt252 = 25;
    const ENV_DOUBLE_CHANCES_UP: felt252 = 28;
    const ENV_SPECIAL_ALL_SHOTS_HIT: felt252 = 31;
    const ENV_SPECIAL_ALL_SHOTS_MISS: felt252 = 32;
    const ENV_SPECIAL_DOUBLE_TACTICS: felt252 = 33;
    const ENV_SPECIAL_NO_TACTICS: felt252 = 34;

    //-----------------------------------------
    // game_loop
    //

    fn execute_game_loop(sys: @TestSystems,
        moves_a: Span<u8>,
        moves_b: Span<u8>,
        env_cards: Span<felt252>,
        fire_dices: Span<felt252>,
    ) -> (Round, DuelProgress) {
        (*sys.rng).mock_values([
            MockedValueTrait::new('shoot_a', *fire_dices[0]),
            MockedValueTrait::new('shoot_b', *fire_dices[1]),
            MockedValueTrait::shuffled('env', env_cards),
        ].span());
        let mut round = Round {
            duel_id: 0x1234,
            state: RoundState::Reveal,
            moves_a: Default::default(),
            moves_b: Default::default(),
            state_a: Default::default(),
            state_b: Default::default(),
            final_blow: Default::default(),
        };
        let mut hand_a: DuelistHand = round.moves_a.as_hand();
        let mut hand_b: DuelistHand = round.moves_b.as_hand();
        round.moves_a.reveal_salt_and_moves(SALT_A, moves_a);
        round.moves_b.reveal_salt_and_moves(SALT_B, moves_b);
        round.state_a.initialize(hand_a);
        round.state_b.initialize(hand_b);
        let wrapped: @RngWrap = RngWrapTrait::wrap((*sys.rng).contract_address, Option::Some([].span())); // force using mocked rng
        let progress: DuelProgress = GameLoopTrait::execute(wrapped, @DeckType::Classic.build_deck(), ref round);
        (round, progress)
    }


    //-----------------------------------------
    // ENVS
    //

    //
    // Damages
    //
    #[test]
    fn test_env_damage_up_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, _progress) = execute_game_loop(@sys,
            [1, 10, TacticsCard::Vengeful.into()].span(),
            [1, 10, 0].span(),
            [ENV_DAMAGE_UP].span(),
            [60, 60].span(),
        );
        assert_eq!(round.state_a.damage, CONST::INITIAL_DAMAGE + 1 + 1, "state_a.damage");
        assert_eq!(round.state_b.damage, CONST::INITIAL_DAMAGE + 1, "state_b.damage");
        assert_eq!(round.state_a.chances, CONST::INITIAL_CHANCE, "state_a.chances");
        assert_eq!(round.state_b.chances, CONST::INITIAL_CHANCE, "state_b.chances");
    }
    #[test]
    fn test_env_damage_up_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, _progress) = execute_game_loop(@sys,
            [1, 10, 0].span(),
            [1, 10, TacticsCard::Vengeful.into()].span(),
            [ENV_DAMAGE_UP].span(),
            [60, 60].span(),
        );
        assert_eq!(round.state_a.damage, CONST::INITIAL_DAMAGE + 1, "state_a.damage");
        assert_eq!(round.state_b.damage, CONST::INITIAL_DAMAGE + 1 + 1, "state_b.damage");
        assert_eq!(round.state_a.chances, CONST::INITIAL_CHANCE, "state_a.chances");
        assert_eq!(round.state_b.chances, CONST::INITIAL_CHANCE, "state_b.chances");
    }
    #[test]
    fn test_env_double_damage_up_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, _progress) = execute_game_loop(@sys,
            [1, 10, 0].span(),
            [1, 10, 0].span(),
            [ENV_DOUBLE_DAMAGE_UP].span(),
            [60, 60].span(),
        );
        assert_eq!(round.state_a.damage, CONST::INITIAL_DAMAGE + 2, "state_a.damage");
        assert_eq!(round.state_b.damage, CONST::INITIAL_DAMAGE + 2, "state_b.damage");
        assert_eq!(round.state_a.chances, CONST::INITIAL_CHANCE, "state_a.chances");
        assert_eq!(round.state_b.chances, CONST::INITIAL_CHANCE, "state_b.chances");
    }
    #[test]
    fn test_env_double_damage_up_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, _progress) = execute_game_loop(@sys,
            [1, 10, 0].span(),
            [1, 10, 0].span(),
            [ENV_DOUBLE_DAMAGE_UP].span(),
            [60, 60].span(),
        );
        assert_eq!(round.state_a.damage, CONST::INITIAL_DAMAGE + 2, "state_a.damage");
        assert_eq!(round.state_b.damage, CONST::INITIAL_DAMAGE + 2, "state_b.damage");
        assert_eq!(round.state_a.chances, CONST::INITIAL_CHANCE, "state_a.chances");
        assert_eq!(round.state_b.chances, CONST::INITIAL_CHANCE, "state_b.chances");
    }
    
    #[test]
    fn test_env_damage_down() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, _progress) = execute_game_loop(@sys,
            [1, 10].span(),
            [1, 10].span(),
            [ENV_DAMAGE_DOWN].span(),
            [60, 60].span(),
        );
        assert_eq!(round.state_a.damage, CONST::INITIAL_DAMAGE - 1, "state_a.damage");
        assert_eq!(round.state_b.damage, CONST::INITIAL_DAMAGE - 1, "state_b.damage");
        assert_eq!(round.state_a.chances, CONST::INITIAL_CHANCE, "state_a.chances");
        assert_eq!(round.state_b.chances, CONST::INITIAL_CHANCE, "state_b.chances");
    }
    #[test]
    fn test_env_damage_down_no_overflow() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, _progress) = execute_game_loop(@sys,
            [4, 10].span(),
            [4, 10].span(),
            [ENV_DAMAGE_DOWN, ENV_DAMAGE_DOWN, ENV_DAMAGE_DOWN, ENV_DAMAGE_DOWN].span(),
            [60, 60].span(),
        );
        assert_eq!(round.state_a.damage, 0, "state_a.damage");
        assert_eq!(round.state_b.damage, 0, "state_b.damage");
    }

    #[test]
    fn test_env_damage_cancels_1() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, _progress) = execute_game_loop(@sys,
            [2, 10].span(),
            [2, 10].span(),
            [ENV_DAMAGE_UP, ENV_DAMAGE_DOWN].span(),
            [60, 60].span(),
        );
        assert_eq!(round.state_a.damage, CONST::INITIAL_DAMAGE, "state_a.damage");
        assert_eq!(round.state_b.damage, CONST::INITIAL_DAMAGE, "state_b.damage");
    }
    #[test]
    fn test_env_damage_cancels_2() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, _progress) = execute_game_loop(@sys,
            [2, 10].span(),
            [2, 10].span(),
            [ENV_DAMAGE_DOWN, ENV_DAMAGE_UP].span(),
            [60, 60].span(),
        );
        assert_eq!(round.state_a.damage, CONST::INITIAL_DAMAGE, "state_a.damage");
        assert_eq!(round.state_b.damage, CONST::INITIAL_DAMAGE, "state_b.damage");
    }


    //
    // Chances
    //
    #[test]
    fn test_env_chances_up() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, _progress) = execute_game_loop(@sys,
            [1, 10, 0].span(),
            [1, 10, 0].span(),
            [ENV_CHANCES_UP].span(),
            [60, 60].span(),
        );
        assert_eq!(round.state_a.damage, CONST::INITIAL_DAMAGE, "state_a.damage");
        assert_eq!(round.state_b.damage, CONST::INITIAL_DAMAGE, "state_b.damage");
        assert_gt!(round.state_a.chances, CONST::INITIAL_CHANCE, "state_a.chances");
        assert_gt!(round.state_b.chances, CONST::INITIAL_CHANCE, "state_b.chances");
        // double chances
        let (round_double, _progress) = execute_game_loop(@sys,
            [1, 10, 0].span(),
            [1, 10, 0].span(),
            [ENV_DOUBLE_CHANCES_UP].span(),
            [60, 60].span(),
        );
        assert_eq!(round_double.state_a.damage, CONST::INITIAL_DAMAGE, "state_a.damage_double");
        assert_eq!(round_double.state_b.damage, CONST::INITIAL_DAMAGE, "state_b.damage_double");
        assert_gt!(round_double.state_a.chances, CONST::INITIAL_CHANCE, "state_a.chances_double");
        assert_gt!(round_double.state_b.chances, CONST::INITIAL_CHANCE, "state_b.chances_double");
        assert_gt!(round_double.state_a.chances, round.state_a.chances, "state_a.greater");
        assert_gt!(round_double.state_b.chances, round.state_b.chances, "state_b.greater");
    }
    #[test]
    fn test_env_chances_down() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, _progress) = execute_game_loop(@sys,
            [1, 10, 0].span(),
            [1, 10, 0].span(),
            [ENV_CHANCES_DOWN].span(),
            [60, 60].span(),
        );
        assert_eq!(round.state_a.damage, CONST::INITIAL_DAMAGE, "state_a.damage");
        assert_eq!(round.state_b.damage, CONST::INITIAL_DAMAGE, "state_b.damage");
        assert_lt!(round.state_a.chances, CONST::INITIAL_CHANCE, "state_a.chances");
        assert_lt!(round.state_b.chances, CONST::INITIAL_CHANCE, "state_b.chances");
    }
    #[test]
    fn test_env_chances_down_no_overflow() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, _progress) = execute_game_loop(@sys,
            [8, 10, 0].span(),
            [8, 10, 0].span(),
            [ENV_CHANCES_DOWN, ENV_CHANCES_DOWN, ENV_CHANCES_DOWN, ENV_CHANCES_DOWN,
            ENV_CHANCES_DOWN, ENV_CHANCES_DOWN, ENV_CHANCES_DOWN, ENV_CHANCES_DOWN].span(),
            [60, 60].span(),
        );
        assert_eq!(round.state_a.chances, 0, "state_a.chances");
        assert_eq!(round.state_b.chances, 0, "state_b.chances");
    }
    #[test]
    fn test_env_chances_cancels_1() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, _progress) = execute_game_loop(@sys,
            [2, 10, 0].span(),
            [2, 10, 0].span(),
            [ENV_CHANCES_UP, ENV_CHANCES_DOWN].span(),
            [60, 60].span(),
        );
        assert_eq!(round.state_a.chances, CONST::INITIAL_CHANCE, "state_a.chances");
        assert_eq!(round.state_b.chances, CONST::INITIAL_CHANCE, "state_b.chances");
    }
    #[test]
    fn test_env_chances_cancels_2() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, _progress) = execute_game_loop(@sys,
            [2, 10, 0].span(),
            [2, 10, 0].span(),
            [ENV_CHANCES_DOWN, ENV_CHANCES_UP].span(),
            [60, 60].span(),
        );
        assert_eq!(round.state_a.chances, CONST::INITIAL_CHANCE, "state_a.chances");
        assert_eq!(round.state_b.chances, CONST::INITIAL_CHANCE, "state_b.chances");
    }

    //
    // Specials: Shots modifiers
    //

    #[test]
    fn test_special_all_shots_hit() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, _progress) = execute_game_loop(@sys,
            [1, 10, TacticsCard::Bananas.into()].span(),
            [1, 10, TacticsCard::Bananas.into()].span(),
            [ENV_SPECIAL_ALL_SHOTS_HIT].span(),
            [99, 99].span(), // miss
        );
        assert_lt!(round.state_a.health, CONST::FULL_HEALTH, "state_a.health");
        assert_lt!(round.state_b.health, CONST::FULL_HEALTH, "state_b.health");
        assert_eq!(round.state_a.chances, 100, "state_a.chances");
        assert_eq!(round.state_b.chances, 100, "state_b.chances");
    }
    #[test]
    fn test_special_all_shots_hit_chances_down() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(@sys,
            [2, 10, TacticsCard::Bananas.into()].span(),
            [2, 10, TacticsCard::Bananas.into()].span(),
            [ENV_SPECIAL_ALL_SHOTS_HIT, ENV_CHANCES_DOWN].span(),
            [99, 99].span(), // miss
        );
        assert_lt!(round.state_a.health, CONST::FULL_HEALTH, "state_a.health");
        assert_lt!(round.state_b.health, CONST::FULL_HEALTH, "state_b.health");
        assert_eq!(round.state_a.chances, 100, "state_a.chances");
        assert_eq!(round.state_b.chances, 100, "state_b.chances");
        // not affected by chances card
        assert_eq!(progress.steps.len(), 3, "progress.steps.len");
        let final_step: DuelStep = *progress.steps[progress.steps.len() - 1];
        assert_eq!(final_step.state_a.chances, 100, "state_final_a.chances");
        assert_eq!(final_step.state_b.chances, 100, "state_final_b.chances");
    }
    #[test]
    fn test_special_all_shots_hit_no_tactics() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(@sys,
            [2, 10, TacticsCard::Bananas.into()].span(),
            [2, 10, TacticsCard::Bananas.into()].span(),
            [ENV_SPECIAL_ALL_SHOTS_HIT, ENV_SPECIAL_NO_TACTICS].span(),
            [1, 1].span(), // hit
        );
        assert_lt!(round.state_a.health, CONST::FULL_HEALTH, "state_a.health");
        assert_lt!(round.state_b.health, CONST::FULL_HEALTH, "state_b.health");
        assert_eq!(round.state_a.chances, 100, "state_a.chances");
        assert_eq!(round.state_b.chances, 100, "state_b.chances");
        // not affected by chances card
        assert_eq!(progress.steps.len(), 3, "progress.steps.len");
        let final_step: DuelStep = *progress.steps[progress.steps.len() - 1];
        assert_eq!(final_step.state_a.chances, 100, "state_final_a.chances");
        assert_eq!(final_step.state_b.chances, 100, "state_final_b.chances");
    }

    #[test]
    fn test_special_all_shots_miss() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, _progress) = execute_game_loop(@sys,
            [1, 10, TacticsCard::Bananas.into()].span(),
            [1, 10, TacticsCard::Bananas.into()].span(),
            [ENV_SPECIAL_ALL_SHOTS_MISS].span(),
            [1, 1].span(), // hit
        );
        assert_eq!(round.state_a.health, CONST::FULL_HEALTH, "state_a.health");
        assert_eq!(round.state_b.health, CONST::FULL_HEALTH, "state_b.health");
        assert_eq!(round.state_a.chances, 0, "state_a.chances");
        assert_eq!(round.state_b.chances, 0, "state_b.chances");
    }
    #[test]
    fn test_special_all_shots_miss_chances_up() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(@sys,
            [2, 10, TacticsCard::Bananas.into()].span(),
            [2, 10, TacticsCard::Bananas.into()].span(),
            [ENV_SPECIAL_ALL_SHOTS_MISS, ENV_CHANCES_UP].span(),
            [1, 1].span(), // hit
        );
        assert_eq!(round.state_a.health, CONST::FULL_HEALTH, "state_a.health");
        assert_eq!(round.state_b.health, CONST::FULL_HEALTH, "state_b.health");
        assert_eq!(round.state_a.chances, 0, "state_a.chances");
        assert_eq!(round.state_b.chances, 0, "state_b.chances");
        // not affected by chances card
        assert_eq!(progress.steps.len(), 3, "progress.steps.len");
        let final_step: DuelStep = *progress.steps[progress.steps.len() - 1];
        assert_eq!(final_step.state_a.chances, 0, "state_final_a.chances");
        assert_eq!(final_step.state_b.chances, 0, "state_final_b.chances");
    }


    //
    // Specials: Tactics modifiers
    //

    #[test]
    fn test_special_double_tactics() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, _progress) = execute_game_loop(@sys,
            [1, 10, TacticsCard::Vengeful.into()].span(),
            [1, 10, TacticsCard::Vengeful.into()].span(),
            [ENV_SPECIAL_DOUBLE_TACTICS].span(),
            [60, 60].span(),
        );
        assert_eq!(round.state_a.damage, CONST::INITIAL_DAMAGE + 2, "state_a.damage");
        assert_eq!(round.state_b.damage, CONST::INITIAL_DAMAGE + 2, "state_b.damage");
    }
    #[test]
    fn test_special_no_double_tactics() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, _progress) = execute_game_loop(@sys,
            [2, 10, TacticsCard::Vengeful.into()].span(),
            [2, 10, TacticsCard::Vengeful.into()].span(),
            [ENV_SPECIAL_NO_TACTICS, ENV_SPECIAL_DOUBLE_TACTICS].span(),
            [60, 60].span(),
        );
        assert_eq!(round.state_a.damage, CONST::INITIAL_DAMAGE + 2, "state_a.damage");
        assert_eq!(round.state_b.damage, CONST::INITIAL_DAMAGE + 2, "state_b.damage");
    }

    #[test]
    fn test_special_no_tactics() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, _progress) = execute_game_loop(@sys,
            [1, 10, TacticsCard::Vengeful.into()].span(),
            [1, 10, TacticsCard::Vengeful.into()].span(),
            [ENV_SPECIAL_NO_TACTICS].span(),
            [60, 60].span(),
        );
        assert_eq!(round.state_a.damage, CONST::INITIAL_DAMAGE, "state_a.damage");
        assert_eq!(round.state_b.damage, CONST::INITIAL_DAMAGE, "state_b.damage");
    }
    #[test]
    fn test_special_double_no_tactics() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, _progress) = execute_game_loop(@sys,
            [2, 10, TacticsCard::Vengeful.into()].span(),
            [2, 10, TacticsCard::Vengeful.into()].span(),
            [ENV_SPECIAL_DOUBLE_TACTICS, ENV_SPECIAL_NO_TACTICS].span(),
            [60, 60].span(),
        );
        assert_eq!(round.state_a.damage, CONST::INITIAL_DAMAGE, "state_a.damage");
        assert_eq!(round.state_b.damage, CONST::INITIAL_DAMAGE, "state_b.damage");
    }




    //-----------------------------------------
    // TACTICS
    //

    //
    // Coin Toss
    //

    #[test]
    fn test_coin_toss_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, _progress) = execute_game_loop(@sys,
            [1, 10, TacticsCard::CoinToss.into()].span(),
            [1, 10, 0].span(),
            [ENV_SPECIAL_ALL_SHOTS_MISS].span(),
            [1, 1].span(),
        );
        assert_eq!(round.state_a.health, CONST::FULL_HEALTH, "state_a.health");
        assert_lt!(round.state_b.health, CONST::FULL_HEALTH, "state_b.health");
    }
    #[test]
    fn test_coin_toss_a_once() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, _progress) = execute_game_loop(@sys,
            [2, 10, TacticsCard::CoinToss.into()].span(),
            [2, 10, 0].span(),
            [ENV_SPECIAL_ALL_SHOTS_HIT, ENV_SPECIAL_ALL_SHOTS_MISS].span(),
            [1, 1].span(),
        );
        assert_eq!(round.state_a.health, CONST::FULL_HEALTH, "state_a.health");
        assert_eq!(round.state_b.health, CONST::FULL_HEALTH, "state_b.health");
    }
    #[test]
    fn test_coin_toss_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, _progress) = execute_game_loop(@sys,
            [1, 10, 0].span(),
            [1, 10, TacticsCard::CoinToss.into()].span(),
            [ENV_SPECIAL_ALL_SHOTS_MISS].span(),
            [1, 1].span(),
        );
        assert_lt!(round.state_a.health, CONST::FULL_HEALTH, "state_a.health");
        assert_eq!(round.state_b.health, CONST::FULL_HEALTH, "state_b.health");
    }
    #[test]
    fn test_coin_toss_b_once() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, _progress) = execute_game_loop(@sys,
            [2, 10, 0].span(),
            [2, 10, TacticsCard::CoinToss.into()].span(),
            [ENV_SPECIAL_ALL_SHOTS_HIT, ENV_SPECIAL_ALL_SHOTS_MISS].span(),
            [1, 1].span(),
        );
        assert_eq!(round.state_a.health, CONST::FULL_HEALTH, "state_a.health");
        assert_eq!(round.state_b.health, CONST::FULL_HEALTH, "state_b.health");
    }

    #[test]
    fn test_coin_toss_specials_only() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, _progress) = execute_game_loop(@sys,
            [1, 10, TacticsCard::CoinToss.into()].span(),
            [1, 10, 0].span(),
            [ENV_DAMAGE_UP].span(),
            [60, 60].span(),
        );
        assert_eq!(round.state_a.damage, CONST::INITIAL_DAMAGE + 1, "state_a.damage");
        assert_eq!(round.state_b.damage, CONST::INITIAL_DAMAGE + 1, "state_b.damage");
    }

    //
    // Reversal
    // 

    #[test]
    fn test_reversal_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, _progress) = execute_game_loop(@sys,
            [1, 10, TacticsCard::Reversal.into()].span(),
            [1, 10, 0].span(),
            [ENV_DAMAGE_DOWN].span(),
            [1, 1].span(),
        );
        assert_eq!(round.state_a.damage, CONST::INITIAL_DAMAGE + 1, "state_a.damage");
        assert_eq!(round.state_b.damage, CONST::INITIAL_DAMAGE + 1, "state_b.damage");
    }
    #[test]
    fn test_reversal_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, _progress) = execute_game_loop(@sys,
            [1, 10, 0].span(),
            [1, 10, TacticsCard::Reversal.into()].span(),
            [ENV_DAMAGE_DOWN].span(),
            [1, 1].span(),
        );
        assert_eq!(round.state_a.damage, CONST::INITIAL_DAMAGE + 1, "state_a.damage");
        assert_eq!(round.state_b.damage, CONST::INITIAL_DAMAGE + 1, "state_b.damage");
    }
    #[test]
    fn test_reversal_a_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, _progress) = execute_game_loop(@sys,
            [1, 10, TacticsCard::Reversal.into()].span(),
            [1, 10, TacticsCard::Reversal.into()].span(),
            [ENV_DAMAGE_DOWN].span(),
            [1, 1].span(),
        );
        assert_eq!(round.state_a.damage, CONST::INITIAL_DAMAGE + 1, "state_a.damage");
        assert_eq!(round.state_b.damage, CONST::INITIAL_DAMAGE + 1, "state_b.damage");
    }
    #[test]
    fn test_reversal_once() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, _progress) = execute_game_loop(@sys,
            [2, 10, TacticsCard::Reversal.into()].span(),
            [2, 10, TacticsCard::Reversal.into()].span(),
            [ENV_DAMAGE_DOWN, ENV_DAMAGE_DOWN].span(),
            [1, 1].span(),
        );
        assert_eq!(round.state_a.damage, CONST::INITIAL_DAMAGE, "state_a.damage");
        assert_eq!(round.state_b.damage, CONST::INITIAL_DAMAGE, "state_b.damage");
    }


}
