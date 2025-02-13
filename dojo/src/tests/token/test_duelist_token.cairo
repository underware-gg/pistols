use core::num::traits::Zero;
use starknet::{ContractAddress, testing};
use dojo::world::{WorldStorage};
use dojo_cairo_test::{
    spawn_test_world, NamespaceDef, TestResource, ContractDefTrait, ContractDef,
    WorldStorageTestTrait,
};

use pistols::systems::{
    bank::{bank},
    tokens::{
        pack_token::{pack_token},
        duelist_token::{duelist_token, IDuelistTokenDispatcher, IDuelistTokenDispatcherTrait},
        fame_coin::{fame_coin, IFameCoinDispatcherTrait},
        lords_mock::{lords_mock, ILordsMockDispatcherTrait},
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
        m_Pack, PackType, PackTypeTrait,
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
    pool::{
        m_Pool, Pool, PoolType,
    },
};

use pistols::interfaces::systems::{SystemsTrait};
use pistols::types::constants::{FAME};
use pistols::utils::misc::{WEI};
use pistols::tests::tester::{
    tester,
    tester::{
        TestSystems, TestSystemsTrait,
        OWNER, OTHER, RECIPIENT, SPENDER, TREASURY, ZERO
    },
};
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
            TestResource::Model(m_Pool::TEST_CLASS_HASH),
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
            TestResource::Contract(bank::TEST_CLASS_HASH),
            TestResource::Contract(lords_mock::TEST_CLASS_HASH),
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
            .with_writer_of([selector_from_tag!("pistols-CoinConfig"),selector_from_tag!("pistols-TokenBoundAddress")].span()), // same as config
        ContractDefTrait::new(@"pistols", @"bank")
            .with_writer_of([selector_from_tag!("pistols-Pool")].span()),
        ContractDefTrait::new(@"pistols", @"lords_mock")
            .with_writer_of([dojo::utils::bytearray_hash(@"pistols")].span())
            .with_init_calldata([
                0, // minter
                10_000_000_000_000_000_000_000, // 10,000 Lords
            ].span()),
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

    (TestSystemsTrait::from_world(world))
}

fn setup(fee_amount: u128) -> TestSystems {
    let mut sys: TestSystems = setup_uninitialized(fee_amount);

    tester::fund_duelists_pool(@sys.lords, @sys.bank, 2);

    // initialize contracts
    tester::execute_claim_welcome_pack(@sys.pack, OWNER());
    
    tester::impersonate(OWNER());

    // drop all events
    utils::drop_all_events(sys.world.dispatcher.contract_address);
    utils::drop_all_events(sys.duelists.contract_address);

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
    assert_eq!(sys.duelists.symbol(), "DUELIST", "Symbol is wrong");

    let welcome_pack_duelist_count: usize = PackType::WelcomePack.description().quantity;

    _assert_minted_count(sys.world, sys.duelists, welcome_pack_duelist_count, "Should eq [welcome_pack_duelist_count]");
    assert_eq!(sys.duelists.balance_of(OWNER()), welcome_pack_duelist_count.into(), "Should eq [welcome_pack_duelist_count]");
    assert_eq!(sys.duelists.balance_of(OTHER()), 0, "Should eq 0");

    assert_eq!(sys.duelists.owner_of(TOKEN_ID_1_1), OWNER(), "owner_of_1");

    assert!(sys.duelists.supports_interface(interface::IERC721_ID), "should support IERC721_ID");
    assert!(sys.duelists.supports_interface(interface::IERC721_METADATA_ID), "should support METADATA");
}

#[test]
fn test_token_component() {
    let mut sys: TestSystems = setup(0);
    // should not panic
    sys.duelists.owner_of(TOKEN_ID_1_1);
    sys.duelists.is_owner_of(OWNER(), TOKEN_ID_1_1.low);
}

