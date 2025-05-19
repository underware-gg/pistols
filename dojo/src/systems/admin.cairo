use starknet::{ContractAddress};

// based on RYO
// https://github.com/cartridge-gg/rollyourown/blob/market_packed/src/systems/ryo.cairo
// https://github.com/cartridge-gg/rollyourown/blob/market_packed/src/config/ryo.cairo


// Exposed to clients
#[starknet::interface]
pub trait IAdmin<TState> {
    fn am_i_admin(self: @TState, account_address: ContractAddress) -> bool;
    fn set_paused(ref self: TState, paused: bool);
    fn set_treasury(ref self: TState, treasury_address: ContractAddress);
    fn set_is_team_member(ref self: TState, account_address: ContractAddress, is_team_member: bool, is_admin: bool);
    fn set_is_blocked(ref self: TState, account_address: ContractAddress, is_blocked: bool);
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
        player::{PlayerTeamFlags, PlayerFlags},
    };
    use pistols::interfaces::dns::{DnsTrait, SELECTORS};
    use pistols::libs::store::{Store, StoreTrait};

    mod Errors {
        pub const CALLER_NOT_OWNER: felt252     = 'ADMIN: Caller not owner';
        pub const CALLER_NOT_ADMIN: felt252     = 'ADMIN: Caller not admin';
        pub const INVALID_ACCOUNT: felt252      = 'ADMIN: Invalid account address';
        pub const INVALID_TREASURY: felt252     = 'ADMIN: Invalid treasury address';
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
            let mut store: Store = StoreTrait::new(self.world_default());
            (
                store.world.dispatcher.is_owner(SELECTORS::ADMIN, account_address) ||
                store.get_player_is_admin(account_address)
            )
        }

        fn set_paused(ref self: ContractState, paused: bool) {
            self._assert_caller_is_admin();
            let mut store: Store = StoreTrait::new(self.world_default());
            store.set_config_is_paused(paused);
        }

        fn set_treasury(ref self: ContractState, treasury_address: ContractAddress) {
            self._assert_caller_is_admin();
            assert(treasury_address.is_non_zero(), Errors::INVALID_TREASURY);
            let mut store: Store = StoreTrait::new(self.world_default());
            store.set_config_treasury_address(treasury_address);
        }

        fn set_is_team_member(ref self: ContractState, account_address: ContractAddress, is_team_member: bool, is_admin: bool) {
            self._assert_caller_is_admin();
            assert(account_address.is_non_zero(), Errors::INVALID_ACCOUNT);
            let mut store: Store = StoreTrait::new(self.world_default());
            let mut player_flags: PlayerTeamFlags = store.get_player_team_flags(account_address);
            if (is_team_member || is_admin) {
                player_flags.is_team_member = is_team_member;
                player_flags.is_admin = is_admin;
                store.set_player_team_flags(@player_flags);
            } else if (player_flags.is_team_member || player_flags.is_admin) {
                store.delete_player_team_flags(@player_flags);
            }
        }

        fn set_is_blocked(ref self: ContractState, account_address: ContractAddress, is_blocked: bool) {
            self._assert_caller_is_admin();
            assert(account_address.is_non_zero(), Errors::INVALID_ACCOUNT);
            let mut store: Store = StoreTrait::new(self.world_default());
            let mut player_flags: PlayerFlags = store.get_player_flags(account_address);
            if (is_blocked) {
                player_flags.is_blocked = is_blocked;
                store.set_player_flags(@player_flags);
            } else if (player_flags.is_blocked) {
                store.delete_player_flags(@player_flags);
            }
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
            assert(self.am_i_admin(starknet::get_caller_address()), Errors::CALLER_NOT_ADMIN);
        }
        #[inline(always)]
        fn _assert_caller_is_owner(self: @ContractState) {
            let mut world = self.world_default();
            assert(world.dispatcher.is_owner(SELECTORS::ADMIN, starknet::get_caller_address()) == true, Errors::CALLER_NOT_OWNER);
        }
    }
}
