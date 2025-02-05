use pistols::utils::bitwise::{BitwiseU256};

pub trait ShortStringTrait {
    fn strlen(self: felt252) -> usize;
    fn to_string(self: felt252) -> ByteArray;
    fn concat(self: felt252, value: felt252) -> felt252;
    fn join(self: felt252, value: felt252) -> felt252;
}

pub impl ShortString of ShortStringTrait {
    fn strlen(self: felt252) -> usize {
        let mut result: usize = 0;
        let mut v: u256 = self.into();
        while (v != 0) {
            result += 1;
            v /= 0x100;
        };
        (result)
    }

    fn to_string(self: felt252) -> ByteArray {
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
    use super::{ShortString};
    
    #[test]
    fn test_concat() {
        assert_eq!(ShortString::concat('ABC', '123'), 'ABC123', "ABC123");
        assert_eq!(ShortString::concat('Hey ', 'World'), 'Hey World', "Hey 1");
        assert_eq!(ShortString::concat('Hey', ' World'), 'Hey World', "Hey 2");
        assert_eq!(ShortString::concat(' Hey', 'World '), ' HeyWorld ', "Hey 3");
        assert_eq!(ShortString::concat(' Hey ', ' World '), ' Hey  World ', "Hey 4");
        assert_eq!(ShortString::concat('123456789012345678901234567890', '1'), '1234567890123456789012345678901', "1234567890123456789012345678901");
        assert_eq!(ShortString::concat('1', '123456789012345678901234567890'), '1123456789012345678901234567890', "1123456789012345678901234567890");
        assert_eq!(ShortString::join('Hey', 'World'), 'Hey_World', "Hey_World");
    }
    
    #[test]
    #[should_panic(expected:('short_string::concat() Overflow',))]
    fn test_concat_overflow() {
        ShortString::concat('1234567890123456789012345678901', '2');
    }
    
    #[test]
    fn test_strlen() {
        assert_eq!(0.strlen(), 0, "0");
        assert_eq!(''.strlen(), 0, "empty");
        assert_eq!('1'.strlen(), 1, "not 1");
        assert_eq!('Hey'.strlen(), 3, "not 5");
        assert_eq!('Hey World'.strlen(), 9, "not 9");
        assert_eq!('1234567890123456789012345678901'.strlen(), 31, "not 31");
    }
    
    #[test]
    fn test_string() {
        assert_eq!(0.to_string(), "", "not 0");
        assert_eq!(''.to_string(), "", "not empty");
        assert_eq!('1'.to_string(), "1", "not 1");
        assert_eq!('Hey'.to_string(), "Hey", "not Hey");
        assert_eq!('Hey World'.to_string(), "Hey World", "not Hey World");
        assert_eq!('1234567890123456789012345678901'.to_string(), "1234567890123456789012345678901", "not 31");
    }
}
