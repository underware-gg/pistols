use starknet::{ContractAddress};

#[dojo::interface]
trait IMockERC721 {
    fn owner_of(world: @IWorldDispatcher, token_id: u256) -> ContractAddress;
}

#[dojo::contract]
mod mock_erc721 {
    use super::IMockERC721;
    use debug::PrintTrait;
    use starknet::{ContractAddress, get_contract_address, get_caller_address, get_tx_info};
    use pistols::libs::utils::{WORLD};

    //---------------------------------------
    // IMinter
    //
    #[abi(embed_v0)]
    impl ERC721MockImpl of IMockERC721<ContractState> {
        fn owner_of(world: @IWorldDispatcher, token_id: u256) -> ContractAddress {
            WORLD(world);
            let as_felt: felt252 = token_id.low.into();
            (as_felt.try_into().unwrap())
        }
    }

}
