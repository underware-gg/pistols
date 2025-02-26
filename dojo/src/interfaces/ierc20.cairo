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
