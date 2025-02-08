use starknet::{ContractAddress};
use dojo::world::IWorldDispatcher;

#[starknet::interface]
pub trait IFameCoin<TState> {
    // IWorldProvider
    fn world_dispatcher(self: @TState) -> IWorldDispatcher;

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
    fn transfer_from_token(ref self: TState, contract_address: ContractAddress, sender_token_id: u128, recipient: ContractAddress, amount: u256) -> bool;
    fn transfer_from_token_to_token(ref self: TState, contract_address: ContractAddress, sender_token_id: u128, recipient_token_id: u128, amount: u256) -> bool;
    fn burn_from_token(ref self: TState, contract_address: ContractAddress, token_id: u128, amount: u256);
    
    // IFameCoinPublic
    fn minted_duelist(ref self: TState, duelist_id: u128);
    fn reward_duelist(ref self: TState, duelist_id: u128, amount: u256);
}

#[starknet::interface]
pub trait IFameCoinPublic<TState> {
    fn minted_duelist(ref self: TState, duelist_id: u128);
    fn reward_duelist(ref self: TState, duelist_id: u128, amount: u256);
}

#[dojo::contract]
pub mod fame_coin {
    use core::num::traits::{Bounded};
    use starknet::{ContractAddress};
    use dojo::world::{WorldStorage};

    //-----------------------------------
    // ERC-20 Start
    //
    use openzeppelin_token::erc20::ERC20Component;
    // use openzeppelin_token::erc20::ERC20HooksEmptyImpl;
    use pistols::systems::components::token_bound::{TokenBoundComponent};
    use pistols::systems::components::coin_component::{
        CoinComponent,
        // CoinComponent::{Errors as CoinErrors},
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

    use pistols::interfaces::systems::{SystemsTrait};
    use pistols::utils::math::{MathU128, MathU256};
    use pistols::types::constants::{FAME};

    mod Errors {
        pub const NOT_IMPLEMENTED: felt252 = 'FAME: Not implemented';
    }

    //*******************************************
    fn COIN_NAME() -> ByteArray {("Duelist Fame")}
    fn COIN_SYMBOL() -> ByteArray {("FAME")}
    //*******************************************

    fn dojo_init(ref self: ContractState) {
        let mut world = self.world_default();
        self.erc20.initializer(
            COIN_NAME(),
            COIN_SYMBOL(),
        );
        self.coin.initialize(
            world.duelist_token_address(),
            faucet_amount: 0,
        );
    }
    
    #[generate_trait]
    impl WorldDefaultImpl of WorldDefaultTrait {
        #[inline(always)]
        fn world_default(self: @ContractState) -> WorldStorage {
            (self.world(@"pistols"))
        }
    }

    //-----------------------------------
    // Public
    //
    use super::{IFameCoinPublic};
    #[abi(embed_v0)]
    impl FamePublicImpl of IFameCoinPublic<ContractState> {
        fn minted_duelist(ref self: ContractState,
            duelist_id: u128,
        ) {
            let mut world = self.world_default();

            // validate minter (duelist token contract)
            let minter_address: ContractAddress = self.coin.assert_caller_is_minter();

            // register token_bound token
            let token_address: ContractAddress = self.token_bound.register_token(minter_address, duelist_id);

            // pre-approve minter (duelist) and bank as spenders
            self.erc20._approve(token_address, minter_address, Bounded::MAX);
            self.erc20._approve(token_address, world.bank_address(), Bounded::MAX);

            // mint FAME to token
            self.coin.mint(token_address, FAME::MINT_GRANT_AMOUNT);
        }

        fn reward_duelist(ref self: ContractState,
            duelist_id: u128,
            amount: u256,
        ) {
            // validate minter (duelist token contract)
            let minter_address: ContractAddress = self.coin.assert_caller_is_minter();

            // mint FAME to token
            let token_address: ContractAddress = self.token_bound.address_of_token(minter_address, duelist_id);
            self.coin.mint(token_address, amount);
        }
    }

    //-----------------------------------
    // Hooks
    //
    pub impl ERC20HooksImpl of ERC20Component::ERC20HooksTrait<ContractState> {
        fn before_update(
            ref self: ERC20Component::ComponentState<ContractState>,
            from: ContractAddress,
            recipient: ContractAddress,
            amount: u256
        ) {
            // // only minter can transfer
            // let mut contract_state = ERC20Component::HasComponent::get_contract_mut(ref self);
            // contract_state.coin.assert_caller_is_minter();
        }

        fn after_update(
            ref self: ERC20Component::ComponentState<ContractState>,
            from: ContractAddress,
            recipient: ContractAddress,
            amount: u256
        ) {
        }
    }

}
