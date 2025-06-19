use starknet::{ContractAddress};
// use dojo::world::{WorldStorage, IWorldDispatcherTrait};
use pistols::systems::{
    admin::{IAdminDispatcherTrait},
    tokens::{
        ring_token::{IRingTokenDispatcherTrait},
    },
};
use pistols::models::{
    challenge::{ChallengeValue, RoundValue, DuelType},
    ring::{Ring, RingType, RingTypeTrait},
};
use pistols::types::{
    challenge_state::{ChallengeState},
};

// use pistols::interfaces::dns::{DnsTrait};
// use pistols::types::constants::{CONST};
use pistols::tests::tester::{
    tester,
    tester::{
        StoreTrait,
        TestSystems, FLAGS,
        OWNER, OTHER, BUMMER, SPENDER,
        SEASON_ID_1, SEASON_ID_2, SEASON_ID_3, SEASON_ID_4, SEASON_ID_5,
    },
};
use pistols::tests::prefabs::{prefabs};

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


fn setup(flags: u16) -> TestSystems {
    let mut sys: TestSystems = tester::setup_world(flags);

    tester::set_current_season(ref sys, SEASON_ID_1);

    // drop all events
    tester::drop_all_events(sys.world.dispatcher.contract_address);
    tester::drop_all_events(sys.rings.contract_address);

    tester::impersonate(OWNER());

    (sys)
}

fn _make_challenge(ref sys: TestSystems, address_a: ContractAddress, address_b: ContractAddress, season_id: u32) -> u128 {
    tester::set_current_season(ref sys, season_id);
    let (mocked, moves_a, moves_b) = prefabs::get_moves_dual_miss();
    let duel_id = prefabs::start_new_challenge(@sys, address_a, address_b, DuelType::Practice, 1);
    let (challenge, _round): (ChallengeValue, RoundValue) = prefabs::commit_reveal_get(@sys, duel_id, address_a, address_b, mocked, moves_a, moves_b);
    assert_eq!(challenge.state, ChallengeState::Draw, "bad state");
    assert_eq!(challenge.season_id, season_id, "bad season_id");
    (duel_id)
}

//
// initialize
//

#[test]
fn test_initializer() {
    let mut sys: TestSystems = setup(FLAGS::RINGS);
    assert_eq!(sys.rings.symbol(), "RING", "Symbol is wrong");
    assert!(sys.rings.supports_interface(interface::IERC721_ID), "should support IERC721_ID");
    assert!(sys.rings.supports_interface(interface::IERC721_METADATA_ID), "should support METADATA");
}

#[test]
fn test_contract_uri() {
    let mut sys: TestSystems = setup(FLAGS::RINGS);
    let uri: ByteArray = sys.rings.contract_uri();
    let uri_camel: ByteArray = sys.rings.contractURI();
    println!("___rings.contract_uri():{}", uri);
    assert!(tester::starts_with(uri.clone(), "data:"), "contract_uri() should be a json string");
    assert_eq!(uri.clone(), uri_camel.clone(), "uri_camel");
}

#[test]
fn test_token_uri() {
    let mut sys: TestSystems = setup(FLAGS::RINGS | FLAGS::ADMIN);
    tester::execute_airdrop_ring(@sys, OWNER(), OWNER(), RingType::GoldSignetRing);
    let uri = sys.rings.token_uri(TOKEN_ID_1);
    assert_gt!(uri.len(), 100, "Uri 1 should not be empty");
    println!("___rings.token_uri(1):{}", uri);
}

#[test]
#[should_panic(expected: ('ERC721: invalid token ID', 'ENTRYPOINT_FAILED'))]
fn test_token_uri_invalid() {
    let mut sys: TestSystems = setup(FLAGS::RINGS);
    sys.rings.token_uri(999);
}


//
// mint
//

