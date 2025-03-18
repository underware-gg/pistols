use core::num::traits::Zero;
use starknet::{ContractAddress};
// use dojo::world::{WorldStorage};

use pistols::models::{
    pack::{
        PackType, PackTypeTrait,
    },
    duelist::{
        Duelist, DuelistTimestamps,
        Scoreboard, Score,
        ProfileType, DuelistProfile,
        DuelistMemorialValue, CauseOfDeath,
    },
    challenge::{
        Challenge,
    },
    config::{
        TokenConfig,
    },
    pool::{
        Pool, PoolType,
    },
    table::{
        TABLES,
    },
};

// use pistols::interfaces::dns::{DnsTrait};
use pistols::types::constants::{FAME};
use pistols::utils::misc::{WEI};
use pistols::tests::tester::{
    tester,
    tester::{
        StoreTrait,
        TestSystems, FLAGS,
        IDuelistTokenDispatcherTrait,
        IFameCoinDispatcherTrait,
        ILordsMockDispatcherTrait,
        OWNER, OTHER, RECIPIENT, SPENDER, TREASURY, ZERO, SEASON_TABLE,
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

fn setup(_fee_amount: u128) -> TestSystems {
    let mut sys: TestSystems = tester::setup_world(FLAGS::DUELIST | FLAGS::FAME | FLAGS::LORDS);

    tester::set_current_season(ref sys, TABLES::PRACTICE);

    tester::fund_duelists_pool(@sys, 2);

    // initialize contracts
    tester::execute_claim_starter_pack(@sys.pack, OWNER());

    tester::impersonate(OWNER());

    // drop all events
    utils::drop_all_events(sys.world.dispatcher.contract_address);
    utils::drop_all_events(sys.duelists.contract_address);

    (sys)
}

fn _assert_minted_count(sys: @TestSystems, minted_count: usize, msg: ByteArray) {
    let token_config: TokenConfig = (*sys.store).get_token_config(*sys.duelists.contract_address);
    assert_eq!(token_config.minted_count, minted_count.into(), "{}", msg);
}

//
// initialize
//

#[test]
fn test_initializer() {
    let mut sys: TestSystems = setup(0);
    assert_eq!(sys.duelists.symbol(), "DUELIST", "Symbol is wrong");

    let starter_pack_duelist_count: usize = PackType::StarterPack.description().quantity;

    _assert_minted_count(@sys, starter_pack_duelist_count, "Should eq [starter_pack_duelist_count]");
    assert_eq!(sys.duelists.balance_of(OWNER()), starter_pack_duelist_count.into(), "Should eq [starter_pack_duelist_count]");
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
    sys.duelists.is_owner_of(OWNER(), TOKEN_ID_1_1);
}

#[test]
fn test_contract_uri() {
    let mut sys: TestSystems = setup(0);
    let uri: ByteArray = sys.duelists.contract_uri();
    let uri_camel: ByteArray = sys.duelists.contractURI();
    println!("___duelist.contract_uri():{}", uri);
    assert!(tester::starts_with(uri.clone(), "data:"), "contract_uri() should be a json string");
    assert_eq!(uri.clone(), uri_camel.clone(), "uri_camel");
}

#[test]
fn test_token_uri() {
    let mut sys: TestSystems = setup(0);

    let duelist = Duelist {
        duelist_id: TOKEN_ID_1_1.low,
        profile_type: ProfileType::Duelist(DuelistProfile::LadyVengeance),
        timestamps: DuelistTimestamps {
            registered: 999999,
            active: 999999,
        },
    };
    tester::set_Duelist(ref sys.world, @duelist);

    let scoreboard = Scoreboard {
        holder: TOKEN_ID_1_1.low.into(),
        table_id: 0,
        score: Score {
            honour: 99,
            points: 777,
            total_duels: 6,
            total_wins: 3,
            total_losses: 2,
            total_draws: 1,
            honour_history: 0,
        },
    };
    tester::set_Scoreboard(ref sys.world, @scoreboard);

    let uri_1 = sys.duelists.token_uri(TOKEN_ID_1_1);
    let uri_2 = sys.duelists.token_uri(TOKEN_ID_1_2);
    
    println!("___duelist.token_uri(1):{}", uri_1);
    println!("___duelist.token_uri(2):{}", uri_2);

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

    let starter_pack_duelist_count: usize = PackType::StarterPack.description().quantity;

    assert_eq!(sys.duelists.balance_of(OWNER()), starter_pack_duelist_count.into(), "Should eq [starter_pack_duelist_count]");
    assert_eq!(sys.duelists.balance_of(OTHER()), 0, "Should eq 0");
    _assert_minted_count(@sys, starter_pack_duelist_count, "Should eq [starter_pack_duelist_count]");

    tester::impersonate(OWNER());
    sys.duelists.approve(SPENDER(), TOKEN_ID_1_1);

    utils::drop_all_events(sys.duelists.contract_address);
    utils::drop_all_events(sys.world.dispatcher.contract_address);
    utils::assert_no_events_left(sys.duelists.contract_address);

    tester::impersonate(SPENDER());
    sys.duelists.transfer_from(OWNER(), OTHER(), TOKEN_ID_1_1);

    assert_eq!(sys.duelists.balance_of(OWNER()), (starter_pack_duelist_count - 1).into(), "Should eq [starter_pack_duelist_count - 1]");
    assert_eq!(sys.duelists.balance_of(OTHER()), 1, "Should eq 1");
    assert_eq!(sys.duelists.get_approved(TOKEN_ID_1_1), ZERO(), "Should eq 0");
    _assert_minted_count(@sys, starter_pack_duelist_count, "Should eq [starter_pack_duelist_count]");
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
//     _assert_minted_count(@sys, 2, 'invalid total_supply init');
//     assert(sys.duelists.balance_of(OWNER()) == 1, 'invalid balance_of (1)');
//     sys.duelists.delete_duelist(TOKEN_ID_1_1.low);
//     _assert_minted_count(@sys, 1, 'invalid total_supply');
//     assert(sys.duelists.balance_of(OWNER()) == 0, 'invalid balance_of (0)');
// }


//---------------------------------
// FAME
//

#[test]
fn test_fame() {
    let mut sys: TestSystems = setup(0);

    tester::execute_claim_starter_pack(@sys.pack, OTHER());

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


//---------------------------------
// inactivity / poke()
//

#[test]
fn test_duelist_inactive() {
    let mut sys: TestSystems = setup(0);

    let intial_fame: u128 = FAME::MINT_GRANT_AMOUNT.low;
    assert_eq!(intial_fame, WEI(3000).low, "intial_fame");

    let token_id: u128 = TOKEN_ID_1_1.low;
    let timestamp_registered: u64 = sys.store.get_duelist_value(token_id).timestamps.registered;
    assert_eq!(tester::get_block_timestamp(), timestamp_registered + 1, "timestamps.registered");

    let fame_supply: u128 = sys.fame.total_supply().low;
    assert_eq!(fame_supply, (intial_fame * 2), "INIT_fame_supply");

    let pool_flame: Pool = sys.store.get_pool(PoolType::SacredFlame);
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

// poke()

fn _test_duelist_reactivate(sys: @TestSystems, token_id: u128, dripped_fame: u64, should_survive: bool) {
    let token_id: u128 = TOKEN_ID_1_1.low;
    let lords_balance_bank: u128 = (*sys.lords).balance_of((*sys.bank).contract_address).low;
    let lords_balance_treasury: u128 = (*sys.lords).balance_of(TREASURY()).low;
    let fame_balance_start: u128 = (*sys.fame).balance_of_token((*sys.duelists).contract_address, token_id).low;
    let fame_supply_start: u128 = (*sys.fame).total_supply().low;
    let timestamp_active_start: u64 = (*sys.store).get_duelist_value(token_id).timestamps.active;
    // let intial_fame: u128 = FAME::MINT_GRANT_AMOUNT.low;
// println!("[] balance     : {}", fame_balance_start/CONST::ETH_TO_WEI.low);
// println!("[] fame_to_burn: {}", dripped_fame);

    // dripped...
    tester::make_duelist_inactive(sys, token_id, dripped_fame);
    let dripped_fame_wei: u128 = WEI(dripped_fame.into()).low;
    assert!((*sys.duelists).is_inactive(token_id), "is_inactive");
    assert_eq!((*sys.duelists).inactive_fame_dripped(token_id), dripped_fame_wei, "inactive_fame_dripped");

    // reactivate
    (*sys.duelists).poke(token_id);
    assert_eq!((*sys.duelists).is_alive(token_id), should_survive, "AFTER_is_alive()");
    assert!(!(*sys.duelists).is_inactive(token_id), "AFTER_is_inactive");
    assert_eq!((*sys.duelists).inactive_timestamp(token_id), 0, "AFTER_inactive_timestamp");
    assert_eq!((*sys.duelists).inactive_fame_dripped(token_id), 0, "AFTER_inactive_fame_dripped");

    // timestamp_active updated
    let timestamp_active: u64 = (*sys.store).get_duelist_value(token_id).timestamps.active;
    assert_gt!(timestamp_active, timestamp_active_start, "AFTER_timestamp_active");

    // if dead, has a memorial
    let memorial: DuelistMemorialValue = (*sys.store).get_duelist_memorial_value(token_id);
    assert_eq!(memorial.killed_by, 0, "AFTER_killed_by");
    // duelist lost fame...
    let fame_balance: u128 = (*sys.fame).balance_of_token((*sys.duelists).contract_address, token_id).low;
// println!("fame_balance: {}", tester::ETH(fame_balance));
    // Fame supply down
    let fame_supply: u128 = (*sys.fame).total_supply().low;
    // Flames up?
    let pool_flame: Pool = (*sys.store).get_pool(PoolType::SacredFlame);
    let pool_amount: u128 = ((FAME::ONE_LIFE.low / 10) * 6);
    if (should_survive) {
        assert_eq!(memorial.cause_of_death, CauseOfDeath::None, "AFTER_cause_of_death");
        assert_eq!(memorial.fame_before_death, 0, "AFTER_fame_before_death");
        assert_eq!(fame_balance, fame_balance_start - dripped_fame_wei, "AFTER_fame_balance_ALIVE");
        assert_eq!(fame_supply, fame_supply_start - dripped_fame_wei, "AFTER_fame_supply_ALIVE");
        assert_eq!(pool_flame.balance_fame, 0, "AFTER_pool_flame.balance_fame_ALIVE");
    } else {
        assert!(memorial.player_address.is_non_zero(), "AFTER_player_address_zero");
        assert_eq!(memorial.player_address, (*sys.duelists).owner_of(token_id.into()), "AFTER_player_address");
        assert_eq!(memorial.cause_of_death, CauseOfDeath::Forsaken, "AFTER_cause_of_death");
        assert_eq!(memorial.fame_before_death, fame_balance_start, "AFTER_fame_before_death");
        assert_eq!(fame_balance, 0, "AFTER_fame_balance_DEAD");
        assert_eq!(fame_supply, fame_supply_start - fame_balance_start + pool_amount, "AFTER_fame_supply_DEAD");
        assert_eq!(pool_flame.balance_fame, pool_amount, "AFTER_pool_flame.balance_fame_DEAD");
    }

    // bank down
    tester::assert_lords_balance_down(*sys.lords, (*sys.bank).contract_address, lords_balance_bank, "AFTER_bank_down");
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
#[should_panic(expected:('ERC721Combo: not owner', 'ENTRYPOINT_FAILED'))]
fn test_duelist_reactivate_OK_alive_not_owner() {
    let mut sys: TestSystems = setup(0);
    let token_id: u128 = TOKEN_ID_1_1.low;
    tester::impersonate(OTHER());
    _test_duelist_reactivate(@sys, token_id, 100, true);
}

#[test]
fn test_duelist_reactivate_OK_edge() {
    let mut sys: TestSystems = setup(0);
    let token_id: u128 = TOKEN_ID_1_1.low;
    _test_duelist_reactivate(@sys, token_id, 2000, true);
}

#[test]
fn test_duelist_reactivate_DEAD_by_1() {
    let mut sys: TestSystems = setup(0);
    let token_id: u128 = TOKEN_ID_1_1.low;
    _test_duelist_reactivate(@sys, token_id, 2001, false);
}

#[test]
fn test_duelist_reactivate_DEAD_empty() {
    let mut sys: TestSystems = setup(0);
    let token_id: u128 = TOKEN_ID_1_1.low;
    _test_duelist_reactivate(@sys, token_id, 3000, false);
}

#[test]
fn test_duelist_reactivate_DEAD_empty_not_owner() {
    let mut sys: TestSystems = setup(0);
    let token_id: u128 = TOKEN_ID_1_1.low;
    tester::impersonate(OTHER());
    _test_duelist_reactivate(@sys, token_id, 3000, false);
}

#[test]
fn test_duelist_reactivate_DEAD_over() {
    let mut sys: TestSystems = setup(0);
    let token_id: u128 = TOKEN_ID_1_1.low;
    _test_duelist_reactivate(@sys, token_id, 4000, false);
}

#[test]
fn test_duelist_reactivate_DEAD_over_not_owner() {
    let mut sys: TestSystems = setup(0);
    let token_id: u128 = TOKEN_ID_1_1.low;
    tester::impersonate(OTHER());
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

#[test]
#[should_panic(expected:('DUELIST: Duelist is dead!', 'ENTRYPOINT_FAILED'))]
fn test_duelist_reactivate_already_dead() {
    let mut sys: TestSystems = setup(0);
    let token_id: u128 = TOKEN_ID_1_1.low;
    _test_duelist_reactivate(@sys, token_id, 3000, false);
    _test_duelist_reactivate(@sys, token_id, 1, false);
}



//---------------------------------
// sacrifice() / memorialize()
//

fn _test_duelist_sacrifice(sys: @TestSystems, token_id: u128, cause_of_death: CauseOfDeath) {
    let token_id: u128 = TOKEN_ID_1_1.low;
    let lords_balance_bank: u128 = (*sys.lords).balance_of((*sys.bank).contract_address).low;
    let lords_balance_treasury: u128 = (*sys.lords).balance_of(TREASURY()).low;
    let fame_balance_start: u128 = (*sys.fame).balance_of_token((*sys.duelists).contract_address, token_id).low;
    let fame_supply_start: u128 = (*sys.fame).total_supply().low;
    let timestamp_active_start: u64 = (*sys.store).get_duelist_value(token_id).timestamps.active;
    // let intial_fame: u128 = FAME::MINT_GRANT_AMOUNT.low;
// println!("[] balance     : {}", fame_balance_start/CONST::ETH_TO_WEI.low);
// println!("[] fame_to_burn: {}", dripped_fame);

    // reactivate
    if (cause_of_death == CauseOfDeath::Sacrifice) {    
        (*sys.duelists).sacrifice(token_id);
    } else if (cause_of_death == CauseOfDeath::Memorize) {    
        (*sys.duelists).memorialize(token_id);
    }
    assert!(!(*sys.duelists).is_alive(token_id), "AFTER_is_alive()");
    assert!(!(*sys.duelists).is_inactive(token_id), "AFTER_is_inactive");
    assert_eq!((*sys.duelists).inactive_timestamp(token_id), 0, "AFTER_inactive_timestamp");
    assert_eq!((*sys.duelists).inactive_fame_dripped(token_id), 0, "AFTER_inactive_fame_dripped");

    let memorial: DuelistMemorialValue = (*sys.store).get_duelist_memorial_value(token_id);
    assert_eq!(memorial.cause_of_death, cause_of_death, "AFTER_cause_of_death");
    assert_eq!(memorial.fame_before_death, fame_balance_start, "AFTER_fame_before_death");
    if (cause_of_death == CauseOfDeath::Sacrifice) {    
        assert_eq!(memorial.killed_by, token_id, "AFTER_killed_by");
    } else if (cause_of_death == CauseOfDeath::Memorize) {    
        assert_eq!(memorial.killed_by, 0, "AFTER_killed_by");
    }

    // timestamp_active updated
    let timestamp_active: u64 = (*sys.store).get_duelist_value(token_id).timestamps.active;
    assert_gt!(timestamp_active, timestamp_active_start, "AFTER_timestamp_active");

    // duelist lost fame...
    let fame_balance: u128 = (*sys.fame).balance_of_token((*sys.duelists).contract_address, token_id).low;
    // Fame supply down
    let fame_supply: u128 = (*sys.fame).total_supply().low;
    // Flames up?
    let pool_flame: Pool = (*sys.store).get_pool(PoolType::SacredFlame);
    let pool_amount: u128 = ((FAME::ONE_LIFE.low / 10) * 6);
    assert_eq!(fame_balance, 0, "AFTER_fame_balance_DEAD");
    assert_eq!(fame_supply, fame_supply_start - fame_balance_start + pool_amount, "AFTER_fame_supply_DEAD");
    assert_eq!(pool_flame.balance_fame, pool_amount, "AFTER_pool_flame.balance_fame_DEAD");

    // bank down
    tester::assert_lords_balance_down(*sys.lords, (*sys.bank).contract_address, lords_balance_bank, "AFTER_bank_down");
    // underware up
    tester::assert_lords_balance_up(*sys.lords, TREASURY(), lords_balance_treasury, "AFTER_treasury_up");
}

#[test]
fn test_duelist_sacrifice_OK() {
    let mut sys: TestSystems = setup(0);
    let token_id: u128 = TOKEN_ID_1_1.low;
    _test_duelist_sacrifice(@sys, token_id, CauseOfDeath::Sacrifice);
}

#[test]
#[should_panic(expected:('DUELIST: Duelist is dead!', 'ENTRYPOINT_FAILED'))]
fn test_duelist_sacrifice_already_dead() {
    let mut sys: TestSystems = setup(0);
    let token_id: u128 = TOKEN_ID_1_1.low;
    _test_duelist_reactivate(@sys, token_id, 3000, false);
    _test_duelist_sacrifice(@sys, token_id, CauseOfDeath::Sacrifice);
}

#[test]
#[should_panic(expected:('ERC721Combo: not owner', 'ENTRYPOINT_FAILED'))]
fn test_duelist_sacrifice_not_owner() {
    let mut sys: TestSystems = setup(0);
    let token_id: u128 = TOKEN_ID_1_1.low;
    tester::impersonate(OTHER());
    _test_duelist_sacrifice(@sys, token_id, CauseOfDeath::Sacrifice);
}

#[test]
fn test_duelist_memorialize_OK() {
    let mut sys: TestSystems = setup(0);
    let token_id: u128 = TOKEN_ID_1_1.low;
    _test_duelist_sacrifice(@sys, token_id, CauseOfDeath::Memorize);
}

#[test]
#[should_panic(expected:('DUELIST: Duelist is dead!', 'ENTRYPOINT_FAILED'))]
fn test_duelist_memorialize_already_dead() {
    let mut sys: TestSystems = setup(0);
    let token_id: u128 = TOKEN_ID_1_1.low;
    _test_duelist_reactivate(@sys, token_id, 3000, false);
    _test_duelist_sacrifice(@sys, token_id, CauseOfDeath::Memorize);
}

#[test]
#[should_panic(expected:('ERC721Combo: not owner', 'ENTRYPOINT_FAILED'))]
fn test_duelist_memorialize_not_owner() {
    let mut sys: TestSystems = setup(0);
    let token_id: u128 = TOKEN_ID_1_1.low;
    tester::impersonate(OTHER());
    _test_duelist_sacrifice(@sys, token_id, CauseOfDeath::Memorize);
}


//---------------------------------
// provate calls
//

#[test]
// #[should_panic(expected: ('TOKEN: caller is not minter', 'ENTRYPOINT_FAILED'))] // for Dojo contracts
// #[should_panic(expected: ('ENTRYPOINT_NOT_FOUND', 'ENTRYPOINT_FAILED', 'ENTRYPOINT_FAILED'))] // for accounts
#[should_panic(expected: ('CONTRACT_NOT_DEPLOYED', 'ENTRYPOINT_FAILED', 'ENTRYPOINT_FAILED'))] // for random addresses
fn test_mint_duelist_not_minter() {
    let mut sys: TestSystems = setup(0);
    // let account: ContractAddress = tester::deploy_mock_account();
    // utils::impersonate(account);
    sys.duelists.mint_duelists(OWNER(), 1, 0x1234);
}

#[test]
// #[should_panic(expected: ('DUELIST: Invalid caller', 'ENTRYPOINT_FAILED'))] // for Dojo contracts
// #[should_panic(expected: ('ENTRYPOINT_NOT_FOUND', 'ENTRYPOINT_FAILED'))] // for accounts
#[should_panic(expected: ('CONTRACT_NOT_DEPLOYED', 'ENTRYPOINT_FAILED'))] // for random addresses
fn test_transfer_rewards_invalid_caller() {
    let mut sys: TestSystems = setup(0);
    let duel_id: u128 = tester::execute_create_duel(@sys.duels, OWNER(), OTHER(), 'premise', SEASON_TABLE(1), 0, 1);
    let challenge: Challenge = sys.store.get_challenge(duel_id);
    // let account: ContractAddress = tester::deploy_mock_account();
    // utils::impersonate(account);
    sys.duelists.transfer_rewards(challenge, 0);
}
