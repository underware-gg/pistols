use core::num::traits::Zero;
use starknet::{ContractAddress};

use pistols::interfaces::dns::{DnsTrait};
use pistols::systems::{
    tokens::{
        duel_token::{IDuelTokenDispatcherTrait},
    },
};
use pistols::models::{
    challenge::{Challenge, DuelType},
    duelist::{
        Duelist,
        DuelistProfile, GenesisKey, BotKey,
        DuelistTimestamps,
    },
    config::{TokenConfig},
};
use pistols::types::{
    challenge_state::{ChallengeState},
    premise::{Premise},
    timestamp::{Period},
};

use pistols::tests::tester::{tester,
    tester::{
        StoreTrait,
        TestSystems, FLAGS,
        ID, OWNER, OTHER, BUMMER, RECIPIENT, ZERO, SEASON_ID_1, MESSAGE,
    },
};

use nft_combo::erc721::erc721_combo::{ERC721ComboComponent as combo};
use openzeppelin_token::erc721::interface;


//
// Setup
//

const DUEL_ID_1: u256 = 1; // owned by OWNER()
const DUEL_ID_2: u256 = 2; // owned by OTHER()
const DUEL_ID_3: u256 = 3; // owned by BUMMER()
const DUEL_ID_4: u256 = 4; // owned by RECIPIENT()

fn setup(_fee_amount: u128) -> TestSystems {
    let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::FAME | FLAGS::LORDS);
    tester::set_current_season(ref sys, SEASON_ID_1);

    // initialize contracts
    create_duel(@sys, OWNER(), OTHER());
    create_duel(@sys, OTHER(), BUMMER());
    
    // drop all events
    tester::drop_all_events(sys.world.dispatcher.contract_address);
    tester::drop_all_events(sys.duels.contract_address);

    tester::impersonate(OWNER());

    (sys)
}

fn create_duel(sys: @TestSystems, recipient: ContractAddress, challenged_address: ContractAddress) {
// println!("---AA");
    tester::impersonate(recipient);
    (*sys.duels).create_duel(
        duel_type: DuelType::Practice,
        duelist_id: ID(recipient),
        challenged_address: challenged_address,
        lives_staked: 0,
        expire_minutes: 60,
        premise: Premise::Honour,
        message: MESSAGE(),
    );
// println!("---BB");
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
    sys.duels.is_owner_of(OWNER(), DUEL_ID_1);
}

#[test]
fn test_contract_uri() {
    let mut sys: TestSystems = setup(0);
    let uri: ByteArray = sys.duels.contract_uri();
    let uri_camel: ByteArray = sys.duels.contractURI();
    println!("___duels.contract_uri():{}", uri);
    assert!(tester::starts_with(uri.clone(), "data:"), "contract_uri() should be a json string");
    assert_eq!(uri.clone(), uri_camel.clone(), "uri_camel");
}

#[test]
fn test_token_uri() {
    let mut sys: TestSystems = setup(0);

    let duelist_a: Duelist = Duelist {
        duelist_id: ID(OWNER()),
        duelist_profile: DuelistProfile::Genesis(GenesisKey::LadyVengeance),
        timestamps: DuelistTimestamps {
            registered: 999999,
            active: 0,
        },
        totals: Default::default(),
        released_fame: false,
    };
    let duelist_b: Duelist = Duelist {
        duelist_id: ID(OTHER()),
        duelist_profile: DuelistProfile::Bot(BotKey::Leon),
        timestamps: DuelistTimestamps {
            registered: 999999,
            active: 999999,
        },
        totals: Default::default(),
        released_fame: false,
    };
    let challenge: Challenge = Challenge {
        duel_id: DUEL_ID_1.low,
        duel_type: DuelType::Practice,
        premise: Premise::Honour,
        lives_staked: 1,
        // duelists
        address_a: OWNER(),
        address_b: OTHER()  ,
        duelist_id_a: ID(OWNER()),
        duelist_id_b: ID(OTHER()),
        // progress
        state: ChallengeState::Resolved,
        season_id: 0,
        winner: 1,
        // times
        timestamps: Period {
            start: 10000,
            end: 20000,
        },
    };

    tester::set_Duelist(ref sys.world, @duelist_a);
    tester::set_Duelist(ref sys.world, @duelist_b);
    tester::set_Challenge(ref sys.world, @challenge);

    let uri_1 = sys.duels.token_uri(DUEL_ID_1);
    let uri_2 = sys.duels.token_uri(DUEL_ID_2);
    println!("___duels.token_uri(1):{}", uri_1);
    println!("___duels.token_uri(2):{}", uri_2);

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

    tester::impersonate(OWNER());

    sys.duels.approve(BUMMER(), DUEL_ID_1);
    assert_eq!(sys.duels.get_approved(DUEL_ID_1), BUMMER(), "Spender not approved correctly");

    // test events
    tester::assert_only_event_approval(sys.duels.contract_address, OWNER(), BUMMER(), DUEL_ID_1);
}

//
// transfer_from
//

#[test]
#[ignore] // owned by game now
fn test_transfer_from() {
    let sys: TestSystems = setup(0);

    tester::impersonate(OWNER());
    sys.duels.approve(BUMMER(), DUEL_ID_1);

    tester::drop_all_events(sys.duels.contract_address);
    tester::drop_all_events(sys.world.dispatcher.contract_address);
    tester::assert_no_events_left(sys.duels.contract_address);

    tester::impersonate(BUMMER());
    sys.duels.transfer_from(OWNER(), OTHER(), DUEL_ID_1);

    // test events
    tester::assert_only_event_transfer(sys.duels.contract_address, OWNER(), OTHER(), DUEL_ID_1);

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
    tester::impersonate(BUMMER());
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


//---------------------------------
// metadata_update
//
#[test]
fn test_update_contract_metadata() {
    let mut sys: TestSystems = setup(0);
    tester::drop_all_events(sys.duels.contract_address);
    sys.duels.update_contract_metadata();
    let _event = tester::pop_log::<combo::ContractURIUpdated>(sys.duels.contract_address, selector!("ContractURIUpdated")).unwrap();
}
#[test]
fn test_update_token_metadata() {
    let mut sys: TestSystems = setup(0);
    tester::drop_all_events(sys.duels.contract_address);
    sys.duels.update_token_metadata(DUEL_ID_1.low);
    let event = tester::pop_log::<combo::MetadataUpdate>(sys.duels.contract_address, selector!("MetadataUpdate")).unwrap();
    assert_eq!(event.token_id, DUEL_ID_1.into(), "event.token_id");
}
// #[test]
// fn test_update_tokens_metadata() {
//     let mut sys: TestSystems = setup(0);
//     tester::drop_all_events(sys.duels.contract_address);
//     sys.duels.update_tokens_metadata(DUEL_ID_1.low, DUEL_ID_2.low);
//     let event = tester::pop_log::<combo::BatchMetadataUpdate>(sys.duels.contract_address, selector!("BatchMetadataUpdate")).unwrap();
//     assert_eq!(event.from_token_id, DUEL_ID_1.into(), "event.from_token_id");
//     assert_eq!(event.to_token_id, DUEL_ID_2.into(), "event.to_token_id");
// }
