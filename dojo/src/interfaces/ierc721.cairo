use starknet::ContractAddress;

#[starknet::interface]
trait IERC721<TState> {

    // ISRC5
    fn supports_interface(self: @TState, interface_id: felt252) -> bool;
    // ISRC5Camel
    fn supportsInterface(self: @TState, interfaceId: felt252) -> bool;

    // IERC721Metadata
    fn name(self: @TState) -> ByteArray;
    fn symbol(self: @TState) -> ByteArray;
    fn token_uri(self: @TState, token_id: u256) -> ByteArray;
    // IERC721MetadataCamel
    fn tokenURI(self: @TState, token_id: u256) -> ByteArray;

    // IERC721Owner
    fn owner_of(self: @TState, token_id: u256) -> ContractAddress;
    // IERC721OwnerCamel
    fn ownerOf(self: @TState, token_id: u256) -> ContractAddress;

    // IERC721Balance
    fn balance_of(self: @TState, account: ContractAddress) -> u256;
    fn transfer_from(ref self: TState, from: ContractAddress, to: ContractAddress, token_id: u256);
    fn safe_transfer_from(
        ref self: TState,
        from: ContractAddress,
        to: ContractAddress,
        token_id: u256,
        data: Span<felt252>
    );
    // IERC721CamelOnly
    fn balanceOf(self: @TState, account: ContractAddress) -> u256;
    fn transferFrom(ref self: TState, from: ContractAddress, to: ContractAddress, token_id: u256);
    fn safeTransferFrom(
        ref self: TState,
        from: ContractAddress,
        to: ContractAddress,
        token_id: u256,
        data: Span<felt252>
    );

    // IERC721Approval
    fn get_approved(self: @TState, token_id: u256) -> ContractAddress;
    fn is_approved_for_all(self: @TState, owner: ContractAddress, operator: ContractAddress) -> bool;
    fn approve(ref self: TState, to: ContractAddress, token_id: u256);
    fn set_approval_for_all(ref self: TState, operator: ContractAddress, approved: bool);
    // IERC721ApprovalCamel
    fn getApproved(self: @TState, token_id: u256) -> ContractAddress;
    fn isApprovedForAll(self: @TState, owner: ContractAddress, operator: ContractAddress) -> bool;
    fn setApprovalForAll(ref self: TState, operator: ContractAddress, approved: bool);

    // IERC721Enumerable
    fn total_supply(self: @TState) -> u256;
    fn token_by_index(self: @TState, index: u256) -> u256;
    fn token_of_owner_by_index(self: @TState, owner: ContractAddress, index: u256) -> u256;
    // IERC721EnumerableCamel
    fn totalSupply(self: @TState) -> u256;
    fn tokenByIndex(self: @TState, index: u256) -> u256;
    fn tokenOfOwnerByIndex(self: @TState, owner: ContractAddress, index: u256) -> u256;
}

#[inline(always)]
fn ierc721(contract_address: ContractAddress) -> IERC721Dispatcher {
    assert(contract_address.is_non_zero(), 'ierc721(): null address');
    (IERC721Dispatcher{contract_address})
}
