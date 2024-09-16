#[cfg(test)]
mod tests {
    use debug::PrintTrait;
    use core::traits::{TryInto, Into};
    use starknet::{ContractAddress};

    use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

    use pistols::systems::rng::{Dice, DiceTrait};
    use pistols::systems::actions::{actions, IActionsDispatcher, IActionsDispatcherTrait};
    use pistols::models::challenge::{Challenge, ChallengeEntity, Wager, Round, RoundEntity, Moves, MovesTrait, PlayerState, PlayerStateTrait};
    use pistols::models::duelist::{Duelist, DuelistEntity, DuelistEntityStore, ProfilePicType, Archetype};
    use pistols::models::table::{TableConfig, TABLES};
    use pistols::types::challenge_state::{ChallengeState, ChallengeStateTrait};
    use pistols::types::duel_progress::{DuelProgress, DuelStep, DuelistDrawnCard};
    use pistols::types::round_state::{RoundState, RoundStateTrait};
    use pistols::types::constants::{CONST, HONOUR};
    use pistols::types::cards::hand::{
        PlayerHand, PlayerHandTrait,
        PacesCard, PacesCardTrait,
        TacticsCard, TacticsCardTrait,
        BladesCard, BladesCardTrait,
        EnvCard, EnvCardTrait,
    };
    use pistols::libs::shooter::{shooter};
    use pistols::libs::utils::{make_moves_hash};
    use pistols::utils::short_string::{ShortString};

