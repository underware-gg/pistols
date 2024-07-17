use debug::PrintTrait;
use integer::BoundedInt;
use starknet::{ContractAddress, get_contract_address, get_caller_address, testing};
use starknet::storage::{StorageMemberAccessTrait};
use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};
use dojo::test_utils::spawn_test_world;
use token::tests::constants::{ZERO, OWNER, SPENDER, RECIPIENT};//, TOKEN_ID, TOKEN_ID_2, TOKEN_ID_3};

use token::tests::utils;

use token::components::introspection::src5::src5_component::{SRC5Impl};
use token::components::token::erc721::interface::{
    IERC721_ID, IERC721_METADATA_ID, IERC721_ENUMERABLE_ID,
};

use token::components::token::erc721::erc721_approval::{
    erc_721_token_approval_model, ERC721TokenApprovalModel, erc_721_operator_approval_model,
    ERC721OperatorApprovalModel
};
use token::components::token::erc721::erc721_approval::erc721_approval_component;
use token::components::token::erc721::erc721_approval::erc721_approval_component::{
    Approval, ApprovalForAll, ERC721ApprovalImpl, InternalImpl as ERC721ApprovalInternalImpl
};


use token::components::token::erc721::erc721_metadata::{erc_721_meta_model, ERC721MetaModel,};
use token::components::token::erc721::erc721_metadata::erc721_metadata_component::{
    ERC721MetadataImpl, ERC721MetadataCamelImpl, InternalImpl as ERC721MetadataInternalImpl
};

use token::components::token::erc721::erc721_balance::{erc_721_balance_model, ERC721BalanceModel,};
use token::components::token::erc721::erc721_balance::erc721_balance_component::{
    Transfer, ERC721BalanceImpl, InternalImpl as ERC721BalanceInternalImpl
};

use token::components::token::erc721::erc721_mintable::erc721_mintable_component::InternalImpl as ERC721MintableInternalImpl;
use token::components::token::erc721::erc721_burnable::erc721_burnable_component::InternalImpl as ERC721BurnableInternalImpl;

use pistols::systems::token_duelist::{
    token_duelist, ITokenDuelistDispatcher, ITokenDuelistDispatcherTrait,
};
use pistols::systems::minter::{
    minter, IMinterDispatcher, IMinterDispatcherTrait,
};
use pistols::models::{
    token_config::{token_config, TokenConfig, TokenConfigTrait},
    duelist::{duelist, Duelist, Score, scoreboard, Scoreboard, profile_pic_type},
};

use pistols::models::table::{tables};
use pistols::types::constants::{constants};

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

fn setup_uninitialized() -> (IWorldDispatcher, ITokenDuelistDispatcher, IMinterDispatcher) {
    testing::set_block_number(1);
    testing::set_block_timestamp(1);

    let mut world = spawn_test_world(
        array![
            erc_721_token_approval_model::TEST_CLASS_HASH,
            erc_721_balance_model::TEST_CLASS_HASH,
            erc_721_meta_model::TEST_CLASS_HASH,
            token_config::TEST_CLASS_HASH,
            duelist::TEST_CLASS_HASH,
            scoreboard::TEST_CLASS_HASH,
        ]
    );

    let mut token = ITokenDuelistDispatcher {
        contract_address: world.deploy_contract('salt',
            token_duelist::TEST_CLASS_HASH.try_into().unwrap(),
            array![].span(),
        )
    };
    let minter_call_data: Array<felt252> = array![
        token.contract_address.into(),
        3, // max_supply
        2, // wallet_max
        1, // is_open
    ];
    let mut minter = IMinterDispatcher {
        contract_address: world.deploy_contract('salt2',
            minter::TEST_CLASS_HASH.try_into().unwrap(),
            minter_call_data.span(),
        )
    };

    // setup auth
    world.grant_writer(selector!("SRC5Model"), token.contract_address);
    world.grant_writer(selector!("InitializableModel"), token.contract_address);
    world.grant_writer(selector!("ERC721MetaModel"), token.contract_address);
    world.grant_writer(selector!("ERC721TokenApprovalModel"), token.contract_address);
    world.grant_writer(selector!("ERC721BalanceModel"), token.contract_address);
    world.grant_writer(selector!("ERC721EnumerableIndexModel"),token.contract_address);
    world.grant_writer(selector!("ERC721EnumerableOwnerIndexModel"),token.contract_address);
    world.grant_writer(selector!("ERC721EnumerableTokenModel"),token.contract_address);
    world.grant_writer(selector!("ERC721EnumerableOwnerTokenModel"),token.contract_address);
    world.grant_writer(selector!("ERC721EnumerableTotalModel"),token.contract_address);
    world.grant_writer(selector!("ERC721MetadataModel"), token.contract_address);
    world.grant_writer(selector!("ERC721OwnerModel"), token.contract_address);
    world.grant_writer(selector!("TokenConfig"), token.contract_address);

    world.grant_writer(selector!("TokenConfig"), minter.contract_address);

    world.grant_writer(selector!("SRC5Model"), OWNER(),);
    world.grant_writer(selector!("InitializableModel"), OWNER(),);
    world.grant_writer(selector!("ERC721MetaModel"), OWNER(),);
    world.grant_writer(selector!("ERC721TokenApprovalModel"),  OWNER(),);
    world.grant_writer(selector!("ERC721BalanceModel"),  OWNER(),);
    world.grant_writer(selector!("ERC721EnumerableIndexModel"), OWNER(),);
    world.grant_writer(selector!("ERC721EnumerableOwnerIndexModel"), OWNER(),);
    world.grant_writer(selector!("ERC721EnumerableTokenModel"), OWNER(),);
    world.grant_writer(selector!("ERC721EnumerableOwnerTokenModel"), OWNER(),);
    world.grant_writer(selector!("ERC721EnumerableTotalModel"), OWNER(),);
    world.grant_writer(selector!("ERC721MetadataModel"),  OWNER(),);
    world.grant_writer(selector!("ERC721OwnerModel"),  OWNER(),);
    world.grant_writer(selector!("TokenConfig"), OWNER(),);
    world.grant_writer(selector!("Duelist"), OWNER(),);
    world.grant_writer(selector!("Scoreboard"), OWNER(),);

    utils::impersonate(OWNER(),);

    (world, token, minter)
}

