#[cfg(test)]
mod tests {
    use debug::PrintTrait;
    use core::traits::{TryInto, Into};
    use starknet::{ContractAddress};

    use dojo::world::{WorldStorage};

    use pistols::systems::rng::{Dice, DiceTrait};
    use pistols::systems::game::{game, IGameDispatcher, IGameDispatcherTrait};
    use pistols::models::challenge::{Challenge, ChallengeValue, Round, RoundValue, Moves, MovesTrait, DuelistState, DuelistStateTrait};
    use pistols::models::duelist::{Duelist, DuelistValue, ProfilePicType, Archetype};
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
    use pistols::libs::game_loop::{game_loop, make_moves_hash};
    use pistols::utils::short_string::{ShortString};

    use pistols::systems::tokens::lords_mock::{lords_mock, ILordsMockDispatcher, ILordsMockDispatcherTrait};
    use pistols::tests::mock_rng::{IRngDispatcher, IRngDispatcherTrait, mock_shuffle_values};
    use pistols::tests::tester::{tester,
        tester::{
            TestSystems,
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
            SALT_A, SALT_B, TABLE_ID, MESSAGE,
            ENV_CARD_NEUTRAL,
            SaltsValues, SaltsValuesTrait,
            PlayerMoves, PlayerMovesTrait,
        },
    };



