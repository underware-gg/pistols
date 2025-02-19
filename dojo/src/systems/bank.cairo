use starknet::{ContractAddress};
use pistols::models::pool::{PoolType};

#[starknet::interface]
pub trait IBank<TState> {
    // IBankPublic
    fn sponsor_duelists(ref self: TState, payer: ContractAddress, lords_amount: u256);
    fn sponsor_season(ref self: TState, payer: ContractAddress, lords_amount: u256);
    fn sponsor_tournament(ref self: TState, payer: ContractAddress, lords_amount: u256, tournament_id: felt252);

    // IBankProtected
    fn charge_purchase(ref self: TState, payer: ContractAddress, lords_amount: u256);
    fn minted_fame(ref self: TState, payer: ContractAddress, lords_amount: u256);
    fn burned_fame_release_lords(ref self: TState, recipient: ContractAddress, fame_amount: u256) -> u256;
    fn duelist_lost_fame_to_pool(ref self: TState, contract_address: ContractAddress, token_id: u128, fame_amount: u256, pool_id: PoolType);
}

// Exposed to clients
#[starknet::interface]
trait IBankPublic<TState> {
    fn sponsor_duelists(ref self: TState, payer: ContractAddress, lords_amount: u256);
    fn sponsor_season(ref self: TState, payer: ContractAddress, lords_amount: u256);
    fn sponsor_tournament(ref self: TState, payer: ContractAddress, lords_amount: u256, tournament_id: felt252);
}

