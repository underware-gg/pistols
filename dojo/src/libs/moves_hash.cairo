use core::num::traits::Zero;
use pistols::types::cards::deck::{Deck, DeckTrait};
use pistols::utils::{
    bitwise::{BitwiseU32, BitwiseU128},
    hash::{hash_values},
    misc::{FeltToLossy},
};

#[generate_trait]
pub impl MovesHashImpl of MovesHashTrait {
    // a moves hash is composed of a hash of each move
    // * salt is hashed with each move
    // * only 32 bits of each hash is used
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
                let move_mask: u128 = Self::_move_mask(index);
                let move_hash: u128 = Self::_move_hash(salt, move);
                result = result | (move_hash & move_mask);
            }
            index += 1;
        };
        (result)
    }

    fn restore(salt: felt252, hash: u128, deck: Deck) -> Span<u8> {
        if (salt.is_zero()) {
            return [].span();
        }
        let mut result: Array<u8> = array![];
        let decks: Span<Span<u8>> = deck.to_span();
        let mut di: usize = 0;
        while (di < decks.len()) {
            let deck: Span<u8> = *decks.at(di);
            let move_mask: u128 = Self::_move_mask(di);
            let stored_hash: u128 = (hash & move_mask);
            if (stored_hash.is_zero() || deck.len().is_zero()) {
                result.append(0);
            } else {
                let mut found_move: u8 = 0;
                let mut mi: usize = 0;
                while (mi < deck.len()) {
                    let move: u8 = *deck.at(mi);
                    let move_hash: u128 = (Self::_move_hash(salt, move.into()) & move_mask);
                    if (move_hash == stored_hash) {
                        found_move = move;
                        break;
                    }
                    mi += 1;
                };
                assert!(found_move.is_non_zero(), "restore() > move not found [{},{}]", di, mi);
                result.append(found_move);
            }
            di += 1;
        };
        (result.span())
    }

    #[inline(always)]
    fn _move_hash(salt: felt252, move: felt252) -> u128 {
        (hash_values([salt, move].span()).to_u128_lossy())
    }

    fn _move_mask(index: usize) -> u128 {
        (match index {
            0  => 0x000000000000000000000000ffffffff,
            1  => 0x0000000000000000ffffffff00000000,
            2  => 0x00000000ffffffff0000000000000000,
            3  => 0xffffffff000000000000000000000000,
            _ => 0,
        })
    }
}



//------------------------------------------------------
// libs::utils tests
//
#[cfg(test)]
mod unit {
    use super::{MovesHashTrait};
    use pistols::types::cards::deck::{Deck, DeckTrait, DeckType, DeckTypeTrait};
    use pistols::utils::arrays::{ArrayTestUtilsTrait};


    fn _test_deck() -> Deck {
        let decks: Span<Span<u8>> = [
            [1,2,3,4,5].span(),
            [1,2,3,4,5].span(),
            [1,2,3,4,5].span(),
            [1,2,3,4,5].span(),
        ].span();
        (DeckTrait::from_span(decks))
    }

    fn _assert_restore(salt: felt252, hash: u128, moves: Span<u8>, deck: Deck, prefix: ByteArray) {
        let restored: Span<u8> = MovesHashTrait::restore(salt, hash, deck);
        ArrayTestUtilsTrait::assert_span_eq(restored, moves, format!("[{}]: restore error", prefix));
    }

    #[test]
    fn test_hash_uniqueness() {
        let deck: Deck = _test_deck();
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
        // restore
        _assert_restore(salt_1, hash_1_1, moves_1, deck, "hash_1_1");
        _assert_restore(salt_1, hash_1_2, moves_2, deck, "hash_1_2");
        _assert_restore(salt_2, hash_2_1, moves_1, deck, "hash_2_1");
        _assert_restore(salt_2, hash_2_2, moves_2, deck, "hash_2_2");
        // empty
        assert_eq!(MovesHashTrait::hash(salt_1, [].span()), 0, "empty_span");
        assert_eq!(MovesHashTrait::hash(salt_1, [0,0,0,0].span()), 0, "not_moving");
    }

    #[test]
    fn test_restore() {
        let deck: Deck = _test_deck();
        let salt: felt252 = 1234;
        let moves_1: Span<u8> = [1,2,3,4].span();
        let moves_2: Span<u8> = [5,4,3,2].span();
        let hash_1: u128 = MovesHashTrait::hash(salt, moves_1);
        let hash_2: u128 = MovesHashTrait::hash(salt, moves_2);
        // restore...
        _assert_restore(salt, hash_1, moves_1, deck, "hash_1");
        _assert_restore(salt, hash_2, moves_2, deck, "hash_2");
        // one slot
        let hash__1: u128 = MovesHashTrait::hash(1234, [1,0,0,0].span());
        assert_gt!(hash__1, 0, "hash__1");
        assert_eq!(hash__1 & 0xffffffff, hash__1, "hash__1");
        assert_eq!(hash__1 & ~0xffffffff, 0, "~hash__1");
        _assert_restore(1234, hash__1, [1,0,0,0].span(), deck, "hash__1");
        let hash__2: u128 = MovesHashTrait::hash(1234, [0,1,0,0].span());
        assert_gt!(hash__2, 0, "hash__2");
        assert_eq!(hash__2 & 0xffffffff00000000, hash__2, "hash__2");
        assert_eq!(hash__2 & ~0xffffffff00000000, 0, "~hash__2");
        _assert_restore(1234, hash__2, [0,1,0,0].span(), deck, "hash__2");
        let hash__3: u128 = MovesHashTrait::hash(1234, [0,0,1,0].span());
        assert_gt!(hash__3, 0, "hash__3");
        assert_eq!(hash__3 & 0xffffffff0000000000000000, hash__3, "hash__3");
        assert_eq!(hash__3 & ~0xffffffff0000000000000000, 0, "~hash__3");
        _assert_restore(1234, hash__3, [0,0,1,0].span(), deck, "hash__3");
        let hash__4: u128 = MovesHashTrait::hash(1234, [0,0,0,1].span());
        assert_gt!(hash__4, 0, "hash__4");
        assert_eq!(hash__4 & 0xffffffff000000000000000000000000, hash__4, "hash__4");
        assert_eq!(hash__4 & ~0xffffffff000000000000000000000000, 0, "~hash__4");
        _assert_restore(1234, hash__4, [0,0,0,1].span(), deck, "hash__4");
    }

    #[test]
    fn test_restore_alt_deck() {
        let deck: Deck = DeckType::PacesOnly.build_deck();
        let salt: felt252 = 1234;
        let moves_1: Span<u8> = [10,1,0,0].span();
        let moves_2: Span<u8> = [2,8,0,0].span();
        let hash_1: u128 = MovesHashTrait::hash(salt, moves_1);
        let hash_2: u128 = MovesHashTrait::hash(salt, moves_2);
        // restore...
        _assert_restore(salt, hash_1, moves_1, deck, "hash_1");
        _assert_restore(salt, hash_2, moves_2, deck, "hash_2");
    }

    #[test]
    #[should_panic]
    fn test_restore_fail() {
        let deck: Deck = _test_deck();
        let salt: felt252 = 1234;
        let moves_1: Span<u8> = [1,2,3,4].span();
        let moves_2: Span<u8> = [5,4,3,2].span();
        let hash_1: u128 = MovesHashTrait::hash(salt, moves_1);
        // restore...
        _assert_restore(salt, hash_1, moves_2, deck, "hash_2");
    }

    // TODO: test 2-card deck
    // TODO: test 3-card deck
    // TODO: test move=0

}
