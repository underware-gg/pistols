use pistols::models::tournament::{
    TournamentRound, TournamentRoundTrait,
    TournamentBracketTrait,
    TournamentResultsTrait,
};
use pistols::systems::rng::{RngWrap, RngWrapTrait};
use pistols::systems::rng_mock::{MockedValue, MockedValueTrait};
use pistols::types::timestamp::{Period};
use pistols::utils::bytemap::{BytemapU256};
use pistols::utils::nibblemap::{NibblemapU128};
use pistols::tests::tester::{tester};

const NIBBLE_LOSING: u8 = 0b1100;   // playing and losing
const NIBBLE_WINNING: u8 = 0b1101;  // playing and winning

fn NEW_ROUND(entry_count: u8) -> TournamentRound {
    (TournamentRound {
        tournament_id: 1,
        round_number: 1,
        entry_count,
        bracket: 0,
        results: 0,
        timestamps: Period {
            start: 0,
            end: 0,
        },
    })
}

fn _test_shuffle_all(wrapped: @RngWrap, entry_count: u8) -> @TournamentRound {
    let mut round = NEW_ROUND(entry_count);
    round.shuffle_all(wrapped, 0x3453534534534543);
    let is_odd: bool = (entry_count % 2) == 1;
    // println!("results {} : {:x}", entry_count, round.results);
    // initial results
    let mut e: u8 = 1;
    while (e <= TournamentRoundTrait::MAX_ENTRIES) {
        let expected: u8 =
            if (is_odd && e == entry_count) {
                assert!(round.results.is_winning(e), "({}) (round.results.is_winning)", e);
                assert!(!round.results.is_losing(e), "({}) (!round.results.is_losing)", e);
                (NIBBLE_WINNING)
            } else if (e <= entry_count) {
                assert!(!round.results.is_winning(e), "({}) (!round.results.is_winning)", e);
                assert!(round.results.is_losing(e), "({}) (round.results.is_losing)", e);
                (NIBBLE_LOSING)
            }
            else {0};
        assert_eq!(round.results._get_nibble(e), expected, "({}) of {} == {}", e, entry_count, expected);
        e += 1;
    };
    // check pairings
    let mut not_paired: u8 = 0;
    let mut i: usize = 0;
    while (i < round.entry_count.into()) {
        // index_a > entry_a
        let _index_a: usize = i;
        let entry_a: u256 = BytemapU256::get_byte(round.bracket, _index_a.into());
        if (entry_a == 0) {
            assert!(is_odd, "({}): is_odd", i);
            assert_eq!(not_paired, 0, "({}): not_paired", i);
            not_paired += 1;
        } else {
            // entry_a > index_b > entry_b
            let index_b: usize = (entry_a - 1).try_into().unwrap();
            let entry_b: u256 = BytemapU256::get_byte(round.bracket, index_b);
            // entry_b > back to index_a
            let index_a: usize = (entry_b - 1).try_into().unwrap();
            // println!("___entry({}): [{}]={} > [{}]={}", _index_a, index_a, entry_a, index_b, entry_b);
            assert_eq!(_index_a, index_a, "({}) _index_a", i);
            // match opponents
            let opponent_a: u256 = round.bracket.get_opponent_entry_number(entry_b.try_into().unwrap()).into();
            let opponent_b: u256 = round.bracket.get_opponent_entry_number(entry_a.try_into().unwrap()).into();
            assert_eq!(opponent_a, entry_a, "({}) opponent_a", i);
            assert_eq!(opponent_b, entry_b, "({}) opponent_b", i);
        }
        // println!("___entry({}): [{}]={}", i, _index_a, entry_a);
        i += 1;
    };
    // missing paired
    if (is_odd) {
        assert_ne!(not_paired, 0, "is_odd: not_paired={}", not_paired);
    } else {
        assert_eq!(not_paired, 0, "!is_odd: not_paired={}", not_paired);
    }
    (@round)
}

#[test]
fn test_shuffle_all_max() {
    let mut sys: tester::TestSystems = tester::setup_world(tester::FLAGS::MOCK_RNG);
    let wrapped: @RngWrap = RngWrapTrait::new(sys.rng.contract_address);
    _test_shuffle_all(wrapped, TournamentRoundTrait::MAX_ENTRIES);
}

