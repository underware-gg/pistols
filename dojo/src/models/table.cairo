
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



//---------------------------
// Table Manager
//
use starknet::{ContractAddress};
use pistols::libs::store::{Store, StoreTrait};

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

