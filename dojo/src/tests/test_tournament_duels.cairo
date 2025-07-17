// use starknet::{ContractAddress};
// use dojo::world::{WorldStorage};
// use dojo::model::{ModelStorageTest};

use pistols::systems::{
    rng_mock::{
        MockedValue, MockedValueTrait,
    },
};
use pistols::systems::tokens::{
    // tournament_token::{ITournamentTokenProtectedDispatcher, ITournamentTokenProtectedDispatcherTrait},
    // duel_token::{IDuelTokenProtectedDispatcher, IDuelTokenProtectedDispatcherTrait},
    budokan_mock::{
        // PLAYERS as P,
        PLAYERS::P1 as P1,
        PLAYERS::P2 as P2,
        PLAYERS::P3 as P3,
        PLAYERS::P4 as P4,
        PLAYERS::P5 as P5,
        PLAYERS::P6 as P6,
        budokan_mock::{
            TOURNAMENT_OF_2,
            TOURNAMENT_OF_3,
            TOURNAMENT_OF_5,
            TOURNAMENT_OF_6,
        },
    },
};
use pistols::models::{
    challenge::{Challenge, DuelType},
    tournament::{
        // TournamentPass,
        Tournament, TournamentState,
        TournamentType, TournamentTypeTrait,
        TournamentRound, TournamentRoundTrait,
        TournamentBracketTrait,
        TournamentResultsTrait,
        // TournamentSettings, TournamentSettingsValue,
        // TournamentDuelKeys,
        // ChallengeToTournamentValue, TournamentToChallengeValue,
    },
};
use pistols::types::{
    challenge_state::{ChallengeState},
    // timestamp::{TIMESTAMP},
    // constants::{CONST},
};
use pistols::utils::arrays::{SpanUtilsTrait};
// use pistols::interfaces::dns::{DnsTrait};
// use pistols::utils::short_string::{ShortStringTrait};
// use pistols::utils::math::{MathTrait};

use pistols::tests::tester::{
    tester,
    tester::{
        StoreTrait,
        TestSystems, FLAGS,
        ZERO, OWNER, OTHER,
        // OWNED_BY_OWNER, OWNED_BY_OTHER,
        ITournamentTokenDispatcherTrait,
        IBudokanMockDispatcherTrait,
        IRngMockDispatcherTrait,
        IGameDispatcherTrait,
    },
};
use pistols::tests::prefabs::{prefabs};
use pistols::tests::test_tournament::{
    _mint,
    // _protected_duel,
    TIMESTAMP_START,
    TIMESTAMP_END,
};



//--------------------------------
// setup
//

fn setup(flags: u16) -> TestSystems {
    let mut sys: TestSystems = tester::setup_world(flags);

    // drop all events
    tester::drop_all_events(sys.world.dispatcher.contract_address);
    tester::drop_all_events(sys.tournaments.contract_address);

    tester::impersonate(OWNER());

    (sys)
}

fn _setup_budokan(sys: @TestSystems, tournament_id: u64, tournament_type: TournamentType, shuffled: Span<felt252>) {
    (*sys.budokan).set_tournament_id(tournament_id);
    (*sys.budokan).set_settings_id(tournament_type.rules().settings_id);
    let mocked: Span<MockedValue> = [
        MockedValueTrait::shuffled(TournamentRoundTrait::SHUFFLE_SALT, shuffled),
    ].span();
    (*sys.rng).mock_values(mocked);
}

fn _setup_start_tournament_of_2(ref sys: TestSystems, tournament_type: TournamentType, shuffled: Span<felt252>) -> (u64, Span<u128>) {
    _setup_budokan(@sys, TOURNAMENT_OF_2, tournament_type, shuffled);
    // mint all
    _mint(ref sys, P1().address);
    _mint(ref sys, P2().address);
    // enlist all
    tester::execute_enlist_duelist(@sys, P1().address, P1().pass_id, P1().duelist_id);
    tester::execute_enlist_duelist(@sys, P2().address, P2().pass_id, P2().duelist_id);
    // start tournament
    tester::set_block_timestamp(TIMESTAMP_START);
    let tournament_id: u64 = tester::execute_start_tournament(@sys,  P1().address, P1().pass_id);
    // join all
    let duel_ids: Span<u128> = [
        tester::execute_join_duel(@sys, P1().address, P1().pass_id),
        tester::execute_join_duel(@sys, P2().address, P2().pass_id),
    ].span();
    (tournament_id, duel_ids)
}

fn _setup_start_tournament_of_3(ref sys: TestSystems, tournament_type: TournamentType, shuffled: Span<felt252>) -> (u64, Span<u128>) {
    _setup_budokan(@sys, TOURNAMENT_OF_3, tournament_type, shuffled);
    // mint all
    _mint(ref sys, P1().address);
    _mint(ref sys, P2().address);
    _mint(ref sys, P3().address);
    // enlist all
    tester::execute_enlist_duelist(@sys, P1().address, P1().pass_id, P1().duelist_id);
    tester::execute_enlist_duelist(@sys, P2().address, P2().pass_id, P2().duelist_id);
    tester::execute_enlist_duelist(@sys, P3().address, P3().pass_id, P3().duelist_id);
    // start tournament
    tester::set_block_timestamp(TIMESTAMP_START);
    let tournament_id: u64 = tester::execute_start_tournament(@sys,  P1().address, P1().pass_id);
    // join all
    let duel_ids: Span<u128> = [
        tester::execute_join_duel(@sys, P1().address, P1().pass_id),
        tester::execute_join_duel(@sys, P2().address, P2().pass_id),
        tester::execute_join_duel(@sys, P3().address, P3().pass_id),
    ].span();
    (tournament_id, duel_ids)
}

fn _setup_start_tournament_of_6(ref sys: TestSystems, tournament_type: TournamentType, shuffled: Span<felt252>) -> (u64, Span<u128>) {
    _setup_budokan(@sys, TOURNAMENT_OF_6, tournament_type, shuffled);
    // mint all
    _mint(ref sys, P1().address);
    _mint(ref sys, P2().address);
    _mint(ref sys, P3().address);
    _mint(ref sys, P4().address);
    _mint(ref sys, P5().address);
    _mint(ref sys, P6().address);
    // enlist all
    tester::execute_enlist_duelist(@sys, P1().address, P1().pass_id, P1().duelist_id);
    tester::execute_enlist_duelist(@sys, P2().address, P2().pass_id, P2().duelist_id);
    tester::execute_enlist_duelist(@sys, P3().address, P3().pass_id, P3().duelist_id);
    tester::execute_enlist_duelist(@sys, P4().address, P4().pass_id, P4().duelist_id);
    tester::execute_enlist_duelist(@sys, P5().address, P5().pass_id, P5().duelist_id);
    tester::execute_enlist_duelist(@sys, P6().address, P6().pass_id, P6().duelist_id);
    // start tournament
    tester::set_block_timestamp(TIMESTAMP_START);
    let tournament_id: u64 = tester::execute_start_tournament(@sys,  P1().address, P1().pass_id);
    // join all
    let duel_ids: Span<u128> = [
        tester::execute_join_duel(@sys, P1().address, P1().pass_id),
        tester::execute_join_duel(@sys, P2().address, P2().pass_id),
        tester::execute_join_duel(@sys, P3().address, P3().pass_id),
        tester::execute_join_duel(@sys, P4().address, P4().pass_id),
        tester::execute_join_duel(@sys, P5().address, P5().pass_id),
        tester::execute_join_duel(@sys, P6().address, P6().pass_id),
    ].span();
    (tournament_id, duel_ids)
}

//--------------------------------
// Duels
//

#[test]
fn test_bracket_mock_shuffle() {
    let mut sys: TestSystems = setup(FLAGS::GAME | FLAGS::DUEL | FLAGS::TOURNAMENT | FLAGS::MOCK_RNG);
    //
    // >> 5 entries tournament
    _setup_budokan(@sys, TOURNAMENT_OF_5, TournamentType::LastManStanding, [1, 3, 5, 4, 2].span());
    //
    // mint+enlist 1
    _mint(ref sys, P1().address);
    tester::execute_enlist_duelist(@sys, P1().address, P1().pass_id, P1().duelist_id);
    //
    // start tournament
    tester::set_block_timestamp(TIMESTAMP_START);
    let tournament_id: u64 = tester::execute_start_tournament(@sys,  P1().address, P1().pass_id);
    //
    // round
    let round: TournamentRound = sys.store.get_tournament_round(tournament_id, 1);
    assert_eq!(round.bracket.get_opponent_entry_number(1), 3, "round.bracket.get_opponent_entry_number(1)");
    assert_eq!(round.bracket.get_opponent_entry_number(2), 0, "round.bracket.get_opponent_entry_number(2)");
    assert_eq!(round.bracket.get_opponent_entry_number(3), 1, "round.bracket.get_opponent_entry_number(3)");
    assert_eq!(round.bracket.get_opponent_entry_number(4), 5, "round.bracket.get_opponent_entry_number(4)");
    assert_eq!(round.bracket.get_opponent_entry_number(5), 4, "round.bracket.get_opponent_entry_number(5)");
}



//--------------------------------
// commit/reveal loop
//

