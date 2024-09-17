#[cfg(test)]
mod tests {
    use debug::PrintTrait;
    use core::traits::Into;
    use starknet::{ContractAddress};

    use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

    use pistols::systems::admin::{IAdminDispatcher, IAdminDispatcherTrait};
    use pistols::models::config::{Config};
    use pistols::models::table::{TableConfig, TableAdmittance, TABLES};
    use pistols::types::constants::{CONST};
    use pistols::tests::tester::{tester, tester::{FLAGS, ZERO, OWNER, OTHER, BUMMER, TREASURY}};
    use pistols::interfaces::systems::{SELECTORS};

    const INVALID_TABLE: felt252 = 'TheBookIsOnTheTable';
    const CONFIG_HASH: felt252 = selector_from_tag!("pistols-Config");

    fn DUMMY_LORDS() -> ContractAddress { starknet::contract_address_const::<0x131313131313>() }

    //
    // Initialize
    //

    #[test]
    fn test_initialize_defaults() {
        let sys = tester::setup_world(FLAGS::ADMIN);
        let config: Config = tester::get_Config(sys.world);
        assert(config.treasury_address == TREASURY(), 'treasury_address_default');
        assert(config.is_paused == false, 'paused');
        // get
        let get_config: Config = tester::get_Config(sys.world);
        assert(config.treasury_address == get_config.treasury_address, 'get_config.treasury_address');
        assert(config.is_paused == get_config.is_paused, 'get_config.is_paused');
    }

    #[test]
    fn test_am_i_admin() {
        let sys = tester::setup_world(FLAGS::ADMIN);
        assert(sys.admin.am_i_admin(OWNER()) == true, 'default_true');
        assert(sys.admin.am_i_admin(OTHER()) == false, 'other_false');
    }

    #[test]
    #[ignore]
    fn test_grant_ungrant_admin() {
        let sys = tester::setup_world(FLAGS::ADMIN);
        assert(sys.world.is_writer(CONFIG_HASH, OTHER()) == false, 'default_other_writer_false');
        assert(sys.admin.am_i_admin(OTHER()) == false, 'owner_am_i_false');
        tester::execute_admin_grant_admin(@sys.admin, OWNER(), OTHER(), true);
        assert(sys.world.is_writer(CONFIG_HASH, OTHER()) == true, 'new_other_true');
        assert(sys.admin.am_i_admin(OTHER()) == true, 'owner_am_i_true');
        tester::execute_admin_set_paused(@sys.admin, OTHER(), true);
        let config: Config = tester::get_Config(sys.world);
        assert(config.is_paused == true, 'paused');
        tester::execute_admin_grant_admin(@sys.admin, OWNER(), OTHER(), false);
        assert(sys.world.is_writer(CONFIG_HASH, OTHER()) == false, 'new_other_false');
        assert(sys.admin.am_i_admin(OTHER()) == false, 'owner_am_i_false_again');
    }

    #[test]
    #[should_panic(expected:('ADMIN: Invalid account_address', 'ENTRYPOINT_FAILED'))]
    fn test_grant_admin_null() {
        let sys = tester::setup_world(FLAGS::ADMIN);
        tester::execute_admin_grant_admin(@sys.admin, OWNER(), ZERO(), true);
    }

    #[test]
    #[should_panic(expected:('ADMIN: not admin', 'ENTRYPOINT_FAILED'))]
    fn test_grant_admin_not_owner() {
        let sys = tester::setup_world(FLAGS::ADMIN);
        tester::execute_admin_grant_admin(@sys.admin, OTHER(), BUMMER(), true);
    }

    #[test]
    fn test_set_paused() {
        let sys = tester::setup_world(FLAGS::ADMIN);
        let config: Config = tester::get_Config(sys.world);
        assert(config.is_paused == false, 'paused_1');
        tester::execute_admin_set_paused(@sys.admin, OWNER(), true);
        let config: Config = tester::get_Config(sys.world);
        assert(config.is_paused == true, 'paused_2');
        tester::execute_admin_set_paused(@sys.admin, OWNER(), false);
        let config: Config = tester::get_Config(sys.world);
        assert(config.is_paused == false, 'paused_3');
    }

    #[test]
    #[should_panic(expected:('ADMIN: not admin', 'ENTRYPOINT_FAILED'))]
    fn test_set_paused_not_owner() {
        let sys = tester::setup_world(FLAGS::ADMIN);
        tester::execute_admin_set_paused(@sys.admin, OTHER(), true);
    }

    #[test]
    fn test_set_config() {
        let sys = tester::setup_world(FLAGS::ADMIN);
        let mut config: Config = tester::get_Config(sys.world);
        assert(config.treasury_address == TREASURY(), 'treasury_address_default');
        // set
        let new_treasury: ContractAddress = starknet::contract_address_const::<0x121212>();
        config.treasury_address = new_treasury;
        tester::execute_admin_set_config(@sys.admin, OWNER(), config);
        let mut config: Config = tester::get_Config(sys.world);
        assert(config.treasury_address == new_treasury, 'set_config_new');
        config.treasury_address = BUMMER();
        tester::execute_admin_set_config(@sys.admin, OWNER(), config);
        let config: Config = tester::get_Config(sys.world);
        assert(config.treasury_address == BUMMER(), 'treasury_address_newer');
    }

