// use starknet::{ContractAddress};
// use dojo::world::{WorldStorage};

use pistols::systems::{
    tokens::{
        tournament_token::{ITournamentTokenDispatcherTrait},
    }
};
use pistols::models::{
    // tournament::{Tournament, TournamentTrait},
    config::{TokenConfig},
};

// use pistols::interfaces::dns::{DnsTrait};
// use pistols::types::constants::{CONST};
use pistols::tests::tester::{
    tester,
    tester::{
        StoreTrait,
        TestSystems, FLAGS,
        OWNER,
    },
};

use nft_combo::erc721::erc721_combo::{ERC721ComboComponent as combo};
use openzeppelin_token::erc721::interface;

//
// Setup
//

const TOKEN_ID_1: u256 = 1;
const TOKEN_ID_2: u256 = 2;
const TOKEN_ID_3: u256 = 3;
const TOKEN_ID_4: u256 = 4;
const TOKEN_ID_5: u256 = 5;

const BUDOKAN_ID_1: u256 = 1000;
const BUDOKAN_ID_2: u256 = 1001;
const BUDOKAN_ID_3: u256 = 1002;
const BUDOKAN_ID_4: u256 = 1003;
const BUDOKAN_ID_5: u256 = 1004;


fn setup(_fee_amount: u128) -> TestSystems {
    let mut sys: TestSystems = tester::setup_world(FLAGS::TOURNAMENT);

    // drop all events
    tester::drop_all_events(sys.world.dispatcher.contract_address);
    tester::drop_all_events(sys.tournament.contract_address);

    tester::impersonate(OWNER());

    (sys)
}

fn _assert_minted_count(sys: @TestSystems, minted_count: u128, msg: ByteArray) {
    let token_config: TokenConfig = (*sys.store).get_token_config((*sys.tournament).contract_address);
    assert_eq!(token_config.minted_count, minted_count, "{}", msg);
}

//
// initialize
//

#[test]
fn test_initializer() {
    let mut sys: TestSystems = setup(0);
    assert_eq!(sys.tournament.symbol(), "TOURNA", "Symbol is wrong");

    _assert_minted_count(@sys, 0, "Should eq 0");

    assert!(sys.tournament.supports_interface(interface::IERC721_ID), "should support IERC721_ID");
    assert!(sys.tournament.supports_interface(interface::IERC721_METADATA_ID), "should support METADATA");
}

#[test]
fn test_contract_uri() {
    let mut sys: TestSystems = setup(0);
    let uri: ByteArray = sys.tournament.contract_uri();
    let uri_camel: ByteArray = sys.tournament.contractURI();
    println!("___tournament.contract_uri():{}", uri);
    assert!(tester::starts_with(uri.clone(), "data:"), "contract_uri() should be a json string");
    assert_eq!(uri.clone(), uri_camel.clone(), "uri_camel");
}

#[test]
#[ignore]
fn test_token_uri() {
    let mut sys: TestSystems = setup(0);

    // let tournament = Tournament {
    //     token_id: TOKEN_ID_1.low,
    //     budokan_id: BUDOKAN_ID_1.low,
    // };
    // tester::set_Tournament(ref sys.world, @tournament);

    let uri = sys.tournament.token_uri(TOKEN_ID_2);
    assert_gt!(uri.len(), 100, "Uri 1 should not be empty");
    println!("___tournaments.token_uri(1):{}", uri);
}

#[test]
#[should_panic(expected: ('ERC721: invalid token ID', 'ENTRYPOINT_FAILED'))]
fn test_token_uri_invalid() {
    let mut sys: TestSystems = setup(0);
    sys.tournament.token_uri(999);
}


//
// mint
//

// #[test]
// // #[should_panic(expected: ('TOKEN: caller is not minter', 'ENTRYPOINT_FAILED'))] // for Dojo contracts
// // #[should_panic(expected: ('ENTRYPOINT_NOT_FOUND', 'ENTRYPOINT_FAILED', 'ENTRYPOINT_FAILED'))] // for accounts
// #[should_panic(expected: ('CONTRACT_NOT_DEPLOYED', 'ENTRYPOINT_FAILED', 'ENTRYPOINT_FAILED'))] // for random addresses
// fn test_mint_duelist_not_minter() {
//     let mut sys: TestSystems = setup(0);
//     // let account: ContractAddress = tester::deploy_mock_account();
//     // tester::impersonate(account);
//     sys.duelists.mint_duelists(OWNER(), 1, 0x1234);
// }



//---------------------------------
// metadata_update
//
#[test]
fn test_update_contract_metadata() {
    let mut sys: TestSystems = setup(0);
    tester::drop_all_events(sys.tournament.contract_address);
    sys.tournament.update_contract_metadata();
    let _event = tester::pop_log::<combo::ContractURIUpdated>(sys.tournament.contract_address, selector!("ContractURIUpdated")).unwrap();
}
#[test]
fn test_update_token_metadata() {
    let mut sys: TestSystems = setup(0);
    tester::drop_all_events(sys.tournament.contract_address);
    sys.tournament.update_token_metadata(TOKEN_ID_1.low);
    let event = tester::pop_log::<combo::MetadataUpdate>(sys.tournament.contract_address, selector!("MetadataUpdate")).unwrap();
    assert_eq!(event.token_id, TOKEN_ID_1.into(), "event.token_id");
}
#[test]
fn test_update_tokens_metadata() {
    let mut sys: TestSystems = setup(0);
    tester::drop_all_events(sys.tournament.contract_address);
    sys.tournament.update_tokens_metadata(TOKEN_ID_1.low, TOKEN_ID_2.low);
    let event = tester::pop_log::<combo::BatchMetadataUpdate>(sys.tournament.contract_address, selector!("BatchMetadataUpdate")).unwrap();
    assert_eq!(event.from_token_id, TOKEN_ID_1.into(), "event.from_token_id");
    assert_eq!(event.to_token_id, TOKEN_ID_2.into(), "event.to_token_id");
}
