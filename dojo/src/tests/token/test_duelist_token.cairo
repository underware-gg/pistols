use debug::PrintTrait;
use starknet::{ContractAddress, get_contract_address, get_caller_address, testing};
use dojo::world::{WorldStorage, WorldStorageTrait};
use dojo::model::{Model, ModelIndex};
use dojo_cairo_test::{
    spawn_test_world, NamespaceDef, TestResource, ContractDefTrait, ContractDef,
    WorldStorageTestTrait,
};

use pistols::systems::{
    bank::{bank, IBankDispatcher, IBankDispatcherTrait},
    tokens::{
        pack_token::{pack_token, IPackTokenDispatcher, IPackTokenDispatcherTrait},
        duelist_token::{duelist_token, IDuelistTokenDispatcher, IDuelistTokenDispatcherTrait},
        fame_coin::{fame_coin, IFameCoinDispatcher, IFameCoinDispatcherTrait},
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
    pack::{
        m_Pack, Pack,
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
        Score, ProfileType, DuelistProfile, Archetype
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
    table::{TABLES},
};

use pistols::interfaces::systems::{SystemsTrait, SELECTORS};
use pistols::types::constants::{CONST, FAME};
use pistols::tests::tester::{tester, tester::{OWNER, OTHER, RECIPIENT, SPENDER, TREASURY, ZERO}};
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
const TOKEN_ID_6: u256 = 6;
const TOKEN_ID_7: u256 = 7;
const TOKEN_ID_8: u256 = 8;
const TOKEN_ID_9: u256 = 9;
const TOKEN_ID_10: u256 = 10;

#[derive(Copy, Drop)]
pub struct TestSystems {
    world: WorldStorage,
    lords: ILordsMockDispatcher,
    token: IDuelistTokenDispatcher,
    pack: IPackTokenDispatcher,
    fame: IFameCoinDispatcher,
    bank: IBankDispatcher,
}

fn setup_uninitialized(fee_amount: u128) -> TestSystems {
    testing::set_block_number(1);
    testing::set_block_timestamp(1);

    let ndef = NamespaceDef {
        namespace: "pistols",
        resources: [
            // pistols models
            TestResource::Model(m_Player::TEST_CLASS_HASH),
            TestResource::Model(m_Pack::TEST_CLASS_HASH),
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
            // events
            TestResource::Event(e_PlayerActivity::TEST_CLASS_HASH),
            //
            // contracts
            TestResource::Contract(duelist_token::TEST_CLASS_HASH),
            TestResource::Contract(pack_token::TEST_CLASS_HASH),
            TestResource::Contract(fame_coin::TEST_CLASS_HASH),
            // TestResource::Contract(bank::TEST_CLASS_HASH),
            // TestResource::Contract(lords_mock::TEST_CLASS_HASH),
        ].span()
    };

    let mut world: WorldStorage = spawn_test_world([ndef].span());

    let mut contract_defs: Array<ContractDef> = array![
        ContractDefTrait::new(@"pistols", @"duelist_token")
            .with_writer_of([dojo::utils::bytearray_hash(@"pistols")].span())
            .with_init_calldata([
                'pistols.underware.gg',
                0, // renderer_address
            ].span()),
        ContractDefTrait::new(@"pistols", @"pack_token")
            .with_writer_of([dojo::utils::bytearray_hash(@"pistols")].span())
            .with_init_calldata([
                'pistols.underware.gg',
            ].span()),
        ContractDefTrait::new(@"pistols", @"fame_coin")
            .with_writer_of([
                // same as config
                selector_from_tag!("pistols-CoinConfig"),
                selector_from_tag!("pistols-TokenBoundAddress"),
            ].span()),
        // ContractDefTrait::new(@"pistols", @"bank")
        //     .with_writer_of([dojo::utils::bytearray_hash(@"pistols")].span()),
        // ContractDefTrait::new(@"pistols", @"lords_mock")
        //     .with_writer_of([dojo::utils::bytearray_hash(@"pistols")].span())
        //     .with_init_calldata([
        //         0, // minter
        //         10_000_000_000_000_000_000_000, // 10,000 Lords
        //     ].span()),
    ];

    world.sync_perms_and_inits(contract_defs.span());

    tester::impersonate(OWNER());

    tester::set_Config(ref world, Config {
        key: CONFIG::CONFIG_KEY,
        treasury_address: TREASURY(),
        lords_address: world.lords_mock_address(),
        vrf_address: world.vrf_mock_address(),
        is_paused: false,
    });

    TestSystems{
        world,
        lords: world.lords_mock_dispatcher(),
        token: world.duelist_token_dispatcher(),
        pack: world.pack_token_dispatcher(),
        fame: world.fame_coin_dispatcher(),
        bank: world.bank_dispatcher(),
    }
}

fn setup(fee_amount: u128) -> TestSystems {
    let mut sys: TestSystems = setup_uninitialized(fee_amount);

    // initialize contracts
    tester::execute_claim_welcome_pack(@sys.pack, OWNER());
    
    tester::impersonate(OWNER());

    // drop all events
    utils::drop_all_events(sys.world.dispatcher.contract_address);
    utils::drop_all_events(sys.token.contract_address);

    (sys)
}

fn _assert_minted_count(world: WorldStorage, token: IDuelistTokenDispatcher, minted_count: usize, msg: felt252) {
    // assert(token.total_supply() == minted_count, 'msg);
    let token_config: TokenConfig = tester::get_TokenConfig(world, token.contract_address);
    assert(token_config.minted_count == minted_count.into(), msg);
}

//
// initialize
//

#[test]
fn test_initializer() {
    let mut sys: TestSystems = setup(100);
    // assert(sys.token.name() == "Pistols at 10 Blocks Duelists", 'Name is wrong');
    assert(sys.token.symbol() == "DUELIST", 'Symbol is wrong');

    _assert_minted_count(sys.world, sys.token, CONST::WELCOME_PACK_DUELIST_COUNT, 'Should eq [5]');
    assert(sys.token.balance_of(OWNER()) == CONST::WELCOME_PACK_DUELIST_COUNT.into(), 'Should eq [5] (OWNER)');
    assert(sys.token.balance_of(OTHER()) == 0, 'Should eq 0 (OTHER)');

    assert(sys.token.owner_of(TOKEN_ID_1) == OWNER(), 'owner_of_1');

    assert(sys.token.supports_interface(interface::IERC721_ID) == true, 'should support IERC721_ID');
    assert(sys.token.supports_interface(interface::IERC721_METADATA_ID) == true, 'should support METADATA');
    // assert(sys.token.supports_interface(interface::IERC721_ENUMERABLE_ID) == true, 'should support ENUMERABLE');
}

#[test]
fn test_token_component() {
    let mut sys: TestSystems = setup(100);
    // should not panic
    sys.token.owner_of(TOKEN_ID_1);//.print();
    sys.token.is_owner_of(OWNER(), TOKEN_ID_1.low);//.print();
}

#[test]
fn test_token_uri() {
    let mut sys: TestSystems = setup(100);

    let duelist = Duelist {
        duelist_id: TOKEN_ID_1.low,
        profile_type: ProfileType::Duelist(DuelistProfile::Duke),
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
    tester::set_Duelist(ref sys.world, duelist);

    let uri_1 = sys.token.token_uri(TOKEN_ID_1);
    let uri_2 = sys.token.token_uri(TOKEN_ID_2);
    
    println!("{}", uri_1);
    println!("{}", uri_2);

    assert(uri_1.len() > 100, 'Uri 1 should not be empty');
    assert(uri_2.len() > 100, 'Uri 2 should not be empty');
    // assert(uri_1.len() > uri_2.len(), 'uri_1 > uri_2');
}

#[test]
#[should_panic(expected: ('ERC721: invalid token ID', 'ENTRYPOINT_FAILED'))]
fn test_token_uri_invalid() {
    let mut sys: TestSystems = setup(100);
    sys.token.token_uri(999);
}


//
// mint
//

#[test]
#[should_panic(expected: ('TOKEN: caller is not minter', 'ENTRYPOINT_FAILED'))]
fn test_mint_duelist_not_minter() {
    let mut sys: TestSystems = setup(100);
    sys.token.mint_duelists(OWNER(), 1, 0x1234);
}

//
// approve
//

#[test]
fn test_approve() {
    let mut sys: TestSystems = setup(100);

    utils::impersonate(OWNER());

    sys.token.approve(SPENDER(), TOKEN_ID_1);
    assert(sys.token.get_approved(TOKEN_ID_1) == SPENDER(), 'Spender not approved correctly');

    // drop StoreSetRecord ERC721TokenApprovalModel
    utils::drop_event(sys.world.dispatcher.contract_address);

    // TODO: fix events
    // // drop StoreSetRecord ERC721TokenApprovalModel
    // utils::drop_event(sys.world.dispatcher.contract_address);
    // assert_only_event_approval(sys.token.contract_address, OWNER(), SPENDER(), TOKEN_ID_1);
    // assert_only_event_approval(sys.world.dispatcher.contract_address, OWNER(), SPENDER(), TOKEN_ID_1);
}

//
// transfer_from
//

#[test]
fn test_transfer_from() {
    let mut sys: TestSystems = setup(100);

    assert(sys.token.balance_of(OWNER()) == CONST::WELCOME_PACK_DUELIST_COUNT.into(), 'Should eq [5]');
    assert(sys.token.balance_of(OTHER()) == 0, 'Should eq 0');
    _assert_minted_count(sys.world, sys.token, CONST::WELCOME_PACK_DUELIST_COUNT, 'Should eq [5]');

    tester::impersonate(OWNER());
    sys.token.approve(SPENDER(), TOKEN_ID_1);

    utils::drop_all_events(sys.token.contract_address);
    utils::drop_all_events(sys.world.dispatcher.contract_address);
    utils::assert_no_events_left(sys.token.contract_address);

    tester::impersonate(SPENDER());
    sys.token.transfer_from(OWNER(), OTHER(), TOKEN_ID_1);

    // TODO: fix events
    // assert_only_event_transfer(sys.token.contract_address, OWNER(), OTHER(), TOKEN_ID_1);

    assert(sys.token.balance_of(OWNER()) == 4, 'Should eq 4');
    assert(sys.token.balance_of(OTHER()) == 1, 'Should eq 1');
    assert(sys.token.get_approved(TOKEN_ID_1) == ZERO(), 'Should eq 0');
    _assert_minted_count(sys.world, sys.token, CONST::WELCOME_PACK_DUELIST_COUNT, 'Should eq [5]/');
    // assert(sys.token.total_supply() == 2, 'Should eq 2');
    // assert(sys.token.token_of_owner_by_index(OTHER(), 1) == TOKEN_ID_1, 'Should eq TOKEN_ID_1');
}

#[test]
#[should_panic(expected: ('ERC721: unauthorized caller', 'ENTRYPOINT_FAILED'))]
fn test_transfer_no_allowance() {
    let mut sys: TestSystems = setup(100);
    utils::impersonate(SPENDER());
    sys.token.transfer_from(OWNER(), OTHER(), TOKEN_ID_1);
}

//
// burn
//

// #[test]
// #[should_panic(expected: ('DUELIST: Not implemented', 'ENTRYPOINT_FAILED'))]
// fn test_burn() {
//     let mut sys: TestSystems = setup(100);
//     _assert_minted_count(sys.world, sys.token, 2, 'invalid total_supply init');
//     assert(sys.token.balance_of(OWNER()) == 1, 'invalid balance_of (1)');
//     sys.token.delete_duelist(TOKEN_ID_1.low);
//     _assert_minted_count(sys.world, sys.token, 1, 'invalid total_supply');
//     assert(sys.token.balance_of(OWNER()) == 0, 'invalid balance_of (0)');
// }


//---------------------------------
// FAME
//

#[test]
fn test_fame() {
    let mut sys: TestSystems = setup(0);

    tester::execute_claim_welcome_pack(@sys.pack, OTHER());

    // validate token_bound address
    let token_bound_address_1: ContractAddress = sys.fame.address_of_token(sys.token.contract_address, TOKEN_ID_1.low);
    let token_bound_address_6: ContractAddress = sys.fame.address_of_token(sys.token.contract_address, TOKEN_ID_6.low);
    assert(token_bound_address_1.is_non_zero(), 'token_bound_address_1');
    assert(token_bound_address_6.is_non_zero(), 'token_bound_address_6');
    assert(token_bound_address_1 != token_bound_address_6, 'token_bound_address_1 != 2');
    let (token_contract_1, token_id_1) = sys.fame.token_of_address(token_bound_address_1);
    let (token_contract_6, token_id_6) = sys.fame.token_of_address(token_bound_address_6);
    assert(token_contract_1 == sys.token.contract_address, 'token_contract_1');
    assert(token_contract_6 == sys.token.contract_address, 'token_contract_6');
    assert(token_id_1 == TOKEN_ID_1.low, 'token_id_1');
    assert(token_id_6 == TOKEN_ID_6.low, 'token_id_6');

    // initial token balances
    let balance_1_initial: u256 = sys.fame.balance_of_token(sys.token.contract_address, TOKEN_ID_1.low);
    let balance_6_initial: u256 = sys.fame.balance_of_token(sys.token.contract_address, TOKEN_ID_6.low);
    assert(FAME::MIN_MINT_GRANT_AMOUNT > 0, 'FAME::MIN_MINT_GRANT_AMOUNT > 0');
    assert(balance_1_initial == FAME::MIN_MINT_GRANT_AMOUNT, 'balance_1_initial');
    assert(balance_6_initial == FAME::MIN_MINT_GRANT_AMOUNT, 'balance_6_initial');

    // owner balances must match
    let mut balance_owner_initial: u256 = sys.fame.balance_of(OWNER());
    let mut balance_other_initial: u256 = sys.fame.balance_of(OTHER());
    assert(balance_owner_initial == balance_1_initial * CONST::WELCOME_PACK_DUELIST_COUNT.into(), 'balance_owner_initial');
    assert(balance_other_initial == balance_6_initial * CONST::WELCOME_PACK_DUELIST_COUNT.into(), 'balance_other_initial');

    // transfer duelist
    tester::impersonate(OWNER());
    sys.token.transfer_from(OWNER(), OTHER(), TOKEN_ID_1);
    // check balances
    let balance_1: u256 = sys.fame.balance_of_token(sys.token.contract_address, TOKEN_ID_1.low);
    let balance_6: u256 = sys.fame.balance_of_token(sys.token.contract_address, TOKEN_ID_6.low);
    let balance_owner: u256 = sys.fame.balance_of(OWNER());
    let balance_other: u256 = sys.fame.balance_of(OTHER());
    let balance_recipient: u256 = sys.fame.balance_of(RECIPIENT());
    assert(balance_1 == balance_1_initial, 'balance_1 (1)');
    assert(balance_6 == balance_6_initial, 'balance_6 (1)');
    assert(balance_owner == balance_owner_initial - balance_1, 'balance_owner (1)');
    assert(balance_other == balance_other_initial + balance_1, 'balance_other (1)');
    assert(balance_recipient == 0, 'balance_recipient (1)');
    let balance_owner_last = balance_owner;
    let balance_other_last = balance_other;

    // transfer to new owner
    tester::impersonate(OTHER());
    sys.token.transfer_from(OTHER(), RECIPIENT(), TOKEN_ID_6);
    let balance_owner: u256 = sys.fame.balance_of(OWNER());
    let balance_other: u256 = sys.fame.balance_of(OTHER());
    let balance_recipient: u256 = sys.fame.balance_of(RECIPIENT());
    assert(balance_6 == balance_6_initial, 'balance_6 (2)');
    assert(balance_owner == balance_owner_last, 'balance_owner (2)');
    assert(balance_other == balance_other_last - balance_6, 'balance_other (2)');
    assert(balance_recipient == balance_6, 'balance_recipient (2)');

    // transfer all
    tester::impersonate(OTHER());
    sys.token.transfer_from(OTHER(), OWNER(), TOKEN_ID_1);
    sys.token.transfer_from(OTHER(), RECIPIENT(), TOKEN_ID_7);
    sys.token.transfer_from(OTHER(), RECIPIENT(), TOKEN_ID_8);
    sys.token.transfer_from(OTHER(), RECIPIENT(), TOKEN_ID_9);
    sys.token.transfer_from(OTHER(), RECIPIENT(), TOKEN_ID_10);
    let balance_owner: u256 = sys.fame.balance_of(OWNER());
    let balance_other: u256 = sys.fame.balance_of(OTHER());
    let balance_recipient: u256 = sys.fame.balance_of(RECIPIENT());
    assert(balance_owner == balance_owner_initial, 'balance_owner (3)');
    assert(balance_other == 0, 'balance_other (3)');
    assert(balance_recipient == balance_other_initial, 'balance_recipient (3)');
}

#[test]
#[should_panic(expected: ('ERC20: insufficient allowance', 'ENTRYPOINT_FAILED'))]
fn test_fame_transfer_between_owners_not_allowed() {
    let mut sys: TestSystems = setup(0);
    // transfer FAME
    tester::impersonate(sys.token.contract_address);
    sys.fame.transfer_from(OWNER(), OTHER(), FAME::MIN_MINT_GRANT_AMOUNT / 2);
}

#[test]
#[should_panic(expected: ('COIN: caller is not minter', 'ENTRYPOINT_FAILED'))]
fn test_fame_transfer_from_owner_not_allowed() {
    let mut sys: TestSystems = setup(0);
    // transfer FAME
    tester::impersonate(OWNER());
    sys.fame.transfer(OTHER(), FAME::MIN_MINT_GRANT_AMOUNT / 2);
}

#[test]
#[should_panic(expected: ('COIN: caller is not minter', 'ENTRYPOINT_FAILED'))]
fn test_fame_mint_not_minter() {
    let mut sys: TestSystems = setup(0);
    sys.fame.minted_duelist(TOKEN_ID_3.low, 0);
}

#[test]
#[should_panic(expected: ('COIN: caller is not minter', 'ENTRYPOINT_FAILED'))]
fn test_fame_update_not_minter() {
    let mut sys: TestSystems = setup(0);
    sys.fame.updated_duelist(OWNER(), OTHER(), TOKEN_ID_1.low);
}

#[test]
#[should_panic(expected: ('TOKEN_BOUND: already registered', 'ENTRYPOINT_FAILED'))]
fn test_fame_mint_already_registered() {
    let mut sys: TestSystems = setup(0);
    utils::impersonate(sys.token.contract_address);
    sys.fame.minted_duelist(TOKEN_ID_1.low, 0);
}
