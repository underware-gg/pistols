use starknet::{ContractAddress};
use pistols::models::pool::{PoolType};

#[starknet::interface]
pub trait IBank<TState> {
    // IBankPublic
    fn sponsor_duelists(ref self: TState, payer: ContractAddress, lords_amount: u128);
    fn sponsor_season(ref self: TState, payer: ContractAddress, lords_amount: u128);
    fn sponsor_tournament(ref self: TState, payer: ContractAddress, lords_amount: u128, tournament_id: u64);
    fn can_collect_season(self: @TState) -> bool;
    fn collect_season(ref self: TState) -> u32;
}

// Exposed to clients
#[starknet::interface]
pub trait IBankPublic<TState> {
    fn sponsor_duelists(ref self: TState, payer: ContractAddress, lords_amount: u128); //@description: Sponsor duelist starter packs with $LORDS
    fn sponsor_season(ref self: TState, payer: ContractAddress, lords_amount: u128); //@description: Sponsor the current season with $LORDS
    fn sponsor_tournament(ref self: TState, payer: ContractAddress, lords_amount: u128, tournament_id: u64); //@description: Sponsor a tournament with $LORDS
    fn can_collect_season(self: @TState) -> bool;
    fn collect_season(ref self: TState) -> u32; // @description: Close the current season and start the next one
}

// Exposed to world
#[starknet::interface]
pub trait IBankProtected<TState> {
    // transfer LORDS from payer, adding to PoolType::Purchases
    // (called by pack_token)
    fn charge_lords_purchase(ref self: TState, token_address: ContractAddress, token_ids: Array<u128>, payer: ContractAddress, lords_amount: u128);
    // transfer LORDS from PoolType::Claimable/Purchases to PoolType::FamePeg
    // (called by pack_token)
    fn peg_minted_fame_to_lords(ref self: TState, payer: ContractAddress, fame_amount: u128, lords_amount: u128, source_pool_type: PoolType);
    // transfer LORDS to recipient, removing from PoolType::FamePeg
    // (called by duelist_token)
    fn depeg_lords_from_fame_to_be_burned(ref self: TState, season_id: u32, fame_amount: u128) -> u128;
    // pool migration
    fn transfer_lords(ref self: TState, recipient: ContractAddress, amount: u128);
    // FAME burner (no account should hold fame)
    fn burn_fame(ref self: TState) -> u128;
}

#[dojo::contract]
pub mod bank {
    use core::num::traits::Zero;
    use starknet::{ContractAddress};
    use dojo::world::{WorldStorage};
    // use dojo::model::{ModelStorage, ModelValueStorage};

    use pistols::interfaces::dns::{
        DnsTrait,
        Erc20Dispatcher, Erc20DispatcherTrait,
        IDuelistTokenDispatcher, IDuelistTokenDispatcherTrait,
        IAdminDispatcherTrait,
        IMatchMakerProtectedDispatcherTrait,
        // IFameCoinProtectedDispatcherTrait,
        // IFameCoinDispatcherTrait,
    };
    use pistols::interfaces::ierc20::{IErc20Trait};
    use pistols::models::{
        season::{SeasonConfig, SeasonConfigTrait},
        pool::{Pool, PoolTrait, PoolType},
        events::{SeasonLeaderboardPosition},
        events::{FamePegEvent},
        leaderboard::{LeaderboardTrait, LeaderboardPosition},
        match_queue::{QueueId},
    };
    use pistols::types::{
        rules::{Rules, RulesTrait, PoolDistribution, RewardDistribution},
        trophies::{TrophyProgressTrait}
    };
    use pistols::libs::store::{Store, StoreTrait};
    use pistols::utils::math::{MathTrait};

    pub mod Errors {
        pub const INVALID_ENDPOINT: felt252         = 'BANK: invalid endpoint';
        pub const INVALID_CALLER: felt252           = 'BANK: invalid caller';
        pub const CALLER_NOT_ADMIN: felt252         = 'BANK: caller not admin';
        pub const INVALID_PAYER: felt252            = 'BANK: invalid payer';
        pub const INVALID_RECIPIENT: felt252        = 'BANK: invalid recipient';
        pub const INVALID_LORDS_AMOUNT: felt252     = 'BANK: invalid LORDS amount';
        pub const INVALID_FAME_AMOUNT: felt252      = 'BANK: invalid FAME amount';
        pub const INVALID_SHARES: felt252           = 'BANK: invalid shares';
        pub const INVALID_TREASURY: felt252         = 'BANK: invalid treasury';
        pub const INSUFFICIENT_LORDS: felt252       = 'BANK: insufficient LORDS pool';
        pub const INSUFFICIENT_FAME: felt252        = 'BANK: insufficient FAME pool';
        pub const INVALID_SEASON: felt252           = 'BANK: invalid season';
        pub const INVALID_TOURNAMENT: felt252       = 'BANK: invalid tournament';
        pub const IS_PAUSED: felt252                = 'BANK: is paused';
        pub const SEASON_IS_NOT_ACTIVE: felt252     = 'BANK: Season is not active';
        pub const SEASON_IS_ACTIVE: felt252         = 'BANK: Season is active';
    }

