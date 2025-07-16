pub use pistols::types::cards::{
    paces::{PacesCard, PacesCardTrait},
    tactics::{TacticsCard, TacticsCardTrait},
    blades::{BladesCard, BladesCardTrait},
    env::{EnvCard, EnvCardTrait},
};

#[derive(Copy, Drop, Serde, PartialEq, Introspect)]
pub enum DeckType {
    None,
    Classic,        // Full deck
    PacesOnly,      // Paces only
}

#[derive(Copy, Drop, Serde)]
pub struct Deck {
    pub fire_cards: Span<u8>,
    pub dodge_cards: Span<u8>,
    pub tactics_cards: Span<u8>,
    pub blades_cards: Span<u8>,
}


//--------------------
// traits
//
use pistols::utils::arrays::{SpanUtilsTrait};
use pistols::types::cards::hand::{DuelistHand};

#[generate_trait]
pub impl DeckTypeImpl of DeckTypeTrait {
    fn build_deck(self: @DeckType) -> Deck {
        (Deck {
            fire_cards: PacesCardTrait::build_deck(self),
            dodge_cards: PacesCardTrait::build_deck(self),
            tactics_cards: TacticsCardTrait::build_deck(self),
            blades_cards: BladesCardTrait::build_deck(self),
        })
    }
}

#[generate_trait]
pub impl DeckImpl of DeckTrait {
    fn validate_hand(self: @Deck, ref hand: DuelistHand) {
        // Paces
        if (!(*self.fire_cards).contains(@hand.card_fire.into())) {
            hand.card_fire = PacesCard::None;
        }
        // Dodge
        if (hand.card_dodge == hand.card_fire) {
            // cant have dodge and fire at same pace
            hand.card_dodge = PacesCard::None;
        } else if (!(*self.dodge_cards).contains(@hand.card_dodge.into())) {
            hand.card_dodge = PacesCard::None;
        }
        // Tactics
        if (!(*self.tactics_cards).contains(@hand.card_tactics.into())) {
            hand.card_tactics = TacticsCard::None;
        }
        // Blades
        if (!(*self.blades_cards).contains(@hand.card_blades.into())) {
            hand.card_blades = BladesCard::None;
        }
    }
    fn to_span(self: @Deck) -> Span<Span<u8>> {
        ([
            *self.fire_cards,
            *self.dodge_cards,
            *self.tactics_cards,
            *self.blades_cards,
        ].span())
    }
    fn from_span(moves: Span<Span<u8>>) -> Deck {
        (Deck {
            fire_cards: if (moves.len() > 0) {*moves[0]} else {[].span()},
            dodge_cards: if (moves.len() > 1) {*moves[1]} else {[].span()},
            tactics_cards: if (moves.len() > 2) {*moves[2]} else {[].span()},
            blades_cards: if (moves.len() > 3) {*moves[3]} else {[].span()},
        })
    }
}


//---------------------------
// Converters
//
impl DeckTypeIntoByteArray of core::traits::Into<DeckType, ByteArray> {
    fn into(self: DeckType) -> ByteArray {
        match self {
            DeckType::None =>       "Undefined",
            DeckType::Classic =>    "Classic",
            DeckType::PacesOnly =>  "PacesOnly",
        }
    }
}
// for println! format! (core::fmt::Display<>) assert! (core::fmt::Debug<>)
pub impl DeckTypeDebug of core::fmt::Debug<DeckType> {
    fn fmt(self: @DeckType, ref f: core::fmt::Formatter) -> Result<(), core::fmt::Error> {
        let result: ByteArray = (*self).into();
        f.buffer.append(@result);
        Result::Ok(())
    }
}

// impl DeckDefault of Default<Deck> {
//     fn default() -> Deck {
//         (Deck {
//             fire_cards: [].span(),
//             dodge_cards: [].span(),
//             tactics_cards: [].span(),
//             blades_cards: [].span(),
//         })
//     }
// }


