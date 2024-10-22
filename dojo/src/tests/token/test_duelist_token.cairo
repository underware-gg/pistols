use debug::PrintTrait;
use starknet::{ContractAddress, get_contract_address, get_caller_address, testing};
use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};
use dojo::model::{Model, ModelTest, ModelIndex, ModelEntityTest};
use dojo::utils::test::spawn_test_world;

use pistols::systems::tokens::{
    duel_token::{duel_token, IDuelTokenDispatcher, IDuelTokenDispatcherTrait},
    duelist_token::{duelist_token, IDuelistTokenDispatcher, IDuelistTokenDispatcherTrait},
    lords_mock::{lords_mock, ILordsMockDispatcher, ILordsMockDispatcherTrait},
};
use pistols::models::{
    duelist::{Duelist, DuelistEntity, DuelistEntityStore, Score, Scoreboard, ProfilePicType, Archetype},
    challenge::{Challenge, Wager, Round},
    config::{Config},
    table::{TableConfig, TableAdmittance},
    token_config::{TokenConfig},
};

use pistols::models::table::{TABLES};
use pistols::types::constants::{CONST};
use pistols::interfaces::systems::{SELECTORS};
use pistols::tests::tester::{tester, tester::{OWNER, RECIPIENT, SPENDER, ZERO}};
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

const TOKEN_ID_1: u256 = 1;
const TOKEN_ID_2: u256 = 2;
const TOKEN_ID_3: u256 = 3;
const TOKEN_ID_4: u256 = 4;
const TOKEN_ID_5: u256 = 5;

fn setup_uninitialized(fee_amount: u128) -> (IWorldDispatcher, IDuelistTokenDispatcher) {
    testing::set_block_number(1);
    testing::set_block_timestamp(1);
    let mut world = spawn_test_world(
        ["pistols"].span(),
        get_models_test_class_hashes!(),
    );

    let mut lords = ILordsMockDispatcher{
        contract_address: world.deploy_contract('lords_mock', lords_mock::TEST_CLASS_HASH.try_into().unwrap())
    };
    world.grant_owner(dojo::utils::bytearray_hash(@"pistols"), lords.contract_address);

    let mut token = IDuelistTokenDispatcher {
        contract_address: world.deploy_contract('duelist_token', duelist_token::TEST_CLASS_HASH.try_into().unwrap())
    };
    world.grant_owner(dojo::utils::bytearray_hash(@"pistols"), token.contract_address);
    let duelists_call_data: Span<felt252> = array![
        0, 0, 0,
        lords.contract_address.into(),
        (fee_amount * CONST::ETH_TO_WEI.low).into(), // 100 Lords
    ].span();
    world.init_contract(SELECTORS::DUELIST_TOKEN, duelists_call_data);

    tester::impersonate(OWNER());

    (world, token)
}

fn setup(fee_amount: u128) -> (IWorldDispatcher, IDuelistTokenDispatcher) {
    let (mut world, mut token) = setup_uninitialized(fee_amount);

    // initialize contracts
    mint(token, OWNER());
    mint(token, RECIPIENT());

    // drop all events
    utils::drop_all_events(world.contract_address);
    utils::drop_all_events(token.contract_address);

    (world, token)
}

fn mint(token: IDuelistTokenDispatcher, recipient: ContractAddress) {
    token.create_duelist(
        recipient,
        'Pops',
        ProfilePicType::Duelist,
        '1',
    );
}

fn _assert_minted_count(world: IWorldDispatcher, token: IDuelistTokenDispatcher, minted_count: u128, msg: felt252) {
    // assert(token.total_supply() == minted_count, 'msg);
    let token_config: TokenConfig = get!(world, token.contract_address, TokenConfig);
    assert(token_config.minted_count == minted_count, msg);
}

//
// initialize
//

#[test]
fn test_initializer() {
    let (world, mut token) = setup(100);
    // assert(token.name() == "Pistols at 10 Blocks Duelists", 'Name is wrong');
    assert(token.symbol() == "DUELIST", 'Symbol is wrong');

    _assert_minted_count(world, token, 2, 'Should eq 2');
    assert(token.balance_of(OWNER()) == 1, 'Should eq 1 (OWNER)');
    assert(token.balance_of(RECIPIENT()) == 1, 'Should eq 1 (RECIPIENT)');

    // assert(token.token_of_owner_by_index(OWNER(), 0) == TOKEN_ID_1, 'token_of_owner_by_index_OWNER');
    // assert(token.token_of_owner_by_index(RECIPIENT(), 0) == TOKEN_ID_2, 'token_of_owner_by_index_REC');

    // assert(token.token_by_index(0) == TOKEN_ID_1, 'token_by_index_0');
    // assert(token.token_by_index(1) == TOKEN_ID_2, 'token_by_index_1');

    assert(token.owner_of(TOKEN_ID_1) == OWNER(), 'owner_of_1');
    assert(token.owner_of(TOKEN_ID_2) == RECIPIENT(), 'owner_of_2');
    // assert(token.owner_of(TOKEN_ID_3) == ZERO(), 'owner_of_3');

    assert(token.owner_of(TOKEN_ID_1).is_non_zero(), 'owner_of_1_non_zero');
    assert(token.owner_of(TOKEN_ID_2).is_non_zero(), 'owner_of_2_non_zero');
    // assert(token.owner_of(TOKEN_ID_3).is_zero(), 'owner_of_3_non_zero');

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
    token.calc_fee(OWNER());//.print();
    token.is_owner_of(OWNER(), TOKEN_ID_1.low);//.print();
}

