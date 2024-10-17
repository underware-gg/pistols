use core::byte_array::ByteArrayTrait;
use pistols::utils::encoding::bytes_base64_encode;
use graffiti::json::JsonImpl;
// use graffiti::{Tag, TagImpl};

trait MetadataTrait {
    fn format_metadata(attributes: Span<ByteArray>) -> ByteArray;
    fn create_traits_array(attributes: Span<ByteArray>) -> Span<ByteArray>;
    fn encode_json(data: ByteArray, base64_encode: bool) -> ByteArray;
    fn encode_svg(data: ByteArray, base64_encode: bool) -> ByteArray;
    fn encode_mime_type(data: ByteArray, mime_type: ByteArray, base64_encode: bool) -> ByteArray;
}

impl Metadata of MetadataTrait {

    // attributes: [key1, value1, key2, value2, ...]
    // returns: {"key1":"value1","key2":"value2",...}
    fn format_metadata(attributes: Span<ByteArray>) -> ByteArray {
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

    // attributes: [key1, value1, key2, value2, ...]
    // returns: [{"trait":"key1","value":"value1"},...]
    fn create_traits_array(attributes: Span<ByteArray>) -> Span<ByteArray> {
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

    fn encode_json(data: ByteArray, base64_encode: bool) -> ByteArray {
        (Self::encode_mime_type(data, "data:application/json", base64_encode))
    }

    fn encode_svg(data: ByteArray, base64_encode: bool) -> ByteArray {
        (Self::encode_mime_type(data, "data:image/svg+xml", base64_encode))
    }

    fn encode_mime_type(data: ByteArray, mime_type: ByteArray, base64_encode: bool) -> ByteArray {
        if (base64_encode) {
            (format!("{};base64,{}", mime_type, bytes_base64_encode(data)))
        } else {
            (format!("{},{}", mime_type, data))
        }
    }
}
