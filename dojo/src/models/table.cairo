use starknet::{ContractAddress};

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
    pub fee_collector_address: ContractAddress, // if 0x0: use default treasury
    pub fee_min: u128,
    pub is_open: bool,
}

// fixed tables
pub mod TABLES {
    pub const TUTORIAL: felt252 = 'Tutorial';   // player tutorials
    pub const PRACTICE: felt252 = 'Practice';   // bot practice
}


//---------------------------
// Table Manager
//
use pistols::libs::store::{Store, StoreTrait};
use pistols::utils::misc::{ZERO};

#[generate_trait]
pub impl TableManagerImpl of TableManagerTrait {
    fn initialize(ref store: Store) {
        store.set_table_config(@TableConfig {
            table_id: TABLES::TUTORIAL,
            description: 'The Training Grounds',
            table_type: TableType::Tutorial,
            fee_collector_address: ZERO(),
            fee_min: 0,
            is_open: true,
        });
        store.set_table_config(@TableConfig {
            table_id: TABLES::PRACTICE,
            description: 'Bot Shooting Range',
            table_type: TableType::Practice,
            fee_collector_address: ZERO(),
            fee_min: 0,
            is_open: true,
        });
    }
}

impl TableTypeIntoByteArray of core::traits::Into<TableType, ByteArray> {
    fn into(self: TableType) -> ByteArray {
        match self {
            TableType::Undefined   =>  "Undefined",
            TableType::Season      =>  "Season",
            TableType::Tutorial    =>  "Tutorial",
            TableType::Practice    =>  "Practice",
        }
    }
}

// for println! and format! 
// pub impl TableTypeDisplay of core::fmt::Display<TableType> {
//     fn fmt(self: @TableType, ref f: core::fmt::Formatter) -> Result<(), core::fmt::Error> {
//         let result: ByteArray = (*self).into();
//         f.buffer.append(@result);
//         Result::Ok(())
//     }
// }
pub impl TableTypeDebug of core::fmt::Debug<TableType> {
    fn fmt(self: @TableType, ref f: core::fmt::Formatter) -> Result<(), core::fmt::Error> {
        let result: ByteArray = (*self).into();
        f.buffer.append(@result);
        Result::Ok(())
    }
}


//---------------------------
// TableConfig Traits
//
#[generate_trait]
pub impl TableConfigImpl of TableConfigTrait {
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