#[test]
fn test_token_uri() {
    let mut sys: TestSystems = setup(0);

    let duelist = Duelist {
        duelist_id: TOKEN_ID_1_1.low,
        profile_type: ProfileType::Duelist(DuelistProfile::Duke),
        timestamp_registered: 999999,
        timestamp_active: 999999,
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

    let uri_1 = sys.duelists.token_uri(TOKEN_ID_1_1);
    let uri_2 = sys.duelists.token_uri(TOKEN_ID_1_2);
    
    println!("{}", uri_1);
    println!("{}", uri_2);

    assert_gt!(uri_1.len(), 100, "Uri 1 should not be empty");
    assert_gt!(uri_2.len(), 100, "Uri 2 should not be empty");
}

#[test]
#[should_panic(expected: ('ERC721: invalid token ID', 'ENTRYPOINT_FAILED'))]
fn test_token_uri_invalid() {
    let mut sys: TestSystems = setup(0);
    sys.duelists.token_uri(999);
}


//
// mint
//

#[test]
#[should_panic(expected: ('TOKEN: caller is not minter', 'ENTRYPOINT_FAILED'))]
fn test_mint_duelist_not_minter() {
    let mut sys: TestSystems = setup(0);
    sys.duelists.mint_duelists(OWNER(), 1, 0x1234);
}

//
// approve
//

#[test]
fn test_approve() {
    let mut sys: TestSystems = setup(0);

    utils::impersonate(OWNER());

    sys.duelists.approve(SPENDER(), TOKEN_ID_1_1);
    assert_eq!(sys.duelists.get_approved(TOKEN_ID_1_1), SPENDER(), "Spender not approved correctly");

    // drop StoreSetRecord ERC721TokenApprovalModel
    utils::drop_event(sys.world.dispatcher.contract_address);
}

//
// transfer_from
//

#[test]
fn test_transfer_from() {
    let mut sys: TestSystems = setup(0);

    let welcome_pack_duelist_count: usize = PackType::WelcomePack.description().quantity;

    assert_eq!(sys.duelists.balance_of(OWNER()), welcome_pack_duelist_count.into(), "Should eq [welcome_pack_duelist_count]");
    assert_eq!(sys.duelists.balance_of(OTHER()), 0, "Should eq 0");
    _assert_minted_count(sys.world, sys.duelists, welcome_pack_duelist_count, "Should eq [welcome_pack_duelist_count]");

    tester::impersonate(OWNER());
    sys.duelists.approve(SPENDER(), TOKEN_ID_1_1);

    utils::drop_all_events(sys.duelists.contract_address);
    utils::drop_all_events(sys.world.dispatcher.contract_address);
    utils::assert_no_events_left(sys.duelists.contract_address);

    tester::impersonate(SPENDER());
    sys.duelists.transfer_from(OWNER(), OTHER(), TOKEN_ID_1_1);

    assert_eq!(sys.duelists.balance_of(OWNER()), (welcome_pack_duelist_count - 1).into(), "Should eq [welcome_pack_duelist_count - 1]");
    assert_eq!(sys.duelists.balance_of(OTHER()), 1, "Should eq 1");
    assert_eq!(sys.duelists.get_approved(TOKEN_ID_1_1), ZERO(), "Should eq 0");
    _assert_minted_count(sys.world, sys.duelists, welcome_pack_duelist_count, "Should eq [welcome_pack_duelist_count]");
}

#[test]
#[should_panic(expected: ('ERC721: unauthorized caller', 'ENTRYPOINT_FAILED'))]
fn test_transfer_no_allowance() {
    let mut sys: TestSystems = setup(0);
    utils::impersonate(SPENDER());
    sys.duelists.transfer_from(OWNER(), OTHER(), TOKEN_ID_1_1);
}

//
// burn
//

// #[test]
// #[should_panic(expected: ('DUELIST: Not implemented', 'ENTRYPOINT_FAILED'))]
// fn test_burn() {
//     let mut sys: TestSystems = setup(0);
//     _assert_minted_count(sys.world, sys.duelists, 2, 'invalid total_supply init');
//     assert(sys.duelists.balance_of(OWNER()) == 1, 'invalid balance_of (1)');
//     sys.duelists.delete_duelist(TOKEN_ID_1_1.low);
//     _assert_minted_count(sys.world, sys.duelists, 1, 'invalid total_supply');
//     assert(sys.duelists.balance_of(OWNER()) == 0, 'invalid balance_of (0)');
// }


//---------------------------------
// FAME
//

#[test]
fn test_fame() {
    let mut sys: TestSystems = setup(0);

    tester::execute_claim_welcome_pack(@sys.pack, OTHER());

    // initial token balances
    let balance_1_initial: u256 = sys.fame.balance_of_token(sys.duelists.contract_address, TOKEN_ID_1_1.low);
    let balance_2_initial: u256 = sys.fame.balance_of_token(sys.duelists.contract_address, TOKEN_ID_2_1.low);
    assert_gt!(FAME::MINT_GRANT_AMOUNT, 0, "FAME::MINT_GRANT_AMOUNT > 0");
    assert_eq!(balance_1_initial, FAME::MINT_GRANT_AMOUNT, "balance_1_initial");
    assert_eq!(balance_2_initial, FAME::MINT_GRANT_AMOUNT, "balance_2_initial");

    // transfer duelist
    tester::impersonate(OWNER());
    sys.duelists.transfer_from(OWNER(), OTHER(), TOKEN_ID_1_1);
    // check balances
    let balance_1: u256 = sys.fame.balance_of_token(sys.duelists.contract_address, TOKEN_ID_1_1.low);
    let balance_2: u256 = sys.fame.balance_of_token(sys.duelists.contract_address, TOKEN_ID_2_1.low);
    assert_eq!(balance_1, balance_1_initial, "balance_1 (1)");
    assert_eq!(balance_2, balance_2_initial, "balance_2 (1)");

    // transfer to new owner
    tester::impersonate(OTHER());
    sys.duelists.transfer_from(OTHER(), RECIPIENT(), TOKEN_ID_2_1);
    assert_eq!(balance_2, balance_2_initial, "balance_2 (2)");

    // transfer all
    tester::impersonate(OTHER());
    sys.duelists.transfer_from(OTHER(), OWNER(), TOKEN_ID_1_1);
    sys.duelists.transfer_from(OTHER(), RECIPIENT(), TOKEN_ID_2_2);
}

#[test]
fn test_token_bound_address() {
    let mut sys: TestSystems = setup(0);

    tester::execute_claim_welcome_pack(@sys.pack, OTHER());

    // validate token_bound address
    let token_bound_address_1: ContractAddress = sys.fame.address_of_token(sys.duelists.contract_address, TOKEN_ID_1_1.low);
    let token_bound_address_2: ContractAddress = sys.fame.address_of_token(sys.duelists.contract_address, TOKEN_ID_2_1.low);
    assert!(token_bound_address_1.is_non_zero(), "token_bound_address_1");
    assert!(token_bound_address_2.is_non_zero(), "token_bound_address_2");
    assert_ne!(token_bound_address_1, token_bound_address_2, "token_bound_address_1 != 2");
    let (token_contract_1, token_id_1_1) = sys.fame.token_of_address(token_bound_address_1);
    let (token_contract_2, token_id_2_1) = sys.fame.token_of_address(token_bound_address_2);
    assert_eq!(token_contract_1, sys.duelists.contract_address, "token_contract_1");
    assert_eq!(token_contract_2, sys.duelists.contract_address, "token_contract_2");
    assert_eq!(token_id_1_1, TOKEN_ID_1_1.low, "token_id_1_1");
    assert_eq!(token_id_2_1, TOKEN_ID_2_1.low, "token_id_2_1");
}

#[test]
#[should_panic(expected: ('ERC20: insufficient allowance', 'ENTRYPOINT_FAILED'))]
fn test_fame_transfer_between_owners_not_allowed() {
    let mut sys: TestSystems = setup(0);
    // transfer FAME
    tester::impersonate(sys.duelists.contract_address);
    sys.fame.transfer_from(OWNER(), OTHER(), FAME::MINT_GRANT_AMOUNT / 2);
}

#[test]
#[should_panic(expected: ('ERC20: insufficient balance', 'ENTRYPOINT_FAILED'))]
// #[should_panic(expected: ('COIN: caller is not minter', 'ENTRYPOINT_FAILED'))]
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
    utils::impersonate(sys.duelists.contract_address);
    sys.fame.minted_duelist(TOKEN_ID_1_1.low);
}

