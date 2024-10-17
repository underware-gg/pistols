#[starknet::component]
pub mod CoinComponent {
    use zeroable::Zeroable;
    use starknet::{ContractAddress, get_contract_address, get_caller_address};
    use dojo::world::{IWorldProvider, IWorldProviderDispatcher, IWorldDispatcher, IWorldDispatcherTrait};
    
    use openzeppelin_introspection::src5::SRC5Component;
    use openzeppelin_token::erc20::{
        ERC20Component,
        ERC20Component::{InternalImpl as ERC20InternalImpl},
    };
    use openzeppelin_token::erc20::interface;

    use pistols::models::coin_config::{
        CoinConfig, CoinConfigStore,
        CoinConfigEntity, CoinConfigEntityStore,
    };
    use pistols::libs::store::{Store, StoreTrait};

    #[storage]
    struct Storage {}

    #[event]
    #[derive(Drop, PartialEq, starknet::Event)]
    pub enum Event {}

    mod Errors {
        const CALLER_IS_NOT_MINTER: felt252 = 'COIN: caller is not minter';
        const FAUCET_UNAVAILABLE: felt252   = 'COIN: faucet unavailable';
    }

    #[generate_trait]
    pub impl InternalImpl<
        TContractState,
        +HasComponent<TContractState>,
        +IWorldProvider<TContractState>,
        +ERC20Component::ERC20HooksTrait<TContractState>,
        impl ERC20: ERC20Component::HasComponent<TContractState>,
        +Drop<TContractState>,
    > of InternalTrait<TContractState> {
        fn _initialize(ref self: ComponentState<TContractState>,
            minter_address: ContractAddress,
            faucet_amount: u128,
        ) {
            let store: Store = StoreTrait::new(self.get_contract().world());
            let coin_config: CoinConfig = CoinConfig{
                coin_address: get_contract_address(),
                minter_address,
                faucet_amount,
            };
            store.set_coin_config(@coin_config);
        }

        fn _can_mint(self: @ComponentState<TContractState>,
            caller_address: ContractAddress,
        ) -> bool {
            let store: Store = StoreTrait::new(self.get_contract().world());
            let coin_config: CoinConfigEntity = store.get_coin_config_entity(get_contract_address());
            (
                coin_config.minter_address.is_zero() ||      // anyone can mint
                caller_address == coin_config.minter_address // caller is minter contract
            )
        }

        fn _mint(ref self: ComponentState<TContractState>,
            recipient: ContractAddress,
            amount: u256,
        ) {
            assert(self._can_mint(get_caller_address()), Errors::CALLER_IS_NOT_MINTER);

            // let erc20 = get_dep_component!(self, ERC20);
            let mut erc20 = get_dep_component_mut!(ref self, ERC20);
            erc20.mint(recipient, amount);
        }

        fn _faucet(ref self: ComponentState<TContractState>,
            recipient: ContractAddress,
        ) {
            let store: Store = StoreTrait::new(self.get_contract().world());
            let coin_config: CoinConfigEntity = store.get_coin_config_entity(get_contract_address());
            assert(coin_config.faucet_amount > 0, Errors::FAUCET_UNAVAILABLE);

            // let erc20 = get_dep_component!(self, ERC20);
            let mut erc20 = get_dep_component_mut!(ref self, ERC20);
            erc20.mint(recipient, coin_config.faucet_amount.into());
        }
    }
}
