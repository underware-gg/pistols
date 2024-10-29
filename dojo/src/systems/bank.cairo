use starknet::ContractAddress;
use pistols::models::payment::{Payment};

#[dojo::interface]
trait IBank {
    fn charge(ref world: IWorldDispatcher,
        payer: ContractAddress,
        payment: Payment,
    );
}

#[dojo::contract]
mod bank {
    // use debug::PrintTrait;
    use core::traits::Into;
    use starknet::ContractAddress;
    use starknet::{get_caller_address, get_contract_address};

    use pistols::interfaces::systems::{WorldSystemsTrait};
    use pistols::interfaces::ierc20::{ERC20ABIDispatcher, ERC20ABIDispatcherTrait};
    use pistols::models::{
        config::{Config, ConfigTrait, ConfigEntity, ConfigEntityTrait},
        payment::{Payment, PaymentTrait},
    };
    use pistols::libs::store::{Store, StoreTrait};
    use pistols::utils::misc::{ZERO, WORLD};

    mod Errors {
        const INVALID_SHARES: felt252           = 'BANK: invalid shares';
        const INVALID_TREASURY: felt252         = 'BANK: invalid treasury';
        const INVALID_CLIENT: felt252           = 'BANK: invalid client';
        const INVALID_RANKING: felt252          = 'BANK: invalid ranking';
        const INVALID_OWNER: felt252            = 'BANK: invalid owner';
        const INVALID_POOL: felt252             = 'BANK: invalid pool';
        const INSUFFICIENT_ALLOWANCE: felt252   = 'BANK: insufficient allowance';
        const INSUFFICIENT_BALANCE: felt252     = 'BANK: insufficient balance';
    }

    #[abi(embed_v0)]
    impl BankImpl of super::IBank<ContractState> {
        fn charge(ref world: IWorldDispatcher,
            payer: ContractAddress,
            payment: Payment,
        ) {
            if (payment.amount == 0) { return; }

            let store: Store = StoreTrait::new(world);
            let config: ConfigEntity = store.get_config_entity();

            // assert balance/allowance
            let lords: ERC20ABIDispatcher = config.lords_dispatcher();
            self.assert_balance_allowance(lords, payer, payment.amount);

            // make payments
            let mut amount_due: u256 = payment.amount;
            if (payment.client_percent > 0) {
                // TODO: find client_address
                assert(false, Errors::INVALID_CLIENT);
            }
            if (payment.ranking_percent > 0) {
                // TODO: find ranking_address
                assert(false, Errors::INVALID_RANKING);
            }
            if (payment.owner_percent > 0) {
                // TODO: find owner_address
                assert(false, Errors::INVALID_OWNER);
            }
            if (payment.pool_percent > 0) {
                // TODO: implement prize pools
                assert(false, Errors::INVALID_POOL);
            }
            // remaining to the treasury
            assert(config.treasury_address.is_non_zero(), Errors::INVALID_TREASURY);
            lords.transfer_from(payer, config.treasury_address, amount_due);
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn assert_balance_allowance(self: @ContractState,
            lords: ERC20ABIDispatcher,
            payer: ContractAddress,
            amount: u256,
        ) {
            WORLD(self.world());
            let allowance: u256 = lords.allowance(payer, get_contract_address());
            assert(allowance >= amount, Errors::INSUFFICIENT_ALLOWANCE);
            let balance: u256 = lords.balance_of(payer);
            assert(balance >= amount, Errors::INSUFFICIENT_BALANCE);
        }
    }
}
