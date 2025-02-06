
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
    Single,     // 1
    Ended,      // 2
}


//---------------------------
// Season Manager
//
use pistols::systems::game::game::{Errors as ErrorsGame};
use pistols::models::table::{TableConfig, TableType};
use pistols::libs::store::{Store, StoreTrait};
use pistols::utils::short_string::{ShortStringTrait};
use pistols::utils::timestamp::{TIMESTAMP};
use pistols::utils::math::{MathU64};

#[generate_trait]
pub impl SeasonManagerImpl of SeasonManagerTrait {
    #[inline(always)]
    fn initialize(ref store: Store) -> felt252 {
        (Self::create_next_season(ref store, 0))
    }
    fn create_next_season(ref store: Store, current_season_id: u16) -> felt252 {
        // assert(duration_seconds < TIMESTAMP::ONE_DAY, ErrorsGame::DURATION_TOO_SHORT);
        let season_id: u16 = current_season_id + 1;
        let table_id: felt252 = Self::make_table_id(season_id);
        let timestamp_start: u64 = starknet::get_block_timestamp();
        let timestamp_end: u64 = (timestamp_start + Self::get_season_duration());
        store.set_season_config(@SeasonConfig {
            table_id,
            season_id,
            timestamp_start,
            timestamp_end,
            phase: SeasonPhase::Single,
        });
        store.set_table_config(@TableConfig {
            table_id,
            description: 'Season '.concat(season_id.to_short_string()),
            table_type: TableType::Season,
        });
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
    fn collect(ref self: SeasonConfig, ref store: Store) -> felt252 {
        // must sync with Self::collect()
        assert(self.phase != SeasonPhase::Ended, ErrorsGame::SEASON_ENDED);
        assert(self.seconds_to_collect() == 0, ErrorsGame::SEASON_IS_ACTIVE);
        assert(self.is_endgame(), ErrorsGame::SEASON_NOT_ENDGAME);
        // collect!
        self.phase = SeasonPhase::Ended;
        self.timestamp_end = starknet::get_block_timestamp();
        store.set_season_config(@self);
        // create next season
        let table_id: felt252 = SeasonManagerTrait::create_next_season(ref store, self.season_id);
        (table_id)
    }
    //-----------------
    // info
    //
    #[inline(always)]
    fn seconds_to_collect(self: SeasonConfig) -> u64 {
        (MathU64::sub(self.timestamp_end, starknet::get_block_timestamp()))
    }
    #[inline(always)]
    fn is_endgame(self: SeasonConfig) -> bool {
        (true)
    }
    #[inline(always)]
    fn can_collect(self: SeasonConfig) -> bool {
        (
            self.phase != SeasonPhase::Ended &&
            self.seconds_to_collect() == 0 &&
            self.is_endgame()
        )
    }
}

impl SeasonPhaseIntoByteArray of core::traits::Into<SeasonPhase, ByteArray> {
    fn into(self: SeasonPhase) -> ByteArray {
        match self {
            SeasonPhase::Undefined =>   "Undefined",
            SeasonPhase::Single =>      "Single",
            SeasonPhase::Ended =>       "Ended",
        }
    }
}

// for println! and format! 
// pub impl SeasonPhaseDisplay of core::fmt::Display<SeasonPhase> {
//     fn fmt(self: @SeasonPhase, ref f: core::fmt::Formatter) -> Result<(), core::fmt::Error> {
//         let result: ByteArray = (*self).into();
//         f.buffer.append(@result);
//         Result::Ok(())
//     }
// }
pub impl SeasonPhaseDebug of core::fmt::Debug<SeasonPhase> {
    fn fmt(self: @SeasonPhase, ref f: core::fmt::Formatter) -> Result<(), core::fmt::Error> {
        let result: ByteArray = (*self).into();
        f.buffer.append(@result);
        Result::Ok(())
    }
}
