use starknet::{ContractAddress};
use pistols::models::pool::{PoolType};
use pistols::utils::misc::{ContractAddressDefault};
use pistols::utils::arrays::{SpanDefault};

#[derive(Serde, Copy, Drop, PartialEq, Introspect)]
pub enum Rules {
    Undefined,      // 0
    Season,         // 1
    Unranked,       // 2
}

#[derive(Copy, Drop, Serde, Introspect, Default)]
pub struct PoolDistribution {
    pub underware_percent: u8,
    pub creator_percent: u8,
    pub creator_address: ContractAddress,
    pub pool_percent: u8,
    pub pool_id: PoolType,
}

#[derive(Copy, Drop, Serde, Introspect, Default)]
pub struct RewardDistribution {
    pub percents: Span<u8>,
}

#[derive(Copy, Drop, Serde, Introspect, Default)]
pub struct RewardValues {
    pub fame_lost: u128,
    pub fame_gained: u128,
    pub fools_gained: u128,
    pub points_scored: u16,
    pub position: u8,        // position on the leaderboard
    // after burning fame...
    pub fame_burned: u128,
    pub lords_unlocked: u128,
    pub survived: bool,
}

#[derive(Copy, Drop, Serde, Default)]
pub struct DuelBonus {
    pub duelist_a: DuelistBonus,
    pub duelist_b: DuelistBonus,
}
#[derive(Copy, Drop, Serde, IntrospectPacked, Default)]
pub struct DuelistBonus {
    pub kill_pace: u8,
    pub hit: bool,
    pub dodge: bool,
}


//---------------------------
// Traits
//
use core::num::traits::Zero;
use pistols::models::ring::{RingType};
use pistols::types::timestamp::{TIMESTAMP};
use pistols::utils::math::{MathU128};
use pistols::types::constants::{CONST, FAME::{ONE_LIFE}};
use pistols::utils::misc::{ZERO};

#[generate_trait]
pub impl RulesImpl of RulesTrait {
    fn get_reply_timeout(self: @Rules) -> u64 {
        (match self {
            _ => TIMESTAMP::ONE_DAY,
        })
    }
    //
    // Duel rewards
    //
    fn get_rewards_distribution(self: @Rules, season_id: u32, tournament_id: u64) -> @PoolDistribution {
        let mut result: PoolDistribution = match self {
            Rules::Undefined => Default::default(),
            Rules::Season => PoolDistribution {
                underware_percent: 30,
                creator_percent: 30,
                creator_address: ZERO(), // TODO: find from tournament_id
                pool_percent: 40,
                pool_id: PoolType::Season(season_id),
            },
            Rules::Unranked => PoolDistribution {
                underware_percent: 100,
                creator_percent: 0,
                creator_address: ZERO(),
                pool_percent: 0,
                pool_id: PoolType::Undefined,
            },
        };
        // not a tournament, creator is underware
        if (result.creator_percent != 0 && result.creator_address.is_zero()) {
            result.underware_percent += result.creator_percent;
            result.creator_percent = 0;
        }
        (@result)
    }
    // end game calculations
    fn calc_rewards(self: @Rules,
        fame_balance: u128,
        lives_staked: u8,
        is_winner: bool,
        signet_ring: RingType,
        bonus: @DuelistBonus,
    ) -> RewardValues {
        let mut result: RewardValues = Default::default();
        match self {
            Rules::Undefined => {},
            Rules::Unranked => {
                if (is_winner) {
                    result.survived = true;
                } else {
                    result.fame_lost = ONE_LIFE * lives_staked.into();
                }
            },
            Rules::Season => {
                if (is_winner) {
                    result.survived = true;
                    let k_fame: u128 = 1;
                    result.fame_gained = (ONE_LIFE / (((fame_balance / ONE_LIFE) + 1) / k_fame));
                    let k_fools: u128 = 10;
                    result.fools_gained = (k_fools * ((ONE_LIFE / 2) / result.fame_gained)) * CONST::ETH_TO_WEI.low;
                    // apply staked lives
                    result.fame_gained *= lives_staked.into();
                    result.fools_gained *= lives_staked.into();
                    // calc score
                    result.points_scored = 100 + ((*bonus.kill_pace).into() * 2);
                    // ring bonus
                    let ring_bonus: u8 = (match signet_ring {
                        RingType::GoldSignetRing => {40},
                        RingType::SilverSignetRing => {20},
                        RingType::LeadSignetRing => {10},
                        RingType::Unknown => {0},
                    });
                    if (ring_bonus.is_non_zero()) {
                        result.fools_gained += MathU128::percentage(result.fools_gained, ring_bonus);
                    }
                } else {
                    result.fame_lost = ONE_LIFE * lives_staked.into();
                    result.points_scored = 10;
                }
                // apply bonus
                if (*bonus.dodge) { result.points_scored += 20; }
                if (*bonus.kill_pace > 0) { result.points_scored += 10; }
                else if (*bonus.hit) { result.points_scored += 5; }
                //--------------------------------
                // TEMP: zero points when dodge
                // >> enable: test_calc_rewards_bonus()
                if (is_winner && *bonus.dodge) {
                    result.points_scored = 0;
                }
                //--------------------------------
            },
        };
        (result)
    }
    //
    // Season rewards
    //
    fn get_season_distribution(self: @Rules, recipient_count: usize) -> @RewardDistribution {
        let mut percents: Array<u8> = array![];
        if (recipient_count > 0) {
            match self {
                Rules::Season => {
                    percents.append(25); // 1
                    percents.append(20); // 2
                    percents.append(15); // 3
                    percents.append(10); // 4
                    percents.append(8);  // 5
                    percents.append(6);  // 6
                    percents.append(6);  // 7
                    percents.append(4);  // 8
                    percents.append(4);  // 9
                    percents.append(2);  // 10
                },
                Rules::Unranked |
                Rules::Undefined => {}
            };
            // distribute leftovers to winner
            if (percents.len() > recipient_count) {
                // sum winner + leftovers
                let mut spoils: u8 = *percents[0];
                let mut i: usize = percents.len() - 1;
                while (i >=  recipient_count) {
                    spoils += *percents[i];
                    i -= 1;
                };
                // make new array with spoils to winner
                let mut new_percents: Array<u8> = array![spoils];
                let mut i: usize = 1;
                while (i < recipient_count) {
                    new_percents.append(*percents[i]);
                    i += 1;
                };
                percents = new_percents;
            }
        }
        (@RewardDistribution{
            percents: percents.span(),
        })
    }
}


