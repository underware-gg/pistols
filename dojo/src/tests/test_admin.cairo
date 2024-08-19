#[cfg(test)]
mod tests {
    use debug::PrintTrait;
    use core::traits::Into;
    use starknet::{ContractAddress};

    use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

    use pistols::systems::admin::{IAdminDispatcher, IAdminDispatcherTrait};
    use pistols::models::config::{Config};
    use pistols::models::table::{TableConfig, TableAdmittance, tables};
    use pistols::types::constants::{constants};
    use pistols::tests::tester::{tester, tester::{flags, ZERO, OWNER, OTHER, BUMMER, TREASURY}};
    use pistols::interfaces::systems::{SELECTORS};

    const INVALID_TABLE: felt252 = 'TheBookIsOnTheTable';
    const CONFIG_HASH: felt252 = selector_from_tag!("pistols-Config");

    fn DUMMY_LORDS() -> ContractAddress { starknet::contract_address_const::<0x131313131313>() }

    //
    // Initialize
    //

    #[test]
    fn test_initialize_defaults() {
        let (world, _system, _admin, _lords, _minter) = tester::setup_world(flags::ADMIN);
        let config: Config = tester::get_Config(world);
        assert(config.treasury_address == OWNER(), 'treasury_address');
        assert(config.is_paused == false, 'paused');
        // get
        let get_config: Config = tester::get_Config(world);
        assert(config.treasury_address == get_config.treasury_address, 'get_config.treasury_address');
        assert(config.is_paused == get_config.is_paused, 'get_config.is_paused');
    }

    #[test]
    fn test_am_i_admin() {
        let (_world, _system, admin, _lords, _minter) = tester::setup_world(flags::ADMIN);
        assert(admin.am_i_admin(OWNER()) == true, 'default_true');
        assert(admin.am_i_admin(OTHER()) == false, 'other_false');
    }

    #[test]
    #[ignore]
    fn test_grant_ungrant_admin() {
        let (world, _system, admin, _lords, _minter) = tester::setup_world(flags::ADMIN);
        // assert(world.is_owner(CONFIG_HASH, OWNER()) == true, 'default_owner_true');
        // assert(world.is_owner(CONFIG_HASH, OTHER()) == false, 'default_other_owner_false');
        assert(world.is_writer(CONFIG_HASH, OTHER()) == false, 'default_other_writer_false');
        // am_i?
        assert(admin.am_i_admin(OTHER()) == false, 'owner_am_i_false');
        // set
        tester::execute_admin_grant_admin(admin, OWNER(), OTHER(), true);
        // assert(world.is_writer(CONFIG_HASH, OWNER()) == true, 'owner_still');
        assert(world.is_writer(CONFIG_HASH, OTHER()) == true, 'new_other_true');
        // am_i?
        assert(admin.am_i_admin(OTHER()) == true, 'owner_am_i_true');
        // can write
        tester::execute_admin_set_paused(admin, OTHER(), true);
        let config: Config = tester::get_Config(world);
        assert(config.is_paused == true, 'paused');
        // unset
        tester::execute_admin_grant_admin(admin, OWNER(), OTHER(), false);
        assert(world.is_writer(CONFIG_HASH, OTHER()) == false, 'new_other_false');
        // am_i?
        assert(admin.am_i_admin(OTHER()) == false, 'owner_am_i_false_again');
    }

    #[test]
    #[should_panic(expected:('ADMIN: Invalid account_address', 'ENTRYPOINT_FAILED'))]
    fn test_grant_admin_null() {
        let (_world, _system, admin, _lords, _minter) = tester::setup_world(flags::ADMIN);
        tester::execute_admin_grant_admin(admin, OWNER(), ZERO(), true);
    }

    #[test]
    #[should_panic(expected:('ADMIN: not admin', 'ENTRYPOINT_FAILED'))]
    fn test_grant_admin_not_owner() {
        let (_world, _system, admin, _lords, _minter) = tester::setup_world(flags::ADMIN);
        tester::execute_admin_grant_admin(admin, OTHER(), BUMMER(), true);
    }

