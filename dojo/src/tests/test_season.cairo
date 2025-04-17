#[cfg(test)]
mod tests {
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
            IGameDispatcherTrait,
            TestSystems, FLAGS,
            ID, OWNER, OTHER, SEASON_ID_1, SEASON_ID_2,
        }
    };
    use pistols::tests::prefabs::{prefabs};

    const PREMISE_1: felt252 = 'For honour!!!';

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
    fn test_season_collect() {
        let mut sys: TestSystems = tester::setup_world(FLAGS:: ADMIN | FLAGS::GAME);
        let season_1: SeasonConfig = sys.store.get_current_season();
        assert_eq!(season_1.season_id, 1, "season_id");
        assert_eq!(season_1.phase, SeasonPhase::InProgress, "phase");
        // create a challenge in season 1
        let duel_id: u128 = tester::execute_create_duel(@sys.duels, OWNER(), OTHER(), PREMISE_1, DuelType::Seasonal, 0, 1);
        // let challenge: ChallengeValue = sys.store.get_challenge_value(duel_id);
        tester::execute_reply_duel(@sys.duels, OWNER(), ID(OWNER()), duel_id, false);
        //  time travel
        assert!(!season_1.can_collect(), "!season_1.can_collect");
        assert!(!sys.game.can_collect_season(), "!sys.game.can_collect_season");
        tester::set_block_timestamp(season_1.period.end);
        assert!(season_1.can_collect(), "season_1.can_collect");
        assert!(sys.game.can_collect_season(), "sys.game.can_collect_season");
        // collect
        let new_season_id: u32 = tester::execute_collect_season(@sys.game, OWNER());
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
        assert!(!sys.game.can_collect_season(), "!sys.game.can_collect_season_NEW");
        // get new season
        let new_season: SeasonConfig = sys.store.get_season_config( new_season_id);
        assert_eq!(new_season.rules, Rules::Season, "new_season.rules");
        assert_eq!(new_season.season_id, season_2.season_id, "new_season.season_id");
        // create a challenge in season 2
        let duel_id: u128 = tester::execute_create_duel(@sys.duels, OWNER(), OTHER(), PREMISE_1, DuelType::Seasonal, 0, 1);
        // let challenge: ChallengeValue = sys.store.get_challenge_value(duel_id);
        // assert_eq!(challenge.season_id, season_2.season_id, "challenge.season_id_2");
        tester::execute_reply_duel(@sys.duels, OWNER(), ID(OWNER()), duel_id, false);
    }

    #[test]
    fn test_season_collect_pending_challenge() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::MOCK_RNG);
        let season_1: SeasonConfig = sys.store.get_current_season();
        tester::set_block_timestamp(season_1.period.end - TIMESTAMP::ONE_HOUR);
        // create a challenge in season 1
        let duel_id: u128 = tester::execute_create_duel(@sys.duels, OWNER(), OTHER(), PREMISE_1, DuelType::Seasonal, 0, 1);
        tester::execute_reply_duel(@sys.duels, OTHER(), ID(OTHER()), duel_id, true);
        let challenge: ChallengeValue = sys.store.get_challenge_value(duel_id);
        assert_eq!(challenge.season_id, 0, "challenge.season_id_1");
        assert_eq!(challenge.state, ChallengeState::InProgress, "ChallengeState::InProgress");
        // collect season 1
        tester::set_block_timestamp(season_1.period.end);
        tester::execute_collect_season(@sys.game, OWNER());
        // continue challenge
        let (mocked, moves_a, moves_b) = prefabs::get_moves_dual_crit();
        let (challenge, _) = prefabs::commit_reveal_get(@sys, duel_id, OWNER(), OTHER(), mocked, moves_a, moves_b);
        assert_eq!(challenge.state, ChallengeState::Draw, "ChallengeState::Draw");
        // settled on season 2
        let season_2: SeasonConfig = sys.store.get_current_season();
        assert_eq!(challenge.season_id, season_2.season_id, "challenge.season_id_2");
    }

    #[test]
    fn test_collect_season_baseline() {
        let mut sys: TestSystems = tester::setup_world(FLAGS:: ADMIN | FLAGS::GAME);
        let season: SeasonConfig = sys.store.get_current_season();
        tester::set_block_timestamp(season.period.end);
        tester::execute_collect_season(@sys.game, OWNER());
        // no panic!
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Season is active', 'ENTRYPOINT_FAILED'))]
    fn test_collect_still_active() {
        let mut sys: TestSystems = tester::setup_world(FLAGS:: ADMIN | FLAGS::GAME);
        let _season: SeasonConfig = sys.store.get_current_season();
        tester::execute_collect_season(@sys.game, OWNER());
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Season is active', 'ENTRYPOINT_FAILED'))]
    fn test_collect_season_ended() {
        let mut sys: TestSystems = tester::setup_world(FLAGS:: ADMIN | FLAGS::GAME);
        let season: SeasonConfig = sys.store.get_current_season();
        tester::set_block_timestamp(season.period.end);
        tester::execute_collect_season(@sys.game, OWNER());
        // panic! >>>> will collect new season
        tester::execute_collect_season(@sys.game, OWNER());
    }

}