#[generate_trait]
pub impl PoolDistributionImpl of PoolDistributionTrait {
    #[inline(always)]
    fn is_payable(self: @PoolDistribution) -> bool {
        (
            (*self.underware_percent).is_non_zero() ||
            (*self.creator_percent).is_non_zero() ||
            (*self.pool_percent).is_non_zero()
        )
    }
}



//---------------------------
// Converters
//
impl RulesIntoByteArray of core::traits::Into<Rules, ByteArray> {
    fn into(self: Rules) -> ByteArray {
        match self {
            Rules::Undefined    => "Rules::Undefined",
            Rules::Season       => "Rules::Season",
            Rules::Unranked     => "Rules::Unranked",
        }
    }
}
// for println! format! (core::fmt::Display<>) assert! (core::fmt::Debug<>)
pub impl RulesDisplay of core::fmt::Display<Rules> {
    fn fmt(self: @Rules, ref f: core::fmt::Formatter) -> Result<(), core::fmt::Error> {
        let result: ByteArray = (*self).into();
        f.buffer.append(@result);
        Result::Ok(())
    }
}
pub impl RulesDebug of core::fmt::Debug<Rules> {
    fn fmt(self: @Rules, ref f: core::fmt::Formatter) -> Result<(), core::fmt::Error> {
        let result: ByteArray = (*self).into();
        f.buffer.append(@result);
        Result::Ok(())
    }
}



//----------------------------------------
// Unit  tests
//
#[cfg(test)]
mod unit {
    use super::{
        Rules, RulesTrait,
        RewardDistribution, RewardValues,
        DuelistBonus,
        RingType,
    };
    use pistols::models::leaderboard::{LeaderboardTrait};
    use pistols::utils::misc::{WEI};

    fn _test_season_distribution(rules: Rules) {
        let mut recipient_count: usize = 12;
        loop {
            let distribution: @RewardDistribution = rules.get_season_distribution(recipient_count);
            let distribution_count: usize = (*distribution.percents).len();
            assert_le!(distribution_count, LeaderboardTrait::MAX_POSITIONS.into(), "{}: win[{}] distribution.percents.len()", rules, recipient_count);
            assert_le!(distribution_count, recipient_count, "{}: win[{}] distribution.percents.len()", rules, recipient_count);
// println!("[{}] > [{}]", recipient_count, (*distribution.percents).len());
            if (recipient_count == 0 || distribution_count == 0) {
                break;
            }
            // sum must be 100
            let mut sum: u8 = 0;
            let mut i: usize  = 0;
            while (i < distribution_count) {
                sum += *distribution.percents[i];
                i += 1;
            };
            assert_eq!(sum, 100, "{}: win[{}] sum", rules, recipient_count);
            recipient_count -= 1;
        };
    }

    #[test]
    fn test_season_distribution() {
        _test_season_distribution(Rules::Season);
    }

