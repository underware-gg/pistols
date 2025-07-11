
//--------------------------------
// Traits
//
use pistols::models::challenge::{Challenge};
use pistols::types::duelist_profile::{DuelistProfile};
use pistols::types::cards::{
    hand::{DuelistHand, DuelistHandTrait},
    paces::{PacesCard},
    tactics::{TacticsCard},
    blades::{BladesCard},
};

#[generate_trait]
pub impl BotPlayetMovesImpl of BotPlayetMovesTrait {
    fn make_moves(self: @DuelistProfile, challenge: @Challenge) -> Span<u8> {
        // let mut hand: DuelistHand = Default::default();

        // TODO: pick moves...
        // hand.card_dodge = PacesCard::Paces9;
        // hand.card_fire = PacesCard::Paces10;
        // hand.card_tactics = TacticsCard::ThickCoat;
        // hand.card_blades = BladesCard::Seppuku;

        // (hand.to_span())

        ([1, 2, 2, 1].span())
    }
}
