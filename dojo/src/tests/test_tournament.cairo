use starknet::{ContractAddress};
// use dojo::world::{WorldStorage};
use dojo::model::{ModelStorageTest};

use pistols::systems::tokens::{
    // tournament_token::{ITournamentTokenProtectedDispatcher, ITournamentTokenProtectedDispatcherTrait},
    duel_token::{IDuelTokenProtectedDispatcher, IDuelTokenProtectedDispatcherTrait},
};
use pistols::models::{
    challenge::{Challenge, DuelType},
    tournament::{
        TournamentEntry,
        Tournament, TournamentType,
        TournamentRound,
        TournamentSettings, TournamentSettingsValue,
        TournamentDuelKeys,
        // ChallengeToTournamentValue, TournamentToChallengeValue,
        // TOURNAMENT_SETTINGS,
    },
};
use pistols::types::{
    challenge_state::{ChallengeState},
    timestamp::{TIMESTAMP},
    // constants::{CONST},
};
// use pistols::interfaces::dns::{DnsTrait};
use pistols::utils::short_string::{ShortStringTrait};
use pistols::utils::math::{MathTrait};

use pistols::tests::tester::{
    tester,
    tester::{
        StoreTrait,
        TestSystems, FLAGS,
        ID, OWNER, OTHER, ZERO,
        // OWNED_BY_OWNER, OWNED_BY_OTHER,
        ITournamentTokenDispatcherTrait,
    },
};
use pistols::systems::tokens::budokan_mock::{PLAYER_1, PLAYER_2};

use tournaments::components::{
    models::{
        game::{TokenMetadata},
        lifecycle::{Lifecycle},
    },
    libs::{
        lifecycle::{LifecycleTrait},
    },
};


//
// Setup
//

pub const SETTINGS_ID: u32 = 101;

pub const ENTRY_ID_0: u64 = 0;  // creator
pub const ENTRY_ID_1: u64 = 1;
pub const ENTRY_ID_2: u64 = 2;
pub const ENTRY_ID_3: u64 = 3;
pub const ENTRY_ID_4: u64 = 4;

pub const PLAYER_NAME: felt252 = 'Player';
pub const TIMESTAMP_START: u64 = (tester::INITIAL_TIMESTAMP + TIMESTAMP::ONE_DAY);
pub const TIMESTAMP_END: u64 = (TIMESTAMP_START + (TIMESTAMP::ONE_DAY * 7));

fn setup(lives_staked: u8, flags: u16) -> TestSystems {
    let mut sys: TestSystems = tester::setup_world(flags);

    tester::impersonate(sys.tournaments.contract_address);
    let min_lives: u8 = core::cmp::max(lives_staked, 3);
    let max_lives: u8 = min_lives + 1;
    let settings = TournamentSettings {
        settings_id: SETTINGS_ID,
        tournament_type: TournamentType::LastManStanding,
        min_lives,
        max_lives,
        lives_staked,
    };
    sys.store.set_tournament_settings(@settings);

    // drop all events
    tester::drop_all_events(sys.world.dispatcher.contract_address);
    tester::drop_all_events(sys.tournaments.contract_address);

    tester::impersonate(OWNER());

    (sys)
}

fn _mint(ref sys: TestSystems, recipient: ContractAddress) -> u64 {
    let total_supply: u64 = sys.tournaments.total_supply().try_into().unwrap();
    let player_name: felt252 = ShortStringTrait::concat('Player', total_supply.to_short_string());
    // mint from budokan
    let caller: ContractAddress = tester::get_impersonator();
    tester::impersonate(sys.budokan.contract_address);
    // public mint function in the budokan game component
    let token_id: u64 = sys.tournaments.mint(
        player_name,
        settings_id: SETTINGS_ID,
        start: Option::None,
        end: Option::None,
        to: recipient,
    );
    assert_eq!(token_id, total_supply, "bad token_id");
    // Create metadata
    let token_metadata: TokenMetadata = TokenMetadata {
        token_id,
        player_name,
        minted_by: sys.budokan.contract_address,
        settings_id: SETTINGS_ID,
        lifecycle: Lifecycle {
            mint: 1,
            start: Option::Some(TIMESTAMP_START),
            end: Option::Some(TIMESTAMP_END),
        },
    };
    sys.world.write_model_test(@token_metadata);
    tester::impersonate(caller);
    (token_id)
}

