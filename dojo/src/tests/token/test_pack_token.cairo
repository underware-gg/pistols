use starknet::{ContractAddress};
// use dojo::world::{WorldStorage};
use pistols::systems::{
    tokens::{
        duelist_token::{IDuelistTokenDispatcherTrait},
        pack_token::{IPackTokenDispatcherTrait},
        lords_mock::{ILordsMockDispatcherTrait},
    },
};
use pistols::models::{
    player::{Player, PlayerTrait},
    pack::{Pack, PackType, PackTypeTrait},
    config::{TokenConfig},
};

use pistols::types::duelist_profile::{DuelistProfile, GenesisKey};
// use pistols::interfaces::dns::{DnsTrait};
use pistols::types::constants::{CONST};
use pistols::types::timestamp::{TIMESTAMP};
use pistols::tests::tester::{
    tester,
    tester::{
        StoreTrait,
        TestSystems, FLAGS,
        OWNER, OTHER, BUMMER, SPENDER, SEASON_ID_1,
    },
};

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


fn setup(_fee_amount: u128) -> TestSystems {
    let mut sys: TestSystems = tester::setup_world(FLAGS::DUELIST | FLAGS::FAME | FLAGS::LORDS);

    tester::set_current_season(ref sys, SEASON_ID_1);

    tester::execute_lords_faucet(@sys.lords, OWNER());
    tester::execute_lords_faucet(@sys.lords, OTHER());

    tester::fund_duelists_pool(@sys, 2);

    // drop all events
    tester::drop_all_events(sys.world.dispatcher.contract_address);
    tester::drop_all_events(sys.pack.contract_address);

    tester::impersonate(OWNER());

    (sys)
}

fn _assert_minted_count(sys: @TestSystems, minted_count: u128, msg: ByteArray) {
    let token_config: TokenConfig = (*sys.store).get_token_config((*sys.pack).contract_address);
    assert_eq!(token_config.minted_count, minted_count, "{}", msg);
}
fn _assert_duelist_count(sys: @TestSystems, minted_count: u128, msg: ByteArray) {
    let token_config: TokenConfig = (*sys.store).get_token_config((*sys.duelists).contract_address);
    assert_eq!(token_config.minted_count, minted_count, "{}", msg);
}

fn _purchase(sys: @TestSystems, recipient: ContractAddress) -> u128 {
    let price: u128 = (*sys.pack).calc_mint_fee(recipient, PackType::GenesisDuelists5x);
    assert_ne!(price, 0, "invalid price");
    tester::impersonate(recipient);
    tester::execute_lords_approve(sys.lords, recipient, (*sys.bank).contract_address, price);
    (*sys.pack).purchase(PackType::GenesisDuelists5x);
    (price)
}

//
// initialize
//

#[test]
fn test_initializer() {
    let mut sys: TestSystems = setup(0);
    assert_eq!(sys.pack.symbol(), "PACK", "Symbol is wrong");

    _assert_minted_count(@sys, 0, "Should eq 0");

    assert!(sys.pack.supports_interface(interface::IERC721_ID), "should support IERC721_ID");
    assert!(sys.pack.supports_interface(interface::IERC721_METADATA_ID), "should support METADATA");
}

#[test]
fn test_contract_uri() {
    let mut sys: TestSystems = setup(0);
    let uri: ByteArray = sys.pack.contract_uri();
    let uri_camel: ByteArray = sys.pack.contractURI();
    println!("___pack.contract_uri():{}", uri);
    assert!(tester::starts_with(uri.clone(), "data:"), "contract_uri() should be a json string");
    assert_eq!(uri.clone(), uri_camel.clone(), "uri_camel");
}

#[test]
fn test_token_uri() {
    let mut sys: TestSystems = setup(0);

    let pack = Pack {
        pack_id: TOKEN_ID_1.low,
        pack_type: PackType::GenesisDuelists5x,
        seed: 999999,
        lords_amount: 50 * CONST::ETH_TO_WEI.low,
        is_open: false,
    };

    tester::set_Pack(ref sys.world, @pack);

    assert!(sys.pack.can_claim_starter_pack(OWNER()), "can_claim_starter_pack");
    tester::execute_claim_starter_pack(@sys.pack, OWNER());
    _purchase(@sys, OWNER());

    let uri = sys.pack.token_uri(TOKEN_ID_2);
    assert_gt!(uri.len(), 100, "Uri 1 should not be empty");
    println!("___packs.token_uri(1):{}", uri);
}