#[test]
#[should_panic(expected: ('COIN: caller is not minter', 'ENTRYPOINT_FAILED'))]
fn test_fame_reward_not_minter() {
    let mut sys: TestSystems = setup(0);
    sys.fame.reward_duelist(123, 0);
}



//---------------------------------
// INACTIVE
//

#[test]
fn test_duelist_inactive() {
    let mut sys: TestSystems = setup(0);

    let intial_fame: u128 = FAME::MINT_GRANT_AMOUNT.low;
    assert_eq!(intial_fame, WEI(3000).low, "intial_fame");

    let token_id: u128 = TOKEN_ID_1_1.low;
    let timestamp_registered: u64 = tester::get_DuelistValue(sys.world, token_id).timestamp_registered;
    assert_eq!(tester::get_block_timestamp(), timestamp_registered + 1, "timestamp_registered");

    let fame_supply: u128 = sys.fame.total_supply().low;
    assert_eq!(fame_supply, (intial_fame * 2), "INIT_fame_supply");

    let pool_flame: Pool = tester::get_Pool(sys.world, PoolType::SacredFlame);
    assert_eq!(pool_flame.balance_fame, 0, "pool_flame.balance_fame");

    let balance_initial: u128 = sys.fame.balance_of_token(sys.duelists.contract_address, token_id).low;
    assert_eq!(balance_initial, intial_fame, "INIT_balance");
    assert!(!sys.duelists.is_inactive(token_id), "INIT_is_inactive");
    assert_eq!(sys.duelists.inactive_timestamp(token_id), 1, "INIT_inactive_timestamp");
    assert_eq!(sys.duelists.inactive_fame_dripped(token_id), 0, "INIT_inactive_fame_dripped");

    // on the edge...
    let elapsed: u64 = FAME::MAX_INACTIVE_TIMESTAMP;
    tester::set_block_timestamp(timestamp_registered + elapsed);
    assert!(!sys.duelists.is_inactive(token_id), "EDGE_is_inactive");
    assert_eq!(sys.duelists.inactive_timestamp(token_id), elapsed, "EDGE_inactive_timestamp");
    assert_eq!(sys.duelists.inactive_fame_dripped(token_id), 0, "EDGE_inactive_fame_dripped");

    // inactivated
    let elapsed: u64 = FAME::MAX_INACTIVE_TIMESTAMP + 1;
    tester::set_block_timestamp(timestamp_registered + elapsed);
    assert!(sys.duelists.is_inactive(token_id), "INACTIVATED_is_inactive");
    assert_eq!(sys.duelists.inactive_timestamp(token_id), elapsed, "INACTIVATED_inactive_timestamp");
    assert_eq!(sys.duelists.inactive_fame_dripped(token_id), 0, "INACTIVATED_inactive_fame_dripped");

    // dripped
    let elapsed: u64 = FAME::MAX_INACTIVE_TIMESTAMP + FAME::TIMESTAMP_TO_DRIP_ONE_FAME;
    tester::set_block_timestamp(timestamp_registered + elapsed);
    assert!(sys.duelists.is_inactive(token_id), "DRIPPED_is_inactive");
    assert_eq!(sys.duelists.inactive_timestamp(token_id), elapsed, "DRIPPED_inactive_timestamp");
    assert_eq!(sys.duelists.inactive_fame_dripped(token_id), WEI(1).low, "DRIPPED_inactive_fame_dripped");

    // dripped more!
    let elapsed: u64 = FAME::MAX_INACTIVE_TIMESTAMP + (FAME::TIMESTAMP_TO_DRIP_ONE_FAME * 111);
    tester::set_block_timestamp(timestamp_registered + elapsed);
    assert!(sys.duelists.is_inactive(token_id), "DRIPPED_MORE_is_inactive");
    assert_eq!(sys.duelists.inactive_timestamp(token_id), elapsed, "DRIPPED_MORE_inactive_timestamp");
    assert_eq!(sys.duelists.inactive_fame_dripped(token_id), WEI(111).low, "DRIPPED_MORE_inactive_fame_dripped");
}

