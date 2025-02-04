#[cfg(test)]
mod tests {
    use pistols::models::{
        season::{SeasonConfig, SeasonConfigTrait, SeasonPhase},
        table::{TableConfig, TableType, TABLES},
        config::{Config},
    };
    use pistols::tests::tester::{tester,
        tester::{
            IGameDispatcherTrait,
            TestSystems, FLAGS,
            OWNER,
        }
    };

    const PLAYER_NAME: felt252 = 'Sensei';
    const OTHER_NAME: felt252 = 'Senpai';
    const PREMISE_1: felt252 = 'For honour!!!';

    #[test]
    fn test_season_initializer() {
        let mut sys: TestSystems = tester::setup_world(FLAGS:: ADMIN | FLAGS::GAME);
        let _config: Config = tester::get_Config(sys.world);
        let season: SeasonConfig = tester::get_current_Season(sys.world);
        //  season was created
        let timestamp = tester::get_block_timestamp();
        assert(season.table_id != 0, 'table_id');
        assert(season.season_id == 1, 'season_id');
        assert(season.timestamp_start != 0, 'timestamp_start != 0');
        assert(season.timestamp_start < timestamp, 'timestamp_start');
        assert(season.timestamp_end > season.timestamp_start, 'timestamp_end');
        assert(season.phase == SeasonPhase::Single, 'phase');
        //  table was created
        let table: TableConfig = tester::get_Table(sys.world, season.table_id);
        assert(table.table_type == TableType::Season, 'table_type');
        assert(table.table_id == season.table_id, 'table_id');
        // other tables
        let table: TableConfig = tester::get_Table(sys.world, TABLES::TUTORIAL);
        assert(table.table_type == TableType::Tutorial, 'table_type');
        let table: TableConfig = tester::get_Table(sys.world, TABLES::PRACTICE);
        assert(table.table_type == TableType::Practice, 'table_type');
    }

    #[test]
    fn test_season_collect() {
        let mut sys: TestSystems = tester::setup_world(FLAGS:: ADMIN | FLAGS::GAME);
        let season: SeasonConfig = tester::get_current_Season(sys.world);
        assert(season.season_id == 1, 'season_id');
        assert(season.phase == SeasonPhase::Single, 'phase');
        //  time travel
        assert(season.can_collect() == false, '!season.can_collect');
        assert(sys.game.can_collect() == false, '!sys.game.can_collect');
        tester::set_timestamp(season.timestamp_end);
        assert(season.can_collect() == true, 'season.can_collect');
        assert(sys.game.can_collect() == true, 'sys.game.can_collect');
        // collect
        let new_table_id: felt252 = tester::execute_collect(@sys.game, OWNER());
        assert(new_table_id != 0, 'new_table_id != 0');
        assert(new_table_id != season.table_id, 'new_table_id');
        // past season is ended
        let season: SeasonConfig = tester::get_Season(sys.world, season.table_id);
        assert(season.phase == SeasonPhase::Ended, 'season.phase_ENDED');
        // get new season
        let new_season: SeasonConfig = tester::get_current_Season(sys.world);
        assert(new_season.table_id == new_table_id, 'new_season.table_id');
        assert(new_season.phase == SeasonPhase::Single, 'new_season.phase');
        assert(new_season.season_id == 2, 'new_season.season_id');
        assert(new_season.can_collect() == false, '!new_season.can_collect');
        assert(sys.game.can_collect() == false, '!sys.game.can_collect_NEW');
        // get new table
        let new_table: TableConfig = tester::get_Table(sys.world, new_table_id);
        assert(new_table.table_type == TableType::Season, 'table_type');
        assert(new_table.table_id == new_season.table_id, 'table_id');
    }

    #[test]
    fn test_collect_season_baseline() {
        let mut sys: TestSystems = tester::setup_world(FLAGS:: ADMIN | FLAGS::GAME);
        let season: SeasonConfig = tester::get_current_Season(sys.world);
        tester::set_timestamp(season.timestamp_end);
        tester::execute_collect(@sys.game, OWNER());
        // no panic!
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Season is active', 'ENTRYPOINT_FAILED'))]
    fn test_collect_still_active() {
        let mut sys: TestSystems = tester::setup_world(FLAGS:: ADMIN | FLAGS::GAME);
        let _season: SeasonConfig = tester::get_current_Season(sys.world);
        tester::execute_collect(@sys.game, OWNER());
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Season is active', 'ENTRYPOINT_FAILED'))]
    fn test_collect_season_ended() {
        let mut sys: TestSystems = tester::setup_world(FLAGS:: ADMIN | FLAGS::GAME);
        let season: SeasonConfig = tester::get_current_Season(sys.world);
        tester::set_timestamp(season.timestamp_end);
        tester::execute_collect(@sys.game, OWNER());
        // panic! >>>> will collect new season
        tester::execute_collect(@sys.game, OWNER());
    }

    // #[test]
    // #[should_panic(expected:('PISTOLS: Season ended', 'ENTRYPOINT_FAILED'))]
    // fn test_collect_season_ended() {
    //     let mut sys: TestSystems = tester::setup_world(FLAGS:: ADMIN | FLAGS::GAME);
    //     let season: SeasonConfig = tester::get_current_Season(sys.world);
    //     tester::set_timestamp(season.timestamp_end);
    //     tester::execute_collect(@sys.game, OWNER());
    //     // panic! >>>> will collect new season
    //     tester::execute_collect(@sys.game, OWNER());
    // }

}
