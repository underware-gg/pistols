#[cfg(test)]
mod tests {
    use debug::PrintTrait;
    use core::traits::Into;
    use starknet::{ContractAddress};

    use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

    use pistols::systems::admin::{IAdminDispatcher, IAdminDispatcherTrait};
    use pistols::models::config::{Config};
    use pistols::models::table::{TableConfig, tables};
    use pistols::libs::utils::{ZERO};
    use pistols::types::constants::{constants};
    use pistols::tests::tester::{tester};

    const INVALID_TABLE: felt252 = 'TheBookIsOnTheTable';

    //
    // Initialize
    //

    #[test]
    #[available_gas(1_000_000_000)]
    // #[should_panic(expected:('ADMIN: Not initialized', 'ENTRYPOINT_FAILED'))]
    fn test_initialize_defaults() {
        let (world, _system, admin, _lords, _ierc20, owner, _other, _bummer, _treasury) = tester::setup_world(false, false);
        let config: Config = admin.get_config();
        assert(config.initialized == false, 'initialized == false');
        tester::execute_admin_initialize(admin, owner, ZERO(), ZERO(), ZERO());
        let config: Config = admin.get_config();
        assert(config.initialized == true, 'initialized == true');
        assert(config.owner_address == owner, 'owner_address');
        assert(config.treasury_address == owner, 'treasury_address');
        assert(config.paused == false, 'paused');
        // get
        let get_config: Config = tester::get_Config(world);
        assert(config.initialized == get_config.initialized, 'get_config.initialized');
        assert(config.owner_address == get_config.owner_address, 'get_config.owner_address');
        assert(config.treasury_address == get_config.treasury_address, 'get_config.treasury_address');
        assert(config.paused == get_config.paused, 'get_config.paused');
    }

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_set_owner_defaults() {
        let (_world, _system, admin, _lords, _ierc20, owner, _other, bummer, _treasury) = tester::setup_world(false, false);
        tester::execute_admin_initialize(admin, owner, ZERO(), ZERO(), ZERO());
        let config: Config = admin.get_config();
        assert(config.owner_address == owner, 'owner_address_param');
        // set
        let new_owner: ContractAddress = starknet::contract_address_const::<0x121212>();
        tester::execute_admin_set_owner(admin, owner, new_owner);
        let config: Config = admin.get_config();
        assert(config.owner_address == new_owner, 'set_owner_new');
        // set
        tester::execute_admin_set_owner(admin, new_owner, bummer);
        let config: Config = admin.get_config();
        assert(config.owner_address == bummer, 'owner_address_newer');
    }

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_set_owner() {
        let (_world, _system, admin, _lords, _ierc20, owner, other, bummer, _treasury) = tester::setup_world(false, false);
        tester::execute_admin_initialize(admin, owner, other, ZERO(), ZERO());
        let config: Config = admin.get_config();
        assert(config.owner_address == other, 'owner_address_param');
        // set
        tester::execute_admin_set_owner(admin, other, bummer);
        let config: Config = admin.get_config();
        assert(config.owner_address == bummer, 'set_owner_new');
    }

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_set_treasury() {
        let (_world, _system, admin, _lords, _ierc20, owner, other, bummer, _treasury) = tester::setup_world(false, false);
        tester::execute_admin_initialize(admin, owner, ZERO(), other, ZERO());
        let config: Config = admin.get_config();
        assert(config.treasury_address == other, 'treasury_address_param');
        // set
        let new_treasury: ContractAddress = starknet::contract_address_const::<0x121212>();
        tester::execute_admin_set_treasury(admin, owner, new_treasury);
        let config: Config = admin.get_config();
        assert(config.treasury_address == new_treasury, 'set_treasury_new');
        // set
        tester::execute_admin_set_treasury(admin, owner, bummer);
        let config: Config = admin.get_config();
        assert(config.treasury_address == bummer, 'treasury_address_newer');
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('ADMIN: Invalid owner_address', 'ENTRYPOINT_FAILED'))]
    fn test_set_owner_null() {
        let (_world, _system, admin, _lords, _ierc20, owner, _other, _bummer, _treasury) = tester::setup_world(false, false);
        tester::execute_admin_initialize(admin, owner, ZERO(), ZERO(), ZERO());
        tester::execute_admin_set_owner(admin, owner, ZERO());
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('ADMIN: Invalid treasury_address', 'ENTRYPOINT_FAILED'))]
    fn test_set_treasury_null() {
        let (_world, _system, admin, _lords, _ierc20, owner, _other, _bummer, _treasury) = tester::setup_world(false, false);
        tester::execute_admin_initialize(admin, owner, ZERO(), ZERO(), ZERO());
        tester::execute_admin_set_treasury(admin, owner, ZERO());
    }

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_set_paused() {
        let (_world, _system, admin, _lords, _ierc20, owner, _other, _bummer, _treasury) = tester::setup_world(false, false);
        tester::execute_admin_initialize(admin, owner, ZERO(), ZERO(), ZERO());
        let config: Config = admin.get_config();
        assert(config.paused == false, 'paused_1');
        // set
        tester::execute_admin_set_paused(admin, owner, true);
        let config: Config = admin.get_config();
        assert(config.paused == true, 'paused_2');
        // set
        tester::execute_admin_set_paused(admin, owner, false);
        let config: Config = admin.get_config();
        assert(config.paused == false, 'paused_3');
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('ADMIN: Already initialized', 'ENTRYPOINT_FAILED'))]
    fn test_initialized() {
        let (_world, _system, admin, _lords, _ierc20, owner, _other, _bummer, _treasury) = tester::setup_world(false, false);
        tester::execute_admin_initialize(admin, owner, ZERO(), ZERO(), ZERO());
        tester::execute_admin_initialize(admin, owner, ZERO(), ZERO(), ZERO());
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('ADMIN: Not initialized', 'ENTRYPOINT_FAILED'))]
    fn test_set_owner_not_initialized() {
        let (_world, _system, admin, _lords, _ierc20, owner, _other, _bummer, _treasury) = tester::setup_world(false, false);
        tester::execute_admin_set_owner(admin, owner, ZERO());
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('ADMIN: Not initialized', 'ENTRYPOINT_FAILED'))]
    fn test_set_treasury_not_initialized() {
        let (_world, _system, admin, _lords, _ierc20, owner, _other, _bummer, _treasury) = tester::setup_world(false, false);
        tester::execute_admin_set_treasury(admin, owner, ZERO());
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('ADMIN: Not deployer', 'ENTRYPOINT_FAILED'))]
    fn test_initialize_not_deployer() {
        let (_world, _system, admin, _lords, _ierc20, _owner, other, _bummer, _treasury) = tester::setup_world(false, false);
        tester::execute_admin_initialize(admin, other, ZERO(), ZERO(), ZERO());
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('ADMIN: Not owner', 'ENTRYPOINT_FAILED'))]
    fn test_set_owner_not_owner() {
        let (_world, _system, admin, _lords, _ierc20, owner, other, _bummer, _treasury) = tester::setup_world(false, false);
        tester::execute_admin_initialize(admin, owner, ZERO(), ZERO(), ZERO());
        let new_treasury: ContractAddress = starknet::contract_address_const::<0x121212>();
        tester::execute_admin_set_owner(admin, other, new_treasury);
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('ADMIN: Not owner', 'ENTRYPOINT_FAILED'))]
    fn test_set_treasury_not_owner() {
        let (_world, _system, admin, _lords, _ierc20, owner, other, _bummer, _treasury) = tester::setup_world(false, false);
        tester::execute_admin_initialize(admin, owner, ZERO(), ZERO(), ZERO());
        let new_treasury: ContractAddress = starknet::contract_address_const::<0x121212>();
        tester::execute_admin_set_treasury(admin, other, new_treasury);
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('ADMIN: Not owner', 'ENTRYPOINT_FAILED'))]
    fn test_set_paused_not_owner() {
        let (_world, _system, admin, _lords, _ierc20, owner, other, _bummer, _treasury) = tester::setup_world(false, false);
        tester::execute_admin_initialize(admin, owner, ZERO(), ZERO(), ZERO());
        tester::execute_admin_set_paused(admin, other, true);
    }

    //
    // Tables
    //

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_initialize_table_defaults() {
        let (_world, _system, admin, _lords, _ierc20, owner, _other, _bummer, _treasury) = tester::setup_world(false, false);
        tester::execute_admin_initialize(admin, owner, ZERO(), ZERO(), ZERO());
        let table: TableConfig = admin.get_table(tables::LORDS);
        assert(table.contract_address == ZERO(), 'contract_address');
        assert(table.is_open == false, 'enabled');
    }

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_initialize_table() {
        let (_world, _system, admin, lords, _ierc20, owner, _other, _bummer, _treasury) = tester::setup_world(false, false);
        tester::execute_admin_initialize(admin, owner, ZERO(), ZERO(), lords.contract_address);
        let table: TableConfig = admin.get_table(tables::LORDS);
        assert(table.contract_address == lords.contract_address, 'contract_address');
        assert(table.fee_min == 4 * constants::ETH_TO_WEI, 'fee_min');
        assert(table.fee_pct == 10, 'fee_pct');
        assert(table.is_open == true, 'enabled');
    }

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_set_table() {
        let (world, _system, admin, lords, _ierc20, owner, other, _bummer, _treasury) = tester::setup_world(false, false);
        // not initialized
        tester::execute_admin_initialize(admin, owner, ZERO(), ZERO(), ZERO());
        let table: TableConfig = admin.get_table(tables::LORDS);
        assert(table.contract_address == ZERO(), 'zero');
        assert(table.is_open == false, 'zero');
        // set
        tester::execute_admin_set_table(admin, owner, tables::LORDS, lords.contract_address, 'LORDS+', 5, 10, true);
        let table: TableConfig = admin.get_table(tables::LORDS);
        assert(table.contract_address == lords.contract_address, 'contract_address_1');
        assert(table.description == 'LORDS+', 'description_1');
        assert(table.fee_min == 5, 'fee_min_1');
        assert(table.fee_pct == 10, 'fee_pct_1');
        assert(table.is_open == true, 'enabled_1');
        // set
        tester::execute_admin_set_table(admin, owner, tables::LORDS, other, 'LORDS+++', 22, 33, false);
        let table: TableConfig = admin.get_table(tables::LORDS);
        assert(table.contract_address == other, 'contract_address_2');
        assert(table.description == 'LORDS+++', 'description_2');
        assert(table.fee_min == 22, 'fee_min_2');
        assert(table.fee_pct == 33, 'fee_pct_2');
        assert(table.is_open == false, 'enabled_2');
        // get
        let table: TableConfig = tester::get_Table(world, tables::LORDS);
        assert(table.contract_address == table.contract_address, 'get_table.contract_address');
        assert(table.fee_min == table.fee_min, 'get_table.fee_min');
        assert(table.fee_pct == table.fee_pct, 'get_table.fee_pct');
        assert(table.is_open == table.is_open, 'get_table.is_open');
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('ADMIN: Invalid table', 'ENTRYPOINT_FAILED'))]
    fn test_set_table_count() {
        let (_world, _system, admin, _lords, _ierc20, _owner, _other, _bummer, _treasury) = tester::setup_world(true, false);
        let _table: TableConfig = admin.get_table(INVALID_TABLE);
        // assert(table.contract_address == lords.contract_address, 'zero');
        // // set must work
        // tester::execute_admin_set_table(admin, owner, INVALID_TABLE, bummer, 'LORDS+', 5, 10, true);
        // let table: TableConfig = admin.get_table(INVALID_TABLE);
        // assert(table.contract_address == bummer, 'contract_address');
        // assert(table.description == 'LORDS+', 'description');
        // assert(table.fee_min == 5, 'fee_min');
        // assert(table.fee_pct == 10, 'fee_pct');
        // assert(table.is_open == true, 'enabled');
    }

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_enable_table_count() {
        let (_world, _system, admin, lords, _ierc20, owner, _other, _bummer, _treasury) = tester::setup_world(true, false);
        tester::execute_admin_set_table(admin, owner, tables::LORDS, lords.contract_address, 'LORDS+', 5, 10, false);
        let table: TableConfig = admin.get_table(tables::LORDS);
        assert(table.is_open == false, 'enabled_1');
        tester::execute_admin_enable_table(admin, owner, tables::LORDS, true);
        let table: TableConfig = admin.get_table(tables::LORDS);
        assert(table.is_open == true, 'enabled_2');
        tester::execute_admin_enable_table(admin, owner, tables::LORDS, false);
        let table: TableConfig = admin.get_table(tables::LORDS);
        assert(table.is_open == false, 'enabled_3');
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('ADMIN: Not owner', 'ENTRYPOINT_FAILED'))]
    fn test_set_table_not_owner() {
        let (_world, _system, admin, lords, _ierc20, _owner, other, _bummer, _treasury) = tester::setup_world(true, false);
        tester::execute_admin_set_table(admin, other, tables::LORDS, lords.contract_address, 'LORDS+', 5, 10, true);
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('ADMIN: Not owner', 'ENTRYPOINT_FAILED'))]
    fn test_enable_table_not_owner() {
        let (_world, _system, admin, _lords, _ierc20, _owner, other, _bummer, _treasury) = tester::setup_world(true, false);
        tester::execute_admin_enable_table(admin, other, tables::LORDS, true);
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('ADMIN: Invalid table', 'ENTRYPOINT_FAILED'))]
    fn test_set_table_zero() {
        let (_world, _system, admin, lords, _ierc20, owner, _other, _bummer, _treasury) = tester::setup_world(true, false);
        tester::execute_admin_set_table(admin, owner, 0, lords.contract_address, 'LORDS+', 5, 10, true);
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('ADMIN: Invalid table', 'ENTRYPOINT_FAILED'))]
    fn test_set_table_invalid() {
        let (_world, _system, admin, lords, _ierc20, owner, _other, _bummer, _treasury) = tester::setup_world(true, false);
        tester::execute_admin_set_table(admin, owner, INVALID_TABLE, lords.contract_address, 'LORDS+', 5, 10, true);
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('ADMIN: Invalid table', 'ENTRYPOINT_FAILED'))]
    fn test_enable_table_zero() {
        let (_world, _system, admin, _lords, _ierc20, owner, _other, _bummer, _treasury) = tester::setup_world(true, false);
        tester::execute_admin_enable_table(admin, owner, 0, false);
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('ADMIN: Invalid table', 'ENTRYPOINT_FAILED'))]
    fn test_enable_table_invalid() {
        let (_world, _system, admin, _lords, _ierc20, owner, _other, _bummer, _treasury) = tester::setup_world(true, false);
        tester::execute_admin_enable_table(admin, owner, INVALID_TABLE, false);
    }


}