// duel > commit / reveal > set result flags > finish > clear flags
#[test]
fn test_commit_reveal_a_b() {
    let mut sys: TestSystems = setup(FLAGS::GAME | FLAGS::DUEL | FLAGS::TOURNAMENT | FLAGS::MOCK_RNG);
    //
    // >> 3 entries tournament
    let (tournament_id, duel_ids) = _setup_start_tournament_of_3(ref sys, TournamentType::LastManStanding, [1, 2, 3].span());
    let duel_id_p1: u128 = *duel_ids[0];
    let duel_id_p2: u128 = *duel_ids[1];
    let duel_id_p3: u128 = *duel_ids[2]; // wins!
    //
    // initial state
    let round: TournamentRound = sys.store.get_tournament_round(tournament_id, 1);
    assert_ne!(round.bracket, 0);
    assert_ne!(round.results, 0);
    // round
    let round: TournamentRound = sys.store.get_tournament_round(tournament_id, 1);
    assert_eq!(round.bracket.get_opponent_entry_number(1), 2, "round.bracket.get_opponent_entry_number(1)");
    assert_eq!(round.bracket.get_opponent_entry_number(2), 1, "round.bracket.get_opponent_entry_number(2)");
    assert_eq!(round.bracket.get_opponent_entry_number(3), 0, "round.bracket.get_opponent_entry_number(3)");
    assert!(round.results.is_playing(1), "round.results.is_playing(1)");
    assert!(round.results.is_playing(2), "round.results.is_playing(2)");
    assert!(!round.results.is_playing(3), "round.results.is_playing(3)");   // P3 won
    assert!(round.results.is_losing(1), "round.results.is_losing(1)");
    assert!(round.results.is_losing(2), "round.results.is_losing(2)");
    assert!(round.results.is_winning(3), "round.results.is_winning(3)");   // P3 won
    assert!(!round.results.has_survived(1), "round.results.has_survived(1)");
    assert!(!round.results.has_survived(2), "round.results.has_survived(2)");
    assert!(round.results.has_survived(3), "round.results.has_survived(3)");   // P3 won
    assert!(!round.results.have_all_duels_finished(), "!round.results.have_all_duels_finished()");
    //
    // P3 won!
    assert_ne!(duel_id_p3, duel_id_p2, "duel_id_p3 != duel_id_p2");
    let ch_3: Challenge = sys.store.get_challenge(duel_id_p3);
    assert_eq!(ch_3.duel_type, DuelType::Tournament, "ch_3.duel_type");
    assert_eq!(ch_3.state, ChallengeState::Resolved, "ch_3.state");
    assert_eq!(ch_3.winner, 1, "ch_3.winner");
    assert_eq!(ch_3.address_a, P3().address, "ch_3.address_a");
    assert_eq!(ch_3.duelist_id_a, P3().duelist_id, "ch_3.duelist_id_a");
    assert_eq!(ch_3.address_b, ZERO(), "ch_3.address_b");
    assert_eq!(ch_3.duelist_id_b, 0, "ch_3.duelist_id_b");
    //
    // P1-P2 duel started
    assert_eq!(duel_id_p1, duel_id_p2, "duel_id_p1 == duel_id_p2");
    let ch_1: Challenge = sys.store.get_challenge(duel_id_p1);
    assert_eq!(ch_1.duel_type, DuelType::Tournament, "ch_1.duel_type");
    assert_eq!(ch_1.state, ChallengeState::InProgress, "ch_1.state");
    assert_eq!(ch_1.address_a, P1().address, "ch_1.address_a");
    assert_eq!(ch_1.duelist_id_a, P1().duelist_id, "ch_1.duelist_id_a");
    assert_eq!(ch_1.address_b, P2().address, "ch_1.address_b");
    assert_eq!(ch_1.duelist_id_b, P2().duelist_id, "ch_1.duelist_id_b");
    //
    // commit/reveal
    let (mocked, moves_a, moves_b) = prefabs::get_moves_crit_a();
    sys.rng.mock_values(mocked);
    tester::execute_commit_moves_ID(@sys, P1().address, P1().duelist_id, duel_id_p1, moves_a.hashed);
    let round: TournamentRound = sys.store.get_tournament_round(tournament_id, 1);
    assert!(round.results.is_winning(1), "commit_p1_a");
    assert!(!round.results.is_winning(2), "commit_p1_b");
    tester::execute_commit_moves_ID(@sys, P2().address, P2().duelist_id, duel_id_p1, moves_b.hashed);
    let round: TournamentRound = sys.store.get_tournament_round(tournament_id, 1);
    assert!(!round.results.is_winning(1), "commit_p2_a");
    assert!(!round.results.is_winning(2), "commit_p2_b");
    tester::execute_reveal_moves_ID(@sys, P1().address, P1().duelist_id, duel_id_p1, moves_a.salt, moves_a.moves);
    let round: TournamentRound = sys.store.get_tournament_round(tournament_id, 1);
    assert!(round.results.is_winning(1), "reveal_p1_a");
    assert!(!round.results.is_winning(2), "reveal_p1_b");
    assert!(round.results.is_playing(1), "round.results.is_playing(1)");
    assert!(round.results.is_playing(2), "round.results.is_playing(2)");
    // last move!
    tester::execute_reveal_moves_ID(@sys, P2().address, P2().duelist_id, duel_id_p1, moves_b.salt, moves_b.moves);
    let round: TournamentRound = sys.store.get_tournament_round(tournament_id, 1);
    assert!(round.results.is_winning(1), "reveal_p2_a");
    assert!(!round.results.is_winning(2), "reveal_p2_b");
    assert!(!round.results.is_playing(1), "!round.results.is_playing(1)");
    assert!(!round.results.is_playing(2), "!round.results.is_playing(2)");
    assert!(round.results.have_all_duels_finished(), "round.results.have_all_duels_finished()");
    let survivors: Span<u8> = round.results.get_surviving_entries();
    assert_eq!(survivors.len(), 2, "survivors.len()");
    assert_eq!(*survivors[0], 1, "survivors[0]");
    assert_eq!(*survivors[1], 3, "survivors[1]");
    let ch_1: Challenge = sys.store.get_challenge(duel_id_p1);
    assert_eq!(ch_1.state, ChallengeState::Resolved, "ch_1.state");
    assert_eq!(ch_1.winner, 1, "ch_1.winner");
}

#[test]
fn test_commit_reveal_b_a() {
    let mut sys: TestSystems = setup(FLAGS::GAME | FLAGS::DUEL | FLAGS::TOURNAMENT | FLAGS::MOCK_RNG);
    //
    // >> 3 entries tournament
    let (tournament_id, duel_ids) = _setup_start_tournament_of_2(ref sys, TournamentType::LastManStanding, [1, 2].span());
    let duel_id_p1: u128 = *duel_ids[0];
    let duel_id_p2: u128 = *duel_ids[1];
    //
    // P1-P2 duel started
    assert_eq!(duel_id_p1, duel_id_p2, "duel_id_p1 == duel_id_p2");
    let ch_1: Challenge = sys.store.get_challenge(duel_id_p1);
    assert_eq!(ch_1.duel_type, DuelType::Tournament, "ch_1.duel_type");
    assert_eq!(ch_1.state, ChallengeState::InProgress, "ch_1.state");
    //
    // commit/reveal
    let (mocked, moves_a, moves_b) = prefabs::get_moves_crit_b();
    sys.rng.mock_values(mocked);
    tester::execute_commit_moves_ID(@sys, P2().address, P2().duelist_id, duel_id_p1, moves_b.hashed);
    let round: TournamentRound = sys.store.get_tournament_round(tournament_id, 1);
    assert!(!round.results.is_winning(1), "commit_p1_a");
    assert!(round.results.is_winning(2), "commit_p1_b");
    tester::execute_commit_moves_ID(@sys, P1().address, P1().duelist_id, duel_id_p1, moves_a.hashed);
    let round: TournamentRound = sys.store.get_tournament_round(tournament_id, 1);
    assert!(!round.results.is_winning(1), "commit_p2_a");
    assert!(!round.results.is_winning(2), "commit_p2_b");
    tester::execute_reveal_moves_ID(@sys, P2().address, P2().duelist_id, duel_id_p1, moves_b.salt, moves_b.moves);
    let round: TournamentRound = sys.store.get_tournament_round(tournament_id, 1);
    assert!(!round.results.is_winning(1), "reveal_p1_a");
    assert!(round.results.is_winning(2), "reveal_p1_b");
    assert!(round.results.is_playing(1), "round.results.is_playing(1)");
    assert!(round.results.is_playing(2), "round.results.is_playing(2)");
    // last move!
    tester::execute_reveal_moves_ID(@sys, P1().address, P1().duelist_id, duel_id_p1, moves_a.salt, moves_a.moves);
    let round: TournamentRound = sys.store.get_tournament_round(tournament_id, 1);
    assert!(!round.results.is_winning(1), "reveal_p2_a");
    assert!(round.results.is_winning(2), "reveal_p2_b");
    assert!(!round.results.is_playing(1), "!round.results.is_playing(1)");
    assert!(!round.results.is_playing(2), "!round.results.is_playing(2)");
    assert!(round.results.have_all_duels_finished(), "round.results.have_all_duels_finished()");
    let survivors: Span<u8> = round.results.get_surviving_entries();
    assert_eq!(survivors.len(), 1, "survivors.len()");
    assert_eq!(*survivors[0], 2, "survivors[0]");
    let ch_1: Challenge = sys.store.get_challenge(duel_id_p1);
    assert_eq!(ch_1.state, ChallengeState::Resolved, "ch_1.state");
    assert_eq!(ch_1.winner, 2, "ch_1.winner");
}

