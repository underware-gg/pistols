use starknet::{ContractAddress};
// use dojo::world::{WorldStorage};

use pistols::systems::{
    tokens::{
        tournament_token::{},
    }
};
use pistols::models::{
    // tournament::{Tournament, TournamentTrait},
    tournament::{TournamentSettingsValue, TournamentType, TOURNAMENT_SETTINGS},
};
use tournaments::components::models::game::{TokenMetadata};

// use pistols::interfaces::dns::{DnsTrait};
// use pistols::types::constants::{CONST};
use pistols::tests::tester::{
    tester,
    tester::{
        StoreTrait,
        TestSystems, FLAGS,
        OWNER,
        ITournamentTokenDispatcherTrait,
        IGameTokenDispatcherTrait,
    },
};

use openzeppelin_token::erc721::interface;

//
// Setup
//

const SETTINGS_ID: u32 = TOURNAMENT_SETTINGS::LAST_MAN_STANDING;

const TOKEN_ID_0: u64 = 0;
const TOKEN_ID_1: u64 = 1;
const TOKEN_ID_2: u64 = 2;

const TOURNAMENT_ID_1: u64 = 1000;
const TOURNAMENT_ID_2: u64 = 1001;

const PLAYER_NAME: felt252 = 'Player';


fn setup() -> TestSystems {
    let mut sys: TestSystems = tester::setup_world(FLAGS::TOURNAMENT);

    // drop all events
    tester::drop_all_events(sys.world.dispatcher.contract_address);
    tester::drop_all_events(sys.tournament.contract_address);

    tester::impersonate(OWNER());

    (sys)
}

fn _mint(sys: @TestSystems, recipient: ContractAddress) -> u64 {
    // mint from budokan
    tester::impersonate(*sys.budokan.contract_address);
    // public mint function in the budokan game component
    ((*sys.tournament_game).mint(
        player_name: PLAYER_NAME,
        settings_id: SETTINGS_ID,
        start: Option::None,
        end: Option::None,
        to: recipient,
    ))
}

//
// initialize
//

#[test]
fn test_initializer() {
    let mut sys: TestSystems = setup();
    assert_eq!(sys.tournament.symbol(), "TOURNAMENT", "Symbol is wrong");
    assert!(sys.tournament.supports_interface(interface::IERC721_ID), "should support IERC721_ID");
    assert!(sys.tournament.supports_interface(interface::IERC721_METADATA_ID), "should support METADATA");

    // settings created
    let settings: TournamentSettingsValue = sys.store.get_tournament_settings_value(TOURNAMENT_SETTINGS::LAST_MAN_STANDING);
    assert_eq!(settings.tournament_type, TournamentType::LastManStanding, "Should eq LastManStanding");
    assert_eq!(settings.required_fame, 3000, "Should eq 3000");

    // budokan creator token
    assert_eq!(sys.tournament.total_supply(), 1, "total_supply");
    assert_eq!(sys.tournament.owner_of(TOKEN_ID_0.into()), sys.tournament.contract_address, "owner_of(0)");
    let token_metadata: TokenMetadata = sys.store.get_budokan_token_metadata(TOKEN_ID_0);
    assert_eq!(token_metadata.player_name, 'Creator', "token_metadata.player_name");
    assert_eq!(token_metadata.minted_by, sys.tournament.contract_address, "token_metadata.minted_by");
}

#[test]
fn test_contract_uri() {
    let mut sys: TestSystems = setup();
    let uri: ByteArray = sys.tournament.contract_uri();
    let uri_camel: ByteArray = sys.tournament.contractURI();
    println!("___tournament.contract_uri():{}", uri);
    assert!(tester::starts_with(uri.clone(), "data:"), "contract_uri() should be a json string");
    assert_eq!(uri.clone(), uri_camel.clone(), "uri_camel");
}

#[test]
fn test_token_uri() {
    let mut sys: TestSystems = setup();
    let token_id: u64 = _mint(@sys, OWNER());
    let uri = sys.tournament.token_uri(token_id.into());
    assert_gt!(uri.len(), 100, "Uri 1 should not be empty");
    println!("___tournaments.token_uri(1):{}", uri);
}

#[test]
#[should_panic(expected: ('ERC721: invalid token ID', 'ENTRYPOINT_FAILED'))]
fn test_token_uri_invalid() {
    let mut sys: TestSystems = setup();
    sys.tournament.token_uri(999);
}


//
// mint
//

#[test]
fn test_mint() {
    let mut sys: TestSystems = setup();
    let token_id: u64 = _mint(@sys, OWNER());
    assert_eq!(token_id, TOKEN_ID_1, "token_id");
    assert_eq!(sys.tournament.owner_of(TOKEN_ID_1.into()), OWNER(), "owner_of(1)");
    assert_eq!(sys.tournament.total_supply(), 2, "total_supply");
    // check budokan components created
    let token_metadata: TokenMetadata = sys.store.get_budokan_token_metadata(token_id);
    assert_eq!(token_metadata.minted_by, sys.budokan.contract_address, "token_metadata.minted_by");
    assert_eq!(token_metadata.player_name, PLAYER_NAME, "token_metadata.player_name");
}
