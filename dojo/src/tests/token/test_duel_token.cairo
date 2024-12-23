use debug::PrintTrait;
use starknet::{ContractAddress, get_contract_address, get_caller_address, testing};
use dojo::world::{WorldStorage, WorldStorageTrait};
use dojo::model::{Model, ModelIndex};
use dojo_cairo_test::{
    spawn_test_world, NamespaceDef, TestResource, ContractDefTrait, ContractDef,
    WorldStorageTestTrait,
};

use pistols::systems::{
    game::{game},
    bank::{bank},
    vrf_mock::{vrf_mock},
    tokens::{
        duel_token::{duel_token, IDuelTokenDispatcher, IDuelTokenDispatcherTrait},
        duelist_token::{duelist_token, IDuelistTokenDispatcher, IDuelistTokenDispatcherTrait},
        lords_mock::{lords_mock, ILordsMockDispatcher, ILordsMockDispatcherTrait},
    },
    components::{
        token_bound::{m_TokenBoundAddress, TokenBoundAddress},
    },
};
use pistols::models::{
    player::{
        m_Player, Player,
        e_PlayerActivity, PlayerActivity,
    },
    consumable::{
        m_ConsumableBalance, ConsumableBalance,
    },
    challenge::{
        m_Challenge, Challenge,
        m_ChallengeFameBalance, ChallengeFameBalance,
        m_Round, Round,
    },
    duelist::{
        m_Duelist, Duelist,
        m_Pact, Pact,
        m_Scoreboard, Scoreboard,
    },
    payment::{
        m_Payment, Payment,
    },
    config::{
        m_Config, Config,
        m_TokenConfig, TokenConfig,
        m_CoinConfig, CoinConfig,
        CONFIG,
    },
    table::{
        m_TableConfig, TableConfig,
        m_TableAdmittance, TableAdmittance,
    },
    table::{TABLES, default_tables},
};
use pistols::tests::token::mock_duelist::{
    duelist_token as mock_duelist,
    m_MockDuelistOwners,
};

use pistols::interfaces::systems::{SystemsTrait, SELECTORS};
use pistols::types::challenge_state::{ChallengeState, ChallengeStateTrait};
use pistols::types::premise::{Premise, PremiseTrait};
use pistols::types::constants::{CONST};
use pistols::utils::arrays::{ArrayUtilsTrait, SpanUtilsTrait};
use pistols::utils::math::{MathTrait};

use pistols::tests::tester::{tester, tester::{OWNER, OTHER, BUMMER, TREASURY, ZERO}};
use pistols::tests::{utils};