#[test]
fn test_commit_reveal_draw_dead() {
    let mut sys: TestSystems = setup(FLAGS::GAME | FLAGS::DUEL | FLAGS::TOURNAMENT | FLAGS::MOCK_RNG);
    let (tournament_id, duel_ids) = _setup_start_tournament_of_2(ref sys, TournamentType::LastManStanding, [1, 2].span());
    //
    // P1-P2 duel started
    let duel_id_p1: u128 = *duel_ids[0];
    let ch_1: Challenge = sys.store.get_challenge(duel_id_p1);
    assert_eq!(ch_1.lives_staked, 3, "ch_1.lives_staked");
    let (mocked, moves_a, moves_b) = prefabs::get_moves_dual_crit();
    sys.rng.mock_values(mocked);
    tester::execute_commit_moves_ID(@sys, P1().address, P1().duelist_id, duel_id_p1, moves_a.hashed);
    tester::execute_commit_moves_ID(@sys, P2().address, P2().duelist_id, duel_id_p1, moves_b.hashed);
    tester::execute_reveal_moves_ID(@sys, P2().address, P2().duelist_id, duel_id_p1, moves_b.salt, moves_b.moves);
    tester::execute_reveal_moves_ID(@sys, P1().address, P1().duelist_id, duel_id_p1, moves_a.salt, moves_a.moves);
    let round: TournamentRound = sys.store.get_tournament_round(tournament_id, 1);
    assert!(!round.results.is_winning(1), "finished_a");
    assert!(!round.results.is_winning(2), "finished_b");
    assert!(!round.results.has_survived(1), "has_survived_a");
    assert!(!round.results.has_survived(2), "has_survived_b");
    let survivors: Span<u8> = round.results.get_surviving_entries();
    assert_eq!(survivors.len(), 0, "survivors.len()");
}

#[test]
#[ignore]
// TODO: enable FAME and try again... (maybe mint 2 duelists and transfer to P1/P2)
fn test_commit_reveal_draw_alive() {
    let mut sys: TestSystems = setup(FLAGS::GAME | FLAGS::DUEL | FLAGS::TOURNAMENT | FLAGS::MOCK_RNG);
    let (tournament_id, duel_ids) = _setup_start_tournament_of_2(ref sys, TournamentType::LastManStanding, [1, 2].span());
    //
    // P1-P2 duel started
    let duel_id_p1: u128 = *duel_ids[0];
    let ch_1: Challenge = sys.store.get_challenge(duel_id_p1);
    assert_eq!(ch_1.lives_staked, 1, "ch_1.lives_staked");
    let (mocked, moves_a, moves_b) = prefabs::get_moves_dual_crit();
    sys.rng.mock_values(mocked);
    tester::execute_commit_moves_ID(@sys, P2().address, P2().duelist_id, duel_id_p1, moves_b.hashed);
    tester::execute_commit_moves_ID(@sys, P1().address, P1().duelist_id, duel_id_p1, moves_a.hashed);
    tester::execute_reveal_moves_ID(@sys, P1().address, P1().duelist_id, duel_id_p1, moves_a.salt, moves_a.moves);
    tester::execute_reveal_moves_ID(@sys, P2().address, P2().duelist_id, duel_id_p1, moves_b.salt, moves_b.moves);
    let round: TournamentRound = sys.store.get_tournament_round(tournament_id, 1);
    assert!(!round.results.is_winning(1), "finished_a");
    assert!(!round.results.is_winning(2), "finished_b");
    assert!(round.results.has_survived(1), "has_survived_a");
    assert!(round.results.has_survived(2), "has_survived_b");
    let survivors: Span<u8> = round.results.get_surviving_entries();
    assert_eq!(survivors.len(), 2, "survivors.len()");
}

#[test]
fn test_commit_reveal_expire_collect_a() {
    let mut sys: TestSystems = setup(FLAGS::GAME | FLAGS::DUEL | FLAGS::TOURNAMENT | FLAGS::MOCK_RNG);
    let (tournament_id, duel_ids) = _setup_start_tournament_of_2(ref sys, TournamentType::LastManStanding, [1, 2].span());
    //
    // P1-P2 duel started
    let duel_id_p1: u128 = *duel_ids[0];
    let (mocked, moves_a, _moves_b) = prefabs::get_moves_dual_crit();
    sys.rng.mock_values(mocked);
    tester::execute_commit_moves_ID(@sys, P1().address, P1().duelist_id, duel_id_p1, moves_a.hashed);
    let round: TournamentRound = sys.store.get_tournament_round(tournament_id, 1);
    assert!(round.results.is_winning(1), "commit_a");
    assert!(!round.results.is_winning(2), "commit_b");
    //
    // expire duel
    assert!(!sys.game.can_collect_duel(duel_id_p1), "!can_collect()");
    // tester::elapse_block_timestamp(TIMESTAMP::ONE_DAY + 1);
    tester::set_block_timestamp(round.timestamps.end + 1);
    assert!(sys.game.can_collect_duel(duel_id_p1), "can_collect()");
    tester::execute_collect_duel(@sys, P1().address, duel_id_p1);
    assert!(!sys.game.can_collect_duel(duel_id_p1), "!can_collect()_after");
    // check round
    let round: TournamentRound = sys.store.get_tournament_round(tournament_id, 1);
    assert!(round.results.is_winning(1), "finished_a");
    assert!(!round.results.is_winning(2), "finished_b");
    assert!(round.results.has_survived(1), "has_survived_a");
    assert!(!round.results.has_survived(2), "has_survived_b");
    // check challenge
    let ch_1: Challenge = sys.store.get_challenge(duel_id_p1);
    assert_eq!(ch_1.state, ChallengeState::Resolved, "ch_1.state");
    assert_eq!(ch_1.winner, 1, "ch_1.winner");
}

#[test]
fn test_commit_reveal_expire_collect_b() {
    let mut sys: TestSystems = setup(FLAGS::GAME | FLAGS::DUEL | FLAGS::TOURNAMENT | FLAGS::MOCK_RNG);
    let (tournament_id, duel_ids) = _setup_start_tournament_of_2(ref sys, TournamentType::LastManStanding, [1, 2].span());
    //
    // P1-P2 duel started
    let duel_id_p1: u128 = *duel_ids[0];
    let (mocked, _moves_a, moves_b) = prefabs::get_moves_dual_crit();
    sys.rng.mock_values(mocked);
    tester::execute_commit_moves_ID(@sys, P2().address, P2().duelist_id, duel_id_p1, moves_b.hashed);
    let round: TournamentRound = sys.store.get_tournament_round(tournament_id, 1);
    assert!(!round.results.is_winning(1), "commit_a");
    assert!(round.results.is_winning(2), "commit_b");
    //
    // expire duel
    assert!(!sys.game.can_collect_duel(duel_id_p1), "!can_collect()");
    tester::set_block_timestamp(round.timestamps.end + 1);
    assert!(sys.game.can_collect_duel(duel_id_p1), "can_collect()");
    tester::execute_collect_duel(@sys, P2().address, duel_id_p1);
    assert!(!sys.game.can_collect_duel(duel_id_p1), "!can_collect()_after");
    // check round
    let round: TournamentRound = sys.store.get_tournament_round(tournament_id, 1);
    assert!(!round.results.is_winning(1), "finished_a");
    assert!(round.results.is_winning(2), "finished_b");
    assert!(!round.results.has_survived(1), "has_survived_a");
    assert!(round.results.has_survived(2), "has_survived_b");
    // check challenge
    let ch_1: Challenge = sys.store.get_challenge(duel_id_p1);
    assert_eq!(ch_1.state, ChallengeState::Resolved, "ch_1.state");
    assert_eq!(ch_1.winner, 2, "ch_1.winner");
}

#[test]
fn test_commit_reveal_expire_collect_a_b() {
    let mut sys: TestSystems = setup(FLAGS::GAME | FLAGS::DUEL | FLAGS::TOURNAMENT | FLAGS::MOCK_RNG);
    let (tournament_id, duel_ids) = _setup_start_tournament_of_2(ref sys, TournamentType::LastManStanding, [1, 2].span());
    //
    // P1-P2 duel started
    let duel_id_p1: u128 = *duel_ids[0];
    let ch_1: Challenge = sys.store.get_challenge(duel_id_p1);
    assert_eq!(ch_1.state, ChallengeState::InProgress, "ch_1.state");
    let round: TournamentRound = sys.store.get_tournament_round(tournament_id, 1);
    assert!(!round.results.is_winning(1), "commit_a");
    assert!(!round.results.is_winning(2), "commit_b");
    //
    // expire duel
    assert!(!sys.game.can_collect_duel(duel_id_p1), "!can_collect()");
    tester::set_block_timestamp(round.timestamps.end + 1);
    assert!(sys.game.can_collect_duel(duel_id_p1), "can_collect()");
    tester::execute_collect_duel(@sys, OTHER(), duel_id_p1);
    assert!(!sys.game.can_collect_duel(duel_id_p1), "!can_collect()_after");
    // check round
    let round: TournamentRound = sys.store.get_tournament_round(tournament_id, 1);
    assert!(!round.results.is_winning(1), "finished_a");
    assert!(!round.results.is_winning(2), "finished_b");
    assert!(!round.results.has_survived(1), "has_survived_a");
    assert!(!round.results.has_survived(2), "has_survived_b");
    // check challenge
    let ch_1: Challenge = sys.store.get_challenge(duel_id_p1);
    assert_eq!(ch_1.state, ChallengeState::Draw, "ch_1.state");
    assert_eq!(ch_1.winner, 0, "ch_1.winner");
}

