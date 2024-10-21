
//------------------------------------------------------
// libs::utils tests
//
#[cfg(test)]
mod tests {
    use debug::PrintTrait;
    use core::traits::{Into, TryInto};
    use starknet::{ContractAddress};

    use pistols::libs::utils;
    use pistols::models::challenge::{Round};
    use pistols::models::duelist::{Duelist, Score, ScoreTrait};
    use pistols::types::challenge_state::{ChallengeState, ChallengeStateTrait};
    use pistols::types::round_state::{RoundState, RoundStateTrait};
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
    fn test_update_score_honour() {
        let mut score: Score = Default::default();
        score.total_duels = 1;
        utils::update_score_honour(ref score, 100);
        assert(score.is_lord(), 'is_lord()');
    }

    #[test]
    fn test_honour_history() {
        let mut score: Score = Default::default();
        let mut sum: u8 = 0;
        let mut n: u8 = 1;
        loop {
            if (n > 8) { break; }
            score.total_duels += 1;
            utils::update_score_honour(ref score, n);
            sum += n;
            assert(score.honour == (sum / n), ShortString::concat('sum_8___', n.into()));
            n += 1;
        };
        assert(score.honour_history == 0x0807060504030201, '0x0807060504030201');
        // loop history
        loop {
            if (n > 16) { break; }
            score.total_duels += 1;
            utils::update_score_honour(ref score, n);
            sum -= n - 8;
            sum += n;
            assert(score.honour == (sum / 8), ShortString::concat('sum_16___', n.into()));
            n += 1;
        };
        assert(score.honour_history == 0x100f0e0d0c0b0a09, '0x100f0e0d0c0b0a09');
        // new loop
        score.total_duels += 1;
        utils::update_score_honour(ref score, n);
        assert(score.honour_history == 0x100f0e0d0c0b0a11, '0x100f0e0d0c0b0a11');
    }

}
