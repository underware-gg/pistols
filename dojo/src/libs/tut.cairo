
#[derive(Copy, Drop, Serde, PartialEq, Introspect)]
pub enum TutorialLevel {
    Undefined,  // 0
    Level1,     // 1
    Level2,     // 2
}


//--------------------------------
// Traits
//
use pistols::systems::rng_mock::{MockedValue, MockedValueTrait};
use pistols::models::challenge::{Challenge};
use pistols::types::profile_type::{ProfileType,CharacterProfile};
use pistols::types::cards::{
    hand::{DuelistHand, DuelistHandTrait},
    paces::{PacesCard, PacesCardTrait},
    tactics::{TacticsCard},
    blades::{BladesCard},
    env::{ENV_DICES},
};
use pistols::utils::arrays::{ArrayUtilsTrait};
use pistols::utils::misc::{FeltToLossy};
use pistols::utils::hash::{hash_values};

#[generate_trait]
pub impl TutorialLevelImpl of TutorialLevelTrait {
    fn make_duel_id(self: @TutorialLevel, player_id: u128) -> u128 {
        let tutorial_id: u128 = (*self).into();
        let mut duel_id: u128 = hash_values([
            'tutorial',
            player_id.into(),
            tutorial_id.into(),
        ].span()).to_u128_lossy();
        // stamp tutorial ID at the end
        duel_id = (duel_id & ~0xff) | tutorial_id;
        (duel_id)
    }
    fn opponent_profile(self: @TutorialLevel) -> ProfileType {
        match self {
            TutorialLevel::Level1 => ProfileType::Character(CharacterProfile::Drunkard),
            TutorialLevel::Level2 => ProfileType::Character(CharacterProfile::Bartender),
            _ => ProfileType::Undefined,
        }
    }
    fn quote(self: @TutorialLevel) -> felt252 {
        match self {
            TutorialLevel::Level1 => 'I challenge you, SCUM!!',
            TutorialLevel::Level2 => 'Prepare for a real duel!',
            _ => 0,
        }
    }
    fn make_moves(self: @TutorialLevel, player_hand: @DuelistHand) -> (Span<u8>, Span<MockedValue>) {
        let mut npc_hand: DuelistHand = Default::default();
        let mut mocked: Array<MockedValue> = array![];
        let mut env_cards: Array<felt252> = array![];
        match self {
            TutorialLevel::Level1 => {
                //---------------------------------
                // Level 1: Paces only, player wins
                //
                // respond based on player's fire pace
                match (*player_hand.card_fire) {
                    PacesCard::Paces1 => {
                        // NPC never gets a chance to shoot
                        npc_hand.card_dodge = PacesCard::Paces9;
                        npc_hand.card_fire = PacesCard::Paces10;
                        env_cards.append(ENV_DICES::DOUBLE_DAMAGE_UP);
                    },
                    PacesCard::Paces2 => {
                        // NPC just trips and die
                        npc_hand.card_dodge = PacesCard::Paces1;
                        npc_hand.card_fire = PacesCard::Paces10;
                        env_cards.append(ENV_DICES::CHANCES_DOWN);
                        env_cards.append(ENV_DICES::DOUBLE_DAMAGE_UP);
                    },
                    _ => {
                        // NPC fires when player dodges
                        // else trips and shoot!
                        npc_hand.card_fire = if (player_hand.card_dodge.is_before(player_hand.card_fire)) {(*player_hand.card_dodge)} else {PacesCard::Paces2};
                        npc_hand.card_dodge = if (npc_hand.card_fire == PacesCard::Paces2) {PacesCard::Paces1} else {PacesCard::Paces2};
                        let pace: u8 = (*player_hand.card_fire).into();
                        // use the last <paces> cards from...
                        env_cards.extend_from_span(array![
                            ENV_DICES::CHANCES_DOWN,
                            ENV_DICES::CHANCES_UP,
                            ENV_DICES::CHANCES_DOWN,
                            ENV_DICES::CHANCES_UP,
                            ENV_DICES::DOUBLE_TACTICS,
                            ENV_DICES::DAMAGE_DOWN,
                            ENV_DICES::DAMAGE_UP,
                            ENV_DICES::DOUBLE_TACTICS,
                            ENV_DICES::DAMAGE_UP,
                            ENV_DICES::DAMAGE_UP,
                        ].span().slice((10 - pace).into(), pace.into()));
                    },
                };
                // mocked dices
                mocked.append(MockedValueTrait::new('shoot_a', 99)); // NPC always misses
                mocked.append(MockedValueTrait::new('shoot_b', 1));  // Player always hits
            },
            TutorialLevel::Level2 => {
                //---------------------------------
                // Level 2: Full deck, player loses
                //
                // NPC dodges when player fires
                npc_hand.card_dodge = npc_hand.card_fire;
                // NPC shoots afer dodge or just before player
                let pace: u8 = (*player_hand.card_fire).into();
                npc_hand.card_fire = if (*player_hand.card_fire == PacesCard::Paces10) {PacesCard::Paces9} else {(pace + 1).into()};
                // Tactics whatever
                npc_hand.card_tactics = TacticsCard::ThickCoat;
                // Blades always win
                npc_hand.card_blades = match (*player_hand.card_blades) {
                    BladesCard::PocketPistol => BladesCard::Grapple,
                    BladesCard::Behead =>       BladesCard::PocketPistol,
                    BladesCard::Grapple =>      BladesCard::Behead,
                    _ => BladesCard::None,
                };
                // env: cancel player's tactics, never let lethal damage
                env_cards.extend_from_span(array![
                    ENV_DICES::NO_TACTICS,
                    ENV_DICES::DAMAGE_UP,
                    ENV_DICES::CHANCES_UP,
                    ENV_DICES::CHANCES_UP,
                    ENV_DICES::DOUBLE_TACTICS,
                    ENV_DICES::CHANCES_DOWN,
                    ENV_DICES::CHANCES_UP,
                    ENV_DICES::DAMAGE_DOWN,
                    ENV_DICES::DAMAGE_UP,
                    ENV_DICES::ALL_SHOTS_HIT,
                ].span());
                // mocked dices
                mocked.append(MockedValueTrait::new('shoot_a', 1));  // NPC always hits
                mocked.append(MockedValueTrait::new('shoot_b', 99)); // Player always misses
            },
            _ => {},
        };
        //---------------------------------
        // finish
        mocked.append(MockedValueTrait::shuffled('env', env_cards.span()));
        (npc_hand.to_span(), mocked.span())
    }
}


//--------------------------------
// converters
//
impl U128IntoTutorialLevel of core::traits::Into<u128, TutorialLevel> {
    fn into(self: u128) -> TutorialLevel {
        if self == 1        { TutorialLevel::Level1 }
        else if self == 2   { TutorialLevel::Level2 }
        else                { TutorialLevel::Undefined }
    }
}
impl TutorialLevelIntoU128 of core::traits::Into<TutorialLevel, u128> {
    fn into(self: TutorialLevel) -> u128 {
        match self {
            TutorialLevel::Level1       => 1,
            TutorialLevel::Level2       => 2,
            TutorialLevel::Undefined    => 0,
        }
    }
}
impl ChallengeIntoTutorialLevel of core::traits::Into<Challenge, TutorialLevel> {
    fn into(self: Challenge) -> TutorialLevel {
        if (self.quote == TutorialLevel::Level1.quote())        { TutorialLevel::Level1 }
        else if (self.quote == TutorialLevel::Level2.quote())   { TutorialLevel::Level2 }
        else                                                    { TutorialLevel::Undefined }
    }
}
