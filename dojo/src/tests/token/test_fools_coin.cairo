// use core::num::traits::Zero;
// use starknet::{ContractAddress};

use pistols::models::{
    // config::{CoinConfig}
};
use pistols::tests::tester::{tester,
    tester::{
        // StoreTrait,
        IFoolsCoinDispatcherTrait,
        TestSystems, FLAGS,
        OWNER,
    }
};
use pistols::interfaces::dns::{
    IFoolsCoinProtectedDispatcher, IFoolsCoinProtectedDispatcherTrait,
};
use pistols::types::constants::{CONST};

const AMOUNT: u128 = 1000 * CONST::ETH_TO_WEI.low;

const TOKEN_ID_1_1: u256 = 1;
const TOKEN_ID_1_2: u256 = 2;
const TOKEN_ID_2_1: u256 = 3;
const TOKEN_ID_2_2: u256 = 4;
const TOKEN_ID_3_1: u256 = 5;
const TOKEN_ID_3_2: u256 = 6;

fn setup(_fee_amount: u128) -> TestSystems {
    let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
    (sys)
}

//
// initialize
//

#[test]
fn test_initializer() {
    let mut sys: TestSystems = setup(0);
    assert_eq!(sys.fools.symbol(), "FOOLS", "Symbol is wrong");
}


//---------------------------------
// protected calls
//

pub fn _protected(sys: @TestSystems) -> IFoolsCoinProtectedDispatcher {
    (IFoolsCoinProtectedDispatcher{contract_address: (*sys.fools).contract_address})
}

#[test]
#[should_panic(expected:('FOOLS: Invalid caller', 'ENTRYPOINT_FAILED'))]
fn test_reward_player_invalid_caller() {
    let mut sys: TestSystems = setup(0);
    _protected(@sys).reward_player(OWNER(), 1_000);
}

