use starknet::ContractAddress;
use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};
use pistols::interfaces::ierc20::{ierc20, IERC20Dispatcher, IERC20DispatcherTrait};
use pistols::systems::admin::admin::{Errors};
use pistols::systems::utils::{ZERO};
use pistols::utils::math::{MathU256};
use pistols::utils::arrays::{ArrayTrait};
use pistols::types::constants::{constants};

mod tables {
    const LORDS: felt252 = 'Lords';
    const COMMONERS: felt252 = 'Commoners';
    const BRUSSELS: felt252 = 'Brussels';
}

mod table_types {
    const CLASSIC: u8 = 1;
    const TOURNAMENT: u8 = 2;
    const IRL_TOURNAMENT: u8 = 3;
}

// Temporarily renamed to TableConfig while this bug exists:
// https://github.com/dojoengine/dojo/issues/2057
#[derive(Copy, Drop, Serde)]
#[dojo::model]
struct TableConfig {
    #[key]
    table_id: felt252,
    //------
    description: felt252,
    contract_address: ContractAddress,
    wager_min: u256,
    fee_min: u256,
    fee_pct: u8,
    is_open: bool,
    table_type: u8,
}

#[derive(Drop, Serde)]
#[dojo::model]
struct TableAdmittance {
    #[key]
    table_id: felt252,
    //------
    accounts: Array<ContractAddress>,
    duelists: Array<ContractAddress>,
}

fn default_tables(lords_address: ContractAddress) -> Array<TableConfig> {
    (array![
        (TableConfig {
            table_id: tables::LORDS,
            description: 'The Lords Table',
            contract_address: lords_address,
            wager_min: 0,
            fee_min: 4 * constants::ETH_TO_WEI,
            fee_pct: 10,
            is_open: (lords_address != ZERO()),
            table_type: table_types::CLASSIC,
        }),
        (TableConfig {
            table_id: tables::COMMONERS,
            description: 'The Commoners Table',
            contract_address: ZERO(),
            wager_min: 0,
            fee_min: 0,
            fee_pct: 0,
            is_open: true,
            table_type: table_types::CLASSIC,
        }),
        (TableConfig {
            table_id: tables::BRUSSELS,
            description: 'Brussels Tournament',
            contract_address: ZERO(),
            wager_min: 0,
            fee_min: 0,
            fee_pct: 0,
            is_open: true,
            table_type: table_types::IRL_TOURNAMENT,
        }),
    ])
}


//---------------------------
// TableManager
//
#[derive(Copy, Drop)]
struct TableManager {
    world: IWorldDispatcher
}

#[generate_trait]
impl TableManagerTraitImpl of TableManagerTrait {
    fn new(world: IWorldDispatcher) -> TableManager {
        TableManager { world }
    }
    fn exists(self: TableManager, table_id: felt252) -> bool {
        let table: TableConfig = get!(self.world, (table_id), TableConfig);
        (table.description != 0)
    }
    fn get(self: TableManager, table_id: felt252) -> TableConfig {
        let table: TableConfig = get!(self.world, (table_id), TableConfig);
        assert(table.description != 0, Errors::INVALID_TABLE);
        (table)
    }
    fn set(self: TableManager, table: TableConfig) {
        assert(table.description != 0, Errors::INVALID_DESCRIPTION);
        set!(self.world, (table));
    }
    fn set_array(self: TableManager, tables: @Array<TableConfig>) {
        let mut n: usize = 0;
        loop {
            if (n == tables.len()) { break; }
            self.set(*tables.at(n));
            n += 1;
        };
    }
    fn can_join(self: TableManager, table_id: felt252, account_address: ContractAddress, duelist_address: ContractAddress) -> bool {
        let admittance: TableAdmittance = get!(self.world, (table_id), TableAdmittance);
        (admittance.can_join(account_address, duelist_address))
    }
}

//---------------------------
// TableTrait
//
#[generate_trait]
impl TableTraitImpl of TableTrait {
    fn ierc20(self: TableConfig) -> IERC20Dispatcher {
        (ierc20(self.contract_address))
    }
    fn calc_fee(self: TableConfig, wager_value: u256) -> u256 {
        (MathU256::max(self.fee_min, (wager_value / 100) * self.fee_pct.into()))
    }
}

//---------------------------
// TableAdmittanceTrait
//
#[generate_trait]
impl TableAdmittanceTraitImpl of TableAdmittanceTrait {
    fn can_join(self: @TableAdmittance, account_address: ContractAddress, duelist_address: ContractAddress) -> bool {
        if (self.accounts.len() == 0 && self.duelists.len() == 0) {
            (true)
        } else {
            (self.accounts.contains(@account_address) || self.duelists.contains(@duelist_address))
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
    use super::{TableAdmittance, TableAdmittanceTrait};

    #[test]
    #[available_gas(10_000_00)]
    fn test_admittance() {
        let table_id: felt252 = 'RoundTable';
        let duelist_1: ContractAddress = starknet::contract_address_const::<0x111>();
        let duelist_2: ContractAddress = starknet::contract_address_const::<0x222>();
        let duelist_3: ContractAddress = starknet::contract_address_const::<0x333>();
        let admittance = @TableAdmittance{
            table_id,
            accounts: array![],
            duelists: array![],
        };
        assert(admittance.can_join(duelist_1, duelist_1) == true, 'empty_1');
        assert(admittance.can_join(duelist_1, duelist_2) == true, 'empty_2');
        assert(admittance.can_join(duelist_2, duelist_1) == true, 'empty_3');
        let admittance = TableAdmittance{
            table_id,
            accounts: array![duelist_3],
            duelists: array![],
        };
        assert(admittance.can_join(duelist_1, duelist_2) == false, 'accounts_1_2');
        assert(admittance.can_join(duelist_2, duelist_1) == false, 'accounts_2_1');
        assert(admittance.can_join(duelist_1, duelist_3) == false, 'accounts_1_3');
        assert(admittance.can_join(duelist_3, duelist_1) == true, 'accounts_3_1');
        let admittance = TableAdmittance{
            table_id,
            accounts: array![],
            duelists: array![duelist_3],
        };
        assert(admittance.can_join(duelist_1, duelist_2) == false, 'duelists_1_2');
        assert(admittance.can_join(duelist_2, duelist_1) == false, 'duelists_2_1');
        assert(admittance.can_join(duelist_1, duelist_3) == true, 'duelists_1_3');
        assert(admittance.can_join(duelist_3, duelist_1) == false, 'duelists_3_1');
        let admittance = TableAdmittance{
            table_id,
            accounts: array![duelist_1, duelist_2],
            duelists: array![],
        };
        assert(admittance.can_join(duelist_1, duelist_2) == true, 'dual_1_2');
        assert(admittance.can_join(duelist_2, duelist_1) == true, 'dual_2_1');
        assert(admittance.can_join(duelist_3, duelist_3) == false, 'dual_3_3');
    }
}