    #[test]
    fn test_calc_rewards() {
        let winner_1_1: RewardValues = Rules::Season.calc_rewards(WEI(3_000).low, 1, true, RingType::Unknown, @Default::default());
        let winner_2_1: RewardValues = Rules::Season.calc_rewards(WEI(5_000).low, 1, true, RingType::Unknown, @Default::default());
        let winner_1_2: RewardValues = Rules::Season.calc_rewards(WEI(3_000).low, 2, true, RingType::Unknown, @Default::default());
        let winner_2_2: RewardValues = Rules::Season.calc_rewards(WEI(5_000).low, 2, true, RingType::Unknown, @Default::default());
        let loser_1_1: RewardValues = Rules::Season.calc_rewards(WEI(3_000).low, 1, false, RingType::Unknown, @Default::default());
        // greater balances win less FAME
        assert_gt!(winner_1_1.fame_gained, winner_2_1.fame_gained, "balance_fame_gained");
        assert_gt!(winner_1_2.fame_gained, winner_2_2.fame_gained, "balance_fame_gained");
        // greater balances win more FOOLS
        assert_lt!(winner_1_1.fools_gained, winner_2_1.fools_gained, "balance_fools_gained");
        assert_lt!(winner_1_2.fools_gained, winner_2_2.fools_gained, "balance_fools_gained");
        // always same points
        assert_eq!(winner_1_1.points_scored, winner_2_1.points_scored, "balance_points_scored");
        assert_eq!(winner_1_2.points_scored, winner_2_2.points_scored, "balance_points_scored");
        assert_eq!(winner_1_2.points_scored, winner_1_1.points_scored, "lives_points_scored_1");
        assert_eq!(winner_2_2.points_scored, winner_2_1.points_scored, "lives_points_scored_2");
        // lost fame always zero
        assert_eq!(winner_1_1.fame_lost, 0, "lives_fame_lost_1");
        assert_eq!(winner_2_1.fame_lost, 0, "lives_fame_lost_2");
        assert_eq!(winner_1_2.fame_lost, 0, "lives_fame_lost_1");
        assert_eq!(winner_2_2.fame_lost, 0, "lives_fame_lost_2");
        // more lives gets everything higher
        assert_gt!(winner_1_2.fame_gained, winner_1_1.fame_gained, "lives_fame_gained_1");
        assert_gt!(winner_1_2.fools_gained, winner_1_1.fools_gained, "lives_fools_gained_1");
        assert_gt!(winner_2_2.fame_gained, winner_2_1.fame_gained, "lives_fame_gained_2");
        assert_gt!(winner_2_2.fools_gained, winner_2_1.fools_gained, "lives_fools_gained_2");
        // losers
        assert_eq!(loser_1_1.fame_gained, 0, "loser_1_1.fame_gained");
        assert_eq!(loser_1_1.fools_gained, 0, "loser_1_1.fools_gained");
        assert_gt!(loser_1_1.fame_lost, 0, "loser_1_1.fame_lost");
        // les points
        assert_gt!(loser_1_1.points_scored, 0, "loser_1_1.points_scored");
        assert_lt!(loser_1_1.points_scored, winner_1_1.points_scored, "loser_1_1.points_scored");
    }

    #[test]
    #[ignore] // dodge points are disabled
    fn test_calc_rewards_bonus() {
        let bonus_paces_1 = DuelistBonus {
            kill_pace: 1,
            hit: false,
            dodge: false,
        };
        let bonus_paces_10 = DuelistBonus {
            kill_pace: 10,
            hit: false,
            dodge: false,
        };
        let bonus_paces_10_dodge = DuelistBonus {
            kill_pace: 10,
            hit: false,
            dodge: true,
        };
        let winner_paces_1: RewardValues = Rules::Season.calc_rewards(WEI(3_000).low, 1, true, RingType::Unknown, @bonus_paces_1);
        let winner_paces_10: RewardValues = Rules::Season.calc_rewards(WEI(3_000).low, 1, true, RingType::Unknown, @bonus_paces_10);
        let winner_paces_10_dodge: RewardValues = Rules::Season.calc_rewards(WEI(3_000).low, 1, true, RingType::Unknown, @bonus_paces_10_dodge);
        // always same points
        assert_lt!(winner_paces_1.points_scored, winner_paces_10.points_scored, "paces_1 < paces_10");
        assert_lt!(winner_paces_10.points_scored, winner_paces_10_dodge.points_scored, "paces_10 < paces_10_dodge");
       // losers bonus
        let bonus_hit = DuelistBonus {
            kill_pace: 0,
            hit: true,
            dodge: false,
        };
        let bonus_dodge = DuelistBonus {
            kill_pace: 0,
            hit: false,
            dodge: true,
        };
        let loser_default: RewardValues = Rules::Season.calc_rewards(WEI(3_000).low, 1, false, RingType::Unknown, @Default::default());
        let loser_hit: RewardValues = Rules::Season.calc_rewards(WEI(3_000).low, 1, false, RingType::Unknown, @bonus_hit);
        let loser_dodge: RewardValues = Rules::Season.calc_rewards(WEI(3_000).low, 1, false, RingType::Unknown, @bonus_dodge);
        assert_lt!(loser_default.points_scored, loser_hit.points_scored, "LOSER: default < hit");
        assert_lt!(loser_hit.points_scored, loser_dodge.points_scored, "LOSER: hit < dodge");
    }
}
