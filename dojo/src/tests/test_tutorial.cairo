#[cfg(test)]
mod tests {
    use debug::PrintTrait;
    use core::traits::{TryInto, Into};
    use starknet::{ContractAddress};

    use dojo::world::{WorldStorage};

    use pistols::models::challenge::{Challenge, ChallengeTrait, ChallengeValue, ChallengeFameBalanceValue, Round, RoundValue};
    use pistols::models::duelist::{Duelist, DuelistValue, Archetype};
    use pistols::models::table::{TableConfig, TABLES};
    use pistols::types::profile_type::{ProfileType, ProfileTypeTrait, ProfileManagerTrait, CharacterProfile};
    use pistols::types::cards::hand::{PacesCard, PacesCardTrait, FinalBlow, DeckType, DeckTypeTrait};
    use pistols::types::challenge_state::{ChallengeState, ChallengeStateTrait};
    use pistols::types::duel_progress::{DuelProgress, DuelStep};
    use pistols::types::round_state::{RoundState, RoundStateTrait};
    use pistols::types::duel_progress::{DuelistDrawnCard};
    use pistols::types::premise::{Premise, PremiseTrait};
    use pistols::libs::tut::{TutorialLevel, TutorialTrait};
    use pistols::libs::game_loop::{make_moves_hash};
    use pistols::types::constants::{CONST, HONOUR};
    use pistols::utils::arrays::{SpanUtilsTrait};
    use pistols::utils::math::{MathU8};

    use pistols::systems::tokens::lords_mock::{lords_mock, ILordsMockDispatcher, ILordsMockDispatcherTrait};
    use pistols::tests::tester::{tester,
        tester::{
            TestSystems,
            IGameDispatcher, IGameDispatcherTrait,
            IDuelTokenDispatcher, IDuelTokenDispatcherTrait,
            IDuelistTokenDispatcher, IDuelistTokenDispatcherTrait,
            IFameCoinDispatcher, IFameCoinDispatcherTrait,
            FLAGS, ID, ZERO,
            OWNER, OTHER, BUMMER, TREASURY, FAKE_OWNER_OF_1,
            _assert_is_alive, _assert_is_dead,
        }
    };
    use pistols::tests::prefabs::{prefabs,
        prefabs::{
            SALT_A, SALT_B, TABLE_ID, MESSAGE, PRIZE_VALUE,
            SaltsValues, SaltsValuesTrait,
            PlayerMoves, PlayerMovesTrait,
        },
    };
    use pistols::tests::mock_rng::{IRngDispatcher, IRngDispatcherTrait};



