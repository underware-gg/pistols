use starknet::{ContractAddress};

#[dojo::interface]
trait ITokenDuelist {
    fn owner_of(world: @IWorldDispatcher, token_id: u256) -> ContractAddress;
}

#[dojo::contract]
mod token_duelist {
    use super::ITokenDuelist;
    use debug::PrintTrait;
    use core::traits::Into;
    use starknet::{ContractAddress, get_contract_address, get_caller_address, get_tx_info};
    use pistols::utils::misc::{WORLD};
    use pistols::tests::tester::tester::{
        LITTLE_BOY, LITTLE_GIRL,
        OWNED_BY_LITTLE_BOY, OWNED_BY_LITTLE_GIRL,
    };

    //---------------------------------------
    // IMinter
    //
    #[abi(embed_v0)]
    impl ERC721MockImpl of ITokenDuelist<ContractState> {
        fn owner_of(world: @IWorldDispatcher, token_id: u256) -> ContractAddress {
            WORLD(world);

            let as_felt: felt252 = token_id.low.into();
            let as_addr: ContractAddress = as_felt.try_into().unwrap();
            
            // known owners...
            if (as_addr == OWNED_BY_LITTLE_BOY()) { return LITTLE_BOY(); }
            if (as_addr == OWNED_BY_LITTLE_GIRL()) { return LITTLE_GIRL(); }

            // low part is always the owner address
            (as_felt.try_into().unwrap())
        }
    }

}
