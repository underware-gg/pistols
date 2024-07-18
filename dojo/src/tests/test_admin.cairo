#[cfg(test)]
mod tests {
    use debug::PrintTrait;
    use core::traits::Into;
    use starknet::{ContractAddress};

    use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

    use pistols::systems::admin::{IAdminDispatcher, IAdminDispatcherTrait};
    use pistols::models::config::{Config};
    use pistols::models::table::{TableConfig, tables};
    use pistols::types::constants::{constants};
    use pistols::tests::tester::{tester, tester::{flags, ZERO, OWNER, OTHER, BUMMER, TREASURY}};

    const INVALID_TABLE: felt252 = 'TheBookIsOnTheTable';

    //
    // Initialize
    //

    #[test]
    fn test_initialize_defaults() {
        let (world, _system, admin, _lords, _minter) = tester::setup_world(flags::ADMIN | 0 | 0 | 0);
        let config: Config = admin.get_config();
        assert(config.initialized == false, 'initialized == false');
        tester::execute_admin_initialize(admin, OWNER(), ZERO(), ZERO(), ZERO(), ZERO(), ZERO());
        let config: Config = admin.get_config();
        assert(config.initialized == true, 'initialized == true');
        assert(config.owner_address == OWNER(), 'owner_address');
        assert(config.treasury_address == OWNER(), 'treasury_address');
        assert(config.paused == false, 'paused');
        // get
        let get_config: Config = tester::get_Config(world);
        assert(config.initialized == get_config.initialized, 'get_config.initialized');
        assert(config.owner_address == get_config.owner_address, 'get_config.owner_address');
        assert(config.treasury_address == get_config.treasury_address, 'get_config.treasury_address');
        assert(config.paused == get_config.paused, 'get_config.paused');
    }

    #[test]
    fn test_set_owner_defaults() {
        let (_world, _system, admin, _lords, _minter) = tester::setup_world(flags::ADMIN | 0 | 0 | 0);
        tester::execute_admin_initialize(admin, OWNER(), ZERO(), ZERO(), ZERO(), ZERO(), ZERO());
        let config: Config = admin.get_config();
        assert(config.owner_address == OWNER(), 'owner_address_param');
        // set
        let new_owner: ContractAddress = starknet::contract_address_const::<0x121212>();
        tester::execute_admin_set_owner(admin, OWNER(), new_owner);
        let config: Config = admin.get_config();
        assert(config.owner_address == new_owner, 'set_owner_new');
        // set
        tester::execute_admin_set_owner(admin, new_owner, BUMMER());
        let config: Config = admin.get_config();
        assert(config.owner_address == BUMMER(), 'owner_address_newer');
    }

    #[test]
    fn test_set_owner() {
        let (_world, _system, admin, _lords, _minter) = tester::setup_world(flags::ADMIN | 0 | 0 | 0);
        tester::execute_admin_initialize(admin, OWNER(), OTHER(), ZERO(), ZERO(), ZERO(), ZERO());
        let config: Config = admin.get_config();
        assert(config.owner_address == OTHER(), 'owner_address_param');
        // set
        tester::execute_admin_set_owner(admin, OTHER(), BUMMER());
        let config: Config = admin.get_config();
        assert(config.owner_address == BUMMER(), 'set_owner_new');
    }

    #[test]
    fn test_set_treasury() {
        let (_world, _system, admin, _lords, _minter) = tester::setup_world(flags::ADMIN | 0 | 0 | 0);
        tester::execute_admin_initialize(admin, OWNER(), ZERO(), OTHER(), ZERO(), ZERO(), ZERO());
        let config: Config = admin.get_config();
        assert(config.treasury_address == OTHER(), 'treasury_address_param');
        // set
        let new_treasury: ContractAddress = starknet::contract_address_const::<0x121212>();
        tester::execute_admin_set_treasury(admin, OWNER(), new_treasury);
        let config: Config = admin.get_config();
        assert(config.treasury_address == new_treasury, 'set_treasury_new');
        // set
        tester::execute_admin_set_treasury(admin, OWNER(), BUMMER());
        let config: Config = admin.get_config();
        assert(config.treasury_address == BUMMER(), 'treasury_address_newer');
    }

