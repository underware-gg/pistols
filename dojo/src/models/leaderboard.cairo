
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct Leaderboard {
    #[key]
    pub table_id: felt252,
    //-----------------------
    pub positions: u8,          // number of positions on the leaderboard (max 15)
    pub duelist_ids: felt252,   // (positions * 16 bits) = 240 bits
    pub scores: felt252,        // (positions * 16 bits) = 240 bits
}

#[derive(Copy, Drop, Serde, Default, Introspect)]
pub struct LeaderboardPosition {
    pub position: u8,
    pub duelist_id: u128,
    pub score: u16,
}


//----------------------------------
// Traits
//
use pistols::utils::bitwise::{BitwiseU256};
use pistols::utils::math::{MathU256};

#[generate_trait]
pub impl LeaderboardImpl of LeaderboardTrait {
    const MAX_POSITIONS: u8 = 15;
    const BITS: u8 = 16;
    const MASK: u256 = 0xffff;

    #[inline(always)]
    fn new(table_id: felt252, positions: u8) -> Leaderboard {
        assert(positions > 0 && positions <= Self::MAX_POSITIONS, 'LEADERBOARD: invalid positions');
        (Leaderboard {
            table_id,
            positions,
            duelist_ids: 0,
            scores: 0,
        })
    }
    #[inline(always)]
    fn exists(self: @Leaderboard) -> bool {
        (*self.positions > 0)
    }
    #[inline(always)]
    fn get_duelist_position(self: @Leaderboard, duelist_id: u128) -> LeaderboardPosition {
        let mut result: LeaderboardPosition = Default::default();
        let mut ids: u256 = (*self.duelist_ids).into();
        let mut p: u8 = 1;
        while (p <= *self.positions) {
            if (p > 1) {
                ids = BitwiseU256::shr(ids, Self::BITS.into());
            }
            let id: u128 = (ids & Self::MASK).low;
            // println!("--> i[{}] id[{:x}]", i, id);
            if (duelist_id == id) {
                let score: u16 = (BitwiseU256::shr((*self.scores).into(), ((p-1) * Self::BITS).into()) & Self::MASK).try_into().unwrap();
                result.position = p;
                result.duelist_id = duelist_id;
                result.score = score;
                break;
            }
            p += 1;
        };
        (result)
    }
    #[inline(always)]
    fn get_all_positions(self: @Leaderboard) -> Span<LeaderboardPosition> {
        let mut result: Array<LeaderboardPosition> = array![];
        let mut ids: u256 = (*self.duelist_ids).into();
        let mut scores: u256 = (*self.scores).into();
        let mut p: u8 = 1;
        while (p <= *self.positions) {
            if (p > 1) {
                ids = BitwiseU256::shr(ids, Self::BITS.into());
                scores = BitwiseU256::shr(scores, Self::BITS.into());
            }
            let id: u128 = (ids & Self::MASK).low;
            let score: u16 = (scores & Self::MASK).try_into().unwrap();
            // println!("--> i[{}] id[{:x}] score[{:x}]", i, id, score);
            if (score == 0) {
                break;
            }
            result.append(LeaderboardPosition {
                position: p,
                duelist_id: id,
                score,
            });
            p += 1;
        };
        (result.span())
    }
    #[inline(always)]
    fn insert_score(ref self: Leaderboard, duelist_id: u128, duelist_score: u16) -> u8 {
        let mut position: u8 = 0;
        if (duelist_score > 0) {
            let mut scores: u256 = (self.scores).into();
            let mut p: u8 = 1;
            while (p <= self.positions) {
                if (p > 1) {
                    scores = BitwiseU256::shr(scores, Self::BITS.into());
                }
                let score: u16 = (scores & Self::MASK).try_into().unwrap();
                // println!("--> i[{}] id[{:x}] score[{:x}]", i, id, score);
                if (duelist_score > score) {
                    self.duelist_ids = Self::_insert_value_at_position(self.duelist_ids.into(), duelist_id.try_into().unwrap(), p, self.positions);
                    self.scores = Self::_insert_value_at_position(self.scores.into(), duelist_score, p, self.positions);
                    position = p;
                    break;
                }
                p += 1;
            };
        }
        (position)
    }
    fn _insert_value_at_position(previous: u256, value: u16, position: u8, max_positions: u8) -> felt252 {
        assert(position > 0 && position <= max_positions, 'LEADERBOARD: invalid insert');
        let mut result: u256 = 0;
        if (position == 1) {
            result = value.into();
        } else {
            // insert value shifted to position
            result = BitwiseU256::shl(value.into(), ((position-1) * Self::BITS).into());
            // insert pre values
            if (previous != 0) {
                let pre_value: u256 = (previous & Self::_pre_mask(position));
                if (pre_value != 0) {
                    result = result | pre_value;
                }
            }
        }
        // insert post values, shift one position
        if (previous != 0){
            let post_value: u256 = (previous & Self::_post_mask(position));
            if (post_value != 0) {
                result = result | BitwiseU256::shl(post_value, Self::BITS.into());
            }
            // mask out anything not in the positions range
            result = result & Self::_positions_mask(max_positions);
        }
        (result.try_into().unwrap())
    }
    fn _pre_mask(position: u8) -> u256 {
        (match position {
            0  => 0,
            1  => 0x000000000000000000000000000000000000000000000000000000000000,
            2  => 0x00000000000000000000000000000000000000000000000000000000ffff,
            3  => 0x0000000000000000000000000000000000000000000000000000ffffffff,
            4  => 0x000000000000000000000000000000000000000000000000ffffffffffff,
            5  => 0x00000000000000000000000000000000000000000000ffffffffffffffff,
            6  => 0x0000000000000000000000000000000000000000ffffffffffffffffffff,
            7  => 0x000000000000000000000000000000000000ffffffffffffffffffffffff,
            8  => 0x00000000000000000000000000000000ffffffffffffffffffffffffffff,
            9  => 0x0000000000000000000000000000ffffffffffffffffffffffffffffffff,
            10 => 0x000000000000000000000000ffffffffffffffffffffffffffffffffffff,
            11 => 0x00000000000000000000ffffffffffffffffffffffffffffffffffffffff,
            12 => 0x0000000000000000ffffffffffffffffffffffffffffffffffffffffffff,
            13 => 0x000000000000ffffffffffffffffffffffffffffffffffffffffffffffff,
            14 => 0x00000000ffffffffffffffffffffffffffffffffffffffffffffffffffff,
            15 => 0x0000ffffffffffffffffffffffffffffffffffffffffffffffffffffffff,
            _ => 0,
        })
    }
    fn _post_mask(position: u8) -> u256 {
        (match position {
            0  => 0,
            1  => 0x0000ffffffffffffffffffffffffffffffffffffffffffffffffffffffff,
            2  => 0x0000ffffffffffffffffffffffffffffffffffffffffffffffffffff0000,
            3  => 0x0000ffffffffffffffffffffffffffffffffffffffffffffffff00000000,
            4  => 0x0000ffffffffffffffffffffffffffffffffffffffffffff000000000000,
            5  => 0x0000ffffffffffffffffffffffffffffffffffffffff0000000000000000,
            6  => 0x0000ffffffffffffffffffffffffffffffffffff00000000000000000000,
            7  => 0x0000ffffffffffffffffffffffffffffffff000000000000000000000000,
            8  => 0x0000ffffffffffffffffffffffffffff0000000000000000000000000000,
            9  => 0x0000ffffffffffffffffffffffff00000000000000000000000000000000,
            10 => 0x0000ffffffffffffffffffff000000000000000000000000000000000000,
            11 => 0x0000ffffffffffffffff0000000000000000000000000000000000000000,
            12 => 0x0000ffffffffffff00000000000000000000000000000000000000000000,
            13 => 0x0000ffffffff000000000000000000000000000000000000000000000000,
            14 => 0x0000ffff0000000000000000000000000000000000000000000000000000,
            15 => 0x000000000000000000000000000000000000000000000000000000000000,
            _ => 0,
        })
    }
    fn _positions_mask(positions: u8) -> u256 {
        (match positions {
            0  => 0,
            1  => 0x00000000000000000000000000000000000000000000000000000000ffff,
            2  => 0x0000000000000000000000000000000000000000000000000000ffffffff,
            3  => 0x000000000000000000000000000000000000000000000000ffffffffffff,
            4  => 0x00000000000000000000000000000000000000000000ffffffffffffffff,
            5  => 0x0000000000000000000000000000000000000000ffffffffffffffffffff,
            6  => 0x000000000000000000000000000000000000ffffffffffffffffffffffff,
            7  => 0x00000000000000000000000000000000ffffffffffffffffffffffffffff,
            8  => 0x0000000000000000000000000000ffffffffffffffffffffffffffffffff,
             9 => 0x000000000000000000000000ffffffffffffffffffffffffffffffffffff,
            10 => 0x00000000000000000000ffffffffffffffffffffffffffffffffffffffff,
            11 => 0x0000000000000000ffffffffffffffffffffffffffffffffffffffffffff,
            12 => 0x000000000000ffffffffffffffffffffffffffffffffffffffffffffffff,
            13 => 0x00000000ffffffffffffffffffffffffffffffffffffffffffffffffffff,
            14 => 0x0000ffffffffffffffffffffffffffffffffffffffffffffffffffffffff,
            15 => 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff,
            _ => 0,
        })
    }
}