// reactivate()

fn _test_duelist_reactivate(sys: @TestSystems, token_id: u128, dripped_fame: u64, is_alive: bool) {
    let token_id: u128 = TOKEN_ID_1_1.low;
    let lords_balance_treasury: u128 = (*sys.lords).balance_of(TREASURY()).low;
    let fame_balance_start: u128 = (*sys.fame).balance_of_token((*sys.duelists).contract_address, token_id).low;
    let fame_supply_start: u128 = (*sys.fame).total_supply().low;
    // let intial_fame: u128 = FAME::MINT_GRANT_AMOUNT.low;

    // dripped...
    tester::make_duelist_inactive(*sys.world, token_id, dripped_fame);
    let dripped_fame_wei: u128 = WEI(dripped_fame.into()).low;
    assert!((*sys.duelists).is_inactive(token_id), "is_inactive");
    assert_eq!((*sys.duelists).inactive_fame_dripped(token_id), dripped_fame_wei, "inactive_fame_dripped");

    // reactivate
    let is_alive: bool = (*sys.duelists).reactivate(token_id);
    assert!(is_alive == is_alive, "AFTER_is_alive");
    assert!(!(*sys.duelists).is_inactive(token_id), "AFTER_is_inactive");
    assert_eq!((*sys.duelists).inactive_timestamp(token_id), 0, "AFTER_inactive_timestamp");
    assert_eq!((*sys.duelists).inactive_fame_dripped(token_id), 0, "AFTER_inactive_fame_dripped");

    // duelist lost fame...
    let fame_balance: u128 = (*sys.fame).balance_of_token((*sys.duelists).contract_address, token_id).low;
    // Fame supply down
    let fame_supply: u128 = (*sys.fame).total_supply().low;
    // Flames up?
    let pool_flame: Pool = tester::get_Pool(*sys.world, PoolType::SacredFlame);
    let pool_amount: u128 = ((FAME::ONE_LIFE.low / 10) * 6);
    if (is_alive) {
        assert_eq!(fame_balance, fame_balance_start - dripped_fame_wei, "AFTER_fame_balance_ALIVE");
        assert_eq!(fame_supply, fame_supply_start - dripped_fame_wei, "AFTER_fame_supply_ALIVE");
        assert_eq!(pool_flame.balance_fame, 0, "AFTER_pool_flame.balance_fame_ALIVE");
    } else {
        assert_eq!(fame_balance, 0, "AFTER_fame_balance_DEAD");
        assert_eq!(fame_supply, fame_supply_start - fame_balance_start + pool_amount, "AFTER_fame_supply_DEAD");
        assert_eq!(pool_flame.balance_fame, pool_amount, "AFTER_pool_flame.balance_fame_DEAD");
    }

    // underware up
    tester::assert_lords_balance_up(*sys.lords, TREASURY(), lords_balance_treasury, "AFTER_treasury_up");
}