#[test]
#[should_panic(expected: ('ERC721: invalid token ID', 'ENTRYPOINT_FAILED'))]
fn test_token_uri_invalid() {
    let mut sys: TestSystems = setup(0);
    sys.pack.token_uri(999);
}


//
// mint
//

#[test]
fn test_claim_purchase() {
    let mut sys: TestSystems = setup(0);
    _assert_minted_count(@sys, 0, "total_supply init");
    assert_eq!(sys.pack.balance_of(OWNER()), 0, "balance_of 0");

    let player: Player = sys.store.get_player(OWNER());
    assert!(!player.exists(), "!player.exists()");
    assert!(!player.timestamps.claimed_starter_pack, "!player.timestamps.claimed_starter_pack");

    let starter_pack_duelist_count: usize = PackType::StarterPack.description().quantity;

    assert!(sys.pack.can_claim_starter_pack(OWNER()), "can_claim_starter_pack_OWNER");
    let owner_ids: Span<u128> = tester::execute_claim_starter_pack(@sys.pack, OWNER());
    _assert_minted_count(@sys, 1, "total_supply 1");
    _assert_duelist_count(@sys, starter_pack_duelist_count.into(), "duelist_supply [starter_pack_duelist_count]");
    assert_eq!(sys.pack.balance_of(OWNER()), 0, "balance_of 0");

    let player: Player = sys.store.get_player(OWNER());
    assert!(player.exists(), "player.exists()");
    assert!(player.timestamps.claimed_starter_pack, "player.timestamps.claimed_starter_pack");
    let pack_1: Pack = sys.store.get_pack(TOKEN_ID_1.low);
    assert_eq!(pack_1.pack_id, TOKEN_ID_1.low, "pack_1.pack_id");
    assert_eq!(pack_1.pack_type, PackType::StarterPack, "pack_1.pack_type");
    assert_ne!(pack_1.seed, 0, "pack_1.seed");
    assert!(pack_1.is_open, "pack_1.is_open");

    // balances before purchase
    let balance_owner_initial: u128 = sys.lords.balance_of(OWNER()).low;
    let balance_bank_initial: u128 = sys.lords.balance_of(sys.bank.contract_address).low;
    assert_ne!(balance_owner_initial, 0, "balance_owner_initial");
    assert_ne!(balance_bank_initial, 0, "balance_bank_initial");

    let price: u128 = _purchase(@sys, OWNER());
    _assert_minted_count(@sys, 2, "total_supply 2");
    assert_eq!(sys.pack.balance_of(OWNER()), 1, "balance_of 1");
    assert!(sys.pack.owner_of(TOKEN_ID_2) == OWNER(), "owner_of_2");

    let pack_2: Pack = sys.store.get_pack(TOKEN_ID_2.low);
    assert_eq!(pack_2.pack_id, TOKEN_ID_2.low, "pack_2.pack_id");
    assert_eq!(pack_2.pack_type, PackType::GenesisDuelists5x, "pack_2.pack_type");
    assert_ne!(pack_2.seed, pack_1.seed, "pack_2.seed");
    assert!(!pack_2.is_open, "pack_2.is_open");

    // balances after purchase
    let balance_owner: u128 = sys.lords.balance_of(OWNER()).low;
    let balance_bank: u128 = sys.lords.balance_of(sys.bank.contract_address).low;
    assert_eq!(balance_owner, balance_owner_initial - price, "balance_owner");
    assert_eq!(balance_bank, balance_bank_initial + price, "balance_bank");

    assert!(sys.pack.can_claim_starter_pack(OTHER()), "can_claim_starter_pack_OTHER");
    let other_ids: Span<u128> = tester::execute_claim_starter_pack(@sys.pack, OTHER());

    // duelists should be the same
    let owner_profile_1: DuelistProfile = sys.store.get_duelist_profile(*owner_ids[0]);
    let owner_profile_2: DuelistProfile = sys.store.get_duelist_profile(*owner_ids[1]);
    let other_profile_1: DuelistProfile = sys.store.get_duelist_profile(*other_ids[0]);
    let other_profile_2: DuelistProfile = sys.store.get_duelist_profile(*other_ids[1]);
// println!("owner_profile_1:{}", owner_profile_1);
// println!("owner_profile_2:{}", owner_profile_2);
// println!("other_profile_1:{}", other_profile_1);
// println!("other_profile_2:{}", other_profile_2);
    assert_eq!(owner_profile_1, DuelistProfile::Genesis(GenesisKey::SerWalker), "owner_profile_1");
    assert_eq!(other_profile_1, DuelistProfile::Genesis(GenesisKey::SerWalker), "other_profile_1");
    assert_eq!(owner_profile_2, DuelistProfile::Genesis(GenesisKey::LadyVengeance), "owner_profile_2");
    assert_eq!(other_profile_2, DuelistProfile::Genesis(GenesisKey::LadyVengeance), "other_profile_2");
}

