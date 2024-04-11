use starknet::ContractAddress;
use pistols::models::config::{Config};
use pistols::models::coins::{Coin};

// based on RYO
// https://github.com/cartridge-gg/rollyourown/blob/market_packed/src/systems/ryo.cairo
// https://github.com/cartridge-gg/rollyourown/blob/market_packed/src/config/ryo.cairo


#[dojo::interface]
trait IAdmin {
    fn initialize(owner_address: ContractAddress, treasury_address: ContractAddress, lords_address: ContractAddress);
    fn is_initialized() -> bool;
    
    fn set_owner(owner_address: ContractAddress);
    fn set_treasury(treasury_address: ContractAddress);
    fn set_paused(paused: bool);
    fn set_coin(coin_key: u8, contract_address: ContractAddress, description: felt252, fee_min: u256, fee_pct: u8, enabled: bool);
    fn enable_coin(coin_key: u8, enabled: bool);
    
    fn get_config() -> Config;
    fn get_coin(coin_key: u8) -> Coin;
}

#[dojo::contract]
mod admin {
    use debug::PrintTrait;
    use core::traits::Into;
    use starknet::ContractAddress;
    use starknet::{get_caller_address, get_contract_address};

    use pistols::models::config::{Config, ConfigManager, ConfigManagerTrait};
    use pistols::models::coins::{Coin, CoinManager, CoinManagerTrait, default_coin};
    use pistols::systems::{utils};

    #[abi(embed_v0)]
    impl AdminImpl of super::IAdmin<ContractState> {
        fn initialize(world: IWorldDispatcher, owner_address: ContractAddress, treasury_address: ContractAddress, lords_address: ContractAddress) {
            self.assert_initializer_is_owner();
            let manager = ConfigManagerTrait::new(world);
            let mut config = manager.get();
            assert(config.initialized == false, 'Already initialized');
            // initialize
            config.initialized = true;
            config.owner_address = (if (owner_address == utils::zero_address()) { get_caller_address() } else { owner_address });
            config.treasury_address = (if (treasury_address == utils::zero_address()) { get_caller_address() } else { treasury_address });
            config.paused = false;
            manager.set(config);
            // set lords
            let manager = CoinManagerTrait::new(world);
            manager.set(default_coin(lords_address));
        }

        fn is_initialized(world: IWorldDispatcher) -> bool {
            (ConfigManagerTrait::is_initialized(world))
        }

        fn set_owner(world: IWorldDispatcher, owner_address: ContractAddress) {
            self.assert_caller_is_owner();
            assert(owner_address != utils::zero_address(), 'Null owner_address');
            // get current
            let manager = ConfigManagerTrait::new(world);
            let mut config = manager.get();
            // update
            config.owner_address = owner_address;
            manager.set(config);
        }

        fn set_treasury(world: IWorldDispatcher, treasury_address: ContractAddress) {
            self.assert_caller_is_owner();
            assert(treasury_address != utils::zero_address(), 'Null treasury_address');
            // get current
            let manager = ConfigManagerTrait::new(world);
            let mut config = manager.get();
            // update
            config.treasury_address = treasury_address;
            manager.set(config);
        }

        fn set_paused(world: IWorldDispatcher, paused: bool) {
            self.assert_caller_is_owner();
            // get current
            let manager = ConfigManagerTrait::new(world);
            let mut config = manager.get();
            // update
            config.paused = paused;
            manager.set(config);
        }

        fn set_coin(world: IWorldDispatcher, coin_key: u8, contract_address: ContractAddress, description: felt252, fee_min: u256, fee_pct: u8, enabled: bool) {
            self.assert_caller_is_owner();
            // get coin
            let manager = CoinManagerTrait::new(world);
            assert(manager.exists(coin_key), 'Invalid coin');
            let mut coin = manager.get(coin_key);
            // update coin
            coin.contract_address = contract_address;
            coin.description = description;
            coin.fee_min = fee_min;
            coin.fee_pct = fee_pct;
            coin.enabled = enabled;
            manager.set(coin);
        }

        fn enable_coin(world: IWorldDispatcher, coin_key: u8, enabled: bool) {
            self.assert_caller_is_owner();
            // get coin
            let manager = CoinManagerTrait::new(world);
            assert(manager.exists(coin_key), 'Invalid coin');
            let mut coin = manager.get(coin_key);
            // update coin
            coin.enabled = enabled;
            manager.set(coin);
        }

        //
        // getters
        //

        fn get_config(world: IWorldDispatcher) -> Config {
            (ConfigManagerTrait::new(world).get())
        }

        fn get_coin(world: IWorldDispatcher, coin_key: u8) -> Coin {
            let manager = CoinManagerTrait::new(world);
            assert(manager.exists(coin_key), 'Invalid coin');
            (manager.get(coin_key))
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        #[inline(always)]
        fn assert_initializer_is_owner(self: @ContractState) {
            assert(self.world().is_owner(get_caller_address(), get_contract_address().into()), 'Not deployer');
        }
        fn assert_caller_is_owner(self: @ContractState) {
            assert(ConfigManagerTrait::is_initialized(self.world()) == true, 'Not initialized');
            assert(ConfigManagerTrait::is_owner(self.world(), get_caller_address()) == true, 'Not owner');
        }
    }
}
