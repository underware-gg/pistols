use starknet::{ContractAddress};
use pistols::models::pool::{PoolType};
use pistols::utils::address::{ContractAddressDefault};
use pistols::utils::arrays::{SpanDefault};

#[derive(Serde, Copy, Drop, PartialEq, Introspect)]
pub enum Rules {
    Undefined,      // 0 - Practice: no FAME, no FOOLS, no SCORE
    Season,         // 1 - Ranked:   FAME+FOOLS+SCORE
    Unranked,       // 2 - Unranked: FAME+FOOLS (no SCORE)
}

#[derive(Copy, Drop, Serde, Introspect, Default)]
pub struct PoolDistribution {
    pub underware_percent: u8,
    pub underware_address: ContractAddress,
    pub realms_percent: u8,
    pub realms_address: ContractAddress,
    pub fees_percent: u8,
    pub fees_address: ContractAddress,
    pub fees_pool_id: PoolType,
    pub pool_percent: u8,
    pub pool_id: PoolType,
}

#[derive(Copy, Drop, Serde, Introspect, Default)]
pub struct RewardDistribution {
    pub percents: Span<u8>,
}

#[derive(Copy, Drop, Serde, Introspect, Default)]
pub struct RewardValues {
    pub fame_lost: u128,        // FAME lost from Duelist
    pub fame_gained: u128,      // FAME gained by Duelist
    pub fools_gained: u128,     // FOOLS gained by Duelist
    pub points_scored: u16,     // points scored by Duelist
    pub position: u8,           // position on the leaderboard by Duelist
    // after burning fame...
    pub fame_burned: u128,      // amount of FAME de-pegged
    pub lords_unlocked: u128,   // amount of lords released from FamePeg
    pub survived: bool,         // true if Duelist survived
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
use pistols::models::config::{Config};
use pistols::models::ring::{RingType, RingTypeTrait};
use pistols::types::constants::{CONST, RULES, FAME::{ONE_LIFE}};
use pistols::libs::store::{Store, StoreTrait};
use pistols::utils::address::{ZERO};

#[generate_trait]
pub impl RulesImpl of RulesTrait {
    //-------------------------------
    // End-duel rewards
    //
    fn calc_rewards(self: @Rules,
        fame_balance: u128,
        lives_staked: u8,
        is_winner: bool,
        signet_ring: RingType,
        bonus: @DuelistBonus,
    ) -> RewardValues {
        let mut result: RewardValues = Default::default();
        //
        // survival flag
        result.survived = is_winner;
        //
        // process FAME+FOOLS
        match self {
            Rules::Season |
            Rules::Unranked => {
                if (is_winner) {
                    // +FAME
                    let k_fame: u128 = 1;
                    result.fame_gained = (ONE_LIFE / (((fame_balance / ONE_LIFE) + 1) / k_fame));
                    // +FOOLS
                    let k_fools: u128 = 10;
                    result.fools_gained = (k_fools * ((ONE_LIFE / 2) / result.fame_gained)) * CONST::ETH_TO_WEI.low;
                    // stake multiplier
                    result.fame_gained *= lives_staked.into();
                    result.fools_gained *= lives_staked.into();
                    // ring bonus
                    signet_ring.apply_ring_bonus(ref result.fools_gained);
                } else {
                    result.fame_lost = ONE_LIFE * lives_staked.into();
                }
            },
            Rules::Undefined => {},
        };
        //
        // process SCORE
        match self {
            Rules::Season => {
                if (is_winner) {
                    result.points_scored = 100 + ((*bonus.kill_pace).into() * 2);
                } else {
                    result.points_scored = 10;
                }
                // apply bonus
                if (*bonus.dodge) { result.points_scored += 20; }
                if (*bonus.kill_pace > 0) { result.points_scored += 10; }
                else if (*bonus.hit) { result.points_scored += 5; }
            },
            Rules::Unranked |
            Rules::Undefined => {},
        };
        (result)
    }
    //
    // Duel distribution of LORDS
    fn get_purchase_distribution(store: @Store) -> @PoolDistribution {
        let config: Config = store.get_config();
        let mut result: PoolDistribution = PoolDistribution {
            underware_percent: RULES::UNDERWARE_PERCENT,
            underware_address: config.treasury_address,
            realms_percent: RULES::REALMS_PERCENT,
            realms_address: config.realms_address,
            fees_percent: RULES::FEES_PERCENT,
            fees_address: ZERO(),
            fees_pool_id: PoolType::Claimable,
            pool_percent: RULES::POOL_PERCENT,
            pool_id: PoolType::Purchases,
        };
        // if no realms address, to underware
        if (result.realms_percent.is_non_zero() && result.realms_address.is_zero()) {
            result.underware_percent += result.realms_percent;
            result.realms_percent = 0;
        }
        // if (result.fees_percent.is_non_zero() && result.fees_address.is_zero() && result.fees_pool_id == PoolType::Undefined) {
        //     result.underware_percent += result.fees_percent;
        //     result.fees_percent = 0;
        // }
        // if (result.underware_percent.is_non_zero() && result.underware_address.is_zero()) {
        //     result.pool_percent += result.underware_percent;
        //     result.underware_percent = 0;
        // }
        (@result)
    }
    //
    // End-season rewards
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
    use super::*;
    use pistols::utils::misc::{WEI};

