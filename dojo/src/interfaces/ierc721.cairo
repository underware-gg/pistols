use starknet::{ContractAddress};
use core::num::traits::Zero;
pub use openzeppelin_token::erc721::interface::{
    ERC721ABIDispatcher as Erc721Dispatcher,
    ERC721ABIDispatcherTrait as Erc721DispatcherTrait,
};

pub fn ierc721(contract_address: ContractAddress) -> Erc721Dispatcher {
    assert(contract_address.is_non_zero(), 'ierc721(): null address');
    (Erc721Dispatcher{contract_address})
}
