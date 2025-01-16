// use debug::PrintTrait;
use starknet::ContractAddress;

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct SeasonConfig {
    #[key]
    pub table_id: felt252,
    //------
    pub season_id: u16,         // sequential
    pub timestamp_start: u64,   // start of season
    pub timestamp_end: u64,     // end of season (past or future)
}

#[derive(Serde, Copy, Drop, PartialEq, Introspect)]
pub enum SeasonPhase {
    None,       // 0
    Grooming,   // 1
    Finals,     // 2
    Ended,      // 3
}


//---------------------------
// Season Manager
//
use pistols::libs::store::{Store, StoreTrait};
use pistols::models::table::{TableConfig, TableConfigTrait, TableType};
use pistols::types::cards::hand::{DeckType};
use pistols::utils::short_string::{ShortStringTrait};
use pistols::utils::math::{MathU64};
use pistols::utils::misc::{ZERO};

#[generate_trait]
impl SeasonManagerImpl of SeasonManagerTrait {
    #[inline(always)]
    fn make_table_id(season_id: u16) -> felt252 {
        ('Season'.concat(season_id.to_short_string()))
    }
    #[inline(always)]
    fn initialize(ref store: Store) -> felt252 {
        (Self::create_next_season(ref store, 0))
    }
    fn create_next_season(ref store: Store, current_season_id: u16) -> felt252 {
        let season_id: u16 = current_season_id + 1;
        let table_id = Self::make_table_id(season_id);
        let description = 'Season '.concat(season_id.to_short_string());
        store.set_season_config(@SeasonConfig {
            table_id,
            season_id,
            timestamp_start: starknet::get_block_timestamp(),
            timestamp_end: 0,
        });
        store.set_table_config(@TableConfig {
            table_id,
            description,
            table_type: TableType::Season,
            deck_type: DeckType::Classic,
            fee_collector_address: ZERO(),
            fee_min: 0,
            is_open: true,
        });
        (table_id)
    }
}


//---------------------------
// Traits
//
#[generate_trait]
impl SeasonConfigImpl of SeasonConfigTrait {
    fn get_phase(self: SeasonConfig) -> SeasonPhase {
        if (self.timestamp_start < starknet::get_block_timestamp()) {(SeasonPhase::None)}
        else if (self.timestamp_end == 0) {(SeasonPhase::Grooming)}
        else if (self.timestamp_end < starknet::get_block_timestamp()) {(SeasonPhase::Finals)}
        else {(SeasonPhase::Ended)}
    }
}