#[test]
#[should_panic(expected: ('BANK: insufficient LORDS pool', 'ENTRYPOINT_FAILED', 'ENTRYPOINT_FAILED'))]
fn test_claim_not_sponsored() {
    let mut sys: TestSystems = setup(0);
    assert!(sys.pack.can_claim_starter_pack(OWNER()), "can_claim_starter_pack_OWNER");
    tester::execute_claim_starter_pack(@sys.pack, OWNER());
    assert!(sys.pack.can_claim_starter_pack(OTHER()), "can_claim_starter_pack_OTHER");
    tester::execute_claim_starter_pack(@sys.pack, OTHER());
    assert!(sys.pack.can_claim_starter_pack(BUMMER()), "can_claim_starter_pack_BUMMER");
    tester::execute_claim_starter_pack(@sys.pack, BUMMER());
}

#[test]
#[should_panic(expected: ('BANK: insufficient allowance', 'ENTRYPOINT_FAILED', 'ENTRYPOINT_FAILED'))]
fn test_mint_no_allowance_zero() {
    let mut sys: TestSystems = setup(0);
    assert!(sys.pack.can_claim_starter_pack(OWNER()), "can_claim_starter_pack_OWNER");
    tester::execute_claim_starter_pack(@sys.pack, OWNER());
    sys.pack.purchase(PackType::GenesisDuelists5x);
}

#[test]
#[should_panic(expected: ('PACK: Ineligible', 'ENTRYPOINT_FAILED'))]
fn test_claim_twice() {
    let mut sys: TestSystems = setup(0);
    assert!(sys.pack.can_claim_starter_pack(OWNER()), "can_claim_starter_pack_OWNER");
    tester::execute_claim_starter_pack(@sys.pack, OWNER());
    assert!(!sys.pack.can_claim_starter_pack(OWNER()), "can_claim_starter_pack_OWNER");
    tester::execute_claim_starter_pack(@sys.pack, OWNER());
}

#[test]
#[should_panic(expected: ('BANK: insufficient allowance', 'ENTRYPOINT_FAILED', 'ENTRYPOINT_FAILED'))]
fn test_mint_no_allowance_half() {
    let mut sys: TestSystems = setup(0);
    tester::execute_claim_starter_pack(@sys.pack, OWNER());
    let price: u128 = sys.pack.calc_mint_fee(OWNER(), PackType::GenesisDuelists5x);
    tester::execute_lords_approve(@sys.lords, OWNER(), sys.bank.contract_address, price / 2);
    sys.pack.purchase(PackType::GenesisDuelists5x);
}

#[test]
#[should_panic(expected: ('PACK: Claim duelists first', 'ENTRYPOINT_FAILED'))]
fn test_no_claim() {
    let mut sys: TestSystems = setup(0);
    _purchase(@sys, OWNER());
}

#[test]
#[should_panic(expected: ('PACK: Not for sale', 'ENTRYPOINT_FAILED'))]
fn test_mint_not_for_sale() {
    let mut sys: TestSystems = setup(0);
    tester::execute_claim_starter_pack(@sys.pack, OWNER());
    sys.pack.purchase(PackType::StarterPack);
}


//
// free gifts...
//

