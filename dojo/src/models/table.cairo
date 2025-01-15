// use debug::PrintTrait;
use starknet::ContractAddress;
use pistols::systems::game::game::{Errors as GameErrors};
use pistols::types::cards::hand::{DeckType};
use pistols::types::constants::{CONST};
use pistols::utils::arrays::{ArrayUtilsTrait};
use pistols::utils::math::{MathTrait};
use pistols::utils::misc::{ZERO};

mod TABLES {
    const LORDS: felt252 = 'Lords';
    const COMMONERS: felt252 = 'Commoners';
}

#[derive(Serde, Copy, Drop, PartialEq, Introspect)]
pub enum TableType {
    Undefined,      // 0
    Classic,        // 1
    Tournament,     // 2
    IRLTournament,  // 3
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

fn default_tables() -> Array<TableConfig> {
    (array![
        (TableConfig {
            table_id: TABLES::LORDS,
            description: 'The Lords Table',
            table_type: TableType::Classic,
            deck_type: DeckType::Classic,
            fee_collector_address: ZERO(),
            fee_min: 0, //60 * CONST::ETH_TO_WEI.low,
            is_open: true,
        }),
        (TableConfig {
            table_id: TABLES::COMMONERS,
            description: 'The Commoners Table',
            table_type: TableType::Classic,
            deck_type: DeckType::Classic,
            fee_collector_address: ZERO(),
            fee_min: 0,
            is_open: true,
        }),
    ])
}


//---------------------------
// TableInitializer
//
use pistols::libs::store::{Store, StoreTrait};

#[derive(Copy, Drop)]
pub struct TableInitializer {
    store: Store
}

#[generate_trait]
impl TableInitializerTraitImpl of TableInitializerTrait {
    fn new(store: Store) -> TableInitializer {
        TableInitializer { store }
    }
    fn initialize(ref self: TableInitializer) {
        self.set_array(@default_tables());
    }
    fn set_array(ref self: TableInitializer, tables: @Array<TableConfig>) {
        let mut n: usize = 0;
        loop {
            if (n == tables.len()) { break; }
            self.store.set_table_config(tables.at(n));
            n += 1;
        };
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

