use starknet::ContractAddress;
use pistols::models::config::{Config};
use pistols::models::table::{TableConfig, TableAdmittance};

// based on RYO
// https://github.com/cartridge-gg/rollyourown/blob/market_packed/src/systems/ryo.cairo
// https://github.com/cartridge-gg/rollyourown/blob/market_packed/src/config/ryo.cairo


#[dojo::interface]
trait IAdmin {
    fn am_i_owner(world: @IWorldDispatcher, account_address: ContractAddress) -> bool;
    fn set_owner(ref world: IWorldDispatcher, account_address: ContractAddress, granted: bool);

    fn set_config(ref world: IWorldDispatcher, config: Config);
    fn set_paused(ref world: IWorldDispatcher, paused: bool);

    fn open_table(ref world: IWorldDispatcher, table_id: felt252, is_open: bool);
    fn set_table(ref world: IWorldDispatcher, table: TableConfig);
    fn set_table_admittance(ref world: IWorldDispatcher, table_admittance: TableAdmittance);
}

#[dojo::contract]
mod admin {
    use debug::PrintTrait;
    use core::traits::Into;
    use starknet::ContractAddress;
    use starknet::{get_caller_address, get_contract_address};

    use pistols::models::config::{Config, ConfigManager, ConfigManagerTrait};
    use pistols::models::table::{TableConfig, TableAdmittance, TableManager, TableManagerTrait};
    use pistols::libs::utils;

    mod Errors {
        const INVALID_OWNER: felt252       = 'ADMIN: Invalid account_address';
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
        config.is_paused = false;
        manager.set(config);
        // initialize table lords
        TableManagerTrait::new(world).initialize(lords_address);
    }

    #[abi(embed_v0)]
    impl AdminImpl of super::IAdmin<ContractState> {
        fn am_i_owner(world: @IWorldDispatcher, account_address: ContractAddress) -> bool {
            (world.is_owner(self.selector().into(), account_address))
        }

        fn set_owner(ref world: IWorldDispatcher, account_address: ContractAddress, granted: bool) {
            utils::WORLD(world);
            self.assert_caller_is_owner();
            self.grant_owner(account_address, granted);
        }

        fn set_config(ref world: IWorldDispatcher, config: Config) {
            self.assert_caller_is_owner();
            assert(config.treasury_address.is_non_zero(), Errors::INVALID_TREASURY);
            // get current
            let manager = ConfigManagerTrait::new(world);
            manager.set(config);
        }

        fn set_paused(ref world: IWorldDispatcher, paused: bool) {
            self.assert_caller_is_owner();
            // get current
            let manager = ConfigManagerTrait::new(world);
            let mut config = manager.get();
            // update
            config.is_paused = paused;
            manager.set(config);
        }

        fn set_table(ref world: IWorldDispatcher, table: TableConfig) {
            self.assert_caller_is_owner();
            // get table
            let manager = TableManagerTrait::new(world);
            // assert(manager.exists(table.table_id), Errors::INVALID_TABLE);
            manager.set(table);
        }

        fn set_table_admittance(ref world: IWorldDispatcher, table_admittance: TableAdmittance) {
            self.assert_caller_is_owner();
            // get table
            let manager = TableManagerTrait::new(world);
            assert(manager.exists(table_admittance.table_id), Errors::INVALID_TABLE);
            manager.set_admittance(table_admittance);
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
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn assert_caller_is_owner(self: @ContractState) {
            assert(self.am_i_owner(get_caller_address()) == true, Errors::NOT_OWNER);
        }
        fn grant_owner(self: @ContractState, account_address: ContractAddress, granted: bool) {
            assert(account_address.is_non_zero(), Errors::INVALID_OWNER);
            if (granted) {
                self.world().grant_owner(self.selector().into(), account_address);
            } else {
                self.world().revoke_owner(self.selector().into(), account_address);
            }
        }
    }
}