    #[test]
    fn test_tutorial_profiles() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::TUTORIAL);
        // Characters created
        let profiles: Span<ProfileType> = ProfileManagerTrait::get_all_profiles_by_type(ProfileType::Character(0_u8.into()));
        let mut i: usize = 0;
        while (i < profiles.len()) {
            let profile: ProfileType = *profiles.at(i);
            let duelist: DuelistValue = tester::get_DuelistValue(sys.world, profile.duelist_id());
            assert!(duelist.profile_type == profile, "Character profile not created: {}", profile.description().name);
            i += 1;
        };
        // Bots created
        let profiles: Span<ProfileType> = ProfileManagerTrait::get_all_profiles_by_type(ProfileType::Bot(0_u8.into()));
        let mut i: usize = 0;
        while (i < profiles.len()) {
            let profile: ProfileType = *profiles.at(i);
            let duelist: DuelistValue = tester::get_DuelistValue(sys.world, profile.duelist_id());
            assert!(duelist.profile_type == profile, "Bot profile not created: {}", profile.description().name);
            i += 1;
        };
    }

    fn _test_tutorial_create(tutorial_id: u128, profile: ProfileType) {
        let mut sys: TestSystems = tester::setup_world(FLAGS::TUTORIAL);
        let duel_id: u128 = tester::execute_create_tutorial(@sys.tut, OWNER(), tutorial_id);
        assert!(duel_id == TutorialTrait::make_duel_id(OWNER(), tutorial_id), "duel_id");
        let challenge: ChallengeValue = tester::get_ChallengeValue(sys.world, duel_id);
        let round: RoundValue = tester::get_RoundValue(sys.world, duel_id);
        assert!(challenge.state == ChallengeState::InProgress, "challenge.state");
        assert!(challenge.table_id == TABLES::TUTORIAL, "challenge.table_id");
        assert!(challenge.premise == Premise::Tutorial, "challenge.premise");
        assert!(challenge.address_a == OWNER(), "challenge.address_a");
        assert!(challenge.address_b == OWNER(), "challenge.address_b");
        assert!(challenge.duelist_id_a == profile.duelist_id(), "challenge.duelist_id_a");
        assert!(challenge.duelist_id_b == ID(OWNER()), "challenge.duelist_id_b");
        assert!(round.state == RoundState::Commit, "round.state");
    }

    #[test]
    fn test_tutorial_create_level_1() {
        _test_tutorial_create(1, ProfileType::Character(CharacterProfile::Drunken));
    }

    #[test]
    fn test_tutorial_create_level_2() {
        _test_tutorial_create(2, ProfileType::Character(CharacterProfile::Bartender));
    }

    #[test]
    #[should_panic(expected:('TUTORIAL: Invalid level', 'ENTRYPOINT_FAILED'))]
    fn test_tutorial_create_level_3_NO() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::TUTORIAL);
        tester::execute_create_tutorial(@sys.tut, OWNER(), 3);
    }

    #[test]
    #[should_panic(expected:('TUTORIAL: Invalid player', 'ENTRYPOINT_FAILED'))]
    fn test_tutorial_create_invalid_player() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::TUTORIAL);
        tester::execute_create_tutorial(@sys.tut, ZERO(), 1);
    }

    
    //-------------------------------
    // Levels
    //

    fn _test_tutorial_level_1(pace: PacesCard, dodge: PacesCard) {
        let mut sys: TestSystems = tester::setup_world(FLAGS::TUTORIAL);
        let tutorial_id: u128 = 1;
        let duel_id: u128 = tester::execute_create_tutorial(@sys.tut, OWNER(), tutorial_id);
        // check deck
        let challenge: Challenge = tester::get_Challenge(sys.world, duel_id);
        assert!(challenge.get_deck_type() == DeckType::PacesOnly, "challenge.deck_type");
        // // commit
        // let moves: Span<u8> = [pace.into(), dodge.into()].span();
        // let hashed: u128 = make_moves_hash(SALT_A, moves);
        // tester::execute_commit_moves_tutorial(@sys.tut, OWNER(), tutorial_id, hashed);
        // let round: RoundValue = tester::get_RoundValue(sys.world, duel_id);
        // assert!(round.state == RoundState::Reveal, "round.state");
        // assert!(round.moves_a.hashed > 0, "round.moves_a.hashed");
        // assert!(round.moves_b.hashed == hashed, "round.moves_b.hashed");
        // // reveal
        // tester::execute_reveal_moves_tutorial(@sys.tut, OWNER(), tutorial_id, SALT_A, moves);
        // let challenge: ChallengeValue = tester::get_ChallengeValue(sys.world, duel_id);
        // assert!(challenge.state == ChallengeState::Resolved, "challenge.state");
        // assert!(challenge.winner == 2, "challenge.winner");
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
        _test_tutorial_level_1(PacesCard::Paces4, PacesCard::Paces5);
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

    fn _test_tutorial_level_2(pace: PacesCard, dodge: PacesCard) {
        let mut sys: TestSystems = tester::setup_world(FLAGS::TUTORIAL);
        let tutorial_id: u128 = 2;
        let duel_id: u128 = tester::execute_create_tutorial(@sys.tut, OWNER(), tutorial_id);
        // check deck
        let challenge: Challenge = tester::get_Challenge(sys.world, duel_id);
        assert!(challenge.get_deck_type() == DeckType::Classic, "challenge.deck_type");
        //
        // TODO....
        //
    }

    #[test]
    fn test_tutorial_level_2_pace_1() {
        _test_tutorial_level_2(PacesCard::Paces1, PacesCard::Paces2);
    }
    #[test]
    fn test_tutorial_level_2_pace_2() {
        _test_tutorial_level_2(PacesCard::Paces2, PacesCard::Paces3);
    }
    #[test]
    fn test_tutorial_level_2_pace_3() {
        _test_tutorial_level_2(PacesCard::Paces3, PacesCard::Paces4);
    }
    #[test]
    fn test_tutorial_level_2_pace_4() {
        _test_tutorial_level_2(PacesCard::Paces4, PacesCard::Paces5);
    }
    #[test]
    fn test_tutorial_level_2_pace_5() {
        _test_tutorial_level_2(PacesCard::Paces5, PacesCard::Paces6);
    }
    #[test]
    fn test_tutorial_level_2_pace_6() {
        _test_tutorial_level_2(PacesCard::Paces6, PacesCard::Paces7);
    }
    #[test]
    fn test_tutorial_level_2_pace_7() {
        _test_tutorial_level_2(PacesCard::Paces7, PacesCard::Paces8);
    }
    #[test]
    fn test_tutorial_level_2_pace_8() {
        _test_tutorial_level_2(PacesCard::Paces8, PacesCard::Paces9);
    }
    #[test]
    fn test_tutorial_level_2_pace_9() {
        _test_tutorial_level_2(PacesCard::Paces9, PacesCard::Paces10);
    }
    #[test]
    fn test_tutorial_level_2_pace_10() {
        _test_tutorial_level_2(PacesCard::Paces10, PacesCard::Paces9);
    }


    //-------------------------------
    // Fails
    //

    // #[test]
    // #[should_panic(expected:('TUTORIAL: Not your duel', 'ENTRYPOINT_FAILED'))]
    // fn test_tutorial_commit_invalid_duel() {
    //     let mut sys: TestSystems = tester::setup_world(FLAGS::TUTORIAL);
    //     tester::execute_create_tutorial(@sys.tut, OWNER(), tutorial_id);
    //     tester::execute_commit_moves_tutorial(@sys.tut, OTHER(), tutorial_id, 0x1234);
    // }

    // #[test]
    // #[should_panic(expected:('TUTORIAL: Not your duel', 'ENTRYPOINT_FAILED'))]
    // fn test_tutorial_commit_invalid_player() {
    //     let mut sys: TestSystems = tester::setup_world(FLAGS::TUTORIAL);
    //     tester::execute_create_tutorial(@sys.tut, OWNER(), tutorial_id);
    //     tester::execute_commit_moves_tutorial(@sys.tut, OTHER(), tutorial_id, 0x1234);
    // }

}
