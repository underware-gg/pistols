use pistols::types::cards::{
    paces::{PacesCard, PacesCardTrait},
    tactics::{TacticsCard, TacticsCardTrait},
    blades::{BladesCard, BladesCardTrait},
    env::{EnvCard, EnvCardTrait},
};
use pistols::types::duel_progress::{DuelistDrawnCard};

#[derive(Copy, Drop, Serde)]
struct PlayerHand {
    card_fire: PacesCard,
    card_dodge: PacesCard,
    card_tactics: TacticsCard,
    card_blades: BladesCard,
}


//--------------------
// traits
//

#[generate_trait]
impl PlayerHandImpl of PlayerHandTrait {
    fn player_full_deck() -> Array<Array<u8>> {
        let paces: Array<u8> = array![
            PacesCard::Paces1.into(),
            PacesCard::Paces2.into(),
            PacesCard::Paces3.into(),
            PacesCard::Paces4.into(),
            PacesCard::Paces5.into(),
            PacesCard::Paces6.into(),
            PacesCard::Paces7.into(),
            PacesCard::Paces8.into(),
            PacesCard::Paces9.into(),
            PacesCard::Paces10.into(),
        ];
        let dodge: Array<u8> = array![
            PacesCard::Paces1.into(),
            PacesCard::Paces2.into(),
            PacesCard::Paces3.into(),
            PacesCard::Paces4.into(),
            PacesCard::Paces5.into(),
            PacesCard::Paces6.into(),
            PacesCard::Paces7.into(),
            PacesCard::Paces8.into(),
            PacesCard::Paces9.into(),
            PacesCard::Paces10.into(),
        ];
        (array![
            paces,
            dodge,
        ])
    }
    fn validate(ref self: PlayerHand) {
        if (self.card_dodge == self.card_fire) {
            self.card_dodge = PacesCard::None;
        }
    }
    fn draw_card(self:PlayerHand, pace: PacesCard) -> DuelistDrawnCard {
        (
            if (self.card_fire == pace) {DuelistDrawnCard::Fire(pace)}
            else if (self.card_dodge == pace) {DuelistDrawnCard::Dodge(pace)}
            else {DuelistDrawnCard::None}
        )
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
        hand::{PlayerHand, PlayerHandTrait},
        tactics::{TacticsCard, TacticsCardTrait},
        blades::{BladesCard, BladesCardTrait},
    };
    use pistols::types::duel_progress::{DuelistDrawnCard};

    #[test]
    fn test_draw_card() {
        let hand_1_2 = PlayerHand {
            card_fire: PacesCard::Paces1,
            card_dodge: PacesCard::Paces2,
            card_tactics: TacticsCard::None,
            card_blades: BladesCard::None,
        };
        let hand_2_2 = PlayerHand {
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