//----------------------------------------
// Unit  tests
//
#[cfg(test)]
mod unit {
    use super::{Leaderboard, LeaderboardTrait, LeaderboardPosition};

    const IDS: felt252    = 0xf000e000d000c000b000a000900080007000600050004000300020001000;
    const SCORES: felt252 = 0x00110022003300440055006600770088009900aa00bb00cc00dd00ee00ff;
    const ID_1: u128 = 0x1000;
    const ID_STEP: u128 = 0x1000;
    const SCORE_1: u16 = 0x00ff;
    const SCORE_STEP: u16 = 0x0011;
    
    const LB: Leaderboard = Leaderboard {
        table_id: 'dummy',
        positions: LeaderboardTrait::MAX_POSITIONS,
        duelist_ids: IDS,
        scores: SCORES,
    };

    #[test]
    fn test_get_duelist_position() {
        let mut current_id: u128 = ID_1;
        let mut expected_score: u16 = SCORE_1;
        let mut p: u8 = 1;
        while (p <= LB.positions) {
            let pos: LeaderboardPosition = LB.get_duelist_position(current_id);
            assert_eq!(pos.position, p, "position[{}]: {}", p, pos.position);
            assert_eq!(pos.score, expected_score, "score[{}]: {}", p, pos.score);
            assert_eq!(pos.duelist_id, current_id, "duelist_id[{}]: {}", p, pos.duelist_id);
            current_id += ID_STEP;
            expected_score -= SCORE_STEP;
            p += 1;
        };
    }