// Exposed to world
#[starknet::interface]
trait IBankProtected<TState> {
    // transfer LORDS from payer, adding to Pool::Purchases
    // (called by pack_token)
    fn charge_purchase(ref self: TState, payer: ContractAddress, lords_amount: u256);
    // transfer LORDS from Pool::Purchases to Pool::FamePeg
    // (called by pack_token)
    fn minted_fame(ref self: TState, payer: ContractAddress, lords_amount: u256);
    // transfer LORDS to recipient, removing from Pool::Purchases
    // (called by duelist_token)
    fn burned_fame_release_lords(ref self: TState, recipient: ContractAddress, fame_amount: u256) -> u256;
    // transfer FAME to payer, adding to Pool::Season(table_id)
    // (called by duelist_token)
    fn duelist_lost_fame_to_pool(ref self: TState, contract_address: ContractAddress, token_id: u128, fame_amount: u256, pool_id: PoolType);
    // release Pool::Season(table_id)
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
        pool::{Pool, PoolTrait, PoolType},
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
            lords_amount: u256,
        ) {
            assert(lords_amount != 0, Errors::INVALID_AMOUNT);
            let mut store: Store = StoreTrait::new(self.world_default());
            self._transfer_lords_to_pool(store, payer, lords_amount, PoolType::Bank);
        }

        fn sponsor_season(ref self: ContractState,
            payer: ContractAddress,
            lords_amount: u256,
        ) {
            assert(lords_amount != 0, Errors::INVALID_AMOUNT);
            let mut store: Store = StoreTrait::new(self.world_default());
            let season: SeasonConfig = store.get_current_season();
            assert(season.is_active(), Errors::INVALID_SEASON);
            self._transfer_lords_to_pool(store, payer, lords_amount, PoolType::Season(season.table_id));
        }

        fn sponsor_tournament(ref self: ContractState,
            payer: ContractAddress,
            lords_amount: u256,
            tournament_id: felt252,
        ) {
            assert(lords_amount != 0, Errors::INVALID_AMOUNT);
            let mut store: Store = StoreTrait::new(self.world_default());
            // TODO...
            // let tournament: TournamentConfig = store.get_tournament(tournament_id);
            // assert(tournament.is_active(), Errors::INVALID_TOURNAMENT);
            self._transfer_lords_to_pool(store, payer, lords_amount, PoolType::Tournament(tournament_id));
        }
    }

    #[abi(embed_v0)]
    impl BankProtectedImpl of super::IBankProtected<ContractState> {
        fn charge_purchase(ref self: ContractState,
            payer: ContractAddress,
            lords_amount: u256,
        ) {
            let mut store: Store = StoreTrait::new(self.world_default());
            assert(store.world.caller_is_world_contract(), Errors::INVALID_CALLER);
            assert(lords_amount != 0, Errors::INVALID_AMOUNT);
            self._transfer_lords_to_pool(store, payer, lords_amount, PoolType::Bank);
        }

        fn minted_fame(ref self: ContractState,
            payer: ContractAddress,
            lords_amount: u256,
        ) {
            let mut store: Store = StoreTrait::new(self.world_default());
            assert(store.world.caller_is_world_contract(), Errors::INVALID_CALLER);
            assert(lords_amount != 0, Errors::INVALID_AMOUNT);
            let mut purchases_pool: Pool = store.get_pool(PoolType::Bank);
            let mut fame_peg_pool: Pool = store.get_pool(PoolType::FamePeg);
            purchases_pool.withdraw_lords(lords_amount.low);
            fame_peg_pool.deposit_lords(lords_amount.low);
            store.set_pool(@purchases_pool);
            store.set_pool(@fame_peg_pool);
        }

        fn burned_fame_release_lords(ref self: ContractState,
            recipient: ContractAddress,
            fame_amount: u256,
        ) -> u256 {
            let mut store: Store = StoreTrait::new(self.world_default());
            assert(store.world.caller_is_world_contract(), Errors::INVALID_CALLER);
            // get fame supply
            let fame_dispatcher: IFameCoinDispatcher = store.world.fame_coin_dispatcher();
            let fame_supply: u256 = fame_dispatcher.total_supply() + fame_amount;
            // release proportionally
            let mut pool: Pool = store.get_pool(PoolType::FamePeg);
            let lords_amount: u256 = MathTrait::map(fame_amount, 0, fame_supply, 0, pool.balance_lords.into());
// println!("fame_amount: {} / {}", fame_amount/pistols::types::constants::CONST::ETH_TO_WEI, fame_supply/pistols::types::constants::CONST::ETH_TO_WEI);
// println!("lords_amount: {} / {}", lords_amount/pistols::types::constants::CONST::ETH_TO_WEI, pool.balance_lords/pistols::types::constants::CONST::ETH_TO_WEI.low);
            // transfer out
            if (lords_amount != 0) {
                let lords_dispatcher: Erc20Dispatcher = store.lords_dispatcher();
                lords_dispatcher.transfer(recipient, lords_amount);
                // remove from pool
                pool.withdraw_lords(lords_amount.low);
                store.set_pool(@pool);
            }
            (lords_amount)
        }

        fn duelist_lost_fame_to_pool(ref self: ContractState,
            contract_address: ContractAddress,
            token_id: u128,
            fame_amount: u256,
            pool_id: PoolType,
        ) {
            let mut store: Store = StoreTrait::new(self.world_default());
            assert(store.world.caller_is_world_contract(), Errors::INVALID_CALLER);
            self._transfer_fame_to_pool(store, contract_address, token_id, fame_amount, pool_id);
        }

        fn release_season_pool(ref self: ContractState,
            table_id: felt252,
        ) {
            let mut store: Store = StoreTrait::new(self.world_default());
            assert(store.world.caller_is_world_contract(), Errors::INVALID_CALLER);
            // gather season data
            let positions: Span<LeaderboardPosition> = store.get_leaderboard(table_id).get_all_positions();
            let rules: RulesType = store.get_table_rules(table_id);
            let distribution: @SeasonDistribution = rules.get_season_distribution(positions.len());
            // get pool
            let mut pool: Pool = store.get_pool(PoolType::Season(table_id));


            // pool.withdraw_lords(pool.balance_lords.low);
            store.set_pool(@pool);
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn _assert_payer_allowance(self: @ContractState,
            lords_dispatcher: Erc20Dispatcher,
            payer: ContractAddress,
            amount: u256,
        ) {
            let allowance: u256 = lords_dispatcher.allowance(payer, starknet::get_contract_address());
            assert(allowance >= amount, Errors::INSUFFICIENT_ALLOWANCE);
            let balance: u256 = lords_dispatcher.balance_of(payer);
            assert(balance >= amount, Errors::INSUFFICIENT_BALANCE);
        }

        fn _transfer_lords_to_pool(self: @ContractState,
            mut store: Store,
            payer: ContractAddress,
            amount: u256,
            pool_id: PoolType,
        ) {
            // payer must approve() first
            let lords_dispatcher: Erc20Dispatcher = store.lords_dispatcher();
            self._assert_payer_allowance(lords_dispatcher, payer, amount);
            // transfer to bank
            lords_dispatcher.transfer_from(payer, starknet::get_contract_address(), amount);
            // add to pool
            let mut pool: Pool = store.get_pool(pool_id);
            pool.deposit_lords(amount.low);
            store.set_pool(@pool);
        }

        fn _transfer_fame_to_pool(self: @ContractState,
            mut store: Store,
            contract_address: ContractAddress,
            token_id: u128,
            amount: u256,
            pool_id: PoolType,
        ) {
            // bank is pre-approved for FAME
            let fame_dispatcher: IFameCoinDispatcher = store.world.fame_coin_dispatcher();
            fame_dispatcher.transfer_from_token(contract_address, token_id, starknet::get_contract_address(), amount);
            // add to pool
            let mut pool: Pool = store.get_pool(pool_id);
            pool.deposit_fame(amount.low);
            store.set_pool(@pool);
        }
    }
}
