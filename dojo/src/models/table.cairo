use starknet::ContractAddress;
use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};
use pistols::interfaces::ierc20::{ierc20, IERC20Dispatcher, IERC20DispatcherTrait};
use pistols::systems::utils::{zero_address};
use pistols::utils::math::{MathU256};
use pistols::types::constants::{constants};

mod tables {
    const LORDS: u8 = 1;
    // number of valid tables
    const COUNT: u8 = 1;
}

#[derive(Model, Copy, Drop, Serde)]
struct Table { // TODO: Rename to Board or Table
    #[key]
    key: u8,
    //------
    contract_address: ContractAddress,
    description: felt252,
    fee_min: u256,
    fee_pct: u8,
    enabled: bool,
}

fn default_table(contract_address: ContractAddress) -> Table {
    (Table {
        key: tables::LORDS,
        contract_address,
        description: '$LORDS',
        fee_min: 4 * constants::ETH_TO_WEI,
        fee_pct: 10,
        enabled: (if (contract_address == zero_address()) { false } else { true }),
   })
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
    fn exists(self: TableManager, table_id: u8) -> bool {
        (table_id >= 1 && table_id <= tables::COUNT)
    }
    fn get(self: TableManager, table_id: u8) -> Table {
        assert(self.exists(table_id) == true, 'Invalid Table');
        get!(self.world, (table_id), Table)
    }
    fn set(self: TableManager, Table: Table) {
        set!(self.world, (Table));
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
