use starknet::{ContractAddress};

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct MockDuelistOwners {
    #[key]
    pub token_id: u128,
    pub address: ContractAddress,
}

#[starknet::interface]
pub trait IDuelistToken<TState> {
    // ERC
    fn transfer_from(ref self: TState, from: ContractAddress, to: ContractAddress, token_id: u256);
    fn owner_of(self: @TState, token_id: u256) -> ContractAddress;
    // Token
    fn exists(self: @TState, token_id: u128) -> bool;
    fn is_owner_of(self: @TState, address: ContractAddress, token_id: u128) -> bool;
    // Duelist
    fn is_alive(self: @TState, token_id: u128) -> bool;
    fn calc_fame_reward(self: @TState, duelist_id: u128) -> u128;
    fn transfer_fame_reward(ref self: TState, duel_id: u128) -> (i128, i128);
}

#[dojo::contract]
pub mod duelist_token {
    use debug::PrintTrait;
    use core::traits::Into;
    use starknet::{ContractAddress, get_contract_address, get_caller_address, get_tx_info};
    use dojo::world::{WorldStorage};
    use dojo::model::{ModelStorage, ModelValueStorage};

    use super::{IDuelistToken, MockDuelistOwners};
    use pistols::types::constants::{FAME};
    use pistols::utils::misc::{ZERO};
    use pistols::tests::tester::tester::{
        LITTLE_BOY, LITTLE_GIRL,
        OWNED_BY_LITTLE_BOY, OWNED_BY_LITTLE_GIRL,
    };

    #[abi(embed_v0)]
    impl ERC721MockImpl of IDuelistToken<ContractState> {
        fn transfer_from(ref self: ContractState, from: ContractAddress, to: ContractAddress, token_id: u256) {
            let mut world = self.world(@"pistols");
            world.write_model(
                @MockDuelistOwners {
                    token_id: token_id.low,
                    address: to,
                }
            );
        }

        fn owner_of(self: @ContractState, token_id: u256) -> ContractAddress {
            let mut world = self.world(@"pistols");
            let owner: MockDuelistOwners = world.read_model(token_id.low);
            if (owner.address != ZERO()) {
                return owner.address;
            }

            let as_felt: felt252 = token_id.low.into();
            let as_addr: ContractAddress = as_felt.try_into().unwrap();
            
            // known owners...
            if (as_addr == OWNED_BY_LITTLE_BOY()) { return LITTLE_BOY(); }
            if (as_addr == OWNED_BY_LITTLE_GIRL()) { return LITTLE_GIRL(); }

            // low part is always the owner address
            (as_felt.try_into().unwrap())
        }
        fn exists(self: @ContractState, token_id: u128) -> bool {
            (self.owner_of(token_id.into()).is_non_zero())
        }
        fn is_owner_of(self: @ContractState, address: ContractAddress, token_id: u128) -> bool {
            (self.owner_of(token_id.into()) == address)
        }
        fn is_alive(self: @ContractState, token_id: u128) -> bool {
            (true)
        }
        fn calc_fame_reward(self: @ContractState, duelist_id: u128) -> u128 {
            (FAME::MIN_REWARD_AMOUNT.low)
        }
        fn transfer_fame_reward(ref self: ContractState, duel_id: u128) -> (i128, i128) {
            (0, 0)
        }
    }

}