    #[generate_trait]
    impl WorldDefaultImpl of WorldDefaultTrait {
        #[inline(always)]
        fn world_default(self: @ContractState) -> WorldStorage {
            (self.world(@"pistols"))
        }
    }

    #[abi(embed_v0)]
    impl BankPublicImpl of super::IBankPublic<ContractState> {
        fn sponsor_duelists(ref self: ContractState,
            payer: ContractAddress,
            lords_amount: u128,
        ) {
            let mut store: Store = StoreTrait::new(self.world_default());
            self._charge_payer_lords(store,
                payer, // from
                starknet::get_contract_address(), // to
                lords_amount.into(),
                Option::Some(PoolType::Claimable),
            );
        }

        fn sponsor_season(ref self: ContractState,
            payer: ContractAddress,
            lords_amount: u128,
        ) {
            let mut store: Store = StoreTrait::new(self.world_default());
            let season: SeasonConfig = store.get_current_season();
            assert(season.is_active(), Errors::INVALID_SEASON);
            self._charge_payer_lords(store,
                payer, // from
                starknet::get_contract_address(), // to
                lords_amount.into(),
                Option::Some(PoolType::Season(season.season_id)),
            );
        }

        fn sponsor_tournament(ref self: ContractState,
            payer: ContractAddress,
            lords_amount: u128,
            tournament_id: u64,
        ) {
            let mut store: Store = StoreTrait::new(self.world_default());
            // TODO...
            // let tournament: TournamentSettings = store.get_tournament(tournament_id);
            // assert(tournament.is_active(), Errors::INVALID_TOURNAMENT);
            self._charge_payer_lords(store,
                payer, // from
                starknet::get_contract_address(), // to
                lords_amount.into(),
                Option::Some(PoolType::Tournament(tournament_id)),
            );
        }

        fn can_collect_season(self: @ContractState) -> bool {
            let mut store: Store = StoreTrait::new(self.world_default());
            let season: SeasonConfig = store.get_current_season();
            (
                season.can_collect() &&
                !store.get_config_is_paused()
            )
        }

        fn collect_season(ref self: ContractState) -> u32 {
            self._assert_caller_is_admin();
            let mut store: Store = StoreTrait::new(self.world_default());
            assert(!store.get_config_is_paused(), Errors::IS_PAUSED);
            // close Ranked queue
            store.world.matchmaker_protected_dispatcher().close_season(QueueId::Ranked);
            store.world.matchmaker_protected_dispatcher().close_season(QueueId::Unranked);
            // collect season if permitted
            let mut season: SeasonConfig = store.get_current_season();
            let new_season_id: u32 = season.collect(ref store);
            store.set_config_season_id(new_season_id);
            // release leaderboard prizes...
            self._release_season_pool(store, season.season_id);
            // arcade
            TrophyProgressTrait::collected_season(@store.world, @starknet::get_caller_address());
            (new_season_id)
        }

    }

