use starknet::{ContractAddress};
use core::num::traits::Zero;
pub use openzeppelin_token::erc721::interface::{ERC721ABIDispatcher, ERC721ABIDispatcherTrait};

pub fn ierc721(contract_address: ContractAddress) -> ERC721ABIDispatcher {
    assert(contract_address.is_non_zero(), 'ierc721(): null address');
    (ERC721ABIDispatcher{contract_address})
}
