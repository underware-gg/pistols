// use debug::PrintTrait;
use starknet::ContractAddress;
use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};
use pistols::interfaces::ierc20::{ierc20, IERC20Dispatcher, IERC20DispatcherTrait};
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
    pub fee_contract_address: ContractAddress,  // if 0x0: no fees, no wager
    pub fee_collector_address: ContractAddress, // if 0x0: use default treasury
    pub fee_min: u128,
    pub is_open: bool,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct TableWager {
    #[key]
    pub table_id: felt252,
    //------
    pub wager_min: u128,
    pub wager_max: u128,
    pub fee_pct: u8,
}

#[derive(Drop, Serde)]
#[dojo::model]
pub struct TableAdmittance {
    #[key]
    pub table_id: felt252,
    //------
    pub accounts: Array<ContractAddress>,
    pub duelists: Array<u128>,
}

fn default_tables(lords_address: ContractAddress) -> Array<TableConfig> {
    (array![
        (TableConfig {
            table_id: TABLES::LORDS,
            description: 'The Lords Table',
            table_type: TableType::Classic,
            deck_type: DeckType::Classic,
            fee_contract_address: lords_address,
            fee_collector_address: ZERO(),
            fee_min: 0, //60 * CONST::ETH_TO_WEI.low,
            is_open: (lords_address.is_non_zero()),
        }),
        (TableConfig {
            table_id: TABLES::COMMONERS,
            description: 'The Commoners Table',
            table_type: TableType::Classic,
            deck_type: DeckType::Classic,
            fee_contract_address: ZERO(),
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
    fn new(world: IWorldDispatcher) -> TableInitializer {
        TableInitializer {
            store: StoreTrait::new(world)
        }
    }
    fn initialize(self: TableInitializer, lords_address: ContractAddress) {
        self.set_array(@default_tables(lords_address));
    }
    fn set_array(self: TableInitializer, tables: @Array<TableConfig>) {
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
impl TableConfigEntityImpl of TableConfigEntityTrait {
    fn exists(self: @TableConfigEntity) -> bool {
        (*self.description != 0)
    }
    #[inline(always)]
    fn ierc20(self: @TableConfigEntity) -> IERC20Dispatcher {
        (ierc20(*self.fee_contract_address))
    }
    fn calc_fee(self: @TableConfigEntity, wager_value: u128) -> u128 {
        // (MathU128::max(*self.fee_min, (wager_value / 100) * wager.fee_pct.into()))
        // assert(wager_value == 0, GameErrors::WAGER_NOT_ALLOWED);
        // (*self.fee_min)
        (0)
    }
}

//---------------------------
// TableAdmittance Traits
//
#[generate_trait]
impl TableAdmittanceEntityImpl of TableAdmittanceEntityTrait {
    fn can_join(self: @TableAdmittanceEntity, account_address: ContractAddress, duelist_id: u128) -> bool {
        if (self.accounts.len() == 0 && self.duelists.len() == 0) {
            (true)
        } else {
            (self.accounts.contains(@account_address) || self.duelists.contains(@duelist_id))
        }
    }
}


//---------------------------
// enum traits
//

impl TableTypeIntoFelt252 of Into<TableType, felt252> {
    fn into(self: TableType) -> felt252 {
        match self {
            TableType::Undefined => 0,
            TableType::Classic => 1,
            TableType::Tournament => 2,
            TableType::IRLTournament => 3,
        }
    }
}
impl TableTypeIntoByteArray of Into<TableType, ByteArray> {
    fn into(self: TableType) -> ByteArray {
        match self {
            TableType::Undefined => "Undefined",
            TableType::Classic => "Classic",
            TableType::Tournament => "Tournament",
            TableType::IRLTournament => "IRLTournament",
        }
    }
}





//----------------------------------------
// Unit  tests
//
#[cfg(test)]
mod tests {
    use debug::PrintTrait;
    use starknet::ContractAddress;
    use super::{TableAdmittance, TableAdmittanceEntity, TableAdmittanceEntityTrait};
    use pistols::utils::misc::{ZERO};

    #[test]
    fn test_admittance() {
        let table_id: felt252 = 'RoundTable';
        let address_1: ContractAddress = starknet::contract_address_const::<0x111>();
        let address_2: ContractAddress = starknet::contract_address_const::<0x222>();
        let address_3: ContractAddress = starknet::contract_address_const::<0x333>();
        let duelist_id_1: u128 = 0x1;
        let duelist_id_2: u128 = 0x2;
        let duelist_id_3: u128 = 0x3;
        let admittance = @TableAdmittanceEntity{
            __id: table_id,
            accounts: array![],
            duelists: array![],
        };
        assert(admittance.can_join(address_1, duelist_id_1) == true, 'empty_1');
        assert(admittance.can_join(address_1, duelist_id_2) == true, 'empty_2');
        assert(admittance.can_join(address_2, duelist_id_1) == true, 'empty_3');
        let admittance = @TableAdmittanceEntity{
            __id: table_id,
            accounts: array![address_3],
            duelists: array![],
        };
        assert(admittance.can_join(address_1, duelist_id_2) == false, 'accounts_1_2');
        assert(admittance.can_join(address_2, duelist_id_1) == false, 'accounts_2_1');
        assert(admittance.can_join(address_1, duelist_id_3) == false, 'accounts_1_3');
        assert(admittance.can_join(address_3, duelist_id_1) == true, 'accounts_3_1');
        let admittance = @TableAdmittanceEntity{
            __id: table_id,
            accounts: array![],
            duelists: array![duelist_id_3],
        };
        assert(admittance.can_join(address_1, duelist_id_2) == false, 'duelists_1_2');
        assert(admittance.can_join(address_2, duelist_id_1) == false, 'duelists_2_1');
        assert(admittance.can_join(address_1, duelist_id_3) == true, 'duelists_1_3');
        assert(admittance.can_join(address_3, duelist_id_1) == false, 'duelists_3_1');
        let admittance = @TableAdmittanceEntity{
            __id: table_id,
            accounts: array![address_1, address_2],
            duelists: array![],
        };
        assert(admittance.can_join(address_1, duelist_id_2) == true, 'dual_1_2');
        assert(admittance.can_join(address_2, duelist_id_1) == true, 'dual_2_1');
        assert(admittance.can_join(address_3, duelist_id_3) == false, 'dual_3_3');
        let admittance = @TableAdmittanceEntity{
            __id: table_id,
            accounts: array![],
            duelists: array![duelist_id_1, duelist_id_2],
        };
        assert(admittance.can_join(address_1, duelist_id_2) == true, 'dual_1_2');
        assert(admittance.can_join(address_2, duelist_id_1) == true, 'dual_2_1');
        assert(admittance.can_join(address_3, duelist_id_3) == false, 'dual_3_3');
    }

}