    #[abi(embed_v0)]
    impl BankProtectedImpl of super::IBankProtected<ContractState> {
        fn charge_lords_purchase(ref self: ContractState,
            token_address: ContractAddress,
            token_ids: Array<u128>,
            payer: ContractAddress,
            lords_amount: u128,
        ) {
            // validate caller
            let mut store: Store = StoreTrait::new(self.world_default());
            assert(store.world.caller_is_world_contract(), Errors::INVALID_CALLER);
            // distribute
            let mut amount_to_distribute: u128 = lords_amount;
            let distribution: @PoolDistribution = RulesTrait::get_purchase_distribution(@store);
            //
            // > % Underware
            let lords_underware: u128 = MathTrait::percentage(lords_amount, *distribution.underware_percent);
            if (lords_underware.is_non_zero()) {
                self._charge_payer_lords(store,
                    payer, // from
                    *distribution.underware_address, // to
                    lords_underware,
                    Option::None,
                );
                amount_to_distribute -= lords_underware;
            }
            //
            // > % Realms
            let lords_realms: u128 = MathTrait::percentage(lords_amount, *distribution.realms_percent);
            if (lords_realms.is_non_zero()) {
                self._charge_payer_lords(store,
                    payer, // from
                    *distribution.realms_address, // to
                    lords_realms,
                    Option::None,
                );
                amount_to_distribute -= lords_realms;
            }
            //
            // > % fees
            let lords_fees: u128 = MathTrait::percentage(lords_amount, *distribution.fees_percent);
            if (lords_fees.is_non_zero()) {
                if ((*distribution.fees_address).is_non_zero()) {
                    self._charge_payer_lords(store,
                        payer, // from
                        *distribution.fees_address, // to
                        lords_fees,
                        Option::None,
                    );
                } else {
                    self._charge_payer_lords(store,
                        payer, // from
                        starknet::get_contract_address(), // to
                        lords_fees,
                        Option::Some(*distribution.fees_pool_id),
                    );
                }
                amount_to_distribute -= lords_fees;
            }
            //
            // > (remaining) season pool
            let lords_season: u128 = amount_to_distribute;
            self._charge_payer_lords(store,
                payer, // from
                starknet::get_contract_address(), // to
                lords_season,
                Option::Some(*distribution.season_pool_id),
            );
            // this one is for history
            let season_id: u32 = store.get_current_season_id();
            store.emit_purchase_distribution(
                season_id,
                payer,
                token_address,
                token_ids,
                lords_amount,
                lords_underware,
                lords_realms,
                lords_fees,
                lords_season,
            );
        }

        // pool migration
        fn transfer_lords(ref self: ContractState, recipient: ContractAddress, amount: u128) {
            assert(false, Errors::INVALID_ENDPOINT);
            // let mut store: Store = StoreTrait::new(self.world_default());
            // assert(store.world.caller_is_world_contract(), Errors::INVALID_CALLER);
            // self._charge_payer_lords(store,
            //     starknet::get_contract_address(), // from
            //     recipient, // to
            //     amount,
            //     Option::None,
            // );
        }

        fn burn_fame(ref self: ContractState) -> u128 {
            assert(false, Errors::INVALID_ENDPOINT);
            (0)
            // let mut store: Store = StoreTrait::new(self.world_default());
            // assert(store.world.caller_is_world_contract(), Errors::INVALID_CALLER);
            // let balance: u128 = store.world.fame_coin_dispatcher().balance_of(starknet::get_contract_address()).low;
            // if (balance.is_non_zero()) {
            //     store.world.fame_coin_protected_dispatcher().burn(balance);
            // }
            // (balance)
        }

        fn peg_minted_fame_to_lords(ref self: ContractState,
            payer: ContractAddress,
            fame_amount: u128,
            lords_amount: u128,
            source_pool_type: PoolType, // Purchases or Claimable
        ) {
            // called when a duelist is minted only
            let mut store: Store = StoreTrait::new(self.world_default());
            assert(store.world.caller_is_duelist_token_contract(), Errors::INVALID_CALLER);
            // both amounts must be non-zero, dynamically pegged to each other
            assert(lords_amount.is_non_zero(), Errors::INVALID_LORDS_AMOUNT);
            assert(fame_amount.is_non_zero(), Errors::INVALID_FAME_AMOUNT);
            // get pools
            let mut pool_source: Pool = store.get_pool(source_pool_type);
            let mut pool_peg: Pool = store.get_pool(PoolType::FamePeg);
            // transfer LORDS from source to peg pool
            pool_source.withdraw_lords(lords_amount);
            pool_peg.deposit_lords(lords_amount);
            // FAME just for record/de-pegging (not transferred)
            pool_peg.deposit_fame(fame_amount);
            // store
            store.set_pool(@pool_source);
            store.set_pool(@pool_peg);
            // emit event
            store.emit_fame_peg(@FamePegEvent {
                season_id: store.get_current_season_id(),
                source_pool_id: pool_source.pool_id,
                target_pool_id: pool_peg.pool_id,
                lords_amount,
                fame_amount,
            });
        }

