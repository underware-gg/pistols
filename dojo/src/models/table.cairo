use starknet::ContractAddress;
use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};
use pistols::interfaces::ierc20::{ierc20, IERC20Dispatcher, IERC20DispatcherTrait};
use pistols::systems::utils::{zero_address};
use pistols::utils::math::{MathU256};
use pistols::types::constants::{constants};

mod tables {
    const LORDS: felt252 = 'Lords';
    const COMMONERS: felt252 = 'Commoners';
}

mod table_types {
    const CLASSIC: u8 = 1;
    const DEMO: u8 = 2;
    const TOURNAMENT: u8 = 3;
}

// Temporarily renamed to TTable while this bug exists:
// https://github.com/dojoengine/dojo.js/issues/204
#[derive(Copy, Drop, Serde)]
#[dojo::model]
struct TTable {
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

fn default_tables(lords_address: ContractAddress) -> Array<TTable> {
    (array![
        (TTable {
            table_id: tables::LORDS,
            description: 'The Lords Table',
            contract_address: lords_address,
            wager_min: 0,
            fee_min: 4 * constants::ETH_TO_WEI,
            fee_pct: 10,
            is_open: (lords_address != zero_address()),
            table_type: table_types::CLASSIC,
        }),
        (TTable {
            table_id: tables::COMMONERS,
            description: 'The Commoners Table',
            contract_address: zero_address(),
            wager_min: 0,
            fee_min: 0,
            fee_pct: 0,
            is_open: true,
            table_type: table_types::CLASSIC,
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
        let table: TTable = get!(self.world, (table_id), TTable);
        (table.description != 0)
    }
    fn get(self: TableManager, table_id: felt252) -> TTable {
        let table: TTable = get!(self.world, (table_id), TTable);
        assert(table.description != 0, 'Invalid Table');
        (table)
    }
    fn set(self: TableManager, table: TTable) {
        assert(table.description != 0, 'Need a description');
        set!(self.world, (table));
    }
    fn set_array(self: TableManager, tables: Array<TTable>) {
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
    fn ierc20(self: TTable) -> IERC20Dispatcher {
        (ierc20(self.contract_address))
    }
    fn calc_fee(self: TTable, wager_value: u256) -> u256 {
        (MathU256::max(self.fee_min, (wager_value / 100) * self.fee_pct.into()))
    }
    // TODO
    // fn to_wei(self: TTable, value: u256) -> u256 {
    //     // get decimals and multiply
    // }
}
