#[cfg(test)]
mod tests {
    use starknet::{ContractAddress};

    use dojo::world::{IWorldDispatcherTrait};

    use pistols::systems::admin::{IAdminDispatcherTrait};
    use pistols::models::{
        config::{Config},
    };
    use pistols::tests::tester::{tester,
        tester::{
            StoreTrait,
            TestSystems, FLAGS,
            ZERO, OWNER, OTHER, BUMMER, TREASURY,
        }
    };

    const CONFIG_HASH: felt252 = selector_from_tag!("pistols-Config");

    fn DUMMY_LORDS() -> ContractAddress { starknet::contract_address_const::<0x131313131313>() }

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
    #[ignore]
    fn test_grant_ungrant_admin() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN);
        assert!(!sys.world.dispatcher.is_writer(CONFIG_HASH, OTHER()), "default_other_writer_false");
        assert!(!sys.admin.am_i_admin(OTHER()), "owner_am_i_false");
        tester::execute_admin_grant_admin(@sys.admin, OWNER(), OTHER(), true);
        assert!(sys.world.dispatcher.is_writer(CONFIG_HASH, OTHER()), "new_other_true");
        assert!(sys.admin.am_i_admin(OTHER()), "owner_am_i_true");
        tester::execute_admin_set_paused(@sys.admin, OTHER(), true);
        let config: Config = sys.store.get_config();
        assert!(config.is_paused, "paused");
        tester::execute_admin_grant_admin(@sys.admin, OWNER(), OTHER(), false);
        assert!(!sys.world.dispatcher.is_writer(CONFIG_HASH, OTHER()), "new_other_false");
        assert!(!sys.admin.am_i_admin(OTHER()), "owner_am_i_false_again");
    }

    #[test]
    #[should_panic(expected:('ADMIN: Invalid account_address', 'ENTRYPOINT_FAILED'))]
    fn test_grant_admin_null() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN);
        tester::execute_admin_grant_admin(@sys.admin, OWNER(), ZERO(), true);
    }

    #[test]
    #[should_panic(expected:('ADMIN: Caller not admin', 'ENTRYPOINT_FAILED'))]
    fn test_grant_admin_not_owner() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN);
        tester::execute_admin_grant_admin(@sys.admin, OTHER(), BUMMER(), true);
    }

    #[test]
    fn test_set_paused() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN);
        let config: Config = sys.store.get_config();
        assert!(!config.is_paused, "paused_1");
        tester::execute_admin_set_paused(@sys.admin, OWNER(), true);
        let config: Config = sys.store.get_config();
        assert!(config.is_paused, "paused_2");
        tester::execute_admin_set_paused(@sys.admin, OWNER(), false);
        let config: Config = sys.store.get_config();
        assert!(!config.is_paused, "paused_3");
    }

    #[test]
    #[should_panic(expected:('ADMIN: Caller not admin', 'ENTRYPOINT_FAILED'))]
    fn test_set_paused_not_owner() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN);
        tester::execute_admin_set_paused(@sys.admin, OTHER(), true);
    }

    #[test]
    fn test_set_treasury() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN);
        let mut config: Config = sys.store.get_config();
        assert_eq!(config.treasury_address, TREASURY(), "treasury_address_default");
        // set
        let new_treasury: ContractAddress = starknet::contract_address_const::<0x121212>();
        tester::execute_admin_set_treasury(@sys.admin, OWNER(), new_treasury);
        let mut config: Config = sys.store.get_config();
        assert_eq!(config.treasury_address, new_treasury, "set_config_new");
        tester::execute_admin_set_treasury(@sys.admin, OWNER(), BUMMER());
        let config: Config = sys.store.get_config();
        assert_eq!(config.treasury_address, BUMMER(), "treasury_address_newer");
    }

    #[test]
    #[should_panic(expected:('ADMIN: Invalid treasury_address', 'ENTRYPOINT_FAILED'))]
    fn test_set_treasury_null() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN);
        tester::execute_admin_set_treasury(@sys.admin, OWNER(), ZERO());
    }

    #[test]
    #[should_panic(expected:('ADMIN: Caller not admin', 'ENTRYPOINT_FAILED'))]
    fn test_set_treasury_not_owner() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN);
        tester::execute_admin_set_treasury(@sys.admin, OTHER(), BUMMER());
    }

}
