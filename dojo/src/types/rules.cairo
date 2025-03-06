use starknet::{ContractAddress};
use pistols::models::pool::{PoolType};
use pistols::utils::misc::{ContractAddressDefault};
use pistols::utils::arrays::{SpanDefault};

#[derive(Serde, Copy, Drop, PartialEq, Introspect)]
pub enum RulesType {
    Undefined,  // 0
    Academia,   // 1
    Season,     // 2
}

#[derive(Copy, Drop, Serde, Introspect, Default)]
pub struct FeeDistribution {
    pub underware_percent: u8,
    pub creator_percent: u8,
    pub creator_address: ContractAddress,
    pub pool_percent: u8,
    pub pool_id: PoolType,
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

#[derive(Copy, Drop, Serde, Introspect, Default)]
pub struct SeasonDistribution {
    pub percents: Span<u8>,
}


//---------------------------
// Traits
//
use core::num::traits::Zero;
use pistols::types::timestamp::{TIMESTAMP};
use pistols::types::constants::{CONST, FAME};
use pistols::utils::misc::{ZERO};

#[generate_trait]
pub impl RulesTypeImpl of RulesTypeTrait {
    #[inline(always)]
    fn exists(self: @RulesType) -> bool {
        (*self != RulesType::Undefined)
    }
    fn get_reply_timeout(self: @RulesType) -> u64 {
        (match self {
            _ => TIMESTAMP::ONE_DAY,
        })
    }
    //
    // Duel rewards
    //
    fn get_rewards_distribution(self: @RulesType, table_id: felt252, tournament_id: u128) -> @FeeDistribution {
        let mut result: FeeDistribution = match self {
            RulesType::Season => FeeDistribution {
                underware_percent: 30,
                creator_percent: 30,
                creator_address: ZERO(), // TODO: find from tournament_id
                pool_percent: 40,
                pool_id: PoolType::Season(table_id),
            },
            _ => Default::default()
        };
        // not a tournament, creator is underware
        if (result.creator_percent != 0 && result.creator_address.is_zero()) {
            result.underware_percent += result.creator_percent;
            result.creator_percent = 0;
        }
        (@result)
    }
    // end game calculations
    fn calc_rewards(self: @RulesType, fame_balance: u128, lives_staked: u8, is_winner: bool) -> RewardValues {
        (match self {
            RulesType::Season => {
                let mut result: RewardValues = Default::default();
                let one_life: u128 = FAME::ONE_LIFE.low;
                if (fame_balance == 0) {
                    result.survived = false;
                } else if (is_winner) {
                    result.survived = true;
                    let k_fame: u128 = 1;
                    result.fame_gained = (one_life / (((fame_balance / one_life) + 1) / k_fame));
                    let k_fools: u128 = 10;
                    result.fools_gained = (k_fools * ((one_life / 2) / result.fame_gained)) * CONST::ETH_TO_WEI.low;
                    // apply staked lives
                    result.fame_gained *= lives_staked.into();
                    result.fools_gained *= lives_staked.into();
                    // calc score
                    result.points_scored = 100;
                } else {
                    result.fame_lost = one_life * lives_staked.into();
                    result.points_scored = 10;
                }
                (result)
            },
            _ => Default::default()
        })
    }
    //
    // Season rewards
    //
    fn get_season_distribution(self: @RulesType, recipient_count: usize) -> @SeasonDistribution {
        let mut percents: Array<u8> = array![];
        if (recipient_count > 0) {
            match self {
                RulesType::Season => {
                    percents.append(40); // (1) :0
                    percents.append(25); // (2) :1
                    percents.append(15); // (3) :2
                    percents.append(10); // (4) :3
                    percents.append(5);  // (5) :4
                    percents.append(5);  // (6) :5
                },
                _ => {}
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
        (@SeasonDistribution{
            percents: percents.span(),
        })
    }
}


#[generate_trait]
pub impl FeeDistributionImpl of FeeDistributionTrait {
    #[inline(always)]
    fn is_payable(self: @FeeDistribution) -> bool {
        (*self.underware_percent != 0 || *self.creator_percent != 0 || *self.pool_percent != 0)
    }
}



//---------------------------
// Converters
//
impl RulesTypeIntoByteArray of core::traits::Into<RulesType, ByteArray> {
    fn into(self: RulesType) -> ByteArray {
        match self {
            RulesType::Undefined    => "RulesType::Undefined",
            RulesType::Academia     => "RulesType::Academia",
            RulesType::Season       => "RulesType::Season",
        }
    }
}
// for println! format! (core::fmt::Display<>) assert! (core::fmt::Debug<>)
pub impl RulesTypeDebug of core::fmt::Debug<RulesType> {
    fn fmt(self: @RulesType, ref f: core::fmt::Formatter) -> Result<(), core::fmt::Error> {
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
        RulesType, RulesTypeTrait,
        SeasonDistribution, RewardValues,
    };
    use pistols::utils::misc::{WEI};

    #[test]
    fn test_season_distribution() {
        let mut recipient_count: usize = 12;
        loop {
            let distribution: @SeasonDistribution = RulesType::Season.get_season_distribution(recipient_count);
            assert_le!((*distribution.percents).len(), recipient_count, "win[{}] distribution.percents.len()", recipient_count);
// println!("[{}] > [{}]", recipient_count, (*distribution.percents).len());
            if (recipient_count == 0) {
                break;
            }
            // sum must be 100
            let mut sum: u8 = 0;
            let mut i: usize  = 0;
            while (i < (*distribution.percents).len()) {
                sum += *distribution.percents[i];
                i += 1;
            };
            assert_eq!(sum, 100, "win[{}] sum", recipient_count);
            recipient_count -= 1;
        };
    }

    #[test]
    fn test_calc_rewards() {
        let winner_1_1: RewardValues = RulesType::Season.calc_rewards(WEI(3_000).low, 1, true);
        let winner_2_1: RewardValues = RulesType::Season.calc_rewards(WEI(5_000).low, 1, true);
        let winner_1_2: RewardValues = RulesType::Season.calc_rewards(WEI(3_000).low, 2, true);
        let winner_2_2: RewardValues = RulesType::Season.calc_rewards(WEI(5_000).low, 2, true);
        let loser_1_1: RewardValues = RulesType::Season.calc_rewards(WEI(3_000).low, 1, false);
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
}