#[test]
fn test_shuffle_all_min() {
    let mut sys: tester::TestSystems = tester::setup_world(tester::FLAGS::MOCK_RNG);
    let wrapped: @RngWrap = RngWrapTrait::new(sys.rng.contract_address);
    let round: @TournamentRound = _test_shuffle_all(wrapped, 2);
    assert_eq!((*round.bracket).get_opponent_entry_number(0), 0);
    assert_eq!((*round.bracket).get_opponent_entry_number(1), 2);
    assert_eq!((*round.bracket).get_opponent_entry_number(2), 1);
    assert_eq!((*round.bracket).get_opponent_entry_number(3), 0);
}

#[test]
fn test_shuffle_all_odd() {
    let mut sys: tester::TestSystems = tester::setup_world(tester::FLAGS::MOCK_RNG);
    let mocked: Span<MockedValue> = [
        MockedValueTrait::shuffled(TournamentRoundTrait::SHUFFLE_SALT, [1, 4, 5, 2, 3].span()),
    ].span();
    let wrapped: @RngWrap = RngWrapTrait::wrap(sys.rng.contract_address, Option::Some(mocked));
    let round: @TournamentRound = _test_shuffle_all(wrapped, 5);
    assert_eq!((*round.bracket).get_opponent_entry_number(0), 0);
    assert_eq!((*round.bracket).get_opponent_entry_number(1), 4);
    assert_eq!((*round.bracket).get_opponent_entry_number(2), 5);
    assert_eq!((*round.bracket).get_opponent_entry_number(3), 0);
    assert_eq!((*round.bracket).get_opponent_entry_number(4), 1);
    assert_eq!((*round.bracket).get_opponent_entry_number(5), 2);
    assert_eq!((*round.bracket).get_opponent_entry_number(6), 0);
}

