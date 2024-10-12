use core::byte_array::ByteArrayTrait;
use pistols::utils::bitwise::{BitwiseU256};

trait ShortStringTrait {
    fn strlen(self: felt252) -> usize;
    fn string(self: felt252) -> ByteArray;
    fn concat(self: felt252, value: felt252) -> felt252;
    fn join(self: felt252, value: felt252) -> felt252;
}

impl ShortString of ShortStringTrait {
    fn strlen(self: felt252) -> usize {
        let mut result: usize = 0;
        let mut v: u256 = self.into();
        while (v != 0) {
            result += 1;
            v /= 0x100;
        };
        (result)
    }

    fn string(self: felt252) -> ByteArray {
        // alternative: core::to_byte_array::FormatAsByteArray
        let mut result: ByteArray = "";
        result.append_word(self, self.strlen());
        (result)
    }

    fn concat(self: felt252, value: felt252) -> felt252 {
        let value_strlen: usize = value.strlen();
        assert(self.strlen() + value_strlen <= 31, 'short_string::concat() Overflow');
        (BitwiseU256::shl(self.into(), value_strlen * 8) | value.into()).try_into().unwrap()
    }

    fn join(self: felt252, value: felt252) -> felt252 {
        Self::concat(Self::concat(self, '_'), value)
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
    fn test_concat() {
        assert(ShortString::concat('ABC', '123') == 'ABC123', 'ABC123');
        assert(ShortString::concat('Hey ', 'World') == 'Hey World', 'Hey 1');
        assert(ShortString::concat('Hey', ' World') == 'Hey World', 'Hey 2');
        assert(ShortString::concat(' Hey', 'World ') == ' HeyWorld ', 'Hey 3');
        assert(ShortString::concat(' Hey ', ' World ') == ' Hey  World ', 'Hey 4');
        assert(ShortString::concat('123456789012345678901234567890', '1') == '1234567890123456789012345678901', '1234567890123456789012345678901');
        assert(ShortString::concat('1', '123456789012345678901234567890') == '1123456789012345678901234567890', '1123456789012345678901234567890');
        assert(ShortString::join('Hey', 'World') == 'Hey_World', 'Hey_World');
    }
    
    #[test]
    #[should_panic(expected: 'short_string::concat() Overflow')]
    fn test_concat_overflow() {
        ShortString::concat('123456789012345678901234567890', '12');
    }
    
    #[test]
    fn test_strlen() {
        assert(0.strlen() == 0, '0');
        assert(''.strlen() == 0, 'empty');
        assert('1'.strlen() == 1, 'not 1');
        assert('Hey'.strlen() == 3, 'not 5');
        assert('Hey World'.strlen() == 9, 'not 9');
        assert('1234567890123456789012345678901'.strlen() == 31, 'not 31');
    }
    
    #[test]
    fn test_string() {
        assert(0.string() == "", 'not 0');
        assert(''.string() == "", 'not empty');
        assert('1'.string() == "1", 'not 1');
        assert('Hey'.string() == "Hey", 'not Hey');
        assert('Hey World'.string() == "Hey World", 'not Hey World');
        assert('1234567890123456789012345678901'.string() == "1234567890123456789012345678901", 'not 31');
    }
}
