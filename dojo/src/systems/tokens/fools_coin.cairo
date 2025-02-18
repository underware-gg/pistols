use starknet::{ContractAddress};
use dojo::world::IWorldDispatcher;

#[starknet::interface]
pub trait IFoolsCoin<TState> {
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

    // IFoolsCoinProtected
    fn reward_player(ref self: TState, recipient: ContractAddress, amount: u256);
}

// Exposed to world
#[starknet::interface]
trait IFoolsCoinProtected<TState> {
    fn reward_player(ref self: TState, recipient: ContractAddress, amount: u256);
}

#[dojo::contract]
pub mod fools_coin {
    use starknet::{ContractAddress};
    use dojo::world::{WorldStorage};

    //-----------------------------------
    // ERC-20 Start
    //
    use openzeppelin_token::erc20::ERC20Component;
    use openzeppelin_token::erc20::ERC20HooksEmptyImpl;
    use pistols::systems::components::coin_component::{
        CoinComponent,
        // CoinComponent::{Errors as CoinErrors},
    };
    component!(path: ERC20Component, storage: erc20, event: ERC20Event);
    component!(path: CoinComponent, storage: coin, event: CoinEvent);
    #[abi(embed_v0)]
    impl ERC20MixinImpl = ERC20Component::ERC20MixinImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;
    impl CoinComponentInternalImpl = CoinComponent::CoinComponentInternalImpl<ContractState>;
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
    // ERC-20 End
    //-----------------------------------

    use pistols::interfaces::dns::{DnsTrait};
    use pistols::utils::math::{MathU128, MathU256};

    mod Errors {
        pub const NOT_IMPLEMENTED: felt252 = 'FOOLS: Not implemented';
    }

    //*******************************************
    fn COIN_NAME() -> ByteArray {("Fools")}
    fn COIN_SYMBOL() -> ByteArray {("FOOLS")}
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
    #[abi(embed_v0)]
    impl FoolsPublicImpl of super::IFoolsCoinProtected<ContractState> {
        fn reward_player(ref self: ContractState,
            recipient: ContractAddress,
            amount: u256,
        ) {
            // validate caller
            self.coin.assert_caller_is_minter();

            // mint FOOLS to recipient
            self.coin.mint(recipient, amount);
        }
    }

}
