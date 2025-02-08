use starknet::{ContractAddress};
use pistols::models::pool::{PoolType};

#[starknet::interface]
pub trait IBank<TState> {
    // transfer LORDS from payer, adding to the Bank pool
    // (called by pack_token)
    fn charge_purchase(ref self: TState, payer: ContractAddress, lords_amount: u256);
    // transfer LORDS to recipient, removing from the Bank pool
    // (called by duelist_token)
    fn burned_fame_release_lords(ref self: TState, recipient: ContractAddress, fame_amount: u256) -> u256;
    // transfer FAME to payer, adding to the Season pool
    // (called by duelist_token)
    fn duelist_lost_fame(ref self: TState, contract_address: ContractAddress, token_id: u128, fame_amount: u256, pool_id: PoolType);

    // IBankPublic
    fn sponsor_season(ref self: TState, payer: ContractAddress, lords_amount: u256);
    fn sponsor_tournament(ref self: TState, payer: ContractAddress, lords_amount: u256, tournament_id: felt252);
}

#[starknet::interface]
pub trait IBankPublic<TState> {
    fn sponsor_season(ref self: TState, payer: ContractAddress, lords_amount: u256);
    fn sponsor_tournament(ref self: TState, payer: ContractAddress, lords_amount: u256, tournament_id: felt252);
}

#[dojo::contract]
pub mod bank {
    // use core::num::traits::Zero;
    use starknet::{ContractAddress};
    use dojo::world::{WorldStorage};
    // use dojo::model::{ModelStorage, ModelValueStorage};

    use pistols::interfaces::systems::{
        SystemsTrait,
        IFameCoinDispatcher, IFameCoinDispatcherTrait,
        Erc20Dispatcher, Erc20DispatcherTrait,
    };
    use pistols::models::{
        season::{SeasonConfig, SeasonConfigTrait},
        pool::{Pool, PoolTrait, PoolType},
    };
    use pistols::libs::store::{Store, StoreTrait};
    use pistols::utils::math::{MathTrait};

    pub mod Errors {
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
    impl BankImpl of super::IBank<ContractState> {
        fn charge_purchase(ref self: ContractState,
            payer: ContractAddress,
            lords_amount: u256,
        ) {
            assert(lords_amount != 0, Errors::INVALID_AMOUNT);
            let mut store: Store = StoreTrait::new(self.world_default());
            self.transfer_lords_to_pool(store, payer, lords_amount, PoolType::Bank);
        }

        fn sponsor_season(ref self: ContractState,
            payer: ContractAddress,
            lords_amount: u256,
        ) {
            assert(lords_amount != 0, Errors::INVALID_AMOUNT);
            let mut store: Store = StoreTrait::new(self.world_default());
            let season: SeasonConfig = store.get_current_season();
            assert(season.is_active(), Errors::INVALID_SEASON);
            self.transfer_lords_to_pool(store, payer, lords_amount, PoolType::Season(season.table_id));
        }

        fn sponsor_tournament(ref self: ContractState,
            payer: ContractAddress,
            lords_amount: u256,
            tournament_id: felt252,
        ) {
            assert(lords_amount != 0, Errors::INVALID_AMOUNT);
            let mut store: Store = StoreTrait::new(self.world_default());
            // let tournament: TournamentConfig = store.get_tournament(tournament_id);
            // assert(tournament.is_active(), Errors::INVALID_TOURNAMENT);
            self.transfer_lords_to_pool(store, payer, lords_amount, PoolType::Tournament(tournament_id));
        }

        fn burned_fame_release_lords(ref self: ContractState,
            recipient: ContractAddress,
            fame_amount: u256,
        ) -> u256 {
            let mut store: Store = StoreTrait::new(self.world_default());
            // get fame supply
            let fame_dispatcher: IFameCoinDispatcher = store.world.fame_coin_dispatcher();
            let fame_supply: u256 = fame_dispatcher.total_supply() + fame_amount;
            // release proportionally
            let mut pool: Pool = store.get_pool(PoolType::Bank);
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

        fn duelist_lost_fame(ref self: ContractState,
            contract_address: ContractAddress,
            token_id: u128,
            fame_amount: u256,
            pool_id: PoolType,
        ) {
            let mut store: Store = StoreTrait::new(self.world_default());
            self.transfer_fame_to_pool(store, contract_address, token_id, fame_amount, pool_id);
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn assert_payer_allowance(self: @ContractState,
            lords_dispatcher: Erc20Dispatcher,
            payer: ContractAddress,
            amount: u256,
        ) {
            let allowance: u256 = lords_dispatcher.allowance(payer, starknet::get_contract_address());
            assert(allowance >= amount, Errors::INSUFFICIENT_ALLOWANCE);
            let balance: u256 = lords_dispatcher.balance_of(payer);
            assert(balance >= amount, Errors::INSUFFICIENT_BALANCE);
        }

        fn transfer_lords_to_pool(self: @ContractState,
            mut store: Store,
            payer: ContractAddress,
            amount: u256,
            pool_id: PoolType,
        ) {
            // payer must approve() first
            let lords_dispatcher: Erc20Dispatcher = store.lords_dispatcher();
            self.assert_payer_allowance(lords_dispatcher, payer, amount);
            // transfer here
            lords_dispatcher.transfer_from(payer, starknet::get_contract_address(), amount);
            // add to pool
            let mut pool: Pool = store.get_pool(pool_id);
            pool.deposit_lords(amount.low);
            store.set_pool(@pool);
        }

        fn transfer_fame_to_pool(self: @ContractState,
            mut store: Store,
            contract_address: ContractAddress,
            token_id: u128,
            amount: u256,
            pool_id: PoolType,
        ) {
            // payer must approve() first
            let fame_dispatcher: IFameCoinDispatcher = store.world.fame_coin_dispatcher();
            fame_dispatcher.transfer_from_token(contract_address, token_id, starknet::get_contract_address(), amount);
            // add to pool
            let mut pool: Pool = store.get_pool(pool_id);
            pool.deposit_fame(amount.low);
            store.set_pool(@pool);
        }
    }
}
