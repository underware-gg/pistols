use core::byte_array::ByteArrayTrait;
use pistols::utils::bitwise::{U256Bitwise};

trait ShortStringTrait {
    fn concat(self: felt252, value: felt252) -> felt252;
    fn join(self: felt252, value: felt252) -> felt252;
    fn to_byte_array(self: felt252) -> ByteArray;
}

impl ShortString of ShortStringTrait {
    fn concat(self: felt252, value: felt252) -> felt252 {
        let _self: u256 = self.into();
        let _value: u256 = value.into();
        let mut offset: usize = 0;
        let mut i: usize = 0;
        loop {
            if(i == 256) { break; }
            if(_value & U256Bitwise::shl(0xff, i) != 0) {
                offset = i + 8;
            }
            i += 8;
        };
        (_value | U256Bitwise::shl(_self, offset)).try_into().unwrap()
    }

    fn join(self: felt252, value: felt252) -> felt252 {
        Self::concat(Self::concat(self, '_'), value)
    }

    fn to_byte_array(self: felt252) -> ByteArray {
        let mut selfie: u256 = self.into();
        let mut len: usize = 0;
        loop {
            if (selfie == 0 || len == 31) { break; }
            selfie /= 0x100;
            len += 1;
        };
        let mut result = "";
        result.append_word(self, len);
        (result)
    }
}



//----------------------------------------
// Unit  tests
//
#[cfg(test)]
mod tests {
    use debug::PrintTrait;
    use super::{ShortString};
    
    #[test]
    #[available_gas(100_000_000)]
    fn test_string_concat() {
        assert(ShortString::concat('ABC', '123') == 'ABC123', 'ABC123');
        assert(ShortString::concat('Hello ', 'World') == 'Hello World', 'Hello 1');
        assert(ShortString::concat('Hello', ' World') == 'Hello World', 'Hello 2');
        assert(ShortString::concat(' Hello', 'World ') == ' HelloWorld ', 'Hello 3');
        assert(ShortString::concat(' Hello ', ' World ') == ' Hello  World ', 'Hello 4');
        assert(ShortString::join('Hello', 'World') == 'Hello_World', 'Hello_World');
    }
    
    #[test]
    #[available_gas(100_000_000)]
    fn test_to_byte_array() {
        assert(''.to_byte_array() == "", 'not empty');
        assert('1'.to_byte_array() == "1", 'not 1');
        assert('Hello_World'.to_byte_array() == "Hello_World", 'not Hello_World');
    }
}
