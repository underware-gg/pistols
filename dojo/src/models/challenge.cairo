use starknet::ContractAddress;
use pistols::models::duelist::{Score};
use pistols::types::challenge_state::{ChallengeState, ChallengeStateTrait};
use pistols::types::round_state::{RoundState, RoundStateTrait};
use pistols::types::cards::paces::{PacesCard, PacesCardTrait};

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
    card_1: u8,         // card choice
    card_2: u8,         // card choice
    card_3: u8,         // card choice
    card_4: u8,         // card choice
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
        self.card_1 = moves.value_or_zero(0);
        self.card_2 = moves.value_or_zero(1);
        self.card_3 = moves.value_or_zero(2);
        self.card_4 = moves.value_or_zero(3);
        let paces_shoot: PacesCard = self.card_1.into();
        self.state_start.initialize(paces_shoot);
        self.state_final.initialize(paces_shoot);
    }
    fn as_hand(self: @Shot) -> PlayerHand {
        (PlayerHand {
            card_fire: (*self.card_1).into(),
            card_dodge: (*self.card_2).into(),
            card_tactics: (*self.card_3).into(),
            card_blades: (*self.card_4).into(),
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