#[test]
fn test_claim_gift() {
    let mut sys: TestSystems = setup(0);
    // 1: claim starter pack
    assert!(!sys.pack.can_claim_gift(OWNER()), "!can_claim_gift_1");
    tester::execute_claim_starter_pack(@sys.pack, OWNER());
    assert_eq!(sys.duelists.balance_of(OWNER()), 2, "balance_of(OWNER) 2");
    assert_eq!(sys.store.get_player_alive_duelist_count(OWNER()), 2, "alive_duelist_count::claimed_starter_pack");
    // 2: no alive duelists
    assert!(!sys.pack.can_claim_gift(OWNER()), "!can_claim_gift_2");
    tester::impersonate(OWNER());
    sys.duelists.transfer_from(OWNER(), OTHER(), TOKEN_ID_1);
    sys.duelists.transfer_from(OWNER(), OTHER(), TOKEN_ID_2);
    assert_eq!(sys.duelists.balance_of(OWNER()), 0, "balance_of(OWNER) 0");
    assert_eq!(sys.store.get_player_alive_duelist_count(OWNER()), 0, "alive_duelist_count::transferred_out");
    // claim!
    assert!(sys.pack.can_claim_gift(OWNER()), "can_claim_gift_CLAIM");
    tester::execute_claim_gift(@sys.pack, OWNER());
    assert_eq!(sys.duelists.balance_of(OWNER()), 1, "balance_of(OWNER) 1");
    assert_eq!(sys.store.get_player_alive_duelist_count(OWNER()), 1, "alive_duelist_count::claimed_gift");
    // no more claim!
    assert!(!sys.pack.can_claim_gift(OWNER()), "!can_claim_gift_AFTER");
    // transfer out...
    sys.duelists.transfer_from(OWNER(), OTHER(), TOKEN_ID_3);
    assert_eq!(sys.duelists.balance_of(OWNER()), 0, "balance_of(OWNER) 0");
    assert_eq!(sys.store.get_player_alive_duelist_count(OWNER()), 0, "alive_duelist_count::transferred_out");
    // 3: passed 24 hours...
    assert!(!sys.pack.can_claim_gift(OWNER()), "!can_claim_gift_transfered_gift");
    tester::elapse_block_timestamp(TIMESTAMP::ONE_DAY + 1);
    assert!(sys.pack.can_claim_gift(OWNER()), "can_claim_gift_next_day");
    tester::execute_claim_gift(@sys.pack, OWNER());
    assert_eq!(sys.duelists.balance_of(OWNER()), 1, "balance_of(OWNER) 1");
    assert_eq!(sys.store.get_player_alive_duelist_count(OWNER()), 1, "alive_duelist_count::claimed_gift");
    // no more claim!
    assert!(!sys.pack.can_claim_gift(OWNER()), "!can_claim_gift_END");
}

#[test]
#[should_panic(expected: ('BANK: insufficient LORDS pool', 'ENTRYPOINT_FAILED', 'ENTRYPOINT_FAILED'))]
fn test_claim_gift_not_sponsored() {
    let mut sys: TestSystems = setup(0);
    // 1: claim starter pack -- DRAIN ALL LORDS
    tester::execute_claim_starter_pack(@sys.pack, OWNER());
    tester::execute_claim_starter_pack(@sys.pack, OTHER());
    // 2: no alive duelists
    tester::impersonate(OWNER());
    sys.duelists.transfer_from(OWNER(), OTHER(), TOKEN_ID_1);
    sys.duelists.transfer_from(OWNER(), OTHER(), TOKEN_ID_2);
    // claim!
    assert!(sys.pack.can_claim_gift(OWNER()), "can_claim_gift_CLAIM");
    tester::execute_claim_gift(@sys.pack, OWNER());
}

#[test]
fn test_claim_gift_sponsored() {
    let mut sys: TestSystems = setup(0);
    // 1: claim starter pack -- DRAIN ALL LORDS
    tester::execute_claim_starter_pack(@sys.pack, OWNER());
    tester::execute_claim_starter_pack(@sys.pack, OTHER());
    // 2: no alive duelists
    tester::impersonate(OWNER());
    sys.duelists.transfer_from(OWNER(), OTHER(), TOKEN_ID_1);
    sys.duelists.transfer_from(OWNER(), OTHER(), TOKEN_ID_2);
    // sponsor...
    tester::fund_duelists_pool(@sys, 1);
    // claim!
    assert!(sys.pack.can_claim_gift(OWNER()), "can_claim_gift_CLAIM");
    tester::execute_claim_gift(@sys.pack, OWNER());
}

#[test]
#[should_panic(expected: ('PACK: Ineligible', 'ENTRYPOINT_FAILED'))]
fn test_claim_gift_ineligible() {
    let mut sys: TestSystems = setup(0);
    assert!(!sys.pack.can_claim_gift(OWNER()), "can_claim_gift_OWNER");
    tester::execute_claim_gift(@sys.pack, OWNER());
}


//
// opening...
//

