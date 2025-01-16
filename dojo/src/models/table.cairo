// use debug::PrintTrait;
use starknet::ContractAddress;
use pistols::types::cards::hand::{DeckType};

#[derive(Serde, Copy, Drop, PartialEq, Introspect)]
pub enum TableType {
    Undefined,      // 0
    Season,         // 1
    Tutorial,       // 2
    Practice,       // 3
}

// Temporarily renamed to TableConfig while this bug exists:
// https://github.com/dojoengine/dojo/issues/2057
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct TableConfig {
    #[key]
    pub table_id: felt252,
    //------
    pub description: felt252,
    pub table_type: TableType,
    pub deck_type: DeckType,
    pub fee_collector_address: ContractAddress, // if 0x0: use default treasury
    pub fee_min: u128,
    pub is_open: bool,
}

// fixed tables
mod TABLES {
    const TUTORIAL: felt252 = 'Tutorial';   // player tutorials
    const PRACTICE: felt252 = 'Practice';   // bot practice
}


//---------------------------
// Table Manager
//
use pistols::libs::store::{Store, StoreTrait};
use pistols::utils::misc::{ZERO};

#[generate_trait]
impl TableManagerImpl of TableManagerTrait {
    fn initialize(ref store: Store) {
        store.set_table_config(@TableConfig {
            table_id: TABLES::TUTORIAL,
            description: 'The Training Grounds',
            table_type: TableType::Tutorial,
            deck_type: DeckType::Classic,
            fee_collector_address: ZERO(),
            fee_min: 0,
            is_open: true,
        });
        store.set_table_config(@TableConfig {
            table_id: TABLES::PRACTICE,
            description: 'Bot Shooting Range',
            table_type: TableType::Practice,
            deck_type: DeckType::Classic,
            fee_collector_address: ZERO(),
            fee_min: 0,
            is_open: true,
        });
    }
}


//---------------------------
// TableConfig Traits
//
#[generate_trait]
impl TableConfigImpl of TableConfigTrait {
    fn exists(self: @TableConfig) -> bool {
        (*self.table_type != TableType::Undefined)
    }
    fn can_join(self: @TableConfig, _zaccount_address: ContractAddress, _duelist_id: u128) -> bool {
        (*self.is_open)
    }
    fn calc_mint_fee(self: @TableConfig) -> u128 {
        (0)
    }
}