#[test]
fn test_duelist_reactivate_OK_alive() {
    let mut sys: TestSystems = setup(0);
    let token_id: u128 = TOKEN_ID_1_1.low;
    _test_duelist_reactivate(@sys, token_id, 100, true);
}

#[test]
fn test_duelist_reactivate_OK_edge() {
    let mut sys: TestSystems = setup(0);
    let token_id: u128 = TOKEN_ID_1_1.low;
    _test_duelist_reactivate(@sys, token_id, 2000, true);
}

#[test]
fn test_duelist_reactivate_DEAD() {
    let mut sys: TestSystems = setup(0);
    let token_id: u128 = TOKEN_ID_1_1.low;
    _test_duelist_reactivate(@sys, token_id, 2100, false);
}

#[test]
fn test_duelist_reactivate_DEAD_empty() {
    let mut sys: TestSystems = setup(0);
    let token_id: u128 = TOKEN_ID_1_1.low;
    _test_duelist_reactivate(@sys, token_id, 3000, false);
}

#[test]
fn test_duelist_reactivate_DEAD_over() {
    let mut sys: TestSystems = setup(0);
    let token_id: u128 = TOKEN_ID_1_1.low;
    _test_duelist_reactivate(@sys, token_id, 4000, false);
}

#[test]
fn test_duelist_reactivate_DEAD_thrice() {
    let mut sys: TestSystems = setup(0);
    let token_id: u128 = TOKEN_ID_1_1.low;
    _test_duelist_reactivate(@sys, token_id, 1000, true);
    _test_duelist_reactivate(@sys, token_id, 1000, true);
    _test_duelist_reactivate(@sys, token_id, 1, false);
}
