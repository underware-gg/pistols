use starknet::{ContractAddress};

#[starknet::interface]
pub trait IBank<TState> {
    fn charge(ref self: TState,
        payer: ContractAddress,
        amount: u256,
    );
}

#[dojo::contract]
pub mod bank {
    // use core::num::traits::Zero;
    use starknet::{ContractAddress};
    use dojo::world::{WorldStorage};
    // use dojo::model::{ModelStorage, ModelValueStorage};

    use pistols::interfaces::ierc20::{ERC20ABIDispatcher, ERC20ABIDispatcherTrait};
    use pistols::models::{
        config::{Config, ConfigTrait},
    };
    use pistols::libs::store::{Store, StoreTrait};

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
            let mut world = self.world_default();
            let mut store: Store = StoreTrait::new(world);
            let config: Config = store.get_config();

            // assert balance/allowance
            let lords: ERC20ABIDispatcher = config.lords_dispatcher();
            self.assert_balance_allowance(lords, payer, amount);

            // store here until FAME release
            lords.transfer_from(payer, starknet::get_contract_address(), amount);
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn assert_balance_allowance(self: @ContractState,
            lords: ERC20ABIDispatcher,
            payer: ContractAddress,
            amount: u256,
        ) {
            let allowance: u256 = lords.allowance(payer, starknet::get_contract_address());
            assert(allowance >= amount, Errors::INSUFFICIENT_ALLOWANCE);
            let balance: u256 = lords.balance_of(payer);
            assert(balance >= amount, Errors::INSUFFICIENT_BALANCE);
        }
    }
}
