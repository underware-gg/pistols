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

    use pistols::models::{
        config::{Config, ConfigTrait, ConfigManagerTrait},
        table::{TableConfig, TableConfigTrait, TableManagerTrait},
        season::{SeasonConfig, SeasonConfigTrait, SeasonManagerTrait},
    };
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
        // initialize tables
        TableManagerTrait::initialize(ref store);
        let season_table_id: felt252 = SeasonManagerTrait::initialize(ref store);
        // initialize Config
        let mut config: Config = ConfigManagerTrait::initialize();
        config.treasury_address = if (treasury_address.is_non_zero()) { treasury_address } else { get_caller_address() };
        config.lords_address = if (lords_address.is_non_zero()) { lords_address } else { world.lords_mock_address() };
        config.vrf_address = if (vrf_address.is_non_zero()) { vrf_address } else { world.vrf_mock_address() };
        config.season_table_id = season_table_id;
        config.is_paused = false;
        store.set_config(@config);
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
            let mut store: Store = StoreTrait::new(self.world_default());
            ConfigManagerTrait::set_treasury(ref store, treasury_address);
        }

        fn set_paused(ref self: ContractState, paused: bool) {
            self.assert_caller_is_admin();
            let mut store: Store = StoreTrait::new(self.world_default());
            ConfigManagerTrait::set_is_paused(ref store, paused);
        }

        fn set_table(ref self: ContractState, table: TableConfig) {
            self.assert_caller_is_admin();
            assert(table.table_id != 0, Errors::INVALID_TABLE);
            let mut store: Store = StoreTrait::new(self.world_default());
            store.set_table_config(@table);
        }

        fn open_table(ref self: ContractState, table_id: felt252, is_open: bool) {
            self.assert_caller_is_admin();
            // check table
            let mut store: Store = StoreTrait::new(self.world_default());
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
