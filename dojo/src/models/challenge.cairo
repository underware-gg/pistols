use starknet::ContractAddress;
use pistols::models::duelist::{Score};
use pistols::types::challenge::{ChallengeState, ChallengeStateTrait};
use pistols::types::round::{RoundState, RoundStateTrait};

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
    message: felt252,           // message to challenged
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

// Score snapshot
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct Snapshot {
    #[key]
    duel_id: u128,
    //-------------------------
    score_a: Score,
    score_b: Score,
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
#[derive(Copy, Drop, Serde, IntrospectPacked)]
struct Shot {
    // player input
    salt: felt252,      // the player's secret salt
    hash: u128,         // hashed moves (salt + moves)
    card_1: u8,         // card choice
    card_2: u8,         // card choice
    card_3: u8,         // card choice
    card_4: u8,         // card choice
    // initial state
    initial_health: u8,     // CONST::FULL_HEALTH
    initial_damage: u8,     // CONST::INITIAL_CHANCE
    initial_chances: u8,    // 0-100
    // final states
    final_health: u8,
    final_damage: u8,
    final_chances: u8,
    // results
    dice_crit: u8,      // 0-100
    honour: u8,         // honour granted
    wager: u8,          // won the wager?
    win: u8,            // won the round?
} // [f] + [128 + 112(14*8)]:240



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
    fn make_seed(ref self: Round) -> felt252 {
        (hash_values([self.shot_a.salt, self.shot_b.salt].span()))
    }
}

#[generate_trait]
impl ShotImpl of ShotTrait {
    fn initialize(ref self: Shot, salt: felt252, moves: Span<u8>) {
        self.salt = salt;
        self.card_1 = moves.value_or_zero(0);
        self.card_2 = moves.value_or_zero(1);
        self.card_3 = moves.value_or_zero(2);
        self.card_4 = moves.value_or_zero(3);
        self.initial_health = CONST::FULL_HEALTH;
        self.initial_damage = CONST::INITIAL_DAMAGE;
        self.initial_chances = CONST::INITIAL_CHANCE;
        self.final_health = self.initial_health;
        self.final_damage = self.initial_damage;
        self.final_chances = self.initial_chances;
    }
    fn as_hand(self: @Shot) -> PlayerHand {
        (PlayerHand {
            card_paces: (*self.card_1).into(),
            card_dodge: (*self.card_2).into(),
            card_tactics: (*self.card_3).into(),
            card_blades: (*self.card_4).into(),
        })
    }
}