    #[test]
    #[should_panic(expected:('ADMIN: Invalid treasury_address', 'ENTRYPOINT_FAILED'))]
    fn test_set_config_null() {
        let sys = tester::setup_world(FLAGS::ADMIN);
        let mut config: Config = tester::get_Config(sys.world);
        config.treasury_address = ZERO();
        tester::execute_admin_set_config(@sys.admin, OWNER(), config);
    }

    #[test]
    #[should_panic(expected:('ADMIN: not admin', 'ENTRYPOINT_FAILED'))]
    fn test_set_config_not_owner() {
        let sys = tester::setup_world(FLAGS::ADMIN);
        let mut config: Config = tester::get_Config(sys.world);
        config.treasury_address = BUMMER();
        tester::execute_admin_set_config(@sys.admin, OTHER(), config);
    }

    //
    // Tables
    //

    #[test]
    fn test_initialize_table_defaults() {
        let sys = tester::setup_world(FLAGS::ADMIN | FLAGS::LORDS);
        let table: TableConfig = tester::get_Table(sys.world, TABLES::LORDS);
        assert(table.fee_contract_address == sys.lords.contract_address, 'LORDS_contract_address');
        assert(table.is_open == true, 'LORDS_is_open');
        let table: TableConfig = tester::get_Table(sys.world, TABLES::COMMONERS);
        assert(table.fee_contract_address == ZERO(), 'COMMONERS_contract_address');
        assert(table.is_open == true, 'COMMONERS_is_open');
    }

    #[test]
    fn test_initialize_table() {
        let sys = tester::setup_world(FLAGS::ADMIN | FLAGS::LORDS);
        let table: TableConfig = tester::get_Table(sys.world, TABLES::LORDS);
        assert(table.fee_contract_address == sys.lords.contract_address, 'contract_address');
        assert(table.fee_min == 4 * CONST::ETH_TO_WEI.low, 'fee_min');
        // assert(table.fee_pct == 10, 'fee_pct');
        // assert(table.is_open == true, 'is_open');
    }

    #[test]
    fn test_set_table() {
        let sys = tester::setup_world(FLAGS::ADMIN);
        let mut table: TableConfig = tester::get_Table(sys.world, TABLES::LORDS);
        assert(table.fee_contract_address == ZERO(), 'zero');
        assert(table.is_open == false, 'zero');
        table.fee_contract_address = DUMMY_LORDS();
        table.description = 'LORDS+';
        table.fee_min = 5;
        // table.fee_pct = 10;
        table.is_open = true;
        tester::execute_admin_set_table(@sys.admin, OWNER(), table);
        let mut table: TableConfig = tester::get_Table(sys.world, TABLES::LORDS);
        assert(table.fee_contract_address == DUMMY_LORDS(), 'contract_address_1');
        assert(table.description == 'LORDS+', 'description_1');
        assert(table.fee_min == 5, 'fee_min_1');
        // assert(table.fee_pct == 10, 'fee_pct_1');
        assert(table.is_open == true, 'is_open_1');
        table.fee_contract_address = OTHER();
        table.description = 'LORDS+++';
        table.fee_min = 22;
        // table.fee_pct = 33;
        table.is_open = false;
        tester::execute_admin_set_table(@sys.admin, OWNER(), table);
        let mut table: TableConfig = tester::get_Table(sys.world, TABLES::LORDS);
        assert(table.fee_contract_address == OTHER(), 'contract_address_2');
        assert(table.description == 'LORDS+++', 'description_2');
        assert(table.fee_min == 22, 'fee_min_2');
        // assert(table.fee_pct == 33, 'fee_pct_2');
        assert(table.is_open == false, 'is_open_2');
    }

    #[test]
    fn test_open_table() {
        let sys = tester::setup_world(FLAGS::ADMIN);
        tester::execute_admin_open_table(@sys.admin, OWNER(), TABLES::LORDS, true);
        let table: TableConfig = tester::get_Table(sys.world, TABLES::LORDS);
        assert(table.is_open == true, 'is_open_true');
        tester::execute_admin_open_table(@sys.admin, OWNER(), TABLES::LORDS, false);
        let table: TableConfig = tester::get_Table(sys.world, TABLES::LORDS);
        assert(table.is_open == false, 'is_open_false');
        tester::execute_admin_open_table(@sys.admin, OWNER(), TABLES::LORDS, true);
        let table: TableConfig = tester::get_Table(sys.world, TABLES::LORDS);
        assert(table.is_open == true, 'is_open_true');
    }