    #[test]
    fn test_set_paused() {
        let (world, _system, admin, _lords, _minter) = tester::setup_world(flags::ADMIN);
        let config: Config = tester::get_Config(world);
        assert(config.is_paused == false, 'paused_1');
        // set
        tester::execute_admin_set_paused(admin, OWNER(), true);
        let config: Config = tester::get_Config(world);
        assert(config.is_paused == true, 'paused_2');
        // set
        tester::execute_admin_set_paused(admin, OWNER(), false);
        let config: Config = tester::get_Config(world);
        assert(config.is_paused == false, 'paused_3');
    }

    #[test]
    #[should_panic(expected:('ADMIN: not admin', 'ENTRYPOINT_FAILED'))]
    fn test_set_paused_not_owner() {
        let (_world, _system, admin, _lords, _minter) = tester::setup_world(flags::ADMIN);
        tester::execute_admin_set_paused(admin, OTHER(), true);
    }

    #[test]
    fn test_set_config() {
        let (world, _system, admin, _lords, _minter) = tester::setup_world(flags::ADMIN);
        let mut config: Config = tester::get_Config(world);
        assert(config.treasury_address == OWNER(), 'treasury_address_param');
        // set
        let new_treasury: ContractAddress = starknet::contract_address_const::<0x121212>();
        config.treasury_address = new_treasury;
        tester::execute_admin_set_config(admin, OWNER(), config);
        let mut config: Config = tester::get_Config(world);
        assert(config.treasury_address == new_treasury, 'set_config_new');
        // set
        config.treasury_address = BUMMER();
        tester::execute_admin_set_config(admin, OWNER(), config);
        let config: Config = tester::get_Config(world);
        assert(config.treasury_address == BUMMER(), 'treasury_address_newer');
    }

    #[test]
    #[should_panic(expected:('ADMIN: Invalid treasury_address', 'ENTRYPOINT_FAILED'))]
    fn test_set_config_null() {
        let (world, _system, admin, _lords, _minter) = tester::setup_world(flags::ADMIN);
        let mut config: Config = tester::get_Config(world);
        config.treasury_address = ZERO();
        tester::execute_admin_set_config(admin, OWNER(), config);
    }

    #[test]
    #[should_panic(expected:('ADMIN: not admin', 'ENTRYPOINT_FAILED'))]
    fn test_set_config_not_owner() {
        let (world, _system, admin, _lords, _minter) = tester::setup_world(flags::ADMIN);
        let mut config: Config = tester::get_Config(world);
        config.treasury_address = BUMMER();
        tester::execute_admin_set_config(admin, OTHER(), config);
    }

    //
    // Tables
    //

    #[test]
    fn test_initialize_table_defaults() {
        let (world, _system, _admin, lords, _minter) = tester::setup_world(flags::ADMIN | flags::LORDS);
        let table: TableConfig = tester::get_Table(world, tables::LORDS);
        assert(table.wager_contract_address == lords.contract_address, 'LORDS_contract_address');
        assert(table.is_open == true, 'LORDS_is_open');
        let table: TableConfig = tester::get_Table(world, tables::COMMONERS);
        assert(table.wager_contract_address == ZERO(), 'COMMONERS_contract_address');
        assert(table.is_open == true, 'COMMONERS_is_open');
    }

    #[test]
    fn test_initialize_table() {
        let (world, _system, _admin, lords, _minter) = tester::setup_world(flags::ADMIN | flags::LORDS);
        let table: TableConfig = tester::get_Table(world, tables::LORDS);
        assert(table.wager_contract_address == lords.contract_address, 'contract_address');
        assert(table.fee_min == 4 * constants::ETH_TO_WEI.low, 'fee_min');
        assert(table.fee_pct == 10, 'fee_pct');
        assert(table.is_open == true, 'is_open');
    }

