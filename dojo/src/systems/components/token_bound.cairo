use starknet::ContractAddress;
use pistols::utils::hash::{hash_values};

#[starknet::interface]
pub trait ITokenBoundPublic<TState> {
    fn address_of_token(self: @TState, contract_address: ContractAddress, token_id: u128) -> ContractAddress;
    fn balance_of_token(self: @TState, contract_address: ContractAddress, token_id: u128) -> u256;
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
impl TokenBoundAddressImpl of TokenBoundAddressTrait {
    #[inline(always)]
    fn address(contract_address: ContractAddress, token_id: u128) -> ContractAddress {
        (hash_values([contract_address.into(), token_id.into()].span()).try_into().unwrap())
    }
}

#[starknet::component]
pub mod TokenBoundComponent {
    use zeroable::Zeroable;
    use starknet::{ContractAddress, get_contract_address, get_caller_address};
    use dojo::world::{IWorldProvider, IWorldProviderDispatcher, IWorldDispatcher, IWorldDispatcherTrait};
    
    use openzeppelin_token::erc20::{
        ERC20Component,
        ERC20Component::{ERC20Impl, InternalImpl as ERC20InternalImpl},
    };
    use openzeppelin_token::erc20::interface;

    use super::{TokenBoundAddress, TokenBoundAddressTrait};
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
        const ALREADY_REGISTERED: felt252       = 'TOKEN_BOUND: already registered';
        const INVALID_CONTRACT_ADDRESS: felt252 = 'TOKEN_BOUND: invalid contract';
        const INVALID_TOKEN_ID: felt252         = 'TOKEN_BOUND: invalid token id';
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
        +ERC20Component::ERC20HooksTrait<TContractState>,
        impl ERC20: ERC20Component::HasComponent<TContractState>,
        +Drop<TContractState>,
    > of ITokenBoundPublic<ComponentState<TContractState>> {
        fn address_of_token(self: @ComponentState<TContractState>,
            contract_address: ContractAddress,
            token_id: u128,
        ) -> ContractAddress {
            assert(contract_address.is_non_zero(), Errors::INVALID_CONTRACT_ADDRESS);
            assert(token_id > 0, Errors::INVALID_TOKEN_ID);
            (TokenBoundAddressTrait::address(contract_address, token_id))
        }
        fn balance_of_token(self: @ComponentState<TContractState>,
            contract_address: ContractAddress,
            token_id: u128,
        ) -> u256 {
            let recipient: ContractAddress = self.address_of_token(contract_address, token_id);
            let erc20 = get_dep_component!(self, ERC20);
            (erc20.balance_of(recipient))
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
        +ERC20Component::ERC20HooksTrait<TContractState>,
        impl ERC20: ERC20Component::HasComponent<TContractState>,
        +Drop<TContractState>,
    > of ITokenBoundInternal<ComponentState<TContractState>> {
        fn register_token(self: @ComponentState<TContractState>,
            contract_address: ContractAddress,
            token_id: u128,
        ) -> ContractAddress {
            let store: Store = StoreTrait::new(self.get_contract().world());
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
