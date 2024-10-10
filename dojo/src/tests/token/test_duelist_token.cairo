use debug::PrintTrait;
use starknet::{ContractAddress, get_contract_address, get_caller_address, testing};
use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};
use dojo::model::{Model, ModelTest, ModelIndex, ModelEntityTest};
use dojo::utils::test::spawn_test_world;

use origami_token::tests::constants::{ZERO, OWNER, SPENDER, RECIPIENT};//, TOKEN_ID, TOKEN_ID_2, TOKEN_ID_3};
use origami_token::tests::utils;

use origami_token::components::token::erc721::interface::{
    IERC721_ID, IERC721_METADATA_ID, IERC721_ENUMERABLE_ID,
};

use origami_token::components::token::erc721::erc721_approval::erc721_approval_component::{
    Approval, ApprovalForAll, ERC721ApprovalImpl, InternalImpl as ERC721ApprovalInternalImpl
};
use origami_token::components::token::erc721::erc721_balance::erc721_balance_component::{
    Transfer, ERC721BalanceImpl, InternalImpl as ERC721BalanceInternalImpl
};

use origami_token::components::token::erc721::erc721_mintable::erc721_mintable_component::InternalImpl as ERC721MintableInternalImpl;
use origami_token::components::token::erc721::erc721_burnable::erc721_burnable_component::InternalImpl as ERC721BurnableInternalImpl;

use pistols::systems::duelist_token::{
    duelist_token, IDuelistTokenDispatcher, IDuelistTokenDispatcherTrait,
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
use pistols::tests::tester::{tester};

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
    assert(event.spender == spender, 'Invalid `spender`');
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

const TOKEN_ID: u256 = 1;
const TOKEN_ID_2: u256 = 2;
const TOKEN_ID_3: u256 = 3;
const TOKEN_ID_4: u256 = 4;
const TOKEN_ID_5: u256 = 5;

fn setup_uninitialized() -> (IWorldDispatcher, IDuelistTokenDispatcher) {
    testing::set_block_number(1);
    testing::set_block_timestamp(1);
    let mut world = spawn_test_world(
        ["origami_token", "pistols"].span(),
        get_models_test_class_hashes!(),
    );

    let mut token = IDuelistTokenDispatcher {
        contract_address: world.deploy_contract('salt',duelist_token::TEST_CLASS_HASH.try_into().unwrap())
    };
    world.grant_owner(dojo::utils::bytearray_hash(@"origami_token"), token.contract_address);
    world.grant_writer(selector_from_tag!("pistols-TokenConfig"), token.contract_address);
    world.grant_writer(selector_from_tag!("pistols-Duelist"), token.contract_address);
    world.grant_writer(selector_from_tag!("origami_token-SRC5Model"), token.contract_address);
    world.grant_writer(selector_from_tag!("origami_token-InitializableModel"), token.contract_address);
    world.grant_writer(selector_from_tag!("origami_token-ERC721MetaModel"), token.contract_address);
    world.grant_writer(selector_from_tag!("origami_token-ERC721TokenApprovalModel"), token.contract_address);
    world.grant_writer(selector_from_tag!("origami_token-ERC721BalanceModel"), token.contract_address);
    world.grant_writer(selector_from_tag!("origami_token-ERC721EnumerableIndexModel"),token.contract_address);
    world.grant_writer(selector_from_tag!("origami_token-ERC721EnumerableOwnerIndexModel"),token.contract_address);
    world.grant_writer(selector_from_tag!("origami_token-ERC721EnumerableTokenModel"),token.contract_address);
    world.grant_writer(selector_from_tag!("origami_token-ERC721EnumerableOwnerTokenModel"),token.contract_address);
    world.grant_writer(selector_from_tag!("origami_token-ERC721EnumerableTotalModel"),token.contract_address);
    world.grant_writer(selector_from_tag!("origami_token-ERC721OwnerModel"), token.contract_address);
    world.init_contract(SELECTORS::DUELIST_TOKEN, [0, 0, 0].span());

    utils::impersonate(OWNER());

    (world, token)
}

fn setup() -> (IWorldDispatcher, IDuelistTokenDispatcher) {
    let (mut world, mut token) = setup_uninitialized();

    // initialize contracts
    mint(token, OWNER());
    mint(token, OWNER());

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
        1,
        Archetype::Honourable,
    );
}

//
// initialize
//

#[test]
fn test_initializer() {
    let (_world, mut token) = setup();
    assert(token.balance_of(OWNER(),) == 2, 'Should eq 2');
    assert(token.name() == "Pistols at 10 Blocks Duelists", 'Name is wrong');
    assert(token.symbol() == "DUELIST", 'Symbol is wrong');
    assert(token.token_uri(TOKEN_ID) != "", 'Uri should not be empty');
    assert(token.tokenURI(TOKEN_ID) != "", 'Uri should not be empty Camel');
    
    assert(token.supports_interface(IERC721_ID) == true, 'should support IERC721_ID');
    assert(token.supports_interface(IERC721_METADATA_ID) == true, 'should support METADATA');
    assert(token.supports_interface(IERC721_ENUMERABLE_ID) == true, 'should support ENUMERABLE');
    assert(token.supportsInterface(IERC721_ID) == true, 'should support IERC721_ID Camel');
}