#[test]
fn test_open() {
    let mut sys: TestSystems = setup(0);

    let starter_pack_count: usize = PackType::StarterPack.description().quantity;
    assert_eq!(starter_pack_count, 2, "starter_pack_count");

    // claiming opens and mint duelists
    assert_eq!(sys.store.get_player_alive_duelist_count(OWNER()), 0, "alive_duelist_count::zero");
    tester::execute_claim_starter_pack(@sys.pack, OWNER());
    assert_eq!(sys.store.get_player_alive_duelist_count(OWNER()), 2, "alive_duelist_count::claimed_starter_pack");
    _assert_duelist_count(@sys, starter_pack_count.into(), "duelist_supply");
    let pack_1: Pack = sys.store.get_pack(TOKEN_ID_1.low);
    assert!(pack_1.is_open, "pack_1.is_open == true");

    // purchase, minted count does not change
    _purchase(@sys, OWNER());
    _assert_duelist_count(@sys, starter_pack_count.into(), "duelist_supply_after_purchase");
    let pack_2: Pack = sys.store.get_pack(TOKEN_ID_2.low);
    assert!(!pack_2.is_open, "pack_2.is_open == false");
    assert_eq!(sys.store.get_player_alive_duelist_count(OWNER()), 2, "alive_duelist_count::unopened");

    // open, minted count +5
    sys.pack.open(TOKEN_ID_2.low);
    _assert_duelist_count(@sys, starter_pack_count.into() + 5, "duelist_supply_after_open");
    let pack_2: Pack = sys.store.get_pack(TOKEN_ID_2.low);
    assert!(pack_2.is_open, "pack_2.is_open == false");
    assert_eq!(sys.store.get_player_alive_duelist_count(OWNER()), 2 + 5, "alive_duelist_count::opened");
}

#[test]
#[should_panic(expected: ('ERC721: invalid token ID', 'ENTRYPOINT_FAILED'))]
fn test_open_invalid() {
    let mut sys: TestSystems = setup(0);
    tester::impersonate(OWNER());
    sys.pack.open(TOKEN_ID_2.low);
}

#[test]
#[should_panic(expected: ('ERC721: invalid token ID', 'ENTRYPOINT_FAILED'))] // burn!
// #[should_panic(expected: ('PACK: Already opened', 'ENTRYPOINT_FAILED'))] // no burn
fn test_already_opened() {
    let mut sys: TestSystems = setup(0);
    tester::execute_claim_starter_pack(@sys.pack, OWNER());
    tester::impersonate(OWNER());
    sys.pack.open(TOKEN_ID_1.low);
}

#[test]
#[should_panic(expected: ('PACK: Not owner', 'ENTRYPOINT_FAILED'))]
fn test_open_not_owner() {
    let mut sys: TestSystems = setup(0);
    tester::execute_claim_starter_pack(@sys.pack, OWNER());
    _purchase(@sys, OWNER());
    tester::impersonate(OTHER());
    sys.pack.open(TOKEN_ID_2.low);
}


//
// transfer...
//

#[test]
#[should_panic(expected: ('ERC721: invalid token ID', 'ENTRYPOINT_FAILED'))] // burn!
// #[should_panic(expected: ('PACK: Already opened', 'ENTRYPOINT_FAILED'))] // no burn
fn test_transfer_opened() {
    let mut sys: TestSystems = setup(0);
    tester::execute_claim_starter_pack(@sys.pack, OWNER());
    // try to transfer already opened
    tester::impersonate(OWNER());
    sys.pack.transfer_from(OWNER(), OTHER(), TOKEN_ID_1);
}

#[test]
#[should_panic(expected: ('ERC721: invalid token ID', 'ENTRYPOINT_FAILED'))] // burn!
// #[should_panic(expected: ('PACK: Already opened', 'ENTRYPOINT_FAILED'))] // no burn
fn test_transfer_opened_allowed() {
    let mut sys: TestSystems = setup(0);
    tester::execute_claim_starter_pack(@sys.pack, OWNER());
    // approve
    tester::impersonate(OWNER());
    sys.pack.approve(SPENDER(), TOKEN_ID_1);
    // try to transfer from unauthorized
    tester::impersonate(SPENDER());
    sys.pack.transfer_from(OWNER(), OTHER(), TOKEN_ID_1);
}

#[test]
#[should_panic(expected: ('ERC721: invalid token ID', 'ENTRYPOINT_FAILED'))] // burn!
// #[should_panic(expected: ('ERC721: unauthorized caller', 'ENTRYPOINT_FAILED'))] // no burn
fn test_transfer_opened_no_allowance() {
    let mut sys: TestSystems = setup(0);
    tester::execute_claim_starter_pack(@sys.pack, OWNER());
    // try to transfer from unauthorized
    tester::impersonate(SPENDER());
    sys.pack.transfer_from(OWNER(), OTHER(), TOKEN_ID_1);
}