#[test]
#[should_panic(expected: ('PISTOLS: Not your duel', 'ENTRYPOINT_FAILED'))]
fn test_commit_reveal_bad_pair() {
    let mut sys: TestSystems = setup(FLAGS::GAME | FLAGS::DUEL | FLAGS::TOURNAMENT | FLAGS::MOCK_RNG);
    let (_tournament_id, duel_ids) = _setup_start_tournament_of_3(ref sys, TournamentType::LastManStanding, [1, 3, 2].span());
    // trait dueling
    let duel_id_p1: u128 = *duel_ids[0];
    let (mocked, moves_a, _moves_b) = prefabs::get_moves_crit_b();
    sys.rng.mock_values(mocked);
    tester::execute_commit_moves_ID(@sys, P2().address, P2().duelist_id, duel_id_p1, moves_a.hashed);
    // panic!
}



//--------------------------------
// commit/reveal using TournamentResultsTrait
//

#[test]
fn test_commit_reveal_a_b_traits_baseline() {
    let mut sys: TestSystems = setup(FLAGS::GAME | FLAGS::DUEL | FLAGS::TOURNAMENT | FLAGS::MOCK_RNG);
    let (tournament_id, _duel_ids) = _setup_start_tournament_of_3(ref sys, TournamentType::LastManStanding, [1, 2, 3].span());
    let EN_1: u8 = P1().entry_number;
    let EN_2: u8 = P2().entry_number;
    let EN_3: u8 = P3().entry_number;
    //
    // trait dueling
    let mut round: TournamentRound = sys.store.get_tournament_round(tournament_id, 1);
    assert!(!round.results.is_playing(EN_3), "round.results.is_playing(P3)");       // P3 won
    assert!(round.results.is_winning(EN_3), "round.results.is_winning(P3)");        // P3 won
    assert!(round.results.has_survived(EN_3), "round.results.has_survived(P3)");    // P3 won
    round.moved_first(EN_1, EN_2);
    assert!(round.results.is_winning(EN_1), "moved_first_a");
    assert!(!round.results.is_winning(EN_2), "moved_first_b");
    round.moved_second(EN_2, EN_1);
    assert!(!round.results.is_winning(EN_1), "moved_second_a");
    assert!(!round.results.is_winning(EN_2), "moved_second_b");
    round.moved_first(EN_1, EN_2);
    assert!(round.results.is_winning(EN_1), "reveal_p1_a");
    assert!(!round.results.is_winning(EN_2), "reveal_p1_b");
    assert!(round.results.is_playing(EN_1), "round.results.is_playing(P1)");
    assert!(round.results.is_playing(EN_2), "round.results.is_playing(P2)");
    // last move!
    round.finished_duel(EN_1, EN_2, true, false, 1);
    assert!(round.results.is_winning(EN_1), "finished_duel_a");
    assert!(!round.results.is_winning(EN_2), "finished_duel_b");
    assert!(!round.results.is_playing(EN_1), "!round.results.is_playing(P1)");
    assert!(!round.results.is_playing(EN_2), "!round.results.is_playing(P2)");
    // finished!
    assert!(round.results.have_all_duels_finished(), "round.results.have_all_duels_finished()");
    let survivors: Span<u8> = round.results.get_surviving_entries();
    assert_eq!(survivors.len(), 2, "survivors.len()");
    assert!(survivors.contains(@EN_1), "survivors[0]");
    assert!(survivors.contains(@EN_3), "survivors[1]");
}

#[test]
fn test_commit_reveal_b_a_traits_baseline() {
    let mut sys: TestSystems = setup(FLAGS::GAME | FLAGS::DUEL | FLAGS::TOURNAMENT | FLAGS::MOCK_RNG);
    let (tournament_id, _duel_ids) = _setup_start_tournament_of_2(ref sys, TournamentType::LastManStanding, [1, 2].span());
    let EN_1: u8 = P1().entry_number;
    let EN_2: u8 = P2().entry_number;
    //
    // trait dueling
    let mut round: TournamentRound = sys.store.get_tournament_round(tournament_id, 1);
    round.finished_duel(EN_1, EN_2, false, true, 2);
    assert!(!round.results.is_winning(EN_1), "finished_duel_a");
    assert!(round.results.is_winning(EN_2), "finished_duel_b");
    assert!(!round.results.is_playing(EN_1), "!round.results.is_playing(P1)");
    assert!(!round.results.is_playing(EN_2), "!round.results.is_playing(P2)");
    // finished!
    assert!(round.results.have_all_duels_finished(), "round.results.have_all_duels_finished()");
    let survivors: Span<u8> = round.results.get_surviving_entries();
    assert_eq!(survivors.len(), 1, "survivors.len()");
    assert!(survivors.contains(@EN_2), "survivors[0]");
}

#[test]
fn test_commit_reveal_shuffled() {
    let mut sys: TestSystems = setup(FLAGS::GAME | FLAGS::DUEL | FLAGS::TOURNAMENT | FLAGS::MOCK_RNG);
    let (tournament_id, _duel_ids) = _setup_start_tournament_of_6(ref sys, TournamentType::LastManStanding, [6, 1, 2, 5, 4, 3].span());
    let EN_1: u8 = P1().entry_number;
    let EN_2: u8 = P2().entry_number;
    let EN_3: u8 = P3().entry_number;
    let EN_4: u8 = P4().entry_number; // 6
    let EN_5: u8 = P5().entry_number; // 4
    let EN_6: u8 = P6().entry_number; // 5
    //
    // run duel with traits
    let mut round: TournamentRound = sys.store.get_tournament_round(tournament_id, 1);
    //
    // trait dueling
    round.finished_duel(EN_6, EN_1, true, false, 1);
    assert!(round.results.is_winning(EN_6), "finished_duel_1_a");
    assert!(!round.results.is_winning(EN_1), "finished_duel_1_b");
    round.finished_duel(EN_2, EN_5, true, false, 1);
    assert!(round.results.is_winning(EN_2), "finished_duel_2_a");
    assert!(!round.results.is_winning(EN_5), "finished_duel_2_b");
    round.finished_duel(EN_4, EN_3, false, true, 2);
    assert!(!round.results.is_winning(EN_4), "finished_duel_3_a");
    assert!(round.results.is_winning(EN_3), "finished_duel_3_b");
    // finished!
    let survivors: Span<u8> = round.results.get_surviving_entries();
    assert_eq!(survivors.len(), 3, "survivors.len()");
// println!("survivors: {}, {}, {} / {} {} {}", EN_6, EN_2, EN_3, *survivors[0], *survivors[1], *survivors[2]);
    assert!(survivors.contains(@EN_6), "survivors[0]");
    assert!(survivors.contains(@EN_2), "survivors[1]");
    assert!(survivors.contains(@EN_3), "survivors[2]");
    assert!(round.results.have_all_duels_finished(), "round.results.have_all_duels_finished()");
}



//--------------------------------
// Tournament End (single round)
//

fn _assert_tournament_ended(sys: @TestSystems, tournament_id: u64, last_round_number: u8, expected_survivors: Span<u8>) {
    let tournament: Tournament = sys.store.get_tournament(tournament_id);
    assert_eq!(tournament.state, TournamentState::Finished, "END[{}:{}] tournament.state", tournament_id, last_round_number);
    assert_eq!(tournament.round_number, last_round_number, "END[{}:{}] tournament.round_number", tournament_id, last_round_number);
    let round: TournamentRound = sys.store.get_tournament_round(tournament_id, last_round_number);
    assert!(round.results.have_all_duels_finished(), "END[{}:{}] round.results.have_all_duels_finished()", tournament_id, last_round_number);
    let survivors: Span<u8> = round.results.get_surviving_entries();
    assert_eq!(survivors.len(), expected_survivors.len(), "END[{}:{}] survivors.len()", tournament_id, last_round_number);
    let mut i: usize = 0;
    while (i < survivors.len()) {
        let entry_number: u8 = *survivors[i];
        assert!(expected_survivors.contains(@entry_number), "END[{}:{}] survivors[{}]: {}", tournament_id, last_round_number, i, entry_number);
        assert!(round.results.is_winning(entry_number), "END[{}:{}] is_winning[{}]: {}", tournament_id, last_round_number, i, entry_number);
        i += 1;
    };
}

#[test]
#[should_panic(expected: ('TOURNAMENT: Still playable', 'ENTRYPOINT_FAILED'))]
fn test_end_round_not_played() {
    let mut sys: TestSystems = setup(FLAGS::GAME | FLAGS::DUEL | FLAGS::TOURNAMENT | FLAGS::MOCK_RNG);
    let (_tournament_id, _duel_ids) = _setup_start_tournament_of_2(ref sys, TournamentType::LastManStanding, [1, 2].span());
    // end_round
    tester::impersonate(P1().address);
    assert!(!sys.tournaments.can_end_round(P1().pass_id), "!can_end_round()");
    let _next_round: Option<u8> = tester::execute_end_round(@sys, P1().address, P1().pass_id);
}