#[test]
fn test_token_uri() {
    let (mut world, mut token) = setup();

    let duelist = Duelist {
        duelist_id: TOKEN_ID.low,
        name: 'Ser Walker',
        profile_pic_type: ProfilePicType::Duelist,
        profile_pic_uri: "1",
        timestamp: 999999,
        score: Score {
            honour: 99,
            level_villain: 0,
            level_trickster: 0,
            level_lord: 91,
            total_duels: 6,
            total_wins: 3,
            total_losses: 2,
            total_draws: 1,
            honour_history: 0,
        },
    };
    let scoreboard: Scoreboard = Scoreboard{
        table_id: TABLES::LORDS,
        duelist_id: TOKEN_ID.low,
        score: duelist.score,
        wager_won: (1000 * CONST::ETH_TO_WEI.low),
        wager_lost: (200 * CONST::ETH_TO_WEI.low),
    };

    tester::set_Duelist(world, duelist);
    tester::set_Scoreboard(world, scoreboard);

    let uri_1 = token.token_uri(TOKEN_ID);
    let uri_2 = token.token_uri(TOKEN_ID_2);
    
    println!("{}", uri_1);
    println!("{}", uri_2);

    assert(uri_1[0] == '{', 'Uri 1 should not be empty');
    assert(uri_2[0] == '{', 'Uri 2 should not be empty');
    // assert(uri_1.len() > uri_2.len(), 'uri_1 > uri_2');
}

#[test]
#[should_panic(expected: ('ERC721: invalid token ID', 'ENTRYPOINT_FAILED'))]
fn test_token_uri_invalid() {
    let (_world, mut token) = setup();
    token.token_uri(999);
}


//
// approve
//

#[test]
fn test_approve() {
    let (world, mut token) = setup();

    utils::impersonate(OWNER(),);

    token.approve(SPENDER(), TOKEN_ID);
    assert(token.get_approved(TOKEN_ID) == SPENDER(), 'Spender not approved correctly');

    // drop StoreSetRecord ERC721TokenApprovalModel
    utils::drop_event(world.contract_address);

    assert_only_event_approval(token.contract_address, OWNER(), SPENDER(), TOKEN_ID);
    assert_only_event_approval(world.contract_address, OWNER(), SPENDER(), TOKEN_ID);
}

//
// transfer_from
//

#[test]
fn test_transfer_from() {
    let (world, mut token) = setup();

    utils::impersonate(OWNER(),);
    token.approve(SPENDER(), TOKEN_ID);

    utils::drop_all_events(token.contract_address);
    utils::drop_all_events(world.contract_address);
    utils::assert_no_events_left(token.contract_address);

    utils::impersonate(SPENDER());
    token.transfer_from(OWNER(), RECIPIENT(), TOKEN_ID);

    assert_only_event_transfer(token.contract_address, OWNER(), RECIPIENT(), TOKEN_ID);

    assert(token.balance_of(RECIPIENT()) == 1, 'Should eq 1');
    assert(token.balance_of(OWNER(),) == 1, 'Should eq 1');
    assert(token.get_approved(TOKEN_ID) == ZERO(), 'Should eq 0');
    assert(token.total_supply() == 2, 'Should eq 2');
    assert(token.token_by_index(0) == TOKEN_ID, 'Should eq TOKEN_ID');
    assert(
        token.token_of_owner_by_index(RECIPIENT(), 0) == TOKEN_ID, 'Should eq TOKEN_ID'
    );
}

//
// mint
//

#[test]
fn test_mint() {
    let (_world, mut token) = setup();
    assert(token.total_supply() == 2, 'invalid total_supply init');
    mint(token, RECIPIENT());
    assert(token.balance_of(RECIPIENT()) == 1, 'invalid balance_of');
    assert(token.total_supply() == 3, 'invalid total_supply');
    assert(token.token_by_index(2) == TOKEN_ID_3, 'invalid token_by_index');
    assert(
        token.token_of_owner_by_index(RECIPIENT(), 0) == 3,
        'invalid token_of_owner_by_index'
    );
}

// #[test]
// #[should_panic(expected: ('DUELIST: caller is not minter', 'ENTRYPOINT_FAILED'))]
// fn test_mint_not_minter() {
//     let (_world, mut token, _minter) = setup();
//     token.mint(RECIPIENT(), TOKEN_ID_3);
// }

//
// burn
//

#[test]
fn test_burn() {
    let (_world, mut token) = setup();
    assert(token.total_supply() == 2, 'invalid total_supply init');
    token.delete_duelist(TOKEN_ID_2.low);
    assert(token.balance_of(OWNER(),) == 1, 'invalid balance_of');
    assert(token.total_supply() == 1, 'invalid total_supply');
    assert(token.token_by_index(0) == TOKEN_ID, 'invalid token_by_index');
    assert(token.token_of_owner_by_index(OWNER(), 0) == TOKEN_ID, 'invalid token_of_owner_by_index');
}