pub fn _protected_duel(sys: @TestSystems) -> IDuelTokenProtectedDispatcher {
    (IDuelTokenProtectedDispatcher{contract_address: (*sys.duels).contract_address})
}

// pub fn _protected(sys: @TestSystems) -> ITournamentTokenProtectedDispatcher {
//     (ITournamentTokenProtectedDispatcher{contract_address: (*sys.tournaments).contract_address})
// }

//--------------------------------
// start tournament
//

#[test]
fn test_lifecycle() {
    let mut sys: TestSystems = setup(3, FLAGS::TOURNAMENT);
    _mint(ref sys, OWNER()); // ENTRY_ID_1
    // mint phase
    let token_metadata: TokenMetadata = sys.store.get_budokan_token_metadata(ENTRY_ID_1);
    assert!(token_metadata.lifecycle.mint > 0);
    assert!(token_metadata.lifecycle.start.is_some());
    assert!(token_metadata.lifecycle.end.is_some());
    assert!(!token_metadata.lifecycle.can_start(tester::get_block_timestamp()), "phase 0.can_start");
    assert!(!token_metadata.lifecycle.is_playable(tester::get_block_timestamp()), "phase 0.is_playable");
    assert!(!token_metadata.lifecycle.has_expired(tester::get_block_timestamp()), "phase 0.has_expired");
    // start phase
    tester::set_block_timestamp(TIMESTAMP_START);
    assert!(token_metadata.lifecycle.can_start(tester::get_block_timestamp()), "phase 1.can_start");
    assert!(token_metadata.lifecycle.is_playable(tester::get_block_timestamp()), "phase 1.is_playable");
    assert!(!token_metadata.lifecycle.has_expired(tester::get_block_timestamp()), "phase 1.has_expired");
    // end phase
    tester::set_block_timestamp(TIMESTAMP_END);
    assert!(token_metadata.lifecycle.can_start(tester::get_block_timestamp()), "phase 2.can_start");
    assert!(!token_metadata.lifecycle.is_playable(tester::get_block_timestamp()), "phase 2.is_playable");
    assert!(token_metadata.lifecycle.has_expired(tester::get_block_timestamp()), "phase 2.has_expired");
}

#[test]
fn test_mock_settings_1() {
    let mut sys: TestSystems = setup(1, 0);
    let settings: TournamentSettingsValue = sys.store.get_tournament_settings_value(SETTINGS_ID);
    assert_eq!(settings.min_lives, 3);
    assert_eq!(settings.max_lives, 4);
    assert_eq!(settings.lives_staked, 1);
}

#[test]
fn test_mock_settings_3() {
    let mut sys: TestSystems = setup(3, 0);
    let settings: TournamentSettingsValue = sys.store.get_tournament_settings_value(SETTINGS_ID);
    assert_eq!(settings.min_lives, 3);
    assert_eq!(settings.max_lives, 4);
    assert_eq!(settings.lives_staked, 3);
}

#[test]
fn test_mock_settings_5() {
    let mut sys: TestSystems = setup(5, 0);
    let settings: TournamentSettingsValue = sys.store.get_tournament_settings_value(SETTINGS_ID);
    assert_eq!(settings.min_lives, 5);
    assert_eq!(settings.max_lives, 6);
    assert_eq!(settings.lives_staked, 5);
}

#[test] 
fn test_start_tournament() {
    let mut sys: TestSystems = setup(3, FLAGS::TOURNAMENT);
    _mint(ref sys, OWNER()); // ENTRY_ID_1
    assert!(!sys.tournaments.can_start_tournament(ENTRY_ID_1), "can_start() false");
    // time travel
    tester::set_block_timestamp(TIMESTAMP_START);
    assert!(sys.tournaments.can_start_tournament(ENTRY_ID_1), "can_start() true");
    let tournament_id: u64 = tester::execute_start_tournament(@sys, OWNER(), ENTRY_ID_1);
    assert!(tournament_id > 0, "tournament_id");
    let tournament: Tournament = sys.store.get_tournament(tournament_id);
    assert_eq!(tournament.current_round_number, 1);
    let round: TournamentRound = sys.store.get_tournament_round(tournament_id, 1);
    assert_ne!(round.bracket, 0);
    assert_ne!(round.results, 0);
    // end state
    assert!(!sys.tournaments.can_start_tournament(ENTRY_ID_1), "can_start() started");
    assert_eq!(sys.tournaments.get_tournament_id(ENTRY_ID_1), tournament_id, "get_tournament_id()");
}

