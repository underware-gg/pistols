use starknet::{ContractAddress};
use dojo::world::IWorldDispatcher;

#[starknet::interface]
pub trait ILordsMock<TState> {
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
    
    // ILordsMockPublic
    fn faucet(ref self: TState);
    fn mint(ref self: TState, recipient: ContractAddress, amount: u256);
}

#[starknet::interface]
pub trait ILordsMockPublic<TState> {
    fn faucet(ref self: TState);
    fn mint(ref self: TState, recipient: ContractAddress, amount: u256);
}

#[starknet::interface]
pub trait ILordsMockInternal<TState> {
}

#[dojo::contract]
pub mod lords_mock {
    // use debug::PrintTrait;
    use core::byte_array::ByteArrayTrait;
    use starknet::{ContractAddress, get_contract_address, get_caller_address, get_block_timestamp};
    use pistols::types::constants::{CONST};

    //-----------------------------------
    // OpenZeppelin start
    //
    use openzeppelin_token::erc20::ERC20Component;
    use openzeppelin_token::erc20::ERC20HooksEmptyImpl;
    use pistols::systems::components::coin_component::{CoinComponent};
    component!(path: ERC20Component, storage: erc20, event: ERC20Event);
    component!(path: CoinComponent, storage: coin, event: CoinEvent);
    #[abi(embed_v0)]
    impl ERC20MixinImpl = ERC20Component::ERC20MixinImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;
    impl CoinInternalImpl = CoinComponent::InternalImpl<ContractState>;
    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc20: ERC20Component::Storage,
        #[substorage(v0)]
        coin: CoinComponent::Storage,
    }
    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC20Event: ERC20Component::Event,
        #[flat]
        CoinEvent: CoinComponent::Event,
    }
    //
    // OpenZeppelin end
    //-----------------------------------


    //*******************************************
    fn COIN_NAME() -> ByteArray {("Fake LORDS")}
    fn COIN_SYMBOL() -> ByteArray {("fLORDS")}
    //*******************************************

    fn dojo_init(ref self: ContractState,
        game_contract_address: ContractAddress,
        faucet_amount: u128,
    ) {
        self.erc20.initializer(
            COIN_NAME(),
            COIN_SYMBOL(),
        );
        self.coin._initialize(
            game_contract_address,
            faucet_amount: faucet_amount.into(),
        );
        self.coin._mint(get_caller_address(), (1 * CONST::ETH_TO_WEI).into());
    }

    //-----------------------------------
    // Public
    //
    use super::{ILordsMockPublic};
    #[abi(embed_v0)]
    impl CoinComponentPublicImpl of ILordsMockPublic<ContractState> {
        fn faucet(ref self: ContractState) {
            self.coin._faucet(get_caller_address());
        }
        fn mint(ref self: ContractState,
            recipient: ContractAddress,
            amount: u256,
        ) {
            self.coin._mint(recipient, amount);
        }
    }

}
