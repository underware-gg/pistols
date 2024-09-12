use starknet::ContractAddress;
use pistols::models::duelist::{Score};
use pistols::types::challenge_state::{ChallengeState, ChallengeStateTrait};
use pistols::types::round_state::{RoundState, RoundStateTrait};
use pistols::types::premise::{Premise, PremiseTrait};
use pistols::types::cards::{
    paces::{PacesCard, PacesCardTrait},
    tactics::{TacticsCard, TacticsCardTrait},
    blades::{BladesCard, BladesCardTrait},
};

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
    pub address_a: ContractAddress, // Challenger wallet
    pub address_b: ContractAddress, // Challenged wallet
    pub duelist_id_a: u128,         // Challenger duelist
    pub duelist_id_b: u128,         // Challenged duelist 
    // progress and results
    pub state: ChallengeState,
    pub round_number: u8,           // current or final
    pub winner: u8,                 // 0:draw, 1:duelist_a, 2:duelist_b
    // timestamps in unix epoch
    pub timestamp_start: u64,       // Unix time, started
    pub timestamp_end: u64,         // Unix time, ended
} // [f] [f] [f] [f] [128] [128] [152]

// Challenge wager (optional)
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct Wager {
    #[key]
    pub duel_id: u128,
    //------------
    pub value: u128,
    pub fee: u128,
}

//
// Each duel round
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct Round {
    #[key]
    pub duel_id: u128,
    #[key]
    pub round_number: u8,
    //---------------
    pub state: RoundState,
    pub moves_a: Moves,
    pub moves_b: Moves,
    pub state_a: PlayerState,
    pub state_b: PlayerState,
} // (8 + 232 + 232) = 472 bits ~ 2 felts (max 504)

//
// The shot of each player on a Round
#[derive(Copy, Drop, Serde, Introspect, Default)]
pub struct Moves {
    // player input
    pub card_fire: PacesCard,
    pub card_dodge: PacesCard,
    pub card_tactics: TacticsCard,
    pub card_blades: BladesCard,
    // commit/reveal
    pub salt: felt252,      // the player's secret salt
    pub hash: u128,         // hashed moves (salt + moves)
} // [f] + [128 + 112(14*8)]:240

#[derive(Copy, Drop, Serde, Introspect, Default)]
pub struct PlayerState {
    pub health: u8,     // CONST::FULL_HEALTH
    pub damage: u8,     // CONST::INITIAL_CHANCE
    pub chances: u8,    // 0-100
    pub dice_crit: u8,  // 0-100
    // results
    pub honour: u8,     // honour granted
    pub wager: u8,          // won the wager?
    pub win: u8,            // won the round?
} // [3*8]:24


//------------------------------------
// Traits
//
use pistols::types::cards::hand::{PlayerHand};
use pistols::utils::arrays::{SpanTrait};
use pistols::utils::hash::{hash_values};
use pistols::utils::math::{MathU8};
use pistols::types::constants::{CONST};

#[generate_trait]
impl RoundImpl of RoundTrait {
    #[inline(always)]
    fn make_seed(self: Round) -> felt252 {
        (hash_values([self.moves_a.salt, self.moves_b.salt].span()))
    }
}

#[generate_trait]
impl MovesImpl of MovesTrait {
    fn initialize(ref self: Moves, salt: felt252, moves: Span<u8>) {
        self.salt = salt;
        self.card_fire = moves.value_or_zero(0).into();
        self.card_dodge = moves.value_or_zero(1).into();
        self.card_tactics = moves.value_or_zero(2).into();
        self.card_blades = moves.value_or_zero(3).into();
    }
    fn as_hand(self: @Moves) -> PlayerHand {
        (PlayerHand {
            card_fire: *self.card_fire,
            card_dodge: *self.card_dodge,
            card_tactics: *self.card_tactics,
            card_blades: *self.card_blades,
        })
    }
}

#[generate_trait]
impl PlayerStateImpl of PlayerStateTrait {
    fn initialize(ref self: PlayerState, paces_shoot: PacesCard) {
        self.health = CONST::FULL_HEALTH;
        self.damage = CONST::INITIAL_DAMAGE;
        self.chances = CONST::INITIAL_CHANCE;
        self.honour = paces_shoot.honour();
        self.wager = 0;
        self.win = 0;
    }
}