#[test]
#[should_panic(expected: ('TOURNAMENT: Not your entry', 'ENTRYPOINT_FAILED'))]
fn test_end_round_not_owner() {
    let mut sys: TestSystems = setup(FLAGS::GAME | FLAGS::DUEL | FLAGS::TOURNAMENT | FLAGS::MOCK_RNG);
    let (_tournament_id, _duel_ids) = _setup_start_tournament_of_2(ref sys, TournamentType::LastManStanding, [1, 2].span());
    //
    // tournament timeout
    tester::set_block_timestamp(TIMESTAMP_END);
    // end_round
    tester::impersonate(OTHER());
    assert!(!sys.tournaments.can_end_round(P1().pass_id), "!can_end_round()");
    let _next_round: Option<u8> = tester::execute_end_round(@sys, OTHER(), P1().pass_id);
}

#[test]
fn test_end_round_all_round_timeout() {
    let mut sys: TestSystems = setup(FLAGS::GAME | FLAGS::DUEL | FLAGS::TOURNAMENT | FLAGS::MOCK_RNG);
    let (tournament_id, _duel_ids) = _setup_start_tournament_of_2(ref sys, TournamentType::LastManStanding, [1, 2].span());
    //
    // tournament timeout
    let round: TournamentRound = sys.store.get_tournament_round(tournament_id, 1);
    tester::set_block_timestamp(round.timestamps.end + 1);
    // end_round
    tester::impersonate(P1().address);
    assert!(sys.tournaments.can_end_round(P1().pass_id), "can_end_round()");
    let next_round_option: Option<u8> = tester::execute_end_round(@sys, P1().address, P1().pass_id);
    assert!(next_round_option.is_none(), "next_round_id");
    // OK!
    _assert_tournament_ended(@sys, tournament_id, 1, [].span());
}

#[test]
fn test_end_round_all_tournament_timeout() {
    let mut sys: TestSystems = setup(FLAGS::GAME | FLAGS::DUEL | FLAGS::TOURNAMENT | FLAGS::MOCK_RNG);
    let (tournament_id, _duel_ids) = _setup_start_tournament_of_2(ref sys, TournamentType::LastManStanding, [1, 2].span());
    //
    // tournament timeout
    tester::set_block_timestamp(TIMESTAMP_END);
    // end_round
    // (with P2 now...)
    tester::impersonate(P2().address);
    assert!(sys.tournaments.can_end_round(P2().pass_id), "can_end_round()");
    let next_round_option: Option<u8> = tester::execute_end_round(@sys, P2().address, P2().pass_id);
    assert!(next_round_option.is_none(), "next_round_id");
    // OK!
    _assert_tournament_ended(@sys, tournament_id, 1, [].span());
}

#[test]
fn test_end_round_all_players_finished() {
    let mut sys: TestSystems = setup(FLAGS::GAME | FLAGS::DUEL | FLAGS::TOURNAMENT | FLAGS::MOCK_RNG);
    let (tournament_id, _duel_ids) = _setup_start_tournament_of_2(ref sys, TournamentType::LastManStanding, [1, 2].span());
    let EN_1: u8 = P1().entry_number;
    let EN_2: u8 = P2().entry_number;
    //
    // trait dueling
    let mut round: TournamentRound = sys.store.get_tournament_round(tournament_id, 1);
    round.moved_first(EN_1, EN_2);
    assert!(!sys.tournaments.can_end_round(P1().pass_id), "!can_end_round()");
    tester::set_TournamentRound(ref sys.world, @round);
    let mut round: TournamentRound = sys.store.get_tournament_round(tournament_id, 1);
    assert!(!round.results.have_all_duels_finished(), "!round.results.have_all_duels_finished()");
    // now finished...
    round.finished_duel(EN_1, EN_2, true, false, 1);
    tester::set_TournamentRound(ref sys.world, @round);
    let round: TournamentRound = sys.store.get_tournament_round(tournament_id, 1);
    assert!(round.results.is_winning(EN_1), "a_is_winning");
    assert!(!round.results.is_winning(EN_2), "b_is_not_winning");
    assert!(round.results.have_all_duels_finished(), "round.results.have_all_duels_finished()");
    // end_round
    tester::impersonate(P1().address); // needed to call can_end_round()
    assert!(sys.tournaments.can_end_round(P1().pass_id), "can_end_round()");
    let next_round_option: Option<u8> = tester::execute_end_round(@sys, P1().address, P1().pass_id);
    assert!(next_round_option.is_none(), "next_round_id");
    // OK!
    _assert_tournament_ended(@sys, tournament_id, 1, [EN_1].span());
    // player can collect...
}

#[test]
fn test_end_round_left_players_winning() {
    let mut sys: TestSystems = setup(FLAGS::GAME | FLAGS::DUEL | FLAGS::TOURNAMENT | FLAGS::MOCK_RNG);
    let (tournament_id, duel_ids) = _setup_start_tournament_of_2(ref sys, TournamentType::LastManStanding, [1, 2].span());
    let EN_1: u8 = P1().entry_number;
    let EN_2: u8 = P2().entry_number;
    //
    // commit/reveal
    let duel_id_p1: u128 = *duel_ids[0];
    let (mocked, moves_a, _moves_b) = prefabs::get_moves_crit_a();
    sys.rng.mock_values(mocked);
    tester::execute_commit_moves_ID(@sys, P1().address, P1().duelist_id, duel_id_p1, moves_a.hashed);
    // tester::execute_commit_moves_ID(@sys, P2().address, P2().duelist_id, duel_id_p1, moves_b.hashed);
    // tester::execute_reveal_moves_ID(@sys, P1().address, P1().duelist_id, duel_id_p1, moves_a.salt, moves_a.moves);
    // tester::execute_reveal_moves_ID(@sys, P2().address, P2().duelist_id, duel_id_p1, moves_b.salt, moves_b.moves);
    // end_round
    let round: TournamentRound = sys.store.get_tournament_round(tournament_id, 1);
    assert!(round.results.is_winning(EN_1), "a_is_winning");
    assert!(!round.results.is_winning(EN_2), "b_is_not_winning");
    tester::set_block_timestamp(round.timestamps.end + 1);
    tester::impersonate(P1().address); // needed to call can_end_round()
    assert!(sys.tournaments.can_end_round(P1().pass_id), "can_end_round()");
    let next_round_option: Option<u8> = tester::execute_end_round(@sys, P1().address, P1().pass_id);
    assert!(next_round_option.is_none(), "next_round_id");
    // OK!
    _assert_tournament_ended(@sys, tournament_id, 1, [EN_1].span());
    // player can collect now...
    tester::impersonate(P1().address); // needed to call can_collect_duel()
    assert!(sys.game.can_collect_duel(duel_id_p1), "can_collect()");
    tester::execute_collect_duel(@sys, P1().address, duel_id_p1);
}

#[test]
#[should_panic(expected: ('TOURNAMENT: Has ended', 'ENTRYPOINT_FAILED'))]
fn test_end_round_already_ended() {
    let mut sys: TestSystems = setup(FLAGS::GAME | FLAGS::DUEL | FLAGS::TOURNAMENT | FLAGS::MOCK_RNG);
    let (_tournament_id, _duel_ids) = _setup_start_tournament_of_2(ref sys, TournamentType::LastManStanding, [1, 2].span());
    //
    // tournament timeout
    tester::set_block_timestamp(TIMESTAMP_END);
    // end_round
    tester::impersonate(P1().address);
    assert!(sys.tournaments.can_end_round(P1().pass_id), "can_end_round()");
    let next_round_option: Option<u8> = tester::execute_end_round(@sys, P1().address, P1().pass_id);
    assert!(next_round_option.is_none(), "next_round_id");
    // end again...
    tester::impersonate(P1().address);
    assert!(!sys.tournaments.can_end_round(P1().pass_id), "!can_end_round()");
    let _next_round: Option<u8> = tester::execute_end_round(@sys, P1().address, P1().pass_id);
}

#[test]
fn test_end_round_unpaired_win() {
    let mut sys: TestSystems = setup(FLAGS::GAME | FLAGS::DUEL | FLAGS::TOURNAMENT | FLAGS::MOCK_RNG);
    let (tournament_id, _duel_ids) = _setup_start_tournament_of_3(ref sys, TournamentType::LastManStanding, [1, 2, 3].span());
    let EN_3: u8 = P3().entry_number;
    //
    // end tournament!
    let mut round: TournamentRound = sys.store.get_tournament_round(tournament_id, 1);
    tester::set_block_timestamp(round.timestamps.end + 1);
    tester::impersonate(P3().address);
    assert!(sys.tournaments.can_end_round(P3().pass_id), "can_end_round(1)");
    let next_round_option: Option<u8> = tester::execute_end_round(@sys, P3().address, P3().pass_id);
    assert!(next_round_option.is_none(), "next_round_option_end(1)");
    _assert_tournament_ended(@sys, tournament_id, 1, [EN_3].span());
}

