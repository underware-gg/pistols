pub use pistols::types::rules::{Rules, RulesTrait};
use pistols::types::timestamp::{Period};

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct SeasonConfig {
    #[key]
    pub season_id: u128,
    //------
    pub rules: Rules,           // rules for this season
    pub phase: SeasonPhase,     // current phase
    pub period: Period,         // start and end of season
}

#[derive(Serde, Copy, Drop, PartialEq, Introspect)]
pub enum SeasonPhase {
    Undefined,  // 0
    InProgress, // 1
    Ended,      // 2
}

// Per season scoreboard
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct SeasonScoreboard {
    #[key]
    pub season_id: u128,
    #[key]
    pub holder: felt252,    // duelist_id or player_address
    //------------
    pub points: u16,
}


//---------------------------
// Season Manager
//
use pistols::systems::game::game::{Errors as ErrorsGame};
use pistols::models::leaderboard::{LeaderboardTrait};
use pistols::types::rules::{RewardDistribution, RewardValues};
use pistols::libs::store::{Store, StoreTrait};
use pistols::types::timestamp::{TIMESTAMP};
use pistols::utils::math::{MathU64};

#[generate_trait]
pub impl SeasonManagerImpl of SeasonManagerTrait {
    // const LEADERBOARD_POSITIONS: u8 = 10;

    #[inline(always)]
    fn initialize(ref store: Store) -> u128 {
        (Self::create_next_season(ref store, 0))
    }
    fn create_next_season(ref store: Store, current_season_id: u128) -> u128 {
        // create ids
        let season_id: u128 = current_season_id + 1;
        // set rules
        let rules: Rules = Self::get_next_season_rules();
        let distribution: @RewardDistribution = rules.get_season_distribution(100);
        // calc timestamps
        let timestamp: u64 = starknet::get_block_timestamp();
        let period = Period {
            start: timestamp,
            end: (timestamp + Self::get_next_season_duration()),
        };
        // create models
        store.set_season_config(@SeasonConfig {
            season_id,
            rules,
            phase: SeasonPhase::InProgress,
            period,
        });
        store.set_leaderboard(
            @LeaderboardTrait::new(
                season_id,
                (*distribution.percents).len().try_into().unwrap(),
            )
        );
        (season_id)
    }
    //---------------------
    // Next season setup
    //
    #[inline(always)]
    fn get_next_season_rules() -> Rules {
        (Rules::Season)
    }
    #[inline(always)]
    fn get_next_season_duration() -> u64 {
        (TIMESTAMP::ONE_WEEK)
    }
}

#[generate_trait]
pub impl SeasonScoreboardImpl of SeasonScoreboardTrait {
    #[inline(always)]
    fn apply_rewards(ref self: SeasonScoreboard, rewards: @RewardValues) {
        self.points += *rewards.points_scored;
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
        (MathU64::sub(*self.period.end, starknet::get_block_timestamp()))
    }
    #[inline(always)]
    fn can_collect(self: @SeasonConfig) -> bool {
        (
            *self.phase != SeasonPhase::Ended &&
            (*self).seconds_to_collect() == 0
        )
    }
    fn collect(ref self: SeasonConfig, ref store: Store) -> u128 {
        // must sync with Self::collect()
        assert(self.phase == SeasonPhase::InProgress, ErrorsGame::SEASON_IS_NOT_ACTIVE);
        assert(self.seconds_to_collect() == 0, ErrorsGame::SEASON_IS_ACTIVE);
        // collect!
        self.phase = SeasonPhase::Ended;
        self.period.end = starknet::get_block_timestamp();
        store.set_season_config(@self);
        // create next season
        let season_id: u128 = SeasonManagerTrait::create_next_season(ref store, self.season_id);
        (season_id)
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
