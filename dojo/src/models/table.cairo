use starknet::{ContractAddress};
use pistols::utils::misc::{ContractAddressDefault};
use pistols::models::pool::{PoolType};

// permanent tables
pub mod TABLES {
    pub const TUTORIAL: felt252 = 'Tutorial';   // player tutorials
    pub const PRACTICE: felt252 = 'Practice';   // bot practice
}

#[derive(Serde, Copy, Drop, PartialEq, Introspect)]
pub enum TableType {
    Undefined,      // 0
    Season,         // 1
    Tutorial,       // 2
    Practice,       // 3
    Eternum,        // 4
}

// Temporarily renamed to TableConfig while this bug exists:
// https://github.com/dojoengine/dojo/issues/2057
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct TableConfig {
    #[key]
    pub table_id: felt252,      // short string
    //------
    pub description: felt252,   // short string
    pub table_type: TableType,
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
pub struct FeeValues {
    pub fame_lost: u128,
    pub fame_gained: u128,
    pub fools_gained: u128,
    // calculated at the bank
    pub fame_burned: u128,
    pub lords_unlocked: u128,
    pub survived: bool,
}


//---------------------------
// Table Manager
//
use core::num::traits::Zero;
use pistols::libs::store::{Store, StoreTrait};
use pistols::types::constants::{CONST, FAME};
use pistols::utils::misc::{ZERO};

#[generate_trait]
pub impl TableManagerImpl of TableManagerTrait {
    fn initialize(ref store: Store) {
        // create permanent tables
        store.set_table_config(@TableConfig {
            table_id: TABLES::TUTORIAL,
            description: 'The Training Grounds',
            table_type: TableType::Tutorial,
        });
        store.set_table_config(@TableConfig {
            table_id: TABLES::PRACTICE,
            description: 'Bot Shooting Range',
            table_type: TableType::Practice,
        });
        // store.set_table_config(@TableConfig {
        //     table_id: 'EternumS1', // example
        //     description: 'Eternum Season 1',
        //     table_type: TableType::Eternum,
        // });
    }
}


//---------------------------
// Traits
//
#[generate_trait]
pub impl TableTypeImpl of TableTypeTrait {
    #[inline(always)]
    fn exists(self: @TableType) -> bool {
        (*self != TableType::Undefined)
    }
    #[inline(always)]
    fn is_season(self: @TableType) -> bool {
        (*self == TableType::Season)
    }
    #[inline(always)]
    fn can_join(self: @TableType, _account_address: ContractAddress, _duelist_id: u128) -> bool {
        (true)
    }
    fn get_rewards_distribution(self: @TableType, table_id: felt252, tournament_id: u128) -> @FeeDistribution {
        let mut result: FeeDistribution = match self {
            TableType::Season => FeeDistribution {
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
    fn calc_fame_fees(self: @TableType, balance: u128, lives_staked: u8, is_winner: bool) -> FeeValues {
        let mut result: FeeValues = match self {
            TableType::Season => {
                let mut result: FeeValues = Default::default();
                let one_life: u128 = FAME::ONE_LIFE.low;
                if (is_winner) {
                    result.survived = true;
                    let k_fame: u128 = 1;
                    result.fame_gained = (one_life / (((balance / one_life) + 1) / k_fame));
                    let k_fools: u128 = 10;
                    result.fools_gained = (k_fools * ((one_life / 2) / result.fame_gained)) * CONST::ETH_TO_WEI.low;
                    // apply stakes
                    result.fame_gained *= lives_staked.into();
                    result.fools_gained *= lives_staked.into();
                } else {
                    result.fame_lost = one_life * lives_staked.into();
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
impl TableTypeIntoByteArray of core::traits::Into<TableType, ByteArray> {
    fn into(self: TableType) -> ByteArray {
        match self {
            TableType::Undefined   =>  "Undefined",
            TableType::Season      =>  "Season",
            TableType::Tutorial    =>  "Tutorial",
            TableType::Practice    =>  "Practice",
            TableType::Eternum     =>  "Eternum",
        }
    }
}
// for println! format! (core::fmt::Display<>) assert! (core::fmt::Debug<>)
pub impl TableTypeDebug of core::fmt::Debug<TableType> {
    fn fmt(self: @TableType, ref f: core::fmt::Formatter) -> Result<(), core::fmt::Error> {
        let result: ByteArray = (*self).into();
        f.buffer.append(@result);
        Result::Ok(())
    }
}