    #[test]
    fn test_set_table() {
        let (world, _system, admin, _lords, _minter) = tester::setup_world(flags::ADMIN);
        // not initialized
        let mut table: TableConfig = tester::get_Table(world, tables::LORDS);
        assert(table.wager_contract_address == ZERO(), 'zero');
        assert(table.is_open == false, 'zero');
        // set
        table.wager_contract_address = DUMMY_LORDS();
        table.description = 'LORDS+';
        table.fee_min = 5;
        table.fee_pct = 10;
        table.is_open = true;
        tester::execute_admin_set_table(admin, OWNER(), table);
        let mut table: TableConfig = tester::get_Table(world, tables::LORDS);
        assert(table.wager_contract_address == DUMMY_LORDS(), 'contract_address_1');
        assert(table.description == 'LORDS+', 'description_1');
        assert(table.fee_min == 5, 'fee_min_1');
        assert(table.fee_pct == 10, 'fee_pct_1');
        assert(table.is_open == true, 'is_open_1');
        // set
        table.wager_contract_address = OTHER();
        table.description = 'LORDS+++';
        table.fee_min = 22;
        table.fee_pct = 33;
        table.is_open = false;
        tester::execute_admin_set_table(admin, OWNER(), table);
        let mut table: TableConfig = tester::get_Table(world, tables::LORDS);
        assert(table.wager_contract_address == OTHER(), 'contract_address_2');
        assert(table.description == 'LORDS+++', 'description_2');
        assert(table.fee_min == 22, 'fee_min_2');
        assert(table.fee_pct == 33, 'fee_pct_2');
        assert(table.is_open == false, 'is_open_2');
    }

    #[test]
    fn test_open_table() {
        let (world, _system, admin, _lords, _minter) = tester::setup_world(flags::ADMIN);
        tester::execute_admin_open_table(admin, OWNER(), tables::LORDS, true);
        let table: TableConfig = tester::get_Table(world, tables::LORDS);
        assert(table.is_open == true, 'is_open_true');
        tester::execute_admin_open_table(admin, OWNER(), tables::LORDS, false);
        let table: TableConfig = tester::get_Table(world, tables::LORDS);
        assert(table.is_open == false, 'is_open_false');
        tester::execute_admin_open_table(admin, OWNER(), tables::LORDS, true);
        let table: TableConfig = tester::get_Table(world, tables::LORDS);
        assert(table.is_open == true, 'is_open_true');
    }

    #[test]
    #[should_panic(expected:('ADMIN: not admin', 'ENTRYPOINT_FAILED'))]
    fn test_set_table_not_owner() {
        let (world, _system, admin, _lords, _minter) = tester::setup_world(flags::ADMIN);
        let table: TableConfig = tester::get_Table(world, tables::LORDS);
        tester::execute_admin_set_table(admin, OTHER(), table);
    }

    #[test]
    #[should_panic(expected:('ADMIN: not admin', 'ENTRYPOINT_FAILED'))]
    fn test_open_table_not_owner() {
        let (_world, _system, admin, _lords, _minter) = tester::setup_world(flags::ADMIN);
        tester::execute_admin_open_table(admin, OTHER(), tables::LORDS, true);
    }

    #[test]
    #[should_panic(expected:('ADMIN: Invalid table', 'ENTRYPOINT_FAILED'))]
    fn test_set_table_zero() {
        let (world, _system, admin, _lords, _minter) = tester::setup_world(flags::ADMIN);
        let mut table: TableConfig = tester::get_Table(world, tables::LORDS);
        table.table_id = 0;
        tester::execute_admin_set_table(admin, OWNER(), table);
    }

    // #[test]
    // #[should_panic(expected:('ADMIN: Invalid table', 'ENTRYPOINT_FAILED'))]
    // fn test_set_table_invalid() {
    //     let (world, _system, admin, _lords, _minter) = tester::setup_world(flags::ADMIN);
    //     let mut table: TableConfig = tester::get_Table(world, tables::LORDS);
    //     table.table_id = INVALID_TABLE;
    //     tester::execute_admin_set_table(admin, OWNER(), table);
    // }