#[test]
fn test_shuffle_all_commit_reveal() {
    let mut sys: tester::TestSystems = tester::setup_world(0);
    let mut round = NEW_ROUND(TournamentRoundTrait::MAX_ENTRIES);
    let wrapped: @RngWrap = RngWrapTrait::new(sys.rng.contract_address);
    round.shuffle_all(wrapped, 0x1234);
    // initial state
    assert_eq!(round.results._get_nibble(1), NIBBLE_LOSING, "(1) (start)");
    assert_eq!(round.results._get_nibble(2), NIBBLE_LOSING, "(2) (start)");
    assert_eq!(round.results._get_nibble(3), NIBBLE_LOSING, "(3) (start)");
    assert_eq!(round.results._get_nibble(4), NIBBLE_LOSING, "(4) (start)");
    assert_eq!(round.results._get_nibble(29), NIBBLE_LOSING, "(29) (start)");
    assert_eq!(round.results._get_nibble(30), NIBBLE_LOSING, "(30) (start)");
    assert_eq!(round.results._get_nibble(31), NIBBLE_LOSING, "(31) (start)");
    assert_eq!(round.results._get_nibble(32), NIBBLE_LOSING, "(32) (start)");
    // commit 1
    round.moved_first(1, 29);
    round.moved_first(2, 31);
    round.moved_first(4, 32);
    assert_eq!(round.results._get_nibble(1), NIBBLE_WINNING, "(1) (commit 1)");
    assert_eq!(round.results._get_nibble(2), NIBBLE_WINNING, "(2) (commit 1)");
    assert_eq!(round.results._get_nibble(3), NIBBLE_LOSING, "(3) (start)"); // no change
    assert_eq!(round.results._get_nibble(4), NIBBLE_WINNING, "(4) (commit 1)");
    assert_eq!(round.results._get_nibble(29), NIBBLE_LOSING, "(29) (commit 1)");
    assert_eq!(round.results._get_nibble(30), NIBBLE_LOSING, "(30) (start)"); // no change
    assert_eq!(round.results._get_nibble(31), NIBBLE_LOSING, "(31) (commit 1)");
    assert_eq!(round.results._get_nibble(32), NIBBLE_LOSING, "(32) (commit 1)");
    // commit 2
    round.moved_second(29, 1);
    round.moved_second(31, 2);
    round.moved_second(32, 4);
    assert_eq!(round.results._get_nibble(1), NIBBLE_LOSING, "(1) (commit 2)");
    assert_eq!(round.results._get_nibble(2), NIBBLE_LOSING, "(2) (commit 2)");
    assert_eq!(round.results._get_nibble(3), NIBBLE_LOSING, "(3) (start)"); // no change
    assert_eq!(round.results._get_nibble(4), NIBBLE_LOSING, "(4) (commit 2)");
    assert_eq!(round.results._get_nibble(29), NIBBLE_LOSING, "(29) (commit 2)");
    assert_eq!(round.results._get_nibble(30), NIBBLE_LOSING, "(30) (start)"); // no change
    assert_eq!(round.results._get_nibble(31), NIBBLE_LOSING, "(31) (commit 2)");
    assert_eq!(round.results._get_nibble(32), NIBBLE_LOSING, "(32) (commit 2)");
    // reveal 1
    round.moved_first(29, 1);
    round.moved_first(31, 2);
    round.moved_first(32, 4);
    assert_eq!(round.results._get_nibble(1), NIBBLE_LOSING, "(1) (reveal 1)");
    assert_eq!(round.results._get_nibble(2), NIBBLE_LOSING, "(2) (reveal 1)");
    assert_eq!(round.results._get_nibble(3), NIBBLE_LOSING, "(3) (start)"); // no change
    assert_eq!(round.results._get_nibble(4), NIBBLE_LOSING, "(4) (reveal 1)");
    assert_eq!(round.results._get_nibble(29), NIBBLE_WINNING, "(29) (reveal 1)");
    assert_eq!(round.results._get_nibble(30), NIBBLE_LOSING, "(30) (start)"); // no change
    assert_eq!(round.results._get_nibble(31), NIBBLE_WINNING, "(31) (reveal 1)");
    assert_eq!(round.results._get_nibble(32), NIBBLE_WINNING, "(32) (reveal 1)");
    // finished duel -- all dead
    round.finished_duel(1, 29, false, false, 0);
    round.finished_duel(2, 31, true, false, 1);
    round.finished_duel(4, 32, false, true, 2);
    assert_eq!(round.results._get_nibble(1), 0b1000, "(1) (finished dead)");
    assert_eq!(round.results._get_nibble(2), 0b1011, "(2) (finished dead)");
    assert_eq!(round.results._get_nibble(3), NIBBLE_LOSING, "(3) (start)"); // no change
    assert_eq!(round.results._get_nibble(4), 0b1000, "(4) (finished dead)");
    assert_eq!(round.results._get_nibble(29), 0b1000, "(29) (finished dead)");
    assert_eq!(round.results._get_nibble(30), NIBBLE_LOSING, "(30) (start)"); // no change
    assert_eq!(round.results._get_nibble(31), 0b1000, "(31) (finished dead)");
    assert_eq!(round.results._get_nibble(32), 0b1011, "(32) (finished dead)");
    // finished duel -- all alive
    round.finished_duel(1, 29, true, true, 0);
    round.finished_duel(2, 31, true, true, 1);
    round.finished_duel(4, 32, true, true, 2);
    assert_eq!(round.results._get_nibble(1), 0b1010, "(1) (finished alive)");
    assert_eq!(round.results._get_nibble(2), 0b1011, "(2) (finished alive)");
    assert_eq!(round.results._get_nibble(3), NIBBLE_LOSING, "(3) (start)"); // no change
    assert_eq!(round.results._get_nibble(4), 0b1010, "(4) (finished alive)");
    assert_eq!(round.results._get_nibble(29), 0b1010, "(29) (finished alive)");
    assert_eq!(round.results._get_nibble(30), NIBBLE_LOSING, "(30) (start)"); // no change
    assert_eq!(round.results._get_nibble(31), 0b1010, "(31) (finished alive)");
    assert_eq!(round.results._get_nibble(32), 0b1011, "(32) (finished alive)");
}

