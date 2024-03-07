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
    fn test_initialize() {
        let (world, system, owner, other) = utils::setup_world();
        let (admin) = utils::setup_admin(world);
        let config: Config = admin.get_config();
        assert(config.initialized == false, 'initialized == false');
        utils::execute_initialize(admin, owner, zero_address(), zero_address());
        let config: Config = admin.get_config();
        assert(config.initialized == true, 'initialized == true');
        assert(config.paused == false, 'paused');
        assert(config.treasury_address == admin.contract_address, 'treasury_address');
        // get
        let get_config: Config = utils::get_Config(world);
        assert(config.initialized == get_config.initialized, 'get_config.initialized');
        assert(config.paused == get_config.paused, 'get_config.paused');
        assert(config.treasury_address == get_config.treasury_address, 'get_config.treasury_address');
    }

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_set_treasury() {
        let (world, system, owner, other) = utils::setup_world();
        let (admin) = utils::setup_admin(world);
        utils::execute_initialize(admin, owner, other, zero_address());
        let config: Config = admin.get_config();
        assert(config.treasury_address == other, 'treasury_address_1');
        // set
        let treasury: ContractAddress = starknet::contract_address_const::<0x111111>();
        utils::execute_set_treasury(admin, owner, treasury);
        let config: Config = admin.get_config();
        assert(config.treasury_address == treasury, 'set_treasury_2');
        // set
        utils::execute_set_treasury(admin, owner, zero_address());
        let config: Config = admin.get_config();
        assert(config.treasury_address == admin.contract_address, 'treasury_address_3');
    }

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_set_paused() {
        let (world, system, owner, other) = utils::setup_world();
        let (admin) = utils::setup_admin(world);
        utils::execute_initialize(admin, owner, other, zero_address());
        let config: Config = admin.get_config();
        assert(config.paused == false, 'paused_1');
        // set
        utils::execute_set_paused(admin, owner, true);
        let config: Config = admin.get_config();
        assert(config.paused == true, 'paused_2');
        // set
        utils::execute_set_paused(admin, owner, false);
        let config: Config = admin.get_config();
        assert(config.paused == false, 'paused_3');
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('Already initialized','ENTRYPOINT_FAILED'))]
    fn test_initialized() {
        let (world, system, owner, other) = utils::setup_world();
        let (admin) = utils::setup_admin(world);
        utils::execute_initialize(admin, owner, zero_address(), zero_address());
        utils::execute_initialize(admin, owner, zero_address(), zero_address());
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('Not initialized','ENTRYPOINT_FAILED'))]
    fn test_not_initialized() {
        let (world, system, owner, other) = utils::setup_world();
        let (admin) = utils::setup_admin(world);
        utils::execute_set_treasury(admin, owner, zero_address());
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('Not owner','ENTRYPOINT_FAILED'))]
    fn test_initialize_owner() {
        let (world, system, owner, other) = utils::setup_world();
        let (admin) = utils::setup_admin(world);
        utils::execute_initialize(admin, other, zero_address(), zero_address());
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('Not owner','ENTRYPOINT_FAILED'))]
    fn test_set_treasury_owner() {
        let (world, system, owner, other) = utils::setup_world();
        let (admin) = utils::setup_admin(world);
        utils::execute_initialize(admin, owner, other, zero_address());
        let treasury: ContractAddress = starknet::contract_address_const::<0x111111>();
        utils::execute_set_treasury(admin, other, treasury);
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('Not owner','ENTRYPOINT_FAILED'))]
    fn test_set_paused_owner() {
        let (world, system, owner, other) = utils::setup_world();
        let (admin) = utils::setup_admin(world);
        utils::execute_initialize(admin, owner, other, zero_address());
        utils::execute_set_paused(admin, other, true);
    }

    //
    // Coins
    //

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_initialize_coin() {
        let (world, system, owner, other) = utils::setup_world();
        let (admin) = utils::setup_admin(world);
        let (lords) = utils::setup_lords(world);
        utils::execute_initialize(admin, owner, zero_address(), lords.contract_address);
        let coin: Coin = admin.get_coin(coins::LORDS);
        assert(coin.contract_address == lords.contract_address, 'contract_address');
        assert(coin.fee_min == 4 * ETH_TO_WEI, 'fee_min');
        assert(coin.fee_pct == 10, 'fee_pct');
        assert(coin.enabled == true, 'enabled');
    }

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_set_coin() {
        let (world, system, owner, other) = utils::setup_world();
        let (admin) = utils::setup_admin(world);
        let (lords) = utils::setup_lords(world);
        // not initialized
        utils::execute_initialize(admin, owner, zero_address(), zero_address());
        let coin: Coin = admin.get_coin(coins::LORDS);
        assert(coin.contract_address == zero_address(), 'zero');
        assert(coin.enabled == false, 'zero');
        // set
        utils::execute_set_coin(admin, owner, coins::LORDS, lords.contract_address, 5, 10, true);
        let coin: Coin = admin.get_coin(coins::LORDS);
        assert(coin.contract_address == lords.contract_address, 'contract_address_1');
        assert(coin.fee_min == 5, 'fee_min_1');
        assert(coin.fee_pct == 10, 'fee_pct_1');
        assert(coin.enabled == true, 'enabled_1');
        // set
        utils::execute_set_coin(admin, owner, coins::LORDS, other, 22, 33, false);
        let coin: Coin = admin.get_coin(coins::LORDS);
        assert(coin.contract_address == other, 'contract_address_2');
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
        let (world, system, owner, other) = utils::setup_world();
        let (admin) = utils::setup_admin(world);
        let (lords) = utils::setup_lords(world);
        let coin: Coin = admin.get_coin(coins::COUNT);
        assert(coin.contract_address == zero_address(), 'zero');
        // set
        utils::execute_set_coin(admin, owner, coins::COUNT, lords.contract_address, 5, 10, true);
        let coin: Coin = admin.get_coin(coins::COUNT);
        assert(coin.contract_address == lords.contract_address, 'contract_address');
        assert(coin.fee_min == 5, 'fee_min');
        assert(coin.fee_pct == 10, 'fee_pct');
        assert(coin.enabled == true, 'enabled');
    }

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_enable_coin_count() {
        let (world, system, owner, other) = utils::setup_world();
        let (admin) = utils::setup_admin(world);
        let (lords) = utils::setup_lords(world);
        utils::execute_set_coin(admin, owner, coins::LORDS, lords.contract_address, 5, 10, false);
        let coin: Coin = admin.get_coin(coins::LORDS);
        assert(coin.enabled == false, 'enabled_1');
        utils::execute_enable_coin(admin, owner, coins::LORDS, true);
        let coin: Coin = admin.get_coin(coins::LORDS);
        assert(coin.enabled == true, 'enabled_2');
        utils::execute_enable_coin(admin, owner, coins::LORDS, false);
        let coin: Coin = admin.get_coin(coins::LORDS);
        assert(coin.enabled == false, 'enabled_3');
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('Not owner','ENTRYPOINT_FAILED'))]
    fn test_set_coin_owner() {
        let (world, system, owner, other) = utils::setup_world();
        let (admin) = utils::setup_admin(world);
        let (lords) = utils::setup_lords(world);
        utils::execute_set_coin(admin, other, coins::LORDS, lords.contract_address, 5, 10, true);
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('Not owner','ENTRYPOINT_FAILED'))]
    fn test_enable_coin_owner() {
        let (world, system, owner, other) = utils::setup_world();
        let (admin) = utils::setup_admin(world);
        let (lords) = utils::setup_lords(world);
        utils::execute_enable_coin(admin, other, coins::LORDS, true);
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('Invalid coin','ENTRYPOINT_FAILED'))]
    fn test_set_coin_zero() {
        let (world, system, owner, other) = utils::setup_world();
        let (admin) = utils::setup_admin(world);
        let (lords) = utils::setup_lords(world);
        utils::execute_set_coin(admin, owner, 0, lords.contract_address, 5, 10, true);
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('Invalid coin','ENTRYPOINT_FAILED'))]
    fn test_set_coin_invalid() {
        let (world, system, owner, other) = utils::setup_world();
        let (admin) = utils::setup_admin(world);
        let (lords) = utils::setup_lords(world);
        utils::execute_set_coin(admin, owner, coins::COUNT + 1, lords.contract_address, 5, 10, true);
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('Invalid coin','ENTRYPOINT_FAILED'))]
    fn test_enable_coin_zero() {
        let (world, system, owner, other) = utils::setup_world();
        let (admin) = utils::setup_admin(world);
        let (lords) = utils::setup_lords(world);
        utils::execute_enable_coin(admin, owner, 0, false);
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('Invalid coin','ENTRYPOINT_FAILED'))]
    fn test_enable_coin_invalid() {
        let (world, system, owner, other) = utils::setup_world();
        let (admin) = utils::setup_admin(world);
        let (lords) = utils::setup_lords(world);
        utils::execute_enable_coin(admin, owner, coins::COUNT + 1, false);
    }


}
