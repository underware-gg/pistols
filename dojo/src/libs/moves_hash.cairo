// use pistols::types::cards::{
//     deck::{Deck, DeckType, DeckTypeTrait},
// };
use pistols::utils::bitwise::{BitwiseU32, BitwiseU128};
use pistols::utils::hash::{hash_values};
use pistols::utils::misc::{FeltToLossy};

#[generate_trait]
pub impl MovesHashImpl of MovesHashTrait {
    // a moves hash is composed of a hash of each move
    // * salt is hashed with each move
    // * only a 32-bit part of each has is used
    // move 1: 0x00000000000000000000000011111111
    // move 2: 0x00000000000000002222222200000000
    // move 3: 0x00000000333333330000000000000000
    // move 4: 0x44444444000000000000000000000000
    // * finally composed into a single u128
    // hash  : 0x44444444333333332222222211111111
    fn hash(salt: felt252, moves: Span<u8>) -> u128 {
        let mut result: u128 = 0;
        let mut index: usize = 0;
        while (index < moves.len()) {
            let move: felt252 = (*moves.at(index)).into();
            if (move != 0) {
                let mask: u128 = BitwiseU128::shl(BitwiseU32::max().into(), index * 32);
                let hash: u128 = hash_values([salt, move].span()).to_u128_lossy();
                result = result | (hash & mask);
            }
            index += 1;
        };
        (result)
    }
}



//------------------------------------------------------
// libs::utils tests
//
#[cfg(test)]
mod unit {
    use super::{MovesHashTrait};

    #[test]
    fn test_hash_uniqueness() {
        let salt_1: felt252 = 1;
        let salt_2: felt252 = 2;
        let moves_1: Span<u8> = [1,2,3,4].span();
        let moves_2: Span<u8> = [1,2,3,3].span();
        let hash_1_1: u128 = MovesHashTrait::hash(salt_1, moves_1);
        let hash_1_2: u128 = MovesHashTrait::hash(salt_1, moves_2);
        let hash_2_1: u128 = MovesHashTrait::hash(salt_2, moves_1);
        let hash_2_2: u128 = MovesHashTrait::hash(salt_2, moves_2);
        assert_ne!(hash_1_1, 0, "hash_zero");
        assert_ne!(hash_1_2, 0, "hash_zero");
        assert_ne!(hash_2_1, 0, "hash_zero");
        assert_ne!(hash_2_2, 0, "hash_zero");
        assert_ne!(hash_1_1, hash_1_2, "diff");
        assert_ne!(hash_1_1, hash_2_1, "diff");
        assert_ne!(hash_1_1, hash_2_2, "diff");
        assert_ne!(hash_1_2, hash_2_1, "diff");
        assert_ne!(hash_1_2, hash_2_2, "diff");
        assert_ne!(hash_2_1, hash_2_2, "diff");
    }

}
