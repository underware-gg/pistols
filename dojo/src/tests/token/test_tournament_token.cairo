use starknet::{ContractAddress};
// use dojo::world::{WorldStorage};

use pistols::systems::tokens::{
    tournament_token::{ITournamentTokenProtectedDispatcher, ITournamentTokenProtectedDispatcherTrait},
};
use pistols::models::{
    tournament::{
        // Tournament, TournamentTrait,
        // TournamentType,
        TournamentRules,
        TOURNAMENT_RULES,
    },
};
// use pistols::interfaces::dns::{DnsTrait};
// use pistols::types::constants::{CONST};

use pistols::tests::tester::{
    tester,
    tester::{
        StoreTrait,
        TestSystems, FLAGS,
        OWNER, OTHER,
        ITournamentTokenDispatcherTrait,
    },
};
// use pistols::systems::tokens::budokan_mock::budokan_mock::{TOURNAMENT_OF_1, TOURNAMENT_OF_2};

use openzeppelin_token::erc721::interface;
use tournaments::components::interfaces::{IGameTokenDispatcher, IGameTokenDispatcherTrait};
use tournaments::components::models::game::{TokenMetadata};

//
// Setup
//

const SETTINGS_ID: u32 = TOURNAMENT_RULES::LastManStanding.settings_id;

const ENTRY_ID_0: u64 = 0;
const ENTRY_ID_1: u64 = 1;
const ENTRY_ID_2: u64 = 2;

const PLAYER_NAME: felt252 = 'Player';


fn setup() -> TestSystems {
    let mut sys: TestSystems = tester::setup_world(FLAGS::TOURNAMENT);

    // drop all events
    tester::drop_all_events(sys.world.dispatcher.contract_address);
    tester::drop_all_events(sys.tournaments.contract_address);

    tester::impersonate(OWNER());

    (sys)
}

fn _mint(sys: @TestSystems, recipient: ContractAddress) -> u64 {
    // mint from budokan
    tester::impersonate(*sys.budokan.contract_address);
    // public mint function in the budokan game component
    (_game_token(sys).mint(
        player_name: PLAYER_NAME,
        settings_id: SETTINGS_ID,
        start: Option::None,
        end: Option::None,
        to: recipient,
    ))
}

pub fn _protected(sys: @TestSystems) -> ITournamentTokenProtectedDispatcher {
    (ITournamentTokenProtectedDispatcher{contract_address: (*sys.tournaments).contract_address})
}

pub fn _game_token(sys: @TestSystems) -> IGameTokenDispatcher {
    (IGameTokenDispatcher{contract_address: (*sys.tournaments).contract_address})
}

use tournaments::components::interfaces::{ISettingsDispatcher, ISettingsDispatcherTrait};
pub fn _budokan_settings_interface(sys: @TestSystems) -> ISettingsDispatcher {
    (ISettingsDispatcher{contract_address: (*sys.tournaments).contract_address})
}

//
// initialize
//

#[test]
fn test_initializer() {
    let mut sys: TestSystems = setup();
    assert_eq!(sys.tournaments.symbol(), "TOURNAMENT", "Symbol is wrong");
    assert!(sys.tournaments.supports_interface(interface::IERC721_ID), "should support IERC721_ID");
    assert!(sys.tournaments.supports_interface(interface::IERC721_METADATA_ID), "should support METADATA");

    // budokan hooks
    assert!(_budokan_settings_interface(@sys).setting_exists(1), "setting_exists(1)");
    assert!(_budokan_settings_interface(@sys).setting_exists(2), "setting_exists(2)");
    assert!(!_budokan_settings_interface(@sys).setting_exists(999), "setting_exists(999)");

    let rules: TournamentRules = sys.store.get_tournament_settings_rules(1);
    assert_eq!(rules.settings_id, 1, "LastManStanding.settings_id");
    assert_gt!(rules.lives_staked, 0, "LastManStanding.lives_staked");
    let rules: TournamentRules = sys.store.get_tournament_settings_rules(2);
    assert_eq!(rules.settings_id, 2, "BestOfThree.settings_id");
    assert_gt!(rules.lives_staked, 0, "BestOfThree.lives_staked");
    let rules: TournamentRules = sys.store.get_tournament_settings_rules(999);
    assert_eq!(rules.settings_id, 0, "Undefined.settings_id");
    assert_eq!(rules.lives_staked, 0, "Undefined.lives_staked");

    // budokan creator token
    assert_eq!(sys.tournaments.total_supply(), 1, "total_supply");
    assert_eq!(sys.tournaments.owner_of(ENTRY_ID_0.into()), sys.tournaments.contract_address, "owner_of(0)");
    assert!(sys.tournaments.is_owner_of(sys.tournaments.contract_address, ENTRY_ID_0.into()), "is_owner_of(0)");
    let token_metadata: TokenMetadata = sys.store.get_budokan_token_metadata(ENTRY_ID_0);
    assert_eq!(token_metadata.player_name, 'Creator', "token_metadata.player_name");
    assert_eq!(token_metadata.minted_by, sys.tournaments.contract_address, "token_metadata.minted_by");
}

#[test]
fn test_contract_uri() {
    let mut sys: TestSystems = setup();
    let uri: ByteArray = sys.tournaments.contract_uri();
    let uri_camel: ByteArray = sys.tournaments.contractURI();
    println!("___tournament.contract_uri():{}", uri);
    assert!(tester::starts_with(uri.clone(), "data:"), "contract_uri() should be a json string");
    assert_eq!(uri.clone(), uri_camel.clone(), "uri_camel");
}

#[test]
fn test_token_uri() {
    let mut sys: TestSystems = setup();
    let token_id: u64 = _mint(@sys, OWNER());
    let uri = sys.tournaments.token_uri(token_id.into());
    assert_gt!(uri.len(), 100, "Uri 1 should not be empty");
    println!("___tournaments.token_uri(1):{}", uri);
}

#[test]
#[should_panic(expected: ('ERC721: invalid token ID', 'ENTRYPOINT_FAILED'))]
fn test_token_uri_invalid() {
    let mut sys: TestSystems = setup();
    sys.tournaments.token_uri(999);
}


//
// mint
//

#[test]
fn test_mint() {
    let mut sys: TestSystems = setup();
    let token_id: u64 = _mint(@sys, OWNER());
    assert_eq!(token_id, ENTRY_ID_1, "token_id");
    assert_eq!(sys.tournaments.owner_of(ENTRY_ID_1.into()), OWNER(), "owner_of(1)");
    assert!(sys.tournaments.is_owner_of(OWNER(), ENTRY_ID_1.into()), "is_owner_of(1)");
    assert_eq!(sys.tournaments.total_supply(), 2, "total_supply");
    // check budokan components created
    let token_metadata: TokenMetadata = sys.store.get_budokan_token_metadata(token_id);
    assert_eq!(token_metadata.minted_by, sys.budokan.contract_address, "token_metadata.minted_by");
    assert_eq!(token_metadata.player_name, PLAYER_NAME, "token_metadata.player_name");
}

//---------------------------------
// protected calls
//

#[test]
fn test_create_settings() {
    let mut sys: TestSystems = setup();
    _protected(@sys).create_settings();
    // no panic!
}

#[test]
#[should_panic(expected: ('TOURNAMENT: Caller not owner', 'ENTRYPOINT_FAILED'))]
fn test_create_settings_not_owner() {
    let mut sys: TestSystems = setup();
    tester::impersonate(OTHER());
    _protected(@sys).create_settings();
}

