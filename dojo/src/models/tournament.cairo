
//------------------------------------
// Tournament entry (tournament_token)
//
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct TournamentEntry {
    #[key]
    pub entry_id: u64,      // token id
    //------
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
    pub bracket: u256,          // duelist pairings
    pub results: u32,           // bitmap
}



//---------------------------
// Traits
//

#[generate_trait]
pub impl TournamentSettingsValueImpl of TournamentSettingsValueTrait {
    fn exists(self: @TournamentSettingsValue) -> bool {
        (*self.tournament_type != TournamentType::Undefined)
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

