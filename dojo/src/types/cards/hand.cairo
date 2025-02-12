use pistols::types::cards::{
    paces::{PacesCard, PacesCardTrait, PACES_CARDS},
    tactics::{TacticsCard, TacticsCardTrait, TACTICS_CARDS},
    blades::{BladesCard, BladesCardTrait, BLADES_CARDS},
    env::{EnvCard, EnvCardTrait, ENV_CARDS},
};
use pistols::types::duel_progress::{DuelistDrawnCard};

#[derive(Copy, Drop, Serde, PartialEq, Introspect)]
pub enum DeckType {
    None,
    //
    Classic,
}

#[derive(Copy, Drop, Serde, Default)]
pub struct DuelistHand {
    card_fire: PacesCard,
    card_dodge: PacesCard,
    card_tactics: TacticsCard,
    card_blades: BladesCard,
}


//--------------------
// traits
//
use pistols::utils::arrays::{SpanUtilsTrait};

#[generate_trait]
impl DuelistHandImpl of DuelistHandTrait {
    fn draw_card(self:DuelistHand, pace: PacesCard) -> DuelistDrawnCard {
        (
            if (self.card_fire == pace) {DuelistDrawnCard::Fire(pace)}
            else if (self.card_dodge == pace) {DuelistDrawnCard::Dodge(pace)}
            else {DuelistDrawnCard::None}
        )
    }
    fn validate(ref self: DuelistHand, _deck_type: DeckType) {
        if (self.card_dodge == self.card_fire) {
            self.card_dodge = PacesCard::None;
        }
        // TODO: enable this when we support multiple decks
        // if (!TacticsCardTrait::get_deck(deck_type).contains(self.card_tactics.into())) {
        //     self.card_tactics = TacticsCard::None;
        // }
        // if (!BladesCardTrait::get_deck(deck_type).contains(self.card_blades.into())) {
        //     self.card_blades = BladesCard::None;
        // }
    }
    fn get_table_player_decks(deck_type: DeckType) -> Span<Span<u8>> {
        (array![
            PacesCardTrait::get_deck(deck_type),
            PacesCardTrait::get_deck(deck_type),
            TacticsCardTrait::get_deck(deck_type),
            BladesCardTrait::get_deck(deck_type),
        ].span())
    }
}



//----------------------------------------
// Unit  tests
//
#[cfg(test)]
mod tests {
    use debug::PrintTrait;
    use core::traits::Into;

    use pistols::types::cards::{
        paces::{PacesCard, PacesCardTrait},
        hand::{DuelistHand, DuelistHandTrait},
        tactics::{TacticsCard, TacticsCardTrait},
        blades::{BladesCard, BladesCardTrait},
    };
    use pistols::types::duel_progress::{DuelistDrawnCard};

    #[test]
    fn test_draw_card() {
        let hand_1_2 = DuelistHand {
            card_fire: PacesCard::Paces1,
            card_dodge: PacesCard::Paces2,
            card_tactics: TacticsCard::None,
            card_blades: BladesCard::None,
        };
        let hand_2_2 = DuelistHand {
            card_fire: PacesCard::Paces2,
            card_dodge: PacesCard::Paces2,
            card_tactics: TacticsCard::None,
            card_blades: BladesCard::None,
        };
        assert(hand_1_2.draw_card(PacesCard::Paces1) == DuelistDrawnCard::Fire(PacesCard::Paces1), '1_2 > shoot');
        assert(hand_1_2.draw_card(PacesCard::Paces2) == DuelistDrawnCard::Dodge(PacesCard::Paces2), '1_2 > dodge');
        assert(hand_1_2.draw_card(PacesCard::Paces3) == DuelistDrawnCard::None, '1_2 > none');
        assert(hand_2_2.draw_card(PacesCard::Paces2) == DuelistDrawnCard::Fire(PacesCard::Paces2), '2_2 > shoot');
    }
}
