use core::num::traits::Zero;
use starknet::{ContractAddress};

use pistols::systems::components::token_bound::{TokenBoundAddress};
use pistols::models::{
    // config::{CoinConfig}
};
use pistols::tests::tester::{tester,
    tester::{
        StoreTrait,
        IFameCoinDispatcherTrait,
        TestSystems, FLAGS,
        OWNER, OTHER,
    }
};
use pistols::types::constants::{CONST, FAME};

const AMOUNT: u128 = 1000 * CONST::ETH_TO_WEI.low;

const TOKEN_ID_1_1: u256 = 1;
const TOKEN_ID_1_2: u256 = 2;
const TOKEN_ID_2_1: u256 = 3;
const TOKEN_ID_2_2: u256 = 4;
const TOKEN_ID_3_1: u256 = 5;
const TOKEN_ID_3_2: u256 = 6;

fn setup(_fee_amount: u128) -> TestSystems {
    let mut sys: TestSystems = tester::setup_world(FLAGS::FAME | FLAGS::DUELIST | FLAGS::LORDS);

    tester::fund_duelists_pool(@sys, 2);

    // initialize contracts
    tester::execute_claim_starter_pack(@sys.pack, OWNER());

    (sys)
}

//
// initialize
//

#[test]
fn test_initializer() {
    let mut sys: TestSystems = setup(0);
    assert_eq!(sys.fame.symbol(), "FAME", "Symbol is wrong");
}


//---------------------------------
// token_bound
//

#[test]
fn test_token_bound_address() {
    let mut sys: TestSystems = setup(0);
    tester::execute_claim_starter_pack(@sys.pack, OTHER());
    // validate token_bound address
    let token_bound_address_1: ContractAddress = sys.fame.address_of_token(sys.duelists.contract_address, TOKEN_ID_1_1.low);
    let token_bound_address_2: ContractAddress = sys.fame.address_of_token(sys.duelists.contract_address, TOKEN_ID_2_1.low);
    assert!(token_bound_address_1.is_non_zero(), "token_bound_address_1");
    assert!(token_bound_address_2.is_non_zero(), "token_bound_address_2");
    assert_ne!(token_bound_address_1, token_bound_address_2, "token_bound_address_1 != 2");
    let (token_contract_1, token_id_1_1) = sys.fame.token_of_address(token_bound_address_1);
    let (token_contract_2, token_id_2_1) = sys.fame.token_of_address(token_bound_address_2);
    assert_eq!(token_contract_1, sys.duelists.contract_address, "token_contract_1");
    assert_eq!(token_contract_2, sys.duelists.contract_address, "token_contract_2");
    assert_eq!(token_id_1_1, TOKEN_ID_1_1.low, "token_id_1_1");
    assert_eq!(token_id_2_1, TOKEN_ID_2_1.low, "token_id_2_1");
    // model
    let token_bound_1: TokenBoundAddress = sys.store.get_token_bound_address(token_bound_address_1);
    let token_bound_2: TokenBoundAddress = sys.store.get_token_bound_address(token_bound_address_2);
    assert_eq!(token_bound_1.contract_address, sys.duelists.contract_address, "token_bound_1.contract_address");
    assert_eq!(token_bound_2.contract_address, sys.duelists.contract_address, "token_bound_2.contract_address");
    assert_eq!(token_bound_1.token_id, TOKEN_ID_1_1.low, "token_bound_1.token_id");
    assert_eq!(token_bound_2.token_id, TOKEN_ID_2_1.low, "token_bound_2.token_id");
    // balances
    let balance_1: u256 = sys.fame.balance_of_token(sys.duelists.contract_address, TOKEN_ID_1_1.low);
    let balance_2: u256 = sys.fame.balance_of_token(sys.duelists.contract_address, TOKEN_ID_2_1.low);
    assert_ne!(balance_1, 0, "balance_1");
    assert_ne!(balance_2, 0, "balance_2");
}

#[test]
#[should_panic(expected: ('COIN: caller is not minter', 'ENTRYPOINT_FAILED'))]
fn test_fame_mint_not_minter() {
    let mut sys: TestSystems = setup(0);
    sys.fame.minted_duelist(123);
}

#[test]
#[should_panic(expected: ('TOKEN_BOUND: already registered', 'ENTRYPOINT_FAILED'))]
fn test_fame_mint_already_registered() {
    let mut sys: TestSystems = setup(0);
    tester::impersonate(sys.duelists.contract_address);
    sys.fame.minted_duelist(TOKEN_ID_1_1.low);
}

#[test]
#[should_panic(expected: ('COIN: caller is not minter', 'ENTRYPOINT_FAILED'))]
fn test_fame_reward_not_minter() {
    let mut sys: TestSystems = setup(0);
    sys.fame.reward_duelist(123, 0);
}





//---------------------------------
// fails
//

#[test]
#[should_panic(expected:('COIN: caller is not minter', 'ENTRYPOINT_FAILED'))]
fn test_minted_duelist_not_allowed() {
    let mut sys: TestSystems = setup(0);
    sys.fame.minted_duelist(1);
}

#[test]
#[should_panic(expected:('COIN: caller is not minter', 'ENTRYPOINT_FAILED'))]
fn test_reward_duelist_not_allowed() {
    let mut sys: TestSystems = setup(0);
    sys.fame.reward_duelist(1, AMOUNT);
}

#[test]
#[should_panic(expected:('ERC20: insufficient balance', 'ENTRYPOINT_FAILED'))]
fn test_burn_not_allowed() {
    let mut sys: TestSystems = tester::setup_world(FLAGS::FAME | FLAGS::DUELIST);
    tester::impersonate(sys.duelists.contract_address);
    sys.fame.burn(AMOUNT);
}

#[test]
#[should_panic(expected: ('ERC20: insufficient allowance', 'ENTRYPOINT_FAILED'))]
fn test_fame_transfer_between_owners_not_allowed() {
    let mut sys: TestSystems = setup(0);
    // transfer FAME
    tester::impersonate(sys.duelists.contract_address);
    sys.fame.transfer_from(OWNER(), OTHER(), FAME::MINT_GRANT_AMOUNT / 2);
}

#[test]
#[should_panic(expected: ('ERC20: insufficient balance', 'ENTRYPOINT_FAILED'))]
// #[should_panic(expected: ('COIN: caller is not minter', 'ENTRYPOINT_FAILED'))]
fn test_fame_transfer_from_owner_not_allowed() {
    let mut sys: TestSystems = setup(0);
    // transfer FAME
    tester::impersonate(OWNER());
    sys.fame.transfer(OTHER(), FAME::MINT_GRANT_AMOUNT / 2);
}
