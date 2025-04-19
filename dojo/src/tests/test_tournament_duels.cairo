use starknet::{ContractAddress};
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
        PLAYERS as P,
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
        // TournamentEntry,
        // Tournament, TournamentType,
        TournamentRound, TournamentRoundTrait,
        TournamentRoundValue,
        TournamentBracketTrait,
        TournamentResultsTrait,
        // TournamentSettings, TournamentSettingsValue,
        // TournamentDuelKeys,
        // ChallengeToTournamentValue, TournamentToChallengeValue,
    },
};
use pistols::types::{
    challenge_state::{ChallengeState},
    timestamp::{TIMESTAMP},
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
        ZERO, OWNER,
        // OWNED_BY_OWNER, OWNED_BY_OTHER,
        // ITournamentTokenDispatcherTrait,
        IBudokanMockDispatcherTrait,
        IRngMockDispatcherTrait,
        IGameDispatcherTrait,
    },
};
use pistols::tests::prefabs::{prefabs};
use pistols::tests::test_tournament::{
    setup, _mint,
    // _protected_duel,
    // SETTINGS_ID,
    TIMESTAMP_START,
    // TIMESTAMP_END,
};

// use tournaments::components::{
//     models::{
//         game::{TokenMetadata},
//         lifecycle::{Lifecycle},
//     },
//     libs::{
//         lifecycle::{LifecycleTrait},
//     },
// };


fn _setup_budokan(sys: @TestSystems, tournament_id: u64, shuffled: Span<felt252>) {
    (*sys.budokan).set_tournament_id(tournament_id);
    let mocked: Span<MockedValue> = [
        MockedValueTrait::shuffled(TournamentRoundTrait::SHUFFLE_SALT, shuffled),
    ].span();
    (*sys.rng).mock_values(mocked);
}

fn _setup_start_tournament_of_2(ref sys: TestSystems, shuffled: Span<felt252>) -> (u64, Span<u128>) {
    _setup_budokan(@sys, TOURNAMENT_OF_2, shuffled);
    // mint all
    _mint(ref sys, P::P1().address);
    _mint(ref sys, P::P2().address);
    // enlist all
    tester::execute_enlist_duelist(@sys, P::P1().address, P::P1().entry_id, P::P1().duelist_id);
    tester::execute_enlist_duelist(@sys, P::P2().address, P::P2().entry_id, P::P2().duelist_id);
    // start tournament
    tester::set_block_timestamp(TIMESTAMP_START);
    let tournament_id: u64 = tester::execute_start_tournament(@sys,  P::P1().address, P::P1().entry_id);
    // join all
    let duel_ids: Span<u128> = [
        tester::execute_join_duel(@sys, P::P1().address, P::P1().entry_id),
        tester::execute_join_duel(@sys, P::P2().address, P::P2().entry_id),
    ].span();
    (tournament_id, duel_ids)
}

fn _setup_start_tournament_of_3(ref sys: TestSystems, shuffled: Span<felt252>) -> (u64, Span<u128>) {
    _setup_budokan(@sys, TOURNAMENT_OF_3, shuffled);
    // mint all
    _mint(ref sys, P::P1().address);
    _mint(ref sys, P::P2().address);
    _mint(ref sys, P::P3().address);
    // enlist all
    tester::execute_enlist_duelist(@sys, P::P1().address, P::P1().entry_id, P::P1().duelist_id);
    tester::execute_enlist_duelist(@sys, P::P2().address, P::P2().entry_id, P::P2().duelist_id);
    tester::execute_enlist_duelist(@sys, P::P3().address, P::P3().entry_id, P::P3().duelist_id);
    // start tournament
    tester::set_block_timestamp(TIMESTAMP_START);
    let tournament_id: u64 = tester::execute_start_tournament(@sys,  P::P1().address, P::P1().entry_id);
    // join all
    let duel_ids: Span<u128> = [
        tester::execute_join_duel(@sys, P::P1().address, P::P1().entry_id),
        tester::execute_join_duel(@sys, P::P2().address, P::P2().entry_id),
        tester::execute_join_duel(@sys, P::P3().address, P::P3().entry_id),
    ].span();
    (tournament_id, duel_ids)
}