    #[test]
    fn test_get_all_positions() {
        let all_positions: Span<LeaderboardPosition> = LB.get_all_positions();
        assert_eq!(all_positions.len(), LeaderboardTrait::MAX_POSITIONS.into(), "all_positions.len()");
        assert_eq!(all_positions.len(), LB.positions.into(), "LB.positions");
        let mut current_id: u128 = ID_1;
        let mut expected_score: u16 = SCORE_1;
        let mut p: u8 = 1;
        while (p <= LB.positions) {
            let pos: LeaderboardPosition = *all_positions.at(p.into()-1);
            assert_eq!(pos.position, p, "position[{}]: {}", p, pos.position);
            assert_eq!(pos.score, expected_score, "score[{}]: {}", p, pos.score);
            assert_eq!(pos.duelist_id, current_id, "duelist_id[{}]: {}", p, pos.duelist_id);
            current_id += ID_STEP;
            expected_score -= SCORE_STEP;
            p += 1;
        };
    }

    #[test]
    fn test_get_all_positions_empty() {
        let lb: Leaderboard = Leaderboard {
            table_id: 'dummy',
            positions: 10,
            duelist_ids: 0,
            scores: 0,
        };
        let all_positions: Span<LeaderboardPosition> = lb.get_all_positions();
        assert_eq!(all_positions.len(), 0, "all_positions.len()");
    }

    #[test]
    fn test_get_all_positions_max() {
        let lb: Leaderboard = Leaderboard {
            table_id: 'dummy',
            positions: 10,
            duelist_ids: IDS,
            scores: SCORES,
        };
        let all_positions: Span<LeaderboardPosition> = lb.get_all_positions();
        assert_eq!(all_positions.len(), lb.positions.into(), "all_positions.len()");
    }

    #[test]
    fn test_insert_score_ordered() {
        let mut lb: Leaderboard = Leaderboard {
            table_id: 'dummy',
            positions: LeaderboardTrait::MAX_POSITIONS,
            duelist_ids: 0,
            scores: 0,
        };
        lb.insert_score(0x1000, 0x00ff);
        lb.insert_score(0x2000, 0x00ee);
        lb.insert_score(0x3000, 0x00dd);
        lb.insert_score(0x4000, 0x00cc);
        lb.insert_score(0x5000, 0x00bb);
        lb.insert_score(0x6000, 0x00aa);
        lb.insert_score(0x7000, 0x0099);
        lb.insert_score(0x8000, 0x0088);
        lb.insert_score(0x9000, 0x0077);
        lb.insert_score(0xa000, 0x0066);
        lb.insert_score(0xb000, 0x0055);
        lb.insert_score(0xc000, 0x0044);
        lb.insert_score(0xd000, 0x0033);
        lb.insert_score(0xe000, 0x0022);
        lb.insert_score(0xf000, 0x0011);
        assert_eq!(lb.duelist_ids, IDS, "duelist_ids");
        assert_eq!(lb.scores, SCORES, "scores");
        // same score as last: not qualified
        assert_eq!(lb.insert_score(0x1234, 0x0011), 0, "not qualified");
        // same score: goes later
        assert_eq!(lb.insert_score(0x1234, 0x0022), 15, "last place");
    }

