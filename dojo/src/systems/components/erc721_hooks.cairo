use starknet::{ContractAddress, get_contract_address};
use dojo::world::{IWorldProvider, IWorldProviderDispatcher, IWorldDispatcher, IWorldDispatcherTrait};
use openzeppelin_token::erc721::{ERC721Component};
use graffiti::json::JsonImpl;

use pistols::systems::tokens::duelist::{IDuelistToken, IDuelistTokenDispatcher, IDuelistTokenDispatcherTrait};
use pistols::models::{
    duelist::{Duelist},
    token_config::{TokenConfig},
};
use pistols::libs::store::{Store, StoreTrait};
use pistols::utils::metadata::{MetadataTrait};

#[starknet::interface]
pub trait ITokenRenderer<TState> {
    fn format_name(self: @TState, token_id: u256, duelist: Duelist) -> ByteArray;
    fn format_description(self: @TState, token_id: u256, _duelist: Duelist) -> ByteArray;
    fn format_image(self: @TState, duelist: Duelist, variant: ByteArray) -> ByteArray;
    // returns: [key1, value1, key2, value2,...]
    fn get_attributes(self: @TState, duelist: Duelist) -> Span<ByteArray>;
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

        let duelist: Duelist = store.get_duelist(token_id.low);
        let attributes: Span<ByteArray> = renderer.get_attributes(duelist.clone());
        let metadata = JsonImpl::new()
            .add("id", format!("{}", token_id))
            .add("name", renderer.format_name(token_id, duelist.clone()))
            .add("description", renderer.format_description(token_id, duelist.clone()))
            .add("image", renderer.format_image(duelist.clone(), "square"))
            .add("portrait", renderer.format_image(duelist.clone(), "portrait"))
            .add("metadata", MetadataTrait::format_metadata(attributes))
            .add_array("attributes", MetadataTrait::create_traits_array(attributes));
        let metadata = metadata.build();

        (MetadataTrait::encode_json(metadata, false))
    }
}