#[test]
fn test_shuffle_all_ended() {
    let mut sys: tester::TestSystems = tester::setup_world(0);
    let mut round = NEW_ROUND(TournamentRoundTrait::MAX_ENTRIES);
    let wrapped: @RngWrap = RngWrapTrait::new(sys.rng.contract_address);
    // commit 1
    round.shuffle_all(wrapped, 0x1234);
    round.moved_first(1, 29);
    round.moved_first(2, 31);
    round.moved_first(4, 32);
    assert!(round.results.is_winning(1), "1___(1) (is_winning)");
    assert!(round.results.is_winning(2), "1___(2) (is_winning)");
    assert!(round.results.is_winning(4), "1___(4) (is_winning)");
    assert!(round.results.is_losing(29), "1___(29) (is_losing)");
    assert!(round.results.is_losing(31), "1___(31) (is_losing)");
    assert!(round.results.is_losing(32), "1___(32) (is_losing)");
    assert!(!round.results.has_survived(1), "1___(1) (!has_survived)");
    assert!(!round.results.has_survived(2), "1___(2) (!has_survived)");
    assert!(!round.results.has_survived(4), "1___(4) (!has_survived)");
    assert!(!round.results.has_survived(29), "1___(29) (!has_survived)");
    assert!(!round.results.has_survived(31), "1___(31) (!has_survived)");
    assert!(!round.results.has_survived(32), "1___(32) (!has_survived)");
    // end round
    round.ended_round();
    assert!(round.results.is_winning(1), "1___(1) (is_winning)_ended");
    assert!(round.results.is_winning(2), "1___(2) (is_winning)_ended");
    assert!(round.results.is_winning(4), "1___(4) (is_winning)_ended");
    assert!(round.results.is_losing(29), "1___(29) (is_losing)_ended");
    assert!(round.results.is_losing(31), "1___(31) (is_losing)_ended");
    assert!(round.results.is_losing(32), "1___(32) (is_losing)_ended");
    assert!(round.results.has_survived(1), "1___(1) (!has_survived)_ended");
    assert!(round.results.has_survived(2), "1___(2) (!has_survived)_ended");
    assert!(round.results.has_survived(4), "1___(4) (!has_survived)_ended");
    assert!(!round.results.has_survived(29), "1___(29) (!has_survived)_ended");
    assert!(!round.results.has_survived(31), "1___(31) (!has_survived)_ended");
    assert!(!round.results.has_survived(32), "1___(32) (!has_survived)_ended");
    // commit in another order...
    round.shuffle_all(wrapped, 0x1234);
    round.moved_first(29, 1);
    round.moved_first(31, 2);
    round.moved_first(32, 4);
    assert!(round.results.is_losing(1), "2___(1) (is_losing)");
    assert!(round.results.is_losing(2), "2___(2) (is_losing)");
    assert!(round.results.is_losing(4), "2___(4) (is_losing)");
    assert!(round.results.is_winning(29), "2___(29) (is_winning)");
    assert!(round.results.is_winning(31), "2___(31) (is_winning)");
    assert!(round.results.is_winning(32), "2___(32) (is_winning)");
    assert!(!round.results.has_survived(1), "2___(1) (!has_survived)");
    assert!(!round.results.has_survived(2), "2___(2) (!has_survived)");
    assert!(!round.results.has_survived(4), "2___(4) (!has_survived)");
    assert!(!round.results.has_survived(29), "2___(29) (!has_survived)");
    assert!(!round.results.has_survived(31), "2___(31) (!has_survived)");
    assert!(!round.results.has_survived(32), "2___(32) (!has_survived)");
    // end round
    round.ended_round();
    assert!(round.results.is_losing(1), "2___(1) (is_losing)");
    assert!(round.results.is_losing(2), "2___(2) (is_losing)");
    assert!(round.results.is_losing(4), "2___(4) (is_losing)");
    assert!(round.results.is_winning(29), "2___(29) (is_winning)");
    assert!(round.results.is_winning(31), "2___(31) (is_winning)");
    assert!(round.results.is_winning(32), "2___(32) (is_winning)");
    assert!(!round.results.has_survived(1), "2___(1) (!has_survived)_ended");
    assert!(!round.results.has_survived(2), "2___(2) (!has_survived)_ended");
    assert!(!round.results.has_survived(4), "2___(4) (!has_survived)_ended");
    assert!(round.results.has_survived(29), "2___(29) (!has_survived)_ended");
    assert!(round.results.has_survived(31), "2___(31) (!has_survived)_ended");
    assert!(round.results.has_survived(32), "2___(32) (!has_survived)_ended");
}

