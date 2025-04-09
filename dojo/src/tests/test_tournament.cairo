use starknet::{ContractAddress};
// use dojo::world::{WorldStorage};
use dojo::model::{ModelStorageTest};

use pistols::systems::{
    tokens::{
        tournament_token::{},
    }
};
use pistols::models::{
    tournament::{Tournament, TournamentRound},
    tournament::{TOURNAMENT_SETTINGS},
};
// use pistols::interfaces::dns::{DnsTrait};
use pistols::utils::short_string::{ShortStringTrait};
use pistols::utils::math::{MathTrait};
use pistols::types::timestamp::{TIMESTAMP};
// use pistols::types::constants::{CONST};

use pistols::tests::tester::{
    tester,
    tester::{
        StoreTrait,
        TestSystems, FLAGS,
        ID, OWNER, OTHER,
        ITournamentTokenDispatcherTrait,
    },
};
// use pistols::systems::tokens::budokan_mock::budokan_mock::{TOURNAMENT_ID_1, TOURNAMENT_ID_2};

use tournaments::components::{
    models::{
        game::{TokenMetadata},
        lifecycle::{Lifecycle},
    },
    libs::{
        lifecycle::{LifecycleTrait},
    },
};


//
// Setup
//

pub const SETTINGS_ID: u32 = TOURNAMENT_SETTINGS::LAST_MAN_STANDING;

pub const ENTRY_ID_0: u64 = 0;  // creator
pub const ENTRY_ID_1: u64 = 1;
pub const ENTRY_ID_2: u64 = 2;
pub const ENTRY_ID_3: u64 = 3;
pub const ENTRY_ID_4: u64 = 4;

pub const PLAYER_NAME: felt252 = 'Player';
pub const TIMESTAMP_START: u64 = (tester::INITIAL_TIMESTAMP + TIMESTAMP::ONE_DAY);
pub const TIMESTAMP_END: u64 = (TIMESTAMP_START + (TIMESTAMP::ONE_DAY * 7));


fn _mint(ref sys: TestSystems, recipient: ContractAddress) -> u64 {
    let total_supply: u64 = sys.tournament.total_supply().try_into().unwrap();
    let player_name: felt252 = ShortStringTrait::concat('Player', total_supply.to_short_string());
    // mint from budokan
    let caller: ContractAddress = tester::get_impersonator();
    tester::impersonate(sys.budokan.contract_address);
    // public mint function in the budokan game component
    let token_id: u64 = sys.tournament.mint(
        player_name,
        settings_id: SETTINGS_ID,
        start: Option::None,
        end: Option::None,
        to: recipient,
    );
    assert_eq!(token_id, total_supply, "bad token_id");
    // Create metadata
    let token_metadata: TokenMetadata = TokenMetadata {
        token_id,
        player_name,
        minted_by: sys.budokan.contract_address,
        settings_id: SETTINGS_ID,
        lifecycle: Lifecycle {
            mint: 1,
            start: Option::Some(TIMESTAMP_START),
            end: Option::Some(TIMESTAMP_END),
        },
    };
    sys.world.write_model_test(@token_metadata);
    tester::impersonate(caller);
    (token_id)
}

//--------------------------------
// start tournament
//

#[test]
fn test_lifecycle() {
    let mut sys: TestSystems = tester::setup_world(FLAGS::TOURNAMENT);
    _mint(ref sys, OWNER()); // ENTRY_ID_1
    // mint phase
    let token_metadata: TokenMetadata = sys.store.get_budokan_token_metadata(ENTRY_ID_1);
    assert!(token_metadata.lifecycle.mint > 0);
    assert!(token_metadata.lifecycle.start.is_some());
    assert!(token_metadata.lifecycle.end.is_some());
    assert!(!token_metadata.lifecycle.can_start(tester::get_block_timestamp()), "phase 0.can_start");
    assert!(!token_metadata.lifecycle.is_playable(tester::get_block_timestamp()), "phase 0.is_playable");
    assert!(!token_metadata.lifecycle.has_expired(tester::get_block_timestamp()), "phase 0.has_expired");
    // start phase
    tester::set_block_timestamp(TIMESTAMP_START);
    assert!(token_metadata.lifecycle.can_start(tester::get_block_timestamp()), "phase 1.can_start");
    assert!(token_metadata.lifecycle.is_playable(tester::get_block_timestamp()), "phase 1.is_playable");
    assert!(!token_metadata.lifecycle.has_expired(tester::get_block_timestamp()), "phase 1.has_expired");
    // end phase
    tester::set_block_timestamp(TIMESTAMP_END);
    assert!(token_metadata.lifecycle.can_start(tester::get_block_timestamp()), "phase 2.can_start");
    assert!(!token_metadata.lifecycle.is_playable(tester::get_block_timestamp()), "phase 2.is_playable");
    assert!(token_metadata.lifecycle.has_expired(tester::get_block_timestamp()), "phase 2.has_expired");
}