#[test]
fn test_claim_ok() {
    let mut sys: TestSystems = setup(FLAGS::RINGS | FLAGS::GAME | FLAGS::MOCK_RNG);
    assert_eq!(sys.rings.total_supply(), 0, "total_supply 0");
    assert_eq!(sys.rings.balance_of(OWNER()), 0, "balance_of(OWNER) 0");
    assert_eq!(sys.rings.balance_of(OTHER()), 0, "balance_of(OTHER) 0");
    assert_eq!(sys.rings.balance_of(BUMMER()), 0, "balance_of(BUMMER) 0");
    assert_eq!(sys.rings.balance_of_ring(OWNER(), RingType::GoldSignetRing), 0, "balance_of_ring(OWNER, GoldSignetRing) 0");
    assert_eq!(sys.rings.balance_of_ring(OTHER(), RingType::GoldSignetRing), 0, "balance_of_ring(OTHER, GoldSignetRing) 0");
    assert_eq!(sys.rings.balance_of_ring(BUMMER(), RingType::GoldSignetRing), 0, "balance_of_ring(BUMMER, GoldSignetRing) 0");
    assert_eq!(sys.rings.balance_of_ring(OWNER(), RingType::SilverSignetRing), 0, "balance_of_ring(OWNER, SilverSignetRing) 0");
    assert_eq!(sys.rings.balance_of_ring(OTHER(), RingType::SilverSignetRing), 0, "balance_of_ring(OTHER, SilverSignetRing) 0");
    assert_eq!(sys.rings.balance_of_ring(BUMMER(), RingType::SilverSignetRing), 0, "balance_of_ring(BUMMER, SilverSignetRing) 0");
    //
    // Season 1
    assert!(!sys.rings.has_claimed(OWNER(), RingType::GoldSignetRing), "has_claimed(OWNER, GoldSignetRing, S1) init");
    assert!(!sys.rings.has_claimed(OTHER(), RingType::GoldSignetRing), "has_claimed(OTHER, GoldSignetRing, S1) init");
    assert!(!sys.rings.has_claimed(BUMMER(), RingType::GoldSignetRing), "has_claimed(BUMMER, GoldSignetRing, S1) init");
    assert!(sys.rings.get_claimable_season_ring_type(OWNER(), 1).is_none(), "get_claimable_season_ring_type(OWNER, S1) init");
    assert!(sys.rings.get_claimable_season_ring_type(OTHER(), 1).is_none(), "get_claimable_season_ring_type(OTHER, S1) init");
    assert!(sys.rings.get_claimable_season_ring_type(BUMMER(), 1).is_none(), "get_claimable_season_ring_type(BUMMER, S1) init");
    let duel_id: u128 = _make_challenge(ref sys, OWNER(), OTHER(), SEASON_ID_1);
    assert_eq!(duel_id, 1, "bad duel_id");
    assert_eq!(sys.rings.get_claimable_season_ring_type(OWNER(), duel_id).unwrap(), RingType::GoldSignetRing, "get_claimable_season_ring_type(OWNER, S1) YES");
    assert_eq!(sys.rings.get_claimable_season_ring_type(OTHER(), duel_id).unwrap(), RingType::GoldSignetRing, "get_claimable_season_ring_type(OTHER, S1) YES");
    assert!(sys.rings.get_claimable_season_ring_type(BUMMER(), duel_id).is_none(), "get_claimable_season_ring_type(BUMMER, S1) > NO");
    tester::execute_claim_season_ring(@sys, OWNER(), duel_id, RingType::GoldSignetRing);
    tester::execute_claim_season_ring(@sys, OTHER(), duel_id, RingType::GoldSignetRing);
    assert!(sys.rings.has_claimed(OWNER(), RingType::GoldSignetRing), "has_claimed(OWNER, GoldSignetRing, S1) YES");
    assert!(sys.rings.has_claimed(OTHER(), RingType::GoldSignetRing), "has_claimed(OTHER, GoldSignetRing, S1) YES");
    assert!(!sys.rings.has_claimed(BUMMER(), RingType::GoldSignetRing), "has_claimed(BUMMER, GoldSignetRing, S1) NO");
    assert!(sys.rings.get_claimable_season_ring_type(OWNER(), duel_id).is_none(), "get_claimable_season_ring_type(OWNER, S1) > None");
    assert!(sys.rings.get_claimable_season_ring_type(OTHER(), duel_id).is_none(), "get_claimable_season_ring_type(OTHER, S1) > None");
    assert!(sys.rings.get_claimable_season_ring_type(BUMMER(), duel_id).is_none(), "get_claimable_season_ring_type(BUMMER, S1) > None");
    // balances
    assert_eq!(sys.rings.total_supply(), 2, "total_supply 2");
    assert_eq!(sys.rings.balance_of(OWNER()), 1, "balance_of(OWNER) 1");
    assert_eq!(sys.rings.balance_of(OTHER()), 1, "balance_of(OTHER) 1");
    assert_eq!(sys.rings.balance_of(BUMMER()), 0, "balance_of(BUMMER) 0");
    assert_eq!(sys.rings.balance_of_ring(OWNER(), RingType::GoldSignetRing), 1, "balance_of_ring(OWNER, GoldSignetRing, S1) 1");
    assert_eq!(sys.rings.balance_of_ring(OTHER(), RingType::GoldSignetRing), 1, "balance_of_ring(OTHER, GoldSignetRing, S1) 1");
    assert_eq!(sys.rings.balance_of_ring(BUMMER(), RingType::GoldSignetRing), 0, "balance_of_ring(BUMMER, GoldSignetRing, S1) 0");
    assert_eq!(sys.rings.balance_of_ring(OWNER(), RingType::SilverSignetRing), 0, "balance_of_ring(OWNER, SilverSignetRing, S1) 0");
    assert_eq!(sys.rings.balance_of_ring(OTHER(), RingType::SilverSignetRing), 0, "balance_of_ring(OTHER, SilverSignetRing, S1) 0");
    assert_eq!(sys.rings.balance_of_ring(BUMMER(), RingType::SilverSignetRing), 0, "balance_of_ring(BUMMER, SilverSignetRing, S1) 0");
    //
    // Season 2
    let duel_id: u128 = _make_challenge(ref sys, OWNER(), BUMMER(), SEASON_ID_2);
    assert!(sys.rings.get_claimable_season_ring_type(OWNER(), duel_id).is_none(), "get_claimable_season_ring_type(OWNER, S2) > NO");
    assert!(sys.rings.get_claimable_season_ring_type(OTHER(), duel_id).is_none(), "get_claimable_season_ring_type(OTHER, S2) > NO");
    assert_eq!(sys.rings.get_claimable_season_ring_type(BUMMER(), duel_id).unwrap(), RingType::GoldSignetRing, "get_claimable_season_ring_type(BUMMER, S2) YES");
    tester::execute_claim_season_ring(@sys, BUMMER(), duel_id, RingType::SilverSignetRing);
    assert!(sys.rings.has_claimed(OWNER(), RingType::GoldSignetRing), "has_claimed(OWNER, GoldSignetRing, S2) YES");
    assert!(sys.rings.has_claimed(OTHER(), RingType::GoldSignetRing), "has_claimed(OTHER, GoldSignetRing, S2) YES");
    assert!(sys.rings.has_claimed(BUMMER(), RingType::GoldSignetRing), "has_claimed(BUMMER, GoldSignetRing, S2) YES");
    assert!(sys.rings.get_claimable_season_ring_type(OWNER(), duel_id).is_none(), "get_claimable_season_ring_type(OWNER, S2) > None");
    assert!(sys.rings.get_claimable_season_ring_type(OTHER(), duel_id).is_none(), "get_claimable_season_ring_type(OTHER, S2) > None");
    assert!(sys.rings.get_claimable_season_ring_type(BUMMER(), duel_id).is_none(), "get_claimable_season_ring_type(BUMMER, S2) > None");
    // balances
    assert_eq!(sys.rings.total_supply(), 3, "total_supply 3");
    assert_eq!(sys.rings.balance_of(OWNER()), 1, "balance_of(OWNER) 1");
    assert_eq!(sys.rings.balance_of(OTHER()), 1, "balance_of(OTHER) 1");
    assert_eq!(sys.rings.balance_of(BUMMER()), 1, "balance_of(BUMMER) 1");
    assert_eq!(sys.rings.balance_of_ring(OWNER(), RingType::GoldSignetRing), 1, "balance_of_ring(OWNER, GoldSignetRing, S2) 1");
    assert_eq!(sys.rings.balance_of_ring(OTHER(), RingType::GoldSignetRing), 1, "balance_of_ring(OTHER, GoldSignetRing, S2) 1");
    assert_eq!(sys.rings.balance_of_ring(BUMMER(), RingType::GoldSignetRing), 1, "balance_of_ring(BUMMER, GoldSignetRing, S2) 1");
    assert_eq!(sys.rings.balance_of_ring(OWNER(), RingType::SilverSignetRing), 0, "balance_of_ring(OWNER, SilverSignetRing, S2) 0");
    assert_eq!(sys.rings.balance_of_ring(OTHER(), RingType::SilverSignetRing), 0, "balance_of_ring(OTHER, SilverSignetRing, S2) 0");
    assert_eq!(sys.rings.balance_of_ring(BUMMER(), RingType::SilverSignetRing), 0, "balance_of_ring(BUMMER, SilverSignetRing, S2) 0");
    //
    // Season 3
    assert!(!sys.rings.has_claimed(OWNER(), RingType::SilverSignetRing), "has_claimed(OWNER, SilverSignetRing, S3) init");
    assert!(!sys.rings.has_claimed(OTHER(), RingType::SilverSignetRing), "has_claimed(OTHER, SilverSignetRing, S3) init");
    assert!(!sys.rings.has_claimed(BUMMER(), RingType::SilverSignetRing), "has_claimed(BUMMER, SilverSignetRing, S3) init");
    let duel_id: u128 = _make_challenge(ref sys, OWNER(), BUMMER(), SEASON_ID_3);
    assert_eq!(sys.rings.get_claimable_season_ring_type(OWNER(), duel_id).unwrap(), RingType::SilverSignetRing, "get_claimable_season_ring_type(OWNER, S3) YES");
    assert!(sys.rings.get_claimable_season_ring_type(OTHER(), duel_id).is_none(), "get_claimable_season_ring_type(OTHER, S3) > NO");
    assert_eq!(sys.rings.get_claimable_season_ring_type(BUMMER(), duel_id).unwrap(), RingType::SilverSignetRing, "get_claimable_season_ring_type(BUMMER, S3) YES");
    tester::execute_claim_season_ring(@sys, OWNER(), duel_id, RingType::SilverSignetRing);
    tester::execute_claim_season_ring(@sys, BUMMER(), duel_id, RingType::SilverSignetRing);
    assert!(sys.rings.has_claimed(OWNER(), RingType::SilverSignetRing), "has_claimed(OWNER, SilverSignetRing, S3) YES");
    assert!(!sys.rings.has_claimed(OTHER(), RingType::SilverSignetRing), "has_claimed(OTHER, SilverSignetRing, S3) NO");
    assert!(sys.rings.has_claimed(BUMMER(), RingType::SilverSignetRing), "has_claimed(BUMMER, SilverSignetRing, S3) YES");
    assert!(sys.rings.get_claimable_season_ring_type(OWNER(), duel_id).is_none(), "get_claimable_season_ring_type(OWNER, S3) > None");
    assert!(sys.rings.get_claimable_season_ring_type(OTHER(), duel_id).is_none(), "get_claimable_season_ring_type(OTHER, S3) > None");
    assert!(sys.rings.get_claimable_season_ring_type(BUMMER(), duel_id).is_none(), "get_claimable_season_ring_type(BUMMER, S3) > None");
    // balances
    assert_eq!(sys.rings.total_supply(), 5, "total_supply 5");
    assert_eq!(sys.rings.balance_of(OWNER()), 2, "balance_of(OWNER) 2");
    assert_eq!(sys.rings.balance_of(OTHER()), 1, "balance_of(OTHER) 1");
    assert_eq!(sys.rings.balance_of(BUMMER()), 2, "balance_of(BUMMER) 2");
    assert_eq!(sys.rings.balance_of_ring(OWNER(), RingType::GoldSignetRing), 1, "balance_of_ring(OWNER, GoldSignetRing, S3) 1");
    assert_eq!(sys.rings.balance_of_ring(OTHER(), RingType::GoldSignetRing), 1, "balance_of_ring(OTHER, GoldSignetRing, S3) 1");
    assert_eq!(sys.rings.balance_of_ring(BUMMER(), RingType::GoldSignetRing), 1, "balance_of_ring(BUMMER, GoldSignetRing, S3) 1");
    assert_eq!(sys.rings.balance_of_ring(OWNER(), RingType::SilverSignetRing), 1, "balance_of_ring(OWNER, SilverSignetRing, S3) 1");
    assert_eq!(sys.rings.balance_of_ring(OTHER(), RingType::SilverSignetRing), 0, "balance_of_ring(OTHER, SilverSignetRing, S3) 0");
    assert_eq!(sys.rings.balance_of_ring(BUMMER(), RingType::SilverSignetRing), 1, "balance_of_ring(BUMMER, SilverSignetRing, S3) 1");
    //
    // Season 5
    assert!(!sys.rings.has_claimed(OWNER(), RingType::LeadSignetRing), "has_claimed(OWNER, LeadSignetRing, S5) init");
    assert!(!sys.rings.has_claimed(OTHER(), RingType::LeadSignetRing), "has_claimed(OTHER, LeadSignetRing, S5) init");
    assert!(!sys.rings.has_claimed(BUMMER(), RingType::LeadSignetRing), "has_claimed(BUMMER, LeadSignetRing, S5) init");
    let duel_id: u128 = _make_challenge(ref sys, OWNER(), OTHER(), SEASON_ID_5);
    assert_eq!(sys.rings.get_claimable_season_ring_type(OWNER(), duel_id).unwrap(), RingType::LeadSignetRing, "get_claimable_season_ring_type(OWNER, S5) YES");
    assert_eq!(sys.rings.get_claimable_season_ring_type(OTHER(), duel_id).unwrap(), RingType::LeadSignetRing, "get_claimable_season_ring_type(OTHER, S5) YES");
    assert!(sys.rings.get_claimable_season_ring_type(BUMMER(), duel_id).is_none(), "get_claimable_season_ring_type(BUMMER, S5) > NO");
    tester::execute_claim_season_ring(@sys, OWNER(), duel_id, RingType::LeadSignetRing);
    tester::execute_claim_season_ring(@sys, OTHER(), duel_id, RingType::LeadSignetRing);
    assert!(sys.rings.has_claimed(OWNER(), RingType::LeadSignetRing), "has_claimed(OWNER, LeadSignetRing, S5) YES");
    assert!(sys.rings.has_claimed(OTHER(), RingType::LeadSignetRing), "has_claimed(OTHER, LeadSignetRing, S5) YES");
    assert!(!sys.rings.has_claimed(BUMMER(), RingType::LeadSignetRing), "has_claimed(BUMMER, LeadSignetRing, S5) NO");
    assert!(sys.rings.get_claimable_season_ring_type(OWNER(), duel_id).is_none(), "get_claimable_season_ring_type(OWNER, S5) > None");
    assert!(sys.rings.get_claimable_season_ring_type(OTHER(), duel_id).is_none(), "get_claimable_season_ring_type(OTHER, S5) > None");
    assert!(sys.rings.get_claimable_season_ring_type(BUMMER(), duel_id).is_none(), "get_claimable_season_ring_type(BUMMER, S5) > None");
    // balances
    assert_eq!(sys.rings.total_supply(), 7, "total_supply 7");
    assert_eq!(sys.rings.balance_of(OWNER()), 3, "balance_of(OWNER) 3");
    assert_eq!(sys.rings.balance_of(OTHER()), 2, "balance_of(OTHER) 2");
    assert_eq!(sys.rings.balance_of(BUMMER()), 2, "balance_of(BUMMER) 2");
    assert_eq!(sys.rings.balance_of_ring(OWNER(), RingType::GoldSignetRing), 1, "balance_of_ring(OWNER, GoldSignetRing, S5) 1");
    assert_eq!(sys.rings.balance_of_ring(OTHER(), RingType::GoldSignetRing), 1, "balance_of_ring(OTHER, GoldSignetRing, S5) 1");
    assert_eq!(sys.rings.balance_of_ring(BUMMER(), RingType::GoldSignetRing), 1, "balance_of_ring(BUMMER, GoldSignetRing, S5) 1");
    assert_eq!(sys.rings.balance_of_ring(OWNER(), RingType::SilverSignetRing), 1, "balance_of_ring(OWNER, SilverSignetRing, S5) 1");
    assert_eq!(sys.rings.balance_of_ring(OTHER(), RingType::SilverSignetRing), 0, "balance_of_ring(OTHER, SilverSignetRing, S5) 0");
    assert_eq!(sys.rings.balance_of_ring(BUMMER(), RingType::SilverSignetRing), 1, "balance_of_ring(BUMMER, SilverSignetRing, S5) 1");
    assert_eq!(sys.rings.balance_of_ring(OWNER(), RingType::LeadSignetRing), 1, "balance_of_ring(OWNER, LeadSignetRing, S5) 1");
    assert_eq!(sys.rings.balance_of_ring(OTHER(), RingType::LeadSignetRing), 1, "balance_of_ring(OTHER, LeadSignetRing, S5) 1");
    assert_eq!(sys.rings.balance_of_ring(BUMMER(), RingType::LeadSignetRing), 0, "balance_of_ring(BUMMER, LeadSignetRing, S5) 0");
    //
    // Season 10
    let duel_id: u128 = _make_challenge(ref sys, OWNER(), SPENDER(), 10);
    assert!(sys.rings.get_claimable_season_ring_type(OWNER(), duel_id).is_none(), "get_claimable_season_ring_type(OWNER, S10) > NO");
    assert!(sys.rings.get_claimable_season_ring_type(OTHER(), duel_id).is_none(), "get_claimable_season_ring_type(OTHER, S10) > NO");
    assert!(sys.rings.get_claimable_season_ring_type(BUMMER(), duel_id).is_none(), "get_claimable_season_ring_type(BUMMER, S10) > NO");
    assert_eq!(sys.rings.get_claimable_season_ring_type(SPENDER(), duel_id).unwrap(), RingType::LeadSignetRing, "get_claimable_season_ring_type(SPENDER, S10) YES");
    tester::execute_claim_season_ring(@sys, SPENDER(), duel_id, RingType::LeadSignetRing);
    assert!(sys.rings.has_claimed(SPENDER(), RingType::LeadSignetRing), "has_claimed(SPENDER, LeadSignetRing, S10) YES");
    assert!(sys.rings.get_claimable_season_ring_type(OWNER(), duel_id).is_none(), "get_claimable_season_ring_type(OWNER, S10) > None");
    assert!(sys.rings.get_claimable_season_ring_type(OTHER(), duel_id).is_none(), "get_claimable_season_ring_type(OTHER, S10) > None");
    assert!(sys.rings.get_claimable_season_ring_type(BUMMER(), duel_id).is_none(), "get_claimable_season_ring_type(BUMMER, S10) > None");
    assert!(sys.rings.get_claimable_season_ring_type(SPENDER(), duel_id).is_none(), "get_claimable_season_ring_type(SPENDER, S10) > None");
    // balances
    assert_eq!(sys.rings.total_supply(), 8, "total_supply 8");
    //
    // Season 11
    let duel_id: u128 = _make_challenge(ref sys, OWNER(), BUMMER(), 11);
    assert!(sys.rings.get_claimable_season_ring_type(OWNER(), duel_id).is_none(), "get_claimable_season_ring_type(OWNER, S11) > None");
    assert!(sys.rings.get_claimable_season_ring_type(OTHER(), duel_id).is_none(), "get_claimable_season_ring_type(OTHER, S11) > None");
    assert!(sys.rings.get_claimable_season_ring_type(BUMMER(), duel_id).is_none(), "get_claimable_season_ring_type(BUMMER, S11) > None");
    assert!(sys.rings.get_claimable_season_ring_type(SPENDER(), duel_id).is_none(), "get_claimable_season_ring_type(SPENDER, S11) > None");
}

