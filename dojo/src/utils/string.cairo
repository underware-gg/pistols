use core::byte_array::ByteArrayTrait;
use pistols::utils::bitwise::{U256Bitwise};

trait StringTrait {
    fn concat(left: felt252, right: felt252) -> felt252;
    fn join(left: felt252, right: felt252) -> felt252;
    fn to_byte_array(self: felt252) -> ByteArray;
}

impl String of StringTrait {
    fn concat(left: felt252, right: felt252) -> felt252 {
        let _left: u256 = left.into();
        let _right: u256 = right.into();
        let mut offset: usize = 0;
        let mut i: usize = 0;
        loop {
            if(i == 256) { break; }
            if(_right & U256Bitwise::shl(0xff, i) != 0) {
                offset = i + 8;
            }
            i += 8;
        };
        (_right | U256Bitwise::shl(_left, offset)).try_into().unwrap()
    }

    fn join(left: felt252, right: felt252) -> felt252 {
        Self::concat(Self::concat(left, '_'), right)
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
    use pistols::utils::string::{String};
    
    #[test]
    #[available_gas(100_000_000)]
    fn test_string_concat() {
        assert(String::concat('ABC', '123') == 'ABC123', 'ABC123');
        assert(String::concat('Hello ', 'World') == 'Hello World', 'Hello 1');
        assert(String::concat('Hello', ' World') == 'Hello World', 'Hello 2');
        assert(String::concat(' Hello', 'World ') == ' HelloWorld ', 'Hello 3');
        assert(String::concat(' Hello ', ' World ') == ' Hello  World ', 'Hello 4');
        assert(String::join('Hello', 'World') == 'Hello_World', 'Hello_World');
    }
    
    #[test]
    #[available_gas(100_000_000)]
    fn test_to_byte_array() {
        assert(''.to_byte_array() == "", 'not empty');
        assert('1'.to_byte_array() == "1", 'not 1');
        assert('Hello_World'.to_byte_array() == "Hello_World", 'not Hello_World');
    }
}