    #[test]
    fn test_distribution_total() {
        assert_gt!(RULES::UNDERWARE_PERCENT, 0, "underware_percent");
        assert_gt!(RULES::REALMS_PERCENT, 0, "realms_percent");
        assert_gt!(RULES::FEES_PERCENT, 0, "fees_percent");
        assert_gt!(RULES::POOL_PERCENT, 0, "pool_percent");
        assert_eq!(RULES::UNDERWARE_PERCENT + RULES::REALMS_PERCENT + RULES::FEES_PERCENT + RULES::POOL_PERCENT, 100, "total");
    }

    #[test]
    fn test_calc_rewards() {
        let winner_1_1: RewardValues = Rules::Season.calc_rewards(WEI(3_000).low, 1, true, RingType::Unknown, @Default::default());
        let winner_1_2: RewardValues = Rules::Season.calc_rewards(WEI(5_000).low, 1, true, RingType::Unknown, @Default::default());
        let winner_2_1: RewardValues = Rules::Season.calc_rewards(WEI(3_000).low, 2, true, RingType::Unknown, @Default::default());
        let winner_2_2: RewardValues = Rules::Season.calc_rewards(WEI(5_000).low, 2, true, RingType::Unknown, @Default::default());
        let loser_1_1: RewardValues = Rules::Season.calc_rewards(WEI(3_000).low, 1, false, RingType::Unknown, @Default::default());
        // greater balances win less FAME
        assert_gt!(winner_1_1.fame_gained, winner_1_2.fame_gained, "balance_fame_gained");
        assert_gt!(winner_2_1.fame_gained, winner_2_2.fame_gained, "balance_fame_gained");
        // greater balances win more FOOLS
        assert_lt!(winner_1_1.fools_gained, winner_1_2.fools_gained, "balance_fools_gained");
        assert_lt!(winner_2_1.fools_gained, winner_2_2.fools_gained, "balance_fools_gained");
        // always same points
        assert_eq!(winner_1_1.points_scored, winner_1_2.points_scored, "balance_points_scored");
        assert_eq!(winner_2_1.points_scored, winner_2_2.points_scored, "balance_points_scored");
        assert_eq!(winner_2_1.points_scored, winner_1_1.points_scored, "lives_points_scored_1");
        assert_eq!(winner_2_2.points_scored, winner_1_2.points_scored, "lives_points_scored_2");
        // lost fame always zero
        assert_eq!(winner_1_1.fame_lost, 0, "lives_fame_lost_1");
        assert_eq!(winner_1_2.fame_lost, 0, "lives_fame_lost_2");
        assert_eq!(winner_2_1.fame_lost, 0, "lives_fame_lost_1");
        assert_eq!(winner_2_2.fame_lost, 0, "lives_fame_lost_2");
        // more lives gets everything higher
        assert_gt!(winner_2_1.fame_gained, winner_1_1.fame_gained, "lives_fame_gained_1");
        assert_gt!(winner_2_1.fools_gained, winner_1_1.fools_gained, "lives_fools_gained_1");
        assert_gt!(winner_2_2.fame_gained, winner_1_2.fame_gained, "lives_fame_gained_2");
        assert_gt!(winner_2_2.fools_gained, winner_1_2.fools_gained, "lives_fools_gained_2");
        // losers
        assert_eq!(loser_1_1.fame_gained, 0, "loser_1_1.fame_gained");
        assert_eq!(loser_1_1.fools_gained, 0, "loser_1_1.fools_gained");
        assert_gt!(loser_1_1.fame_lost, 0, "loser_1_1.fame_lost");
        // les points
        assert_gt!(loser_1_1.points_scored, 0, "loser_1_1.points_scored");
        assert_lt!(loser_1_1.points_scored, winner_1_1.points_scored, "loser_1_1.points_scored");
    }

