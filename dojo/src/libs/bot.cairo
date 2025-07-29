
//--------------------------------
// Traits
//
use pistols::models::{
    challenge::{Challenge, ChallengeTrait},
    duelist::{Archetype},
};
use pistols::types::cards::{
    deck::{Deck},
    hand::{DuelistHand, DuelistHandTrait},
    paces::{PacesCard, PacesCardTrait},
};
use pistols::types::duelist_profile::{DuelistProfile, DuelistProfileTrait};
use pistols::systems::rng::{Dice, DiceTrait};
use pistols::utils::hash::{hash_values};

#[generate_trait]
pub impl BotPlayetMovesImpl of BotPlayerMovesTrait {
    #[inline(always)]
    fn make_salt(duel_id: u128) -> felt252 {
        // salt is always the duel_id for permissionless reveal
        (hash_values([duel_id.into()].span()))
    }
    fn make_moves(self: @DuelistProfile, challenge: @Challenge, ref dice: Dice) -> Span<u8> {
        let deck: Deck = challenge.get_deck();
        // randomize pace
        let mut archetype: Archetype = self.get_archetype();
        let card_fire: PacesCard = dice.throw_weighted_dice('bot_fire', deck.fire_cards, archetype._get_weights_fire()).into();
        let card_dodge: PacesCard = dice.throw_weighted_dice('bot_dodge', deck.dodge_cards, archetype._get_weights_dodge()).into();
        // if archetpe is undefined, set by pace
        if (archetype == Archetype::Undefined) {
            archetype =
                if (card_fire <= PacesCard::Paces3) {Archetype::Villainous}
                else if (card_fire >= PacesCard::Paces8) {Archetype::Honourable}
                else {Archetype::Trickster};
        }
        // randomize other cards
        let mut hand = DuelistHand {
            card_fire,
            card_dodge,
            card_tactics: dice.throw_weighted_dice('bot_tactics', deck.tactics_cards, archetype._get_weights_tactics()).into(),
            card_blades:  dice.throw_weighted_dice('bot_blades',  deck.blades_cards,  archetype._get_weights_blades()).into(),
        };
        if (hand.card_dodge == hand.card_fire) {
            hand.card_dodge = if (hand.card_fire == PacesCard::Paces1) {PacesCard::Paces2} else {hand.card_fire.previous_pace()};
        }
        (hand.to_span())
    }

    // weights per card
    fn _get_weights_fire(self: @Archetype) -> Span<u8> {
        (match self {
            Archetype::Villainous => ([10, 8, 6, 4, 2, 0, 0, 0, 0, 0].span()),
            Archetype::Trickster =>  ([4, 2, 2, 6, 10, 10, 6, 2, 2, 4].span()),
            Archetype::Honourable => ([0, 0, 0, 0, 0, 2, 4, 6, 8, 10].span()),
            Archetype::Undefined =>  ([1, 1, 1, 1, 1, 1, 1, 1, 1, 1].span()), // random
        })
    }
    fn _get_weights_dodge(self: @Archetype) -> Span<u8> {
        (match self {
            Archetype::Villainous => ([10, 8, 5, 2, 0, 0, 0, 0, 0, 0].span()),
            Archetype::Trickster =>  ([10, 10, 10, 10, 10, 10, 10, 10, 10, 10].span()),
            Archetype::Honourable => ([5, 5, 5, 5, 5, 10, 10, 10, 10, 10].span()),
            Archetype::Undefined =>  ([1, 1, 1, 1, 1, 1, 1, 1, 1, 1].span()), // random
        })
    }
    fn _get_weights_tactics(self: @Archetype) -> Span<u8> {
        (match self {
            Archetype::Villainous => ([0, 4, 10, 0, 4, 0].span()),
            Archetype::Trickster =>  ([10, 10, 1, 1, 10, 10].span()),
            Archetype::Honourable => ([0, 6, 0, 10, 6, 2].span()),
            Archetype::Undefined =>  ([1, 1, 1, 1, 1, 1].span()), // random
        })
    }
    fn _get_weights_blades(self: @Archetype) -> Span<u8> {
        (match self {
            Archetype::Villainous => ([10, 0, 10, 0].span()),
            Archetype::Trickster =>  ([0, 10, 2, 10].span()),
            Archetype::Honourable => ([0, 10, 10, 10].span()),
            Archetype::Undefined =>  ([1, 1, 1, 1].span()), // random
        })
    }
}



//----------------------------------------
// Unit  tests
//
#[cfg(test)]
mod unit {
    use super::{BotPlayerMovesTrait};
    use pistols::models::duelist::{Archetype};
    use pistols::types::cards::deck::{Deck, DeckType, DeckTypeTrait};

    fn _assert_archetype_weights(archetype: Archetype, deck: @Deck, prefix: ByteArray) {
        assert_eq!(archetype._get_weights_fire().len(), (*deck.fire_cards).len(), "[{}] fire weights", prefix);
        assert_eq!(archetype._get_weights_dodge().len(), (*deck.dodge_cards).len(), "[{}] dodge weights", prefix);
        assert_eq!(archetype._get_weights_tactics().len(), (*deck.tactics_cards).len(), "[{}] tactics weights", prefix);
        assert_eq!(archetype._get_weights_blades().len(), (*deck.blades_cards).len(), "[{}] blades weights", prefix);
    }

    #[test]
    fn validate_archetype_weights() {
        // make sure all weights have the same length as the deck
        let deck: Deck = DeckType::Classic.build_deck();
        _assert_archetype_weights(Archetype::Villainous, @deck, "Villainous");
        _assert_archetype_weights(Archetype::Trickster, @deck, "Trickster");
        _assert_archetype_weights(Archetype::Honourable, @deck, "Honourable");
        _assert_archetype_weights(Archetype::Undefined, @deck, "Undefined");
    }
}
