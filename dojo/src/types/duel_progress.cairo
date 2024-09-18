use pistols::models::challenge::{DuelistState};
use pistols::types::cards::hand::{
    PlayerHand, PlayerHandTrait,
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
    hand_a: PlayerHand,
    hand_b: PlayerHand,
}

#[derive(Copy, Drop, Serde)]
pub struct DuelStep {
    // current pace
    pace: PacesCard,
    // env card
    card_env: EnvCard,
    dice_env: u8,
    // duelist draw
    card_a: DuelistDrawnCard,
    card_b: DuelistDrawnCard,
    // duelist states
    state_a: DuelistState,  // Duelist A current state
    state_b: DuelistState,  // Duelist A current state
}

#[derive(Copy, Drop, Serde, PartialEq, Introspect)]
pub enum DuelistDrawnCard {
    None: (),
    Fire: PacesCard,
    Dodge: PacesCard,
    Blades: BladesCard,
}