#[test]
#[should_panic(expected: ('RING: Already claimed', 'ENTRYPOINT_FAILED'))]
fn test_claim_twice() {
    let mut sys: TestSystems = setup(FLAGS::RINGS | FLAGS::GAME | FLAGS::MOCK_RNG);
    let duel_id: u128 = _make_challenge(ref sys, OWNER(), OTHER(), SEASON_ID_1);
    tester::execute_claim_season_ring(@sys, OWNER(), duel_id, RingType::GoldSignetRing);
    tester::execute_claim_season_ring(@sys, OWNER(), duel_id, RingType::GoldSignetRing);
}

#[test]
#[should_panic(expected: ('RING: Already claimed', 'ENTRYPOINT_FAILED'))]
fn test_claim_transfer_claim() {
    let mut sys: TestSystems = setup(FLAGS::RINGS | FLAGS::GAME | FLAGS::MOCK_RNG);
    let duel_id: u128 = _make_challenge(ref sys, OWNER(), OTHER(), SEASON_ID_1);
    tester::execute_claim_season_ring(@sys, OWNER(), duel_id, RingType::GoldSignetRing);
    sys.rings.transfer_from(OWNER(), OTHER(), TOKEN_ID_1);
    tester::execute_claim_season_ring(@sys, OWNER(), duel_id, RingType::GoldSignetRing);
}