#[test]
fn test_shuffle_all_finished_draw_dead() {
    let mut sys: tester::TestSystems = tester::setup_world(0);
    let mut round = NEW_ROUND(TournamentRoundTrait::MAX_ENTRIES);
    let wrapped: @RngWrap = RngWrapTrait::new(sys.rng.contract_address);
    round.shuffle_all(wrapped, 0x1234);
    let mut e: u8 = 1;
    loop {
        assert_eq!(round.results.have_all_duels_finished(), false, "({}) (false)", e);
        round.finished_duel(e, e + 1, false, false, 0);
        assert!(round.results.is_losing(e), "({}) (is_losing)", e);
        assert!(round.results.is_losing(e + 1), "({}) (is_losing)", e + 1);
        assert!(!round.results.has_survived(e), "({}) (!has_survived)", e);
        assert!(!round.results.has_survived(e + 1), "({}) (!has_survived)", e + 1);
        e += 2;
        if (e > TournamentRoundTrait::MAX_ENTRIES) { break; }
    };
    assert_eq!(round.results.have_all_duels_finished(), true, "ended (true)");
    // get survivors
    let survivors: Span<u8> = round.results.get_surviving_entries();
    assert_eq!(survivors.len(), 0, "surviving");
}

#[test]
fn test_shuffle_all_finished_draw_alive() {
    let mut sys: tester::TestSystems = tester::setup_world(0);
    let mut round = NEW_ROUND(TournamentRoundTrait::MAX_ENTRIES);
    let wrapped: @RngWrap = RngWrapTrait::new(sys.rng.contract_address);
    round.shuffle_all(wrapped, 0x1234);
    let mut e: u8 = 1;
    loop {
        assert_eq!(round.results.have_all_duels_finished(), false, "({}) (false)", e);
        round.finished_duel(e, e + 1, true, true, 0);
        assert!(round.results.is_losing(e), "({}) (is_losing)", e);
        assert!(round.results.is_losing(e + 1), "({}) (is_losing)", e + 1);
        assert!(round.results.has_survived(e), "({}) (has_survived)", e);
        assert!(round.results.has_survived(e + 1), "({}) (has_survived)", e + 1);
        e += 2;
        if (e > TournamentRoundTrait::MAX_ENTRIES) { break; }
    };
    assert_eq!(round.results.have_all_duels_finished(), true, "ended (true)");
    // get survivors
    let survivors: Span<u8> = round.results.get_surviving_entries();
    assert_eq!(survivors.len(), round.entry_count.into(), "surviving");
    let mut i: u8 = 0;
    while (i.into() < survivors.len()) {
        assert_eq!(*survivors[i.into()], i + 1, "survivors({})", i+1);
        i += 1;
    };
}

#[test]
fn test_shuffle_all_finished_win_1() {
    let mut sys: tester::TestSystems = tester::setup_world(0);
    let mut round = NEW_ROUND(TournamentRoundTrait::MAX_ENTRIES);
    let wrapped: @RngWrap = RngWrapTrait::new(sys.rng.contract_address);
    round.shuffle_all(wrapped, 0x1234);
    let mut e: u8 = 1;
    loop {
        assert_eq!(round.results.have_all_duels_finished(), false, "({}) (false)", e);
        round.finished_duel(e, e + 1, true, false, 1);
        assert!(round.results.is_winning(e), "({}) (is_winning)", e);
        assert!(round.results.is_losing(e + 1), "({}) (is_losing)", e + 1);
        assert!(round.results.has_survived(e), "({}) (has_survived)", e);
        assert!(!round.results.has_survived(e + 1), "({}) (!has_survived)", e + 1);
        e += 2;
        if (e > TournamentRoundTrait::MAX_ENTRIES) { break; }
    };
    assert_eq!(round.results.have_all_duels_finished(), true, "ended (true)");
    // get survivors
    let survivors: Span<u8> = round.results.get_surviving_entries();
    assert_eq!(survivors.len(), (round.entry_count / 2).into(), "surviving");
    let mut i: u8 = 0;
    while (i.into() < survivors.len()) {
        assert_eq!(*survivors[i.into()], (i * 2 + 1), "survivors({})", i+1);
        i += 1;
    };
}

