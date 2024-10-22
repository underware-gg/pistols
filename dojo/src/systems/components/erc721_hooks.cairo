use starknet::{ContractAddress, get_contract_address};
use dojo::world::{IWorldProvider, IWorldProviderDispatcher, IWorldDispatcher, IWorldDispatcherTrait};
use openzeppelin_token::erc721::{ERC721Component};
use graffiti::json::JsonImpl;

use pistols::systems::tokens::duelist_token::{IDuelistToken, IDuelistTokenDispatcher, IDuelistTokenDispatcherTrait};
use pistols::models::{
    duelist::{Duelist},
    token_config::{TokenConfig},
};
use pistols::libs::store::{Store, StoreTrait};
use pistols::utils::arrays::{SpanUtilsTrait};
use pistols::utils::metadata::{MetadataTrait};

#[derive(Clone, Drop, Serde)]
pub struct TokenMetadata {
    pub name: ByteArray,
    pub description: ByteArray,
    pub image: ByteArray,
}

#[starknet::interface]
pub trait ITokenRenderer<TState> {
    fn get_token_metadata(self: @TState, token_id: u256) -> TokenMetadata;
    // returns: [key1, value1, key2, value2,...]
    fn get_metadata_pairs(self: @TState, token_id: u256) -> Span<ByteArray>;
    fn get_attribute_pairs(self: @TState, token_id: u256) -> Span<ByteArray>;
}

mod Errors {
    const INVALID_ATTRIBUTES: felt252 = 'METADATA: invalid attributes';
    const INVALID_METADATA: felt252   = 'METADATA: invalid metadata';
}

pub impl ERC721HooksImpl<
    TContractState,
    +IWorldProvider<TContractState>,
    +ITokenRenderer<TContractState>,
    impl ERC721: ERC721Component::HasComponent<TContractState>,
> of ERC721Component::ERC721HooksTrait<TContractState> {
    fn before_update(ref self: ERC721Component::ComponentState<TContractState>, to: ContractAddress, token_id: u256, auth: ContractAddress) {}
    fn after_update(ref self: ERC721Component::ComponentState<TContractState>, to: ContractAddress, token_id: u256, auth: ContractAddress) {}
    fn token_uri(
        self: @ERC721Component::ComponentState<TContractState>,
        token_id: u256,
    ) -> ByteArray {
        let store = StoreTrait::new(self.get_contract().world());

        // get renderer dispatcher
        let token_config: TokenConfig = store.get_token_config(get_contract_address());
        let renderer = ITokenRendererDispatcher{
            contract_address: if (token_config.renderer_address).is_non_zero() {
                (token_config.renderer_address)
            } else {
                (get_contract_address())
            }
        };

        let token_metadata: TokenMetadata = renderer.get_token_metadata(token_id);
        let attributes: Span<ByteArray> = renderer.get_attribute_pairs(token_id);
        let metadata: Span<ByteArray> = renderer.get_metadata_pairs(token_id);
        assert(attributes.len() % 2 == 0, Errors::INVALID_ATTRIBUTES);
        assert(metadata.len() % 2 == 0, Errors::INVALID_METADATA);

        let json = JsonImpl::new()
            .add("id", format!("{}", token_id))
            .add("name", token_metadata.name)
            .add("description", token_metadata.description)
            .add("image", token_metadata.image)
            .add("metadata", MetadataTrait::format_metadata(attributes.concat(metadata).span()))
            .add_array("attributes", MetadataTrait::create_traits_array(attributes));
        let result = json.build();

        (MetadataTrait::encode_json(result, false))
    }
}
