use starknet::{ContractAddress};

// Exposed to clients
#[starknet::interface]
pub trait IAdmin<TState> {
    fn am_i_admin(self: @TState, account_address: ContractAddress) -> bool;
    fn set_paused(ref self: TState, paused: bool); //@description: Admin function
    fn set_treasury(ref self: TState, treasury_address: ContractAddress); //@description: Admin function
    fn set_realms_address(ref self: TState, realms_address: ContractAddress); //@description: Admin function
    fn set_is_team_member(ref self: TState, account_address: ContractAddress, is_team_member: bool, is_admin: bool); //@description: Admin function
    fn set_is_blocked(ref self: TState, account_address: ContractAddress, is_blocked: bool); //@description: Admin function
    fn disqualify_duelist(ref self: TState, season_id: u32, duelist_id: u128, block_owner: bool) -> bool; //@description: Admin function
    fn qualify_duelist(ref self: TState, season_id: u32, duelist_id: u128) -> u8; //@description: Admin function
    // maintenance functions
    fn urgent_update(ref self: TState); //@description: Admin function
    fn fix_player_bookmark(ref self: TState, player_address: ContractAddress, target_address: ContractAddress, target_id: u128, enabled: bool); //@description: Admin function
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
        leaderboard::{Leaderboard, LeaderboardTrait},
    };
    use pistols::interfaces::dns::{
        DnsTrait, SELECTORS,
        IDuelistTokenDispatcherTrait,
    };
    use pistols::libs::admin_fix::{AdminFixTrait};
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

        fn set_realms_address(ref self: ContractState, realms_address: ContractAddress) {
            self._assert_caller_is_admin();
            let mut store: Store = StoreTrait::new(self.world_default());
            store.set_config_realms_address(realms_address);
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
        
        fn disqualify_duelist(ref self: ContractState, season_id: u32, duelist_id: u128, block_owner: bool) -> bool {
            self._assert_caller_is_admin();
            let mut store: Store = StoreTrait::new(self.world_default());
            let mut leaderboard: Leaderboard = store.get_leaderboard(season_id);
            // remove this duelist from the Leaderaboard...
            let removed_score: bool = leaderboard.remove_duelist_score(duelist_id);
            if (removed_score) {
                store.set_leaderboard(@leaderboard);
            }
            if (block_owner) {
                let owner: ContractAddress = store.world.duelist_token_dispatcher().owner_of(duelist_id.into());
                self.set_is_blocked(owner, true);
            }
            (removed_score)
        }

        fn qualify_duelist(ref self: ContractState, season_id: u32, duelist_id: u128) -> u8 {
            self._assert_caller_is_admin();
            let mut store: Store = StoreTrait::new(self.world_default());
            let mut leaderboard: Leaderboard = store.get_leaderboard(season_id);
            let points: u16 = store.get_scoreboard(season_id, duelist_id.into()).points;
            // ONLY inserts if the score is in top 10!!!!
            let position: u8 = leaderboard.insert_score(duelist_id, points);
            if (position != 0) {
                store.set_leaderboard(@leaderboard);
            }
            (position)
        }

        //------------------------------------
        // maintenance functions
        //
        fn urgent_update(ref self: ContractState) {
            self._assert_caller_is_admin();
            let mut store: Store = StoreTrait::new(self.world_default());
            // post release fix: Introducing Claimable pool
            AdminFixTrait::fix_claimable_pool(ref store);
        }
        fn fix_player_bookmark(ref self: ContractState, player_address: ContractAddress, target_address: ContractAddress, target_id: u128, enabled: bool) {
            self._assert_caller_is_admin();
            let mut store: Store = StoreTrait::new(self.world_default());
            store.emit_player_bookmark(player_address, target_address, target_id, enabled);
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
            let mut world: WorldStorage = self.world_default();
            assert(world.dispatcher.is_owner(SELECTORS::ADMIN, starknet::get_caller_address()), Errors::CALLER_NOT_OWNER);
        }
    }
}
