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
    pub entry_count: u8,        // participating in this round
    pub timestamps: Period,     // will never expire after tournament
    pub bracket: u256,          // duelist pairings: 32 * 8-bit slots
    pub results: u64,           // bitmap: 32 * 2-bit slots (????)
}

//------------------------------------
// Links tournament rounds to its Duels
//
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct TournamentToChallenge {
    #[key]
    pub keys: TournamentDuelKeys,
    //-------------------------
    pub duel_id: u128,
}
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
use pistols::systems::tokens::tournament_token::tournament_token::{MAX_ENTRIES};
use pistols::systems::rng::{RngWrap, Shuffle, ShuffleTrait};
use pistols::utils::bitwise::{BitwiseU256};

#[generate_trait]
pub impl TournamentSettingsValueImpl of TournamentSettingsValueTrait {
    fn exists(self: @TournamentSettingsValue) -> bool {
        (*self.tournament_type != TournamentType::Undefined)
    }
}

#[generate_trait]
pub impl TournamentRoundImpl of TournamentRoundTrait {
    const SHUFFLE_SALT: felt252 = 'tournament_round';
    fn shuffle(ref self: TournamentRound, wrapped: @RngWrap, seed: felt252) {
        let mut shuffle: Shuffle = ShuffleTrait::new(wrapped, seed, self.entry_count, Self::SHUFFLE_SALT);
        let mut i: u8 = 0;
        while (i < self.entry_count / 2) {
            let entry_a: u8 = shuffle.draw_next();
            let entry_b: u8 = shuffle.draw_next();
            // println!("shuffle({}): {}-{} of {}", i, entry_a, entry_b, self.entry_count);
            let index_a: usize = entry_a.into() - 1;
            let index_b: usize = entry_b.into() - 1;
            self.bracket = BitwiseU256::set_byte(self.bracket, index_a, entry_b.into());
            self.bracket = BitwiseU256::set_byte(self.bracket, index_b, entry_a.into());
            i += 1;
        };
    }
}

#[generate_trait]
pub impl TournamentRoundValueImpl of TournamentRoundValueTrait {
    fn get_opponent_entry_number(self: @TournamentRoundValue, entry_number: u8) -> u8 {
        (if (entry_number > 0 && entry_number <= MAX_ENTRIES) {
            let index: usize = (entry_number - 1).try_into().unwrap();
            let entry: u8 = BitwiseU256::get_byte(*self.bracket, index).try_into().unwrap();
            (entry)
        } else {
            (0)
        })
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
        TournamentRound, TournamentRoundTrait, TournamentRoundValue, TournamentRoundValueTrait,
    };
    use pistols::systems::tokens::tournament_token::tournament_token::{MAX_ENTRIES};
    use pistols::systems::rng::{RngWrap, RngWrapTrait};
    use pistols::systems::rng_mock::{MockedValue, MockedValueTrait};
    use pistols::types::shuffler::{ShufflerTrait};
    use pistols::types::timestamp::{Period};
    use pistols::utils::bitwise::{BitwiseU256};
    use pistols::tests::tester::{tester};

    fn _test_tournament_round(wrapped: @RngWrap, entry_count: u8) -> @TournamentRoundValue {
        let mut round = TournamentRound {
            tournament_id: 1,
            round_number: 1,
            entry_count,
            bracket: 0,
            results: 0,
            timestamps: Period {
                start: 0,
                end: 0,
            },
        };
        round.shuffle(wrapped, 0x3453534534534543);
        let round_value = TournamentRoundValue {
            entry_count: round.entry_count,
            bracket: round.bracket,
            results: round.results,
            timestamps: round.timestamps,
        };
        // check pairings
        let is_odd: bool = (entry_count % 2) == 1;
        let mut not_paired: u8 = 0;
        let mut i: usize = 0;
        while (i < round.entry_count.into()) {
            // index_a > entry_a
            let _index_a: usize = i;
            let entry_a: u256 = BitwiseU256::get_byte(round.bracket, _index_a.into());
            if (entry_a == 0) {
                assert!(is_odd, "({}): is_odd", i);
                assert_eq!(not_paired, 0, "({}): not_paired", i);
                not_paired += 1;
            } else {
                // entry_a > index_b > entry_b
                let index_b: usize = (entry_a - 1).try_into().unwrap();
                let entry_b: u256 = BitwiseU256::get_byte(round.bracket, index_b);
                // entry_b > back to index_a
                let index_a: usize = (entry_b - 1).try_into().unwrap();
                // println!("___entry({}): [{}]={} > [{}]={}", _index_a, index_a, entry_a, index_b, entry_b);
                assert_eq!(_index_a, index_a, "({}) _index_a", i);
                // match opponents
                let opponent_a: u256 = round_value.get_opponent_entry_number(entry_b.try_into().unwrap()).into();
                let opponent_b: u256 = round_value.get_opponent_entry_number(entry_a.try_into().unwrap()).into();
                assert_eq!(opponent_a, entry_a, "({}) opponent_a", i);
                assert_eq!(opponent_b, entry_b, "({}) opponent_b", i);
            }
            // println!("___entry({}): [{}]={}", i, _index_a, entry_a);
            i += 1;
        };
        if (is_odd) {
            assert_ne!(not_paired, 0, "is_odd: not_paired={}", not_paired);
        } else {
            assert_eq!(not_paired, 0, "!is_odd: not_paired={}", not_paired);
        }
        (@round_value)
    }

    #[test]
    fn test_tournament_round_shuffle_max() {
        let mut sys: tester::TestSystems = tester::setup_world(tester::FLAGS::MOCK_RNG);
        let wrapped: @RngWrap = RngWrapTrait::new(sys.rng.contract_address);
        _test_tournament_round(wrapped, MAX_ENTRIES.into());
    }

    #[test]
    fn test_tournament_round_shuffle_min() {
        let mut sys: tester::TestSystems = tester::setup_world(tester::FLAGS::MOCK_RNG);
        let wrapped: @RngWrap = RngWrapTrait::new(sys.rng.contract_address);
        let round_value = _test_tournament_round(wrapped, 2);
        assert_eq!(round_value.get_opponent_entry_number(0), 0);
        assert_eq!(round_value.get_opponent_entry_number(1), 2);
        assert_eq!(round_value.get_opponent_entry_number(2), 1);
        assert_eq!(round_value.get_opponent_entry_number(3), 0);
    }

    #[test]
    fn test_tournament_round_shuffle_odd() {
        let mut sys: tester::TestSystems = tester::setup_world(tester::FLAGS::MOCK_RNG);
        let mocked: Span<MockedValue> = [
            MockedValueTrait::new(TournamentRoundTrait::SHUFFLE_SALT, ShufflerTrait::mock_to_seed([1, 4, 5, 2, 3].span())),
        ].span();
        let wrapped: @RngWrap = RngWrapTrait::wrap(sys.rng.contract_address, Option::Some(mocked));
        let round_value = _test_tournament_round(wrapped, 5);
        assert_eq!(round_value.get_opponent_entry_number(0), 0);
        assert_eq!(round_value.get_opponent_entry_number(1), 4);
        assert_eq!(round_value.get_opponent_entry_number(2), 5);
        assert_eq!(round_value.get_opponent_entry_number(3), 0);
        assert_eq!(round_value.get_opponent_entry_number(4), 1);
        assert_eq!(round_value.get_opponent_entry_number(5), 2);
        assert_eq!(round_value.get_opponent_entry_number(6), 0);
    }

}
