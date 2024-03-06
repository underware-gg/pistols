use starknet::ContractAddress;
use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

// based on RYO
// https://github.com/cartridge-gg/rollyourown/blob/market_packed/src/systems/ryo.cairo
// https://github.com/cartridge-gg/rollyourown/blob/market_packed/src/config/ryo.cairo


#[starknet::interface]
trait IAdmin<TContractState> {
    //
    fn initialize(self: @TContractState, lords_address: ContractAddress);
    fn set_lords_address(self: @TContractState, lords_address: ContractAddress);
    fn set_game_fee(self: @TContractState, duel_fee_min: u8, duel_fee_pct: u8);
    //
    fn get_lords_address(self: @TContractState) -> ContractAddress;
    fn get_game_fee(self: @TContractState) -> (u8, u8);
}

#[dojo::contract]
mod admin {
    use core::traits::Into;
    use starknet::ContractAddress;
    use starknet::{get_caller_address, get_contract_address};

    use pistols::models::config::{Config, ConfigManager, ConfigManagerTrait, constants};

    #[abi(embed_v0)]
    impl AdminExternalImpl of super::IAdmin<ContractState> {
        fn initialize(self: @ContractState, lords_address: ContractAddress) {
            self.assert_caller_is_owner();
            // get config
            let config_manager = ConfigManagerTrait::new(self.world());
            let mut config = config_manager.get();
            // assert(config.initialized == false, 'Already initialized');
            // update config
            config.initialized = true;
            config.lords_address = lords_address;
            config.duel_fee_min = constants::DUEL_FEE_MIN;
            config.duel_fee_pct = constants::DUEL_FEE_PCT;
            config_manager.set(config);
        }

        fn set_lords_address(self: @ContractState, lords_address: ContractAddress) {
            self.assert_caller_is_owner();
            // get config
            let config_manager = ConfigManagerTrait::new(self.world());
            let mut config = config_manager.get();
            // update config
            config.lords_address = lords_address;
            config_manager.set(config);
        }

        fn set_game_fee(self: @ContractState, duel_fee_min: u8, duel_fee_pct: u8) {
            self.assert_caller_is_owner();
            // get config
            let config_manager = ConfigManagerTrait::new(self.world());
            let mut config = config_manager.get();
            // update config
            config.duel_fee_min = duel_fee_min;
            config.duel_fee_pct = duel_fee_pct;
            config_manager.set(config);
        }

        //
        // getters
        //

        fn get_lords_address(self: @ContractState) -> ContractAddress {
            let config = ConfigManagerTrait::new(self.world()).get();
            (config.lords_address)
        }

        fn get_game_fee(self: @ContractState) -> (u8, u8) {
            let config = ConfigManagerTrait::new(self.world()).get();
            (config.duel_fee_min, config.duel_fee_pct)
        }
    }

    #[generate_trait]
    impl AdminInternalImpl of AdminInternalTrait {
        #[inline(always)]
        fn assert_caller_is_owner(self: @ContractState) {
            assert(self.world().is_owner(get_caller_address(), get_contract_address().into()), 'not owner');
        }
    }
}

