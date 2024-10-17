#[cfg(test)]
mod tests {
    use debug::PrintTrait;
    use core::traits::{TryInto, Into};
    use starknet::{ContractAddress};

    use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

    use pistols::systems::rng::{Dice, DiceTrait};
    use pistols::systems::game::{game, IGameDispatcher, IGameDispatcherTrait};
    use pistols::models::challenge::{Challenge, ChallengeEntity, Wager, Round, RoundEntity, Moves, MovesTrait, DuelistState, DuelistStateTrait};
    use pistols::models::duelist::{Duelist, DuelistEntity, DuelistEntityStore, ProfilePicType, Archetype};
    use pistols::models::table::{TableConfig, TABLES};
    use pistols::types::challenge_state::{ChallengeState, ChallengeStateTrait};
    use pistols::types::duel_progress::{DuelProgress, DuelStep, DuelistDrawnCard};
    use pistols::types::round_state::{RoundState, RoundStateTrait};
    use pistols::types::constants::{CONST, HONOUR};
    use pistols::types::cards::hand::{
        DuelistHand, DuelistHandTrait, DeckType,
        PacesCard, PacesCardTrait,
        TacticsCard, TacticsCardTrait,
        BladesCard, BladesCardTrait, BLADES_CARDS,
        EnvCard, EnvCardTrait,
    };
    use pistols::libs::shooter::{shooter};
    use pistols::libs::utils::{make_moves_hash};
    use pistols::utils::short_string::{ShortString};