    // simple test to make sure main game_loop() works
    #[test]
    fn test_game_loop() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::MOCK_RNG);
        let (salts, moves_a, moves_b) = prefabs::get_moves_dual_crit();
        let duel_id = prefabs::start_new_challenge(sys, OWNER(), OTHER(), TABLES::COMMONERS);
        let (challenge, round) = prefabs::commit_reveal_get(sys, duel_id, OWNER(), OTHER(), salts, moves_a, moves_b);
        assert(round.state_a.damage > CONST::INITIAL_DAMAGE, 'final_damage_a');
        assert(round.state_b.damage > CONST::INITIAL_DAMAGE, 'final_damage_b');
        assert(round.state_a.health < CONST::FULL_HEALTH, 'final_health_a');
        assert(round.state_b.health < CONST::FULL_HEALTH, 'final_health_b');
        assert(challenge.winner == 0, 'challenge.winner');
        _assert_is_dead(round.state_a, 'dead_a');
        _assert_is_dead(round.state_b, 'dead_b');
    }


    //-----------------------------------------
    // game_loop
    //

    fn execute_game_loop(sys: TestSystems, moves_a: Span<u8>, moves_b: Span<u8>, shuffle: bool) -> (Round, DuelProgress) {
        if (!shuffle) {
            sys.rng.mock_values(
                ['env'].span(),
                [mock_shuffle_values(
                    [ENV_CARD_NEUTRAL, ENV_CARD_NEUTRAL, ENV_CARD_NEUTRAL, ENV_CARD_NEUTRAL, ENV_CARD_NEUTRAL,
                    ENV_CARD_NEUTRAL, ENV_CARD_NEUTRAL, ENV_CARD_NEUTRAL, ENV_CARD_NEUTRAL, ENV_CARD_NEUTRAL].span()
                )].span()
            );
        }
        let mut round = Round {
            duel_id: 0x1234,
            state: RoundState::Reveal,
            moves_a: Default::default(),
            moves_b: Default::default(),
            state_a: Default::default(),
            state_b: Default::default(),
            final_blow: 0,
        };
        let mut hand_a: DuelistHand = round.moves_a.as_hand();
        let mut hand_b: DuelistHand = round.moves_b.as_hand();
        round.moves_a.initialize(SALT_A, moves_a);
        round.moves_b.initialize(SALT_B, moves_b);
        round.state_a.initialize(hand_a);
        round.state_b.initialize(hand_b);
        let progress: DuelProgress = game_loop(@sys.world, DeckType::Classic, ref round);
        (round, progress)
    }


    fn _assert_not_affected_by_cards(state_start: DuelistState, state_final: DuelistState) {
        assert(state_start.chances == CONST::INITIAL_CHANCE, 'keep_INITIAL_CHANCE');
        assert(state_start.damage == CONST::INITIAL_DAMAGE, 'keep_INITIAL_DAMAGE');
        assert(state_start.chances == state_final.chances, 'keep_chances');
        assert(state_start.damage == state_final.damage, 'keep_damage');
    }

    //-----------------------------------------
    // HAND / GAME PROGRESS
    //

    #[test]
    fn test_hand_progress() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (salts, _moves_a, _moves_b) = prefabs::get_moves_dual_miss();
        sys.rng.mock_values(salts.salts, salts.values);
        let moves_a: Span<u8> = [5, 6, 1, BLADES_CARDS::Grapple].span();
        let moves_b: Span<u8> = [10, 9, 3, BLADES_CARDS::PocketPistol].span();
        let (round, progress) = execute_game_loop(sys, moves_a, moves_b, true);
        assert(progress.hand_a.card_fire == (*moves_a[0]).into(), 'hand_a.card_fire');
        assert(progress.hand_a.card_dodge == (*moves_a[1]).into(), 'hand_a.card_dodge');
        assert(progress.hand_a.card_tactics == (*moves_a[2]).into(), 'hand_a.card_tactics');
        assert(progress.hand_a.card_blades == (*moves_a[3]).into(), 'hand_a.card_blades');
        assert(progress.hand_b.card_fire == (*moves_b[0]).into(), 'hand_b.card_fire');
        assert(progress.hand_b.card_dodge == (*moves_b[1]).into(), 'hand_b.card_dodge');
        assert(progress.hand_b.card_tactics == (*moves_b[2]).into(), 'hand_b.card_tactics');
        assert(progress.hand_b.card_blades == (*moves_b[3]).into(), 'hand_b.card_blades');
        assert(progress.steps.len() == 12, 'progress.steps.len');
        assert(progress.winner == 1, 'progress.winner');
        assert(round.final_blow == BladesCard::Grapple.variant_name(), 'round.final_blow');
        let mut last_dice_env: u8 = 0;
        let mut i: u8 = 0;
        while (i < 12) {
            let num: felt252 = '0'+i.into();
            let step: DuelStep = *progress.steps[i.into()];
// println!("{}: dices {} {}", i, step.state_a.dice_fire, step.state_b.dice_fire);
            if (i == 0) {
                // initial state
                assert(step.card_a == DuelistDrawnCard::None, ShortString::concat(num, '_pace_a'));
                assert(step.card_b == DuelistDrawnCard::None, ShortString::concat(num, '_pace_b'));
                assert(step.card_env == EnvCard::None, ShortString::concat(num, '_card_env'));
                assert(step.dice_env == 0, ShortString::concat(num, '_dice_env'));
                assert(step.state_a.dice_fire == 0, ShortString::concat(num, 'dice_fire_a'));
                assert(step.state_b.dice_fire == 0, ShortString::concat(num, 'dice_fire_b'));
            } else if (i > 10) {
                // blades
                assert(step.card_a == DuelistDrawnCard::Blades(BladesCard::Grapple), ShortString::concat(num, '_pace_a'));
                assert(step.card_b == DuelistDrawnCard::Blades(BladesCard::PocketPistol), ShortString::concat(num, '_pace_b'));
                assert(step.card_env == EnvCard::None, ShortString::concat(num, '_card_env'));
                assert(step.dice_env == 0, ShortString::concat(num, '_dice_env'));
                assert(step.state_a.dice_fire == 0, ShortString::concat(num, 'dice_fire_a'));
                assert(step.state_b.dice_fire == 0, ShortString::concat(num, 'dice_fire_b'));
            } else {
                // Paces 1 to 10
                let pace: PacesCard = step.pace;
                assert(step.pace == pace, ShortString::concat(num, '_step.pace'));
                assert(step.card_env != EnvCard::None, ShortString::concat(num, '_step.card_env'));
                assert(step.dice_env > 0, ShortString::concat(num, '_step.dice_env'));
                // test shuffler
                // assert(step.dice_env != last_dice_env, ShortString::concat(num, '_not_shuffled'));
                last_dice_env = step.dice_env;
                // test paces
                if (pace == (*moves_a[0]).into()) {
                    assert(step.card_a == DuelistDrawnCard::Fire((*moves_a[0]).into()), ShortString::concat(num, '_fire_a'));
                    assert(step.card_b == DuelistDrawnCard::None, ShortString::concat(num, '_none_b'));
                    assert(step.state_a.dice_fire > 0, ShortString::concat(num, 'dice_fire_a'));
                    assert(step.state_b.dice_fire == 0, ShortString::concat(num, 'dice_fire_b'));
                } else if (pace == (*moves_a[1]).into()) {
                    assert(step.card_a == DuelistDrawnCard::Dodge((*moves_a[1]).into()), ShortString::concat(num, '_dodge_a'));
                    assert(step.card_b == DuelistDrawnCard::None, ShortString::concat(num, '_none_b'));
                    assert(step.state_a.dice_fire == 0, ShortString::concat(num, 'dice_fire_a'));
                    assert(step.state_b.dice_fire == 0, ShortString::concat(num, 'dice_fire_b'));
                } else if (pace == (*moves_b[0]).into()) {
                    assert(step.card_a == DuelistDrawnCard::None, ShortString::concat(num, '_none_a'));
                    assert(step.card_b == DuelistDrawnCard::Fire((*moves_b[0]).into()), ShortString::concat(num, '_fire_b'));
                    assert(step.state_a.dice_fire == 0, ShortString::concat(num, 'dice_fire_a'));
                    assert(step.state_b.dice_fire > 0, ShortString::concat(num, 'dice_fire_b'));
                } else if (pace == (*moves_b[1]).into()) {
                    assert(step.card_a == DuelistDrawnCard::None, ShortString::concat(num, '_none_a'));
                    assert(step.card_b == DuelistDrawnCard::Dodge((*moves_b[1]).into()), ShortString::concat(num, '_dodge_b'));
                    assert(step.state_a.dice_fire == 0, ShortString::concat(num, 'dice_fire_a'));
                    assert(step.state_b.dice_fire == 0, ShortString::concat(num, 'dice_fire_b'));
                } else {
                    assert(step.card_a == DuelistDrawnCard::None, ShortString::concat(num, '_none_a'));
                    assert(step.card_b == DuelistDrawnCard::None, ShortString::concat(num, '_none_b'));
                    assert(step.state_a.dice_fire == 0, ShortString::concat(num, 'dice_fire_a'));
                    assert(step.state_b.dice_fire == 0, ShortString::concat(num, 'dice_fire_b'));
                }
            }
            i += 1;
        }
    }

    #[test]
    fn test_fire_no_dodge() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (salts, _moves_a, _moves_b) = prefabs::get_moves_dual_miss();
        sys.rng.mock_values(salts.salts, salts.values);
        let (round, progress) = execute_game_loop(sys,
            [1, 1].span(),
            [2, 2].span(),
            false
        );
        assert(progress.hand_a.card_fire == 1_u8.into(), 'hand_a.card_fire');
        assert(progress.hand_a.card_dodge == 0_u8.into(), 'hand_a.card_dodge');
        assert(progress.hand_b.card_fire == 2_u8.into(), 'hand_b.card_fire');
        assert(progress.hand_b.card_dodge == 0_u8.into(), 'hand_b.card_dodge');
        assert(progress.steps.len() == 3, 'paces.len');
        assert(round.final_blow == PacesCard::Paces2.variant_name(), 'round.final_blow');
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
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(sys,
            [1, 2, TacticsCard::Vengeful.into()].span(),
            [1, 2, 0].span(),
            false
        );
        assert(round.final_blow == PacesCard::Paces1.variant_name(), 'round.final_blow'); // ended in pistols
        let start_state_a = progress.steps[0].state_a;
        let start_state_b = progress.steps[0].state_b;
