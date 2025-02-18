use starknet::{ContractAddress};
use pistols::utils::misc::{ContractAddressDefault};
use pistols::models::pool::{PoolType};


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


//---------------------------
// Traits
//
use core::num::traits::Zero;
use pistols::types::constants::{CONST, FAME};
use pistols::utils::misc::{ZERO};

#[generate_trait]
pub impl RulesTypeImpl of RulesTypeTrait {
    #[inline(always)]
    fn exists(self: @RulesType) -> bool {
        (*self != RulesType::Undefined)
    }
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
    fn calc_rewards(self: @RulesType, balance: u128, lives_staked: u8, is_winner: bool) -> RewardValues {
        let mut result: RewardValues = match self {
            RulesType::Season => {
                let mut result: RewardValues = Default::default();
                let one_life: u128 = FAME::ONE_LIFE.low;
                if (is_winner) {
                    result.survived = true;
                    let k_fame: u128 = 1;
                    result.fame_gained = (one_life / (((balance / one_life) + 1) / k_fame));
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
        };
        (result)
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
