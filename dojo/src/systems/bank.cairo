use starknet::{ContractAddress};
use pistols::models::pool::{PoolType, LordsReleaseBill};

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
    fn charge_purchase(ref self: TState, payer: ContractAddress, lords_amount: u128);
    // transfer LORDS from PoolType::Purchases to PoolType::FamePeg
    // (called by pack_token)
    fn peg_minted_fame_to_purchased_lords(ref self: TState, payer: ContractAddress, lords_amount: u128);
    // transfer LORDS to recipient, removing from PoolType::Purchases
    // (called by duelist_token)
    fn release_lords_from_fame_to_be_burned(ref self: TState, season_id: u32, duel_id: u128, bills: Span<LordsReleaseBill>) -> u128;
    // transfer FAME to payer, adding to PoolType::Season(season_id)
    // (called by duelist_token)
    fn duelist_lost_fame_to_pool(ref self: TState, contract_address: ContractAddress, token_id: u128, fame_amount: u128, pool_id: PoolType);
}

#[dojo::contract]
pub mod bank {
    // use core::num::traits::Zero;
    use starknet::{ContractAddress};
    use dojo::world::{WorldStorage};
    // use dojo::model::{ModelStorage, ModelValueStorage};

    use pistols::interfaces::dns::{
        DnsTrait,
        Erc20Dispatcher, Erc20DispatcherTrait,
        IFameCoinDispatcher, IFameCoinDispatcherTrait,
        IFameCoinProtectedDispatcher, IFameCoinProtectedDispatcherTrait,
        IDuelistTokenDispatcher, IDuelistTokenDispatcherTrait,
    };
    use pistols::models::{
        season::{SeasonConfig, SeasonConfigTrait},
        pool::{Pool, PoolTrait, PoolType, LordsReleaseBill, ReleaseReason},
        leaderboard::{LeaderboardTrait, LeaderboardPosition},
    };
    use pistols::types::{
        rules::{Rules, RulesTrait, RewardDistribution},
        trophies::{TrophyProgressTrait}
    };
    use pistols::libs::store::{Store, StoreTrait};
    use pistols::utils::math::{MathTrait};

    pub mod Errors {
        pub const INVALID_CALLER: felt252           = 'BANK: invalid caller';
        pub const INVALID_AMOUNT: felt252           = 'BANK: invalid amount';
        pub const INVALID_SHARES: felt252           = 'BANK: invalid shares';
        pub const INVALID_TREASURY: felt252         = 'BANK: invalid treasury';
        pub const INSUFFICIENT_ALLOWANCE: felt252   = 'BANK: insufficient allowance';
        pub const INSUFFICIENT_BALANCE: felt252     = 'BANK: insufficient balance';
        pub const INSUFFICIENT_LORDS: felt252       = 'BANK: insufficient LORDS pool';
        pub const INSUFFICIENT_FAME: felt252        = 'BANK: insufficient FAME pool';
        pub const INVALID_SEASON: felt252           = 'BANK: invalid season';
        pub const INVALID_TOURNAMENT: felt252       = 'BANK: invalid tournament';
        pub const IS_PAUSED: felt252                = 'BANK: is paused';
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
            assert(lords_amount != 0, Errors::INVALID_AMOUNT);
            let mut store: Store = StoreTrait::new(self.world_default());
            self._transfer_lords_to_pool(store, payer, lords_amount.into(), PoolType::Purchases);
        }

        fn sponsor_season(ref self: ContractState,
            payer: ContractAddress,
            lords_amount: u128,
        ) {
            assert(lords_amount != 0, Errors::INVALID_AMOUNT);
            let mut store: Store = StoreTrait::new(self.world_default());
            let season: SeasonConfig = store.get_current_season();
            assert(season.is_active(), Errors::INVALID_SEASON);
            self._transfer_lords_to_pool(store, payer, lords_amount.into(), PoolType::Season(season.season_id));
        }