    #[test]
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

    #[test]
    fn test_calc_rewards_ring_bonus() {
        // winners
        let winner_no_ring: RewardValues = Rules::Season.calc_rewards(WEI(3_000).low, 1, true, RingType::Unknown, @Default::default());
        let winner_gold_ring: RewardValues = Rules::Season.calc_rewards(WEI(3_000).low, 1, true, RingType::GoldSignetRing, @Default::default());
        let winner_silver_ring: RewardValues = Rules::Season.calc_rewards(WEI(3_000).low, 1, true, RingType::SilverSignetRing, @Default::default());
        let winner_lead_ring: RewardValues = Rules::Season.calc_rewards(WEI(3_000).low, 1, true, RingType::LeadSignetRing, @Default::default());
        // increasing fools
        assert_lt!(winner_no_ring.fools_gained, winner_lead_ring.fools_gained, "winner_fools");
        assert_lt!(winner_lead_ring.fools_gained, winner_silver_ring.fools_gained, "winner_fools");
        assert_lt!(winner_silver_ring.fools_gained, winner_gold_ring.fools_gained, "winner_fools");
        // same scores
        assert_eq!(winner_no_ring.points_scored, winner_gold_ring.points_scored, "winner_points");
        assert_eq!(winner_gold_ring.points_scored, winner_silver_ring.points_scored, "winner_points");
        assert_eq!(winner_silver_ring.points_scored, winner_lead_ring.points_scored, "winner_points");
        // losers
        let loser_no_ring: RewardValues = Rules::Season.calc_rewards(WEI(3_000).low, 1, false, RingType::Unknown, @Default::default());
        let loser_gold_ring: RewardValues = Rules::Season.calc_rewards(WEI(3_000).low, 1, false, RingType::GoldSignetRing, @Default::default());
        let loser_silver_ring: RewardValues = Rules::Season.calc_rewards(WEI(3_000).low, 1, false, RingType::SilverSignetRing, @Default::default());
        let loser_lead_ring: RewardValues = Rules::Season.calc_rewards(WEI(3_000).low, 1, false, RingType::LeadSignetRing, @Default::default());
        // same scores
        assert_eq!(loser_no_ring.points_scored, loser_gold_ring.points_scored, "loser_points");
        assert_eq!(loser_gold_ring.points_scored, loser_silver_ring.points_scored, "loser_points");
        assert_eq!(loser_silver_ring.points_scored, loser_lead_ring.points_scored, "loser_points");
        // less than winners
        assert_eq!(loser_no_ring.fools_gained, 0, "losers_fools");
        assert_eq!(loser_gold_ring.fools_gained, 0, "losers_fools");
        assert_eq!(loser_silver_ring.fools_gained, 0, "losers_fools");
        assert_eq!(loser_lead_ring.fools_gained, 0, "losers_fools");
    }
}
