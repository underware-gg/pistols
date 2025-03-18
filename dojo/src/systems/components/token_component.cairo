use starknet::{ContractAddress};

#[starknet::interface]
pub trait ITokenComponentPublic<TState> {
    fn can_mint(self: @TState, recipient: ContractAddress) -> bool;
    fn minted_count(self: @TState) -> u128;
}

#[starknet::interface]
pub trait ITokenComponentInternal<TState> {
    fn initialize(ref self: TState,
        minter_address: ContractAddress,
    );
    fn mint(ref self: TState, recipient: ContractAddress) -> u128;
    fn mint_multiple(ref self: TState, recipient: ContractAddress, quantity: usize) -> Span<u128>;
    fn burn(ref self: TState, token_id: u128);
}

#[starknet::component]
pub mod TokenComponent {
    use core::num::traits::Zero;
    use starknet::{ContractAddress};
    use dojo::contract::components::world_provider::{IWorldProvider};
    
    use openzeppelin_introspection::src5::SRC5Component;
    use openzeppelin_token::erc721::{
        ERC721Component,
        ERC721Component::{InternalImpl as ERC721InternalImpl},
    };
    use nft_combo::erc721::erc721_combo::{
        ERC721ComboComponent,
        ERC721ComboComponent::{InternalImpl as ERC721ComboInternalImpl, ERC721MinterImpl},
    };

    use pistols::interfaces::dns::{DnsTrait};
    use pistols::libs::store::{
        Store, StoreTrait,
        TokenConfig, TokenConfigValue,
    };

    #[storage]
    pub struct Storage {}

    #[event]
    #[derive(Drop, PartialEq, starknet::Event)]
    pub enum Event {}

    mod Errors {
        pub const CALLER_IS_NOT_MINTER: felt252 = 'TOKEN: caller is not minter';
    }


    //-----------------------------------------
    // Public
    //
    #[embeddable_as(TokenComponentPublicImpl)]
    pub impl TokenComponentPublic<
        TContractState,
        +HasComponent<TContractState>,
        +IWorldProvider<TContractState>,
        +SRC5Component::HasComponent<TContractState>,
        +ERC721Component::ERC721HooksTrait<TContractState>,
        +ERC721ComboComponent::ERC721ComboHooksTrait<TContractState>,
        impl ERC721: ERC721Component::HasComponent<TContractState>,
        impl ERC721_COMBO: ERC721ComboComponent::HasComponent<TContractState>,
        +Drop<TContractState>,
    > of super::ITokenComponentPublic<ComponentState<TContractState>> {

        fn can_mint(self: @ComponentState<TContractState>,
            recipient: ContractAddress,
        ) -> bool {
            let mut world = DnsTrait::storage(self.get_contract().world_dispatcher(), @"pistols");
            let mut store: Store = StoreTrait::new(world);
            let token_config: TokenConfigValue = store.get_token_config_value(starknet::get_contract_address());
            (
                token_config.minter_address.is_zero() ||      // anyone can mint
                recipient == token_config.minter_address // caller is minter contract
            )
        }

        fn minted_count(self: @ComponentState<TContractState>) -> u128 {
            let erc721_combo = get_dep_component!(self, ERC721_COMBO);
            (erc721_combo.last_token_id().low)
        }
    }


    //-----------------------------------------
    // Internal
    //
    #[embeddable_as(TokenComponentInternalImpl)]
    pub impl InternalImpl<
        TContractState,
        +HasComponent<TContractState>,
        +IWorldProvider<TContractState>,
        +SRC5Component::HasComponent<TContractState>,
        +ERC721Component::ERC721HooksTrait<TContractState>,
        +ERC721ComboComponent::ERC721ComboHooksTrait<TContractState>,
        impl ERC721: ERC721Component::HasComponent<TContractState>,
        impl ERC721_COMBO: ERC721ComboComponent::HasComponent<TContractState>,
        +Drop<TContractState>,
    > of super::ITokenComponentInternal<ComponentState<TContractState>> {
        fn initialize(ref self: ComponentState<TContractState>,
            minter_address: ContractAddress,
        ) {
            let mut world = DnsTrait::storage(self.get_contract().world_dispatcher(), @"pistols");
            let mut store: Store = StoreTrait::new(world);
            let token_config: TokenConfig = TokenConfig {
                token_address: starknet::get_contract_address(),
                minter_address,
                minted_count: 0,
            };
            store.set_token_config(@token_config);
        }

        fn mint(ref self: ComponentState<TContractState>,
            recipient: ContractAddress,
        ) -> u128 {
            (*self.mint_multiple(recipient, 1)[0])
        }

        fn mint_multiple(ref self: ComponentState<TContractState>,
            recipient: ContractAddress,
            quantity: usize,
        ) -> Span<u128> {
            assert(self.can_mint(starknet::get_caller_address()), Errors::CALLER_IS_NOT_MINTER);

            let mut world = DnsTrait::storage(self.get_contract().world_dispatcher(), @"pistols");
            let mut store: Store = StoreTrait::new(world);
            let mut token_config: TokenConfig = store.get_token_config(starknet::get_contract_address());
            let mut erc721_combo = get_dep_component_mut!(ref self, ERC721_COMBO);

            let mut token_ids: Array<u128> = array![];
            let mut i: usize = 0;
            while (i < quantity) {
                token_config.minted_count = erc721_combo._mint_next(recipient).low;
                token_ids.append(token_config.minted_count);
                i += 1;
            };

            store.set_token_config(@token_config);

            (token_ids.span())
        }

        fn burn(ref self: ComponentState<TContractState>,
            token_id: u128,
        ) {
            let erc721_combo = get_dep_component!(@self, ERC721_COMBO);
            erc721_combo._require_owner_of(starknet::get_caller_address(), token_id.into());
            let mut erc721 = get_dep_component_mut!(ref self, ERC721);
            erc721.burn(token_id.into());
        }

    }
}
