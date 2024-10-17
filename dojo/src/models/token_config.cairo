use starknet::ContractAddress;

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct TokenConfig {
    #[key]
    pub token_address: ContractAddress,
    //------
    pub minter_address: ContractAddress,
    pub renderer_address: ContractAddress,
    pub treasury_address: ContractAddress,
    pub fee_contract: ContractAddress,
    pub fee_amount: u128,
    pub minted_count: u128,
}


//-----------------------------------
// Traits
//
use pistols::models::duelist::Duelist;
use pistols::interfaces::itoken::{ITokenRenderer, ITokenRendererDispatcher, ITokenRendererDispatcherTrait};
use pistols::utils::encoding::bytes_base64_encode;
use graffiti::json::JsonImpl;
// use graffiti::{Tag, TagImpl};

#[generate_trait]
impl TokenConfigImpl of TokenConfigTrait {
    fn is_minter(self: @TokenConfig, address: ContractAddress) -> bool {
        (
            (*self.minter_address).is_zero()   // anyone can mint
            || address == *self.minter_address // caller is minter contract
        )
    }

    fn render_uri(self: @TokenConfig, token_id: u256, duelist: Duelist, encode: bool) -> ByteArray {
        let renderer = ITokenRendererDispatcher{
            contract_address: if (*self.renderer_address).is_non_zero() {
                (*self.renderer_address)
            } else {
                (*self.token_address)
            }
        };
        let attributes: Span<ByteArray> = renderer.get_attributes(duelist.clone());
        let metadata = JsonImpl::new()
            .add("id", format!("{}", token_id))
            .add("name", renderer.format_name(token_id, duelist.clone()))
            .add("description", renderer.format_description(token_id, duelist.clone()))
            .add("image", renderer.format_image(duelist.clone(), "square"))
            .add("portrait", renderer.format_image(duelist.clone(), "portrait"))
            .add("metadata", Self::_format_metadata(attributes))
            .add_array("attributes", Self::_format_traits_array(attributes));
        let metadata = metadata.build();

        if (encode) {
            let base64_encoded_metadata: ByteArray = bytes_base64_encode(metadata);
            (format!("data:application/json;base64,{}", base64_encoded_metadata))
        } else {
            (metadata)
        }
    }

    //-----------------------------------
    // internal
    //
    fn _format_metadata(attributes: Span<ByteArray>) -> ByteArray {
        let mut json = JsonImpl::new();
        let mut n: usize = 0;
        loop {
            if (n >= attributes.len()) { break; }
            let name: ByteArray = attributes.at(n).clone();
            let value: ByteArray = attributes.at(n+1).clone();
            json = json.add(name, value);
            n += 2;
        };
        (json.build())
    }
    fn _format_traits_array(attributes: Span<ByteArray>) -> Span<ByteArray> {
        let mut result: Array<ByteArray> = array![];
        let mut n: usize = 0;
        loop {
            if (n >= attributes.len()) { break; }
            let name: ByteArray = attributes.at(n).clone();
            let value: ByteArray = attributes.at(n+1).clone();
            let json = JsonImpl::new()
                .add("trait", name)
                .add("value", value);
            result.append(json.build());
            n += 2;
        };
        (result.span())
    }
}