#[test] 
fn test_start_tournament_other_ok() {
    let mut sys: TestSystems = setup(3, FLAGS::TOURNAMENT);
    _mint(ref sys, OWNER()); // ENTRY_ID_1
    tester::set_block_timestamp(TIMESTAMP_START);
    let tournament_id: u64 = tester::execute_start_tournament(@sys, OTHER(), ENTRY_ID_1);
    assert!(tournament_id > 0, "tournament_id");
}

#[test]
#[should_panic(expected: ('TOURNAMENT: Invalid entry', 'ENTRYPOINT_FAILED'))]
fn test_start_tournament_invalid_entry() {
    let mut sys: TestSystems = setup(3, FLAGS::TOURNAMENT);
    tester::execute_start_tournament(@sys, OWNER(), ENTRY_ID_1);
}

#[test]
#[should_panic(expected: ('TOURNAMENT: Not startable', 'ENTRYPOINT_FAILED'))]
fn test_start_tournament_not_startable() {
    let mut sys: TestSystems = setup(3, FLAGS::TOURNAMENT);
    _mint(ref sys, OWNER()); // ENTRY_ID_1
    tester::execute_start_tournament(@sys, OWNER(), ENTRY_ID_1);
}

#[test]
#[should_panic(expected: ('TOURNAMENT: Already started', 'ENTRYPOINT_FAILED'))]
fn test_start_tournament_already_started() {
    let mut sys: TestSystems = setup(3, FLAGS::TOURNAMENT);
    _mint(ref sys, OWNER()); // ENTRY_ID_1
    tester::set_block_timestamp(TIMESTAMP_START);
    tester::execute_start_tournament(@sys, OWNER(), ENTRY_ID_1);
    tester::execute_start_tournament(@sys, OWNER(), ENTRY_ID_1);
}


//--------------------------------
// enlist duelist
//

#[test]
fn test_enlist_duelist() {
    let mut sys: TestSystems = setup(3, FLAGS::TOURNAMENT);
    let entry_id_1: u64 = _mint(ref sys, OWNER());
    assert!(sys.tournaments.can_enlist_duelist(entry_id_1, ID(OWNER())));
    tester::execute_enlist_duelist(@sys, OWNER(), entry_id_1, ID(OWNER()));
    // another...
    tester::impersonate(OTHER());
    let entry_id_2: u64 = _mint(ref sys, OTHER());
    assert!(sys.tournaments.can_enlist_duelist(entry_id_2, ID(OTHER())));
    sys.tournaments.enlist_duelist(entry_id_2, ID(OTHER()));
}

#[test]
#[should_panic(expected: ('TOURNAMENT: Not your entry', 'ENTRYPOINT_FAILED'))]
fn test_enlist_duelist_not_your_entry() {
    let mut sys: TestSystems = setup(3, FLAGS::TOURNAMENT);
    let entry_id: u64 = _mint(ref sys, OWNER());
    assert!(!sys.tournaments.can_enlist_duelist(entry_id + 1, ID(OWNER())));
    sys.tournaments.enlist_duelist(entry_id + 1, ID(OWNER()));
}

#[test]
#[should_panic(expected: ('TOURNAMENT: Invalid duelist', 'ENTRYPOINT_FAILED'))]
fn test_enlist_duelist_invalid_duelist() {
    let mut sys: TestSystems = setup(3, FLAGS::TOURNAMENT);
    let entry_id: u64 = _mint(ref sys, OWNER());
    assert!(!sys.tournaments.can_enlist_duelist(entry_id, ID(OTHER())));
    sys.tournaments.enlist_duelist(entry_id, 0);
}

#[test]
#[should_panic(expected: ('TOURNAMENT: Not your duelist', 'ENTRYPOINT_FAILED'))]
fn test_enlist_duelist_not_your_duelist() {
    let mut sys: TestSystems = setup(3, FLAGS::TOURNAMENT);
    let entry_id: u64 = _mint(ref sys, OWNER());
    assert!(!sys.tournaments.can_enlist_duelist(entry_id, ID(OTHER())));
    sys.tournaments.enlist_duelist(entry_id, ID(OTHER()));
}

