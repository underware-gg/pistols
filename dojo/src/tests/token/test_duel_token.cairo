use core::num::traits::Zero;
use starknet::{ContractAddress};

use pistols::systems::{
    tokens::{
        duel_token::{IDuelTokenDispatcherTrait},
    },
};
use pistols::models::{
    challenge::{
        Challenge,
    },
    config::{
        TokenConfig,
    },
    table::{
        TABLES,
    },
};

use pistols::interfaces::dns::{DnsTrait};
use pistols::types::challenge_state::{ChallengeState};
use pistols::types::premise::{Premise};

use pistols::tests::tester::{tester,
    tester::{
            StoreTrait,
        TestSystems, FLAGS,
        ID, OWNER, OTHER, BUMMER, RECIPIENT, ZERO,
    },
};
use pistols::tests::{utils};

use openzeppelin_token::erc721::interface;
use openzeppelin_token::erc721::{
    // ERC721Component,
    ERC721Component::{
        Transfer, Approval,
    }
};

//
// events helpers
//

fn assert_event_transfer(
    emitter: ContractAddress, from: ContractAddress, to: ContractAddress, token_id: u256
) {
    let event = utils::pop_log::<Transfer>(emitter).unwrap();
    assert_eq!(event.from, from, "Invalid `from`");
    assert_eq!(event.to, to, "Invalid `to`");
    assert_eq!(event.token_id, token_id, "Invalid `token_id`");
}

fn assert_only_event_transfer(
    emitter: ContractAddress, from: ContractAddress, to: ContractAddress, token_id: u256
) {
    assert_event_transfer(emitter, from, to, token_id);
    utils::assert_no_events_left(emitter);
}

fn assert_event_approval(
    emitter: ContractAddress, owner: ContractAddress, spender: ContractAddress, token_id: u256
) {
    let event = utils::pop_log::<Approval>(emitter).unwrap();
    assert_eq!(event.owner, owner, "Invalid `owner`");
    assert_eq!(event.approved, spender, "Invalid `spender`");
    assert_eq!(event.token_id, token_id, "Invalid `token_id`");
}

fn assert_only_event_approval(
    emitter: ContractAddress, owner: ContractAddress, spender: ContractAddress, token_id: u256
) {
    assert_event_approval(emitter, owner, spender, token_id);
    utils::assert_no_events_left(emitter);
}


//
// Setup
//

const DUEL_ID_1: u256 = 1; // owned by OWNER()
const DUEL_ID_2: u256 = 2; // owned by OTHER()
const DUEL_ID_3: u256 = 3; // owned by BUMMER()
const DUEL_ID_4: u256 = 4; // owned by RECIPIENT()

fn setup(_fee_amount: u128) -> TestSystems {
    let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::FAME | FLAGS::LORDS);

    tester::set_current_season(ref sys, TABLES::TUTORIAL);

    // initialize contracts
    create_duel(@sys, OWNER(), OTHER());
    create_duel(@sys, OTHER(), BUMMER());

    tester::impersonate(OWNER());

    // drop all events
    utils::drop_all_events(sys.world.dispatcher.contract_address);
    utils::drop_all_events(sys.duels.contract_address);

    (sys)
}

fn create_duel(sys: @TestSystems, recipient: ContractAddress, challenged_address: ContractAddress) {
// '---AA'.print();
    tester::impersonate(recipient);
    (*sys.duels).create_duel(
        duelist_id: ID(recipient),
        challenged_address: challenged_address,
        premise: Premise::Honour,
        quote: 'For honour!!!',
        table_id: TABLES::PRACTICE,
        expire_hours: 1,
        lives_staked: 1,
    );
// '---BB'.print();
}

fn _assert_minted_count(sys: @TestSystems, minted_count: u128, msg: ByteArray) {
    let token_config: TokenConfig = (*sys.store).get_token_config(*sys.duels.contract_address);
    assert_eq!(token_config.minted_count, minted_count, "{}", msg);
}

//
// initialize
//

#[test]
fn test_initializer() {
    let sys: TestSystems = setup(0);
    assert_eq!(sys.duels.symbol(), "DUEL", "Symbol is wrong");
    _assert_minted_count(@sys, 2, "Should eq 2");

    assert!(sys.duels.owner_of(DUEL_ID_1).is_non_zero(), "owner_of_1_non_zero");
    assert!(sys.duels.owner_of(DUEL_ID_2).is_non_zero(), "owner_of_2_non_zero");
    assert_eq!(sys.duels.owner_of(DUEL_ID_1), sys.world.game_address(), "owner_of_1");
    assert_eq!(sys.duels.owner_of(DUEL_ID_2), sys.world.game_address(), "owner_of_2");

    assert_ne!(sys.duels.token_uri(DUEL_ID_1), "", "Uri should not be empty");
    assert_ne!(sys.duels.tokenURI(DUEL_ID_1), "", "Uri should not be empty Camel");

    assert!(sys.duels.supports_interface(interface::IERC721_ID), "should support IERC721_ID");
    assert!(sys.duels.supports_interface(interface::IERC721_METADATA_ID), "should support METADATA");
}

#[test]
fn test_token_component() {
    let sys: TestSystems = setup(0);
    // should not panic
    sys.duels.owner_of(DUEL_ID_1);
    sys.duels.is_owner_of(OWNER(), DUEL_ID_1.low);
}

