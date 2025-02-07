use core::num::traits::Zero;
use starknet::{ContractAddress, testing};
use dojo::world::{WorldStorage};
use dojo_cairo_test::{
    spawn_test_world, NamespaceDef, TestResource, ContractDefTrait, ContractDef,
    WorldStorageTestTrait,
};

use pistols::systems::{
    bank::{IBankDispatcher},
    tokens::{
        pack_token::{pack_token, IPackTokenDispatcher},
        duelist_token::{duelist_token, IDuelistTokenDispatcher, IDuelistTokenDispatcherTrait},
        fame_coin::{fame_coin, IFameCoinDispatcher, IFameCoinDispatcherTrait},
        lords_mock::{ILordsMockDispatcher},
    },
    components::{
        token_bound::{m_TokenBoundAddress},
    },
};
use pistols::models::{
    player::{
        m_Player,
        e_PlayerActivity,
        e_PlayerRequiredAction,
    },
    pack::{
        m_Pack,
    },
    challenge::{
        m_Challenge,
        m_Round,
    },
    duelist::{
        m_Duelist, Duelist,
        m_DuelistChallenge,
        m_Scoreboard, Scoreboard, Score,
        m_ScoreboardTable,
        ProfileType, DuelistProfile
    },
    pact::{
        m_Pact,
    },
    config::{
        m_Config, Config,
        m_TokenConfig, TokenConfig,
        m_CoinConfig,
        CONFIG,
    },
    season::{
        m_SeasonConfig,
    },
    table::{
        m_TableConfig,
        TABLES,
    },
};

use pistols::interfaces::systems::{SystemsTrait};
use pistols::types::constants::{CONST, FAME};
use pistols::tests::tester::{tester, tester::{OWNER, OTHER, RECIPIENT, SPENDER, TREASURY, ZERO}};
use pistols::tests::{utils};