#[test]
fn test_end_round_unpaired_win_collected() {
    let mut sys: TestSystems = setup(FLAGS::GAME | FLAGS::DUEL | FLAGS::TOURNAMENT | FLAGS::MOCK_RNG);
    let (tournament_id, duel_ids) = _setup_start_tournament_of_3(ref sys, TournamentType::LastManStanding, [1, 2, 3].span());
    let EN_3: u8 = P3().entry_number;
    //
    // draw, other win
    let duel_id_p1: u128 = *duel_ids[0];
    let _ch_1: Challenge = sys.store.get_challenge(duel_id_p1);
    let (mocked, moves_a, moves_b) = prefabs::get_moves_dual_crit();
    sys.rng.mock_values(mocked);
    tester::execute_commit_moves_ID(@sys, P2().address, P2().duelist_id, duel_id_p1, moves_b.hashed);
    tester::execute_commit_moves_ID(@sys, P1().address, P1().duelist_id, duel_id_p1, moves_a.hashed);
    tester::execute_reveal_moves_ID(@sys, P1().address, P1().duelist_id, duel_id_p1, moves_a.salt, moves_a.moves);
    tester::execute_reveal_moves_ID(@sys, P2().address, P2().duelist_id, duel_id_p1, moves_b.salt, moves_b.moves);
    let round: TournamentRound = sys.store.get_tournament_round(tournament_id, 1);
    assert!(!round.results.is_winning(1), "is_winning_a");
    assert!(!round.results.is_winning(2), "is_winning_b");
    assert!(round.results.is_winning(3), "is_winning_c");
    //
    // end tournament!
    tester::impersonate(P3().address);
    assert!(sys.tournaments.can_end_round(P3().pass_id), "can_end_round(1)");
    let next_round_option: Option<u8> = tester::execute_end_round(@sys, P3().address, P3().pass_id);
    assert!(next_round_option.is_none(), "next_round_option_end(1)");
    _assert_tournament_ended(@sys, tournament_id, 1, [EN_3].span());
}



//--------------------------------
// Round End (multi rounds)
//

fn _assert_next_round(sys: @TestSystems, tournament_id: u64, new_round_number: u8, expected_players: Span<u8>) {
    assert_gt!(new_round_number, 1, "NEXT_ROUND[{}:{}] new_round_number", tournament_id, new_round_number);
    let tournament: Tournament = sys.store.get_tournament(tournament_id);
    assert_eq!(tournament.state, TournamentState::InProgress, "NEXT_ROUND[{}:{}] tournament.state", tournament_id, new_round_number);
    assert_eq!(tournament.round_number, new_round_number, "NEXT_ROUND[{}:{}] tournament.round_number", tournament_id, new_round_number);
    let prev_round: TournamentRound = sys.store.get_tournament_round(tournament_id, new_round_number - 1);
    assert!(prev_round.results.have_all_duels_finished(), "NEXT_ROUND[{}:{}] prev_round.results.have_all_duels_finished()", tournament_id, new_round_number);
    let new_round: TournamentRound = sys.store.get_tournament_round(tournament_id, new_round_number);
    assert!(!new_round.results.have_all_duels_finished(), "NEXT_ROUND[{}:{}] new_round.results.have_all_duels_finished()", tournament_id, new_round_number);
    // entries
    let survivors: Span<u8> = prev_round.results.get_surviving_entries();
    assert_eq!(survivors.len(), expected_players.len(), "NEXT_ROUND[{}:{}] survivors.len()", tournament_id, new_round_number);
    assert_eq!(new_round.entry_count.into(), survivors.len(), "NEXT_ROUND[{}:{}] new_round.entry_count", tournament_id, new_round_number);
    assert_eq!(new_round.results.playing_count().into(), survivors.len(), "NEXT_ROUND[{}:{}] new_round.results.playing_count()", tournament_id, new_round_number);
    let mut i: usize = 0;
    while (i < survivors.len()) {
        let entry_number: u8 = *survivors[i];
        assert!(expected_players.contains(@entry_number), "NEXT_ROUND[{}:{}] survivors[{}]: {}", tournament_id, new_round_number, i, entry_number);
        assert!(new_round.results.is_playing(entry_number), "NEXT_ROUND[{}:{}] is_winning[{}]: {}", tournament_id, new_round_number, i, entry_number);
        i += 1;
    };
}

#[test]
fn test_next_round_finished_ok() {
    let mut sys: TestSystems = setup(FLAGS::GAME | FLAGS::DUEL | FLAGS::TOURNAMENT | FLAGS::MOCK_RNG);
    let (tournament_id, _duel_ids) = _setup_start_tournament_of_6(ref sys, TournamentType::LastManStanding, [1, 2, 3, 4, 5, 6].span());
    let EN_1: u8 = P1().entry_number;
    let EN_2: u8 = P2().entry_number;
    let EN_3: u8 = P3().entry_number;
    let EN_4: u8 = P4().entry_number; // 6
    let EN_5: u8 = P5().entry_number; // 4
    let EN_6: u8 = P6().entry_number; // 5
    //
    // trait dueling Round 1
    let mut round: TournamentRound = sys.store.get_tournament_round(tournament_id, 1);
    round.finished_duel(EN_1, EN_2, true, false, 1);
    round.finished_duel(EN_3, EN_4, true, false, 1);
    round.finished_duel(EN_5, EN_6, false, true, 2);
    tester::set_TournamentRound(ref sys.world, @round);
    assert!(round.results.is_winning(EN_1), "round.results.is_winning(EN_1)_1");
    assert!(round.results.is_winning(EN_3), "round.results.is_winning(EN_3)_1");
    assert!(round.results.is_winning(EN_6), "round.results.is_winning(EN_6)_1");
    //
    // end_round(1)
    tester::set_block_timestamp(round.timestamps.end + 1);
    tester::impersonate(P1().address);
    assert!(sys.tournaments.can_end_round(P1().pass_id), "can_end_round(1)");
    let next_round_option: Option<u8> = tester::execute_end_round(@sys, P1().address, P1().pass_id);
    assert!(next_round_option.is_some(), "next_round_option(1)");
    let next_round_id: u8 = next_round_option.unwrap();
    assert_eq!(next_round_id, 2, "next_round_id(1)");
    _assert_next_round(@sys, tournament_id, next_round_id, [EN_1, EN_3, EN_6].span());
    //
    // trait dueling Round 2
    let mut round: TournamentRound = sys.store.get_tournament_round(tournament_id, 2);
    round.finished_duel(EN_1, EN_3, true, false, 1);
    tester::set_TournamentRound(ref sys.world, @round);
    assert!(round.results.is_winning(EN_1), "round.results.is_winning(EN_1)_2");
    assert!(round.results.is_winning(EN_6), "round.results.is_winning(EN_6)_2");
    //
    // end_round(2)
    tester::set_block_timestamp(round.timestamps.end + 1);
    tester::impersonate(P4().address);
    assert!(sys.tournaments.can_end_round(P4().pass_id), "can_end_round(2)");
    let next_round_option: Option<u8> = tester::execute_end_round(@sys, P4().address, P4().pass_id);
    assert!(next_round_option.is_some(), "next_round_option(2)");
    let next_round_id: u8 = next_round_option.unwrap();
    assert_eq!(next_round_id, 3, "next_round_id(2)");
    _assert_next_round(@sys, tournament_id, next_round_id, [EN_1, EN_6].span());
    //
    // trait dueling Round 3
    let mut round: TournamentRound = sys.store.get_tournament_round(tournament_id, 3);
    round.finished_duel(EN_1, EN_6, false, true, 2);
    tester::set_TournamentRound(ref sys.world, @round);
    assert!(round.results.is_winning(EN_6), "round.results.is_winning(EN_6)_3");
    //
    // end tournament!
    tester::set_block_timestamp(round.timestamps.end + 1);
    tester::impersonate(P6().address);
    assert!(sys.tournaments.can_end_round(P6().pass_id), "can_end_round(3)");
    let next_round_option: Option<u8> = tester::execute_end_round(@sys, P6().address, P6().pass_id);
    assert!(next_round_option.is_none(), "next_round_option_end(3)");
    _assert_tournament_ended(@sys, tournament_id, 3, [EN_6].span());
}