    #[test]
    fn test_insert_score_unordered() {
        let mut lb: Leaderboard = Leaderboard {
            table_id: 'dummy',
            positions: LeaderboardTrait::MAX_POSITIONS,
            duelist_ids: 0,
            scores: 0,
        };
        assert_eq!(lb.insert_score(0x4000, 0x00cc), 1, "0x4000");
        assert_eq!(lb.insert_score(0x5000, 0x00bb), 2, "0x5000");
        assert_eq!(lb.insert_score(0xa000, 0x0066), 3, "0xa000");
        assert_eq!(lb.insert_score(0xb000, 0x0055), 4, "0xb000");
        assert_eq!(lb.insert_score(0x1234, 0x0000), 0, "zero value not inserted");
        assert_eq!(lb.insert_score(0x2000, 0x00ee), 1, "0x2000");
        assert_eq!(lb.insert_score(0x1000, 0x00ff), 1, "0x1000");
        assert_eq!(lb.insert_score(0x9000, 0x0077), 5, "0x9000");
        assert_eq!(lb.insert_score(0x3000, 0x00dd), 3, "0x3000");
        assert_eq!(lb.insert_score(0x6000, 0x00aa), 6, "0x6000");
        assert_eq!(lb.insert_score(0x7000, 0x0099), 7, "0x7000");
        assert_eq!(lb.insert_score(0xc000, 0x0044), 11, "0xc000");
        assert_eq!(lb.insert_score(0xe000, 0x0022), 12, "0xe000");
        assert_eq!(lb.insert_score(0xf000, 0x0011), 13, "0xf000");
        assert_eq!(lb.insert_score(0x8000, 0x0088), 8, "0x8000");
        assert_eq!(lb.insert_score(0xd000, 0x0033), 13, "0xd000");
        assert_eq!(lb.insert_score(0x1234, 0x0001), 0, "not qualified");
        assert_eq!(lb.duelist_ids, IDS, "duelist_ids");
        assert_eq!(lb.scores, SCORES, "scores");
    }

    #[test]
    fn test_insert_value() {
        let result: felt252 = LeaderboardTrait::_insert_value_at_position(0x0, 0xffff, 1, 5);
        assert_eq!(result, 0xffff, "at_1");
        let result: felt252 = LeaderboardTrait::_insert_value_at_position(0x1111, 0xffff, 1, 1);
        assert_eq!(result, 0xffff, "at_1/2_(1)");
        let result: felt252 = LeaderboardTrait::_insert_value_at_position(0x1111, 0xffff, 1, 5);
        assert_eq!(result, 0x1111ffff, "at_1/2_(5)");
        let result: felt252 = LeaderboardTrait::_insert_value_at_position(0x1111, 0xffff, 2, 5);
        assert_eq!(result, 0xffff1111, "at_2/2_(5)");
        let result: felt252 = LeaderboardTrait::_insert_value_at_position(0x11112222, 0xffff, 1, 2);
        assert_eq!(result, 0x2222ffff, "at_1/3_(2)");
        let result: felt252 = LeaderboardTrait::_insert_value_at_position(0x11112222, 0xffff, 1, 5);
        assert_eq!(result, 0x11112222ffff, "at_1/3_(5)");
        let result: felt252 = LeaderboardTrait::_insert_value_at_position(0x11112222, 0xffff, 2, 5);
        assert_eq!(result, 0x1111ffff2222, "at_2/3_(5)");
        let result: felt252 = LeaderboardTrait::_insert_value_at_position(0x11112222, 0xffff, 3, 5);
        assert_eq!(result, 0xffff11112222, "at_3/3_(5)");
        let result: felt252 = LeaderboardTrait::_insert_value_at_position(0x11112222333344445555, 0xffff, 1, 5);
        assert_eq!(result, 0x2222333344445555ffff, "at_1/5_(5)");
        let result: felt252 = LeaderboardTrait::_insert_value_at_position(0x11112222333344445555, 0xffff, 2, 5);
        assert_eq!(result, 0x222233334444ffff5555, "at_2/5_(5)");
        let result: felt252 = LeaderboardTrait::_insert_value_at_position(0x11112222333344445555, 0xffff, 3, 5);
        assert_eq!(result, 0x22223333ffff44445555, "at_3/5_(5)");
        let result: felt252 = LeaderboardTrait::_insert_value_at_position(0x11112222333344445555, 0xffff, 4, 5);
        assert_eq!(result, 0x2222ffff333344445555, "at_4/5_(5)");
        let result: felt252 = LeaderboardTrait::_insert_value_at_position(0x11112222333344445555, 0xffff, 5, 5);
        assert_eq!(result, 0xffff2222333344445555, "at_5/5_(5)");
    }
}