    #[test]
    #[should_panic(expected:('ADMIN: Invalid owner_address', 'ENTRYPOINT_FAILED'))]
    fn test_set_owner_null() {
        let (_world, _system, admin, _lords, _minter) = tester::setup_world(flags::ADMIN | 0 | 0 | 0);
        tester::execute_admin_initialize(admin, OWNER(), ZERO(), ZERO(), ZERO(), ZERO(), ZERO());
        tester::execute_admin_set_owner(admin, OWNER(), ZERO());
    }

    #[test]
    #[should_panic(expected:('ADMIN: Invalid treasury_address', 'ENTRYPOINT_FAILED'))]
    fn test_set_treasury_null() {
        let (_world, _system, admin, _lords, _minter) = tester::setup_world(flags::ADMIN | 0 | 0 | 0);
        tester::execute_admin_initialize(admin, OWNER(), ZERO(), ZERO(), ZERO(), ZERO(), ZERO());
        tester::execute_admin_set_treasury(admin, OWNER(), ZERO());
    }

    #[test]
    fn test_set_paused() {
        let (_world, _system, admin, _lords, _minter) = tester::setup_world(flags::ADMIN | 0 | 0 | 0);
        tester::execute_admin_initialize(admin, OWNER(), ZERO(), ZERO(), ZERO(), ZERO(), ZERO());
        let config: Config = admin.get_config();
        assert(config.paused == false, 'paused_1');
        // set
        tester::execute_admin_set_paused(admin, OWNER(), true);
        let config: Config = admin.get_config();
        assert(config.paused == true, 'paused_2');
        // set
        tester::execute_admin_set_paused(admin, OWNER(), false);
        let config: Config = admin.get_config();
        assert(config.paused == false, 'paused_3');
    }

    #[test]
    #[should_panic(expected:('ADMIN: Already initialized', 'ENTRYPOINT_FAILED'))]
    fn test_initialized() {
        let (_world, _system, admin, _lords, _minter) = tester::setup_world(flags::ADMIN | 0 | 0 | 0);
        tester::execute_admin_initialize(admin, OWNER(), ZERO(), ZERO(), ZERO(), ZERO(), ZERO());
        tester::execute_admin_initialize(admin, OWNER(), ZERO(), ZERO(), ZERO(), ZERO(), ZERO());
    }

    #[test]
    #[should_panic(expected:('ADMIN: Not initialized', 'ENTRYPOINT_FAILED'))]
    fn test_set_owner_not_initialized() {
        let (_world, _system, admin, _lords, _minter) = tester::setup_world(flags::ADMIN | 0 | 0 | 0);
        tester::execute_admin_set_owner(admin, OWNER(), ZERO());
    }

    #[test]
    #[should_panic(expected:('ADMIN: Not initialized', 'ENTRYPOINT_FAILED'))]
    fn test_set_treasury_not_initialized() {
        let (_world, _system, admin, _lords, _minter) = tester::setup_world(flags::ADMIN | 0 | 0 | 0);
        tester::execute_admin_set_treasury(admin, OWNER(), ZERO());
    }

    #[test]
    #[should_panic(expected:('ADMIN: Not deployer', 'ENTRYPOINT_FAILED'))]
    fn test_initialize_not_deployer() {
        let (_world, _system, admin, _lords, _minter) = tester::setup_world(flags::ADMIN | 0 | 0 | 0);
        tester::execute_admin_initialize(admin, OTHER(), ZERO(), ZERO(), ZERO(), ZERO(), ZERO());
    }

    #[test]
    #[should_panic(expected:('ADMIN: Not owner', 'ENTRYPOINT_FAILED'))]
    fn test_set_owner_not_owner() {
        let (_world, _system, admin, _lords, _minter) = tester::setup_world(flags::ADMIN | 0 | 0 | 0);
        tester::execute_admin_initialize(admin, OWNER(), ZERO(), ZERO(), ZERO(), ZERO(), ZERO());
        let new_treasury: ContractAddress = starknet::contract_address_const::<0x121212>();
        tester::execute_admin_set_owner(admin, OTHER(), new_treasury);
    }

