#[cfg(test)]
mod tests {
    use starknet::{ContractAddress};
    use pistols::models::{
        challenge::{ChallengeValue, DuelType},
        season::{SeasonConfig, SeasonConfigTrait, SeasonPhase},
        config::{Config},
    };
    use pistols::types::{
        challenge_state::{ChallengeState},
        rules::{Rules},
        timestamp::{TIMESTAMP},
    };
    use pistols::tests::tester::{tester,
        tester::{
            StoreTrait,
            IBankDispatcherTrait,
            IRngMockDispatcherTrait,
            TestSystems, FLAGS,
            ID, OWNER, OTHER, BUMMER, JOKER, SEASON_ID_1, SEASON_ID_2, MESSAGE,
            Trophy,
        }
    };
    use pistols::tests::prefabs::{prefabs};

    #[test]
    fn test_season_initializer() {
        let mut sys: TestSystems = tester::setup_world(FLAGS:: ADMIN | FLAGS::GAME);
        let config: Config = sys.store.get_config();
        assert_eq!(config.current_season_id, SEASON_ID_1, "config.current_season_id");
        //  season was created
        let season: SeasonConfig = sys.store.get_current_season();
        let timestamp: u64 = tester::get_block_timestamp();
        assert_eq!(season.season_id, SEASON_ID_1, "season_id");
        assert_ne!(season.period.start, 0, "period.start != 0");
        assert_lt!(season.period.start, timestamp, "period.start");
        assert_gt!(season.period.end, season.period.start, "period.end");
        assert_eq!(season.phase, SeasonPhase::InProgress, "phase");
    }

    #[test]
    fn test_collect_season() {
        let mut sys: TestSystems = tester::setup_world(FLAGS:: ADMIN | FLAGS::GAME | FLAGS::MATCHMAKER);
        let season_1: SeasonConfig = sys.store.get_current_season();
        assert_eq!(season_1.season_id, 1, "season_id");
        assert_eq!(season_1.phase, SeasonPhase::InProgress, "phase");
        // create a challenge in season 1
        let duel_id: u128 = tester::execute_create_duel(@sys, OWNER(), OTHER(), MESSAGE(), DuelType::Seasonal, 0, 1);
        // let challenge: ChallengeValue = sys.store.get_challenge_value(duel_id);
        tester::execute_reply_duel(@sys, OWNER(), ID(OWNER()), duel_id, false);
        //  time travel
        assert!(!season_1.can_collect(), "!season_1.can_collect");
        assert!(!sys.bank.can_collect_season(), "!sys.bank.can_collect_season");
        tester::set_block_timestamp(season_1.period.end);
        assert!(season_1.can_collect(), "season_1.can_collect");
        assert!(sys.bank.can_collect_season(), "sys.bank.can_collect_season");
        // collect
        let new_season_id: u32 = tester::execute_collect_season(@sys, OWNER());
        assert_ne!(new_season_id, 0, "new_season_id != 0");
        assert_ne!(new_season_id, season_1.season_id, "new_season_id");
        // past season is ended
        let season_1_ended: SeasonConfig = sys.store.get_season_config(SEASON_ID_1);
        assert_eq!(season_1_ended.phase, SeasonPhase::Ended, "season_1_ended.phase_ENDED");
        // get new season
        let season_2: SeasonConfig = sys.store.get_current_season();
        assert_ne!(season_2.season_id, season_1.season_id, "season_2.season_id != season_1.season_id");
        assert_eq!(season_2.season_id, new_season_id, "season_2.season_id == new_season_id");
        assert_eq!(season_2.season_id, SEASON_ID_2, "season_2.season_id == SEASON_ID_2");
        assert_eq!(season_2.phase, SeasonPhase::InProgress, "season_2.phase");
        assert!(!season_2.can_collect(), "!season_2.can_collect");
        assert!(!sys.bank.can_collect_season(), "!sys.bank.can_collect_season_NEW");
        // get new season
        let new_season: SeasonConfig = sys.store.get_season_config( new_season_id);
        assert_eq!(new_season.rules, Rules::Season, "new_season.rules");
        assert_eq!(new_season.season_id, season_2.season_id, "new_season.season_id");
        // create a challenge in season 2
        let duel_id: u128 = tester::execute_create_duel(@sys, OWNER(), OTHER(), MESSAGE(), DuelType::Seasonal, 0, 1);
        // let challenge: ChallengeValue = sys.store.get_challenge_value(duel_id);
        // assert_eq!(challenge.season_id, season_2.season_id, "challenge.season_id_2");
        tester::execute_reply_duel(@sys, OWNER(), ID(OWNER()), duel_id, false);
    }

