#[cfg(test)]
mod tests {
    use pistols::systems::rng::{RngWrap, RngWrapTrait};
    use pistols::models::challenge::{DuelType, Round, RoundTrait, MovesTrait, DuelistState, DuelistStateTrait};
    use pistols::types::duel_progress::{DuelProgress, DuelStep, DuelistDrawnCard};
    use pistols::types::round_state::{RoundState};
    use pistols::types::constants::{CONST};
    use pistols::types::cards::hand::{
        DeckType, DeckTypeTrait,
        DuelistHand,
        PacesCard,
        TacticsCard,
        BladesCard,
        EnvCard,
        FinalBlow,
    };
    use pistols::libs::game_loop::{GameLoopTrait};
    use pistols::utils::short_string::{ShortString};

    use pistols::systems::rng_mock::{IRngMockDispatcherTrait, MockedValueTrait};
    use pistols::tests::tester::{tester,
        tester::{
            TestSystems, FLAGS,
            // ID, ZERO,
            OWNER, OTHER,
            _assert_is_alive, _assert_is_dead,
        }
    };
    use pistols::tests::prefabs::{prefabs,
        prefabs::{
            SALT_A, SALT_B,
            ENV_CARD_NEUTRAL,
            // PlayerMoves, PlayerMovesTrait,
        },
    };