#[test]
#[should_panic(expected: ('TOURNAMENT: Insufficient lives', 'ENTRYPOINT_FAILED'))]
fn test_enlist_duelist_insufficient_lives() {
    let mut sys: TestSystems = setup(4, FLAGS::TOURNAMENT);
    let entry_id: u64 = _mint(ref sys, OWNER());
    assert!(!sys.tournaments.can_enlist_duelist(entry_id, ID(OTHER())));
    sys.tournaments.enlist_duelist(entry_id, ID(OWNER()));
}

#[test]
#[should_panic(expected: ('TOURNAMENT: Already enlisted', 'ENTRYPOINT_FAILED'))]
fn test_enlist_duelist_already_enlisted() {
    let mut sys: TestSystems = setup(3, FLAGS::TOURNAMENT);
    let entry_id: u64 = _mint(ref sys, OWNER());
    assert!(sys.tournaments.can_enlist_duelist(entry_id, ID(OWNER())));
    sys.tournaments.enlist_duelist(entry_id, ID(OWNER()));
    assert!(!sys.tournaments.can_enlist_duelist(entry_id, ID(OWNER())));
    sys.tournaments.enlist_duelist(entry_id, ID(OWNER()));
}


//--------------------------------
// join duel
//

#[test]
fn test_join_duel_ok() {
    let mut sys: TestSystems = setup(3, FLAGS::GAME | FLAGS::DUEL | FLAGS::TOURNAMENT);
    let A: ContractAddress = PLAYER_1().address;
    let B: ContractAddress = PLAYER_2().address;
    let ID_A: u128 = PLAYER_1().duelist_id;
    let ID_B: u128 = PLAYER_2().duelist_id;
    // mint+enlist 1
    tester::impersonate(A);
    let entry_id_1: u64 = _mint(ref sys, A);
    tester::execute_enlist_duelist(@sys, A, entry_id_1, ID_A);
    let entry_1: TournamentEntry = sys.store.get_tournament_entry(entry_id_1);
    assert_eq!(entry_1.duelist_id, ID_A, "__entry_1.duelist_id");
    assert_eq!(entry_1.current_round_number, 0, "__entry_1.current_round_number");
    // mint+enlist 2
    tester::impersonate(B);
    let entry_id_2: u64 = _mint(ref sys, B);
    tester::execute_enlist_duelist(@sys, B, entry_id_2, ID_B);
    let entry_2: TournamentEntry = sys.store.get_tournament_entry(entry_id_2);
    assert_eq!(entry_2.duelist_id, ID_B, "__entry_2.duelist_id");
    assert_eq!(entry_2.current_round_number, 0, "__entry_2.current_round_number");
    //
    // start tournament
    //
    tester::set_block_timestamp(TIMESTAMP_START);
    let tournament_id: u64 = tester::execute_start_tournament(@sys, A, ENTRY_ID_1);
    //
    // join 1...
    tester::impersonate(A);
    assert!(sys.tournaments.can_join_duel(entry_id_1));
    let duel_id_1: u128 = tester::execute_join_duel(@sys, A, entry_id_1);
    assert!(!sys.tournaments.can_join_duel(entry_id_1), "already_joined_a");
    let ch_1: Challenge = sys.store.get_challenge(duel_id_1);
    let keys_1: TournamentDuelKeys = sys.store.get_challenge_to_tournament_value(duel_id_1).keys;
    assert_gt!(duel_id_1, 0, "duel_id_1");
    assert_eq!(ch_1.duel_type, DuelType::Tournament, "ch_1.duel_type");
    assert_eq!(ch_1.state, ChallengeState::Awaiting, "ch_1.state");
    assert_eq!(ch_1.address_a, A, "ch_1.address_a");
    assert_eq!(ch_1.address_b, ZERO(), "ch_1.address_b");
    assert_eq!(ch_1.duelist_id_a, ID_A, "ch_1.duelist_id_a");
    assert_eq!(ch_1.duelist_id_b, 0, "ch_1.duelist_id_b");
    assert_eq!(keys_1.tournament_id, tournament_id, "keys_1.tournament_id");
    assert_eq!(keys_1.round_number, 1, "keys_1.round_number");
    assert_eq!(keys_1.entry_number_a, 1, "keys_1.entry_number_a");
    assert_eq!(keys_1.entry_number_b, 2, "keys_1.entry_number_b");
    let entry_1: TournamentEntry = sys.store.get_tournament_entry(entry_id_1);
    assert_eq!(entry_1.tournament_id, tournament_id, "entry_1.tournament_id");
    assert_eq!(entry_1.entry_number, 1, "entry_1.entry_number");
    assert_eq!(entry_1.current_round_number, 1, "entry_1.current_round_number");
    //
    // join 2...
    tester::impersonate(B);
    assert!(sys.tournaments.can_join_duel(entry_id_2));
    let duel_id_2: u128 = tester::execute_join_duel(@sys, B, entry_id_2);
    assert!(!sys.tournaments.can_join_duel(entry_id_2), "already_joined_b");
    let ch_2: Challenge = sys.store.get_challenge(duel_id_2);
    assert_eq!(duel_id_2, duel_id_1, "duel_id_2 == duel_id_1");
    assert_eq!(ch_2.state, ChallengeState::InProgress, "ch_2.state");
    assert_eq!(ch_2.address_b, B, "ch_2.address_b");
    assert_eq!(ch_2.duelist_id_b, ID_B, "ch_2.duelist_id_b");
    let entry_2: TournamentEntry = sys.store.get_tournament_entry(entry_id_2);
    assert_eq!(entry_2.tournament_id, tournament_id, "entry_2.tournament_id");
    assert_eq!(entry_2.entry_number, 2, "entry_2.entry_number");
    assert_eq!(entry_2.current_round_number, 1, "entry_2.current_round_number");
}