#[test] 
fn test_start_tournament() {
    let mut sys: TestSystems = tester::setup_world(FLAGS::TOURNAMENT);
    _mint(ref sys, OWNER()); // ENTRY_ID_1
    assert!(!sys.tournament.can_start_tournament(ENTRY_ID_1), "can_start() false");
    // time travel
    tester::set_block_timestamp(TIMESTAMP_START);
    assert!(sys.tournament.can_start_tournament(ENTRY_ID_1), "can_start() true");
    let tournament_id: u64 = tester::execute_start_tournament(@sys, OWNER(), ENTRY_ID_1);
    assert!(tournament_id > 0, "tournament_id");
    let tournament: Tournament = sys.store.get_tournament(tournament_id);
    assert_eq!(tournament.round_number, 1);
    let round: TournamentRound = sys.store.get_tournament_round(tournament_id, 1);
    assert_ne!(round.bracket, 0);
    assert_eq!(round.results, 0);
    // end state
    assert!(!sys.tournament.can_start_tournament(ENTRY_ID_1), "can_start() started");
    assert_eq!(sys.tournament.get_tournament_id(ENTRY_ID_1), tournament_id, "get_tournament_id()");
}

#[test] 
fn test_start_tournament_other_ok() {
    let mut sys: TestSystems = tester::setup_world(FLAGS::TOURNAMENT);
    _mint(ref sys, OWNER()); // ENTRY_ID_1
    tester::set_block_timestamp(TIMESTAMP_START);
    let tournament_id: u64 = tester::execute_start_tournament(@sys, OTHER(), ENTRY_ID_1);
    assert!(tournament_id > 0, "tournament_id");
}

#[test]
#[should_panic(expected: ('TOURNAMENT: Invalid entry', 'ENTRYPOINT_FAILED'))]
fn test_start_tournament_invalid_entry() {
    let mut sys: TestSystems = tester::setup_world(FLAGS::TOURNAMENT);
    let _tournament_id: u64 = tester::execute_start_tournament(@sys, OWNER(), ENTRY_ID_1);
}

#[test]
#[should_panic(expected: ('TOURNAMENT: Not startable', 'ENTRYPOINT_FAILED'))]
fn test_start_tournament_not_startable() {
    let mut sys: TestSystems = tester::setup_world(FLAGS::TOURNAMENT);
    _mint(ref sys, OWNER()); // ENTRY_ID_1
    let _tournament_id: u64 = tester::execute_start_tournament(@sys, OWNER(), ENTRY_ID_1);
}

#[test]
#[should_panic(expected: ('TOURNAMENT: Already started', 'ENTRYPOINT_FAILED'))]
fn test_start_tournament_already_started() {
    let mut sys: TestSystems = tester::setup_world(FLAGS::TOURNAMENT);
    _mint(ref sys, OWNER()); // ENTRY_ID_1
    tester::set_block_timestamp(TIMESTAMP_START);
    let _tournament_id: u64 = tester::execute_start_tournament(@sys, OWNER(), ENTRY_ID_1);
    let _tournament_id: u64 = tester::execute_start_tournament(@sys, OWNER(), ENTRY_ID_1);
}


//--------------------------------
// enlist duelist
//

#[test]
fn test_enlist_duelist() {
    let mut sys: TestSystems = tester::setup_world(FLAGS::TOURNAMENT);
    let entry_id_1: u64 = _mint(ref sys, OWNER());
    assert!(sys.tournament.can_enlist_duelist(entry_id_1, ID(OWNER())));
    tester::execute_enlist_duelist(@sys, OWNER(), entry_id_1, ID(OWNER()));
    // another...
    tester::impersonate(OTHER());
    let entry_id_2: u64 = _mint(ref sys, OTHER());
    assert!(sys.tournament.can_enlist_duelist(entry_id_2, ID(OTHER())));
    sys.tournament.enlist_duelist(entry_id_2, ID(OTHER()));
}

#[test]
#[should_panic(expected: ('TOURNAMENT: Not your entry', 'ENTRYPOINT_FAILED'))]
fn test_enlist_duelist_not_your_entry() {
    let mut sys: TestSystems = tester::setup_world(FLAGS::TOURNAMENT);
    let entry_id_1: u64 = _mint(ref sys, OWNER());
    assert!(!sys.tournament.can_enlist_duelist(entry_id_1 + 1, ID(OWNER())));
    sys.tournament.enlist_duelist(entry_id_1 + 1, ID(OWNER()));
}

#[test]
#[should_panic(expected: ('TOURNAMENT: Not your duelist', 'ENTRYPOINT_FAILED'))]
fn test_enlist_duelist_not_your_duelist() {
    let mut sys: TestSystems = tester::setup_world(FLAGS::TOURNAMENT);
    let entry_id_1: u64 = _mint(ref sys, OWNER());
    assert!(!sys.tournament.can_enlist_duelist(entry_id_1, ID(OTHER())));
    sys.tournament.enlist_duelist(entry_id_1, ID(OTHER()));
}

#[test]
#[should_panic(expected: ('TOURNAMENT: Already enlisted', 'ENTRYPOINT_FAILED'))]
fn test_enlist_duelist_already_enlisted() {
    let mut sys: TestSystems = tester::setup_world(FLAGS::TOURNAMENT);
    let entry_id_1: u64 = _mint(ref sys, OWNER());
    assert!(sys.tournament.can_enlist_duelist(entry_id_1, ID(OWNER())));
    sys.tournament.enlist_duelist(entry_id_1, ID(OWNER()));
    assert!(!sys.tournament.can_enlist_duelist(entry_id_1, ID(OWNER())));
    sys.tournament.enlist_duelist(entry_id_1, ID(OWNER()));
}
