use starknet::{ContractAddress};
use core::num::traits::Zero;
use dojo::contract::components::world_provider::{IWorldProvider};
use openzeppelin_token::erc721::{ERC721Component};
use graffiti::json::JsonImpl;

use pistols::interfaces::dns::{DnsTrait};
use pistols::models::{
    config::{TokenConfig},
};
use pistols::libs::store::{Store, StoreTrait};
use pistols::utils::arrays::{SpanUtilsTrait};
use pistols::utils::metadata::{MetadataTrait};

#[starknet::interface]
pub trait ITokenRenderer<TState> {
    // token metadata
    fn get_token_name(self: @TState, token_id: u256) -> ByteArray;
    fn get_token_description(self: @TState, token_id: u256) -> ByteArray;
    fn get_token_image(self: @TState, token_id: u256) -> ByteArray;

    // token attributes
    // returns: [key1, value1, key2, value2,...]
    fn get_attribute_pairs(self: @TState, token_id: u256) -> Span<ByteArray>;
    
    // additional metadata (optional)
    // returns: [key1, value1, key2, value2,...]
    fn get_metadata_pairs(self: @TState, token_id: u256) -> Span<ByteArray>;
}

mod MetadataErrors {
    pub const INVALID_ATTRIBUTES: felt252 = 'METADATA: invalid attributes';
    pub const INVALID_METADATA: felt252   = 'METADATA: invalid metadata';
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
        (self.get_contract().render_token_uri(token_id))
    }
}

#[generate_trait]
pub impl TokenConfigRenderImpl<
    TContractState,
    +IWorldProvider<TContractState>,
    +ITokenRenderer<TContractState>,
> of TokenRendererTrait<TContractState> {
    fn render_token_uri(self: @TContractState, token_id: u256) -> ByteArray {
        let mut world = DnsTrait::storage(self.world_dispatcher(), @"pistols");
        let mut store: Store = StoreTrait::new(world);
        let token_config: TokenConfig = store.get_token_config(starknet::get_contract_address());
        let renderer = ITokenRendererDispatcher{
            contract_address: if (token_config.renderer_address).is_non_zero() {
                (token_config.renderer_address)
            } else {
                (starknet::get_contract_address())
            }
        };

        let attributes: Span<ByteArray> = renderer.get_attribute_pairs(token_id);
        let metadata: Span<ByteArray> = renderer.get_metadata_pairs(token_id);
        assert(attributes.len() % 2 == 0, MetadataErrors::INVALID_ATTRIBUTES);
        assert(metadata.len() % 2 == 0, MetadataErrors::INVALID_METADATA);

        let json = JsonImpl::new()
            .add("id", format!("{}", token_id))
            .add("name", renderer.get_token_name(token_id))
            .add("description", renderer.get_token_description(token_id))
            .add("image", renderer.get_token_image(token_id))
            .add("metadata", MetadataTrait::format_metadata(attributes.concat(metadata).span()))
            .add_array("attributes", MetadataTrait::create_traits_array(attributes));
        let result = json.build();

        (MetadataTrait::encode_json(result, false))
    }
}