#[test]
fn test_claim_transfer_other_can_claim() {
    let mut sys: TestSystems = setup(FLAGS::RINGS | FLAGS::GAME | FLAGS::MOCK_RNG);
    let duel_id: u128 = _make_challenge(ref sys, OWNER(), OTHER(), SEASON_ID_1);
    tester::execute_claim_season_ring(@sys, OWNER(), duel_id, RingType::GoldSignetRing);
    sys.rings.transfer_from(OWNER(), OTHER(), TOKEN_ID_1);
    tester::execute_claim_season_ring(@sys, OTHER(), duel_id, RingType::GoldSignetRing);
}


//
// airdrops...
//

#[test]
fn test_airdrop_ok() {
    let mut sys: TestSystems = setup(FLAGS::RINGS | FLAGS::ADMIN);
    assert_eq!(sys.rings.total_supply(), 0, "total_supply 0");
    assert_eq!(sys.rings.balance_of(OTHER()), 0, "balance_of(OTHER) 0");
    assert_eq!(sys.rings.balance_of_ring(OTHER(), RingType::GoldSignetRing), 0, "balance_of_ring(OTHER, GoldSignetRing) 0");
    assert_eq!(sys.rings.balance_of_ring(OTHER(), RingType::SilverSignetRing), 0, "balance_of_ring(OTHER, SilverSignetRing) 0");
    assert!(!sys.rings.has_claimed(OTHER(), RingType::GoldSignetRing), "has_claimed(OTHER, GoldSignetRing) init");
    assert!(!sys.rings.has_claimed(OTHER(), RingType::SilverSignetRing), "has_claimed(OTHER, SilverSignetRing) init");
    // airdrop...
    tester::execute_airdrop_ring(@sys, OWNER(), OTHER(), RingType::GoldSignetRing);
    assert_eq!(sys.rings.total_supply(), 1, "total_supply 1");
    assert_eq!(sys.rings.balance_of(OWNER()), 0, "balance_of(OWNER) 0");
    assert_eq!(sys.rings.balance_of(OTHER()), 1, "balance_of(OTHER) 1");
    assert_eq!(sys.rings.balance_of(BUMMER()), 0, "balance_of(BUMMER) 0");
    assert_eq!(sys.rings.balance_of_ring(OWNER(), RingType::GoldSignetRing), 0, "balance_of_ring(OWNER, GoldSignetRing, S1) 0");
    assert_eq!(sys.rings.balance_of_ring(OTHER(), RingType::GoldSignetRing), 1, "balance_of_ring(OTHER, GoldSignetRing, S1) 1");
    assert_eq!(sys.rings.balance_of_ring(OWNER(), RingType::SilverSignetRing), 0, "balance_of_ring(OWNER, SilverSignetRing, S1) 0");
    assert_eq!(sys.rings.balance_of_ring(OTHER(), RingType::SilverSignetRing), 0, "balance_of_ring(OTHER, SilverSignetRing, S1) 0");
    assert!(!sys.rings.has_claimed(OWNER(), RingType::GoldSignetRing), "has_claimed(OWNER, GoldSignetRing, S1) YES");
    assert!(sys.rings.has_claimed(OTHER(), RingType::GoldSignetRing), "has_claimed(OTHER, GoldSignetRing, S1) NO");
}