    use pistols::systems::tokens::lords_mock::{lords_mock, ILordsMockDispatcher, ILordsMockDispatcherTrait};
    use pistols::tests::mock_rng::{IRngDispatcher, IRngDispatcherTrait};
    use pistols::tests::tester::{tester,
        tester::{
            Systems,
            FLAGS, ID, ZERO,
            OWNER, OTHER, BUMMER, TREASURY,
            BIG_BOY, LITTLE_BOY, LITTLE_GIRL,
            OWNED_BY_LITTLE_BOY, OWNED_BY_LITTLE_GIRL,
            FAKE_OWNER_1_1, FAKE_OWNER_2_2,
            _assert_is_alive, _assert_is_dead,
        }
    };
    use pistols::tests::prefabs::{prefabs,
        prefabs::{
            SALT_A, SALT_B, TABLE_ID, MESSAGE, WAGER_VALUE,
            ENV_CARD_NEUTRAL,
            SaltsValues, SaltsValuesTrait,
            PlayerMoves, PlayerMovesTrait,
        },
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

    fn execute_game_loop(sys: Systems,
        moves_a: Span<u8>,
        moves_b: Span<u8>,
        env_cards: Span<felt252>,
        fire_dices: Span<felt252>,
    ) -> (Round, DuelProgress) {
        sys.rng.mock_values(
            ['shoot_a', 'shoot_b'].span(),
            fire_dices,
        );
        sys.rng.mock_values(
            ['env_1', 'env_2', 'env_3', 'env_4', 'env_5', 'env_6', 'env_7', 'env_8', 'env_9', 'env_10'].span(),
            env_cards,
        );
        let mut round = Round {
            duel_id: 0x1234,
            round_number: 1,
            state: RoundState::Reveal,
            moves_a: Default::default(),
            moves_b: Default::default(),
            state_a: Default::default(),
            state_b: Default::default(),
            final_step: 0,
        };
        let mut hand_a: DuelistHand = round.moves_a.as_hand();
        let mut hand_b: DuelistHand = round.moves_b.as_hand();
        round.moves_a.initialize(SALT_A, moves_a);
        round.moves_b.initialize(SALT_B, moves_b);
        round.state_a.initialize(hand_a);
        round.state_b.initialize(hand_b);
        let progress: DuelProgress = shooter::game_loop(sys.world, DeckType::Classic, ref round);
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
        let sys = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, _progress) = execute_game_loop(sys,
            [1, 10, TacticsCard::Vengeful.into()].span(),
            [1, 10, 0].span(),
            [ENV_DAMAGE_UP].span(),
            [60, 60].span(),
        );
        assert(round.state_a.damage == CONST::INITIAL_DAMAGE + 1 + 1, 'state_a.damage');
        assert(round.state_b.damage == CONST::INITIAL_DAMAGE + 1, 'state_b.damage');
        assert(round.state_a.chances == CONST::INITIAL_CHANCE, 'state_a.chances');
        assert(round.state_b.chances == CONST::INITIAL_CHANCE, 'state_b.chances');
    }
    #[test]
    fn test_env_damage_up_b() {
        let sys = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, _progress) = execute_game_loop(sys,
            [1, 10, 0].span(),
            [1, 10, TacticsCard::Vengeful.into()].span(),
            [ENV_DAMAGE_UP].span(),
            [60, 60].span(),
        );
        assert(round.state_a.damage == CONST::INITIAL_DAMAGE + 1, 'state_a.damage');
        assert(round.state_b.damage == CONST::INITIAL_DAMAGE + 1 + 1, 'state_b.damage');
        assert(round.state_a.chances == CONST::INITIAL_CHANCE, 'state_a.chances');
        assert(round.state_b.chances == CONST::INITIAL_CHANCE, 'state_b.chances');
    }
    #[test]
    fn test_env_double_damage_up_a() {
        let sys = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, _progress) = execute_game_loop(sys,
            [1, 10, 0].span(),
            [1, 10, 0].span(),
            [ENV_DOUBLE_DAMAGE_UP].span(),
            [60, 60].span(),
        );
        assert(round.state_a.damage == CONST::INITIAL_DAMAGE + 2, 'state_a.damage');
        assert(round.state_b.damage == CONST::INITIAL_DAMAGE + 2, 'state_b.damage');
        assert(round.state_a.chances == CONST::INITIAL_CHANCE, 'state_a.chances');
        assert(round.state_b.chances == CONST::INITIAL_CHANCE, 'state_b.chances');
    }
    #[test]
    fn test_env_double_damage_up_b() {
        let sys = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, _progress) = execute_game_loop(sys,
            [1, 10, 0].span(),
            [1, 10, 0].span(),
            [ENV_DOUBLE_DAMAGE_UP].span(),
            [60, 60].span(),
        );
        assert(round.state_a.damage == CONST::INITIAL_DAMAGE + 2, 'state_a.damage');
        assert(round.state_b.damage == CONST::INITIAL_DAMAGE + 2, 'state_b.damage');
        assert(round.state_a.chances == CONST::INITIAL_CHANCE, 'state_a.chances');
        assert(round.state_b.chances == CONST::INITIAL_CHANCE, 'state_b.chances');
    }
    
    #[test]
    fn test_env_damage_down() {
        let sys = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, _progress) = execute_game_loop(sys,
            [1, 10].span(),
            [1, 10].span(),
            [ENV_DAMAGE_DOWN].span(),
            [60, 60].span(),
        );
        assert(round.state_a.damage == CONST::INITIAL_DAMAGE - 1, 'state_a.damage');
        assert(round.state_b.damage == CONST::INITIAL_DAMAGE - 1, 'state_b.damage');
        assert(round.state_a.chances == CONST::INITIAL_CHANCE, 'state_a.chances');
        assert(round.state_b.chances == CONST::INITIAL_CHANCE, 'state_b.chances');
    }
    #[test]
    fn test_env_damage_down_no_overflow() {
        let sys = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, _progress) = execute_game_loop(sys,
            [4, 10].span(),
            [4, 10].span(),
            [ENV_DAMAGE_DOWN, ENV_DAMAGE_DOWN, ENV_DAMAGE_DOWN, ENV_DAMAGE_DOWN].span(),
            [60, 60].span(),
        );
        assert(round.state_a.damage == 0, 'state_a.damage');
        assert(round.state_b.damage == 0, 'state_b.damage');
    }

    #[test]
    fn test_env_damage_cancels_1() {
        let sys = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, _progress) = execute_game_loop(sys,
            [2, 10].span(),
            [2, 10].span(),
            [ENV_DAMAGE_UP, ENV_DAMAGE_DOWN].span(),
            [60, 60].span(),
        );
        assert(round.state_a.damage == CONST::INITIAL_DAMAGE, 'state_a.damage');
        assert(round.state_b.damage == CONST::INITIAL_DAMAGE, 'state_b.damage');
    }
    #[test]
    fn test_env_damage_cancels_2() {
        let sys = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, _progress) = execute_game_loop(sys,
            [2, 10].span(),
            [2, 10].span(),
            [ENV_DAMAGE_DOWN, ENV_DAMAGE_UP].span(),
            [60, 60].span(),
        );
        assert(round.state_a.damage == CONST::INITIAL_DAMAGE, 'state_a.damage');
        assert(round.state_b.damage == CONST::INITIAL_DAMAGE, 'state_b.damage');
    }


    //
    // Chances
    //
    #[test]
    fn test_env_chances_up() {
        let sys = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, _progress) = execute_game_loop(sys,
            [1, 10, 0].span(),
            [1, 10, 0].span(),
            [ENV_CHANCES_UP].span(),
            [60, 60].span(),
        );
        assert(round.state_a.damage == CONST::INITIAL_DAMAGE, 'state_a.damage');
        assert(round.state_b.damage == CONST::INITIAL_DAMAGE, 'state_b.damage');
        assert(round.state_a.chances > CONST::INITIAL_CHANCE, 'state_a.chances');
        assert(round.state_b.chances > CONST::INITIAL_CHANCE, 'state_b.chances');
        // double chances
        let (round_double, _progress) = execute_game_loop(sys,
            [1, 10, 0].span(),
            [1, 10, 0].span(),
            [ENV_DOUBLE_CHANCES_UP].span(),
            [60, 60].span(),
        );
        assert(round_double.state_a.damage == CONST::INITIAL_DAMAGE, 'state_a.damage_double');
        assert(round_double.state_b.damage == CONST::INITIAL_DAMAGE, 'state_b.damage_double');
        assert(round_double.state_a.chances > CONST::INITIAL_CHANCE, 'state_a.chances_double');
        assert(round_double.state_b.chances > CONST::INITIAL_CHANCE, 'state_b.chances_double');
        assert(round_double.state_a.chances > round.state_a.chances, 'state_a.greater');
        assert(round_double.state_b.chances > round.state_b.chances, 'state_b.greater');
    }
    #[test]
    fn test_env_chances_down() {
        let sys = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, _progress) = execute_game_loop(sys,
            [1, 10, 0].span(),
            [1, 10, 0].span(),
            [ENV_CHANCES_DOWN].span(),
            [60, 60].span(),
        );
        assert(round.state_a.damage == CONST::INITIAL_DAMAGE, 'state_a.damage');
        assert(round.state_b.damage == CONST::INITIAL_DAMAGE, 'state_b.damage');
        assert(round.state_a.chances < CONST::INITIAL_CHANCE, 'state_a.chances');
        assert(round.state_b.chances < CONST::INITIAL_CHANCE, 'state_b.chances');
    }
    #[test]
    fn test_env_chances_down_no_overflow() {
        let sys = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, _progress) = execute_game_loop(sys,
            [8, 10, 0].span(),
            [8, 10, 0].span(),
            [ENV_CHANCES_DOWN, ENV_CHANCES_DOWN, ENV_CHANCES_DOWN, ENV_CHANCES_DOWN,
            ENV_CHANCES_DOWN, ENV_CHANCES_DOWN, ENV_CHANCES_DOWN, ENV_CHANCES_DOWN].span(),
            [60, 60].span(),
        );
        assert(round.state_a.chances == 0, 'state_a.chances');
        assert(round.state_b.chances == 0, 'state_b.chances');
    }
    #[test]
    fn test_env_chances_cancels_1() {
        let sys = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, _progress) = execute_game_loop(sys,
            [2, 10, 0].span(),
            [2, 10, 0].span(),
            [ENV_CHANCES_UP, ENV_CHANCES_DOWN].span(),
            [60, 60].span(),
        );
        assert(round.state_a.chances == CONST::INITIAL_CHANCE, 'state_a.chances');
        assert(round.state_b.chances == CONST::INITIAL_CHANCE, 'state_b.chances');
    }
    #[test]
    fn test_env_chances_cancels_2() {
        let sys = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, _progress) = execute_game_loop(sys,
            [2, 10, 0].span(),
            [2, 10, 0].span(),
            [ENV_CHANCES_DOWN, ENV_CHANCES_UP].span(),
            [60, 60].span(),
        );
        assert(round.state_a.chances == CONST::INITIAL_CHANCE, 'state_a.chances');
        assert(round.state_b.chances == CONST::INITIAL_CHANCE, 'state_b.chances');
    }

    //
    // Specials: Shots modifiers
    //

    #[test]
    fn test_special_all_shots_hit() {
        let sys = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, _progress) = execute_game_loop(sys,
            [1, 10, TacticsCard::Vengeful.into()].span(),
            [1, 10, TacticsCard::Vengeful.into()].span(),
            [ENV_SPECIAL_ALL_SHOTS_HIT].span(),
            [99, 99].span(), // miss
        );
        assert(round.state_a.health < CONST::FULL_HEALTH, 'state_a.health');
        assert(round.state_b.health < CONST::FULL_HEALTH, 'state_b.health');
        assert(round.state_a.chances == 100, 'state_a.chances');
        assert(round.state_b.chances == 100, 'state_b.chances');
    }
    #[test]
    fn test_special_all_shots_miss() {
        let sys = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, _progress) = execute_game_loop(sys,
            [1, 10, TacticsCard::Vengeful.into()].span(),
            [1, 10, TacticsCard::Vengeful.into()].span(),
            [ENV_SPECIAL_ALL_SHOTS_MISS].span(),
            [1, 1].span(), // hit
        );
        assert(round.state_a.health == CONST::FULL_HEALTH, 'state_a.health');
        assert(round.state_b.health == CONST::FULL_HEALTH, 'state_b.health');
        assert(round.state_a.chances == 0, 'state_a.chances');
        assert(round.state_b.chances == 0, 'state_b.chances');
    }


    //
    // Specials: Tactics modifiers
    //

    #[test]
    fn test_special_double_tactics() {
        let sys = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, _progress) = execute_game_loop(sys,
            [1, 10, TacticsCard::Vengeful.into()].span(),
            [1, 10, TacticsCard::Vengeful.into()].span(),
            [ENV_SPECIAL_DOUBLE_TACTICS].span(),
            [60, 60].span(),
        );
        assert(round.state_a.damage == CONST::INITIAL_DAMAGE + 2, 'state_a.damage');
        assert(round.state_b.damage == CONST::INITIAL_DAMAGE + 2, 'state_b.damage');
    }
    #[test]
    fn test_special_no_double_tactics() {
        let sys = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, _progress) = execute_game_loop(sys,
            [2, 10, TacticsCard::Vengeful.into()].span(),
            [2, 10, TacticsCard::Vengeful.into()].span(),
            [ENV_SPECIAL_NO_TACTICS, ENV_SPECIAL_DOUBLE_TACTICS].span(),
            [60, 60].span(),
        );
        assert(round.state_a.damage == CONST::INITIAL_DAMAGE + 2, 'state_a.damage');
        assert(round.state_b.damage == CONST::INITIAL_DAMAGE + 2, 'state_b.damage');
    }

    #[test]
    fn test_special_no_tactics() {
        let sys = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, _progress) = execute_game_loop(sys,
            [1, 10, TacticsCard::Vengeful.into()].span(),
            [1, 10, TacticsCard::Vengeful.into()].span(),
            [ENV_SPECIAL_NO_TACTICS].span(),
            [60, 60].span(),
        );
        assert(round.state_a.damage == CONST::INITIAL_DAMAGE, 'state_a.damage');
        assert(round.state_b.damage == CONST::INITIAL_DAMAGE, 'state_b.damage');
    }
    #[test]
    fn test_special_double_no_tactics() {
        let sys = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, _progress) = execute_game_loop(sys,
            [2, 10, TacticsCard::Vengeful.into()].span(),
            [2, 10, TacticsCard::Vengeful.into()].span(),
            [ENV_SPECIAL_DOUBLE_TACTICS, ENV_SPECIAL_NO_TACTICS].span(),
            [60, 60].span(),
        );
        assert(round.state_a.damage == CONST::INITIAL_DAMAGE, 'state_a.damage');
        assert(round.state_b.damage == CONST::INITIAL_DAMAGE, 'state_b.damage');
    }




    //-----------------------------------------
    // TACTICS
    //

    //
    // Coin Toss
    //

    #[test]
    fn test_coin_toss_a() {
        let sys = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, _progress) = execute_game_loop(sys,
            [1, 10, TacticsCard::CoinToss.into()].span(),
            [1, 10, 0].span(),
            [ENV_SPECIAL_ALL_SHOTS_MISS].span(),
            [1, 1].span(),
        );
        assert(round.state_a.health == CONST::FULL_HEALTH, 'state_a.health');
        assert(round.state_b.health < CONST::FULL_HEALTH, 'state_b.health');
    }
    #[test]
    fn test_coin_toss_a_once() {
        let sys = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, _progress) = execute_game_loop(sys,
            [2, 10, TacticsCard::CoinToss.into()].span(),
            [2, 10, 0].span(),
            [ENV_SPECIAL_ALL_SHOTS_HIT, ENV_SPECIAL_ALL_SHOTS_MISS].span(),
            [1, 1].span(),
        );
        assert(round.state_a.health == CONST::FULL_HEALTH, 'state_a.health');
        assert(round.state_b.health == CONST::FULL_HEALTH, 'state_b.health');
    }
    #[test]
    fn test_coin_toss_b() {
        let sys = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, _progress) = execute_game_loop(sys,
            [1, 10, 0].span(),
            [1, 10, TacticsCard::CoinToss.into()].span(),
            [ENV_SPECIAL_ALL_SHOTS_MISS].span(),
            [1, 1].span(),
        );
        assert(round.state_a.health < CONST::FULL_HEALTH, 'state_a.health');
        assert(round.state_b.health == CONST::FULL_HEALTH, 'state_b.health');
    }
    #[test]
    fn test_coin_toss_b_once() {
        let sys = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, _progress) = execute_game_loop(sys,
            [2, 10, 0].span(),
            [2, 10, TacticsCard::CoinToss.into()].span(),
            [ENV_SPECIAL_ALL_SHOTS_HIT, ENV_SPECIAL_ALL_SHOTS_MISS].span(),
            [1, 1].span(),
        );
        assert(round.state_a.health == CONST::FULL_HEALTH, 'state_a.health');
        assert(round.state_b.health == CONST::FULL_HEALTH, 'state_b.health');
    }

    #[test]
    fn test_coin_toss_specials_only() {
        let sys = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, _progress) = execute_game_loop(sys,
            [1, 10, TacticsCard::CoinToss.into()].span(),
            [1, 10, 0].span(),
            [ENV_DAMAGE_UP].span(),
            [60, 60].span(),
        );
        assert(round.state_a.damage == CONST::INITIAL_DAMAGE + 1, 'state_a.damage');
        assert(round.state_b.damage == CONST::INITIAL_DAMAGE + 1, 'state_b.damage');
    }

    //
    // Reversal
    // 

    #[test]
    fn test_reversal_a() {
        let sys = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, _progress) = execute_game_loop(sys,
            [1, 10, TacticsCard::Reversal.into()].span(),
            [1, 10, 0].span(),
            [ENV_DAMAGE_DOWN].span(),
            [1, 1].span(),
        );
        assert(round.state_a.damage == CONST::INITIAL_DAMAGE + 1, 'state_a.damage');
        assert(round.state_b.damage == CONST::INITIAL_DAMAGE + 1, 'state_b.damage');
    }
    #[test]
    fn test_reversal_b() {
        let sys = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, _progress) = execute_game_loop(sys,
            [1, 10, 0].span(),
            [1, 10, TacticsCard::Reversal.into()].span(),
            [ENV_DAMAGE_DOWN].span(),
            [1, 1].span(),
        );
        assert(round.state_a.damage == CONST::INITIAL_DAMAGE + 1, 'state_a.damage');
        assert(round.state_b.damage == CONST::INITIAL_DAMAGE + 1, 'state_b.damage');
    }
    #[test]
    fn test_reversal_a_b() {
        let sys = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, _progress) = execute_game_loop(sys,
            [1, 10, TacticsCard::Reversal.into()].span(),
            [1, 10, TacticsCard::Reversal.into()].span(),
            [ENV_DAMAGE_DOWN].span(),
            [1, 1].span(),
        );
        assert(round.state_a.damage == CONST::INITIAL_DAMAGE + 1, 'state_a.damage');
        assert(round.state_b.damage == CONST::INITIAL_DAMAGE + 1, 'state_b.damage');
    }
    #[test]
    fn test_reversal_once() {
        let sys = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, _progress) = execute_game_loop(sys,
            [2, 10, TacticsCard::Reversal.into()].span(),
            [2, 10, TacticsCard::Reversal.into()].span(),
            [ENV_DAMAGE_DOWN, ENV_DAMAGE_DOWN].span(),
            [1, 1].span(),
        );
        assert(round.state_a.damage == CONST::INITIAL_DAMAGE, 'state_a.damage');
        assert(round.state_b.damage == CONST::INITIAL_DAMAGE, 'state_b.damage');
    }


}
