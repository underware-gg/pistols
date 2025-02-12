use starknet::ContractAddress;
use pistols::models::payment::{Payment};

#[starknet::interface]
pub trait ITokenComponentPublic<TState> {
    fn can_mint(self: @TState, caller_address: ContractAddress) -> bool;
    fn exists(self: @TState, token_id: u128) -> bool;
    fn is_owner_of(self: @TState, address: ContractAddress, token_id: u128) -> bool;
}

#[starknet::interface]
pub trait ITokenComponentInternal<TState> {
    fn initialize(ref self: TState,
        minter_address: ContractAddress,
        renderer_address: ContractAddress,
        payment: Payment,
    );
    fn mint(ref self: TState, recipient: ContractAddress) -> u128;
    fn burn(ref self: TState, token_id: u128);
    fn assert_exists(self: @TState, token_id: u128);
    fn assert_is_owner_of(self: @TState, address: ContractAddress, token_id: u128);
}

#[starknet::component]
pub mod TokenComponent {
    use zeroable::Zeroable;
    use starknet::{ContractAddress, get_contract_address, get_caller_address};
    use dojo::world::{WorldStorage, IWorldDispatcher, IWorldDispatcherTrait};
    use dojo::contract::components::world_provider::{IWorldProvider};
    
    use openzeppelin_introspection::src5::SRC5Component;
    use openzeppelin_token::erc721::{
        ERC721Component,
        ERC721Component::{InternalImpl as ERC721InternalImpl},
    };

    use pistols::interfaces::systems::{SystemsTrait};
    use pistols::libs::store::{
        Store, StoreTrait,
        TokenConfig, TokenConfigValue,
        Payment,
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
    use super::{ITokenComponentPublic};
    #[embeddable_as(TokenComponentPublicImpl)]
    pub impl TokenComponentPublic<
        TContractState,
        +HasComponent<TContractState>,
        +IWorldProvider<TContractState>,
        +SRC5Component::HasComponent<TContractState>,
        +ERC721Component::ERC721HooksTrait<TContractState>,
        impl ERC721: ERC721Component::HasComponent<TContractState>,
        +Drop<TContractState>,
    > of ITokenComponentPublic<ComponentState<TContractState>> {

        fn can_mint(self: @ComponentState<TContractState>,
            caller_address: ContractAddress,
        ) -> bool {
            let mut world = SystemsTrait::storage(self.get_contract().world_dispatcher(), @"pistols");
            let mut store: Store = StoreTrait::new(world);
            let token_config: TokenConfigValue = store.get_token_config_value(get_contract_address());
            (
                token_config.minter_address.is_zero() ||      // anyone can mint
                caller_address == token_config.minter_address // caller is minter contract
            )
        }

        fn exists(self: @ComponentState<TContractState>, token_id: u128) -> bool {
            let erc721 = get_dep_component!(self, ERC721);
            (erc721._owner_of(token_id.into()).is_non_zero())
        }

        fn is_owner_of(self: @ComponentState<TContractState>,
            address: ContractAddress,
            token_id: u128,
        ) -> bool {
            let erc721 = get_dep_component!(self, ERC721);
            (erc721._owner_of(token_id.into()) == address)
        }
    }


    //-----------------------------------------
    // Internal
    //
    use super::{ITokenComponentInternal};
    #[embeddable_as(TokenComponentInternalImpl)]
    pub impl InternalImpl<
        TContractState,
        +HasComponent<TContractState>,
        +IWorldProvider<TContractState>,
        +SRC5Component::HasComponent<TContractState>,
        +ERC721Component::ERC721HooksTrait<TContractState>,
        impl ERC721: ERC721Component::HasComponent<TContractState>,
        +Drop<TContractState>,
    > of ITokenComponentInternal<ComponentState<TContractState>> {
        fn initialize(ref self: ComponentState<TContractState>,
            minter_address: ContractAddress,
            renderer_address: ContractAddress,
            payment: Payment,
        ) {
            let mut world = SystemsTrait::storage(self.get_contract().world_dispatcher(), @"pistols");
            let mut store: Store = StoreTrait::new(world);
            let token_config: TokenConfig = TokenConfig {
                token_address: get_contract_address(),
                minter_address,
                renderer_address,
                minted_count: 0,
            };
            store.set_token_config(@token_config);
            store.set_payment(@payment);
        }

        fn mint(ref self: ComponentState<TContractState>,
            recipient: ContractAddress,
        ) -> u128 {
            assert(self.can_mint(get_caller_address()), Errors::CALLER_IS_NOT_MINTER);

            // generate next token id
            let mut world = SystemsTrait::storage(self.get_contract().world_dispatcher(), @"pistols");
            let mut store: Store = StoreTrait::new(world);
            let mut token_config: TokenConfig = store.get_token_config(get_contract_address());
            let token_id: u128 = token_config.minted_count + 1;
            token_config.minted_count = token_id;
            store.set_token_config(@token_config);

            let mut erc721 = get_dep_component_mut!(ref self, ERC721);
            erc721.mint(recipient, token_id.into());
            (token_id)
        }

        fn burn(ref self: ComponentState<TContractState>,
            token_id: u128,
        ) {
            assert(self.can_mint(get_caller_address()), Errors::CALLER_IS_NOT_MINTER);
            let mut erc721 = get_dep_component_mut!(ref self, ERC721);
            erc721.burn(token_id.into());
        }

        fn assert_exists(self: @ComponentState<TContractState>, token_id: u128) {
            assert(self.exists(token_id.into()), Errors::INVALID_TOKEN_ID);
        }

        fn assert_is_owner_of(self: @ComponentState<TContractState>,
            address: ContractAddress,
            token_id: u128,
        ) {
            assert(self.is_owner_of(address, token_id.into()), Errors::CALLER_IS_NOT_OWNER);
        }
    }
}