#[test]
#[should_panic(expected: ('RING: Caller not admin', 'ENTRYPOINT_FAILED'))]
fn test_airdrop_not_admin() {
    let mut sys: TestSystems = setup(FLAGS::RINGS | FLAGS::ADMIN);
    tester::impersonate(OTHER());
    tester::execute_airdrop_ring(@sys, OTHER(), OTHER(), RingType::GoldSignetRing);
}

#[test]
fn test_airdrop_admin() {
    let mut sys: TestSystems = setup(FLAGS::RINGS | FLAGS::ADMIN);
    tester::impersonate(OTHER());
    tester::execute_admin_set_is_team_member(@sys.admin, OWNER(), OTHER(), false, true);
    assert!(sys.admin.am_i_admin(OTHER()), "admin_am_i_admin_3");
    assert!(sys.store.get_player_is_admin(OTHER()), "store_am_i_admin_3");
    tester::execute_airdrop_ring(@sys, OTHER(), OTHER(), RingType::GoldSignetRing);
}


//---------------------------------
// metadata_update
//
#[test]
fn test_update_contract_metadata() {
    let mut sys: TestSystems = setup(FLAGS::RINGS);
    tester::drop_all_events(sys.rings.contract_address);
    sys.rings.update_contract_metadata();
    let _event = tester::pop_log::<combo::ContractURIUpdated>(sys.rings.contract_address, selector!("ContractURIUpdated")).unwrap();
}
#[test]
fn test_update_token_metadata() {
    let mut sys: TestSystems = setup(FLAGS::RINGS);
    tester::drop_all_events(sys.rings.contract_address);
    sys.rings.update_token_metadata(TOKEN_ID_1.low);
    let event = tester::pop_log::<combo::MetadataUpdate>(sys.rings.contract_address, selector!("MetadataUpdate")).unwrap();
    assert_eq!(event.token_id, TOKEN_ID_1.into(), "event.token_id");
}
