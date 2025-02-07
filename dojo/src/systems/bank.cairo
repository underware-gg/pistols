use starknet::{ContractAddress};

#[starknet::interface]
pub trait IBank<TState> {
    fn charge(ref self: TState, payer: ContractAddress, amount: u256);
    fn burned_fame(ref self: TState, recipient: ContractAddress, fame_amount: u256) -> u256;
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
    use pistols::libs::store::{Store, StoreTrait};
    use pistols::utils::math::{MathTrait};

    pub mod Errors {
        pub const INVALID_SHARES: felt252           = 'BANK: invalid shares';
        pub const INVALID_TREASURY: felt252         = 'BANK: invalid treasury';
        pub const INSUFFICIENT_ALLOWANCE: felt252   = 'BANK: insufficient allowance';
        pub const INSUFFICIENT_BALANCE: felt252     = 'BANK: insufficient balance';
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
        fn charge(ref self: ContractState,
            payer: ContractAddress,
            amount: u256,
        ) {
            let mut store: Store = StoreTrait::new(self.world_default());

            // assert balance/allowance
            let lords_dispatcher: Erc20Dispatcher = store.lords_dispatcher();
            self.assert_balance_allowance(lords_dispatcher, payer, amount);

            // store here until FAME release
            lords_dispatcher.transfer_from(payer, starknet::get_contract_address(), amount);
        }

        fn burned_fame(ref self: ContractState,
            recipient: ContractAddress,
            fame_amount: u256,
        ) -> u256 {
            let mut store: Store = StoreTrait::new(self.world_default());
            // get fame supply
            let fame_dispatcher: IFameCoinDispatcher = store.world.fame_coin_dispatcher();
            let fame_supply: u256 = fame_dispatcher.total_supply() + fame_amount;
            // get lords in pool
            let lords_dispatcher: Erc20Dispatcher = store.lords_dispatcher();
            let lords_in_pool: u256 = lords_dispatcher.balance_of(starknet::get_contract_address());
            //  release proportionally
            let lords_to_release: u256 = MathTrait::map(fame_amount, 0, fame_supply, 0, lords_in_pool);
            lords_dispatcher.transfer_from(starknet::get_contract_address(), recipient, lords_to_release);
            (lords_to_release)
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn assert_balance_allowance(self: @ContractState,
            lords_dispatcher: Erc20Dispatcher,
            payer: ContractAddress,
            amount: u256,
        ) {
            let allowance: u256 = lords_dispatcher.allowance(payer, starknet::get_contract_address());
            assert(allowance >= amount, Errors::INSUFFICIENT_ALLOWANCE);
            let balance: u256 = lords_dispatcher.balance_of(payer);
            assert(balance >= amount, Errors::INSUFFICIENT_BALANCE);
        }
    }
}
