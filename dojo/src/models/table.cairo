use starknet::ContractAddress;
use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};
use pistols::interfaces::ierc20::{ierc20, IERC20Dispatcher, IERC20DispatcherTrait};
use pistols::systems::utils::{zero_address};
use pistols::utils::math::{MathU256};
use pistols::types::constants::{constants};

mod tables {
    const LORDS: felt252 = 'Lords';
    const COMMONERS: felt252 = 'Commoners';
    // number of valid tables
    const COUNT: u8 = 2;
}

#[derive(Model, Copy, Drop, Serde)]
struct Table { // TODO: Rename to Board or Table
    #[key]
    table_id: felt252,
    //------
    description: felt252,
    contract_address: ContractAddress,
    wager_min: u256,
    fee_min: u256,
    fee_pct: u8,
    is_open: bool,
}

fn default_tables(lords_address: ContractAddress) -> Array<Table> {
    (array![
        (Table {
            table_id: tables::LORDS,
            description: 'The Lords Table',
            contract_address: lords_address,
            wager_min: 0,
            fee_min: 4 * constants::ETH_TO_WEI,
            fee_pct: 10,
            is_open: (lords_address != zero_address()),
        }),
        (Table {
            table_id: tables::COMMONERS,
            description: 'The Commoners Table',
            contract_address: zero_address(),
            wager_min: 0,
            fee_min: 0,
            fee_pct: 0,
            is_open: true,
        })
    ])
}

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
        let table: Table = get!(self.world, (table_id), Table);
        (table.description != 0)
    }
    fn get(self: TableManager, table_id: felt252) -> Table {
        let table: Table = get!(self.world, (table_id), Table);
        assert(table.description != 0, 'Invalid Table');
        (table)
    }
    fn set(self: TableManager, table: Table) {
        assert(table.description != 0, 'Need a description');
        set!(self.world, (table));
    }
    fn set_array(self: TableManager, tables: Array<Table>) {
        let mut n: usize = 0;
        loop {
            if (n == tables.len()) { break; }
            self.set(*tables.at(n));
            n += 1;
        };
    }
}

#[generate_trait]
impl TableTraitImpl of TableTrait {
    fn ierc20(self: Table) -> IERC20Dispatcher {
        (ierc20(self.contract_address))
    }
    fn calc_fee(self: Table, wager_value: u256) -> u256 {
        (MathU256::max(self.fee_min, (wager_value / 100) * self.fee_pct.into()))
    }
    // TODO
    // fn to_wei(self: Table, value: u256) -> u256 {
    //     // get decimals and multiply
    // }
}
