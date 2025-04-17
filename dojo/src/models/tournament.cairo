use pistols::types::timestamp::{Period};

//------------------------------------
// Tournament entry (tournament_token)
//
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct TournamentEntry {
    #[key]
    pub entry_id: u64,              // token id
    //------
    pub tournament_id: u64,         // budokan tournament_id
    pub entry_number: u8,           // entry number in the tournament
    pub duelist_id: u128,           // enlisted duelist id
    // progress
    pub current_round_number: u8,   // current round this player is in
    pub score: u32,                 // budokan score (Fame less decimals)
    pub fame: u128,                 // duelist FAME
}

//------------------------------------
// Budokan settings
//
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct TournamentSettings {
    #[key]
    pub settings_id: u32,
    //------
    pub tournament_type: TournamentType,
    pub min_lives: u8,
    pub max_lives: u8,
    pub lives_staked: u8,
}

#[derive(Serde, Copy, Drop, PartialEq, Introspect)]
pub enum TournamentType {
    Undefined,          // 0
    LastManStanding,    // 1
    // HighestScore,       // 2
}

pub mod TOURNAMENT_SETTINGS {
    pub const LAST_MAN_STANDING: u32 = 1;
    // pub const HIGHEST_SCORE: u32 = 2;
}

//------------------------------------
// Tournament loop
//
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct Tournament {
    #[key]
    pub tournament_id: u64,         // budokan id
    //------
    pub current_round_number: u8,   // current round, zero if not started yet
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct TournamentRound {
    #[key]
    pub tournament_id: u64,     // budokan id
    #[key]
    pub round_number: u8,
    //------
    pub entry_count: u8,        // participating in this round, maximum of 32
    pub timestamps: Period,     // will never expire after tournament
    // bracket (duelist pairings): 32 bytes, one for each duelist
    // ex: duel between 4 and 7: byte[4-1] = 7, byte[7-1] = 4
    pub bracket: u256,
    // results: 32 nibbles (4-bit), one for each duelist
    // bit 0 (0b0001): 1 = duelist is winning or won / 0 = duelist is losing or lost
    // bit 1 (0b0010): 1 = duelist survived / 0 = duelist dead or not qualified
    // bit 2 (0b0100): 1 = duelist is still playing / 0 = duelist finished playing
    // bit 3 (0b1000): 1 = duelist is participating in this round / 0 = empty slot
    // ps1: never 2 paired duelists are both winning
    // ps2: all winners go to the next round, losers only if finished and survived
    pub results: u128,
}

//------------------------------------
// Links tournament rounds to its Duels
//
// TournamentToChallenge: required for player B to find the duel created by player A
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct TournamentToChallenge {
    #[key]
    pub keys: TournamentDuelKeys,
    //-------------------------
    pub duel_id: u128,
}
// ChallengeToTournament: required to settle results of a duel in the tournament
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct ChallengeToTournament {
    #[key]
    pub duel_id: u128,
    //-------------------------
    pub keys: TournamentDuelKeys,
}

#[derive(Copy, Drop, Serde, IntrospectPacked)]
pub struct TournamentDuelKeys {
    pub tournament_id: u64,
    pub round_number: u8,
    pub entry_number_a: u8,     // min(entry_number_a, entry_number_b)
    pub entry_number_b: u8,     // max(entry_number_a, entry_number_b)
}



//---------------------------
// Traits
//
use core::num::traits::Zero;
use pistols::systems::rng::{RngWrap, Shuffle, ShuffleTrait};
use pistols::utils::bitwise::{BitwiseU128};
use pistols::utils::bytemap::{BytemapU256};
use pistols::utils::nibblemap::{NibblemapU128};

#[generate_trait]
pub impl TournamentSettingsValueImpl of TournamentSettingsValueTrait {
    fn exists(self: @TournamentSettingsValue) -> bool {
        (*self.tournament_type != TournamentType::Undefined)
    }
}

#[generate_trait]
pub impl TournamentDuelKeysImpl of TournamentDuelKeysTrait {
    fn new(
        tournament_id: u64,
        round_number: u8,
        entry_number: u8,
        opponent_entry_number: u8,
    ) -> @TournamentDuelKeys {
        let duelist_number: u8 = if (entry_number < opponent_entry_number || opponent_entry_number.is_zero()) {1} else {2};
        (@TournamentDuelKeys {
            tournament_id,
            round_number,
            entry_number_a: if (duelist_number == 1) {entry_number} else {opponent_entry_number},
            entry_number_b: if (duelist_number == 2) {entry_number} else {opponent_entry_number},
        })
    }
}

#[generate_trait]
pub impl TournamentRoundImpl of TournamentRoundTrait {
    const SHUFFLE_SALT: felt252 = 'tournament_round';
    const MAX_ENTRIES: u8 = 32;
    const NIBBLE_LOSING: u8 = 0b1100;   // playing and losing
    const NIBBLE_WINNING: u8 = 0b1101;  // playing and winning

    //------------------------------------
    // initilizers
    //
    fn shuffle(ref self: TournamentRound, wrapped: @RngWrap, seed: felt252) {
        let mut shuffle: Shuffle = ShuffleTrait::new(wrapped, seed, self.entry_count, Self::SHUFFLE_SALT);
        let mut i: u8 = 0;
        while (i < self.entry_count / 2) {
            let entry_a: u8 = shuffle.draw_next();
            let entry_b: u8 = shuffle.draw_next();
            // println!("shuffle({}): {}-{} of {}", i, entry_a, entry_b, self.entry_count);
            let index_a: usize = entry_a.into() - 1;
            let index_b: usize = entry_b.into() - 1;
            self.bracket = BytemapU256::set_byte(self.bracket, index_a, entry_b.into());
            self.bracket = BytemapU256::set_byte(self.bracket, index_b, entry_a.into());
            i += 1;
        };
        self.results = BitwiseU128::shr(
            // even entries: all duelists are playing and losing (0b1100)
            if (self.entry_count % 2 == 0) {0xcccccccccccccccccccccccccccccccc}
            // odd entries: last player wins, but need to collect (0b1101)
            else {0xdccccccccccccccccccccccccccccccc},
            ((Self::MAX_ENTRIES - self.entry_count) * 4).into());
    }

    //------------------------------------
    // duelling
    //
    fn moved_first(ref self: TournamentRound, entry_number: u8, opponent_entry_number: u8) {
        self.results._set_nibble(entry_number, 0b1101);              // player who moved is winning
        // self.results._set_nibble(opponent_entry_number, 0b1100);  // already unset (original state)
    }
    fn moved_second(ref self: TournamentRound, entry_number: u8, opponent_entry_number: u8) {
        self.results._set_nibble(entry_number, 0b1100);          // needs to move (losing)
        self.results._set_nibble(opponent_entry_number, 0b1100); // needs to move
    }
    fn finished_duel(ref self: TournamentRound,
        entry_number_a: u8, entry_number_b: u8,
        survived_a: bool, survived_b: bool,
        winner: u8,
    ) {
        let value_a: u128 =
            if (winner == 1) {0b1011}       // winners always survive
            else if (survived_a) {0b1010}   // lost but survived
            else {0b1000};                  // out!
        self.results._set_nibble(entry_number_a, value_a);
        // if odd entries, second is empty
        if (entry_number_b != 0) {
            let value_b: u128 =
                if (winner == 2) {0b1011}       // winners always survive
                else if (survived_b) {0b1010}   // lost but survived
                else {0b1000};                  // out!
            self.results._set_nibble(entry_number_b, value_b);
        }
    }
}

#[generate_trait]
pub impl TournamentBracketImpl of TournamentBracketTrait {
    fn get_opponent_entry_number(self: u256, entry_number: u8) -> u8 {
        (if (entry_number > 0 && entry_number <= TournamentRoundTrait::MAX_ENTRIES) {
            let index: usize = (entry_number - 1).try_into().unwrap();
            let entry: u8 = BytemapU256::get_byte(self, index).try_into().unwrap();
            (entry)
        } else {
            (0)
        })
    }
}


#[generate_trait]
pub impl TournamentResultsImpl of TournamentResultsTrait {
    #[inline(always)]
    fn is_playing(self: u128, entry_number: u8) -> bool {
        ((self._get_nibble(entry_number) & 0b0100) == 0b0100) // check playing bit (0b0100)
    }
    #[inline(always)]
    fn is_winning(self: u128, entry_number: u8) -> bool {
        ((self._get_nibble(entry_number) & 0b0001) == 0b0001) // check winning bit (0b0001)
    }
    #[inline(always)]
    fn is_losing(self: u128, entry_number: u8) -> bool {
        ((self._get_nibble(entry_number) & 0b0001) == 0) // check winning bit (0b0001)
    }
    #[inline(always)]
    fn has_survived(self: u128, entry_number: u8) -> bool {
        ((self._get_nibble(entry_number) & 0b0010) == 0b0010) // check survived bit (0b0010)
    }

    #[inline(always)]
    fn have_all_duels_finished(self: u128) -> bool {
        // check if all playing bits are cleared (0b0100)
        ((self & 0x44444444444444444444444444444444) == 0)
    }
    fn get_surviving_entries(self: u128) -> Span<u8> {
        let mut result: Array<u8> = array![];
        let mut i: u8 = 0;
        while (i < TournamentRoundTrait::MAX_ENTRIES) {
            if ((NibblemapU128::get_nibble(self, i.into()) & 0b0010) == 0b0010) {
                result.append(i + 1);
            }
            i += 1;
        };
        (result.span())
    }

    //------------------------------------
    // internal
    //
    #[inline(always)]
    fn _get_nibble(self: u128, entry_number: u8) -> u8 {
        (NibblemapU128::get_nibble(self, (entry_number - 1).into())).try_into().unwrap()
    }
    #[inline(always)]
    fn _set_nibble(ref self: u128, entry_number: u8, value: u128) {
        self = NibblemapU128::set_nibble(self, (entry_number - 1).into(), value);
    }
}



//---------------------------
// Converters
//
impl TournamentTypeIntoByteArray of core::traits::Into<TournamentType, ByteArray> {
    fn into(self: TournamentType) -> ByteArray {
        match self {
            TournamentType::Undefined       => "TournamentType::Undefined",
            TournamentType::LastManStanding => "TournamentType::LastManStanding",
        }
    }
}
pub impl TournamentTypeDebug of core::fmt::Debug<TournamentType> {
    fn fmt(self: @TournamentType, ref f: core::fmt::Formatter) -> Result<(), core::fmt::Error> {
        let result: ByteArray = (*self).into();
        f.buffer.append(@result);
        Result::Ok(())
    }
}




//----------------------------------------
// Unit  tests
//
#[cfg(test)]
mod unit {
    use super::{
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

    fn _test_tournament_round(wrapped: @RngWrap, entry_count: u8) -> @TournamentRound {
        let mut round = NEW_ROUND(entry_count);
        round.shuffle(wrapped, 0x3453534534534543);
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
    fn test_tournament_round_shuffle_max() {
        let mut sys: tester::TestSystems = tester::setup_world(tester::FLAGS::MOCK_RNG);
        let wrapped: @RngWrap = RngWrapTrait::new(sys.rng.contract_address);
        _test_tournament_round(wrapped, TournamentRoundTrait::MAX_ENTRIES);
    }

    #[test]
    fn test_tournament_round_shuffle_min() {
        let mut sys: tester::TestSystems = tester::setup_world(tester::FLAGS::MOCK_RNG);
        let wrapped: @RngWrap = RngWrapTrait::new(sys.rng.contract_address);
        let round: @TournamentRound = _test_tournament_round(wrapped, 2);
        assert_eq!((*round.bracket).get_opponent_entry_number(0), 0);
        assert_eq!((*round.bracket).get_opponent_entry_number(1), 2);
        assert_eq!((*round.bracket).get_opponent_entry_number(2), 1);
        assert_eq!((*round.bracket).get_opponent_entry_number(3), 0);
    }

    #[test]
    fn test_tournament_round_shuffle_odd() {
        let mut sys: tester::TestSystems = tester::setup_world(tester::FLAGS::MOCK_RNG);
        let mocked: Span<MockedValue> = [
            MockedValueTrait::shuffled(TournamentRoundTrait::SHUFFLE_SALT, [1, 4, 5, 2, 3].span()),
        ].span();
        let wrapped: @RngWrap = RngWrapTrait::wrap(sys.rng.contract_address, Option::Some(mocked));
        let round: @TournamentRound = _test_tournament_round(wrapped, 5);
        assert_eq!((*round.bracket).get_opponent_entry_number(0), 0);
        assert_eq!((*round.bracket).get_opponent_entry_number(1), 4);
        assert_eq!((*round.bracket).get_opponent_entry_number(2), 5);
        assert_eq!((*round.bracket).get_opponent_entry_number(3), 0);
        assert_eq!((*round.bracket).get_opponent_entry_number(4), 1);
        assert_eq!((*round.bracket).get_opponent_entry_number(5), 2);
        assert_eq!((*round.bracket).get_opponent_entry_number(6), 0);
    }

    #[test]
    fn test_tournament_round_commit_reveal() {
        let mut sys: tester::TestSystems = tester::setup_world(0);
        let mut round = NEW_ROUND(TournamentRoundTrait::MAX_ENTRIES);
        let wrapped: @RngWrap = RngWrapTrait::new(sys.rng.contract_address);
        round.shuffle(wrapped, 0x1234);
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
    fn test_tournament_round_finished_draw_dead() {
        let mut sys: tester::TestSystems = tester::setup_world(0);
        let mut round = NEW_ROUND(TournamentRoundTrait::MAX_ENTRIES);
        let wrapped: @RngWrap = RngWrapTrait::new(sys.rng.contract_address);
        round.shuffle(wrapped, 0x1234);
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
    fn test_tournament_round_finished_draw_alive() {
        let mut sys: tester::TestSystems = tester::setup_world(0);
        let mut round = NEW_ROUND(TournamentRoundTrait::MAX_ENTRIES);
        let wrapped: @RngWrap = RngWrapTrait::new(sys.rng.contract_address);
        round.shuffle(wrapped, 0x1234);
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
    fn test_tournament_round_finished_win_1() {
        let mut sys: tester::TestSystems = tester::setup_world(0);
        let mut round = NEW_ROUND(TournamentRoundTrait::MAX_ENTRIES);
        let wrapped: @RngWrap = RngWrapTrait::new(sys.rng.contract_address);
        round.shuffle(wrapped, 0x1234);
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
    fn test_tournament_round_finished_win_2() {
        let mut sys: tester::TestSystems = tester::setup_world(0);
        let mut round = NEW_ROUND(TournamentRoundTrait::MAX_ENTRIES);
        let wrapped: @RngWrap = RngWrapTrait::new(sys.rng.contract_address);
        round.shuffle(wrapped, 0x1234);
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
    fn test_tournament_round_finished_win_1_alive() {
        let mut sys: tester::TestSystems = tester::setup_world(0);
        let mut round = NEW_ROUND(TournamentRoundTrait::MAX_ENTRIES);
        let wrapped: @RngWrap = RngWrapTrait::new(sys.rng.contract_address);
        round.shuffle(wrapped, 0x1234);
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
    fn test_tournament_round_finished_win_2_alive() {
        let mut sys: tester::TestSystems = tester::setup_world(0);
        let mut round = NEW_ROUND(TournamentRoundTrait::MAX_ENTRIES);
        let wrapped: @RngWrap = RngWrapTrait::new(sys.rng.contract_address);
        round.shuffle(wrapped, 0x1234);
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

}
