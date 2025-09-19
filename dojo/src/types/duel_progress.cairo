use pistols::models::challenge::{DuelistState};
use pistols::types::cards::hand::{
    DuelistHand,
    PacesCard,
    TacticsCard,
    BladesCard,
    EnvCard,
};
use pistols::utils::arrays::{SpanDefault};

//
// Game progress, pace by pace

#[derive(Copy, Drop, Serde, Default)]
pub struct DuelProgress {
    // results
    pub steps: Span<DuelStep>,
    pub winner: u8,
    // duelists hands
    pub hand_a: DuelistHand,
    pub hand_b: DuelistHand,
}

#[derive(Copy, Drop, Serde)]
pub struct DuelStep {
    // current pace
    pub pace: PacesCard,
    // env card
    pub card_env: EnvCard,
    pub dice_env: u8,
    // active specials
    pub specials_a: SpecialsDrawn,
    pub specials_b: SpecialsDrawn,
    // duelist draw
    pub card_a: DuelistDrawnCard,
    pub card_b: DuelistDrawnCard,
    // duelist states
    pub state_a: DuelistState,  // Duelist A current state
    pub state_b: DuelistState,  // Duelist B current state
}

#[derive(Copy, Drop, Serde, Default)]
pub struct SpecialsDrawn {
    pub tactics: TacticsCard,
    pub coin_toss: bool,
    pub reversal: bool,
    pub shots_modifier: EnvCard,
    pub tactics_modifier: EnvCard,
}

#[derive(Copy, Drop, Serde, PartialEq, Introspect)]
pub enum DuelistDrawnCard {
    None,
    Fire: PacesCard,
    Dodge: PacesCard,
    Blades: BladesCard,
}



//--------------------
// traits
//

#[generate_trait]
pub impl SpecialsDrawnImpl of SpecialsDrawnTrait {
    fn initialize(tactics_self: @TacticsCard, tactics_other: @TacticsCard) -> SpecialsDrawn {
        (SpecialsDrawn {
            tactics: *tactics_self,
            coin_toss: (*tactics_self == TacticsCard::CoinToss),
            reversal: (*tactics_self == TacticsCard::Reversal || *tactics_other == TacticsCard::Reversal),
            shots_modifier: EnvCard::None,
            tactics_modifier: EnvCard::None,
        })
    }
}



//---------------------------
// Converters
//
impl DuelistDrawnCardIntoByteArray of core::traits::Into<DuelistDrawnCard, ByteArray> {
    fn into(self: DuelistDrawnCard) -> ByteArray {
        match self {
            DuelistDrawnCard::None      =>   "None",
            DuelistDrawnCard::Fire(_)   =>   "Fire",
            DuelistDrawnCard::Dodge(_)  =>  "Dodge",
            DuelistDrawnCard::Blades(_) => "Blades",
        }
    }
}
// for println! format! (core::fmt::Display<>) assert! (core::fmt::Debug<>)
pub impl DuelistDrawnCardDebug of core::fmt::Debug<DuelistDrawnCard> {
    fn fmt(self: @DuelistDrawnCard, ref f: core::fmt::Formatter) -> Result<(), core::fmt::Error> {
        let result: ByteArray = (*self).into();
        f.buffer.append(@result);
        Result::Ok(())
    }
}
