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
    hash: u128,         // hashed moves (salt + moves)
    salt: felt252,      // the player's secret salt
    card_1: u8,         // card choice
    card_2: u8,         // card choice
    card_3: u8,         // card choice
    card_4: u8,         // card choice
    // shot results
    chance_crit: u8,    // computed chances (1..100) - execution
    chance_hit: u8,     // computed chances (1..100) - hit / normal damage
    chance_lethal: u8,  // computed chances (1..100) - hit / double damage
    dice_crit: u8,      // dice roll result (1..100) - execution
    dice_hit: u8,       // dice roll result (1..100) - hit / normal damage
    damage: u8,         // amount of health taken
    block: u8,          // amount of damage blocked
    win: u8,            // wins the round
    wager: u8,          // wins the wager
    // player state
    health: u8,         // final health
    honour: u8,         // honour granted
} // 232 bits



//------------------------------------
// Traits
//
use pistols::types::action::{Action, ActionTrait};
use pistols::utils::math::{MathU8};

#[derive(Copy, Drop)]
struct PlayerHand {
    action_1: Action,
    action_2: Action,
    action_3: Action,
    action_4: Action,
}

#[generate_trait]
impl ShotImpl of ShotTrait {
    fn as_hand(self: @Shot) -> PlayerHand {
        (PlayerHand {
            action_1: (*self.card_1).into(),
            action_2: (*self.card_2).into(),
            action_3: (*self.card_3).into(),
            action_4: (*self.card_4).into(),
        })
    }
    fn apply_honour(ref self: Shot, action: Action) {
        let action_honour: i8 = action.honour();
        if (action_honour >= 0) {
            self.honour = MathU8::abs(action_honour);
        }
    }
}