#[test]
fn test_token_uri() {
    let (mut world, mut token) = setup(100);

    let duelist = Duelist {
        duelist_id: TOKEN_ID_1.low,
        name: 'Ser Walker',
        profile_pic_type: ProfilePicType::Duelist,
        profile_pic_uri: "1",
        timestamp: 999999,
        score: Score {
            honour: 99,
            total_duels: 6,
            total_wins: 3,
            total_losses: 2,
            total_draws: 1,
            honour_history: 0,
        },
    };
    let scoreboard: Scoreboard = Scoreboard{
        table_id: TABLES::LORDS,
        duelist_id: TOKEN_ID_1.low,
        score: duelist.score,
        wager_won: (1000 * CONST::ETH_TO_WEI.low),
        wager_lost: (200 * CONST::ETH_TO_WEI.low),
    };

    tester::set_Duelist(world, duelist);
    tester::set_Scoreboard(world, scoreboard);

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
fn test_approve() {
    let (world, mut token) = setup(100);

    utils::impersonate(OWNER());

    token.approve(SPENDER(), TOKEN_ID_1);
    assert(token.get_approved(TOKEN_ID_1) == SPENDER(), 'Spender not approved correctly');

    // drop StoreSetRecord ERC721TokenApprovalModel
    utils::drop_event(world.contract_address);

    // TODO: fix events
    // // drop StoreSetRecord ERC721TokenApprovalModel
    // utils::drop_event(world.contract_address);
    // assert_only_event_approval(token.contract_address, OWNER(), SPENDER(), TOKEN_ID_1);
    // assert_only_event_approval(world.contract_address, OWNER(), SPENDER(), TOKEN_ID_1);
}

//
// transfer_from
//

#[test]
fn test_transfer_from() {
    let (world, mut token) = setup(100);

    tester::impersonate(OWNER());
    token.approve(SPENDER(), TOKEN_ID_1);

    utils::drop_all_events(token.contract_address);
    utils::drop_all_events(world.contract_address);
    utils::assert_no_events_left(token.contract_address);

    tester::impersonate(SPENDER());
    token.transfer_from(OWNER(), RECIPIENT(), TOKEN_ID_1);

    // TODO: fix events
    // assert_only_event_transfer(token.contract_address, OWNER(), RECIPIENT(), TOKEN_ID_1);

    assert(token.balance_of(RECIPIENT()) == 2, 'Should eq 1');
    assert(token.balance_of(OWNER()) == 0, 'Should eq 1');
    assert(token.get_approved(TOKEN_ID_1) == ZERO(), 'Should eq 0');
    _assert_minted_count(world, token, 2, 'Should eq 2');
    // assert(token.total_supply() == 2, 'Should eq 2');
    // assert(token.token_of_owner_by_index(RECIPIENT(), 1) == TOKEN_ID_1, 'Should eq TOKEN_ID_1');
}

//
// mint
//

#[test]
fn test_mint_free() {
    let (world, mut token) = setup(0);
    _assert_minted_count(world, token, 2, 'invalid total_supply init');
    assert(token.balance_of(RECIPIENT()) == 1, 'invalid balance_of');
    // assert(token.token_of_owner_by_index(RECIPIENT(), 0) == TOKEN_ID_2, 'token_of_owner_by_index_2');
    mint(token, RECIPIENT());
    _assert_minted_count(world, token, 3, 'invalid total_supply');
    assert(token.balance_of(RECIPIENT()) == 2, 'invalid balance_of');
    // assert(token.token_of_owner_by_index(RECIPIENT(), 1) == TOKEN_ID_3, 'token_of_owner_by_index_3');
}

#[test]
fn test_mint_lords() {
    let (world, mut token) = setup(100);
    _assert_minted_count(world, token, 2, 'invalid total_supply init');
    // TODO: set allowance
    mint(token, RECIPIENT());
    _assert_minted_count(world, token, 3, 'invalid total_supply');
}

#[test]
#[should_panic(expected: ('ERC721: unauthorized caller', 'ENTRYPOINT_FAILED'))]
fn test_mint_no_allowance() {
    let (_world, mut token) = setup(100);
    utils::impersonate(SPENDER());
    token.transfer_from(OWNER(), RECIPIENT(), TOKEN_ID_1);
}

//
// burn
//

#[test]
#[should_panic(expected: ('DUELIST: not implemented', 'ENTRYPOINT_FAILED'))]
fn test_burn() {
    let (world, mut token) = setup(100);
    _assert_minted_count(world, token, 2, 'invalid total_supply init');
    assert(token.balance_of(OWNER()) == 1, 'invalid balance_of (1)');
    token.delete_duelist(TOKEN_ID_1.low);
    _assert_minted_count(world, token, 1, 'invalid total_supply');
    assert(token.balance_of(OWNER()) == 0, 'invalid balance_of (0)');
}

