use pistols::models::challenge::{DuelistState};
use pistols::types::cards::hand::{
    DuelistHand, DuelistHandTrait,
    PacesCard, PacesCardTrait,
    TacticsCard, TacticsCardTrait,
    BladesCard, BladesCardTrait,
    EnvCard, EnvCardTrait,
};
use pistols::utils::arrays::{SpanDefault};

//
// Game progress, pace by pace

#[derive(Copy, Drop, Serde, Default)]
pub struct DuelProgress {
    // results
    steps: Span<DuelStep>,
    winner: u8,
    // duelists hands
    hand_a: DuelistHand,
    hand_b: DuelistHand,
}

#[derive(Copy, Drop, Serde)]
pub struct DuelStep {
    // current pace
    pace: PacesCard,
    // env card
    card_env: EnvCard,
    dice_env: u8,
    // active specials
    specials_a: SpecialsDrawn,
    specials_b: SpecialsDrawn,
    // duelist draw
    card_a: DuelistDrawnCard,
    card_b: DuelistDrawnCard,
    // duelist states
    state_a: DuelistState,  // Duelist A current state
    state_b: DuelistState,  // Duelist B current state
}

#[derive(Copy, Drop, Serde, Default)]
pub struct SpecialsDrawn {
    tactics: TacticsCard,
    coin_toss: bool,
    reversal: bool,
    shots_modifier: EnvCard,
    tactics_modifier: EnvCard,
}

#[derive(Copy, Drop, Serde, PartialEq, Introspect)]
pub enum DuelistDrawnCard {
    None: (),
    Fire: PacesCard,
    Dodge: PacesCard,
    Blades: BladesCard,
}



//--------------------
// traits
//

#[generate_trait]
impl SpecialsDrawnImpl of SpecialsDrawnTrait {
    fn initialize(tactics_self: TacticsCard, tactics_other: TacticsCard) -> SpecialsDrawn {
        (SpecialsDrawn {
            tactics: tactics_self,
            coin_toss: (tactics_self == TacticsCard::CoinToss),
            reversal: (tactics_self == TacticsCard::Reversal || tactics_other == TacticsCard::Reversal),
            shots_modifier: EnvCard::None,
            tactics_modifier: EnvCard::None,
        })
    }
}
