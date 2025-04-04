use starknet::{ContractAddress};
use pistols::utils::hash::{hash_values};
use pistols::utils::misc::{ZERO};

#[starknet::interface]
pub trait ITokenBoundPublic<TState> {
    // get the token_bound address of a token
    fn address_of_token(self: @TState, contract_address: ContractAddress, token_id: u128) -> ContractAddress;
    // get the token contract/id of a token_bound address
    fn token_of_address(self: @TState, address: ContractAddress) -> (ContractAddress, u128);
    // balance of a token
    fn balance_of_token(self: @TState, contract_address: ContractAddress, token_id: u128) -> u256;
    // transfer form token to account
    fn transfer_from_token(ref self: TState,
        contract_address: ContractAddress,
        sender_token_id: u128,
        recipient: ContractAddress,
        amount: u256,
    ) -> bool;
    // transfer between tokens
    fn transfer_from_token_to_token(ref self: TState,
        contract_address: ContractAddress,
        sender_token_id: u128,
        recipient_token_id: u128,
        amount: u256,
    ) -> bool;
    // balance of a token
    fn burn_from_token(ref self: TState, contract_address: ContractAddress, token_id: u128, amount: u256);
}

#[starknet::interface]
pub trait ITokenBoundInternal<TState> {
    fn register_token(self: @TState, contract_address: ContractAddress, token_id: u128) -> ContractAddress;
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct TokenBoundAddress {
    #[key]
    pub recipient: ContractAddress,
    //------------
    pub contract_address: ContractAddress,
    pub token_id: u128,
}

#[generate_trait]
pub impl TokenBoundAddressImpl of TokenBoundAddressTrait {
    #[inline(always)]
    fn address(contract_address: ContractAddress, token_id: u128) -> ContractAddress {
        if (token_id != 0) {hash_values([contract_address.into(), token_id.into()].span()).try_into().unwrap()}
        else {ZERO()} // burn
    }
}

#[starknet::component]
pub mod TokenBoundComponent {
    use core::num::traits::Zero;
    use starknet::{ContractAddress};
    use dojo::contract::components::world_provider::{IWorldProvider};
    
    use openzeppelin_token::erc20::{
        ERC20Component,
        ERC20Component::{ERC20Impl, InternalImpl as ERC20InternalImpl},
    };

    use super::{TokenBoundAddress, TokenBoundAddressTrait};
    use pistols::interfaces::dns::{DnsTrait};
    use pistols::libs::store::{
        Store, StoreTrait,
    };

    #[storage]
    pub struct Storage {}

    #[event]
    #[derive(Drop, PartialEq, starknet::Event)]
    pub enum Event {}

    mod Errors {
        pub const ALREADY_REGISTERED: felt252       = 'TOKEN_BOUND: already registered';
        pub const INVALID_CONTRACT_ADDRESS: felt252 = 'TOKEN_BOUND: invalid contract';
        // pub const INVALID_TOKEN_ID: felt252         = 'TOKEN_BOUND: invalid token id';
    }


    //-----------------------------------------
    // Public
    //
    #[embeddable_as(TokenBoundPublicImpl)]
    pub impl TokenBoundPublic<
        TContractState,
        +HasComponent<TContractState>,
        +IWorldProvider<TContractState>,
        +ERC20Component::ERC20HooksTrait<TContractState>,
        impl ERC20: ERC20Component::HasComponent<TContractState>,
        +Drop<TContractState>,
    > of super::ITokenBoundPublic<ComponentState<TContractState>> {
        fn address_of_token(self: @ComponentState<TContractState>,
            contract_address: ContractAddress,
            token_id: u128,
        ) -> ContractAddress {
            assert(contract_address.is_non_zero(), Errors::INVALID_CONTRACT_ADDRESS);
            // assert(token_id > 0, Errors::INVALID_TOKEN_ID);
            (TokenBoundAddressTrait::address(contract_address, token_id))
        }

        fn token_of_address(self: @ComponentState<TContractState>,
            address: ContractAddress,
        ) -> (ContractAddress, u128) {
            let mut world = DnsTrait::storage(self.get_contract().world_dispatcher(), @"pistols");
            let mut store: Store = StoreTrait::new(world);
            let token_bound_address: TokenBoundAddress = store.get_token_bound_address(address);
            (token_bound_address.contract_address, token_bound_address.token_id)
        }

        fn balance_of_token(self: @ComponentState<TContractState>,
            contract_address: ContractAddress,
            token_id: u128,
        ) -> u256 {
            let recipient: ContractAddress = self.address_of_token(contract_address, token_id);
            let erc20 = get_dep_component!(self, ERC20);
            (erc20.balance_of(recipient))
        }

        fn transfer_from_token(ref self: ComponentState<TContractState>,
            contract_address: ContractAddress,
            sender_token_id: u128,
            recipient: ContractAddress,
            amount: u256,
        ) -> bool {
            let mut erc20 = get_dep_component_mut!(ref self, ERC20);
            (erc20.transfer_from(
                self.address_of_token(contract_address, sender_token_id),
                recipient,
                amount)
            )
        }
        
        fn transfer_from_token_to_token(ref self: ComponentState<TContractState>,
            contract_address: ContractAddress,
            sender_token_id: u128,
            recipient_token_id: u128,
            amount: u256,
        ) -> bool {
            let mut erc20 = get_dep_component_mut!(ref self, ERC20);
            (erc20.transfer_from(
                self.address_of_token(contract_address, sender_token_id),
                self.address_of_token(contract_address, recipient_token_id),
                amount)
            )
        }

        fn burn_from_token(ref self: ComponentState<TContractState>,
            contract_address: ContractAddress,
            token_id: u128,
            amount: u256,
        ) {
            let mut erc20 = get_dep_component_mut!(ref self, ERC20);
            let address: ContractAddress = self.address_of_token(contract_address, token_id);
            erc20.burn(address, amount);
        }
    }


    //-----------------------------------------
    // Internal
    //
    pub impl TokenBoundInternalImpl<
        TContractState,
        +HasComponent<TContractState>,
        +IWorldProvider<TContractState>,
        +ERC20Component::ERC20HooksTrait<TContractState>,
        impl ERC20: ERC20Component::HasComponent<TContractState>,
        +Drop<TContractState>,
    > of super::ITokenBoundInternal<ComponentState<TContractState>> {
        fn register_token(self: @ComponentState<TContractState>,
            contract_address: ContractAddress,
            token_id: u128,
        ) -> ContractAddress {
            let mut world = DnsTrait::storage(self.get_contract().world_dispatcher(), @"pistols");
            let mut store: Store = StoreTrait::new(world);
            // validate address
            let recipient: ContractAddress = self.address_of_token(contract_address, token_id);
            let mut token_bound_address: TokenBoundAddress = store.get_token_bound_address(recipient);
            assert(token_bound_address.contract_address.is_zero(), Errors::ALREADY_REGISTERED);
            // register
            token_bound_address.contract_address = contract_address;
            token_bound_address.token_id = token_id;
            store.set_token_bound_address(@token_bound_address);
            // return the address
            (recipient)
        }
    }
}