fn _setup_start_tournament_of_6(ref sys: TestSystems, shuffled: Span<felt252>) -> (u64, Span<u128>) {
    _setup_budokan(@sys, TOURNAMENT_OF_6, shuffled);
    // mint all
    _mint(ref sys, P::P1().address);
    _mint(ref sys, P::P2().address);
    _mint(ref sys, P::P3().address);
    _mint(ref sys, P::P4().address);
    _mint(ref sys, P::P5().address);
    _mint(ref sys, P::P6().address);
    // enlist all
    tester::execute_enlist_duelist(@sys, P::P1().address, P::P1().entry_id, P::P1().duelist_id);
    tester::execute_enlist_duelist(@sys, P::P2().address, P::P2().entry_id, P::P2().duelist_id);
    tester::execute_enlist_duelist(@sys, P::P3().address, P::P3().entry_id, P::P3().duelist_id);
    tester::execute_enlist_duelist(@sys, P::P4().address, P::P4().entry_id, P::P4().duelist_id);
    tester::execute_enlist_duelist(@sys, P::P5().address, P::P5().entry_id, P::P5().duelist_id);
    tester::execute_enlist_duelist(@sys, P::P6().address, P::P6().entry_id, P::P6().duelist_id);
    // start tournament
    tester::set_block_timestamp(TIMESTAMP_START);
    let tournament_id: u64 = tester::execute_start_tournament(@sys,  P::P1().address, P::P1().entry_id);
    // join all
    let duel_ids: Span<u128> = [
        tester::execute_join_duel(@sys, P::P1().address, P::P1().entry_id),
        tester::execute_join_duel(@sys, P::P2().address, P::P2().entry_id),
        tester::execute_join_duel(@sys, P::P3().address, P::P3().entry_id),
        tester::execute_join_duel(@sys, P::P4().address, P::P4().entry_id),
        tester::execute_join_duel(@sys, P::P5().address, P::P5().entry_id),
        tester::execute_join_duel(@sys, P::P6().address, P::P6().entry_id),
    ].span();
    (tournament_id, duel_ids)
}

//--------------------------------
// Duels
//