    #[test]
    #[should_panic(expected:('ADMIN: Not owner', 'ENTRYPOINT_FAILED'))]
    fn test_set_treasury_not_owner() {
        let (_world, _system, admin, _lords, _minter) = tester::setup_world(flags::ADMIN | 0 | 0 | 0);
        tester::execute_admin_initialize(admin, OWNER(), ZERO(), ZERO(), ZERO(), ZERO(), ZERO());
        let new_treasury: ContractAddress = starknet::contract_address_const::<0x121212>();
        tester::execute_admin_set_treasury(admin, OTHER(), new_treasury);
    }

    #[test]
    #[should_panic(expected:('ADMIN: Not owner', 'ENTRYPOINT_FAILED'))]
    fn test_set_paused_not_owner() {
        let (_world, _system, admin, _lords, _minter) = tester::setup_world(flags::ADMIN | 0 | 0 | 0);
        tester::execute_admin_initialize(admin, OWNER(), ZERO(), ZERO(), ZERO(), ZERO(), ZERO());
        tester::execute_admin_set_paused(admin, OTHER(), true);
    }

    //
    // Tables
    //

    #[test]
    fn test_initialize_table_defaults() {
        let (_world, _system, admin, _lords, _minter) = tester::setup_world(flags::ADMIN | 0 | 0 | 0);
        tester::execute_admin_initialize(admin, OWNER(), ZERO(), ZERO(), ZERO(), ZERO(), ZERO());
        let table: TableConfig = admin.get_table(tables::LORDS);
        assert(table.wager_contract_address == ZERO(), 'contract_address');
        assert(table.is_open == false, 'is_open');
    }

    #[test]
    fn test_initialize_table() {
        let (_world, _system, admin, lords, _minter) = tester::setup_world(flags::ADMIN | flags::LORDS | 0 | 0);
        tester::execute_admin_initialize(admin, OWNER(), ZERO(), ZERO(), lords.contract_address, ZERO(), ZERO());
        let table: TableConfig = admin.get_table(tables::LORDS);
        assert(table.wager_contract_address == lords.contract_address, 'contract_address');
        assert(table.fee_min == 4 * constants::ETH_TO_WEI, 'fee_min');
        assert(table.fee_pct == 10, 'fee_pct');
        assert(table.is_open == true, 'is_open');
    }

    #[test]
    fn test_set_table() {
        let (world, _system, admin, lords, _minter) = tester::setup_world(flags::ADMIN | flags::LORDS | 0 | 0);
        // not initialized
        tester::execute_admin_initialize(admin, OWNER(), ZERO(), ZERO(), ZERO(), ZERO(), ZERO());
        let table: TableConfig = admin.get_table(tables::LORDS);
        assert(table.wager_contract_address == ZERO(), 'zero');
        assert(table.is_open == false, 'zero');
        // set
        tester::execute_admin_set_table(admin, OWNER(), tables::LORDS, lords.contract_address, 'LORDS+', 5, 10, true);
        let table: TableConfig = admin.get_table(tables::LORDS);
        assert(table.wager_contract_address == lords.contract_address, 'contract_address_1');
        assert(table.description == 'LORDS+', 'description_1');
        assert(table.fee_min == 5, 'fee_min_1');
        assert(table.fee_pct == 10, 'fee_pct_1');
        assert(table.is_open == true, 'is_open_1');
        // set
        tester::execute_admin_set_table(admin, OWNER(), tables::LORDS, OTHER(), 'LORDS+++', 22, 33, false);
        let table: TableConfig = admin.get_table(tables::LORDS);
        assert(table.wager_contract_address == OTHER(), 'contract_address_2');
        assert(table.description == 'LORDS+++', 'description_2');
        assert(table.fee_min == 22, 'fee_min_2');
        assert(table.fee_pct == 33, 'fee_pct_2');
        assert(table.is_open == false, 'is_open_2');
        // get
        let table: TableConfig = tester::get_Table(world, tables::LORDS);
        assert(table.wager_contract_address == table.wager_contract_address, 'get_table.wager_address');
        assert(table.fee_min == table.fee_min, 'get_table.fee_min');
        assert(table.fee_pct == table.fee_pct, 'get_table.fee_pct');
        assert(table.is_open == table.is_open, 'get_table.is_open');
    }