        fn depeg_lords_from_fame_to_be_burned(ref self: ContractState,
            season_id: u32,
            fame_amount: u128,
        ) -> u128 {
            let mut store: Store = StoreTrait::new(self.world_default());
            assert(store.world.caller_is_duelist_token_contract(), Errors::INVALID_CALLER);
            // amounts must be non-zero
            assert(fame_amount.is_non_zero(), Errors::INVALID_FAME_AMOUNT);
            // get pools
            let mut pool_peg: Pool = store.get_pool(PoolType::FamePeg);
            let mut pool_season: Pool = store.get_pool(PoolType::Season(season_id));
            // calculate lords amount
            let lords_amount: u128 = MathTrait::scale(fame_amount, pool_peg.balance_fame, pool_peg.balance_lords);
// println!("B: de-peg: {} : {} > {} = {}", fame_amount, pool_peg.balance_fame, pool_peg.balance_lords, lords_amount);
            assert(lords_amount.is_non_zero(), Errors::INVALID_LORDS_AMOUNT);
            // remove FAME tracking
            pool_peg.withdraw_fame(fame_amount);
            // transfer LORDS to the season prize pool
            pool_peg.withdraw_lords(lords_amount);
            pool_season.deposit_lords(lords_amount);
            // store
            store.set_pool(@pool_peg);
            store.set_pool(@pool_season);
            // emit event
            store.emit_fame_peg(@FamePegEvent {
                season_id,
                source_pool_id: pool_peg.pool_id,
                target_pool_id: pool_season.pool_id,
                lords_amount,
                fame_amount,
            });
            // return amount released
            (lords_amount)
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn _assert_caller_is_admin(self: @ContractState) {
            let mut world: WorldStorage = self.world_default();
            assert(world.admin_dispatcher().am_i_admin(starknet::get_caller_address()), Errors::CALLER_NOT_ADMIN);
        }

        fn _charge_payer_lords(ref self: ContractState,
            mut store: Store,
            payer: ContractAddress,
            recipient: ContractAddress,
            lords_amount: u128,
            pool_id: Option<PoolType>,
        ) {
            assert(payer.is_non_zero(), Errors::INVALID_PAYER);
            assert(recipient.is_non_zero(), Errors::INVALID_RECIPIENT);
            assert(lords_amount.is_non_zero(), Errors::INVALID_LORDS_AMOUNT);
            // transfer funds...
            if (payer != recipient) {
                IErc20Trait::asserted_transfer_from_to(
                    payer, // from
                    recipient, // to
                    store.get_config_lords_address(), // token_address
                    lords_amount, // token_amount
                );
            }
            // add to pool
            if let Some(pool_id) = pool_id {
                let mut pool: Pool = store.get_pool(pool_id);
                pool.deposit_lords(lords_amount);
                store.set_pool(@pool);
            }
        }

        fn _release_season_pool(ref self: ContractState,
            mut store: Store,
            season_id: u32,
        ) {
            let duelist_dispatcher: IDuelistTokenDispatcher = store.world.duelist_token_dispatcher();
            let lords_dispatcher: Erc20Dispatcher = store.lords_dispatcher();
            // gather leaderboards and distribution
            let positions: Span<LeaderboardPosition> = store.get_leaderboard(season_id).get_all_positions();
            let rules: Rules = store.get_season_rules(season_id);
            let distribution: @RewardDistribution = rules.get_season_distribution(positions.len());
            // get pool balances
            let mut pool_season: Pool = store.get_pool(PoolType::Season(season_id));
            let mut due_amount_lords: u128 = pool_season.balance_lords;
            // calculate bills
            let mut season_positions: Array<SeasonLeaderboardPosition> = array![];
            for i in 0..(*distribution.percents).len() { // distribution is never greater than positions
                let position: LeaderboardPosition = *positions[i];
                let percent: u8 = *((*distribution.percents)[i]);
                let lords_amount: u128 =
                    // nothing here!
                    if (due_amount_lords == 0) {0}
                    // last one, leave no changes!
                    else if (i == distribution.percents.len() - 1) {(due_amount_lords)}
                    // calculate percentage
                    else {MathTrait::percentage(pool_season.balance_lords, percent)};

                // calculate bill
                // let bill: LordsReleaseBill = LordsReleaseBill {
                //     reason: ReleaseReason::LeaderboardPrize(position.position),
                //     duelist_id: position.duelist_id,
                //     recipient: duelist_dispatcher.owner_of(position.duelist_id.into()),
                //     pegged_fame:fame_amount,
                //     pegged_lords: 0,
                //     sponsored_lords: lords_amount,
                // };

                //
                // TODO: emit event for the client
                //

                // transfer to player
                let recipient: ContractAddress = duelist_dispatcher.owner_of(position.duelist_id.into());
                lords_dispatcher.transfer(recipient, lords_amount.into());
                // store for event
                season_positions.append(SeasonLeaderboardPosition {
                    duelist_id: position.duelist_id,
                    points: position.points,
                    player_address: recipient,
                    lords_amount,
                });
                // next...
                due_amount_lords -= lords_amount;
            };
            // empty from pool
            pool_season.empty();
            store.set_pool(@pool_season);
            // emit season leaderboard event
            store.emit_season_leaderboard(season_id, season_positions);
        }
    }
}
