
//------------------------------------------------------
// libs::utils tests
//
#[cfg(test)]
mod tests {
    use debug::PrintTrait;
    use core::traits::{Into, TryInto};
    use starknet::{ContractAddress};

    use pistols::libs::utils;
    use pistols::models::challenge::{Round, Shot};
    use pistols::models::duelist::{Duelist, Score, ScoreTrait};
    use pistols::models::init::{init};
    use pistols::types::challenge::{ChallengeState, ChallengeStateTrait};
    use pistols::types::round::{RoundState, RoundStateTrait};
    use pistols::types::action::{ACTION};
    use pistols::utils::short_string::{ShortString};

    #[test]
    fn test_pact_pair() {
        let a: u128 = 0xb5e186ef2e4ab2762367cd07c8f892a1;
        let b: u128 = 0x6b86e40118f29ebe393a75469b4d926c;
        let p_a = utils::make_pact_pair(a, b);
        let p_b = utils::make_pact_pair(b, a);
        assert(p_a == p_b, 'test_pact_pair');
    }

    #[test]
    fn test_check_dice_average() {
        // lower limit
        let mut counter: u8 = 0;
        let mut n: felt252 = 0;
        loop {
            if (n == 100) { break; }
            let seed: felt252 = 'seed_1' + n;
            if (utils::check_dice(seed, 'salt_1', 100, 25)) {
                counter += 1;
            }
            n += 1;
        };
        assert(counter > 10 && counter < 40, 'dices_25');
        // higher limit
        let mut counter: u8 = 0;
        let mut n: felt252 = 0;
        loop {
            if (n == 100) { break; }
            let seed: felt252 = 'seed_2' + n;
            if (utils::check_dice(seed, 'salt_2', 100, 75)) {
                counter += 1;
            }
            n += 1;
        };
        assert(counter > 60 && counter < 90, 'dices_75');
    }

    #[test]
    fn test_check_dice_edge() {
        let mut n: felt252 = 0;
        loop {
            if (n == 100) { break; }
            let seed: felt252 = 'seed' + n;
            let bottom: bool = utils::check_dice(seed, 'salt', 10, 0);
            assert(bottom == false, 'bottom');
            let upper: bool = utils::check_dice(seed, 'salt', 10, 10);
            assert(upper == true, 'bottom');
            n += 1;
        };
    }

    #[test]
    fn test_update_score_honour() {
        let mut score = init::Score();
        score.total_duels = 1;
        utils::update_score_honour(ref score, 100, true);
        assert(score.level_lord == 100, 'honour_100_lord');
        assert(score.level_villain == 0, 'honour_100_vill');
        assert(score.level_trickster == 0, 'honour_100_trick');
        assert(score.is_lord(), 'is_lord()');
        // just checks sync with calc_level_lord
        let value: u8 = utils::calc_level_lord(100);
       assert(score.level_lord == value, '!= calc');
    }

    #[test]
    fn test_honour_history() {
        let mut score = init::Score();
        let mut sum: u8 = 0;
        let mut n: u8 = 1;
        loop {
            if (n > 8) { break; }
            score.total_duels += 1;
            utils::update_score_honour(ref score, n, true);
            sum += n;
            assert(score.honour == (sum / n), ShortString::concat('sum_8___', n.into()));
            n += 1;
        };
        assert(score.honour_history == 0x0807060504030201, '0x0807060504030201');
        // loop history
        loop {
            if (n > 16) { break; }
            score.total_duels += 1;
            utils::update_score_honour(ref score, n, true);
            sum -= n - 8;
            sum += n;
            assert(score.honour == (sum / 8), ShortString::concat('sum_16___', n.into()));
            n += 1;
        };
        assert(score.honour_history == 0x100f0e0d0c0b0a09, '0x100f0e0d0c0b0a09');
        // new loop
        score.total_duels += 1;
        utils::update_score_honour(ref score, n, true);
        assert(score.honour_history == 0x100f0e0d0c0b0a11, '0x100f0e0d0c0b0a11');
    }

    #[test]
    fn test_average_trickster() {
        assert(utils::_average_trickster(100, 0) == 50, '100, 0');
        assert(utils::_average_trickster(100, 50) == 75, '100, 50');
        assert(utils::_average_trickster(0, 50) == 0, '0, 50');
    }

    #[test]
    fn test_apply_chance_bonus_penalty_average_trickster() {
        // fn _apply_chance_bonus_penalty(chance: u8, bonus: u8, penalty: u8) -> u8;
        assert(utils::_apply_chance_bonus_penalty(50, 10, 0) == 60, 'bonus');
        assert(utils::_apply_chance_bonus_penalty(50, 0, 10) == 40, 'penalty');
        assert(utils::_apply_chance_bonus_penalty(50, 20, 10) == 60, '+bonus-penalty');
        assert(utils::_apply_chance_bonus_penalty(50, 10, 20) == 40, '-bonus+penalty');
        // no change
        assert(utils::_apply_chance_bonus_penalty(100, 10, 10) == 100, 'no_change_100');
        assert(utils::_apply_chance_bonus_penalty(50, 10, 10) == 50, 'no_change_50');
        assert(utils::_apply_chance_bonus_penalty(0, 10, 10) == 0, 'no_change_0');
        // clamp up
        assert(utils::_apply_chance_bonus_penalty(90, 20, 0) == 100, 'clamp_up_0');
        assert(utils::_apply_chance_bonus_penalty(100, 10, 0) == 100, 'clamp_up_1');
        assert(utils::_apply_chance_bonus_penalty(100, 20, 10) == 100, 'clamp_up_2');
        assert(utils::_apply_chance_bonus_penalty(50, 100, 0) == 100, 'clamp_up_3');
        assert(utils::_apply_chance_bonus_penalty(50, 100, 10) == 100, 'clamp_up_4');
        // clamp down
        assert(utils::_apply_chance_bonus_penalty(50, 0, 30) == 25, 'clamp_down_1');
        assert(utils::_apply_chance_bonus_penalty(50, 0, 100) == 25, 'clamp_down_2');
        assert(utils::_apply_chance_bonus_penalty(50, 50, 100) == 25, 'clamp_down_3');
    }

    #[test]
    fn test_calc_penalty() {
        // fn _calc_penalty(health: u8, penalty_per_damage: u8) -> u8;
        assert(utils::_calc_penalty(3, 10) == 0, 'h_3');
        assert(utils::_calc_penalty(2, 10) == 10, 'h_2');
        assert(utils::_calc_penalty(1, 10) == 20, 'h_3');
        assert(utils::_calc_penalty(0, 10) == 30, 'h_1');
    }
}
