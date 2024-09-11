use pistols::models::challenge::{PlayerState};
use pistols::types::cards::hand::{
    PlayerHand, PlayerHandTrait,
    PacesCard, PacesCardTrait,
    TacticsCard, TacticsCardTrait,
    BladesCard, BladesCardTrait,
    EnvCard, EnvCardTrait,
};

//
// Game progress, pace by pace

#[derive(Copy, Drop, Serde)]
struct DuelProgress {
    // results
    steps: Span<DuelStep>,
    winner: u8,
    // duelists hands
    hand_a: PlayerHand,
    hand_b: PlayerHand,
}

#[derive(Copy, Drop, Serde)]
struct DuelStep {
    // current pace
    pace: PacesCard,
    // env card
    card_env: EnvCard,
    dice_env: u8,
    // duelist draw
    card_a: DuelistDrawnCard,
    card_b: DuelistDrawnCard,
    // duelist states
    state_a: PlayerState,  // Duelist A current state
    state_b: PlayerState,  // Duelist A current state
}

#[derive(Copy, Drop, Serde, PartialEq, Introspect)]
enum DuelistDrawnCard {
    None: (),
    Fire: PacesCard,
    Dodge: PacesCard,
    Blades: BladesCard,
}