#[test]
fn test_shuffle_all_finished_win_2() {
    let mut sys: tester::TestSystems = tester::setup_world(0);
    let mut round = NEW_ROUND(TournamentRoundTrait::MAX_ENTRIES);
    let wrapped: @RngWrap = RngWrapTrait::new(sys.rng.contract_address);
    round.shuffle_all(wrapped, 0x1234);
    let mut e: u8 = 1;
    loop {
        assert_eq!(round.results.have_all_duels_finished(), false, "({}) (false)", e);
        round.finished_duel(e, e + 1, false, true, 2);
        assert!(round.results.is_losing(e), "({}) (is_losing)", e);
        assert!(round.results.is_winning(e + 1), "({}) (is_winning)", e + 1);
        assert!(!round.results.has_survived(e), "({}) (!has_survived)", e);
        assert!(round.results.has_survived(e + 1), "({}) (has_survived)", e + 1);
        e += 2;
        if (e > TournamentRoundTrait::MAX_ENTRIES) { break; }
    };
    assert_eq!(round.results.have_all_duels_finished(), true, "ended (true)");
    // get survivors
    let survivors: Span<u8> = round.results.get_surviving_entries();
    assert_eq!(survivors.len(), (round.entry_count / 2).into(), "surviving");
    let mut i: u8 = 0;
    while (i.into() < survivors.len()) {
        assert_eq!(*survivors[i.into()], (i * 2 + 2), "survivors({})", i+1);
        i += 1;
    };
}

#[test]
fn test_shuffle_all_finished_win_1_alive() {
    let mut sys: tester::TestSystems = tester::setup_world(0);
    let mut round = NEW_ROUND(TournamentRoundTrait::MAX_ENTRIES);
    let wrapped: @RngWrap = RngWrapTrait::new(sys.rng.contract_address);
    round.shuffle_all(wrapped, 0x1234);
    let mut e: u8 = 1;
    loop {
        assert_eq!(round.results.have_all_duels_finished(), false, "({}) (false)", e);
        round.finished_duel(e, e + 1, true, true, 1);
        assert!(round.results.is_winning(e), "({}) (is_winning)", e);
        assert!(round.results.is_losing(e + 1), "({}) (is_losing)", e + 1);
        assert!(round.results.has_survived(e), "({}) (has_survived)", e);
        assert!(round.results.has_survived(e + 1), "({}) (has_survived)", e + 1);
        e += 2;
        if (e > TournamentRoundTrait::MAX_ENTRIES) { break; }
    };
    assert_eq!(round.results.have_all_duels_finished(), true, "ended (true)");
    // get survivors
    let survivors: Span<u8> = round.results.get_surviving_entries();
    assert_eq!(survivors.len(), round.entry_count.into(), "surviving");
    let mut i: u8 = 0;
    while (i.into() < survivors.len()) {
        assert_eq!(*survivors[i.into()], i + 1, "survivors({})", i+1);
        i += 1;
    };
}

#[test]
fn test_shuffle_all_finished_win_2_alive() {
    let mut sys: tester::TestSystems = tester::setup_world(0);
    let mut round = NEW_ROUND(TournamentRoundTrait::MAX_ENTRIES);
    let wrapped: @RngWrap = RngWrapTrait::new(sys.rng.contract_address);
    round.shuffle_all(wrapped, 0x1234);
    let mut e: u8 = 1;
    loop {
        assert_eq!(round.results.have_all_duels_finished(), false, "({}) (false)", e);
        round.finished_duel(e, e + 1, true, true, 2);
        assert!(round.results.is_losing(e), "({}) (is_losing)", e);
        assert!(round.results.is_winning(e + 1), "({}) (is_winning)", e + 1);
        assert!(round.results.has_survived(e), "({}) (has_survived)", e);
        assert!(round.results.has_survived(e + 1), "({}) (has_survived)", e + 1);
        e += 2;
        if (e > TournamentRoundTrait::MAX_ENTRIES) { break; }
    };
    assert_eq!(round.results.have_all_duels_finished(), true, "ended (true)");
    // get survivors
    let survivors: Span<u8> = round.results.get_surviving_entries();
    assert_eq!(survivors.len(), round.entry_count.into(), "surviving");
    let mut i: u8 = 0;
    while (i.into() < survivors.len()) {
        assert_eq!(*survivors[i.into()], i + 1, "survivors({})", i+1);
        i += 1;
    };
}
