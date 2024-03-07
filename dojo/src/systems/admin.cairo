use starknet::ContractAddress;
use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};
use pistols::models::config::{Config};
use pistols::models::coins::{Coin};

// based on RYO
// https://github.com/cartridge-gg/rollyourown/blob/market_packed/src/systems/ryo.cairo
// https://github.com/cartridge-gg/rollyourown/blob/market_packed/src/config/ryo.cairo


#[starknet::interface]
trait IAdmin<TContractState> {
    fn initialize(self: @TContractState, treasury_address: ContractAddress);
    
    fn set_treasury(self: @TContractState, treasury_address: ContractAddress);
    fn set_paused(self: @TContractState, paused: bool);
    fn set_coin(self: @TContractState, coin_key: u8, contract_address: ContractAddress, fee_min: u8, fee_pct: u8);
    
    fn get_config(self: @TContractState) -> Config;
    fn get_coin(self: @TContractState, coin_key: u8) -> Coin;
}

#[dojo::contract]
mod admin {
    use core::traits::Into;
    use starknet::ContractAddress;
    use starknet::{get_caller_address, get_contract_address};

    use pistols::models::config::{Config, ConfigManager, ConfigManagerTrait};
    use pistols::models::coins::{Coin, CoinManager, CoinManagerTrait};
    use pistols::systems::{utils};

    #[abi(embed_v0)]
    impl AdminExternalImpl of super::IAdmin<ContractState> {
        fn initialize(self: @ContractState, treasury_address: ContractAddress) {
            self.assert_caller_is_owner();
            let manager = ConfigManagerTrait::new(self.world());
            let mut config = manager.get();
            assert(config.initialized == false, 'Already initialized');
            // initialize
            config.initialized = true;
            config.paused = false;
            manager.set(config);
            // set treasury
            self.set_treasury(treasury_address);
        }

        fn set_treasury(self: @ContractState, treasury_address: ContractAddress) {
            self.assert_caller_is_owner();
            let manager = ConfigManagerTrait::new(self.world());
            let mut config = manager.get();
            assert(config.initialized == true, 'Not initialized');
            // update
            config.treasury_address = (if (treasury_address == utils::zero_address()) { get_contract_address() } else { treasury_address });
            manager.set(config);
        }

        fn set_paused(self: @ContractState, paused: bool) {
            self.assert_caller_is_owner();
            let manager = ConfigManagerTrait::new(self.world());
            let mut config = manager.get();
            assert(config.initialized == true, 'Not initialized');
            // update
            config.paused = paused;
            manager.set(config);
        }

        fn set_coin(self: @ContractState, coin_key: u8, contract_address: ContractAddress, fee_min: u8, fee_pct: u8) {
            self.assert_caller_is_owner();
            // get config
            let manager = CoinManagerTrait::new(self.world());
            assert(manager.exists(coin_key), 'Invalid coin');
            let mut config = manager.get(coin_key);
            // update config
            config.contract_address = contract_address;
            config.fee_min = fee_min;
            config.fee_pct = fee_pct;
            manager.set(config);
        }

        //
        // getters
        //

        fn get_config(self: @ContractState) -> Config {
            (ConfigManagerTrait::new(self.world()).get())
        }

        fn get_coin(self: @ContractState, coin_key: u8) -> Coin {
            let manager = CoinManagerTrait::new(self.world());
            assert(manager.exists(coin_key), 'Invalid coin');
            (manager.get(coin_key))
        }
    }

    #[generate_trait]
    impl AdminInternalImpl of AdminInternalTrait {
        #[inline(always)]
        fn assert_caller_is_owner(self: @ContractState) {
            assert(self.world().is_owner(get_caller_address(), get_contract_address().into()), 'Not owner');
        }
    }
}