    use pistols::mocks::lords_mock::{lords_mock, ILordsMockDispatcher, ILordsMockDispatcherTrait};
    use pistols::tests::mock_rng::{IRngDispatcher, IRngDispatcherTrait};
    use pistols::tests::tester::{tester,
        tester::{
            Systems,
            FLAGS, ID, ZERO,
            OWNER, OTHER, BUMMER, TREASURY,
            BIG_BOY, LITTLE_BOY, LITTLE_GIRL,
            OWNED_BY_LITTLE_BOY, OWNED_BY_LITTLE_GIRL,
            FAKE_OWNER_1_1, FAKE_OWNER_2_2,
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



    // simple test to make sure main game_loop() works
    #[test]
    fn test_game_loop() {
        let sys = tester::setup_world(FLAGS::ACTIONS | FLAGS::LORDS | FLAGS::APPROVE | FLAGS::MOCK_RNG);
        let (salts, moves_a, moves_b) = prefabs::get_moves_dual_crit();
        let duel_id = prefabs::start_new_challenge(sys, OWNER(), OTHER(), WAGER_VALUE);
        let (_challenge, round) = prefabs::commit_reveal_get(sys, duel_id, OWNER(), OTHER(), salts, moves_a, moves_b);
        assert(round.state_a.damage > CONST::INITIAL_DAMAGE, 'final_damage_a');
        assert(round.state_b.damage > CONST::INITIAL_DAMAGE, 'final_damage_b');
        assert(round.state_a.health < CONST::FULL_HEALTH, 'final_health_a');
        assert(round.state_b.health < CONST::FULL_HEALTH, 'final_health_b');
        assert(round.state_a.win == 1, 'win_a');
        assert(round.state_b.win == 1, 'win_b');
    }


    //-----------------------------------------
    // game_loop_internal
    //

    fn execute_game_loop_internal(sys: Systems, moves_a: Span<u8>, moves_b: Span<u8>) -> (Round, DuelProgress) {
        sys.rng.set_salts(
            ['env_1', 'env_2'].span(),
            [ENV_CARD_NEUTRAL, ENV_CARD_NEUTRAL].span(),
        );
        let mut dice: Dice = DiceTrait::new(@sys.world, 0x1212121212);
        let mut round = Round {
            duel_id: 0x1234,
            round_number: 1,
            state: RoundState::Reveal,
            moves_a: Default::default(),
            moves_b: Default::default(),
            state_a: Default::default(),
            state_b: Default::default(),
        };
        round.moves_a.initialize(SALT_A, moves_a);
        round.moves_b.initialize(SALT_B, moves_b);
        round.state_a.initialize(round.moves_a.card_1.into());
        round.state_b.initialize(round.moves_b.card_1.into());
        let progress: DuelProgress = shooter::game_loop_internal(ref dice, ref round);
        (round, progress)
    }


    fn _assert_not_affected_by_cards(state_start: PlayerState, state_final: PlayerState) {
        assert(state_start.chances == CONST::INITIAL_CHANCE, 'keep_INITIAL_CHANCE');
        assert(state_start.damage == CONST::INITIAL_DAMAGE, 'keep_INITIAL_DAMAGE');
        assert(state_start.chances == state_final.chances, 'keep_chances');
        assert(state_start.damage == state_final.damage, 'keep_damage');
    }

    //-----------------------------------------
    // HAND/PROGRESS
    //

    #[test]
    fn test_hand_progress() {
        let sys = tester::setup_world(FLAGS::MOCK_RNG);
        let (salts, _moves_a, _moves_b) = prefabs::get_moves_dual_miss();
        sys.rng.set_salts(salts.salts, salts.values);
        let (_round, progress) = execute_game_loop_internal(sys,
            [5, 6, 1, 2].span(),
            [10, 9, 3, 4].span(),
        );
        assert(progress.hand_a.card_fire == 5_u8.into(), 'hand_a.card_fire');
        assert(progress.hand_a.card_dodge == 6_u8.into(), 'hand_a.card_dodge');
        assert(progress.hand_a.card_tactics == 1_u8.into(), 'hand_a.card_tactics');
        assert(progress.hand_a.card_blades == 2_u8.into(), 'hand_a.card_blades');
        assert(progress.hand_b.card_fire == 10_u8.into(), 'hand_b.card_fire');
        assert(progress.hand_b.card_dodge == 9_u8.into(), 'hand_b.card_dodge');
        assert(progress.hand_b.card_tactics == 3_u8.into(), 'hand_b.card_tactics');
        assert(progress.hand_b.card_blades == 4_u8.into(), 'hand_b.card_blades');
        assert(progress.steps.len() == 11, 'paces.len');
        let mut i: u8 = 1;
        while (i <= 10) {
            let num: felt252 = '1'+i.into();
            let step: DuelStep = *progress.steps[i.into()];
            let pace: PacesCard = step.pace;
            assert(step.pace == pace, ShortString::concat(num, '_step.pace'));
            assert(step.card_env != 0_u8.into(), ShortString::concat(num, '_step.card_env'));
            assert(step.dice_env > 0, ShortString::concat(num, '_step.dice_env'));
            if (pace == PacesCard::Paces5) {
                assert(step.card_a == DuelistDrawnCard::Fire(PacesCard::Paces5), ShortString::concat(num, '_fire_a'));
                assert(step.card_b == DuelistDrawnCard::None, ShortString::concat(num, '_none_b'));
            } else if (pace == PacesCard::Paces6) {
                assert(step.card_a == DuelistDrawnCard::Dodge(PacesCard::Paces6), ShortString::concat(num, '_dodge_a'));
                assert(step.card_b == DuelistDrawnCard::None, ShortString::concat(num, '_none_b'));
            } else if (pace == PacesCard::Paces10) {
                assert(step.card_a == DuelistDrawnCard::None, ShortString::concat(num, '_none_a'));
                assert(step.card_b == DuelistDrawnCard::Fire(PacesCard::Paces10), ShortString::concat(num, '_fire_b'));
            } else if (pace == PacesCard::Paces9) {
                assert(step.card_a == DuelistDrawnCard::None, ShortString::concat(num, '_none_a'));
                assert(step.card_b == DuelistDrawnCard::Dodge(PacesCard::Paces9), ShortString::concat(num, '_dodge_b'));
            } else {
                assert(step.card_a == DuelistDrawnCard::None, ShortString::concat(num, '_none_a'));
                assert(step.card_b == DuelistDrawnCard::None, ShortString::concat(num, '_none_b'));
            }
            i += 1;
        }
    }

    #[test]
    fn test_fire_no_dodge() {
        let sys = tester::setup_world(FLAGS::MOCK_RNG);
        let (salts, _moves_a, _moves_b) = prefabs::get_moves_dual_miss();
        sys.rng.set_salts(salts.salts, salts.values);
        let (_round, progress) = execute_game_loop_internal(sys,
            [1, 1].span(),
            [2, 2].span(),
        );
        assert(progress.hand_a.card_fire == 1_u8.into(), 'hand_a.card_fire');
        assert(progress.hand_a.card_dodge == 0_u8.into(), 'hand_a.card_dodge');
        assert(progress.hand_b.card_fire == 2_u8.into(), 'hand_b.card_fire');
        assert(progress.hand_b.card_dodge == 0_u8.into(), 'hand_b.card_dodge');
        assert(progress.steps.len() == 3, 'paces.len');
        let mut i: u8 = 1;
        while (i <= 2) {
            let num: felt252 = '1'+i.into();
            let step: DuelStep = *progress.steps[i.into()];
            let pace: PacesCard = step.pace;
            assert(step.pace == pace, ShortString::concat(num, '_step.pace'));
            assert(step.card_env != 0_u8.into(), ShortString::concat(num, '_step.card_env'));
            assert(step.dice_env > 0, ShortString::concat(num, '_step.dice_env'));
            if (pace == PacesCard::Paces1) {
                assert(step.card_a == DuelistDrawnCard::Fire(PacesCard::Paces1), ShortString::concat(num, '_fire_a'));
                assert(step.card_b == DuelistDrawnCard::None, ShortString::concat(num, '_none_b'));
            } else if (pace == PacesCard::Paces2) {
                assert(step.card_a == DuelistDrawnCard::None, ShortString::concat(num, '_none_a'));
                assert(step.card_b == DuelistDrawnCard::Fire(PacesCard::Paces2), ShortString::concat(num, '_fire_b'));
            }
            i += 1;
        }
    }
    //-----------------------------------------
    // TACTICS CARDS
    //

    #[test]
    fn test_chances_tactics_vengeful_a() {
        let sys = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop_internal(sys,
            [1, 2, TacticsCard::Vengeful.into()].span(),
            [1, 2, 0].span(),
        );
        let start_state_a = progress.steps[0].state_a;
        let start_state_b = progress.steps[0].state_b;
// CONST::INITIAL_DAMAGE.print();
// (*start_state_a.chances).print();
// (*start_state_b.damage).print();
// round.state_a.damage.print();
// round.state_b.damage.print();
// (*start_state_a.damage).print();
// (*start_state_b.chances).print();
        assert(round.state_a.chances == CONST::INITIAL_CHANCE, 'INITIAL_CHANCE');
        assert(round.state_a.damage > *start_state_a.damage, 'damage');
        _assert_not_affected_by_cards(*start_state_b, round.state_b);
    }
    #[test]
    fn test_chances_tactics_vengeful_b() {
        let sys = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop_internal(sys,
            [1, 2, 0].span(),
            [1, 2, TacticsCard::Vengeful.into()].span(),
        );
        let start_state_a = progress.steps[0].state_a;
        let start_state_b = progress.steps[0].state_b;
        assert(round.state_b.chances == CONST::INITIAL_CHANCE, 'INITIAL_CHANCE');
        assert(round.state_b.damage > *start_state_b.damage, 'damage');
        _assert_not_affected_by_cards(*start_state_a, round.state_a);
    }

    #[test]
    fn test_chances_tactics_thick_coat_a() {
        let sys = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop_internal(sys,
            [1, 2, TacticsCard::ThickCoat.into()].span(),
            [1, 2, 0].span(),
        );
        let start_state_a = progress.steps[0].state_a;
        let start_state_b = progress.steps[0].state_b;
        assert(round.state_b.damage < *start_state_b.damage, 'damage');
        _assert_not_affected_by_cards(*start_state_a, round.state_a);
    }
    #[test]
    fn test_chances_tactics_thick_coat_b() {
        let sys = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop_internal(sys,
            [1, 2, 0].span(),
            [1, 2, TacticsCard::ThickCoat.into()].span(),
        );
        let start_state_a = progress.steps[0].state_a;
        let start_state_b = progress.steps[0].state_b;
        assert(round.state_a.damage < *start_state_a.damage, 'damage');
        _assert_not_affected_by_cards(*start_state_b, round.state_b);
    }

    #[test]
    fn test_chances_tactics_vengeful_thick_a() {
        let sys = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop_internal(sys,
            [1, 2, TacticsCard::Vengeful.into()].span(),
            [1, 2, TacticsCard::ThickCoat.into()].span(),
        );
        let start_state_a = progress.steps[0].state_a;
        let start_state_b = progress.steps[0].state_b;
        // cancels each other
        _assert_not_affected_by_cards(*start_state_a, round.state_a);
        _assert_not_affected_by_cards(*start_state_b, round.state_b);
    }
    #[test]
    fn test_chances_tactics_vengeful_thick_b() {
        let sys = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop_internal(sys,
            [1, 2, TacticsCard::ThickCoat.into()].span(),
            [1, 2, TacticsCard::Vengeful.into()].span(),
        );
        let start_state_a = progress.steps[0].state_a;
        let start_state_b = progress.steps[0].state_b;
        // cancels each other
        _assert_not_affected_by_cards(*start_state_a, round.state_a);
        _assert_not_affected_by_cards(*start_state_b, round.state_b);
    }

    #[test]
    fn test_chances_tactics_insult_a() {
        let sys = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop_internal(sys,
            [1, 2, TacticsCard::Insult.into()].span(),
            [1, 2, 0].span(),
        );
        let start_state_a = progress.steps[0].state_a;
        let start_state_b = progress.steps[0].state_b;
        assert(round.state_b.damage > *start_state_b.damage, 'damage');
        assert(round.state_b.chances < *start_state_b.chances, 'chances');
        _assert_not_affected_by_cards(*start_state_a, round.state_a);
    }
    #[test]
    fn test_chances_tactics_insult_b() {
        let sys = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop_internal(sys,
            [1, 2, 0].span(),
            [1, 2, TacticsCard::Insult.into()].span(),
        );
        let start_state_a = progress.steps[0].state_a;
        let start_state_b = progress.steps[0].state_b;
        assert(round.state_a.damage > *start_state_a.damage, 'damage');
        assert(round.state_a.chances < *start_state_a.chances, 'chances');
        _assert_not_affected_by_cards(*start_state_b, round.state_b);
    }

    #[test]
    fn test_chances_tactics_bananas_a() {
        let sys = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop_internal(sys,
            [1, 2, TacticsCard::Bananas.into()].span(),
            [1, 2, 0].span(),
        );
        let start_state_a = progress.steps[0].state_a;
        let start_state_b = progress.steps[0].state_b;
        assert(round.state_a.chances < *start_state_a.chances, 'chances_a');
        assert(round.state_b.chances < *start_state_b.chances, 'chances_b');
    }
    #[test]
    fn test_chances_tactics_bananas_b() {
        let sys = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop_internal(sys,
            [1, 2, 0].span(),
            [1, 2, TacticsCard::Bananas.into()].span(),
        );
        let start_state_a = progress.steps[0].state_a;
        let start_state_b = progress.steps[0].state_b;
        assert(round.state_a.chances < *start_state_a.chances, 'chances_a');
        assert(round.state_b.chances < *start_state_b.chances, 'chances_b');
    }
    #[test]
    fn test_chances_tactics_bananas_ab() {
        let sys = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop_internal(sys,
            [1, 2, TacticsCard::Bananas.into()].span(),
            [1, 2, TacticsCard::Bananas.into()].span(),
        );
        let start_state_a = progress.steps[0].state_a;
        let start_state_b = progress.steps[0].state_b;
        assert(round.state_a.chances < *start_state_a.chances, 'chances_a');
        assert(round.state_b.chances < *start_state_b.chances, 'chances_b');
    }

    #[test]
    fn test_chances_tactics_coin_toss_a() {
        let sys = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop_internal(sys,
            [1, 2, TacticsCard::CoinToss.into()].span(),
            [1, 2, 0].span(),
        );
        let start_state_a = progress.steps[0].state_a;
        let start_state_b = progress.steps[0].state_b;
        _assert_not_affected_by_cards(*start_state_a, round.state_a);
        _assert_not_affected_by_cards(*start_state_b, round.state_b);
    }
    #[test]
    fn test_chances_tactics_coin_toss_b() {
        let sys = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop_internal(sys,
            [1, 2, 0].span(),
            [1, 2, TacticsCard::CoinToss.into()].span(),
        );
        let start_state_a = progress.steps[0].state_a;
        let start_state_b = progress.steps[0].state_b;
        _assert_not_affected_by_cards(*start_state_a, round.state_a);
        _assert_not_affected_by_cards(*start_state_b, round.state_b);
    }

    #[test]
    fn test_chances_tactics_reversal_a() {
        let sys = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop_internal(sys,
            [1, 2, TacticsCard::Reversal.into()].span(),
            [1, 2, 0].span(),
        );
        let start_state_a = progress.steps[0].state_a;
        let start_state_b = progress.steps[0].state_b;
        _assert_not_affected_by_cards(*start_state_a, round.state_a);
        _assert_not_affected_by_cards(*start_state_b, round.state_b);
    }
    #[test]
    fn test_chances_tactics_reversal_b() {
        let sys = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop_internal(sys,
            [1, 2, 0].span(),
            [1, 2, TacticsCard::Reversal.into()].span(),
        );
        let start_state_a = progress.steps[0].state_a;
        let start_state_b = progress.steps[0].state_b;
        _assert_not_affected_by_cards(*start_state_a, round.state_a);
        _assert_not_affected_by_cards(*start_state_b, round.state_b);
    }




    //-----------------------------------------
    // BLADES CARDS
    //

    #[test]
    fn test_chances_blades_seppukku_a() {
        let sys = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop_internal(sys,
            [1, 2, 0, BladesCard::Seppuku.into()].span(),
            [1, 2, 0, 0].span(),
        );
        let start_state_a = progress.steps[0].state_a;
        let start_state_b = progress.steps[0].state_b;
        assert(*start_state_a.chances == CONST::INITIAL_CHANCE, 'INITIAL_CHANCE');
        assert(*start_state_a.damage == CONST::INITIAL_DAMAGE, 'INITIAL_DAMAGE');
        assert(round.state_a.chances > *start_state_a.chances, 'chances');
        assert(round.state_a.damage > *start_state_a.damage, 'damage');
        _assert_not_affected_by_cards(*start_state_b, round.state_b);
    }
    #[test]
    fn test_chances_blades_seppukku_b() {
        let sys = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop_internal(sys,
            [1, 2, 0, 0].span(),
            [1, 2, 0, BladesCard::Seppuku.into()].span(),
        );
        let start_state_a = progress.steps[0].state_a;
        let start_state_b = progress.steps[0].state_b;
        assert(*start_state_b.chances == CONST::INITIAL_CHANCE, 'INITIAL_CHANCE');
        assert(*start_state_b.damage == CONST::INITIAL_DAMAGE, 'INITIAL_DAMAGE');
        assert(round.state_b.chances > *start_state_b.chances, 'chances');
        assert(round.state_b.damage > *start_state_b.damage, 'damage');
        _assert_not_affected_by_cards(*start_state_a, round.state_a);
    }

    #[test]
    fn test_chances_blades_run_away_a() {
        let sys = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop_internal(sys,
            [1, 2, 0, BladesCard::RunAway.into()].span(),
            [1, 2, 0, 0].span(),
        );
        let start_state_a = progress.steps[0].state_a;
        let start_state_b = progress.steps[0].state_b;
        assert(round.state_b.chances < *start_state_b.chances, 'chances');
        _assert_not_affected_by_cards(*start_state_a, round.state_a);
    }
    #[test]
    fn test_chances_blades_run_away_b() {
        let sys = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop_internal(sys,
            [1, 2, 0, 0].span(),
            [1, 2, 0, BladesCard::RunAway.into()].span(),
        );
        let start_state_a = progress.steps[0].state_a;
        let start_state_b = progress.steps[0].state_b;
        assert(round.state_a.chances < *start_state_a.chances, 'chances');
        _assert_not_affected_by_cards(*start_state_b, round.state_b);
    }

    #[test]
    fn test_chances_blades_behead_a() {
        let sys = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop_internal(sys,
            [1, 2, 0, BladesCard::Behead.into()].span(),
            [1, 2, 0, 0].span(),
        );
        let start_state_a = progress.steps[0].state_a;
        let start_state_b = progress.steps[0].state_b;
        assert(round.state_a.damage > *start_state_a.damage, 'damage');
        _assert_not_affected_by_cards(*start_state_b, round.state_b);
    }
    #[test]
    fn test_chances_blades_behead_b() {
        let sys = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop_internal(sys,
            [1, 2, 0, 0].span(),
            [1, 2, 0, BladesCard::Behead.into()].span(),
        );
        let start_state_a = progress.steps[0].state_a;
        let start_state_b = progress.steps[0].state_b;
        assert(round.state_b.damage > *start_state_b.damage, 'damage');
        _assert_not_affected_by_cards(*start_state_a, round.state_a);
    }

    #[test]
    fn test_chances_blades_grapple_a() {
        let sys = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop_internal(sys,
            [1, 2, 0, BladesCard::Grapple.into()].span(),
            [1, 2, 0, 0].span(),
        );
        let start_state_a = progress.steps[0].state_a;
        let start_state_b = progress.steps[0].state_b;
        assert(round.state_b.damage < *start_state_b.damage, 'damage');
        _assert_not_affected_by_cards(*start_state_a, round.state_a);
    }
    #[test]
    fn test_chances_blades_grapple_b() {
        let sys = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop_internal(sys,
            [1, 2, 0, 0].span(),
            [1, 2, 0, BladesCard::Grapple.into()].span(),
        );
        let start_state_a = progress.steps[0].state_a;
        let start_state_b = progress.steps[0].state_b;
        assert(round.state_a.damage < *start_state_a.damage, 'damage');
        _assert_not_affected_by_cards(*start_state_b, round.state_b);
    }


}
