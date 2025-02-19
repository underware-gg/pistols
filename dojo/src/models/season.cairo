
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct SeasonConfig {
    #[key]
    pub table_id: felt252,      // short string
    //------
    pub season_id: u16,         // sequential
    pub timestamp_start: u64,   // start of season
    pub timestamp_end: u64,     // end of season (past or future)
    pub phase: SeasonPhase,     // current phase
}

#[derive(Serde, Copy, Drop, PartialEq, Introspect)]
pub enum SeasonPhase {
    Undefined,  // 0
    InProgress, // 1
    Ended,      // 2
}


//---------------------------
// Season Manager
//
use pistols::systems::game::game::{Errors as ErrorsGame};
use pistols::models::leaderboard::{LeaderboardTrait};
use pistols::models::table::{TableConfig};
use pistols::types::rules::{RulesType, RulesTypeTrait, SeasonDistribution};
use pistols::libs::store::{Store, StoreTrait};
use pistols::utils::short_string::{ShortStringTrait};
use pistols::utils::timestamp::{TIMESTAMP};
use pistols::utils::math::{MathU64};

#[generate_trait]
pub impl SeasonManagerImpl of SeasonManagerTrait {
    // const LEADERBOARD_POSITIONS: u8 = 10;

    #[inline(always)]
    fn initialize(ref store: Store) -> felt252 {
        (Self::create_next_season(ref store, 0))
    }
    fn create_next_season(ref store: Store, current_season_id: u16) -> felt252 {
        // create ids
        let season_id: u16 = current_season_id + 1;
        let table_id: felt252 = Self::make_table_id(season_id);
        // set rules
        let rules: RulesType = RulesType::Season;
        let distribution: @SeasonDistribution = rules.get_season_distribution(100);
        // calc timestamps
        let timestamp_start: u64 = starknet::get_block_timestamp();
        let timestamp_end: u64 = (timestamp_start + Self::get_season_duration());
        // create models
        store.set_season_config(@SeasonConfig {
            table_id,
            season_id,
            timestamp_start,
            timestamp_end,
            phase: SeasonPhase::InProgress,
        });
        store.set_table_config(@TableConfig {
            table_id,
            description: 'Season '.concat(season_id.to_short_string()),
            rules,
        });
        store.set_leaderboard(
            @LeaderboardTrait::new(
                table_id,
                (*distribution.percents).len().try_into().unwrap(),
            )
        );
        (table_id)
    }
    //-----------------
    // info
    //
    #[inline(always)]
    fn make_table_id(season_id: u16) -> felt252 {
        ('Season'.concat(season_id.to_short_string()))
    }
    #[inline(always)]
    fn get_season_duration() -> u64 {
        (TIMESTAMP::ONE_WEEK)
    }
}


//---------------------------
// Traits
//
#[generate_trait]
pub impl SeasonConfigImpl of SeasonConfigTrait {
    #[inline(always)]
    fn is_active(self: @SeasonConfig) -> bool {
        (*self.phase == SeasonPhase::InProgress)
    }
    //
    // Terminate: close one season and start a new one
    //
    #[inline(always)]
    fn seconds_to_collect(self: @SeasonConfig) -> u64 {
        (MathU64::sub(*self.timestamp_end, starknet::get_block_timestamp()))
    }
    #[inline(always)]
    fn can_collect(self: @SeasonConfig) -> bool {
        (
            *self.phase != SeasonPhase::Ended &&
            (*self).seconds_to_collect() == 0
        )
    }
    fn collect(ref self: SeasonConfig, ref store: Store) -> felt252 {
        // must sync with Self::collect()
        assert(self.phase == SeasonPhase::InProgress, ErrorsGame::SEASON_IS_NOT_ACTIVE);
        assert(self.seconds_to_collect() == 0, ErrorsGame::SEASON_IS_ACTIVE);
        // collect!
        self.phase = SeasonPhase::Ended;
        self.timestamp_end = starknet::get_block_timestamp();
        store.set_season_config(@self);
        // create next season
        let table_id: felt252 = SeasonManagerTrait::create_next_season(ref store, self.season_id);
        (table_id)
    }
}



//---------------------------
// Converters
//
impl SeasonPhaseIntoByteArray of core::traits::Into<SeasonPhase, ByteArray> {
    fn into(self: SeasonPhase) -> ByteArray {
        match self {
            SeasonPhase::Undefined =>   "Undefined",
            SeasonPhase::InProgress =>  "InProgress",
            SeasonPhase::Ended =>       "Ended",
        }
    }
}
// for println! format! (core::fmt::Display<>) assert! (core::fmt::Debug<>)
pub impl SeasonPhaseDebug of core::fmt::Debug<SeasonPhase> {
    fn fmt(self: @SeasonPhase, ref f: core::fmt::Formatter) -> Result<(), core::fmt::Error> {
        let result: ByteArray = (*self).into();
        f.buffer.append(@result);
        Result::Ok(())
    }
}
