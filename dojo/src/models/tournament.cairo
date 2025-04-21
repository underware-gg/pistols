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
// Tournament loop
//
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct Tournament {
    #[key]
    pub tournament_id: u64,         // budokan id
    //------
    pub state: TournamentState,
    pub round_number: u8,           // current or last round
}

#[derive(Copy, Drop, Serde, PartialEq, Introspect)]
pub enum TournamentState {
    Undefined,   // 0
    InProgress,  // 1
    Finished,    // 2
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



//------------------------------------
// Tournament settings/rules
// selected in Budokan
//
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct TournamentSettings {
    #[key]
    pub settings_id: u32,
    //------
    pub tournament_type: TournamentType,
    // pub description: ByteArray,
}

#[derive(Serde, Copy, Drop, PartialEq, Introspect)]
pub enum TournamentType {
    Undefined,          // 0
    LastManStanding,    // 2
    BestOfThree,        // 1
}

#[derive(Copy, Drop, Serde, Default)]
pub struct TournamentRules {
    pub settings_id: u32,       // Budokan settings id
    pub description: felt252,   // @generateContants:shortstring
    pub max_rounds: u8,         // maximum number of rounds, 0 if unlimited
    pub min_lives: u8,          // min lives required to enlist Duelist
    pub max_lives: u8,          // max lives allowed to enlist Duelist
    pub lives_staked: u8,       // lives staked by each duel in the tournament
}

// to be exported to typescript by generateConstants
// IMPORTANT: names must be in sync with enum TournamentType
pub mod TOURNAMENT_RULES {
    use super::{TournamentRules};
    pub const Undefined: TournamentRules = TournamentRules {
        settings_id: 0,
        description: 'Undefined',
        max_rounds: 0,
        min_lives: 0,
        max_lives: 0,
        lives_staked: 0,
    };
    pub const LastManStanding: TournamentRules = TournamentRules {
        settings_id: 1,
        description: 'Last Man Standing',
        max_rounds: 0,      // unlimited
        min_lives: 3,       // anyone can join
        max_lives: 3,       // death guaranteed on loss
        lives_staked: 3,    // suden death
    };
    pub const BestOfThree: TournamentRules = TournamentRules {
        settings_id: 2,
        description: 'Best of Three',
        max_rounds: 3,
        min_lives: 3,
        max_lives: 3,
        lives_staked: 1,
    };
}



//---------------------------
// Traits
//
use core::num::traits::Zero;
use pistols::systems::rng::{RngWrap, Shuffle, ShuffleTrait};
use pistols::utils::bitwise::{BitwiseU128};
use pistols::utils::bytemap::{BytemapU256};
use pistols::utils::nibblemap::{NibblemapU128};
// use pistols::utils::short_string::{ShortStringTrait};

#[generate_trait]
pub impl TournamentTypeImpl of TournamentTypeTrait {
    fn rules(self: @TournamentType) -> TournamentRules {
        match self {
            TournamentType::Undefined           => TOURNAMENT_RULES::Undefined,
            TournamentType::LastManStanding     => TOURNAMENT_RULES::LastManStanding,
            TournamentType::BestOfThree         => TOURNAMENT_RULES::BestOfThree,
        }
    }
    fn exists(self: @TournamentType) -> bool {
        (*self != TournamentType::Undefined)
    }
    fn tournament_settings(self: @TournamentType) -> @TournamentSettings {
        @TournamentSettings {
            settings_id: self.rules().settings_id,
            tournament_type: *self,
            // description: self.rules().description.to_string(),
        }
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
    // initializers
    //
    fn shuffle_all(ref self: TournamentRound, wrapped: @RngWrap, seed: felt252) {
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
            // odd entries: last player wins (0b1101) > but need to collect_duel()
            else {0xdccccccccccccccccccccccccccccccc},
            ((Self::MAX_ENTRIES - self.entry_count) * 4).into()
        );
    }
    fn shuffle_survivors(ref self: TournamentRound, wrapped: @RngWrap, seed: felt252, survivors: Span<u8>) {
        panic!("shuffle_survivors() not implemented");
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
    fn ended_round(ref self: TournamentRound) {
        // clear all playing bits (0b0100)
        self.results = self.results & ~0x44444444444444444444444444444444;
        // make winners survivors (shift 0b0001 to 0b0010)
        self.results = self.results | BitwiseU128::shl(self.results & 0x11111111111111111111111111111111, 1);
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
            // if ((NibblemapU128::get_nibble(self, i.into()) & 0b0011) != 0) {     // survived OR winning
            if ((NibblemapU128::get_nibble(self, i.into()) & 0b0010) == 0b0010) {   // survived after round ended
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
impl TournamentStateIntoByteArray of core::traits::Into<TournamentState, ByteArray> {
    fn into(self: TournamentState) -> ByteArray {
        match self {
            TournamentState::Undefined      => "TournamentState::Undefined",
            TournamentState::InProgress     => "TournamentState::InProgress",
            TournamentState::Finished       => "TournamentState::Finished",
        }
    }
}
pub impl TournamentStateDebug of core::fmt::Debug<TournamentState> {
    fn fmt(self: @TournamentState, ref f: core::fmt::Formatter) -> Result<(), core::fmt::Error> {
        let result: ByteArray = (*self).into();
        f.buffer.append(@result);
        Result::Ok(())
    }
}
impl TournamentTypeIntoByteArray of core::traits::Into<TournamentType, ByteArray> {
    fn into(self: TournamentType) -> ByteArray {
        match self {
            TournamentType::Undefined       => "TournamentType::Undefined",
            TournamentType::LastManStanding => "TournamentType::LastManStanding",
            TournamentType::BestOfThree     => "TournamentType::BestOfThree",
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