#[test]
fn test_bracket_mock_shuffle() {
    let mut sys: TestSystems = setup(3, FLAGS::GAME | FLAGS::DUEL | FLAGS::TOURNAMENT | FLAGS::MOCK_RNG);
    let P1: ContractAddress = P::P1().address;
    let ID_P1: u128 = P::P1().duelist_id;
    //
    // >> 5 entries tournament
    _setup_budokan(@sys, TOURNAMENT_OF_5, [1, 3, 5, 4, 2].span());
    //
    // mint+enlist 1
    _mint(ref sys, P1);
    tester::execute_enlist_duelist(@sys, P1, P::P1().entry_id, ID_P1);
    //
    // start tournament
    tester::set_block_timestamp(TIMESTAMP_START);
    let tournament_id: u64 = tester::execute_start_tournament(@sys, P1, P::P1().entry_id);
    //
    // round
    let round: TournamentRoundValue = sys.store.get_tournament_round_value(tournament_id, 1);
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
fn test_tournament_commit_reveal_a_b() {
    let mut sys: TestSystems = setup(3, FLAGS::GAME | FLAGS::DUEL | FLAGS::TOURNAMENT | FLAGS::MOCK_RNG);
    let P1: ContractAddress = P::P1().address;
    let P2: ContractAddress = P::P2().address;
    let P3: ContractAddress = P::P3().address;
    let ID_P1: u128 = P::P1().duelist_id;
    let ID_P2: u128 = P::P2().duelist_id;
    let ID_P3: u128 = P::P3().duelist_id;
    //
    // >> 3 entries tournament
    let (tournament_id, duel_ids) = _setup_start_tournament_of_3(ref sys, [1, 2, 3].span());
    let duel_id_p1: u128 = *duel_ids[0];
    let duel_id_p2: u128 = *duel_ids[1];
    let duel_id_p3: u128 = *duel_ids[2]; // wins!
    //
    // initial state
    let round: TournamentRound = sys.store.get_tournament_round(tournament_id, 1);
    assert_ne!(round.bracket, 0);
    assert_ne!(round.results, 0);
    // round
    let round: TournamentRoundValue = sys.store.get_tournament_round_value(tournament_id, 1);
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
    assert_eq!(ch_3.address_a, P3, "ch_3.address_a");
    assert_eq!(ch_3.duelist_id_a, ID_P3, "ch_3.duelist_id_a");
    assert_eq!(ch_3.address_b, ZERO(), "ch_3.address_b");
    assert_eq!(ch_3.duelist_id_b, 0, "ch_3.duelist_id_b");
    //
    // P1-P2 duel started
    assert_eq!(duel_id_p1, duel_id_p2, "duel_id_p1 == duel_id_p2");
    let ch_1: Challenge = sys.store.get_challenge(duel_id_p1);
    assert_eq!(ch_1.duel_type, DuelType::Tournament, "ch_1.duel_type");
    assert_eq!(ch_1.state, ChallengeState::InProgress, "ch_1.state");
    assert_eq!(ch_1.address_a, P1, "ch_1.address_a");
    assert_eq!(ch_1.duelist_id_a, ID_P1, "ch_1.duelist_id_a");
    assert_eq!(ch_1.address_b, P2, "ch_1.address_b");
    assert_eq!(ch_1.duelist_id_b, ID_P2, "ch_1.duelist_id_b");
    //
    // commit/reveal
    let (mocked, moves_a, moves_b) = prefabs::get_moves_crit_a();
    sys.rng.mock_values(mocked);
    tester::execute_commit_moves_ID(@sys.game, P1, ID_P1, duel_id_p1, moves_a.hashed);
    let round: TournamentRoundValue = sys.store.get_tournament_round_value(tournament_id, 1);
    assert!(round.results.is_winning(1), "commit_p1_a");
    assert!(!round.results.is_winning(2), "commit_p1_b");
    tester::execute_commit_moves_ID(@sys.game, P2, ID_P2, duel_id_p1, moves_b.hashed);
    let round: TournamentRoundValue = sys.store.get_tournament_round_value(tournament_id, 1);
    assert!(!round.results.is_winning(1), "commit_p2_a");
    assert!(!round.results.is_winning(2), "commit_p2_b");
    tester::execute_reveal_moves_ID(@sys.game, P1, ID_P1, duel_id_p1, moves_a.salt, moves_a.moves);
    let round: TournamentRoundValue = sys.store.get_tournament_round_value(tournament_id, 1);
    assert!(round.results.is_winning(1), "reveal_p1_a");
    assert!(!round.results.is_winning(2), "reveal_p1_b");
    assert!(round.results.is_playing(1), "round.results.is_playing(1)");
    assert!(round.results.is_playing(2), "round.results.is_playing(2)");
    // last move!
    tester::execute_reveal_moves_ID(@sys.game, P2, ID_P2, duel_id_p1, moves_b.salt, moves_b.moves);
    let round: TournamentRoundValue = sys.store.get_tournament_round_value(tournament_id, 1);
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
fn test_tournament_commit_reveal_b_a() {
    let mut sys: TestSystems = setup(3, FLAGS::GAME | FLAGS::DUEL | FLAGS::TOURNAMENT | FLAGS::MOCK_RNG);
    let P1: ContractAddress = P::P1().address;
    let P2: ContractAddress = P::P2().address;
    let ID_P1: u128 = P::P1().duelist_id;
    let ID_P2: u128 = P::P2().duelist_id;
    //
    // >> 3 entries tournament
    let (tournament_id, duel_ids) = _setup_start_tournament_of_2(ref sys, [1, 2].span());
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
    tester::execute_commit_moves_ID(@sys.game, P2, ID_P2, duel_id_p1, moves_b.hashed);
    let round: TournamentRoundValue = sys.store.get_tournament_round_value(tournament_id, 1);
    assert!(!round.results.is_winning(1), "commit_p1_a");
    assert!(round.results.is_winning(2), "commit_p1_b");
    tester::execute_commit_moves_ID(@sys.game, P1, ID_P1, duel_id_p1, moves_a.hashed);
    let round: TournamentRoundValue = sys.store.get_tournament_round_value(tournament_id, 1);
    assert!(!round.results.is_winning(1), "commit_p2_a");
    assert!(!round.results.is_winning(2), "commit_p2_b");
    tester::execute_reveal_moves_ID(@sys.game, P2, ID_P2, duel_id_p1, moves_b.salt, moves_b.moves);
    let round: TournamentRoundValue = sys.store.get_tournament_round_value(tournament_id, 1);
    assert!(!round.results.is_winning(1), "reveal_p1_a");
    assert!(round.results.is_winning(2), "reveal_p1_b");
    assert!(round.results.is_playing(1), "round.results.is_playing(1)");
    assert!(round.results.is_playing(2), "round.results.is_playing(2)");
    // last move!
    tester::execute_reveal_moves_ID(@sys.game, P1, ID_P1, duel_id_p1, moves_a.salt, moves_a.moves);
    let round: TournamentRoundValue = sys.store.get_tournament_round_value(tournament_id, 1);
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
fn test_tournament_commit_reveal_draw_dead() {
    let mut sys: TestSystems = setup(3, FLAGS::GAME | FLAGS::DUEL | FLAGS::TOURNAMENT | FLAGS::MOCK_RNG);
    let (tournament_id, duel_ids) = _setup_start_tournament_of_2(ref sys, [1, 2].span());
    let P1: ContractAddress = P::P1().address;
    let P2: ContractAddress = P::P2().address;
    let ID_P1: u128 = P::P1().duelist_id;
    let ID_P2: u128 = P::P2().duelist_id;
    //
    // P1-P2 duel started
    let duel_id_p1: u128 = *duel_ids[0];
    let ch_1: Challenge = sys.store.get_challenge(duel_id_p1);
    assert_eq!(ch_1.lives_staked, 3, "ch_1.lives_staked");
    let (mocked, moves_a, moves_b) = prefabs::get_moves_dual_crit();
    sys.rng.mock_values(mocked);
    tester::execute_commit_moves_ID(@sys.game, P1, ID_P1, duel_id_p1, moves_a.hashed);
    tester::execute_commit_moves_ID(@sys.game, P2, ID_P2, duel_id_p1, moves_b.hashed);
    tester::execute_reveal_moves_ID(@sys.game, P2, ID_P2, duel_id_p1, moves_b.salt, moves_b.moves);
    tester::execute_reveal_moves_ID(@sys.game, P1, ID_P1, duel_id_p1, moves_a.salt, moves_a.moves);
    let round: TournamentRoundValue = sys.store.get_tournament_round_value(tournament_id, 1);
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
fn test_tournament_commit_reveal_draw_alive() {
    let mut sys: TestSystems = setup(1, FLAGS::GAME | FLAGS::DUEL | FLAGS::TOURNAMENT | FLAGS::MOCK_RNG);
    let (tournament_id, duel_ids) = _setup_start_tournament_of_2(ref sys, [1, 2].span());
    let P1: ContractAddress = P::P1().address;
    let P2: ContractAddress = P::P2().address;
    let ID_P1: u128 = P::P1().duelist_id;
    let ID_P2: u128 = P::P2().duelist_id;
    //
    // P1-P2 duel started
    let duel_id_p1: u128 = *duel_ids[0];
    let ch_1: Challenge = sys.store.get_challenge(duel_id_p1);
    assert_eq!(ch_1.lives_staked, 1, "ch_1.lives_staked");
    let (mocked, moves_a, moves_b) = prefabs::get_moves_dual_crit();
    sys.rng.mock_values(mocked);
    tester::execute_commit_moves_ID(@sys.game, P2, ID_P2, duel_id_p1, moves_b.hashed);
    tester::execute_commit_moves_ID(@sys.game, P1, ID_P1, duel_id_p1, moves_a.hashed);
    tester::execute_reveal_moves_ID(@sys.game, P1, ID_P1, duel_id_p1, moves_a.salt, moves_a.moves);
    tester::execute_reveal_moves_ID(@sys.game, P2, ID_P2, duel_id_p1, moves_b.salt, moves_b.moves);
    let round: TournamentRoundValue = sys.store.get_tournament_round_value(tournament_id, 1);
    assert!(!round.results.is_winning(1), "finished_a");
    assert!(!round.results.is_winning(2), "finished_b");
    assert!(round.results.has_survived(1), "has_survived_a");
    assert!(round.results.has_survived(2), "has_survived_b");
    let survivors: Span<u8> = round.results.get_surviving_entries();
    assert_eq!(survivors.len(), 2, "survivors.len()");
}

#[test]
fn test_tournament_commit_reveal_expire_collect_a() {
    let mut sys: TestSystems = setup(3, FLAGS::GAME | FLAGS::DUEL | FLAGS::TOURNAMENT | FLAGS::MOCK_RNG);
    let (tournament_id, duel_ids) = _setup_start_tournament_of_2(ref sys, [1, 2].span());
    let P1: ContractAddress = P::P1().address;
    let ID_P1: u128 = P::P1().duelist_id;
    //
    // P1-P2 duel started
    let duel_id_p1: u128 = *duel_ids[0];
    let (mocked, moves_a, _moves_b) = prefabs::get_moves_dual_crit();
    sys.rng.mock_values(mocked);
    tester::execute_commit_moves_ID(@sys.game, P1, ID_P1, duel_id_p1, moves_a.hashed);
    let round: TournamentRoundValue = sys.store.get_tournament_round_value(tournament_id, 1);
    assert!(round.results.is_winning(1), "commit_a");
    assert!(!round.results.is_winning(2), "commit_b");
    //
    // expire duel
    assert!(!sys.game.can_collect_duel(duel_id_p1), "!can_collect()");
    tester::elapse_block_timestamp(TIMESTAMP::ONE_DAY + 1);
    assert!(sys.game.can_collect_duel(duel_id_p1), "can_collect()");
    tester::execute_collect_duel(@sys.game, P1, duel_id_p1);
    assert!(!sys.game.can_collect_duel(duel_id_p1), "!can_collect()_after");
    // check round
    let round: TournamentRoundValue = sys.store.get_tournament_round_value(tournament_id, 1);
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
fn test_tournament_commit_reveal_expire_collect_b() {
    let mut sys: TestSystems = setup(3, FLAGS::GAME | FLAGS::DUEL | FLAGS::TOURNAMENT | FLAGS::MOCK_RNG);
    let (tournament_id, duel_ids) = _setup_start_tournament_of_2(ref sys, [1, 2].span());
    let P2: ContractAddress = P::P2().address;
    let ID_P2: u128 = P::P2().duelist_id;
    //
    // P1-P2 duel started
    let duel_id_p1: u128 = *duel_ids[0];
    let (mocked, _moves_a, moves_b) = prefabs::get_moves_dual_crit();
    sys.rng.mock_values(mocked);
    tester::execute_commit_moves_ID(@sys.game, P2, ID_P2, duel_id_p1, moves_b.hashed);
    let round: TournamentRoundValue = sys.store.get_tournament_round_value(tournament_id, 1);
    assert!(!round.results.is_winning(1), "commit_a");
    assert!(round.results.is_winning(2), "commit_b");
    //
    // expire duel
    assert!(!sys.game.can_collect_duel(duel_id_p1), "!can_collect()");
    tester::elapse_block_timestamp(TIMESTAMP::ONE_DAY + 1);
    assert!(sys.game.can_collect_duel(duel_id_p1), "can_collect()");
    tester::execute_collect_duel(@sys.game, P2, duel_id_p1);
    assert!(!sys.game.can_collect_duel(duel_id_p1), "!can_collect()_after");
    // check round
    let round: TournamentRoundValue = sys.store.get_tournament_round_value(tournament_id, 1);
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
fn test_tournament_commit_reveal_expire_collect_a_b() {
    let mut sys: TestSystems = setup(3, FLAGS::GAME | FLAGS::DUEL | FLAGS::TOURNAMENT | FLAGS::MOCK_RNG);
    let (tournament_id, duel_ids) = _setup_start_tournament_of_2(ref sys, [1, 2].span());
    //
    // P1-P2 duel started
    let duel_id_p1: u128 = *duel_ids[0];
    let ch_1: Challenge = sys.store.get_challenge(duel_id_p1);
    assert_eq!(ch_1.state, ChallengeState::InProgress, "ch_1.state");
    let round: TournamentRoundValue = sys.store.get_tournament_round_value(tournament_id, 1);
    assert!(!round.results.is_winning(1), "commit_a");
    assert!(!round.results.is_winning(2), "commit_b");
    //
    // expire duel
    assert!(!sys.game.can_collect_duel(duel_id_p1), "!can_collect()");
    tester::elapse_block_timestamp(TIMESTAMP::ONE_DAY + 1);
    assert!(sys.game.can_collect_duel(duel_id_p1), "can_collect()");
    tester::execute_collect_duel(@sys.game, OWNER(), duel_id_p1);
    assert!(!sys.game.can_collect_duel(duel_id_p1), "!can_collect()_after");
    // check round
    let round: TournamentRoundValue = sys.store.get_tournament_round_value(tournament_id, 1);
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
fn test_tournament_commit_reveal_bad_pair() {
    let mut sys: TestSystems = setup(3, FLAGS::GAME | FLAGS::DUEL | FLAGS::TOURNAMENT | FLAGS::MOCK_RNG);
    let (_tournament_id, duel_ids) = _setup_start_tournament_of_3(ref sys, [1, 3, 2].span());
    // let P1: ContractAddress = P::P1().address;
    let P2: ContractAddress = P::P2().address;
    // let ID_P1: u128 = P::P1().duelist_id;
    let ID_P2: u128 = P::P2().duelist_id;
    // trait dueling
    let duel_id_p1: u128 = *duel_ids[0];
    let (mocked, moves_a, _moves_b) = prefabs::get_moves_crit_b();
    sys.rng.mock_values(mocked);
    tester::execute_commit_moves_ID(@sys.game, P2, ID_P2, duel_id_p1, moves_a.hashed);
    // panic!
}



//--------------------------------
// commit/reveal using TournamentResultsTrait
//

#[test]
fn test_tournament_commit_reveal_a_b_traits_baseline() {
    let mut sys: TestSystems = setup(3, FLAGS::GAME | FLAGS::DUEL | FLAGS::TOURNAMENT | FLAGS::MOCK_RNG);
    let (tournament_id, _duel_ids) = _setup_start_tournament_of_3(ref sys, [1, 2, 3].span());
    let EN_1: u8 = P::P1().entry_number;
    let EN_2: u8 = P::P2().entry_number;
    let EN_3: u8 = P::P3().entry_number;
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
    assert_eq!(*survivors[0], EN_1, "survivors[0]");
    assert_eq!(*survivors[1], EN_3, "survivors[1]");
}

#[test]
fn test_tournament_commit_reveal_b_a_traits_baseline() {
    let mut sys: TestSystems = setup(3, FLAGS::GAME | FLAGS::DUEL | FLAGS::TOURNAMENT | FLAGS::MOCK_RNG);
    let (tournament_id, _duel_ids) = _setup_start_tournament_of_2(ref sys, [1, 2].span());
    let EN_1: u8 = P::P1().entry_number;
    let EN_2: u8 = P::P2().entry_number;
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
    assert_eq!(*survivors[0], EN_2, "survivors[0]");
}

#[test]
fn test_tournament_commit_reveal_shuffled() {
    let mut sys: TestSystems = setup(3, FLAGS::GAME | FLAGS::DUEL | FLAGS::TOURNAMENT | FLAGS::MOCK_RNG);
    let (tournament_id, _duel_ids) = _setup_start_tournament_of_6(ref sys, [6, 1, 2, 5, 4, 3].span());
    let EN_1: u8 = P::P1().entry_number;
    let EN_2: u8 = P::P2().entry_number;
    let EN_3: u8 = P::P3().entry_number;
    let EN_4: u8 = P::P4().entry_number; // 6
    let EN_5: u8 = P::P5().entry_number; // 4
    let EN_6: u8 = P::P6().entry_number; // 5
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

#[test]
#[ignore]
// TODO: enable when end_round() is implemented
fn test_tournament_commit_reveal_incomplete() {
    let mut sys: TestSystems = setup(3, FLAGS::GAME | FLAGS::DUEL | FLAGS::TOURNAMENT | FLAGS::MOCK_RNG);
    let (tournament_id, _duel_ids) = _setup_start_tournament_of_6(ref sys, [1, 2, 3, 4, 5, 6].span());
    let EN_1: u8 = P::P1().entry_number;
    let EN_2: u8 = P::P2().entry_number;
    let EN_3: u8 = P::P3().entry_number;
    let EN_4: u8 = P::P4().entry_number; // 6
    let EN_5: u8 = P::P5().entry_number; // 4
    let EN_6: u8 = P::P6().entry_number; // 5
    //
    // run duel with traits
    let mut round: TournamentRound = sys.store.get_tournament_round(tournament_id, 1);
    //
    // trait dueling
    round.moved_first(EN_1, EN_2);
    assert!(round.results.is_winning(EN_1), "finished_duel_1_a");
    assert!(!round.results.is_winning(EN_2), "finished_duel_1_b");
    round.moved_first(EN_4, EN_3);
    assert!(round.results.is_winning(EN_4), "finished_duel_2_a");
    assert!(!round.results.is_winning(EN_3), "finished_duel_2_b");
    round.moved_second(EN_5, EN_6);
    assert!(!round.results.is_winning(EN_5), "finished_duel_3_a");
    assert!(!round.results.is_winning(EN_6), "finished_duel_3_b");
    // finished!
    let survivors: Span<u8> = round.results.get_surviving_entries();
    assert_eq!(survivors.len(), 2, "survivors.len()");
// println!("survivors: {}, {}, {} / {} {} {}", EN_6, EN_2, EN_3, *survivors[0], *survivors[1], *survivors[2]);
    assert!(survivors.contains(@EN_1), "survivors[0]");
    assert!(survivors.contains(@EN_4), "survivors[1]");
    assert!(!round.results.have_all_duels_finished(), "round.results.have_all_duels_finished()");
}


//--------------------------------
// Tournament Round
//

// TODO: end_round() OK before deadline, if all completed
// TODO: end_round() PANIC before deadline
// TODO: end_round() PANIC twice

// TODO: single round tournament > finish tournament after 1st duel > !can_start_round()

// TODO: collect tournament round > all duels completed
// TODO: collect tournament round > missing duels

// TODO: multi round tournament > [A] vs B + C vs [D] > A vs D
// TODO: multi round tournament > !can_finish() > duel more > finish tournament
// TODO: multi round tournament > single winner > finish tournament

// TODO: multi round tournament > missing wins from 1st round > collect and continue
// TODO: multi round tournament > missing draws from 1st round > cannot collect, cannot continue

// TODO: end_tournament() > collect_duel() after tournament is over should not affect results
