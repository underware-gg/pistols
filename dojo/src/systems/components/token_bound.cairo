use starknet::ContractAddress;

#[starknet::interface]
pub trait ITokenBoundPublic<TState> {
    fn token_account_address(self: @TState, token_address: ContractAddress, token_id: ContractAddress) -> ContractAddress;
    fn token_balance_of(self: @TState, token_address: ContractAddress, token_id: ContractAddress) -> u256;
}

#[starknet::component]
pub mod TokenBound {
    use zeroable::Zeroable;
    use starknet::{ContractAddress, get_contract_address, get_caller_address};
    use dojo::world::{IWorldProvider, IWorldProviderDispatcher, IWorldDispatcher, IWorldDispatcherTrait};
    
    use openzeppelin_introspection::src5::SRC5Component;
    use openzeppelin_token::erc721::{
        ERC721Component,
        ERC721Component::{InternalImpl as ERC721InternalImpl},
    };
    use openzeppelin_token::erc721::interface;

    use pistols::libs::store::{
        Store, StoreTrait,
        TokenConfig, TokenConfigStore,
        TokenConfigEntity, TokenConfigEntityStore,
    };

    #[storage]
    struct Storage {}

    #[event]
    #[derive(Drop, PartialEq, starknet::Event)]
    pub enum Event {}

    mod Errors {
        const CALLER_IS_NOT_MINTER: felt252 = 'TOKEN: caller is not minter';
        const CALLER_IS_NOT_OWNER: felt252  = 'TOKEN: caller is not owner';
        const INVALID_TOKEN_ID: felt252     = 'TOKEN: invalid token ID';
    }


    //-----------------------------------------
    // Public
    //
    use super::{ITokenBoundPublic};
    #[embeddable_as(TokenBoundPublicImpl)]
    pub impl TokenBoundPublic<
        TContractState,
        +HasComponent<TContractState>,
        +IWorldProvider<TContractState>,
        +SRC5Component::HasComponent<TContractState>,
        +ERC721Component::ERC721HooksTrait<TContractState>,
        impl ERC721: ERC721Component::HasComponent<TContractState>,
        +Drop<TContractState>,
    > of ITokenBoundPublic<ComponentState<TContractState>> {

        fn exists(self: @ComponentState<TContractState>, token_id: u128) -> bool {
            let erc721 = get_dep_component!(self, ERC721);
            (erc721._owner_of(token_id.into()).is_non_zero())
        }
    }


    //-----------------------------------------
    // Internal
    //
    use super::{ITokenBoundInternal};
    #[embeddable_as(TokenBoundInternalImpl)]
    pub impl InternalImpl<
        TContractState,
        +HasComponent<TContractState>,
        +IWorldProvider<TContractState>,
        +SRC5Component::HasComponent<TContractState>,
        +ERC721Component::ERC721HooksTrait<TContractState>,
        impl ERC721: ERC721Component::HasComponent<TContractState>,
        +Drop<TContractState>,
    > of ITokenBoundInternal<ComponentState<TContractState>> {
    }
}