#[test]
fn test_next_round_incomplete_ok() {
    let mut sys: TestSystems = setup(FLAGS::GAME | FLAGS::DUEL | FLAGS::TOURNAMENT | FLAGS::MOCK_RNG);
    let (tournament_id, _duel_ids) = _setup_start_tournament_of_6(ref sys, TournamentType::LastManStanding, [1, 2, 3, 4, 5, 6].span());
    let EN_1: u8 = P1().entry_number;
    let EN_2: u8 = P2().entry_number;
    let EN_3: u8 = P3().entry_number;
    let EN_4: u8 = P4().entry_number; // 6
    let EN_5: u8 = P5().entry_number; // 4
    let EN_6: u8 = P6().entry_number; // 5
    //
    // trait dueling Round 1
    let mut round: TournamentRound = sys.store.get_tournament_round(tournament_id, 1);
    round.moved_first(EN_1, EN_2);
    round.moved_first(EN_3, EN_4);
    round.moved_first(EN_6, EN_5);
    tester::set_TournamentRound(ref sys.world, @round);
    assert!(round.results.is_winning(EN_1), "round.results.is_winning(EN_1)_1");
    assert!(round.results.is_winning(EN_3), "round.results.is_winning(EN_3)_1");
    assert!(round.results.is_winning(EN_6), "round.results.is_winning(EN_6)_1");
    //
    // end_round(1)
    tester::set_block_timestamp(round.timestamps.end + 1);
    tester::impersonate(P1().address);
    assert!(sys.tournaments.can_end_round(P1().pass_id), "can_end_round(1)");
    let next_round_option: Option<u8> = tester::execute_end_round(@sys, P1().address, P1().pass_id);
    assert!(next_round_option.is_some(), "next_round_option(1)");
    let next_round_id: u8 = next_round_option.unwrap();
    assert_eq!(next_round_id, 2, "next_round_id(1)");
    _assert_next_round(@sys, tournament_id, next_round_id, [EN_1, EN_3, EN_6].span());
    //
    // trait dueling Round 2
    let mut round: TournamentRound = sys.store.get_tournament_round(tournament_id, 2);
    round.moved_first(EN_1, EN_3);
    tester::set_TournamentRound(ref sys.world, @round);
    assert!(round.results.is_winning(EN_1), "round.results.is_winning(EN_1)_2");
    assert!(round.results.is_winning(EN_6), "round.results.is_winning(EN_6)_2");
    //
    // end_round(2)
    tester::set_block_timestamp(round.timestamps.end + 1);
    tester::impersonate(P4().address);
    assert!(sys.tournaments.can_end_round(P4().pass_id), "can_end_round(2)");
    let next_round_option: Option<u8> = tester::execute_end_round(@sys, P4().address, P4().pass_id);
    assert!(next_round_option.is_some(), "next_round_option(2)");
    let next_round_id: u8 = next_round_option.unwrap();
    assert_eq!(next_round_id, 3, "next_round_id(2)");
    _assert_next_round(@sys, tournament_id, next_round_id, [EN_1, EN_6].span());
    //
    // trait dueling Round 3
    let mut round: TournamentRound = sys.store.get_tournament_round(tournament_id, 3);
    round.moved_first(EN_6, EN_1);
    tester::set_TournamentRound(ref sys.world, @round);
    assert!(round.results.is_winning(EN_6), "round.results.is_winning(EN_6)_3");
    //
    // end tournament!
    tester::set_block_timestamp(round.timestamps.end + 1);
    tester::impersonate(P6().address);
    assert!(sys.tournaments.can_end_round(P6().pass_id), "can_end_round(3)");
    let next_round_option: Option<u8> = tester::execute_end_round(@sys, P6().address, P6().pass_id);
    assert!(next_round_option.is_none(), "next_round_option_end(3)");
    _assert_tournament_ended(@sys, tournament_id, 3, [EN_6].span());
}

#[test]
fn test_next_round_single_player() {
    let mut sys: TestSystems = setup(FLAGS::GAME | FLAGS::DUEL | FLAGS::TOURNAMENT | FLAGS::MOCK_RNG);
    let (tournament_id, _duel_ids) = _setup_start_tournament_of_6(ref sys, TournamentType::LastManStanding, [1, 2, 3, 4, 5, 6].span());
    let EN_1: u8 = P1().entry_number;
    let EN_2: u8 = P2().entry_number;
    // let EN_3: u8 = P3().entry_number;
    // let EN_4: u8 = P4().entry_number; // 6
    // let EN_5: u8 = P5().entry_number; // 4
    // let EN_6: u8 = P6().entry_number; // 5
    //
    // trait dueling Round 1
    let mut round: TournamentRound = sys.store.get_tournament_round(tournament_id, 1);
    round.moved_first(EN_1, EN_2);
    tester::set_TournamentRound(ref sys.world, @round);
    assert!(round.results.is_winning(EN_1), "round.results.is_winning(EN_1)_1");
    //
    // end tournament!
    tester::set_block_timestamp(round.timestamps.end + 1);
    tester::impersonate(P1().address);
    assert!(sys.tournaments.can_end_round(P1().pass_id), "can_end_round(1)");
    let next_round_option: Option<u8> = tester::execute_end_round(@sys, P1().address, P1().pass_id);
    assert!(next_round_option.is_none(), "next_round_option_end(1)");
    _assert_tournament_ended(@sys, tournament_id, 1, [EN_1].span());
}


#[test]
fn test_next_round_join_next() {
    let mut sys: TestSystems = setup(FLAGS::GAME | FLAGS::DUEL | FLAGS::TOURNAMENT | FLAGS::MOCK_RNG);
    let (tournament_id, duel_ids) = _setup_start_tournament_of_3(ref sys, TournamentType::LastManStanding, [1, 2, 3].span());
    let EN_1: u8 = P1().entry_number;
    let EN_3: u8 = P3().entry_number;
    //
    // P1 wins...
    let duel_id_p1: u128 = *duel_ids[0];
    let (mocked, moves_a, moves_b) = prefabs::get_moves_crit_a();
    sys.rng.mock_values(mocked);
    tester::execute_commit_moves_ID(@sys, P1().address, P1().duelist_id, duel_id_p1, moves_a.hashed);
    tester::execute_commit_moves_ID(@sys, P2().address, P2().duelist_id, duel_id_p1, moves_b.hashed);
    tester::execute_reveal_moves_ID(@sys, P1().address, P1().duelist_id, duel_id_p1, moves_a.salt, moves_a.moves);
    tester::execute_reveal_moves_ID(@sys, P2().address, P2().duelist_id, duel_id_p1, moves_b.salt, moves_b.moves);
    //
    // current state
    let round: TournamentRound = sys.store.get_tournament_round(tournament_id, 1);
    assert!(round.results.is_winning(1), "is_winning_a");
    assert!(!round.results.is_winning(2), "is_winning_b");
    assert!(round.results.is_winning(3), "is_winning_c");
    //
    // end_round(1)
    // tester::set_block_timestamp(round.timestamps.end + 1);
    tester::impersonate(P1().address);
    assert!(sys.tournaments.can_end_round(P1().pass_id), "can_end_round(1)");
    let next_round_option: Option<u8> = tester::execute_end_round(@sys, P1().address, P1().pass_id);
    assert!(next_round_option.is_some(), "next_round_option(1)");
    let next_round_id: u8 = next_round_option.unwrap();
    assert_eq!(next_round_id, 2, "next_round_id(1)");
    _assert_next_round(@sys, tournament_id, next_round_id, [EN_1, EN_3].span());
    //
    // join next round
    // join P1...
    tester::impersonate(P1().address); // needed for assertion
    assert!(sys.tournaments.can_join_duel(P1().pass_id));
    let next_duel_id_p1: u128 = tester::execute_join_duel(@sys, P1().address, P1().pass_id);
    assert!(!sys.tournaments.can_join_duel(P1().pass_id), "already_joined_p1");
    // join P3...
    tester::impersonate(P3().address); // needed for assertion
    assert!(sys.tournaments.can_join_duel(P3().pass_id));
    let next_duel_id_p3: u128 = tester::execute_join_duel(@sys, P3().address, P3().pass_id);
    assert!(!sys.tournaments.can_join_duel(P3().pass_id), "already_joined_p3");
    // check challenge
    assert_eq!(next_duel_id_p1, next_duel_id_p3, "next_duel_id");
    let ch_2: Challenge = sys.store.get_challenge(next_duel_id_p1);
    assert_eq!(ch_2.state, ChallengeState::InProgress, "ch_2.state");
    //
    // P3 wins...
    let (mocked, moves_a, moves_b) = prefabs::get_moves_crit_b();
    sys.rng.mock_values(mocked);
    tester::execute_commit_moves_ID(@sys, P1().address, P1().duelist_id, next_duel_id_p1, moves_a.hashed);
    tester::execute_commit_moves_ID(@sys, P3().address, P3().duelist_id, next_duel_id_p1, moves_b.hashed);
    tester::execute_reveal_moves_ID(@sys, P1().address, P1().duelist_id, next_duel_id_p1, moves_a.salt, moves_a.moves);
    tester::execute_reveal_moves_ID(@sys, P3().address, P3().duelist_id, next_duel_id_p1, moves_b.salt, moves_b.moves);
    //
    // end tournament!
    tester::impersonate(P3().address);
    assert!(sys.tournaments.can_end_round(P3().pass_id), "can_end_round(2)");
    let next_round_option: Option<u8> = tester::execute_end_round(@sys, P3().address, P3().pass_id);
    assert!(next_round_option.is_none(), "next_round_option_end(2)");
    _assert_tournament_ended(@sys, tournament_id, 2, [EN_3].span());
}

