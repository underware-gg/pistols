
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct Leaderboard {
    #[key]
    pub season_id: u32,
    //-----------------------
    pub positions: u8,          // number of positions on the leaderboard (max 10)
    pub duelist_ids: felt252,   // (positions * 24 bits) = 240 bits max (max duelist id: 16,777,215)
    pub scores: felt252,        // (positions * 24 bits) = 240 bits max
}

#[derive(Copy, Drop, Serde, Default, Introspect)]
pub struct LeaderboardPosition {
    pub position: u8,
    pub duelist_id: u128,
    pub points: u16,
}


//----------------------------------
// Traits
//
use starknet::{ContractAddress};
use pistols::libs::store::{Store, StoreTrait};
use pistols::utils::bitwise::{BitwiseU256};

#[generate_trait]
pub impl LeaderboardImpl of LeaderboardTrait {
    const MAX_POSITIONS: u8 = 10;
    const BITS: u8 = 24;
    const MASK: u256 = 0xffffff;
    const SHIFT: u256 = 0x1000000;

    fn new(season_id: u32, positions: u8) -> Leaderboard {
        assert(positions > 0 && positions <= Self::MAX_POSITIONS, 'LEADERBOARD: invalid positions');
        (Leaderboard {
            season_id,
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
    fn is_qualified(self: @Leaderboard, store: @Store, address: ContractAddress) -> bool {
        (
            !store.get_player_is_team_member(address) &&
            !store.get_player_is_blocked(address)
        )
    }
    fn get_duelist_position(self: @Leaderboard, duelist_id: u128) -> LeaderboardPosition {
        let mut result: LeaderboardPosition = Default::default();
        let mut ids: u256 = (*self.duelist_ids).into();
        let mut p: u8 = 1;
        while (p <= *self.positions) {
            if (p > 1) {
                ids /= Self::SHIFT;
            }
            let id: u128 = (ids & Self::MASK).low;
            // println!("--> i[{}] id[{:x}]", i, id);
            if (duelist_id == id) {
                let score: u16 = (
                    ((*self.scores).into() / Self::_shift_mask(p))
                    & Self::MASK
                ).try_into().unwrap();
                result.position = p;
                result.duelist_id = duelist_id;
                result.points = score;
                break;
            }
            p += 1;
        };
        (result)
    }
    fn get_all_positions(self: @Leaderboard) -> Span<LeaderboardPosition> {
        let mut result: Array<LeaderboardPosition> = array![];
        let mut ids: u256 = (*self.duelist_ids).into();
        let mut scores: u256 = (*self.scores).into();
        let mut p: u8 = 1;
        while (p <= *self.positions) {
            if (p > 1) {
                ids /= Self::SHIFT;
                scores /= Self::SHIFT;
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
                points: score,
            });
            p += 1;
        };
        (result.span())
    }
    fn insert_score(ref self: Leaderboard, duelist_id: u128, new_score: u16) -> u8 {
        let mut to_position: u8 = 0;
        if (new_score > 0) {
            let mut from_position: u8 = 0;
            let mut scores: u256 = (self.scores).into();
            let mut ids: u256 = (self.duelist_ids).into();
            let mut p: u8 = 1;
            while (p <= self.positions) {
                if (p > 1) {
                    scores /= Self::SHIFT;
                    ids /= Self::SHIFT;
                }
                let score: u16 = (scores & Self::MASK).try_into().unwrap();
                let id: u128 = (ids & Self::MASK).low;
// println!("--> p[{}] id[{:x}] score[{:x}]", p, id, score);
                if (to_position == 0 && new_score > score) {
                    to_position = p;
                }
                if (id == duelist_id) {
                    from_position = p; // need to be removed
                    break; // current score is higher or already found to_position
                }
                if (score == 0) {
                    break; // end of existing positions
                }
                p += 1;
            };
// println!("--> id[{:x}] score[{:x}] = old[{}] new[{}]", duelist_id, new_score, from_position, to_position);
            if (to_position > 0) {
                if (to_position == from_position) {
                    self.scores = Self::_replace_value_at_position(self.scores.into(), new_score.into(), to_position, self.positions);
                } else if (from_position != 0) {
                    self.scores = Self::_move_value_to_position(self.scores.into(), new_score.into(), from_position, to_position, self.positions);
                    self.duelist_ids = Self::_move_value_to_position(self.duelist_ids.into(), duelist_id.into(), from_position, to_position, self.positions);
                } else {
                    self.scores = Self::_insert_value_at_position(self.scores.into(), new_score.into(), to_position, self.positions);
                    self.duelist_ids = Self::_insert_value_at_position(self.duelist_ids.into(), duelist_id.into(), to_position, self.positions);
                }
            }
        }
        (to_position)
    }
    fn remove_duelist_score(ref self: Leaderboard, duelist_id: u128) -> bool {
        let mut current_position: u8 = 0;
        let mut scores: u256 = (self.scores).into();
        let mut ids: u256 = (self.duelist_ids).into();
        let mut p: u8 = 1;
        while (p <= self.positions) {
            if (p > 1) {
                scores /= Self::SHIFT;
                ids /= Self::SHIFT;
            }
            let id: u128 = (ids & Self::MASK).low;
            let score: u16 = (scores & Self::MASK).try_into().unwrap();
// println!("--> p[{}] id[{:x}] score[{:x}]", p, id, score);
            if (id == duelist_id) {
                current_position = p; // need to be removed
                break; // current score is higher or already found to_position
            }
            if (score == 0) {
                break; // end of existing positions
            }
            p += 1;
        };
        if (current_position > 0) {
// println!("--> id[{:x}] >> @[{}]", duelist_id, current_position);
            self.scores = Self::_remove_score_at_position(self.scores.into(), current_position, self.positions);
            self.duelist_ids = Self::_remove_score_at_position(self.duelist_ids.into(), current_position, self.positions);
            (true)
        } else {
            (false)
        }
    }
    //
    // internal functions
    //
    fn _replace_value_at_position(previous: u256, value: u256, to_position: u8, max_positions: u8) -> felt252 {
        assert(to_position > 0 && to_position <= max_positions, 'LEADERBOARD: invalid replace');
        let result: u256 =
            // keep outside position
            (previous & ~Self::_position_mask(to_position)) |
            // shift value to position
            if (to_position == 1) {value} else {(value * Self::_shift_mask(to_position))};
        (result.try_into().unwrap())
    }
    fn _insert_value_at_position(previous: u256, value: u256, to_position: u8, max_positions: u8) -> felt252 {
        assert(to_position > 0 && to_position <= max_positions, 'LEADERBOARD: invalid insert');
        let mut result: u256 = (
            // insert pre values
            (previous & Self::_pre_mask(to_position)) |
            // insert post values, shifted one position
            ((previous & (Self::_post_mask(to_position))) * Self::SHIFT) |
            // shift value to position
            if (to_position == 1) {value} else {(value * Self::_shift_mask(to_position))}
        // remove outside positions range
        ) & Self::_full_mask(max_positions);
        (result.try_into().unwrap())
    }
    fn _move_value_to_position(previous: u256, value: u256, from_position: u8, to_position: u8, max_positions: u8) -> felt252 {
        assert(to_position > 0 && to_position <= max_positions, 'LEADERBOARD: invalid new pos');
        assert(from_position > 0 && from_position <= max_positions, 'LEADERBOARD: invalid old pos');
        assert(from_position > to_position, 'LEADERBOARD: invalid move');
        // mask for old-new range
        let range_bits: u256 = BitwiseU256::bit_fill(((from_position - to_position + 1) * Self::BITS).into());
        let range_mask: u256 = range_bits * Self::_shift_mask(to_position);
        let result: u256 = 
            // keep outside range
            (previous & ~range_mask) |
            // shift range (less old pos)
            BitwiseU256::shl(previous & range_mask & ~Self::_position_mask(from_position), Self::BITS.into()) |
            // shift value to position
            if (to_position == 1) {value} else {(value * Self::_shift_mask(to_position))};
        (result.try_into().unwrap())
    }
    fn _remove_score_at_position(previous: u256, position: u8, max_positions: u8) -> felt252 {
        assert(position > 0 && position <= max_positions, 'LEADERBOARD: invalid position');
        // mask for old-new range
        let result: u256 = 
            // keep previous values
            (previous & Self::_pre_mask(position)) |
            // shift range (less current pos)
            BitwiseU256::shr(previous & ~(Self::_pre_mask(position) | Self::_position_mask(position)), Self::BITS.into());
        (result.try_into().unwrap())
    }
    // this mask represents the area occupied by scores at [position]
    fn _position_mask(position: u8) -> u256 {
        (match position {
            0  => 0,
            1  => 0x000000000000000000000000000000000000000000000000000000ffffff,
            2  => 0x000000000000000000000000000000000000000000000000ffffff000000,
            3  => 0x000000000000000000000000000000000000000000ffffff000000000000,
            4  => 0x000000000000000000000000000000000000ffffff000000000000000000,
            5  => 0x000000000000000000000000000000ffffff000000000000000000000000,
            6  => 0x000000000000000000000000ffffff000000000000000000000000000000,
            7  => 0x000000000000000000ffffff000000000000000000000000000000000000,
            8  => 0x000000000000ffffff000000000000000000000000000000000000000000,
            9  => 0x000000ffffff000000000000000000000000000000000000000000000000,
            10 => 0xffffff000000000000000000000000000000000000000000000000000000,
            _ => 0,
        })
    }
    // multiply by this mask to shift down a number of [positions]
    fn _shift_mask(positions: u8) -> u256 {
        (match positions {
            0  => 0,
            1  => 0x000000000000000000000000000000000000000000000000000000000001,
            2  => 0x000000000000000000000000000000000000000000000000000001000000,
            3  => 0x000000000000000000000000000000000000000000000001000000000000,
            4  => 0x000000000000000000000000000000000000000001000000000000000000,
            5  => 0x000000000000000000000000000000000001000000000000000000000000,
            6  => 0x000000000000000000000000000001000000000000000000000000000000,
            7  => 0x000000000000000000000001000000000000000000000000000000000000,
            8  => 0x000000000000000001000000000000000000000000000000000000000000,
            9  => 0x000000000001000000000000000000000000000000000000000000000000,
            10 => 0x000001000000000000000000000000000000000000000000000000000000,
            _ => 0,
        })
    }
    // when inserting a value at [position], keep higher scores in this mask
    fn _pre_mask(position: u8) -> u256 {
        (match position {
            0  => 0,
            1  => 0x000000000000000000000000000000000000000000000000000000000000,
            2  => 0x000000000000000000000000000000000000000000000000000000ffffff,
            3  => 0x000000000000000000000000000000000000000000000000ffffffffffff,
            4  => 0x000000000000000000000000000000000000000000ffffffffffffffffff,
            5  => 0x000000000000000000000000000000000000ffffffffffffffffffffffff,
            6  => 0x000000000000000000000000000000ffffffffffffffffffffffffffffff,
            7  => 0x000000000000000000000000ffffffffffffffffffffffffffffffffffff,
            8  => 0x000000000000000000ffffffffffffffffffffffffffffffffffffffffff,
            9  => 0x000000000000ffffffffffffffffffffffffffffffffffffffffffffffff,
            10 => 0x000000ffffffffffffffffffffffffffffffffffffffffffffffffffffff,
            _ => 0,
        })
    }
    // when inserting a value at [position], shift down lower scores in this mask
    fn _post_mask(position: u8) -> u256 {
        (match position {
            0  => 0,
            1  => 0x000000ffffffffffffffffffffffffffffffffffffffffffffffffffffff,
            2  => 0x000000ffffffffffffffffffffffffffffffffffffffffffffffff000000,
            3  => 0x000000ffffffffffffffffffffffffffffffffffffffffff000000000000,
            4  => 0x000000ffffffffffffffffffffffffffffffffffff000000000000000000,
            5  => 0x000000ffffffffffffffffffffffffffffff000000000000000000000000,
            6  => 0x000000ffffffffffffffffffffffff000000000000000000000000000000,
            7  => 0x000000ffffffffffffffffff000000000000000000000000000000000000,
            8  => 0x000000ffffffffffff000000000000000000000000000000000000000000,
            9  => 0x000000ffffff000000000000000000000000000000000000000000000000,
            10 => 0x000000000000000000000000000000000000000000000000000000000000,
            _ => 0,
        })
    }
    // the full area used by a leaderboard with [max_positions]
    fn _full_mask(max_positions: u8) -> u256 {
        (match max_positions {
            0  => 0,
            1  => 0x000000000000000000000000000000000000000000000000000000ffffff,
            2  => 0x000000000000000000000000000000000000000000000000ffffffffffff,
            3  => 0x000000000000000000000000000000000000000000ffffffffffffffffff,
            4  => 0x000000000000000000000000000000000000ffffffffffffffffffffffff,
            5  => 0x000000000000000000000000000000ffffffffffffffffffffffffffffff,
            6  => 0x000000000000000000000000ffffffffffffffffffffffffffffffffffff,
            7  => 0x000000000000000000ffffffffffffffffffffffffffffffffffffffffff,
            8  => 0x000000000000ffffffffffffffffffffffffffffffffffffffffffffffff,
            9  => 0x000000ffffffffffffffffffffffffffffffffffffffffffffffffffffff,
            10 => 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff,
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

    const IDS: felt252    = 0xa00000900000800000700000600000500000400000300000200000100000;
    const SCORES: felt252 = 0x0000660000770000880000990000aa0000bb0000cc0000dd0000ee0000ff;
    const ID_1: u128 = 0x100000;
    const ID_STEP: u128 = 0x100000;
    const SCORE_1: u16 = 0x0000ff;
    const SCORE_STEP: u16 = 0x000011;
    
    const LB: Leaderboard = Leaderboard {
        season_id: 1,
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
            assert_eq!(pos.points, expected_score, "points[{}]: {}", p, pos.points);
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
            assert_eq!(pos.points, expected_score, "points[{}]: {}", p, pos.points);
            assert_eq!(pos.duelist_id, current_id, "duelist_id[{}]: {}", p, pos.duelist_id);
            current_id += ID_STEP;
            expected_score -= SCORE_STEP;
            p += 1;
        };
    }

    #[test]
    fn test_get_all_positions_empty() {
        let lb: Leaderboard = Leaderboard {
            season_id: 1,
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
            season_id: 1,
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
            season_id: 1,
            positions: LeaderboardTrait::MAX_POSITIONS,
            duelist_ids: 0,
            scores: 0,
        };
        lb.insert_score(0x100000, 0x00ff); // 1
        lb.insert_score(0x200000, 0x00ee); // 2
        lb.insert_score(0x300000, 0x00dd); // 3
        lb.insert_score(0x400000, 0x00cc); // 4
        lb.insert_score(0x500000, 0x00bb); // 5
        lb.insert_score(0x600000, 0x00aa); // 6
        lb.insert_score(0x700000, 0x0099); // 7
        lb.insert_score(0x800000, 0x0088); // 8
        lb.insert_score(0x900000, 0x0077); // 9
        lb.insert_score(0xa00000, 0x0066); // 10
        assert_eq!(lb.duelist_ids, IDS, "duelist_ids");
        assert_eq!(lb.scores, SCORES, "scores");
        // same score as last -- not qualified
        assert_eq!(lb.insert_score(0x123456, 0x0066), 0, "not qualified");
        // same score: goes later -- insert later
        assert_eq!(lb.insert_score(0x123456, 0x0077), 10, "last place");
        // new score, same position -- replace
        assert_eq!(lb.insert_score(0x800000, 0x0089), 8, "replace score");
        // new score, lower position - do nothing
        assert_eq!(lb.insert_score(0x900000, 0x0033), 0, "lower score");
    }

    #[test]
    fn test_insert_score_unordered() {
        let mut lb: Leaderboard = Leaderboard {
            season_id: 1,
            positions: LeaderboardTrait::MAX_POSITIONS,
            duelist_ids: 0,
            scores: 0,
        };
        assert_eq!(lb.insert_score(0x400000, 0x00cc), 1, "0x4000");
        assert_eq!(lb.insert_score(0x500000, 0x00bb), 2, "0x5000");
        assert_eq!(lb.insert_score(0xa00000, 0x0066), 3, "0xa000");
        assert_eq!(lb.insert_score(0x123456, 0x0000), 0, "zero value not inserted");
        assert_eq!(lb.insert_score(0x200000, 0x00ee), 1, "0x2000");
        assert_eq!(lb.insert_score(0x100000, 0x00ff), 1, "0x1000");
        assert_eq!(lb.insert_score(0x900000, 0x0077), 5, "0x9000");
        assert_eq!(lb.insert_score(0x300000, 0x00dd), 3, "0x3000");
        assert_eq!(lb.insert_score(0x600000, 0x00aa), 6, "0x6000");
        assert_eq!(lb.insert_score(0x700000, 0x0099), 7, "0x7000");
        assert_eq!(lb.insert_score(0x800000, 0x0088), 8, "0x8000");
        assert_eq!(lb.insert_score(0x123456, 0x0001), 0, "not qualified");
        assert_eq!(lb.duelist_ids, IDS, "duelist_ids");
        assert_eq!(lb.scores, SCORES, "scores");
    }

    #[test]
    fn test_replace_value() {
        let result: felt252 = LeaderboardTrait::_replace_value_at_position(0x0, 0xffffff, 1, 5);
        assert_eq!(result, 0xffffff, "0x0_at_1");
        let result: felt252 = LeaderboardTrait::_replace_value_at_position(0x0, 0xffffff, 5, 5);
        assert_eq!(result, 0xffffff000000000000000000000000, "0x0_at_5");
        let result: felt252 = LeaderboardTrait::_replace_value_at_position(0x111111, 0xffffff, 1, 1);
        assert_eq!(result, 0xffffff, "0x111111_at_1");
        let result: felt252 = LeaderboardTrait::_replace_value_at_position(0x111111222222, 0xffffff, 1, 2);
        assert_eq!(result, 0x111111ffffff, "0x111111222222_at_1");
        let result: felt252 = LeaderboardTrait::_replace_value_at_position(0x111111222222, 0xffffff, 2, 2);
        assert_eq!(result, 0xffffff222222, "0x111111222222_at_2");
        let result: felt252 = LeaderboardTrait::_replace_value_at_position(0x111111222222333333444444555555666666777777888888999999aaaaaa, 0xffffff, 1, 10);
        assert_eq!(result, 0x111111222222333333444444555555666666777777888888999999ffffff, "0x11111122222333333..._at_1");
        let result: felt252 = LeaderboardTrait::_replace_value_at_position(0x111111222222333333444444555555666666777777888888999999aaaaaa, 0xffffff, 3, 10);
        assert_eq!(result, 0x111111222222333333444444555555666666777777ffffff999999aaaaaa, "0x11111122222333333..._at_3");
        let result: felt252 = LeaderboardTrait::_replace_value_at_position(0x111111222222333333444444555555666666777777888888999999aaaaaa, 0xffffff, 10, 10);
        assert_eq!(result, 0xffffff222222333333444444555555666666777777888888999999aaaaaa, "0x11111122222333333..._at_10");
    }

    #[test]
    fn test_insert_new_value() {
        let result: felt252 = LeaderboardTrait::_insert_value_at_position(0x0, 0xffffff, 1, 5);
        assert_eq!(result, 0xffffff, "at_1");
        let result: felt252 = LeaderboardTrait::_insert_value_at_position(0x111111, 0xffffff, 1, 1);
        assert_eq!(result, 0xffffff, "at_1/2_(1)");
        let result: felt252 = LeaderboardTrait::_insert_value_at_position(0x111111, 0xffffff, 1, 5);
        assert_eq!(result, 0x111111ffffff, "at_1/2_(5)");
        let result: felt252 = LeaderboardTrait::_insert_value_at_position(0x111111, 0xffffff, 2, 5);
        assert_eq!(result, 0xffffff111111, "at_2/2_(5)");
        let result: felt252 = LeaderboardTrait::_insert_value_at_position(0x111111222222, 0xffffff, 1, 2);
        assert_eq!(result, 0x222222ffffff, "at_1/3_(2)");
        let result: felt252 = LeaderboardTrait::_insert_value_at_position(0x111111222222, 0xffffff, 1, 5);
        assert_eq!(result, 0x111111222222ffffff, "at_1/3_(5)");
        let result: felt252 = LeaderboardTrait::_insert_value_at_position(0x111111222222, 0xffffff, 2, 5);
        assert_eq!(result, 0x111111ffffff222222, "at_2/3_(5)");
        let result: felt252 = LeaderboardTrait::_insert_value_at_position(0x111111222222, 0xffffff, 3, 5);
        assert_eq!(result, 0xffffff111111222222, "at_3/3_(5)");
        let result: felt252 = LeaderboardTrait::_insert_value_at_position(0x111111222222333333444444555555, 0xffffff, 1, 5);
        assert_eq!(result, 0x222222333333444444555555ffffff, "at_1/5_(5)");
        let result: felt252 = LeaderboardTrait::_insert_value_at_position(0x111111222222333333444444555555, 0xffffff, 2, 5);
        assert_eq!(result, 0x222222333333444444ffffff555555, "at_2/5_(5)");
        let result: felt252 = LeaderboardTrait::_insert_value_at_position(0x111111222222333333444444555555, 0xffffff, 3, 5);
        assert_eq!(result, 0x222222333333ffffff444444555555, "at_3/5_(5)");
        let result: felt252 = LeaderboardTrait::_insert_value_at_position(0x111111222222333333444444555555, 0xffffff, 4, 5);
        assert_eq!(result, 0x222222ffffff333333444444555555, "at_4/5_(5)");
        let result: felt252 = LeaderboardTrait::_insert_value_at_position(0x111111222222333333444444555555, 0xffffff, 5, 5);
        assert_eq!(result, 0xffffff222222333333444444555555, "at_5/5_(5)");
        let result: felt252 = LeaderboardTrait::_insert_value_at_position(0x111111222222333333444444555555666666777777888888999999aaaaaa, 0xffffff, 1, 10);
        assert_eq!(result, 0x222222333333444444555555666666777777888888999999aaaaaaffffff, "0x11112223333..._at_1");
        let result: felt252 = LeaderboardTrait::_insert_value_at_position(0x111111222222333333444444555555666666777777888888999999aaaaaa, 0xffffff, 2, 10);
        assert_eq!(result, 0x222222333333444444555555666666777777888888999999ffffffaaaaaa, "0x11112223333..._at_2");
        let result: felt252 = LeaderboardTrait::_insert_value_at_position(0x111111222222333333444444555555666666777777888888999999aaaaaa, 0xffffff, 9, 10);
        assert_eq!(result, 0x222222ffffff333333444444555555666666777777888888999999aaaaaa, "0x11112223333..._at_9");
        let result: felt252 = LeaderboardTrait::_insert_value_at_position(0x111111222222333333444444555555666666777777888888999999aaaaaa, 0xffffff, 10, 10);
        assert_eq!(result, 0xffffff222222333333444444555555666666777777888888999999aaaaaa, "0x11112223333..._at_10");
    }

    #[test]
    fn test_move_value() {
        let result: felt252 = LeaderboardTrait::_move_value_to_position(0x111111222222, 0xffffff, 2, 1, 2);
        assert_eq!(result, 0x222222ffffff, "0x111111222222_to_1");
        let result: felt252 = LeaderboardTrait::_move_value_to_position(0x111111222222333333, 0xffffff, 2, 1, 3);
        assert_eq!(result, 0x111111333333ffffff, "0x111111222222333333_to_2_1");
        let result: felt252 = LeaderboardTrait::_move_value_to_position(0x111111222222333333, 0xffffff, 3, 1, 3);
        assert_eq!(result, 0x222222333333ffffff, "0x111111222222333333_to_3_1");
        let result: felt252 = LeaderboardTrait::_move_value_to_position(0x111111222222333333, 0xffffff, 3, 2, 3);
        assert_eq!(result, 0x222222ffffff333333, "0x111111222222333333_to_3_2");
        let result: felt252 = LeaderboardTrait::_move_value_to_position(0x111111222222333333444444555555666666777777888888999999aaaaaa, 0xffffff, 2, 1, 10);
        assert_eq!(result, 0x111111222222333333444444555555666666777777888888aaaaaaffffff, "0x11111122222333333..._at_2_1");
        let result: felt252 = LeaderboardTrait::_move_value_to_position(0x111111222222333333444444555555666666777777888888999999aaaaaa, 0xffffff, 5, 1, 10);
        assert_eq!(result, 0x111111222222333333444444555555777777888888999999aaaaaaffffff, "0x11111122222333333..._at_5_1");
        let result: felt252 = LeaderboardTrait::_move_value_to_position(0x111111222222333333444444555555666666777777888888999999aaaaaa, 0xffffff, 10, 1, 10);
        assert_eq!(result, 0x222222333333444444555555666666777777888888999999aaaaaaffffff, "0x11111122222333333..._at_10_1");
        let result: felt252 = LeaderboardTrait::_move_value_to_position(0x111111222222333333444444555555666666777777888888999999aaaaaa, 0xffffff, 3, 2, 10);
        assert_eq!(result, 0x111111222222333333444444555555666666777777999999ffffffaaaaaa, "0x11111122222333333..._at_3_2");
        let result: felt252 = LeaderboardTrait::_move_value_to_position(0x111111222222333333444444555555666666777777888888999999aaaaaa, 0xffffff, 5, 2, 10);
        assert_eq!(result, 0x111111222222333333444444555555777777888888999999ffffffaaaaaa, "0x11111122222333333..._at_5_2");
        let result: felt252 = LeaderboardTrait::_move_value_to_position(0x111111222222333333444444555555666666777777888888999999aaaaaa, 0xffffff, 10, 2, 10);
        assert_eq!(result, 0x222222333333444444555555666666777777888888999999ffffffaaaaaa, "0x11111122222333333..._at_10_2");
        let result: felt252 = LeaderboardTrait::_move_value_to_position(0x111111222222333333444444555555666666777777888888999999aaaaaa, 0xffffff, 10, 9, 10);
        assert_eq!(result, 0x222222ffffff333333444444555555666666777777888888999999aaaaaa, "0x11111122222333333..._at_10_9");
    }

    #[test]
    fn test_remove_score() {
        let mut count: usize = 10;
        let mut lb: Leaderboard = Leaderboard {
            season_id: 1,
            positions: 10,
            duelist_ids: IDS,
            scores: SCORES,
        };
        let all_positions: Span<LeaderboardPosition> = lb.get_all_positions();
        assert_eq!(all_positions.len(), lb.positions.into(), "all_positions.len()");
        assert_eq!(all_positions.len(), count, "all_positions.len() == 10");
        let id_1: u128 = (*all_positions.at(0)).duelist_id;
        let id_2: u128 = (*all_positions.at(1)).duelist_id;
        let id_3: u128 = (*all_positions.at(2)).duelist_id;
        let id_4: u128 = (*all_positions.at(3)).duelist_id;
        let id_5: u128 = (*all_positions.at(4)).duelist_id;
        let id_6: u128 = (*all_positions.at(5)).duelist_id;
        let id_7: u128 = (*all_positions.at(6)).duelist_id;
        let id_8: u128 = (*all_positions.at(7)).duelist_id;
        let id_9: u128 = (*all_positions.at(8)).duelist_id;
        let id_10: u128 = (*all_positions.at(9)).duelist_id;
        _test_order(lb, [id_1, id_2, id_3, id_4, id_5, id_6, id_7, id_8, id_9, id_10].span(), "full");
        // remove from middle
        assert!(lb.remove_duelist_score(id_5), "remove_id_5");
        _test_order(lb, [id_1, id_2, id_3, id_4, id_6, id_7, id_8, id_9, id_10].span(), "id_5");
        assert!(lb.remove_duelist_score(id_2), "remove_id_2");
        _test_order(lb, [id_1, id_3, id_4, id_6, id_7, id_8, id_9, id_10].span(), "id_2");
        assert!(lb.remove_duelist_score(id_9), "remove_id_9");
        _test_order(lb, [id_1, id_3, id_4, id_6, id_7, id_8, id_10].span(), "id_9");
        // remove from start
        assert!(lb.remove_duelist_score(id_1), "remove_id_1");
        _test_order(lb, [id_3, id_4, id_6, id_7, id_8, id_10].span(), "id_1");
        // remove from end
        assert!(lb.remove_duelist_score(id_10), "remove_id_10");
        _test_order(lb, [id_3, id_4, id_6, id_7, id_8].span(), "id_10");
        // remove inexistent
        assert!(!lb.remove_duelist_score(0x123456), "inexistent");
        _test_order(lb, [id_3, id_4, id_6, id_7, id_8].span(), "inexistent");
        // remove remaining
        assert!(lb.remove_duelist_score(id_3), "remove_id_3");
        _test_order(lb, [id_4, id_6, id_7, id_8].span(), "id_3");
        assert!(lb.remove_duelist_score(id_8), "remove_id_8");
        _test_order(lb, [id_4, id_6, id_7].span(), "id_8");
        assert!(lb.remove_duelist_score(id_6), "remove_id_6");
        _test_order(lb, [id_4, id_7].span(), "id_6");
        assert!(lb.remove_duelist_score(id_4), "remove_id_4");
        _test_order(lb, [id_7].span(), "id_4");
        assert!(lb.remove_duelist_score(id_7), "remove_id_7");
        _test_order(lb, [].span(), "id_7");
    }

    fn _test_order(lb: Leaderboard, duelist_ids: Span<u128>, prefix: ByteArray) {
        let positions: Span<LeaderboardPosition> = lb.get_all_positions();
        assert_eq!(positions.len(), duelist_ids.len(), "[{}] bad len", prefix);
        let mut p: usize = 1;
        while (p <= duelist_ids.len()) {
            let duelist_id: u128 = *duelist_ids.at(p-1);
            let pos: LeaderboardPosition = *positions.at(p-1);
            assert_eq!(pos.duelist_id, duelist_id, "[{}] duelist_id[{}]: {}", prefix, p, duelist_id);
            p += 1;
        };
    }
}