use openzeppelin_token::erc721::interface;
use openzeppelin_token::erc721::{
    // ERC721Component,
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
    assert_eq!(event.from, from, "Invalid `from`");
    assert_eq!(event.to, to, "Invalid `to`");
    assert_eq!(event.token_id, token_id, "Invalid `token_id`");
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
    assert_eq!(event.owner, owner, "Invalid `owner`");
    assert_eq!(event.approved, spender, "Invalid `spender`");
    assert_eq!(event.token_id, token_id, "Invalid `token_id`");
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

const TOKEN_ID_1_1: u256 = 1;
const TOKEN_ID_1_2: u256 = 2;
const TOKEN_ID_2_1: u256 = 3;
const TOKEN_ID_2_2: u256 = 4;
const TOKEN_ID_3_1: u256 = 5;
const TOKEN_ID_3_2: u256 = 6;

#[derive(Copy, Drop)]
pub struct TestSystems {
    pub world: WorldStorage,
    pub lords: ILordsMockDispatcher,
    pub token: IDuelistTokenDispatcher,
    pub pack: IPackTokenDispatcher,
    pub fame: IFameCoinDispatcher,
    pub bank: IBankDispatcher,
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
            TestResource::Model(m_CoinConfig::TEST_CLASS_HASH),
            TestResource::Model(m_Config::TEST_CLASS_HASH),
            TestResource::Model(m_Duelist::TEST_CLASS_HASH),
            TestResource::Model(m_DuelistChallenge::TEST_CLASS_HASH),
            TestResource::Model(m_Pact::TEST_CLASS_HASH),
            TestResource::Model(m_Round::TEST_CLASS_HASH),
            TestResource::Model(m_Scoreboard::TEST_CLASS_HASH),
            TestResource::Model(m_ScoreboardTable::TEST_CLASS_HASH),
            TestResource::Model(m_SeasonConfig::TEST_CLASS_HASH),
            TestResource::Model(m_TableConfig::TEST_CLASS_HASH),
            TestResource::Model(m_TokenBoundAddress::TEST_CLASS_HASH),
            TestResource::Model(m_TokenConfig::TEST_CLASS_HASH),
            // events
            TestResource::Event(achievement::events::index::e_TrophyCreation::TEST_CLASS_HASH),
            TestResource::Event(achievement::events::index::e_TrophyProgression::TEST_CLASS_HASH),
            TestResource::Event(e_PlayerActivity::TEST_CLASS_HASH),
            TestResource::Event(e_PlayerRequiredAction::TEST_CLASS_HASH),
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
        season_table_id: TABLES::PRACTICE,
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

fn _assert_minted_count(world: WorldStorage, token: IDuelistTokenDispatcher, minted_count: usize, msg: ByteArray) {
    let token_config: TokenConfig = tester::get_TokenConfig(world, token.contract_address);
    assert_eq!(token_config.minted_count, minted_count.into(), "{}", msg);
}

//
// initialize
//

#[test]
fn test_initializer() {
    let mut sys: TestSystems = setup(0);
    assert_eq!(sys.token.symbol(), "DUELIST", "Symbol is wrong");

    _assert_minted_count(sys.world, sys.token, CONST::WELCOME_PACK_DUELIST_COUNT, "Should eq [5]");
    assert_eq!(sys.token.balance_of(OWNER()), CONST::WELCOME_PACK_DUELIST_COUNT.into(), "Should eq [5]");
    assert_eq!(sys.token.balance_of(OTHER()), 0, "Should eq 0");

    assert_eq!(sys.token.owner_of(TOKEN_ID_1_1), OWNER(), "owner_of_1");

    assert!(sys.token.supports_interface(interface::IERC721_ID), "should support IERC721_ID");
    assert!(sys.token.supports_interface(interface::IERC721_METADATA_ID), "should support METADATA");
}

#[test]
fn test_token_component() {
    let mut sys: TestSystems = setup(0);
    // should not panic
    sys.token.owner_of(TOKEN_ID_1_1);
    sys.token.is_owner_of(OWNER(), TOKEN_ID_1_1.low);
}

#[test]
fn test_token_uri() {
    let mut sys: TestSystems = setup(0);

    let duelist = Duelist {
        duelist_id: TOKEN_ID_1_1.low,
        profile_type: ProfileType::Duelist(DuelistProfile::Duke),
        timestamp: 999999,
    };
    tester::set_Duelist(ref sys.world, duelist);

    let scoreboard = Scoreboard {
        holder: TOKEN_ID_1_1.low.into(),
        score: Score {
            honour: 99,
            total_duels: 6,
            total_wins: 3,
            total_losses: 2,
            total_draws: 1,
            honour_history: 0,
        },
    };
    tester::set_Scoreboard(ref sys.world, scoreboard);

    let uri_1 = sys.token.token_uri(TOKEN_ID_1_1);
    let uri_2 = sys.token.token_uri(TOKEN_ID_1_2);
    
    println!("{}", uri_1);
    println!("{}", uri_2);

    assert_gt!(uri_1.len(), 100, "Uri 1 should not be empty");
    assert_gt!(uri_2.len(), 100, "Uri 2 should not be empty");
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
#[should_panic(expected: ('TOKEN: caller is not minter', 'ENTRYPOINT_FAILED'))]
fn test_mint_duelist_not_minter() {
    let mut sys: TestSystems = setup(0);
    sys.token.mint_duelists(OWNER(), 1, 0x1234);
}

//
// approve
//

#[test]
fn test_approve() {
    let mut sys: TestSystems = setup(0);

    utils::impersonate(OWNER());

    sys.token.approve(SPENDER(), TOKEN_ID_1_1);
    assert_eq!(sys.token.get_approved(TOKEN_ID_1_1), SPENDER(), "Spender not approved correctly");

    // drop StoreSetRecord ERC721TokenApprovalModel
    utils::drop_event(sys.world.dispatcher.contract_address);
}

//
// transfer_from
//

#[test]
fn test_transfer_from() {
    let mut sys: TestSystems = setup(0);

    assert_eq!(sys.token.balance_of(OWNER()), CONST::WELCOME_PACK_DUELIST_COUNT.into(), "Should eq [WELCOME_PACK_DUELIST_COUNT]");
    assert_eq!(sys.token.balance_of(OTHER()), 0, "Should eq 0");
    _assert_minted_count(sys.world, sys.token, CONST::WELCOME_PACK_DUELIST_COUNT, "Should eq [WELCOME_PACK_DUELIST_COUNT]");

    tester::impersonate(OWNER());
    sys.token.approve(SPENDER(), TOKEN_ID_1_1);

    utils::drop_all_events(sys.token.contract_address);
    utils::drop_all_events(sys.world.dispatcher.contract_address);
    utils::assert_no_events_left(sys.token.contract_address);

    tester::impersonate(SPENDER());
    sys.token.transfer_from(OWNER(), OTHER(), TOKEN_ID_1_1);

    assert_eq!(sys.token.balance_of(OWNER()), (CONST::WELCOME_PACK_DUELIST_COUNT - 1).into(), "Should eq [WELCOME_PACK_DUELIST_COUNT - 1]");
    assert_eq!(sys.token.balance_of(OTHER()), 1, "Should eq 1");
    assert_eq!(sys.token.get_approved(TOKEN_ID_1_1), ZERO(), "Should eq 0");
    _assert_minted_count(sys.world, sys.token, CONST::WELCOME_PACK_DUELIST_COUNT, "Should eq [WELCOME_PACK_DUELIST_COUNT]");
}

#[test]
#[should_panic(expected: ('ERC721: unauthorized caller', 'ENTRYPOINT_FAILED'))]
fn test_transfer_no_allowance() {
    let mut sys: TestSystems = setup(0);
    utils::impersonate(SPENDER());
    sys.token.transfer_from(OWNER(), OTHER(), TOKEN_ID_1_1);
}

//
// burn
//

// #[test]
// #[should_panic(expected: ('DUELIST: Not implemented', 'ENTRYPOINT_FAILED'))]
// fn test_burn() {
//     let mut sys: TestSystems = setup(0);
//     _assert_minted_count(sys.world, sys.token, 2, 'invalid total_supply init');
//     assert(sys.token.balance_of(OWNER()) == 1, 'invalid balance_of (1)');
//     sys.token.delete_duelist(TOKEN_ID_1_1.low);
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
    let token_bound_address_1: ContractAddress = sys.fame.address_of_token(sys.token.contract_address, TOKEN_ID_1_1.low);
    let token_bound_address_6: ContractAddress = sys.fame.address_of_token(sys.token.contract_address, TOKEN_ID_2_1.low);
    assert!(token_bound_address_1.is_non_zero(), "token_bound_address_1");
    assert!(token_bound_address_6.is_non_zero(), "token_bound_address_6");
    assert_ne!(token_bound_address_1, token_bound_address_6, "token_bound_address_1 != 2");
    let (token_contract_1, token_id_1_1) = sys.fame.token_of_address(token_bound_address_1);
    let (token_contract_6, token_id_2_1) = sys.fame.token_of_address(token_bound_address_6);
    assert_eq!(token_contract_1, sys.token.contract_address, "token_contract_1");
    assert_eq!(token_contract_6, sys.token.contract_address, "token_contract_6");
    assert_eq!(token_id_1_1, TOKEN_ID_1_1.low, "token_id_1_1");
    assert_eq!(token_id_2_1, TOKEN_ID_2_1.low, "token_id_2_1");

    // initial token balances
    let balance_1_initial: u256 = sys.fame.balance_of_token(sys.token.contract_address, TOKEN_ID_1_1.low);
    let balance_6_initial: u256 = sys.fame.balance_of_token(sys.token.contract_address, TOKEN_ID_2_1.low);
    assert_gt!(FAME::MINT_GRANT_AMOUNT, 0, "FAME::MINT_GRANT_AMOUNT > 0");
    assert_eq!(balance_1_initial, FAME::MINT_GRANT_AMOUNT, "balance_1_initial");
    assert_eq!(balance_6_initial, FAME::MINT_GRANT_AMOUNT, "balance_6_initial");

    // transfer duelist
    tester::impersonate(OWNER());
    sys.token.transfer_from(OWNER(), OTHER(), TOKEN_ID_1_1);
    // check balances
    let balance_1: u256 = sys.fame.balance_of_token(sys.token.contract_address, TOKEN_ID_1_1.low);
    let balance_6: u256 = sys.fame.balance_of_token(sys.token.contract_address, TOKEN_ID_2_1.low);
    assert_eq!(balance_1, balance_1_initial, "balance_1 (1)");
    assert_eq!(balance_6, balance_6_initial, "balance_6 (1)");

    // transfer to new owner
    tester::impersonate(OTHER());
    sys.token.transfer_from(OTHER(), RECIPIENT(), TOKEN_ID_2_1);
    assert_eq!(balance_6, balance_6_initial, "balance_6 (2)");

    // transfer all
    tester::impersonate(OTHER());
    sys.token.transfer_from(OTHER(), OWNER(), TOKEN_ID_1_1);
    sys.token.transfer_from(OTHER(), RECIPIENT(), TOKEN_ID_2_2);
}

#[test]
#[should_panic(expected: ('ERC20: insufficient allowance', 'ENTRYPOINT_FAILED'))]
fn test_fame_transfer_between_owners_not_allowed() {
    let mut sys: TestSystems = setup(0);
    // transfer FAME
    tester::impersonate(sys.token.contract_address);
    sys.fame.transfer_from(OWNER(), OTHER(), FAME::MINT_GRANT_AMOUNT / 2);
}

#[test]
#[should_panic(expected: ('COIN: caller is not minter', 'ENTRYPOINT_FAILED'))]
fn test_fame_transfer_from_owner_not_allowed() {
    let mut sys: TestSystems = setup(0);
    // transfer FAME
    tester::impersonate(OWNER());
    sys.fame.transfer(OTHER(), FAME::MINT_GRANT_AMOUNT / 2);
}

#[test]
#[should_panic(expected: ('COIN: caller is not minter', 'ENTRYPOINT_FAILED'))]
fn test_fame_mint_not_minter() {
    let mut sys: TestSystems = setup(0);
    sys.fame.minted_duelist(123);
}

#[test]
#[should_panic(expected: ('TOKEN_BOUND: already registered', 'ENTRYPOINT_FAILED'))]
fn test_fame_mint_already_registered() {
    let mut sys: TestSystems = setup(0);
    utils::impersonate(sys.token.contract_address);
    sys.fame.minted_duelist(TOKEN_ID_1_1.low);
}

#[test]
#[should_panic(expected: ('COIN: caller is not minter', 'ENTRYPOINT_FAILED'))]
fn test_fame_reward_not_minter() {
    let mut sys: TestSystems = setup(0);
    sys.fame.reward_duelist(123, 0);
}
