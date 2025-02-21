use starknet::{ContractAddress};
use pistols::models::pool::{PoolType, LordsReleaseBill};

#[starknet::interface]
pub trait IBank<TState> {
    // IBankPublic
    fn sponsor_duelists(ref self: TState, payer: ContractAddress, lords_amount: u128);
    fn sponsor_season(ref self: TState, payer: ContractAddress, lords_amount: u128);
    fn sponsor_tournament(ref self: TState, payer: ContractAddress, lords_amount: u128, tournament_id: felt252);

    // IBankProtected
    fn charge_purchase(ref self: TState, payer: ContractAddress, lords_amount: u128);
    fn peg_minted_fame_to_purchased_lords(ref self: TState, payer: ContractAddress, lords_amount: u128);
    fn release_lords_from_fame_to_be_burned(ref self: TState, bills: Span<LordsReleaseBill>) -> u128;
    fn duelist_lost_fame_to_pool(ref self: TState, contract_address: ContractAddress, token_id: u128, fame_amount: u128, pool_id: PoolType);
    fn release_season_pool(ref self: TState, table_id: felt252);
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
    fn release_lords_from_fame_to_be_burned(ref self: TState, bills: Span<LordsReleaseBill>) -> u128;
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
        Erc20Dispatcher, Erc20DispatcherTrait,
        IFameCoinDispatcher, IFameCoinDispatcherTrait,
        IDuelistTokenDispatcher, IDuelistTokenDispatcherTrait,
    };
    use pistols::models::{
        season::{SeasonConfig, SeasonConfigTrait},
        pool::{Pool, PoolTrait, PoolType, LordsReleaseBill},
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
            bills: Span<LordsReleaseBill>,
        ) -> u128 {
            let mut store: Store = StoreTrait::new(self.world_default());
            assert(store.world.caller_is_world_contract(), Errors::INVALID_CALLER);
            // release
            let fame_dispatcher: IFameCoinDispatcher = store.world.fame_coin_dispatcher();
            let fame_supply: u128 = fame_dispatcher.total_supply().low;
            let released_lords: u128 = self._release_pegged_lords(store, fame_supply, @bills);
            (released_lords)
        }

        // - convert PoolType::Season FAME to LORDS
        // - transfer PoolType::Season FAME (as LORDS) to recipients
        // - transfer PoolType::FamePeg LORDS to recipients (sponsors, if any)
        // - burn FAME from PoolType::Season
        // - remove FAME from PoolType::Season
        // - remove LORDS from PoolType::Season (sponsors, if any)
        // - remove LORDS from PoolType::FamePeg (sponsors, if any)
        fn release_season_pool(ref self: ContractState,
            table_id: felt252,
        ) {
            let mut store: Store = StoreTrait::new(self.world_default());
            assert(store.world.caller_is_world_contract(), Errors::INVALID_CALLER);
            // gather season data
            let mut pool_season: Pool = store.get_pool(PoolType::Season(table_id));
            let positions: Span<LeaderboardPosition> = store.get_leaderboard(table_id).get_all_positions();
            let rules: RulesType = store.get_table_rules(table_id);
            let distribution: @SeasonDistribution = rules.get_season_distribution(positions.len());
            // get pool balances
            let mut due_amount_fame: u128 = pool_season.balance_fame;
            let mut due_amount_lords: u128 = pool_season.balance_lords;
            // calculate bills
            let duelist_dispatcher: IDuelistTokenDispatcher = store.world.duelist_token_dispatcher();
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
                        MathTrait::percentage(due_amount_fame, percent),
                        if (due_amount_lords == 0) {0}
                        else {MathTrait::percentage(due_amount_lords, percent)}
                    )};
                bills.append(LordsReleaseBill {
                    recipient: duelist_dispatcher.owner_of(position.duelist_id.into()),
                    fame_amount,
                    lords_amount,
                });
                due_amount_fame -= fame_amount;
                due_amount_lords -= lords_amount;
                i += 1;
            };
            // release...
            let fame_dispatcher: IFameCoinDispatcher = store.world.fame_coin_dispatcher();
            let fame_supply: u128 = fame_dispatcher.total_supply().low;
            self._release_pegged_lords(store, fame_supply, @bills.span());
            // burn FAME from pool
            fame_dispatcher.burn(pool_season.balance_fame);
            // empty from pool
            pool_season.empty();
            store.set_pool(@pool_season);
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
            fame_supply: u128,
            bills: @Span<LordsReleaseBill>,
        ) -> u128 {
            // calculate lords to be released
            // the full supply of FAME is pegged to PoolType::FamePeg
            // only LORDS in PoolType::FamePeg are pegged to FAME
            let mut pool_peg: Pool = store.get_pool(PoolType::FamePeg);
            let mut lords_released: u128 = 0; // total amount
            let mut lords_bills: Array<u128> = array![];
            let mut i: usize = 0;
            while (i < (*bills).len()) {
                let amount: u128 = MathTrait::map(*bills[i].fame_amount, 0, fame_supply, 0, pool_peg.balance_lords);
                lords_bills.append(amount);
                lords_released += amount;
                i += 1;
            };
            // transfer out
            if (lords_released != 0) {
                let lords_dispatcher: Erc20Dispatcher = store.lords_dispatcher();
                let mut i: usize = 0;
                while (i < (*bills).len()) {
                    let bill: LordsReleaseBill = *(*bills)[i];
                    let amount: u128 =
                        (*lords_bills[i])       // LORDS pegged with FAME
                        + bill.lords_amount;    // LORDS from sponsors
                    lords_dispatcher.transfer(bill.recipient, amount.into());
                    i += 1;
                };
                // remove from pool
                pool_peg.withdraw_lords(lords_released);
                store.set_pool(@pool_peg);
            }
            // return amount released
            (lords_released)
        }
    }
}