    // simple test to make sure main game_loop() works
    #[test]
    fn test_game_loop() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::MOCK_RNG);
        let (mocked, moves_a, moves_b) = prefabs::get_moves_dual_crit();
        let duel_id = prefabs::start_new_challenge(@sys, OWNER(), OTHER(), DuelType::Practice, 0);
        let (challenge, round) = prefabs::commit_reveal_get(@sys, duel_id, OWNER(), OTHER(), mocked, moves_a, moves_b);
        assert_gt!(round.state_a.damage, CONST::INITIAL_DAMAGE, "final_damage_a");
        assert_gt!(round.state_b.damage, CONST::INITIAL_DAMAGE, "final_damage_b");
        assert_lt!(round.state_a.health, CONST::FULL_HEALTH, "final_health_a");
        assert_lt!(round.state_b.health, CONST::FULL_HEALTH, "final_health_b");
        assert_eq!(challenge.winner, 0, "challenge.winner");
        _assert_is_dead(round.state_a, "dead_a");
        _assert_is_dead(round.state_b, "dead_b");
    }


    //-----------------------------------------
    // game_loop
    //

    fn execute_game_loop(sys: @TestSystems, moves_a: Span<u8>, moves_b: Span<u8>, shuffle: bool) -> (Round, DuelProgress) {
        if (!shuffle) {
            (*sys.rng).mock_values([
                MockedValueTrait::shuffled('env',
                    [ENV_CARD_NEUTRAL, ENV_CARD_NEUTRAL, ENV_CARD_NEUTRAL, ENV_CARD_NEUTRAL, ENV_CARD_NEUTRAL,
                    ENV_CARD_NEUTRAL, ENV_CARD_NEUTRAL, ENV_CARD_NEUTRAL, ENV_CARD_NEUTRAL, ENV_CARD_NEUTRAL].span()
                )
            ].span());
        }
        let mut round: Round = RoundTrait::new(0x1234);
        round.state = RoundState::Reveal;
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


    fn _assert_not_affected_by_cards(state_start: DuelistState, state_final: DuelistState) {
        assert_eq!(state_start.chances, CONST::INITIAL_CHANCE, "keep_INITIAL_CHANCE");
        assert_eq!(state_start.damage, CONST::INITIAL_DAMAGE, "keep_INITIAL_DAMAGE");
        assert_eq!(state_start.chances, state_final.chances, "keep_chances");
        assert_eq!(state_start.damage, state_final.damage, "keep_damage");
    }

    //-----------------------------------------
    // HAND / GAME PROGRESS
    //

    #[test]
    fn test_hand_progress() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (mocked, _moves_a, _moves_b) = prefabs::get_moves_dual_miss();
        sys.rng.mock_values(mocked);
        let moves_a: Span<u8> = [5, 6, 1, BladesCard::Grapple.into()].span();
        let moves_b: Span<u8> = [10, 9, 3, BladesCard::PocketPistol.into()].span();
        let (round, progress) = execute_game_loop(@sys, moves_a, moves_b, true);
        assert_eq!(progress.hand_a.card_fire, (*moves_a[0]).into(), "hand_a.card_fire");
        assert_eq!(progress.hand_a.card_dodge, (*moves_a[1]).into(), "hand_a.card_dodge");
        assert_eq!(progress.hand_a.card_tactics, (*moves_a[2]).into(), "hand_a.card_tactics");
        assert_eq!(progress.hand_a.card_blades, (*moves_a[3]).into(), "hand_a.card_blades");
        assert_eq!(progress.hand_b.card_fire, (*moves_b[0]).into(), "hand_b.card_fire");
        assert_eq!(progress.hand_b.card_dodge, (*moves_b[1]).into(), "hand_b.card_dodge");
        assert_eq!(progress.hand_b.card_tactics, (*moves_b[2]).into(), "hand_b.card_tactics");
        assert_eq!(progress.hand_b.card_blades, (*moves_b[3]).into(), "hand_b.card_blades");
        assert_eq!(progress.steps.len(), 12, "progress.steps.len");
        assert_eq!(progress.winner, 1, "progress.winner");
        assert_eq!(round.final_blow, FinalBlow::Blades(BladesCard::Grapple), "round.final_blow");
        let mut _last_dice_env: u8 = 0;
        let mut i: u8 = 0;
        while (i < 12) {
            let num: felt252 = '0'+i.into();
            let step: DuelStep = *progress.steps[i.into()];
            if (i == 0) {
                // initial state
                assert_eq!(step.card_a, DuelistDrawnCard::None, "{}_pace_a", num);
                assert_eq!(step.card_b, DuelistDrawnCard::None, "{}_pace_b", num);
                assert_eq!(step.card_env, EnvCard::None, "{}_card_env", num);
                assert_eq!(step.dice_env, 0, "{}_dice_env", num);
                assert_eq!(step.state_a.dice_fire, 0, "{}_dice_fire_a", num);
                assert_eq!(step.state_b.dice_fire, 0, "{}_dice_fire_b", num);
            } else if (i > 10) {
                // blades
                assert_eq!(step.card_a, DuelistDrawnCard::Blades(BladesCard::Grapple), "{}_pace_a", num);
                assert_eq!(step.card_b, DuelistDrawnCard::Blades(BladesCard::PocketPistol), "{}_pace_b", num);
                assert_eq!(step.card_env, EnvCard::None, "{}_card_env", num);
                assert_eq!(step.dice_env, 0, "{}_dice_env", num);
                assert_eq!(step.state_a.dice_fire, 0, "{}_dice_fire_a", num);
                assert_eq!(step.state_b.dice_fire, 0, "{}_dice_fire_b", num);
            } else {
                // Paces 1 to 10
                let pace: PacesCard = step.pace;
                assert_eq!(step.pace, pace, "{}_step.pace", num);
                assert_ne!(step.card_env, EnvCard::None, "{}_step.card_env", num);
                assert_gt!(step.dice_env, 0, "{}_step.dice_env", num);
                // test paces
                if (pace == (*moves_a[0]).into()) {
                    assert_eq!(step.card_a, DuelistDrawnCard::Fire((*moves_a[0]).into()), "{}_fire_a", num);
                    assert_eq!(step.card_b, DuelistDrawnCard::None, "{}_none_b", num);
                    assert_gt!(step.state_a.dice_fire, 0, "{}_dice_fire_a", num);
                    assert_eq!(step.state_b.dice_fire, 0, "{}_dice_fire_b", num);
                } else if (pace == (*moves_a[1]).into()) {
                    assert_eq!(step.card_a, DuelistDrawnCard::Dodge((*moves_a[1]).into()), "{}_dodge_a", num);
                    assert_eq!(step.card_b, DuelistDrawnCard::None, "{}_none_b", num);
                    assert_eq!(step.state_a.dice_fire, 0, "{}_dice_fire_a", num);
                    assert_eq!(step.state_b.dice_fire, 0, "{}_dice_fire_b", num);
                } else if (pace == (*moves_b[0]).into()) {
                    assert_eq!(step.card_a, DuelistDrawnCard::None, "{}_none_a", num);
                    assert_eq!(step.card_b, DuelistDrawnCard::Fire((*moves_b[0]).into()), "{}_fire_b", num);
                    assert_eq!(step.state_a.dice_fire, 0, "{}_dice_fire_a", num);
                    assert_gt!(step.state_b.dice_fire, 0, "{}_dice_fire_b", num);
                } else if (pace == (*moves_b[1]).into()) {
                    assert_eq!(step.card_a, DuelistDrawnCard::None, "{}_none_a", num);
                    assert_eq!(step.card_b, DuelistDrawnCard::Dodge((*moves_b[1]).into()), "{}_dodge_b", num);
                    assert_eq!(step.state_a.dice_fire, 0, "{}_dice_fire_a", num);
                    assert_eq!(step.state_b.dice_fire, 0, "{}_dice_fire_b", num);
                } else {
                    assert_eq!(step.card_a, DuelistDrawnCard::None, "{}_none_a", num);
                    assert_eq!(step.card_b, DuelistDrawnCard::None, "{}_none_b", num);
                    assert_eq!(step.state_a.dice_fire, 0, "{}_dice_fire_a", num);
                    assert_eq!(step.state_b.dice_fire, 0, "{}_dice_fire_b", num);
                }
            }
            i += 1;
        }
    }

    #[test]
    fn test_fire_no_dodge() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (mocked, _moves_a, _moves_b) = prefabs::get_moves_dual_miss();
        sys.rng.mock_values(mocked);
        let (round, progress) = execute_game_loop(@sys,
            [1, 1].span(),
            [2, 2].span(),
            false
        );
        assert_eq!(progress.hand_a.card_fire, 1_u8.into(), "hand_a.card_fire");
        assert_eq!(progress.hand_a.card_dodge, 0_u8.into(), "hand_a.card_dodge");
        assert_eq!(progress.hand_b.card_fire, 2_u8.into(), "hand_b.card_fire");
        assert_eq!(progress.hand_b.card_dodge, 0_u8.into(), "hand_b.card_dodge");
        assert_eq!(progress.steps.len(), 3, "paces.len");
        assert_eq!(round.final_blow, FinalBlow::Paces(PacesCard::Paces2), "round.final_blow");
        let mut i: u8 = 1;
        while (i <= 2) {
            let num: felt252 = '1'+i.into();
            let step: DuelStep = *progress.steps[i.into()];
            let pace: PacesCard = step.pace;
            assert_eq!(step.pace, pace, "{}_step.pace", num);
            assert_ne!(step.card_env, 0_u8.into(), "{}_step.card_env", num);
            assert_gt!(step.dice_env, 0, "{}_step.dice_env", num);
            if (pace == PacesCard::Paces1) {
                assert_eq!(step.card_a, DuelistDrawnCard::Fire(PacesCard::Paces1), "{}_fire_a", num);
                assert_eq!(step.card_b, DuelistDrawnCard::None, "{}_none_b", num);
            } else if (pace == PacesCard::Paces2) {
                assert_eq!(step.card_a, DuelistDrawnCard::None, "{}_none_a", num);
                assert_eq!(step.card_b, DuelistDrawnCard::Fire(PacesCard::Paces2), "{}_fire_b", num);
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
        let (round, progress) = execute_game_loop(@sys,
            [1, 2, TacticsCard::Vengeful.into()].span(),
            [1, 2, 0].span(),
            false
        );
        assert_eq!(round.final_blow, FinalBlow::Paces(PacesCard::Paces1), "round.final_blow"); // ended in pistols
        let start_state_a = progress.steps[0].state_a;
        let start_state_b = progress.steps[0].state_b;
        assert_eq!(round.state_a.chances, CONST::INITIAL_CHANCE, "INITIAL_CHANCE");
        assert_gt!(round.state_a.damage, *start_state_a.damage, "damage");
        _assert_not_affected_by_cards(*start_state_b, round.state_b);
    }
    #[test]
    fn test_chances_tactics_vengeful_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(@sys,
            [1, 2, 0].span(),
            [1, 2, TacticsCard::Vengeful.into()].span(),
            false
        );
        assert_eq!(round.final_blow, FinalBlow::Paces(PacesCard::Paces1), "round.final_blow"); // ended in pistols
        let start_state_a = progress.steps[0].state_a;
        let start_state_b = progress.steps[0].state_b;
        assert_eq!(round.state_b.chances, CONST::INITIAL_CHANCE, "INITIAL_CHANCE");
        assert_gt!(round.state_b.damage, *start_state_b.damage, "damage");
        _assert_not_affected_by_cards(*start_state_a, round.state_a);
    }

    #[test]
    fn test_chances_tactics_thick_coat_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(@sys,
            [1, 2, TacticsCard::ThickCoat.into()].span(),
            [1, 2, 0].span(),
            false
        );
        assert_eq!(round.final_blow, FinalBlow::Paces(PacesCard::Paces1), "round.final_blow"); // ended in pistols
        let start_state_a = progress.steps[0].state_a;
        assert_lt!(round.state_b.damage, CONST::INITIAL_DAMAGE, "damage");
        _assert_not_affected_by_cards(*start_state_a, round.state_a);
    }
    #[test]
    fn test_chances_tactics_thick_coat_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(@sys,
            [1, 2, 0].span(),
            [1, 2, TacticsCard::ThickCoat.into()].span(),
            false
        );
        assert_eq!(round.final_blow, FinalBlow::Paces(PacesCard::Paces1), "round.final_blow"); // ended in pistols
        let start_state_b = progress.steps[0].state_b;
        assert_lt!(round.state_a.damage, CONST::INITIAL_DAMAGE, "damage");
        _assert_not_affected_by_cards(*start_state_b, round.state_b);
    }

    #[test]
    fn test_chances_tactics_vengeful_thick_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(@sys,
            [1, 2, TacticsCard::Vengeful.into()].span(),
            [1, 2, TacticsCard::ThickCoat.into()].span(),
            false
        );
        assert_eq!(round.final_blow, FinalBlow::Paces(PacesCard::Paces1), "round.final_blow"); // ended in pistols
        let start_state_a = progress.steps[0].state_a;
        let start_state_b = progress.steps[0].state_b;
        _assert_not_affected_by_cards(*start_state_a, round.state_a);
        _assert_not_affected_by_cards(*start_state_b, round.state_b);
    }
    #[test]
    fn test_chances_tactics_vengeful_thick_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(@sys,
            [1, 2, TacticsCard::ThickCoat.into()].span(),
            [1, 2, TacticsCard::Vengeful.into()].span(),
            false
        );
        assert_eq!(round.final_blow, FinalBlow::Paces(PacesCard::Paces1), "round.final_blow"); // ended in pistols
        let start_state_a = progress.steps[0].state_a;
        let start_state_b = progress.steps[0].state_b;
        _assert_not_affected_by_cards(*start_state_a, round.state_a);
        _assert_not_affected_by_cards(*start_state_b, round.state_b);
    }

    #[test]
    fn test_chances_tactics_insult_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(@sys,
            [1, 2, TacticsCard::Insult.into()].span(),
            [1, 2, 0].span(),
            false
        );
        assert_eq!(round.final_blow, FinalBlow::Paces(PacesCard::Paces1), "round.final_blow"); // ended in pistols
        let start_state_a = progress.steps[0].state_a;
        let start_state_b = progress.steps[0].state_b;
        assert_gt!(round.state_b.damage, *start_state_b.damage, "damage");
        assert_lt!(round.state_b.chances, *start_state_b.chances, "chances");
        _assert_not_affected_by_cards(*start_state_a, round.state_a);
    }
    #[test]
    fn test_chances_tactics_insult_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(@sys,
            [1, 2, 0].span(),
            [1, 2, TacticsCard::Insult.into()].span(),
            false
        );
        assert_eq!(round.final_blow, FinalBlow::Paces(PacesCard::Paces1), "round.final_blow"); // ended in pistols
        let start_state_a = progress.steps[0].state_a;
        let start_state_b = progress.steps[0].state_b;
        assert_gt!(round.state_a.damage, *start_state_a.damage, "damage");
        assert_lt!(round.state_a.chances, *start_state_a.chances, "chances");
        _assert_not_affected_by_cards(*start_state_b, round.state_b);
    }

    #[test]
    fn test_chances_tactics_bananas_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(@sys,
            [1, 2, TacticsCard::Bananas.into()].span(),
            [1, 2, 0].span(),
            false
        );
        assert_eq!(round.final_blow, FinalBlow::Paces(PacesCard::Paces1), "round.final_blow"); // ended in pistols
        let start_state_a = progress.steps[0].state_a;
        let start_state_b = progress.steps[0].state_b;
        assert_lt!(round.state_a.chances, *start_state_a.chances, "chances_a");
        assert_lt!(round.state_b.chances, *start_state_b.chances, "chances_b");
    }
    #[test]
    fn test_chances_tactics_bananas_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(@sys,
            [1, 2, 0].span(),
            [1, 2, TacticsCard::Bananas.into()].span(),
            false
        );
        assert_eq!(round.final_blow, FinalBlow::Paces(PacesCard::Paces1), "round.final_blow"); // ended in pistols
        let start_state_a = progress.steps[0].state_a;
        let start_state_b = progress.steps[0].state_b;
        assert_lt!(round.state_a.chances, *start_state_a.chances, "chances_a");
        assert_lt!(round.state_b.chances, *start_state_b.chances, "chances_b");
    }
    #[test]
    fn test_chances_tactics_bananas_ab() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(@sys,
            [1, 2, TacticsCard::Bananas.into()].span(),
            [1, 2, TacticsCard::Bananas.into()].span(),
            false
        );
        assert_eq!(round.final_blow, FinalBlow::Paces(PacesCard::Paces1), "round.final_blow"); // ended in pistols
        let start_state_a = progress.steps[0].state_a;
        let start_state_b = progress.steps[0].state_b;
        assert_lt!(round.state_a.chances, *start_state_a.chances, "chances_a");
        assert_lt!(round.state_b.chances, *start_state_b.chances, "chances_b");
    }

    #[test]
    fn test_chances_tactics_coin_toss_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(@sys,
            [1, 2, TacticsCard::CoinToss.into()].span(),
            [1, 2, 0].span(),
            false
        );
        assert_eq!(round.final_blow, FinalBlow::Paces(PacesCard::Paces1), "round.final_blow"); // ended in pistols
        let start_state_a = progress.steps[0].state_a;
        let start_state_b = progress.steps[0].state_b;
        _assert_not_affected_by_cards(*start_state_a, round.state_a);
        _assert_not_affected_by_cards(*start_state_b, round.state_b);
    }
    #[test]
    fn test_chances_tactics_coin_toss_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(@sys,
            [1, 2, 0].span(),
            [1, 2, TacticsCard::CoinToss.into()].span(),
            false
        );
        assert_eq!(round.final_blow, FinalBlow::Paces(PacesCard::Paces1), "round.final_blow"); // ended in pistols
        let start_state_a = progress.steps[0].state_a;
        let start_state_b = progress.steps[0].state_b;
        _assert_not_affected_by_cards(*start_state_a, round.state_a);
        _assert_not_affected_by_cards(*start_state_b, round.state_b);
    }

    #[test]
    fn test_chances_tactics_reversal_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(@sys,
            [1, 2, TacticsCard::Reversal.into()].span(),
            [1, 2, 0].span(),
            false
        );
        assert_eq!(round.final_blow, FinalBlow::Paces(PacesCard::Paces1), "round.final_blow"); // ended in pistols
        let start_state_a = progress.steps[0].state_a;
        let start_state_b = progress.steps[0].state_b;
        _assert_not_affected_by_cards(*start_state_a, round.state_a);
        _assert_not_affected_by_cards(*start_state_b, round.state_b);
    }
    #[test]
    fn test_chances_tactics_reversal_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(@sys,
            [1, 2, 0].span(),
            [1, 2, TacticsCard::Reversal.into()].span(),
            false
        );
        assert_eq!(round.final_blow, FinalBlow::Paces(PacesCard::Paces1), "round.final_blow"); // ended in pistols
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
    fn test_blades_seppuku_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(@sys,
            [1, 2, 0, BladesCard::Seppuku.into()].span(),
            [1, 2, 0, 0].span(),
            false
        );
        assert_eq!(round.final_blow, FinalBlow::Blades(BladesCard::Seppuku), "round.final_blow"); // ended in blades
        let start_state_b = progress.steps[0].state_b;
        assert_gt!(round.state_a.chances, CONST::INITIAL_CHANCE, "chances");
        assert_gt!(round.state_a.damage, CONST::INITIAL_DAMAGE, "damage");
        _assert_not_affected_by_cards(*start_state_b, round.state_b);
        assert_eq!(progress.winner, 2, "progress.winner");
        _assert_is_dead(round.state_a, "dead_a");
        _assert_is_alive(round.state_b, "alive_b");
    }
    #[test]
    fn test_blades_seppuku_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(@sys,
            [1, 2, 0, 0].span(),
            [1, 2, 0, BladesCard::Seppuku.into()].span(),
            false
        );
        assert_eq!(round.final_blow, FinalBlow::Blades(BladesCard::Seppuku), "round.final_blow"); // ended in blades
        let start_state_a = progress.steps[0].state_a;
        assert_gt!(round.state_b.chances, CONST::INITIAL_CHANCE, "chances");
        assert_gt!(round.state_b.damage, CONST::INITIAL_DAMAGE, "damage");
        _assert_not_affected_by_cards(*start_state_a, round.state_a);
        assert_eq!(progress.winner, 1, "progress.winner");
        _assert_is_alive(round.state_a, "alive_a");
        _assert_is_dead(round.state_b, "dead_b");
    }
    #[test]
    fn test_blades_seppuku_draw() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(@sys,
            [1, 2, 0, BladesCard::Seppuku.into()].span(),
            [1, 2, 0, BladesCard::Seppuku.into()].span(),
            false
        );
        assert_eq!(round.final_blow, FinalBlow::Blades(BladesCard::Seppuku), "round.final_blow"); // ended in blades
        assert_gt!(round.state_a.chances, CONST::INITIAL_CHANCE, "chances");
        assert_gt!(round.state_a.damage, CONST::INITIAL_DAMAGE, "damage");
        assert_gt!(round.state_b.chances, CONST::INITIAL_CHANCE, "chances");
        assert_gt!(round.state_b.damage, CONST::INITIAL_DAMAGE, "damage");
        assert_eq!(progress.winner, 0, "progress.winner");
        _assert_is_dead(round.state_a, "dead_a");
        _assert_is_dead(round.state_b, "dead_b");
    }
    #[test]
    fn test_blades_seppuku_other() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(@sys,
            [1, 2, 0, BladesCard::Seppuku.into()].span(),
            [1, 2, 0, BladesCard::Behead.into()].span(),
            false
        );
        assert_eq!(round.final_blow, FinalBlow::Blades(BladesCard::Seppuku), "round.final_blow"); // ended in blades
        assert_eq!(progress.winner, 2, "progress.winner");
        _assert_is_dead(round.state_a, "dead_a");
        _assert_is_alive(round.state_b, "alive_b");
    }


    //-------------------------------------------
    // Blades vs None
    //

    #[test]
    fn test_blades_pocket_pistol_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(@sys,
            [1, 2, 0, BladesCard::PocketPistol.into()].span(),
            [1, 2, 0, 0].span(),
            false
        );
        assert_eq!(round.final_blow, FinalBlow::Blades(BladesCard::PocketPistol), "round.final_blow"); // ended in blades
        let start_state_a = progress.steps[0].state_a;
        assert_lt!(round.state_b.chances, CONST::INITIAL_CHANCE, "chances");
        _assert_not_affected_by_cards(*start_state_a, round.state_a);
        assert_eq!(progress.winner, 1, "progress.winner");
        _assert_is_alive(round.state_a, "alive_a");
        _assert_is_dead(round.state_b, "dead_b");
    }
    #[test]
    fn test_blades_pocket_pistol_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(@sys,
            [1, 2, 0, 0].span(),
            [1, 2, 0, BladesCard::PocketPistol.into()].span(),
            false
        );
        assert_eq!(round.final_blow, FinalBlow::Blades(BladesCard::PocketPistol), "round.final_blow"); // ended in blades
        let start_state_b = progress.steps[0].state_b;
        assert_lt!(round.state_a.chances, CONST::INITIAL_CHANCE, "chances");
        _assert_not_affected_by_cards(*start_state_b, round.state_b);
        assert_eq!(progress.winner, 2, "progress.winner");
        _assert_is_dead(round.state_a, "dead_a");
        _assert_is_alive(round.state_b, "alive_b");
    }

    #[test]
    fn test_blades_behead_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(@sys,
            [1, 2, 0, BladesCard::Behead.into()].span(),
            [1, 2, 0, 0].span(),
            false
        );
        assert_eq!(round.final_blow, FinalBlow::Blades(BladesCard::Behead), "round.final_blow"); // ended in blades
        let start_state_b = progress.steps[0].state_b;
        assert_gt!(round.state_a.damage, CONST::INITIAL_DAMAGE, "damage");
        _assert_not_affected_by_cards(*start_state_b, round.state_b);
        assert_eq!(progress.winner, 1, "progress.winner");
        _assert_is_alive(round.state_a, "alive_a");
        _assert_is_dead(round.state_b, "dead_b");
    }
    #[test]
    fn test_blades_behead_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(@sys,
            [1, 2, 0, 0].span(),
            [1, 2, 0, BladesCard::Behead.into()].span(),
            false
        );
        assert_eq!(round.final_blow, FinalBlow::Blades(BladesCard::Behead), "round.final_blow"); // ended in blades
        let start_state_a = progress.steps[0].state_a;
        assert_gt!(round.state_b.damage, CONST::INITIAL_DAMAGE, "damage");
        _assert_not_affected_by_cards(*start_state_a, round.state_a);
        assert_eq!(progress.winner, 2, "progress.winner");
        _assert_is_dead(round.state_a, "dead_a");
        _assert_is_alive(round.state_b, "alive_b");
    }

    #[test]
    fn test_blades_grapple_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(@sys,
            [1, 2, 0, BladesCard::Grapple.into()].span(),
            [1, 2, 0, 0].span(),
            false
        );
        assert_eq!(round.final_blow, FinalBlow::Blades(BladesCard::Grapple), "round.final_blow"); // ended in blades
        let start_state_a = progress.steps[0].state_a;
        assert_lt!(round.state_b.damage, CONST::INITIAL_DAMAGE, "damage");
        _assert_not_affected_by_cards(*start_state_a, round.state_a);
        assert_eq!(progress.winner, 1, "progress.winner");
        _assert_is_alive(round.state_a, "alive_a");
        _assert_is_dead(round.state_b, "dead_b");
    }
    #[test]
    fn test_blades_grapple_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(@sys,
            [1, 2, 0, 0].span(),
            [1, 2, 0, BladesCard::Grapple.into()].span(),
            false
        );
        assert_eq!(round.final_blow, FinalBlow::Blades(BladesCard::Grapple), "round.final_blow"); // ended in blades
        let start_state_b = progress.steps[0].state_b;
        assert_lt!(round.state_a.damage, CONST::INITIAL_DAMAGE, "damage");
        _assert_not_affected_by_cards(*start_state_b, round.state_b);
        assert_eq!(progress.winner, 2, "progress.winner");
        _assert_is_dead(round.state_a, "dead_a");
        _assert_is_alive(round.state_b, "alive_b");
    }


    //-------------------------------------------
    // Same vs Same
    //

    #[test]
    fn test_blades_pocket_pistol_vs_pocket_pistol() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(@sys,
            [1, 2, 0, BladesCard::PocketPistol.into()].span(),
            [1, 2, 0, BladesCard::PocketPistol.into()].span(),
            false
        );
        assert_eq!(round.final_blow, FinalBlow::Blades(BladesCard::PocketPistol), "round.final_blow"); // ended in blades
        assert_eq!(progress.winner, 0, "progress.winner");
        _assert_is_dead(round.state_a, "dead_a");
        _assert_is_dead(round.state_b, "dead_b");
    }
    #[test]
    fn test_blades_behead_vs_behead() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(@sys,
            [1, 2, 0, BladesCard::Behead.into()].span(),
            [1, 2, 0, BladesCard::Behead.into()].span(),
            false
        );
        assert_eq!(round.final_blow, FinalBlow::Blades(BladesCard::Behead), "round.final_blow"); // ended in blades
        assert_eq!(progress.winner, 0, "progress.winner");
        _assert_is_dead(round.state_a, "dead_a");
        _assert_is_dead(round.state_b, "dead_b");
    }
    #[test]
    fn test_blades_grapple_vs_grapple() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(@sys,
            [1, 2, 0, BladesCard::Grapple.into()].span(),
            [1, 2, 0, BladesCard::Grapple.into()].span(),
            false
        );
        assert_eq!(round.final_blow, FinalBlow::Blades(BladesCard::Grapple), "round.final_blow"); // ended in blades
        assert_eq!(progress.winner, 0, "progress.winner");
        _assert_is_dead(round.state_a, "dead_a");
        _assert_is_dead(round.state_b, "dead_b");
    }


    //-------------------------------------------
    // Blades vs Blades
    //
    
    // PocketPistol beats Behead
    #[test]
    fn test_blades_pocket_pistol_vs_behead() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(@sys,
            [1, 2, 0, BladesCard::PocketPistol.into()].span(),
            [1, 2, 0, BladesCard::Behead.into()].span(),
            false
        );
        assert_eq!(round.final_blow, FinalBlow::Blades(BladesCard::PocketPistol), "round.final_blow");
        assert_eq!(progress.winner, 1, "progress.winner");
        _assert_is_alive(round.state_a, "alive_a");
        _assert_is_dead(round.state_b, "dead_b");
    }
    #[test]
    fn test_blades_behead_vs_pocket_pistol() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(@sys,
            [1, 2, 0, BladesCard::Behead.into()].span(),
            [1, 2, 0, BladesCard::PocketPistol.into()].span(),
            false
        );
        assert_eq!(round.final_blow, FinalBlow::Blades(BladesCard::PocketPistol), "round.final_blow");
        assert_eq!(progress.winner, 2, "progress.winner");
        _assert_is_dead(round.state_a, "dead_a");
        _assert_is_alive(round.state_b, "alive_b");
    }
    
    // Behead beats Grapple
    #[test]
    fn test_blades_behead_vs_grapple() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(@sys,
            [1, 2, 0, BladesCard::Behead.into()].span(),
            [1, 2, 0, BladesCard::Grapple.into()].span(),
            false
        );
        assert_eq!(round.final_blow, FinalBlow::Blades(BladesCard::Behead), "round.final_blow"); // ended in blades
        assert_eq!(progress.winner, 1, "progress.winner");
        _assert_is_alive(round.state_a, "alive_a");
        _assert_is_dead(round.state_b, "dead_b");
    }
    #[test]
    fn test_blades_grapple_vs_behead() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(@sys,
            [1, 2, 0, BladesCard::Grapple.into()].span(),
            [1, 2, 0, BladesCard::Behead.into()].span(),
            false
        );
        assert_eq!(round.final_blow, FinalBlow::Blades(BladesCard::Behead), "round.final_blow"); // ended in blades
        assert_eq!(progress.winner, 2, "progress.winner");
        _assert_is_dead(round.state_a, "dead_a");
        _assert_is_alive(round.state_b, "alive_b");
    }

    // Grapple beats PocketPistol
    #[test]
    fn test_blades_grapple_vs_pocket_pistol() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(@sys,
            [1, 2, 0, BladesCard::Grapple.into()].span(),
            [1, 2, 0, BladesCard::PocketPistol.into()].span(),
            false
        );
        assert_eq!(round.final_blow, FinalBlow::Blades(BladesCard::Grapple), "round.final_blow"); // ended in blades
        assert_eq!(progress.winner, 1, "progress.winner");
        _assert_is_alive(round.state_a, "alive_a");
        _assert_is_dead(round.state_b, "dead_b");
    }
    #[test]
    fn test_blades_pocket_pistol_vs_grapple() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, progress) = execute_game_loop(@sys,
            [1, 2, 0, BladesCard::PocketPistol.into()].span(),
            [1, 2, 0, BladesCard::Grapple.into()].span(),
            false
        );
        assert_eq!(round.final_blow, FinalBlow::Blades(BladesCard::Grapple), "round.final_blow"); // ended in blades
        assert_eq!(progress.winner, 2, "progress.winner");
        _assert_is_dead(round.state_a, "dead_a");
        _assert_is_alive(round.state_b, "alive_b");
    }

}