#[test]
#[should_panic(expected: ('DUEL: Reply self', 'ENTRYPOINT_FAILED', 'ENTRYPOINT_FAILED'))]
fn test_join_duel_already_joined_a() {
    let mut sys: TestSystems = setup(3, FLAGS::GAME | FLAGS::DUEL | FLAGS::TOURNAMENT);
    let A: ContractAddress = PLAYER_1().address;
    let B: ContractAddress = PLAYER_2().address;
    let ID_A: u128 = PLAYER_1().duelist_id;
    let ID_B: u128 = PLAYER_2().duelist_id;
    // mint+enlist 1
    tester::impersonate(A);
    let entry_id_1: u64 = _mint(ref sys, A);
    tester::execute_enlist_duelist(@sys, A, entry_id_1, ID_A);
    // mint+enlist 2
    tester::impersonate(B);
    let entry_id_2: u64 = _mint(ref sys, B);
    tester::execute_enlist_duelist(@sys, B, entry_id_2, ID_B);
    // start tournament
    tester::set_block_timestamp(TIMESTAMP_START);
    tester::execute_start_tournament(@sys, A, ENTRY_ID_1);
    //
    // join A twice...
    tester::impersonate(A);
    tester::execute_join_duel(@sys, A, entry_id_1);
    assert!(!sys.tournaments.can_join_duel(entry_id_1));
    tester::execute_join_duel(@sys, A, entry_id_1);
}

#[test]
#[should_panic(expected: ('DUEL: Challenge not Awaiting', 'ENTRYPOINT_FAILED', 'ENTRYPOINT_FAILED'))]
fn test_join_duel_already_joined_b() {
    let mut sys: TestSystems = setup(3, FLAGS::GAME | FLAGS::DUEL | FLAGS::TOURNAMENT);
    let A: ContractAddress = PLAYER_1().address;
    let B: ContractAddress = PLAYER_2().address;
    let ID_A: u128 = PLAYER_1().duelist_id;
    let ID_B: u128 = PLAYER_2().duelist_id;
    // mint+enlist 1
    tester::impersonate(A);
    let entry_id_1: u64 = _mint(ref sys, A);
    tester::execute_enlist_duelist(@sys, A, entry_id_1, ID_A);
    // mint+enlist 2
    tester::impersonate(B);
    let entry_id_2: u64 = _mint(ref sys, B);
    tester::execute_enlist_duelist(@sys, B, entry_id_2, ID_B);
    // start tournament
    tester::set_block_timestamp(TIMESTAMP_START);
    tester::execute_start_tournament(@sys, A, ENTRY_ID_1);
    //
    // join A
    tester::impersonate(A);
    tester::execute_join_duel(@sys, A, entry_id_1);
    // join B twice...
    tester::impersonate(B);
    tester::execute_join_duel(@sys, B, entry_id_2);
    assert!(!sys.tournaments.can_join_duel(entry_id_2));
    tester::execute_join_duel(@sys, B, entry_id_2);
}