fn setup() -> (IWorldDispatcher, ITokenDuelistDispatcher, IMinterDispatcher) {
    let (mut world, mut token, mut minter) = setup_uninitialized();

    // initialize contracts
    minter.mint(OWNER(), token.contract_address);
    minter.mint(OWNER(), token.contract_address);

    // drop all events
    utils::drop_all_events(world.contract_address);
    utils::drop_all_events(token.contract_address);
    utils::drop_all_events(minter.contract_address);

    (world, token, minter)
}

//
// initialize
//

#[test]
fn test_initializer() {
    let (_world, mut token, mut _minter) = setup();

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
    let (mut world, mut token, mut _minter) = setup();

    let duelist = Duelist {
        duelist_id: TOKEN_ID.low,
        name: 'Ser Walker',
        profile_pic_type: profile_pic_type::DUELIST,
        profile_pic_uri: "1",
        timestamp: 999999,
        score: Score {
            honour: 100,
            level_villain: 0,
            level_trickster: 0,
            level_lord: 90,
            total_duels: 6,
            total_wins: 3,
            total_losses: 2,
            total_draws: 1,
            total_honour: 500,
            honour_history: 0,
        },
    };
    let scoreboard: Scoreboard = Scoreboard{
        table_id: tables::LORDS,
        duelist_id: TOKEN_ID.low,
        score: duelist.score,
        wager_won: (1000 * constants::ETH_TO_WEI),
        wager_lost: (200 * constants::ETH_TO_WEI),
    };

    set!(world, (duelist));
    set!(world, (scoreboard));

let duelist: Duelist = get!(world, (TOKEN_ID), Duelist);
duelist.duelist_id.print();
duelist.name.print();

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
    let (_world, mut token, mut _minter) = setup();
    token.token_uri(999);
}

// #[test]
// #[should_panic(expected: ('ERC721: caller is not owner', 'ENTRYPOINT_FAILED'))]
// fn test_initialize_not_world_owner() {
//     let (_world, mut token, mut minter) = setup_uninitialized();

//     utils::impersonate(OWNER(),);

//     // initialize contracts
//     token.initialize("NAME", "SYMBOL", "URI");
// }

#[test]
#[should_panic(expected: ('Initializable: is initialized', 'ENTRYPOINT_FAILED'))]
fn test_initialize_multiple() {
    let (_world, mut token, mut _minter) = setup();

    token.initialize("NAME", "SYMBOL", "URI");
}

//
// approve
//

#[test]
fn test_approve() {
    let (world, mut token, mut _minter) = setup();

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
    let (world, mut token, mut _minter) = setup();

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
    let (_world, mut token, mut minter) = setup();

    assert(minter.can_mint(RECIPIENT(), token.contract_address) == true, '!can_mint');
    minter.mint(RECIPIENT(), token.contract_address);
    assert(token.balance_of(RECIPIENT()) == 1, 'invalid balance_of');
    assert(token.total_supply() == 3, 'invalid total_supply');
    assert(token.token_by_index(2) == TOKEN_ID_3, 'invalid token_by_index');
    assert(
        token.token_of_owner_by_index(RECIPIENT(), 0) == 3,
        'invalid token_of_owner_by_index'
    );
}

#[test]
#[should_panic(expected: ('DUELIST: caller is not minter', 'ENTRYPOINT_FAILED'))]
fn test_mint_not_minter() {
    let (_world, mut token, mut _minter) = setup();
    token.mint(RECIPIENT(), TOKEN_ID_3);
}

#[test]
#[should_panic(expected: ('MINTER: wallet maxed out', 'ENTRYPOINT_FAILED'))]
fn test_mint_maxed_out() {
    let (_world, mut token, mut minter) = setup();
    assert(minter.can_mint(OWNER(), token.contract_address) == false, 'can_mint');
    minter.mint(OWNER(), token.contract_address);
}

#[test]
#[should_panic(expected: ('MINTER: minted out', 'ENTRYPOINT_FAILED'))]
fn test_mint_minted_out() {
    let (_world, mut token, mut minter) = setup();
    assert(minter.can_mint(RECIPIENT(), token.contract_address) == true, 'can_mint');
    minter.mint(RECIPIENT(), token.contract_address);
    assert(minter.can_mint(RECIPIENT(), token.contract_address) == false, 'can_mint');
    minter.mint(RECIPIENT(), token.contract_address);
}

//
// burn
//

#[test]
fn test_burn() {
    let (_world, mut token, mut _minter) = setup();

    token.burn(TOKEN_ID_2);
    assert(token.balance_of(OWNER(),) == 1, 'invalid balance_of');
    assert(token.total_supply() == 1, 'invalid total_supply');
    assert(token.token_by_index(0) == TOKEN_ID, 'invalid token_by_index');
    assert(
        token.token_of_owner_by_index(OWNER(), 0) == TOKEN_ID,
        'invalid token_of_owner_by_index'
    );
}