#[test]
fn test_transfer_unopened_ok() {
    let mut sys: TestSystems = setup(0);
    tester::execute_claim_starter_pack(@sys.pack, OWNER());
    _purchase(@sys, OWNER());
    assert_eq!(sys.pack.balance_of(OWNER()), 1, "balance_of(OWNER) 1");
    assert_eq!(sys.pack.balance_of(OTHER()), 0, "balance_of(OTHER) 0");
    assert!(sys.pack.owner_of(TOKEN_ID_2) == OWNER(), "owner_of(OWNER)");
    // transfer
    tester::impersonate(OWNER());
    sys.pack.transfer_from(OWNER(), OTHER(), TOKEN_ID_2);
    assert_eq!(sys.pack.balance_of(OWNER()), 0, "balance_of(OWNER) 0");
    assert_eq!(sys.pack.balance_of(OTHER()), 1, "balance_of(OTHER) 1");
    assert!(sys.pack.owner_of(TOKEN_ID_2) == OTHER(), "owner_of(OTHER)");
}

#[test]
fn test_transfer_unopened_allowed_ok() {
    let mut sys: TestSystems = setup(0);
    tester::execute_claim_starter_pack(@sys.pack, OWNER());
    _purchase(@sys, OWNER());
    assert_eq!(sys.pack.balance_of(OWNER()), 1, "balance_of(OWNER) 1");
    assert_eq!(sys.pack.balance_of(OTHER()), 0, "balance_of(OTHER) 0");
    assert!(sys.pack.owner_of(TOKEN_ID_2) == OWNER(), "owner_of(OWNER)");
    // approve
    tester::impersonate(OWNER());
    sys.pack.approve(SPENDER(), TOKEN_ID_2);
    // transfer
    tester::impersonate(SPENDER());
    sys.pack.transfer_from(OWNER(), OTHER(), TOKEN_ID_2);
    assert_eq!(sys.pack.balance_of(OWNER()), 0, "balance_of(OWNER) 0");
    assert_eq!(sys.pack.balance_of(OTHER()), 1, "balance_of(OTHER) 1");
    assert!(sys.pack.owner_of(TOKEN_ID_2) == OTHER(), "owner_of(OTHER)");
}

#[test]
#[should_panic(expected: ('ERC721: unauthorized caller', 'ENTRYPOINT_FAILED'))]
fn test_transfer_unopened_no_allowance() {
    let mut sys: TestSystems = setup(0);
    tester::execute_claim_starter_pack(@sys.pack, OWNER());
    _purchase(@sys, OWNER());
    // try to transfer from unauthorized
    tester::impersonate(SPENDER());
    sys.pack.transfer_from(OWNER(), OTHER(), TOKEN_ID_2);
}


//---------------------------------
// metadata_update
//
#[test]
fn test_update_contract_metadata() {
    let mut sys: TestSystems = setup(0);
    tester::drop_all_events(sys.pack.contract_address);
    sys.pack.update_contract_metadata();
    let _event = tester::pop_log::<combo::ContractURIUpdated>(sys.pack.contract_address, selector!("ContractURIUpdated")).unwrap();
}
#[test]
fn test_update_token_metadata() {
    let mut sys: TestSystems = setup(0);
    tester::drop_all_events(sys.pack.contract_address);
    sys.pack.update_token_metadata(TOKEN_ID_1.low);
    let event = tester::pop_log::<combo::MetadataUpdate>(sys.pack.contract_address, selector!("MetadataUpdate")).unwrap();
    assert_eq!(event.token_id, TOKEN_ID_1.into(), "event.token_id");
}
// #[test]
// fn test_update_tokens_metadata() {
//     let mut sys: TestSystems = setup(0);
//     tester::drop_all_events(sys.pack.contract_address);
//     sys.pack.update_tokens_metadata(TOKEN_ID_1.low, TOKEN_ID_2.low);
//     let event = tester::pop_log::<combo::BatchMetadataUpdate>(sys.pack.contract_address, selector!("BatchMetadataUpdate")).unwrap();
//     assert_eq!(event.from_token_id, TOKEN_ID_1.into(), "event.from_token_id");
//     assert_eq!(event.to_token_id, TOKEN_ID_2.into(), "event.to_token_id");
// }
