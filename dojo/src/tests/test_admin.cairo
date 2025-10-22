#[cfg(test)]
mod tests {
    use starknet::{ContractAddress};

    use pistols::systems::admin::{IAdminDispatcherTrait};
    use pistols::models::{
        config::{Config},
    };
    use pistols::tests::tester::{tester,
        tester::{
            StoreTrait,
            TestSystems, FLAGS,
            ZERO, OWNER, OTHER, BUMMER, TREASURY, REALMS,
        }
    };

    const CONFIG_HASH: felt252 = selector_from_tag!("pistols-Config");

    fn DUMMY_LORDS() -> ContractAddress { 0x131313131313.try_into().unwrap() }

    //
    // Initialize
    //

    #[test]
    fn test_initialize_defaults() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN);
        let config: Config = sys.store.get_config();
        assert_eq!(config.treasury_address, TREASURY(), "treasury_address_default");
        assert!(!config.is_paused, "paused");
        // get
        let get_config: Config = sys.store.get_config();
        assert_eq!(config.treasury_address, get_config.treasury_address, "get_config.treasury_address");
        assert_eq!(config.is_paused, get_config.is_paused, "get_config.is_paused");
    }

    #[test]
    fn test_am_i_admin() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN);
        assert!(sys.admin.am_i_admin(OWNER()), "default_true");
        assert!(!sys.admin.am_i_admin(OTHER()), "other_false");
    }

    #[test]
    fn test_set_unset_is_admin() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN);
        // not admin
        assert!(!sys.admin.am_i_admin(OTHER()), "admin_am_i_admin_1");
        assert!(!sys.store.get_player_is_admin(OTHER()), "store_am_i_admin_1");
        assert!(!sys.store.get_player_is_team_member(OTHER()), "store_am_i_team_member_1");
        // set admin
        tester::execute_admin_set_is_team_member(@sys.admin, OWNER(), OTHER(), true, true);
        assert!(sys.admin.am_i_admin(OTHER()), "admin_am_i_admin_2");
        assert!(sys.store.get_player_is_admin(OTHER()), "store_am_i_admin_2");
        assert!(sys.store.get_player_is_team_member(OTHER()), "store_am_i_team_member_2");
        // test admin role
        tester::execute_admin_set_paused(@sys.admin, OTHER(), true);
        let config: Config = sys.store.get_config();
        assert!(config.is_paused, "paused");
        assert!(sys.store.get_config_is_paused(), "store_paused");
        // unset admin
        tester::execute_admin_set_is_team_member(@sys.admin, OWNER(), OTHER(), false, false);
        assert!(!sys.admin.am_i_admin(OTHER()), "admin_am_i_admin_3");
        assert!(!sys.store.get_player_is_admin(OTHER()), "store_am_i_admin_3");
        assert!(!sys.store.get_player_is_team_member(OTHER()), "store_am_i_team_member_3");
    }

    #[test]
    fn test_set_is_team_member() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN);
        // not team member
        assert!(!sys.admin.am_i_admin(OTHER()), "admin_am_i_admin_1");
        assert!(!sys.store.get_player_is_admin(OTHER()), "store_am_i_admin_1");
        assert!(!sys.store.get_player_is_team_member(OTHER()), "store_am_i_team_member_1");
        // set only team member
        tester::execute_admin_set_is_team_member(@sys.admin, OWNER(), OTHER(), true, false);
        assert!(!sys.admin.am_i_admin(OTHER()), "admin_am_i_admin_2");
        assert!(!sys.store.get_player_is_admin(OTHER()), "store_am_i_admin_2");
        assert!(sys.store.get_player_is_team_member(OTHER()), "store_am_i_team_member_2");
        // set only admin
        tester::execute_admin_set_is_team_member(@sys.admin, OWNER(), BUMMER(), false, true);
        assert!(sys.admin.am_i_admin(BUMMER()), "admin_am_i_admin_3");
        assert!(sys.store.get_player_is_admin(BUMMER()), "store_am_i_admin_3");
        assert!(!sys.store.get_player_is_team_member(BUMMER()), "store_am_i_team_member_3");
    }

    #[test]
    fn test_set_is_admin_granted() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN);
        tester::execute_admin_set_is_team_member(@sys.admin, OWNER(), OTHER(), true, true);
        tester::execute_admin_set_treasury(@sys.admin, OTHER(), BUMMER());
        tester::execute_admin_set_realms_address(@sys.admin, OTHER(), REALMS());
    }

    #[test]
    #[should_panic(expected:('ADMIN: Invalid account address', 'ENTRYPOINT_FAILED'))]
    fn test_set_is_admin_null() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN);
        tester::execute_admin_set_is_team_member(@sys.admin, OWNER(), ZERO(), true, true);
    }

    #[test]
    #[should_panic(expected:('ADMIN: Caller not admin', 'ENTRYPOINT_FAILED'))]
    fn test_caller_not_admin() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN);
        tester::execute_admin_set_treasury(@sys.admin, OTHER(), REALMS());
    }

    #[test]
    #[should_panic(expected:('ADMIN: Caller not admin', 'ENTRYPOINT_FAILED'))]
    fn test_member_not_admin() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN);
        tester::execute_admin_set_is_team_member(@sys.admin, OWNER(), OTHER(), true, false);
        tester::execute_admin_set_treasury(@sys.admin, OTHER(), BUMMER());
    }

    #[test]
    fn test_set_paused() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN);
        let config: Config = sys.store.get_config();
        assert!(!config.is_paused, "paused_1");
        assert!(!sys.store.get_config_is_paused(), "store_paused_1");
        tester::execute_admin_set_paused(@sys.admin, OWNER(), true);
        let config: Config = sys.store.get_config();
        assert!(config.is_paused, "paused_2");
        assert!(sys.store.get_config_is_paused(), "store_paused_2");
        tester::execute_admin_set_paused(@sys.admin, OWNER(), false);
        let config: Config = sys.store.get_config();
        assert!(!config.is_paused, "paused_3");
        assert!(!sys.store.get_config_is_paused(), "store_paused_3");
    }

    #[test]
    #[should_panic(expected:('ADMIN: Caller not admin', 'ENTRYPOINT_FAILED'))]
    fn test_set_paused_not_admin() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN);
        tester::execute_admin_set_paused(@sys.admin, OTHER(), true);
    }

    //
    // set_treasury
    //

    #[test]
    fn test_set_treasury() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN);
        let mut config: Config = sys.store.get_config();
        assert_eq!(config.treasury_address, TREASURY(), "treasury_address_default");
        // set
        let new_treasury: ContractAddress = 0x121212.try_into().unwrap();
        tester::execute_admin_set_treasury(@sys.admin, OWNER(), new_treasury);
        let mut config: Config = sys.store.get_config();
        assert_eq!(config.treasury_address, new_treasury, "set_config_new");
        tester::execute_admin_set_treasury(@sys.admin, OWNER(), BUMMER());
        let config: Config = sys.store.get_config();
        assert_eq!(config.treasury_address, BUMMER(), "treasury_address_newer");
    }

    #[test]
    #[should_panic(expected:('ADMIN: Invalid treasury address', 'ENTRYPOINT_FAILED'))]
    fn test_set_treasury_null() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN);
        tester::execute_admin_set_treasury(@sys.admin, OWNER(), ZERO());
    }

    #[test]
    #[should_panic(expected:('ADMIN: Caller not admin', 'ENTRYPOINT_FAILED'))]
    fn test_set_treasury_not_admin() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN);
        tester::execute_admin_set_treasury(@sys.admin, OTHER(), BUMMER());
    }

    //
    // set_realms_address
    //

    #[test]
    fn test_set_realms_address() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN);
        let mut config: Config = sys.store.get_config();
        assert_eq!(config.realms_address, ZERO(), "realms_address_default");
        // set
        let new_realms: ContractAddress = 0x121212.try_into().unwrap();
        tester::execute_admin_set_realms_address(@sys.admin, OWNER(), new_realms);
        let mut config: Config = sys.store.get_config();
        assert_eq!(config.realms_address, new_realms, "set_config_new");
        tester::execute_admin_set_realms_address(@sys.admin, OWNER(), REALMS());
        let config: Config = sys.store.get_config();
        assert_eq!(config.realms_address, REALMS(), "realms_address_newer");
    }

    #[test]
    // #[should_panic(expected:('ADMIN: Invalid realms address', 'ENTRYPOINT_FAILED'))]
    fn test_set_realms_address_null() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN);
        tester::execute_admin_set_realms_address(@sys.admin, OWNER(), ZERO());
        // no panic!
    }

    #[test]
    #[should_panic(expected:('ADMIN: Caller not admin', 'ENTRYPOINT_FAILED'))]
    fn test_set_realms_address_not_admin() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN);
        tester::execute_admin_set_realms_address(@sys.admin, OTHER(), REALMS());
    }

    //
    // set_is_blocked
    //

    #[test]
    fn test_set_is_blocked() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN);
        // not blocked
        assert!(!sys.store.get_player_is_blocked(OTHER()), "store_am_i_blocked_1");
        // set blocked
        tester::execute_admin_set_is_blocked(@sys.admin, OWNER(), OTHER(), true);
        assert!(sys.store.get_player_is_blocked(OTHER()), "store_am_i_blocked_2");
        // unset blocked
        tester::execute_admin_set_is_blocked(@sys.admin, OWNER(), OTHER(), false);
        assert!(!sys.store.get_player_is_blocked(OTHER()), "store_am_i_blocked_3");
    }

    #[test]
    #[should_panic(expected:('ADMIN: Caller not admin', 'ENTRYPOINT_FAILED'))]
    fn test_set_is_blocked_not_admin() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN);
        tester::execute_admin_set_is_blocked(@sys.admin, OTHER(), OTHER(), false);
    }

    //
    // disqualify_duelist
    //

    #[test]
    #[should_panic(expected:('ADMIN: Caller not admin', 'ENTRYPOINT_FAILED'))]
    fn test_disqualify_duelist() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN);
        tester::execute_admin_disqualify_duelist(@sys.admin, OTHER(), 1, 1, true);
    }

    #[test]
    #[should_panic(expected:('ADMIN: Caller not admin', 'ENTRYPOINT_FAILED'))]
    fn test_qualify_duelist() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN);
        tester::execute_admin_qualify_duelist(@sys.admin, OTHER(), 1, 1);
    }

}
