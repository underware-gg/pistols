use starknet::ContractAddress;
use pistols::models::duelist::Duelist;

#[starknet::interface]
trait ITokenMintableBurnable<TState> {
    fn mint(ref self: TState, to: ContractAddress, token_id: u256);
    fn burn(ref self: TState, token_id: u256);
}

#[starknet::interface]
trait ITokenRenderer<TState> {
    fn format_name(self: @TState, token_id: u256, duelist: Duelist) -> ByteArray;
    fn format_description(self: @TState, token_id: u256, _duelist: Duelist) -> ByteArray;
    fn format_image(self: @TState, duelist: Duelist, variant: ByteArray) -> ByteArray;
    // returns: [key1, value1, key2, value2,...]
    fn get_attributes(self: @TState, duelist: Duelist) -> Span<ByteArray>;
}