    #[test]
    #[should_panic(expected:('ADMIN: Invalid table', 'ENTRYPOINT_FAILED'))]
    fn test_set_table_count() {
        let (_world, _system, admin, _lords, _minter) = tester::setup_world(flags::ADMIN | 0 | flags::INITIALIZE | 0);
        let _table: TableConfig = admin.get_table(INVALID_TABLE);
        // assert(table.wager_contract_address == lords.contract_address, 'zero');
        // // set must work
        // tester::execute_admin_set_table(admin, OWNER(), INVALID_TABLE, BUMMER(), 'LORDS+', 5, 10, true);
        // let table: TableConfig = admin.get_table(INVALID_TABLE);
        // assert(table.wager_contract_address == BUMMER(), 'contract_address');
        // assert(table.description == 'LORDS+', 'description');
        // assert(table.fee_min == 5, 'fee_min');
        // assert(table.fee_pct == 10, 'fee_pct');
        // assert(table.is_open == true, 'is_open');
    }

    #[test]
    fn test_open_table() {
        let (_world, _system, admin, lords, _minter) = tester::setup_world(0 | flags::LORDS | flags::INITIALIZE | 0);
        tester::execute_admin_set_table(admin, OWNER(), tables::LORDS, lords.contract_address, 'LORDS+', 5, 10, false);
        let table: TableConfig = admin.get_table(tables::LORDS);
        assert(table.is_open == false, 'is_open_1');
        tester::execute_admin_open_table(admin, OWNER(), tables::LORDS, true);
        let table: TableConfig = admin.get_table(tables::LORDS);
        assert(table.is_open == true, 'is_open_2');
        tester::execute_admin_open_table(admin, OWNER(), tables::LORDS, false);
        let table: TableConfig = admin.get_table(tables::LORDS);
        assert(table.is_open == false, 'is_open_3');
    }

    #[test]
    #[should_panic(expected:('ADMIN: Not owner', 'ENTRYPOINT_FAILED'))]
    fn test_set_table_not_owner() {
        let (_world, _system, admin, lords, _minter) = tester::setup_world(0 | flags::LORDS | flags::INITIALIZE | 0);
        tester::execute_admin_set_table(admin, OTHER(), tables::LORDS, lords.contract_address, 'LORDS+', 5, 10, true);
    }

    #[test]
    #[should_panic(expected:('ADMIN: Not owner', 'ENTRYPOINT_FAILED'))]
    fn test_open_table_not_owner() {
        let (_world, _system, admin, _lords, _minter) = tester::setup_world(flags::ADMIN | 0 | flags::INITIALIZE | 0);
        tester::execute_admin_open_table(admin, OTHER(), tables::LORDS, true);
    }

    #[test]
    #[should_panic(expected:('ADMIN: Invalid table', 'ENTRYPOINT_FAILED'))]
    fn test_set_table_zero() {
        let (_world, _system, admin, lords, _minter) = tester::setup_world(0 | flags::LORDS | flags::INITIALIZE | 0);
        tester::execute_admin_set_table(admin, OWNER(), 0, lords.contract_address, 'LORDS+', 5, 10, true);
    }

    #[test]
    #[should_panic(expected:('ADMIN: Invalid table', 'ENTRYPOINT_FAILED'))]
    fn test_set_table_invalid() {
        let (_world, _system, admin, lords, _minter) = tester::setup_world(0 | flags::LORDS | flags::INITIALIZE | 0);
        tester::execute_admin_set_table(admin, OWNER(), INVALID_TABLE, lords.contract_address, 'LORDS+', 5, 10, true);
    }

    #[test]
    #[should_panic(expected:('ADMIN: Invalid table', 'ENTRYPOINT_FAILED'))]
    fn test_open_table_zero() {
        let (_world, _system, admin, _lords, _minter) = tester::setup_world(flags::ADMIN | 0 | flags::INITIALIZE | 0);
        tester::execute_admin_open_table(admin, OWNER(), 0, false);
    }

    #[test]
    #[should_panic(expected:('ADMIN: Invalid table', 'ENTRYPOINT_FAILED'))]
    fn test_open_table_invalid() {
        let (_world, _system, admin, _lords, _minter) = tester::setup_world(flags::ADMIN | 0 | flags::INITIALIZE | 0);
        tester::execute_admin_open_table(admin, OWNER(), INVALID_TABLE, false);
    }


}
