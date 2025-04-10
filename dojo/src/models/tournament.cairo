
//------------------------------------
// Tournament entry (tournament_token)
//
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct TournamentEntry {
    #[key]
    pub entry_id: u64,      // token id
    //------
    pub tournament_id: u64, // budokan tournament_id
    pub entry_number: u8,   // entry number in the tournament
    pub duelist_id: u128,   // enlisted duelist id
    pub score: u32,         // budokan score
    pub points: u16,        // duelist points
    pub fame: u128,         // duelist FAME
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
    pub required_fame: u128,
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
    pub tournament_id: u64,     // budokan id
    //------
    pub round_number: u8,       // current round, zero if not started yet
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct TournamentRound {
    #[key]
    pub tournament_id: u64,     // budokan id
    #[key]
    pub round_number: u8,
    //------
    pub entry_count: u8,
    pub bracket: u256,          // duelist pairings: 32 * 8-bit slots
    pub results: u64,           // bitmap: 32 * 2-bit slots (????)
}



//---------------------------
// Traits
//
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
    fn shuffle(ref self: TournamentRound, wrapped: @RngWrap, seed: felt252) {
        let mut shuffle: Shuffle = ShuffleTrait::new(wrapped, seed, self.entry_count, 'tournament_round');
        let mut i: u8 = 0;
        while (i < self.entry_count / 2) {
            let entry_a: u8 = shuffle.draw_next();
            let entry_b: u8 = shuffle.draw_next();
            let index_a: usize = entry_a.into() - 1;
            let index_b: usize = entry_b.into() - 1;
            // println!("shuffle({}): {}-{} of {}", i, entry_a, entry_b, self.entry_count);
            self.bracket = BitwiseU256::set_byte(self.bracket, index_a, entry_b.into());
            self.bracket = BitwiseU256::set_byte(self.bracket, index_b, entry_a.into());
            i += 1;
        };
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
    };
    use pistols::systems::tokens::tournament_token::tournament_token::{MAX_ENTRIES};
    use pistols::systems::rng::{RngWrap, RngWrapTrait};
    use pistols::utils::bitwise::{BitwiseU256};
    use pistols::libs::seeder::{make_seed};
    use pistols::tests::tester::{tester};

    fn _test_tournament_round(entry_count: u8) {
        let mut sys: tester::TestSystems = tester::setup_world(tester::FLAGS::MOCK_RNG);
        let mut round: TournamentRound = TournamentRound {
            tournament_id: 1,
            round_number: 1,
            entry_count,
            bracket: 0,
            results: 0,
        };
        let wrapped: @RngWrap = RngWrapTrait::new(sys.rng.contract_address);
        let seed: felt252 = make_seed(sys.rng.contract_address, 1);
        round.shuffle(wrapped, seed);
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
            }
            // println!("___entry({}): [{}]={}", i, _index_a, entry_a);
            i += 1;
        };
        if (is_odd) {
            assert_ne!(not_paired, 0, "is_odd: not_paired={}", not_paired);
        } else {
            assert_eq!(not_paired, 0, "!is_odd: not_paired={}", not_paired);
        }
    }

    #[test]
    fn test_tournament_round_shuffle_max() {
        _test_tournament_round(MAX_ENTRIES.into());
    }

    #[test]
    fn test_tournament_round_shuffle_min() {
        _test_tournament_round(2);
    }

    #[test]
    fn test_tournament_round_shuffle_odd() {
        _test_tournament_round(17);
    }
}
