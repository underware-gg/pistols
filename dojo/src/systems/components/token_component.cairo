#[starknet::component]
pub mod TokenComponent {
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

    #[generate_trait]
    pub impl InternalImpl<
        TContractState,
        +HasComponent<TContractState>,
        +IWorldProvider<TContractState>,
        +SRC5Component::HasComponent<TContractState>,
        +ERC721Component::ERC721HooksTrait<TContractState>,
        impl ERC721: ERC721Component::HasComponent<TContractState>,
        +Drop<TContractState>,
    > of InternalTrait<TContractState> {
        fn _initialize(ref self: ComponentState<TContractState>,
            minter_address: ContractAddress,
            renderer_address: ContractAddress,
            treasury_address: ContractAddress,
            fee_contract: ContractAddress,
            fee_amount: u128,
        ) {
            let store: Store = StoreTrait::new(self.get_contract().world());
            let token_config: TokenConfig = TokenConfig{
                token_address: get_contract_address(),
                minter_address,
                renderer_address,
                treasury_address,
                fee_contract,
                fee_amount,
                minted_count: 0,
            };
            store.set_token_config(@token_config);
        }

        fn _can_mint(self: @ComponentState<TContractState>,
            caller_address: ContractAddress,
        ) -> bool {
            let store: Store = StoreTrait::new(self.get_contract().world());
            let token_config: TokenConfigEntity = store.get_token_config_entity(get_contract_address());
            (
                token_config.minter_address.is_zero() ||      // anyone can mint
                caller_address == token_config.minter_address // caller is minter contract
            )
        }

        fn _mint(ref self: ComponentState<TContractState>,
            recipient: ContractAddress,
        ) -> u256 {
            assert(self._can_mint(get_caller_address()), Errors::CALLER_IS_NOT_MINTER);

            // get next token id
            let store: Store = StoreTrait::new(self.get_contract().world());
            let mut token_config: TokenConfigEntity = store.get_token_config_entity(get_contract_address());
            let token_id: u128 = token_config.minted_count + 1;

            // update token config
            token_config.minted_count = token_id;
            store.set_token_config_entity(@token_config);

            let mut erc721 = get_dep_component_mut!(ref self, ERC721);
            erc721.mint(recipient, token_id.into());
            (token_id.into())
        }

        fn _burn(ref self: ComponentState<TContractState>,
            token_id: u256,
        ) {
            assert(self._can_mint(get_caller_address()), Errors::CALLER_IS_NOT_MINTER);
            let mut erc721 = get_dep_component_mut!(ref self, ERC721);
            erc721.burn(token_id);
        }

        fn _assert_token_exists(self: @ComponentState<TContractState>,
            caller_address: ContractAddress,
            token_id: u256,
        ) {
            let erc721 = get_dep_component!(self, ERC721);
            assert(erc721._owner_of(token_id).is_non_zero(), Errors::INVALID_TOKEN_ID);
        }

        fn _assert_caller_is_owner(self: @ComponentState<TContractState>,
            caller_address: ContractAddress,
            token_id: u256,
        ) {
            let erc721 = get_dep_component!(self, ERC721);
            assert(erc721._owner_of(token_id) == caller_address, Errors::CALLER_IS_NOT_OWNER);
        }
    }
}
