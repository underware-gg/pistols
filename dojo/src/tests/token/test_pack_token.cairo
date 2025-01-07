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
        duelist_token::{duelist_token, IDuelistTokenDispatcher, IDuelistTokenDispatcherTrait},
        pack_token::{pack_token, IPackTokenDispatcher, IPackTokenDispatcherTrait},
        fame_coin::{fame_coin, IFameCoinDispatcher, IFameCoinDispatcherTrait},
        lords_mock::{lords_mock, ILordsMockDispatcher, ILordsMockDispatcherTrait},
    },
    components::{
        token_bound::{m_TokenBoundAddress, TokenBoundAddress},
    },
    vrf_mock::{vrf_mock},
};
use pistols::models::{
    player::{
        m_Player, Player, PlayerTrait,
        e_PlayerActivity, PlayerActivity,
    },
    duelist::{
        m_Duelist, Duelist, ProfileType,
    },
    pack::{
        m_Pack, Pack, PackType, PackTypeTrait,
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

#[derive(Copy, Drop)]
pub struct TestSystems {
    world: WorldStorage,
    lords: ILordsMockDispatcher,
    token: IPackTokenDispatcher,
    duelists: IDuelistTokenDispatcher,
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
            TestResource::Model(m_Duelist::TEST_CLASS_HASH),
            TestResource::Model(m_Payment::TEST_CLASS_HASH),
            TestResource::Model(m_Config::TEST_CLASS_HASH),
            TestResource::Model(m_CoinConfig::TEST_CLASS_HASH),
            TestResource::Model(m_TokenBoundAddress::TEST_CLASS_HASH),
            TestResource::Model(m_TokenConfig::TEST_CLASS_HASH),
            // events
            TestResource::Event(e_PlayerActivity::TEST_CLASS_HASH),
            //
            // contracts
            TestResource::Contract(duelist_token::TEST_CLASS_HASH),
            TestResource::Contract(pack_token::TEST_CLASS_HASH),
            TestResource::Contract(fame_coin::TEST_CLASS_HASH),
            TestResource::Contract(bank::TEST_CLASS_HASH),
            TestResource::Contract(lords_mock::TEST_CLASS_HASH),
            TestResource::Contract(vrf_mock::TEST_CLASS_HASH),
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
            .with_writer_of([dojo::utils::bytearray_hash(@"pistols")].span()),
        ContractDefTrait::new(@"pistols", @"bank")
            .with_writer_of([dojo::utils::bytearray_hash(@"pistols")].span()),
        ContractDefTrait::new(@"pistols", @"lords_mock")
            .with_writer_of([dojo::utils::bytearray_hash(@"pistols")].span())
            .with_init_calldata([
                0, // minter
                10_000_000_000_000_000_000_000, // 10,000 Lords
            ].span()),
        ContractDefTrait::new(@"pistols", @"vrf_mock"),
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
        token: world.pack_token_dispatcher(),
        duelists: world.duelist_token_dispatcher(),
        bank: world.bank_dispatcher(),
    }
}

fn setup(fee_amount: u128) -> TestSystems {
    let mut sys: TestSystems = setup_uninitialized(fee_amount);

    tester::execute_lords_faucet(@sys.lords, OWNER());
    tester::execute_lords_faucet(@sys.lords, OTHER());

    tester::impersonate(OWNER());

    // drop all events
    utils::drop_all_events(sys.world.dispatcher.contract_address);
    utils::drop_all_events(sys.token.contract_address);

    (sys)
}

fn _assert_minted_count(world: WorldStorage, token: IPackTokenDispatcher, minted_count: u128, msg: felt252) {
    // assert(token.total_supply() == minted_count, 'msg);
    let token_config: TokenConfig = tester::get_TokenConfig(world, token.contract_address);
    assert(token_config.minted_count == minted_count, msg);
}
fn _assert_duelist_count(world: WorldStorage, token: IDuelistTokenDispatcher, minted_count: u128, msg: felt252) {
    // assert(token.total_supply() == minted_count, 'msg);
    let token_config: TokenConfig = tester::get_TokenConfig(world, token.contract_address);
    assert(token_config.minted_count == minted_count, msg);
}

fn _purchase(sys: TestSystems, recipient: ContractAddress) {
    let price: u128 = sys.token.calc_mint_fee(recipient, PackType::Duelists5x);
    assert(price > 0, 'invalid price');
    tester::impersonate(recipient);
    tester::execute_lords_approve(@sys.lords, recipient, sys.bank.contract_address, price);
    sys.token.purchase(PackType::Duelists5x);
}

//
// initialize
//

#[test]
fn test_initializer() {
    let mut sys: TestSystems = setup(0);
    // assert(sys.token.name() == "Pistols at 10 Blocks Duelists", 'Name is wrong');
    assert(sys.token.symbol() == "PACK", 'Symbol is wrong');

    _assert_minted_count(sys.world, sys.token, 0, 'Should eq 0');

    assert(sys.token.supports_interface(interface::IERC721_ID) == true, 'should support IERC721_ID');
    assert(sys.token.supports_interface(interface::IERC721_METADATA_ID) == true, 'should support METADATA');
    // assert(sys.token.supports_interface(interface::IERC721_ENUMERABLE_ID) == true, 'should support ENUMERABLE');
}

#[test]
fn test_token_uri() {
    let mut sys: TestSystems = setup(0);

    let pack = Pack {
        pack_id: TOKEN_ID_1.low,
        pack_type: PackType::Duelists5x,
        seed: 999999,
        is_open: false,
    };

    tester::set_Pack(ref sys.world, pack);

    sys.token.claim_welcome_pack();
    _purchase(sys, OWNER());

    let uri = sys.token.token_uri(TOKEN_ID_2);
    assert(uri.len() > 100, 'Uri 1 should not be empty');
    println!("{}", uri);
}

#[test]
#[should_panic(expected: ('ERC721: invalid token ID', 'ENTRYPOINT_FAILED'))]
fn test_token_uri_invalid() {
    let mut sys: TestSystems = setup(0);
    sys.token.token_uri(999);
}


//
// mint
//

#[test]
fn test_claim_mint() {
    let mut sys: TestSystems = setup(0);
    _assert_minted_count(sys.world, sys.token, 0, 'total_supply init');
    assert(sys.token.balance_of(OWNER()) == 0, 'balance_of 0');

    let player: Player = tester::get_Player(sys.world, OWNER());
    assert(!player.exists(), '!player.exists()');
    assert(player.claimed_welcome_pack == false, '!player.claimed_welcome_pack');

    sys.token.claim_welcome_pack();
    _assert_minted_count(sys.world, sys.token, 1, 'total_supply 1');
    _assert_duelist_count(sys.world, sys.duelists, 5, 'duelist_supply 5');
    assert(sys.token.balance_of(OWNER()) == 1, 'balance_of 1');
    assert(sys.token.owner_of(TOKEN_ID_1) == OWNER(), 'owner_of_1');

    let player: Player = tester::get_Player(sys.world, OWNER());
    assert(player.exists(), 'player.exists()');
    assert(player.claimed_welcome_pack == true, 'player.claimed_welcome_pack');
    let pack_1: Pack = tester::get_Pack(sys.world, TOKEN_ID_1.low);
    assert(pack_1.pack_id == TOKEN_ID_1.low, 'pack_1.pack_id');
    assert(pack_1.pack_type == PackType::WelcomePack, 'pack_1.pack_type');
    assert(pack_1.seed != 0, 'pack_1.seed');
    assert(pack_1.is_open == true, 'pack_1.is_open');

    _purchase(sys, OWNER());
    _assert_minted_count(sys.world, sys.token, 2, 'total_supply 2');
    assert(sys.token.balance_of(OWNER()) == 2, 'balance_of 2');
    assert(sys.token.owner_of(TOKEN_ID_2) == OWNER(), 'owner_of_2');

    let pack_2: Pack = tester::get_Pack(sys.world, TOKEN_ID_2.low);
    assert(pack_2.pack_id == TOKEN_ID_2.low, 'pack_2.pack_id');
    assert(pack_2.pack_type == PackType::Duelists5x, 'pack_2.pack_type');
    assert(pack_2.seed != pack_1.seed, 'pack_2.seed');
    assert(pack_2.is_open == false, 'pack_2.is_open');

    tester::impersonate(OTHER());
    sys.token.claim_welcome_pack();
}

#[test]
#[should_panic(expected: ('BANK: insufficient allowance', 'ENTRYPOINT_FAILED', 'ENTRYPOINT_FAILED'))]
fn test_mint_no_allowance_zero() {
    let mut sys: TestSystems = setup(0);
    sys.token.claim_welcome_pack();
    sys.token.purchase(PackType::Duelists5x);
}

#[test]
#[should_panic(expected: ('BANK: insufficient allowance', 'ENTRYPOINT_FAILED', 'ENTRYPOINT_FAILED'))]
fn test_mint_no_allowance_half() {
    let mut sys: TestSystems = setup(0);
    sys.token.claim_welcome_pack();
    let price: u128 = sys.token.calc_mint_fee(OWNER(), PackType::Duelists5x);
    tester::execute_lords_approve(@sys.lords, OWNER(), sys.bank.contract_address, price / 2);
    sys.token.purchase(PackType::Duelists5x);
}

#[test]
#[should_panic(expected: ('PACK: Already claimed', 'ENTRYPOINT_FAILED'))]
fn test_claim_twice() {
    let mut sys: TestSystems = setup(0);
    sys.token.claim_welcome_pack();
    sys.token.claim_welcome_pack();
}

#[test]
#[should_panic(expected: ('PACK: Claim duelists first', 'ENTRYPOINT_FAILED'))]
fn test_no_claim() {
    let mut sys: TestSystems = setup(0);
    _purchase(sys, OWNER());
}

#[test]
#[should_panic(expected: ('PACK: Not for sale', 'ENTRYPOINT_FAILED'))]
fn test_mint_not_for_sale() {
    let mut sys: TestSystems = setup(0);
    sys.token.claim_welcome_pack();
    sys.token.purchase(PackType::WelcomePack);
}


//
// opening...
//

#[test]
fn test_open() {
    let mut sys: TestSystems = setup(0);
    sys.token.claim_welcome_pack();
    _assert_duelist_count(sys.world, sys.duelists, 5, 'duelist_supply 5');
    let pack_1: Pack = tester::get_Pack(sys.world, TOKEN_ID_1.low);
    assert(pack_1.is_open == true, 'pack_1.is_open == true');

    _purchase(sys, OWNER());
    _assert_duelist_count(sys.world, sys.duelists, 5, 'duelist_supply 5/');
    let pack_2: Pack = tester::get_Pack(sys.world, TOKEN_ID_2.low);
    assert(pack_2.is_open == false, 'pack_2.is_open == false');

    sys.token.open(TOKEN_ID_2.low);
    _assert_duelist_count(sys.world, sys.duelists, 10, 'duelist_supply 10');
    let pack_2: Pack = tester::get_Pack(sys.world, TOKEN_ID_2.low);
    assert(pack_2.is_open == true, 'pack_2.is_open == false');
}

#[test]
#[should_panic(expected: ('ERC721: invalid token ID', 'ENTRYPOINT_FAILED'))]
fn test_open_invalid() {
    let mut sys: TestSystems = setup(0);
    tester::impersonate(OWNER());
    sys.token.open(TOKEN_ID_2.low);
}

#[test]
#[should_panic(expected: ('PACK: Already opened', 'ENTRYPOINT_FAILED'))]
fn test_already_opened() {
    let mut sys: TestSystems = setup(0);
    sys.token.claim_welcome_pack();
    tester::impersonate(OWNER());
    sys.token.open(TOKEN_ID_1.low);
}

#[test]
#[should_panic(expected: ('PACK: Not owner', 'ENTRYPOINT_FAILED'))]
fn test_open_not_owner() {
    let mut sys: TestSystems = setup(0);
    sys.token.claim_welcome_pack();
    _purchase(sys, OWNER());
    tester::impersonate(OTHER());
    sys.token.open(TOKEN_ID_2.low);
}


//
// transfer...
//

#[test]
#[should_panic(expected: ('PACK: Already opened', 'ENTRYPOINT_FAILED'))]
fn test_transfer_opened() {
    let mut sys: TestSystems = setup(0);
    sys.token.claim_welcome_pack();
    // try to transfer already opened
    utils::impersonate(OWNER());
    sys.token.transfer_from(OWNER(), OTHER(), TOKEN_ID_1);
}

#[test]
#[should_panic(expected: ('PACK: Already opened', 'ENTRYPOINT_FAILED'))]
fn test_transfer_opened_allowed() {
    let mut sys: TestSystems = setup(0);
    sys.token.claim_welcome_pack();
    // approve
    tester::impersonate(OWNER());
    sys.token.approve(SPENDER(), TOKEN_ID_1);
    // try to transfer from unauthorized
    utils::impersonate(SPENDER());
    sys.token.transfer_from(OWNER(), OTHER(), TOKEN_ID_1);
}

#[test]
#[should_panic(expected: ('ERC721: unauthorized caller', 'ENTRYPOINT_FAILED'))]
fn test_transfer_opened_no_allowance() {
    let mut sys: TestSystems = setup(0);
    sys.token.claim_welcome_pack();
    // try to transfer from unauthorized
    utils::impersonate(SPENDER());
    sys.token.transfer_from(OWNER(), OTHER(), TOKEN_ID_1);
}

#[test]
fn test_transfer_unopened_ok() {
    let mut sys: TestSystems = setup(0);
    sys.token.claim_welcome_pack();
    _purchase(sys, OWNER());
    assert(sys.token.balance_of(OWNER()) == 2, 'balance_of(OWNER) 2');
    assert(sys.token.balance_of(OTHER()) == 0, 'balance_of(OTHER) 0');
    assert(sys.token.owner_of(TOKEN_ID_2) == OWNER(), 'owner_of(OWNER)');
    // transfer
    tester::impersonate(OWNER());
    sys.token.transfer_from(OWNER(), OTHER(), TOKEN_ID_2);
    // check ownership
    assert(sys.token.balance_of(OWNER()) == 1, 'balance_of(OWNER) 1');
    assert(sys.token.balance_of(OTHER()) == 1, 'balance_of(OTHER) 1');
    assert(sys.token.owner_of(TOKEN_ID_2) == OTHER(), 'owner_of(OTHER)');
}

#[test]
fn test_transfer_unopened_allowed_ok() {
    let mut sys: TestSystems = setup(0);
    sys.token.claim_welcome_pack();
    _purchase(sys, OWNER());
    assert(sys.token.balance_of(OWNER()) == 2, 'balance_of(OWNER) 2');
    assert(sys.token.balance_of(OTHER()) == 0, 'balance_of(OTHER) 0');
    assert(sys.token.owner_of(TOKEN_ID_2) == OWNER(), 'owner_of(OWNER)');
    // approve
    tester::impersonate(OWNER());
    sys.token.approve(SPENDER(), TOKEN_ID_2);
    // transfer
    tester::impersonate(SPENDER());
    sys.token.transfer_from(OWNER(), OTHER(), TOKEN_ID_2);
    // check ownership
    assert(sys.token.balance_of(OWNER()) == 1, 'balance_of(OWNER) 1');
    assert(sys.token.balance_of(OTHER()) == 1, 'balance_of(OTHER) 1');
    assert(sys.token.owner_of(TOKEN_ID_2) == OTHER(), 'owner_of(OTHER)');
}

#[test]
#[should_panic(expected: ('ERC721: unauthorized caller', 'ENTRYPOINT_FAILED'))]
fn test_transfer_unopened_no_allowance() {
    let mut sys: TestSystems = setup(0);
    sys.token.claim_welcome_pack();
    _purchase(sys, OWNER());
    // try to transfer from unauthorized
    utils::impersonate(SPENDER());
    sys.token.transfer_from(OWNER(), OTHER(), TOKEN_ID_2);
}
