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
    duel_id: u128,
    //-------------------------
    table_id: felt252,
    premise: Premise,           // premise of the dispute
    quote: felt252,             // message to challenged
    address_a: ContractAddress, // Challenger wallet
    address_b: ContractAddress, // Challenged wallet
    duelist_id_a: u128,         // Challenger duelist
    duelist_id_b: u128,         // Challenged duelist 
    // progress and results
    state: ChallengeState,
    round_number: u8,           // current or final
    winner: u8,                 // 0:draw, 1:duelist_a, 2:duelist_b
    // timestamps in unix epoch
    timestamp_start: u64,       // Unix time, started
    timestamp_end: u64,         // Unix time, ended
} // [f] [f] [f] [f] [128] [128] [152]

// Challenge wager (optional)
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct Wager {
    #[key]
    duel_id: u128,
    //------------
    value: u128,
    fee: u128,
}

//
// Each duel round
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct Round {
    #[key]
    duel_id: u128,
    #[key]
    round_number: u8,
    //---------------
    state: RoundState,
    shot_a: Shot,   // duelist_a shot
    shot_b: Shot,   // duelist_b shot
} // (8 + 232 + 232) = 472 bits ~ 2 felts (max 504)

//
// The shot of each player on a Round
#[derive(Copy, Drop, Serde, Introspect)]
struct Shot {
    // player input
    salt: felt252,      // the player's secret salt
    hash: u128,         // hashed moves (salt + moves)
    card_fire: PacesCard,
    card_dodge: PacesCard,
    card_tactics: TacticsCard,
    card_blades: BladesCard,
    // player states
    state_start: PlayerState,
    state_final: PlayerState,
    // results
    wager: u8,          // won the wager?
    win: u8,            // won the round?
} // [f] + [128 + 112(14*8)]:240

#[derive(Copy, Drop, Serde, IntrospectPacked)]
struct PlayerState {
    health: u8,     // CONST::FULL_HEALTH
    damage: u8,     // CONST::INITIAL_CHANCE
    chances: u8,    // 0-100
    dice_crit: u8,  // 0-100
    honour: u8,     // honour granted
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
        (hash_values([self.shot_a.salt, self.shot_b.salt].span()))
    }
}

#[generate_trait]
impl ShotImpl of ShotTrait {
    fn initialize(ref self: Shot, salt: felt252, moves: Span<u8>) {
        self.salt = salt;
        self.card_fire = moves.value_or_zero(0).into();
        self.card_dodge = moves.value_or_zero(1).into();
        self.card_tactics = moves.value_or_zero(2).into();
        self.card_blades = moves.value_or_zero(3).into();
        self.state_start.initialize(self.card_fire);
        self.state_final.initialize(self.card_fire);
    }
    fn as_hand(self: @Shot) -> PlayerHand {
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
    }
}
