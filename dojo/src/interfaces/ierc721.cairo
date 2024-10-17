use starknet::ContractAddress;

//
// from OpenZeppelin:
// https://github.com/OpenZeppelin/cairo-contracts/blob/main/packages/token/src/erc721/interface.cairo
//
#[starknet::interface]
// pub trait ERC721ABI<TState> {
pub trait IERC721<TState> {
    // IERC721
    fn balance_of(self: @TState, account: ContractAddress) -> u256;
    fn owner_of(self: @TState, token_id: u256) -> ContractAddress;
    fn safe_transfer_from(ref self: TState, from: ContractAddress, to: ContractAddress, token_id: u256, data: Span<felt252>);
    fn transfer_from(ref self: TState, from: ContractAddress, to: ContractAddress, token_id: u256);
    fn approve(ref self: TState, to: ContractAddress, token_id: u256);
    fn set_approval_for_all(ref self: TState, operator: ContractAddress, approved: bool);
    fn get_approved(self: @TState, token_id: u256) -> ContractAddress;
    fn is_approved_for_all(self: @TState, owner: ContractAddress, operator: ContractAddress) -> bool;
    // ISRC5
    fn supports_interface(self: @TState, interface_id: felt252) -> bool;
    // IERC721Metadata
    fn name(self: @TState) -> ByteArray;
    fn symbol(self: @TState) -> ByteArray;
    fn token_uri(self: @TState, token_id: u256) -> ByteArray;
    // IERC721CamelOnly
    fn balanceOf(self: @TState, account: ContractAddress) -> u256;
    fn ownerOf(self: @TState, tokenId: u256) -> ContractAddress;
    fn safeTransferFrom(ref self: TState, from: ContractAddress, to: ContractAddress, tokenId: u256, data: Span<felt252>);
    fn transferFrom(ref self: TState, from: ContractAddress, to: ContractAddress, tokenId: u256);
    fn setApprovalForAll(ref self: TState, operator: ContractAddress, approved: bool);
    fn getApproved(self: @TState, tokenId: u256) -> ContractAddress;
    fn isApprovedForAll(self: @TState, owner: ContractAddress, operator: ContractAddress) -> bool;
    // IERC721MetadataCamelOnly
    fn tokenURI(self: @TState, tokenId: u256) -> ByteArray;
}

fn ierc721(contract_address: ContractAddress) -> IERC721Dispatcher {
    assert(contract_address.is_non_zero(), 'ierc721(): null address');
    (IERC721Dispatcher{contract_address})
}


//----------------------------------
// Helper
//
use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};
use pistols::interfaces::systems::{WorldSystemsTrait};

#[derive(Copy, Drop)]
pub struct Erc721Helper {
    world: IWorldDispatcher,
    token_dispatcher: IERC721Dispatcher,
}

#[generate_trait]
impl Erc721HelperImpl of Erc721HelperTrait {
    fn new(world: IWorldDispatcher, contract_address: ContractAddress) -> Erc721Helper {
        assert(contract_address.is_non_zero(), 'Erc721Helper: null token addr');
        let token_dispatcher = ierc721(contract_address);
        (Erc721Helper { world, token_dispatcher })
    }
    fn new_duelist(world: IWorldDispatcher) -> Erc721Helper {
        let contract_address: ContractAddress = world.duelist_token_address();
        (Self::new(world, contract_address))
    }
    fn owner_of(self: Erc721Helper, token_id: u128) -> ContractAddress {
        (self.token_dispatcher.owner_of(token_id.into()))
    }
    fn exists(self: Erc721Helper, token_id: u128) -> bool {
        (self.owner_of(token_id).is_non_zero())
    }
    fn is_owner_of(self: Erc721Helper, address: ContractAddress, token_id: u128) -> bool {
        (self.owner_of(token_id)  == address)
    }
}
