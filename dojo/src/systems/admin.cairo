use starknet::ContractAddress;
use pistols::models::config::{Config};
use pistols::models::table::{TableConfig};

// based on RYO
// https://github.com/cartridge-gg/rollyourown/blob/market_packed/src/systems/ryo.cairo
// https://github.com/cartridge-gg/rollyourown/blob/market_packed/src/config/ryo.cairo


#[starknet::interface]
pub trait IAdmin<TState> {
    fn am_i_admin(self: @TState, account_address: ContractAddress) -> bool;
    fn grant_admin(ref self: TState, account_address: ContractAddress, granted: bool);

    fn set_treasury(ref self: TState, treasury_address: ContractAddress);
    fn set_paused(ref self: TState, paused: bool);

    fn open_table(ref self: TState, table_id: felt252, is_open: bool);
    fn set_table(ref self: TState, table: TableConfig);
}

#[dojo::contract]
pub mod admin {
    // use debug::PrintTrait;
    use core::traits::Into;
    use starknet::ContractAddress;
    use starknet::{get_caller_address, get_contract_address};
    use dojo::world::{WorldStorage, IWorldDispatcher, IWorldDispatcherTrait};
    use dojo::model::{ModelStorage, ModelValueStorage};

    use pistols::models::config::{Config, ConfigTrait};
    use pistols::models::table::{TableConfig, TableConfigTrait, TableInitializer, TableInitializerTrait};
    use pistols::interfaces::systems::{SystemsTrait, SELECTORS};
    use pistols::libs::store::{Store, StoreTrait};
    use pistols::utils::misc::{ZERO};

    mod Errors {
        const INVALID_OWNER: felt252        = 'ADMIN: Invalid account_address';
        const INVALID_TREASURY: felt252     = 'ADMIN: Invalid treasury_address';
        const INVALID_TABLE: felt252        = 'ADMIN: Invalid table';
        const INVALID_DESCRIPTION: felt252  = 'ADMIN: Invalid description';
        const NOT_ADMIN: felt252            = 'ADMIN: not admin';
    }

    fn dojo_init(
        ref self: ContractState,
        treasury_address: ContractAddress,
        lords_address: ContractAddress,
        vrf_address: ContractAddress,
    ) {
        let mut world = self.world_default();
        let mut store: Store = StoreTrait::new(world);
        // initialize Config
        let mut config: Config = ConfigTrait::new();
        config.treasury_address = if (treasury_address.is_zero()) { get_caller_address() } else { treasury_address };
        config.lords_address = if (lords_address.is_non_zero()) { lords_address } else { world.lords_mock_address() };
        config.vrf_address = if (vrf_address.is_non_zero()) { vrf_address } else { world.vrf_mock_address() };
        config.is_paused = false;
        store.set_config(@config);
        // initialize tables
        let mut initializer: TableInitializer = TableInitializerTrait::new(store);
        initializer.initialize();
    }

    #[generate_trait]
    impl WorldDefaultImpl of WorldDefaultTrait {
        fn world_default(self: @ContractState) -> WorldStorage {
            self.world(@"pistols")
        }
    }

    #[abi(embed_v0)]
    impl AdminImpl of super::IAdmin<ContractState> {
        fn am_i_admin(self: @ContractState, account_address: ContractAddress) -> bool {
            let mut world = self.world_default();
            (
                world.dispatcher.is_owner(SELECTORS::ADMIN, account_address) ||
                (
                    world.dispatcher.is_writer(SELECTORS::CONFIG, account_address) &&
                    world.dispatcher.is_writer(SELECTORS::TABLE_CONFIG, account_address) &&
                    world.dispatcher.is_writer(SELECTORS::TOKEN_CONFIG, account_address) &&
                    world.dispatcher.is_writer(SELECTORS::COIN_CONFIG, account_address) &&
                    world.dispatcher.is_writer(SELECTORS::PAYMENT, account_address)
                )
            )
        }

        fn grant_admin(ref self: ContractState, account_address: ContractAddress, granted: bool) {
            self.assert_caller_is_admin();
            assert(account_address.is_non_zero(), Errors::INVALID_OWNER);
            let mut world = self.world_default();
            if (granted) {
                world.dispatcher.grant_writer(SELECTORS::CONFIG, account_address);
                world.dispatcher.grant_writer(SELECTORS::TABLE_CONFIG, account_address);
                world.dispatcher.grant_writer(SELECTORS::TOKEN_CONFIG, account_address);
                world.dispatcher.grant_writer(SELECTORS::COIN_CONFIG, account_address);
                world.dispatcher.grant_writer(SELECTORS::PAYMENT, account_address);
            } else {
                world.dispatcher.revoke_writer(SELECTORS::CONFIG, account_address);
                world.dispatcher.revoke_writer(SELECTORS::TABLE_CONFIG, account_address);
                world.dispatcher.revoke_writer(SELECTORS::TOKEN_CONFIG, account_address);
                world.dispatcher.revoke_writer(SELECTORS::COIN_CONFIG, account_address);
                world.dispatcher.revoke_writer(SELECTORS::PAYMENT, account_address);
            }
        }

        fn set_treasury(ref self: ContractState, treasury_address: ContractAddress) {
            self.assert_caller_is_admin();
            assert(treasury_address.is_non_zero(), Errors::INVALID_TREASURY);
            // get current
            let mut world = self.world_default();
            let mut store: Store = StoreTrait::new(world);
            let mut config: Config = store.get_config();
            config.treasury_address = treasury_address;
            store.set_config(@config);
        }

        fn set_paused(ref self: ContractState, paused: bool) {
            self.assert_caller_is_admin();
            // get current
            let mut world = self.world_default();
            let mut store: Store = StoreTrait::new(world);
            let mut config: Config = store.get_config();
            // update
            config.is_paused = paused;
            store.set_config(@config);
        }

        fn set_table(ref self: ContractState, table: TableConfig) {
            self.assert_caller_is_admin();
            // check table
            assert(table.table_id != 0, Errors::INVALID_TABLE);
            // update table
            let mut world = self.world_default();
            let mut store: Store = StoreTrait::new(world);
            store.set_table_config(@table);
        }

        fn open_table(ref self: ContractState, table_id: felt252, is_open: bool) {
            self.assert_caller_is_admin();
            // check table
            let mut world = self.world_default();
            let mut store: Store = StoreTrait::new(world);
            let mut table: TableConfig = store.get_table_config(table_id);
            assert(table.exists(), Errors::INVALID_TABLE);
            // update
            table.is_open = is_open;
            store.set_table_config(@table);
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        #[inline(always)]
        fn assert_caller_is_admin(self: @ContractState) {
            assert(self.am_i_admin(get_caller_address()) == true, Errors::NOT_ADMIN);
        }
        // #[inline(always)]
        // fn assert_caller_is_owner(self: @ContractState) {
        //     assert(world.is_owner(SELECTORS::ADMIN, get_caller_address()) == true, Errors::NOT_ADMIN);
        // }
    }
}
