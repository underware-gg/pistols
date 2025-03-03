#[cfg(test)]
mod tests {
    use pistols::models::{
        season::{SeasonConfig, SeasonConfigTrait, SeasonPhase},
        table::{TableConfig, RulesType},
        config::{Config},
    };
    use pistols::tests::tester::{tester,
        tester::{
            StoreTrait,
            IGameDispatcherTrait,
            TestSystems, FLAGS,
            OWNER, OTHER, SEASON_TABLE, ID,
        }
    };

    const PREMISE_1: felt252 = 'For honour!!!';

    #[test]
    fn test_season_initializer() {
        let mut sys: TestSystems = tester::setup_world(FLAGS:: ADMIN | FLAGS::GAME);
        let _config: Config = sys.store.get_config();
        let season: SeasonConfig = sys.store.get_current_season();
        //  season was created
        let timestamp: u64 = tester::get_block_timestamp();
        assert_ne!(season.table_id, 0, "table_id");
        assert_eq!(season.season_id, 1, "season_id");
        assert_ne!(season.period.start, 0, "period.start != 0");
        assert_lt!(season.period.start, timestamp, "period.start");
        assert_gt!(season.period.end, season.period.start, "period.end");
        assert_eq!(season.phase, SeasonPhase::InProgress, "phase");
        //  table was created
        let table: TableConfig = sys.store.get_table_config( season.table_id);
        assert_eq!(table.rules, RulesType::Season, "table_type");
        assert_eq!(table.table_id, season.table_id, "table_id");
    }

    #[test]
    fn test_season_collect() {
        let mut sys: TestSystems = tester::setup_world(FLAGS:: ADMIN | FLAGS::GAME);
        let season: SeasonConfig = sys.store.get_current_season();
        assert_eq!(season.season_id, 1, "season_id");
        assert_eq!(season.phase, SeasonPhase::InProgress, "phase");
        // create a challenge in season 1
        let duel_id: u128 = tester::execute_create_duel(@sys.duels, OWNER(), OTHER(), PREMISE_1, SEASON_TABLE(1), 0, 1);
        tester::execute_reply_duel(@sys.duels, OWNER(), ID(OWNER()), duel_id, false);
        //  time travel
        assert!(!season.can_collect(), "!season.can_collect");
        assert!(!sys.game.can_collect_season(), "!sys.game.can_collect_season");
        tester::set_block_timestamp(season.period.end);
        assert!(season.can_collect(), "season.can_collect");
        assert!(sys.game.can_collect_season(), "sys.game.can_collect_season");
        // collect
        let new_table_id: felt252 = tester::execute_collect(@sys.game, OWNER());
        assert_ne!(new_table_id, 0, "new_table_id != 0");
        assert_ne!(new_table_id, season.table_id, "new_table_id");
        // past season is ended
        let season: SeasonConfig = sys.store.get_season_config(season.table_id);
        assert_eq!(season.phase, SeasonPhase::Ended, "season.phase_ENDED");
        // get new season
        let new_season: SeasonConfig = sys.store.get_current_season();
        assert_eq!(new_season.table_id, new_table_id, "new_season.table_id");
        assert_eq!(new_season.phase, SeasonPhase::InProgress, "new_season.phase");
        assert_eq!(new_season.season_id, 2, "new_season.season_id");
        assert!(!new_season.can_collect(), "!new_season.can_collect");
        assert!(!sys.game.can_collect_season(), "!sys.game.can_collect_season_NEW");
        // get new table
        let new_table: TableConfig = sys.store.get_table_config( new_table_id);
        assert_eq!(new_table.rules, RulesType::Season, "table_type");
        assert_eq!(new_table.table_id, new_season.table_id, "table_id");
        // create a challenge in season 2
        let duel_id: u128 = tester::execute_create_duel(@sys.duels, OWNER(), OTHER(), PREMISE_1, SEASON_TABLE(2), 0, 1);
        tester::execute_reply_duel(@sys.duels, OWNER(), ID(OWNER()), duel_id, false);
    }

    #[test]
    fn test_collect_season_baseline() {
        let mut sys: TestSystems = tester::setup_world(FLAGS:: ADMIN | FLAGS::GAME);
        let season: SeasonConfig = sys.store.get_current_season();
        tester::set_block_timestamp(season.period.end);
        tester::execute_collect(@sys.game, OWNER());
        // no panic!
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Season is active', 'ENTRYPOINT_FAILED'))]
    fn test_collect_still_active() {
        let mut sys: TestSystems = tester::setup_world(FLAGS:: ADMIN | FLAGS::GAME);
        let _season: SeasonConfig = sys.store.get_current_season();
        tester::execute_collect(@sys.game, OWNER());
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Season is active', 'ENTRYPOINT_FAILED'))]
    fn test_collect_season_ended() {
        let mut sys: TestSystems = tester::setup_world(FLAGS:: ADMIN | FLAGS::GAME);
        let season: SeasonConfig = sys.store.get_current_season();
        tester::set_block_timestamp(season.period.end);
        tester::execute_collect(@sys.game, OWNER());
        // panic! >>>> will collect new season
        tester::execute_collect(@sys.game, OWNER());
    }

    #[test]
    #[should_panic(expected:('DUEL: Invalid season', 'ENTRYPOINT_FAILED'))]
    fn test_collect_season_create_challenge() {
        let mut sys: TestSystems = tester::setup_world(FLAGS:: ADMIN | FLAGS::GAME);
        let season: SeasonConfig = sys.store.get_current_season();
        tester::set_block_timestamp(season.period.end);
        tester::execute_collect(@sys.game, OWNER());
        // create a challenge in season 1
        tester::execute_create_duel(@sys.duels, OWNER(), OTHER(), PREMISE_1, SEASON_TABLE(1), 0, 1);
    }


}