// '----'.print();
// CONST::INITIAL_DAMAGE.print();
// // (*start_state_a.chances).print();
// // (*start_state_b.chances).print();
// (*start_state_a.damage).print();
// (*start_state_b.damage).print();
// round.state_a.damage.print();
// round.state_b.damage.print();
        assert(round.state_a.chances == CONST::INITIAL_CHANCE, 'INITIAL_CHANCE');
        assert(round.state_a.damage > *start_state_a.damage, 'damage');
        _assert_not_affected_by_cards(*start_state_b, round.state_b);
    }
    #[test]
    fn test_chances_tactics_vengeful_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(sys,
            [1, 2, 0].span(),
            [1, 2, TacticsCard::Vengeful.into()].span(),
            false
        );
        assert(round.final_blow == PacesCard::Paces1.variant_name(), 'round.final_blow'); // ended in pistols
        let start_state_a = progress.steps[0].state_a;
        let start_state_b = progress.steps[0].state_b;
        assert(round.state_b.chances == CONST::INITIAL_CHANCE, 'INITIAL_CHANCE');
        assert(round.state_b.damage > *start_state_b.damage, 'damage');
        _assert_not_affected_by_cards(*start_state_a, round.state_a);
    }

    #[test]
    fn test_chances_tactics_thick_coat_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(sys,
            [1, 2, TacticsCard::ThickCoat.into()].span(),
            [1, 2, 0].span(),
            false
        );
        assert(round.final_blow == PacesCard::Paces1.variant_name(), 'round.final_blow'); // ended in pistols
        let start_state_a = progress.steps[0].state_a;
        let start_state_b = progress.steps[0].state_b;
        assert(round.state_b.damage < *start_state_b.damage, 'damage');
        _assert_not_affected_by_cards(*start_state_a, round.state_a);
    }
    #[test]
    fn test_chances_tactics_thick_coat_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(sys,
            [1, 2, 0].span(),
            [1, 2, TacticsCard::ThickCoat.into()].span(),
            false
        );
        assert(round.final_blow == PacesCard::Paces1.variant_name(), 'round.final_blow'); // ended in pistols
        let start_state_a = progress.steps[0].state_a;
        let start_state_b = progress.steps[0].state_b;
        assert(round.state_a.damage < *start_state_a.damage, 'damage');
        _assert_not_affected_by_cards(*start_state_b, round.state_b);
    }

    #[test]
    fn test_chances_tactics_vengeful_thick_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(sys,
            [1, 2, TacticsCard::Vengeful.into()].span(),
            [1, 2, TacticsCard::ThickCoat.into()].span(),
            false
        );
        assert(round.final_blow == PacesCard::Paces1.variant_name(), 'round.final_blow'); // ended in pistols
        let start_state_a = progress.steps[0].state_a;
        let start_state_b = progress.steps[0].state_b;
        // cancels each other
        _assert_not_affected_by_cards(*start_state_a, round.state_a);
        _assert_not_affected_by_cards(*start_state_b, round.state_b);
    }
    #[test]
    fn test_chances_tactics_vengeful_thick_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(sys,
            [1, 2, TacticsCard::ThickCoat.into()].span(),
            [1, 2, TacticsCard::Vengeful.into()].span(),
            false
        );
        assert(round.final_blow == PacesCard::Paces1.variant_name(), 'round.final_blow'); // ended in pistols
        let start_state_a = progress.steps[0].state_a;
        let start_state_b = progress.steps[0].state_b;
        // cancels each other
        _assert_not_affected_by_cards(*start_state_a, round.state_a);
        _assert_not_affected_by_cards(*start_state_b, round.state_b);
    }

    #[test]
    fn test_chances_tactics_insult_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(sys,
            [1, 2, TacticsCard::Insult.into()].span(),
            [1, 2, 0].span(),
            false
        );
        assert(round.final_blow == PacesCard::Paces1.variant_name(), 'round.final_blow'); // ended in pistols
        let start_state_a = progress.steps[0].state_a;
        let start_state_b = progress.steps[0].state_b;
        assert(round.state_b.damage > *start_state_b.damage, 'damage');
        assert(round.state_b.chances < *start_state_b.chances, 'chances');
        _assert_not_affected_by_cards(*start_state_a, round.state_a);
    }
    #[test]
    fn test_chances_tactics_insult_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(sys,
            [1, 2, 0].span(),
            [1, 2, TacticsCard::Insult.into()].span(),
            false
        );
        assert(round.final_blow == PacesCard::Paces1.variant_name(), 'round.final_blow'); // ended in pistols
        let start_state_a = progress.steps[0].state_a;
        let start_state_b = progress.steps[0].state_b;
        assert(round.state_a.damage > *start_state_a.damage, 'damage');
        assert(round.state_a.chances < *start_state_a.chances, 'chances');
        _assert_not_affected_by_cards(*start_state_b, round.state_b);
    }

    #[test]
    fn test_chances_tactics_bananas_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(sys,
            [1, 2, TacticsCard::Bananas.into()].span(),
            [1, 2, 0].span(),
            false
        );
        assert(round.final_blow == PacesCard::Paces1.variant_name(), 'round.final_blow'); // ended in pistols
        let start_state_a = progress.steps[0].state_a;
        let start_state_b = progress.steps[0].state_b;
        assert(round.state_a.chances < *start_state_a.chances, 'chances_a');
        assert(round.state_b.chances < *start_state_b.chances, 'chances_b');
    }
    #[test]
    fn test_chances_tactics_bananas_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(sys,
            [1, 2, 0].span(),
            [1, 2, TacticsCard::Bananas.into()].span(),
            false
        );
        assert(round.final_blow == PacesCard::Paces1.variant_name(), 'round.final_blow'); // ended in pistols
        let start_state_a = progress.steps[0].state_a;
        let start_state_b = progress.steps[0].state_b;
        assert(round.state_a.chances < *start_state_a.chances, 'chances_a');
        assert(round.state_b.chances < *start_state_b.chances, 'chances_b');
    }
    #[test]
    fn test_chances_tactics_bananas_ab() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(sys,
            [1, 2, TacticsCard::Bananas.into()].span(),
            [1, 2, TacticsCard::Bananas.into()].span(),
            false
        );
        assert(round.final_blow == PacesCard::Paces1.variant_name(), 'round.final_blow'); // ended in pistols
        let start_state_a = progress.steps[0].state_a;
        let start_state_b = progress.steps[0].state_b;
        assert(round.state_a.chances < *start_state_a.chances, 'chances_a');
        assert(round.state_b.chances < *start_state_b.chances, 'chances_b');
    }

    #[test]
    fn test_chances_tactics_coin_toss_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(sys,
            [1, 2, TacticsCard::CoinToss.into()].span(),
            [1, 2, 0].span(),
            false
        );
        assert(round.final_blow == PacesCard::Paces1.variant_name(), 'round.final_blow'); // ended in pistols
        let start_state_a = progress.steps[0].state_a;
        let start_state_b = progress.steps[0].state_b;
        _assert_not_affected_by_cards(*start_state_a, round.state_a);
        _assert_not_affected_by_cards(*start_state_b, round.state_b);
    }
    #[test]
    fn test_chances_tactics_coin_toss_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(sys,
            [1, 2, 0].span(),
            [1, 2, TacticsCard::CoinToss.into()].span(),
            false
        );
        assert(round.final_blow == PacesCard::Paces1.variant_name(), 'round.final_blow'); // ended in pistols
        let start_state_a = progress.steps[0].state_a;
        let start_state_b = progress.steps[0].state_b;
        _assert_not_affected_by_cards(*start_state_a, round.state_a);
        _assert_not_affected_by_cards(*start_state_b, round.state_b);
    }

    #[test]
    fn test_chances_tactics_reversal_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(sys,
            [1, 2, TacticsCard::Reversal.into()].span(),
            [1, 2, 0].span(),
            false
        );
        assert(round.final_blow == PacesCard::Paces1.variant_name(), 'round.final_blow'); // ended in pistols
        let start_state_a = progress.steps[0].state_a;
        let start_state_b = progress.steps[0].state_b;
        _assert_not_affected_by_cards(*start_state_a, round.state_a);
        _assert_not_affected_by_cards(*start_state_b, round.state_b);
    }
    #[test]
    fn test_chances_tactics_reversal_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(sys,
            [1, 2, 0].span(),
            [1, 2, TacticsCard::Reversal.into()].span(),
            false
        );
        assert(round.final_blow == PacesCard::Paces1.variant_name(), 'round.final_blow'); // ended in pistols
        let start_state_a = progress.steps[0].state_a;
        let start_state_b = progress.steps[0].state_b;
        _assert_not_affected_by_cards(*start_state_a, round.state_a);
        _assert_not_affected_by_cards(*start_state_b, round.state_b);
    }




    //==========================================================================
    // BLADES
    //==========================================================================


    //-------------------------------------------
    // Seppuku
    //

    #[test]
    fn test_blades_seppukku_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(sys,
            [1, 2, 0, BladesCard::Seppuku.into()].span(),
            [1, 2, 0, 0].span(),
            false
        );
        assert(round.final_blow == BladesCard::Seppuku.variant_name(), 'round.final_blow'); // ended in blades
        let start_state_a = progress.steps[0].state_a;
        let start_state_b = progress.steps[0].state_b;
        // card effects on player state
        assert(*start_state_a.chances == CONST::INITIAL_CHANCE, 'INITIAL_CHANCE');
        assert(*start_state_a.damage == CONST::INITIAL_DAMAGE, 'INITIAL_DAMAGE');
        assert(round.state_a.chances > *start_state_a.chances, 'chances');
        assert(round.state_a.damage > *start_state_a.damage, 'damage');
        _assert_not_affected_by_cards(*start_state_b, round.state_b);
        // results
        assert(progress.winner == 2, 'progress.winner');
        _assert_is_dead(round.state_a, 'dead_a');
        _assert_is_alive(round.state_b, 'alive_b');
    }
    #[test]
    fn test_blades_seppukku_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(sys,
            [1, 2, 0, 0].span(),
            [1, 2, 0, BladesCard::Seppuku.into()].span(),
            false
        );
        assert(round.final_blow == BladesCard::Seppuku.variant_name(), 'round.final_blow'); // ended in blades
        let start_state_a = progress.steps[0].state_a;
        let start_state_b = progress.steps[0].state_b;
        // card effects on player state
        assert(*start_state_b.chances == CONST::INITIAL_CHANCE, 'INITIAL_CHANCE');
        assert(*start_state_b.damage == CONST::INITIAL_DAMAGE, 'INITIAL_DAMAGE');
        assert(round.state_b.chances > *start_state_b.chances, 'chances');
        assert(round.state_b.damage > *start_state_b.damage, 'damage');
        _assert_not_affected_by_cards(*start_state_a, round.state_a);
        // results
        assert(progress.winner == 1, 'progress.winner');
        _assert_is_alive(round.state_a, 'alive_a');
        _assert_is_dead(round.state_b, 'dead_b');
    }
    #[test]
    fn test_blades_seppukku_draw() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(sys,
            [1, 2, 0, BladesCard::Seppuku.into()].span(),
            [1, 2, 0, BladesCard::Seppuku.into()].span(),
            false
        );
        assert(round.final_blow == BladesCard::Seppuku.variant_name(), 'round.final_blow'); // ended in blades
        let start_state_a = progress.steps[0].state_a;
        let start_state_b = progress.steps[0].state_b;
        assert(*start_state_b.chances == CONST::INITIAL_CHANCE, 'INITIAL_CHANCE');
        assert(*start_state_b.damage == CONST::INITIAL_DAMAGE, 'INITIAL_DAMAGE');
        // card effects on player state
        assert(round.state_a.chances > *start_state_a.chances, 'chances');
        assert(round.state_a.damage > *start_state_a.damage, 'damage');
        assert(round.state_b.chances > *start_state_b.chances, 'chances');
        assert(round.state_b.damage > *start_state_b.damage, 'damage');
        // results
        assert(progress.winner == 0, 'progress.winner');
        _assert_is_dead(round.state_a, 'dead_a');
        _assert_is_dead(round.state_b, 'dead_b');
    }
    #[test]
    fn test_blades_seppukku_other() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(sys,
            [1, 2, 0, BladesCard::Seppuku.into()].span(),
            [1, 2, 0, BladesCard::Behead.into()].span(),
            false
        );
        assert(round.final_blow == BladesCard::Seppuku.variant_name(), 'round.final_blow'); // ended in blades
        // results
        assert(progress.winner == 2, 'progress.winner');
        _assert_is_dead(round.state_a, 'dead_a');
        _assert_is_alive(round.state_b, 'alive_b');
    }


    //-------------------------------------------
    // Blades vs None
    //

    #[test]
    fn test_blades_pocket_pistol_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(sys,
            [1, 2, 0, BladesCard::PocketPistol.into()].span(),
            [1, 2, 0, 0].span(),
            false
        );
        assert(round.final_blow == BladesCard::PocketPistol.variant_name(), 'round.final_blow'); // ended in blades
        let start_state_a = progress.steps[0].state_a;
        let start_state_b = progress.steps[0].state_b;
        // card effects on player state
        assert(round.state_b.chances < *start_state_b.chances, 'chances');
        _assert_not_affected_by_cards(*start_state_a, round.state_a);
        // blade wins against none
        assert(progress.winner == 1, 'progress.winner');
        _assert_is_alive(round.state_a, 'alive_a');
        _assert_is_dead(round.state_b, 'dead_b');
    }
    #[test]
    fn test_blades_pocket_pistol_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(sys,
            [1, 2, 0, 0].span(),
            [1, 2, 0, BladesCard::PocketPistol.into()].span(),
            false
        );
        assert(round.final_blow == BladesCard::PocketPistol.variant_name(), 'round.final_blow'); // ended in blades
        let start_state_a = progress.steps[0].state_a;
        let start_state_b = progress.steps[0].state_b;
        assert(round.state_a.chances < *start_state_a.chances, 'chances');
        _assert_not_affected_by_cards(*start_state_b, round.state_b);
        // blade wins against none
        assert(progress.winner == 2, 'progress.winner');
        _assert_is_dead(round.state_a, 'dead_a');
        _assert_is_alive(round.state_b, 'alive_b');
    }

    #[test]
    fn test_blades_behead_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(sys,
            [1, 2, 0, BladesCard::Behead.into()].span(),
            [1, 2, 0, 0].span(),
            false
        );
        assert(round.final_blow == BladesCard::Behead.variant_name(), 'round.final_blow'); // ended in blades
        let start_state_a = progress.steps[0].state_a;
        let start_state_b = progress.steps[0].state_b;
        assert(round.state_a.damage > *start_state_a.damage, 'damage');
        _assert_not_affected_by_cards(*start_state_b, round.state_b);
        // blade wins against none
        assert(progress.winner == 1, 'progress.winner');
        _assert_is_alive(round.state_a, 'alive_a');
        _assert_is_dead(round.state_b, 'dead_b');
    }
    #[test]
    fn test_blades_behead_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(sys,
            [1, 2, 0, 0].span(),
            [1, 2, 0, BladesCard::Behead.into()].span(),
            false
        );
        assert(round.final_blow == BladesCard::Behead.variant_name(), 'round.final_blow'); // ended in blades
        let start_state_a = progress.steps[0].state_a;
        let start_state_b = progress.steps[0].state_b;
        assert(round.state_b.damage > *start_state_b.damage, 'damage');
        _assert_not_affected_by_cards(*start_state_a, round.state_a);
        // blade wins against none
        assert(progress.winner == 2, 'progress.winner');
        _assert_is_dead(round.state_a, 'dead_a');
        _assert_is_alive(round.state_b, 'alive_b');
    }

    #[test]
    fn test_blades_grapple_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(sys,
            [1, 2, 0, BladesCard::Grapple.into()].span(),
            [1, 2, 0, 0].span(),
            false
        );
        assert(round.final_blow == BladesCard::Grapple.variant_name(), 'round.final_blow'); // ended in blades
        let start_state_a = progress.steps[0].state_a;
        let start_state_b = progress.steps[0].state_b;
        assert(round.state_b.damage < *start_state_b.damage, 'damage');
        _assert_not_affected_by_cards(*start_state_a, round.state_a);
        // blade wins against none
        assert(progress.winner == 1, 'progress.winner');
        _assert_is_alive(round.state_a, 'alive_a');
        _assert_is_dead(round.state_b, 'dead_b');
    }
    #[test]
    fn test_blades_grapple_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(sys,
            [1, 2, 0, 0].span(),
            [1, 2, 0, BladesCard::Grapple.into()].span(),
            false
        );
        assert(round.final_blow == BladesCard::Grapple.variant_name(), 'round.final_blow'); // ended in blades
        let start_state_a = progress.steps[0].state_a;
        let start_state_b = progress.steps[0].state_b;
        assert(round.state_a.damage < *start_state_a.damage, 'damage');
        _assert_not_affected_by_cards(*start_state_b, round.state_b);
        // blade wins against none
        assert(progress.winner == 2, 'progress.winner');
        _assert_is_dead(round.state_a, 'dead_a');
        _assert_is_alive(round.state_b, 'alive_b');
    }


    //-------------------------------------------
    // Same vs Same
    //

    #[test]
    fn test_blades_pocket_pistol_vs_pocket_pistol() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(sys,
            [1, 2, 0, BladesCard::PocketPistol.into()].span(),
            [1, 2, 0, BladesCard::PocketPistol.into()].span(),
            false
        );
        assert(round.final_blow == BladesCard::PocketPistol.variant_name(), 'round.final_blow'); // ended in blades
        assert(progress.winner == 0, 'progress.winner');
        _assert_is_dead(round.state_a, 'dead_a');
        _assert_is_dead(round.state_b, 'dead_b');
    }
    #[test]
    fn test_blades_behead_vs_behead() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(sys,
            [1, 2, 0, BladesCard::Behead.into()].span(),
            [1, 2, 0, BladesCard::Behead.into()].span(),
            false
        );
        assert(round.final_blow == BladesCard::Behead.variant_name(), 'round.final_blow'); // ended in blades
        assert(progress.winner == 0, 'progress.winner');
        _assert_is_dead(round.state_a, 'dead_a');
        _assert_is_dead(round.state_b, 'dead_b');
    }
    #[test]
    fn test_blades_grapple_vs_grapple() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(sys,
            [1, 2, 0, BladesCard::Grapple.into()].span(),
            [1, 2, 0, BladesCard::Grapple.into()].span(),
            false
        );
        assert(round.final_blow == BladesCard::Grapple.variant_name(), 'round.final_blow'); // ended in blades
        assert(progress.winner == 0, 'progress.winner');
        _assert_is_dead(round.state_a, 'dead_a');
        _assert_is_dead(round.state_b, 'dead_b');
    }


    //-------------------------------------------
    // Blades vs Blades
    //
    
    // PocketPistol beats Behead
    #[test]
    fn test_blades_pocket_pistol_vs_behead() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(sys,
            [1, 2, 0, BladesCard::PocketPistol.into()].span(),
            [1, 2, 0, BladesCard::Behead.into()].span(),
            false
        );
        assert(round.final_blow == BladesCard::PocketPistol.variant_name(), 'round.final_blow'); // ended in blades
        assert(progress.winner == 1, 'progress.winner');
        _assert_is_alive(round.state_a, 'alive_a');
        _assert_is_dead(round.state_b, 'dead_b');
    }
    #[test]
    fn test_blades_behead_vs_pocket_pistol() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(sys,
            [1, 2, 0, BladesCard::Behead.into()].span(),
            [1, 2, 0, BladesCard::PocketPistol.into()].span(),
            false
        );
        assert(round.final_blow == BladesCard::PocketPistol.variant_name(), 'round.final_blow'); // ended in blades
        assert(progress.winner == 2, 'progress.winner');
        _assert_is_dead(round.state_a, 'dead_a');
        _assert_is_alive(round.state_b, 'alive_b');
    }
    
    // Behead beats Grapple
    #[test]
    fn test_blades_behead_vs_grapple() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(sys,
            [1, 2, 0, BladesCard::Behead.into()].span(),
            [1, 2, 0, BladesCard::Grapple.into()].span(),
            false
        );
        assert(round.final_blow == BladesCard::Behead.variant_name(), 'round.final_blow'); // ended in blades
        assert(progress.winner == 1, 'progress.winner');
        _assert_is_alive(round.state_a, 'alive_a');
        _assert_is_dead(round.state_b, 'dead_b');
    }
    #[test]
    fn test_blades_grapple_vs_behead() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(sys,
            [1, 2, 0, BladesCard::Grapple.into()].span(),
            [1, 2, 0, BladesCard::Behead.into()].span(),
            false
        );
        assert(round.final_blow == BladesCard::Behead.variant_name(), 'round.final_blow'); // ended in blades
        assert(progress.winner == 2, 'progress.winner');
        _assert_is_dead(round.state_a, 'dead_a');
        _assert_is_alive(round.state_b, 'alive_b');
    }

    // Grapple beats PocketPistol
    #[test]
    fn test_blades_grapple_vs_pocket_pistol() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(sys,
            [1, 2, 0, BladesCard::Grapple.into()].span(),
            [1, 2, 0, BladesCard::PocketPistol.into()].span(),
            false
        );
        assert(round.final_blow == BladesCard::Grapple.variant_name(), 'round.final_blow'); // ended in blades
        assert(progress.winner == 1, 'progress.winner');
        _assert_is_alive(round.state_a, 'alive_a');
        _assert_is_dead(round.state_b, 'dead_b');
    }
    #[test]
    fn test_blades_pocket_pistol_vs_grapple() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(sys,
            [1, 2, 0, BladesCard::PocketPistol.into()].span(),
            [1, 2, 0, BladesCard::Grapple.into()].span(),
            false
        );
        assert(round.final_blow == BladesCard::Grapple.variant_name(), 'round.final_blow'); // ended in blades
        assert(progress.winner == 2, 'progress.winner');
        _assert_is_dead(round.state_a, 'dead_a');
        _assert_is_alive(round.state_b, 'alive_b');
    }

}