#[test]
fn test_token_uri() {
    let mut sys: TestSystems = setup(0);

    let challenge = Challenge {
        duel_id: DUEL_ID_1.low,
        table_id: TABLES::PRACTICE,
        premise: Premise::Honour,
        quote: 'For honour!!!',
        lives_staked: 1,
        // duelists
        address_a: OWNER(),
        address_b: OTHER()  ,
        duelist_id_a: 1,
        duelist_id_b: 2,
        // progress
        state: ChallengeState::Resolved,
        winner: 1,
        // times
        timestamp_start: 10000,
        timestamp_end:   20000,
    };

    tester::set_Challenge(ref sys.world, @challenge);

    let uri_1 = sys.duels.token_uri(DUEL_ID_1);
    let uri_2 = sys.duels.token_uri(DUEL_ID_2);
    println!("{}", uri_1);
    println!("{}", uri_2);

    assert_gt!(uri_1.len(), 100, "Uri 1 should not be empty");
    assert_gt!(uri_2.len(), 100, "Uri 2 should not be empty");
}

#[test]
#[should_panic(expected: ('ERC721: invalid token ID', 'ENTRYPOINT_FAILED'))]
fn test_token_uri_invalid() {
    let sys: TestSystems = setup(0);
    sys.duels.token_uri(999);
}


//
// approve
//

#[test]
#[ignore] // owned by game now
fn test_approve() {
    let sys: TestSystems = setup(0);

    utils::impersonate(OWNER());

    sys.duels.approve(BUMMER(), DUEL_ID_1);
    assert_eq!(sys.duels.get_approved(DUEL_ID_1), BUMMER(), "Spender not approved correctly");

    // drop StoreSetRecord ERC721TokenApprovalModel
    utils::drop_event(sys.world.dispatcher.contract_address);

    // TODO: fix events
    // // drop StoreSetRecord ERC721TokenApprovalModel
    // utils::drop_event(sys.world.dispatcher.contract_address);
    // assert_only_event_approval(sys.duels.contract_address, OWNER(), BUMMER(), DUEL_ID_1);
    // assert_only_event_approval(sys.world.dispatcher.contract_address, OWNER(), BUMMER(), DUEL_ID_1);
}

//
// transfer_from
//

#[test]
#[ignore] // owned by game now// owned by game now
fn test_transfer_from() {
    let sys: TestSystems = setup(0);

    tester::impersonate(OWNER());
    sys.duels.approve(BUMMER(), DUEL_ID_1);

    utils::drop_all_events(sys.duels.contract_address);
    utils::drop_all_events(sys.world.dispatcher.contract_address);
    utils::assert_no_events_left(sys.duels.contract_address);

    tester::impersonate(BUMMER());
    sys.duels.transfer_from(OWNER(), OTHER(), DUEL_ID_1);

    // TODO: fix events
    // assert_only_event_transfer(sys.duels.contract_address, OWNER(), OTHER(), DUEL_ID_1);

    assert_eq!(sys.duels.balance_of(OTHER()), 2, "Should eq 1");
    assert_eq!(sys.duels.balance_of(OWNER()), 0, "Should eq 1");
    assert_eq!(sys.duels.get_approved(DUEL_ID_1), ZERO(), "Should eq 0");
    _assert_minted_count(@sys, 2, "Should eq 2");
    // assert(sys.duels.total_supply() == 2, 'Should eq 2');
    // assert(sys.duels.token_of_owner_by_index(OTHER(), 1) == DUEL_ID_1, 'Should eq DUEL_ID_1');
}

#[test]
#[should_panic(expected: ('ERC721: unauthorized caller', 'ENTRYPOINT_FAILED'))]
fn test_mint_no_allowance() {
    let sys: TestSystems = setup(0);
    utils::impersonate(BUMMER());
    sys.duels.transfer_from(OWNER(), OTHER(), DUEL_ID_1);
}


//
// mint
//

#[test]
fn test_mint_free() {
    let sys: TestSystems = setup(0);
    _assert_minted_count(@sys, 2, "invalid total_supply init");
    // assert(sys.duels.balance_of(OTHER()) == 1, 'invalid balance_of == 1');
    // assert(sys.duels.token_of_owner_by_index(OTHER(), 0) == DUEL_ID_2, 'token_of_owner_by_index_2');
    create_duel(@sys, BUMMER(), RECIPIENT());
    _assert_minted_count(@sys, 3, "invalid total_supply");
    // assert(sys.duels.balance_of(OTHER()) == 2, 'invalid balance_of == 2');
    // assert(sys.duels.token_of_owner_by_index(OTHER(), 1) == DUEL_ID_3, 'token_of_owner_by_index_3');
}

#[test]
#[ignore] // we dont charge for duels
fn test_mint_lords() {
    let sys: TestSystems = setup(100);
    _assert_minted_count(@sys, 2, "invalid total_supply init");
    // TODO: set allowance
    create_duel(@sys, BUMMER(), RECIPIENT());
    _assert_minted_count(@sys, 3, "invalid total_supply");
}


//
// burn
//

// #[test]
// #[should_panic(expected: ('DUEL: Not implemented', 'ENTRYPOINT_FAILED'))]
// fn test_burn() {
//     let sys: TestSystems = setup(0);
//     _assert_minted_count(@sys, 2, 'invalid total_supply init');
//     // assert(sys.duels.balance_of(OWNER()) == 1, 'invalid balance_of (1)');
//     tester::impersonate(sys.world.game_address());
//     sys.duels.delete_duel(DUEL_ID_1.low);
//     _assert_minted_count(@sys, 1, 'invalid total_supply');
//     // assert(sys.duels.balance_of(OWNER()) == 0, 'invalid balance_of (0)');
// }