use openzeppelin_token::erc721::interface;
use openzeppelin_token::erc721::{
    ERC721Component,
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
    assert(event.from == from, 'Invalid `from`');
    assert(event.to == to, 'Invalid `to`');
    assert(event.token_id == token_id, 'Invalid `token_id`');
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
    assert(event.owner == owner, 'Invalid `owner`');
    assert(event.approved == spender, 'Invalid `spender`');
    assert(event.token_id == token_id, 'Invalid `token_id`');
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

const TOKEN_ID_1: u256 = 1; // owned by OWNER()
const TOKEN_ID_2: u256 = 2; // owned by OTHER()
const TOKEN_ID_3: u256 = 3; // owned by BUMMER()
const TOKEN_ID_4: u256 = 4; // owned by RECIPIENT()

fn setup_uninitialized(fee_amount: u128) -> (WorldStorage, IDuelTokenDispatcher) {
    testing::set_block_number(1);
    testing::set_block_timestamp(1);

    let ndef = NamespaceDef {
        namespace: "pistols",
        resources: [
            // pistols models
            TestResource::Model(m_Player::TEST_CLASS_HASH),
            TestResource::Model(m_ConsumableBalance::TEST_CLASS_HASH),
            TestResource::Model(m_Challenge::TEST_CLASS_HASH),
            TestResource::Model(m_ChallengeFameBalance::TEST_CLASS_HASH),
            TestResource::Model(m_CoinConfig::TEST_CLASS_HASH),
            TestResource::Model(m_Config::TEST_CLASS_HASH),
            TestResource::Model(m_Duelist::TEST_CLASS_HASH),
            TestResource::Model(m_Pact::TEST_CLASS_HASH),
            TestResource::Model(m_Payment::TEST_CLASS_HASH),
            TestResource::Model(m_Round::TEST_CLASS_HASH),
            TestResource::Model(m_Scoreboard::TEST_CLASS_HASH),
            TestResource::Model(m_TableAdmittance::TEST_CLASS_HASH),
            TestResource::Model(m_TableConfig::TEST_CLASS_HASH),
            TestResource::Model(m_TokenBoundAddress::TEST_CLASS_HASH),
            TestResource::Model(m_TokenConfig::TEST_CLASS_HASH),
            // test models
            TestResource::Model(m_MockDuelistOwners::TEST_CLASS_HASH),
            // events
            TestResource::Event(e_PlayerActivity::TEST_CLASS_HASH),
            //
            // contracts
            TestResource::Contract(duel_token::TEST_CLASS_HASH),
            TestResource::Contract(mock_duelist::TEST_CLASS_HASH),
            TestResource::Contract(lords_mock::TEST_CLASS_HASH),
            // needed to mint duels
            TestResource::Contract(game::TEST_CLASS_HASH),
            TestResource::Contract(vrf_mock::TEST_CLASS_HASH)
        ].span()
    };

    let mut world: WorldStorage = spawn_test_world([ndef].span());

    let mut contract_defs: Array<ContractDef> = array![
        ContractDefTrait::new(@"pistols", @"game")
            .with_writer_of([dojo::utils::bytearray_hash(@"pistols")].span()),
        ContractDefTrait::new(@"pistols", @"vrf_mock"),
        ContractDefTrait::new(@"pistols", @"duel_token")
            .with_writer_of([dojo::utils::bytearray_hash(@"pistols")].span())
            .with_init_calldata([
                'pistols.underware.gg',
                0, // minter_address
                0, // renderer_address
                0, // fee_amount
            ].span()),
        ContractDefTrait::new(@"pistols", @"duelist_token")
            .with_writer_of([dojo::utils::bytearray_hash(@"pistols")].span()),
        ContractDefTrait::new(@"pistols", @"lords_mock")
            .with_writer_of([dojo::utils::bytearray_hash(@"pistols")].span())
            .with_init_calldata([
                0, // minter
                10_000_000_000_000_000_000_000, // 10,000 Lords
            ].span()),
    ];

    world.sync_perms_and_inits(contract_defs.span());

    tester::impersonate(OWNER());

    tester::set_TableConfig(ref world, *default_tables()[0]);

    tester::set_Config(ref world, Config {
        key: CONFIG::CONFIG_KEY,
        treasury_address: TREASURY(),
        lords_address: world.lords_mock_address(),
        vrf_address: world.vrf_mock_address(),
        is_paused: false,
    });

    (
        world,
        world.duel_token_dispatcher(),
    )
}

fn setup(fee_amount: u128) -> (WorldStorage, IDuelTokenDispatcher) {
    let (mut world, mut token) = setup_uninitialized(fee_amount);

    // initialize contracts
    mint(token, OWNER(), TOKEN_ID_1, TOKEN_ID_2);
    mint(token, OTHER(), TOKEN_ID_2, TOKEN_ID_3);

    tester::impersonate(OWNER());

    // drop all events
    utils::drop_all_events(world.dispatcher.contract_address);
    utils::drop_all_events(token.contract_address);

    (world, token)
}

fn mint(token: IDuelTokenDispatcher, recipient: ContractAddress, duelist_a: u256, duelist_b: u256) {
// '---AA'.print();
    tester::impersonate(recipient);
    token.create_duel(
        duelist_id: duelist_a.low,
        challenged_id_or_address: duelist_b.as_felt().try_into().unwrap(),
        premise: Premise::Honour,
        quote: 'For honour!!!',
        table_id: TABLES::LORDS,
        expire_hours: 1,
    );
// '---BB'.print();
}

fn _assert_minted_count(world: WorldStorage, token: IDuelTokenDispatcher, minted_count: u128, msg: felt252) {
    // assert(token.total_supply() == minted_count, 'msg);
    let token_config: TokenConfig = tester::get_TokenConfig(world, token.contract_address);
    assert(token_config.minted_count == minted_count, msg);
}

//
// initialize
//

#[test]
fn test_initializer() {
    let (world, mut token) = setup(100);
    // assert(token.name() == "Pistols at 10 Blocks Duelists", 'Name is wrong');
    assert(token.symbol() == "DUEL", 'Symbol is wrong');
    _assert_minted_count(world, token, 2, 'Should eq 2');

    assert(token.owner_of(TOKEN_ID_1).is_non_zero(), 'owner_of_1_non_zero');
    assert(token.owner_of(TOKEN_ID_2).is_non_zero(), 'owner_of_2_non_zero');
    assert(token.owner_of(TOKEN_ID_1) == world.game_address(), 'owner_of_1');
    assert(token.owner_of(TOKEN_ID_2) == world.game_address(), 'owner_of_2');

    // owned by game now
    // assert(token.balance_of(OWNER()) == 1, 'Should eq 1 (OWNER)');
    // assert(token.balance_of(OTHER()) == 1, 'Should eq 1 (OTHER)');
    // assert(token.owner_of(TOKEN_ID_1) == OWNER(), 'owner_of_1');
    // assert(token.owner_of(TOKEN_ID_2) == OTHER(), 'owner_of_2');

    // enumberable
    // assert(token.token_of_owner_by_index(OWNER(), 0) == TOKEN_ID_1, 'token_of_owner_by_index_OWNER');
    // assert(token.token_of_owner_by_index(OTHER(), 0) == TOKEN_ID_2, 'token_of_owner_by_index_REC');
    // assert(token.token_by_index(0) == TOKEN_ID_1, 'token_by_index_0');
    // assert(token.token_by_index(1) == TOKEN_ID_2, 'token_by_index_1');
    
    assert(token.token_uri(TOKEN_ID_1) != "", 'Uri should not be empty');
    assert(token.tokenURI(TOKEN_ID_1) != "", 'Uri should not be empty Camel');

    assert(token.supports_interface(interface::IERC721_ID) == true, 'should support IERC721_ID');
    assert(token.supports_interface(interface::IERC721_METADATA_ID) == true, 'should support METADATA');
    // assert(token.supports_interface(interface::IERC721_ENUMERABLE_ID) == true, 'should support ENUMERABLE');
}

#[test]
fn test_token_component() {
    let (mut _world, mut token) = setup(100);
    // should not panic
    // token.contract_address.print();
    token.owner_of(TOKEN_ID_1);//.print();
    token.calc_mint_fee(TABLES::LORDS);//.print();
    token.is_owner_of(OWNER(), TOKEN_ID_1.low);//.print();
}

#[test]
fn test_token_uri() {
    let (mut world, mut token) = setup(100);

    let challenge = Challenge {
        duel_id: TOKEN_ID_1.low,
        table_id: TABLES::LORDS,
        premise: Premise::Honour,
        quote: 'For honour!!!',
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

    tester::set_Challenge(ref world, challenge);

    let uri_1 = token.token_uri(TOKEN_ID_1);
    let uri_2 = token.token_uri(TOKEN_ID_2);
    
    println!("{}", uri_1);
    println!("{}", uri_2);

    assert(uri_1.len() > 100, 'Uri 1 should not be empty');
    assert(uri_2.len() > 100, 'Uri 2 should not be empty');
    // assert(uri_1.len() > uri_2.len(), 'uri_1 > uri_2');
}

#[test]
#[should_panic(expected: ('ERC721: invalid token ID', 'ENTRYPOINT_FAILED'))]
fn test_token_uri_invalid() {
    let (_world, mut token) = setup(100);
    token.token_uri(999);
}


//
// approve
//

#[test]
#[ignore] // owned by game now
fn test_approve() {
    let (world, mut token) = setup(100);

    utils::impersonate(OWNER());

    token.approve(BUMMER(), TOKEN_ID_1);
    assert(token.get_approved(TOKEN_ID_1) == BUMMER(), 'Spender not approved correctly');

    // drop StoreSetRecord ERC721TokenApprovalModel
    utils::drop_event(world.dispatcher.contract_address);

    // TODO: fix events
    // // drop StoreSetRecord ERC721TokenApprovalModel
    // utils::drop_event(world.dispatcher.contract_address);
    // assert_only_event_approval(token.contract_address, OWNER(), BUMMER(), TOKEN_ID_1);
    // assert_only_event_approval(world.dispatcher.contract_address, OWNER(), BUMMER(), TOKEN_ID_1);
}

//
// transfer_from
//

#[test]
#[ignore] // owned by game now// owned by game now
fn test_transfer_from() {
    let (world, mut token) = setup(100);

    tester::impersonate(OWNER());
    token.approve(BUMMER(), TOKEN_ID_1);

    utils::drop_all_events(token.contract_address);
    utils::drop_all_events(world.dispatcher.contract_address);
    utils::assert_no_events_left(token.contract_address);

    tester::impersonate(BUMMER());
    token.transfer_from(OWNER(), OTHER(), TOKEN_ID_1);

    // TODO: fix events
    // assert_only_event_transfer(token.contract_address, OWNER(), OTHER(), TOKEN_ID_1);

    assert(token.balance_of(OTHER()) == 2, 'Should eq 1');
    assert(token.balance_of(OWNER()) == 0, 'Should eq 1');
    assert(token.get_approved(TOKEN_ID_1) == ZERO(), 'Should eq 0');
    _assert_minted_count(world, token, 2, 'Should eq 2');
    // assert(token.total_supply() == 2, 'Should eq 2');
    // assert(token.token_of_owner_by_index(OTHER(), 1) == TOKEN_ID_1, 'Should eq TOKEN_ID_1');
}

#[test]
#[should_panic(expected: ('ERC721: unauthorized caller', 'ENTRYPOINT_FAILED'))]
fn test_mint_no_allowance() {
    let (_world, mut token) = setup(100);
    utils::impersonate(BUMMER());
    token.transfer_from(OWNER(), OTHER(), TOKEN_ID_1);
}


//
// mint
//

#[test]
fn test_mint_free() {
    let (world, mut token) = setup(0);
    _assert_minted_count(world, token, 2, 'invalid total_supply init');
    // assert(token.balance_of(OTHER()) == 1, 'invalid balance_of == 1');
    // assert(token.token_of_owner_by_index(OTHER(), 0) == TOKEN_ID_2, 'token_of_owner_by_index_2');
    mint(token, OTHER(), TOKEN_ID_2, TOKEN_ID_4);
    _assert_minted_count(world, token, 3, 'invalid total_supply');
    // assert(token.balance_of(OTHER()) == 2, 'invalid balance_of == 2');
    // assert(token.token_of_owner_by_index(OTHER(), 1) == TOKEN_ID_3, 'token_of_owner_by_index_3');
}

#[test]
fn test_mint_lords() {
    let (world, mut token) = setup(100);
    _assert_minted_count(world, token, 2, 'invalid total_supply init');
    // TODO: set allowance
    mint(token, BUMMER(), TOKEN_ID_3, TOKEN_ID_4);
    _assert_minted_count(world, token, 3, 'invalid total_supply');
}


//
// burn
//

// #[test]
// #[should_panic(expected: ('DUEL: Not implemented', 'ENTRYPOINT_FAILED'))]
// fn test_burn() {
//     let (world, mut token) = setup(100);
//     _assert_minted_count(world, token, 2, 'invalid total_supply init');
//     // assert(token.balance_of(OWNER()) == 1, 'invalid balance_of (1)');
//     tester::impersonate(world.game_address());
//     token.delete_duel(TOKEN_ID_1.low);
//     _assert_minted_count(world, token, 1, 'invalid total_supply');
//     // assert(token.balance_of(OWNER()) == 0, 'invalid balance_of (0)');
// }
