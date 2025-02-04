use starknet::{ContractAddress};
use core::num::traits::Zero;
pub use openzeppelin_token::erc20::interface::{ERC20ABIDispatcher, ERC20ABIDispatcherTrait};

pub fn ierc20(contract_address: ContractAddress) -> ERC20ABIDispatcher {
    assert(contract_address.is_non_zero(), 'ierc20(): null address');
    (ERC20ABIDispatcher{contract_address})
}
