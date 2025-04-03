
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct TournamentEntry {
    #[key]
    pub game_id: u64,
    //------
    pub fame: u128,
    pub points: u16,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct TournamentSettings {
    #[key]
    pub settings_id: u32,
    //------
    pub tournament_type: TournamentType,
    pub required_fame: u128,
}

pub mod TOURNAMENT_SETTINGS {
    pub const LAST_MAN_STANDING: u32 = 1;
    // pub const HIGHEST_SCORE: u32 = 2;
}

#[derive(Serde, Copy, Drop, PartialEq, Introspect)]
pub enum TournamentType {
    Undefined,          // 0
    LastManStanding,    // 1
    // HighestScore,       // 2
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

