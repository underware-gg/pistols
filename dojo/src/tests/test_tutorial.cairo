#[cfg(test)]
mod tests {
    use pistols::models::{
        challenge::{Challenge, ChallengeTrait, ChallengeValue, RoundValue, DuelType},
        duelist::{DuelistValue},
    };
    use pistols::types::{
        duelist_profile::{DuelistProfile, DuelistProfileTrait, ProfileManagerTrait, CharacterKey},
        challenge_state::{ChallengeState},
        duel_progress::{DuelProgress},
        round_state::{RoundState},
        premise::{Premise},
        cards::hand::{
            PacesCard,
            TacticsCard,
            BladesCard,
            DeckType,
            FinalBlow, FinalBlowTrait,
        },
    };
    use pistols::libs::{
        tut::{TutorialLevel, TutorialLevelTrait},
        moves_hash::{MovesHashTrait},
    };
    use pistols::utils::math::{MathU8};

    use pistols::tests::tester::{tester,
        tester::{
            StoreTrait,
            TestSystems, FLAGS,
            IGameDispatcherTrait,
            ITutorialDispatcherTrait,
            ID, ZERO, OWNER,
        }
    };
    use pistols::tests::prefabs::prefabs::{
        SALT_A, SALT_B,
    };



    #[test]
    fn test_tutorial_profiles() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::TUTORIAL);
        // Characters created
        let profiles: Span<DuelistProfile> = ProfileManagerTrait::_get_all_profiles_by_type(DuelistProfile::Character(0_u8.into()));
        let mut i: usize = 0;
        while (i < profiles.len()) {
            let profile: DuelistProfile = *profiles.at(i);
            let duelist: DuelistValue = sys.store.get_duelist_value(profile.to_duelist_id());
            assert!(duelist.duelist_profile == profile, "Character profile not created: {}", profile.descriptor().name);
            i += 1;
        };
        // Bots created
        let profiles: Span<DuelistProfile> = ProfileManagerTrait::_get_all_profiles_by_type(DuelistProfile::Bot(0_u8.into()));
        let mut i: usize = 0;
        while (i < profiles.len()) {
            let profile: DuelistProfile = *profiles.at(i);
            let duelist: DuelistValue = sys.store.get_duelist_value(profile.to_duelist_id());
            assert!(duelist.duelist_profile == profile, "Bot profile not created: {}", profile.descriptor().name);
            i += 1;
        };
    }

    fn _test_tutorial_create(tutorial_id: u128, duelist_profile: DuelistProfile) {
        let mut sys: TestSystems = tester::setup_world(FLAGS::TUTORIAL);
        tester::impersonate(OWNER());
        // duel_id
        let level: TutorialLevel = tutorial_id.into();
        let tut_duel_id: u128 = sys.tut.calc_duel_id(ID(OWNER()), tutorial_id);
        let tutorial_id_from_duel_id: u128 = (tut_duel_id & 0xff).into();
        assert_eq!(tutorial_id_from_duel_id, tutorial_id, "tutorial_id_from_duel_id");
        assert_eq!(tut_duel_id, level.make_duel_id(ID(OWNER())), "level.make_duel_id");
        // create tutorial
        let duel_id: u128 = tester::execute_create_tutorial(@sys, OWNER(), tutorial_id);
        assert_eq!(duel_id, tut_duel_id, "tut_duel_id");
        let challenge: Challenge = sys.store.get_challenge(duel_id);
        let round: RoundValue = sys.store.get_round_value(duel_id);
        assert_eq!(challenge.state, ChallengeState::InProgress, "challenge.state");
        assert!(challenge.is_tutorial(), "challenge.is_tutorial()");
        assert_eq!(challenge.duel_type, DuelType::Tutorial, "challenge.duel_type");
        assert_eq!(challenge.premise, Premise::Lesson, "challenge.premise");
        assert_eq!(challenge.address_a, OWNER(), "challenge.address_a");
        assert_eq!(challenge.address_b, OWNER(), "challenge.address_b");
        assert_eq!(challenge.duelist_id_a, duelist_profile.to_duelist_id(), "challenge.duelist_id_a");
        assert_eq!(challenge.duelist_id_b, DuelistProfile::Character(CharacterKey::Player).to_duelist_id(), "challenge.duelist_id_b");
        assert_eq!(round.state, RoundState::Commit, "round.state");
    }

    #[test]
    fn test_tutorial_create_level_1() {
        _test_tutorial_create(1, DuelistProfile::Character(CharacterKey::Drunkard));
    }

    #[test]
    fn test_tutorial_create_level_2() {
        _test_tutorial_create(2, DuelistProfile::Character(CharacterKey::Bartender));
    }

    #[test]
    #[should_panic(expected:('TUTORIAL: Invalid level', 'ENTRYPOINT_FAILED'))]
    fn test_tutorial_create_level_3_panic() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::TUTORIAL);
        tester::execute_create_tutorial(@sys, OWNER(), 3);
    }

    #[test]
    #[should_panic(expected:('TUTORIAL: Invalid player', 'ENTRYPOINT_FAILED'))]
    fn test_tutorial_create_invalid_player() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::TUTORIAL);
        tester::execute_create_tutorial(@sys, ZERO(), 1);
    }

    
    //-------------------------------
    // Levels
    //

    fn _test_tutorial_level_1(fire: PacesCard, dodge: PacesCard) {
        let mut sys: TestSystems = tester::setup_world(FLAGS::TUTORIAL);
        let tutorial_id: u128 = 1;
        let duel_id: u128 = tester::execute_create_tutorial(@sys, OWNER(), tutorial_id);
        // check deck
        let challenge: Challenge = sys.store.get_challenge(duel_id);
        assert_eq!(challenge.get_deck_type(), DeckType::PacesOnly, "challenge.deck_type");
        // commit
        let moves: Span<u8> = [fire.into(), dodge.into()].span();
        let hashed: u128 = MovesHashTrait::hash(SALT_A, moves);
        tester::execute_commit_moves_tutorial(@sys, OWNER(), challenge.duelist_id_b, duel_id, hashed);
        let round: RoundValue = sys.store.get_round_value(duel_id);
        assert_eq!(round.state, RoundState::Reveal, "round.state");
        assert!(round.moves_a.hashed > 0, "round.moves_a.hashed");
        assert_eq!(round.moves_b.hashed, hashed, "round.moves_b.hashed");
        // reveal -- different salt as it does not matter
        tester::execute_reveal_moves_tutorial(@sys, OWNER(), challenge.duelist_id_b, duel_id, SALT_B, moves);
        let challenge: ChallengeValue = sys.store.get_challenge_value(duel_id);
        let round: RoundValue = sys.store.get_round_value(duel_id);
        assert_eq!(challenge.state, ChallengeState::Resolved, "challenge.state");
        assert_eq!(challenge.winner, 2, "challenge.winner");
        assert_eq!(round.state, RoundState::Finished, "round.state");
        assert_eq!(round.final_blow, FinalBlow::Paces(fire), "round.final_blow");
        assert!(round.final_blow.ended_in_paces(), "round.ended_in_paces");
        assert!(!round.final_blow.ended_in_blades(), "round.ended_in_blades");
        // progress
        let progress: DuelProgress = sys.tut.get_duel_progress(duel_id);
        let final_pace: u8 = fire.into();
        assert_eq!(progress.winner, challenge.winner, "winner");
        assert_ge!(progress.steps.len(), final_pace.into() + 1, "steps.len()");
        // NPC hand
        assert_ne!(progress.hand_a.card_fire, fire, "hand_a.card_fire");
        assert_ne!(progress.hand_a.card_dodge, dodge, "hand_a.card_dodge");
        assert_eq!(progress.hand_a.card_tactics, TacticsCard::None, "hand_a.card_tactics");
        assert_eq!(progress.hand_a.card_blades, BladesCard::None, "hand_a.card_blades");
        // player hand
        assert_eq!(progress.hand_b.card_fire, fire, "hand_b.card_fire");
        assert_eq!(progress.hand_b.card_dodge, dodge, "hand_b.card_dodge");
        assert_eq!(progress.hand_b.card_tactics, TacticsCard::None, "hand_b.card_tactics");
        assert_eq!(progress.hand_b.card_blades, BladesCard::None, "hand_b.card_blades");
    }

    #[test]
    fn test_tutorial_level_1_pace_1() {
        _test_tutorial_level_1(PacesCard::Paces1, PacesCard::Paces2);
    }
    #[test]
    fn test_tutorial_level_1_pace_2() {
        _test_tutorial_level_1(PacesCard::Paces2, PacesCard::Paces3);
    }
    #[test]
    fn test_tutorial_level_1_pace_3() {
        _test_tutorial_level_1(PacesCard::Paces3, PacesCard::Paces4);
    }
    #[test]
    fn test_tutorial_level_1_pace_4() {
        _test_tutorial_level_1(PacesCard::Paces4, PacesCard::Paces3);
    }
    #[test]
    fn test_tutorial_level_1_pace_5() {
        _test_tutorial_level_1(PacesCard::Paces5, PacesCard::Paces6);
    }
    #[test]
    fn test_tutorial_level_1_pace_6() {
        _test_tutorial_level_1(PacesCard::Paces6, PacesCard::Paces7);
    }
    #[test]
    fn test_tutorial_level_1_pace_7() {
        _test_tutorial_level_1(PacesCard::Paces7, PacesCard::Paces8);
    }
    #[test]
    fn test_tutorial_level_1_pace_8() {
        _test_tutorial_level_1(PacesCard::Paces8, PacesCard::Paces9);
    }
    #[test]
    fn test_tutorial_level_1_pace_9() {
        _test_tutorial_level_1(PacesCard::Paces9, PacesCard::Paces10);
    }
    #[test]
    fn test_tutorial_level_1_pace_10() {
        _test_tutorial_level_1(PacesCard::Paces10, PacesCard::Paces9);
    }




    //-------------------------------
    // Levels
    //

    fn _test_tutorial_level_2(sys: @TestSystems, fire: PacesCard, dodge: PacesCard, tactics: TacticsCard, blades: BladesCard) -> DuelProgress {
        let tutorial_id: u128 = 2;
        let duel_id: u128 = tester::execute_create_tutorial(sys, OWNER(), tutorial_id);
        // check deck
        let challenge: Challenge = (*sys.store).get_challenge(duel_id);
        assert_eq!(challenge.get_deck_type(), DeckType::Classic, "challenge.deck_type");
        // commit
        let moves: Span<u8> = [fire.into(), dodge.into(), tactics.into(), blades.into()].span();
        let hashed: u128 = MovesHashTrait::hash(SALT_A, moves);
        tester::execute_commit_moves_tutorial(sys, OWNER(), challenge.duelist_id_b, duel_id, hashed);
        let round: RoundValue = (*sys.store).get_round_value(duel_id);
        assert_eq!(round.state, RoundState::Reveal, "round.state");
        assert!(round.moves_a.hashed > 0, "round.moves_a.hashed");
        assert_eq!(round.moves_b.hashed, hashed, "round.moves_b.hashed");
        // reveal -- different salt as it does not matter
        tester::execute_reveal_moves_tutorial(sys, OWNER(), challenge.duelist_id_b, duel_id, SALT_B, moves);
        let challenge: ChallengeValue = (*sys.store).get_challenge_value(duel_id);
        let round: RoundValue = (*sys.store).get_round_value(duel_id);
        assert_eq!(challenge.state, ChallengeState::Resolved, "challenge.state");
        assert_eq!(challenge.winner, 1, "challenge.winner");
        assert_eq!(round.state, RoundState::Finished, "round.state");
        assert!(round.final_blow.ended_in_paces() == false, "round.ended_in_paces");
        assert!(round.final_blow.ended_in_blades() == true, "round.ended_in_blades");
        // progress
        let progress: DuelProgress = (*sys.tut).get_duel_progress(duel_id);
        let final_pace: u8 = progress.hand_a.card_fire.into();
        assert_eq!(progress.winner, challenge.winner, "winner");
        assert_ge!(progress.steps.len(), final_pace.into() + 1, "steps.len()");
        // NPC hand
        assert_ne!(progress.hand_a.card_fire, fire, "hand_a.card_fire");
        assert_ne!(progress.hand_a.card_dodge, dodge, "hand_a.card_dodge");
        assert_eq!(progress.hand_a.card_tactics, TacticsCard::ThickCoat, "hand_a.card_tactics");
        assert_ne!(progress.hand_a.card_blades, blades, "hand_a.card_blades");
        // player hand
        assert_eq!(progress.hand_b.card_fire, fire, "hand_b.card_fire");
        assert_eq!(progress.hand_b.card_dodge, dodge, "hand_b.card_dodge");
        assert_eq!(progress.hand_b.card_tactics, tactics, "hand_b.card_tactics");
        assert_eq!(progress.hand_b.card_blades, blades, "hand_b.card_blades");
        (progress)
    }

    fn _test_tutorial_level_2_game(sys: @TestSystems, fire: PacesCard, dodge: PacesCard, tactics: TacticsCard, blades: BladesCard) -> DuelProgress {
        let tutorial_id: u128 = 2;
        let duel_id: u128 = tester::execute_create_tutorial(sys, OWNER(), tutorial_id);
        let challenge: Challenge = (*sys.store).get_challenge(duel_id);
        let moves: Span<u8> = [fire.into(), dodge.into(), tactics.into(), blades.into()].span();
        let hashed: u128 = MovesHashTrait::hash(SALT_A, moves);
        tester::execute_commit_moves_ID(sys, OWNER(), challenge.duelist_id_b, duel_id, hashed);
        tester::execute_reveal_moves_ID(sys, OWNER(), challenge.duelist_id_b, duel_id, SALT_B, moves);
        // check challenge
        let challenge: ChallengeValue = (*sys.store).get_challenge_value(duel_id);
        let round: RoundValue = (*sys.store).get_round_value(duel_id);
        assert_eq!(challenge.state, ChallengeState::Resolved, "challenge.state");
        assert_eq!(challenge.winner, 1, "challenge.winner");
        assert_eq!(round.state, RoundState::Finished, "round.state");
        assert!(round.final_blow.ended_in_paces() == false, "round.ended_in_paces");
        assert!(round.final_blow.ended_in_blades() == true, "round.ended_in_blades");
        // progress
        let progress: DuelProgress = (*sys.game).get_duel_progress(duel_id);
        let final_pace: u8 = progress.hand_a.card_fire.into();
        assert_eq!(progress.winner, challenge.winner, "winner");
        assert_ge!(progress.steps.len(), final_pace.into() + 1, "steps.len()");
        // NPC hand
        assert_ne!(progress.hand_a.card_fire, fire, "hand_a.card_fire");
        assert_ne!(progress.hand_a.card_dodge, dodge, "hand_a.card_dodge");
        assert_eq!(progress.hand_a.card_tactics, TacticsCard::ThickCoat, "hand_a.card_tactics");
        assert_ne!(progress.hand_a.card_blades, blades, "hand_a.card_blades");
        // player hand
        assert_eq!(progress.hand_b.card_fire, fire, "hand_b.card_fire");
        assert_eq!(progress.hand_b.card_dodge, dodge, "hand_b.card_dodge");
        assert_eq!(progress.hand_b.card_tactics, tactics, "hand_b.card_tactics");
        assert_eq!(progress.hand_b.card_blades, blades, "hand_b.card_blades");
        (progress)
    }

    #[test]
    fn test_tutorial_level_2_pace_1() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::TUTORIAL);
        _test_tutorial_level_2(@sys, PacesCard::Paces1, PacesCard::Paces2, TacticsCard::ThickCoat, BladesCard::PocketPistol);
    }
    #[test]
    fn test_tutorial_level_2_pace_2() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::TUTORIAL);
        _test_tutorial_level_2(@sys, PacesCard::Paces2, PacesCard::Paces1, TacticsCard::ThickCoat, BladesCard::Behead);
    }
    #[test]
    fn test_tutorial_level_2_pace_3() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::TUTORIAL);
        _test_tutorial_level_2(@sys, PacesCard::Paces3, PacesCard::Paces2, TacticsCard::ThickCoat, BladesCard::Grapple);
    }
    #[test]
    fn test_tutorial_level_2_pace_4() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::TUTORIAL);
        _test_tutorial_level_2(@sys, PacesCard::Paces4, PacesCard::Paces3, TacticsCard::ThickCoat, BladesCard::Seppuku);
    }
    #[test]
    fn test_tutorial_level_2_pace_5() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::TUTORIAL);
        _test_tutorial_level_2(@sys, PacesCard::Paces5, PacesCard::Paces4, TacticsCard::ThickCoat, BladesCard::PocketPistol);
    }
    #[test]
    fn test_tutorial_level_2_pace_6() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::TUTORIAL);
        _test_tutorial_level_2(@sys, PacesCard::Paces6, PacesCard::Paces5, TacticsCard::ThickCoat, BladesCard::Behead);
    }
    #[test]
    fn test_tutorial_level_2_pace_7() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::TUTORIAL);
        _test_tutorial_level_2(@sys, PacesCard::Paces7, PacesCard::Paces6, TacticsCard::ThickCoat, BladesCard::Grapple);
    }
    #[test]
    fn test_tutorial_level_2_pace_8() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::TUTORIAL);
        _test_tutorial_level_2(@sys, PacesCard::Paces8, PacesCard::Paces7, TacticsCard::ThickCoat, BladesCard::Seppuku);
    }
    #[test]
    fn test_tutorial_level_2_pace_9() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::TUTORIAL);
        _test_tutorial_level_2(@sys, PacesCard::Paces9, PacesCard::Paces8, TacticsCard::ThickCoat, BladesCard::PocketPistol);
    }
    #[test]
    fn test_tutorial_level_2_pace_10() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::TUTORIAL);
        _test_tutorial_level_2(@sys, PacesCard::Paces10, PacesCard::Paces9, TacticsCard::ThickCoat, BladesCard::Behead);
    }


    //-------------------------------
    // game contract routing
    //

    #[test]
    fn test_tutorial_level_2_pace_10_game() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::TUTORIAL);
        let progress_tut: DuelProgress = _test_tutorial_level_2(@sys, PacesCard::Paces10, PacesCard::Paces9, TacticsCard::ThickCoat, BladesCard::Behead);
        let progress_game: DuelProgress = _test_tutorial_level_2_game(@sys, PacesCard::Paces10, PacesCard::Paces9, TacticsCard::ThickCoat, BladesCard::Behead);
        // compare progress
        assert_eq!(progress_tut.winner, progress_game.winner, "winner");
        assert_eq!(progress_tut.steps.len(), progress_game.steps.len(), "steps.len()");
        assert_eq!(progress_tut.hand_a.card_fire, progress_game.hand_a.card_fire, "hand_a.card_fire");
        assert_eq!(progress_tut.hand_a.card_dodge, progress_game.hand_a.card_dodge, "hand_a.card_dodge");
        assert_eq!(progress_tut.hand_a.card_tactics, progress_game.hand_a.card_tactics, "hand_a.card_tactics");
        assert_eq!(progress_tut.hand_a.card_blades, progress_game.hand_a.card_blades, "hand_a.card_blades");
        assert_eq!(progress_tut.hand_b.card_fire, progress_game.hand_b.card_fire, "hand_b.card_fire");
        assert_eq!(progress_tut.hand_b.card_dodge, progress_game.hand_b.card_dodge, "hand_b.card_dodge");
        assert_eq!(progress_tut.hand_b.card_tactics, progress_game.hand_b.card_tactics, "hand_b.card_tactics");
        assert_eq!(progress_tut.hand_b.card_blades, progress_game.hand_b.card_blades, "hand_b.card_blades");
    }


    //-------------------------------
    // Fails
    //

    // #[test]
    // #[should_panic(expected:('TUTORIAL: Not your duel', 'ENTRYPOINT_FAILED'))]
    // fn test_tutorial_commit_invalid_duel() {
    //     let mut sys: TestSystems = tester::setup_world(FLAGS::TUTORIAL);
    //     tester::execute_create_tutorial(@sys, OWNER(), tutorial_id);
    //     tester::execute_commit_moves_tutorial(@sys, OWNER(), challenge.duelist_id_b, duel_id, 0x1234);
    // }

    // #[test]
    // #[should_panic(expected:('TUTORIAL: Not your duel', 'ENTRYPOINT_FAILED'))]
    // fn test_tutorial_commit_invalid_player() {
    //     let mut sys: TestSystems = tester::setup_world(FLAGS::TUTORIAL);
    //     tester::execute_create_tutorial(@sys, OWNER(), duel_id);
    //     tester::execute_commit_moves_tutorial(@sys, OWNER(), challenge.duelist_id_b, duel_id, 0x1234);
    // }

}
