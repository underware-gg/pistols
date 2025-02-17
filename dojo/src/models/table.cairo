pub use pistols::types::rules::{RulesType, RulesTypeTrait};

// permanent tables
pub mod TABLES {
    pub const TUTORIAL: felt252 = 'Tutorial';   // player tutorials
    pub const PRACTICE: felt252 = 'Practice';   // bot practice
    // pub const ETERNUM_S1: felt252 = 'EternumS1';
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
    pub rules: RulesType,
}


//---------------------------
// Table Manager
//
use pistols::libs::store::{Store, StoreTrait};

#[generate_trait]
pub impl TableManagerImpl of TableManagerTrait {
    fn initialize(ref store: Store) {
        // create permanent tables
        store.set_table_config(@TableConfig {
            table_id: TABLES::TUTORIAL,
            description: 'The Training Grounds',
            rules: RulesType::Academia,
        });
        store.set_table_config(@TableConfig {
            table_id: TABLES::PRACTICE,
            description: 'Bot Shooting Range',
            rules: RulesType::Academia,
        });
        // store.set_table_config(@TableConfig {
        //     table_id: 'EternumS1', // example
        //     description: 'Eternum Season 1',
        //     rules: RulesType::Eternum,
        // });
    }
}


//---------------------------
// Traits
//
use pistols::systems::tokens::duel_token::duel_token::{Errors as DuelErrors};
use pistols::models::season::{SeasonConfig, SeasonConfigTrait};

#[generate_trait]
pub impl TableConfigImpl of TableConfigTrait {
    fn can_join(self: @TableConfig, ref store: Store) -> bool {
        (
            (*self).rules.exists() &&
            (*self).validate_season(ref store)
        )
    }
    fn assert_can_join(self: @TableConfig, ref store: Store) {
        assert(self.rules.exists(), DuelErrors::INVALID_TABLE);
        assert(self.validate_season(ref store), DuelErrors::INVALID_SEASON);
    }
    fn validate_season(self: @TableConfig, ref store: Store) -> bool {
        (match self.rules {
            RulesType::Season => {
                let season: SeasonConfig = store.get_season_config(*self.table_id);
                (season.is_active())
            },
            _ => true
        })
    }
}
