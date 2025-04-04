use starknet::{ContractAddress};

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
    fn urgent_update(ref self: TState);
}

#[dojo::contract]
pub mod admin {
    use core::num::traits::Zero;
    use starknet::{ContractAddress};
    use dojo::world::{WorldStorage, IWorldDispatcherTrait};

    use pistols::models::{
        config::{Config, ConfigManagerTrait},
        season::{SeasonManagerTrait},
    };
    use pistols::interfaces::dns::{DnsTrait, SELECTORS};
    use pistols::libs::store::{Store, StoreTrait};

    mod Errors {
        pub const CALLER_NOT_OWNER: felt252     = 'ADMIN: Caller not owner';
        pub const CALLER_NOT_ADMIN: felt252     = 'ADMIN: Caller not admin';
        pub const INVALID_OWNER: felt252        = 'ADMIN: Invalid account_address';
        pub const INVALID_TREASURY: felt252     = 'ADMIN: Invalid treasury_address';
        pub const INVALID_DESCRIPTION: felt252  = 'ADMIN: Invalid description';
    }

    fn dojo_init(
        ref self: ContractState,
        treasury_address: ContractAddress,
        lords_address: ContractAddress,
        vrf_address: ContractAddress,
    ) {
        let mut store: Store = StoreTrait::new(self.world_default());
        // initialize season
        let season_id: u32 = SeasonManagerTrait::initialize(ref store);
        // initialize Config
        let mut config: Config = ConfigManagerTrait::initialize();
        config.treasury_address = if (treasury_address.is_non_zero()) { treasury_address } else { starknet::get_caller_address() };
        config.lords_address = if (lords_address.is_non_zero()) { lords_address } else { store.world.lords_mock_address() };
        config.vrf_address = if (vrf_address.is_non_zero()) { vrf_address } else { store.world.vrf_mock_address() };
        config.current_season_id = season_id;
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
                    world.dispatcher.is_writer(SELECTORS::SEASON_CONFIG, account_address) &&
                    world.dispatcher.is_writer(SELECTORS::TOKEN_CONFIG, account_address) &&
                    world.dispatcher.is_writer(SELECTORS::COIN_CONFIG, account_address)
                )
            )
        }

        fn grant_admin(ref self: ContractState, account_address: ContractAddress, granted: bool) {
            self._assert_caller_is_admin();
            assert(account_address.is_non_zero(), Errors::INVALID_OWNER);
            let mut world = self.world_default();
            if (granted) {
                world.dispatcher.grant_writer(SELECTORS::CONFIG, account_address);
                world.dispatcher.grant_writer(SELECTORS::SEASON_CONFIG, account_address);
                world.dispatcher.grant_writer(SELECTORS::TOKEN_CONFIG, account_address);
                world.dispatcher.grant_writer(SELECTORS::COIN_CONFIG, account_address);
            } else {
                world.dispatcher.revoke_writer(SELECTORS::CONFIG, account_address);
                world.dispatcher.revoke_writer(SELECTORS::SEASON_CONFIG, account_address);
                world.dispatcher.revoke_writer(SELECTORS::TOKEN_CONFIG, account_address);
                world.dispatcher.revoke_writer(SELECTORS::COIN_CONFIG, account_address);
            }
        }

        fn set_treasury(ref self: ContractState, treasury_address: ContractAddress) {
            self._assert_caller_is_admin();
            assert(treasury_address.is_non_zero(), Errors::INVALID_TREASURY);
            let mut store: Store = StoreTrait::new(self.world_default());
            store.set_config_treasury_address(treasury_address);
        }

        fn set_paused(ref self: ContractState, paused: bool) {
            self._assert_caller_is_admin();
            let mut store: Store = StoreTrait::new(self.world_default());
            store.set_config_is_paused(paused);
        }

        fn urgent_update(ref self: ContractState) {
            self._assert_caller_is_admin();
            // let mut store: Store = StoreTrait::new(self.world_default());
            // let mut config: Config = store.get_config();
            // config.is_paused = false;
            // store.set_config(@config);
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        #[inline(always)]
        fn _assert_caller_is_admin(self: @ContractState) {
            assert(self.am_i_admin(starknet::get_caller_address()) == true, Errors::CALLER_NOT_ADMIN);
        }
        fn _assert_caller_is_owner(self: @ContractState) {
            let mut world = self.world_default();
            assert(world.dispatcher.is_owner(SELECTORS::ADMIN, starknet::get_caller_address()) == true, Errors::CALLER_NOT_OWNER);
        }
    }
}