#[test]
fn test_next_round_join_next_incompleted_collect() {
    let mut sys: TestSystems = setup(FLAGS::GAME | FLAGS::DUEL | FLAGS::TOURNAMENT | FLAGS::MOCK_RNG);
    let (tournament_id, duel_ids) = _setup_start_tournament_of_3(ref sys, TournamentType::LastManStanding, [1, 2, 3].span());
    let EN_1: u8 = P1().entry_number;
    let EN_2: u8 = P2().entry_number;
    let EN_3: u8 = P3().entry_number;
    //
    // P1 wins...
    let duel_id_p1: u128 = *duel_ids[0];
    let (mocked, moves_a, _moves_b) = prefabs::get_moves_crit_a();
    sys.rng.mock_values(mocked);
    tester::execute_commit_moves_ID(@sys, P1().address, P1().duelist_id, duel_id_p1, moves_a.hashed);
    //
    // current state
    let round: TournamentRound = sys.store.get_tournament_round(tournament_id, 1);
    assert!(round.results.is_winning(1), "is_winning_a");
    assert!(!round.results.is_winning(2), "is_winning_b");
    assert!(round.results.is_winning(3), "is_winning_c");
    //
    // end_round(1)
    tester::set_block_timestamp(round.timestamps.end + 1);
    tester::impersonate(P3().address);
    assert!(sys.tournaments.can_end_round(P3().pass_id), "can_end_round(1)");
    let next_round_option: Option<u8> = tester::execute_end_round(@sys, P3().address, P3().pass_id);
    assert!(next_round_option.is_some(), "next_round_option(1)");
    let next_round_id: u8 = next_round_option.unwrap();
    assert_eq!(next_round_id, 2, "next_round_id(1)");
    _assert_next_round(@sys, tournament_id, next_round_id, [EN_1, EN_3].span());
    //
    // P1 collects previous challenge...
    tester::impersonate(P1().address); // needed for assertion
    assert!(sys.game.can_collect_duel(duel_id_p1), "can_collect()");
    tester::execute_collect_duel(@sys, P1().address, duel_id_p1);
    assert!(!sys.game.can_collect_duel(duel_id_p1), "!can_collect()_after");
    let ch_1: Challenge = sys.store.get_challenge(duel_id_p1);
    assert_eq!(ch_1.state, ChallengeState::Resolved, "ch_1.state_RESOLVED");
    assert_eq!(ch_1.winner, 1, "ch_1.winner");
    // make sure prev round is not affected after collect
    let round: TournamentRound = sys.store.get_tournament_round(tournament_id, 1);
    assert!(round.results.is_winning(EN_1), "is_winning(EN_1)");
    assert!(round.results.is_losing(EN_2), "is_losing(EN_2)");
    assert!(!round.results.is_playing(EN_1), "is_playing(EN_1)");
    assert!(!round.results.is_playing(EN_2), "is_playing(EN_2)");
    //
    // join P1...
    assert!(sys.tournaments.can_join_duel(P1().pass_id), "can_join()...");
    let next_duel_id_p1: u128 = tester::execute_join_duel(@sys, P1().address, P1().pass_id);
    assert!(!sys.tournaments.can_join_duel(P1().pass_id), "already_joined_p1");
    //
    // join P3...
    tester::impersonate(P3().address); // needed for assertion
    assert!(sys.tournaments.can_join_duel(P3().pass_id));
    let next_duel_id_p3: u128 = tester::execute_join_duel(@sys, P3().address, P3().pass_id);
    assert!(!sys.tournaments.can_join_duel(P3().pass_id), "already_joined_p3");
    // check challenge
    assert_eq!(next_duel_id_p1, next_duel_id_p3, "next_duel_id");
    let ch_2: Challenge = sys.store.get_challenge(next_duel_id_p1);
    assert_eq!(ch_2.state, ChallengeState::InProgress, "ch_2.state");
    // OK!
}

#[test]
fn test_next_round_join_next_incompleted_join_auto() {
    let mut sys: TestSystems = setup(FLAGS::GAME | FLAGS::DUEL | FLAGS::TOURNAMENT | FLAGS::MOCK_RNG);
    let (tournament_id, duel_ids) = _setup_start_tournament_of_3(ref sys, TournamentType::LastManStanding, [1, 2, 3].span());
    let EN_1: u8 = P1().entry_number;
    let EN_2: u8 = P2().entry_number;
    let EN_3: u8 = P3().entry_number;
    //
    // P1 wins...
    let duel_id_p1: u128 = *duel_ids[0];
    let (mocked, moves_a, _moves_b) = prefabs::get_moves_crit_a();
    sys.rng.mock_values(mocked);
    tester::execute_commit_moves_ID(@sys, P1().address, P1().duelist_id, duel_id_p1, moves_a.hashed);
    //
    // current state
    let round: TournamentRound = sys.store.get_tournament_round(tournament_id, 1);
    assert!(round.results.is_winning(1), "is_winning_a");
    assert!(!round.results.is_winning(2), "is_winning_b");
    assert!(round.results.is_winning(3), "is_winning_c");
    //
    // end_round(1)
    tester::set_block_timestamp(round.timestamps.end + 1);
    tester::impersonate(P3().address);
    assert!(sys.tournaments.can_end_round(P3().pass_id), "can_end_round(1)");
    let next_round_option: Option<u8> = tester::execute_end_round(@sys, P3().address, P3().pass_id);
    assert!(next_round_option.is_some(), "next_round_option(1)");
    let next_round_id: u8 = next_round_option.unwrap();
    assert_eq!(next_round_id, 2, "next_round_id(1)");
    _assert_next_round(@sys, tournament_id, next_round_id, [EN_1, EN_3].span());
    //
    // join P1... (auto collect)
    tester::impersonate(P1().address); // needed for assertion
    assert!(sys.tournaments.can_join_duel(P1().pass_id), "can_join()...");
    let next_duel_id_p1: u128 = tester::execute_join_duel(@sys, P1().address, P1().pass_id);
    assert!(!sys.tournaments.can_join_duel(P1().pass_id), "already_joined_p1");
    // previous challenge was collected...
    let ch_1: Challenge = sys.store.get_challenge(duel_id_p1);
    assert_eq!(ch_1.state, ChallengeState::Resolved, "ch_1.state_RESOLVED");
    assert_eq!(ch_1.winner, 1, "ch_1.winner");
    // make sure prev round is not affected after collect
    let round: TournamentRound = sys.store.get_tournament_round(tournament_id, 1);
    assert!(round.results.is_winning(EN_1), "is_winning(EN_1)");
    assert!(round.results.is_losing(EN_2), "is_losing(EN_2)");
    assert!(!round.results.is_playing(EN_1), "is_playing(EN_1)");
    assert!(!round.results.is_playing(EN_2), "is_playing(EN_2)");
    //
    // join P3...
    tester::impersonate(P3().address); // needed for assertion
    assert!(sys.tournaments.can_join_duel(P3().pass_id));
    let next_duel_id_p3: u128 = tester::execute_join_duel(@sys, P3().address, P3().pass_id);
    assert!(!sys.tournaments.can_join_duel(P3().pass_id), "already_joined_p3");
    // check challenge
    assert_eq!(next_duel_id_p1, next_duel_id_p3, "next_duel_id");
    let ch_2: Challenge = sys.store.get_challenge(next_duel_id_p1);
    assert_eq!(ch_2.state, ChallengeState::InProgress, "ch_2.state");
    //
    // P3 wins...
    let (mocked, moves_a, moves_b) = prefabs::get_moves_crit_b();
    sys.rng.mock_values(mocked);
    tester::execute_commit_moves_ID(@sys, P1().address, P1().duelist_id, next_duel_id_p1, moves_a.hashed);
    tester::execute_commit_moves_ID(@sys, P3().address, P3().duelist_id, next_duel_id_p1, moves_b.hashed);
    tester::execute_reveal_moves_ID(@sys, P1().address, P1().duelist_id, next_duel_id_p1, moves_a.salt, moves_a.moves);
    tester::execute_reveal_moves_ID(@sys, P3().address, P3().duelist_id, next_duel_id_p1, moves_b.salt, moves_b.moves);
    //
    // end tournament!
    tester::impersonate(P3().address);
    assert!(sys.tournaments.can_end_round(P3().pass_id), "can_end_round(2)");
    let next_round_option: Option<u8> = tester::execute_end_round(@sys, P3().address, P3().pass_id);
    assert!(next_round_option.is_none(), "next_round_option_end(2)");
    _assert_tournament_ended(@sys, tournament_id, 2, [EN_3].span());
}

#[test]
#[should_panic(expected: ('TOURNAMENT: Not qualified', 'ENTRYPOINT_FAILED'))]
fn test_next_round_losers_cant_join() {
    let mut sys: TestSystems = setup(FLAGS::GAME | FLAGS::DUEL | FLAGS::TOURNAMENT | FLAGS::MOCK_RNG);
    let (tournament_id, _duel_ids) = _setup_start_tournament_of_3(ref sys, TournamentType::LastManStanding, [1, 2, 3].span());
    let EN_1: u8 = P1().entry_number;
    let EN_2: u8 = P2().entry_number;
    let EN_3: u8 = P3().entry_number;
    //
    // P1 wins...
    let mut round: TournamentRound = sys.store.get_tournament_round(tournament_id, 1);
    round.finished_duel(EN_1, EN_2, true, false, 1);
    tester::set_TournamentRound(ref sys.world, @round);
    //
    // end_round(1)
    tester::set_block_timestamp(round.timestamps.end + 1);
    tester::impersonate(P3().address);
    assert!(sys.tournaments.can_end_round(P3().pass_id), "can_end_round(1)");
    let next_round_option: Option<u8> = tester::execute_end_round(@sys, P3().address, P3().pass_id);
    assert!(next_round_option.is_some(), "next_round_option(1)");
    let next_round_id: u8 = next_round_option.unwrap();
    assert_eq!(next_round_id, 2, "next_round_id(1)");
    _assert_next_round(@sys, tournament_id, next_round_id, [EN_1, EN_3].span());
    // assert results
    assert!(round.results.is_winning(EN_1), "is_winning(EN_1)");
    assert!(round.results.is_losing(EN_2), "is_losing(EN_2)");
    assert!(round.results.is_winning(EN_3), "is_winning(EN_3)");
    assert!(!round.results.is_playing(EN_1), "is_playing(EN_1)");
    assert!(!round.results.is_playing(EN_2), "is_playing(EN_2)");
    assert!(!round.results.is_playing(EN_3), "is_playing(EN_3)");
    //
    // P2 cannot join...
    tester::impersonate(P2().address); // needed for assertion
    assert!(!sys.tournaments.can_join_duel(P2().pass_id), "!can_join()");
    tester::execute_join_duel(@sys, P2().address, P2().pass_id);
}




//--------------------------------
// Scoring
//

// TODO: end_round() > check scores > next round > new scores

// TODO: end_tournament() > collect_duel() after tournament is over should not affect results