#[test]
#[should_panic(expected: ('TOURNAMENT: Not your entry', 'ENTRYPOINT_FAILED'))]
fn test_join_duel_invalid_entry() {
    let mut sys: TestSystems = setup(3, FLAGS::TOURNAMENT);
    let entry_id: u64 = _mint(ref sys, OWNER());
    // enlist...
    tester::execute_enlist_duelist(@sys, OWNER(), entry_id, ID(OWNER()));
    // panic...
    tester::impersonate(OWNER());
    assert!(!sys.tournaments.can_join_duel(entry_id + 1));
    tester::execute_join_duel(@sys, OWNER(), entry_id + 1);
}

#[test]
#[should_panic(expected: ('TOURNAMENT: Not your entry', 'ENTRYPOINT_FAILED'))]
fn test_join_duel_not_your_entry() {
    let mut sys: TestSystems = setup(3, FLAGS::TOURNAMENT);
    let _entry_id_1: u64 = _mint(ref sys, OWNER());
    let entry_id_2: u64 = _mint(ref sys, OTHER());
    // panic...
    tester::impersonate(OWNER());
    assert!(!sys.tournaments.can_join_duel(entry_id_2));
    tester::execute_join_duel(@sys, OWNER(), entry_id_2);
}

#[test]
#[should_panic(expected: ('TOURNAMENT: Not playable', 'ENTRYPOINT_FAILED'))]
fn test_join_duel_not_playable() {
    let mut sys: TestSystems = setup(3, FLAGS::TOURNAMENT);
    let entry_id: u64 = _mint(ref sys, OWNER());
    // enlist...
    tester::execute_enlist_duelist(@sys, OWNER(), entry_id, ID(OWNER()));
    // panic...
    assert!(!sys.tournaments.can_join_duel(entry_id));
    tester::execute_join_duel(@sys, OWNER(), entry_id);
}

#[test]
#[should_panic(expected: ('TOURNAMENT: Not started', 'ENTRYPOINT_FAILED'))]
fn test_join_duel_not_started() {
    let mut sys: TestSystems = setup(3, FLAGS::TOURNAMENT);
    let entry_id: u64 = _mint(ref sys, OWNER());
    // enlist...
    tester::execute_enlist_duelist(@sys, OWNER(), entry_id, ID(OWNER()));
    // trime traver only...
    tester::set_block_timestamp(TIMESTAMP_START);
    // panic...
    assert!(!sys.tournaments.can_join_duel(entry_id));
    tester::execute_join_duel(@sys, OWNER(), entry_id);
}

#[test]
#[should_panic(expected: ('TOURNAMENT: Not enlisted', 'ENTRYPOINT_FAILED'))]
fn test_join_duel_not_enlisted() {
    let mut sys: TestSystems = setup(3, FLAGS::TOURNAMENT);
    let entry_id: u64 = _mint(ref sys, OWNER());
    // start...
    tester::set_block_timestamp(TIMESTAMP_START);
    tester::execute_start_tournament(@sys, OWNER(), ENTRY_ID_1);
    // panic...
    assert!(!sys.tournaments.can_join_duel(entry_id));
    tester::execute_join_duel(@sys, OWNER(), entry_id);
}

#[test]
#[should_panic(expected: ('DUEL: Invalid caller', 'ENTRYPOINT_FAILED'))]
fn test_join_duel_token_invalid_caller() {
    let mut sys: TestSystems = setup(3, FLAGS::DUEL | FLAGS::TOURNAMENT);
    tester::impersonate(OWNER());
    let settings: TournamentSettingsValue = sys.store.get_tournament_settings_value(SETTINGS_ID);
    let timestamp_end: u64 = TIMESTAMP::ONE_DAY;
    _protected_duel(@sys).join_tournament_duel(
        OWNER(), ID(OWNER()),
        1, 1, 1, 2,
        settings,
        timestamp_end,
    );
}

