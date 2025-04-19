use starknet::{ContractAddress};
// use dojo::world::{WorldStorage};
use dojo::model::{ModelStorageTest};

use pistols::systems::tokens::{
    // tournament_token::{ITournamentTokenProtectedDispatcher, ITournamentTokenProtectedDispatcherTrait},
    duel_token::{IDuelTokenProtectedDispatcher, IDuelTokenProtectedDispatcherTrait},
    budokan_mock::{
        PLAYERS, 
        budokan_mock::{TOURNAMENT_OF_1, TOURNAMENT_OF_2, TOURNAMENT_OF_5},
    },
};
use pistols::models::{
    challenge::{Challenge, DuelType},
    tournament::{
        TournamentEntry,
        Tournament, TournamentType,
        TournamentState,
        TournamentRound, TournamentRoundValue,
        TournamentBracketTrait,
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
        IBudokanMockDispatcherTrait,
    },
};

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

pub fn setup(lives_staked: u8, flags: u16) -> TestSystems {
    let mut sys: TestSystems = tester::setup_world(flags);

    tester::impersonate(sys.tournaments.contract_address);
    let min_lives: u8 = core::cmp::max(lives_staked, 3);
    let max_lives: u8 = min_lives + 1;
    let settings = TournamentSettings {
        settings_id: SETTINGS_ID,
        tournament_type: TournamentType::LastManStanding,
        max_rounds: 1,
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

pub fn _mint(ref sys: TestSystems, recipient: ContractAddress) -> u64 {
    let total_supply: u64 = sys.tournaments.total_supply().try_into().unwrap();
    let player_name: felt252 = ShortStringTrait::concat('Player', total_supply.to_short_string());
    // mint from budokan
    // let caller: ContractAddress = tester::get_impersonator();
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
    tester::impersonate(recipient);
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
fn test_mock_budokan() {
    let mut sys: TestSystems = setup(3, FLAGS::TOURNAMENT);
    _mint(ref sys, OWNER()); // ENTRY_ID_1
    // time travel
    tester::set_block_timestamp(TIMESTAMP_START);
    sys.budokan.set_tournament_id(TOURNAMENT_OF_5);
    let tournament_id: u64 = tester::execute_start_tournament(@sys, OWNER(), ENTRY_ID_1);
    assert_eq!(tournament_id, TOURNAMENT_OF_5, "TOURNAMENT_OF_5");
    assert_eq!(sys.budokan.tournament_entries(tournament_id), 5, "tournament_entries()");
}

#[test] 
fn test_start_tournament() {
    let mut sys: TestSystems = setup(3, FLAGS::TOURNAMENT);
    let entry_id_1: u64 = _mint(ref sys, OWNER()); // ENTRY_ID_1
    assert_eq!(entry_id_1, ENTRY_ID_1, "entry_id_1");
    assert_eq!(entry_id_1, PLAYERS::P1().entry_id, "PLAYERS::P1().entry_id");
    assert!(!sys.tournaments.can_start_tournament(entry_id_1), "can_start() false");
    // time travel
    tester::set_block_timestamp(TIMESTAMP_START);
    assert!(sys.tournaments.can_start_tournament(entry_id_1), "can_start() true");
    let tournament_id: u64 = tester::execute_start_tournament(@sys, OWNER(), entry_id_1);
    assert!(tournament_id > 0, "tournament_id");
    assert_eq!(tournament_id, TOURNAMENT_OF_2, "TOURNAMENT_OF_2"); // default tournament (2 entries)
    assert_eq!(sys.budokan.tournament_entries(tournament_id), 2, "tournament_entries()");
    let tournament: Tournament = sys.store.get_tournament(tournament_id);
    assert_eq!(tournament.state, TournamentState::InProgress);
    assert_eq!(tournament.round_number, 1);
    let round: TournamentRound = sys.store.get_tournament_round(tournament_id, 1);
    assert_ne!(round.bracket, 0);
    assert_ne!(round.results, 0);
    // end state
    assert!(!sys.tournaments.can_start_tournament(entry_id_1), "can_start() started");
    assert_eq!(sys.tournaments.get_tournament_id(entry_id_1), tournament_id, "get_tournament_id()");
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
    let entry_id_2: u64 = _mint(ref sys, OTHER());
    assert!(sys.tournaments.can_enlist_duelist(entry_id_2, ID(OTHER())));
    sys.tournaments.enlist_duelist(entry_id_2, ID(OTHER()));
}

#[test]
#[should_panic(expected: ('TOURNAMENT: Not your entry', 'ENTRYPOINT_FAILED'))]
fn test_enlist_duelist_not_your_entry() {
    let mut sys: TestSystems = setup(3, FLAGS::TOURNAMENT);
    let entry_id_1: u64 = _mint(ref sys, OWNER());
    assert!(!sys.tournaments.can_enlist_duelist(entry_id_1 + 1, ID(OWNER())));
    sys.tournaments.enlist_duelist(entry_id_1 + 1, ID(OWNER()));
}

#[test]
#[should_panic(expected: ('TOURNAMENT: Invalid duelist', 'ENTRYPOINT_FAILED'))]
fn test_enlist_duelist_invalid_duelist() {
    let mut sys: TestSystems = setup(3, FLAGS::TOURNAMENT);
    let entry_id_1: u64 = _mint(ref sys, OWNER());
    assert!(!sys.tournaments.can_enlist_duelist(entry_id_1, ID(OTHER())));
    sys.tournaments.enlist_duelist(entry_id_1, 0);
}

#[test]
#[should_panic(expected: ('TOURNAMENT: Not your duelist', 'ENTRYPOINT_FAILED'))]
fn test_enlist_duelist_not_your_duelist() {
    let mut sys: TestSystems = setup(3, FLAGS::TOURNAMENT);
    let entry_id_1: u64 = _mint(ref sys, OWNER());
    assert!(!sys.tournaments.can_enlist_duelist(entry_id_1, ID(OTHER())));
    sys.tournaments.enlist_duelist(entry_id_1, ID(OTHER()));
}

#[test]
#[should_panic(expected: ('TOURNAMENT: Insufficient lives', 'ENTRYPOINT_FAILED'))]
fn test_enlist_duelist_insufficient_lives() {
    let mut sys: TestSystems = setup(4, FLAGS::TOURNAMENT);
    let entry_id_1: u64 = _mint(ref sys, OWNER());
    assert!(!sys.tournaments.can_enlist_duelist(entry_id_1, ID(OTHER())));
    sys.tournaments.enlist_duelist(entry_id_1, ID(OWNER()));
}

#[test]
#[should_panic(expected: ('TOURNAMENT: Already enlisted', 'ENTRYPOINT_FAILED'))]
fn test_enlist_duelist_already_enlisted() {
    let mut sys: TestSystems = setup(3, FLAGS::TOURNAMENT);
    let entry_id_1: u64 = _mint(ref sys, OWNER());
    assert!(sys.tournaments.can_enlist_duelist(entry_id_1, ID(OWNER())));
    sys.tournaments.enlist_duelist(entry_id_1, ID(OWNER()));
    assert!(!sys.tournaments.can_enlist_duelist(entry_id_1, ID(OWNER())));
    sys.tournaments.enlist_duelist(entry_id_1, ID(OWNER()));
}


//--------------------------------
// join duel
//

#[test]
fn test_join_duel_ok() {
    let mut sys: TestSystems = setup(3, FLAGS::GAME | FLAGS::DUEL | FLAGS::TOURNAMENT);
    let P1: ContractAddress = PLAYERS::P1().address;
    let P2: ContractAddress = PLAYERS::P2().address;
    let ID_P1: u128 = PLAYERS::P1().duelist_id;
    let ID_P2: u128 = PLAYERS::P2().duelist_id;
    // >> 2 entries tournament (before enlist) -- default
    sys.budokan.set_tournament_id(TOURNAMENT_OF_2);
    //
    // mint+enlist 1
    let entry_id_1: u64 = _mint(ref sys, P1);
    assert_eq!(entry_id_1, ENTRY_ID_1, "entry_id_1");
    assert_eq!(entry_id_1, PLAYERS::P1().entry_id, "PLAYERS::P1().entry_id");
    tester::execute_enlist_duelist(@sys, P1, entry_id_1, ID_P1);
    let entry_1: TournamentEntry = sys.store.get_tournament_entry(entry_id_1);
    assert_eq!(entry_1.duelist_id, ID_P1, "__entry_1.duelist_id");
    assert_eq!(entry_1.current_round_number, 0, "__entry_1.current_round_number");
    //
    // mint+enlist 2
    let entry_id_2: u64 = _mint(ref sys, P2);
    assert_eq!(entry_id_2, ENTRY_ID_2, "entry_id_2");
    assert_eq!(entry_id_2, PLAYERS::P2().entry_id, "PLAYERS::P2().entry_id");
    tester::execute_enlist_duelist(@sys, P2, entry_id_2, ID_P2);
    let entry_2: TournamentEntry = sys.store.get_tournament_entry(entry_id_2);
    assert_eq!(entry_2.duelist_id, ID_P2, "__entry_2.duelist_id");
    assert_eq!(entry_2.current_round_number, 0, "__entry_2.current_round_number");
    //
    // start tournament
    //
    tester::set_block_timestamp(TIMESTAMP_START);
    let tournament_id: u64 = tester::execute_start_tournament(@sys, P1, entry_id_1);
    //
    // join P1...
    tester::impersonate(P1); // needed for assertion
    assert!(sys.tournaments.can_join_duel(entry_id_1));
    let duel_id_p1: u128 = tester::execute_join_duel(@sys, P1, entry_id_1);
    assert_gt!(duel_id_p1, 0, "duel_id_p1");
    assert!(!sys.tournaments.can_join_duel(entry_id_1), "already_joined_a");
    let entry_1: TournamentEntry = sys.store.get_tournament_entry(entry_id_1);
    assert_eq!(entry_1.tournament_id, tournament_id, "entry_1.tournament_id");
    assert_eq!(entry_1.entry_number, 1, "entry_1.entry_number");
    assert_eq!(entry_1.current_round_number, 1, "entry_1.current_round_number");
    let ch_1: Challenge = sys.store.get_challenge(duel_id_p1);
    assert_eq!(ch_1.duel_type, DuelType::Tournament, "ch_1.duel_type");
    assert_eq!(ch_1.state, ChallengeState::Awaiting, "ch_1.state");
    assert_eq!(ch_1.address_a, P1, "ch_1.address_a");
    assert_eq!(ch_1.address_b, ZERO(), "ch_1.address_b");
    assert_eq!(ch_1.duelist_id_a, ID_P1, "ch_1.duelist_id_a");
    assert_eq!(ch_1.duelist_id_b, 0, "ch_1.duelist_id_b");
    //
    // join P2... ()
    tester::impersonate(P2); // needed for assertion
    assert!(sys.tournaments.can_join_duel(entry_id_2));
    let duel_id_p2: u128 = tester::execute_join_duel(@sys, P2, entry_id_2);
    assert_gt!(duel_id_p2, 0, "duel_id_p2");
    assert!(!sys.tournaments.can_join_duel(entry_id_2), "already_joined_b");
    let entry_2: TournamentEntry = sys.store.get_tournament_entry(entry_id_2);
    assert_eq!(entry_2.tournament_id, tournament_id, "entry_2.tournament_id");
    assert_eq!(entry_2.entry_number, 2, "entry_2.entry_number");
    assert_eq!(entry_2.current_round_number, 1, "entry_2.current_round_number");
    let ch_2: Challenge = sys.store.get_challenge(duel_id_p2);
    assert_eq!(ch_2.state, ChallengeState::InProgress, "ch_2.state");
    assert_eq!(ch_2.address_a, P1, "ch_2.address_a");
    assert_eq!(ch_2.address_b, P2, "ch_2.address_b");
    assert_eq!(ch_2.duelist_id_a, ID_P1, "ch_2.duelist_id_a");
    assert_eq!(ch_2.duelist_id_b, ID_P2, "ch_2.duelist_id_b");
    //
    // check pairings
    assert_eq!(duel_id_p1, 1, "duel_id_p1");
    assert_eq!(duel_id_p2, 1, "duel_id_p2");
    // get duel keys
    let keys_1: TournamentDuelKeys = sys.store.get_challenge_to_tournament_value(duel_id_p1).keys;
    assert_eq!(keys_1.tournament_id, tournament_id, "keys_1.tournament_id");
    assert_eq!(keys_1.round_number, 1, "keys_1.round_number");
    assert_eq!(keys_1.entry_number_a, 1, "keys_1.entry_number_a");
    assert_eq!(keys_1.entry_number_b, 2, "keys_1.entry_number_b");
    // compare to member getters (make sure they work)
    let member_keys_1: TournamentDuelKeys = sys.store.get_duel_tournament_keys(duel_id_p1);
    assert_eq!(member_keys_1.tournament_id, keys_1.tournament_id, "member_keys_1.tournament_id");
    assert_eq!(member_keys_1.round_number, keys_1.round_number, "member_keys_1.round_number");
    assert_eq!(member_keys_1.entry_number_a, keys_1.entry_number_a, "member_keys_1.entry_number_a");
    assert_eq!(member_keys_1.entry_number_b, keys_1.entry_number_b, "member_keys_1.entry_number_b");
    let member_duel_id_p1: u128 = sys.store.get_tournament_duel_id(@keys_1);
    assert_eq!(member_duel_id_p1, duel_id_p1, "member_duel_id_p1");
    // round
    let round: TournamentRoundValue = sys.store.get_tournament_round_value(tournament_id, 1);
    assert_eq!(round.bracket.get_opponent_entry_number(1), 2, "round.bracket.get_opponent_entry_number(1)");
    assert_eq!(round.bracket.get_opponent_entry_number(2), 1, "round.bracket.get_opponent_entry_number(2)");
}

#[test]
fn test_join_duel_ok_single() {
    let mut sys: TestSystems = setup(3, FLAGS::GAME | FLAGS::DUEL | FLAGS::TOURNAMENT);
    let P1: ContractAddress = PLAYERS::P1().address;
    let ID_P1: u128 = PLAYERS::P1().duelist_id;
    // >> 1 entry tournament
    sys.budokan.set_tournament_id(TOURNAMENT_OF_1);
    //
    // mint+enlist 1
    let entry_id_1: u64 = _mint(ref sys, P1);
    tester::execute_enlist_duelist(@sys, P1, entry_id_1, ID_P1);
    let entry_1: TournamentEntry = sys.store.get_tournament_entry(entry_id_1);
    assert_eq!(entry_1.duelist_id, ID_P1, "__entry_1.duelist_id");
    assert_eq!(entry_1.current_round_number, 0, "__entry_1.current_round_number");
    //
    // start tournament
    //
    tester::set_block_timestamp(TIMESTAMP_START);
    let tournament_id: u64 = tester::execute_start_tournament(@sys, P1, entry_id_1);
    //
    // join P1...
    tester::impersonate(P1); // needed for assertion
    assert!(sys.tournaments.can_join_duel(entry_id_1));
    let duel_id_p1: u128 = tester::execute_join_duel(@sys, P1, entry_id_1);
    assert_gt!(duel_id_p1, 0, "duel_id_p1");
    assert!(!sys.tournaments.can_join_duel(entry_id_1), "already_joined_b");
    let entry_1: TournamentEntry = sys.store.get_tournament_entry(entry_id_1);
    assert_eq!(entry_1.tournament_id, tournament_id, "entry_1.tournament_id");
    assert_eq!(entry_1.entry_number, 1, "entry_1.entry_number");
    assert_eq!(entry_1.current_round_number, 1, "entry_1.current_round_number");
    // unpaired duel, won...
    let ch_1: Challenge = sys.store.get_challenge(duel_id_p1);
    assert_eq!(ch_1.state, ChallengeState::Resolved, "ch_1.state");
    assert_eq!(ch_1.winner, 1, "ch_1.winner");
    assert_eq!(ch_1.address_a, P1, "ch_1.address_a");
    assert_eq!(ch_1.duelist_id_a, ID_P1, "ch_1.duelist_id_a");
    assert_eq!(ch_1.address_b, ZERO(), "ch_1.address_b");
    assert_eq!(ch_1.duelist_id_b, 0, "ch_1.duelist_id_b");
    //
    // check pairings
    assert_eq!(duel_id_p1, 1, "duel_id_p1");
    // get duel keys
    let keys_1: TournamentDuelKeys = sys.store.get_challenge_to_tournament_value(duel_id_p1).keys;
    assert_eq!(keys_1.tournament_id, tournament_id, "keys_1.tournament_id");
    assert_eq!(keys_1.round_number, 1, "keys_1.round_number");
    assert_eq!(keys_1.entry_number_a, 1, "keys_1.entry_number_a");
    assert_eq!(keys_1.entry_number_b, 0, "keys_1.entry_number_b");
    // compare to member getters (make sure they work)
    let member_keys_1: TournamentDuelKeys = sys.store.get_duel_tournament_keys(duel_id_p1);
    assert_eq!(member_keys_1.tournament_id, keys_1.tournament_id, "member_keys_1.tournament_id");
    assert_eq!(member_keys_1.round_number, keys_1.round_number, "member_keys_1.round_number");
    assert_eq!(member_keys_1.entry_number_a, keys_1.entry_number_a, "member_keys_1.entry_number_a");
    assert_eq!(member_keys_1.entry_number_b, keys_1.entry_number_b, "member_keys_1.entry_number_b");
    let member_duel_id_p1: u128 = sys.store.get_tournament_duel_id(@keys_1);
    assert_eq!(member_duel_id_p1, duel_id_p1, "member_duel_id_p1");
    // round
    let round: TournamentRoundValue = sys.store.get_tournament_round_value(tournament_id, 1);
    assert_eq!(round.bracket.get_opponent_entry_number(1), 0, "round.bracket.get_opponent_entry_number(1)");
}

#[test]
#[should_panic(expected: ('DUEL: Reply self', 'ENTRYPOINT_FAILED', 'ENTRYPOINT_FAILED'))]
fn test_join_duel_already_joined_a() {
    let mut sys: TestSystems = setup(3, FLAGS::GAME | FLAGS::DUEL | FLAGS::TOURNAMENT);
    let P1: ContractAddress = PLAYERS::P1().address;
    let P2: ContractAddress = PLAYERS::P2().address;
    let ID_P1: u128 = PLAYERS::P1().duelist_id;
    let ID_P2: u128 = PLAYERS::P2().duelist_id;
    // mint+enlist 1
    let entry_id_1: u64 = _mint(ref sys, P1);
    tester::execute_enlist_duelist(@sys, P1, entry_id_1, ID_P1);
    // mint+enlist 2
    let entry_id_2: u64 = _mint(ref sys, P2);
    tester::execute_enlist_duelist(@sys, P2, entry_id_2, ID_P2);
    // start tournament
    tester::set_block_timestamp(TIMESTAMP_START);
    tester::execute_start_tournament(@sys, P1, entry_id_1);
    //
    // join A twice...
    tester::execute_join_duel(@sys, P1, entry_id_1);
    assert!(!sys.tournaments.can_join_duel(entry_id_1));
    tester::execute_join_duel(@sys, P1, entry_id_1);
}

#[test]
#[should_panic(expected: ('DUEL: Challenge not Awaiting', 'ENTRYPOINT_FAILED', 'ENTRYPOINT_FAILED'))]
fn test_join_duel_already_joined_b() {
    let mut sys: TestSystems = setup(3, FLAGS::GAME | FLAGS::DUEL | FLAGS::TOURNAMENT);
    let P1: ContractAddress = PLAYERS::P1().address;
    let P2: ContractAddress = PLAYERS::P2().address;
    let ID_P1: u128 = PLAYERS::P1().duelist_id;
    let ID_P2: u128 = PLAYERS::P2().duelist_id;
    // mint+enlist 1
    let entry_id_1: u64 = _mint(ref sys, P1);
    tester::execute_enlist_duelist(@sys, P1, entry_id_1, ID_P1);
    // mint+enlist 2
    let entry_id_2: u64 = _mint(ref sys, P2);
    tester::execute_enlist_duelist(@sys, P2, entry_id_2, ID_P2);
    // start tournament
    tester::set_block_timestamp(TIMESTAMP_START);
    tester::execute_start_tournament(@sys, P1, entry_id_1);
    //
    // join A
    tester::execute_join_duel(@sys, P1, entry_id_1);
    // join B twice...
    tester::execute_join_duel(@sys, P2, entry_id_2);
    assert!(!sys.tournaments.can_join_duel(entry_id_2));
    tester::execute_join_duel(@sys, P2, entry_id_2);
}

#[test]
#[should_panic(expected: ('TOURNAMENT: Not your entry', 'ENTRYPOINT_FAILED'))]
fn test_join_duel_invalid_entry() {
    let mut sys: TestSystems = setup(3, FLAGS::TOURNAMENT);
    let entry_id_1: u64 = _mint(ref sys, OWNER());
    // enlist...
    tester::execute_enlist_duelist(@sys, OWNER(), entry_id_1, ID(OWNER()));
    // panic...
    assert!(!sys.tournaments.can_join_duel(entry_id_1 + 1));
    tester::execute_join_duel(@sys, OWNER(), entry_id_1 + 1);
}

#[test]
#[should_panic(expected: ('TOURNAMENT: Not your entry', 'ENTRYPOINT_FAILED'))]
fn test_join_duel_not_your_entry() {
    let mut sys: TestSystems = setup(3, FLAGS::TOURNAMENT);
    let _entry_id_1: u64 = _mint(ref sys, OWNER());
    let entry_id_2: u64 = _mint(ref sys, OTHER());
    // panic...
    assert!(!sys.tournaments.can_join_duel(entry_id_2));
    tester::execute_join_duel(@sys, OWNER(), entry_id_2);
}

#[test]
#[should_panic(expected: ('TOURNAMENT: Not playable', 'ENTRYPOINT_FAILED'))]
fn test_join_duel_not_playable() {
    let mut sys: TestSystems = setup(3, FLAGS::TOURNAMENT);
    let entry_id_1: u64 = _mint(ref sys, OWNER());
    // enlist...
    tester::execute_enlist_duelist(@sys, OWNER(), entry_id_1, ID(OWNER()));
    // panic...
    assert!(!sys.tournaments.can_join_duel(entry_id_1));
    tester::execute_join_duel(@sys, OWNER(), entry_id_1);
}

#[test]
#[should_panic(expected: ('TOURNAMENT: Not started', 'ENTRYPOINT_FAILED'))]
fn test_join_duel_not_started() {
    let mut sys: TestSystems = setup(3, FLAGS::TOURNAMENT);
    let entry_id_1: u64 = _mint(ref sys, OWNER());
    // enlist...
    tester::execute_enlist_duelist(@sys, OWNER(), entry_id_1, ID(OWNER()));
    // trime traver only...
    tester::set_block_timestamp(TIMESTAMP_START);
    // panic...
    assert!(!sys.tournaments.can_join_duel(entry_id_1));
    tester::execute_join_duel(@sys, OWNER(), entry_id_1);
}

#[test]
#[should_panic(expected: ('TOURNAMENT: Not enlisted', 'ENTRYPOINT_FAILED'))]
fn test_join_duel_not_enlisted() {
    let mut sys: TestSystems = setup(3, FLAGS::TOURNAMENT);
    let entry_id_1: u64 = _mint(ref sys, OWNER());
    // start...
    tester::set_block_timestamp(TIMESTAMP_START);
    tester::execute_start_tournament(@sys, OWNER(), entry_id_1);
    // panic...
    assert!(!sys.tournaments.can_join_duel(entry_id_1));
    tester::execute_join_duel(@sys, OWNER(), entry_id_1);
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


//--------------------------------
// Tournament Round
//


// TODO: duel > commit / reveal > set result flags > finish > clear flags
// TODO: duel > commit (A/B) > abandon > expire > collect winner
// TODO: duel > commit/reveal (A/B) > abandon > expire > collect winner

// TODO: collect tournament round > all duels completed
// TODO: collect tournament round > missing duels

// TODO: single round tournament > finish tournament after 1st duel > !can_start_round()

// TODO: multi round tournament > [A] vs B + C vs [D] > A vs D
// TODO: multi round tournament > !can_finish() > duel more > finish tournament
// TODO: multi round tournament > single winner > finish tournament

// TODO: multi round tournament > missing wins from 1st round > collect and continue
// TODO: multi round tournament > missing draws from 1st round > cannot collect, cannot continue

