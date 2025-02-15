use starknet::{ContractAddress};
use pistols::models::table::{TableConfig};

// based on RYO
// https://github.com/cartridge-gg/rollyourown/blob/market_packed/src/systems/ryo.cairo
// https://github.com/cartridge-gg/rollyourown/blob/market_packed/src/config/ryo.cairo


// Exposed to clients
#[starknet::interface]
pub trait IAdmin<TState> {
    fn am_i_admin(self: @TState, account_address: ContractAddress) -> bool;
    fn grant_admin(ref self: TState, account_address: ContractAddress, granted: bool);
    fn set_treasury(ref self: TState, treasury_address: ContractAddress);
    fn set_paused(ref self: TState, paused: bool);
    fn set_table(ref self: TState, table: TableConfig);
}

#[dojo::contract]
pub mod admin {
    use core::num::traits::Zero;
    use starknet::{ContractAddress};
    use dojo::world::{WorldStorage, IWorldDispatcherTrait};

    use pistols::models::{
        config::{Config, ConfigManagerTrait},
        table::{TableConfig, TableManagerTrait},
        season::{SeasonManagerTrait},
    };
    use pistols::interfaces::dns::{DnsTrait, SELECTORS};
    use pistols::libs::store::{Store, StoreTrait};

    mod Errors {
        pub const INVALID_OWNER: felt252        = 'ADMIN: Invalid account_address';
        pub const INVALID_TREASURY: felt252     = 'ADMIN: Invalid treasury_address';
        pub const INVALID_TABLE: felt252        = 'ADMIN: Invalid table';
        pub const INVALID_DESCRIPTION: felt252  = 'ADMIN: Invalid description';
        pub const NOT_ADMIN: felt252            = 'ADMIN: not admin';
    }

    fn dojo_init(
        ref self: ContractState,
        treasury_address: ContractAddress,
        lords_address: ContractAddress,
        vrf_address: ContractAddress,
    ) {
        let mut store: Store = StoreTrait::new(self.world_default());
        // initialize tables
        TableManagerTrait::initialize(ref store);
        let season_table_id: felt252 = SeasonManagerTrait::initialize(ref store);
        // initialize Config
        let mut config: Config = ConfigManagerTrait::initialize();
        config.treasury_address = if (treasury_address.is_non_zero()) { treasury_address } else { starknet::get_caller_address() };
        config.lords_address = if (lords_address.is_non_zero()) { lords_address } else { store.world.lords_mock_address() };
        config.vrf_address = if (vrf_address.is_non_zero()) { vrf_address } else { store.world.vrf_mock_address() };
        config.season_table_id = season_table_id;
        config.is_paused = false;
        store.set_config(@config);
    }

    #[generate_trait]
    impl WorldDefaultImpl of WorldDefaultTrait {
        #[inline(always)]
        fn world_default(self: @ContractState) -> WorldStorage {
            (self.world(@"pistols"))
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
                    world.dispatcher.is_writer(SELECTORS::COIN_CONFIG, account_address)
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
            } else {
                world.dispatcher.revoke_writer(SELECTORS::CONFIG, account_address);
                world.dispatcher.revoke_writer(SELECTORS::TABLE_CONFIG, account_address);
                world.dispatcher.revoke_writer(SELECTORS::TOKEN_CONFIG, account_address);
                world.dispatcher.revoke_writer(SELECTORS::COIN_CONFIG, account_address);
            }
        }

        fn set_treasury(ref self: ContractState, treasury_address: ContractAddress) {
            self.assert_caller_is_admin();
            assert(treasury_address.is_non_zero(), Errors::INVALID_TREASURY);
            let mut store: Store = StoreTrait::new(self.world_default());
            store.set_config_treasury_address(treasury_address);
        }

        fn set_paused(ref self: ContractState, paused: bool) {
            self.assert_caller_is_admin();
            let mut store: Store = StoreTrait::new(self.world_default());
            store.set_config_is_paused(paused);
        }

        fn set_table(ref self: ContractState, table: TableConfig) {
            self.assert_caller_is_admin();
            assert(table.table_id != 0, Errors::INVALID_TABLE);
            let mut store: Store = StoreTrait::new(self.world_default());
            store.set_table_config(@table);
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        #[inline(always)]
        fn assert_caller_is_admin(self: @ContractState) {
            assert(self.am_i_admin(starknet::get_caller_address()) == true, Errors::NOT_ADMIN);
        }
        // #[inline(always)]
        // fn assert_caller_is_owner(self: @ContractState) {
        //     assert(world.is_owner(SELECTORS::ADMIN, starknet::get_caller_address()) == true, Errors::NOT_ADMIN);
        // }
    }
}
