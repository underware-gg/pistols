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
    fn transfer_from_token(ref self: TState, contract_address: ContractAddress, sender_token_id: u128, recipient_token_id: u128, amount: u256) -> bool;
    fn burn_from_token(ref self: TState, contract_address: ContractAddress, token_id: u128, amount: u256);
    
    // IFameCoinPublic
    fn minted_duelist(ref self: TState, duelist_id: u128, amount_paid: u256);
    fn updated_duelist(ref self: TState, from: ContractAddress, to: ContractAddress, duelist_id: u128);
}

#[starknet::interface]
pub trait IFameCoinPublic<TState> {
    fn minted_duelist(ref self: TState, duelist_id: u128, amount_paid: u256);
    fn updated_duelist(ref self: TState, from: ContractAddress, to: ContractAddress, duelist_id: u128);
}

#[dojo::contract]
pub mod fame_coin {
    // use debug::PrintTrait;
    use core::num::traits::Bounded;
    use core::byte_array::ByteArrayTrait;
    use starknet::{ContractAddress, get_contract_address, get_caller_address, get_block_timestamp};
    use dojo::world::{WorldStorage, IWorldDispatcher, IWorldDispatcherTrait};
    use dojo::model::{ModelStorage, ModelValueStorage};

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

    use pistols::interfaces::systems::{SystemsTrait};
    use pistols::interfaces::ierc721::{ierc721, ERC721ABIDispatcher, ERC721ABIDispatcherTrait};
    use pistols::utils::math::{MathU128, MathU256};
    use pistols::utils::misc::{ZERO};
    use pistols::types::constants::{CONST, FAME};

    mod Errors {
        const NOT_IMPLEMENTED: felt252          = 'FAME: Not implemented';
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
            amount_paid: u256,
        ) {
            // validate minter
            let duelist_contract_address: ContractAddress = self.coin.assert_caller_is_minter();

            // register token_bound token
            let token_address: ContractAddress = self.token_bound.register_token(duelist_contract_address, duelist_id);

            // pre-approve minter as spender
            self.erc20._approve(token_address, duelist_contract_address, Bounded::MAX);

            // mint FAME to token
            let amount: u256 = MathU256::max(FAME::MIN_MINT_GRANT_AMOUNT, amount_paid * FAME::FAME_PER_LORDS);
            self.coin.mint(token_address, amount);
        }

        fn updated_duelist(ref self: ContractState,
            from: ContractAddress,
            to: ContractAddress,
            duelist_id: u128,
        ) {
            // validate caller
            let duelist_contract_address: ContractAddress = self.coin.assert_caller_is_minter();

            // mint is handled in minted_duelist()
            if (from.is_zero()) {
                return;
            }

            // duelist changed owner, transfer its FAME
            if (from != to) {
                let balance: u256 = self.balance_of_token(duelist_contract_address, duelist_id);
                if (balance > 0) {
                    self.erc20.update(from, to, balance);
                }
            }
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
            // validate caller
            let mut contract_state = ERC20Component::HasComponent::get_contract_mut(ref self);
            contract_state.coin.assert_caller_is_minter();
        }

        fn after_update(
            ref self: ERC20Component::ComponentState<ContractState>,
            from: ContractAddress,
            recipient: ContractAddress,
            amount: u256
        ) {
            let mut contract_state = ERC20Component::HasComponent::get_contract_mut(ref self);
            
            let (from_contract_address, from_token_id): (ContractAddress, u128) = contract_state.token_bound.token_of_address(from);
            let (to_contract_address, to_token_id): (ContractAddress, u128) = contract_state.token_bound.token_of_address(recipient);
            
            let from_owner: ContractAddress = 
                if (from_contract_address.is_non_zero()) {
                    ierc721(from_contract_address).owner_of(from_token_id.into())
                } else {ZERO()};
            let to_owner: ContractAddress = 
                if (to_contract_address.is_non_zero()) {
                    ierc721(to_contract_address).owner_of(to_token_id.into())
                } else {ZERO()};

            // transfer between tokens, repeat for owners
            if ((from_owner.is_non_zero() || to_owner.is_non_zero()) && from_owner != to_owner) {
                contract_state.erc20.update(from_owner, to_owner, amount);
            }
        }
    }

}
