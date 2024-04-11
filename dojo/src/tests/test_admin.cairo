#[cfg(test)]
mod tests {
    use debug::PrintTrait;
    use core::traits::Into;
    use starknet::{ContractAddress};

    use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

    use pistols::systems::admin::{IAdminDispatcher, IAdminDispatcherTrait};
    use pistols::models::config::{Config};
    use pistols::models::coins::{Coin, coins, ETH_TO_WEI};
    use pistols::systems::utils::{zero_address};
    use pistols::tests::utils::{utils};

    //
    // Initialize
    //

    #[test]
    #[available_gas(1_000_000_000)]
    // #[should_panic(expected:('Not initialized','ENTRYPOINT_FAILED'))]
    fn test_initialize_defaults() {
        let (world, _system, admin, _lords, _ierc20, owner, _other, _bummer, _treasury) = utils::setup_world(false, false);
        let config: Config = admin.get_config();
        assert(config.initialized == false, 'initialized == false');
        utils::execute_admin_initialize(admin, owner, zero_address(), zero_address(), zero_address());
        let config: Config = admin.get_config();
        assert(config.initialized == true, 'initialized == true');
        assert(config.owner_address == owner, 'owner_address');
        assert(config.treasury_address == owner, 'treasury_address');
        assert(config.paused == false, 'paused');
        // get
        let get_config: Config = utils::get_Config(world);
        assert(config.initialized == get_config.initialized, 'get_config.initialized');
        assert(config.owner_address == get_config.owner_address, 'get_config.owner_address');
        assert(config.treasury_address == get_config.treasury_address, 'get_config.treasury_address');
        assert(config.paused == get_config.paused, 'get_config.paused');
    }

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_set_owner_defaults() {
        let (_world, _system, admin, _lords, _ierc20, owner, _other, bummer, _treasury) = utils::setup_world(false, false);
        utils::execute_admin_initialize(admin, owner, zero_address(), zero_address(), zero_address());
        let config: Config = admin.get_config();
        assert(config.owner_address == owner, 'owner_address_param');
        // set
        let new_owner: ContractAddress = starknet::contract_address_const::<0x121212>();
        utils::execute_admin_set_owner(admin, owner, new_owner);
        let config: Config = admin.get_config();
        assert(config.owner_address == new_owner, 'set_owner_new');
        // set
        utils::execute_admin_set_owner(admin, new_owner, bummer);
        let config: Config = admin.get_config();
        assert(config.owner_address == bummer, 'owner_address_newer');
    }

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_set_owner() {
        let (_world, _system, admin, _lords, _ierc20, owner, other, bummer, _treasury) = utils::setup_world(false, false);
        utils::execute_admin_initialize(admin, owner, other, zero_address(), zero_address());
        let config: Config = admin.get_config();
        assert(config.owner_address == other, 'owner_address_param');
        // set
        utils::execute_admin_set_owner(admin, other, bummer);
        let config: Config = admin.get_config();
        assert(config.owner_address == bummer, 'set_owner_new');
    }

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_set_treasury() {
        let (_world, _system, admin, _lords, _ierc20, owner, other, bummer, _treasury) = utils::setup_world(false, false);
        utils::execute_admin_initialize(admin, owner, zero_address(), other, zero_address());
        let config: Config = admin.get_config();
        assert(config.treasury_address == other, 'treasury_address_param');
        // set
        let new_treasury: ContractAddress = starknet::contract_address_const::<0x121212>();
        utils::execute_admin_set_treasury(admin, owner, new_treasury);
        let config: Config = admin.get_config();
        assert(config.treasury_address == new_treasury, 'set_treasury_new');
        // set
        utils::execute_admin_set_treasury(admin, owner, bummer);
        let config: Config = admin.get_config();
        assert(config.treasury_address == bummer, 'treasury_address_newer');
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('Null owner_address','ENTRYPOINT_FAILED'))]
    fn test_set_owner_null() {
        let (_world, _system, admin, _lords, _ierc20, owner, _other, _bummer, _treasury) = utils::setup_world(false, false);
        utils::execute_admin_initialize(admin, owner, zero_address(), zero_address(), zero_address());
        utils::execute_admin_set_owner(admin, owner, zero_address());
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('Null treasury_address','ENTRYPOINT_FAILED'))]
    fn test_set_treasury_null() {
        let (_world, _system, admin, _lords, _ierc20, owner, _other, _bummer, _treasury) = utils::setup_world(false, false);
        utils::execute_admin_initialize(admin, owner, zero_address(), zero_address(), zero_address());
        utils::execute_admin_set_treasury(admin, owner, zero_address());
    }

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_set_paused() {
        let (_world, _system, admin, _lords, _ierc20, owner, _other, _bummer, _treasury) = utils::setup_world(false, false);
        utils::execute_admin_initialize(admin, owner, zero_address(), zero_address(), zero_address());
        let config: Config = admin.get_config();
        assert(config.paused == false, 'paused_1');
        // set
        utils::execute_admin_set_paused(admin, owner, true);
        let config: Config = admin.get_config();
        assert(config.paused == true, 'paused_2');
        // set
        utils::execute_admin_set_paused(admin, owner, false);
        let config: Config = admin.get_config();
        assert(config.paused == false, 'paused_3');
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('Already initialized','ENTRYPOINT_FAILED'))]
    fn test_initialized() {
        let (_world, _system, admin, _lords, _ierc20, owner, _other, _bummer, _treasury) = utils::setup_world(false, false);
        utils::execute_admin_initialize(admin, owner, zero_address(), zero_address(), zero_address());
        utils::execute_admin_initialize(admin, owner, zero_address(), zero_address(), zero_address());
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('Not initialized','ENTRYPOINT_FAILED'))]
    fn test_set_owner_not_initialized() {
        let (_world, _system, admin, _lords, _ierc20, owner, _other, _bummer, _treasury) = utils::setup_world(false, false);
        utils::execute_admin_set_owner(admin, owner, zero_address());
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('Not initialized','ENTRYPOINT_FAILED'))]
    fn test_set_treasury_not_initialized() {
        let (_world, _system, admin, _lords, _ierc20, owner, _other, _bummer, _treasury) = utils::setup_world(false, false);
        utils::execute_admin_set_treasury(admin, owner, zero_address());
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('Not deployer','ENTRYPOINT_FAILED'))]
    fn test_initialize_not_deployer() {
        let (_world, _system, admin, _lords, _ierc20, _owner, other, _bummer, _treasury) = utils::setup_world(false, false);
        utils::execute_admin_initialize(admin, other, zero_address(), zero_address(), zero_address());
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('Not owner','ENTRYPOINT_FAILED'))]
    fn test_set_owner_not_owner() {
        let (_world, _system, admin, _lords, _ierc20, owner, other, _bummer, _treasury) = utils::setup_world(false, false);
        utils::execute_admin_initialize(admin, owner, zero_address(), zero_address(), zero_address());
        let new_treasury: ContractAddress = starknet::contract_address_const::<0x121212>();
        utils::execute_admin_set_owner(admin, other, new_treasury);
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('Not owner','ENTRYPOINT_FAILED'))]
    fn test_set_treasury_not_owner() {
        let (_world, _system, admin, _lords, _ierc20, owner, other, _bummer, _treasury) = utils::setup_world(false, false);
        utils::execute_admin_initialize(admin, owner, zero_address(), zero_address(), zero_address());
        let new_treasury: ContractAddress = starknet::contract_address_const::<0x121212>();
        utils::execute_admin_set_treasury(admin, other, new_treasury);
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('Not owner','ENTRYPOINT_FAILED'))]
    fn test_set_paused_not_owner() {
        let (_world, _system, admin, _lords, _ierc20, owner, other, _bummer, _treasury) = utils::setup_world(false, false);
        utils::execute_admin_initialize(admin, owner, zero_address(), zero_address(), zero_address());
        utils::execute_admin_set_paused(admin, other, true);
    }

    //
    // Coins
    //

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_initialize_coin_defaults() {
        let (_world, _system, admin, _lords, _ierc20, owner, _other, _bummer, _treasury) = utils::setup_world(false, false);
        utils::execute_admin_initialize(admin, owner, zero_address(), zero_address(), zero_address());
        let coin: Coin = admin.get_coin(coins::LORDS);
        assert(coin.contract_address == zero_address(), 'contract_address');
        assert(coin.enabled == false, 'enabled');
    }

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_initialize_coin() {
        let (_world, _system, admin, lords, _ierc20, owner, _other, _bummer, _treasury) = utils::setup_world(false, false);
        utils::execute_admin_initialize(admin, owner, zero_address(), zero_address(), lords.contract_address);
        let coin: Coin = admin.get_coin(coins::LORDS);
        assert(coin.contract_address == lords.contract_address, 'contract_address');
        assert(coin.fee_min == 4 * ETH_TO_WEI, 'fee_min');
        assert(coin.fee_pct == 10, 'fee_pct');
        assert(coin.enabled == true, 'enabled');
    }

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_set_coin() {
        let (world, _system, admin, lords, _ierc20, owner, other, _bummer, _treasury) = utils::setup_world(false, false);
        // not initialized
        utils::execute_admin_initialize(admin, owner, zero_address(), zero_address(), zero_address());
        let coin: Coin = admin.get_coin(coins::LORDS);
        assert(coin.contract_address == zero_address(), 'zero');
        assert(coin.enabled == false, 'zero');
        // set
        utils::execute_admin_set_coin(admin, owner, coins::LORDS, lords.contract_address, 'LORDS+', 5, 10, true);
        let coin: Coin = admin.get_coin(coins::LORDS);
        assert(coin.contract_address == lords.contract_address, 'contract_address_1');
        assert(coin.description == 'LORDS+', 'description_1');
        assert(coin.fee_min == 5, 'fee_min_1');
        assert(coin.fee_pct == 10, 'fee_pct_1');
        assert(coin.enabled == true, 'enabled_1');
        // set
        utils::execute_admin_set_coin(admin, owner, coins::LORDS, other, 'LORDS+++', 22, 33, false);
        let coin: Coin = admin.get_coin(coins::LORDS);
        assert(coin.contract_address == other, 'contract_address_2');
        assert(coin.description == 'LORDS+++', 'description_2');
        assert(coin.fee_min == 22, 'fee_min_2');
        assert(coin.fee_pct == 33, 'fee_pct_2');
        assert(coin.enabled == false, 'enabled_2');
        // get
        let get_coin: Coin = utils::get_Coin(world, coins::LORDS);
        assert(coin.contract_address == get_coin.contract_address, 'get_coin.contract_address');
        assert(coin.fee_min == get_coin.fee_min, 'get_coin.fee_min');
        assert(coin.fee_pct == get_coin.fee_pct, 'get_coin.fee_pct');
        assert(coin.enabled == get_coin.enabled, 'get_coin.enabled');
    }

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_set_coin_count() {
        let (_world, _system, admin, lords, _ierc20, owner, _other, bummer, _treasury) = utils::setup_world(true, false);
        let coin: Coin = admin.get_coin(coins::COUNT);
        assert(coin.contract_address == lords.contract_address, 'zero');
        // set must work
        utils::execute_admin_set_coin(admin, owner, coins::COUNT, bummer, 'LORDS+', 5, 10, true);
        let coin: Coin = admin.get_coin(coins::COUNT);
        assert(coin.contract_address == bummer, 'contract_address');
        assert(coin.description == 'LORDS+', 'description');
        assert(coin.fee_min == 5, 'fee_min');
        assert(coin.fee_pct == 10, 'fee_pct');
        assert(coin.enabled == true, 'enabled');
    }

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_enable_coin_count() {
        let (_world, _system, admin, lords, _ierc20, owner, _other, _bummer, _treasury) = utils::setup_world(true, false);
        utils::execute_admin_set_coin(admin, owner, coins::LORDS, lords.contract_address, 'LORDS+', 5, 10, false);
        let coin: Coin = admin.get_coin(coins::LORDS);
        assert(coin.enabled == false, 'enabled_1');
        utils::execute_admin_enable_coin(admin, owner, coins::LORDS, true);
        let coin: Coin = admin.get_coin(coins::LORDS);
        assert(coin.enabled == true, 'enabled_2');
        utils::execute_admin_enable_coin(admin, owner, coins::LORDS, false);
        let coin: Coin = admin.get_coin(coins::LORDS);
        assert(coin.enabled == false, 'enabled_3');
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('Not owner','ENTRYPOINT_FAILED'))]
    fn test_set_coin_not_owner() {
        let (_world, _system, admin, lords, _ierc20, _owner, other, _bummer, _treasury) = utils::setup_world(true, false);
        utils::execute_admin_set_coin(admin, other, coins::LORDS, lords.contract_address, 'LORDS+', 5, 10, true);
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('Not owner','ENTRYPOINT_FAILED'))]
    fn test_enable_coin_not_owner() {
        let (_world, _system, admin, _lords, _ierc20, _owner, other, _bummer, _treasury) = utils::setup_world(true, false);
        utils::execute_admin_enable_coin(admin, other, coins::LORDS, true);
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('Invalid coin','ENTRYPOINT_FAILED'))]
    fn test_set_coin_zero() {
        let (_world, _system, admin, lords, _ierc20, owner, _other, _bummer, _treasury) = utils::setup_world(true, false);
        utils::execute_admin_set_coin(admin, owner, 0, lords.contract_address, 'LORDS+', 5, 10, true);
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('Invalid coin','ENTRYPOINT_FAILED'))]
    fn test_set_coin_invalid() {
        let (_world, _system, admin, lords, _ierc20, owner, _other, _bummer, _treasury) = utils::setup_world(true, false);
        utils::execute_admin_set_coin(admin, owner, coins::COUNT + 1, lords.contract_address, 'LORDS+', 5, 10, true);
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('Invalid coin','ENTRYPOINT_FAILED'))]
    fn test_enable_coin_zero() {
        let (_world, _system, admin, _lords, _ierc20, owner, _other, _bummer, _treasury) = utils::setup_world(true, false);
        utils::execute_admin_enable_coin(admin, owner, 0, false);
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('Invalid coin','ENTRYPOINT_FAILED'))]
    fn test_enable_coin_invalid() {
        let (_world, _system, admin, _lords, _ierc20, owner, _other, _bummer, _treasury) = utils::setup_world(true, false);
        utils::execute_admin_enable_coin(admin, owner, coins::COUNT + 1, false);
    }


}