        fn sponsor_tournament(ref self: ContractState,
            payer: ContractAddress,
            lords_amount: u128,
            tournament_id: u64,
        ) {
            assert(lords_amount != 0, Errors::INVALID_AMOUNT);
            let mut store: Store = StoreTrait::new(self.world_default());
            // TODO...
            // let tournament: TournamentSettings = store.get_tournament(tournament_id);
            // assert(tournament.is_active(), Errors::INVALID_TOURNAMENT);
            self._transfer_lords_to_pool(store, payer, lords_amount.into(), PoolType::Tournament(tournament_id));
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
            let mut store: Store = StoreTrait::new(self.world_default());
            assert(!store.get_config_is_paused(), Errors::IS_PAUSED);
            // collect season if permitted
            let mut season: SeasonConfig = store.get_current_season();
            let new_season_id: u32 = season.collect(ref store);
            store.set_config_season_id(new_season_id);
            // release...
            self._release_season_pool(store, season.season_id);
            // arcade
            TrophyProgressTrait::collected_season(@store.world, @starknet::get_caller_address());
            (new_season_id)
        }

    }

    #[abi(embed_v0)]
    impl BankProtectedImpl of super::IBankProtected<ContractState> {
        fn charge_purchase(ref self: ContractState,
            payer: ContractAddress,
            lords_amount: u128,
        ) {
            let mut store: Store = StoreTrait::new(self.world_default());
            assert(store.world.caller_is_world_contract(), Errors::INVALID_CALLER);
            assert(lords_amount != 0, Errors::INVALID_AMOUNT);
            self._transfer_lords_to_pool(store, payer, lords_amount, PoolType::Purchases);
        }

        fn peg_minted_fame_to_purchased_lords(ref self: ContractState,
            payer: ContractAddress,
            lords_amount: u128,
        ) {
            let mut store: Store = StoreTrait::new(self.world_default());
            assert(store.world.caller_is_world_contract(), Errors::INVALID_CALLER);
            assert(lords_amount != 0, Errors::INVALID_AMOUNT);
            let mut pool_purchases: Pool = store.get_pool(PoolType::Purchases);
            let mut pool_peg: Pool = store.get_pool(PoolType::FamePeg);
            pool_purchases.withdraw_lords(lords_amount);
            pool_peg.deposit_lords(lords_amount);
            store.set_pool(@pool_purchases);
            store.set_pool(@pool_peg);
        }

        fn duelist_lost_fame_to_pool(ref self: ContractState,
            contract_address: ContractAddress,
            token_id: u128,
            fame_amount: u128,
            pool_id: PoolType,
        ) {
            let mut store: Store = StoreTrait::new(self.world_default());
            assert(store.world.caller_is_world_contract(), Errors::INVALID_CALLER);
            self._transfer_fame_to_pool(store, contract_address, token_id, fame_amount, pool_id);
        }

        fn release_lords_from_fame_to_be_burned(ref self: ContractState,
            season_id: u32,
            duel_id: u128,
            bills: Span<LordsReleaseBill>,
        ) -> u128 {
            let mut store: Store = StoreTrait::new(self.world_default());
            assert(store.world.caller_is_world_contract(), Errors::INVALID_CALLER);
            // release
            let fame_dispatcher: IFameCoinDispatcher = store.world.fame_coin_dispatcher();
            let fame_supply: u128 = fame_dispatcher.total_supply().low;
            let released_lords: u128 = self._release_pegged_lords(store, season_id, duel_id, fame_supply, @bills);
            (released_lords)
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn _assert_payer_allowance(self: @ContractState,
            lords_dispatcher: @Erc20Dispatcher,
            payer: ContractAddress,
            amount: u128,
        ) {
            let allowance: u128 = (*lords_dispatcher).allowance(payer, starknet::get_contract_address()).low;
            assert(allowance >= amount, Errors::INSUFFICIENT_ALLOWANCE);
            let balance: u128 = (*lords_dispatcher).balance_of(payer).low;
            assert(balance >= amount, Errors::INSUFFICIENT_BALANCE);
        }

        fn _transfer_lords_to_pool(self: @ContractState,
            mut store: Store,
            payer: ContractAddress,
            amount: u128,
            pool_id: PoolType,
        ) {
            // payer must approve() first
            let lords_dispatcher: Erc20Dispatcher = store.lords_dispatcher();
            self._assert_payer_allowance(@lords_dispatcher, payer, amount);
            // transfer to bank
            lords_dispatcher.transfer_from(payer, starknet::get_contract_address(), amount.into());
            // add to pool
            let mut pool: Pool = store.get_pool(pool_id);
            pool.deposit_lords(amount);
            store.set_pool(@pool);
        }

        fn _transfer_fame_to_pool(self: @ContractState,
            mut store: Store,
            contract_address: ContractAddress,
            token_id: u128,
            amount: u128,
            pool_id: PoolType,
        ) {
            // bank is pre-approved for FAME
            let fame_dispatcher: IFameCoinDispatcher = store.world.fame_coin_dispatcher();
            fame_dispatcher.transfer_from_token(contract_address, token_id, starknet::get_contract_address(), amount.into());
            // add to pool
            let mut pool: Pool = store.get_pool(pool_id);
            pool.deposit_fame(amount);
            store.set_pool(@pool);
        }

        fn _release_pegged_lords(ref self: ContractState,
            mut store: Store,
            season_id: u32,
            duel_id: u128,
            fame_supply: u128,
            bills: @Span<LordsReleaseBill>,
        ) -> u128 {
            // calculate lords to be released
            // the full supply of FAME is pegged to PoolType::FamePeg
            // only LORDS in PoolType::FamePeg are pegged to FAME
            let mut pool_peg: Pool = store.get_pool(PoolType::FamePeg);
            let mut lords_released: u128 = 0; // total amount
            let mut pegged_lordses: Array<u128> = array![];
            let mut i: usize = 0;
            while (i < (*bills).len()) {
                let amount: u128 = MathTrait::scale(*bills[i].pegged_fame, fame_supply, pool_peg.balance_lords);
                pegged_lordses.append(amount);
                lords_released += amount;
                i += 1;
            };
            // transfer out
            if (lords_released != 0) {
                let lords_dispatcher: Erc20Dispatcher = store.lords_dispatcher();
                let mut i: usize = 0;
                while (i < (*bills).len()) {
                    let mut bill: LordsReleaseBill = *(*bills)[i];
                    bill.pegged_lords = (*pegged_lordses[i]);
                    lords_dispatcher.transfer(bill.recipient, (bill.pegged_lords + bill.sponsored_lords).into());
                    store.emit_lords_release(season_id, duel_id, @bill);
                    i += 1;
                };
                // remove from pool
                pool_peg.withdraw_lords(lords_released);
                store.set_pool(@pool_peg);
            }
            // return amount released
            (lords_released)
        }

        // - convert PoolType::Season FAME to LORDS
        // - transfer PoolType::Season FAME (as LORDS) to recipients
        // - transfer PoolType::FamePeg LORDS to recipients (sponsors, if any)
        // - burn FAME from PoolType::Season
        // - remove FAME from PoolType::Season
        // - remove LORDS from PoolType::Season (sponsors, if any)
        // - remove LORDS from PoolType::FamePeg (sponsors, if any)
        fn _release_season_pool(ref self: ContractState,
            mut store: Store,
            season_id: u32,
        ) {
            let duelist_dispatcher: IDuelistTokenDispatcher = store.world.duelist_token_dispatcher();
            let fame_dispatcher: IFameCoinDispatcher = store.world.fame_coin_dispatcher();
            let fame_protected_dispatcher: IFameCoinProtectedDispatcher = store.world.fame_coin_protected_dispatcher();
            // gather leaderboards and distribution
            let positions: Span<LeaderboardPosition> = store.get_leaderboard(season_id).get_all_positions();
            let rules: Rules = store.get_season_rules(season_id);
            let distribution: @RewardDistribution = rules.get_season_distribution(positions.len());
            // get pool balances
            let mut pool_season: Pool = store.get_pool(PoolType::Season(season_id));
            let mut due_amount_fame: u128 = pool_season.balance_fame;
            let mut due_amount_lords: u128 = pool_season.balance_lords;
            // calculate bills
            let mut bills: Array<LordsReleaseBill> = array![];
            let mut i: usize = 0;
            while (i < (*distribution.percents).len()) { // distribution is never greater than positions
                let position: LeaderboardPosition = *positions[i];
                let percent: u8 = *((*distribution.percents)[i]);
                let (fame_amount, lords_amount): (u128, u128) = 
                    if (i == (*distribution.percents).len() - 1) {
                        // last one, leave no changes!
                        (due_amount_fame, due_amount_lords)
                    } else {(
                        MathTrait::percentage(pool_season.balance_fame, percent),
                        if (due_amount_lords == 0) {0}
                        else {MathTrait::percentage(pool_season.balance_lords, percent)}
                    )};
                bills.append(LordsReleaseBill {
                    reason: ReleaseReason::LeaderboardPrize(position.position),
                    duelist_id: position.duelist_id,
                    recipient: duelist_dispatcher.owner_of(position.duelist_id.into()),
                    pegged_fame:fame_amount,
                    pegged_lords: 0,
                    sponsored_lords: lords_amount,
                });
                due_amount_fame -= fame_amount;
                due_amount_lords -= lords_amount;
                i += 1;
            };
            // release...
            let fame_supply: u128 = fame_dispatcher.total_supply().low;
            self._release_pegged_lords(store, season_id, 0, fame_supply, @bills.span());
            // burn FAME from pool
            fame_protected_dispatcher.burn(pool_season.balance_fame);
            // empty from pool
            pool_season.empty();
            store.set_pool(@pool_season);
        }
    }
}
