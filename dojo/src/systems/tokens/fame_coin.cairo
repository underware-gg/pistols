use starknet::{ContractAddress};
use dojo::world::IWorldDispatcher;

#[starknet::interface]
pub trait IFameCoin<TState> {
    // IWorldProvider
    fn world(self: @TState,) -> IWorldDispatcher;

    // IERC20
    fn total_supply(self: @TState) -> u256;
    fn balance_of(self: @TState, account: ContractAddress) -> u256;
    fn allowance(self: @TState, owner: ContractAddress, spender: ContractAddress) -> u256;
    fn transfer(ref self: TState, recipient: ContractAddress, amount: u256) -> bool;
    fn transfer_from(ref self: TState, sender: ContractAddress, recipient: ContractAddress, amount: u256) -> bool;
    fn approve(ref self: TState, spender: ContractAddress, amount: u256) -> bool;
    // IERC20Metadata
    fn name(self: @TState) -> ByteArray;
    fn symbol(self: @TState) -> ByteArray;
    fn decimals(self: @TState) -> u8;
    // IERC20CamelOnly
    fn totalSupply(self: @TState) -> u256;
    fn balanceOf(self: @TState, account: ContractAddress) -> u256;
    fn transferFrom(ref self: TState, sender: ContractAddress, recipient: ContractAddress, amount: u256) -> bool;

    // ITokenBoundPublic
    fn address_of_token(self: @TState, contract_address: ContractAddress, token_id: u128) -> ContractAddress;
    fn token_of_address(self: @TState, address: ContractAddress) -> (ContractAddress, u128);
    fn balance_of_token(self: @TState, contract_address: ContractAddress, token_id: u128) -> u256;
    
    // IFameCoinPublic
    fn mint_to_new_duelist(ref self: TState, duelist_id: u128, amount_paid: u256);
}

#[starknet::interface]
pub trait IFameCoinPublic<TState> {
    fn mint_to_new_duelist(ref self: TState, duelist_id: u128, amount_paid: u256);
}

#[dojo::contract]
pub mod fame_coin {
    // use debug::PrintTrait;
    use core::num::traits::Bounded;
    use core::byte_array::ByteArrayTrait;
    use starknet::{ContractAddress, get_contract_address, get_caller_address, get_block_timestamp};

    //-----------------------------------
    // ERC-20 Start
    //
    use openzeppelin_token::erc20::ERC20Component;
    // use openzeppelin_token::erc20::ERC20HooksEmptyImpl;
    use pistols::systems::components::token_bound::{TokenBoundComponent};
    use pistols::systems::components::coin_component::{
        CoinComponent,
        CoinComponent::{Errors as CoinErrors},
    };
    component!(path: ERC20Component, storage: erc20, event: ERC20Event);
    component!(path: CoinComponent, storage: coin, event: CoinEvent);
    component!(path: TokenBoundComponent, storage: token_bound, event: TokenBoundEvent);
    #[abi(embed_v0)]
    impl ERC20MixinImpl = ERC20Component::ERC20MixinImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;
    impl CoinComponentInternalImpl = CoinComponent::CoinComponentInternalImpl<ContractState>;
    #[abi(embed_v0)]
    impl TokenBoundPublicImpl = TokenBoundComponent::TokenBoundPublicImpl<ContractState>;
    impl TokenBoundInternalImpl = TokenBoundComponent::TokenBoundInternalImpl<ContractState>;
    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc20: ERC20Component::Storage,
        #[substorage(v0)]
        coin: CoinComponent::Storage,
        #[substorage(v0)]
        token_bound: TokenBoundComponent::Storage,
    }
    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC20Event: ERC20Component::Event,
        #[flat]
        CoinEvent: CoinComponent::Event,
        #[flat]
        TokenBoundEvent: TokenBoundComponent::Event,
    }
    //
    // ERC-20 End
    //-----------------------------------

    use pistols::interfaces::systems::{WorldSystemsTrait};
    use pistols::utils::math::{MathU128, MathU256};
    use pistols::types::constants::{CONST, FAME};


    //*******************************************
    fn COIN_NAME() -> ByteArray {("Duelist Fame")}
    fn COIN_SYMBOL() -> ByteArray {("FAME")}
    //*******************************************

    fn dojo_init(ref self: ContractState,
        duelist_contract_address: ContractAddress,
    ) {
        self.erc20.initializer(
            COIN_NAME(),
            COIN_SYMBOL(),
        );
        self.coin.initialize(
            duelist_contract_address,
            faucet_amount: 0,
        );
    }

    //-----------------------------------
    // Public
    //
    use super::{IFameCoinPublic};
    #[abi(embed_v0)]
    impl FamePublicImpl of IFameCoinPublic<ContractState> {
        fn mint_to_new_duelist(ref self: ContractState,
            duelist_id: u128,
            amount_paid: u256,
        ) {
            // validate minter
            let duelist_contract_address = self.world().duelist_token_address();
            // assert(get_caller_address() == duelist_contract_address, CoinErrors::CALLER_IS_NOT_MINTER);

            // register token_bound token
            // let recipient: ContractAddress = self.token_bound.address_of_token(duelist_contract_address, duelist_id);
            let recipient: ContractAddress = self.token_bound.register_token(duelist_contract_address, duelist_id);

            // mint FAME
            let amount: u256 = MathU256::max(FAME::MINT_GRANT_AMOUNT, amount_paid * FAME::FAME_PER_LORDS);
            self.coin.mint(recipient, amount);

            // approve duelist as spender
            self.erc20._approve(recipient, duelist_contract_address, Bounded::MAX);
        }
    }

    //-----------------------------------
    // Hooks
    //
    pub impl ERC20HooksImpl<TContractState> of ERC20Component::ERC20HooksTrait<TContractState> {
        fn before_update(
            ref self: ERC20Component::ComponentState<TContractState>,
            from: ContractAddress,
            recipient: ContractAddress,
            amount: u256
        ) {}

        fn after_update(
            ref self: ERC20Component::ComponentState<TContractState>,
            from: ContractAddress,
            recipient: ContractAddress,
            amount: u256
        ) {}
    }


}