    #[test]
    #[should_panic(expected:('ADMIN: not admin', 'ENTRYPOINT_FAILED'))]
    fn test_set_table_not_owner() {
        let sys = tester::setup_world(FLAGS::ADMIN);
        let table: TableConfig = tester::get_Table(sys.world, TABLES::LORDS);
        tester::execute_admin_set_table(@sys.admin, OTHER(), table);
    }

    #[test]
    #[should_panic(expected:('ADMIN: not admin', 'ENTRYPOINT_FAILED'))]
    fn test_open_table_not_owner() {
        let sys = tester::setup_world(FLAGS::ADMIN);
        tester::execute_admin_open_table(@sys.admin, OTHER(), TABLES::LORDS, true);
    }

    #[test]
    #[should_panic(expected:('ADMIN: Invalid table', 'ENTRYPOINT_FAILED'))]
    fn test_set_table_zero() {
        let sys = tester::setup_world(FLAGS::ADMIN);
        let mut table: TableConfig = tester::get_Table(sys.world, TABLES::LORDS);
        table.table_id = 0;
        tester::execute_admin_set_table(@sys.admin, OWNER(), table);
    }

    #[test]
    #[should_panic(expected:('ADMIN: Invalid table', 'ENTRYPOINT_FAILED'))]
    fn test_open_table_zero() {
        let sys = tester::setup_world(FLAGS::ADMIN);
        tester::execute_admin_open_table(@sys.admin, OWNER(), 0_felt252, false);
    }

    #[test]
    #[should_panic(expected:('ADMIN: Invalid table', 'ENTRYPOINT_FAILED'))]
    fn test_open_table_invalid() {
        let sys = tester::setup_world(FLAGS::ADMIN);
        tester::execute_admin_open_table(@sys.admin, OWNER(), INVALID_TABLE, false);
    }


    //
    // admittance
    //

    #[test]
    fn test_set_table_admittance() {
        let sys = tester::setup_world(FLAGS::ADMIN);
        let mut admittance: TableAdmittance = tester::get_TableAdmittance(sys.world, TABLES::LORDS);
        assert(admittance.accounts.len() == 0, 'accounts_default');
        assert(admittance.duelists.len() == 0, 'duelists_default');
        admittance.accounts = array![OWNER(), OTHER()];
        tester::execute_admin_set_table_admittance(@sys.admin, OWNER(), admittance);
        let mut admittance: TableAdmittance = tester::get_TableAdmittance(sys.world, TABLES::LORDS);
        assert(admittance.accounts.len() == 2, 'accounts_2');
        assert(admittance.duelists.len() == 0, 'duelists_0');
        admittance.duelists = array![1, 2, 3];
        tester::execute_admin_set_table_admittance(@sys.admin, OWNER(), admittance);
        let mut admittance: TableAdmittance = tester::get_TableAdmittance(sys.world, TABLES::LORDS);
        assert(admittance.accounts.len() == 2, 'accounts_22');
        assert(admittance.duelists.len() == 3, 'duelists_3');
        admittance.accounts = array![];
        tester::execute_admin_set_table_admittance(@sys.admin, OWNER(), admittance);
        let mut admittance: TableAdmittance = tester::get_TableAdmittance(sys.world, TABLES::LORDS);
        assert(admittance.accounts.len() == 0, 'accounts_00');
        assert(admittance.duelists.len() == 3, 'duelists_0');
        admittance.duelists = array![];
        tester::execute_admin_set_table_admittance(@sys.admin, OWNER(), admittance);
        let mut admittance: TableAdmittance = tester::get_TableAdmittance(sys.world, TABLES::LORDS);
        assert(admittance.accounts.len() == 0, 'accounts_00');
        assert(admittance.duelists.len() == 0, 'duelists_00');
    }

    #[test]
    #[should_panic(expected:('ADMIN: not admin', 'ENTRYPOINT_FAILED'))]
    fn test_set_table_admittance_not_owner() {
        let sys = tester::setup_world(FLAGS::ADMIN);
        let mut admittance: TableAdmittance = tester::get_TableAdmittance(sys.world, TABLES::LORDS);
        tester::execute_admin_set_table_admittance(@sys.admin, OTHER(), admittance);
    }

    #[test]
    #[should_panic(expected:('ADMIN: Invalid table', 'ENTRYPOINT_FAILED'))]
    fn test_set_table_admittance_zero() {
        let sys = tester::setup_world(FLAGS::ADMIN);
        let mut admittance: TableAdmittance = tester::get_TableAdmittance(sys.world, TABLES::LORDS);
        admittance.table_id = 0;
        tester::execute_admin_set_table_admittance(@sys.admin, OWNER(), admittance);
    }

    #[test]
    #[should_panic(expected:('ADMIN: Invalid table', 'ENTRYPOINT_FAILED'))]
    fn test_set_table_admittance_invalid() {
        let sys = tester::setup_world(FLAGS::ADMIN);
        let mut admittance: TableAdmittance = tester::get_TableAdmittance(sys.world, TABLES::LORDS);
        admittance.table_id = INVALID_TABLE;
        tester::execute_admin_set_table_admittance(@sys.admin, OWNER(), admittance);
    }


}