    #[test]
    #[should_panic(expected:('ADMIN: Invalid table', 'ENTRYPOINT_FAILED'))]
    fn test_open_table_zero() {
        let (_world, _system, admin, _lords, _minter) = tester::setup_world(flags::ADMIN);
        tester::execute_admin_open_table(admin, OWNER(), 0_felt252, false);
    }

    #[test]
    #[should_panic(expected:('ADMIN: Invalid table', 'ENTRYPOINT_FAILED'))]
    fn test_open_table_invalid() {
        let (_world, _system, admin, _lords, _minter) = tester::setup_world(flags::ADMIN);
        tester::execute_admin_open_table(admin, OWNER(), INVALID_TABLE, false);
    }


    //
    // admittance
    //

    #[test]
    fn test_set_table_admittance() {
        let (world, _system, admin, _lords, _minter) = tester::setup_world(flags::ADMIN);
        // not initialized
        let mut admittance: TableAdmittance = tester::get_TableAdmittance(world, tables::LORDS);
        assert(admittance.accounts.len() == 0, 'accounts_default');
        assert(admittance.duelists.len() == 0, 'duelists_default');
        // set
        admittance.accounts = array![OWNER(), OTHER()];
        tester::execute_admin_set_table_admittance(admin, OWNER(), admittance);
        let mut admittance: TableAdmittance = tester::get_TableAdmittance(world, tables::LORDS);
        assert(admittance.accounts.len() == 2, 'accounts_2');
        assert(admittance.duelists.len() == 0, 'duelists_0');
        // set
        admittance.duelists = array![1, 2, 3];
        tester::execute_admin_set_table_admittance(admin, OWNER(), admittance);
        let mut admittance: TableAdmittance = tester::get_TableAdmittance(world, tables::LORDS);
        assert(admittance.accounts.len() == 2, 'accounts_22');
        assert(admittance.duelists.len() == 3, 'duelists_3');
        // set
        admittance.accounts = array![];
        tester::execute_admin_set_table_admittance(admin, OWNER(), admittance);
        let mut admittance: TableAdmittance = tester::get_TableAdmittance(world, tables::LORDS);
        assert(admittance.accounts.len() == 0, 'accounts_00');
        assert(admittance.duelists.len() == 3, 'duelists_0');
        // set
        admittance.duelists = array![];
        tester::execute_admin_set_table_admittance(admin, OWNER(), admittance);
        let mut admittance: TableAdmittance = tester::get_TableAdmittance(world, tables::LORDS);
        assert(admittance.accounts.len() == 0, 'accounts_00');
        assert(admittance.duelists.len() == 0, 'duelists_00');
    }

    #[test]
    #[should_panic(expected:('ADMIN: not admin', 'ENTRYPOINT_FAILED'))]
    fn test_set_table_admittance_not_owner() {
        let (world, _system, admin, _lords, _minter) = tester::setup_world(flags::ADMIN);
        let mut admittance: TableAdmittance = tester::get_TableAdmittance(world, tables::LORDS);
        tester::execute_admin_set_table_admittance(admin, OTHER(), admittance);
    }

    #[test]
    #[should_panic(expected:('ADMIN: Invalid table', 'ENTRYPOINT_FAILED'))]
    fn test_set_table_admittance_zero() {
        let (world, _system, admin, _lords, _minter) = tester::setup_world(flags::ADMIN);
        let mut admittance: TableAdmittance = tester::get_TableAdmittance(world, tables::LORDS);
        admittance.table_id = 0;
        tester::execute_admin_set_table_admittance(admin, OWNER(), admittance);
    }

    #[test]
    #[should_panic(expected:('ADMIN: Invalid table', 'ENTRYPOINT_FAILED'))]
    fn test_set_table_admittance_invalid() {
        let (world, _system, admin, _lords, _minter) = tester::setup_world(flags::ADMIN);
        let mut admittance: TableAdmittance = tester::get_TableAdmittance(world, tables::LORDS);
        admittance.table_id = INVALID_TABLE;
        tester::execute_admin_set_table_admittance(admin, OWNER(), admittance);
    }


}