//----------------------------------------
// Unit  tests
//
#[cfg(test)]
mod unit {
    use super::{Deck, DeckTrait, DeckType, DeckTypeTrait};
    use pistols::utils::arrays::{ArrayTestUtilsTrait};
    use pistols::types::cards::hand::{
        DuelistHand,
        PacesCard,
        TacticsCard,
        BladesCard,
    };

    #[test]
    fn test_deck_classic() {
        let deck: Deck = DeckType::Classic.build_deck();
        assert_eq!(deck.fire_cards.len(), 10, "deck.fire_cards.len()");
        assert_eq!(deck.dodge_cards.len(), 10, "deck.dodge_cards.len()");
        assert_eq!(deck.tactics_cards.len(), 6, "deck.tactics_cards.len()");
        assert_eq!(deck.blades_cards.len(), 4, "deck.blades_cards.len()");
    }

    #[test]
    fn test_deck_paces_only() {
        let deck: Deck = DeckType::PacesOnly.build_deck();
        assert_eq!(deck.fire_cards.len(), 10, "deck.fire_cards.len()");
        assert_eq!(deck.dodge_cards.len(), 10, "deck.dodge_cards.len()");
        assert_eq!(deck.tactics_cards.len(), 0, "deck.tactics_cards.len()");
        assert_eq!(deck.blades_cards.len(), 0, "deck.blades_cards.len()");
    }

    #[test]
    fn test_deck_validate_hand_classic() {
        let mut hand: DuelistHand = DuelistHand {
            card_fire: PacesCard::Paces10,
            card_dodge: PacesCard::Paces1,
            card_tactics: TacticsCard::Insult,
            card_blades: BladesCard::Seppuku,
        };
        let deck: Deck = DeckType::Classic.build_deck();
        deck.validate_hand(ref hand);
        assert_eq!(hand.card_fire, PacesCard::Paces10, "hand.card_fire");
        assert_eq!(hand.card_dodge, PacesCard::Paces1, "hand.card_dodge");
        assert_eq!(hand.card_tactics, TacticsCard::Insult, "hand.card_tactics");
        assert_eq!(hand.card_blades, BladesCard::Seppuku, "hand.card_blades");
    }

    #[test]
    fn test_deck_validate_hand_dodge() {
        let mut hand: DuelistHand = DuelistHand {
            card_fire: PacesCard::Paces10,
            card_dodge: PacesCard::Paces10,
            card_tactics: TacticsCard::Insult,
            card_blades: BladesCard::Seppuku,
        };
        let deck: Deck = DeckType::Classic.build_deck();
        deck.validate_hand(ref hand);
        assert_eq!(hand.card_fire, PacesCard::Paces10, "hand.card_fire");
        assert_eq!(hand.card_dodge, PacesCard::None, "hand.card_dodge");
        assert_eq!(hand.card_tactics, TacticsCard::Insult, "hand.card_tactics");
        assert_eq!(hand.card_blades, BladesCard::Seppuku, "hand.card_blades");
    }

    #[test]
    fn test_deck_validate_hand_paces_only() {
        let mut hand: DuelistHand = DuelistHand {
            card_fire: PacesCard::Paces1,
            card_dodge: PacesCard::Paces2,
            card_tactics: TacticsCard::Insult,
            card_blades: BladesCard::Seppuku,
        };
        let deck: Deck = DeckType::PacesOnly.build_deck();
        deck.validate_hand(ref hand);
        assert_eq!(hand.card_fire, PacesCard::Paces1, "hand.card_fire");
        assert_eq!(hand.card_dodge, PacesCard::Paces2, "hand.card_dodge");
        assert_eq!(hand.card_tactics, TacticsCard::None, "hand.card_tactics");
        assert_eq!(hand.card_blades, BladesCard::None, "hand.card_blades");
    }

    #[test]
    fn test_deck_from_span() {
        let span_0: Span<Span<u8>> = [
            [1,2,3,4].span(),
            [2,3,4,1].span(),
            [3,4,1,2].span(),
            [4,1,2,3].span(),
        ].span();
        let deck: Deck = DeckTrait::from_span(span_0);
        let span_1: Span<Span<u8>> = deck.to_span();
        ArrayTestUtilsTrait::assert_span_eq(span_0, span_1, "error!");
    }
}