    #[test]
    fn test_collect_season_pending_challenge() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::MOCK_RNG | FLAGS::MATCHMAKER);
        let season_1: SeasonConfig = sys.store.get_current_season();
        tester::set_block_timestamp(season_1.period.end - TIMESTAMP::ONE_HOUR);
        // create a challenge in season 1
        let duel_id: u128 = tester::execute_create_duel(@sys, OWNER(), OTHER(), MESSAGE(), DuelType::Seasonal, 0, 1);
        tester::execute_reply_duel(@sys, OTHER(), ID(OTHER()), duel_id, true);
        let challenge: ChallengeValue = sys.store.get_challenge_value(duel_id);
        assert_eq!(challenge.season_id, 0, "challenge.season_id_1");
        assert_eq!(challenge.state, ChallengeState::InProgress, "ChallengeState::InProgress");
        // collect season 1
        tester::set_block_timestamp(season_1.period.end);
        tester::execute_collect_season(@sys, OWNER());
        // continue challenge
        let (mocked, moves_a, moves_b) = prefabs::get_moves_dual_crit();
        let (challenge, _) = prefabs::commit_reveal_get(@sys, duel_id, OWNER(), OTHER(), mocked, moves_a, moves_b);
        assert_eq!(challenge.state, ChallengeState::Draw, "ChallengeState::Draw");
        // settled on season 2
        let season_2: SeasonConfig = sys.store.get_current_season();
        assert_eq!(challenge.season_id, season_2.season_id, "challenge.season_id_2");
    }

    #[test]
    fn test_season_ended_no_scores() {
        let mut sys: TestSystems = tester::setup_world(FLAGS:: ADMIN | FLAGS::GAME | FLAGS::DUEL | FLAGS::DUELIST | FLAGS::LORDS | FLAGS::APPROVE | FLAGS::MOCK_RNG);
        let season_1: SeasonConfig = sys.store.get_current_season();
        tester::set_block_timestamp(season_1.period.end - TIMESTAMP::ONE_HOUR);
        assert!(!season_1.can_collect(), "!season_1.can_collect");
        // fund duelists
        // tester::fund_duelists_pool(@sys, 4);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let C: ContractAddress = BUMMER();
        let D: ContractAddress = JOKER();
        let _duelist_id_a: u128 = *tester::execute_claim_starter_pack(@sys, A)[0];
        let _duelist_id_b: u128 = *tester::execute_claim_starter_pack(@sys, B)[0];
        let _duelist_id_c: u128 = *tester::execute_claim_starter_pack(@sys, C)[0];
        let _duelist_id_d: u128 = *tester::execute_claim_starter_pack(@sys, D)[0];
        // default unranked duel
        let (mocked, moves_a, moves_b) = prefabs::get_moves_crit_b_at_10();
        sys.rng.mock_values(mocked);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(@sys, A, B, DuelType::Seasonal, 1);
        prefabs::commit_reveal_get(@sys, duel_id, A, B, mocked, moves_a, moves_b);
        tester::assert_unranked_duel_results(@sys, duel_id, "unranked");
        // collect season 1
        tester::set_block_timestamp(season_1.period.end);
        assert!(season_1.can_collect(), "season_1.can_collect");
        // duel gain, no scores...
        sys.rng.mock_values(mocked);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(@sys, C, D, DuelType::Seasonal, 1);
        prefabs::commit_reveal_get(@sys, duel_id, C, D, mocked, moves_a, moves_b);
        tester::assert_practice_duel_results(@sys, duel_id, "unranked no more");
    }

    #[test]
    fn test_collect_season_baseline() {
        let mut sys: TestSystems = tester::setup_world(FLAGS:: ADMIN | FLAGS::GAME | FLAGS::MATCHMAKER);
        let season: SeasonConfig = sys.store.get_current_season();
        tester::set_block_timestamp(season.period.end);
        tester::drop_dojo_events(@sys);
        tester::execute_collect_season(@sys, OWNER());
        tester::assert_event_trophy(@sys, Trophy::SeasonCollector, OWNER());
        // no panic!
    }

    #[test]
    #[should_panic(expected:('BANK: caller not admin', 'ENTRYPOINT_FAILED'))]
    fn test_collect_season_not_admin() {
        let mut sys: TestSystems = tester::setup_world(FLAGS:: ADMIN | FLAGS::GAME | FLAGS::MATCHMAKER);
        let season: SeasonConfig = sys.store.get_current_season();
        tester::set_block_timestamp(season.period.end);
        tester::drop_dojo_events(@sys);
        tester::execute_collect_season(@sys, OTHER());
    }

    #[test]
    #[should_panic(expected:('BANK: is paused', 'ENTRYPOINT_FAILED'))]
    fn test_collect_season_is_paused() {
        let mut sys: TestSystems = tester::setup_world(FLAGS:: ADMIN | FLAGS::GAME | FLAGS::MATCHMAKER);
        let season: SeasonConfig = sys.store.get_current_season();
        tester::set_block_timestamp(season.period.end);
        tester::drop_dojo_events(@sys);
        tester::execute_admin_set_paused(@sys.admin, OWNER(), true);
        tester::execute_collect_season(@sys, OWNER());
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Season is active', 'ENTRYPOINT_FAILED'))]
    fn test_collect_still_active() {
        let mut sys: TestSystems = tester::setup_world(FLAGS:: ADMIN | FLAGS::GAME | FLAGS::MATCHMAKER);
        let _season: SeasonConfig = sys.store.get_current_season();
        tester::execute_collect_season(@sys, OWNER());
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Season is active', 'ENTRYPOINT_FAILED'))]
    fn test_collect_season_ended() {
        let mut sys: TestSystems = tester::setup_world(FLAGS:: ADMIN | FLAGS::GAME | FLAGS::MATCHMAKER);
        let season: SeasonConfig = sys.store.get_current_season();
        tester::set_block_timestamp(season.period.end);
        tester::execute_collect_season(@sys, OWNER());
        // panic! >>>> will collect new season
        tester::execute_collect_season(@sys, OWNER());
    }

}
