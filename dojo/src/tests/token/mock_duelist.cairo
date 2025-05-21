use starknet::{ContractAddress};
use pistols::models::challenge::{Challenge};
use pistols::types::rules::{RewardValues, DuelBonus};

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct MockDuelistOwners {
    #[key]
    pub token_id: u128,
    pub address: ContractAddress,
}

#[starknet::interface]
pub trait IMockDuelistToken<TState> {
    // ERC
    fn transfer_from(ref self: TState, from: ContractAddress, to: ContractAddress, token_id: u256);
    fn owner_of(self: @TState, token_id: u256) -> ContractAddress;
    // Token
    fn token_exists(self: @TState, token_id: u128) -> bool;
    fn is_owner_of(self: @TState, address: ContractAddress, token_id: u256) -> bool;
    // Duelist
    fn is_alive(self: @TState, token_id: u128) -> bool;
    fn life_count(self: @TState, duelist_id: u128) -> u8;
    fn transfer_rewards(ref self: TState, challenge: Challenge, tournament_id: u64, bonus: DuelBonus) -> (RewardValues, RewardValues);
    fn get_validated_active_duelist_id(ref self: TState, address: ContractAddress, duelist_id: u128, lives_staked: u8) -> u128;
    fn poke(ref self: TState, duelist_id: u128) -> bool;
    fn sacrifice(ref self: TState, duelist_id: u128);
    fn update_token_metadata(ref self: TState, token_id: u128);
}

#[dojo::contract]
pub mod duelist_token {
    use core::num::traits::Zero;
    use starknet::{ContractAddress};
    use dojo::world::{WorldStorage};
    use dojo::model::{ModelStorage};

    use super::{MockDuelistOwners};
    use pistols::models::challenge::{Challenge};
    use pistols::types::rules::{RewardValues, DuelBonus};
    use pistols::utils::misc::{ZERO};
    use pistols::tests::tester::tester::{
        OWNER, OWNED_BY_OWNER,
        OTHER, OWNED_BY_OTHER,
    };
    // use pistols::systems::tokens::budokan_mock::{PLAYERS};
    use pistols::systems::tokens::duelist_token::duelist_token::{Errors};
    // use pistols::libs::store::{Store, StoreTrait};

    #[generate_trait]
    impl WorldDefaultImpl of WorldDefaultTrait {
        #[inline(always)]
        fn world_default(self: @ContractState) -> WorldStorage {
            (self.world(@"pistols"))
        }
    }

    #[abi(embed_v0)]
    impl ERC721MockImpl of super::IMockDuelistToken<ContractState> {
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

            // OZ always panics on token zero
            assert(token_id.is_non_zero(), 'DUELIS_MOCK: invalid ID');

            // transfered tokens
            let owner: MockDuelistOwners = world.read_model(token_id.low);
            if (owner.address != ZERO()) {
                return owner.address;
            }

            // hard-coded owners
            if (token_id.low == OWNED_BY_OWNER()) { return OWNER(); }
            if (token_id.low == OWNED_BY_OTHER()) { return OTHER(); }

            // let owner: ContractAddress = PLAYERS::from_duelist_id(token_id.low).address;
            // if (owner != ZERO()) { return owner; }

            // low part is always the owner address
            let as_felt: felt252 = token_id.low.into();
            (as_felt.try_into().unwrap())
        }
        fn token_exists(self: @ContractState, token_id: u128) -> bool {
            (self.owner_of(token_id.into()).is_non_zero())
        }
        fn is_owner_of(self: @ContractState, address: ContractAddress, token_id: u256) -> bool {
            (self.owner_of(token_id.into()) == address)
        }
        fn is_alive(self: @ContractState, token_id: u128) -> bool {
            (true)
        }
        fn life_count(self: @ContractState, duelist_id: u128) -> u8 {
            (3)
        }
        fn transfer_rewards(ref self: ContractState, challenge: Challenge, tournament_id: u64, bonus: DuelBonus) -> (RewardValues, RewardValues) {
            (Default::default(), Default::default())
        }
        fn get_validated_active_duelist_id(ref self: ContractState, address: ContractAddress, duelist_id: u128, lives_staked: u8) -> u128 {
            assert(duelist_id.is_non_zero(), Errors::INVALID_DUELIST);
            // let mut store: Store = StoreTrait::new(self.world_default());
            assert(self.is_owner_of(address, duelist_id.into()) == true, Errors::NOT_YOUR_DUELIST);
            (duelist_id)
        }
        fn poke(ref self: ContractState, duelist_id: u128) -> bool {
            (true)
        }
        fn sacrifice(ref self: ContractState, duelist_id: u128) {}
        fn update_token_metadata(ref self: ContractState, token_id: u128) {}
    }

}
