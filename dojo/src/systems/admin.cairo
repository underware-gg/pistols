use starknet::ContractAddress;
use pistols::models::config::{Config};
use pistols::models::table::{TableConfig};

// based on RYO
// https://github.com/cartridge-gg/rollyourown/blob/market_packed/src/systems/ryo.cairo
// https://github.com/cartridge-gg/rollyourown/blob/market_packed/src/config/ryo.cairo


#[dojo::interface]
trait IAdmin {
    fn set_owner(ref world: IWorldDispatcher, owner_address: ContractAddress, granted: bool);
    fn set_treasury(ref world: IWorldDispatcher, treasury_address: ContractAddress);
    fn set_paused(ref world: IWorldDispatcher, paused: bool);

    fn set_table(ref world: IWorldDispatcher, table_id: felt252, contract_address: ContractAddress, description: felt252, fee_min: u128, fee_pct: u8, is_open: bool);
    fn open_table(ref world: IWorldDispatcher, table_id: felt252, is_open: bool);
    
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
    use pistols::models::table::{TableConfig, TableManager, TableManagerTrait};
    use pistols::libs::utils;

    mod Errors {
        const INVALID_OWNER: felt252       = 'ADMIN: Invalid owner_address';
        const INVALID_TREASURY: felt252    = 'ADMIN: Invalid treasury_address';
        const INVALID_TABLE: felt252       = 'ADMIN: Invalid table';
        const INVALID_DESCRIPTION: felt252 = 'ADMIN: Invalid description';
        const NOT_OWNER: felt252           = 'ADMIN: Not owner';
    }

    
    fn dojo_init(
        ref world: IWorldDispatcher,
        treasury_address: ContractAddress,
        lords_address: ContractAddress,
    ) {
        let manager = ConfigManagerTrait::new(world);
        let mut config = manager.get();
        // initialize
        config.treasury_address = (if (treasury_address.is_zero()) { get_caller_address() } else { treasury_address });
        config.paused = false;
        manager.set(config);
        // initialize table lords
        TableManagerTrait::new(world).initialize(lords_address);
    }

    #[abi(embed_v0)]
    impl AdminImpl of super::IAdmin<ContractState> {
        fn set_owner(ref world: IWorldDispatcher, owner_address: ContractAddress, granted: bool) {
            self.assert_caller_is_owner();
            assert(owner_address.is_non_zero(), Errors::INVALID_OWNER);
            if (granted) {
                world.grant_owner(owner_address, self.selector().into());
            } else {
                world.revoke_owner(owner_address, self.selector().into());
            }
        }

        fn set_treasury(ref world: IWorldDispatcher, treasury_address: ContractAddress) {
            self.assert_caller_is_owner();
            assert(treasury_address.is_non_zero(), Errors::INVALID_TREASURY);
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

        fn set_table(ref world: IWorldDispatcher, table_id: felt252, contract_address: ContractAddress, description: felt252, fee_min: u128, fee_pct: u8, is_open: bool) {
            self.assert_caller_is_owner();
            // get table
            let manager = TableManagerTrait::new(world);
            assert(manager.exists(table_id), Errors::INVALID_TABLE);
            let mut table = manager.get(table_id);
            // update table
            table.wager_contract_address = contract_address;
            table.description = description;
            table.fee_min = fee_min;
            table.fee_pct = fee_pct;
            table.is_open = is_open;
            manager.set(table);
        }

        fn open_table(ref world: IWorldDispatcher, table_id: felt252, is_open: bool) {
            self.assert_caller_is_owner();
            // get table
            let manager = TableManagerTrait::new(world);
            assert(manager.exists(table_id), Errors::INVALID_TABLE);
            let mut table = manager.get(table_id);
            // update table
            table.is_open = is_open;
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
        fn assert_caller_is_owner(self: @ContractState) {
            assert(self.world().is_owner(get_caller_address(), self.selector().into()), Errors::NOT_OWNER);
        }
    }
}
