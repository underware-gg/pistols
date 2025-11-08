#[cfg(test)]
mod tests {
    // use starknet::{ContractAddress};

    use pistols::models::{
        // pool::{Pool, PoolTrait, PoolType},
    };
    use pistols::types::{
    };

    use pistols::tests::tester::{tester,
        tester::{
            TestSystems, FLAGS,
            IAdminDispatcherTrait,
            OWNER, OTHER, RECIPIENT,
        }
    };
    // use pistols::libs::admin_fix::{AdminFixTrait};

    //-----------------------------------------
    // ADMIN FIX
    //

    #[test]
    #[should_panic(expected: ('ADMIN: Caller not admin', 'ENTRYPOINT_FAILED'))]
    fn test_urgent_update_caller() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN | FLAGS::OWNER);
        tester::impersonate(OTHER());
        sys.admin.urgent_update();
    }


    //-----------------------------------------
    // migrations
    //

    #[test]
    #[should_panic(expected: ('ADMIN: Caller not admin', 'ENTRYPOINT_FAILED'))]
    fn test_emit_past_season_leaderboard_event_caller() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN | FLAGS::OWNER);
        tester::impersonate(OTHER());
        sys.admin.emit_past_season_leaderboard_event(1, array![1,2], array![110, 100], array![OTHER(), RECIPIENT()], array![10_000, 1_000]);
    }

    #[test]
    fn test_fix_season_leaderboard() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN | FLAGS::OWNER);
        tester::impersonate(OWNER());
        sys.admin.emit_past_season_leaderboard_event(11, array![1,2], array![110, 100], array![OTHER(), RECIPIENT()], array![10_000, 1_000]);
        // fired leaderboard event
        tester::assert_event_season_leaderboards(@sys, 11, 2);
    }

}
