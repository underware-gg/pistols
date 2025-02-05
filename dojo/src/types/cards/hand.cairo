pub use pistols::types::cards::{
    deck::{Deck, DeckTrait, DeckType, DeckTypeTrait},
    paces::{PacesCard, PacesCardTrait},
    tactics::{TacticsCard, TacticsCardTrait},
    blades::{BladesCard, BladesCardTrait},
    env::{EnvCard, EnvCardTrait},
};
pub use pistols::types::duel_progress::{DuelistDrawnCard};

#[derive(Copy, Drop, Serde, Default)]
pub struct DuelistHand { // @generateContants:force
    pub card_fire: PacesCard,
    pub card_dodge: PacesCard,
    pub card_tactics: TacticsCard,
    pub card_blades: BladesCard,
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
pub impl DuelistHandImpl of DuelistHandTrait {
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
pub impl FinalBlowImpl of FinalBlowTrait {
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

impl FinalBlowIntoByteArray of core::traits::Into<FinalBlow, ByteArray> {
    fn into(self: FinalBlow) -> ByteArray {
        match self {
            FinalBlow::Undefined => "Undefined",
            FinalBlow::Paces(_) =>  "Paces",
            FinalBlow::Blades(_) => "Blades",
        }
    }
}

// for println! and format! 
// pub impl FinalBlowDisplay of core::fmt::Display<FinalBlow> {
//     fn fmt(self: @FinalBlow, ref f: core::fmt::Formatter) -> Result<(), core::fmt::Error> {
//         let result: ByteArray = (*self).into();
//         f.buffer.append(@result);
//         Result::Ok(())
//     }
// }
pub impl FinalBlowDebug of core::fmt::Debug<FinalBlow> {
    fn fmt(self: @FinalBlow, ref f: core::fmt::Formatter) -> Result<(), core::fmt::Error> {
        let result: ByteArray = (*self).into();
        f.buffer.append(@result);
        Result::Ok(())
    }
}



//----------------------------------------
// Unit  tests
//
#[cfg(test)]
mod tests {

    use pistols::types::cards::{
        paces::{PacesCard},
        hand::{DuelistHand, DuelistHandTrait},
        tactics::{TacticsCard},
        blades::{BladesCard},
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
        assert_eq!(hand_1_2.draw_card(PacesCard::Paces1), DuelistDrawnCard::Fire(PacesCard::Paces1), "1_2 > shoot");
        assert_eq!(hand_1_2.draw_card(PacesCard::Paces2), DuelistDrawnCard::Dodge(PacesCard::Paces2), "1_2 > dodge");
        assert_eq!(hand_1_2.draw_card(PacesCard::Paces3), DuelistDrawnCard::None, "1_2 > none");
        assert_eq!(hand_2_2.draw_card(PacesCard::Paces2), DuelistDrawnCard::Fire(PacesCard::Paces2), "2_2 > shoot");
    }
}
