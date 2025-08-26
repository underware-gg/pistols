use starknet::{ContractAddress};
use core::num::traits::Zero;
pub use openzeppelin_token::erc20::interface::{
    ERC20ABIDispatcher as Erc20Dispatcher,
    ERC20ABIDispatcherTrait as Erc20DispatcherTrait,
};

#[inline(always)]
pub fn ierc20(contract_address: ContractAddress) -> Erc20Dispatcher {
    assert(contract_address.is_non_zero(), 'ierc20(): null address');
    (Erc20Dispatcher{contract_address})
}


//----------------------------------
// Traits
//

pub mod Errors {
    pub const INVALID_AMOUNT: felt252           = 'IERC20: invalid amount';
    pub const INSUFFICIENT_ALLOWANCE: felt252   = 'IERC20: insufficient allowance';
    pub const INSUFFICIENT_BALANCE: felt252     = 'IERC20: insufficient balance';
}

#[generate_trait]
pub impl IErc20Impl of IErc20Trait {
    fn asserted_transfer_from_to(
        from: ContractAddress,
        to: ContractAddress,
        token_address: ContractAddress,
        token_amount: u128,
    ) {
        // check amount
        assert(token_amount != 0, Errors::INVALID_AMOUNT);
        // check balance
        let erc20_dispatcher: Erc20Dispatcher = Erc20Dispatcher{ contract_address: token_address };
        let balance: u128 = erc20_dispatcher.balance_of(from).low;
        assert(balance >= token_amount, Errors::INSUFFICIENT_BALANCE);
        // check allowance
        let allowance: u128 = erc20_dispatcher.allowance(from, starknet::get_contract_address()).low;
        assert(allowance >= token_amount, Errors::INSUFFICIENT_ALLOWANCE);
        // transfer...
        erc20_dispatcher.transfer_from(from, to, token_amount.into());
    }
}
