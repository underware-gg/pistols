use starknet::{ContractAddress};
use pistols::models::pool::{PoolType, FameReleaseBill};

#[starknet::interface]
pub trait IBank<TState> {
    // IBankPublic
    fn sponsor_duelists(ref self: TState, payer: ContractAddress, lords_amount: u128);
    fn sponsor_season(ref self: TState, payer: ContractAddress, lords_amount: u128);
    fn sponsor_tournament(ref self: TState, payer: ContractAddress, lords_amount: u128, tournament_id: felt252);

    // IBankProtected
    fn charge_purchase(ref self: TState, payer: ContractAddress, lords_amount: u128);
    fn peg_minted_fame_to_purchased_lords(ref self: TState, payer: ContractAddress, lords_amount: u128);
    fn release_lords_from_fame_to_be_burned(ref self: TState, fame_bills: Span<FameReleaseBill>) -> u128;
    fn duelist_lost_fame_to_pool(ref self: TState, contract_address: ContractAddress, token_id: u128, fame_amount: u128, pool_id: PoolType);
}

// Exposed to clients
#[starknet::interface]
trait IBankPublic<TState> {
    fn sponsor_duelists(ref self: TState, payer: ContractAddress, lords_amount: u128);
    fn sponsor_season(ref self: TState, payer: ContractAddress, lords_amount: u128);
    fn sponsor_tournament(ref self: TState, payer: ContractAddress, lords_amount: u128, tournament_id: felt252);
}

// Exposed to world
#[starknet::interface]
trait IBankProtected<TState> {
    // transfer LORDS from payer, adding to PoolType::Purchases
    // (called by pack_token)
    fn charge_purchase(ref self: TState, payer: ContractAddress, lords_amount: u128);
    // transfer LORDS from PoolType::Purchases to PoolType::FamePeg
    // (called by pack_token)
    fn peg_minted_fame_to_purchased_lords(ref self: TState, payer: ContractAddress, lords_amount: u128);
    // transfer LORDS to recipient, removing from PoolType::Purchases
    // (called by duelist_token)
    fn release_lords_from_fame_to_be_burned(ref self: TState, fame_bills: Span<FameReleaseBill>) -> u128;
    // transfer FAME to payer, adding to PoolType::Season(table_id)
    // (called by duelist_token)
    fn duelist_lost_fame_to_pool(ref self: TState, contract_address: ContractAddress, token_id: u128, fame_amount: u128, pool_id: PoolType);
    // release PoolType::Season(table_id)
    // (called by game)
    fn release_season_pool(ref self: TState, table_id: felt252);
}

#[dojo::contract]
pub mod bank {
    // use core::num::traits::Zero;
    use starknet::{ContractAddress};
    use dojo::world::{WorldStorage};
    // use dojo::model::{ModelStorage, ModelValueStorage};

    use pistols::interfaces::dns::{
        DnsTrait,
        IFameCoinDispatcher, IFameCoinDispatcherTrait,
        Erc20Dispatcher, Erc20DispatcherTrait,
    };
    use pistols::models::{
        season::{SeasonConfig, SeasonConfigTrait},
        pool::{Pool, PoolTrait, PoolType, FameReleaseBill},
        leaderboard::{LeaderboardTrait, LeaderboardPosition},
    };
    use pistols::types::rules::{RulesType, RulesTypeTrait, SeasonDistribution};
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
            self._transfer_lords_to_pool(store, payer, lords_amount.into(), PoolType::Season(season.table_id));
        }

        fn sponsor_tournament(ref self: ContractState,
            payer: ContractAddress,
            lords_amount: u128,
            tournament_id: felt252,
        ) {
            assert(lords_amount != 0, Errors::INVALID_AMOUNT);
            let mut store: Store = StoreTrait::new(self.world_default());
            // TODO...
            // let tournament: TournamentConfig = store.get_tournament(tournament_id);
            // assert(tournament.is_active(), Errors::INVALID_TOURNAMENT);
            self._transfer_lords_to_pool(store, payer, lords_amount.into(), PoolType::Tournament(tournament_id));
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
            let mut purchases_pool: Pool = store.get_pool(PoolType::Purchases);
            let mut fame_peg_pool: Pool = store.get_pool(PoolType::FamePeg);
            purchases_pool.withdraw_lords(lords_amount);
            fame_peg_pool.deposit_lords(lords_amount);
            store.set_pool(@purchases_pool);
            store.set_pool(@fame_peg_pool);
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
            fame_bills: Span<FameReleaseBill>,
        ) -> u128 {
            let mut store: Store = StoreTrait::new(self.world_default());
            assert(store.world.caller_is_world_contract(), Errors::INVALID_CALLER);
            // release
            let released_lords: u128 = self._release_pegged_lords_from_peg_pool(store, @fame_bills);
            (released_lords)
        }

        fn release_season_pool(ref self: ContractState,
            table_id: felt252,
        ) {
            // - convert PoolType::Season FAME to LORDS
            // - transfer PoolType::Season FAME (as LORDS) to recipients
            // - transfer PoolType::FamePeg LORDS to recipients (sponsors, if any)
            // - burn FAME from PoolType::Season
            // - remove FAME from PoolType::Season
            // - remove LORDS from PoolType::Season (sponsors, if any)
            // - remove LORDS from PoolType::FamePeg (sponsors, if any)
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

        fn _release_pegged_lords_from_peg_pool(ref self: ContractState,
            mut store: Store,
            fame_bills: @Span<FameReleaseBill>,
        ) -> u128 {
            // get fame supply
            let fame_dispatcher: IFameCoinDispatcher = store.world.fame_coin_dispatcher();
            let fame_supply: u128 = fame_dispatcher.total_supply().low; // the full supply of FAME is pegged to PoolType::FamePeg
            // calculate lords to be released
            let mut pool_peg: Pool = store.get_pool(PoolType::FamePeg);
            let mut lords_bills: Array<u128> = array![];
            let mut lords_released: u128 = 0; // total amount
            let mut i: usize = 0;
            while (i < (*fame_bills).len()) {
                let lords_amount: u128 = MathTrait::map(*fame_bills[i].fame_amount, 0, fame_supply, 0, pool_peg.balance_lords);
                lords_bills.append(lords_amount);
                lords_released += lords_amount;
                i += 1;
            };
            // transfer out
            if (lords_released != 0) {
                let lords_dispatcher: Erc20Dispatcher = store.lords_dispatcher();
                let mut i: usize = 0;
                while (i < (*fame_bills).len()) {
                    lords_dispatcher.transfer(*fame_bills[i].recipient, (*lords_bills[i]).into());
                    i += 1;
                };
            }
            // remove from pool
            pool_peg.withdraw_lords(lords_released);
            store.set_pool(@pool_peg);
            // return amount released
            (lords_released)
        }
    }
}
