use starknet::ContractAddress;
use pistols::models::config::{Config};
use pistols::models::table::{TableConfig};

// based on RYO
// https://github.com/cartridge-gg/rollyourown/blob/market_packed/src/systems/ryo.cairo
// https://github.com/cartridge-gg/rollyourown/blob/market_packed/src/config/ryo.cairo


#[dojo::interface]
trait IAdmin {
    fn initialize(ref world: IWorldDispatcher, owner_address: ContractAddress, treasury_address: ContractAddress, lords_address: ContractAddress, token_duelist_address: ContractAddress, minter_address: ContractAddress);
    fn is_initialized(world: @IWorldDispatcher) -> bool;
    
    fn set_owner(ref world: IWorldDispatcher, owner_address: ContractAddress);
    fn set_treasury(ref world: IWorldDispatcher, treasury_address: ContractAddress);
    fn set_paused(ref world: IWorldDispatcher, paused: bool);
    fn set_table(ref world: IWorldDispatcher, table_id: felt252, contract_address: ContractAddress, description: felt252, fee_min: u256, fee_pct: u8, enabled: bool);
    fn enable_table(ref world: IWorldDispatcher, table_id: felt252, enabled: bool);
    
    fn get_config(world: @IWorldDispatcher) -> Config;
    fn get_table(world: @IWorldDispatcher, table_id: felt252) -> TableConfig;
}

#[dojo::contract]
mod admin {
    use debug::PrintTrait;
    use core::traits::Into;
    use starknet::ContractAddress;
    use starknet::{get_caller_address, get_contract_address};

    use pistols::models::config::{Config, ConfigManager, ConfigManagerTrait};
    use pistols::models::table::{TableConfig, TableManager, TableManagerTrait, default_tables};
    use pistols::libs::utils;

    mod Errors {
        const ALREADY_INITIALIZED: felt252 = 'ADMIN: Already initialized';
        const INVALID_OWNER: felt252       = 'ADMIN: Invalid owner_address';
        const INVALID_TREASURY: felt252    = 'ADMIN: Invalid treasury_address';
        const INVALID_TABLE: felt252       = 'ADMIN: Invalid table';
        const INVALID_DESCRIPTION: felt252 = 'ADMIN: Invalid description';
        const NOT_DEPLOYER: felt252        = 'ADMIN: Not deployer';
        const NOT_INITIALIZED: felt252     = 'ADMIN: Not initialized';
        const NOT_OWNER: felt252           = 'ADMIN: Not owner';
    }
    
    #[abi(embed_v0)]
    impl AdminImpl of super::IAdmin<ContractState> {
        fn initialize(ref world: IWorldDispatcher,
            owner_address: ContractAddress,
            treasury_address: ContractAddress,
            lords_address: ContractAddress,
            token_duelist_address: ContractAddress,
            minter_address: ContractAddress,
        ) {
            self.assert_initializer_is_owner();
            let manager = ConfigManagerTrait::new(world);
            let mut config = manager.get();
            assert(config.initialized == false, Errors::ALREADY_INITIALIZED);
            // initialize
            config.initialized = true;
            config.owner_address = (if (owner_address == utils::ZERO()) { get_caller_address() } else { owner_address });
            config.treasury_address = (if (treasury_address == utils::ZERO()) { get_caller_address() } else { treasury_address });
            config.token_duelist_address = token_duelist_address;
            config.minter_address = minter_address;
            config.paused = false;
            manager.set(config);
            // set lords
            let manager = TableManagerTrait::new(world);
            manager.set_array(@default_tables(lords_address));
        }

        fn is_initialized(world: @IWorldDispatcher) -> bool {
            (ConfigManagerTrait::is_initialized(world))
        }

        fn set_owner(ref world: IWorldDispatcher, owner_address: ContractAddress) {
            self.assert_caller_is_owner();
            assert(owner_address != utils::ZERO(), Errors::INVALID_OWNER);
            // get current
            let manager = ConfigManagerTrait::new(world);
            let mut config = manager.get();
            // update
            config.owner_address = owner_address;
            manager.set(config);
        }

        fn set_treasury(ref world: IWorldDispatcher, treasury_address: ContractAddress) {
            self.assert_caller_is_owner();
            assert(treasury_address != utils::ZERO(), Errors::INVALID_TREASURY);
            // get current
            let manager = ConfigManagerTrait::new(world);
            let mut config = manager.get();
            // update
            config.treasury_address = treasury_address;
            manager.set(config);
        }

        fn set_paused(ref world: IWorldDispatcher, paused: bool) {
            self.assert_caller_is_owner();
            // get current
            let manager = ConfigManagerTrait::new(world);
            let mut config = manager.get();
            // update
            config.paused = paused;
            manager.set(config);
        }

        fn set_table(ref world: IWorldDispatcher, table_id: felt252, contract_address: ContractAddress, description: felt252, fee_min: u256, fee_pct: u8, enabled: bool) {
            self.assert_caller_is_owner();
            // get table
            let manager = TableManagerTrait::new(world);
            assert(manager.exists(table_id), Errors::INVALID_TABLE);
            let mut table = manager.get(table_id);
            // update table
            table.contract_address = contract_address;
            table.description = description;
            table.fee_min = fee_min;
            table.fee_pct = fee_pct;
            table.is_open = enabled;
            manager.set(table);
        }

        fn enable_table(ref world: IWorldDispatcher, table_id: felt252, enabled: bool) {
            self.assert_caller_is_owner();
            // get table
            let manager = TableManagerTrait::new(world);
            assert(manager.exists(table_id), Errors::INVALID_TABLE);
            let mut table = manager.get(table_id);
            // update table
            table.is_open = enabled;
            manager.set(table);
        }

        //
        // getters
        //

        fn get_config(world: @IWorldDispatcher) -> Config {
            (ConfigManagerTrait::new(world).get())
        }

        fn get_table(world: @IWorldDispatcher, table_id: felt252) -> TableConfig {
            let manager = TableManagerTrait::new(world);
            assert(manager.exists(table_id), Errors::INVALID_TABLE);
            (manager.get(table_id))
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        #[inline(always)]
        fn assert_initializer_is_owner(self: @ContractState) {
            assert(self.world().is_owner(get_caller_address(), get_contract_address().into()), Errors::NOT_DEPLOYER);
        }
        fn assert_caller_is_owner(self: @ContractState) {
            assert(ConfigManagerTrait::is_initialized(self.world()) == true, Errors::NOT_INITIALIZED);
            assert(ConfigManagerTrait::is_owner(self.world(), get_caller_address()) == true, Errors::NOT_OWNER);
        }
    }
}
