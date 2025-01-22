use pistols::types::cards::{
    deck::{Deck, DeckTrait, DeckType, DeckTypeTrait},
    paces::{PacesCard, PacesCardTrait},
    tactics::{TacticsCard, TacticsCardTrait},
    blades::{BladesCard, BladesCardTrait},
    env::{EnvCard, EnvCardTrait},
};
use pistols::types::duel_progress::{DuelistDrawnCard};

#[derive(Copy, Drop, Serde, Default)]
pub struct DuelistHand {
    card_fire: PacesCard,
    card_dodge: PacesCard,
    card_tactics: TacticsCard,
    card_blades: BladesCard,
}

#[derive(Copy, Drop, Serde, PartialEq, Introspect)]
pub enum FinalBlow {
    Undefined,
    Paces: PacesCard,   // ended in Pistols round
    Blades: BladesCard, // ended in Blades round
}
impl FinalBlowDefault of Default<FinalBlow> {
    fn default() -> FinalBlow {(FinalBlow::Undefined)}
}


//--------------------
// traits
//

#[generate_trait]
impl DuelistHandImpl of DuelistHandTrait {
    fn draw_card(self: DuelistHand, pace: PacesCard) -> DuelistDrawnCard {
        (
            if (self.card_fire == pace) {DuelistDrawnCard::Fire(pace)}
            else if (self.card_dodge == pace) {DuelistDrawnCard::Dodge(pace)}
            else {DuelistDrawnCard::None}
        )
    }
    fn to_span(self: DuelistHand) -> Span<u8> {
        ([
            self.card_fire.into(),
            self.card_dodge.into(),
            self.card_tactics.into(),
            self.card_blades.into(),
        ].span())
    }
}

#[generate_trait]
impl FinalBlowImpl of FinalBlowTrait {
    fn ended_in_paces(self: FinalBlow) -> bool {
        (match self {
            FinalBlow::Paces(_) => true,
            _ => false,
        })
    }
    fn ended_in_blades(self: FinalBlow) -> bool {
        (match self {
            FinalBlow::Blades(_) => true,
            _ => false,
        })
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
