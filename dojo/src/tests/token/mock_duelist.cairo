use starknet::{ContractAddress};
use pistols::models::challenge::{Challenge};
use pistols::models::table::{FeeValues};

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
    fn life_count(self: @TState, duelist_id: u128) -> u8;
    fn transfer_rewards(ref self: TState, challenge: Challenge, tournament_id: u128) -> (FeeValues, FeeValues);
    fn poke(ref self: TState, duelist_id: u128) -> bool;
}

#[dojo::contract]
pub mod duelist_token {
    use core::num::traits::Zero;
    use starknet::{ContractAddress};
    use dojo::world::{WorldStorage};
    use dojo::model::{ModelStorage};

    use super::{MockDuelistOwners};
    use pistols::models::challenge::{Challenge};
    use pistols::models::table::{FeeValues};
    use pistols::utils::misc::{ZERO};
    use pistols::tests::tester::tester::{
        OWNER, OWNED_BY_OWNER,
        OTHER, OWNED_BY_OTHER,
    };

    #[generate_trait]
    impl WorldDefaultImpl of WorldDefaultTrait {
        #[inline(always)]
        fn world_default(self: @ContractState) -> WorldStorage {
            (self.world(@"pistols"))
        }
    }

    #[abi(embed_v0)]
    impl ERC721MockImpl of super::IDuelistToken<ContractState> {
        fn transfer_from(ref self: ContractState, from: ContractAddress, to: ContractAddress, token_id: u256) {
            let mut world = self.world_default();
            world.write_model(
                @MockDuelistOwners {
                    token_id: token_id.low,
                    address: to,
                }
            );
        }

        fn owner_of(self: @ContractState, token_id: u256) -> ContractAddress {
            let mut world = self.world_default();

            // transfered tokens
            let owner: MockDuelistOwners = world.read_model(token_id.low);
            if (owner.address != ZERO()) {
                return owner.address;
            }

            // hard-coded owners
            if (token_id.low == OWNED_BY_OWNER()) { return OWNER(); }
            if (token_id.low == OWNED_BY_OTHER()) { return OTHER(); }

            // low part is always the owner address
            let as_felt: felt252 = token_id.low.into();
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
        fn life_count(self: @ContractState, duelist_id: u128) -> u8 {
            (3)
        }
        fn transfer_rewards(ref self: ContractState, challenge: Challenge, tournament_id: u128) -> (FeeValues, FeeValues) {
            (Default::default(), Default::default())
        }
        fn poke(ref self: ContractState, duelist_id: u128) -> bool {
            (true)
        }
    }

}
