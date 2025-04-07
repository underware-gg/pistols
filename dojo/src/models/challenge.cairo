use starknet::{ContractAddress};
use pistols::types::challenge_state::{ChallengeState, ChallengeStateTrait};
use pistols::types::round_state::{RoundState};
use pistols::types::premise::{Premise};
use pistols::types::timestamp::{Period};

//-------------------------
// Challenge lifecycle
//
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct Challenge {
    #[key]
    pub duel_id: u128,
    //-------------------------
    pub table_id: felt252,
    pub premise: Premise,           // premise of the dispute
    pub quote: felt252,             // message to challenged
    pub lives_staked: u8,           // lives staked by challenger
    // duelists
    pub address_a: ContractAddress, // Challenger wallet
    pub address_b: ContractAddress, // Challenged wallet
    pub duelist_id_a: u128,         // Challenger duelist
    pub duelist_id_b: u128,         // Challenged duelist 
    // progress and results
    pub state: ChallengeState,
    pub winner: u8,                 // 0:draw, 1:duelist_a, 2:duelist_b
    // timestamps in unix epoch
    pub timestamps: Period,
}

//
// Each duel round
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct Round {
    #[key]
    pub duel_id: u128,
    //---------------
    pub moves_a: Moves,
    pub moves_b: Moves,
    pub state_a: DuelistState,
    pub state_b: DuelistState,
    pub state: RoundState,
    pub final_blow: FinalBlow,
}

//
// The shot of each player on a Round
#[derive(Copy, Drop, Serde, Default, IntrospectPacked)]
pub struct Moves {
    // commit/reveal
    pub salt: felt252,      // set on reveal: the player's secret salt
    pub hashed: u128,       // set on commit: hashed moves (salt + moves)
    pub timeout: u64,       // current timeout to reply
    // player input
    pub card_1: u8,         // PacesCard,
    pub card_2: u8,         // PacesCard,
    pub card_3: u8,         // TacticsCard,
    pub card_4: u8,         // BladesCard,
} // [f] + [128 + 64 + 32(4*8)]: 224 bits

#[derive(Copy, Drop, Serde, Default, IntrospectPacked)]
pub struct DuelistState {
    pub chances: u8,    // 0..100
    pub damage: u8,     // 0..CONST::INITIAL_CHANCE
    // outcome
    pub health: u8,     // 0..CONST::FULL_HEALTH
    pub dice_fire: u8,  // 0..100
    pub honour: u8,     // honour granted
} // [5*8]: 40 bits



//------------------------------------
// Traits
//
use pistols::types::cards::{
    deck::{Deck, DeckType, DeckTypeTrait},
    hand::{DuelistHand},
    paces::{PacesCardTrait},
    hand::{FinalBlow},
};
use pistols::types::{
    profile_type::{CharacterProfile},
    rules::{RulesType, RulesTypeTrait},
    timestamp::{TimestampTrait},
    constants::{CONST},
};
use pistols::models::table::{TABLES};
use pistols::utils::arrays::{SpanUtilsTrait};
use pistols::utils::hash::{hash_values};
use pistols::utils::math::{MathTrait};
use pistols::utils::misc::{ZERO};

#[generate_trait]
pub impl ChallengeImpl of ChallengeTrait {
    #[inline(always)]
    fn duelist_number(self: @Challenge, duelist_id: u128) -> u8 {
        (if (duelist_id == *self.duelist_id_a) {(1)}
        else if (duelist_id == *self.duelist_id_b) {(2)}
        else {(0)})
    }
    #[inline(always)]
    fn winner_address(self: @Challenge) -> ContractAddress {
        (if (*self.winner == 1) {*self.address_a}
        else if (*self.winner == 2) {*self.address_b}
        else {ZERO()})
    }
    #[inline(always)]
    fn exists(self: @Challenge) -> bool {
        ((*self).state.exists())
    }
    #[inline(always)]
    fn is_tutorial(self: @Challenge) -> bool {
        (*self.table_id == TABLES::TUTORIAL)
    }
    #[inline(always)]
    fn is_practice(self: @Challenge) -> bool {
        (*self.table_id == TABLES::PRACTICE)
    }
    fn get_deck_type(self: @Challenge) -> DeckType {
        if (
            self.is_tutorial() &&
            ((*self).duelist_id_a.into() == CharacterProfile::Drunkard || (*self).duelist_id_b.into() == CharacterProfile::Drunkard)
        ) {
            (DeckType::PacesOnly)
        } else {
            (DeckType::Classic)
        }
    }
    #[inline(always)]
    fn get_deck(self: @Challenge) -> Deck {
        (self.get_deck_type().build_deck())
    }
}

#[generate_trait]
pub impl RoundImpl of RoundTrait {
    #[inline(always)]
    fn make_seed(self: @Round) -> felt252 {
        (hash_values([(*self).moves_a.salt, (*self).moves_b.salt].span()))
    }
    fn set_commit_timeout(ref self: Round, rules: RulesType, current_timestamp: u64) {
        self.moves_a.set_commit_timeout(rules, current_timestamp);
        self.moves_b.set_commit_timeout(rules, current_timestamp);
    }
    fn set_reveal_timeout(ref self: Round, rules: RulesType, current_timestamp: u64) {
        self.moves_a.set_reveal_timeout(rules, current_timestamp);
        self.moves_b.set_reveal_timeout(rules, current_timestamp);
    }
}

#[generate_trait]
pub impl MovesImpl of MovesTrait {
    fn set_salt_and_moves(ref self: Moves, salt: felt252, moves: Span<u8>) {
        self.salt = salt;
        self.card_1 = moves.value_or_zero(0);
        self.card_2 = moves.value_or_zero(1);
        self.card_3 = moves.value_or_zero(2);
        self.card_4 = moves.value_or_zero(3);
    }
    #[inline(always)]
    fn as_hand(self: @Moves) -> DuelistHand {
        (DuelistHand {
            card_fire: (*self.card_1).into(),
            card_dodge: (*self.card_2).into(),
            card_tactics: (*self.card_3).into(),
            card_blades: (*self.card_4).into(),
        })
    }
    #[inline(always)]
    fn set_commit_timeout(ref self: Moves, rules: RulesType, current_timestamp: u64) {
        self.timeout = if (self.hashed == 0) {(current_timestamp + rules.get_reply_timeout())} else {(0)};
    }
    #[inline(always)]
    fn set_reveal_timeout(ref self: Moves, rules: RulesType, current_timestamp: u64) {
        self.timeout = if (self.salt == 0) {(current_timestamp + rules.get_reply_timeout())} else {(0)};
    }
    #[inline(always)]
    fn has_timed_out(ref self: Moves) -> bool {
        (self.timeout.has_timed_out())
    }
}

#[generate_trait]
pub impl DuelistStateImpl of DuelistStateTrait {
    fn initialize(ref self: DuelistState, hand: DuelistHand) {
        self = Default::default();
        self.chances = CONST::INITIAL_CHANCE;
        self.damage = CONST::INITIAL_DAMAGE;
        self.health = CONST::FULL_HEALTH;
        self.honour = hand.card_fire.honour();
    }
    #[inline(always)]
    fn apply_damage(ref self: DuelistState, amount: i8) {
        self.damage.addi(amount);
    }
    #[inline(always)]
    fn apply_chances(ref self: DuelistState, amount: i8) {
        self.chances.addi(amount);
        self.chances.clampi(0, 100);
    }
}
