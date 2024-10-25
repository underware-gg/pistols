use starknet::ContractAddress;
use pistols::models::config::{Config};
use pistols::models::table::{TableConfig, TableAdmittance};

// based on RYO
// https://github.com/cartridge-gg/rollyourown/blob/market_packed/src/systems/ryo.cairo
// https://github.com/cartridge-gg/rollyourown/blob/market_packed/src/config/ryo.cairo


#[dojo::interface]
trait IAdmin {
    fn am_i_admin(world: @IWorldDispatcher, account_address: ContractAddress) -> bool;
    fn grant_admin(ref world: IWorldDispatcher, account_address: ContractAddress, granted: bool);

    fn set_config(ref world: IWorldDispatcher, config: Config);
    fn set_paused(ref world: IWorldDispatcher, paused: bool);

    fn open_table(ref world: IWorldDispatcher, table_id: felt252, is_open: bool);
    fn set_table(ref world: IWorldDispatcher, table: TableConfig);
    fn set_table_admittance(ref world: IWorldDispatcher, table_admittance: TableAdmittance);
}

#[dojo::contract]
mod admin {
    // use debug::PrintTrait;
    use core::traits::Into;
    use starknet::ContractAddress;
    use starknet::{get_caller_address, get_contract_address};

    use pistols::models::config::{Config, ConfigTrait, ConfigEntity};
    use pistols::models::table::{TableConfig, TableConfigEntity, TableConfigEntityTrait, TableAdmittance, TableInitializer, TableInitializerTrait};
    use pistols::interfaces::systems::{SELECTORS};
    use pistols::libs::store::{Store, StoreTrait};
    use pistols::utils::misc::{ZERO, WORLD};

    mod Errors {
        const INVALID_OWNER: felt252        = 'ADMIN: Invalid account_address';
        const INVALID_TREASURY: felt252     = 'ADMIN: Invalid treasury_address';
        const INVALID_TABLE: felt252        = 'ADMIN: Invalid table';
        const INVALID_DESCRIPTION: felt252  = 'ADMIN: Invalid description';
        const NOT_ADMIN: felt252            = 'ADMIN: not admin';
    }

    fn dojo_init(
        ref world: IWorldDispatcher,
        treasury_address: ContractAddress,
        lords_address: ContractAddress,
    ) {
        let store: Store = StoreTrait::new(world);
        // initialize Config
        let mut config: Config = ConfigTrait::new();
        config.treasury_address = (if (treasury_address.is_zero()) { get_caller_address() } else { treasury_address });
        config.lords_address = lords_address;
        config.is_paused = false;
        store.set_config(@config);
        // initialize tables
        TableInitializerTrait::new(world).initialize();
    }

    #[abi(embed_v0)]
    impl AdminImpl of super::IAdmin<ContractState> {
        fn am_i_admin(world: @IWorldDispatcher, account_address: ContractAddress) -> bool {
            (
                world.is_owner(self.selector().into(), account_address) ||
                (
                    world.is_writer(SELECTORS::CONFIG, account_address) &&
                    world.is_writer(SELECTORS::TABLE_CONFIG, account_address) &&
                    world.is_writer(SELECTORS::TOKEN_CONFIG, account_address) &&
                    world.is_writer(SELECTORS::COIN_CONFIG, account_address) &&
                    world.is_writer(SELECTORS::PAYMENT, account_address)
                )
            )
        }

        fn grant_admin(ref world: IWorldDispatcher, account_address: ContractAddress, granted: bool) {
            WORLD(world);
            self.assert_caller_is_admin();
            assert(account_address.is_non_zero(), Errors::INVALID_OWNER);
            if (granted) {
                self.world().grant_writer(SELECTORS::CONFIG, account_address);
                self.world().grant_writer(SELECTORS::TABLE_CONFIG, account_address);
                self.world().grant_writer(SELECTORS::TOKEN_CONFIG, account_address);
                self.world().grant_writer(SELECTORS::COIN_CONFIG, account_address);
                self.world().grant_writer(SELECTORS::PAYMENT, account_address);
            } else {
                self.world().revoke_writer(SELECTORS::CONFIG, account_address);
                self.world().revoke_writer(SELECTORS::TABLE_CONFIG, account_address);
                self.world().revoke_writer(SELECTORS::TOKEN_CONFIG, account_address);
                self.world().revoke_writer(SELECTORS::COIN_CONFIG, account_address);
                self.world().revoke_writer(SELECTORS::PAYMENT, account_address);
            }
        }

        fn set_config(ref world: IWorldDispatcher, config: Config) {
            self.assert_caller_is_admin();
            assert(config.treasury_address.is_non_zero(), Errors::INVALID_TREASURY);
            // get current
            set!(world, (config));
        }

        fn set_paused(ref world: IWorldDispatcher, paused: bool) {
            self.assert_caller_is_admin();
            // get current
            let store: Store = StoreTrait::new(world);
            let mut config: ConfigEntity = store.get_config_entity();
            // update
            config.is_paused = paused;
            store.update_config_entity(@config);
        }

        fn set_table(ref world: IWorldDispatcher, table: TableConfig) {
            self.assert_caller_is_admin();
            // check table
            assert(table.table_id != 0, Errors::INVALID_TABLE);
            // update table
            let store: Store = StoreTrait::new(world);
            store.set_table_config(@table);
        }

        fn set_table_admittance(ref world: IWorldDispatcher, table_admittance: TableAdmittance) {
            self.assert_caller_is_admin();
            // check table
            assert(table_admittance.table_id != 0, Errors::INVALID_TABLE);
            let store: Store = StoreTrait::new(world);
            let mut table: TableConfigEntity = store.get_table_config_entity(table_admittance.table_id);
            assert(table.exists(), Errors::INVALID_TABLE);
            // update
            store.set_table_admittance(@table_admittance);
        }

        fn open_table(ref world: IWorldDispatcher, table_id: felt252, is_open: bool) {
            self.assert_caller_is_admin();
            // check table
            let store: Store = StoreTrait::new(world);
            let mut table: TableConfigEntity = store.get_table_config_entity(table_id);
            assert(table.exists(), Errors::INVALID_TABLE);
            // update
            table.is_open = is_open;
            store.update_table_config_entity(@table);
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        #[inline(always)]
        fn assert_caller_is_admin(self: @ContractState) {
            assert(self.am_i_admin(get_caller_address()) == true, Errors::NOT_ADMIN);
        }
        // #[inline(always)]
        // fn assert_caller_is_owner(world: @IWorldDispatcher) {
        //     assert(world.is_owner(self.selector().into(), get_caller_address()) == true, Errors::NOT_ADMIN);
        // }
    }
}
